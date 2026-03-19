const mongoose = require('mongoose');

const CheckoutAttemptSchema = new mongoose.Schema(
  {
    attemptId: { type: String, required: true, unique: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: String, enum: ['gumroad', 'lemonsqueezy', 'stripe'], required: true },
    planId: {
      type: String,
      enum: ['monthly', 'quarterly', 'annual', 'lifetime'],
      required: true,
    },
    mode: { type: String, enum: ['test', 'live'], required: true },
    status: {
      type: String,
      enum: [
        'created',
        'webhook_received',
        'applied',
        'pending_user_match',
        'cancel_redirected',
        'success_redirected',
        'failed',
        'expired',
      ],
      default: 'created',
    },
    checkoutUrl: { type: String },
    successUrl: { type: String },
    cancelUrl: { type: String },
    customerEmail: { type: String, lowercase: true, trim: true },
    customerUserId: { type: String, trim: true },
    billingEventId: { type: String, trim: true },
    providerOrderId: { type: String, trim: true },
    providerSubscriptionId: { type: String, trim: true },
    lastErrorCode: { type: String, trim: true },
    lastErrorMessage: { type: String, trim: true },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    metadata: { type: Object },
  },
  { timestamps: true }
);

CheckoutAttemptSchema.index({ userId: 1, createdAt: -1 });
CheckoutAttemptSchema.index({ provider: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('CheckoutAttempt', CheckoutAttemptSchema);
