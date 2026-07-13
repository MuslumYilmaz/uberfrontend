const crypto = require('crypto');
const { resolveFrontendBase } = require('../config/urls');
const { sendEmailVerificationMail } = require('./email');

const TOKEN_TTL_MS = 30 * 60 * 1000;

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function isValidEmail(value) {
  const normalized = normalizeEmail(value);
  return normalized.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

function hashVerificationToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function buildVerificationUrl(token) {
  const url = new URL('/verify-email', resolveFrontendBase());
  url.hash = `token=${encodeURIComponent(token)}`;
  return url.toString();
}

async function createAndSendVerification(EmailVerification, user, requestedEmail) {
  const currentEmail = normalizeEmail(user.email);
  const targetEmail = normalizeEmail(requestedEmail || currentEmail);
  const purpose = targetEmail === currentEmail ? 'verify_email' : 'change_email';
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_TTL_MS);
  const token = crypto.randomBytes(32).toString('base64url');

  await EmailVerification.updateMany(
    {
      userId: user._id,
      $or: [
        { consumedAt: null },
        { purpose: 'change_email', finalizedAt: null },
      ],
    },
    {
      $set: {
        consumedAt: now,
        finalizedAt: now,
        supersededAt: now,
      },
      $unset: {
        finalizationLeaseToken: 1,
        finalizationLeaseExpiresAt: 1,
      },
    }
  );
  await EmailVerification.create({
    userId: user._id,
    email: targetEmail,
    purpose,
    tokenHash: hashVerificationToken(token),
    expiresAt,
  });

  await sendEmailVerificationMail({
    to: targetEmail,
    verificationUrl: buildVerificationUrl(token),
    purpose,
  });

  return { purpose, expiresAt };
}

module.exports = {
  TOKEN_TTL_MS,
  buildVerificationUrl,
  createAndSendVerification,
  hashVerificationToken,
  isValidEmail,
  normalizeEmail,
};
