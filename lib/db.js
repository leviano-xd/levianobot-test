const { MongoClient } = require('mongodb');

/*
 * MongoDB storage layer.
 * One document per WhatsApp number in the `bots` collection:
 *   { number, creds, config, createdAt, updatedAt }
 * The connection string is read from the MONGODB_URI env variable (.env file).
 */

let client = null;
let bots = null;

const cleanNumber = (number) => String(number).replace(/[^0-9]/g, '');

async function connectDB() {
    if (bots) return bots;

    const uri = process.env.MONGODB_URI;
    if (!uri || uri.includes('<')) {
        throw new Error('MONGODB_URI is not set. Add your MongoDB connection string to the .env file.');
    }

    client = new MongoClient(uri);
    await client.connect();

    const db = client.db(process.env.MONGODB_DB || 'leviano_bot');
    bots = db.collection('bots');
    await bots.createIndex({ number: 1 }, { unique: true });

    console.log('✅ Connected to MongoDB');
    return bots;
}

function col() {
    if (!bots) throw new Error('Database not connected. Call connectDB() first.');
    return bots;
}

async function getCreds(number) {
    const doc = await col().findOne({ number: cleanNumber(number) }, { projection: { creds: 1 } });
    return doc?.creds ?? null;
}

async function saveCreds(number, creds) {
    const now = new Date();
    await col().updateOne(
        { number: cleanNumber(number) },
        { $set: { creds, updatedAt: now }, $setOnInsert: { createdAt: now } },
        { upsert: true }
    );
}

async function getConfig(number) {
    const doc = await col().findOne({ number: cleanNumber(number) }, { projection: { config: 1 } });
    return doc?.config ?? null;
}

async function saveConfig(number, config) {
    const now = new Date();
    await col().updateOne(
        { number: cleanNumber(number) },
        { $set: { config, updatedAt: now }, $setOnInsert: { createdAt: now } },
        { upsert: true }
    );
}

// Numbers that have a saved login session (i.e. were paired at least once)
async function listNumbers() {
    const docs = await col()
        .find({ creds: { $ne: null } }, { projection: { number: 1, _id: 0 } })
        .toArray();
    return docs.map((d) => d.number);
}

async function deleteBot(number) {
    await col().deleteOne({ number: cleanNumber(number) });
}

async function closeDB() {
    if (client) await client.close();
    client = null;
    bots = null;
}

module.exports = {
    connectDB,
    closeDB,
    getCreds,
    saveCreds,
    getConfig,
    saveConfig,
    listNumbers,
    deleteBot
};
