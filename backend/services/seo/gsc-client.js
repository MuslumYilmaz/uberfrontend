'use strict';

const { GoogleAuth } = require('google-auth-library');

const SEARCH_CONSOLE_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const SEARCH_ANALYTICS_ROW_LIMIT = 25_000;
const SEARCH_ANALYTICS_DAILY_CAP = 50_000;

class GscRequestError extends Error {
  constructor(message, status, code = 'GSC_REQUEST_FAILED') {
    super(message);
    this.name = 'GscRequestError';
    this.status = status;
    this.code = code;
  }
}

function createGscClient({
  credentials,
  fetchImpl = global.fetch,
  authFactory,
  sleepImpl = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  randomImpl = Math.random,
  maxAttempts = 4,
  requestTimeoutMs = 25_000,
  AbortControllerImpl = global.AbortController,
  deadlineMs = null,
} = {}) {
  if (!credentials?.client_email || !credentials?.private_key) {
    throw new GscRequestError('GSC service account credentials are not configured', 0, 'GSC_NOT_CONFIGURED');
  }
  if (typeof fetchImpl !== 'function') {
    throw new GscRequestError('A fetch implementation is required', 0, 'GSC_FETCH_UNAVAILABLE');
  }

  const auth = authFactory
    ? authFactory({ credentials, scopes: [SEARCH_CONSOLE_SCOPE] })
    : new GoogleAuth({ credentials, scopes: [SEARCH_CONSOLE_SCOPE] });

  async function accessToken() {
    const client = await auth.getClient();
    const result = await client.getAccessToken();
    const token = typeof result === 'string' ? result : result?.token;
    if (!token) throw new GscRequestError('Unable to obtain a GSC access token', 0, 'GSC_AUTH_FAILED');
    return token;
  }

  async function postJson(url, body) {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const remainingMs = Number.isFinite(deadlineMs) ? deadlineMs - Date.now() : Number.POSITIVE_INFINITY;
      if (remainingMs <= 0) {
        throw new GscRequestError('GSC request deadline exceeded', 0, 'GSC_DEADLINE_EXCEEDED');
      }
      let response;
      const controller = AbortControllerImpl ? new AbortControllerImpl() : null;
      const timeoutForAttempt = Math.max(1, Math.min(requestTimeoutMs, remainingMs));
      let timeout;
      const timeoutPromise = new Promise((_resolve, reject) => {
        timeout = setTimeout(() => {
          controller?.abort();
          reject(Object.assign(new Error('GSC request timed out'), { name: 'AbortError' }));
        }, timeoutForAttempt);
      });
      try {
        const token = await Promise.race([accessToken(), timeoutPromise]);
        response = await Promise.race([fetchImpl(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          ...(controller ? { signal: controller.signal } : {}),
        }), timeoutPromise]);
        if (response.ok) {
          const data = await Promise.race([response.json(), timeoutPromise]);
          clearTimeout(timeout);
          return data;
        }
      } catch (error) {
        clearTimeout(timeout);
        if (attempt === maxAttempts) {
          throw new GscRequestError(
            error?.name === 'AbortError' ? 'GSC request timed out' : 'GSC network request failed',
            0,
            'GSC_RETRYABLE'
          );
        }
        const exponentialMs = Math.min(8000, 250 * (2 ** (attempt - 1)));
        const waitMs = exponentialMs + Math.floor(exponentialMs * 0.25 * randomImpl());
        if (Number.isFinite(deadlineMs) && Date.now() + waitMs >= deadlineMs) {
          throw new GscRequestError('GSC request deadline exceeded', 0, 'GSC_DEADLINE_EXCEEDED');
        }
        await sleepImpl(waitMs);
        continue;
      }
      clearTimeout(timeout);

      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === maxAttempts) {
        throw new GscRequestError(
          `GSC request failed with HTTP ${response.status}`,
          response.status,
          retryable ? 'GSC_RETRYABLE' : 'GSC_REQUEST_FAILED'
        );
      }
      const exponentialMs = Math.min(8000, 250 * (2 ** (attempt - 1)));
      const jitterMs = Math.floor(exponentialMs * 0.25 * randomImpl());
      const waitMs = exponentialMs + jitterMs;
      if (Number.isFinite(deadlineMs) && Date.now() + waitMs >= deadlineMs) {
        throw new GscRequestError('GSC request deadline exceeded', 0, 'GSC_DEADLINE_EXCEEDED');
      }
      await sleepImpl(waitMs);
    }
    throw new GscRequestError('GSC request failed', 0, 'GSC_REQUEST_FAILED');
  }

  async function querySearchAnalytics({ siteUrl, date, dimensions, dimensionFilterGroups = [] }) {
    if (!siteUrl || !date || !Array.isArray(dimensions)) {
      throw new GscRequestError('siteUrl, date, and dimensions are required', 0, 'GSC_INVALID_REQUEST');
    }

    const rows = [];
    let startRow = 0;
    let truncated = false;
    const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;

    while (rows.length < SEARCH_ANALYTICS_DAILY_CAP) {
      const remaining = SEARCH_ANALYTICS_DAILY_CAP - rows.length;
      const rowLimit = Math.min(SEARCH_ANALYTICS_ROW_LIMIT, remaining);
      const payload = await postJson(endpoint, {
        startDate: date,
        endDate: date,
        dimensions,
        type: 'web',
        dataState: 'final',
        aggregationType: dimensions.length ? 'auto' : 'byProperty',
        rowLimit,
        startRow,
        ...(dimensionFilterGroups.length ? { dimensionFilterGroups } : {}),
      });
      const pageRows = Array.isArray(payload?.rows) ? payload.rows : [];
      rows.push(...pageRows.slice(0, remaining));
      if (pageRows.length < rowLimit) break;
      startRow += pageRows.length;
      if (rows.length >= SEARCH_ANALYTICS_DAILY_CAP) {
        truncated = true;
        break;
      }
    }

    return { rows, truncated };
  }

  async function inspectUrl({ siteUrl, inspectionUrl, languageCode = 'en-US' }) {
    const data = await postJson('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
      siteUrl,
      inspectionUrl,
      languageCode,
    });
    return data?.inspectionResult || null;
  }

  async function discoverLatestFinalizedDate({ siteUrl, startDate, endDate }) {
    if (!siteUrl || !startDate || !endDate) {
      throw new GscRequestError('siteUrl, startDate, and endDate are required', 0, 'GSC_INVALID_REQUEST');
    }
    const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
    const payload = await postJson(endpoint, {
      startDate,
      endDate,
      dimensions: ['date'],
      type: 'web',
      dataState: 'final',
      aggregationType: 'auto',
      rowLimit: 25,
      startRow: 0,
    });
    const dates = (Array.isArray(payload?.rows) ? payload.rows : [])
      .map((row) => Array.isArray(row.keys) ? row.keys[0] : null)
      .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(String(date || '')))
      .sort();
    return dates.at(-1) || null;
  }

  return { discoverLatestFinalizedDate, inspectUrl, querySearchAnalytics };
}

module.exports = {
  GscRequestError,
  SEARCH_ANALYTICS_DAILY_CAP,
  SEARCH_ANALYTICS_ROW_LIMIT,
  SEARCH_CONSOLE_SCOPE,
  createGscClient,
};
