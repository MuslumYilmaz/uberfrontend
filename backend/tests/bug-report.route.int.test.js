'use strict';

const request = require('supertest');

const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn(() => ({ sendMail: mockSendMail }));

jest.mock('nodemailer', () => ({
  createTransport: (...args) => mockCreateTransport(...args),
}));

let app;

beforeAll(() => {
  process.env.MONGO_URL_TEST = process.env.MONGO_URL_TEST || 'mongodb://127.0.0.1:27017/backend-test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_bug_report_route';
  process.env.SMTP_USER = process.env.SMTP_USER || 'noreply@example.com';
  process.env.SMTP_PASS = process.env.SMTP_PASS || 'test-pass';
  process.env.BUG_REPORT_BURST_WINDOW_MS = '60000';
  process.env.BUG_REPORT_BURST_MAX = '10';
  process.env.BUG_REPORT_WINDOW_MS = '3600000';
  process.env.BUG_REPORT_MAX = '50';
  process.env.BUG_REPORT_DUP_WINDOW_MS = '600000';
  process.env.BUG_REPORT_MIN_NOTE_CHARS = '8';

  jest.resetModules();
  app = require('../index');
});

beforeEach(() => {
  mockSendMail.mockReset();
  mockCreateTransport.mockClear();
  mockSendMail.mockResolvedValue({ accepted: ['mslmyilmaz34@gmail.com'] });
});

describe('POST /api/bug-report anti-spam protections', () => {
  test('accepts a valid bug report and sends one email', async () => {
    const res = await request(app)
      .post('/api/bug-report')
      .send({
        note: 'Submit button stays disabled after selecting a framework.',
        url: 'https://frontendatlas.com/react/trivia/q1',
      });

    expect(res.status).toBe(204);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  test('rejects duplicate bug report payload from same client in dedupe window', async () => {
    const payload = {
      note: 'The modal closes and reopens immediately when pressing escape.',
      url: 'https://frontendatlas.com/system-design/cache',
    };

    const first = await request(app).post('/api/bug-report').send(payload);
    const second = await request(app).post('/api/bug-report').send(payload);

    expect(first.status).toBe(204);
    expect(second.status).toBe(429);
    expect(second.body).toEqual(expect.objectContaining({
      error: expect.stringContaining('Duplicate bug report'),
    }));
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  test('rejects very short notes before attempting email send', async () => {
    const res = await request(app)
      .post('/api/bug-report')
      .send({
        note: 'short',
        url: 'https://frontendatlas.com/dashboard',
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({
      error: expect.stringContaining('at least'),
    }));
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});
