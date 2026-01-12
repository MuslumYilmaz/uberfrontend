const mongoose = require('mongoose');

const CACHE_KEY = '__fa_mongoose_cache__';

function getCache() {
  const g = globalThis;
  if (!g[CACHE_KEY]) {
    g[CACHE_KEY] = { conn: null, promise: null, listeners: false, logged: false };
  }
  return g[CACHE_KEY];
}

function maskMongoUri(uri) {
  if (!uri) return uri;
  const raw = String(uri);
  try {
    const parsed = new URL(raw);
    if (parsed.password) parsed.password = '***';
    return parsed.toString();
  } catch {
    return raw.replace(/(\/\/[^:/?#]+:)([^@]+)@/, '$1***@');
  }
}

function attachListenersOnce() {
  const cache = getCache();
  if (cache.listeners) return;
  cache.listeners = true;

  mongoose.connection.on('connected', () => console.log('✅ MongoDB connected'));
  mongoose.connection.on('error', (err) => console.error('❌ MongoDB error:', err));
}

async function connectToMongo(uri) {
  const cache = getCache();
  attachListenersOnce();

  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri)
      .then((m) => m.connection)
      .catch((err) => {
        cache.promise = null;
        throw err;
      });
  }
  cache.conn = await cache.promise;
  if (!cache.logged) {
    cache.logged = true;
    console.log(`🧭 MongoDB host: ${mongoose.connection.host || '(unknown)'}`);
    console.log(`🧭 MongoDB name: ${mongoose.connection.name || '(unknown)'}`);
    console.log(`🧭 MongoDB URI: ${maskMongoUri(uri) || '(empty)'}`);
  }
  return cache.conn;
}

async function disconnectMongo() {
  const cache = getCache();
  if (cache.conn) {
    await cache.conn.close();
  } else if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  cache.conn = null;
  cache.promise = null;
  cache.logged = false;
}

module.exports = { connectToMongo, disconnectMongo };
