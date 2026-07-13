const mongoose = require('mongoose');

const PendingEntitlementSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ['gumroad', 'lemonsqueezy', 'stripe'], required: true },
    scope: { type: String, enum: ['pro', 'projects'], default: 'pro' },
    eventId: { type: String, required: true },
    eventType: { type: String },
    // LemonSqueezy records are bound by immutable userId and may legitimately
    // arrive without a purchaser email. Provider handlers still require email
    // for email-bound providers such as Gumroad.
    email: { type: String, default: '', lowercase: true, trim: true },
    userId: { type: String },
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
    manageUrl: { type: String },
    payload: { type: Object },
    eventReceivedAt: { type: Date },
    eventOrderKey: { type: String },
    receivedAt: { type: Date, default: Date.now },
    appliedAt: { type: Date },
    appliedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ignoredAt: { type: Date },
    ignoredReason: { type: String },
    ignoredBy: { type: String },
  },
  { timestamps: true }
);

PendingEntitlementSchema.index({ provider: 1, eventId: 1 }, { unique: true });
PendingEntitlementSchema.index({ email: 1, appliedAt: 1 });
PendingEntitlementSchema.index({ provider: 1, userId: 1, appliedAt: 1 });

module.exports = mongoose.model('PendingEntitlement', PendingEntitlementSchema);
