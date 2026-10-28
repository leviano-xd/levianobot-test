// =========================================================================
// ⚡ ADVANCE SINGLE-CASE MENU COMMAND (plugin version)
// 📌 Features:
//    1. Handles ".menu" prefix command
//    2. Detects quoted replies tagged to the menu message
//    3. Routes numbers 1, 2, 3, 4, 5 to their Sub-Menus
//    4. Handles "0" to go back to the Main Menu
//    5. Handles invalid options gracefully
// =========================================================================

const BOT_TITLE = 'LEVIANO BOT';
const MENU_MARKERS = ['REPLY THIS MESSAGE WITH A NUMBER', 'SELECT A SUB-MENU', BOT_TITLE];

const MAIN_MENU_TEXT = `╭───〔 *${BOT_TITLE}* 〕───⊷
│ 👤 *User:* @sender
│ ⚙️ *Prefix:* [ . ]
│ ⏰ *Time:* 05:21 PM
│ ⚡ *Status:* Online & Active
╰────────────────────────⊷

╭───〔 🔢 *SELECT A SUB-MENU* 〕───⊷
│ 📌 *REPLY THIS MESSAGE WITH A NUMBER:*
│
│ ❮ *1* ❯ 📥 *Download Menu*
│ ❮ *2* ❯ 🤖 *AI & Search Menu*
│ ❮ *3* ❯ 👥 *Group Admin Menu*
│ ❮ *4* ❯ 🛠️ *Tools & Converters*
│ ❮ *5* ❯ 👑 *Owner & Settings Menu*
│
│ 💡 _Swipe right & reply with 1, 2, 3..._
╰────────────────────────⊷

> ⚡  > ʟᴇᴠɪᴀɴᴏ ʙᴏᴛ`;

const SUB_MENUS = {
    '1': {
        title: `${BOT_TITLE} - Download Menu`,
        body: 'Category: DOWNLOADERS',
        text: `╭───〔 *📥 DOWNLOAD MENU* 〕───⊷
│ 🤖 *Bot:* ${BOT_TITLE}
│ 📂 *Category:* DOWNLOADERS
│ 📝 *Info:* Download audio, video & media from social platforms
├───〔 📋 *COMMANDS LIST* 〕───⊷
│  ▫️ *.ytmp3* - _Download YouTube audio_
│  ▫️ *.ytmp4* - _Download YouTube video_
│  ▫️ *.tiktok* - _Download TikTok without watermark_
│  ▫️ *.fbdl* - _Download Facebook HD video_
│  ▫️ *.igdl* - _Download Instagram Reels/Photos_
│  ▫️ *.mediafire* - _Direct file downloader_
│
│ 🔙 *Reply "0" or type ".menu" to go back to Main Menu*
╰────────────────────────⊷`
    },
    '2': {
        title: `${BOT_TITLE} - AI & Search Menu`,
        body: 'Category: ARTIFICIAL INTELLIGENCE',
        text: `╭───〔 *🤖 AI & SEARCH MENU* 〕───⊷
│ 🤖 *Bot:* ${BOT_TITLE}
│ 📂 *Category:* ARTIFICIAL INTELLIGENCE
│ 📝 *Info:* Smart AI assistants, text & image generators
├───〔 📋 *COMMANDS LIST* 〕───⊷
│  ▫️ *.ai* - _Chat with Gemini 3.8 Flash AI_
│  ▫️ *.gpt4* - _Ask questions to ChatGPT_
│  ▫️ *.imagine* - _Generate AI photo from text_
│  ▫️ *.google* - _Search on Google search_
│  ▫️ *.wiki* - _Wikipedia summary lookup_
│
│ 🔙 *Reply "0" or type ".menu" to go back to Main Menu*
╰────────────────────────⊷`
    },
    '3': {
        title: `${BOT_TITLE} - Group Admin Menu`,
        body: 'Category: GROUP MANAGEMENT',
        text: `╭───〔 *👥 GROUP ADMIN MENU* 〕───⊷
│ 🤖 *Bot:* ${BOT_TITLE}
│ 📂 *Category:* GROUP MANAGEMENT
│ 📝 *Info:* Automated administrative commands for WhatsApp groups
├───〔 📋 *COMMANDS LIST* 〕───⊷
│  ▫️ *.tagall* - _Tag all group members with alert_
│  ▫️ *.kick* - _Remove user from the group_
│  ▫️ *.add* - _Add user using phone number_
│  ▫️ *.mute* - _Set group to only admins can send_
│  ▫️ *.unmute* - _Open group for all participants_
│  ▫️ *.hidetag* - _Invisible tag for announcements_
│
│ 🔙 *Reply "0" or type ".menu" to go back to Main Menu*
╰────────────────────────⊷`
    },
    '4': {
        title: `${BOT_TITLE} - Tools & Converters`,
        body: 'Category: UTILITIES & TOOLS',
        text: `╭───〔 *🛠️ TOOLS & CONVERTERS* 〕───⊷
│ 🤖 *Bot:* ${BOT_TITLE}
│ 📂 *Category:* UTILITIES & TOOLS
│ 📝 *Info:* Useful utility tools, stickers & format converters
├───〔 📋 *COMMANDS LIST* 〕───⊷
│  ▫️ *.sticker* - _Convert image/video to sticker (s)_
│  ▫️ *.toimg* - _Convert sticker back to image_
│  ▫️ *.qr* - _Generate QR code from text/link_
│  ▫️ *.tts* - _Convert text to voice speech audio_
│  ▫️ *.tinyurl* - _Shorten long web links_
│
│ 🔙 *Reply "0" or type ".menu" to go back to Main Menu*
╰────────────────────────⊷`
    },
    '5': {
        title: `${BOT_TITLE} - Owner & Settings Menu`,
        body: 'Category: OWNER & SYSTEM',
        text: `╭───〔 *👑 OWNER & SETTINGS MENU* 〕───⊷
│ 🤖 *Bot:* ${BOT_TITLE}
│ 📂 *Category:* OWNER & SYSTEM
│ 📝 *Info:* Bot owner exclusive control and configuration
├───〔 📋 *COMMANDS LIST* 〕───⊷
│  ▫️ *.restart* - _Restart the bot process_
│  ▫️ *.setprefix* - _Change bot trigger prefix_
│  ▫️ *.mode* - _Switch public or private mode_
│  ▫️ *.block* - _Block spammer from using bot_
│  ▫️ *.eval* - _Execute JavaScript code (owner only)_
│
│ 🔙 *Reply "0" or type ".menu" to go back to Main Menu*
╰────────────────────────⊷`
    }
};

