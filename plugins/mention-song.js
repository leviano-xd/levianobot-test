const fs = require('fs');
const path = require('path');

// Song source priority: assets/song.mp3 > SONG_URL env > default URL below
const SONG_FILE = path.join(__dirname, '..', 'assets', 'song.mp3');
const DEFAULT_SONG_URL = 'https://xenocdn.xenocdn.workers.dev/696954c0.mpeg';
const COOLDOWN_MS = 60 * 1000; // same person can trigger once per minute
const lastSent = new Map();

function loadSong() {
    if (fs.existsSync(SONG_FILE)) {
        return { audio: fs.readFileSync(SONG_FILE) };
    }
    const url = process.env.SONG_URL || DEFAULT_SONG_URL;
    return { audio: { url } };
}

const userPart = (jid) => String(jid || '').split('@')[0].split(':')[0];

module.exports = {
    name: 'mention-song',
    description: 'Sends a song as voice note when someone mentions the bot number',
    commands: [],

    async onMessage({ socket, m, number }) {
        if (m.fromMe) return;

        const mentioned = m.msg?.contextInfo?.mentionedJid || [];
        const ownerIds = [number, userPart(socket.user?.lid)].filter(Boolean);
        const isMentioned = mentioned.some((jid) => ownerIds.includes(userPart(jid)));
        if (!isMentioned) return;

        const now = Date.now();
        const last = lastSent.get(m.sender) || 0;
        if (now - last < COOLDOWN_MS) return;

        lastSent.set(m.sender, now);

        await socket.sendMessage(
            m.chat,
            { text: '🎵 You mentioned me, so here is a song for you!' },
            { quoted: m }
        );

        await socket.sendMessage(
            m.chat,
            { ...loadSong(), mimetype: 'audio/mpeg', ptt: true },
            { quoted: m }
        );
    }
};
