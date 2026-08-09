'use strict';

const mongoose = require('mongoose');

const SeoSyncStateSchema = new mongoose.Schema(
  {
    stateKey: { type: String, required: true, unique: true },
    siteUrl: { type: String, required: true },
    leaseToken: { type: String, default: null },
    leaseExpiresAt: { type: Date, default: null },
    recentCursorDate: { type: String, default: null },
    recentBackfillStartDate: { type: String, default: null },
    recentBackfillEndDate: { type: String, default: null },
    recentBackfillComplete: { type: Boolean, default: false },
    olderCursorDate: { type: String, default: null },
    refreshOffset: { type: Number, min: 0, max: 6, default: 0 },
    lastFinalizedDate: { type: String, default: null },
    lastSuccessfulSyncAt: { type: Date, default: null },
    lastError: { type: String, maxlength: 2000, default: '' },
    storageBytes: { type: Number, min: 0, default: null },
    storageLevel: { type: String, enum: ['unknown', 'ok', 'warning', 'detail_paused'], default: 'unknown' },
  },
  { timestamps: true, collection: 'seo_sync_states' }
);

module.exports = mongoose.model('SeoSyncState', SeoSyncStateSchema);
