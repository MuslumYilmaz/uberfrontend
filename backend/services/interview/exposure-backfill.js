'use strict';

const InterviewSession = require('../../models/InterviewSession');
const InterviewContentExposure = require('../../models/InterviewContentExposure');
const {
  EXPOSURE_RETENTION_DAYS,
  buildExposurePayload,
} = require('./exposure');

const EXPOSURE_IDENTITY_FIELDS = Object.freeze([
  'userId', 'sessionId', 'format', 'track', 'level', 'selectionPolicyVersion',
  'mcq', 'coding', 'systemDesign', 'artifacts', 'exposedAt', 'expiresAt',
]);

function backfillPayloadForSession(session) {
  const format = session.format || 'coding';
  const codingConceptId = session.codingPrivate?.conceptId
    || session.codingVariant?.conceptId
    || session.codingVariant?.id;
  const systemDesignSource = session.systemDesignPrivate?.sourceEvidence || {};
  const systemDesignConceptId = systemDesignSource.conceptId
    || systemDesignSource.sourceContentId
    || session.systemDesignScenario?.conceptId
    || session.systemDesignScenario?.id;

  return buildExposurePayload({
    userId: session.userId,
    sessionId: session._id,
    format,
    track: session.track,
    level: session.level,
    selectedQuestions: session.questions || [],
    selectedCoding: format === 'coding' && session.codingVariant
      ? { ...session.codingVariant, conceptId: codingConceptId }
      : null,
    selectedSystemDesign: format === 'system-design' && session.systemDesignScenario
      ? {
        ...session.systemDesignScenario,
        conceptId: systemDesignConceptId,
        sourceContentId: systemDesignSource.sourceContentId || null,
      }
      : null,
    artifacts: {
      bank: format === 'coding' ? session.bank : null,
      coding: format === 'coding' ? session.codingRegistry : null,
      systemDesign: format === 'system-design' ? session.systemDesignRegistry : null,
    },
    now: session.createdAt,
  });
}

function objectIdString(value) {
  return String(value?._id || value || '');
}

function isoDate(value) {
  const date = new Date(value);
  return Number.isFinite(date.valueOf()) ? date.toISOString() : null;
}

function canonicalTask(task) {
  if (!task) return null;
  return {
    id: task.id || null,
    conceptId: task.conceptId || null,
    sourceContentId: task.sourceContentId || null,
    contentHash: task.contentHash || null,
  };
}

function canonicalArtifact(artifact) {
  if (!artifact) return null;
  return {
    id: artifact.id || null,
    version: artifact.version || null,
    contentHash: artifact.contentHash || null,
  };
}

function canonicalExposureIdentity(exposure = {}) {
  return {
    userId: objectIdString(exposure.userId),
    sessionId: objectIdString(exposure.sessionId),
    format: exposure.format || null,
    track: exposure.track || null,
    level: exposure.level || null,
    selectionPolicyVersion: Number(exposure.selectionPolicyVersion),
    mcq: (exposure.mcq || []).map((item) => ({
      id: item.id || null,
      revision: Number(item.revision),
      contentHash: item.contentHash || null,
      conceptId: item.conceptId || null,
    })),
    coding: canonicalTask(exposure.coding),
    systemDesign: canonicalTask(exposure.systemDesign),
    artifacts: {
      bank: canonicalArtifact(exposure.artifacts?.bank),
      coding: canonicalArtifact(exposure.artifacts?.coding),
      systemDesign: canonicalArtifact(exposure.artifacts?.systemDesign),
    },
    exposedAt: isoDate(exposure.exposedAt),
    expiresAt: isoDate(exposure.expiresAt),
  };
}

function sameExposureIdentity(left, right) {
  return JSON.stringify(canonicalExposureIdentity(left))
    === JSON.stringify(canonicalExposureIdentity(right));
}

function validateExposurePayload(payload, ExposureModel = InterviewContentExposure) {
  try {
    const document = new ExposureModel(payload);
    return document.validateSync() == null;
  } catch {
    return false;
  }
}

function createSessionCursor(SessionModel, cutoff) {
  return SessionModel.find({ createdAt: { $gte: cutoff } })
    .select('+codingPrivate +systemDesignPrivate')
    .sort({ createdAt: 1, _id: 1 })
    .lean()
    .cursor();
}

async function loadExistingExposures(ExposureModel, sessionIds) {
  if (!sessionIds.length) return [];
  return ExposureModel.find({ sessionId: { $in: sessionIds } })
    .select(EXPOSURE_IDENTITY_FIELDS.join(' '))
    .lean();
}

