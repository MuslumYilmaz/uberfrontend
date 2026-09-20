'use strict';

const REJECTED_DATABASE_NAMES = new Set([
  'admin',
  'config',
  'default',
  'frontendatlas',
  'frontendatlas-production',
  'frontendatlas_prod',
  'frontendatlasprod',
  'frontendatlasproduction',
  'local',
  'live',
  'myapp',
  'prod',
  'production',
  'system',
  'test',
]);

function valueOf(env, name) {
  return String(env?.[name] || '').trim();
}

function databaseNameFromMongoUri(uri) {
  try {
    const parsed = new URL(String(uri || ''));
    const encodedName = String(parsed.pathname || '').replace(/^\/+/, '').split('/')[0];
    return decodeURIComponent(encodedName).trim();
  } catch {
    return '';
  }
}

function mongoHostFromUri(uri) {
  try {
    return new URL(String(uri || '')).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function isLoopbackMongoHost(host) {
  const normalized = String(host || '').trim().toLowerCase();
  return normalized === '127.0.0.1'
    || normalized === 'localhost'
    || normalized === '::1'
    || normalized === '[::1]';
}

function isRejectedDatabaseName(database) {
  const normalized = String(database || '').trim().toLowerCase();
  if (!normalized || REJECTED_DATABASE_NAMES.has(normalized)) return true;
  return /(?:^|[-_.])(prod|production|live)(?:$|[-_.])/.test(normalized);
}

function assertMongoProtocol(parsed, { requireLoopback, variableName }) {
  const allowedProtocols = requireLoopback
    ? new Set(['mongodb:'])
    : new Set(['mongodb:', 'mongodb+srv:']);
  if (!allowedProtocols.has(parsed.protocol)) {
    throw new Error(
      requireLoopback
        ? `${variableName} must use mongodb:// for a loopback database`
        : `${variableName} must use mongodb:// or mongodb+srv://`
    );
  }
}

function resolveExactInterviewMongoConfig(
  env = process.env,
  { database: requestedDatabase = '', requireLoopback = false } = {}
) {
  const target = valueOf(env, 'MONGO_TARGET');
  if (target !== 'test' && target !== 'production') {
    throw new Error('Refusing without exact MONGO_TARGET=test or MONGO_TARGET=production');
  }

  const uriVariable = target === 'test' ? 'MONGO_URL_TEST' : 'MONGO_URL';
  const expectedVariable = target === 'test'
    ? 'EXPECTED_MONGO_DB_NAME_TEST'
    : 'EXPECTED_MONGO_DB_NAME';
  const uri = valueOf(env, uriVariable);
  if (!uri) throw new Error(`${uriVariable} is required`);

  let parsed;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error(`${uriVariable} must be a valid MongoDB URI`);
  }
  assertMongoProtocol(parsed, { requireLoopback, variableName: uriVariable });

  const database = databaseNameFromMongoUri(uri);
  const expectedDatabase = valueOf(env, expectedVariable);
  if (!expectedDatabase) throw new Error(`${expectedVariable} is required`);
  if (!database || database !== expectedDatabase) {
    throw new Error(
      `Refusing database mismatch: ${uriVariable} targets ${database || '<missing>'}, `
      + `${expectedVariable} names ${expectedDatabase}`
    );
  }
  if (requestedDatabase && requestedDatabase !== database) {
    throw new Error(
      `Refusing database mismatch: URI targets ${database}, argument names ${requestedDatabase}`
    );
  }
  if (!requestedDatabase) {
    throw new Error('--database must name the exact target database');
  }
  if (target === 'test' && isRejectedDatabaseName(database)) {
    throw new Error(`Refusing unsafe Interview tooling database: ${database}`);
  }

  const host = mongoHostFromUri(uri);
  if (!host) throw new Error(`${uriVariable} must include a host`);
  if (requireLoopback && !isLoopbackMongoHost(host)) {
    throw new Error(`${uriVariable} must use a loopback host (received ${host})`);
  }

  return {
    database,
    isLoopback: isLoopbackMongoHost(host),
    target,
    uri,
  };
}

function resolveSafeInterviewTestMongoConfig(env = process.env, { requireLoopback = false } = {}) {
  const target = valueOf(env, 'MONGO_TARGET');
  if (target !== 'test') {
    throw new Error('Refusing without exact MONGO_TARGET=test');
  }

  const uri = valueOf(env, 'MONGO_URL_TEST');
  if (!uri) throw new Error('MONGO_URL_TEST is required');

  let parsed;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error('MONGO_URL_TEST must be a valid MongoDB URI');
  }

  const allowedProtocols = requireLoopback
    ? new Set(['mongodb:'])
    : new Set(['mongodb:', 'mongodb+srv:']);
  if (!allowedProtocols.has(parsed.protocol)) {
    throw new Error(
      requireLoopback
        ? 'MONGO_URL_TEST must use mongodb:// for a loopback database'
        : 'MONGO_URL_TEST must use mongodb:// or mongodb+srv://'
    );
  }

  const database = databaseNameFromMongoUri(uri);
  const expectedDatabase = valueOf(env, 'EXPECTED_MONGO_DB_NAME_TEST');
  if (!expectedDatabase) {
    throw new Error('EXPECTED_MONGO_DB_NAME_TEST is required');
  }
  if (!database || database !== expectedDatabase) {
    throw new Error(
      `Refusing database mismatch: MONGO_URL_TEST targets ${database || '<missing>'}, `
      + `EXPECTED_MONGO_DB_NAME_TEST names ${expectedDatabase}`
    );
  }
  if (isRejectedDatabaseName(database)) {
    throw new Error(`Refusing unsafe Interview tooling database: ${database}`);
  }

  const host = mongoHostFromUri(uri);
  if (!host) throw new Error('MONGO_URL_TEST must include a host');
  if (requireLoopback && !isLoopbackMongoHost(host)) {
    throw new Error(`MONGO_URL_TEST must use a loopback host (received ${host})`);
  }

  return {
    database,
    isLoopback: isLoopbackMongoHost(host),
    target: 'test',
    uri,
  };
}

function assertProductionToolExecutionState(env = process.env) {
  if (valueOf(env, 'INTERVIEW_MODE_ACCESS') !== 'off') {
    throw new Error('Production execution requires INTERVIEW_MODE_ACCESS=off');
  }
  if (valueOf(env, 'INTERVIEW_OPERATIONAL_STATE') !== 'drain') {
    throw new Error('Production execution requires INTERVIEW_OPERATIONAL_STATE=drain');
  }
}

module.exports = {
  REJECTED_DATABASE_NAMES,
  databaseNameFromMongoUri,
  isLoopbackMongoHost,
  isRejectedDatabaseName,
  mongoHostFromUri,
  resolveExactInterviewMongoConfig,
  resolveSafeInterviewTestMongoConfig,
  assertProductionToolExecutionState,
};
