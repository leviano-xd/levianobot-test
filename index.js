require('dotenv').config();
const express = require('express');
const path = require('path');
const { connectDB } = require('./lib/db');

const app = express();
const PORT = process.env.PORT || 8000;
const ROOT = process.cwd();

require('events').EventEmitter.defaultMaxListeners = 500;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function start() {
    // MongoDB must be ready before the bot routes and auto-reconnect run
    await connectDB();

    const codeRouter = require('./pair');
    app.use('/code', codeRouter);

    app.get(['/', '/pair'], (req, res) => {
        res.sendFile(path.join(ROOT, 'public', 'main.html'));
    });

    app.listen(PORT, () => {
        console.log(`\nServer running on http://localhost:${PORT}`);
    });

    codeRouter.autoReconnect();
}

start().catch((err) => {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
});

module.exports = app;
