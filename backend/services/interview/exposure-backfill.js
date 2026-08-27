'use strict';

const InterviewSession = require('../../models/InterviewSession');
const InterviewContentExposure = require('../../models/InterviewContentExposure');
const {
  EXPOSURE_RETENTION_DAYS,
  buildExposurePayload,
} = require('./exposure');

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

async function flushOperations(operations, ExposureModel) {
  if (!operations.length) return { inserted: 0, matched: 0 };
  const result = await ExposureModel.bulkWrite(operations, { ordered: false });
  return {
    inserted: Number(result?.upsertedCount || 0),
    matched: Number(result?.matchedCount || 0),
  };
}

async function backfillInterviewContentExposures({
  dryRun = true,
  now = new Date(),
  batchSize = 250,
  SessionModel = InterviewSession,
  ExposureModel = InterviewContentExposure,
} = {}) {
  const safeBatchSize = Math.min(1000, Math.max(1, Number(batchSize) || 250));
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - EXPOSURE_RETENTION_DAYS);
  const cursor = SessionModel.find({ createdAt: { $gte: cutoff } })
    .select('+codingPrivate +systemDesignPrivate')
    .sort({ createdAt: 1, _id: 1 })
    .lean()
    .cursor();
  const totals = {
    dryRun: Boolean(dryRun),
    cutoff: cutoff.toISOString(),
    scanned: 0,
    eligible: 0,
    inserted: 0,
    alreadyPresent: 0,
  };
  let operations = [];

  const flush = async () => {
    if (dryRun || !operations.length) {
      operations = [];
      return;
    }
    const result = await flushOperations(operations, ExposureModel);
    totals.inserted += result.inserted;
    totals.alreadyPresent += result.matched;
    operations = [];
  };

  for await (const session of cursor) {
    totals.scanned += 1;
    const payload = backfillPayloadForSession(session);
    totals.eligible += 1;
    operations.push({
      updateOne: {
        filter: { sessionId: session._id },
        update: { $setOnInsert: payload },
        upsert: true,
      },
    });
    if (operations.length >= safeBatchSize) await flush();
  }
  await flush();
  if (dryRun) {
    // A dry run intentionally performs no large `$in` query. `eligible` is the
    // upper bound; an execute run remains idempotent through sessionId upserts.
    totals.alreadyPresent = null;
  }
  return totals;
}

module.exports = {
  backfillInterviewContentExposures,
  backfillPayloadForSession,
  flushOperations,
};
