'use strict';

const ORIGINAL_ENV = { ...process.env };

function hasIndex(model, name) {
  return model.schema.indexes().some(([, options]) => options?.name === name);
}

describe('scaling readiness hardening', () => {
  afterEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test('declares compound indexes for hot activity reads', () => {
    jest.resetModules();
    const ActivityEvent = require('../models/ActivityEvent');
    const ActivityCompletion = require('../models/ActivityCompletion');

    expect(hasIndex(ActivityEvent, 'idx_activity_event_user_completed_at')).toBe(true);
    expect(hasIndex(ActivityEvent, 'idx_activity_event_user_day')).toBe(true);
    expect(hasIndex(ActivityCompletion, 'idx_activity_completion_user_active_completed_at')).toBe(true);
  });

  test('defaults Mongo connection options to serverless-safe pool bounds', () => {
    jest.resetModules();
    const { resolveMongoClientOptions } = require('../config/mongo');

    expect(resolveMongoClientOptions()).toEqual({
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 20_000,
    });
  });

  test('supports bounded Mongo pool overrides', () => {
    process.env.MONGO_MAX_POOL_SIZE = '25';
    process.env.MONGO_MIN_POOL_SIZE = '30';
    process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS = '7500';
    process.env.MONGO_SOCKET_TIMEOUT_MS = '9000';

    jest.resetModules();
    const { resolveMongoClientOptions } = require('../config/mongo');

    expect(resolveMongoClientOptions()).toEqual({
      maxPoolSize: 25,
      minPoolSize: 25,
      serverSelectionTimeoutMS: 7500,
      socketTimeoutMS: 9000,
    });
  });

  test('auth validation cache can be invalidated by session and user', () => {
    process.env.AUTH_VALIDATION_CACHE_TTL_MS = '1000';

    jest.resetModules();
    const {
      clearAuthValidationCache,
      clearAuthValidationCacheForSession,
      clearAuthValidationCacheForUser,
      getCachedAuthValidation,
      setCachedAuthValidation,
    } = require('../services/auth-validation-cache');

    clearAuthValidationCache();
    setCachedAuthValidation('token-a', { userId: 'user-a', role: 'user', sessionId: 'session-a' });
    setCachedAuthValidation('token-b', { userId: 'user-b', role: 'admin', sessionId: 'session-b' });

    expect(getCachedAuthValidation('token-a')).toEqual({
      userId: 'user-a',
      role: 'user',
      sessionId: 'session-a',
    });

    clearAuthValidationCacheForSession('session-a');
    expect(getCachedAuthValidation('token-a')).toBeNull();
    expect(getCachedAuthValidation('token-b')).toEqual({
      userId: 'user-b',
      role: 'admin',
      sessionId: 'session-b',
    });

    clearAuthValidationCacheForUser('user-b');
    expect(getCachedAuthValidation('token-b')).toBeNull();
  });
});
