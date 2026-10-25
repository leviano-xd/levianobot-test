const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const pino = require('pino');
const moment = require('moment-timezone');
const crypto = require('crypto');
const db = require('./lib/db');
const { loadPlugins, registerCommands } = require('./lib/commands');

const plugins = loadPlugins(path.join(__dirname, 'plugins'));
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    jidNormalizedUser
} = require('@whiskeysockets/baileys');

const router = express.Router();

const config = {
    BOT_NAME: 'YOUET-BOT-NAME',
    BOT_FOOTER: 'YOUET-BOT-FOOTER',
    PREFIX: '.',
    MAX_RETRIES: 3,
    GROUP_INVITE_LINK: 'https://chat.whatsapp.com/xxxxxxx',
    RCD_IMAGE_PATH: process.env.RCD_IMAGE_PATH || 'https://your-real-image-link.png',
    OTP_EXPIRY: 300000,
    OWNER_NUMBER: 'YOUR-NUMBER'
};

const PM2_NAME = process.env.PM2_NAME || 'leviano-bot';
const activeSockets = new Map();
const socketCreationTime = new Map();
const SESSION_BASE_PATH = './session';
const otpStore = new Map();

fs.ensureDirSync(SESSION_BASE_PATH);

const sanitize = (number) => String(number).replace(/[^0-9]/g, '');

function formatMessage(title, content, footer) {
    return `*${title}*\n\n${content}\n\n> *${footer}*`;
}

// Sends an image with caption. If the image fails to load, sends plain text instead
async function sendWithImage(socket, jid, caption) {
    try {
        return await socket.sendMessage(jid, {
            image: { url: config.RCD_IMAGE_PATH },
            caption
        });
    } catch (err) {
        console.warn('Image send failed, sending text instead:', err.message);
        return await socket.sendMessage(jid, { text: caption });
    }
}

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function getSriLankaTimestamp() {
    return moment().tz('Asia/Colombo').format('YYYY-MM-DD HH:mm:ss');
}

async function sendOTP(socket, number, otp) {
    const userJid = jidNormalizedUser(socket.user.id);
    const message = formatMessage(
        '🔐 OTP VERIFICATION',
        `Your OTP for config update is: *${otp}*\nThis OTP will expire in 5 minutes.`,
        config.BOT_FOOTER
    );

    try {
        await socket.sendMessage(userJid, { text: message });
        console.log(`OTP sent to ${number}`);
    } catch (error) {
        console.error(`Failed to send OTP to ${number}:`, error);
        throw error;
    }
}

function handleMessageRevocation(socket, number) {
    socket.ev.on('messages.delete', async ({ keys }) => {
        if (!keys || keys.length === 0) return;

        const messageKey = keys[0];
        const userJid = jidNormalizedUser(socket.user.id);
        const deletionTime = getSriLankaTimestamp();

        const message = formatMessage(
            '🗑️ MESSAGE DELETED',
            `A message was deleted from your chat.\n📋 From: ${messageKey.remoteJid}\n🍁 Deletion Time: ${deletionTime}`,
            config.BOT_FOOTER
        );

        try {
            await sendWithImage(socket, userJid, message);
            console.log(`Notified ${number} about message deletion: ${messageKey.id}`);
        } catch (error) {
            console.error('Failed to send deletion notification:', error);
        }
    });
}

const createSerial = (size) => crypto.randomBytes(size).toString('hex').slice(0, size);

async function loadUserConfig(number) {
    try {
        const saved = await db.getConfig(sanitize(number));
        return saved || { ...config };
    } catch (error) {
        console.warn(`Could not load config for ${number}, using default config`);
        return { ...config };
    }
}

async function updateUserConfig(number, newConfig) {
    try {
        await db.saveConfig(sanitize(number), newConfig);
        console.log(`Updated config for ${sanitize(number)}`);
    } catch (error) {
        console.error('Failed to update config:', error);
        throw error;
    }
}

