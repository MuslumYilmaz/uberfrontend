'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');

const InterviewSession = require('../../models/InterviewSession');
const User = require('../../models/User');
const { isProEntitlementActive } = require('../billing/entitlements');
const {
  claimAbandonSlot,
  releaseAbandonSlot,
} = require('./abandon-limit');
const { interviewConfig } = require('./config');
const {
  loadInterviewArtifacts,
  loadSystemDesignArtifacts,
} = require('./artifacts');
const { readQuota, releaseQuota, reserveQuota } = require('./quota');
const {
  buildSystemDesignPresentationOrder,
  selectCodingVariant,
  selectQuestions,
  selectSystemDesignScenario,
} = require('./selection');
const {
  buildExposurePayload,
  loadSelectionContext,
  saveExposure,
  selectionOverlapTelemetry,
} = require('./exposure');
const {
  consumeRunnerToken,
  createRunnerToken,
  releaseRunnerTokenConsumption,
  verifyRunnerToken,
} = require('./runner-token');
const {
  abandonSession: transitionAbandon,
  addSeconds,
  evaluateMcqMutationAdmission,
  reconcileSession,
  startCoding: transitionStartCoding,
  submitCoding: transitionSubmitCoding,
  submitMcq: transitionSubmitMcq,
  submitSystemDesign: transitionSubmitSystemDesign,
  voidSessionTechnical: transitionVoidTechnical,
} = require('./state-machine');

const LEVELS = ['junior', 'mid', 'senior'];
const TRACKS = ['core-web', 'react', 'angular', 'vue'];
const TECHNICAL_VOID_REASON_CODES = new Set([
  'content_integrity',
  'platform_outage',
  'preview_runtime',
  'runner_unavailable',
  'starter_unavailable',
]);
const PRIVATE_SELECT = (
  '+answerKey +codingPrivate +systemDesignPrivate +systemDesignBaseline '
  + '+systemDesignRevealedClarificationIds +resultSnapshot'
);
const MAX_MUTATION_RECEIPTS = 100;
const MAX_AVAILABILITY_CACHE_ENTRIES = 8;
const availabilityMatrixCache = new Map();

class InterviewServiceError extends Error {
  constructor(statusCode, code, message, details = undefined) {
    super(message);
    this.name = 'InterviewServiceError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

function serviceError(statusCode, code, message, details) {
  throw new InterviewServiceError(statusCode, code, message, details);
}

function isTransactionUnsupportedError(error) {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('transaction numbers are only allowed on a replica set member')
    || message.includes('this mongodb deployment does not support retryable writes')
    || (message.includes('transaction') && message.includes('replica set'))
  );
}

function normalizeId(value, field, { min = 8, max = 120 } = {}) {
  const text = String(value || '').trim();
  if (
    text.length < min
    || text.length > max
    || !/^[A-Za-z0-9:_-]+$/.test(text)
  ) {
    serviceError(400, 'INTERVIEW_INVALID_REQUEST', `${field} is invalid`);
  }
  return text;
}

function normalizeSystemDesignSourceContentId(value) {
  if (value === undefined || value === null) return null;
  const text = typeof value === 'string' ? value.trim() : '';
  if (
    text.length < 1
    || text.length > 120
    || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(text)
  ) {
    serviceError(
      400,
      'INTERVIEW_SYSTEM_DESIGN_SOURCE_INVALID',
      'The requested System Design source question is invalid'
    );
  }
  return text;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value)
      .filter((key) => key !== 'mutationId')
      .sort()
      .map((key) => [key, stableValue(value[key])])
  );
}

function canonicalPayloadHash(value) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(stableValue(value)))
    .digest('hex');
}

function mutationPayloadHash(input) {
  const source = input && typeof input === 'object' ? input : {};
  return canonicalPayloadHash(Object.fromEntries(
    Object.entries(source).filter(([key]) => (
      !['mutationId', 'expectedVersion', 'version'].includes(key)
    ))
  ));
}

function mutationIdFor(input, operation) {
  if (input?.mutationId) return normalizeId(input.mutationId, 'mutationId');
  return `auto:${crypto
    .createHash('sha256')
    .update(operation)
    .update('\0')
    .update(JSON.stringify(stableValue(input || {})))
    .digest('hex')}`;
}

function normalizeSelection(
  levelRaw,
  trackRaw,
  timingModeRaw = 'standard',
  formatRaw = 'coding'
) {
  const level = String(levelRaw || '').trim().toLowerCase();
  const track = String(trackRaw || '').trim().toLowerCase();
  const timingMode = String(timingModeRaw || 'standard').trim().toLowerCase();
  const format = String(formatRaw || 'coding').trim().toLowerCase();
  if (!LEVELS.includes(level)) {
    serviceError(400, 'INTERVIEW_INVALID_LEVEL', 'Unsupported interview level');
  }
  if (!TRACKS.includes(track)) {
    serviceError(400, 'INTERVIEW_INVALID_TRACK', 'Unsupported interview track');
  }
  if (timingMode !== 'standard') {
    serviceError(400, 'INTERVIEW_INVALID_TIMING_MODE', 'Only standard timing is available');
  }
  if (!['coding', 'system-design'].includes(format)) {
    serviceError(400, 'INTERVIEW_INVALID_FORMAT', 'Unsupported interview format');
  }
  return { format, level, track, timingMode };
}

function entitlementSnapshot(user, now) {
  const entitlement = user?.entitlements?.pro || {};
  const premium = isProEntitlementActive(entitlement, now);
  return {
    tier: premium ? 'premium' : 'free',
    status: String(entitlement.status || 'none'),
    validUntil: entitlement.validUntil || null,
    capturedAt: now,
    quotaMonthKey: null,
    quotaRequestId: null,
  };
}

function receiptFor(session, mutationId) {
  return (session.mutationReceipts || []).find((receipt) => receipt.id === mutationId) || null;
}

function assertMutationAvailable(
  session,
  mutationId,
  operation,
  payloadHash,
  expectedVersion
) {
  const existing = receiptFor(session, mutationId);
  if (existing) {
    if (
      existing.operation !== operation
      || existing.payloadHash !== payloadHash
    ) {
      serviceError(
        409,
        'INTERVIEW_IDEMPOTENCY_CONFLICT',
        'Idempotency key was already used with a different request'
      );
    }
    return { replay: true };
  }
  const version = Number(expectedVersion);
  if (!Number.isInteger(version) || version < 0) {
    serviceError(400, 'INTERVIEW_INVALID_VERSION', 'A valid session version is required');
  }
  if (Number(session.__v || 0) !== version) {
    serviceError(
      409,
      'INTERVIEW_VERSION_CONFLICT',
      'Session changed in another tab',
      { currentVersion: Number(session.__v || 0) }
    );
  }
  return { replay: false };
}

function recordMutation(session, mutationId, operation, payloadHash, now) {
  session.mutationReceipts.push({
    id: mutationId,
    operation,
    payloadHash,
    recordedAt: now,
  });
  if (session.mutationReceipts.length > MAX_MUTATION_RECEIPTS) {
    session.mutationReceipts.splice(
      0,
      session.mutationReceipts.length - MAX_MUTATION_RECEIPTS
    );
  }
}

function assertCreateRequestMatches(session, requestHash) {
  if (session.createRequestHash !== requestHash) {
    serviceError(
      409,
      'INTERVIEW_IDEMPOTENCY_CONFLICT',
      'Idempotency key was already used with a different request'
    );
  }
}

function serializeCodingVariant(variant) {
  if (!variant) return null;
  return {
    id: variant.id,
    revision: variant.revision,
    contentHash: variant.contentHash,
    track: variant.track,
    level: variant.level,
    sourceQuestionId: variant.sourceQuestionId,
    sourceContentVersion: variant.sourceContentVersion,
    title: variant.title,
    prompt: variant.prompt,
    runner: variant.runner,
    timeLimitSeconds: variant.timeLimitSeconds,
    roundLimit: variant.roundLimit ?? null,
    starterAsset: variant.starterAsset || null,
    starterFiles: (variant.starterFiles || []).map((file) => ({
      path: file.path,
      content: file.content,
    })),
    publicRequirements: (variant.publicRequirements || []).map((requirement) => ({
      id: requirement.id,
      title: requirement.title,
      prompt: requirement.prompt || '',
      constraints: [...(requirement.constraints || [])],
    })),
  };
}

function serializeSystemDesignDraft(draft) {
  if (!draft) return null;
  return {
    currentStep: String(draft.currentStep || 'clarifications'),
    clarificationIds: [...(draft.clarificationIds || [])],
    priorityRequirementIds: [...(draft.priorityRequirementIds || [])],
    placements: (draft.placements || []).map((entry) => ({
      cardId: entry.cardId,
      laneId: entry.laneId,
      order: entry.order,
    })),
    connections: (draft.connections || []).map((entry) => ({
      fromCardId: entry.fromCardId,
      toCardId: entry.toCardId,
      typeId: entry.typeId,
    })),
    decisions: (draft.decisions || []).map((entry) => ({
      decisionId: entry.decisionId,
      optionId: entry.optionId,
      rationaleIds: [...(entry.rationaleIds || [])],
    })),
    twistResponseActionIds: [...(draft.twistResponseActionIds || [])],
    scratchpad: String(draft.scratchpad || ''),
    hash: draft.hash,
    updatedAt: new Date(draft.updatedAt).toISOString(),
  };
}

function collectRevealedClarificationIds(session, additionalIds = []) {
  const allowedIds = new Set(
    (session.systemDesignScenario?.clarifications || []).map((entry) => entry.id)
  );
  return [...new Set([
    ...(session.systemDesignRevealedClarificationIds || []),
    ...(session.systemDesignDraft?.clarificationIds || []),
    ...additionalIds,
  ])].filter((id) => allowedIds.has(id));
}

function orderedByPinnedIds(values, pinnedIds) {
  const source = Array.isArray(values) ? values : [];
  if (!Array.isArray(pinnedIds)) return source;
  const byId = new Map(source.map((entry) => [entry.id, entry]));
  const ordered = [];
  const seen = new Set();
  for (const id of pinnedIds) {
    const entry = byId.get(id);
    if (!entry || seen.has(id)) continue;
    seen.add(id);
    ordered.push(entry);
  }
  for (const entry of source) {
    if (!seen.has(entry.id)) ordered.push(entry);
  }
  return ordered;
}

