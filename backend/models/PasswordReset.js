const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const PasswordResetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, trim: true },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date, default: null },
    supersededAt: { type: Date, default: null },
  },
  { timestamps: true }
);

PasswordResetSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: 'ttl_password_reset' }
);

PasswordResetSchema.index(
  { userId: 1, consumedAt: 1, supersededAt: 1, expiresAt: 1 },
  { name: 'idx_password_reset_active' }
);

module.exports = model('PasswordReset', PasswordResetSchema);
