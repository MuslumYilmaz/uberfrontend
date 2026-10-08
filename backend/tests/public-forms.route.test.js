'use strict';

const express = require('express');
const request = require('supertest');
const { createPublicFormsRouter } = require('../routes/public-forms');

function createTestApp(options = {}) {
  const env = {
    NODE_ENV: 'test',
    SMTP_USER: 'noreply@example.com',
    SUPPORT_EMAIL: 'support@frontendatlas.com',
    CONTACT_BURST_MAX: '100',
    CONTACT_MAX: '100',
    BUG_REPORT_BURST_MAX: '100',
    BUG_REPORT_MAX: '100',
    ...options.env,
  };
  const sendMail = options.sendMail || jest.fn().mockResolvedValue({ accepted: ['support@frontendatlas.com'] });
  const app = express();
  app.use(express.json());
  app.use('/api', createPublicFormsRouter({
    env,
    allowedFrontendOrigins: ['https://frontendatlas.com'],
    sendMail,
  }));
  return { app, sendMail };
}

function contact(overrides = {}) {
  return {
    name: 'Alex Frontend',
    email: 'alex@example.com',
    topic: 'general',
    message: 'A sufficiently detailed contact form message for the support team.',
    url: 'https://frontendatlas.com/showcase',
    ...overrides,
  };
}

function bugReport(overrides = {}) {
  return {
    note: 'The submit control remains disabled after changing the selection.',
    url: 'https://frontendatlas.com/showcase',
    ...overrides,
  };
}

describe('public form route contract', () => {
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

  test('rejects an oversized dot-heavy contact email before SMTP', async () => {
    const fixture = createTestApp({ env: { CONTACT_MAX_EMAIL_CHARS: '10000' } });
    const oversizedEmail = `a@${'a.'.repeat(200)}invalid invalid`;

    const response = await request(fixture.app)
      .post('/api/contact')
      .send(contact({ email: oversizedEmail }));

    expect(response.status).toBe(413);
    expect(response.body).toEqual({ error: 'Contact email too long' });
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
    expect(second.body.error).toEqual(expect.any(String));
    expect(second.headers['retry-after']).toBeTruthy();
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
    expect(fixture.sendMail).not.toHaveBeenCalled();
  });

  test('lets a bug report be retried after an SMTP failure, then rejects the repeat', async () => {
    const sendMail = jest.fn()
      .mockRejectedValueOnce(new Error('smtp offline'))
      .mockResolvedValue({ accepted: ['support@frontendatlas.com'] });
    const fixture = createTestApp({ sendMail });
    const payload = bugReport();

    const failed = await request(fixture.app).post('/api/bug-report').send(payload);
    const retried = await request(fixture.app).post('/api/bug-report').send(payload);
    const repeated = await request(fixture.app).post('/api/bug-report').send(payload);

    expect(failed.status).toBe(500);
    expect(retried.status).toBe(204);
    expect(repeated.status).toBe(429);
    expect(sendMail).toHaveBeenCalledTimes(2);
  });

  test('does not log submitted content', async () => {
    const fixture = createTestApp();
    const response = await request(fixture.app).post('/api/bug-report').send(bugReport({
      note: 'private note unique to this logging assertion',
    }));

    expect(response.status).toBe(204);
    const logs = [...consoleInfo.mock.calls, ...consoleWarn.mock.calls].flat().join(' ');
    expect(logs).not.toContain('private note unique to this logging assertion');
  });
});
