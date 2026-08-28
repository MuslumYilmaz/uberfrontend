'use strict';

const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const AbandonEventSchema = new Schema(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: true,
    },
    abandonedAt: { type: Date, required: true },
  },
  { _id: false }
);

const InterviewAbandonWindowSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    events: { type: [AbandonEventSchema], default: [] },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

InterviewAbandonWindowSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: 'ttl_interview_abandon_window' }
);

module.exports = model('InterviewAbandonWindow', InterviewAbandonWindowSchema);
