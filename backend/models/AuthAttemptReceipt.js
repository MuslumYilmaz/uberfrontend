const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const AuthAttemptReceiptSchema = new Schema(
  {
    action: { type: String, enum: ['login', 'signup'], required: true, trim: true },
    contextId: { type: String, required: true, trim: true, maxlength: 160 },
    requestId: { type: String, required: true, trim: true, maxlength: 160 },
    requestHash: { type: String, required: true, trim: true, maxlength: 128 },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    statusCode: { type: Number, default: 200 },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    sessionId: { type: Schema.Types.ObjectId, ref: 'AuthSession', default: null },
  },
  { timestamps: true }
);

AuthAttemptReceiptSchema.index(
  { action: 1, contextId: 1, requestId: 1 },
  { unique: true, name: 'uniq_auth_attempt_receipt' }
);

AuthAttemptReceiptSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: 15 * 60, name: 'ttl_auth_attempt_receipt' }
);

module.exports = model('AuthAttemptReceipt', AuthAttemptReceiptSchema);
