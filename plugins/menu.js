// =========================================================================
// ⚡ ADVANCE SINGLE-CASE MENU COMMAND (Node.js & @whiskeysockets/baileys)
// 📌 Features:
//    1. Handles ".menu" / "#menu" prefix commands
//    2. Detects quoted replies tagged to this menu message
//    3. Routes numbers 1, 2, 3, 4, 5 to their specific Sub-Menus in a SINGLE CASE
//    4. Handles "0" or back navigation
//    5. Handles invalid options gracefully
// =========================================================================

case 'menu': {
    // -------------------------------------------------------------
    // Step 1: Quoted Message & Tag Detection
    // -------------------------------------------------------------
    const isQuoted = Boolean(m.quoted);
    const quotedText = isQuoted ? (m.quoted.text || m.quoted.caption || '') : '';
    
    // Check if the user replied/tagged our Menu message:
    const isMenuQuoted = isQuoted && (
        quotedText.includes('REPLY THIS MESSAGE WITH A NUMBER') || 
        quotedText.includes('SELECT A SUB-MENU') ||
        quotedText.includes('SUPUN YT BOT')
    );

    // -------------------------------------------------------------
    // Step 2: Extract Sub-Menu Choice (1, 2, 3, 4, 5...)
    // Can be triggered by:
    //   a) Tagging/Replying to menu with "1" -> body.trim() === "1"
    //   b) Typing directly with argument -> ".menu 1" -> args[0] === "1"
    // -------------------------------------------------------------
    let choice = null;
    if (args[0] && /^[0-9]+$/.test(args[0])) {
        choice = args[0];
    } else if (isMenuQuoted && /^[0-9]+$/.test(body.trim())) {
        choice = body.trim();
    }

    // -------------------------------------------------------------
    // Step 3: Single Case Sub-Menu Router
    // -------------------------------------------------------------
    if (choice) {
        switch (choice) {
        case '1': {
            // [Sub-Menu 1] : Download Menu
            const subMenuText = `╭───〔 *📥 DOWNLOAD MENU* 〕───⊷
│ 🤖 *Bot:* LEVIANO BOT
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
╰────────────────────────⊷`;
            
            await sock.sendMessage(m.chat, { 
                text: subMenuText,
                contextInfo: {
                    mentionedJid: [m.sender],
                    externalAdReply: {
                        title: "LEVIANO BOT - Download Menu",
                        body: "Category: DOWNLOADERS",
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: m });
            return;
        }

        case '2': {
            // [Sub-Menu 2] : AI & Search Menu
            const subMenuText = `╭───〔 *🤖 AI & SEARCH MENU* 〕───⊷
│ 🤖 *Bot:* LEVIANO BOT
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
╰────────────────────────⊷`;
            
            await sock.sendMessage(m.chat, { 
                text: subMenuText,
                contextInfo: {
                    mentionedJid: [m.sender],
                    externalAdReply: {
                        title: "LEVIANO BOT - AI & Search Menu",
                        body: "Category: ARTIFICIAL INTELLIGENCE",
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: m });
            return;
        }

        case '3': {
            // [Sub-Menu 3] : Group Admin Menu
            const subMenuText = `╭───〔 *👥 GROUP ADMIN MENU* 〕───⊷
│ 🤖 *Bot:* LEVIANO BOT
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
╰────────────────────────⊷`;
            
            await sock.sendMessage(m.chat, { 
                text: subMenuText,
                contextInfo: {
                    mentionedJid: [m.sender],
                    externalAdReply: {
                        title: "LEVIANO BOT - Group Admin Menu",
                        body: "Category: GROUP MANAGEMENT",
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: m });
            return;
        }

        case '4': {
            // [Sub-Menu 4] : Tools & Converters
            const subMenuText = `╭───〔 *🛠️ TOOLS & CONVERTERS* 〕───⊷
│ 🤖 *Bot:* LEVIANO BOT
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
╰────────────────────────⊷`;
            
            await sock.sendMessage(m.chat, { 
                text: subMenuText,
                contextInfo: {
                    mentionedJid: [m.sender],
                    externalAdReply: {
                        title: "LEVIANO BOT - Tools & Converters",
                        body: "Category: UTILITIES & TOOLS",
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: m });
            return;
        }

        case '5': {
            // [Sub-Menu 5] : Owner & Settings Menu
            const subMenuText = `╭───〔 *👑 OWNER & SETTINGS MENU* 〕───⊷
│ 🤖 *Bot:* LEVIANO BOT
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
╰────────────────────────⊷`;
            
            await sock.sendMessage(m.chat, { 
                text: subMenuText,
                contextInfo: {
                    mentionedJid: [m.sender],
                    externalAdReply: {
                        title: "LEVIANO BOT - Owner & Settings Menu",
                        body: "Category: OWNER & SYSTEM",
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: m });
            return;
        }

        case '0': {
            // Replying 0 returns to Main Menu (Fallthrough to send main menu below)
            break;
        }

        default: {
            // User replied with a number outside 1 - 5
            await sock.sendMessage(m.chat, {
                text: `⚠️ *Invalid Menu Option!*\n\nPlease reply with a valid number from *1 to 5*.\nReply *0* or send *.menu* to view the full menu again.`
            }, { quoted: m });
            return;
        }
        }
    }

    // -------------------------------------------------------------
    // Step 4: Send the Main Menu (When someone types .menu or replies 0)
    // -------------------------------------------------------------
    const mainMenuText = `╭───〔 *LEVIANO BOT* 〕───⊷
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

> ⚡  > ɪᴛᴢ ᴍᴇ ᴍʀ.ꜱᴜᴘᴜɴ ꜰᴇʀɴᴀɴᴅᴏヤ`;

    await sock.sendMessage(m.chat, {
        text: mainMenuText,
        contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: "1203633992146445@newsletter",
                newsletterName: "LEVIANO BOT Official Updates",
                serverMessageId: 1
            }
        }
    }, { quoted: m });
}
break;