function serializeSystemDesign(session) {
  if ((session.format || 'coding') !== 'system-design') return null;
  const scenario = session.systemDesignScenario || {};
  const presentation = session.systemDesignPresentationOrder || null;
  const decisionPresentation = new Map(
    (presentation?.decisions || []).map((entry) => [entry.decisionId, entry])
  );
  const selectedClarifications = new Set(
    session.systemDesignDraft?.clarificationIds || []
  );
  const answers = new Map(
    (session.systemDesignPrivate?.clarificationAnswers || []).map((entry) => [
      entry.clarificationId,
      entry.answer,
    ])
  );
  const revealed = Boolean(session.systemDesignTwistRevealedAt);
  return {
    scenario: {
      id: scenario.id,
      revision: scenario.revision,
      contentHash: scenario.contentHash,
      level: scenario.level,
      title: scenario.title,
      prompt: scenario.prompt,
      timeLimitSeconds: scenario.timeLimitSeconds,
      steps: scenario.steps || [],
      selectionLimits: scenario.selectionLimits || {},
      lanes: scenario.lanes || [],
      clarifications: orderedByPinnedIds(
        scenario.clarifications,
        presentation?.clarificationIds
      ),
      requirements: orderedByPinnedIds(
        scenario.requirements,
        presentation?.requirementIds
      ),
      cards: orderedByPinnedIds(scenario.cards, presentation?.cardIds),
      connectionTypes: scenario.connectionTypes || [],
      decisions: (scenario.decisions || []).map((decision) => {
        const order = decisionPresentation.get(decision.id);
        return {
          ...decision,
          options: orderedByPinnedIds(decision.options, order?.optionIds),
          rationales: orderedByPinnedIds(decision.rationales, order?.rationaleIds),
        };
      }),
    },
    clarificationAnswers: [...selectedClarifications]
      .filter((clarificationId) => answers.has(clarificationId))
      .map((clarificationId) => ({
        clarificationId,
        answer: answers.get(clarificationId),
      })),
    revealedClarificationIds: collectRevealedClarificationIds(session),
    twist: revealed
      ? {
        id: session.systemDesignPrivate?.twist?.id,
        title: session.systemDesignPrivate?.twist?.title,
        prompt: session.systemDesignPrivate?.twist?.prompt,
        responseActions: orderedByPinnedIds(
          session.systemDesignPrivate?.twist?.responseActions,
          presentation?.twistActionIds
        ),
      }
      : null,
    twistRevealed: revealed,
    baselineCaptured: Boolean(session.systemDesignBaseline),
    draft: serializeSystemDesignDraft(session.systemDesignDraft),
    outcome: session.systemDesignOutcome,
  };
}

function serializeSession(session, { now = new Date() } = {}) {
  const interviewFormat = session.format || 'coding';
  const codingVisible = ['coding_active', 'completed'].includes(session.status);
  const draft = codingVisible && session.codingDraft
    ? {
      language: session.codingDraft.language,
      files: (session.codingDraft.files || []).map((file) => ({
        path: file.path,
        content: file.content,
      })),
      hash: session.codingDraft.hash,
      updatedAt: new Date(session.codingDraft.updatedAt).toISOString(),
    }
    : null;
  return {
    id: String(session._id),
    protocolVersion: Number(session.protocolVersion || 1),
    format: interviewFormat,
    status: session.status,
    active: Boolean(session.active),
    version: Number(session.__v || 0),
    level: session.level,
    track: session.track,
    timingMode: session.timingMode,
    serverNow: new Date(now).toISOString(),
    bank: interviewFormat === 'coding'
      ? {
        id: session.bank.id,
        version: session.bank.version,
        contentHash: session.bank.contentHash,
      }
      : null,
    questions: (session.questions || []).map((question) => ({
      id: question.id,
      revision: question.revision,
      contentHash: question.contentHash,
      technology: question.technology,
      level: question.level,
      difficultyBand: question.difficultyBand,
      format: question.format,
      competency: question.competency,
      prompt: question.prompt,
      ...(question.code ? { code: question.code } : {}),
      ...(question.code && question.codeLanguage
        ? { codeLanguage: question.codeLanguage }
        : {}),
      estimatedSeconds: question.estimatedSeconds,
      options: question.options.map((option) => ({
        id: option.id,
        label: option.label,
      })),
    })),
    responses: (session.mcqResponses || []).map((response) => ({
      questionId: response.questionId,
      selectedOptionId: response.selectedOptionId || null,
      answeredAt: new Date(response.answeredAt).toISOString(),
    })),
    deadlines: {
      mcq: session.mcqDeadlineAt ? new Date(session.mcqDeadlineAt).toISOString() : null,
      codingReady: session.codingReadyDeadlineAt
        ? new Date(session.codingReadyDeadlineAt).toISOString()
        : null,
      coding: session.codingDeadlineAt
        ? new Date(session.codingDeadlineAt).toISOString()
        : null,
      systemDesign: session.systemDesignDeadlineAt
        ? new Date(session.systemDesignDeadlineAt).toISOString()
        : null,
    },
    coding: interviewFormat === 'coding' ? {
      available: session.status === 'coding_ready' || codingVisible,
      started: Boolean(session.codingStartedAt),
      variant: codingVisible ? serializeCodingVariant(session.codingVariant) : null,
      draft,
      checkRuns: codingVisible
        ? (session.codingCheckRuns || []).map((run) => ({
          mutationId: run.mutationId,
          draftHash: run.draftHash,
          evidenceSource: run.evidenceSource || 'client-self-report',
          authoritative: false,
          passedCount: run.passedCount,
          totalCount: run.totalCount,
          checks: run.checks.map((check) => ({ id: check.id, passed: check.passed })),
          ranAt: new Date(run.ranAt).toISOString(),
        }))
        : [],
      outcome: session.codingOutcome,
    } : null,
    systemDesign: serializeSystemDesign(session),
    entitlement: {
      tier: session.entitlementSnapshot.tier,
      capturedAt: new Date(session.entitlementSnapshot.capturedAt).toISOString(),
    },
    resultAvailable: session.status === 'completed',
    xpAwarded: 0,
  };
}

async function saveWithConflictHandling(session) {
  try {
    await session.save();
    return session;
  } catch (error) {
    if (error?.name === 'VersionError') {
      serviceError(409, 'INTERVIEW_VERSION_CONFLICT', 'Session changed in another tab');
    }
    throw error;
  }
}

function canonicalMutationDetails(session, now, extra = {}) {
  return {
    currentVersion: Number(session.__v || 0),
    session: serializeSession(session, { now }),
    ...extra,
  };
}

function v2ServiceError(session, now, statusCode, code, message, extra) {
  serviceError(
    statusCode,
    code,
    message,
    canonicalMutationDetails(session, now, extra)
  );
}

async function findOwnedSession(userId, sessionId) {
  if (!mongoose.isValidObjectId(sessionId)) {
    serviceError(404, 'INTERVIEW_SESSION_NOT_FOUND', 'Interview session not found');
  }
  const session = await InterviewSession.findOne({
    _id: sessionId,
    userId,
  }).select(PRIVATE_SELECT);
  if (!session) {
    serviceError(404, 'INTERVIEW_SESSION_NOT_FOUND', 'Interview session not found');
  }
  return session;
}

async function reconcileAndSave(session, now, config) {
  if (reconcileSession(session, now, config)) {
    await saveWithConflictHandling(session);
  }
  return session;
}

function answerSnapshotFor(artifacts, questions) {
  return questions.map((question) => {
    const answer = artifacts.bank.answerByKey.get(`${question.id}@${question.revision}`);
    if (!answer) {
      serviceError(503, 'INTERVIEW_CONTENT_UNAVAILABLE', 'Interview content is unavailable');
    }
    return {
      id: answer.id,
      revision: answer.revision,
      correctOptionId: answer.correctOptionId,
      explanation: answer.explanation,
      optionRationales: answer.optionRationales,
      remediationTopics: answer.remediationTopics,
    };
  });
}

function serializeActiveSessionSummary(session) {
  if (!session) return null;
  return {
    id: String(session._id),
    format: session.format || 'coding',
    status: session.status,
    level: session.level,
    track: session.track,
    updatedAt: new Date(session.updatedAt).toISOString(),
  };
}

function serializeRecentResultSummary(session) {
  return {
    id: String(session._id),
    format: session.format || 'coding',
    status: session.status,
    level: session.level,
    track: session.track,
    completedAt: new Date(
      session.completedAt || session.abandonedAt || session.updatedAt
    ).toISOString(),
    correct: Number(session.resultSnapshot?.mcq?.correct || 0),
    total: Number(session.resultSnapshot?.mcq?.total || 0),
    codingOutcome: session.resultSnapshot?.coding?.outcome || null,
    systemDesignOutcome: session.resultSnapshot?.systemDesign?.outcome || null,
    practiceSignal: session.resultSnapshot?.systemDesign?.practiceSignal || null,
    xpAwarded: 0,
  };
}

