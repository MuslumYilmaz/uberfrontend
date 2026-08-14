'use strict';

const request = require('supertest');

const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn(() => ({ sendMail: mockSendMail }));

jest.mock('nodemailer', () => ({
  createTransport: (...args) => mockCreateTransport(...args),
}));

let app;
const originalFetch = global.fetch;
const originalEnv = { ...process.env };

function mockTurnstileSuccess(action = 'contact') {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      action,
      hostname: 'frontendatlas.com',
      challenge_ts: new Date().toISOString(),
      'error-codes': [],
    }),
  });
}

beforeAll(() => {
  process.env.MONGO_URL_TEST = process.env.MONGO_URL_TEST || 'mongodb://127.0.0.1:27017/backend-test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_contact_route';
  process.env.SMTP_USER = process.env.SMTP_USER || 'noreply@example.com';
  process.env.SMTP_PASS = process.env.SMTP_PASS || 'test-pass';
  process.env.SUPPORT_EMAIL = 'support@frontendatlas.com';
  process.env.FRONTEND_ORIGINS = 'https://frontendatlas.com';
  process.env.CONTACT_BURST_WINDOW_MS = '60000';
  process.env.CONTACT_BURST_MAX = '10';
  process.env.CONTACT_WINDOW_MS = '3600000';
  process.env.CONTACT_MAX = '50';
  process.env.CONTACT_EMAIL_HOURLY_MAX = '50';
  process.env.CONTACT_EMAIL_DAILY_MAX = '50';
  process.env.CONTACT_MIN_MESSAGE_CHARS = '10';
  process.env.PUBLIC_FORM_REDIS_REQUIRED = 'false';
  process.env.TURNSTILE_SECRET_KEY = 'test-turnstile-secret';
  process.env.TURNSTILE_ALLOWED_HOSTNAMES = 'frontendatlas.com';

  jest.resetModules();
  app = require('../index');
});

beforeEach(() => {
  mockSendMail.mockReset();
  mockCreateTransport.mockClear();
  mockSendMail.mockResolvedValue({ accepted: ['support@frontendatlas.com'] });
  mockTurnstileSuccess();
});

afterAll(() => {
  global.fetch = originalFetch;
  process.env = originalEnv;
});

describe('POST /api/contact', () => {
  test('accepts a valid contact form submission and emails support', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({
        name: 'Alex Frontend',
        email: 'alex@example.com',
        topic: 'feature',
        message: 'Can you add more incident drills for React state debugging?',
        url: 'https://frontendatlas.com/',
        verificationToken: 'valid-contact-turnstile-token',
        website: '',
      });

    expect(res.status).toBe(204);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'support@frontendatlas.com',
      replyTo: 'alex@example.com',
      subject: expect.stringContaining('feature'),
    }));
  });

  test('rejects invalid email before attempting send', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({
        name: 'Alex Frontend',
        email: 'not-an-email',
        topic: 'general',
        message: 'This should not be accepted because the sender email is invalid.',
        verificationToken: 'valid-contact-turnstile-token',
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({
      error: expect.stringContaining('valid email'),
    }));
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  test('rejects too-short messages before attempting send', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({
        name: 'Alex Frontend',
        email: 'alex@example.com',
        topic: 'general',
        message: 'too short',
        verificationToken: 'valid-contact-turnstile-token',
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({
      error: expect.stringContaining('at least'),
    }));
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  test('requires a verification token before attempting send', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({
        name: 'Alex Frontend',
        email: 'verification-required@example.com',
        topic: 'general',
        message: 'This valid message intentionally omits the verification token.',
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      code: 'FORM_VERIFICATION_REQUIRED',
      error: expect.any(String),
    });
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  test('silently accepts a filled honeypot without verification or email', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({
        name: 'Automated Sender',
        email: 'bot@example.com',
        topic: 'general',
        message: 'Automated spam content long enough for payload validation.',
        website: 'https://spam.example',
      });

    expect(res.status).toBe(204);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  test('rejects a URL outside configured frontend origins', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({
        name: 'Alex Frontend',
        email: 'bad-url@example.com',
        topic: 'general',
        message: 'This submission uses an untrusted page URL and must be rejected.',
        url: 'https://attacker.example/phishing',
        verificationToken: 'valid-contact-turnstile-token',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('allowed frontend URL');
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});