// Removes everything about one number: local folder, MongoDB document, live socket
async function fullDeleteSession(number) {
    const sanitizedNumber = sanitize(number);
    try {
        const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);
        if (fs.existsSync(sessionPath)) {
            fs.removeSync(sessionPath);
            console.log(`🗑️ Deleted local session folder for ${sanitizedNumber}`);
        }

        await db.deleteBot(sanitizedNumber);
        console.log(`🗑️ Deleted MongoDB record for ${sanitizedNumber}`);

        const socket = activeSockets.get(sanitizedNumber);
        if (socket) {
            try {
                socket.ws.close();
            } catch (e) {
                console.warn(`⚠️ Socket close error for ${sanitizedNumber}:`, e.message);
            }
        }
        activeSockets.delete(sanitizedNumber);
        socketCreationTime.delete(sanitizedNumber);
    } catch (err) {
        console.error(`❌ Failed to fully delete session for ${sanitizedNumber}:`, err.message);
    }
}

function setupAutoRestart(socket, number) {
    socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        const sanitizedNumber = sanitize(number);

        if (connection !== 'close') return;

        const statusCode = lastDisconnect?.error?.output?.statusCode;

        if (statusCode === 401) {
            // 401 = the user logged out from WhatsApp
            console.log(`User ${sanitizedNumber} logged out. Deleting session...`);
            await fullDeleteSession(sanitizedNumber);
            console.log(`Session cleanup completed for ${sanitizedNumber}`);
            return;
        }

        console.log(`Connection lost for ${sanitizedNumber}, attempting to reconnect...`);
        await delay(10000);
        activeSockets.delete(sanitizedNumber);
        socketCreationTime.delete(sanitizedNumber);

        try {
            await connectNumber(sanitizedNumber);
        } catch (err) {
            console.error(`Reconnect failed for ${sanitizedNumber}:`, err.message);
        }
    });
}

async function EmpirePair(number, res) {
    const sanitizedNumber = sanitize(number);
    const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);

    // Restore saved login (creds) from MongoDB into the local session folder
    const restoredCreds = await db.getCreds(sanitizedNumber);
    if (restoredCreds) {
        fs.ensureDirSync(sessionPath);
        fs.writeFileSync(path.join(sessionPath, 'creds.json'), JSON.stringify(restoredCreds, null, 2));
        console.log(`Successfully restored session for ${sanitizedNumber}`);
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'fatal' : 'debug' });

    try {
        const socket = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
            printQRInTerminal: false,
            logger,
            browser: Browsers.macOS('Safari')
        });

        socketCreationTime.set(sanitizedNumber, Date.now());

        setupAutoRestart(socket, sanitizedNumber);
        handleMessageRevocation(socket, sanitizedNumber);
        registerCommands(socket, plugins, config.PREFIX, sanitizedNumber);

        if (!socket.authState.creds.registered) {
            let code;
            for (let attempt = 1; attempt <= config.MAX_RETRIES; attempt++) {
                try {
                    await delay(1500);
                    code = await socket.requestPairingCode(sanitizedNumber);
                    break;
                } catch (error) {
                    console.warn(`Pairing code attempt ${attempt}/${config.MAX_RETRIES} failed:`, error.message);
                    await delay(2000 * attempt);
                }
            }
            if (!res.headersSent) {
                res.send({ code });
            }
        }

        socket.ev.on('creds.update', async () => {
            try {
                await saveCreds();
                const fileContent = await fs.readFile(path.join(sessionPath, 'creds.json'), 'utf8');
                // Save login creds to MongoDB
                await db.saveCreds(sanitizedNumber, JSON.parse(fileContent));
                console.log(`Updated creds for ${sanitizedNumber} in MongoDB`);
            } catch (error) {
                console.error(`Failed to save creds for ${sanitizedNumber}:`, error.message);
            }
        });

        socket.ev.on('connection.update', async (update) => {
            if (update.connection !== 'open') return;
            try {
                await delay(3000);
                const userJid = jidNormalizedUser(socket.user.id);

                // Make sure this number has a config document in MongoDB
                const savedConfig = await db.getConfig(sanitizedNumber);
                if (!savedConfig) {
                    await updateUserConfig(sanitizedNumber, config);
                }

                activeSockets.set(sanitizedNumber, socket);

                await sendWithImage(
                    socket,
                    userJid,
                    formatMessage(
                        config.BOT_NAME,
                        `✅ Successfully connected!\n\n🔢 Number: ${sanitizedNumber}\n`,
                        config.BOT_FOOTER
                    )
                );
            } catch (error) {
                console.error('Connection error:', error);
            }
        });
    } catch (error) {
        console.error('Pairing error:', error);
        socketCreationTime.delete(sanitizedNumber);
        if (!res.headersSent) {
            res.status(503).send({ error: 'Service Unavailable' });
        }
    }
}

