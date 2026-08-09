'use strict';

const mongoose = require('mongoose');

const SeoPageVersionSchema = new mongoose.Schema(
  {
    siteUrl: { type: String, required: true, trim: true, maxlength: 500 },
    pageKey: { type: String, required: true, trim: true, maxlength: 128 },
    versionKey: { type: String, required: true, trim: true, maxlength: 128 },
    occurrenceKey: { type: String, required: true, trim: true, maxlength: 128 },
    inputHash: { type: String, required: true, trim: true, maxlength: 128 },
    fingerprintVersion: { type: String, trim: true, maxlength: 80, default: '' },
    observedAt: { type: Date, required: true, default: Date.now },
    changedComponents: { type: [String], default: [] },
    affectedDetectors: { type: [String], default: [] },
    componentHashes: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    trustedComponentHashes: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    fingerprintEvidence: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    manifest: {
      version: { type: String, trim: true, maxlength: 120, default: '' },
      sourceHash: { type: String, trim: true, maxlength: 128, default: '' },
      generatedAt: { type: Date, default: null },
    },
    production: {
      effectiveAt: { type: Date, default: null },
      precision: {
        type: String,
        enum: ['exact', 'upper_bound', 'unknown', 'legacy_baseline'],
        default: 'unknown',
      },
      source: {
        type: String,
        enum: ['manifest_ready_at', 'runtime_marker_observed', 'runtime_observed', 'legacy_baseline', 'unknown'],
        default: 'unknown',
      },
      deploymentId: { type: String, trim: true, maxlength: 200, default: '' },
      gitCommitSha: { type: String, trim: true, maxlength: 128, default: '' },
      gitDiffBaseSha: { type: String, trim: true, maxlength: 128, default: '' },
      gitCandidate: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    },
    crawl: {
      googleCrawlAt: { type: Date, default: null },
      confirmedAt: { type: Date, default: null },
      confirmedDetectors: { type: [String], default: [] },
    },
  },
  { timestamps: true, collection: 'seo_page_versions' }
);

SeoPageVersionSchema.index(
  { siteUrl: 1, pageKey: 1, occurrenceKey: 1 },
  { unique: true, name: 'uniq_seo_page_version_occurrence' }
);
SeoPageVersionSchema.index(
  { siteUrl: 1, pageKey: 1, versionKey: 1 },
  { name: 'idx_seo_page_content_version' }
);
SeoPageVersionSchema.index(
  { siteUrl: 1, pageKey: 1, observedAt: -1 },
  { name: 'idx_seo_page_version_timeline' }
);

module.exports = mongoose.model('SeoPageVersion', SeoPageVersionSchema);
