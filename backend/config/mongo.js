const mongoose = require('mongoose');

const CACHE_KEY = '__fa_mongoose_cache__';

function getCache() {
  const g = globalThis;
  if (!g[CACHE_KEY]) {
    g[CACHE_KEY] = { conn: null, promise: null, listeners: false };
  }
  return g[CACHE_KEY];
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
  return cache.conn;
}

module.exports = { connectToMongo };
