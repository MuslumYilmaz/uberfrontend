const mongoose = require('mongoose');

const PendingEntitlementSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ['gumroad', 'lemonsqueezy', 'stripe'], required: true },
    scope: { type: String, enum: ['pro', 'projects'], default: 'pro' },
    eventId: { type: String, required: true },
    eventType: { type: String },
    email: { type: String, required: true, lowercase: true, trim: true },
    entitlement: {
      status: {
        type: String,
        enum: ['none', 'active', 'lifetime', 'cancelled', 'expired', 'refunded', 'chargeback'],
        default: 'none',
      },
      validUntil: { type: Date, default: null },
    },
    saleId: { type: String },
    orderId: { type: String },
    subscriptionId: { type: String },
    customerId: { type: String },
    payload: { type: Object },
    receivedAt: { type: Date, default: Date.now },
    appliedAt: { type: Date },
    appliedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

PendingEntitlementSchema.index({ provider: 1, eventId: 1 }, { unique: true });
PendingEntitlementSchema.index({ email: 1, appliedAt: 1 });

module.exports = mongoose.model('PendingEntitlement', PendingEntitlementSchema);