function availabilityMatrixFor({ artifacts, systemDesignArtifacts, config }) {
  const key = JSON.stringify({
    bank: artifacts.bank.contentHash,
    coding: artifacts.coding.contentHash,
    systemDesign: systemDesignArtifacts?.contentHash || null,
    mcqSecondsByLevel: config.mcqSecondsByLevel,
  });
  const cached = availabilityMatrixCache.get(key);
  if (cached) return cached;

  const availability = [];
  const systemDesignByLevel = new Map();
  for (const level of LEVELS) {
    let systemDesignAvailable = Boolean(systemDesignArtifacts);
    if (systemDesignAvailable) {
      try {
        selectSystemDesignScenario({
          scenarios: systemDesignArtifacts.scenarios,
          level,
          seed: `availability:system-design:${level}`,
        });
      } catch {
        systemDesignAvailable = false;
      }
    }
    systemDesignByLevel.set(level, systemDesignAvailable);

    for (const track of TRACKS) {
      let available = true;
      try {
        selectQuestions({
          questions: artifacts.bank.questions,
          track,
          level,
          maxEstimatedSeconds: config.mcqSecondsByLevel[level],
          seed: `availability:${track}:${level}`,
          targetExposureCount: 0,
          remainingHardExclusionMocks: 4,
        });
        selectCodingVariant({
          variants: artifacts.coding.variants,
          track,
          level,
          seed: `availability:${track}:${level}`,
        });
      } catch {
        available = false;
      }
      availability.push(Object.freeze({ format: 'coding', level, track, available }));
    }
  }
  const systemDesignAvailability = LEVELS.flatMap((level) => TRACKS.map((track) => (
    Object.freeze({
      format: 'system-design',
      level,
      track,
      available: systemDesignByLevel.get(level),
    })
  )));
  const matrix = Object.freeze({
    availability: Object.freeze(availability),
    systemDesignAvailability: Object.freeze(systemDesignAvailability),
  });
  availabilityMatrixCache.set(key, matrix);
  if (availabilityMatrixCache.size > MAX_AVAILABILITY_CACHE_ENTRIES) {
    availabilityMatrixCache.delete(availabilityMatrixCache.keys().next().value);
  }
  return matrix;
}

async function getResumeSummaryForUser(userId, { now = new Date() } = {}) {
  const active = await getActiveSession(userId, { now });
  const recentResults = await InterviewSession.find({
    userId,
    status: 'completed',
  })
    .sort({ completedAt: -1, createdAt: -1 })
    .limit(5)
    .select('+resultSnapshot')
    .lean();
  return {
    activeSession: serializeActiveSessionSummary(active),
    lastResults: recentResults.map(serializeRecentResultSummary),
  };
}

async function getConfigForUser(userId, {
  now = new Date(),
  allowCandidateArtifacts = false,
  allowSystemDesign = false,
} = {}) {
  const config = interviewConfig();
  const artifacts = loadInterviewArtifacts({
    allowInternalCandidate: allowCandidateArtifacts,
  });
  let systemDesignArtifacts = null;
  if (allowSystemDesign) {
    try {
      systemDesignArtifacts = loadSystemDesignArtifacts({
        allowInternalCandidate: allowCandidateArtifacts,
      });
    } catch {
      // The design registry is an independently gated enhancement. Its
      // availability must never make the existing Coding Mock unavailable.
    }
  }
  const user = await User.findById(userId).select('entitlements.pro').lean();
  if (!user) serviceError(404, 'USER_NOT_FOUND', 'User not found');
  const entitlement = entitlementSnapshot(user, now);
  const unlimitedQuota = {
    unlimited: true,
    monthKey: null,
    used: null,
    limit: null,
    remaining: null,
    resetAt: null,
  };
  const codingQuota = entitlement.tier === 'premium'
    ? unlimitedQuota
    : {
      unlimited: false,
      ...(await readQuota(userId, {
        now,
        limit: config.freeMonthlyLimit,
        format: 'coding',
      })),
    };
  const systemDesignQuota = entitlement.tier === 'premium'
    ? { ...unlimitedQuota }
    : {
      unlimited: false,
      ...(await readQuota(userId, {
        now,
        limit: config.systemDesignFreeMonthlyLimit,
        format: 'system-design',
      })),
    };
  const resumeSummary = await getResumeSummaryForUser(userId, { now });
  const { availability, systemDesignAvailability } = availabilityMatrixFor({
    artifacts,
    systemDesignArtifacts,
    config,
  });
  return {
    enabled: config.enabled,
    protocolVersion: 2,
    levels: LEVELS,
    tracks: TRACKS,
    timingModes: ['standard'],
    timing: {
      mcqSeconds: config.mcqSeconds,
      mcqSecondsByLevel: { ...config.mcqSecondsByLevel },
      mcqMaxIngressSeconds: config.mcqMaxIngressSeconds,
      codingReadySeconds: config.codingReadySeconds,
      systemDesignSeconds: { ...config.systemDesignSeconds },
    },
    quota: codingQuota,
    quotas: {
      coding: codingQuota,
      systemDesign: systemDesignQuota,
    },
    formats: [
      { id: 'coding', available: true },
      {
        id: 'system-design',
        available: Boolean(systemDesignArtifacts),
        ...(systemDesignArtifacts
          ? {}
          : { unavailableReason: 'System Design Mock is not currently available' }),
      },
    ],
    availability,
    systemDesignAvailability,
    ...resumeSummary,
    minViewportWidth: 768,
    xpAwarded: 0,
  };
}

