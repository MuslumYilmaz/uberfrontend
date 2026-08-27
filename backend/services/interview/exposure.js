'use strict';

const InterviewContentExposure = require('../../models/InterviewContentExposure');

const SELECTION_POLICY_VERSION = 2;
const EXPOSURE_RETENTION_DAYS = 365;
const FIRST_MOCKS_WITHOUT_REPEATS = 5;

function emptySelectionBucket() {
  return {
    seenIds: new Map(),
    seenConceptIds: new Map(),
    excludedIds: new Set(),
    excludedConceptIds: new Set(),
    adjacentIds: new Set(),
    adjacentConceptIds: new Set(),
  };
}

function addAdjacentMcq(bucket, exposure) {
  for (const item of exposure?.mcq || []) {
    if (item.id) bucket.adjacentIds.add(item.id);
    bucket.adjacentConceptIds.add(item.conceptId || item.id);
  }
}

function addAdjacentTask(bucket, task) {
  if (!task?.id) return;
  bucket.adjacentIds.add(task.id);
  bucket.adjacentConceptIds.add(task.conceptId || task.sourceContentId || task.id);
}

function updateSeen(map, id, exposedAt) {
  const key = String(id || '').trim();
  if (!key) return;
  const existing = map.get(key) || { count: 0, lastSeenAt: null };
  const nextTimestamp = new Date(exposedAt || 0);
  const existingTimestamp = new Date(existing.lastSeenAt || 0);
  map.set(key, {
    count: existing.count + 1,
    lastSeenAt: nextTimestamp > existingTimestamp ? nextTimestamp : existingTimestamp,
  });
}

function addMcqHistory(bucket, exposure, { exclude = false } = {}) {
  for (const item of exposure?.mcq || []) {
    updateSeen(bucket.seenIds, item.id, exposure.exposedAt);
    updateSeen(bucket.seenConceptIds, item.conceptId || item.id, exposure.exposedAt);
    if (exclude) {
      if (item.id) bucket.excludedIds.add(item.id);
      bucket.excludedConceptIds.add(item.conceptId || item.id);
    }
  }
}

function addTaskHistory(bucket, task, exposure, { exclude = false } = {}) {
  if (!task?.id) return;
  const conceptId = task.conceptId || task.sourceContentId || task.id;
  updateSeen(bucket.seenIds, task.id, exposure.exposedAt);
  updateSeen(bucket.seenConceptIds, conceptId, exposure.exposedAt);
  if (exclude) {
    bucket.excludedIds.add(task.id);
    bucket.excludedConceptIds.add(conceptId);
  }
}

function buildSelectionContextFromExposures({
  format,
  targetHistory = [],
  userCodingHistory = [],
}) {
  const mcq = emptySelectionBucket();
  const coding = emptySelectionBucket();
  const systemDesign = emptySelectionBucket();
  const hardTargetHistory = targetHistory.length < FIRST_MOCKS_WITHOUT_REPEATS
    ? targetHistory
    : targetHistory.slice(0, 1);
  const hardSessionIds = new Set(hardTargetHistory.map((entry) => String(entry.sessionId)));
  const adjacentTarget = targetHistory[0] || null;

  addAdjacentMcq(mcq, adjacentTarget);
  addAdjacentTask(coding, adjacentTarget?.coding);
  addAdjacentTask(systemDesign, adjacentTarget?.systemDesign);

  for (const exposure of targetHistory) {
    addMcqHistory(mcq, exposure, { exclude: hardSessionIds.has(String(exposure.sessionId)) });
    addTaskHistory(coding, exposure.coding, exposure, {
      exclude: hardSessionIds.has(String(exposure.sessionId)),
    });
    addTaskHistory(systemDesign, exposure.systemDesign, exposure, {
      exclude: hardSessionIds.has(String(exposure.sessionId)),
    });
  }

  // Coding concepts can be presented under different framework-specific IDs.
  // Excluding the user's immediately previous coding concept prevents a track
  // switch from bypassing the adjacent semantic-overlap gate.
  if (format === 'coding' && userCodingHistory[0]?.coding) {
    addAdjacentTask(coding, userCodingHistory[0].coding);
    addTaskHistory(coding, userCodingHistory[0].coding, userCodingHistory[0], {
      exclude: true,
    });
  }

  return {
    targetExposureCount: targetHistory.length,
    mcq,
    coding,
    systemDesign,
  };
}

