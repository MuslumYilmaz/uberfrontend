'use strict';

const mongoose = require('mongoose');

const ASSESSMENT_DISPOSITIONS = [
  'insufficient_evidence',
  'monitor',
  'investigate',
  'structural_review',
  'change_ready',
  'no_change',
];

const NEXT_REVIEW_EVENTS = [
  'url_inspection',
  'post_deploy_crawl',
  '14_finalized_days',
  '28_finalized_days',
  'coverage_threshold',
  'serp_review',
  'next_finalized_sync',
  'structural_review',
];

const NextReviewSchema = new mongoose.Schema(
  {
    mode: { type: String, enum: ['date', 'event'], required: true },
    at: { type: Date, default: null },
    event: { type: String, enum: NEXT_REVIEW_EVENTS, default: null },
    rationale: { type: String, maxlength: 1000, default: '' },
  },
  { _id: false, strict: true }
);

NextReviewSchema.pre('validate', function validateNextReview(next) {
  // Persist one unambiguous trigger: either an exact date or an event. A
  // mixed trigger makes stale-review checks ambiguous at the API boundary.
  const dateModeValid = this.mode !== 'date' || (Boolean(this.at) && !this.event);
  const eventModeValid = this.mode !== 'event' || (Boolean(this.event) && !this.at);
  if (!dateModeValid || !eventModeValid) {
    this.invalidate('mode', 'nextReview must contain a valid date or event trigger');
  }
  next();
});

const OpportunityMetricSchema = new mongoose.Schema(
  {
    clicks: { type: Number, min: 0, default: 0 },
    impressions: { type: Number, min: 0, default: 0 },
    ctr: { type: Number, min: 0, max: 1, default: 0 },
    position: { type: Number, min: 0, default: 0 },
  },
  { _id: false, strict: true }
);

const OpportunityImpactSchema = new mongoose.Schema(
  {
    metric: { type: String, enum: ['clicks'], default: 'clicks' },
    low: { type: Number, min: 0, default: null },
    point: { type: Number, min: 0, default: null },
    high: { type: Number, min: 0, default: null },
    windowDays: { type: Number, min: 1, max: 365, default: 28 },
    quality: { type: String, enum: ['not_estimated', 'directional', 'modeled'], default: 'not_estimated' },
  },
  { _id: false, strict: true }
);

const QueryOpportunitySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true, maxlength: 128 },
    classification: {
      type: String,
      enum: [
        'snippet_gap', 'ranking_gap', 'intent_gap', 'source_preference',
        'visibility_interruption', 'not_evaluable',
      ],
      required: true,
    },
    state: { type: String, enum: ['not_evaluable', 'clear', 'watch', 'actionable'], default: 'not_evaluable' },
    disposition: { type: String, enum: ASSESSMENT_DISPOSITIONS, default: 'insufficient_evidence' },
    clusterKey: { type: String, trim: true, maxlength: 128, default: null },
    safeLabel: { type: String, trim: true, maxlength: 160, default: '' },
    patternConfidence: { type: Number, min: 0, max: 1, default: 0 },
    causeConfidence: { type: Number, min: 0, max: 1, default: 0 },
    current: { type: OpportunityMetricSchema, default: () => ({}) },
    previous: { type: OpportunityMetricSchema, default: () => ({}) },
    coverage: {
      query: { type: Number, min: 0, max: 1, default: null },
      semantic: { type: Number, min: 0, max: 1, default: null },
      device: { type: Number, min: 0, max: 1, default: null },
    },
    persistence: {
      stableWeeks: { type: Number, min: 0, max: 52, default: 0 },
      requiredWeeks: { type: Number, min: 0, max: 52, default: 0 },
      totalWeeks: { type: Number, min: 0, max: 52, default: 0 },
      zeroImpressionStreak: { type: Number, min: 0, max: 3650, default: 0 },
    },
    recommendedSurface: {
      type: String,
      enum: ['none', 'title_description', 'h1_body', 'h2_body', 'url_inspection', 'serp_review'],
      default: 'none',
    },
    blockers: { type: [String], default: [] },
    reviewReady: { type: Boolean, default: false },
    expectedImpact: { type: OpportunityImpactSchema, default: () => ({}) },
    nextReview: { type: NextReviewSchema, default: null },
  },
  { _id: false, strict: true }
);

const SeoPageAssessmentSchema = new mongoose.Schema(
  {
    siteUrl: { type: String, required: true, trim: true, maxlength: 500 },
    pageKey: { type: String, required: true, trim: true, maxlength: 128 },
    canonicalUrl: { type: String, required: true, trim: true, maxlength: 2048 },
    endDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    ruleVersion: { type: String, required: true, trim: true, maxlength: 80, default: 'balanced-v2.2' },
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
    disposition: {
      type: String,
      enum: ASSESSMENT_DISPOSITIONS,
      default: 'insufficient_evidence',
      index: true,
    },
    patternConfidence: { type: Number, min: 0, max: 1, default: 0 },
    causeConfidence: { type: Number, min: 0, max: 1, default: 0 },
    primaryFinding: { type: mongoose.Schema.Types.Mixed, default: null },
    evidenceLevel: { type: String, trim: true, maxlength: 80, default: 'insufficient' },
    metrics: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    coverage: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    cooldown: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    detectorCooldowns: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    ctrBaseline: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    visibility: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    queryOpportunities: { type: [QueryOpportunitySchema], default: [] },
    decisionGates: { type: [String], default: [] },
    nextReview: { type: NextReviewSchema, default: null },
    semanticClusters: { type: [mongoose.Schema.Types.Mixed], default: [] },
    detectorAssessments: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    findings: { type: [mongoose.Schema.Types.Mixed], default: [] },
    counterEvidence: { type: [mongoose.Schema.Types.Mixed], default: [] },
    nextReviewDate: { type: Date, default: null },
    evaluatedAt: { type: Date, required: true, default: Date.now },
    // Owner promotion increments this inside the same transaction that creates
    // the action. Analysis publication also writes this assessment document,
    // so a publication/promotion race becomes a MongoDB write conflict instead
    // of allowing an action from the superseded assessment to slip through.
    promotionGuardRevision: { type: Number, min: 0, default: 0 },
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
module.exports.ASSESSMENT_DISPOSITIONS = ASSESSMENT_DISPOSITIONS;
