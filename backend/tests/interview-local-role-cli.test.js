'use strict';

const {
  setLocalInterviewRole,
} = require('../services/interview/local-role');
const {
  resolveSafeInterviewTestMongoConfig,
} = require('../services/interview/mongo-tool-safety');
const {
  CONFIRMATION,
  assertExecutionRequest,
  parseArgs,
  safeCliErrorMessage,
} = require('../scripts/set-local-interview-role');

function safeEnv(overrides = {}) {
  return {
    EXPECTED_MONGO_DB_NAME_TEST: 'interview_local_test',
    MONGO_TARGET: 'test',
    MONGO_URL_TEST: 'mongodb://127.0.0.1:27017/interview_local_test',
    ...overrides,
  };
}

function mutableUsersCollection(user) {
  const state = { user: user ? { ...user } : null };
  return {
    findOne: jest.fn(async ({ email }) => (
      state.user?.email === email ? { _id: state.user._id, role: state.user.role } : null
    )),
    state,
    updateOne: jest.fn(async (filter, update, options) => {
      if (
        state.user
        && String(state.user._id) === String(filter._id)
        && state.user.email === filter.email
      ) {
        state.user.role = update.$set.role;
        return { matchedCount: 1, modifiedCount: 1 };
      }
      return { matchedCount: 0, modifiedCount: 0 };
    }),
  };
}

describe('Interview local role CLI', () => {
  test('defaults to a dry-run and requires the exact execution confirmation', () => {
    const options = parseArgs([
      '--email=Admin@Example.com',
      '--role=admin',
    ]);
    expect(options).toEqual({
      confirmation: '',
      email: 'Admin@Example.com',
      execute: false,
      role: 'admin',
    });
    expect(() => assertExecutionRequest(options)).not.toThrow();
    expect(() => assertExecutionRequest({ ...options, execute: true })).toThrow(
      `--confirm must exactly equal ${CONFIRMATION}`
    );
    expect(() => assertExecutionRequest({
      ...options,
      confirmation: CONFIRMATION,
      execute: true,
    })).not.toThrow();
  });

  test('requires an explicit isolated loopback test database', () => {
    expect(resolveSafeInterviewTestMongoConfig(safeEnv(), {
      requireLoopback: true,
    })).toEqual({
      database: 'interview_local_test',
      isLoopback: true,
      target: 'test',
      uri: 'mongodb://127.0.0.1:27017/interview_local_test',
    });

    expect(() => resolveSafeInterviewTestMongoConfig(safeEnv({
      MONGO_TARGET: 'production',
    }), { requireLoopback: true })).toThrow('exact MONGO_TARGET=test');
    expect(() => resolveSafeInterviewTestMongoConfig(safeEnv({
      MONGO_URL_TEST: 'mongodb://db.example.com:27017/interview_local_test',
    }), { requireLoopback: true })).toThrow('must use a loopback host');
    expect(() => resolveSafeInterviewTestMongoConfig(safeEnv({
      EXPECTED_MONGO_DB_NAME_TEST: 'another_test_database',
    }), { requireLoopback: true })).toThrow('Refusing database mismatch');
  });

  test.each([
    'admin',
    'config',
    'default',
    'frontendatlas',
    'frontendatlasproduction',
    'local',
    'myapp',
    'production',
    'customer-prod-copy',
    'test',
  ])('rejects unsafe database name %s', (database) => {
    expect(() => resolveSafeInterviewTestMongoConfig(safeEnv({
      EXPECTED_MONGO_DB_NAME_TEST: database,
      MONGO_URL_TEST: `mongodb://127.0.0.1:27017/${database}`,
    }), { requireLoopback: true })).toThrow('Refusing unsafe Interview tooling database');
  });

  test('dry-run reads an existing user without updating or exposing the email', async () => {
    const collection = mutableUsersCollection({
      _id: '507f1f77bcf86cd799439011',
      email: 'admin@example.com',
      role: 'user',
    });

    const result = await setLocalInterviewRole({
      collection,
      email: ' Admin@Example.com ',
      role: 'admin',
    });

    expect(result).toEqual({
      changed: true,
      currentRole: 'user',
      dryRun: true,
      resultingRole: 'user',
      targetRole: 'admin',
      userReference: expect.stringMatching(/^[a-f0-9]{12}$/),
    });
    expect(JSON.stringify(result)).not.toContain('admin@example.com');
    expect(collection.updateOne).not.toHaveBeenCalled();
  });

  test('can promote and then reversibly demote only the existing user without upsert', async () => {
    const collection = mutableUsersCollection({
      _id: '507f1f77bcf86cd799439011',
      email: 'local@example.com',
      role: 'user',
    });

    await expect(setLocalInterviewRole({
      collection,
      email: 'local@example.com',
      execute: true,
      role: 'admin',
    })).resolves.toEqual(expect.objectContaining({
      currentRole: 'user',
      dryRun: false,
      resultingRole: 'admin',
    }));
    await expect(setLocalInterviewRole({
      collection,
      email: 'local@example.com',
      execute: true,
      role: 'user',
    })).resolves.toEqual(expect.objectContaining({
      currentRole: 'admin',
      dryRun: false,
      resultingRole: 'user',
    }));

    expect(collection.state.user.role).toBe('user');
    expect(collection.updateOne).toHaveBeenCalledTimes(2);
    expect(collection.updateOne).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ email: 'local@example.com' }),
      { $set: { role: 'admin' } },
      { upsert: false }
    );
    expect(collection.updateOne).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ email: 'local@example.com' }),
      { $set: { role: 'user' } },
      { upsert: false }
    );
  });

  test('refuses to create a missing user', async () => {
    const collection = mutableUsersCollection(null);
    await expect(setLocalInterviewRole({
      collection,
      email: 'missing@example.com',
      execute: true,
      role: 'admin',
    })).rejects.toMatchObject({
      code: 'INTERVIEW_LOCAL_ROLE_USER_NOT_FOUND',
    });
    expect(collection.updateOne).not.toHaveBeenCalled();
  });

  test('does not echo connection errors that could contain local credentials', () => {
    const message = safeCliErrorMessage(new Error(
      'authentication failed for mongodb://operator:super-secret@127.0.0.1/interview_local_test'
    ));
    expect(message).toBe('Local Interview role update failed');
    expect(message).not.toContain('super-secret');
  });
});