async function createSession(userId, input, {
  now = new Date(),
  seed = crypto.randomBytes(24).toString('hex'),
  allowCandidateArtifacts = false,
  allowSystemDesign = false,
} = {}) {
  const config = interviewConfig();
  const requestId = normalizeId(input?.requestId, 'requestId');
  const {
    format,
    level,
    track,
    timingMode,
  } = normalizeSelection(
    input?.level,
    input?.track,
    input?.timingMode,
    input?.format
  );
  const systemDesignSourceContentId = normalizeSystemDesignSourceContentId(
    input?.systemDesignSourceContentId
  );
  if (systemDesignSourceContentId && format !== 'system-design') {
    serviceError(
      400,
      'INTERVIEW_SYSTEM_DESIGN_SOURCE_INVALID',
      'A System Design source question requires the System Design format'
    );
  }
  // Preserve the exact legacy coding idempotency hash. Explicitly passing the
  // new default format must replay a session created by an older client.
  const requestHash = canonicalPayloadHash(
    format === 'coding'
      ? { level, timingMode, track }
      : {
        format,
        level,
        timingMode,
        track,
        ...(systemDesignSourceContentId ? { systemDesignSourceContentId } : {}),
      }
  );

  let existing = await InterviewSession.findOne({ userId, createRequestId: requestId })
    .select(PRIVATE_SELECT);
  if (existing) {
    assertCreateRequestMatches(existing, requestHash);
    await reconcileAndSave(existing, now, config);
    return { session: existing, created: false };
  }
  if (format === 'system-design' && !allowSystemDesign) {
    serviceError(
      404,
      'INTERVIEW_SYSTEM_DESIGN_DISABLED',
      'System Design Mock is not currently available'
    );
  }

  const active = await InterviewSession.findOne({ userId, active: true }).select(PRIVATE_SELECT);
  if (active) {
    await reconcileAndSave(active, now, config);
    if (active.active) {
      serviceError(
        409,
        'INTERVIEW_ACTIVE_SESSION_EXISTS',
        'Finish or abandon the active interview first',
        { activeSessionId: String(active._id) }
      );
    }
  }

  const user = await User.findById(userId).select('entitlements.pro');
  if (!user) serviceError(404, 'USER_NOT_FOUND', 'User not found');
  const selectionContext = await loadSelectionContext(userId, {
    format,
    track,
    level,
  });
  const baseEntitlement = entitlementSnapshot(user, now);
  const expiresAt = addSeconds(now, config.retentionDays * 24 * 60 * 60);
  let buildDocument;
  let exposureSelection;
  let exposureArtifacts;
  let selectionTelemetry;
  if (format === 'coding') {
    const artifacts = loadInterviewArtifacts({
      allowInternalCandidate: allowCandidateArtifacts,
    });
    const selectedQuestions = selectQuestions({
      questions: artifacts.bank.questions,
      track,
      level,
      seenCounts: selectionContext.mcq.seenIds,
      seenConceptCounts: selectionContext.mcq.seenConceptIds,
      excludedIds: selectionContext.mcq.excludedIds,
      excludedConceptIds: selectionContext.mcq.excludedConceptIds,
      maxEstimatedSeconds: config.mcqSecondsByLevel[level],
      seed,
      targetExposureCount: selectionContext.targetExposureCount,
      remainingHardExclusionMocks: Math.max(
        0,
        4 - selectionContext.targetExposureCount
      ),
    });
    const selectedCoding = selectCodingVariant({
      variants: artifacts.coding.variants,
      track,
      level,
      seenCounts: selectionContext.coding.seenIds,
      seenConceptCounts: selectionContext.coding.seenConceptIds,
      excludedIds: selectionContext.coding.excludedIds,
      excludedConceptIds: selectionContext.coding.excludedConceptIds,
      seed,
    });
    const codingPrivate = artifacts.coding.privateByKey.get(
      `${selectedCoding.id}@${selectedCoding.revision}`
    );
    if (!codingPrivate) {
      serviceError(503, 'INTERVIEW_CONTENT_UNAVAILABLE', 'Interview content is unavailable');
    }
    const timingPolicy = {
      mcqSeconds: config.mcqSecondsByLevel[level],
      mcqMaxIngressSeconds: config.mcqMaxIngressSeconds,
      codingReadySeconds: config.codingReadySeconds,
      codingSeconds: selectedCoding.timeLimitSeconds,
      capturedAt: now,
    };
    const answerKey = answerSnapshotFor(artifacts, selectedQuestions);
    exposureSelection = { selectedQuestions, selectedCoding };
    exposureArtifacts = { bank: artifacts.bank, coding: artifacts.coding };
    selectionTelemetry = selectionOverlapTelemetry({
      format,
      context: selectionContext,
      selectedQuestions,
      selectedCoding,
    });
    buildDocument = (entitlement) => new InterviewSession({
      userId,
      protocolVersion: 2,
      createRequestId: requestId,
      createRequestHash: requestHash,
      active: true,
      format,
      status: 'mcq_active',
      level,
      track,
      timingMode,
      timingPolicy,
      selectionSeed: seed,
      bank: {
        id: artifacts.bank.id,
        version: artifacts.bank.version,
        contentHash: artifacts.bank.contentHash,
        status: artifacts.bank.status,
      },
      codingRegistry: {
        id: artifacts.coding.id,
        version: artifacts.coding.version,
        contentHash: artifacts.coding.contentHash,
        status: artifacts.coding.status,
      },
      entitlementSnapshot: entitlement,
      questions: selectedQuestions,
      answerKey,
      mcqResponses: [],
      mcqStartedAt: now,
      mcqDeadlineAt: addSeconds(now, timingPolicy.mcqSeconds),
      codingVariant: selectedCoding,
      codingPrivate,
      expiresAt,
    });
  } else {
    const artifacts = loadSystemDesignArtifacts({
      allowInternalCandidate: allowCandidateArtifacts,
    });
    const selectedScenario = selectSystemDesignScenario({
      scenarios: artifacts.scenarios,
      level,
      seenCounts: selectionContext.systemDesign.seenIds,
      seenConceptCounts: selectionContext.systemDesign.seenConceptIds,
      excludedIds: selectionContext.systemDesign.excludedIds,
      excludedConceptIds: selectionContext.systemDesign.excludedConceptIds,
      seed,
      sourceContentId: systemDesignSourceContentId,
      privateByKey: artifacts.privateByKey,
    });
    const systemDesignPrivate = artifacts.privateByKey.get(
      `${selectedScenario.id}@${selectedScenario.revision}`
    );
    if (!systemDesignPrivate) {
      serviceError(503, 'INTERVIEW_CONTENT_UNAVAILABLE', 'Interview content is unavailable');
    }
    const systemDesignPresentationOrder = buildSystemDesignPresentationOrder({
      scenario: selectedScenario,
      privateScenario: systemDesignPrivate,
      seed,
    });
    const designSeconds = Number(selectedScenario.timeLimitSeconds);
    exposureSelection = { selectedSystemDesign: selectedScenario };
    exposureArtifacts = { systemDesign: artifacts };
    selectionTelemetry = selectionOverlapTelemetry({
      format,
      context: selectionContext,
      selectedSystemDesign: selectedScenario,
    });
    buildDocument = (entitlement) => new InterviewSession({
      userId,
      protocolVersion: 2,
      createRequestId: requestId,
      createRequestHash: requestHash,
      active: true,
      format,
      status: 'system_design_active',
      level,
      track,
      timingMode,
      timingPolicy: {
        systemDesignSeconds: designSeconds,
        capturedAt: now,
      },
      selectionSeed: seed,
      systemDesignRegistry: {
        id: artifacts.id,
        version: artifacts.version,
        contentHash: artifacts.contentHash,
        status: artifacts.status,
      },
      entitlementSnapshot: entitlement,
      questions: [],
      answerKey: [],
      mcqResponses: [],
      systemDesignScenario: selectedScenario,
      systemDesignPresentationOrder,
      systemDesignPrivate,
      systemDesignRevealedClarificationIds: [],
      systemDesignStartedAt: now,
      systemDesignDeadlineAt: addSeconds(now, designSeconds),
      systemDesignOutcome: 'pending',
      expiresAt,
    });
  }

  let lastQuotaReservation = null;
  let lastCreatedDocument = null;
  const persistSession = async (mongoSession = null) => {
    const entitlement = { ...baseEntitlement };
    let quotaReservation = null;
    if (entitlement.tier === 'free') {
      quotaReservation = await reserveQuota(userId, requestId, {
        now,
        limit: format === 'system-design'
          ? config.systemDesignFreeMonthlyLimit
          : config.freeMonthlyLimit,
        session: mongoSession,
        format,
      });
      if (!quotaReservation.granted) {
        serviceError(
          403,
          'INTERVIEW_MONTHLY_QUOTA_EXHAUSTED',
          `Monthly free ${format === 'system-design' ? 'System Design' : 'Coding'} Mock quota is exhausted`,
          {
            monthKey: quotaReservation.monthKey,
            limit: quotaReservation.limit,
            resetAt: quotaReservation.resetAt,
          }
        );
      }
      entitlement.quotaMonthKey = quotaReservation.monthKey;
      entitlement.quotaRequestId = requestId;
    }
    lastQuotaReservation = quotaReservation;
    const document = buildDocument(entitlement);
    await document.save(mongoSession ? { session: mongoSession } : undefined);
    lastCreatedDocument = document;
    await saveExposure(buildExposurePayload({
      userId,
      sessionId: document._id,
      format,
      track,
      level,
      ...exposureSelection,
      artifacts: exposureArtifacts,
      now,
    }), { session: mongoSession });
    return { document, quotaReservation };
  };

  let persisted = null;
  let transactionUsed = false;
  try {
    const mongoSession = await mongoose.startSession();
    try {
      try {
        transactionUsed = true;
        await mongoSession.withTransaction(async () => {
          persisted = await persistSession(mongoSession);
        });
      } catch (error) {
        if (!isTransactionUnsupportedError(error)) throw error;
        transactionUsed = false;
        lastCreatedDocument = null;
        console.warn(
          '[interview] Mongo transactions unavailable; using compensated session creation.'
        );
        persisted = await persistSession();
      }
    } finally {
      await mongoSession.endSession();
    }
    if (!persisted?.document) {
      throw new Error('Interview session creation completed without a document');
    }
    return {
      session: persisted.document,
      created: true,
      selectionTelemetry,
    };
  } catch (error) {
    const quotaReservation = persisted?.quotaReservation || lastQuotaReservation;
    if (!transactionUsed && lastCreatedDocument?._id && !persisted?.document) {
      try {
        await InterviewSession.deleteOne({ _id: lastCreatedDocument._id, userId });
      } catch {
        serviceError(
          503,
          'INTERVIEW_EXPOSURE_RECOVERY_REQUIRED',
          'Interview start could not safely record content exposure; contact support'
        );
      }
    }
    const compensateUnusedReservation = async (winningSession = null) => {
      if (
        transactionUsed
        || !quotaReservation?.granted
        || quotaReservation.alreadyReserved
      ) {
        return;
      }
      const winnerUsesReservation = Boolean(
        winningSession
        && (winningSession.format || 'coding') === format
        && winningSession.entitlementSnapshot?.tier === 'free'
        && winningSession.entitlementSnapshot?.quotaMonthKey === quotaReservation.monthKey
        && winningSession.entitlementSnapshot?.quotaRequestId === requestId
      );
      if (winnerUsesReservation) return;
      try {
        await releaseQuota(
          userId,
          quotaReservation.monthKey,
          requestId,
          { format }
        );
      } catch {
        serviceError(
          503,
          'INTERVIEW_QUOTA_RECOVERY_REQUIRED',
          'Interview start could not be finalized; retry with the same request id'
        );
      }
    };
    if (error?.code === 11000) {
      existing = await InterviewSession.findOne({ userId, createRequestId: requestId })
        .select(PRIVATE_SELECT);
      if (existing) {
        await compensateUnusedReservation(existing);
        assertCreateRequestMatches(existing, requestHash);
        return { session: existing, created: false };
      }
    }
    if (
      !transactionUsed
      && quotaReservation?.granted
      && !quotaReservation.alreadyReserved
    ) {
      await compensateUnusedReservation();
    }
    if (error?.code === 11000) {
      const current = await InterviewSession.findOne({ userId, active: true }).lean();
      serviceError(
        409,
        'INTERVIEW_ACTIVE_SESSION_EXISTS',
        'Finish or abandon the active interview first',
        { activeSessionId: current ? String(current._id) : null }
      );
    }
    throw error;
  }
}

async function getActiveSession(userId, { now = new Date() } = {}) {
  const config = interviewConfig();
  const session = await InterviewSession.findOne({ userId, active: true })
    .select(PRIVATE_SELECT);
  if (!session) return null;
  await reconcileAndSave(session, now, config);
  return session.active ? session : null;
}

async function getSession(userId, sessionId, { now = new Date() } = {}) {
  const config = interviewConfig();
  const session = await findOwnedSession(userId, sessionId);
  return reconcileAndSave(session, now, config);
}

function sessionProtocolVersion(session) {
  return Number(session.protocolVersion || 1);
}

function v2ProcessingNow(options) {
  return options?.now ? new Date(options.now) : new Date();
}

function v2RequestTiming(options) {
  const fallback = v2ProcessingNow(options);
  const requestCompletedAt = options?.requestCompletedAt
    ? new Date(options.requestCompletedAt)
    : fallback;
  const requestReceivedAt = options?.requestReceivedAt
    ? new Date(options.requestReceivedAt)
    : requestCompletedAt;
  return { requestCompletedAt, requestReceivedAt };
}

function inspectV2Mutation(session, input, operation, now) {
  if (Number(input?.protocolVersion) !== 2) {
    v2ServiceError(
      session,
      now,
      400,
      'INTERVIEW_PROTOCOL_VERSION_REQUIRED',
      'Interview protocolVersion 2 is required for this session'
    );
  }
  let mutationId;
  try {
    mutationId = normalizeId(input?.mutationId, 'mutationId');
  } catch (error) {
    if (error instanceof InterviewServiceError) {
      error.details = canonicalMutationDetails(session, now);
    }
    throw error;
  }
  const expectedVersion = Number(input?.expectedVersion);
  if (!Number.isInteger(expectedVersion) || expectedVersion < 0) {
    v2ServiceError(
      session,
      now,
      400,
      'INTERVIEW_INVALID_VERSION',
      'A valid expectedVersion is required'
    );
  }
  const payloadHash = mutationPayloadHash(input);
  const existing = receiptFor(session, mutationId);
  if (existing) {
    if (
      existing.operation !== operation
      || existing.payloadHash !== payloadHash
    ) {
      v2ServiceError(
        session,
        now,
        409,
        'INTERVIEW_IDEMPOTENCY_CONFLICT',
        'Idempotency key was already used with a different request'
      );
    }
    return {
      expectedVersion,
      mutationId,
      payloadHash,
      replay: true,
    };
  }
  return {
    expectedVersion,
    mutationId,
    payloadHash,
    replay: false,
  };
}

function assertV2CurrentVersion(session, expectedVersion, now) {
  if (Number(session.__v || 0) !== expectedVersion) {
    v2ServiceError(
      session,
      now,
      409,
      'INTERVIEW_VERSION_CONFLICT',
      'Session changed in another tab'
    );
  }
}

async function reconcileV2Canonical(session, now, config) {
  let current = session;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (!reconcileSession(current, now, config)) return current;
    try {
      await current.save();
      return current;
    } catch (error) {
      if (error?.name !== 'VersionError') throw error;
      current = await findOwnedSession(current.userId, current._id);
    }
  }
  return current;
}

