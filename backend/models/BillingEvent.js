const mongoose = require('mongoose');

const BillingEventSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ['gumroad', 'lemonsqueezy', 'stripe'], required: true },
    eventId: { type: String, required: true },
    eventType: { type: String },
    email: { type: String },
    payload: { type: Object },
    processingStatus: { type: String },
    attemptCount: { type: Number, default: 0, min: 0 },
    leaseToken: { type: String },
    leaseExpiresAt: { type: Date },
    lastAttemptAt: { type: Date },
    lastErrorCode: { type: String, maxlength: 128 },
    lastErrorMessage: { type: String, maxlength: 1000 },
    lastErrorAt: { type: Date },
    processedAt: { type: Date },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receivedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

BillingEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
BillingEventSchema.index({ processingStatus: 1, leaseExpiresAt: 1, receivedAt: -1 });

module.exports = mongoose.model('BillingEvent', BillingEventSchema);
