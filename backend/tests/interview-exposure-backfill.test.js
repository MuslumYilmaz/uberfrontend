'use strict';

const {
  backfillPayloadForSession,
  flushOperations,
} = require('../services/interview/exposure-backfill');
const {
  CONFIRMATION,
  assertSafeExecution,
  parseArgs,
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

  test('defaults to dry-run and requires exact database plus execute confirmation', () => {
    expect(parseArgs(['--database=interview_test'])).toEqual({
      allowProduction: false,
      batchSize: 250,
      confirmation: '',
      database: 'interview_test',
      execute: false,
    });
    const mongoConfig = {
      target: 'test',
      uri: 'mongodb://127.0.0.1:27017/interview_test',
    };
    expect(() => assertSafeExecution({
      ...parseArgs(['--database=interview_test', '--execute']),
    }, mongoConfig)).toThrow(`--confirm must exactly equal ${CONFIRMATION}`);
    expect(() => assertSafeExecution(parseArgs([
      '--database=interview_test',
      '--execute',
      `--confirm=${CONFIRMATION}`,
    ]), mongoConfig)).not.toThrow();
  });

  test('requires two independent production approvals', () => {
    const options = parseArgs([
      '--database=frontendatlas',
      '--execute',
      `--confirm=${CONFIRMATION}`,
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
      { INTERVIEW_EXPOSURE_BACKFILL_ALLOW_PRODUCTION: 'true' }
    )).not.toThrow();
  });
});
