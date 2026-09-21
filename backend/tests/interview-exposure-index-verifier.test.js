'use strict';

const {
  APPROVED_EXPOSURE_RETENTION_DAYS,
  REQUIRED_EXPOSURE_INDEXES,
  verifyInterviewExposureIndexes,
} = require('../services/interview/exposure-index-verifier');
const {
  resolveExactInterviewMongoConfig,
  resolveSafeInterviewTestMongoConfig,
} = require('../services/interview/mongo-tool-safety');
const {
  aggregateVerifierReport,
  parseArgs,
  safeCliErrorMessage,
} = require('../scripts/verify-interview-exposure-store');

function mongoIndex({
  expireAfterSeconds,
  key,
  name,
  unique = false,
}) {
  return {
    key: Object.fromEntries(key),
    name,
    v: 2,
    ...(unique ? { unique: true } : {}),
    ...(expireAfterSeconds == null ? {} : { expireAfterSeconds }),
  };
}

function validIndexes() {
  return [
    { key: { _id: 1 }, name: '_id_', v: 2 },
    ...REQUIRED_EXPOSURE_INDEXES.map(mongoIndex),
  ];
}

function collectionWithIndexes(indexes) {
  const toArray = jest.fn().mockResolvedValue(indexes);
  return {
    collection: {
      createIndex: jest.fn(() => {
        throw new Error('verifier must not create indexes');
      }),
      listIndexes: jest.fn(() => ({ toArray })),
      syncIndexes: jest.fn(() => {
        throw new Error('verifier must not sync indexes');
      }),
    },
    toArray,
  };
}

