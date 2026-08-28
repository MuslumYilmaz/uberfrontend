#!/usr/bin/env node
'use strict';

const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const {
  connectToMongo,
  disconnectMongo,
  resolveMongoConnectionConfig,
} = require('../config/mongo');
const { bulkTechnicalVoid } = require('../services/interview/incident-void');

function parseArgs(argv = process.argv.slice(2)) {
  const options = {
    allowProduction: false,
    confirmation: '',
    database: '',
    execute: false,
    reasonCode: '',
    sessionIds: [],
    verifiedBy: '',
  };
  for (const argument of argv) {
    if (argument === '--execute') options.execute = true;
    else if (argument === '--allow-production') options.allowProduction = true;
    else if (argument.startsWith('--session-id=')) {
      options.sessionIds.push(...argument.slice(13).split(',').map((value) => value.trim()));
    } else if (argument.startsWith('--verified-by=')) {
      options.verifiedBy = argument.slice(14).trim();
    } else if (argument.startsWith('--reason-code=')) {
      options.reasonCode = argument.slice(14).trim().toLowerCase();
    } else if (argument.startsWith('--database=')) {
      options.database = argument.slice(11).trim();
    } else if (argument.startsWith('--confirm=')) {
      options.confirmation = argument.slice(10).trim();
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  options.sessionIds = [...new Set(options.sessionIds.filter(Boolean))];
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

function confirmationToken(options) {
  return `VOID_INTERVIEW_SESSIONS:${options.sessionIds.length}:${options.reasonCode}`;
}

function assertSafeExecution(options, mongoConfig, env = process.env) {
  if (!options.sessionIds.length) throw new Error('At least one --session-id is required');
  if (!options.verifiedBy) throw new Error('--verified-by is required');
  if (!options.reasonCode) throw new Error('--reason-code is required');
  if (!options.database) throw new Error('--database is required and must name the exact target database');

  const database = databaseNameFromUri(mongoConfig.uri);
  if (!database || database !== options.database) {
    throw new Error(
      `Refusing database mismatch: URI targets ${database || '<missing>'}, argument names ${options.database}`
    );
  }
  if (!options.execute) return;

  if (options.confirmation !== confirmationToken(options)) {
    throw new Error(`--confirm must exactly equal ${confirmationToken(options)}`);
  }
  if (mongoConfig.target === 'test' && !/(?:test|ci|e2e|sandbox)/i.test(database)) {
    throw new Error('Refusing test-target execution against a database without a test/ci/e2e/sandbox marker');
  }
  if (mongoConfig.target === 'production') {
    const envApproval = String(
      env.INTERVIEW_INCIDENT_VOID_ALLOW_PRODUCTION || ''
    ).trim().toLowerCase() === 'true';
    if (!options.allowProduction || !envApproval) {
      throw new Error(
        'Production execution requires --allow-production and '
        + 'INTERVIEW_INCIDENT_VOID_ALLOW_PRODUCTION=true'
      );
    }
  }
}

async function main() {
  const options = parseArgs();
  const mongoConfig = resolveMongoConnectionConfig();
  assertSafeExecution(options, mongoConfig);
  await connectToMongo(mongoConfig.uri);
  const result = await bulkTechnicalVoid({
    sessionIds: options.sessionIds,
    verifiedBy: options.verifiedBy,
    reasonCode: options.reasonCode,
    dryRun: !options.execute,
  });
  console.log(JSON.stringify({
    target: mongoConfig.target,
    database: options.database,
    reasonCode: options.reasonCode,
    ...result,
  }, null, 2));
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(`[interview-incident-void] ${error.message}`);
      process.exitCode = 1;
    })
    .finally(async () => {
      await disconnectMongo();
    });
}

module.exports = {
  assertSafeExecution,
  confirmationToken,
  databaseNameFromUri,
  parseArgs,
};
