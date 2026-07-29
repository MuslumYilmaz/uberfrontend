'use strict';

const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const InterviewMonthlyQuotaSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    monthKey: { type: String, required: true, trim: true },
    requestIds: { type: [String], default: [] },
    systemDesignRequestIds: { type: [String], default: [] },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

InterviewMonthlyQuotaSchema.index(
  { userId: 1, monthKey: 1 },
  { unique: true, name: 'uniq_interview_quota_user_month' }
);
InterviewMonthlyQuotaSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: 'ttl_interview_quota_retention' }
);

module.exports = model('InterviewMonthlyQuota', InterviewMonthlyQuotaSchema);