// Helper used by reconnect routes and auto-reconnect (no HTTP response needed)
async function connectNumber(number) {
    const mockRes = { headersSent: false, send: () => {}, status: () => mockRes };
    await EmpirePair(number, mockRes);
}

router.get('/', async (req, res) => {
    const { number } = req.query;
    if (!number) {
        return res.status(400).send({ error: 'Number parameter is required' });
    }

    if (activeSockets.has(sanitize(number))) {
        return res.status(200).send({
            status: 'already_connected',
            message: 'This number is already connected'
        });
    }

    try {
        await EmpirePair(number, res);
    } catch (error) {
        console.error('Pair route error:', error);
        if (!res.headersSent) res.status(500).send({ error: 'Failed to start pairing' });
    }
});

router.get('/active', (req, res) => {
    res.status(200).send({
        count: activeSockets.size,
        numbers: Array.from(activeSockets.keys())
    });
});

router.get('/ping', (req, res) => {
    res.status(200).send({
        status: 'active',
        message: `👻 ${config.BOT_NAME} is running`,
        activesession: activeSockets.size
    });
});

router.get('/botinfo', (req, res) => {
    try {
        const bots = Array.from(activeSockets.entries()).map(([number, socket]) => {
            const startTime = socketCreationTime.get(number) || Date.now();
            const uptime = Math.floor((Date.now() - startTime) / 1000);
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);

            return {
                number,
                status: socket.ws && socket.ws.readyState === 1 ? 'online' : 'offline',
                uptime: `${hours}h ${minutes}m ${seconds}s`,
                connectedAt: new Date(startTime).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })
            };
        });

        res.json({ count: bots.length, bots });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get bot info', details: err.message });
    }
});

// Connect every number saved in MongoDB
async function reconnectAllFromDB(res) {
    const numbers = await db.listNumbers();
    if (numbers.length === 0) {
        return res.status(404).send({ error: 'No numbers found to connect' });
    }

    const results = [];
    for (const number of numbers) {
        if (activeSockets.has(number)) {
            results.push({ number, status: 'already_connected' });
            continue;
        }
        try {
            await connectNumber(number);
            results.push({ number, status: 'connection_initiated' });
        } catch (error) {
            results.push({ number, status: 'failed', error: error.message });
        }
        await delay(1000);
    }

    res.status(200).send({ status: 'success', connections: results });
}

router.get('/connect-all', async (req, res) => {
    try {
        await reconnectAllFromDB(res);
    } catch (error) {
        console.error('Connect all error:', error);
        res.status(500).send({ error: 'Failed to connect all bots' });
    }
});

router.get('/reconnect', async (req, res) => {
    try {
        await reconnectAllFromDB(res);
    } catch (error) {
        console.error('Reconnect error:', error);
        res.status(500).send({ error: 'Failed to reconnect bots' });
    }
});

