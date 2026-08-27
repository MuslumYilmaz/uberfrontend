'use strict';

const {
  assertSafeExecution,
  databaseNameFromUri,
  parseArgs,
} = require('../scripts/purge-interview-user-data');
const {
  defaultCollections,
  purgeInterviewUserData,
} = require('../services/interview/purge');

function modelWith(count, deleted = count) {
  return {
    countDocuments: jest.fn().mockResolvedValueOnce(count).mockResolvedValueOnce(0),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: deleted }),
  };
}

describe('Interview user-data purge', () => {
  test('covers every Interview collection that stores a user reference', () => {
    expect(Object.keys(defaultCollections()).sort()).toEqual([
      'abandonWindows',
      'consumedRunTokens',
      'contentExposures',
      'monthlyQuotas',
      'sessions',
    ]);
  });

  test('dry-run counts records without deleting them', async () => {
    const collections = {
      sessions: modelWith(3),
      monthlyQuotas: modelWith(1),
    };
    const result = await purgeInterviewUserData('507f1f77bcf86cd799439011', {
      dryRun: true,
      collections,
    });
    expect(result).toEqual({
      dryRun: true,
      before: { sessions: 3, monthlyQuotas: 1 },
      deleted: { sessions: 0, monthlyQuotas: 0 },
      remaining: { sessions: 3, monthlyQuotas: 1 },
    });
    expect(collections.sessions.deleteMany).not.toHaveBeenCalled();
  });

  test('execute is idempotent and verifies every collection is empty', async () => {
    const collections = {
      sessions: modelWith(2),
      consumedRunTokens: modelWith(4),
    };
    const result = await purgeInterviewUserData('507f191e810c19729de860ea', {
      dryRun: false,
      collections,
    });
    expect(result.deleted).toEqual({ sessions: 2, consumedRunTokens: 4 });
    expect(result.remaining).toEqual({ sessions: 0, consumedRunTokens: 0 });
  });

  test('rejects invalid user ids before querying models', async () => {
    await expect(purgeInterviewUserData('not-an-object-id', {
      collections: { sessions: modelWith(1) },
    })).rejects.toMatchObject({ code: 'INTERVIEW_PURGE_INVALID_USER_ID' });
  });

  test('CLI is dry-run by default and requires exact execute confirmation', () => {
    expect(parseArgs([
      '--user-id=507f1f77bcf86cd799439011',
      '--database=frontendatlas_ci',
    ])).toMatchObject({ execute: false, database: 'frontendatlas_ci' });

    const mongoConfig = {
      target: 'test',
      uri: 'mongodb://127.0.0.1:27017/frontendatlas_ci',
    };
    expect(() => assertSafeExecution({
      userId: '507f1f77bcf86cd799439011',
      confirmUserId: 'different',
      database: 'frontendatlas_ci',
      execute: true,
      allowProduction: false,
    }, mongoConfig, {})).toThrow('--confirm-user-id');
  });

  test('production execute needs both CLI and environment approval', () => {
    const options = {
      userId: '507f1f77bcf86cd799439011',
      confirmUserId: '507f1f77bcf86cd799439011',
      database: 'frontendatlas',
      execute: true,
      allowProduction: true,
    };
    const config = {
      target: 'production',
      uri: 'mongodb://127.0.0.1:27017/frontendatlas',
    };
    expect(() => assertSafeExecution(options, config, {})).toThrow('INTERVIEW_PURGE_ALLOW_PRODUCTION');
    expect(() => assertSafeExecution(options, config, {
      INTERVIEW_PURGE_ALLOW_PRODUCTION: 'true',
    })).not.toThrow();
    expect(databaseNameFromUri(config.uri)).toBe('frontendatlas');
  });
});
