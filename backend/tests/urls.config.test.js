'use strict';

describe('backend/config/urls resolveAllowedFrontendOrigins', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.FRONTEND_ORIGINS;
    delete process.env.FRONTEND_ORIGIN;
    delete process.env.FRONTEND_BASE;
    delete process.env.NODE_ENV;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test('includes common local frontend origins outside production', () => {
    process.env.NODE_ENV = 'development';
    process.env.FRONTEND_ORIGINS = 'http://localhost:4200';

    const { resolveAllowedFrontendOrigins } = require('../config/urls');

    expect(resolveAllowedFrontendOrigins()).toEqual(expect.arrayContaining([
      'http://localhost:4200',
      'http://127.0.0.1:4200',
      'http://localhost:4310',
      'http://127.0.0.1:4310',
      'http://localhost:4173',
      'http://127.0.0.1:4173',
    ]));
  });

  test('does not append dev-only localhost origins in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_ORIGINS = 'https://frontendatlas.com';

    const { resolveAllowedFrontendOrigins } = require('../config/urls');

    expect(resolveAllowedFrontendOrigins()).toEqual(['https://frontendatlas.com']);
  });
});