function overlapCount(items, bucket) {
  const literal = new Set();
  const semantic = new Set();
  for (const item of items.filter(Boolean)) {
    if (bucket.adjacentIds.has(item.id)) literal.add(item.id);
    const conceptId = item.conceptId || item.sourceContentId || item.id;
    if (bucket.adjacentConceptIds.has(conceptId)) semantic.add(conceptId);
  }
  return { literal: literal.size, semantic: semantic.size };
}

function selectionOverlapTelemetry({
  format,
  context,
  selectedQuestions = [],
  selectedCoding = null,
  selectedSystemDesign = null,
}) {
  const targetExposureCount = Math.max(0, Number(context.targetExposureCount) || 0);
  const protectedWindow = targetExposureCount < FIRST_MOCKS_WITHOUT_REPEATS;
  if (format === 'system-design') {
    const overlap = overlapCount([selectedSystemDesign], context.systemDesign);
    return {
      count: selectedSystemDesign ? 1 : 0,
      literalOverlap: overlap.literal,
      semanticOverlap: overlap.semantic,
      selectionPolicyVersion: SELECTION_POLICY_VERSION,
      targetExposureCount,
      protectedWindow,
    };
  }
  const mcq = overlapCount(selectedQuestions, context.mcq);
  const coding = overlapCount([selectedCoding], context.coding);
  return {
    count: selectedQuestions.length + (selectedCoding ? 1 : 0),
    literalOverlap: mcq.literal + coding.literal,
    semanticOverlap: mcq.semantic + coding.semantic,
    selectionPolicyVersion: SELECTION_POLICY_VERSION,
    targetExposureCount,
    protectedWindow,
  };
}

async function loadSelectionContext(userId, { format, track, level }) {
  const [targetHistory, userCodingHistory] = await Promise.all([
    InterviewContentExposure.find({ userId, format, track, level })
      .sort({ exposedAt: -1 })
      .lean(),
    format === 'coding'
      ? InterviewContentExposure.find({ userId, format: 'coding', 'coding.id': { $exists: true } })
        .sort({ exposedAt: -1 })
        .limit(1)
        .lean()
      : Promise.resolve([]),
  ]);
  return buildSelectionContextFromExposures({
    format,
    targetHistory,
    userCodingHistory,
  });
}

function artifactIdentity(artifact) {
  if (!artifact) return null;
  return {
    id: artifact.id,
    version: artifact.version,
    contentHash: artifact.contentHash,
  };
}

function buildExposurePayload({
  userId,
  sessionId,
  format,
  track,
  level,
  selectedQuestions = [],
  selectedCoding = null,
  selectedSystemDesign = null,
  artifacts = {},
  now = new Date(),
}) {
  const exposedAt = new Date(now);
  const expiresAt = new Date(exposedAt);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + EXPOSURE_RETENTION_DAYS);
  return {
    userId,
    sessionId,
    format,
    track,
    level,
    selectionPolicyVersion: SELECTION_POLICY_VERSION,
    mcq: selectedQuestions.map((question) => ({
      id: question.id,
      revision: question.revision,
      contentHash: question.contentHash,
      conceptId: question.conceptId || question.id,
    })),
    coding: selectedCoding ? {
      id: selectedCoding.id,
      conceptId: selectedCoding.conceptId || selectedCoding.id,
      sourceContentId: selectedCoding.sourceQuestionId || null,
      contentHash: selectedCoding.contentHash || null,
    } : null,
    systemDesign: selectedSystemDesign ? {
      id: selectedSystemDesign.id,
      conceptId: selectedSystemDesign.conceptId
        || selectedSystemDesign.sourceContentId
        || selectedSystemDesign.id,
      sourceContentId: selectedSystemDesign.sourceContentId || null,
      contentHash: selectedSystemDesign.contentHash || null,
    } : null,
    artifacts: {
      bank: artifactIdentity(artifacts.bank),
      coding: artifactIdentity(artifacts.coding),
      systemDesign: artifactIdentity(artifacts.systemDesign),
    },
    exposedAt,
    expiresAt,
  };
}

async function saveExposure(payload, { session = null } = {}) {
  const document = new InterviewContentExposure(payload);
  await document.save(session ? { session } : undefined);
  return document;
}

module.exports = {
  EXPOSURE_RETENTION_DAYS,
  FIRST_MOCKS_WITHOUT_REPEATS,
  SELECTION_POLICY_VERSION,
  buildExposurePayload,
  buildSelectionContextFromExposures,
  loadSelectionContext,
  saveExposure,
  selectionOverlapTelemetry,
};
