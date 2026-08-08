'use strict';

const mongoose = require('mongoose');

const SeoAnalysisCooldownSchema = new mongoose.Schema(
  {
    awaitingRecrawl: { type: Number, min: 0, default: 0 },
    observing: { type: Number, min: 0, default: 0 },
    directional: { type: Number, min: 0, default: 0 },
    eligible: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const SeoAnalysisRunSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['running', 'not_ready', 'partial', 'complete', 'failed'],
      default: 'not_ready',
    },
    reason: { type: String, trim: true, maxlength: 160, default: 'not_run' },
    ruleVersion: { type: String, trim: true, maxlength: 80, default: 'balanced-v2.1' },
    endDate: { type: String, match: /^\d{4}-\d{2}-\d{2}$/, default: null },
    windowDays: { type: Number, min: 1, max: 365, default: 28 },
    completedDays: { type: Number, min: 0, default: 0 },
    requiredDays: { type: Number, min: 1, default: 56 },
    evaluatedPages: { type: Number, min: 0, default: 0 },
    committedAssessmentPages: { type: Number, min: 0, default: 0 },
    totalPages: { type: Number, min: 0, default: 0 },
    eligiblePages: { type: Number, min: 0, default: 0 },
    proposedActions: { type: Number, min: 0, default: 0 },
    clearedActions: { type: Number, min: 0, default: 0 },
    cooldown: { type: SeoAnalysisCooldownSchema, default: () => ({}) },
    dataQualityBlockedPages: { type: Number, min: 0, default: 0 },
    decisionBlockedPages: { type: Number, min: 0, default: 0 },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { _id: false }
);

const SeoSyncRunSchema = new mongoose.Schema(
  {
    runId: { type: String, required: true, unique: true },
    siteUrl: { type: String, required: true },
    trigger: { type: String, enum: ['cron', 'manual', 'manual_analysis', 'test'], required: true },
    status: { type: String, enum: ['running', 'complete', 'partial', 'failed', 'skipped'], default: 'running' },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    datesAttempted: { type: [String], default: [] },
    datesCompleted: { type: [String], default: [] },
    rowsWritten: { type: Number, min: 0, default: 0 },
    truncated: { type: Boolean, default: false },
    detailSlicesSkipped: { type: Boolean, default: false },
    analysis: { type: SeoAnalysisRunSchema, default: () => ({}) },
    errorCode: { type: String, default: '' },
    errorMessage: { type: String, default: '' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, collection: 'seo_sync_runs' }
);

SeoSyncRunSchema.index({ startedAt: -1 }, { name: 'idx_seo_sync_run_started' });
SeoSyncRunSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'ttl_seo_sync_run_90_days' });

module.exports = mongoose.model('SeoSyncRun', SeoSyncRunSchema);
