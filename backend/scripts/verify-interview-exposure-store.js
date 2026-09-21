#!/usr/bin/env node
'use strict';

const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const { resolveMongoClientOptions } = require('../config/mongo');
const {
  EXPOSURE_COLLECTION_NAME,
  verifyInterviewExposureIndexes,
} = require('../services/interview/exposure-index-verifier');
const {
  resolveExactInterviewMongoConfig,
} = require('../services/interview/mongo-tool-safety');

function parseArgs(argv = process.argv.slice(2)) {
  const options = { database: '' };
  for (const argument of argv) {
    if (argument.startsWith('--database=')) options.database = argument.slice(11).trim();
    else throw new Error(`Unknown argument: ${argument}`);
  }
  if (!options.database) throw new Error('--database must name the exact target database');
  return options;
}

function aggregateVerifierReport(report) {
  return {
    collection: report.collection,
    ok: report.ok,
    retention: report.retention,
    summary: report.summary,
  };
}

function safeCliErrorMessage(error) {
  if (error?.code === 'INTERVIEW_EXPOSURE_INDEX_READ_FAILED') return error.message;
  const message = String(error?.message || '');
  if (
    message.startsWith('Refusing')
    || message.startsWith('MONGO_')
    || message.startsWith('EXPECTED_')
    || message.startsWith('Unknown argument')
  ) return message;
  return 'MongoDB exposure index verification failed';
}

async function runVerifier(mongoConfig, {
  MongoClient = mongoose.mongo.MongoClient,
} = {}) {
  const client = new MongoClient(mongoConfig.uri, {
    ...resolveMongoClientOptions(),
    appName: 'frontendatlas-interview-exposure-index-verifier',
  });

  try {
    await client.connect();
    const report = await verifyInterviewExposureIndexes({
      collection: client.db(mongoConfig.database).collection(EXPOSURE_COLLECTION_NAME),
    });
    return report;
  } finally {
    await client.close();
  }
}

async function main() {
  const options = parseArgs();
  const mongoConfig = resolveExactInterviewMongoConfig(process.env, {
    database: options.database,
  });
  const report = await runVerifier(mongoConfig);
  console.log(JSON.stringify({
    database: mongoConfig.database,
    target: mongoConfig.target,
    ...aggregateVerifierReport(report),
  }, null, 2));
  if (!report.ok) process.exitCode = 1;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(JSON.stringify({
      code: error?.code || 'INTERVIEW_EXPOSURE_INDEX_VERIFY_FAILED',
      message: safeCliErrorMessage(error),
      ok: false,
    }));
    process.exitCode = 1;
  });
}

module.exports = {
  aggregateVerifierReport,
  main,
  parseArgs,
  runVerifier,
  safeCliErrorMessage,
};
