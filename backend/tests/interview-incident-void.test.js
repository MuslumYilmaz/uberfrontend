'use strict';

const mongoose = require('mongoose');

const {
  bulkTechnicalVoid,
  summarizeIncidentSessions,
} = require('../services/interview/incident-void');
const {
  assertSafeExecution,
  confirmationToken,
  parseArgs,
} = require('../scripts/bulk-technical-void-interviews');

const SESSION_ONE = '507f1f77bcf86cd799439011';
const SESSION_TWO = '507f1f77bcf86cd799439012';
const USER_ONE = new mongoose.Types.ObjectId('507f1f77bcf86cd799439021');
const USER_TWO = new mongoose.Types.ObjectId('507f1f77bcf86cd799439022');
const VERIFIER = '507f1f77bcf86cd799439031';

function queryResult(value) {
  return {
    select: jest.fn().mockReturnThis(),
    session: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(value),
  };
}

function modelSet(sessions) {
  return {
    AbandonWindowModel: { updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }) },
    MonthlyQuotaModel: { updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }) },
    SessionModel: {
      find: jest.fn().mockImplementation(() => queryResult(sessions)),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    },
    UserModel: {
      findOne: jest.fn().mockImplementation(() => queryResult({
        _id: new mongoose.Types.ObjectId(VERIFIER),
        role: 'admin',
      })),
    },
  };
}

function fakeMongoose() {
  const transaction = {
    withTransaction: jest.fn(async (callback) => callback()),
    endSession: jest.fn().mockResolvedValue(undefined),
  };
  return {
    Types: mongoose.Types,
    isValidObjectId: mongoose.isValidObjectId,
    startSession: jest.fn().mockResolvedValue(transaction),
    transaction,
  };
}

describe('Interview incident bulk technical void', () => {
  const sessions = [
    {
      _id: new mongoose.Types.ObjectId(SESSION_ONE),
      userId: USER_ONE,
      format: 'coding',
      status: 'coding_active',
      entitlementSnapshot: {
        tier: 'free',
        quotaMonthKey: '2026-08',
        quotaRequestId: 'private-create-request',
      },
    },
    {
      _id: new mongoose.Types.ObjectId(SESSION_TWO),
      userId: USER_TWO,
      format: 'system-design',
      status: 'voided_technical',
      entitlementSnapshot: { tier: 'premium' },
    },
  ];

  test('summarizes an exact dry run without mutating sessions or quota', async () => {
    const models = modelSet(sessions);
    const mongooseInstance = fakeMongoose();
    const result = await bulkTechnicalVoid({
      sessionIds: [SESSION_ONE, SESSION_TWO],
      verifiedBy: VERIFIER,
      reasonCode: 'platform_outage',
      dryRun: true,
    }, { models, mongooseInstance });

    expect(result).toEqual({
      dryRun: true,
      requested: 2,
      matched: 2,
      eligible: 1,
      alreadyVoided: 1,
      freeQuotaRefunds: 1,
      byStatus: { coding_active: 1, voided_technical: 1 },
    });
    expect(models.SessionModel.updateOne).not.toHaveBeenCalled();
    expect(models.MonthlyQuotaModel.updateOne).not.toHaveBeenCalled();
    expect(mongooseInstance.startSession).not.toHaveBeenCalled();
    expect(models.UserModel.findOne).toHaveBeenCalledWith({
      _id: new mongoose.Types.ObjectId(VERIFIER),
      role: 'admin',
    });
  });

  test('commits session void, quota refund and abandon-slot release in one transaction', async () => {
    const models = modelSet(sessions);
    const mongooseInstance = fakeMongoose();
    const now = new Date('2026-08-24T12:00:00.000Z');
    const result = await bulkTechnicalVoid({
      sessionIds: [SESSION_ONE, SESSION_TWO],
      verifiedBy: VERIFIER,
      reasonCode: 'platform_outage',
      dryRun: false,
      now,
    }, { models, mongooseInstance });

    expect(result).toEqual(expect.objectContaining({
      dryRun: false,
      changed: 1,
      quotaRestored: 1,
      alreadyVoided: 1,
    }));
    expect(mongooseInstance.transaction.withTransaction).toHaveBeenCalledTimes(1);
    expect(mongooseInstance.transaction.endSession).toHaveBeenCalledTimes(1);
    expect(models.SessionModel.updateOne).toHaveBeenCalledWith(
      { _id: sessions[0]._id, status: { $ne: 'voided_technical' } },
      expect.objectContaining({
        $set: expect.objectContaining({
          active: false,
          status: 'voided_technical',
          completedAt: now,
          resultSnapshot: null,
          technicalVoid: expect.objectContaining({
            reasonCode: 'platform_outage',
            verifiedAt: now,
          }),
        }),
        $inc: { __v: 1 },
      }),
      { session: mongooseInstance.transaction }
    );
    expect(models.MonthlyQuotaModel.updateOne).toHaveBeenCalledWith(
      { userId: USER_ONE, monthKey: '2026-08' },
      { $pull: { requestIds: 'private-create-request' } },
      { session: mongooseInstance.transaction }
    );
    expect(models.AbandonWindowModel.updateOne).toHaveBeenCalledTimes(1);
  });

  test('rejects a partial target set before opening a transaction', async () => {
    const models = modelSet([sessions[0]]);
    const mongooseInstance = fakeMongoose();
    await expect(bulkTechnicalVoid({
      sessionIds: [SESSION_ONE, SESSION_TWO],
      verifiedBy: VERIFIER,
      reasonCode: 'platform_outage',
      dryRun: false,
    }, { models, mongooseInstance })).rejects.toMatchObject({
      code: 'INTERVIEW_INCIDENT_SESSIONS_NOT_FOUND',
    });
    expect(mongooseInstance.startSession).not.toHaveBeenCalled();
  });

  test('rejects a non-admin verifier before inspecting or mutating sessions', async () => {
    const models = modelSet(sessions);
    models.UserModel.findOne.mockImplementation(() => queryResult(null));
    const mongooseInstance = fakeMongoose();
    await expect(bulkTechnicalVoid({
      sessionIds: [SESSION_ONE],
      verifiedBy: VERIFIER,
      reasonCode: 'platform_outage',
      dryRun: true,
    }, { models, mongooseInstance })).rejects.toMatchObject({
      code: 'INTERVIEW_INCIDENT_VOID_INVALID_VERIFIER',
    });
    expect(models.SessionModel.find).not.toHaveBeenCalled();
    expect(models.SessionModel.updateOne).not.toHaveBeenCalled();
  });

  test('summary stays aggregate-only', () => {
    const summary = summarizeIncidentSessions(sessions);
    expect(JSON.stringify(summary)).not.toContain(SESSION_ONE);
    expect(JSON.stringify(summary)).not.toContain(String(USER_ONE));
    expect(JSON.stringify(summary)).not.toContain('private-create-request');
  });
});

