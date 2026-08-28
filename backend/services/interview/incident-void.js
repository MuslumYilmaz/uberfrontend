'use strict';

const mongoose = require('mongoose');

const InterviewAbandonWindow = require('../../models/InterviewAbandonWindow');
const InterviewMonthlyQuota = require('../../models/InterviewMonthlyQuota');
const InterviewSession = require('../../models/InterviewSession');
const User = require('../../models/User');
const { emitInterviewEvent } = require('./telemetry');

const TECHNICAL_VOID_REASON_CODES = new Set([
  'content_integrity',
  'platform_outage',
  'preview_runtime',
  'runner_unavailable',
  'starter_unavailable',
]);
const MAX_BULK_VOID_SESSIONS = 500;

function incidentVoidError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeObjectIds(values, field, mongooseInstance = mongoose) {
  const normalized = [...new Set((Array.isArray(values) ? values : [values])
    .map((value) => String(value || '').trim())
    .filter(Boolean))];
  if (!normalized.length) {
    throw incidentVoidError('INTERVIEW_INCIDENT_VOID_EMPTY', `${field} is required`);
  }
  if (normalized.some((value) => !mongooseInstance.isValidObjectId(value))) {
    throw incidentVoidError('INTERVIEW_INCIDENT_VOID_INVALID_ID', `${field} contains an invalid id`);
  }
  return normalized.map((value) => new mongooseInstance.Types.ObjectId(value));
}

function validateIncidentVoidInput({ sessionIds, verifiedBy, reasonCode }, mongooseInstance) {
  const normalizedSessionIds = normalizeObjectIds(sessionIds, 'sessionIds', mongooseInstance);
  if (normalizedSessionIds.length > MAX_BULK_VOID_SESSIONS) {
    throw incidentVoidError(
      'INTERVIEW_INCIDENT_VOID_TOO_LARGE',
      `At most ${MAX_BULK_VOID_SESSIONS} sessions may be voided in one operation`
    );
  }
  const [normalizedVerifier] = normalizeObjectIds([verifiedBy], 'verifiedBy', mongooseInstance);
  const normalizedReason = String(reasonCode || '').trim().toLowerCase();
  if (!TECHNICAL_VOID_REASON_CODES.has(normalizedReason)) {
    throw incidentVoidError(
      'INTERVIEW_INCIDENT_VOID_INVALID_REASON',
      'reasonCode is not an approved technical-void reason'
    );
  }
  return {
    sessionIds: normalizedSessionIds,
    verifiedBy: normalizedVerifier,
    reasonCode: normalizedReason,
  };
}

function queryLean(query, mongoSession = null) {
  const scoped = mongoSession && typeof query.session === 'function'
    ? query.session(mongoSession)
    : query;
  return typeof scoped.lean === 'function' ? scoped.lean() : scoped;
}

async function loadExactSessions(SessionModel, sessionIds, mongoSession = null) {
  const sessions = await queryLean(
    SessionModel.find({ _id: { $in: sessionIds } }).select(
      '_id userId format status entitlementSnapshot'
    ),
    mongoSession
  );
  if (sessions.length !== sessionIds.length) {
    throw incidentVoidError(
      'INTERVIEW_INCIDENT_SESSIONS_NOT_FOUND',
      'One or more requested sessions do not exist; no changes were made'
    );
  }
  return sessions;
}

async function requireAdminVerifier(UserModel, verifiedBy, mongoSession = null) {
  const admin = await queryLean(
    UserModel.findOne({ _id: verifiedBy, role: 'admin' }).select('_id'),
    mongoSession
  );
  if (!admin) {
    throw incidentVoidError(
      'INTERVIEW_INCIDENT_VOID_INVALID_VERIFIER',
      'verifiedBy must identify an existing admin user'
    );
  }
}

function summarizeIncidentSessions(sessions) {
  const summary = {
    requested: sessions.length,
    matched: sessions.length,
    eligible: 0,
    alreadyVoided: 0,
    freeQuotaRefunds: 0,
    byStatus: {},
  };
  for (const session of sessions) {
    const status = String(session.status || 'unknown');
    summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;
    if (status === 'voided_technical') {
      summary.alreadyVoided += 1;
      continue;
    }
    summary.eligible += 1;
    if (
      session.entitlementSnapshot?.tier === 'free'
      && session.entitlementSnapshot?.quotaMonthKey
      && session.entitlementSnapshot?.quotaRequestId
    ) {
      summary.freeQuotaRefunds += 1;
    }
  }
  return summary;
}

