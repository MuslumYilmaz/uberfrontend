'use strict';

const mongoose = require('mongoose');

const SeoPageDailyMetricSchema = new mongoose.Schema(
  {
    siteUrl: { type: String, required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    pageKey: { type: String, required: true },
    canonicalUrl: { type: String, required: true, maxlength: 2048 },
    generation: { type: String, required: true },
    clicks: { type: Number, min: 0, default: 0 },
    impressions: { type: Number, min: 0, default: 0 },
    position: { type: Number, min: 0, default: 0 },
    positionNumerator: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true, collection: 'seo_page_daily_metrics' }
);

SeoPageDailyMetricSchema.index(
  { siteUrl: 1, date: 1, pageKey: 1, generation: 1 },
  { unique: true, name: 'uniq_seo_page_daily_generation' }
);
SeoPageDailyMetricSchema.index({ pageKey: 1, date: -1 }, { name: 'idx_seo_page_daily_page_date' });

module.exports = mongoose.model('SeoPageDailyMetric', SeoPageDailyMetricSchema);
