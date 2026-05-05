const crypto = require('crypto');

const CACHE_KEY = '__fa_auth_validation_cache__';

function getCache() {
  const g = globalThis;
  if (!g[CACHE_KEY]) {
    g[CACHE_KEY] = {
      entries: new Map(),
    };
  }
  return g[CACHE_KEY];
}

function readCacheTtlMs() {
  const raw = process.env.AUTH_VALIDATION_CACHE_TTL_MS;
  if (raw == null || raw === '') return 5000;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.min(Math.floor(parsed), 60_000);
}

function readMaxEntries() {
  const parsed = Number(process.env.AUTH_VALIDATION_CACHE_MAX || 5000);
  if (!Number.isFinite(parsed) || parsed <= 0) return 5000;
  return Math.min(Math.floor(parsed), 50_000);
}

function cacheKeyForToken(token) {
  return crypto
    .createHash('sha256')
    .update(String(token || ''))
    .digest('hex');
}

function getCachedAuthValidation(token, now = Date.now()) {
  const ttlMs = readCacheTtlMs();
  if (!ttlMs) return null;

  const key = cacheKeyForToken(token);
  const cache = getCache();
  const entry = cache.entries.get(key);
  if (!entry) return null;
  if (now >= entry.expiresAt) {
    cache.entries.delete(key);
    return null;
  }
  return entry.value || null;
}

function setCachedAuthValidation(token, value, now = Date.now()) {
  const ttlMs = readCacheTtlMs();
  if (!ttlMs || !token || !value) return;

  const cache = getCache();
  cache.entries.set(cacheKeyForToken(token), {
    value: {
      userId: String(value.userId || ''),
      role: String(value.role || 'user'),
      sessionId: value.sessionId ? String(value.sessionId) : null,
    },
    expiresAt: now + ttlMs,
  });

  const maxEntries = readMaxEntries();
  if (cache.entries.size > maxEntries) {
    for (const [key, entry] of cache.entries) {
      if (now >= entry.expiresAt || cache.entries.size > maxEntries) {
        cache.entries.delete(key);
      }
      if (cache.entries.size <= maxEntries) break;
    }
  }
}

function clearAuthValidationCacheForUser(userId) {
  if (!userId) return;
  const id = String(userId);
  const cache = getCache();
  for (const [key, entry] of cache.entries) {
    if (String(entry?.value?.userId || '') === id) {
      cache.entries.delete(key);
    }
  }
}

function clearAuthValidationCacheForSession(sessionId) {
  if (!sessionId) return;
  const id = String(sessionId);
  const cache = getCache();
  for (const [key, entry] of cache.entries) {
    if (String(entry?.value?.sessionId || '') === id) {
      cache.entries.delete(key);
    }
  }
}

function clearAuthValidationCache() {
  getCache().entries.clear();
}

module.exports = {
  clearAuthValidationCache,
  clearAuthValidationCacheForSession,
  clearAuthValidationCacheForUser,
  getCachedAuthValidation,
  setCachedAuthValidation,
};
