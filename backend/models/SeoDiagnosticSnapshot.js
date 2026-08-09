'use strict';

const mongoose = require('mongoose');

const SeoDiagnosticSnapshotSchema = new mongoose.Schema(
  {
    siteUrl: { type: String, required: true },
    pageKey: { type: String, required: true },
    kind: { type: String, enum: ['country', 'urlInspection', 'liveMetadata'], required: true },
    observedAt: { type: Date, default: Date.now },
    data: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, collection: 'seo_diagnostic_snapshots' }
);

SeoDiagnosticSnapshotSchema.index({ pageKey: 1, kind: 1, observedAt: -1 }, { name: 'idx_seo_diagnostic_page_kind' });
SeoDiagnosticSnapshotSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'ttl_seo_diagnostic_90_days' });

module.exports = mongoose.model('SeoDiagnosticSnapshot', SeoDiagnosticSnapshotSchema);
