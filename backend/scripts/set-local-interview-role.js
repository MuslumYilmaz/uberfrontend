#!/usr/bin/env node
'use strict';

const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const { resolveMongoClientOptions } = require('../config/mongo');
const {
  setLocalInterviewRole,
} = require('../services/interview/local-role');
const {
  resolveSafeInterviewTestMongoConfig,
} = require('../services/interview/mongo-tool-safety');

const CONFIRMATION = 'SET_LOCAL_INTERVIEW_ROLE';

function parseArgs(argv = process.argv.slice(2)) {
  const options = {
    confirmation: '',
    email: '',
    execute: false,
    role: '',
  };
  for (const argument of argv) {
    if (argument === '--execute') options.execute = true;
    else if (argument.startsWith('--confirm=')) options.confirmation = argument.slice(10).trim();
    else if (argument.startsWith('--email=')) options.email = argument.slice(8).trim();
    else if (argument.startsWith('--role=')) options.role = argument.slice(7).trim();
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

function assertExecutionRequest(options) {
  if (!options.execute) return;
  if (options.confirmation !== CONFIRMATION) {
    throw new Error(`--confirm must exactly equal ${CONFIRMATION} when --execute is used`);
  }
}

function safeCliErrorMessage(error) {
  const message = String(error?.message || '');
  if (
    error?.code === 'INTERVIEW_LOCAL_ROLE_USER_NOT_FOUND'
    || error?.code === 'INTERVIEW_LOCAL_ROLE_STALE_USER'
    || message.startsWith('--')
    || message.startsWith('EXPECTED_')
    || message.startsWith('MONGO_')
    || message.startsWith('No existing')
    || message.startsWith('Refusing')
    || message.startsWith('The local user')
    || message.startsWith('Unknown argument')
  ) return message;
  return 'Local Interview role update failed';
}

async function main() {
  const options = parseArgs();
  assertExecutionRequest(options);
  const mongoConfig = resolveSafeInterviewTestMongoConfig(process.env, {
    requireLoopback: true,
  });
  const client = new mongoose.mongo.MongoClient(mongoConfig.uri, {
    ...resolveMongoClientOptions(),
    appName: 'frontendatlas-interview-local-role',
  });

  try {
    await client.connect();
    const result = await setLocalInterviewRole({
      collection: client.db(mongoConfig.database).collection('users'),
      email: options.email,
      execute: options.execute,
      role: options.role,
    });
    console.log(JSON.stringify({
      database: mongoConfig.database,
      target: mongoConfig.target,
      ...result,
    }, null, 2));
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[interview-local-role] ${safeCliErrorMessage(error)}`);
    process.exitCode = 1;
  });
}

module.exports = {
  CONFIRMATION,
  assertExecutionRequest,
  main,
  parseArgs,
  safeCliErrorMessage,
};
