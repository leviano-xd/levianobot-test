const fs = require('fs');
const path = require('path');

// Song source: assets/song.mp3 in the project, OR SONG_URL env variable
const SONG_FILE = path.join(__dirname, '..', 'assets', 'song.mp3');
const COOLDOWN_MS = 60 * 1000; // same person can trigger once per minute
const lastSent = new Map();

function loadSong() {
    if (fs.existsSync(SONG_FILE)) {
        return { audio: fs.readFileSync(SONG_FILE) };
    }
    if (process.env.SONG_URL) {
        return { audio: { url: process.env.SONG_URL } };
    }
    return null;
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

        const song = loadSong();
        if (!song) {
            console.warn('mention-song: no song found. Add assets/song.mp3 or set SONG_URL');
            return;
        }

        lastSent.set(m.sender, now);

        await socket.sendMessage(m.chat, { text: '🎵 Mention kandu, ithaa ningalkku oru song!' }, { quoted: m });
        await socket.sendMessage(
            m.chat,
            { ...song, mimetype: 'audio/mpeg', ptt: true },
            { quoted: m }
        );
    }
};
