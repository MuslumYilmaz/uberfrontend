'use strict';

const { validateAuthRuntimeConfig } = require('../config/auth-runtime');

describe('validateAuthRuntimeConfig', () => {
  test('rejects COOKIE_SAMESITE=none without secure cookies', () => {
    const result = validateAuthRuntimeConfig({
      serverBase: 'https://api.frontendatlas.com',
      frontendOrigins: ['https://frontendatlas.com'],
      cookieSameSite: 'none',
      cookieSecure: 'false',
      cookieDomain: '.frontendatlas.com',
      isProdRuntime: true,
    });

    expect(result.errors).toContain('COOKIE_SAMESITE=none requires COOKIE_SECURE=true.');
  });

  test('rejects cross-site cookie auth unless sameSite is none', () => {
    const result = validateAuthRuntimeConfig({
      serverBase: 'https://api.frontendatlas.com',
      frontendOrigins: ['https://frontendatlas-app.vercel.app'],
      cookieSameSite: 'lax',
      cookieSecure: 'true',
      cookieDomain: '',
      isProdRuntime: true,
    });

    expect(result.errors).toContain('Cross-site frontend origins require COOKIE_SAMESITE=none for cookie auth.');
  });

  test('allows same-site subdomain auth with lax cookies', () => {
    const result = validateAuthRuntimeConfig({
      serverBase: 'https://api.frontendatlas.com',
      frontendOrigins: ['https://frontendatlas.com'],
      cookieSameSite: 'lax',
      cookieSecure: 'true',
      cookieDomain: '.frontendatlas.com',
      isProdRuntime: true,
    });

    expect(result.errors).toEqual([]);
  });
});
