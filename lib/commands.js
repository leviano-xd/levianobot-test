const fs = require('fs');
const path = require('path');
const { sms } = require('./msg');

/*
 * Loads every .js file in the plugins folder.
 * A plugin can export:
 *   name, description
 *   commands: ['ping']                 -> runs on ".ping"
 *   async run(context) {}              -> the command handler
 *   async onMessage(context) {}        -> runs on EVERY message (mentions, auto-replies)
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
            const hasCommands = Array.isArray(plugin.commands);
            const hasHook = typeof plugin.onMessage === 'function';
            if (!hasCommands && !hasHook) {
                console.warn(`Skipped plugin ${file}: nothing to run`);
                continue;
            }
            if (hasCommands && plugin.commands.length && typeof plugin.run !== 'function') {
                console.warn(`Skipped plugin ${file}: commands defined but run() missing`);
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

// Listens for incoming messages, runs onMessage hooks, then runs matching commands
function registerCommands(socket, plugins, config, number) {
    const prefix = config.PREFIX;

    socket.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            try {
                if (!msg.message || msg.key.remoteJid === 'status@broadcast') continue;

                const m = sms(socket, msg);
                const ctx = { socket, m, args: [], number, prefix, plugins, config };

                // Hooks run for every message
                for (const plugin of plugins) {
                    if (typeof plugin.onMessage !== 'function') continue;
                    try {
                        await plugin.onMessage(ctx);
                    } catch (err) {
                        console.error(`onMessage error in ${plugin.name}:`, err.message);
                    }
                }

                // Commands run only for messages starting with the prefix
                const body = (m.body || '').trim();
                if (!body.startsWith(prefix)) continue;

                const [rawCmd, ...args] = body.slice(prefix.length).split(/\s+/);
                const cmd = (rawCmd || '').toLowerCase();

                const plugin = plugins.find((p) => Array.isArray(p.commands) && p.commands.includes(cmd));
                if (!plugin) continue;

                await plugin.run({ ...ctx, args });
            } catch (err) {
                console.error(`Message error for ${number}:`, err.message);
            }
        }
    });
}

module.exports = { loadPlugins, registerCommands };
