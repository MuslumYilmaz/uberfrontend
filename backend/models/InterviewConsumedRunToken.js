'use strict';

const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const InterviewConsumedRunTokenSchema = new Schema(
  {
    tokenId: { type: String, required: true, trim: true },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    variantId: { type: String, required: true, trim: true },
    draftHash: { type: String, required: true, trim: true },
    consumedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

InterviewConsumedRunTokenSchema.index(
  { tokenId: 1 },
  { unique: true, name: 'uniq_interview_consumed_run_token' }
);
InterviewConsumedRunTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: 'ttl_interview_consumed_run_token' }
);

module.exports = model('InterviewConsumedRunToken', InterviewConsumedRunTokenSchema);
