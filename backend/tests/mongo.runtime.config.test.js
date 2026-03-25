'use strict';

const ORIGINAL_ENV = { ...process.env };

describe('Mongo runtime config', () => {
  afterEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test('defaults local non-production runtime to the test database when MONGO_URL_TEST is set', () => {
    process.env.NODE_ENV = 'development';
    process.env.MONGO_URL = 'mongodb://127.0.0.1:27017/frontendatlas';
    process.env.MONGO_URL_TEST = 'mongodb://127.0.0.1:27017/test';
    delete process.env.MONGO_TARGET;

    const { resolveMongoConnectionConfig } = require('../config/mongo');

    expect(resolveMongoConnectionConfig()).toEqual({
      target: 'test',
      uri: 'mongodb://127.0.0.1:27017/test',
    });
  });

  test('uses the production database in production runtime', () => {
    process.env.NODE_ENV = 'production';
    process.env.MONGO_URL = 'mongodb://127.0.0.1:27017/frontendatlas';
    process.env.MONGO_URL_TEST = 'mongodb://127.0.0.1:27017/test';
    delete process.env.MONGO_TARGET;

    const { resolveMongoConnectionConfig } = require('../config/mongo');

    expect(resolveMongoConnectionConfig()).toEqual({
      target: 'production',
      uri: 'mongodb://127.0.0.1:27017/frontendatlas',
    });
  });

  test('allows an explicit production override during local work', () => {
    process.env.NODE_ENV = 'development';
    process.env.MONGO_TARGET = 'production';
    process.env.MONGO_URL = 'mongodb://127.0.0.1:27017/frontendatlas';
    process.env.MONGO_URL_TEST = 'mongodb://127.0.0.1:27017/test';

    const { resolveMongoConnectionConfig } = require('../config/mongo');

    expect(resolveMongoConnectionConfig()).toEqual({
      target: 'production',
      uri: 'mongodb://127.0.0.1:27017/frontendatlas',
    });
  });

  test('fails fast when test target is selected without MONGO_URL_TEST', () => {
    process.env.NODE_ENV = 'development';
    process.env.MONGO_TARGET = 'test';
    process.env.MONGO_URL = 'mongodb://127.0.0.1:27017/frontendatlas';
    delete process.env.MONGO_URL_TEST;

    const { resolveMongoConnectionConfig } = require('../config/mongo');

    expect(() => resolveMongoConnectionConfig()).toThrow(
      'MONGO_URL_TEST is required when MongoDB target is "test".'
    );
  });
});
