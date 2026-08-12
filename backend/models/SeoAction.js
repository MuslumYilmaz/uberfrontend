'use strict';

const mongoose = require('mongoose');

const ACTION_TYPES = [
  'ctr_snippet',
  'intent_mismatch',
  'content_decay',
  'cannibalization',
  'internal_link',
  'technical_indexing',
  'manual',
];
const ACTION_STATES = [
  'proposed',
  'approved',
  'implementation_pending',
  'measuring',
  'evaluated',
  'closed',
  'snoozed',
  'dismissed',
];

const ExpectedImpactSchema = new mongoose.Schema(
  {
    metric: { type: String, enum: ['clicks'], default: 'clicks' },
    low: { type: Number, min: 0, default: null },
    point: { type: Number, min: 0, default: null },
    high: { type: Number, min: 0, default: null },
    windowDays: { type: Number, min: 1, max: 365, default: 28 },
    quality: {
      type: String,
      enum: ['not_estimated', 'directional', 'modeled'],
      default: 'not_estimated',
    },
  },
  { _id: false }
);

const NextReviewSchema = new mongoose.Schema(
  {
    mode: { type: String, enum: ['date', 'event'], required: true },
    at: { type: Date, default: null },
    event: {
      type: String,
      enum: [
        'url_inspection',
        'post_deploy_crawl',
        '14_finalized_days',
        '28_finalized_days',
        'coverage_threshold',
        'serp_review',
        'next_finalized_sync',
        'structural_review',
      ],
      default: null,
    },
    rationale: { type: String, maxlength: 1000, default: '' },
  },
  { _id: false }
);

NextReviewSchema.pre('validate', function validateNextReview(next) {
  const dateModeValid = this.mode !== 'date' || (Boolean(this.at) && !this.event);
  const eventModeValid = this.mode !== 'event' || (Boolean(this.event) && !this.at);
  if (!dateModeValid || !eventModeValid) {
    this.invalidate('mode', 'nextReview must contain a valid date or event trigger');
  }
  next();
});

const SeoActionSchema = new mongoose.Schema(
  {
    pageKey: { type: String, required: true, index: true },
    canonicalUrl: { type: String, required: true, maxlength: 2048 },
    type: { type: String, enum: ACTION_TYPES, required: true },
    state: { type: String, enum: ACTION_STATES, default: 'proposed', index: true },
    source: { type: String, enum: ['balanced-v1', 'balanced-v2', 'balanced-v2.1', 'balanced-v2.2', 'owner', 'historical'], default: 'balanced-v2.2' },
    ruleVersion: { type: String, default: 'balanced-v2.2' },
    queueKind: { type: String, enum: ['performance', 'technical', 'structural'], default: 'performance', index: true },
    fingerprint: { type: String, required: true },
    // Present only for an owner promotion created from a reviewed query
    // opportunity. Unlike experimentLockKey (which protects the active
    // approval lifecycle per page), this immutable key makes the promotion
    // request itself idempotent across every action state.
    ownerPromotionKey: { type: String, maxlength: 64, default: undefined },
    campaignId: { type: String, default: null },
    experimentLockKey: { type: String, default: undefined },
    summary: { type: String, required: true, maxlength: 1000 },
    hypothesis: { type: String, maxlength: 2000, default: '' },
    evidence: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    recommendation: {
      title: { type: String, maxlength: 1000, default: '' },
      rationale: { type: String, maxlength: 2000, default: '' },
      checklist: { type: [String], default: [] },
      copy: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
      copyDirection: { type: String, maxlength: 2000, default: '' },
    },
    successCriteria: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    // Owner-authored override text is intentionally public to the owner-only
    // dashboard. Keep it outside detector-owned Mixed evidence so legacy
    // detector payloads can remain exact-allowlist serialized.
    ownerSuccessCriteriaText: { type: String, maxlength: 2000, default: '' },
    priorityScore: { type: Number, min: 0, default: 0, index: true },
    confidence: { type: Number, min: 0, max: 1, default: 0.5 },
    patternConfidence: { type: Number, min: 0, max: 1, default: 0 },
    causeConfidence: { type: Number, min: 0, max: 1, default: 0 },
    effort: { type: String, enum: ['low', 'medium', 'high', null], default: null },
    risk: { type: String, enum: ['low', 'medium', 'high', null], default: null },
    expectedAdditionalClicks: { type: Number, min: 0, default: null },
    expectedImpact: { type: ExpectedImpactSchema, default: () => ({}) },
    nextReview: { type: NextReviewSchema, default: null },
    version: { type: Number, min: 0, default: 0 },
    approvedAt: { type: Date, default: null },
    implementedAt: { type: Date, default: null },
    changeSummary: { type: String, maxlength: 2000, default: '' },
    implementationSnapshot: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    measurementWindow: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    measuringUntil: { type: Date, default: null },
    lastEvaluationAttemptAt: { type: Date, default: null },
    nextEvaluationAttemptAt: { type: Date, default: null, index: true },
    snoozedUntil: { type: Date, default: null },
    dismissedReason: { type: String, maxlength: 1000, default: '' },
    evaluation: {
      verdict: { type: String, enum: ['success', 'failed', 'inconclusive', null], default: null },
      evaluatedAt: { type: Date, default: null },
      reason: { type: String, maxlength: 2000, default: '' },
      ownerOverride: { type: Boolean, default: false },
    },
    failureCount: { type: Number, min: 0, default: 0 },
    suppressedUntil: { type: Date, default: null },
    historicalUnverified: { type: Boolean, default: false },
    detectorActive: { type: Boolean, default: true },
    lastDetectedAt: { type: Date, default: null },
    clearedAt: { type: Date, default: null },
    autoResolved: { type: Boolean, default: false },
    events: {
      type: [new mongoose.Schema({
        event: { type: String, required: true },
        at: { type: Date, default: Date.now },
        actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        fromState: { type: String, default: '' },
        toState: { type: String, default: '' },
        note: { type: String, maxlength: 2000, default: '' },
      }, { _id: false })],
      default: [],
    },
  },
  { timestamps: true, collection: 'seo_actions' }
);

SeoActionSchema.index({ fingerprint: 1, state: 1 }, { name: 'idx_seo_action_fingerprint_state' });
SeoActionSchema.index({ state: 1, priorityScore: -1, createdAt: -1 }, { name: 'idx_seo_action_queue' });
SeoActionSchema.index({ pageKey: 1, createdAt: -1 }, { name: 'idx_seo_action_page_history' });
SeoActionSchema.index(
  { experimentLockKey: 1 },
  { unique: true, sparse: true, name: 'uniq_seo_active_page_experiment' }
);
SeoActionSchema.index(
  { ownerPromotionKey: 1 },
  {
    unique: true,
    partialFilterExpression: { ownerPromotionKey: { $type: 'string' } },
    name: 'uniq_seo_owner_opportunity_promotion',
  }
);

module.exports = mongoose.model('SeoAction', SeoActionSchema);
module.exports.ACTION_TYPES = ACTION_TYPES;
module.exports.ACTION_STATES = ACTION_STATES;
