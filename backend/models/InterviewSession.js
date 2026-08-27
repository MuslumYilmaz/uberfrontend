'use strict';

const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const OptionSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    label: { type: String, required: true },
  },
  { _id: false }
);

const QuestionSnapshotSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    revision: { type: Number, required: true, min: 1 },
    contentHash: { type: String, required: true, trim: true },
    technology: {
      type: String,
      enum: ['javascript', 'html', 'css', 'react', 'angular', 'vue'],
      required: true,
    },
    level: { type: String, enum: ['junior', 'mid', 'senior'], required: true },
    difficultyBand: {
      type: String,
      enum: ['foundation', 'core', 'stretch'],
      required: true,
    },
    format: {
      type: String,
      enum: ['conceptual', 'code-output', 'production-scenario'],
      required: true,
    },
    competency: { type: String, required: true, trim: true },
    prompt: { type: String, required: true },
    code: { type: String, default: null },
    codeLanguage: { type: String, default: null, trim: true },
    estimatedSeconds: { type: Number, required: true, min: 1 },
    options: {
      type: [OptionSchema],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length === 3;
        },
        message: 'Interview questions require exactly three options',
      },
      required: true,
    },
  },
  { _id: false }
);

const AnswerKeySchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    revision: { type: Number, required: true, min: 1 },
    correctOptionId: { type: String, required: true, trim: true },
    explanation: { type: String, default: '' },
    optionRationales: { type: [Schema.Types.Mixed], default: [] },
    remediationTopics: { type: [String], default: [] },
  },
  { _id: false }
);

const McqResponseSchema = new Schema(
  {
    questionId: { type: String, required: true, trim: true },
    selectedOptionId: { type: String, default: null },
    responseDurationMs: { type: Number, default: null, min: 0 },
    answeredAt: { type: Date, required: true },
  },
  { _id: false }
);

const StarterFileSchema = new Schema(
  {
    path: { type: String, required: true, trim: true },
    content: { type: String, required: true },
  },
  { _id: false }
);

const PublicRequirementSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    prompt: { type: String, default: '' },
    constraints: { type: [String], default: [] },
  },
  { _id: false }
);

const CodingVariantSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    revision: { type: Number, required: true, min: 1 },
    contentHash: { type: String, required: true, trim: true },
    track: {
      type: String,
      enum: ['core-web', 'react', 'angular', 'vue'],
      required: true,
    },
    level: { type: String, enum: ['junior', 'mid', 'senior'], required: true },
    sourceQuestionId: { type: String, required: true, trim: true },
    sourceContentVersion: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    prompt: { type: String, required: true },
    runner: { type: String, required: true, trim: true },
    timeLimitSeconds: { type: Number, required: true, min: 60 },
    roundLimit: { type: Number, default: null, min: 1 },
    starterAsset: { type: String, default: null, trim: true },
    starterFiles: { type: [StarterFileSchema], default: [] },
    publicRequirements: { type: [PublicRequirementSchema], default: [] },
  },
  { _id: false }
);

const DraftFileSchema = new Schema(
  {
    path: { type: String, required: true, trim: true },
    content: { type: String, required: true },
  },
  { _id: false }
);

const CodingDraftSchema = new Schema(
  {
    language: { type: String, required: true, trim: true },
    files: { type: [DraftFileSchema], default: [] },
    hash: { type: String, required: true, trim: true },
    mutationId: { type: String, required: true, trim: true },
    updatedAt: { type: Date, required: true },
  },
  { _id: false }
);

const CheckResultSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    passed: { type: Boolean, required: true },
  },
  { _id: false }
);

const CheckRunSchema = new Schema(
  {
    runTokenId: { type: String, required: true, trim: true },
    mutationId: { type: String, required: true, trim: true },
    draftHash: { type: String, required: true, trim: true },
    evidenceSource: {
      type: String,
      enum: ['client-self-report'],
      default: 'client-self-report',
      required: true,
    },
    passedCount: { type: Number, required: true, min: 0 },
    totalCount: { type: Number, required: true, min: 0 },
    checks: { type: [CheckResultSchema], default: [] },
    ranAt: { type: Date, required: true },
  },
  { _id: false }
);

const MutationReceiptSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    operation: { type: String, required: true, trim: true },
    payloadHash: { type: String, required: true, trim: true },
    recordedAt: { type: Date, required: true },
  },
  { _id: false }
);

const TimingPolicySchema = new Schema(
  {
    mcqSeconds: { type: Number, default: null, min: 60 },
    mcqMaxIngressSeconds: { type: Number, default: null, min: 1, max: 30 },
    codingReadySeconds: { type: Number, default: null, min: 30 },
    codingSeconds: { type: Number, default: null, min: 60 },
    systemDesignSeconds: { type: Number, default: null, min: 60 },
    capturedAt: { type: Date, required: true },
  },
  { _id: false }
);

const InterviewSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    protocolVersion: { type: Number, enum: [1, 2], default: 1, required: true },
    createRequestId: { type: String, required: true, trim: true },
    createRequestHash: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true, required: true },
    format: {
      type: String,
      enum: ['coding', 'system-design'],
      required: true,
      default: 'coding',
    },
    status: {
      type: String,
      enum: [
        'mcq_active',
        'coding_ready',
        'coding_active',
        'system_design_active',
        'completed',
        'abandoned',
        'voided_technical',
      ],
      required: true,
      default: 'mcq_active',
    },
    level: { type: String, enum: ['junior', 'mid', 'senior'], required: true },
    track: {
      type: String,
      enum: ['core-web', 'react', 'angular', 'vue'],
      required: true,
    },
    timingMode: { type: String, enum: ['standard'], default: 'standard', required: true },
    timingPolicy: { type: TimingPolicySchema, required: true },
    selectionSeed: {
      type: String,
      required: true,
      trim: true,
      select: false,
    },
    bank: {
      id: { type: String, default: null, trim: true },
      version: { type: String, default: null, trim: true },
      contentHash: { type: String, default: null, trim: true },
      status: {
        type: String,
        enum: ['candidate', 'editorial-gold', 'calibrated-gold'],
        default: null,
      },
    },
    codingRegistry: {
      id: { type: String, default: null, trim: true },
      version: { type: String, default: null, trim: true },
      contentHash: { type: String, default: null, trim: true },
      status: {
        type: String,
        enum: ['candidate', 'editorial-gold', 'calibrated-gold'],
        default: null,
      },
    },
    systemDesignRegistry: {
      id: { type: String, default: null, trim: true },
      version: { type: String, default: null, trim: true },
      contentHash: { type: String, default: null, trim: true },
      status: {
        type: String,
        enum: ['candidate', 'editorial-gold', 'calibrated-gold'],
        default: null,
      },
    },
    entitlementSnapshot: {
      tier: { type: String, enum: ['free', 'premium'], required: true },
      status: { type: String, required: true, trim: true },
      validUntil: { type: Date, default: null },
      capturedAt: { type: Date, required: true },
      quotaMonthKey: { type: String, default: null },
      quotaRequestId: { type: String, default: null },
    },
    questions: {
      type: [QuestionSnapshotSchema],
      default: [],
      validate: {
        validator(value) {
          return (
            Array.isArray(value)
            && (
              (this.format === 'system-design' && value.length === 0)
              || ((this.format || 'coding') === 'coding' && value.length === 5)
            )
          );
        },
        message: 'Interview session questions do not match the selected format',
      },
    },
    answerKey: {
      type: [AnswerKeySchema],
      default: [],
      select: false,
      validate: {
        validator(value) {
          return (
            Array.isArray(value)
            && (
              (this.format === 'system-design' && value.length === 0)
              || ((this.format || 'coding') === 'coding' && value.length === 5)
            )
          );
        },
        message: 'Interview session answer keys do not match the selected format',
      },
    },
    mcqResponses: { type: [McqResponseSchema], default: [] },
    mcqStartedAt: { type: Date, default: null },
    mcqDeadlineAt: { type: Date, default: null },
    mcqSubmittedAt: { type: Date, default: null },
    codingReadyAt: { type: Date, default: null },
    codingReadyDeadlineAt: { type: Date, default: null },
    codingVariant: { type: CodingVariantSchema, default: null },
    codingPrivate: {
      type: Schema.Types.Mixed,
      default: null,
      select: false,
    },
    codingStartedAt: { type: Date, default: null },
    codingDeadlineAt: { type: Date, default: null },
    codingDraft: { type: CodingDraftSchema, default: null },
    codingCheckRuns: { type: [CheckRunSchema], default: [] },
    codingOutcome: {
      type: String,
      enum: ['pending', 'submitted', 'timed_out', 'not_started_timeout', 'abandoned'],
      default: 'pending',
      required: true,
    },
    codingSubmittedAt: { type: Date, default: null },
    submittedDraftHash: { type: String, default: null },
    systemDesignScenario: {
      type: Schema.Types.Mixed,
      default: null,
    },
    systemDesignPresentationOrder: {
      type: Schema.Types.Mixed,
      default: null,
    },
    systemDesignPrivate: {
      type: Schema.Types.Mixed,
      default: null,
      select: false,
    },
    systemDesignDraft: {
      type: Schema.Types.Mixed,
      default: null,
    },
    systemDesignRevealedClarificationIds: {
      type: [String],
      default: [],
      select: false,
    },
    systemDesignBaseline: {
      type: Schema.Types.Mixed,
      default: null,
      select: false,
    },
    systemDesignStartedAt: { type: Date, default: null },
    systemDesignDeadlineAt: { type: Date, default: null },
    systemDesignTwistRevealedAt: { type: Date, default: null },
    systemDesignSubmittedAt: { type: Date, default: null },
    systemDesignOutcome: {
      type: String,
      enum: ['pending', 'submitted', 'timed_out', 'abandoned'],
      default: 'pending',
      required: true,
    },
    mutationReceipts: { type: [MutationReceiptSchema], default: [] },
    resultSnapshot: {
      type: Schema.Types.Mixed,
      default: null,
      select: false,
    },
    completedAt: { type: Date, default: null },
    abandonedAt: { type: Date, default: null },
    technicalVoid: {
      reasonCode: { type: String, default: null, trim: true },
      verifiedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      verifiedAt: { type: Date, default: null },
    },
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

