'use strict';

const { requireCronSecret } = require('../routes/seo-internal');

function authorize(value) {
  const next = jest.fn();
  const response = {
    statusCode: 200,
    body: null,
    headers: {},
    set: jest.fn(function set(name, value) {
      this.headers[String(name).toLowerCase()] = value;
      return this;
    }),
    status: jest.fn(function status(code) {
      this.statusCode = code;
      return this;
    }),
    json: jest.fn(function json(body) {
      this.body = body;
      return this;
    }),
  };
  requireCronSecret({ headers: { authorization: value || '' } }, response, next);
  return { next, response };
}

function expectPrivateSeoHeaders(response) {
  expect(response.headers['cache-control']).toBe('private, no-store, max-age=0');
  expect(response.headers['x-robots-tag']).toBe('noindex, nofollow');
}

describe('SEO internal cron authentication', () => {
  const originalSecret = process.env.CRON_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret;
  });

  test('fails closed when the configured secret is shorter than 32 characters', () => {
    process.env.CRON_SECRET = 'short-but-matching';
    const { next, response } = authorize('Bearer short-but-matching');

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
    expectPrivateSeoHeaders(response);
    expect(next).not.toHaveBeenCalled();
  });

  test.each([
    ['', 'missing authorization'],
    ['Basic credentials', 'non-bearer scheme'],
    ['Bearer', 'missing bearer value'],
  ])('rejects %s (%s)', (authorization) => {
    process.env.CRON_SECRET = 'seo-cron-secret-with-at-least-32-chars';
    const { next, response } = authorize(authorization);

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
    expectPrivateSeoHeaders(response);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects a wrong secret and accepts the exact strong secret', () => {
    const secret = 'seo-cron-secret-with-at-least-32-chars';
    process.env.CRON_SECRET = secret;
    const wrong = authorize(`Bearer ${'x'.repeat(secret.length)}`);
    const valid = authorize(`Bearer ${secret}`);

    expect(wrong.response.statusCode).toBe(401);
    expect(wrong.response.body).toEqual({ error: 'Unauthorized' });
    expectPrivateSeoHeaders(wrong.response);
    expect(wrong.next).not.toHaveBeenCalled();
    expect(valid.response.statusCode).toBe(200);
    expect(valid.response.body).toBeNull();
    expectPrivateSeoHeaders(valid.response);
    expect(valid.next).toHaveBeenCalledTimes(1);
  });
});
