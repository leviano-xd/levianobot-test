module.exports = {
    name: 'menu',
    description: 'Shows all available commands',
    commands: ['menu', 'help'],

    async run({ m, plugins, config, prefix }) {
        const lines = plugins
            .filter((p) => Array.isArray(p.commands) && p.commands.length > 0)
            .map((p) => {
                const desc = p.description ? ` - ${p.description}` : '';
                return `▸ *${prefix}${p.commands[0]}*${desc}`;
            });

        const text =
            `*📜 ${config.BOT_NAME} MENU*\n\n` +
            (lines.length ? lines.join('\n') : 'No commands available.') +
            `\n\n> *${config.BOT_FOOTER}*`;

        await m.reply(text);
    }
};
