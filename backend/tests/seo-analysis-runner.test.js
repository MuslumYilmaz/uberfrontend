'use strict';

jest.mock('../services/seo/gsc-client', () => ({ createGscClient: jest.fn() }));

const SeoSyncState = require('../models/SeoSyncState');
const SeoMetricPartition = require('../models/SeoMetricPartition');
const { createGscClient } = require('../services/seo/gsc-client');
const {
  latestPersistedAnalysisEndDate,
  releaseAnalysisLease,
  runSeoAnalysis,
} = require('../services/seo/sync');

function configuredSeo() {
  return {
    enabled: true,
    configured: true,
    siteUrl: 'sc-domain:frontendatlas.com',
    storageBudgetBytes: 128 * 1024 * 1024,
  };
}

function fakeRun() {
  return {
    status: 'running',
    analysis: null,
    save: jest.fn().mockResolvedValue(undefined),
  };
}

describe('manual balanced-v2 analysis runner', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('uses persisted metrics under the shared lease without creating a GSC client', async () => {
    const run = fakeRun();
    const acquireLease = jest.fn().mockResolvedValue({ token: 'shared-token', state: {} });
    const releaseLease = jest.fn().mockResolvedValue(undefined);
    const createRun = jest.fn().mockResolvedValue(run);
    const refreshManifest = jest.fn().mockResolvedValue({ total: 435 });
    const loadEndDate = jest.fn().mockResolvedValue('2026-08-04');
    const analyzeLifecycle = jest.fn(async ({ run: lifecycleRun, endDate }) => {
      lifecycleRun.analysis = {
        status: 'complete',
        reason: 'analysis_complete',
        ruleVersion: 'balanced-v2.2',
        endDate,
        windowDays: 28,
        completedDays: 56,
        requiredDays: 56,
        evaluatedPages: 435,
        totalPages: 435,
        eligiblePages: 400,
        cooldown: {},
      };
      await lifecycleRun.save();
      return lifecycleRun.analysis;
    });

    const result = await runSeoAnalysis({
      config: configuredSeo(),
      now: new Date('2026-08-07T10:00:00.000Z'),
      deadlineBudgetMs: 55_000,
      acquireLease,
      releaseLease,
      createRun,
      refreshManifest,
      loadEndDate,
      analyzeLifecycle,
    });

    expect(createGscClient).not.toHaveBeenCalled();
    expect(acquireLease).toHaveBeenCalledWith(expect.objectContaining({
      siteUrl: 'sc-domain:frontendatlas.com',
      leaseMs: 115_000,
    }));
    expect(createRun).toHaveBeenCalledWith(expect.objectContaining({
      trigger: 'manual_analysis',
      status: 'running',
    }));
    expect(refreshManifest).toHaveBeenCalledWith({
      expectedSiteUrl: 'sc-domain:frontendatlas.com',
      now: new Date('2026-08-07T10:00:00.000Z'),
      requireProductionMarker: true,
    });
    expect(loadEndDate).toHaveBeenCalledWith('sc-domain:frontendatlas.com');
    expect(analyzeLifecycle).toHaveBeenCalledWith(expect.objectContaining({
      siteUrl: 'sc-domain:frontendatlas.com',
      endDate: '2026-08-04',
      deadlineMs: expect.any(Number),
    }));
    expect(releaseLease).toHaveBeenCalledTimes(1);
    expect(refreshManifest.mock.invocationCallOrder[0])
      .toBeLessThan(analyzeLifecycle.mock.invocationCallOrder[0]);
    expect(result).toEqual(expect.objectContaining({
      status: 'complete',
      analysis: expect.objectContaining({
        ruleVersion: 'balanced-v2.2',
        endDate: '2026-08-04',
        evaluatedPages: 435,
        totalPages: 435,
      }),
    }));
  });

  test('immediately requests at most five URL Inspections after a complete manual interruption analysis', async () => {
    const run = fakeRun();
    const now = new Date('2026-08-10T12:00:00.000Z');
    jest.useFakeTimers({ now });
    const requestBoundary = new Date('2026-08-10T12:01:00.000Z');
    const postAnalysisAt = new Date('2026-08-10T12:01:00.001Z');
    const interruptionMap = new Map(Array.from({ length: 8 }, (_, index) => [
      `page-${index}`,
      requestBoundary,
    ]));
    const client = { inspectUrl: jest.fn() };
    const inspectDiagnostics = jest.fn().mockResolvedValue({ inspected: 5 });
    const loadVisibilityInterruptions = jest.fn().mockResolvedValue(interruptionMap);
    const releaseLease = jest.fn().mockResolvedValue(undefined);

    const result = await runSeoAnalysis({
      config: configuredSeo(),
      client,
      now,
      acquireLease: jest.fn().mockResolvedValue({ token: 'shared-token', state: {} }),
      releaseLease,
      createRun: jest.fn().mockResolvedValue(run),
      refreshManifest: jest.fn().mockResolvedValue({ total: 435 }),
      loadEndDate: jest.fn().mockResolvedValue('2026-08-07'),
      loadVisibilityInterruptions,
      inspectDiagnostics,
      analyzeLifecycle: jest.fn(async ({ run: lifecycleRun, endDate }) => {
        // The analysis packet creates a request boundary after the runner's
        // entry timestamp. Post-analysis Inspection must use a fresh clock.
        jest.setSystemTime(requestBoundary);
        lifecycleRun.analysis = {
          status: 'complete',
          reason: 'analysis_complete',
          ruleVersion: 'balanced-v2.2',
          endDate,
          completedDays: 56,
          requiredDays: 56,
          evaluatedPages: 435,
          committedAssessmentPages: 435,
          totalPages: 435,
        };
      }),
    });

    expect(result.status).toBe('complete');
    expect(loadVisibilityInterruptions).toHaveBeenCalledWith({
      siteUrl: 'sc-domain:frontendatlas.com',
      endDate: '2026-08-07',
    });
    expect(inspectDiagnostics).toHaveBeenCalledTimes(1);
    expect(inspectDiagnostics).toHaveBeenCalledWith(expect.objectContaining({
      client,
      endDate: '2026-08-07',
      now: postAnalysisAt,
      limit: 5,
      visibilityInterruptions: interruptionMap,
    }));
    expect(createGscClient).not.toHaveBeenCalled();
    expect(inspectDiagnostics.mock.invocationCallOrder[0]).toBeLessThan(releaseLease.mock.invocationCallOrder[0]);
  });

  test('fails busy before creating a run when sync owns the shared lease', async () => {
    const createRun = jest.fn();

    await expect(runSeoAnalysis({
      config: configuredSeo(),
      acquireLease: async () => null,
      createRun,
    })).rejects.toEqual(expect.objectContaining({
      status: 409,
      code: 'SEO_ANALYSIS_BUSY',
    }));

    expect(createRun).not.toHaveBeenCalled();
    expect(createGscClient).not.toHaveBeenCalled();
  });

  test('uses the latest date complete in both property and page partitions', async () => {
    const distinct = jest.spyOn(SeoMetricPartition, 'distinct').mockImplementation(async (_field, filter) => (
      filter.slice === 'property'
        ? ['2026-08-03', '2026-08-04', '2026-08-05']
        : ['2026-08-03', '2026-08-04']
    ));

    await expect(latestPersistedAnalysisEndDate('sc-domain:frontendatlas.com'))
      .resolves.toBe('2026-08-04');
    expect(distinct).toHaveBeenCalledTimes(2);
    expect(distinct).toHaveBeenCalledWith('date', expect.objectContaining({
      slice: 'property',
      status: 'complete',
    }));
    expect(distinct).toHaveBeenCalledWith('date', expect.objectContaining({
      slice: 'page',
      status: 'complete',
    }));
  });

  test('releases only lease fields and preserves GSC sync health', async () => {
    const update = jest.spyOn(SeoSyncState, 'updateOne').mockResolvedValue({ acknowledged: true });

    await releaseAnalysisLease({
      siteUrl: 'sc-domain:frontendatlas.com',
      token: 'analysis-token',
    });

    expect(update).toHaveBeenCalledWith(
      { stateKey: 'gsc:sc-domain:frontendatlas.com', leaseToken: 'analysis-token' },
      { $set: { leaseToken: null, leaseExpiresAt: null } }
    );
    const updatePayload = update.mock.calls[0][1].$set;
    expect(updatePayload).not.toHaveProperty('lastSuccessfulSyncAt');
    expect(updatePayload).not.toHaveProperty('lastError');
  });
});
