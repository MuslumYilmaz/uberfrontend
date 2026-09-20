'use strict';

const {
  INDEX_MIGRATION_CONFIRMATION,
  inspectInterviewExposureIndexMigration,
  migrateInterviewExposureIndexes,
} = require('../services/interview/exposure-index-migrator');
const {
  assertSafeMigrationExecution,
  parseArgs,
  safeCliErrorMessage,
} = require('../scripts/migrate-interview-exposure-indexes');

function fakeCollection({
  indexes = [{ key: { _id: 1 }, name: '_id_', v: 2 }],
  documents = [],
  duplicateGroups = 0,
  duplicateDocuments = 0,
  expiredCount = 0,
} = {}) {
  const state = indexes.map((index) => ({ ...index }));
  const collection = {
    aggregate: jest.fn(() => ({
      toArray: jest.fn().mockResolvedValue(duplicateGroups ? [{
        groups: duplicateGroups,
        documents: duplicateDocuments,
      }] : []),
    })),
    countDocuments: jest.fn().mockResolvedValue(expiredCount),
    createIndex: jest.fn(async (key, options) => {
      state.push({ key, ...options, v: 2 });
      return options.name;
    }),
    dropIndex: jest.fn(() => {
      throw new Error('migrator must never drop indexes');
    }),
    find: jest.fn(() => documents),
    listIndexes: jest.fn(() => ({
      toArray: jest.fn(async () => state.map((index) => ({ ...index }))),
    })),
    syncIndexes: jest.fn(() => {
      throw new Error('migrator must never sync indexes');
    }),
  };
  return { collection, state };
}

describe('Interview exposure create-only index migrator', () => {
  test('dry-run reports aggregate blockers without mutating', async () => {
    const fake = fakeCollection({
      indexes: [
        { key: { _id: 1 }, name: '_id_', v: 2 },
        { key: { legacy: 1 }, name: 'legacy_1', v: 2 },
      ],
      documents: [{}],
      duplicateGroups: 1,
      duplicateDocuments: 2,
      expiredCount: 7,
    });
    const report = await inspectInterviewExposureIndexMigration({
      collection: fake.collection,
      database: 'interview_preview',
      now: new Date('2026-08-30T00:00:00.000Z'),
    });

    expect(report).toEqual(expect.objectContaining({
      blockers: expect.arrayContaining([
        'unexpected-index',
        'duplicate-session-exposure',
        'invalid-exposure-document',
      ]),
      canExecute: false,
      duplicates: { groups: 1, documents: 2 },
      expiredCount: 7,
      invalid: 1,
      plannedCount: 5,
    }));
    expect(fake.collection.createIndex).not.toHaveBeenCalled();
    expect(fake.collection.dropIndex).not.toHaveBeenCalled();
    expect(fake.collection.syncIndexes).not.toHaveBeenCalled();
  });

  test('creates only missing indexes with unique first and TTL last after exact count confirmation', async () => {
    const fake = fakeCollection({ expiredCount: 4 });
    const dryRun = await migrateInterviewExposureIndexes({
      collection: fake.collection,
      database: 'interview_preview',
    });
    expect(dryRun).toEqual(expect.objectContaining({
      canExecute: true,
      confirmation: `${INDEX_MIGRATION_CONFIRMATION}:interview_preview:5:4`,
      dryRun: true,
      plannedCount: 5,
    }));
    expect(dryRun.planned[0]).toBe('uniq_interview_content_exposure_session');
    expect(dryRun.planned.at(-1)).toBe('ttl_interview_exposure_retention');
    expect(fake.collection.createIndex).not.toHaveBeenCalled();

    const result = await migrateInterviewExposureIndexes({
      collection: fake.collection,
      confirmation: dryRun.confirmation,
      database: 'interview_preview',
      execute: true,
    });
    expect(result).toEqual(expect.objectContaining({
      created: dryRun.planned,
      dryRun: false,
      ok: true,
    }));
    expect(fake.collection.createIndex.mock.calls.map(([, options]) => options.name))
      .toEqual(dryRun.planned);
    expect(fake.collection.dropIndex).not.toHaveBeenCalled();
    expect(fake.collection.syncIndexes).not.toHaveBeenCalled();
  });

  test('rejects stale confirmation before creating an index', async () => {
    const fake = fakeCollection();
    await expect(migrateInterviewExposureIndexes({
      collection: fake.collection,
      confirmation: `${INDEX_MIGRATION_CONFIRMATION}:interview_preview:5:999`,
      database: 'interview_preview',
      execute: true,
    })).rejects.toMatchObject({
      code: 'INTERVIEW_EXPOSURE_INDEX_CONFIRMATION_REQUIRED',
    });
    expect(fake.collection.createIndex).not.toHaveBeenCalled();
  });

  test('blocks a same-name mismatched index instead of replacing it', async () => {
    const fake = fakeCollection({
      indexes: [
        { key: { _id: 1 }, name: '_id_', v: 2 },
        {
          key: { sessionId: 1 },
          name: 'uniq_interview_content_exposure_session',
          unique: false,
          v: 2,
        },
      ],
    });
    const report = await migrateInterviewExposureIndexes({
      collection: fake.collection,
      database: 'interview_preview',
    });
    expect(report.blockers).toContain('mismatched-required-index');
    expect(report.canExecute).toBe(false);
    expect(fake.collection.createIndex).not.toHaveBeenCalled();
  });

  test('production execute requires independent approval and off/drain state', () => {
    const options = parseArgs([
      '--database=frontendatlas',
      '--execute',
      '--allow-production',
      `--confirm=${INDEX_MIGRATION_CONFIRMATION}:frontendatlas:2:0`,
    ]);
    const config = {
      database: 'frontendatlas',
      target: 'production',
      uri: 'mongodb+srv://prod.example.com/frontendatlas',
    };
    expect(() => assertSafeMigrationExecution(options, config, {})).toThrow(
      'INTERVIEW_EXPOSURE_INDEX_ALLOW_PRODUCTION=true'
    );
    expect(() => assertSafeMigrationExecution(options, config, {
      INTERVIEW_EXPOSURE_INDEX_ALLOW_PRODUCTION: 'true',
      INTERVIEW_MODE_ACCESS: 'off',
      INTERVIEW_OPERATIONAL_STATE: 'drain',
    })).not.toThrow();
    expect(() => assertSafeMigrationExecution(
      { ...options, database: 'another_database' },
      config,
      {}
    )).toThrow('Refusing database mismatch');
  });

  test('does not expose MongoDB credentials through CLI errors', () => {
    const message = safeCliErrorMessage(new Error(
      'failed mongodb://operator:super-secret@prod.example.com/frontendatlas'
    ));
    expect(message).toBe('MongoDB exposure index migration failed');
    expect(message).not.toContain('super-secret');
  });
});