function getQuotedText(m) {
    if (!m.quoted) return '';
    const q = m.quoted;
    if (typeof q.msg === 'string') return q.msg;
    return q.text || q.caption || q.msg?.text || q.msg?.caption || '';
}

function isMenuQuoted(m) {
    const text = getQuotedText(m);
    return Boolean(m.quoted) && MENU_MARKERS.some((marker) => text.includes(marker));
}

async function sendMainMenu(socket, m) {
    await socket.sendMessage(m.chat, {
        text: MAIN_MENU_TEXT,
        contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363399205146445@newsletter',
                newsletterName: `${BOT_TITLE} Official Updates`,
                serverMessageId: 1
            }
        }
    }, { quoted: m });
}

async function sendSubMenu(socket, m, choice) {
    const sub = SUB_MENUS[choice];
    await socket.sendMessage(m.chat, {
        text: sub.text,
        contextInfo: {
            mentionedJid: [m.sender],
            externalAdReply: {
                title: sub.title,
                body: sub.body,
                mediaType: 1,
                renderLargerThumbnail: false
            }
        }
    }, { quoted: m });
}

// Routes a numeric choice: 1-5 -> sub-menu, 0 -> main menu, anything else -> invalid
async function handleChoice(socket, m, choice) {
    if (SUB_MENUS[choice]) {
        return sendSubMenu(socket, m, choice);
    }
    if (choice === '0') {
        return sendMainMenu(socket, m);
    }
    await socket.sendMessage(m.chat, {
        text: `⚠️ *Invalid Menu Option!*\n\nPlease reply with a valid number from *1 to 5*.\nReply *0* or send *.menu* to view the full menu again.`
    }, { quoted: m });
}

module.exports = {
    name: 'menu',
    description: 'Shows the main menu and sub-menus',
    commands: ['menu'],

    // ".menu" or ".menu 1" typed directly
    async run({ socket, m, args }) {
        if (args[0] && /^[0-9]+$/.test(args[0])) {
            return handleChoice(socket, m, args[0]);
        }
        return sendMainMenu(socket, m);
    },

    // Plain "1", "2", "0"... replying to the menu message
    async onMessage({ socket, m }) {
        const text = (m.body || '').trim();
        if (!/^[0-9]+$/.test(text)) return;
        if (!isMenuQuoted(m)) return;
        return handleChoice(socket, m, text);
    }
};
