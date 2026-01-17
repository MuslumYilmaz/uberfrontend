const mongoose = require('mongoose');

const BillingEventSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ['gumroad', 'lemonsqueezy', 'stripe'], required: true },
    eventId: { type: String, required: true },
    eventType: { type: String },
    email: { type: String },
    payload: { type: Object },
    processingStatus: { type: String },
    processedAt: { type: Date },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receivedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

BillingEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('BillingEvent', BillingEventSchema);
