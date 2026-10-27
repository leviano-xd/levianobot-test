const UPLOADER_URL = 'https://levianoxd.orionbey76.workers.dev';

module.exports = {
    name: 'url',
    description: 'Gives the public file uploader link',
    commands: ['url', 'upload'],

    async run({ socket, m, config }) {
        await socket.sendMessage(
            m.chat,
            {
                text:
                    `🔗 *Public File Uploader*\n\n` +
                    `File upload cheythu public link undaakkaan ee link use cheyyuka:\n${UPLOADER_URL}\n\n` +
                    `> *${config.BOT_FOOTER}*`
            },
            { quoted: m }
        );
    }
};
