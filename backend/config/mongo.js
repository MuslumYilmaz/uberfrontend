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

function isAutomatedTestRuntime() {
  return process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;
}

function isProductionRuntime() {
  return String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production';
}

function normalizeMongoTarget(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return null;
  if (['test', 'testing', 'local-test', 'localtest', 'sandbox'].includes(raw)) return 'test';
  if (['production', 'prod', 'live', 'primary'].includes(raw)) return 'production';
  return null;
}

function resolveMongoTarget() {
  const explicitTarget = normalizeMongoTarget(process.env.MONGO_TARGET || process.env.LOCAL_MONGO_TARGET);
  if (explicitTarget) return explicitTarget;
  if (isProductionRuntime()) return 'production';
  if (isAutomatedTestRuntime()) return 'test';
  if (String(process.env.MONGO_URL_TEST || '').trim()) return 'test';
  return 'production';
}

function resolveMongoConnectionConfig() {
  const target = resolveMongoTarget();

  if (target === 'test') {
    const uri = String(process.env.MONGO_URL_TEST || '').trim();
    if (!uri) {
      throw new Error(
        'MONGO_URL_TEST is required when MongoDB target is "test". Set MONGO_URL_TEST or explicitly use MONGO_TARGET=production.'
      );
    }
    return { target, uri };
  }

  const uri = String(process.env.MONGO_URL || '').trim() || 'mongodb://127.0.0.1:27017/myapp';
  return { target, uri };
}

function getExpectedMongoDbName() {
  const scoped = resolveMongoTarget() === 'test'
    ? process.env.EXPECTED_MONGO_DB_NAME_TEST || process.env.EXPECTED_MONGO_DB_NAME
    : process.env.EXPECTED_MONGO_DB_NAME;
  const value = String(scoped || '').trim();
  return value || null;
}

function getModelCollectionMap() {
  return Object.values(mongoose.models)
    .map((model) => ({
      model: model.modelName,
      collection: model.collection?.collectionName || '(unknown)',
    }))
    .sort((a, b) => a.model.localeCompare(b.model));
}

function assertExpectedMongoDbName(connection, uri) {
  const expectedName = getExpectedMongoDbName();
  if (!expectedName) return;

  const actualName = String(connection?.name || '').trim();
  if (!actualName) return;
  if (actualName === expectedName) return;

  const err = new Error(
    `MongoDB database mismatch: expected "${expectedName}" but connected to "${actualName}".`
  );
  err.code = 'MONGO_DB_NAME_MISMATCH';
  err.details = {
    expectedName,
    actualName,
    uri: maskMongoUri(uri) || '(empty)',
  };
  throw err;
}

function getMongoDiagnostics() {
  const connection = mongoose.connection;
  const expectedName = getExpectedMongoDbName();
  const actualName = String(connection?.name || '').trim() || null;

  return {
    readyState: connection?.readyState ?? 0,
    host: connection?.host || null,
    name: actualName,
    expectedName,
    matchesExpected: !expectedName || actualName === expectedName,
    models: getModelCollectionMap(),
  };
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

  let connection;
  try {
    connection = await cache.promise;
    assertExpectedMongoDbName(connection, uri);
  } catch (err) {
    cache.conn = null;
    cache.promise = null;
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.disconnect();
      } catch {
        // ignore disconnect cleanup errors while surfacing the original mismatch/connect error
      }
    }
    throw err;
  }

  cache.conn = connection;
  if (!cache.logged) {
    cache.logged = true;
    console.log(`🧭 MongoDB target: ${resolveMongoTarget()}`);
    console.log(`🧭 MongoDB host: ${mongoose.connection.host || '(unknown)'}`);
    console.log(`🧭 MongoDB name: ${mongoose.connection.name || '(unknown)'}`);
    console.log(`🧭 MongoDB URI: ${maskMongoUri(uri) || '(empty)'}`);
    const expectedName = getExpectedMongoDbName();
    if (expectedName) {
      console.log(`🧭 MongoDB expected name: ${expectedName}`);
    }
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

module.exports = {
  connectToMongo,
  disconnectMongo,
  getMongoDiagnostics,
  getExpectedMongoDbName,
  resolveMongoConnectionConfig,
  resolveMongoTarget,
};