async function voidOneSession(session, {
  AbandonWindowModel,
  MonthlyQuotaModel,
  SessionModel,
  mongoSession,
  now,
  reasonCode,
  verifiedBy,
}) {
  if (session.status === 'voided_technical') return { changed: false, quotaRestored: false };
  const update = await SessionModel.updateOne(
    { _id: session._id, status: { $ne: 'voided_technical' } },
    {
      $set: {
        active: false,
        status: 'voided_technical',
        completedAt: now,
        resultSnapshot: null,
        technicalVoid: {
          reasonCode,
          verifiedBy,
          verifiedAt: now,
        },
      },
      $inc: { __v: 1 },
    },
    { session: mongoSession }
  );
  if (Number(update.modifiedCount) !== 1) {
    throw incidentVoidError(
      'INTERVIEW_INCIDENT_VOID_CONFLICT',
      'A requested session changed during the incident operation; no changes were committed'
    );
  }

  await AbandonWindowModel.updateOne(
    { userId: session.userId },
    { $pull: { events: { sessionId: session._id } } },
    { session: mongoSession }
  );

  const quotaMonthKey = session.entitlementSnapshot?.quotaMonthKey;
  const quotaRequestId = session.entitlementSnapshot?.quotaRequestId;
  const quotaEligible = Boolean(
    session.entitlementSnapshot?.tier === 'free'
    && quotaMonthKey
    && quotaRequestId
  );
  let quotaRestored = false;
  if (quotaEligible) {
    const quotaField = (session.format || 'coding') === 'system-design'
      ? 'systemDesignRequestIds'
      : 'requestIds';
    const quotaUpdate = await MonthlyQuotaModel.updateOne(
      { userId: session.userId, monthKey: quotaMonthKey },
      { $pull: { [quotaField]: quotaRequestId } },
      { session: mongoSession }
    );
    quotaRestored = Number(quotaUpdate.modifiedCount) > 0;
  }
  return { changed: true, quotaRestored };
}

async function bulkTechnicalVoid({
  sessionIds,
  verifiedBy,
  reasonCode,
  dryRun = true,
  now = new Date(),
} = {}, {
  mongooseInstance = mongoose,
  models = {
    AbandonWindowModel: InterviewAbandonWindow,
    MonthlyQuotaModel: InterviewMonthlyQuota,
    SessionModel: InterviewSession,
    UserModel: User,
  },
} = {}) {
  const validated = validateIncidentVoidInput(
    { sessionIds, verifiedBy, reasonCode },
    mongooseInstance
  );
  await requireAdminVerifier(models.UserModel, validated.verifiedBy);
  const initial = await loadExactSessions(models.SessionModel, validated.sessionIds);
  const preview = summarizeIncidentSessions(initial);
  if (dryRun) return { dryRun: true, ...preview };

  const transaction = await mongooseInstance.startSession();
  let committedSummary;
  try {
    await transaction.withTransaction(async () => {
      await requireAdminVerifier(models.UserModel, validated.verifiedBy, transaction);
      const current = await loadExactSessions(
        models.SessionModel,
        validated.sessionIds,
        transaction
      );
      const summary = summarizeIncidentSessions(current);
      let changed = 0;
      let quotaRestored = 0;
      for (const session of current) {
        const result = await voidOneSession(session, {
          ...models,
          mongoSession: transaction,
          now: new Date(now),
          reasonCode: validated.reasonCode,
          verifiedBy: validated.verifiedBy,
        });
        if (result.changed) changed += 1;
        if (result.quotaRestored) quotaRestored += 1;
      }
      committedSummary = { ...summary, changed, quotaRestored };
    });
  } finally {
    await transaction.endSession();
  }

  emitInterviewEvent('technical_voided', {
    operation: 'bulk-technical-void',
    reasonCode: validated.reasonCode,
    count: committedSummary.changed,
    quotaRestored: committedSummary.quotaRestored > 0,
  });
  return { dryRun: false, ...committedSummary };
}

module.exports = {
  MAX_BULK_VOID_SESSIONS,
  TECHNICAL_VOID_REASON_CODES,
  bulkTechnicalVoid,
  summarizeIncidentSessions,
  validateIncidentVoidInput,
};