async function classifyBatch(entries, totals, ExposureModel) {
  const validEntries = [];
  for (const entry of entries) {
    if (!entry.payload || !validateExposurePayload(entry.payload, ExposureModel)) {
      totals.invalid += 1;
      continue;
    }
    totals.eligible += 1;
    validEntries.push(entry);
  }
  if (!validEntries.length) return;

  const existing = await loadExistingExposures(
    ExposureModel,
    validEntries.map(({ session }) => session._id)
  );
  const bySession = new Map();
  for (const exposure of existing) {
    const key = objectIdString(exposure.sessionId);
    const values = bySession.get(key) || [];
    values.push(exposure);
    bySession.set(key, values);
  }

  for (const entry of validEntries) {
    const records = bySession.get(objectIdString(entry.session._id)) || [];
    if (!records.length) {
      totals.wouldInsert += 1;
      continue;
    }
    if (records.length > 1) totals.duplicates += records.length - 1;
    if (records.every((record) => sameExposureIdentity(record, entry.payload))) {
      totals.alreadyPresent += 1;
    } else {
      totals.conflictingExisting += 1;
    }
  }
}

async function analyzeInterviewExposureBackfill({
  now = new Date(),
  batchSize = 250,
  SessionModel = InterviewSession,
  ExposureModel = InterviewContentExposure,
} = {}) {
  const safeBatchSize = Math.min(1000, Math.max(1, Number(batchSize) || 250));
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - EXPOSURE_RETENTION_DAYS);
  const totals = {
    dryRun: true,
    cutoff: cutoff.toISOString(),
    scanned: 0,
    eligible: 0,
    wouldInsert: 0,
    alreadyPresent: 0,
    conflictingExisting: 0,
    invalid: 0,
    duplicates: 0,
    inserted: 0,
  };
  let entries = [];

  const flush = async () => {
    if (!entries.length) return;
    await classifyBatch(entries, totals, ExposureModel);
    entries = [];
  };

  for await (const session of createSessionCursor(SessionModel, cutoff)) {
    totals.scanned += 1;
    let payload = null;
    try {
      payload = backfillPayloadForSession(session);
    } catch {
      // Aggregate counts only: never surface source document or payload details.
    }
    entries.push({ payload, session });
    if (entries.length >= safeBatchSize) await flush();
  }
  await flush();
  return totals;
}

async function flushOperations(operations, ExposureModel) {
  if (!operations.length) return { inserted: 0, matched: 0 };
  const result = await ExposureModel.bulkWrite(operations, { ordered: false });
  return {
    inserted: Number(result?.upsertedCount || 0),
    matched: Number(result?.matchedCount || 0),
  };
}

async function executeInterviewExposureBackfill({
  cutoff,
  batchSize,
  SessionModel,
  ExposureModel,
}) {
  let operations = [];
  const totals = { inserted: 0, matched: 0 };
  const flush = async () => {
    if (!operations.length) return;
    const result = await flushOperations(operations, ExposureModel);
    totals.inserted += result.inserted;
    totals.matched += result.matched;
    operations = [];
  };

  for await (const session of createSessionCursor(SessionModel, new Date(cutoff))) {
    const payload = backfillPayloadForSession(session);
    if (!validateExposurePayload(payload, ExposureModel)) {
      const error = new Error('Backfill payload became invalid after dry-run analysis');
      error.code = 'INTERVIEW_EXPOSURE_BACKFILL_STALE';
      throw error;
    }
    operations.push({
      updateOne: {
        filter: { sessionId: session._id },
        update: { $setOnInsert: payload },
        upsert: true,
      },
    });
    if (operations.length >= batchSize) await flush();
  }
  await flush();
  return totals;
}

async function backfillInterviewContentExposures({
  dryRun = true,
  approvedWouldInsert = null,
  now = new Date(),
  batchSize = 250,
  SessionModel = InterviewSession,
  ExposureModel = InterviewContentExposure,
} = {}) {
  const safeBatchSize = Math.min(1000, Math.max(1, Number(batchSize) || 250));
  const analysis = await analyzeInterviewExposureBackfill({
    now,
    batchSize: safeBatchSize,
    SessionModel,
    ExposureModel,
  });
  if (dryRun) return analysis;

  if (analysis.conflictingExisting || analysis.invalid || analysis.duplicates) {
    const error = new Error('Backfill execution blocked by conflicting, invalid, or duplicate data');
    error.code = 'INTERVIEW_EXPOSURE_BACKFILL_BLOCKED';
    error.counts = {
      conflictingExisting: analysis.conflictingExisting,
      duplicates: analysis.duplicates,
      invalid: analysis.invalid,
    };
    throw error;
  }
  if (!Number.isSafeInteger(approvedWouldInsert)
    || approvedWouldInsert !== analysis.wouldInsert) {
    const error = new Error('Backfill insert count changed after approval; run dry-run again');
    error.code = 'INTERVIEW_EXPOSURE_BACKFILL_COUNT_CHANGED';
    throw error;
  }

  const execution = await executeInterviewExposureBackfill({
    cutoff: analysis.cutoff,
    batchSize: safeBatchSize,
    SessionModel,
    ExposureModel,
  });
  return {
    ...analysis,
    dryRun: false,
    inserted: execution.inserted,
    executionMatched: execution.matched,
  };
}

module.exports = {
  EXPOSURE_IDENTITY_FIELDS,
  analyzeInterviewExposureBackfill,
  backfillInterviewContentExposures,
  backfillPayloadForSession,
  canonicalExposureIdentity,
  classifyBatch,
  executeInterviewExposureBackfill,
  flushOperations,
  sameExposureIdentity,
  validateExposurePayload,
};
