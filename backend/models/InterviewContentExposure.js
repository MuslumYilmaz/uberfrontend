'use strict';

const mongoose = require('mongoose');
const {
  applyInterviewExposureIndexContract,
} = require('../services/interview/exposure-index-contract');

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
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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
  {
    autoCreate: false,
    autoIndex: false,
    timestamps: true,
  }
);

applyInterviewExposureIndexContract(InterviewContentExposureSchema);

module.exports = model('InterviewContentExposure', InterviewContentExposureSchema);
