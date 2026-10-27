module.exports = {
    name: 'ping',
    description: 'Checks bot speed with an animated loader',
    commands: ['ping'],

    async run({ socket, m }) {
        const start = Date.now();

        const loading = await socket.sendMessage(
            m.chat,
            { text: '*𝗧𝗘𝗦𝗧𝗜𝗡𝗚 𝗟𝗘𝗩𝗜𝗔𝗡𝗢 𝗕𝗢𝗧*' },
            { quoted: m }
        );

        const stages = ['*○○○○', '**○○○', '***○○', '****○', '*****'];
        for (const stage of stages) {
            await socket.sendMessage(m.chat, { text: stage, edit: loading.key });
            await new Promise((r) => setTimeout(r, 250));
        }

        const ping = Date.now() - start;

        await socket.sendMessage(m.chat, {
            text: `📌𝙿𝚒𝚗𝚐 ${ping}`,
            edit: loading.key
        });
    }
};
