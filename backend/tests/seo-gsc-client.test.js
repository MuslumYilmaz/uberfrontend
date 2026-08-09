'use strict';

const {
  GscRequestError,
  SEARCH_ANALYTICS_DAILY_CAP,
  createGscClient,
} = require('../services/seo/gsc-client');

function response(status, payload) {
  return { ok: status >= 200 && status < 300, status, json: jest.fn().mockResolvedValue(payload) };
}

function clientWith(fetchImpl, extras = {}) {
  return createGscClient({
    credentials: { client_email: 'gsc@example.test', private_key: 'test-key' },
    fetchImpl,
    authFactory: () => ({
      getClient: async () => ({ getAccessToken: async () => ({ token: 'access-token' }) }),
    }),
    sleepImpl: jest.fn().mockResolvedValue(undefined),
    randomImpl: () => 0,
    ...extras,
  });
}

describe('GSC readonly client', () => {
  test('paginates at 25k and marks the 50k daily cap as truncated', async () => {
    const makeRows = (count, offset) => Array.from({ length: count }, (_, index) => ({
      keys: [`https://frontendatlas.com/p-${offset + index}`], clicks: 1, impressions: 2, position: 3,
    }));
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(response(200, { rows: makeRows(25_000, 0) }))
      .mockResolvedValueOnce(response(200, { rows: makeRows(25_000, 25_000) }));
    const result = await clientWith(fetchImpl).querySearchAnalytics({
      siteUrl: 'sc-domain:frontendatlas.com', date: '2026-08-01', dimensions: ['page'],
    });
    expect(result.rows).toHaveLength(SEARCH_ANALYTICS_DAILY_CAP);
    expect(result.truncated).toBe(true);
    const secondBody = JSON.parse(fetchImpl.mock.calls[1][1].body);
    expect(secondBody).toEqual(expect.objectContaining({ startRow: 25_000, rowLimit: 25_000, dataState: 'final', type: 'web' }));
    expect(fetchImpl.mock.calls[0][0]).toContain('https://www.googleapis.com/webmasters/v3/');
  });

  test('retries 429 with bounded backoff but does not retry a permanent 403', async () => {
    const sleepImpl = jest.fn().mockResolvedValue(undefined);
    const retryFetch = jest.fn()
      .mockResolvedValueOnce(response(429, {}))
      .mockResolvedValueOnce(response(200, { rows: [] }));
    await clientWith(retryFetch, { sleepImpl }).querySearchAnalytics({
      siteUrl: 'sc-domain:frontendatlas.com', date: '2026-08-01', dimensions: [],
    });
    expect(retryFetch).toHaveBeenCalledTimes(2);
    expect(sleepImpl).toHaveBeenCalledWith(250);
    expect(JSON.parse(retryFetch.mock.calls[1][1].body).aggregationType).toBe('byProperty');

    const forbiddenFetch = jest.fn().mockResolvedValue(response(403, {}));
    await expect(clientWith(forbiddenFetch).querySearchAnalytics({
      siteUrl: 'sc-domain:frontendatlas.com', date: '2026-08-01', dimensions: ['page'],
    })).rejects.toEqual(expect.objectContaining({ code: 'GSC_REQUEST_FAILED', status: 403 }));
    expect(forbiddenFetch).toHaveBeenCalledTimes(1);
  });

  test('discovers the latest available final date instead of trusting a zero-row candidate', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(response(200, {
      rows: [{ keys: ['2026-08-02'] }, { keys: ['2026-08-03'] }],
    }));
    const latest = await clientWith(fetchImpl).discoverLatestFinalizedDate({
      siteUrl: 'sc-domain:frontendatlas.com', startDate: '2026-07-28', endDate: '2026-08-05',
    });
    expect(latest).toBe('2026-08-03');
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body).toEqual(expect.objectContaining({ dimensions: ['date'], dataState: 'final' }));
  });

  test('aborts a hung request and surfaces a retryable timeout without leaking request content', async () => {
    const fetchImpl = jest.fn((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    }));
    await expect(clientWith(fetchImpl, { requestTimeoutMs: 1, maxAttempts: 1 }).querySearchAnalytics({
      siteUrl: 'sc-domain:frontendatlas.com', date: '2026-08-01', dimensions: ['page', 'query'],
    })).rejects.toEqual(expect.objectContaining({ code: 'GSC_RETRYABLE', message: 'GSC request timed out' }));
  });

  test('keeps the timeout active while consuming JSON and while obtaining an auth token', async () => {
    const stalledJson = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn(() => new Promise(() => {})),
    });
    await expect(clientWith(stalledJson, { requestTimeoutMs: 2, maxAttempts: 1 }).querySearchAnalytics({
      siteUrl: 'sc-domain:frontendatlas.com', date: '2026-08-01', dimensions: [],
    })).rejects.toEqual(expect.objectContaining({ code: 'GSC_RETRYABLE', message: 'GSC request timed out' }));

    const fetchImpl = jest.fn();
    const stalledAuth = clientWith(fetchImpl, {
      requestTimeoutMs: 2,
      maxAttempts: 1,
      authFactory: () => ({ getClient: () => new Promise(() => {}) }),
    });
    await expect(stalledAuth.querySearchAnalytics({
      siteUrl: 'sc-domain:frontendatlas.com', date: '2026-08-01', dimensions: [],
    })).rejects.toEqual(expect.objectContaining({ code: 'GSC_RETRYABLE', message: 'GSC request timed out' }));
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
