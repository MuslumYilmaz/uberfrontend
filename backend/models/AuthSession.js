const mongoose = require('mongoose');

const AuthSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    secretHash: {
      type: String,
      required: true,
    },
    passwordVersion: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true,
    },
    revokedReason: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
      maxlength: 1024,
    },
    ip: {
      type: String,
      default: '',
      maxlength: 128,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuthSession', AuthSessionSchema);
