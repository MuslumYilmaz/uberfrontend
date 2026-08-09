'use strict';

const mongoose = require('mongoose');

const SeoQueryPageDailyMetricSchema = new mongoose.Schema(
  {
    siteUrl: { type: String, required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    pageKey: { type: String, required: true },
    queryKey: { type: String, required: true },
    query: { type: String, required: true, maxlength: 1000 },
    segment: { type: String, enum: ['brand', 'nonbrand'], default: 'nonbrand' },
    generation: { type: String, required: true },
    clicks: { type: Number, min: 0, default: 0 },
    impressions: { type: Number, min: 0, default: 0 },
    position: { type: Number, min: 0, default: 0 },
    positionNumerator: { type: Number, min: 0, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, collection: 'seo_query_page_daily_metrics' }
);

SeoQueryPageDailyMetricSchema.index(
  { siteUrl: 1, date: 1, pageKey: 1, queryKey: 1, generation: 1 },
  { unique: true, name: 'uniq_seo_query_page_daily_generation' }
);
SeoQueryPageDailyMetricSchema.index({ pageKey: 1, date: -1 }, { name: 'idx_seo_query_page_daily_page_date' });
SeoQueryPageDailyMetricSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'ttl_seo_query_page_18_months' });

module.exports = mongoose.model('SeoQueryPageDailyMetric', SeoQueryPageDailyMetricSchema);
