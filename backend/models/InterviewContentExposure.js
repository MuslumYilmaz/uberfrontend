'use strict';

const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const ArtifactIdentitySchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    version: { type: String, required: true, trim: true },
    contentHash: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const McqExposureSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    revision: { type: Number, required: true, min: 1 },
    contentHash: { type: String, required: true, trim: true },
    conceptId: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const TaskExposureSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    conceptId: { type: String, required: true, trim: true },
    sourceContentId: { type: String, default: null, trim: true },
    contentHash: { type: String, default: null, trim: true },
  },
  { _id: false }
);

const InterviewContentExposureSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: true,
    },
    format: {
      type: String,
      enum: ['coding', 'system-design'],
      required: true,
    },
    track: {
      type: String,
      enum: ['core-web', 'react', 'angular', 'vue'],
      required: true,
    },
    level: {
      type: String,
      enum: ['junior', 'mid', 'senior'],
      required: true,
    },
    selectionPolicyVersion: { type: Number, required: true, min: 1 },
    mcq: { type: [McqExposureSchema], default: [] },
    coding: { type: TaskExposureSchema, default: null },
    systemDesign: { type: TaskExposureSchema, default: null },
    artifacts: {
      bank: { type: ArtifactIdentitySchema, default: null },
      coding: { type: ArtifactIdentitySchema, default: null },
      systemDesign: { type: ArtifactIdentitySchema, default: null },
    },
    exposedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

InterviewContentExposureSchema.index(
  { sessionId: 1 },
  { unique: true, name: 'uniq_interview_content_exposure_session' }
);
InterviewContentExposureSchema.index(
  { userId: 1, format: 1, track: 1, level: 1, exposedAt: -1 },
  { name: 'idx_interview_exposure_target_history' }
);
InterviewContentExposureSchema.index(
  { userId: 1, exposedAt: -1 },
  { name: 'idx_interview_exposure_user_history' }
);
InterviewContentExposureSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: 'ttl_interview_exposure_retention' }
);

module.exports = model('InterviewContentExposure', InterviewContentExposureSchema);
