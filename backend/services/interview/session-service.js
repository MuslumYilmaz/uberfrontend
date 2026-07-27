'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');

const InterviewSession = require('../../models/InterviewSession');
const User = require('../../models/User');
const { isProEntitlementActive } = require('../billing/entitlements');
const { interviewConfig } = require('./config');
const { loadInterviewArtifacts } = require('./artifacts');
const { readQuota, releaseQuota, reserveQuota } = require('./quota');
const {
  selectCodingVariant,
  selectQuestions,
} = require('./selection');
const {
  consumeRunnerToken,
  createRunnerToken,
  releaseRunnerTokenConsumption,
  verifyRunnerToken,
} = require('./runner-token');
const {
  abandonSession: transitionAbandon,
  addSeconds,
  reconcileSession,
  startCoding: transitionStartCoding,
  submitCoding: transitionSubmitCoding,
  submitMcq: transitionSubmitMcq,
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
const PRIVATE_SELECT = '+answerKey +codingPrivate +resultSnapshot';
const MAX_MUTATION_RECEIPTS = 100;

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

function normalizeSelection(levelRaw, trackRaw, timingModeRaw = 'standard') {
  const level = String(levelRaw || '').trim().toLowerCase();
  const track = String(trackRaw || '').trim().toLowerCase();
  const timingMode = String(timingModeRaw || 'standard').trim().toLowerCase();
  if (!LEVELS.includes(level)) {
    serviceError(400, 'INTERVIEW_INVALID_LEVEL', 'Unsupported interview level');
  }
  if (!TRACKS.includes(track)) {
    serviceError(400, 'INTERVIEW_INVALID_TRACK', 'Unsupported interview track');
  }
  if (timingMode !== 'standard') {
    serviceError(400, 'INTERVIEW_INVALID_TIMING_MODE', 'Only standard timing is available');
  }
  return { level, track, timingMode };
}

function entitlementSnapshot(user, now) {
  const entitlement = user?.entitlements?.pro || {};
  const premium = isProEntitlementActive(entitlement);
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

function serializeSession(session, { now = new Date() } = {}) {
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
    status: session.status,
    active: Boolean(session.active),
    version: Number(session.__v || 0),
    level: session.level,
    track: session.track,
    timingMode: session.timingMode,
    serverNow: new Date(now).toISOString(),
    bank: {
      id: session.bank.id,
      version: session.bank.version,
      contentHash: session.bank.contentHash,
    },
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
      mcq: new Date(session.mcqDeadlineAt).toISOString(),
      codingReady: session.codingReadyDeadlineAt
        ? new Date(session.codingReadyDeadlineAt).toISOString()
        : null,
      coding: session.codingDeadlineAt
        ? new Date(session.codingDeadlineAt).toISOString()
        : null,
    },
    coding: {
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
    },
    entitlement: {
      tier: session.entitlementSnapshot.tier,
      capturedAt: new Date(session.entitlementSnapshot.capturedAt).toISOString(),
    },
    resultAvailable: session.status === 'completed' || session.status === 'abandoned',
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

function updateSeenStat(map, id, at) {
  const existing = map.get(id) || { count: 0, lastSeenAt: null };
  const timestamp = new Date(at || 0);
  map.set(id, {
    count: existing.count + 1,
    lastSeenAt: (
      !existing.lastSeenAt || timestamp.getTime() > new Date(existing.lastSeenAt).getTime()
    ) ? timestamp : existing.lastSeenAt,
  });
}

async function loadSeenStats(userId) {
  const history = await InterviewSession.find({ userId })
    .select('questions.id codingVariant.id createdAt')
    .lean();
  const questions = new Map();
  const coding = new Map();
  for (const session of history) {
    for (const question of session.questions || []) {
      updateSeenStat(questions, question.id, session.createdAt);
    }
    if (session.codingVariant?.id) {
      updateSeenStat(coding, session.codingVariant.id, session.createdAt);
    }
  }
  return { questions, coding };
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

async function getConfigForUser(userId, {
  now = new Date(),
  allowCandidateArtifacts = false,
} = {}) {
  const config = interviewConfig();
  const artifacts = loadInterviewArtifacts({
    allowInternalCandidate: allowCandidateArtifacts,
  });
  const user = await User.findById(userId).select('entitlements.pro').lean();
  if (!user) serviceError(404, 'USER_NOT_FOUND', 'User not found');
  const entitlement = entitlementSnapshot(user, now);
  const quota = entitlement.tier === 'premium'
    ? {
      unlimited: true,
      monthKey: null,
      used: null,
      limit: null,
      remaining: null,
      resetAt: null,
    }
    : {
      unlimited: false,
      ...(await readQuota(userId, { now, limit: config.freeMonthlyLimit })),
    };
  const active = await getActiveSession(userId, { now });
  const recentResults = await InterviewSession.find({
    userId,
    status: { $in: ['completed', 'abandoned'] },
  })
    .sort({ completedAt: -1, abandonedAt: -1, createdAt: -1 })
    .limit(5)
    .select('+resultSnapshot')
    .lean();
  const availability = [];
  for (const level of LEVELS) {
    for (const track of TRACKS) {
      let available = true;
      try {
        selectQuestions({
          questions: artifacts.bank.questions,
          track,
          level,
          seed: `availability:${track}:${level}`,
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
      availability.push({ level, track, available });
    }
  }
  return {
    enabled: config.enabled,
    levels: LEVELS,
    tracks: TRACKS,
    timingModes: ['standard'],
    timing: {
      mcqSeconds: config.mcqSeconds,
      codingReadySeconds: config.codingReadySeconds,
    },
    quota,
    availability,
    activeSession: active
      ? {
        id: String(active._id),
        status: active.status,
        level: active.level,
        track: active.track,
        updatedAt: new Date(active.updatedAt).toISOString(),
      }
      : null,
    lastResults: recentResults.map((session) => ({
      id: String(session._id),
      status: session.status,
      level: session.level,
      track: session.track,
      completedAt: new Date(
        session.completedAt || session.abandonedAt || session.updatedAt
      ).toISOString(),
      correct: Number(session.resultSnapshot?.mcq?.correct || 0),
      total: Number(session.resultSnapshot?.mcq?.total || 0),
      codingOutcome: session.resultSnapshot?.coding?.outcome || null,
      xpAwarded: 0,
    })),
    minViewportWidth: 768,
    xpAwarded: 0,
  };
}

async function createSession(userId, input, {
  now = new Date(),
  seed = crypto.randomBytes(24).toString('hex'),
  allowCandidateArtifacts = false,
} = {}) {
  const config = interviewConfig();
  const requestId = normalizeId(input?.requestId, 'requestId');
  const { level, track, timingMode } = normalizeSelection(
    input?.level,
    input?.track,
    input?.timingMode
  );
  const requestHash = canonicalPayloadHash({ level, timingMode, track });

  let existing = await InterviewSession.findOne({ userId, createRequestId: requestId })
    .select(PRIVATE_SELECT);
  if (existing) {
    assertCreateRequestMatches(existing, requestHash);
    await reconcileAndSave(existing, now, config);
    return { session: existing, created: false };
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
  const artifacts = loadInterviewArtifacts({
    allowInternalCandidate: allowCandidateArtifacts,
  });
  const seen = await loadSeenStats(userId);
  const selectedQuestions = selectQuestions({
    questions: artifacts.bank.questions,
    track,
    level,
    seenCounts: seen.questions,
    seed,
  });
  const selectedCoding = selectCodingVariant({
    variants: artifacts.coding.variants,
    track,
    level,
    seenCounts: seen.coding,
    seed,
  });
  const codingPrivate = artifacts.coding.privateByKey.get(
    `${selectedCoding.id}@${selectedCoding.revision}`
  );
  if (!codingPrivate) {
    serviceError(503, 'INTERVIEW_CONTENT_UNAVAILABLE', 'Interview content is unavailable');
  }

  const baseEntitlement = entitlementSnapshot(user, now);
  const expiresAt = addSeconds(now, config.retentionDays * 24 * 60 * 60);
  const answerKey = answerSnapshotFor(artifacts, selectedQuestions);
  const timingPolicy = {
    mcqSeconds: config.mcqSeconds,
    codingReadySeconds: config.codingReadySeconds,
    codingSeconds: selectedCoding.timeLimitSeconds,
    capturedAt: now,
  };
  const buildDocument = (entitlement) => new InterviewSession({
      userId,
      createRequestId: requestId,
      createRequestHash: requestHash,
      active: true,
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

  let lastQuotaReservation = null;
  const persistSession = async (mongoSession = null) => {
    const entitlement = { ...baseEntitlement };
    let quotaReservation = null;
    if (entitlement.tier === 'free') {
      quotaReservation = await reserveQuota(userId, requestId, {
        now,
        limit: config.freeMonthlyLimit,
        session: mongoSession,
      });
      if (!quotaReservation.granted) {
        serviceError(
          403,
          'INTERVIEW_MONTHLY_QUOTA_EXHAUSTED',
          'Monthly free interview quota is exhausted',
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
    return { document, quotaReservation };
  };

  let persisted = null;
  let transactionUsed = false;
  try {
    if (baseEntitlement.tier === 'free') {
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
          console.warn(
            '[interview] Mongo transactions unavailable; using compensated quota reservation.'
          );
          persisted = await persistSession();
        }
      } finally {
        await mongoSession.endSession();
      }
    } else {
      persisted = await persistSession();
    }
    if (!persisted?.document) {
      throw new Error('Interview session creation completed without a document');
    }
    return { session: persisted.document, created: true };
  } catch (error) {
    if (error?.code === 11000) {
      existing = await InterviewSession.findOne({ userId, createRequestId: requestId })
        .select(PRIVATE_SELECT);
      if (existing) {
        assertCreateRequestMatches(existing, requestHash);
        return { session: existing, created: false };
      }
    }
    const quotaReservation = persisted?.quotaReservation || lastQuotaReservation;
    if (
      !transactionUsed
      && quotaReservation?.granted
      && !quotaReservation.alreadyReserved
    ) {
      try {
        await releaseQuota(userId, quotaReservation.monthKey, requestId);
      } catch {
        serviceError(
          503,
          'INTERVIEW_QUOTA_RECOVERY_REQUIRED',
          'Interview start could not be finalized; retry with the same request id'
        );
      }
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

async function mutateSession(userId, sessionId, input, operation, mutator, {
  now = new Date(),
} = {}) {
  const config = interviewConfig();
  const mutationId = mutationIdFor(input, operation);
  const payloadHash = mutationPayloadHash(input);
  const session = await findOwnedSession(userId, sessionId);
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
          Number(session.timingPolicy?.mcqSeconds || config.mcqSeconds) * 1000
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
    options
  );
}

async function submitMcq(userId, sessionId, input, options) {
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
    options
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
    async (session, { now }) => {
      if (!transitionAbandon(session, now)) {
        serviceError(409, 'INTERVIEW_INVALID_STATE', 'Interview cannot be abandoned');
      }
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
      session.entitlementSnapshot.quotaRequestId
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
  if (
    session.entitlementSnapshot?.tier === 'free'
    && session.entitlementSnapshot?.quotaMonthKey
    && session.entitlementSnapshot?.quotaRequestId
  ) {
    await releaseQuota(
      session.userId,
      session.entitlementSnapshot.quotaMonthKey,
      session.entitlementSnapshot.quotaRequestId
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
  if (!['completed', 'abandoned'].includes(session.status)) {
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
  getResults,
  getSession,
  normalizeDraft,
  prepareCodingCheckRun,
  recordCodingCheckRun,
  saveCodingDraft,
  saveMcqAnswer,
  serializeSession,
  startCoding,
  submitCoding,
  submitMcq,
  voidSessionTechnical,
  voidSessionTechnicalByAdmin,
};
