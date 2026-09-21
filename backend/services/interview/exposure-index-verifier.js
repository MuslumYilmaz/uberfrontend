'use strict';

const {
  APPROVED_EXPOSURE_RETENTION_DAYS,
  EXPOSURE_COLLECTION_NAME,
  REQUIRED_EXPOSURE_INDEXES,
} = require('./exposure-index-contract');
const { EXPOSURE_RETENTION_DAYS } = require('./exposure');

function normalizeIndex(index = {}) {
  return {
    collation: index.collation || null,
    expireAfterSeconds: index.expireAfterSeconds == null
      ? null
      : Number(index.expireAfterSeconds),
    hidden: index.hidden === true,
    key: Object.entries(index.key || {}).map(([field, direction]) => [field, Number(direction)]),
    name: String(index.name || ''),
    partialFilterExpression: index.partialFilterExpression || null,
    sparse: index.sparse === true,
    unique: index.unique === true,
  };
}

function expectedIndexShape(index) {
  return {
    collation: null,
    expireAfterSeconds: index.expireAfterSeconds,
    hidden: false,
    key: index.key,
    name: index.name,
    partialFilterExpression: null,
    sparse: false,
    unique: index.unique,
  };
}

function sameIndexShape(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

async function readIndexes(collection) {
  if (!collection || typeof collection.listIndexes !== 'function') {
    throw new TypeError('An InterviewContentExposure collection is required');
  }
  try {
    return await collection.listIndexes().toArray();
  } catch (error) {
    if (Number(error?.code) === 26 || error?.codeName === 'NamespaceNotFound') return [];
    const safeError = new Error('Unable to read InterviewContentExposure indexes');
    safeError.code = 'INTERVIEW_EXPOSURE_INDEX_READ_FAILED';
    throw safeError;
  }
}

async function verifyInterviewExposureIndexes({ collection }) {
  const actualIndexes = (await readIndexes(collection)).map(normalizeIndex);
  const byName = new Map(actualIndexes.map((index) => [index.name, index]));
  const checks = REQUIRED_EXPOSURE_INDEXES.map((required) => {
    const expected = expectedIndexShape(required);
    const actual = byName.get(required.name);
    if (!actual) return { name: required.name, status: 'missing' };
    if (sameIndexShape(actual, expected)) return { name: required.name, status: 'valid' };
    return {
      actual,
      expected,
      name: required.name,
      status: 'mismatched',
    };
  });
  const requiredNames = new Set(REQUIRED_EXPOSURE_INDEXES.map(({ name }) => name));
  const unexpected = actualIndexes
    .filter(({ name }) => name !== '_id_' && !requiredNames.has(name))
    .map(({ name }) => name)
    .sort();
  const validCount = checks.filter(({ status }) => status === 'valid').length;
  const missingCount = checks.filter(({ status }) => status === 'missing').length;
  const mismatchedCount = checks.filter(({ status }) => status === 'mismatched').length;
  const retentionContractValid = EXPOSURE_RETENTION_DAYS === APPROVED_EXPOSURE_RETENTION_DAYS;

  return {
    checks,
    collection: EXPOSURE_COLLECTION_NAME,
    ok: retentionContractValid
      && missingCount === 0
      && mismatchedCount === 0
      && unexpected.length === 0,
    retention: {
      days: EXPOSURE_RETENTION_DAYS,
      expireAfterSeconds: 0,
      field: 'expiresAt',
      mode: 'absolute-expiry-date',
      valid: retentionContractValid,
    },
    summary: {
      mismatchedCount,
      missingCount,
      requiredCount: REQUIRED_EXPOSURE_INDEXES.length,
      unexpectedCount: unexpected.length,
      validCount,
    },
    unexpected,
  };
}

module.exports = {
  APPROVED_EXPOSURE_RETENTION_DAYS,
  EXPOSURE_COLLECTION_NAME,
  REQUIRED_EXPOSURE_INDEXES,
  normalizeIndex,
  verifyInterviewExposureIndexes,
};