function hasArtifactIdentity(value) {
  return Boolean(
    value?.id
    && value?.version
    && value?.contentHash
    && value?.status
  );
}

InterviewSessionSchema.pre('validate', function validateFormatContract(next) {
  const format = this.format || 'coding';
  if (format === 'coding') {
    if (
      !hasArtifactIdentity(this.bank)
      || !hasArtifactIdentity(this.codingRegistry)
      || !this.codingVariant
      || !this.mcqStartedAt
      || !this.mcqDeadlineAt
      || !Number(this.timingPolicy?.mcqSeconds)
      || (
        Number(this.protocolVersion || 1) >= 2
        && !Number(this.timingPolicy?.mcqMaxIngressSeconds)
      )
      || !Number(this.timingPolicy?.codingReadySeconds)
      || !Number(this.timingPolicy?.codingSeconds)
    ) {
      this.invalidate('format', 'Coding interview snapshot is incomplete');
    }
  } else if (
    !hasArtifactIdentity(this.systemDesignRegistry)
    || !this.systemDesignScenario
    || !this.systemDesignPrivate
    || !this.systemDesignStartedAt
    || !this.systemDesignDeadlineAt
    || !Number(this.timingPolicy?.systemDesignSeconds)
  ) {
    this.invalidate('format', 'System Design interview snapshot is incomplete');
  }
  next();
});

InterviewSessionSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { active: true },
    name: 'uniq_active_interview_per_user',
  }
);
InterviewSessionSchema.index(
  { userId: 1, createRequestId: 1 },
  { unique: true, name: 'uniq_interview_create_request' }
);
InterviewSessionSchema.index(
  { userId: 1, createdAt: -1 },
  { name: 'idx_interview_user_history' }
);
InterviewSessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: 'ttl_interview_retention' }
);

module.exports = model('InterviewSession', InterviewSessionSchema);
