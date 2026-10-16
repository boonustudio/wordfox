'use strict';
/*
 * MongoDB persistence for parties. Live games run from server memory for speed;
 * every change is saved here a moment later so a restart (Render redeploys, free-plan sleep)
 * does not lose a game in progress. Without MONGODB_URI the server still works, in memory only.
 */
let col = null;
let client = null;

async function connect(uri, dbName) {
  if (!uri) { console.warn('[store] MONGODB_URI is not set: parties live in memory only and are lost on restart.'); return false; }
  const { MongoClient } = require('mongodb');
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000, maxPoolSize: 5 });
  await client.connect();
  const db = client.db(dbName || 'wordfox');
  col = db.collection('parties');
  // parties that nobody touched for a day are deleted by MongoDB itself
  await col.createIndex({ updatedAt: 1 }, { expireAfterSeconds: 86400 });
  console.log('[store] connected to MongoDB');
  return true;
}

function toDoc(P) {
  const copy = JSON.parse(JSON.stringify(P));
  copy.players.forEach((p) => { delete p.sid; });
  copy._id = P.code;
  copy.updatedAt = new Date();
  return copy;
}

async function save(P) {
  if (!col) return;
  try { await col.replaceOne({ _id: P.code }, toDoc(P), { upsert: true }); }
  catch (e) { console.error('[store] save failed:', e.message); }
}

async function remove(code) {
  if (!col) return;
  try { await col.deleteOne({ _id: code }); } catch (e) { console.error('[store] delete failed:', e.message); }
}

async function loadRecent(maxAgeMs) {
  if (!col) return [];
  try {
    const since = new Date(Date.now() - maxAgeMs);
    const docs = await col.find({ updatedAt: { $gte: since } }).toArray();
    return docs.map((d) => { delete d._id; delete d.updatedAt; return d; });
  } catch (e) { console.error('[store] load failed:', e.message); return []; }
}

async function close() { try { if (client) await client.close(); } catch (e) { /* ignore */ } }

module.exports = { connect, save, remove, loadRecent, close };
