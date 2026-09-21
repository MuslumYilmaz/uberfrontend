'use strict';

const ORIGINAL_ENV = { ...process.env };

describe('Mongo runtime config', () => {
  function clearVercelPreview() {
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
  }

  afterEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test('defaults local non-production runtime to the test database when MONGO_URL_TEST is set', () => {
    clearVercelPreview();
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
    clearVercelPreview();
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
    clearVercelPreview();
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
    clearVercelPreview();
    process.env.NODE_ENV = 'development';
    process.env.MONGO_TARGET = 'test';
    process.env.MONGO_URL = 'mongodb://127.0.0.1:27017/frontendatlas';
    delete process.env.MONGO_URL_TEST;

    const { resolveMongoConnectionConfig } = require('../config/mongo');

    expect(() => resolveMongoConnectionConfig()).toThrow(
      'MONGO_URL_TEST is required when MongoDB target is "test".'
    );
  });

  test('fails closed when a Vercel Preview would default to the production target', () => {
    process.env.NODE_ENV = 'production';
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'preview';
    process.env.MONGO_URL = 'mongodb+srv://example.invalid/frontendatlas';
    delete process.env.MONGO_TARGET;
    delete process.env.MONGO_URL_TEST;
    delete process.env.EXPECTED_MONGO_DB_NAME_TEST;

    const { resolveMongoConnectionConfig } = require('../config/mongo');

    expect(() => resolveMongoConnectionConfig()).toThrow(
      'set the Preview-scoped MONGO_TARGET exactly to "test".'
    );
  });

  test('rejects a production MONGO_URL leaked into the Vercel Preview scope', () => {
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_ENV = 'preview';
    process.env.MONGO_TARGET = 'test';
    process.env.MONGO_URL = 'mongodb+srv://example.invalid/frontendatlas';
    process.env.MONGO_URL_TEST = 'mongodb+srv://preview.invalid/frontendatlas_preview';
    process.env.EXPECTED_MONGO_DB_NAME_TEST = 'frontendatlas_preview';

    const { resolveMongoConnectionConfig } = require('../config/mongo');

    expect(() => resolveMongoConnectionConfig()).toThrow(
      'MONGO_URL must not exist in the Preview environment scope.'
    );
  });

  test('rejects a Vercel Preview test URI whose database does not match the expected name', () => {
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_ENV = 'preview';
    process.env.MONGO_TARGET = 'test';
    process.env.MONGO_URL = '';
    process.env.MONGO_URL_TEST = 'mongodb+srv://preview.invalid/wrong_preview';
    process.env.EXPECTED_MONGO_DB_NAME_TEST = 'frontendatlas_preview';

    const { resolveMongoConnectionConfig } = require('../config/mongo');

    expect(() => resolveMongoConnectionConfig()).toThrow(
      'MONGO_URL_TEST database must match EXPECTED_MONGO_DB_NAME_TEST'
    );
  });

  test('rejects the production database name even when Vercel Preview variables agree', () => {
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_ENV = 'preview';
    process.env.MONGO_TARGET = 'test';
    process.env.MONGO_URL = '';
    process.env.MONGO_URL_TEST = 'mongodb+srv://preview.invalid/frontendatlas';
    process.env.EXPECTED_MONGO_DB_NAME_TEST = 'frontendatlas';

    const { resolveMongoConnectionConfig } = require('../config/mongo');

    expect(() => resolveMongoConnectionConfig()).toThrow(
      'the production "frontendatlas" database is forbidden.'
    );
  });

  test('accepts an explicitly isolated Vercel Preview database contract', () => {
    process.env.NODE_ENV = 'production';
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'preview';
    process.env.MONGO_TARGET = 'test';
    process.env.MONGO_URL = '';
    process.env.MONGO_URL_TEST = 'mongodb+srv://preview.invalid/frontendatlas_preview';
    process.env.EXPECTED_MONGO_DB_NAME_TEST = 'frontendatlas_preview';

    const { resolveMongoConnectionConfig } = require('../config/mongo');

    expect(resolveMongoConnectionConfig()).toEqual({
      target: 'test',
      uri: 'mongodb+srv://preview.invalid/frontendatlas_preview',
    });
  });
});
