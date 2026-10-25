module.exports = {
    name: 'ping',
    description: 'Checks if the bot is alive and how fast it replies',
    commands: ['ping'],

    async run({ m }) {
        const now = Date.now();
        const messageTime = Number(m.messageTimestamp) * 1000;
        const delay = messageTime ? Math.max(0, now - messageTime) : null;

        await m.reply(
            `🏓 *Pong!*\n\n⚡ Reply delay: ${delay !== null ? delay + ' ms' : 'unknown'}`
        );
    }
};
