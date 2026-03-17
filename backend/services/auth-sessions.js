const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { getJwtSecret } = require('../config/jwt');

function normalizeAccessTokenExpiresIn(raw) {
  if (raw == null) return '15m';
  const value = String(raw).trim();
  if (!value) return '15m';
  return value;
}

function parseDurationToMs(raw, fallbackMs) {
  const value = String(raw || '').trim();
  if (!value) return fallbackMs;
  if (/^\d+$/.test(value)) return Number(value) * 1000;

  const match = value.match(/^(\d+)\s*(ms|s|m|h|d)$/i);
  if (!match) return fallbackMs;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (!Number.isFinite(amount) || amount <= 0) return fallbackMs;

  const multiplier =
    unit === 'ms' ? 1 :
      unit === 's' ? 1000 :
        unit === 'm' ? 60 * 1000 :
          unit === 'h' ? 60 * 60 * 1000 :
            unit === 'd' ? 24 * 60 * 60 * 1000 :
              0;

  return multiplier ? amount * multiplier : fallbackMs;
}

function parseRefreshTtlDays(raw, fallbackDays) {
  if (raw == null) return fallbackDays;
  const value = String(raw).trim();
  if (!value) return fallbackDays;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallbackDays;
  return parsed;
}

const ACCESS_TOKEN_EXPIRES_IN = normalizeAccessTokenExpiresIn(process.env.ACCESS_TOKEN_EXPIRES_IN);
const REFRESH_SESSION_TTL_DAYS = parseRefreshTtlDays(
  process.env.REFRESH_SESSION_TTL_DAYS ?? process.env.AUTH_COOKIE_MAX_AGE_DAYS,
  90
);
const REFRESH_SESSION_TTL_MS = Math.round(REFRESH_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

function getAccessTokenExpiresIn() {
  return ACCESS_TOKEN_EXPIRES_IN;
}

function getRefreshSessionTtlMs() {
  return REFRESH_SESSION_TTL_MS;
}

function getRefreshSessionTtlDays() {
  return REFRESH_SESSION_TTL_DAYS;
}

function resolvePasswordVersion(user) {
  const raw = user?.passwordUpdatedAt;
  if (!raw) return 0;
  const date = raw instanceof Date ? raw : new Date(raw);
  const ts = date.getTime();
  return Number.isFinite(ts) ? ts : 0;
}

function hashRefreshSecret(secret) {
  return crypto.createHash('sha256').update(String(secret || '')).digest('hex');
}

function createRefreshSecret() {
  return crypto.randomBytes(32).toString('base64url');
}

function createReplayableRefreshSecret(replayContext) {
  const sessionId = String(replayContext?.sessionId || '').trim();
  const action = String(replayContext?.action || '').trim();
  const contextId = String(replayContext?.contextId || '').trim();
  const requestId = String(replayContext?.requestId || '').trim();
  if (!sessionId || !action || !contextId || !requestId) {
    return createRefreshSecret();
  }

  return crypto
    .createHmac('sha256', getJwtSecret())
    .update(`auth-replay:${action}:${contextId}:${requestId}:${sessionId}`)
    .digest('base64url');
}

function formatRefreshToken(sessionId, secret) {
  return `${sessionId}.${secret}`;
}

function parseRefreshToken(rawToken) {
  const raw = String(rawToken || '').trim();
  if (!raw) return null;

  const dotIndex = raw.indexOf('.');
  if (dotIndex <= 0 || dotIndex === raw.length - 1) return null;

  const sessionId = raw.slice(0, dotIndex);
  const secret = raw.slice(dotIndex + 1);
  if (!sessionId || !secret) return null;
  return { sessionId, secret };
}

function buildAccessTokenPayload(user, session) {
  return {
    sub: user._id.toString(),
    sid: session?._id?.toString?.() || session?.id || '',
    pwdv: resolvePasswordVersion(user),
  };
}

function signAccessToken(user, session) {
  return jwt.sign(
    buildAccessTokenPayload(user, session),
    getJwtSecret(),
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN, algorithm: 'HS256' }
  );
}