describe('Interview incident void CLI guards', () => {
  test('is dry-run by default and requires an exact count-and-reason token to execute', () => {
    const options = parseArgs([
      `--session-id=${SESSION_ONE},${SESSION_TWO}`,
      `--verified-by=${VERIFIER}`,
      '--reason-code=platform_outage',
      '--database=frontendatlas_ci',
    ]);
    expect(options.execute).toBe(false);
    expect(confirmationToken(options)).toBe(
      'VOID_INTERVIEW_SESSIONS:2:platform_outage'
    );

    const execute = { ...options, execute: true, confirmation: 'wrong' };
    expect(() => assertSafeExecution(execute, {
      target: 'test',
      uri: 'mongodb://127.0.0.1:27017/frontendatlas_ci',
    }, {})).toThrow('--confirm must exactly equal');
  });

  test('rejects a production-looking database when the connection is labeled test', () => {
    const options = {
      ...parseArgs([
        `--session-id=${SESSION_ONE}`,
        `--verified-by=${VERIFIER}`,
        '--reason-code=platform_outage',
        '--database=frontendatlas',
        '--execute',
      ]),
      confirmation: 'VOID_INTERVIEW_SESSIONS:1:platform_outage',
    };
    expect(() => assertSafeExecution(options, {
      target: 'test',
      uri: 'mongodb://127.0.0.1:27017/frontendatlas',
    }, {})).toThrow('without a test/ci/e2e/sandbox marker');
  });

  test('requires independent CLI and environment approval for production execution', () => {
    const options = {
      ...parseArgs([
        `--session-id=${SESSION_ONE}`,
        `--verified-by=${VERIFIER}`,
        '--reason-code=platform_outage',
        '--database=frontendatlas',
        '--execute',
        '--allow-production',
      ]),
      confirmation: 'VOID_INTERVIEW_SESSIONS:1:platform_outage',
    };
    const config = {
      target: 'production',
      uri: 'mongodb://127.0.0.1:27017/frontendatlas',
    };
    expect(() => assertSafeExecution(options, config, {}))
      .toThrow('INTERVIEW_INCIDENT_VOID_ALLOW_PRODUCTION');
    expect(() => assertSafeExecution(options, config, {
      INTERVIEW_INCIDENT_VOID_ALLOW_PRODUCTION: 'true',
    })).not.toThrow();
  });
});
