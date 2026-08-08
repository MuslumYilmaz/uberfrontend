'use strict';

const mongoose = require('mongoose');

const SeoMetricPartitionSchema = new mongoose.Schema(
  {
    siteUrl: { type: String, required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    slice: { type: String, enum: ['property', 'page', 'queryPage', 'devicePage'], required: true },
    activeGeneration: { type: String, required: true },
    status: { type: String, enum: ['complete', 'truncated', 'stale'], required: true },
    rowCount: { type: Number, min: 0, default: 0 },
    impressions: { type: Number, min: 0, default: 0 },
    truncated: { type: Boolean, default: false },
    queryCoverage: { type: Number, min: 0, max: 1, default: null },
    deviceCoverage: { type: Number, min: 0, max: 1, default: null },
    completedAt: { type: Date, required: true },
  },
  { timestamps: true, collection: 'seo_metric_partitions' }
);

SeoMetricPartitionSchema.index(
  { siteUrl: 1, date: 1, slice: 1 },
  { unique: true, name: 'uniq_seo_metric_partition' }
);
SeoMetricPartitionSchema.index({ date: -1, slice: 1 }, { name: 'idx_seo_metric_partition_date_slice' });

module.exports = mongoose.model('SeoMetricPartition', SeoMetricPartitionSchema);