async function saveV2WithConflictHandling(session, now) {
  try {
    await session.save();
    return session;
  } catch (error) {
    if (error?.name === 'VersionError') {
      const current = await findOwnedSession(session.userId, session._id);
      v2ServiceError(
        current,
        now,
        409,
        'INTERVIEW_VERSION_CONFLICT',
        'Session changed in another tab'
      );
    }
    throw error;
  }
}

async function requireV2McqAdmission(session, timing, config, now) {
  const admission = evaluateMcqMutationAdmission(session, {
    ...timing,
    config,
  });
  if (admission.accepted) return admission;
  const canonical = await reconcileV2Canonical(session, now, config);
  const extra = {
    deadlineAt: Number.isFinite(admission.deadlineAt?.getTime())
      ? admission.deadlineAt.toISOString()
      : null,
    maxIngressSeconds: admission.maxIngressSeconds,
  };
  if (admission.code === 'INTERVIEW_MCQ_DEADLINE_PASSED') {
    v2ServiceError(
      canonical,
      now,
      409,
      admission.code,
      'MCQ mutation arrived after the server deadline',
      extra
    );
  }
  v2ServiceError(
    canonical,
    now,
    409,
    admission.code,
    'MCQ request body exceeded the allowed ingress window',
    extra
  );
}

function applyV2McqResponse(session, questionIdRaw, input, answeredAt, config, now) {
  const questionId = String(questionIdRaw || '').trim();
  const question = session.questions.find((item) => item.id === questionId);
  if (!question) {
    v2ServiceError(
      session,
      now,
      404,
      'INTERVIEW_QUESTION_NOT_FOUND',
      'Interview question not found'
    );
  }
  const rawOptionId = input?.optionId ?? input?.selectedOptionId;
  const selectedOptionId = rawOptionId == null
    ? null
    : String(rawOptionId).trim();
  if (
    selectedOptionId
    && !question.options.some((option) => option.id === selectedOptionId)
  ) {
    v2ServiceError(
      session,
      now,
      400,
      'INTERVIEW_INVALID_OPTION',
      'Option does not belong to this question'
    );
  }
  const rawResponseDurationMs = input?.responseDurationMs;
  let responseDurationMs = null;
  if (rawResponseDurationMs != null) {
    const parsedDuration = Number(rawResponseDurationMs);
    if (!Number.isFinite(parsedDuration) || parsedDuration < 0) {
      v2ServiceError(
        session,
        now,
        400,
        'INTERVIEW_INVALID_RESPONSE_DURATION',
        'Question response duration is invalid'
      );
    }
    responseDurationMs = Math.min(
      Math.round(parsedDuration),
      Number(
        session.timingPolicy?.mcqSeconds
        || config.mcqSecondsByLevel?.[session.level]
        || config.mcqSeconds
      ) * 1000
    );
  }
  const existing = session.mcqResponses.find((entry) => entry.questionId === questionId);
  if (existing) {
    existing.selectedOptionId = selectedOptionId;
    if (responseDurationMs != null) {
      existing.responseDurationMs = Math.max(
        Number(existing.responseDurationMs || 0),
        responseDurationMs
      );
    }
    existing.answeredAt = answeredAt;
  } else {
    session.mcqResponses.push({
      questionId,
      selectedOptionId,
      responseDurationMs,
      answeredAt,
    });
  }
}

function mergeV2McqSnapshot(session, responses, answeredAt, config, now) {
  if (!Array.isArray(responses) || responses.length > session.questions.length) {
    v2ServiceError(
      session,
      now,
      400,
      'INTERVIEW_INVALID_MCQ_SNAPSHOT',
      'responses must be a full or sparse MCQ response snapshot'
    );
  }
  const seen = new Set();
  for (const response of responses) {
    if (!response || typeof response !== 'object') {
      v2ServiceError(
        session,
        now,
        400,
        'INTERVIEW_INVALID_MCQ_SNAPSHOT',
        'MCQ snapshot entries must be objects'
      );
    }
    const questionId = String(response.questionId || '').trim();
    if (!questionId || seen.has(questionId)) {
      v2ServiceError(
        session,
        now,
        400,
        'INTERVIEW_INVALID_MCQ_SNAPSHOT',
        'MCQ snapshot question ids must be unique'
      );
    }
    seen.add(questionId);
    applyV2McqResponse(session, questionId, response, answeredAt, config, now);
  }
}

async function mutateSession(userId, sessionId, input, operation, mutator, {
  now = new Date(),
  existingSession = null,
} = {}) {
  const config = interviewConfig();
  const mutationId = mutationIdFor(input, operation);
  const payloadHash = mutationPayloadHash(input);
  const session = existingSession || await findOwnedSession(userId, sessionId);
  await reconcileAndSave(session, now, config);
  const availability = assertMutationAvailable(
    session,
    mutationId,
    operation,
    payloadHash,
    input?.expectedVersion ?? input?.version
  );
  if (availability.replay) return { session, replayed: true };
  let lifecycle = null;
  try {
    lifecycle = await mutator(session, { now, config, mutationId });
    recordMutation(session, mutationId, operation, payloadHash, now);
    await saveWithConflictHandling(session);
  } catch (error) {
    if (typeof lifecycle?.rollback === 'function') {
      try {
        await lifecycle.rollback();
      } catch {
        // A stuck consumed token is safer than allowing a replay. The user can
        // prepare a fresh run token after retrying the session read.
      }
    }
    throw error;
  }
  return { session, replayed: false };
}

async function saveMcqAnswer(userId, sessionId, questionIdRaw, input, options) {
  const questionId = String(questionIdRaw || '').trim();
  const session = await findOwnedSession(userId, sessionId);
  if (sessionProtocolVersion(session) >= 2) {
    const config = interviewConfig();
    const timing = v2RequestTiming(options);
    const inspectionNow = v2ProcessingNow(options);
    const operation = `mcq-answer:${questionId}`;
    const mutation = inspectV2Mutation(session, input, operation, inspectionNow);
    if (mutation.replay) {
      const canonical = await reconcileV2Canonical(
        session,
        v2ProcessingNow(options),
        config
      );
      return { session: canonical, replayed: true };
    }
    const admission = await requireV2McqAdmission(
      session,
      timing,
      config,
      inspectionNow
    );
    assertV2CurrentVersion(session, mutation.expectedVersion, inspectionNow);
    if (session.status !== 'mcq_active') {
      v2ServiceError(
        session,
        inspectionNow,
        409,
        'INTERVIEW_MCQ_LOCKED',
        'MCQ answers are locked'
      );
    }
    applyV2McqResponse(
      session,
      questionId,
      input,
      admission.acceptedAt,
      config,
      inspectionNow
    );
    recordMutation(
      session,
      mutation.mutationId,
      operation,
      mutation.payloadHash,
      admission.acceptedAt
    );
    // The admitted answer and its idempotency receipt are durable before any
    // deadline-driven stage reconciliation is attempted.
    await saveV2WithConflictHandling(session, v2ProcessingNow(options));
    const canonical = await reconcileV2Canonical(
      session,
      v2ProcessingNow(options),
      config
    );
    return { session: canonical, replayed: false };
  }
  return mutateSession(
    userId,
    sessionId,
    input,
    `mcq-answer:${questionId}`,
    async (session, { now, config }) => {
      if (session.status !== 'mcq_active') {
        serviceError(409, 'INTERVIEW_MCQ_LOCKED', 'MCQ answers are locked');
      }
      const question = session.questions.find((item) => item.id === questionId);
      if (!question) {
        serviceError(404, 'INTERVIEW_QUESTION_NOT_FOUND', 'Interview question not found');
      }
      const rawOptionId = input?.optionId ?? input?.selectedOptionId;
      const selectedOptionId = rawOptionId == null
        ? null
        : String(rawOptionId).trim();
      if (
        selectedOptionId
        && !question.options.some((option) => option.id === selectedOptionId)
      ) {
        serviceError(400, 'INTERVIEW_INVALID_OPTION', 'Option does not belong to this question');
      }
      const rawResponseDurationMs = input?.responseDurationMs;
      let responseDurationMs = null;
      if (rawResponseDurationMs != null) {
        const parsedDuration = Number(rawResponseDurationMs);
        if (!Number.isFinite(parsedDuration) || parsedDuration < 0) {
          serviceError(
            400,
            'INTERVIEW_INVALID_RESPONSE_DURATION',
            'Question response duration is invalid'
          );
        }
        responseDurationMs = Math.min(
          Math.round(parsedDuration),
          Number(
            session.timingPolicy?.mcqSeconds
            || config.mcqSecondsByLevel?.[session.level]
            || config.mcqSeconds
          ) * 1000
        );
      }
      const existing = session.mcqResponses.find((entry) => entry.questionId === questionId);
      if (existing) {
        existing.selectedOptionId = selectedOptionId;
        if (responseDurationMs != null) {
          existing.responseDurationMs = Math.max(
            Number(existing.responseDurationMs || 0),
            responseDurationMs
          );
        }
        existing.answeredAt = now;
      } else {
        session.mcqResponses.push({
          questionId,
          selectedOptionId,
          responseDurationMs,
          answeredAt: now,
        });
      }
    },
    { ...(options || {}), existingSession: session }
  );
}

