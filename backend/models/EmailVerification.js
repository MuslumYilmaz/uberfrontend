const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const EmailVerificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    purpose: { type: String, enum: ['verify_email', 'change_email'], required: true },
    tokenHash: { type: String, required: true, unique: true, trim: true },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date, default: null },
    finalizedAt: { type: Date, default: null },
    supersededAt: { type: Date, default: null },
    finalizationLeaseToken: { type: String, default: null },
    finalizationLeaseExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

EmailVerificationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: 'ttl_email_verification' }
);

EmailVerificationSchema.index(
  { userId: 1, consumedAt: 1, expiresAt: 1 },
  { name: 'idx_email_verification_active' }
);

module.exports = model('EmailVerification', EmailVerificationSchema);