describe('Interview exposure index verifier', () => {
  test('accepts the exact index contract and reports absolute-date 365-day retention', async () => {
    const fake = collectionWithIndexes(validIndexes());
    const report = await verifyInterviewExposureIndexes({ collection: fake.collection });

    expect(APPROVED_EXPOSURE_RETENTION_DAYS).toBe(365);
    expect(report).toEqual(expect.objectContaining({
      ok: true,
      retention: {
        days: 365,
        expireAfterSeconds: 0,
        field: 'expiresAt',
        mode: 'absolute-expiry-date',
        valid: true,
      },
      summary: {
        mismatchedCount: 0,
        missingCount: 0,
        requiredCount: 5,
        unexpectedCount: 0,
        validCount: 5,
      },
    }));
    expect(fake.collection.listIndexes).toHaveBeenCalledTimes(1);
    expect(fake.toArray).toHaveBeenCalledTimes(1);
    expect(fake.collection.createIndex).not.toHaveBeenCalled();
    expect(fake.collection.syncIndexes).not.toHaveBeenCalled();
  });

  test('fails closed on wrong key, uniqueness, or TTL options without mutating', async () => {
    const indexes = validIndexes();
    indexes.find(({ name }) => name === 'uniq_interview_content_exposure_session').unique = false;
    indexes.find(({ name }) => name === 'idx_interview_exposure_user_history').key = {
      exposedAt: -1,
      userId: 1,
    };
    indexes.find(({ name }) => name === 'ttl_interview_exposure_retention')
      .expireAfterSeconds = 365 * 24 * 60 * 60;
    const fake = collectionWithIndexes(indexes);

    const report = await verifyInterviewExposureIndexes({ collection: fake.collection });

    expect(report.ok).toBe(false);
    expect(report.summary.mismatchedCount).toBe(3);
    expect(report.checks.filter(({ status }) => status === 'mismatched').map(({ name }) => name))
      .toEqual(expect.arrayContaining([
        'uniq_interview_content_exposure_session',
        'idx_interview_exposure_user_history',
        'ttl_interview_exposure_retention',
      ]));
    expect(fake.collection.createIndex).not.toHaveBeenCalled();
    expect(fake.collection.syncIndexes).not.toHaveBeenCalled();
  });

  test('reports a missing collection as missing indexes instead of creating it', async () => {
    const namespaceError = Object.assign(new Error('namespace missing'), {
      code: 26,
      codeName: 'NamespaceNotFound',
    });
    const collection = {
      listIndexes: jest.fn(() => ({
        toArray: jest.fn().mockRejectedValue(namespaceError),
      })),
    };

    const report = await verifyInterviewExposureIndexes({ collection });

    expect(report.ok).toBe(false);
    expect(report.summary).toEqual(expect.objectContaining({
      missingCount: REQUIRED_EXPOSURE_INDEXES.length,
      validCount: 0,
    }));
  });

  test('allows an explicitly named remote staging DB but rejects unsafe or implicit targets', () => {
    expect(resolveSafeInterviewTestMongoConfig({
      EXPECTED_MONGO_DB_NAME_TEST: 'interview_preview',
      MONGO_TARGET: 'test',
      MONGO_URL_TEST: 'mongodb+srv://preview.example.com/interview_preview',
    })).toEqual({
      database: 'interview_preview',
      isLoopback: false,
      target: 'test',
      uri: 'mongodb+srv://preview.example.com/interview_preview',
    });
    expect(() => resolveSafeInterviewTestMongoConfig({
      EXPECTED_MONGO_DB_NAME_TEST: 'interview_preview',
      MONGO_URL_TEST: 'mongodb://127.0.0.1:27017/interview_preview',
    })).toThrow('exact MONGO_TARGET=test');
    expect(() => resolveSafeInterviewTestMongoConfig({
      EXPECTED_MONGO_DB_NAME_TEST: 'frontendatlas',
      MONGO_TARGET: 'test',
      MONGO_URL_TEST: 'mongodb://127.0.0.1:27017/frontendatlas',
    })).toThrow('Refusing unsafe Interview tooling database');
  });

  test('requires an exact CLI database and supports an exact production target', () => {
    expect(parseArgs(['--database=frontendatlas'])).toEqual({ database: 'frontendatlas' });
    expect(() => parseArgs([])).toThrow('--database must name the exact target database');
    expect(resolveExactInterviewMongoConfig({
      EXPECTED_MONGO_DB_NAME: 'frontendatlas',
      MONGO_TARGET: 'production',
      MONGO_URL: 'mongodb+srv://prod.example.com/frontendatlas',
    }, { database: 'frontendatlas' })).toEqual({
      database: 'frontendatlas',
      isLoopback: false,
      target: 'production',
      uri: 'mongodb+srv://prod.example.com/frontendatlas',
    });
    expect(() => resolveExactInterviewMongoConfig({
      EXPECTED_MONGO_DB_NAME: 'frontendatlas',
      MONGO_TARGET: 'prod',
      MONGO_URL: 'mongodb+srv://prod.example.com/frontendatlas',
    }, { database: 'frontendatlas' })).toThrow('exact MONGO_TARGET');
  });

  test('CLI projection exposes aggregate index state only', () => {
    const projected = aggregateVerifierReport({
      checks: [{ actual: { secret: true }, name: 'x', status: 'mismatched' }],
      collection: 'interviewcontentexposures',
      ok: false,
      retention: { valid: true },
      summary: { mismatchedCount: 1 },
      unexpected: ['private-index-name'],
    });
    expect(projected).toEqual({
      collection: 'interviewcontentexposures',
      ok: false,
      retention: { valid: true },
      summary: { mismatchedCount: 1 },
    });
    expect(JSON.stringify(projected)).not.toContain('secret');
    expect(JSON.stringify(projected)).not.toContain('private-index-name');
  });

  test('does not echo driver errors that could contain credentials', () => {
    const message = safeCliErrorMessage(new Error(
      'authentication failed for mongodb://operator:super-secret@preview.example.com/interview_preview'
    ));
    expect(message).toBe('MongoDB exposure index verification failed');
    expect(message).not.toContain('super-secret');
  });
});
