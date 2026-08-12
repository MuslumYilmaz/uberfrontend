'use strict';

const mongoose = require('mongoose');

const REVIEW_TTL_MS = 18 * 30 * 24 * 60 * 60 * 1000;
const REVIEW_REASON_CODES = [
  'none',
  'snippet_not_specific',
  'snippet_not_competitive',
  'content_depth_gap',
  'intent_misalignment',
  'source_preference',
  'serp_feature_competition',
  'insufficient_evidence',
];

const SeoOpportunityReviewSchema = new mongoose.Schema(
  {
    siteUrl: { type: String, required: true, trim: true, maxlength: 500 },
    pageKey: { type: String, required: true, trim: true, maxlength: 128 },
    assessmentInputHash: { type: String, required: true, trim: true, maxlength: 128 },
    opportunityKey: { type: String, required: true, trim: true, maxlength: 128 },
    observedAt: { type: Date, required: true },
    locale: { type: String, required: true, trim: true, maxlength: 20 },
    device: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown',
    },
    dominantResultType: {
      type: String,
      enum: ['official', 'community', 'publisher', 'mixed', 'unknown'],
      default: 'unknown',
    },
    serpFeatures: {
      type: [{
        type: String,
        enum: [
          'featured_snippet', 'ai_overview', 'people_also_ask', 'video',
          'forum', 'shopping', 'local', 'sitelinks', 'none', 'other',
        ],
      }],
      default: [],
    },
    ownResultStatus: {
      type: String,
      enum: ['not_visible', 'present_weak', 'present_competitive', 'unknown'],
      default: 'unknown',
    },
    outcome: {
      type: String,
      enum: ['no_change', 'snippet_test', 'content_test', 'needs_more_evidence'],
      required: true,
    },
    // Deliberately structured: arbitrary notes could contain raw queries,
    // competitor URLs, or copied SERP HTML. Those values must never enter the
    // review collection.
    reasonCode: {
      type: String,
      enum: REVIEW_REASON_CODES,
      default: 'none',
    },
    // A promotion transaction claims the exact review decision it validated.
    // Concurrent review replacement or revocation therefore cannot authorize
    // an action from a stale owner decision.
    promotionGuardRevision: { type: Number, min: 0, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + REVIEW_TTL_MS),
    },
  },
  { timestamps: true, collection: 'seo_opportunity_reviews' }
);

SeoOpportunityReviewSchema.index(
  { siteUrl: 1, pageKey: 1, assessmentInputHash: 1, opportunityKey: 1 },
  { unique: true, name: 'uniq_seo_opportunity_review' }
);
SeoOpportunityReviewSchema.index(
  { pageKey: 1, updatedAt: -1 },
  { name: 'idx_seo_opportunity_review_page' }
);
SeoOpportunityReviewSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: 'ttl_seo_opportunity_review_18_months' }
);

module.exports = mongoose.model('SeoOpportunityReview', SeoOpportunityReviewSchema);
module.exports.REVIEW_TTL_MS = REVIEW_TTL_MS;
module.exports.REVIEW_REASON_CODES = REVIEW_REASON_CODES;
