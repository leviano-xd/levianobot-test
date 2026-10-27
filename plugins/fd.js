const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const CHANNEL_LINK_RE = /whatsapp\.com\/channel\/([A-Za-z0-9_-]+)/i;
const MEDIA_TYPES = {
    audioMessage: 'audio',
    videoMessage: 'video',
    imageMessage: 'image',
    documentMessage: 'document'
};

const userPart = (jid) => String(jid || '').split('@')[0].split(':')[0];

async function resolveChannelJid(socket, input) {
    if (/^\d+@newsletter$/.test(input)) return input;
    if (/^\d+$/.test(input)) return `${input}@newsletter`;

    const link = input.match(CHANNEL_LINK_RE);
    if (link) {
        const info = await socket.newsletterMetadata('invite', link[1]);
        return info.id;
    }
    return null;
}

async function downloadMedia(quoted, kind) {
    const stream = await downloadContentFromMessage(quoted.msg, kind);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
}

function getQuotedText(quoted) {
    if (quoted.type === 'conversation') return quoted.msg;
    if (quoted.type === 'extendedTextMessage') return quoted.msg?.text;
    return null;
}

module.exports = {
    name: 'fd',
    description: 'Forwards a replied message (text, audio, video, image) to a WhatsApp channel',
    commands: ['fd'],

    async run({ socket, m, args, config }) {
        if (!m.fromMe && userPart(m.sender) !== userPart(config.OWNER_NUMBER)) return;

        const reply = (text) =>
            socket.sendMessage(m.chat, { text: `${text}\n\n> *${config.BOT_FOOTER}*` }, { quoted: m });

        const quoted = m.quoted || null;
        const input = (args[0] || '').trim();

        if (!input) {
            return reply(
                `📢 *Forward to Channel*\n\n` +
                `1. Reply to the message you want to forward\n` +
                `2. In the reply, type *.fd <channel-jid>*\n\n` +
                `Example: *.fd 120363xxxxxxxx@newsletter*`
            );
        }

        if (!quoted) {
            return reply('❌ Please reply to a message with this command.');
        }

        let jid;
        try {
            jid = await resolveChannelJid(socket, input);
        } catch (err) {
            console.error('fd: channel lookup failed:', err.message);
            return reply('❌ Could not find the channel. Please check the JID or link.');
        }
        if (!jid) {
            return reply('❌ Invalid channel JID. Format: *120363xxxxxxxx@newsletter*');
        }

        try {
            let content;
            const kind = MEDIA_TYPES[quoted.type];
            const caption = quoted.msg?.caption || '';

            if (kind === 'audio') {
                const audio = await downloadMedia(quoted, 'audio');
                content = { audio, mimetype: quoted.msg.mimetype || 'audio/mpeg', ptt: true };
            } else if (kind === 'video') {
                const video = await downloadMedia(quoted, 'video');
                content = { video, caption, mimetype: quoted.msg.mimetype || 'video/mp4' };
            } else if (kind === 'image') {
                const image = await downloadMedia(quoted, 'image');
                content = { image, caption };
            } else if (kind === 'document') {
                const document = await downloadMedia(quoted, 'document');
                content = {
                    document,
                    mimetype: quoted.msg.mimetype || 'application/octet-stream',
                    fileName: quoted.msg.fileName || 'file'
                };
            } else {
                const text = getQuotedText(quoted);
                if (!text) {
                    return reply('❌ This message type cannot be forwarded.');
                }
                content = { text };
            }

            const sent = await socket.sendMessage(jid, content);
            console.log(`fd: sent ${kind || 'text'} to ${jid}, id: ${sent?.key?.id}`);

            return reply(`✅ Sent to channel: *${jid}*\n🆔 Message ID: ${sent?.key?.id || 'none'}`);
        } catch (err) {
            console.error('fd: failed to send to channel:', err);
            return reply(`❌ Failed to send to channel: ${err.message}`);
        }
    }
};
