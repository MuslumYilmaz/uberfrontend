'use strict';

const express = require('express');
const request = require('supertest');

jest.mock('../models/SeoSyncRun', () => ({ exists: jest.fn() }));
jest.mock('../services/seo/config', () => ({ getSeoRuntimeConfig: jest.fn() }));
jest.mock('../services/seo/opportunity-api', () => ({
  getQueryOpportunityExamples: jest.fn(),
  listOpportunities: jest.fn(),
  promoteOpportunity: jest.fn(),
  putSerpReview: jest.fn(),
}));
jest.mock('../services/seo/sync', () => {
  class SeoSyncError extends Error {
    constructor(message, status = 500, code = 'SEO_SYNC_FAILED') {
      super(message);
      this.status = status;
      this.code = code;
    }
  }
  return { SeoSyncError, runSeoAnalysis: jest.fn(), runSeoSync: jest.fn() };
});

const SeoSyncRun = require('../models/SeoSyncRun');
const { getSeoRuntimeConfig } = require('../services/seo/config');
const { getQueryOpportunityExamples } = require('../services/seo/opportunity-api');
const { SeoSyncError, runSeoAnalysis, runSeoSync } = require('../services/seo/sync');
const seoAdminRouter = require('../routes/seo-admin');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(seoAdminRouter);
  return app;
}

describe('SEO admin manual sync policy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSeoRuntimeConfig.mockReturnValue({
      enabled: true,
      configured: true,
      siteUrl: 'sc-domain:frontendatlas.com',
      datesPerRun: 90,
      syncBudgetMs: 220_000,
    });
    SeoSyncRun.exists.mockResolvedValue(false);
  });

  test('uses a bounded batch and reports every completed GSC date', async () => {
    runSeoSync.mockResolvedValue({
      runId: 'manual-batch-1',
      status: 'partial',
      datesAttempted: ['2026-08-04', '2026-08-03', '2026-08-02'],
      datesCompleted: ['2026-08-04', '2026-08-03'],
    });

    const response = await request(createApp()).post('/sync').send({});

    expect(response.status).toBe(200);
    expect(runSeoSync).toHaveBeenCalledWith({
      config: expect.objectContaining({
        datesPerRun: 30,
        syncBudgetMs: 45_000,
        hardDeadlineBudgetMs: 60_000,
        enrichmentEnabled: true,
      }),
      trigger: 'manual',
    });
    expect(response.body).toEqual(expect.objectContaining({
      accepted: true,
      status: 'partial',
      datesCompleted: ['2026-08-03', '2026-08-04'],
      datesAttempted: ['2026-08-04', '2026-08-03', '2026-08-02'],
    }));
    expect(response.body.message).toContain('2 finalized GSC dates synchronized (2026-08-03–2026-08-04)');
    expect(response.body.message).toContain('resume from the next missing date');
  });

  test('keeps repeated manual requests behind the shorter cooldown', async () => {
    SeoSyncRun.exists.mockResolvedValue(true);

    const response = await request(createApp()).post('/sync').send({});

    expect(response.status).toBe(429);
    expect(response.body).toEqual(expect.objectContaining({
      accepted: false,
      status: 'busy',
      message: 'Manual sync has a 2-minute cooldown.',
    }));
    expect(runSeoSync).not.toHaveBeenCalled();
  });
});

describe('SEO admin manual analysis policy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSeoRuntimeConfig.mockReturnValue({
      enabled: true,
      configured: true,
      siteUrl: 'sc-domain:frontendatlas.com',
      storageBudgetBytes: 128 * 1024 * 1024,
    });
  });

  test('returns only the sanitized analysis lifecycle', async () => {
    runSeoAnalysis.mockResolvedValue({
      runId: 'analysis-1',
      status: 'complete',
      analysis: {
        status: 'complete',
        reason: 'analysis_complete',
        ruleVersion: 'balanced-v2.2',
        endDate: '2026-08-04',
        evaluatedPages: 435,
        totalPages: 435,
      },
      privateDetectorPayload: 'must-not-leak',
      visibilityInspection: { inspected: 5, raw: 'must-not-leak-inspection' },
    });

    const response = await request(createApp()).post('/analyze').send({});

    expect(response.status).toBe(200);
    expect(runSeoAnalysis).toHaveBeenCalledWith(expect.objectContaining({
      config: expect.objectContaining({ siteUrl: 'sc-domain:frontendatlas.com' }),
      deadlineBudgetMs: 55_000,
    }));
    expect(response.body).toEqual({
      accepted: true,
      runId: 'analysis-1',
      status: 'complete',
      analysis: expect.objectContaining({
        status: 'complete',
        ruleVersion: 'balanced-v2.2',
        evaluatedPages: 435,
        totalPages: 435,
      }),
    });
    expect(JSON.stringify(response.body)).not.toContain('must-not-leak');
    expect(response.body).not.toHaveProperty('visibilityInspection');
  });

  test('reports the shared lease conflict as busy', async () => {
    runSeoAnalysis.mockRejectedValue(
      new SeoSyncError('An SEO sync or analysis is already running', 409, 'SEO_ANALYSIS_BUSY')
    );

    const response = await request(createApp()).post('/analyze').send({});

    expect(response.status).toBe(429);
    expect(response.body).toEqual({
      accepted: false,
      status: 'busy',
      message: 'An SEO sync or analysis is already running',
    });
  });

  test('fails closed when the SEO integration is not configured', async () => {
    getSeoRuntimeConfig.mockReturnValue({ enabled: true, configured: false });

    const response = await request(createApp()).post('/analyze').send({});

    expect(response.status).toBe(503);
    expect(response.body).toEqual(expect.objectContaining({
      accepted: false,
      status: 'disabled',
    }));
    expect(runSeoAnalysis).not.toHaveBeenCalled();
  });
});

describe('SEO opportunity route safety policy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RATE_LIMIT_STORE = 'memory';
    getSeoRuntimeConfig.mockReturnValue({
      enabled: true,
      configured: true,
      siteUrl: 'sc-domain:frontendatlas.com',
    });
    getQueryOpportunityExamples.mockResolvedValue({
      assessmentInputHash: 'a'.repeat(64),
      opportunityKey: 'b'.repeat(64),
      items: [],
      totalVisibleMembers: 0,
      truncated: false,
    });
  });

  test('keeps examples private/no-store and rate-limits repeated raw-query requests', async () => {
    const url = `/pages/${'c'.repeat(64)}/query-opportunities/${'b'.repeat(64)}/examples`
      + `?assessmentInputHash=${'a'.repeat(64)}`;
    const responses = [];
    for (let index = 0; index < 11; index += 1) {
      // Sequential requests exercise the same owner/IP limiter key.
      // eslint-disable-next-line no-await-in-loop
      responses.push(await request(createApp()).get(url));
    }

    expect(responses.slice(0, 10).map((response) => response.status))
      .toEqual(Array.from({ length: 10 }, () => 200));
    expect(responses[0].headers['cache-control']).toBe('private, no-store, max-age=0');
    expect(responses[0].headers['x-robots-tag']).toBe('noindex, nofollow');
    expect(responses[10].status).toBe(429);
    expect(responses[10].body).toEqual({
      code: 'SEO_OPPORTUNITY_EXAMPLES_RATE_LIMITED',
      error: 'Too many query example requests. Please wait and try again.',
    });
    expect(responses[10].headers['retry-after']).toBeDefined();
    expect(getQueryOpportunityExamples).toHaveBeenCalledTimes(10);
  });
});
