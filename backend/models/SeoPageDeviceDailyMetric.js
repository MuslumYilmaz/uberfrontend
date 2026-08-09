'use strict';

const mongoose = require('mongoose');

const SeoPageDeviceDailyMetricSchema = new mongoose.Schema(
  {
    siteUrl: { type: String, required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    pageKey: { type: String, required: true },
    device: { type: String, enum: ['DESKTOP', 'MOBILE', 'TABLET', 'UNKNOWN'], default: 'UNKNOWN' },
    generation: { type: String, required: true },
    clicks: { type: Number, min: 0, default: 0 },
    impressions: { type: Number, min: 0, default: 0 },
    position: { type: Number, min: 0, default: 0 },
    positionNumerator: { type: Number, min: 0, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, collection: 'seo_page_device_daily_metrics' }
);

SeoPageDeviceDailyMetricSchema.index(
  { siteUrl: 1, date: 1, pageKey: 1, device: 1, generation: 1 },
  { unique: true, name: 'uniq_seo_page_device_daily_generation' }
);
SeoPageDeviceDailyMetricSchema.index({ pageKey: 1, date: -1 }, { name: 'idx_seo_page_device_daily_page_date' });
SeoPageDeviceDailyMetricSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'ttl_seo_page_device_18_months' });

module.exports = mongoose.model('SeoPageDeviceDailyMetric', SeoPageDeviceDailyMetricSchema);