router.get('/update-config', async (req, res) => {
    const { number, config: configString } = req.query;
    if (!number || !configString) {
        return res.status(400).send({ error: 'Number and config are required' });
    }

    let newConfig;
    try {
        newConfig = JSON.parse(configString);
    } catch (error) {
        return res.status(400).send({ error: 'Invalid config format' });
    }

    const sanitizedNumber = sanitize(number);
    const socket = activeSockets.get(sanitizedNumber);
    if (!socket) {
        return res.status(404).send({ error: 'No active session found for this number' });
    }

    const otp = generateOTP();
    otpStore.set(sanitizedNumber, { otp, expiry: Date.now() + config.OTP_EXPIRY, newConfig });

    try {
        await sendOTP(socket, sanitizedNumber, otp);
        res.status(200).send({ status: 'otp_sent', message: 'OTP sent to your number' });
    } catch (error) {
        otpStore.delete(sanitizedNumber);
        res.status(500).send({ error: 'Failed to send OTP' });
    }
});

router.get('/verify-otp', async (req, res) => {
    const { number, otp } = req.query;
    if (!number || !otp) {
        return res.status(400).send({ error: 'Number and OTP are required' });
    }

    const sanitizedNumber = sanitize(number);
    const storedData = otpStore.get(sanitizedNumber);
    if (!storedData) {
        return res.status(400).send({ error: 'No OTP request found for this number' });
    }

    if (Date.now() >= storedData.expiry) {
        otpStore.delete(sanitizedNumber);
        return res.status(400).send({ error: 'OTP has expired' });
    }

    if (storedData.otp !== otp) {
        return res.status(400).send({ error: 'Invalid OTP' });
    }

    try {
        await updateUserConfig(sanitizedNumber, storedData.newConfig);
        otpStore.delete(sanitizedNumber);

        const socket = activeSockets.get(sanitizedNumber);
        if (socket) {
            await sendWithImage(
                socket,
                jidNormalizedUser(socket.user.id),
                formatMessage(
                    '📌 CONFIG UPDATED',
                    'Your configuration has been successfully updated!',
                    config.BOT_FOOTER
                )
            );
        }
        res.status(200).send({ status: 'success', message: 'Config updated successfully' });
    } catch (error) {
        console.error('Failed to update config:', error);
        res.status(500).send({ error: 'Failed to update config' });
    }
});

router.get('/getabout', async (req, res) => {
    const { number, target } = req.query;
    if (!number || !target) {
        return res.status(400).send({ error: 'Number and target number are required' });
    }

    const sanitizedNumber = sanitize(number);
    const socket = activeSockets.get(sanitizedNumber);
    if (!socket) {
        return res.status(404).send({ error: 'No active session found for this number' });
    }

    const targetJid = `${sanitize(target)}@s.whatsapp.net`;
    try {
        const statusData = await socket.fetchStatus(targetJid);
        const aboutStatus = statusData.status || 'No status available';
        const setAt = statusData.setAt
            ? moment(statusData.setAt).tz('Asia/Colombo').format('YYYY-MM-DD HH:mm:ss')
            : 'Unknown';
        res.status(200).send({ status: 'success', number: target, about: aboutStatus, setAt });
    } catch (error) {
        console.error(`Failed to fetch status for ${target}:`, error);
        res.status(500).send({
            status: 'error',
            message: `Failed to fetch About status for ${target}. The number may not exist or the status is not accessible.`
        });
    }
});

// Cleanup
process.on('exit', () => {
    activeSockets.forEach((socket, number) => {
        try { socket.ws.close(); } catch (e) {}
        activeSockets.delete(number);
        socketCreationTime.delete(number);
    });
    fs.emptyDirSync(SESSION_BASE_PATH);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    exec(`pm2 restart ${PM2_NAME}`);
});

// Called from index.js AFTER the MongoDB connection is ready
async function autoReconnect() {
    try {
        const numbers = await db.listNumbers();
        for (const number of numbers) {
            if (!activeSockets.has(number)) {
                await connectNumber(number);
                console.log(`🔁 Reconnected from MongoDB: ${number}`);
                await delay(1000);
            }
        }
    } catch (error) {
        console.error('❌ autoReconnect error:', error.message);
    }
}

router.autoReconnect = autoReconnect;

module.exports = router;