function getSessionClientContext(req) {
  const forwardedFor = String(req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = forwardedFor || req?.ip || '';
  const userAgent = String(req?.headers?.['user-agent'] || '').slice(0, 1024);
  return { ip: String(ip || '').slice(0, 128), userAgent };
}

async function createAuthSession(AuthSession, user, req) {
  const now = Date.now();
  const { ip, userAgent } = getSessionClientContext(req);
  const session = new AuthSession({
    userId: user._id,
    passwordVersion: resolvePasswordVersion(user),
    expiresAt: new Date(now + REFRESH_SESSION_TTL_MS),
    lastUsedAt: new Date(now),
    ip,
    userAgent,
  });
  const secret = createReplayableRefreshSecret(req?.authReplayContext
    ? {
      ...req.authReplayContext,
      sessionId: session._id.toString(),
    }
    : null);
  session.secretHash = hashRefreshSecret(secret);
  await session.save();

  return { session, refreshToken: formatRefreshToken(session._id.toString(), secret) };
}

async function rotateAuthSession(AuthSession, session, user, req) {
  const secret = createRefreshSecret();
  const now = Date.now();
  const { ip, userAgent } = getSessionClientContext(req);

  session.secretHash = hashRefreshSecret(secret);
  session.passwordVersion = resolvePasswordVersion(user);
  session.expiresAt = new Date(now + REFRESH_SESSION_TTL_MS);
  session.lastUsedAt = new Date(now);
  session.ip = ip;
  session.userAgent = userAgent;
  await session.save();

  return { session, refreshToken: formatRefreshToken(session._id.toString(), secret) };
}

async function revokeSessionById(AuthSession, sessionId, reason) {
  if (!sessionId) return;
  await AuthSession.updateOne(
    { _id: sessionId, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: String(reason || 'revoked') } }
  );
}

async function revokeAllSessionsForUser(AuthSession, userId, reason) {
  if (!userId) return;
  await AuthSession.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: String(reason || 'revoked') } }
  );
}

async function findRefreshSession(AuthSession, rawToken) {
  const parsed = parseRefreshToken(rawToken);
  if (!parsed) return { session: null, status: 'invalid' };

  const session = await AuthSession.findById(parsed.sessionId);
  if (!session) return { session: null, status: 'invalid' };
  if (session.revokedAt) return { session, status: 'revoked' };
  if (session.expiresAt && session.expiresAt.getTime() <= Date.now()) return { session, status: 'expired' };

  const providedHash = hashRefreshSecret(parsed.secret);
  if (session.secretHash !== providedHash) {
    session.revokedAt = new Date();
    session.revokedReason = 'refresh_token_mismatch';
    await session.save();
    return { session, status: 'mismatch' };
  }

  return { session, status: 'active' };
}

function verifyAccessToken(token, verifyOptions) {
  return jwt.verify(token, getJwtSecret(), verifyOptions);
}

function buildReplayableRefreshTokenForSession(session, replayContext) {
  const sessionId = session?._id?.toString?.() || session?.id || '';
  if (!sessionId) return null;
  const secret = createReplayableRefreshSecret({
    ...replayContext,
    sessionId,
  });
  return formatRefreshToken(sessionId, secret);
}

module.exports = {
  buildReplayableRefreshTokenForSession,
  createAuthSession,
  findRefreshSession,
  getAccessTokenExpiresIn,
  getRefreshSessionTtlDays,
  getRefreshSessionTtlMs,
  parseDurationToMs,
  parseRefreshToken,
  revokeAllSessionsForUser,
  revokeSessionById,
  rotateAuthSession,
  signAccessToken,
  verifyAccessToken,
  resolvePasswordVersion,
};
