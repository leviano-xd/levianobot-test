
const fs = require('fs');
const path = require('path');
const { sms } = require('./msg');

/*
 * Loads every .js file in the plugins folder.
 * A plugin must export:
 *   { name, description, commands: ['ping'], async run({ socket, m, args, number, prefix }) {} }
 */
function loadPlugins(dir) {
    const plugins = [];
    if (!fs.existsSync(dir)) {
        console.warn(`Plugins folder not found: ${dir}`);
        return plugins;
    }

    for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith('.js')) continue;
        try {
            const plugin = require(path.join(dir, file));
            if (!Array.isArray(plugin.commands) || typeof plugin.run !== 'function') {
                console.warn(`Skipped plugin ${file}: missing commands or run()`);
                continue;
            }
            plugins.push(plugin);
        } catch (err) {
            console.error(`Failed to load plugin ${file}:`, err.message);
        }
    }

    console.log(`🔌 Loaded ${plugins.length} plugin(s): ${plugins.map((p) => p.name || '?').join(', ')}`);
    return plugins;
}

// Listens for incoming messages and runs the matching plugin command
function registerCommands(socket, plugins, prefix, number) {
    socket.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            try {
                if (!msg.message || msg.key.remoteJid === 'status@broadcast') continue;

                const m = sms(socket, msg);
                const body = (m.body || '').trim();
                if (!body.startsWith(prefix)) continue;

                const [rawCmd, ...args] = body.slice(prefix.length).split(/\s+/);
                const cmd = (rawCmd || '').toLowerCase();

                const plugin = plugins.find((p) => p.commands.includes(cmd));
                if (!plugin) continue;

                await plugin.run({ socket, m, args, number, prefix });
            } catch (err) {
                console.error(`Command error for ${number}:`, err.message);
            }
        }
    });
}

module.exports = { loadPlugins, registerCommands };
