const CHANNEL_LINK_RE = /whatsapp\.com\/channel\/([A-Za-z0-9_-]+)/i;

module.exports = {
    name: 'channeljid',
    description: 'Gets a WhatsApp channel JID from a channel link or a forwarded message',
    commands: ['channeljid', 'cjid'],

    async run({ socket, m, args, config }) {
        const reply = (text) =>
            socket.sendMessage(m.chat, { text: `${text}\n\n> *${config.BOT_FOOTER}*` }, { quoted: m });

        // 1) Channel message forwarded to the chat
        const fwd = m.msg?.contextInfo?.forwardedNewsletterMessageInfo;
        if (fwd?.newsletterJid) {
            return reply(
                `📢 *Channel JID*\n\n` +
                `🆔 ${fwd.newsletterJid}\n` +
                `📛 Name: ${fwd.newsletterName || 'Unknown'}`
            );
        }

        // 2) Channel invite link given with the command
        const link = args.join(' ').trim();
        const match = link.match(CHANNEL_LINK_RE);
        if (!match) {
            return reply(
                `📢 *Channel JID*\n\n` +
                `Use any one of these:\n` +
                `▸ *.channeljid https://whatsapp.com/channel/xxxxx*\n` +
                `▸ Channel-il ninnu oru message forward cheythu *.channeljid* ennu reply cheyyuka`
            );
        }

        try {
            const info = await socket.newsletterMetadata('invite', match[1]);
            return reply(
                `📢 *Channel JID*\n\n` +
                `🆔 ${info.id}\n` +
                `📛 Name: ${info.name || 'Unknown'}\n` +
                `👥 Subscribers: ${info.subscribers ?? 'Unknown'}`
            );
        } catch (err) {
            console.error('channeljid: lookup failed:', err.message);
            return reply('❌ Channel kandethaan pattiyilla. Link sheriyaano ennu nokkuka.');
        }
    }
};
