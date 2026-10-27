const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const CHANNEL_LINK_RE = /whatsapp\.com\/channel\/([A-Za-z0-9_-]+)/i;

const userPart = (jid) => String(jid || '').split('@')[0].split(':')[0];

// Accepts a channel JID (120363xxxx@newsletter), a bare channel ID (120363xxxx),
// or a channel invite link (https://whatsapp.com/channel/xxxx)
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

// Downloads the audio from the replied-to message
async function downloadQuotedAudio(quoted) {
    const stream = await downloadContentFromMessage(quoted.msg, 'audio');
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    return { audio: buffer, mimetype: quoted.msg.mimetype || 'audio/mpeg' };
}

module.exports = {
    name: 'fd',
    description: 'Forwards a replied audio message to a WhatsApp channel as a voice note',
    commands: ['fd'],

    async run({ socket, m, args, config }) {
        // Only the bot itself or the owner can use this command
        if (!m.fromMe && userPart(m.sender) !== userPart(config.OWNER_NUMBER)) return;

        const reply = (text) =>
            socket.sendMessage(m.chat, { text: `${text}\n\n> *${config.BOT_FOOTER}*` }, { quoted: m });

        const quoted = m.quoted && m.quoted.type === 'audioMessage' ? m.quoted : null;
        const input = (args[0] || '').trim();

        if (!input) {
            return reply(
                `📢 *Forward to Channel*\n\n` +
                `1. Reply to the audio message you want to forward\n` +
                `2. In the reply, type *.fd <channel-jid>*\n\n` +
                `Example: *.fd 120363xxxxxxxx@newsletter*`
            );
        }

        if (!quoted) {
            return reply('❌ Please reply to an audio message with this command.');
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
            const song = await downloadQuotedAudio(quoted);
            await socket.sendMessage(jid, {
                audio: song.audio,
                mimetype: song.mimetype,
                ptt: true
            });
            console.log(`fd: forwarded audio to ${jid}`);
            return reply(`✅ Audio forwarded to channel: *${jid}*`);
        } catch (err) {
            console.error('fd: failed to send to channel:', err);
            return reply('❌ Failed to send the audio to the channel. Please check the logs.');
        }
    }
};
