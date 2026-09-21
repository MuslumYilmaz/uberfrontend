'use strict';

const {
  analyzeInterviewExposureBackfill,
  backfillInterviewContentExposures,
  backfillPayloadForSession,
  flushOperations,
} = require('../services/interview/exposure-backfill');
const InterviewContentExposure = require('../models/InterviewContentExposure');
const {
  CONFIRMATION,
  assertSafeExecution,
  backfillConnectionOptions,
  buildBackfillConfirmation,
  parseArgs,
  runBackfill,
  safeCliErrorMessage,
} = require('../scripts/backfill-interview-content-exposures');

describe('Interview exposure backfill', () => {
  test('recovers the private coding concept without copying private content', () => {
    const payload = backfillPayloadForSession({
      _id: '507f191e810c19729de860ea',
      userId: '507f1f77bcf86cd799439011',
      format: 'coding',
      track: 'angular',
      level: 'junior',
      createdAt: new Date('2026-08-24T00:00:00.000Z'),
      questions: [{
        id: 'q-1', revision: 1, contentHash: 'q-hash', prompt: 'must not copy',
      }],
      codingVariant: {
        id: 'angular-counter',
        sourceQuestionId: 'angular-counter-source',
        contentHash: 'coding-hash',
      },
      codingPrivate: {
        conceptId: 'coding-ui-counter',
        runnerConfig: { solution: 'must not copy' },
      },
      bank: { id: 'bank', version: '1.0.0', contentHash: 'bank-hash' },
      codingRegistry: { id: 'coding', version: '1.0.0', contentHash: 'coding-registry-hash' },
    });

    expect(payload.coding.conceptId).toBe('coding-ui-counter');
    expect(payload.mcq[0].conceptId).toBe('q-1');
    expect(payload.expiresAt.toISOString()).toBe('2027-08-24T00:00:00.000Z');
    expect(JSON.stringify(payload)).not.toMatch(/must not copy|prompt|runnerConfig|solution/i);
  });

  test('uses idempotent unordered upserts', async () => {
    const bulkWrite = jest.fn().mockResolvedValue({ upsertedCount: 2, matchedCount: 1 });
    const result = await flushOperations([
      { updateOne: { filter: { sessionId: 'one' }, upsert: true } },
      { updateOne: { filter: { sessionId: 'two' }, upsert: true } },
    ], { bulkWrite });

    expect(result).toEqual({ inserted: 2, matched: 1 });
    expect(bulkWrite).toHaveBeenCalledWith(expect.any(Array), { ordered: false });
  });

  test('dry-run schema-validates and aggregates insert, existing, conflict, invalid, and duplicates', async () => {
    const base = {
      userId: '507f1f77bcf86cd799439011',
      format: 'coding',
      track: 'react',
      level: 'mid',
      createdAt: new Date('2026-08-24T00:00:00.000Z'),
      questions: [{ id: 'q-1', revision: 1, contentHash: 'q-hash' }],
      codingVariant: { id: 'task-1', contentHash: 'task-hash' },
      bank: { id: 'bank', version: '1.0.0', contentHash: 'bank-hash' },
      codingRegistry: { id: 'coding', version: '1.0.0', contentHash: 'registry-hash' },
    };
    const sessions = [
      { ...base, _id: '507f191e810c19729de860e1' },
      { ...base, _id: '507f191e810c19729de860e2' },
      { ...base, _id: '507f191e810c19729de860e3' },
      { ...base, _id: '507f191e810c19729de860e4', level: 'principal' },
    ];
    const exact = backfillPayloadForSession(sessions[1]);
    const conflict = {
      ...backfillPayloadForSession(sessions[2]),
      selectionPolicyVersion: 1,
    };
    class ExposureModel extends InterviewContentExposure {}
    ExposureModel.find = jest.fn(() => ({
      select: () => ({
        lean: async () => [exact, exact, conflict],
      }),
    }));
    const SessionModel = {
      find: jest.fn(() => ({
        select: () => ({
          sort: () => ({
            lean: () => ({ cursor: () => sessions }),
          }),
        }),
      })),
    };

    await expect(analyzeInterviewExposureBackfill({
      now: new Date('2026-08-30T00:00:00.000Z'),
      batchSize: 10,
      SessionModel,
      ExposureModel,
    })).resolves.toEqual(expect.objectContaining({
      scanned: 4,
      eligible: 3,
      wouldInsert: 1,
      alreadyPresent: 1,
      conflictingExisting: 1,
      invalid: 1,
      duplicates: 1,
      inserted: 0,
    }));
  });

  test('execute does not overwrite a conflicting existing exposure', async () => {
    const session = {
      _id: '507f191e810c19729de860e8',
      userId: '507f1f77bcf86cd799439011',
      format: 'coding',
      track: 'react',
      level: 'mid',
      createdAt: new Date('2026-08-24T00:00:00.000Z'),
      questions: [{ id: 'q-1', revision: 1, contentHash: 'q-hash' }],
      codingVariant: { id: 'task-1', contentHash: 'task-hash' },
      bank: { id: 'bank', version: '1.0.0', contentHash: 'bank-hash' },
      codingRegistry: { id: 'coding', version: '1.0.0', contentHash: 'registry-hash' },
    };
    const conflict = {
      ...backfillPayloadForSession(session),
      selectionPolicyVersion: 1,
    };
    class ExposureModel extends InterviewContentExposure {}
    ExposureModel.find = jest.fn(() => ({
      select: () => ({ lean: async () => [conflict] }),
    }));
    ExposureModel.bulkWrite = jest.fn();
    const SessionModel = {
      find: jest.fn(() => ({
        select: () => ({
          sort: () => ({ lean: () => ({ cursor: () => [session] }) }),
        }),
      })),
    };

    await expect(backfillInterviewContentExposures({
      approvedWouldInsert: 0,
      dryRun: false,
      now: new Date('2026-08-30T00:00:00.000Z'),
      SessionModel,
      ExposureModel,
    })).rejects.toMatchObject({ code: 'INTERVIEW_EXPOSURE_BACKFILL_BLOCKED' });
    expect(ExposureModel.bulkWrite).not.toHaveBeenCalled();
  });

  test('defaults to dry-run and requires exact database plus execute confirmation', () => {
    expect(parseArgs(['--database=interview_test'])).toEqual({
      allowProduction: false,
      batchSize: 250,
      confirmation: '',
      database: 'interview_test',
      execute: false,
      expectedInserts: null,
    });
    const mongoConfig = {
      target: 'test',
      uri: 'mongodb://127.0.0.1:27017/interview_test',
    };
    expect(() => assertSafeExecution({
      ...parseArgs(['--database=interview_test', '--execute']),
    }, mongoConfig)).toThrow('--expected-inserts');
    expect(() => assertSafeExecution(parseArgs([
      '--database=interview_test',
      '--execute',
      '--expected-inserts=3',
      `--confirm=${buildBackfillConfirmation('interview_test', 3)}`,
    ]), mongoConfig)).not.toThrow();
    expect(buildBackfillConfirmation('interview_test', 3)).toBe(
      `${CONFIRMATION}:interview_test:3`
    );
  });

  test('requires two independent production approvals', () => {
    const options = parseArgs([
      '--database=frontendatlas',
      '--execute',
      '--expected-inserts=2',
      `--confirm=${buildBackfillConfirmation('frontendatlas', 2)}`,
    ]);
    const config = {
      target: 'production',
      uri: 'mongodb://127.0.0.1:27017/frontendatlas',
    };
    expect(() => assertSafeExecution(options, config, {})).toThrow(
      'Production execution requires'
    );
    expect(() => assertSafeExecution(
      { ...options, allowProduction: true },
      config,
      {
        INTERVIEW_EXPOSURE_BACKFILL_ALLOW_PRODUCTION: 'true',
        INTERVIEW_MODE_ACCESS: 'off',
        INTERVIEW_OPERATIONAL_STATE: 'drain',
      }
    )).not.toThrow();
    expect(() => assertSafeExecution(
      { ...options, allowProduction: true },
      config,
      { INTERVIEW_EXPOSURE_BACKFILL_ALLOW_PRODUCTION: 'true' }
    )).toThrow('INTERVIEW_MODE_ACCESS=off');
  });

  test('does not expose MongoDB credentials through CLI errors', () => {
    const message = safeCliErrorMessage(new Error(
      'failed mongodb://operator:super-secret@prod.example.com/frontendatlas'
    ));
    expect(message).toBe('MongoDB exposure backfill failed');
    expect(message).not.toContain('super-secret');
  });

  test('dry-run uses non-auto-index models and never initializes or syncs indexes', async () => {
    const init = jest.fn();
    const syncIndexes = jest.fn();
    const runtime = {
      close: jest.fn().mockResolvedValue(undefined),
      ExposureModel: { init, syncIndexes },
      SessionModel: { init, syncIndexes },
    };
    const openConnection = jest.fn().mockResolvedValue(runtime);
    const backfill = jest.fn().mockResolvedValue({ dryRun: true, eligible: 3 });
    const options = parseArgs(['--database=interview_test']);
    const mongoConfig = {
      target: 'test',
      uri: 'mongodb://127.0.0.1:27017/interview_test',
    };

    await expect(runBackfill(options, mongoConfig, {
      backfill,
      openConnection,
    })).resolves.toEqual({ dryRun: true, eligible: 3 });

    expect(backfillConnectionOptions()).toEqual(expect.objectContaining({
      autoCreate: false,
      autoIndex: false,
    }));
    expect(openConnection).toHaveBeenCalledWith(mongoConfig.uri);
    expect(backfill).toHaveBeenCalledWith(expect.objectContaining({
      dryRun: true,
      approvedWouldInsert: null,
      ExposureModel: runtime.ExposureModel,
      SessionModel: runtime.SessionModel,
    }));
    expect(init).not.toHaveBeenCalled();
    expect(syncIndexes).not.toHaveBeenCalled();
    expect(runtime.close).toHaveBeenCalledTimes(1);
  });

  test('execute refuses to write unless the exact 5/5 index contract is valid', async () => {
    const runtime = {
      close: jest.fn().mockResolvedValue(undefined),
      ExposureModel: { collection: {} },
      SessionModel: {},
    };
    const backfill = jest.fn();
    const options = parseArgs([
      '--database=interview_test',
      '--execute',
      '--expected-inserts=0',
      `--confirm=${buildBackfillConfirmation('interview_test', 0)}`,
    ]);
    await expect(runBackfill(options, {
      database: 'interview_test',
      target: 'test',
      uri: 'mongodb://127.0.0.1:27017/interview_test',
    }, {
      backfill,
      openConnection: jest.fn().mockResolvedValue(runtime),
      verifyIndexes: jest.fn().mockResolvedValue({
        ok: false,
        checks: [{ name: 'uniq_interview_content_exposure_session', status: 'missing' }],
        summary: {
          requiredCount: 5,
          validCount: 4,
          missingCount: 1,
          mismatchedCount: 0,
          unexpectedCount: 0,
        },
      }),
    })).rejects.toMatchObject({ code: 'INTERVIEW_EXPOSURE_INDEX_CONTRACT_REQUIRED' });
    expect(backfill).not.toHaveBeenCalled();
    expect(runtime.close).toHaveBeenCalledTimes(1);
  });
});
