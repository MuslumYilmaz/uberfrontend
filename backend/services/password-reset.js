const crypto = require('crypto');
const { resolveFrontendBase } = require('../config/urls');
const { sendPasswordResetMail } = require('./email');

const PASSWORD_RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

function hashPasswordResetToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function buildPasswordResetUrl(token) {
  const url = new URL('/auth/reset-password', resolveFrontendBase());
  url.hash = `token=${encodeURIComponent(token)}`;
  return url.toString();
}

async function createAndSendPasswordReset(PasswordReset, user) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PASSWORD_RESET_TOKEN_TTL_MS);
  const token = crypto.randomBytes(32).toString('base64url');

  const reset = await PasswordReset.create({
    userId: user._id,
    tokenHash: hashPasswordResetToken(token),
    expiresAt,
  });

  // Persist the hash before SMTP so a delivered message can never contain an
  // unusable token. The raw token is never stored.
  try {
    await sendPasswordResetMail({
      to: user.email,
      resetUrl: buildPasswordResetUrl(token),
    });
  } catch (error) {
    await PasswordReset.deleteOne({ _id: reset._id });
    throw error;
  }

  await PasswordReset.updateMany(
    {
      _id: { $ne: reset._id },
      userId: user._id,
      createdAt: { $lte: reset.createdAt },
      consumedAt: null,
    },
    { $set: { supersededAt: now } }
  );

  return { expiresAt };
}

module.exports = {
  PASSWORD_RESET_TOKEN_TTL_MS,
  buildPasswordResetUrl,
  createAndSendPasswordReset,
  hashPasswordResetToken,
};
