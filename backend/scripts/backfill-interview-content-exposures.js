#!/usr/bin/env node
'use strict';

const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const {
  connectToMongo,
  disconnectMongo,
  resolveMongoConnectionConfig,
} = require('../config/mongo');
const {
  backfillInterviewContentExposures,
} = require('../services/interview/exposure-backfill');

const CONFIRMATION = 'BACKFILL_INTERVIEW_EXPOSURES';

function parseArgs(argv = process.argv.slice(2)) {
  const options = {
    allowProduction: false,
    batchSize: 250,
    confirmation: '',
    database: '',
    execute: false,
  };
  for (const argument of argv) {
    if (argument === '--execute') options.execute = true;
    else if (argument === '--allow-production') options.allowProduction = true;
    else if (argument.startsWith('--confirm=')) options.confirmation = argument.slice(10).trim();
    else if (argument.startsWith('--database=')) options.database = argument.slice(11).trim();
    else if (argument.startsWith('--batch-size=')) {
      options.batchSize = Number(argument.slice(13));
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

function databaseNameFromUri(uri) {
  try {
    const parsed = new URL(String(uri || ''));
    return decodeURIComponent(String(parsed.pathname || '').replace(/^\//, '').split('/')[0]);
  } catch {
    return '';
  }
}

function assertSafeExecution(options, mongoConfig, env = process.env) {
  if (!options.database) throw new Error('--database must name the exact target database');
  const database = databaseNameFromUri(mongoConfig.uri);
  if (!database || database !== options.database) {
    throw new Error(
      `Refusing database mismatch: URI targets ${database || '<missing>'}, argument names ${options.database}`
    );
  }
  if (!Number.isInteger(options.batchSize) || options.batchSize < 1 || options.batchSize > 1000) {
    throw new Error('--batch-size must be an integer between 1 and 1000');
  }
  if (!options.execute) return;
  if (options.confirmation !== CONFIRMATION) {
    throw new Error(`--confirm must exactly equal ${CONFIRMATION} when --execute is used`);
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
  }
}

async function main() {
  const options = parseArgs();
  const mongoConfig = resolveMongoConnectionConfig();
  assertSafeExecution(options, mongoConfig);
  await connectToMongo(mongoConfig.uri);
  const result = await backfillInterviewContentExposures({
    dryRun: !options.execute,
    batchSize: options.batchSize,
  });
  console.log(JSON.stringify({
    target: mongoConfig.target,
    database: options.database,
    ...result,
  }, null, 2));
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(`[interview-exposure-backfill] ${error.message}`);
      process.exitCode = 1;
    })
    .finally(async () => {
      await disconnectMongo();
    });
}

module.exports = {
  CONFIRMATION,
  assertSafeExecution,
  databaseNameFromUri,
  parseArgs,
};
