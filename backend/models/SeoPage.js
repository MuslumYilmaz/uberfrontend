'use strict';

const mongoose = require('mongoose');

const SeoIntentSchema = new mongoose.Schema(
  {
    targetKeyword: { type: String, trim: true, maxlength: 300, default: '' },
    intendedIntent: { type: String, trim: true, maxlength: 500, default: '' },
    readerPromise: { type: String, trim: true, maxlength: 1000, default: '' },
    source: { type: String, enum: ['manifest', 'explicit', 'derived', 'owner'], default: 'derived' },
    confirmed: { type: Boolean, default: false },
    confirmedAt: { type: Date, default: null },
  },
  { _id: false }
);

const SeoChangeTrackingSchema = new mongoose.Schema(
  {
    materialHash: { type: String, trim: true, maxlength: 128, default: '' },
    baselineSeededAt: { type: Date, default: null },
    materialChangedAt: { type: Date, default: null },
    analysisInvalidatedAt: { type: Date, default: null },
    materialChangeKind: { type: String, trim: true, maxlength: 80, default: 'baseline' },
    changedFields: { type: [String], default: [] },
    lastInspectionAt: { type: Date, default: null },
    lastGoogleCrawlAt: { type: Date, default: null },
    crawlConfirmationRequired: { type: Boolean, default: false },
    fingerprintVersion: { type: String, trim: true, maxlength: 80, default: '' },
    currentVersionKey: { type: String, trim: true, maxlength: 128, default: '' },
    currentOccurrenceKey: { type: String, trim: true, maxlength: 128, default: '' },
    analysisInputHash: { type: String, trim: true, maxlength: 128, default: '' },
    componentHashes: {
      title: { type: String, trim: true, maxlength: 128, default: '' },
      description: { type: String, trim: true, maxlength: 128, default: '' },
      h1: { type: String, trim: true, maxlength: 128, default: '' },
      body: { type: String, trim: true, maxlength: 128, default: '' },
      mainContent: { type: String, trim: true, maxlength: 128, default: '' },
      headingOutline: { type: String, trim: true, maxlength: 128, default: '' },
      intent: { type: String, trim: true, maxlength: 128, default: '' },
      internalLinks: { type: String, trim: true, maxlength: 128, default: '' },
      canonical: { type: String, trim: true, maxlength: 128, default: '' },
      robots: { type: String, trim: true, maxlength: 128, default: '' },
      indexability: { type: String, trim: true, maxlength: 128, default: '' },
      structuredData: { type: String, trim: true, maxlength: 128, default: '' },
    },
    // Last trustworthy observation per component. This survives a transient
    // prerender/metadata fallback so recovery can compare against the last
    // observed production value without treating a first-ever observation as
    // a proven change.
    trustedComponentHashes: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    fingerprintEvidence: {
      source: { type: String, trim: true, maxlength: 120, default: 'manifest_only' },
      prerenderedAvailable: { type: Boolean, default: false },
      limitations: { type: [String], default: [] },
      statuses: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
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
    lastObservedDeployment: {
      deploymentId: { type: String, trim: true, maxlength: 200, default: '' },
      observedAt: { type: Date, default: null },
      effectiveAt: { type: Date, default: null },
      precision: { type: String, enum: ['exact', 'upper_bound', 'unknown'], default: 'unknown' },
      source: { type: String, trim: true, maxlength: 80, default: 'unknown' },
      gitCommitSha: { type: String, trim: true, maxlength: 128, default: '' },
    },
    detectors: {
      ctr_snippet: { type: mongoose.Schema.Types.Mixed, default: null },
      intent_mismatch: { type: mongoose.Schema.Types.Mixed, default: null },
      content_decay: { type: mongoose.Schema.Types.Mixed, default: null },
      cannibalization: { type: mongoose.Schema.Types.Mixed, default: null },
      internal_link: { type: mongoose.Schema.Types.Mixed, default: null },
      technical_indexing: { type: mongoose.Schema.Types.Mixed, default: null },
    },
  },
  { _id: false }
);

const SeoPageSchema = new mongoose.Schema(
  {
    pageKey: { type: String, required: true, unique: true, immutable: true },
    canonicalUrl: { type: String, required: true, trim: true, maxlength: 2048 },
    renderedCanonicalUrl: { type: String, trim: true, maxlength: 2048, default: '' },
    path: { type: String, trim: true, maxlength: 2048, default: '' },
    family: { type: String, trim: true, maxlength: 120, default: 'unknown' },
    tech: { type: String, trim: true, maxlength: 120, default: '' },
    indexable: { type: Boolean, default: true },
    robots: { type: String, trim: true, maxlength: 500, default: '' },
    title: { type: String, trim: true, maxlength: 1000, default: '' },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    h1: { type: String, trim: true, maxlength: 1000, default: '' },
    contentUpdatedAt: { type: Date, default: null },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    manifestVersion: { type: String, trim: true, maxlength: 120, default: '' },
    manifest: {
      present: { type: Boolean, default: false },
      sourceHash: { type: String, default: '' },
      generatedAt: { type: Date, default: null },
    },
    outboundLinks: { type: [String], default: [] },
    outboundLinkEdges: { type: [mongoose.Schema.Types.Mixed], default: [] },
    intent: { type: SeoIntentSchema, default: () => ({}) },
    internalLinks: {
      inboundCount: { type: Number, min: 0, default: 0 },
      sourcePageKeys: { type: [String], default: [] },
      sourceEvidence: { type: [mongoose.Schema.Types.Mixed], default: [] },
      donorPageKeys: { type: [String], default: [] },
      graphHash: { type: String, trim: true, maxlength: 128, default: '' },
    },
    changeTracking: { type: SeoChangeTrackingSchema, default: () => ({}) },
  },
  { timestamps: true, collection: 'seo_pages' }
);

SeoPageSchema.index({ canonicalUrl: 1 }, { unique: true, name: 'uniq_seo_page_canonical_url' });
SeoPageSchema.index({ family: 1, 'intent.confirmed': 1 }, { name: 'idx_seo_page_family_intent' });
SeoPageSchema.index({ lastSeenAt: -1 }, { name: 'idx_seo_page_last_seen' });
SeoPageSchema.index(
  { 'changeTracking.crawlConfirmationRequired': 1, 'changeTracking.materialChangedAt': -1 },
  { name: 'idx_seo_page_pending_recrawl' }
);
SeoPageSchema.index(
  { 'changeTracking.detectors.ctr_snippet.crawlConfirmationRequired': 1,
    'changeTracking.detectors.intent_mismatch.crawlConfirmationRequired': 1,
    'changeTracking.detectors.content_decay.crawlConfirmationRequired': 1,
    'changeTracking.detectors.cannibalization.crawlConfirmationRequired': 1,
    'changeTracking.detectors.internal_link.crawlConfirmationRequired': 1 },
  { name: 'idx_seo_page_detector_pending_recrawl' }
);

module.exports = mongoose.model('SeoPage', SeoPageSchema);