async function submitMcq(userId, sessionId, input, options) {
  const session = await findOwnedSession(userId, sessionId);
  if (sessionProtocolVersion(session) >= 2) {
    const config = interviewConfig();
    const timing = v2RequestTiming(options);
    const inspectionNow = v2ProcessingNow(options);
    const operation = 'mcq-submit';
    const mutation = inspectV2Mutation(session, input, operation, inspectionNow);
    if (mutation.replay) {
      const canonical = await reconcileV2Canonical(
        session,
        v2ProcessingNow(options),
        config
      );
      return { session: canonical, replayed: true };
    }
    const admission = await requireV2McqAdmission(
      session,
      timing,
      config,
      inspectionNow
    );
    assertV2CurrentVersion(session, mutation.expectedVersion, inspectionNow);
    if (session.status !== 'mcq_active') {
      v2ServiceError(
        session,
        inspectionNow,
        409,
        'INTERVIEW_MCQ_LOCKED',
        'MCQ stage cannot be submitted'
      );
    }
    mergeV2McqSnapshot(
      session,
      input?.responses,
      admission.acceptedAt,
      config,
      inspectionNow
    );
    if (!transitionSubmitMcq(session, admission.acceptedAt, config)) {
      v2ServiceError(
        session,
        inspectionNow,
        409,
        'INTERVIEW_MCQ_LOCKED',
        'MCQ stage cannot be submitted'
      );
    }
    recordMutation(
      session,
      mutation.mutationId,
      operation,
      mutation.payloadHash,
      admission.acceptedAt
    );
    // Snapshot merge, state transition and receipt share one optimistic write.
    await saveV2WithConflictHandling(session, v2ProcessingNow(options));
    const canonical = await reconcileV2Canonical(
      session,
      v2ProcessingNow(options),
      config
    );
    return { session: canonical, replayed: false };
  }
  return mutateSession(
    userId,
    sessionId,
    input,
    'mcq-submit',
    async (session, { now, config }) => {
      if (!transitionSubmitMcq(session, now, config)) {
        serviceError(409, 'INTERVIEW_INVALID_STATE', 'MCQ stage cannot be submitted');
      }
    },
    { ...(options || {}), existingSession: session }
  );
}

async function startCoding(userId, sessionId, input, options) {
  return mutateSession(
    userId,
    sessionId,
    input,
    'coding-start',
    async (session, { now }) => {
      if (!transitionStartCoding(session, now)) {
        serviceError(409, 'INTERVIEW_INVALID_STATE', 'Coding stage cannot be started');
      }
    },
    options
  );
}

function normalizeDraft(input, config) {
  const language = String(input?.language || '').trim().toLowerCase();
  if (!/^[a-z][a-z0-9-]{0,31}$/.test(language)) {
    serviceError(400, 'INTERVIEW_INVALID_DRAFT', 'Draft language is invalid');
  }
  const filesRaw = Array.isArray(input?.files)
    ? input.files
    : Object.entries(input?.files || {}).map(([path, content]) => ({ path, content }));
  if (!filesRaw.length || filesRaw.length > config.maxDraftFiles) {
    serviceError(413, 'INTERVIEW_DRAFT_TOO_LARGE', 'Draft file count is outside the limit');
  }
  const seen = new Set();
  let totalBytes = 0;
  const files = filesRaw.map((file, index) => {
    const path = String(file?.path || '').trim().replace(/\\/g, '/');
    const parts = path.split('/');
    if (
      !path
      || path.length > 160
      || path.startsWith('/')
      || parts.some((part) => !part || part === '.' || part === '..')
      || /[\0\r\n]/.test(path)
      || seen.has(path)
    ) {
      serviceError(400, 'INTERVIEW_INVALID_DRAFT', `Draft file[${index}] path is invalid`);
    }
    seen.add(path);
    const content = String(file?.content == null ? '' : file.content);
    const bytes = Buffer.byteLength(content, 'utf8');
    if (bytes > config.maxDraftFileBytes) {
      serviceError(413, 'INTERVIEW_DRAFT_TOO_LARGE', `Draft file ${path} is too large`);
    }
    totalBytes += bytes + Buffer.byteLength(path, 'utf8');
    if (totalBytes > config.maxDraftTotalBytes) {
      serviceError(413, 'INTERVIEW_DRAFT_TOO_LARGE', 'Draft is too large');
    }
    return { path, content };
  }).sort((left, right) => left.path.localeCompare(right.path));
  const hash = crypto
    .createHash('sha256')
    .update(language)
    .update('\0')
    .update(files.map((file) => `${file.path}\0${file.content}`).join('\0'))
    .digest('hex');
  return { language, files, hash };
}

function draftArray(raw, field) {
  if (raw == null) return [];
  if (!Array.isArray(raw)) {
    serviceError(
      400,
      'INTERVIEW_INVALID_SYSTEM_DESIGN_DRAFT',
      `${field} must be an array`
    );
  }
  return raw;
}

function uniqueStringIds(raw, field, {
  max,
  allowed,
} = {}) {
  const values = draftArray(raw, field);
  if (max != null && values.length > max) {
    serviceError(413, 'INTERVIEW_SYSTEM_DESIGN_DRAFT_TOO_LARGE', `${field} exceeds its limit`);
  }
  const normalized = values.map((value) => String(value || '').trim());
  if (
    normalized.some((value) => !value || value.length > 120)
    || new Set(normalized).size !== normalized.length
    || (allowed && normalized.some((value) => !allowed.has(value)))
  ) {
    serviceError(400, 'INTERVIEW_INVALID_SYSTEM_DESIGN_DRAFT', `${field} is invalid`);
  }
  return normalized;
}

function normalizeSystemDesignDraft(input, session, config) {
  const scenario = session.systemDesignScenario || {};
  const limits = scenario.selectionLimits || {};
  const stepIds = new Set((scenario.steps || []).map((entry) => entry.id));
  const currentStep = String(
    input?.currentStep || scenario.steps?.[0]?.id || 'clarifications'
  ).trim();
  if (!stepIds.has(currentStep)) {
    serviceError(
      400,
      'INTERVIEW_INVALID_SYSTEM_DESIGN_DRAFT',
      'System Design step is invalid'
    );
  }
  const clarificationIds = uniqueStringIds(
    input?.clarificationIds,
    'clarificationIds',
    {
      max: Number(limits.clarifications || 0),
      allowed: new Set((scenario.clarifications || []).map((entry) => entry.id)),
    }
  );
  const priorityRequirementIds = uniqueStringIds(
    input?.priorityRequirementIds,
    'priorityRequirementIds',
    {
      max: Number(limits.priorities || 0),
      allowed: new Set((scenario.requirements || []).map((entry) => entry.id)),
    }
  );
  const cardById = new Map((scenario.cards || []).map((entry) => [entry.id, entry]));
  const laneIds = new Set((scenario.lanes || []).map((entry) => entry.id));
  const placementsRaw = draftArray(input?.placements, 'placements');
  if (placementsRaw.length > cardById.size) {
    serviceError(
      413,
      'INTERVIEW_SYSTEM_DESIGN_DRAFT_TOO_LARGE',
      'placements exceeds its limit'
    );
  }
  const placementCards = new Set();
  const laneOrders = new Set();
  const placements = placementsRaw.map((entry, index) => {
    const cardId = String(entry?.cardId || '').trim();
    const laneId = String(entry?.laneId || '').trim();
    const order = Number(entry?.order);
    const card = cardById.get(cardId);
    const laneOrderKey = `${laneId}:${order}`;
    if (
      !card
      || !laneIds.has(laneId)
      || !Number.isInteger(order)
      || order < 0
      || order >= cardById.size
      || placementCards.has(cardId)
      || laneOrders.has(laneOrderKey)
    ) {
      serviceError(
        400,
        'INTERVIEW_INVALID_SYSTEM_DESIGN_DRAFT',
        `placement[${index}] is invalid`
      );
    }
    placementCards.add(cardId);
    laneOrders.add(laneOrderKey);
    return { cardId, laneId, order };
  }).sort(
    (left, right) =>
      left.laneId.localeCompare(right.laneId)
      || left.order - right.order
      || left.cardId.localeCompare(right.cardId)
  );
  for (const lane of scenario.lanes || []) {
    const orders = placements
      .filter((placement) => placement.laneId === lane.id)
      .map((placement) => placement.order)
      .sort((left, right) => left - right);
    if (orders.some((order, index) => order !== index)) {
      serviceError(
        400,
        'INTERVIEW_INVALID_SYSTEM_DESIGN_DRAFT',
        `placements in lane ${lane.id} must use contiguous order values`
      );
    }
  }
  const connectionTypeIds = new Set(
    (scenario.connectionTypes || []).map((entry) => entry.id)
  );
  const maxConnections = Math.min(
    Number(limits.connections || 0),
    config.maxSystemDesignConnections
  );
  const connectionsRaw = draftArray(input?.connections, 'connections');
  if (connectionsRaw.length > maxConnections) {
    serviceError(
      413,
      'INTERVIEW_SYSTEM_DESIGN_DRAFT_TOO_LARGE',
      'connections exceeds its limit'
    );
  }
  const connectionKeys = new Set();
  const connections = connectionsRaw.map((entry, index) => {
    const fromCardId = String(entry?.fromCardId || '').trim();
    const toCardId = String(entry?.toCardId || '').trim();
    const typeId = String(entry?.typeId || '').trim();
    const key = `${fromCardId}\0${toCardId}\0${typeId}`;
    if (
      !placementCards.has(fromCardId)
      || !placementCards.has(toCardId)
      || fromCardId === toCardId
      || !connectionTypeIds.has(typeId)
      || connectionKeys.has(key)
    ) {
      serviceError(
        400,
        'INTERVIEW_INVALID_SYSTEM_DESIGN_DRAFT',
        `connection[${index}] is invalid`
      );
    }
    connectionKeys.add(key);
    return { fromCardId, toCardId, typeId };
  }).sort((left, right) => (
    left.fromCardId.localeCompare(right.fromCardId)
    || left.toCardId.localeCompare(right.toCardId)
    || left.typeId.localeCompare(right.typeId)
  ));
  const decisionById = new Map(
    (scenario.decisions || []).map((entry) => [entry.id, entry])
  );
  const decisionsRaw = draftArray(input?.decisions, 'decisions');
  if (decisionsRaw.length > decisionById.size) {
    serviceError(
      413,
      'INTERVIEW_SYSTEM_DESIGN_DRAFT_TOO_LARGE',
      'decisions exceeds its limit'
    );
  }
  const decisionIds = new Set();
  const decisions = decisionsRaw.map((entry, index) => {
    const decisionId = String(entry?.decisionId || '').trim();
    const optionId = String(entry?.optionId || '').trim();
    const definition = decisionById.get(decisionId);
    if (
      !definition
      || decisionIds.has(decisionId)
      || !definition.options.some((option) => option.id === optionId)
    ) {
      serviceError(
        400,
        'INTERVIEW_INVALID_SYSTEM_DESIGN_DRAFT',
        `decision[${index}] is invalid`
      );
    }
    decisionIds.add(decisionId);
    const rationaleValues = draftArray(
      entry?.rationaleIds,
      `decision[${index}].rationaleIds`
    );
    const rationaleLimit = Number(limits.rationalesPerDecision);
    if (
      Number.isInteger(rationaleLimit)
      && rationaleLimit >= 0
      && rationaleValues.length > rationaleLimit
    ) {
      serviceError(
        400,
        'INTERVIEW_INVALID_SYSTEM_DESIGN_DRAFT',
        `decision[${index}].rationaleIds exceeds its selection limit`
      );
    }
    const rationaleIds = uniqueStringIds(
      rationaleValues,
      `decision[${index}].rationaleIds`,
      {
        max: definition.rationales.length,
        allowed: new Set(definition.rationales.map((rationale) => rationale.id)),
      }
    );
    return { decisionId, optionId, rationaleIds: rationaleIds.sort() };
  }).sort((left, right) => left.decisionId.localeCompare(right.decisionId));
  const rawTwistResponseActionIds = draftArray(
    input?.twistResponseActionIds,
    'twistResponseActionIds'
  );
  if (
    !session.systemDesignTwistRevealedAt
    && rawTwistResponseActionIds.length > 0
  ) {
    serviceError(
      409,
      'INTERVIEW_SYSTEM_DESIGN_TWIST_LOCKED',
      'Reveal the production twist before selecting a response'
    );
  }
  const twistDefinition = session.systemDesignPrivate?.twist || {};
  const twistResponseActionIds = uniqueStringIds(
    rawTwistResponseActionIds,
    'twistResponseActionIds',
    {
      max: Number(limits.twistActions || 0),
      allowed: new Set(
        (twistDefinition.responseActions || []).map((entry) => entry.id)
      ),
    }
  ).sort();
  const scratchpad = String(input?.scratchpad || '');
  const scratchLimit = Math.min(
    Number(limits.scratchpadChars || 0),
    config.maxSystemDesignScratchpadChars
  );
  if ([...scratchpad].length > scratchLimit) {
    serviceError(
      413,
      'INTERVIEW_SYSTEM_DESIGN_DRAFT_TOO_LARGE',
      'scratchpad exceeds its limit'
    );
  }
  if (session.systemDesignBaseline) {
    if (
      JSON.stringify(clarificationIds)
        !== JSON.stringify(session.systemDesignBaseline.clarificationIds || [])
      || JSON.stringify(priorityRequirementIds)
        !== JSON.stringify(session.systemDesignBaseline.priorityRequirementIds || [])
    ) {
      serviceError(
        409,
        'INTERVIEW_SYSTEM_DESIGN_DISCOVERY_LOCKED',
        'Clarifications and priorities are locked after the production twist'
      );
    }
  }
  const value = {
    currentStep,
    clarificationIds,
    priorityRequirementIds,
    placements,
    connections,
    decisions,
    twistResponseActionIds,
    scratchpad,
  };
  return {
    ...value,
    hash: canonicalPayloadHash(value),
  };
}

