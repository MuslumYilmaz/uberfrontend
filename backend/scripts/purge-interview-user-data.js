#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const {
  connectToMongo,
  disconnectMongo,
  resolveMongoConnectionConfig,
} = require('../config/mongo');
const { purgeInterviewUserData } = require('../services/interview/purge');

function parseArgs(argv = process.argv.slice(2)) {
  const options = {
    allowProduction: false,
    confirmUserId: '',
    database: '',
    execute: false,
    userId: '',
  };
  for (const argument of argv) {
    if (argument === '--execute') options.execute = true;
    else if (argument === '--allow-production') options.allowProduction = true;
    else if (argument.startsWith('--user-id=')) options.userId = argument.slice(10).trim();
    else if (argument.startsWith('--confirm-user-id=')) {
      options.confirmUserId = argument.slice(18).trim();
    } else if (argument.startsWith('--database=')) options.database = argument.slice(11).trim();
    else throw new Error(`Unknown argument: ${argument}`);
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
  if (!options.userId) throw new Error('--user-id is required');
  if (!options.database) throw new Error('--database is required and must name the exact target database');

  const database = databaseNameFromUri(mongoConfig.uri);
  if (!database || database !== options.database) {
    throw new Error(`Refusing database mismatch: URI targets ${database || '<missing>'}, argument names ${options.database}`);
  }

  if (!options.execute) return;
  if (options.confirmUserId !== options.userId) {
    throw new Error('--confirm-user-id must exactly match --user-id when --execute is used');
  }
  if (mongoConfig.target === 'production') {
    const envApproval = String(env.INTERVIEW_PURGE_ALLOW_PRODUCTION || '').toLowerCase() === 'true';
    if (!options.allowProduction || !envApproval) {
      throw new Error(
        'Production execution requires --allow-production and INTERVIEW_PURGE_ALLOW_PRODUCTION=true'
      );
    }
  }
}

function userReference(userId) {
  return crypto.createHash('sha256').update(String(userId)).digest('hex').slice(0, 12);
}

async function main() {
  const options = parseArgs();
  const mongoConfig = resolveMongoConnectionConfig();
  assertSafeExecution(options, mongoConfig);
  await connectToMongo(mongoConfig.uri);
  const result = await purgeInterviewUserData(options.userId, {
    dryRun: !options.execute,
  });
  console.log(JSON.stringify({
    target: mongoConfig.target,
    database: options.database,
    userReference: userReference(options.userId),
    ...result,
  }, null, 2));
  if (Object.values(result.remaining).some((value) => Number(value) > 0) && options.execute) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(`[interview-purge] ${error.message}`);
      process.exitCode = 1;
    })
    .finally(async () => {
      await disconnectMongo();
    });
}

module.exports = {
  assertSafeExecution,
  databaseNameFromUri,
  parseArgs,
  userReference,
};
