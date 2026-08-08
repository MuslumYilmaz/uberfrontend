'use strict';

const mongoose = require('mongoose');

const SeoPropertyDailyMetricSchema = new mongoose.Schema(
  {
    siteUrl: { type: String, required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    generation: { type: String, required: true },
    clicks: { type: Number, min: 0, default: 0 },
    impressions: { type: Number, min: 0, default: 0 },
    position: { type: Number, min: 0, default: 0 },
    positionNumerator: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true, collection: 'seo_property_daily_metrics' }
);

SeoPropertyDailyMetricSchema.index(
  { siteUrl: 1, date: 1, generation: 1 },
  { unique: true, name: 'uniq_seo_property_daily_generation' }
);
SeoPropertyDailyMetricSchema.index({ date: -1 }, { name: 'idx_seo_property_daily_date' });

module.exports = mongoose.model('SeoPropertyDailyMetric', SeoPropertyDailyMetricSchema);
