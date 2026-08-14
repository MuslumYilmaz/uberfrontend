'use strict';

const express = require('express');
const request = require('supertest');
const publicFormsModule = require('../routes/public-forms');
const {
  createMemoryPublicFormStore,
  protectionUnavailableError,
  verificationFailedError,
  verificationRequiredError,
} = require('../services/public-form-protection');

const { createPublicFormsRouter } = publicFormsModule;

function createTestApp(options = {}) {
  const env = {
    NODE_ENV: 'test',
    SMTP_USER: 'noreply@example.com',
    SUPPORT_EMAIL: 'support@frontendatlas.com',
    PUBLIC_FORM_REDIS_REQUIRED: 'false',
    CONTACT_BURST_MAX: '100',
    CONTACT_MAX: '100',
    CONTACT_EMAIL_HOURLY_MAX: '100',
    CONTACT_EMAIL_DAILY_MAX: '100',
    BUG_REPORT_BURST_MAX: '100',
    BUG_REPORT_MAX: '100',
    ...options.env,
  };
  const sendMail = options.sendMail || jest.fn().mockResolvedValue({ accepted: ['support@frontendatlas.com'] });
  const verifyTurnstile = options.verifyTurnstile || jest.fn().mockResolvedValue(true);
  const store = options.store || createMemoryPublicFormStore();
  const app = express();
  app.use(express.json());
  app.use('/api', createPublicFormsRouter({
    env,
    allowedFrontendOrigins: ['https://frontendatlas.com'],
    sendMail,
    verifyTurnstile,
    store,
  }));
  return { app, sendMail, verifyTurnstile, store };
}

function contact(overrides = {}) {
  return {
    name: 'Alex Frontend',
    email: 'alex@example.com',
    topic: 'general',
    message: 'A sufficiently detailed contact form message for the support team.',
    url: 'https://frontendatlas.com/showcase',
    website: '',
    verificationToken: 'valid-turnstile-token-value',
    ...overrides,
  };
}

function bugReport(overrides = {}) {
  return {
    note: 'The submit control remains disabled after changing the selection.',
    url: 'https://frontendatlas.com/showcase',
    website: '',
    verificationToken: 'valid-turnstile-token-value',
    ...overrides,
  };
}

