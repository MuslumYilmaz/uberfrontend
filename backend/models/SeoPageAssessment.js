'use strict';

const mongoose = require('mongoose');

const SeoPageAssessmentSchema = new mongoose.Schema(
  {
    siteUrl: { type: String, required: true, trim: true, maxlength: 500 },
    pageKey: { type: String, required: true, trim: true, maxlength: 128 },
    canonicalUrl: { type: String, required: true, trim: true, maxlength: 2048 },
    endDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    ruleVersion: { type: String, required: true, trim: true, maxlength: 80, default: 'balanced-v2.1' },
    semanticVersion: { type: String, trim: true, maxlength: 80, default: '' },
    inputVersion: { type: String, trim: true, maxlength: 80, default: '' },
    inputHash: { type: String, trim: true, maxlength: 128, default: '' },
    pageVersionKey: { type: String, trim: true, maxlength: 128, default: '' },
    primaryState: {
      type: String,
      enum: ['not_evaluable', 'clear', 'watch', 'actionable'],
      required: true,
      default: 'not_evaluable',
    },
    evidenceLevel: { type: String, trim: true, maxlength: 80, default: 'insufficient' },
    metrics: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    coverage: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    cooldown: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    detectorCooldowns: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    ctrBaseline: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    semanticClusters: { type: [mongoose.Schema.Types.Mixed], default: [] },
    detectorAssessments: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    findings: { type: [mongoose.Schema.Types.Mixed], default: [] },
    counterEvidence: { type: [mongoose.Schema.Types.Mixed], default: [] },
    nextReviewDate: { type: Date, default: null },
    evaluatedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true, collection: 'seo_page_assessments' }
);

// Assessments are intentionally latest-only. Analysis upserts the same
// site/page identity instead of accumulating a second metric history.
SeoPageAssessmentSchema.index(
  { siteUrl: 1, pageKey: 1 },
  { unique: true, name: 'uniq_seo_page_assessment' }
);
SeoPageAssessmentSchema.index(
  { siteUrl: 1, endDate: -1, primaryState: 1 },
  { name: 'idx_seo_page_assessment_state' }
);

module.exports = mongoose.model('SeoPageAssessment', SeoPageAssessmentSchema);
