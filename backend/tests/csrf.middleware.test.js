'use strict';

const express = require('express');
const request = require('supertest');

const ORIGINAL_ENV = { ...process.env };

function createApp(sameSite) {
  jest.resetModules();
  process.env.COOKIE_SAMESITE = sameSite;
  process.env.COOKIE_SECURE = sameSite === 'none' ? 'true' : 'false';
  const { cookieCsrfProtection } = require('../middleware/Csrf');
  const app = express();
  app.use(require('cookie-parser')());
  app.use(cookieCsrfProtection);
  app.get('/protected', (_req, res) => res.json({ ok: true }));
  app.post('/protected', (_req, res) => res.json({ ok: true }));
  return app;
}

describe.each(['lax', 'none'])('cookie CSRF middleware with SameSite=%s', (sameSite) => {
  afterEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  test('rejects missing/mismatched tokens and accepts a matching token', async () => {
    const app = createApp(sameSite);
    const authCookie = 'access_token=test-access';

    const missing = await request(app).post('/protected').set('Cookie', [authCookie]);
    expect(missing.status).toBe(403);
    expect(missing.body?.code).toBe('AUTH_CSRF_INVALID');

    const mismatched = await request(app)
      .post('/protected')
      .set('Cookie', [authCookie, 'csrf_token=expected'])
      .set('X-CSRF-Token', 'different');
    expect(mismatched.status).toBe(403);

    const accepted = await request(app)
      .post('/protected')
      .set('Cookie', [authCookie, 'csrf_token=expected'])
      .set('X-CSRF-Token', 'expected');
    expect(accepted.status).toBe(200);
  });

  test('repairs safe cookie sessions and leaves requests without auth cookies untouched', async () => {
    const app = createApp(sameSite);

    const repaired = await request(app).get('/protected').set('Cookie', ['access_token=test-access']);
    const csrfCookie = repaired.headers['set-cookie']?.find((cookie) => cookie.startsWith('csrf_token='));
    expect(repaired.status).toBe(200);
    expect(csrfCookie).toBeTruthy();
    const csrfCookieAttributes = String(csrfCookie)
      .split(';')
      .map((attribute) => attribute.trim().toLowerCase());
    expect(csrfCookieAttributes).not.toContain('httponly');
    expect(csrfCookieAttributes).toContain(`samesite=${sameSite}`);

    const publicUnsafe = await request(app).post('/protected');
    expect(publicUnsafe.status).toBe(200);
  });
});