describe('public form route protection contract', () => {
  let consoleInfo;
  let consoleWarn;

  beforeEach(() => {
    consoleInfo = jest.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleInfo.mockRestore();
    consoleWarn.mockRestore();
  });

  test('returns the standardized missing and failed verification errors without SMTP', async () => {
    const required = createTestApp({
      verifyTurnstile: jest.fn().mockRejectedValue(verificationRequiredError()),
    });
    const failed = createTestApp({
      verifyTurnstile: jest.fn().mockRejectedValue(verificationFailedError()),
    });

    const missingResponse = await request(required.app).post('/api/contact').send(contact({ verificationToken: '' }));
    const failedResponse = await request(failed.app).post('/api/bug-report').send(bugReport());

    expect(missingResponse.status).toBe(400);
    expect(missingResponse.body.code).toBe('FORM_VERIFICATION_REQUIRED');
    expect(failedResponse.status).toBe(403);
    expect(failedResponse.body.code).toBe('FORM_VERIFICATION_FAILED');
    expect(required.sendMail).not.toHaveBeenCalled();
    expect(failed.sendMail).not.toHaveBeenCalled();
  });

  test('rejects an oversized dot-heavy contact email before Turnstile and SMTP', async () => {
    const store = {
      increment: jest.fn().mockResolvedValue({ count: 1, ttlSeconds: 60 }),
      claim: jest.fn(),
      release: jest.fn(),
    };
    const fixture = createTestApp({
      store,
      env: { CONTACT_MAX_EMAIL_CHARS: '10000' },
    });
    const oversizedEmail = `a@${'a.'.repeat(200)}invalid invalid`;

    const response = await request(fixture.app)
      .post('/api/contact')
      .send(contact({ email: oversizedEmail }));

    expect(response.status).toBe(413);
    expect(response.body).toEqual({ error: 'Contact email too long' });
    expect(store.increment).toHaveBeenCalledTimes(2);
    expect(store.claim).not.toHaveBeenCalled();
    expect(fixture.verifyTurnstile).not.toHaveBeenCalled();
    expect(fixture.sendMail).not.toHaveBeenCalled();
  });

  test.each([
    ['/api/contact', contact({ website: 'https://spam.example', verificationToken: '' })],
    ['/api/bug-report', bugReport({ website: 'https://spam.example', verificationToken: '' })],
  ])('runs the IP quota before treating a filled honeypot as a fake success on %s', async (path, payload) => {
    const store = {
      increment: jest.fn().mockResolvedValue({ count: 1, ttlSeconds: 60 }),
      claim: jest.fn(),
      release: jest.fn(),
    };
    const fixture = createTestApp({ store });

    const response = await request(fixture.app).post(path).send(payload);

    expect(response.status).toBe(204);
    expect(store.increment).toHaveBeenCalledTimes(2);
    expect(fixture.verifyTurnstile).not.toHaveBeenCalled();
    expect(fixture.sendMail).not.toHaveBeenCalled();
  });

  test('fails closed with 503 when the public-form Redis store is unavailable', async () => {
    const fixture = createTestApp({
      store: {
        increment: jest.fn().mockRejectedValue(new Error('redis offline')),
        claim: jest.fn(),
        release: jest.fn(),
      },
    });

    const response = await request(fixture.app).post('/api/contact').send(contact());

    expect(response.status).toBe(503);
    expect(response.body.code).toBe('FORM_PROTECTION_UNAVAILABLE');
    expect(fixture.verifyTurnstile).not.toHaveBeenCalled();
    expect(fixture.sendMail).not.toHaveBeenCalled();
  });

  test('fails closed with 503 when Turnstile is unavailable and does not call SMTP', async () => {
    const fixture = createTestApp({
      verifyTurnstile: jest.fn().mockRejectedValue(protectionUnavailableError('turnstile_unavailable')),
    });

    const response = await request(fixture.app).post('/api/bug-report').send(bugReport());

    expect(response.status).toBe(503);
    expect(response.body.code).toBe('FORM_PROTECTION_UNAVAILABLE');
    expect(fixture.sendMail).not.toHaveBeenCalled();
  });

  test.each([
    ['contact burst', '/api/contact', { CONTACT_BURST_MAX: '1' }, contact(), contact({ email: 'other@example.com', message: 'A different contact message stopped by the IP quota.' })],
    ['contact hourly', '/api/contact', { CONTACT_MAX: '1' }, contact(), contact({ email: 'other@example.com', message: 'Another contact message stopped by the hourly IP quota.' })],
    ['bug burst', '/api/bug-report', { BUG_REPORT_BURST_MAX: '1' }, bugReport(), bugReport({ note: 'A different bug note stopped by the IP burst quota.' })],
    ['bug hourly', '/api/bug-report', { BUG_REPORT_MAX: '1' }, bugReport(), bugReport({ note: 'A different bug note stopped by the hourly IP quota.' })],
  ])('enforces the %s limit with Retry-After', async (_label, path, env, firstPayload, secondPayload) => {
    const fixture = createTestApp({ env });

    const first = await request(fixture.app).post(path).send(firstPayload);
    const second = await request(fixture.app).post(path).send(secondPayload);

    expect(first.status).toBe(204);
    expect(second.status).toBe(429);
    expect(second.body.code).toBe('FORM_RATE_LIMITED');
    expect(second.headers['retry-after']).toBeTruthy();
    expect(fixture.sendMail).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['hourly', { CONTACT_EMAIL_HOURLY_MAX: '1' }],
    ['daily', { CONTACT_EMAIL_DAILY_MAX: '1' }],
  ])('enforces normalized contact email %s quotas after Turnstile', async (_label, env) => {
    const fixture = createTestApp({ env });

    const first = await request(fixture.app).post('/api/contact').send(contact({ email: 'Alex@Example.com' }));
    const second = await request(fixture.app).post('/api/contact').send(contact({
      email: ' alex@example.com ',
      message: 'A distinct second message using the same normalized sender address.',
    }));

    expect(first.status).toBe(204);
    expect(second.status).toBe(429);
    expect(second.body.code).toBe('FORM_RATE_LIMITED');
    expect(fixture.verifyTurnstile).toHaveBeenCalledTimes(2);
    expect(fixture.sendMail).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['/api/contact', contact({ url: 'javascript:alert(1)' })],
    ['/api/bug-report', bugReport({ url: 'https://attacker.example/report' })],
    ['/api/contact', contact({ url: 'https://user:password@frontendatlas.com/private' })],
  ])('rejects disallowed public-form URLs on %s', async (path, payload) => {
    const fixture = createTestApp();
    const response = await request(fixture.app).post(path).send(payload);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('allowed frontend URL');
    expect(fixture.verifyTurnstile).not.toHaveBeenCalled();
    expect(fixture.sendMail).not.toHaveBeenCalled();
  });

  test('uses exact contact duplicate detection and includes Retry-After', async () => {
    const fixture = createTestApp();
    const payload = contact();

    const first = await request(fixture.app).post('/api/contact').send(payload);
    const second = await request(fixture.app).post('/api/contact').send(payload);

    expect(first.status).toBe(204);
    expect(second.status).toBe(429);
    expect(second.body.code).toBe('FORM_RATE_LIMITED');
    expect(second.headers['retry-after']).toBeTruthy();
    expect(fixture.sendMail).toHaveBeenCalledTimes(1);
  });

  test('releases a bug-report duplicate claim after SMTP failure', async () => {
    const sendMail = jest.fn()
      .mockRejectedValueOnce(new Error('smtp offline'))
      .mockResolvedValueOnce({ accepted: ['support@frontendatlas.com'] });
    const fixture = createTestApp({ sendMail });
    const payload = bugReport();

    const failed = await request(fixture.app).post('/api/bug-report').send(payload);
    const retried = await request(fixture.app).post('/api/bug-report').send(payload);

    expect(failed.status).toBe(500);
    expect(retried.status).toBe(204);
    expect(sendMail).toHaveBeenCalledTimes(2);
  });

  test('passes action and remote IP to Turnstile without logging submitted PII', async () => {
    const fixture = createTestApp();
    const response = await request(fixture.app).post('/api/bug-report').send(bugReport({
      note: 'private note unique to this logging assertion',
    }));

    expect(response.status).toBe(204);
    expect(fixture.verifyTurnstile).toHaveBeenCalledWith(expect.objectContaining({
      expectedAction: 'bug_report',
      remoteIp: expect.any(String),
    }));
    const logs = [...consoleInfo.mock.calls, ...consoleWarn.mock.calls].flat().join(' ');
    expect(logs).not.toContain('private note unique to this logging assertion');
  });
});
