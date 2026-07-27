'use strict';

const crypto = require('crypto');

const { getJwtSecret } = require('../../config/jwt');
const InterviewConsumedRunToken = require('../../models/InterviewConsumedRunToken');

function tokenSecret() {
  const explicit = String(process.env.INTERVIEW_RUN_TOKEN_SECRET || '').trim();
  const secret = explicit || getJwtSecret();
  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error('INTERVIEW_RUN_TOKEN_SECRET must be at least 32 characters in production');
  }
  return secret;
}

function encode(value) {
  return Buffer.from(value).toString('base64url');
}

function signatureFor(payloadPart) {
  return crypto
    .createHmac('sha256', tokenSecret())
    .update(`interview-check-run-v1.${payloadPart}`)
    .digest('base64url');
}

function createRunnerToken({
  sessionId,
  userId,
  draftHash,
  variantId,
  now = new Date(),
  ttlSeconds = 5 * 60,
}) {
  const issuedAt = Math.floor(new Date(now).getTime() / 1000);
  const payload = {
    v: 1,
    sid: String(sessionId),
    uid: String(userId),
    dh: String(draftHash),
    vid: String(variantId),
    jti: crypto.randomBytes(16).toString('hex'),
    iat: issuedAt,
    exp: issuedAt + ttlSeconds,
  };
  const payloadPart = encode(JSON.stringify(payload));
  return {
    token: `${payloadPart}.${signatureFor(payloadPart)}`,
    payload,
  };
}

function verifyRunnerToken(token, { sessionId, userId, draftHash, variantId, now = new Date() }) {
  const [payloadPart, signature, extra] = String(token || '').split('.');
  if (!payloadPart || !signature || extra) return null;
  const expected = signatureFor(payloadPart);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  const nowSeconds = Math.floor(new Date(now).getTime() / 1000);
  if (
    payload?.v !== 1
    || payload.sid !== String(sessionId)
    || payload.uid !== String(userId)
    || payload.dh !== String(draftHash)
    || payload.vid !== String(variantId)
    || !payload.jti
    || !Number.isFinite(payload.exp)
    || payload.exp <= nowSeconds
    || payload.iat > nowSeconds + 30
  ) {
    return null;
  }
  return payload;
}

async function consumeRunnerToken(payload, {
  sessionId,
  userId,
  draftHash,
  variantId,
  now = new Date(),
}) {
  try {
    return await InterviewConsumedRunToken.create({
      tokenId: payload.jti,
      sessionId,
      userId,
      draftHash,
      variantId,
      consumedAt: now,
      expiresAt: new Date(payload.exp * 1000),
    });
  } catch (error) {
    if (error?.code === 11000) return null;
    throw error;
  }
}

async function releaseRunnerTokenConsumption(record) {
  if (!record?._id) return;
  await InterviewConsumedRunToken.deleteOne({
    _id: record._id,
    tokenId: record.tokenId,
  });
}

module.exports = {
  consumeRunnerToken,
  createRunnerToken,
  releaseRunnerTokenConsumption,
  verifyRunnerToken,
};
