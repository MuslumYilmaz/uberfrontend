'use strict';

const InterviewContentExposure = require('../../models/InterviewContentExposure');
const {
  REQUIRED_EXPOSURE_INDEXES,
  indexKeyObject,
  indexOptions,
} = require('./exposure-index-contract');
const {
  verifyInterviewExposureIndexes,
} = require('./exposure-index-verifier');

const INDEX_MIGRATION_CONFIRMATION = 'CREATE_INTERVIEW_EXPOSURE_INDEXES';
const UNIQUE_INDEX_NAME = 'uniq_interview_content_exposure_session';
const TTL_INDEX_NAME = 'ttl_interview_exposure_retention';

function migrationRank(definition) {
  if (definition.name === UNIQUE_INDEX_NAME) return 0;
  if (definition.name === TTL_INDEX_NAME) return 2;
  return 1;
}

function orderedMissingDefinitions(checks) {
  const missing = new Set(
    checks.filter(({ status }) => status === 'missing').map(({ name }) => name)
  );
  return REQUIRED_EXPOSURE_INDEXES
    .filter(({ name }) => missing.has(name))
    .sort((left, right) => migrationRank(left) - migrationRank(right));
}

async function duplicateExposureSummary(collection) {
  const rows = await collection.aggregate([
    { $match: { sessionId: { $exists: true } } },
    { $group: { _id: '$sessionId', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    {
      $group: {
        _id: null,
        groups: { $sum: 1 },
        documents: { $sum: { $subtract: ['$count', 1] } },
      },
    },
    { $project: { _id: 0, groups: 1, documents: 1 } },
  ], { allowDiskUse: true }).toArray();
  return {
    groups: Number(rows[0]?.groups || 0),
    documents: Number(rows[0]?.documents || 0),
  };
}

function validateExistingExposure(document, ExposureModel = InterviewContentExposure) {
  try {
    return new ExposureModel(document).validateSync() == null;
  } catch {
    return false;
  }
}

async function countInvalidExposureDocuments(
  collection,
  ExposureModel = InterviewContentExposure
) {
  let invalid = 0;
  const cursor = collection.find({}, {
    projection: {
      userId: 1,
      sessionId: 1,
      format: 1,
      track: 1,
      level: 1,
      selectionPolicyVersion: 1,
      mcq: 1,
      coding: 1,
      systemDesign: 1,
      artifacts: 1,
      exposedAt: 1,
      expiresAt: 1,
    },
  });
  for await (const document of cursor) {
    if (!validateExistingExposure(document, ExposureModel)) invalid += 1;
  }
  return invalid;
}

function migrationBlockers({ indexReport, duplicates, invalid }) {
  const blockers = [];
  if (!indexReport.retention.valid) blockers.push('retention-contract');
  if (indexReport.summary.mismatchedCount) blockers.push('mismatched-required-index');
  if (indexReport.summary.unexpectedCount) blockers.push('unexpected-index');
  if (duplicates.groups) blockers.push('duplicate-session-exposure');
  if (invalid) blockers.push('invalid-exposure-document');
  return blockers;
}

function buildIndexMigrationConfirmation({
  database,
  plannedCount,
  expiredCount,
}) {
  return `${INDEX_MIGRATION_CONFIRMATION}:${database}:${plannedCount}:${expiredCount}`;
}

async function inspectInterviewExposureIndexMigration({
  collection,
  database,
  now = new Date(),
  ExposureModel = InterviewContentExposure,
} = {}) {
  if (!collection) throw new TypeError('An InterviewContentExposure collection is required');
  if (!database) throw new Error('An exact database name is required');
  const indexReport = await verifyInterviewExposureIndexes({ collection });
  const plannedDefinitions = orderedMissingDefinitions(indexReport.checks);
  const [duplicates, invalid] = await Promise.all([
    duplicateExposureSummary(collection),
    countInvalidExposureDocuments(collection, ExposureModel),
  ]);
  const createsTtl = plannedDefinitions.some(({ name }) => name === TTL_INDEX_NAME);
  const expiredCount = createsTtl
    ? Number(await collection.countDocuments({ expiresAt: { $lte: new Date(now) } }))
    : 0;
  const blockers = migrationBlockers({ indexReport, duplicates, invalid });
  const planned = plannedDefinitions.map(({ name }) => name);

  return {
    blockers,
    canExecute: blockers.length === 0,
    database,
    duplicates,
    expiredCount,
    indexSummary: indexReport.summary,
    invalid,
    planned,
    plannedCount: planned.length,
    confirmation: buildIndexMigrationConfirmation({
      database,
      plannedCount: planned.length,
      expiredCount,
    }),
  };
}

async function migrateInterviewExposureIndexes({
  collection,
  database,
  execute = false,
  confirmation = '',
  now = new Date(),
  ExposureModel = InterviewContentExposure,
} = {}) {
  const inspection = await inspectInterviewExposureIndexMigration({
    collection,
    database,
    now,
    ExposureModel,
  });
  if (!execute) return { ...inspection, dryRun: true, created: [] };
  if (!inspection.canExecute) {
    const error = new Error('Index migration blocked by existing data or index state');
    error.code = 'INTERVIEW_EXPOSURE_INDEX_MIGRATION_BLOCKED';
    error.blockers = inspection.blockers;
    throw error;
  }
  if (confirmation !== inspection.confirmation) {
    const error = new Error(`--confirm must exactly equal ${inspection.confirmation}`);
    error.code = 'INTERVIEW_EXPOSURE_INDEX_CONFIRMATION_REQUIRED';
    throw error;
  }

  const byName = new Map(REQUIRED_EXPOSURE_INDEXES.map((definition) => [
    definition.name,
    definition,
  ]));
  const created = [];
  for (const name of inspection.planned) {
    const definition = byName.get(name);
    await collection.createIndex(indexKeyObject(definition), indexOptions(definition));
    created.push(name);
  }

  const finalReport = await verifyInterviewExposureIndexes({ collection });
  if (!finalReport.ok || finalReport.summary.unexpectedCount) {
    const error = new Error('Index migration completed without satisfying the exact index contract');
    error.code = 'INTERVIEW_EXPOSURE_INDEX_POSTCHECK_FAILED';
    throw error;
  }
  return {
    ...inspection,
    created,
    dryRun: false,
    finalIndexSummary: finalReport.summary,
    ok: true,
  };
}

module.exports = {
  INDEX_MIGRATION_CONFIRMATION,
  TTL_INDEX_NAME,
  UNIQUE_INDEX_NAME,
  buildIndexMigrationConfirmation,
  countInvalidExposureDocuments,
  duplicateExposureSummary,
  inspectInterviewExposureIndexMigration,
  migrateInterviewExposureIndexes,
  migrationBlockers,
  orderedMissingDefinitions,
  validateExistingExposure,
};
