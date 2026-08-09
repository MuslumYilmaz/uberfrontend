'use strict';

const mongoose = require('mongoose');

const SeoDigestDeliverySchema = new mongoose.Schema(
  {
    siteUrl: { type: String, required: true, maxlength: 2048 },
    weekKey: { type: String, required: true, match: /^\d{4}-W\d{2}$/ },
    status: {
      type: String,
      enum: ['attempting', 'sent', 'failed'],
      required: true,
      default: 'attempting',
    },
    attemptedAt: { type: Date, required: true },
    sentAt: { type: Date, default: null },
    resultCode: { type: String, maxlength: 80, default: '' },
    actionCount: { type: Number, min: 0, max: 10, default: 0 },
  },
  { timestamps: true, collection: 'seo_digest_deliveries' }
);

// One durable attempt per property and Istanbul ISO week makes the cron
// at-most-once. We intentionally do not automatically retry an ambiguous mail
// attempt: avoiding a duplicate owner email is safer than guessing whether an
// SMTP provider accepted a timed-out request.
SeoDigestDeliverySchema.index(
  { siteUrl: 1, weekKey: 1 },
  { unique: true, name: 'uniq_seo_digest_property_week' }
);
SeoDigestDeliverySchema.index({ attemptedAt: -1 }, { name: 'idx_seo_digest_attempted' });

module.exports = mongoose.model('SeoDigestDelivery', SeoDigestDeliverySchema);
