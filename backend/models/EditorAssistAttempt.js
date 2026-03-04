const mongoose = require('mongoose');

const TTL_SECONDS = 45 * 24 * 60 * 60;

const EditorAssistAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    questionId: { type: String, required: true, trim: true },
    lang: { type: String, enum: ['js', 'ts'], required: true },
    ts: { type: Number, required: true, min: 0, index: true },
    passCount: { type: Number, required: true, min: 0 },
    totalCount: { type: Number, required: true, min: 0 },
    firstFailName: { type: String, default: '' },
    errorLine: { type: String, default: '' },
    signature: { type: String, required: true },
    codeHash: { type: String, default: '' },
    codeChanged: { type: Boolean, default: true },
    interviewMode: { type: Boolean, default: false },
    errorCategory: { type: String, default: 'unknown' },
    tags: { type: [String], default: [] },
    minuteBucket: { type: Number, required: true, min: 0 },
    recordKey: { type: String, required: true },
  },
  { timestamps: true }
);

EditorAssistAttemptSchema.index(
  { userId: 1, recordKey: 1 },
  { unique: true, name: 'uniq_editor_assist_user_record_key' }
);
EditorAssistAttemptSchema.index({ userId: 1, ts: -1 }, { name: 'idx_editor_assist_user_ts' });
EditorAssistAttemptSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: TTL_SECONDS, name: 'idx_editor_assist_ttl' }
);

module.exports = mongoose.model('EditorAssistAttempt', EditorAssistAttemptSchema);