function designBaselineFromDraft(draft) {
  if (!draft) return null;
  return {
    currentStep: draft.currentStep,
    clarificationIds: [...(draft.clarificationIds || [])],
    priorityRequirementIds: [...(draft.priorityRequirementIds || [])],
    placements: (draft.placements || []).map((entry) => ({ ...entry })),
    connections: (draft.connections || []).map((entry) => ({ ...entry })),
    decisions: (draft.decisions || []).map((entry) => ({
      ...entry,
      rationaleIds: [...(entry.rationaleIds || [])],
    })),
    twistResponseActionIds: [...(draft.twistResponseActionIds || [])],
    scratchpad: String(draft.scratchpad || ''),
  };
}

async function saveSystemDesignDraft(userId, sessionId, input, options) {
  return mutateSession(
    userId,
    sessionId,
    input,
    'system-design-draft',
    async (session, { now, config, mutationId }) => {
      if (
        (session.format || 'coding') !== 'system-design'
        || session.status !== 'system_design_active'
      ) {
        serviceError(409, 'INTERVIEW_INVALID_STATE', 'System Design draft cannot be updated');
      }
      const normalizedDraft = normalizeSystemDesignDraft(input, session, config);
      const revealedClarificationIds = collectRevealedClarificationIds(
        session,
        normalizedDraft.clarificationIds
      );
      if (
        revealedClarificationIds.length
        > Number(session.systemDesignScenario?.selectionLimits?.clarifications || 0)
      ) {
        serviceError(
          400,
          'INTERVIEW_SYSTEM_DESIGN_CLARIFICATION_LIMIT_REACHED',
          'This System Design round has reached its clarification limit'
        );
      }
      session.systemDesignRevealedClarificationIds = revealedClarificationIds;
      session.systemDesignDraft = {
        ...normalizedDraft,
        mutationId,
        updatedAt: now,
      };
      session.markModified('systemDesignRevealedClarificationIds');
      session.markModified('systemDesignDraft');
    },
    options
  );
}

async function revealSystemDesignTwist(userId, sessionId, input, options) {
  return mutateSession(
    userId,
    sessionId,
    input,
    'system-design-twist-reveal',
    async (session, { now }) => {
      if (
        (session.format || 'coding') !== 'system-design'
        || session.status !== 'system_design_active'
      ) {
        serviceError(409, 'INTERVIEW_INVALID_STATE', 'System Design twist cannot be revealed');
      }
      if (session.systemDesignTwistRevealedAt) {
        serviceError(
          409,
          'INTERVIEW_SYSTEM_DESIGN_TWIST_ALREADY_REVEALED',
          'System Design twist was already revealed'
        );
      }
      if (!session.systemDesignDraft) {
        serviceError(
          409,
          'INTERVIEW_SYSTEM_DESIGN_DRAFT_REQUIRED',
          'Save the initial design before revealing the production twist'
        );
      }
      const draftHash = String(input?.draftHash || '').trim();
      if (!draftHash || draftHash !== session.systemDesignDraft.hash) {
        serviceError(
          409,
          'INTERVIEW_DRAFT_HASH_MISMATCH',
          'Production twist is for a stale System Design draft'
        );
      }
      session.systemDesignRevealedClarificationIds = collectRevealedClarificationIds(session);
      session.systemDesignBaseline = designBaselineFromDraft(session.systemDesignDraft);
      session.systemDesignTwistRevealedAt = now;
      session.markModified('systemDesignRevealedClarificationIds');
      session.markModified('systemDesignBaseline');
    },
    options
  );
}

async function submitSystemDesign(userId, sessionId, input, options) {
  return mutateSession(
    userId,
    sessionId,
    input,
    'system-design-submit',
    async (session, { now }) => {
      if (
        (session.format || 'coding') !== 'system-design'
        || session.status !== 'system_design_active'
      ) {
        serviceError(409, 'INTERVIEW_INVALID_STATE', 'System Design stage cannot be submitted');
      }
      if (!session.systemDesignTwistRevealedAt || !session.systemDesignBaseline) {
        serviceError(
          409,
          'INTERVIEW_SYSTEM_DESIGN_TWIST_REQUIRED',
          'Reveal the production twist before submitting'
        );
      }
      const draftHash = String(input?.draftHash || '').trim();
      if (!draftHash || draftHash !== session.systemDesignDraft?.hash) {
        serviceError(
          409,
          'INTERVIEW_DRAFT_HASH_MISMATCH',
          'Submitted System Design draft is stale'
        );
      }
      if (!transitionSubmitSystemDesign(session, now)) {
        serviceError(409, 'INTERVIEW_INVALID_STATE', 'System Design stage cannot be submitted');
      }
    },
    options
  );
}

async function saveCodingDraft(userId, sessionId, input, options) {
  return mutateSession(
    userId,
    sessionId,
    input,
    'coding-draft',
    async (session, { now, config, mutationId }) => {
      if (session.status !== 'coding_active') {
        serviceError(409, 'INTERVIEW_INVALID_STATE', 'Coding draft cannot be updated');
      }
      const draft = normalizeDraft(input, config);
      session.codingDraft = {
        ...draft,
        mutationId,
        updatedAt: now,
      };
    },
    options
  );
}

function expectedCheckIds(session) {
  const groups = Array.isArray(session.codingPrivate?.rubric?.groups)
    ? session.codingPrivate.rubric.groups
    : [];
  return [...new Set(
    groups.flatMap((group) => (
      Array.isArray(group?.checkIds)
        ? group.checkIds.map((id) => String(id || '').trim()).filter(Boolean)
        : []
    ))
  )].sort();
}

function normalizeChecks(input, expectedIds) {
  const checksRaw = Array.isArray(input?.checks) ? input.checks : [];
  if (checksRaw.length > 100) {
    serviceError(413, 'INTERVIEW_CHECK_RUN_TOO_LARGE', 'Too many check results');
  }
  const seen = new Set();
  const checks = checksRaw.map((check, index) => {
    const id = String(check?.id || '').trim();
    if (!id || id.length > 120 || seen.has(id)) {
      serviceError(400, 'INTERVIEW_INVALID_CHECK_RUN', `Check[${index}] id is invalid`);
    }
    seen.add(id);
    if (typeof check?.passed !== 'boolean') {
      serviceError(400, 'INTERVIEW_INVALID_CHECK_RUN', `Check[${index}] passed is invalid`);
    }
    return { id, passed: check.passed };
  });
  const received = [...seen].sort();
  if (
    received.length !== expectedIds.length
    || received.some((id, index) => id !== expectedIds[index])
  ) {
    serviceError(
      400,
      'INTERVIEW_INVALID_CHECK_RUN',
      'Check results do not match the prepared runner contract'
    );
  }
  return checks;
}

