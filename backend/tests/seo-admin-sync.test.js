'use strict';

const express = require('express');
const request = require('supertest');

jest.mock('../models/SeoSyncRun', () => ({ exists: jest.fn() }));
jest.mock('../services/seo/config', () => ({ getSeoRuntimeConfig: jest.fn() }));
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
        ruleVersion: 'balanced-v2.1',
        endDate: '2026-08-04',
        evaluatedPages: 435,
        totalPages: 435,
      },
      privateDetectorPayload: 'must-not-leak',
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
        ruleVersion: 'balanced-v2.1',
        evaluatedPages: 435,
        totalPages: 435,
      }),
    });
    expect(JSON.stringify(response.body)).not.toContain('must-not-leak');
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
