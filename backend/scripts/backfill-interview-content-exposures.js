#!/usr/bin/env node
'use strict';

const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const { resolveMongoClientOptions } = require('../config/mongo');
const InterviewContentExposure = require('../models/InterviewContentExposure');
const InterviewSession = require('../models/InterviewSession');
const {
  backfillInterviewContentExposures,
} = require('../services/interview/exposure-backfill');
const {
  verifyInterviewExposureIndexes,
} = require('../services/interview/exposure-index-verifier');
const {
  assertProductionToolExecutionState,
  databaseNameFromMongoUri,
  resolveExactInterviewMongoConfig,
} = require('../services/interview/mongo-tool-safety');

const CONFIRMATION = 'BACKFILL_INTERVIEW_EXPOSURES';

function buildBackfillConfirmation(database, wouldInsert) {
  return `${CONFIRMATION}:${database}:${wouldInsert}`;
}

function parseArgs(argv = process.argv.slice(2)) {
  const options = {
    allowProduction: false,
    batchSize: 250,
    confirmation: '',
    database: '',
    execute: false,
    expectedInserts: null,
  };
  for (const argument of argv) {
    if (argument === '--execute') options.execute = true;
    else if (argument === '--allow-production') options.allowProduction = true;
    else if (argument.startsWith('--confirm=')) options.confirmation = argument.slice(10).trim();
    else if (argument.startsWith('--database=')) options.database = argument.slice(11).trim();
    else if (argument.startsWith('--batch-size=')) options.batchSize = Number(argument.slice(13));
    else if (argument.startsWith('--expected-inserts=')) {
      options.expectedInserts = Number(argument.slice(19));
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

function assertSafeExecution(options, mongoConfig, env = process.env) {
  if (!options.database) throw new Error('--database must name the exact target database');
  const database = mongoConfig.database || databaseNameFromMongoUri(mongoConfig.uri);
  if (!database || database !== options.database) {
    throw new Error(
      `Refusing database mismatch: URI targets ${database || '<missing>'}, argument names ${options.database}`
    );
  }
  if (!Number.isInteger(options.batchSize) || options.batchSize < 1 || options.batchSize > 1000) {
    throw new Error('--batch-size must be an integer between 1 and 1000');
  }
  if (!options.execute) return;
  if (!Number.isSafeInteger(options.expectedInserts) || options.expectedInserts < 0) {
    throw new Error('--expected-inserts must equal the non-negative dry-run wouldInsert count');
  }
  const expectedConfirmation = buildBackfillConfirmation(database, options.expectedInserts);
  if (options.confirmation !== expectedConfirmation) {
    throw new Error(`--confirm must exactly equal ${expectedConfirmation} when --execute is used`);
  }
  if (mongoConfig.target === 'production') {
    const envApproval = String(
      env.INTERVIEW_EXPOSURE_BACKFILL_ALLOW_PRODUCTION || ''
    ).trim().toLowerCase() === 'true';
    if (!options.allowProduction || !envApproval) {
      throw new Error(
        'Production execution requires --allow-production and '
        + 'INTERVIEW_EXPOSURE_BACKFILL_ALLOW_PRODUCTION=true'
      );
    }
    assertProductionToolExecutionState(env);
  }
}

function backfillConnectionOptions() {
  return {
    ...resolveMongoClientOptions(),
    autoCreate: false,
    autoIndex: false,
  };
}

async function createBackfillConnection(uri) {
  const connection = mongoose.createConnection(uri, backfillConnectionOptions());
  const SessionModel = connection.model(
    'InterviewSession',
    InterviewSession.schema,
    InterviewSession.collection.collectionName
  );
  const ExposureModel = connection.model(
    'InterviewContentExposure',
    InterviewContentExposure.schema,
    InterviewContentExposure.collection.collectionName
  );
  await connection.asPromise();
  return {
    close: () => connection.close(),
    ExposureModel,
    SessionModel,
  };
}

function hasExactExposureIndexContract(report) {
  return report?.ok === true
    && Number(report?.summary?.requiredCount) === 5
    && Number(report?.summary?.validCount) === 5
    && Number(report?.summary?.missingCount) === 0
    && Number(report?.summary?.mismatchedCount) === 0
    && Number(report?.summary?.unexpectedCount) === 0;
}

async function runBackfill(options, mongoConfig, {
  backfill = backfillInterviewContentExposures,
  openConnection = createBackfillConnection,
  verifyIndexes = verifyInterviewExposureIndexes,
} = {}) {
  const runtime = await openConnection(mongoConfig.uri);
  try {
    if (options.execute) {
      const indexReport = await verifyIndexes({ collection: runtime.ExposureModel.collection });
      if (!hasExactExposureIndexContract(indexReport)) {
        const error = new Error('Backfill execution requires the exact 5/5 exposure index contract');
        error.code = 'INTERVIEW_EXPOSURE_INDEX_CONTRACT_REQUIRED';
        throw error;
      }
    }
    return await backfill({
      dryRun: !options.execute,
      approvedWouldInsert: options.execute ? options.expectedInserts : null,
      batchSize: options.batchSize,
      ExposureModel: runtime.ExposureModel,
      SessionModel: runtime.SessionModel,
    });
  } finally {
    await runtime.close();
  }
}

function safeCliErrorMessage(error) {
  const code = String(error?.code || '');
  if (code.startsWith('INTERVIEW_EXPOSURE_')) return String(error.message || code);
  const message = String(error?.message || '');
  if (
    message.startsWith('--')
    || message.startsWith('Production execution')
    || message.startsWith('Refusing')
    || message.startsWith('Unknown argument')
  ) return message;
  return 'MongoDB exposure backfill failed';
}

async function main() {
  const options = parseArgs();
  const mongoConfig = resolveExactInterviewMongoConfig(process.env, {
    database: options.database,
  });
  assertSafeExecution(options, mongoConfig);
  const result = await runBackfill(options, mongoConfig);
  console.log(JSON.stringify({
    target: mongoConfig.target,
    database: mongoConfig.database,
    ...result,
    ...(!options.execute ? {
      executeConfirmation: buildBackfillConfirmation(
        mongoConfig.database,
        result.wouldInsert
      ),
    } : {}),
  }, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(JSON.stringify({
      code: error?.code || 'INTERVIEW_EXPOSURE_BACKFILL_FAILED',
      message: safeCliErrorMessage(error),
      ok: false,
    }));
    process.exitCode = 1;
  });
}

module.exports = {
  CONFIRMATION,
  assertSafeExecution,
  backfillConnectionOptions,
  buildBackfillConfirmation,
  createBackfillConnection,
  databaseNameFromUri: databaseNameFromMongoUri,
  hasExactExposureIndexContract,
  main,
  parseArgs,
  runBackfill,
  safeCliErrorMessage,
};