async function prepareCodingCheckRun(userId, sessionId, input, {
  now = new Date(),
} = {}) {
  const config = interviewConfig();
  const session = await findOwnedSession(userId, sessionId);
  await reconcileAndSave(session, now, config);
  if (session.status !== 'coding_active' || !session.codingDraft) {
    serviceError(409, 'INTERVIEW_INVALID_STATE', 'Coding checks cannot be prepared');
  }
  const version = Number(input?.expectedVersion ?? input?.version);
  if (!Number.isInteger(version) || version !== Number(session.__v || 0)) {
    serviceError(
      409,
      'INTERVIEW_VERSION_CONFLICT',
      'Session changed in another tab',
      { currentVersion: Number(session.__v || 0) }
    );
  }
  const draftHash = String(input?.draftHash || '').trim();
  if (!draftHash || draftHash !== session.codingDraft.hash) {
    serviceError(409, 'INTERVIEW_DRAFT_HASH_MISMATCH', 'Check run is for a stale draft');
  }
  const ids = expectedCheckIds(session);
  if (!ids.length || !session.codingPrivate?.runnerConfig) {
    serviceError(503, 'INTERVIEW_RUNNER_UNAVAILABLE', 'Coding runner is unavailable');
  }
  const created = createRunnerToken({
    sessionId,
    userId,
    draftHash,
    variantId: session.codingVariant.id,
    now,
  });
  return {
    runToken: created.token,
    expiresAt: new Date(created.payload.exp * 1000).toISOString(),
    draftHash,
    expectedCheckIds: ids,
    runnerConfig: JSON.parse(JSON.stringify(session.codingPrivate.runnerConfig)),
    evidenceMode: 'client-self-report',
    authoritative: false,
    version: Number(session.__v || 0),
  };
}

async function recordCodingCheckRun(userId, sessionId, input, options) {
  return mutateSession(
    userId,
    sessionId,
    input,
    'coding-check-run',
    async (session, { now, config, mutationId }) => {
      if (session.status !== 'coding_active' || !session.codingDraft) {
        serviceError(409, 'INTERVIEW_INVALID_STATE', 'Coding checks cannot be recorded');
      }
      const draftHash = String(input?.draftHash || '').trim();
      if (draftHash !== session.codingDraft.hash) {
        serviceError(409, 'INTERVIEW_DRAFT_HASH_MISMATCH', 'Check run is for a stale draft');
      }
      const tokenPayload = verifyRunnerToken(input?.runToken, {
        sessionId,
        userId,
        draftHash,
        variantId: session.codingVariant.id,
        now,
      });
      if (!tokenPayload) {
        serviceError(400, 'INTERVIEW_INVALID_RUN_TOKEN', 'Check run token is invalid or expired');
      }
      if (session.codingCheckRuns.some((run) => run.runTokenId === tokenPayload.jti)) {
        serviceError(409, 'INTERVIEW_RUN_TOKEN_REUSED', 'Check run token was already completed');
      }
      const checks = normalizeChecks(input, expectedCheckIds(session));
      const consumedToken = await consumeRunnerToken(tokenPayload, {
        sessionId,
        userId,
        draftHash,
        variantId: session.codingVariant.id,
        now,
      });
      if (!consumedToken) {
        serviceError(409, 'INTERVIEW_RUN_TOKEN_REUSED', 'Check run token was already completed');
      }
      const passedCount = checks.filter((check) => check.passed).length;
      session.codingCheckRuns.push({
        runTokenId: tokenPayload.jti,
        mutationId,
        draftHash,
        evidenceSource: 'client-self-report',
        passedCount,
        totalCount: checks.length,
        checks,
        ranAt: now,
      });
      if (session.codingCheckRuns.length > config.maxCheckRuns) {
        session.codingCheckRuns.splice(
          0,
          session.codingCheckRuns.length - config.maxCheckRuns
        );
      }
      return {
        rollback: () => releaseRunnerTokenConsumption(consumedToken),
      };
    },
    options
  );
}

async function submitCoding(userId, sessionId, input, options) {
  return mutateSession(
    userId,
    sessionId,
    input,
    'coding-submit',
    async (session, { now }) => {
      if (session.status !== 'coding_active' || !session.codingDraft) {
        serviceError(409, 'INTERVIEW_INVALID_STATE', 'Coding stage cannot be submitted');
      }
      const draftHash = String(input?.draftHash || '').trim();
      if (!draftHash || draftHash !== session.codingDraft.hash) {
        serviceError(409, 'INTERVIEW_DRAFT_HASH_MISMATCH', 'Submitted draft is stale');
      }
      if (!transitionSubmitCoding(session, now, draftHash)) {
        serviceError(409, 'INTERVIEW_INVALID_STATE', 'Coding stage cannot be submitted');
      }
    },
    options
  );
}

async function abandonSession(userId, sessionId, input, options) {
  return mutateSession(
    userId,
    sessionId,
    input,
    'session-abandon',
    async (session, { now, config }) => {
      if (['completed', 'abandoned', 'voided_technical'].includes(session.status)) {
        serviceError(409, 'INTERVIEW_INVALID_STATE', 'Interview cannot be abandoned');
      }
      const claim = await claimAbandonSlot(userId, session._id, {
        limit: config.abandonRateLimitMax,
        now,
      });
      if (!claim.accepted) {
        serviceError(
          429,
          'INTERVIEW_ABANDON_RATE_LIMITED',
          'Too many interviews were abandoned in the last 24 hours',
          {
            retryAfter: claim.retryAfter?.toISOString() || null,
            windowSeconds: 24 * 60 * 60,
            limit: config.abandonRateLimitMax,
          }
        );
      }
      if (!transitionAbandon(session, now)) {
        if (!claim.replayed) {
          await releaseAbandonSlot(userId, session._id);
        }
        serviceError(409, 'INTERVIEW_INVALID_STATE', 'Interview cannot be abandoned');
      }
      return claim.replayed
        ? null
        : { rollback: () => releaseAbandonSlot(userId, session._id) };
    },
    options
  );
}

async function voidSessionTechnical(userId, sessionId, {
  now = new Date(),
} = {}) {
  const session = await findOwnedSession(userId, sessionId);
  const transitioned = transitionVoidTechnical(session, now);
  if (!transitioned && session.status !== 'voided_technical') return session;
  if (transitioned) await saveWithConflictHandling(session);
  if (
    session.entitlementSnapshot?.tier === 'free'
    && session.entitlementSnapshot?.quotaMonthKey
    && session.entitlementSnapshot?.quotaRequestId
  ) {
    await releaseQuota(
      userId,
      session.entitlementSnapshot.quotaMonthKey,
      session.entitlementSnapshot.quotaRequestId,
      { format: session.format || 'coding' }
    );
  }
  return session;
}

async function voidSessionTechnicalByAdmin(sessionId, {
  verifiedBy,
  reasonCode,
  now = new Date(),
} = {}) {
  if (!mongoose.isValidObjectId(sessionId)) {
    serviceError(404, 'INTERVIEW_SESSION_NOT_FOUND', 'Interview session not found');
  }
  const normalizedReason = String(reasonCode || '').trim().toLowerCase();
  if (!TECHNICAL_VOID_REASON_CODES.has(normalizedReason)) {
    serviceError(
      400,
      'INTERVIEW_INVALID_TECHNICAL_REASON',
      'Technical void reason is invalid'
    );
  }
  if (!mongoose.isValidObjectId(verifiedBy)) {
    serviceError(400, 'INTERVIEW_INVALID_VERIFIER', 'Technical verifier is invalid');
  }
  const session = await InterviewSession.findById(sessionId).select(PRIVATE_SELECT);
  if (!session) {
    serviceError(404, 'INTERVIEW_SESSION_NOT_FOUND', 'Interview session not found');
  }
  let transitioned = transitionVoidTechnical(session, now);
  if (!transitioned && ['completed', 'abandoned'].includes(session.status)) {
    session.status = 'voided_technical';
    session.active = false;
    session.completedAt = new Date(now);
    session.resultSnapshot = null;
    transitioned = true;
  }
  if (!transitioned && session.status !== 'voided_technical') {
    serviceError(409, 'INTERVIEW_INVALID_STATE', 'Interview cannot be technically voided');
  }
  if (transitioned) {
    session.technicalVoid = {
      reasonCode: normalizedReason,
      verifiedBy,
      verifiedAt: now,
    };
    await saveWithConflictHandling(session);
  }
  if (session.status === 'voided_technical') {
    await releaseAbandonSlot(session.userId, session._id);
  }
  if (
    session.entitlementSnapshot?.tier === 'free'
    && session.entitlementSnapshot?.quotaMonthKey
    && session.entitlementSnapshot?.quotaRequestId
  ) {
    await releaseQuota(
      session.userId,
      session.entitlementSnapshot.quotaMonthKey,
      session.entitlementSnapshot.quotaRequestId,
      { format: session.format || 'coding' }
    );
  }
  return session;
}

async function getResults(userId, sessionId, { now = new Date() } = {}) {
  const session = await getSession(userId, sessionId, { now });
  if (session.status === 'voided_technical') {
    serviceError(
      409,
      'INTERVIEW_SESSION_VOIDED',
      'This interview was voided because of a technical issue'
    );
  }
  if (session.status === 'abandoned') {
    serviceError(
      409,
      'INTERVIEW_SESSION_ABANDONED',
      'Answer review is not available for an abandoned interview'
    );
  }
  if (session.status !== 'completed') {
    serviceError(409, 'INTERVIEW_RESULTS_NOT_READY', 'Interview results are not ready');
  }
  if (!session.resultSnapshot) {
    serviceError(500, 'INTERVIEW_RESULTS_UNAVAILABLE', 'Interview results are unavailable');
  }
  return session.resultSnapshot;
}

module.exports = {
  InterviewServiceError,
  abandonSession,
  createSession,
  getActiveSession,
  getConfigForUser,
  getResumeSummaryForUser,
  getResults,
  getSession,
  normalizeDraft,
  normalizeSystemDesignDraft,
  prepareCodingCheckRun,
  recordCodingCheckRun,
  revealSystemDesignTwist,
  saveCodingDraft,
  saveMcqAnswer,
  saveSystemDesignDraft,
  serializeSession,
  startCoding,
  submitCoding,
  submitMcq,
  submitSystemDesign,
  voidSessionTechnical,
  voidSessionTechnicalByAdmin,
};
