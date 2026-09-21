#!/usr/bin/env node
'use strict';

const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const { resolveMongoClientOptions } = require('../config/mongo');
const {
  EXPOSURE_COLLECTION_NAME,
} = require('../services/interview/exposure-index-contract');
const {
  migrateInterviewExposureIndexes,
} = require('../services/interview/exposure-index-migrator');
const {
  assertProductionToolExecutionState,
  resolveExactInterviewMongoConfig,
} = require('../services/interview/mongo-tool-safety');

function parseArgs(argv = process.argv.slice(2)) {
  const options = {
    allowProduction: false,
    confirmation: '',
    database: '',
    execute: false,
  };
  for (const argument of argv) {
    if (argument === '--allow-production') options.allowProduction = true;
    else if (argument === '--execute') options.execute = true;
    else if (argument.startsWith('--confirm=')) options.confirmation = argument.slice(10).trim();
    else if (argument.startsWith('--database=')) options.database = argument.slice(11).trim();
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

function assertSafeMigrationExecution(options, mongoConfig, env = process.env) {
  if (!options.database) throw new Error('--database must name the exact target database');
  if (options.database !== mongoConfig.database) {
    throw new Error(
      `Refusing database mismatch: URI targets ${mongoConfig.database}, argument names ${options.database}`
    );
  }
  if (!options.execute) return;
  if (!options.confirmation) {
    throw new Error('--confirm must use the exact token printed by the dry-run');
  }
  if (mongoConfig.target === 'production') {
    const approved = String(
      env.INTERVIEW_EXPOSURE_INDEX_ALLOW_PRODUCTION || ''
    ).trim().toLowerCase() === 'true';
    if (!options.allowProduction || !approved) {
      throw new Error(
        'Production execution requires --allow-production and '
        + 'INTERVIEW_EXPOSURE_INDEX_ALLOW_PRODUCTION=true'
      );
    }
    assertProductionToolExecutionState(env);
  }
}

async function runMigration(options, mongoConfig, {
  MongoClient = mongoose.mongo.MongoClient,
  migrate = migrateInterviewExposureIndexes,
} = {}) {
  const client = new MongoClient(mongoConfig.uri, {
    ...resolveMongoClientOptions(),
    appName: 'frontendatlas-interview-exposure-index-migrator',
  });
  try {
    await client.connect();
    return await migrate({
      collection: client.db(mongoConfig.database).collection(EXPOSURE_COLLECTION_NAME),
      confirmation: options.confirmation,
      database: mongoConfig.database,
      execute: options.execute,
    });
  } finally {
    await client.close();
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
  return 'MongoDB exposure index migration failed';
}

async function main() {
  const options = parseArgs();
  const mongoConfig = resolveExactInterviewMongoConfig(process.env, {
    database: options.database,
  });
  assertSafeMigrationExecution(options, mongoConfig);
  const report = await runMigration(options, mongoConfig);
  console.log(JSON.stringify({
    database: mongoConfig.database,
    target: mongoConfig.target,
    ...report,
  }, null, 2));
  if (!report.canExecute) process.exitCode = 1;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(JSON.stringify({
      code: error?.code || 'INTERVIEW_EXPOSURE_INDEX_MIGRATION_FAILED',
      message: safeCliErrorMessage(error),
      ok: false,
    }));
    process.exitCode = 1;
  });
}

module.exports = {
  assertSafeMigrationExecution,
  main,
  parseArgs,
  runMigration,
  safeCliErrorMessage,
};
