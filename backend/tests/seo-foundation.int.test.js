'use strict';

const jwt = require('jsonwebtoken');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

const JWT_SECRET = 'seo_foundation_test_secret_32_chars_minimum';
let mongoServer;
let app;
let disconnectMongo;
let User;
let SeoAction;
let SeoDiagnosticSnapshot;
let SeoMetricPartition;
let SeoPage;
let SeoPageAssessment;
let SeoPageDailyMetric;
let SeoPageDeviceDailyMetric;
let SeoPageVersion;
let SeoPropertyDailyMetric;
let SeoQueryPageDailyMetric;
let SeoSyncRun;
let SeoSyncState;
let actions;
let manifestService;
let metricsStore;
let syncService;
let dashboardService;

function withDbName(uri, name) {
  return `${String(uri).replace(/\/$/, '')}/${name}`;
}

function bearer(userId) {
  return `Bearer ${jwt.sign({ sub: String(userId), role: 'admin' }, JWT_SECRET, { expiresIn: '1h' })}`;
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URL_TEST = withDbName(mongoServer.getUri(), 'seo_foundation_test');
  process.env.EXPECTED_MONGO_DB_NAME_TEST = 'seo_foundation_test';
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.SEO_DASHBOARD_ENABLED = 'true';
  process.env.SEO_OWNER_EMAIL = 'mslmyilmaz34@gmail.com';
  process.env.GSC_SITE_URL = 'sc-domain:frontendatlas.com';
  process.env.GSC_SERVICE_ACCOUNT_JSON = JSON.stringify({ client_email: 'gsc@example.test', private_key: 'test-key' });
  process.env.SEO_STORAGE_BUDGET_BYTES = String(128 * 1024 * 1024);
  process.env.CRON_SECRET = 'cron-secret-at-least-32-characters-long';

  jest.resetModules();
  app = require('../index');
  ({ disconnectMongo } = require('../config/mongo'));
  User = require('../models/User');
  SeoAction = require('../models/SeoAction');
  SeoDiagnosticSnapshot = require('../models/SeoDiagnosticSnapshot');
  SeoMetricPartition = require('../models/SeoMetricPartition');
  SeoPage = require('../models/SeoPage');
  SeoPageAssessment = require('../models/SeoPageAssessment');
  SeoPageDailyMetric = require('../models/SeoPageDailyMetric');
  SeoPageDeviceDailyMetric = require('../models/SeoPageDeviceDailyMetric');
  SeoPageVersion = require('../models/SeoPageVersion');
  SeoPropertyDailyMetric = require('../models/SeoPropertyDailyMetric');
  SeoQueryPageDailyMetric = require('../models/SeoQueryPageDailyMetric');
  SeoSyncRun = require('../models/SeoSyncRun');
  SeoSyncState = require('../models/SeoSyncState');
  actions = require('../services/seo/actions');
  manifestService = require('../services/seo/manifest');
  metricsStore = require('../services/seo/metrics-store');
  syncService = require('../services/seo/sync');
  dashboardService = require('../services/seo/dashboard');

  const { connectToMongo } = require('../config/mongo');
  await connectToMongo(process.env.MONGO_URL_TEST);
});

afterAll(async () => {
  if (disconnectMongo) await disconnectMongo();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    SeoAction.deleteMany({}),
    SeoDiagnosticSnapshot.deleteMany({}),
    SeoMetricPartition.deleteMany({}),
    SeoPage.deleteMany({}),
    SeoPageAssessment.deleteMany({}),
    SeoPageDailyMetric.deleteMany({}),
    SeoPageDeviceDailyMetric.deleteMany({}),
    SeoPageVersion.deleteMany({}),
    SeoPropertyDailyMetric.deleteMany({}),
    SeoQueryPageDailyMetric.deleteMany({}),
    SeoSyncRun.deleteMany({}),
    SeoSyncState.deleteMany({}),
  ]);
});

describe('SEO owner router wiring', () => {
  test('allows only the exact verified admin owner and keeps cron separately secret-protected', async () => {
    const owner = await User.create({
      email: 'mslmyilmaz34@gmail.com', username: 'seo_owner', passwordHash: 'hash', role: 'admin', emailVerifiedAt: new Date(),
    });
    const otherAdmin = await User.create({
      email: 'other-admin@example.com', username: 'other_admin', passwordHash: 'hash', role: 'admin', emailVerifiedAt: new Date(),
    });
    process.env.SEO_OWNER_USER_ID = String(owner._id);

    const allowed = await request(app).get('/api/admin/seo/access').set('Authorization', bearer(owner._id));
    expect(allowed.status).toBe(200);
    expect(allowed.headers['cache-control']).toBe('private, no-store, max-age=0');
    expect(allowed.headers['x-robots-tag']).toBe('noindex, nofollow');
    expect(allowed.body).toEqual({
      allowed: true,
      enabled: true,
      reason: null,
      automation: { configured: true, warning: null },
      capabilities: {
        contractVersion: 'seo-admin.v2',
        manualAnalysis: true,
      },
    });

    const denied = await request(app).get('/api/admin/seo/access').set('Authorization', bearer(otherAdmin._id));
    expect(denied.status).toBe(403);
    expect(denied.body).toEqual({ error: 'Forbidden' });
    expect(denied.headers['cache-control']).toBe('private, no-store, max-age=0');
    expect(denied.headers['x-robots-tag']).toBe('noindex, nofollow');

    const cronDeniedResponses = await Promise.all([
      request(app).get('/api/internal/seo/daily-sync'),
      request(app).get('/api/internal/seo/weekly-digest'),
    ]);
    for (const cronDenied of cronDeniedResponses) {
      expect(cronDenied.status).toBe(401);
      expect(cronDenied.headers['cache-control']).toBe('private, no-store, max-age=0');
      expect(cronDenied.headers['x-robots-tag']).toBe('noindex, nofollow');
    }
  });

  test('denies unauthenticated and ordinary users before read or mutation handlers run', async () => {
    const owner = await User.create({
      email: 'mslmyilmaz34@gmail.com', username: 'seo_owner_denial', passwordHash: 'hash', role: 'admin', emailVerifiedAt: new Date(),
    });
    const ordinaryUser = await User.create({
      email: 'ordinary@example.com', username: 'ordinary_user', passwordHash: 'hash', role: 'user', emailVerifiedAt: new Date(),
    });
    process.env.SEO_OWNER_USER_ID = String(owner._id);

    const responses = await Promise.all([
      request(app).get('/api/admin/seo/overview'),
      request(app).get('/api/admin/seo/overview').set('Authorization', bearer(ordinaryUser._id)),
      request(app)
        .post('/api/admin/seo/actions')
        .set('Authorization', bearer(ordinaryUser._id))
        .send({
          url: 'https://frontendatlas.com/angular/trivia/denied',
          type: 'manual',
          title: 'Must not be created',
          hypothesis: 'The owner middleware must stop this request.',
        }),
    ]);

    expect(responses.map((response) => response.status)).toEqual([401, 403, 403]);
    for (const response of responses) {
      expect(response.headers['cache-control']).toBe('private, no-store, max-age=0');
      expect(response.headers['x-robots-tag']).toBe('noindex, nofollow');
    }
    expect(await SeoAction.countDocuments()).toBe(0);
  });

  test('keeps manual dashboard access available while explicitly warning when cron auth is missing', async () => {
    const owner = await User.create({
      email: 'mslmyilmaz34@gmail.com', username: 'seo_owner_no_cron', passwordHash: 'hash', role: 'admin', emailVerifiedAt: new Date(),
    });
    process.env.SEO_OWNER_USER_ID = String(owner._id);
    const originalSecret = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;

    try {
      const allowed = await request(app).get('/api/admin/seo/access').set('Authorization', bearer(owner._id));
      expect(allowed.status).toBe(200);
      expect(allowed.body).toEqual(expect.objectContaining({
        allowed: true,
        enabled: true,
        reason: null,
        automation: {
          configured: false,
          warning: expect.stringContaining('CRON_SECRET'),
        },
      }));

      const overview = await request(app).get('/api/admin/seo/overview').set('Authorization', bearer(owner._id));
      expect(overview.status).toBe(200);
      expect(overview.body.dataHealth).toEqual(expect.objectContaining({
        automationConfigured: false,
        nextScheduledSyncAt: null,
        warning: expect.stringContaining('CRON_SECRET'),
      }));
      expect(overview.body.dataHealth.warning).toContain('Manual Sync now remains available');
    } finally {
      if (originalSecret === undefined) delete process.env.CRON_SECRET;
      else process.env.CRON_SECRET = originalSecret;
    }
  });

  test('does not advertise auto-sync when cron auth exists but base GSC configuration is incomplete', async () => {
    const owner = await User.create({
      email: 'mslmyilmaz34@gmail.com', username: 'seo_owner_incomplete_gsc', passwordHash: 'hash', role: 'admin', emailVerifiedAt: new Date(),
    });
    process.env.SEO_OWNER_USER_ID = String(owner._id);
    const originalStorageBudget = process.env.SEO_STORAGE_BUDGET_BYTES;
    delete process.env.SEO_STORAGE_BUDGET_BYTES;

    try {
      const allowed = await request(app).get('/api/admin/seo/access').set('Authorization', bearer(owner._id));
      expect(allowed.status).toBe(200);
      expect(allowed.body).toEqual(expect.objectContaining({
        allowed: true,
        enabled: true,
        reason: expect.stringContaining('not fully configured'),
        automation: { configured: false, warning: null },
      }));

      const overview = await request(app).get('/api/admin/seo/overview').set('Authorization', bearer(owner._id));
      expect(overview.status).toBe(200);
      expect(overview.body.dataHealth).toEqual(expect.objectContaining({
        automationConfigured: false,
        nextScheduledSyncAt: null,
      }));
      expect(overview.body.dataHealth.warning).toContain('storage budget is not configured');
      expect(overview.body.dataHealth.warning).not.toContain('CRON_SECRET');
    } finally {
      if (originalStorageBudget === undefined) delete process.env.SEO_STORAGE_BUDGET_BYTES;
      else process.env.SEO_STORAGE_BUDGET_BYTES = originalStorageBudget;
    }
  });

  test('rejects external or non-canonical manual action URLs server-side', async () => {
    const owner = await User.create({
      email: 'mslmyilmaz34@gmail.com', username: 'seo_owner_2', passwordHash: 'hash', role: 'admin', emailVerifiedAt: new Date(),
    });
    process.env.SEO_OWNER_USER_ID = String(owner._id);
    const response = await request(app)
      .post('/api/admin/seo/actions')
      .set('Authorization', bearer(owner._id))
      .send({ url: 'https://evil.example/page', type: 'manual', title: 'Bad', hypothesis: 'Bad target' });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('SEO_ACTION_INVALID');
  });

  test('does not echo legacy sync error prose from persisted runs', async () => {
    const owner = await User.create({
      email: 'mslmyilmaz34@gmail.com', username: 'seo_owner_sync_errors', passwordHash: 'hash', role: 'admin', emailVerifiedAt: new Date(),
    });
    process.env.SEO_OWNER_USER_ID = String(owner._id);
    const secret = 'frontend/src/private-page.ts raw exact query body';
    await SeoSyncRun.create({
      runId: 'legacy-error-run',
      siteUrl: 'sc-domain:frontendatlas.com',
      trigger: 'manual',
      status: 'failed',
      errorCode: secret,
      errorMessage: secret,
      expiresAt: new Date('2026-11-01T00:00:00.000Z'),
    });

    const response = await request(app)
      .get('/api/admin/seo/sync-runs')
      .set('Authorization', bearer(owner._id));

    expect(response.status).toBe(200);
    expect(response.body.items[0].error).toEqual({
      code: 'SEO_SYNC_FAILED',
      message: 'SEO sync failed.',
    });
    expect(JSON.stringify(response.body)).not.toContain(secret);
  });

  test('defaults missing and invalid overview segments to property totals', async () => {
    const owner = await User.create({
      email: 'mslmyilmaz34@gmail.com', username: 'seo_owner_default_scope', passwordHash: 'hash', role: 'admin', emailVerifiedAt: new Date(),
    });
    process.env.SEO_OWNER_USER_ID = String(owner._id);
    const siteUrl = 'sc-domain:frontendatlas.com';
    const date = '2026-08-04';
    await metricsStore.writeSliceGeneration({
      siteUrl,
      date,
      slice: 'property',
      rows: [{ clicks: 20, impressions: 200, position: 4 }],
    });
    await metricsStore.writeSliceGeneration({
      siteUrl,
      date,
      slice: 'queryPage',
      rows: [{ keys: ['https://frontendatlas.com/page-one', 'visible query'], clicks: 3, impressions: 30, position: 4 }],
    });

    for (const query of ['', '?segment=unexpected']) {
      const response = await request(app)
        .get(`/api/admin/seo/overview${query}`)
        .set('Authorization', bearer(owner._id));
      expect(response.status).toBe(200);
      expect(response.body.segment).toBe('all');
      expect(response.body.kpis.clicks.value).toBe(20);
      expect(response.body.kpis.impressions.value).toBe(200);
    }
  });
});

describe('partition generations and sync lease', () => {
  test('backfills raw GSC facts while production evidence keeps enrichment fail-closed', async () => {
    const siteUrl = 'sc-domain:frontendatlas.com';
    const date = '2026-08-04';
    const canonicalUrl = 'https://frontendatlas.com/angular/trivia/marker-independent-backfill';
    const manifest = {
      version: 'seo-page-manifest.v1',
      property: siteUrl,
      fingerprintVersion: 'seo-page-fingerprints.v2',
      provenanceVersion: 'seo-build-provenance.v1',
      pages: [{
        canonicalUrl,
        renderedCanonicalUrl: canonicalUrl,
        path: '/angular/trivia/marker-independent-backfill',
        family: 'question',
        tech: 'angular',
        indexable: true,
        robots: 'index,follow',
        title: 'Marker-independent backfill',
        description: 'A deterministic integration fixture.',
        h1: 'Marker-independent backfill',
        targetKeyword: 'marker independent backfill',
        intendedIntent: 'Explain marker-independent backfill behavior.',
        readerPromise: 'Explain marker-independent backfill behavior.',
        intentSource: 'explicit',
        intentConfirmed: true,
        outboundLinks: [],
      }],
    };
    const client = {
      discoverLatestFinalizedDate: jest.fn(async () => date),
      inspectUrl: jest.fn(async () => { throw new Error('inspection must remain gated'); }),
      querySearchAnalytics: jest.fn(async ({ dimensions }) => {
        if (!dimensions.length) {
          return { rows: [{ clicks: 2, impressions: 100, position: 5 }], truncated: false };
        }
        if (dimensions.length === 1) {
          return { rows: [{ keys: [canonicalUrl], clicks: 2, impressions: 100, position: 5 }], truncated: false };
        }
        if (dimensions[1] === 'query') {
          return { rows: [{ keys: [canonicalUrl, 'visible fixture query'], clicks: 1, impressions: 50, position: 5 }], truncated: false };
        }
        return { rows: [{ keys: [canonicalUrl, 'MOBILE'], clicks: 2, impressions: 100, position: 5 }], truncated: false };
      }),
    };
    const refreshManifest = jest.fn((options) => manifestService.syncSeoManifest({
      ...options,
      manifest,
      productionMarker: null,
    }));

    const result = await syncService.runSeoSync({
      config: {
        enabled: true,
        configured: true,
        siteUrl,
        storageBudgetBytes: 128 * 1024 * 1024,
        finalizedLagDays: 3,
        initialBackfillDays: 7,
        maximumBackfillDays: 90,
        datesPerRun: 1,
        syncBudgetMs: 60_000,
        hardDeadlineBudgetMs: 90_000,
        enrichmentEnabled: true,
      },
      client,
      trigger: 'manual',
      now: new Date('2026-08-08T08:00:00.000Z'),
      refreshManifest,
      loadProductionMarker: jest.fn(async () => null),
    });

    expect(refreshManifest).toHaveBeenCalledWith(expect.objectContaining({
      expectedSiteUrl: siteUrl,
      requireProductionMarker: false,
      loadProductionMarker: expect.any(Function),
    }));
    expect(result).toEqual(expect.objectContaining({
      status: 'complete',
      datesAttempted: [date],
      datesCompleted: [date],
      rowsWritten: 4,
      analysis: expect.objectContaining({
        status: 'not_ready',
        reason: 'production_marker_unavailable',
        totalPages: 1,
      }),
    }));
    expect(client.querySearchAnalytics).toHaveBeenCalledTimes(4);
    expect(client.inspectUrl).not.toHaveBeenCalled();
    expect(await SeoPage.countDocuments({ 'manifest.present': true })).toBe(1);
    expect(await SeoMetricPartition.countDocuments({ siteUrl, date, status: 'complete' })).toBe(4);
    expect(await SeoPageAssessment.countDocuments({ siteUrl })).toBe(0);
    expect(await SeoAction.countDocuments({ siteUrl })).toBe(0);
    const state = await SeoSyncState.findOne({ stateKey: syncService.syncStateKey(siteUrl) }).lean();
    expect(state).toEqual(expect.objectContaining({
      lastFinalizedDate: null,
      recentBackfillEndDate: date,
      recentCursorDate: '2026-08-03',
      storageLevel: 'ok',
      recentBackfillComplete: false,
    }));
    expect(state.lastSuccessfulSyncAt).toBeTruthy();
  });

  test('only exposes the active generation and does not delete a concurrent unactivated writer', async () => {
    const siteUrl = 'sc-domain:frontendatlas.com';
    const date = '2026-08-01';
    await metricsStore.writeSliceGeneration({
      siteUrl, date, slice: 'page',
      rows: [{ keys: ['https://frontendatlas.com/a'], clicks: 1, impressions: 10, position: 5 }],
    });
    await SeoPageDailyMetric.create({
      siteUrl, date, pageKey: require('../services/seo/keys').pageKeyForUrl('https://frontendatlas.com/a'),
      canonicalUrl: 'https://frontendatlas.com/a', generation: 'concurrent-generation', clicks: 9, impressions: 10,
      position: 2, positionNumerator: 20,
    });
    const latest = await metricsStore.writeSliceGeneration({
      siteUrl, date, slice: 'page',
      rows: [{ keys: ['https://frontendatlas.com/a'], clicks: 2, impressions: 10, position: 4 }],
    });
    expect(await SeoPageDailyMetric.exists({ generation: 'concurrent-generation' })).toBeTruthy();
    const active = await SeoPageDailyMetric.aggregate(metricsStore.activeMetricPipeline({
      slice: 'page', match: { siteUrl, date },
    }));
    expect(active).toHaveLength(1);
    expect(active[0]).toEqual(expect.objectContaining({ generation: latest.generation, clicks: 2 }));
  });

  test('uses the property fact—not summed page rows—for all-query KPI cards', async () => {
    const siteUrl = 'sc-domain:frontendatlas.com';
    const date = '2026-08-01';
    await metricsStore.writeSliceGeneration({
      siteUrl, date, slice: 'property', rows: [{ clicks: 20, impressions: 200, position: 4 }],
    });
    await metricsStore.writeSliceGeneration({
      siteUrl, date, slice: 'page', rows: [{
        keys: ['https://frontendatlas.com/a'], clicks: 999, impressions: 1000, position: 1,
      }],
    });
    const overview = await dashboardService.getOverview({
      config: {
        enabled: true, configured: true, siteUrl, storageBudgetBytes: 128 * 1024 * 1024,
        finalizedLagDays: 3, initialBackfillDays: 90, sourceTimezone: 'America/Los_Angeles',
      },
      windowDays: 7,
      now: new Date('2026-08-05T12:00:00.000Z'),
    });
    expect(overview.segment).toBe('all');
    expect(overview.kpis.clicks.value).toBe(20);
    expect(overview.kpis.impressions.value).toBe(200);
    expect(overview.kpis.ctr.value).toBe(0.1);
    expect(overview.kpis.averagePosition.value).toBe(4);
  });

  test('reconciles query and device coverage only across matching complete dates', async () => {
    const siteUrl = 'sc-domain:frontendatlas.com';
    const date = '2026-08-01';
    const client = {
      querySearchAnalytics: jest.fn(async ({ dimensions }) => {
        if (!dimensions.length) {
          return { rows: [{ clicks: 20, impressions: 1_000, position: 4 }], truncated: false };
        }
        if (dimensions.length === 1 && dimensions[0] === 'page') {
          return {
            rows: [{ keys: ['https://frontendatlas.com/page-one'], clicks: 20, impressions: 1_000, position: 4 }],
            truncated: false,
          };
        }
        if (dimensions[1] === 'query') {
          return {
            rows: [{ keys: ['https://frontendatlas.com/page-one', 'visible query'], clicks: 14, impressions: 700, position: 4 }],
            truncated: false,
          };
        }
        return {
          rows: [{ keys: ['https://frontendatlas.com/page-one', 'MOBILE'], clicks: 5, impressions: 250, position: 4 }],
          truncated: false,
        };
      }),
    };

    const result = await syncService.syncOneDate({
      client,
      config: { siteUrl },
      date,
      includeDetails: true,
      now: new Date('2026-08-05T00:00:00.000Z'),
    });
    expect(result.queryCoverage).toBeCloseTo(0.7);
    expect(result.deviceCoverage).toBeCloseTo(0.25);

    const [queryPartition, devicePartition] = await Promise.all([
      SeoMetricPartition.findOne({ siteUrl, date, slice: 'queryPage' }).lean(),
      SeoMetricPartition.findOne({ siteUrl, date, slice: 'devicePage' }).lean(),
    ]);
    expect(queryPartition.queryCoverage).toBeCloseTo(0.7);
    expect(queryPartition.deviceCoverage).toBeNull();
    expect(devicePartition.queryCoverage).toBeNull();
    expect(devicePartition.deviceCoverage).toBeCloseTo(0.25);

    await metricsStore.writeSliceGeneration({
      siteUrl,
      date: '2026-07-31',
      slice: 'page',
      rows: [{ keys: ['https://frontendatlas.com/page-one'], clicks: 10, impressions: 1_000, position: 4 }],
    });
    await metricsStore.writeSliceGeneration({
      siteUrl,
      date: '2026-07-30',
      slice: 'page',
      rows: [{ keys: ['https://frontendatlas.com/page-one'], clicks: 10, impressions: 1_000, position: 4 }],
    });
    await metricsStore.writeSliceGeneration({
      siteUrl,
      date: '2026-07-30',
      slice: 'queryPage',
      rows: [{ keys: ['https://frontendatlas.com/page-one', 'truncated query'], clicks: 9, impressions: 900, position: 4 }],
      truncated: true,
    });
    await metricsStore.writeSliceGeneration({
      siteUrl,
      date: '2026-07-30',
      slice: 'devicePage',
      rows: [{ keys: ['https://frontendatlas.com/page-one', 'MOBILE'], clicks: 9, impressions: 900, position: 4 }],
      truncated: true,
    });

    const health = await dashboardService.getDataHealth({
      config: {
        enabled: true,
        configured: true,
        siteUrl,
        storageBudgetBytes: 128 * 1024 * 1024,
        finalizedLagDays: 3,
        initialBackfillDays: 90,
        sourceTimezone: 'America/Los_Angeles',
      },
      now: new Date('2026-08-05T12:00:00.000Z'),
    });
    expect(health).toEqual(expect.objectContaining({
      queryCoveragePercent: 70,
      queryCoverageStatus: 'partial',
      queryCoverageSufficient: false,
      queryCoverageWindow: {
        startDate: '2026-07-05',
        endDate: '2026-08-01',
        completedDays: 1,
        requiredDays: 28,
        truncatedDays: 1,
        missingDays: 26,
        complete: false,
      },
      deviceCoveragePercent: 25,
      deviceCoverageStatus: 'partial',
      deviceCoverageSufficient: false,
      deviceCoverageWindow: {
        startDate: '2026-07-05',
        endDate: '2026-08-01',
        completedDays: 1,
        requiredDays: 28,
        truncatedDays: 1,
        missingDays: 26,
        complete: false,
      },
    }));
  });

  test('does not treat an over-counted device breakdown as full coverage', async () => {
    const siteUrl = 'sc-domain:frontendatlas.com';
    const date = '2026-08-01';
    await metricsStore.writeSliceGeneration({
      siteUrl,
      date,
      slice: 'page',
      rows: [{ keys: ['https://frontendatlas.com/page-one'], impressions: 100, clicks: 1, position: 4 }],
    });
    await metricsStore.writeSliceGeneration({
      siteUrl,
      date,
      slice: 'devicePage',
      rows: [{ keys: ['https://frontendatlas.com/page-one', 'MOBILE'], impressions: 125, clicks: 1, position: 4 }],
    });

    await expect(metricsStore.updateDeviceCoverage({ siteUrl, date })).resolves.toBeCloseTo(0.8);
    const partition = await SeoMetricPartition.findOne({ siteUrl, date, slice: 'devicePage' }).lean();
    expect(partition.deviceCoverage).toBeCloseTo(0.8);
  });

  test('separates imported backfill progress from complete recommendation evidence', async () => {
    const siteUrl = 'sc-domain:frontendatlas.com';
    const completedAt = new Date('2026-08-07T00:00:00.000Z');
    await SeoSyncState.create({
      stateKey: syncService.syncStateKey(siteUrl),
      siteUrl,
      recentBackfillStartDate: '2026-05-07',
      recentBackfillEndDate: '2026-08-04',
      recentCursorDate: '2026-08-02',
      recentBackfillComplete: false,
      storageBytes: 1024,
      storageLevel: 'ok',
    });
    await SeoMetricPartition.create([
      {
        siteUrl, date: '2026-08-04', slice: 'property', activeGeneration: 'property-0804',
        status: 'complete', rowCount: 1, impressions: 100, completedAt,
      },
      {
        siteUrl, date: '2026-08-04', slice: 'page', activeGeneration: 'page-0804',
        status: 'complete', rowCount: 1, impressions: 100, completedAt,
      },
      {
        siteUrl, date: '2026-08-03', slice: 'page', activeGeneration: 'page-0803',
        status: 'truncated', rowCount: 25_000, impressions: 90, truncated: true, completedAt,
      },
    ]);

    const health = await dashboardService.getDataHealth({
      config: {
        enabled: true, configured: true, siteUrl, storageBudgetBytes: 128 * 1024 * 1024,
        finalizedLagDays: 3, initialBackfillDays: 90, sourceTimezone: 'America/Los_Angeles',
      },
      now: new Date('2026-08-07T12:00:00.000Z'),
    });

    expect(health.backfill).toEqual({
      completedDays: 2,
      expectedDays: 90,
      percent: 2.2,
      nextDate: '2026-08-02',
      complete: false,
    });
    expect(health.recommendationReadiness).toEqual({
      completedDays: 1,
      requiredDays: 56,
      ready: false,
    });
  });

  test('lease is exclusive until expiry', async () => {
    const now = new Date('2026-08-01T00:00:00.000Z');
    const first = await syncService.acquireSyncLease({ siteUrl: 'sc-domain:frontendatlas.com', now, leaseMs: 60_000 });
    expect(first).toBeTruthy();
    expect(await syncService.acquireSyncLease({ siteUrl: 'sc-domain:frontendatlas.com', now, leaseMs: 60_000 })).toBeNull();
    const afterExpiry = await syncService.acquireSyncLease({
      siteUrl: 'sc-domain:frontendatlas.com', now: new Date(now.getTime() + 60_001), leaseMs: 60_000,
    });
    expect(afterExpiry).toBeTruthy();
  });

  test('a stale worker cannot commit cursor or storage after its lease is replaced', async () => {
    const siteUrl = 'sc-domain:frontendatlas.com';
    const acquired = await syncService.acquireSyncLease({
      siteUrl, now: new Date('2026-08-01T00:00:00.000Z'), leaseMs: 60_000,
    });
    acquired.state.recentCursorDate = '2026-07-01';
    acquired.state.storageBytes = 111;
    await SeoSyncState.updateOne(
      { stateKey: syncService.syncStateKey(siteUrl), leaseToken: acquired.token },
      {
        $set: {
          leaseToken: 'replacement-lease-token',
          leaseExpiresAt: new Date('2026-08-01T01:00:00.000Z'),
          recentCursorDate: '2026-07-31',
          storageBytes: 999,
        },
      }
    );

    await expect(syncService.persistSyncLeaseState({
      siteUrl, token: acquired.token, state: acquired.state,
    })).rejects.toEqual(expect.objectContaining({ code: 'SEO_SYNC_LEASE_LOST' }));
    const state = await SeoSyncState.findOne({ stateKey: syncService.syncStateKey(siteUrl) }).lean();
    expect(state).toEqual(expect.objectContaining({
      leaseToken: 'replacement-lease-token', recentCursorDate: '2026-07-31', storageBytes: 999,
    }));
  });

  test('invalidates old detail pointers before a page refresh and keeps them stale after a detail failure', async () => {
    const siteUrl = 'sc-domain:frontendatlas.com';
    const date = '2026-08-01';
    await metricsStore.writeSliceGeneration({
      siteUrl, date, slice: 'queryPage',
      rows: [{ keys: ['https://frontendatlas.com/page-one', 'old query'], clicks: 1, impressions: 10, position: 5 }],
    });
    await metricsStore.writeSliceGeneration({
      siteUrl, date, slice: 'devicePage',
      rows: [{ keys: ['https://frontendatlas.com/page-one', 'MOBILE'], clicks: 1, impressions: 10, position: 5 }],
    });
    await Promise.all([
      SeoMetricPartition.updateOne({ siteUrl, date, slice: 'queryPage' }, { $set: { queryCoverage: 0.8 } }),
      SeoMetricPartition.updateOne({ siteUrl, date, slice: 'devicePage' }, { $set: { deviceCoverage: 0.7 } }),
    ]);
    const client = {
      querySearchAnalytics: jest.fn(async ({ dimensions }) => {
        if (!dimensions.length) return { rows: [{ clicks: 2, impressions: 20, position: 4 }], truncated: false };
        if (dimensions[0] === 'page' && dimensions.length === 1) {
          return { rows: [{ keys: ['https://frontendatlas.com/page-one/'], clicks: 2, impressions: 20, position: 4 }], truncated: false };
        }
        throw new Error('detail fetch failed');
      }),
    };

    await expect(syncService.syncOneDate({
      client, config: { siteUrl }, date, includeDetails: true, now: new Date('2026-08-05T00:00:00.000Z'),
    })).rejects.toThrow('detail fetch failed');
    const partitions = await SeoMetricPartition.find({ siteUrl, date, slice: { $in: ['queryPage', 'devicePage'] } }).lean();
    expect(partitions.map((partition) => partition.status)).toEqual(['stale', 'stale']);
    expect(partitions.find((partition) => partition.slice === 'queryPage').queryCoverage).toBeNull();
    expect(partitions.find((partition) => partition.slice === 'devicePage').deviceCoverage).toBeNull();
    expect(await SeoQueryPageDailyMetric.aggregate(metricsStore.activeMetricPipeline({
      slice: 'queryPage', match: { siteUrl, date },
    }))).toHaveLength(0);
    const page = await SeoPage.findOne({ pageKey: require('../services/seo/keys').pageKeyForUrl('https://frontendatlas.com/page-one') });
    expect(page.canonicalUrl).toBe('https://frontendatlas.com/page-one');
  });

  test('prunes every metric generation and partition outside the rolling history window', async () => {
    const siteUrl = 'sc-domain:frontendatlas.com';
    const oldDate = '2025-01-01';
    await metricsStore.writeSliceGeneration({ siteUrl, date: oldDate, slice: 'property', rows: [{}] });
    await metricsStore.writeSliceGeneration({
      siteUrl, date: oldDate, slice: 'page', rows: [{ keys: ['https://frontendatlas.com/page-one'], impressions: 1 }],
    });
    await metricsStore.writeSliceGeneration({
      siteUrl, date: oldDate, slice: 'queryPage', rows: [{ keys: ['https://frontendatlas.com/page-one', 'query'], impressions: 1 }],
    });
    await metricsStore.writeSliceGeneration({
      siteUrl, date: oldDate, slice: 'devicePage', rows: [{ keys: ['https://frontendatlas.com/page-one', 'DESKTOP'], impressions: 1 }],
    });
    await metricsStore.writeSliceGeneration({ siteUrl, date: '2026-01-01', slice: 'property', rows: [{}] });

    const deleted = await metricsStore.pruneMetricHistoryBefore({ siteUrl, cutoffDate: '2025-06-01' });
    expect(deleted).toBeGreaterThanOrEqual(8);
    expect(await SeoMetricPartition.countDocuments({ siteUrl, date: oldDate })).toBe(0);
    expect(await SeoPropertyDailyMetric.countDocuments({ siteUrl, date: oldDate })).toBe(0);
    expect(await SeoPageDailyMetric.countDocuments({ siteUrl, date: oldDate })).toBe(0);
    expect(await SeoQueryPageDailyMetric.countDocuments({ siteUrl, date: oldDate })).toBe(0);
    expect(await SeoPageDeviceDailyMetric.countDocuments({ siteUrl, date: oldDate })).toBe(0);
    expect(await SeoPropertyDailyMetric.countDocuments({ siteUrl, date: '2026-01-01' })).toBe(1);
  });

  test('omits page metrics and trend unless the exact 28-day page window is complete', async () => {
    const siteUrl = 'sc-domain:frontendatlas.com';
    await SeoPage.create({
      pageKey: 'page-one', canonicalUrl: 'https://frontendatlas.com/page-one', title: 'Page one',
      manifest: { present: true },
      intent: { source: 'derived', intendedIntent: 'Read page one', confirmed: false },
    });
    const { shiftDateKey } = require('../services/seo/dates');
    const endDate = '2026-08-01';
    const startDate = shiftDateKey(endDate, -27);
    const dates = [];
    for (let date = startDate; date <= endDate; date = shiftDateKey(date, 1)) dates.push(date);
    const missingDate = dates[5];
    const truncatedDate = dates[10];
    await SeoMetricPartition.insertMany(dates
      .filter((date) => date !== missingDate)
      .map((date) => ({
        siteUrl,
        date,
        slice: 'page',
        activeGeneration: `page-${date}`,
        status: date === truncatedDate ? 'truncated' : 'complete',
        rowCount: 1,
        impressions: 10,
        truncated: date === truncatedDate,
        completedAt: new Date(`${date}T12:00:00.000Z`),
      })));
    await SeoPageDailyMetric.insertMany(dates.map((date) => ({
      siteUrl,
      date,
      pageKey: 'page-one',
      canonicalUrl: 'https://frontendatlas.com/page-one',
      generation: `page-${date}`,
      clicks: 1,
      impressions: 10,
      position: 5,
      positionNumerator: 50,
    })));
    const config = { siteUrl, finalizedLagDays: 3 };
    const list = await dashboardService.listPages({ config, limit: 10, now: new Date('2026-08-05T00:00:00.000Z') });
    const detail = await dashboardService.getPageDetail({ config, pageKey: 'page-one', now: new Date('2026-08-05T00:00:00.000Z') });
    expect(list.metricWindow).toEqual({
      startDate, endDate, complete: false, availableDays: 26, expectedDays: 28,
    });
    expect(list.items[0]).not.toHaveProperty('clicks');
    expect(list.items[0]).toEqual(expect.objectContaining({ intentSource: 'derived', intentConfirmed: false }));
    expect(detail.metricWindow).toEqual(list.metricWindow);
    expect(detail).not.toHaveProperty('clicks');
    expect(detail).not.toHaveProperty('trend');

    await SeoMetricPartition.create({
      siteUrl, date: missingDate, slice: 'page', activeGeneration: `page-${missingDate}`,
      status: 'complete', rowCount: 1, impressions: 10, completedAt: new Date(`${missingDate}T12:00:00.000Z`),
    });
    await SeoMetricPartition.updateOne(
      { siteUrl, date: truncatedDate, slice: 'page' },
      { $set: { status: 'complete', truncated: false } }
    );
    const completeList = await dashboardService.listPages({ config, limit: 10, now: new Date('2026-08-05T00:00:00.000Z') });
    const completeDetail = await dashboardService.getPageDetail({ config, pageKey: 'page-one', now: new Date('2026-08-05T00:00:00.000Z') });
    expect(completeList.metricWindow).toEqual({
      startDate, endDate, complete: true, availableDays: 28, expectedDays: 28,
    });
    expect(completeList.items[0]).toEqual(expect.objectContaining({ clicks: 28, impressions: 280 }));
    expect(completeDetail.trend).toHaveLength(28);
  });

  test('fails page-detail assessment currentness closed during a split-deploy marker mismatch', async () => {
    const siteUrl = 'sc-domain:frontendatlas.com';
    const endDate = '2026-08-01';
    const expiresAt = new Date('2026-12-01T00:00:00.000Z');
    await SeoPage.create({
      pageKey: 'split-page',
      canonicalUrl: 'https://frontendatlas.com/split-page',
      title: 'Split page',
      manifest: { present: true },
      changeTracking: {
        currentVersionKey: 'version-one',
        analysisInputHash: 'input-one',
      },
    });
    await SeoPageAssessment.create({
      siteUrl,
      pageKey: 'split-page',
      canonicalUrl: 'https://frontendatlas.com/split-page',
      endDate,
      ruleVersion: 'balanced-v2.1',
      inputHash: 'input-one',
      pageVersionKey: 'version-one',
      primaryState: 'clear',
      evidenceLevel: 'high',
      evaluatedAt: new Date('2026-08-02T00:00:00.000Z'),
    });
    await SeoMetricPartition.create([
      {
        siteUrl, date: endDate, slice: 'property', activeGeneration: 'property-split',
        status: 'complete', rowCount: 1, impressions: 100,
        completedAt: new Date('2026-08-02T00:00:00.000Z'),
      },
      {
        siteUrl, date: endDate, slice: 'page', activeGeneration: 'page-split',
        status: 'complete', rowCount: 1, impressions: 100,
        completedAt: new Date('2026-08-02T00:00:00.000Z'),
      },
    ]);
    await SeoSyncRun.create([
      {
        runId: 'analysis-before-split', siteUrl, trigger: 'test', status: 'complete',
        startedAt: new Date('2026-08-02T01:00:00.000Z'), expiresAt,
        analysis: {
          status: 'complete', reason: 'analysis_complete', ruleVersion: 'balanced-v2.1',
          endDate, evaluatedPages: 1, committedAssessmentPages: 1, totalPages: 1,
        },
      },
      {
        runId: 'analysis-during-split', siteUrl, trigger: 'test', status: 'skipped',
        startedAt: new Date('2026-08-03T01:00:00.000Z'), expiresAt,
        analysis: {
          status: 'not_ready', reason: 'production_marker_source_mismatch',
          ruleVersion: 'balanced-v2.1', endDate: null,
        },
      },
    ]);

    const detail = await dashboardService.getPageDetail({
      config: {
        enabled: true,
        configured: true,
        siteUrl,
        storageBudgetBytes: 128 * 1024 * 1024,
        finalizedLagDays: 3,
        initialBackfillDays: 90,
        sourceTimezone: 'America/Los_Angeles',
      },
      pageKey: 'split-page',
      now: new Date('2026-08-05T00:00:00.000Z'),
    });

    expect(detail.analysis).toEqual(expect.objectContaining({
      status: 'not_ready',
      reason: 'production_marker_source_mismatch',
      currentForLatestData: false,
    }));
    expect(detail.assessment).toEqual(expect.objectContaining({
      primaryState: 'clear',
      currentForLatestData: false,
    }));
    expect(detail.lineage.assessmentInput).toEqual(expect.objectContaining({
      valid: true,
      current: false,
    }));
  });
});

describe('SEO action invariants', () => {
  const recommendation = (fingerprint = 'fp-one') => ({
    pageKey: 'page-one', canonicalUrl: 'https://frontendatlas.com/page-one', type: 'ctr_snippet',
    source: 'balanced-v1', ruleVersion: 'balanced-v1', fingerprint, summary: 'Improve snippet',
    hypothesis: 'A clearer promise may improve CTR.', evidence: { summary: 'Low CTR', queryClusters: [{ label: 'raw secret query', impressions: 100 }] },
    recommendation: { checklist: ['Check intent'] }, successCriteria: { metric: 'ctr', minimumRelativeLift: 0.15 },
    priorityScore: 10, confidence: 0.8, expectedAdditionalClicks: 5,
  });

  beforeEach(async () => {
    await SeoPage.create({
      pageKey: 'page-one', canonicalUrl: 'https://frontendatlas.com/page-one', title: 'Page one', manifest: { present: true },
    });
  });

  test('deduplicates fingerprints, increments version, sanitizes query labels, and never reopens a dismissed fingerprint', async () => {
    const [created] = await actions.upsertRecommendations([recommendation()]);
    expect(created.evidence.queryClusters[0].label).toBe('abstract-cluster-1');
    await actions.upsertRecommendations([{
      ...recommendation(), priorityScore: 12, successCriteria: { metric: 'clicks', minimumClicks: 900 },
    }]);
    const refreshed = await SeoAction.findById(created._id);
    expect(refreshed.version).toBe(1);
    expect(refreshed.successCriteria.minimumClicks).toBe(900);
    const dismissed = await actions.transitionAction(refreshed._id, {
      event: 'dismiss', expectedVersion: 1, note: 'Not relevant now',
    }, null);
    expect(dismissed.state).toBe('dismissed');
    await actions.upsertRecommendations([recommendation()]);
    expect(await SeoAction.countDocuments({ fingerprint: 'fp-one' })).toBe(1);
  });

  test('sanitizes legacy action evidence again at the API boundary', async () => {
    const secret = 'frontend/src/private-page.ts raw exact query body';
    const legacy = await SeoAction.create({
      ...recommendation('legacy-unsanitized-evidence'),
      successCriteria: {
        description: secret,
        metric: secret,
        guardrail: secret,
      },
      evidence: {
        summary: 'Legacy evidence contains raw secret query',
        signals: ['raw secret query suddenly declined'],
        coverage: { status: secret, queryCoveragePercent: 29.7 },
        baselineQuality: { level: secret, cohort: secret, peers: 9, clicks: 10, impressions: 9393 },
        queryClusters: [{
          label: 'raw secret query',
          safeLabel: 'raw secret query alias',
          facet: 'raw_secret_query_facet',
          impressions: 100,
        }],
      },
    });

    const serialized = actions.serializeAction(legacy);
    expect(JSON.stringify(serialized.evidence)).not.toContain('raw secret query');
    expect(serialized.evidence.summary).toBe('Versioned detector evidence is available in the page assessment.');
    expect(serialized.evidence.signals).toEqual([]);
    expect(serialized.evidence.coverage).toEqual(expect.objectContaining({ status: 'unavailable' }));
    expect(serialized.evidence.baselineQuality).toEqual(expect.objectContaining({
      level: 'insufficient', cohort: 'unavailable', peers: 9, clicks: 10, impressions: 9393,
    }));
    expect(serialized.evidence.queryClusters[0].label).toBe('abstract-cluster-1');
    expect(serialized.recommendation.successCriteria)
      .toBe('Review the result after one equal finalized measurement window.');
    expect(JSON.stringify(serialized)).not.toContain(secret);
  });

  test('preserves an owner-authored detector success criterion in a typed field', async () => {
    const [created] = await actions.upsertRecommendations([recommendation('owner-criteria')]);
    const ownerCriteria = 'CTR reaches 1.5% without losing more than one average position.';
    const approved = await actions.transitionAction(created._id, {
      event: 'approve',
      expectedVersion: 0,
      successCriteria: ownerCriteria,
    }, null, new Date('2026-08-01T00:00:00.000Z'));

    expect(approved.ownerSuccessCriteriaText).toBe(ownerCriteria);
    expect(actions.serializeAction(approved).recommendation.successCriteria).toBe(ownerCriteria);
  });

  test('coalesces changing detector fingerprints into one unlocked page/type proposal', async () => {
    const [created] = await actions.upsertRecommendations([recommendation('signal-bucket-one')]);
    const [updated] = await actions.upsertRecommendations([{
      ...recommendation('signal-bucket-two'), priorityScore: 25, summary: 'New evidence for the same hypothesis',
    }]);
    expect(String(updated._id)).toBe(String(created._id));
    expect(updated.fingerprint).toBe('signal-bucket-two');
    expect(updated.version).toBe(1);
    expect(await SeoAction.countDocuments({ pageKey: 'page-one', type: 'ctr_snippet' })).toBe(1);
  });

  test('never overwrites an owner-created proposed action with detector evidence', async () => {
    const manual = await actions.createManualAction({
      url: 'https://frontendatlas.com/owner-snippet-plan',
      type: 'ctr_snippet',
      title: 'Owner-authored snippet plan',
      hypothesis: 'Keep the owner hypothesis intact.',
    }, null, new Date('2026-08-01T00:00:00.000Z'));

    const [returned] = await actions.upsertRecommendations([{
      ...recommendation('detector-must-not-overwrite-owner'),
      pageKey: manual.pageKey,
      canonicalUrl: manual.canonicalUrl,
      source: 'balanced-v2',
      ruleVersion: 'balanced-v2',
      summary: 'Detector replacement',
      hypothesis: 'Detector replacement hypothesis',
      priorityScore: 99,
      evidence: { summary: 'Detector replacement evidence' },
    }], new Date('2026-08-02T00:00:00.000Z'));

    const persisted = await SeoAction.findById(manual._id);
    expect(String(returned._id)).toBe(String(manual._id));
    expect(persisted).toEqual(expect.objectContaining({
      source: 'owner',
      ruleVersion: 'owner-v1',
      state: 'proposed',
      summary: 'Owner-authored snippet plan',
      hypothesis: 'Keep the owner hypothesis intact.',
      priorityScore: 0,
      version: 0,
      lastDetectedAt: null,
    }));
    expect(persisted.successCriteria.ownerDefined).toBe(true);
    expect(await SeoAction.countDocuments({ pageKey: manual.pageKey, type: 'ctr_snippet' })).toBe(1);
  });

  test('never auto-closes an owner-created proposed action during detector reconciliation', async () => {
    const manual = await actions.createManualAction({
      url: 'https://frontendatlas.com/owner-decay-review',
      type: 'content_decay',
      title: 'Owner-authored decay review',
      hypothesis: 'Review this manually before changing content.',
    }, null, new Date('2026-08-01T00:00:00.000Z'));

    const cleared = await actions.reconcileDetectorRecommendations({
      evaluatedPageKeys: [manual.pageKey],
      recommendations: [],
      eligibleTypesByPage: new Map([[manual.pageKey, new Set(['content_decay'])]]),
      migrationEligibleTypesByPage: new Map([[manual.pageKey, new Set(['content_decay'])]]),
      now: new Date('2026-08-02T00:00:00.000Z'),
    });

    expect(cleared).toBe(0);
    expect(await SeoAction.findById(manual._id)).toEqual(expect.objectContaining({
      source: 'owner',
      state: 'proposed',
      version: 0,
      autoResolved: false,
      clearedAt: null,
    }));
  });

  test('resurfaces a redetected condition only after its snooze expires', async () => {
    const [created] = await actions.upsertRecommendations([recommendation('snoozed-condition')]);
    const snoozed = await actions.transitionAction(created._id, {
      event: 'snooze', expectedVersion: 0, snoozeDays: 14,
    }, null, new Date('2026-08-01T00:00:00.000Z'));
    expect(snoozed.state).toBe('snoozed');

    await actions.upsertRecommendations([recommendation('snoozed-condition')], new Date('2026-08-14T00:00:00.000Z'));
    expect((await SeoAction.findById(created._id)).state).toBe('snoozed');

    await actions.upsertRecommendations([recommendation('snoozed-condition')], new Date('2026-08-16T00:00:00.000Z'));
    const resurfaced = await SeoAction.findById(created._id);
    expect(resurfaced.state).toBe('proposed');
    expect(resurfaced.snoozedUntil).toBeNull();
    expect(resurfaced.events.at(-1)).toEqual(expect.objectContaining({
      event: 'snooze_expired_redetected', fromState: 'snoozed', toState: 'proposed',
    }));
  });

  test('refreshes evidence but preserves owner-approved criteria while snoozed', async () => {
    const initial = {
      ...recommendation('owner-snoozed-condition'),
      recommendation: { checklist: ['Original owner direction'] },
      successCriteria: { metric: 'ctr', minimumRelativeLift: 0.15 },
    };
    const [created] = await actions.upsertRecommendations([initial]);
    const approved = await actions.transitionAction(created._id, {
      event: 'approve', expectedVersion: 0, copyDirection: 'Keep this owner edit',
    }, null, new Date('2026-08-01T00:00:00.000Z'));
    await actions.transitionAction(approved._id, {
      event: 'snooze', expectedVersion: 1, snoozeDays: 14,
    }, null, new Date('2026-08-01T00:00:00.000Z'));
    await actions.upsertRecommendations([{
      ...initial,
      priorityScore: 99,
      evidence: { summary: 'Fresh detector evidence' },
      recommendation: { checklist: ['Detector overwrite'] },
      successCriteria: { metric: 'ctr', minimumRelativeLift: 0.9 },
    }], new Date('2026-08-20T00:00:00.000Z'));
    const refreshed = await SeoAction.findById(created._id);
    expect(refreshed.state).toBe('snoozed');
    expect(refreshed.priorityScore).toBe(99);
    expect(refreshed.evidence.summary).toBe('Fresh detector evidence');
    expect(refreshed.recommendation.copyDirection).toBe('Keep this owner edit');
    expect(refreshed.successCriteria.minimumRelativeLift).toBe(0.15);
  });

  test('auto-clears a detector proposal and resurfaces it when the same condition returns', async () => {
    const [created] = await actions.upsertRecommendations([recommendation('reappearing-condition')]);
    const cleared = await actions.reconcileDetectorRecommendations({
      evaluatedPageKeys: ['page-one'], recommendations: [], now: new Date('2026-08-02T00:00:00.000Z'),
    });
    expect(cleared).toBe(1);
    const closed = await SeoAction.findById(created._id);
    expect(closed).toEqual(expect.objectContaining({ state: 'closed', detectorActive: false, autoResolved: true }));

    const [resurfaced] = await actions.upsertRecommendations(
      [recommendation('reappearing-condition')], new Date('2026-08-03T00:00:00.000Z')
    );
    expect(String(resurfaced._id)).toBe(String(created._id));
    expect(resurfaced.state).toBe('proposed');
    expect(resurfaced.events.at(-1).event).toBe('detector_redetected');
  });

  test('preserves query-dependent proposals when query coverage is not safe to reconcile', async () => {
    const [created] = await actions.upsertRecommendations([{
      ...recommendation('intent-with-missing-detail'), type: 'intent_mismatch',
    }]);
    const cleared = await actions.reconcileDetectorRecommendations({
      evaluatedPageKeys: ['page-one'], recommendations: [], querySafePageKeys: new Set(),
    });
    expect(cleared).toBe(0);
    expect((await SeoAction.findById(created._id)).state).toBe('proposed');
  });

  test('preserves v1 proposals without definitive-clear evidence and closes them once clear', async () => {
    const [created] = await actions.upsertRecommendations([{
      ...recommendation('legacy-low-sample-decay'),
      type: 'content_decay',
      source: 'balanced-v1',
      ruleVersion: 'balanced-v1',
    }]);
    const cleared = await actions.reconcileDetectorRecommendations({
      evaluatedPageKeys: ['page-one'],
      recommendations: [],
      eligibleTypesByPage: new Map([['page-one', new Set()]]),
      migrationEligibleTypesByPage: new Map([['page-one', new Set()]]),
    });
    expect(cleared).toBe(0);
    expect((await SeoAction.findById(created._id)).state).toBe('proposed');

    const clearedAfterDefinitiveEvidence = await actions.reconcileDetectorRecommendations({
      evaluatedPageKeys: ['page-one'],
      recommendations: [],
      eligibleTypesByPage: new Map([['page-one', new Set()]]),
      migrationEligibleTypesByPage: new Map([['page-one', new Set(['content_decay'])]]),
    });
    expect(clearedAfterDefinitiveEvidence).toBe(1);
    expect((await SeoAction.findById(created._id)).state).toBe('closed');
  });

  test('reports incomplete action progress when a deadline prevents synthesis or reconciliation', async () => {
    const upsertProgress = {};
    await expect(actions.upsertRecommendations(
      [recommendation('deadline-upsert')],
      new Date('2026-08-03T00:00:00.000Z'),
      { deadlineMs: 10, clock: () => 10, progress: upsertProgress }
    )).resolves.toEqual([]);
    expect(upsertProgress).toEqual({ processed: 0, total: 1, complete: false });

    const [created] = await actions.upsertRecommendations([recommendation('deadline-reconcile')]);
    const reconcileProgress = {};
    const cleared = await actions.reconcileDetectorRecommendations({
      evaluatedPageKeys: ['page-one'],
      recommendations: [],
      deadlineMs: 10,
      clock: () => 10,
      progress: reconcileProgress,
    });
    expect(cleared).toBe(0);
    expect(reconcileProgress).toEqual({ processed: 0, total: 1, complete: false });
    expect((await SeoAction.findById(created._id)).state).toBe('proposed');
  });

  test('enforces the one-active-experiment invariant across concurrent approvals', async () => {
    const [first] = await actions.upsertRecommendations([recommendation('concurrent-one')]);
    const [second] = await actions.upsertRecommendations([{
      ...recommendation('concurrent-two'), type: 'content_decay',
    }]);
    const results = await Promise.allSettled([
      actions.transitionAction(first._id, { event: 'approve', expectedVersion: 0 }, null),
      actions.transitionAction(second._id, { event: 'approve', expectedVersion: 0 }, null),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejection = results.find((result) => result.status === 'rejected');
    expect(rejection.reason).toEqual(expect.objectContaining({ code: 'SEO_PAGE_EXPERIMENT_ACTIVE' }));
    expect(await SeoAction.countDocuments({ pageKey: 'page-one', experimentLockKey: 'page-one' })).toBe(1);
  });

  test('allows one active page experiment and moves implementation through pending to measuring', async () => {
    const [first] = await actions.upsertRecommendations([recommendation('fp-first')]);
    const approved = await actions.transitionAction(
      first._id,
      { event: 'approve', expectedVersion: 0 },
      null,
      new Date('2026-07-01T10:00:00.000Z')
    );
    const [second] = await actions.upsertRecommendations([{ ...recommendation('fp-second'), type: 'content_decay' }]);
    await expect(actions.transitionAction(second._id, { event: 'approve', expectedVersion: 0 }, null))
      .rejects.toEqual(expect.objectContaining({ code: 'SEO_PAGE_EXPERIMENT_ACTIVE' }));
    const pending = await actions.transitionAction(approved._id, {
      event: 'mark_implemented', expectedVersion: 1, note: 'Updated the live title', implementedAt: '2026-07-01T12:00:00.000Z',
    }, null, new Date('2026-07-01T12:00:00.000Z'), {
      captureMetadata: async () => ({
        hash: 'metadata-hash', finalUrl: 'https://frontendatlas.com/page-one', observedAt: new Date('2026-07-01T12:00:00.000Z'),
        fields: { title: 'Page one', description: '', h1: '', canonical: 'https://frontendatlas.com/page-one', robots: '' },
      }),
    });
    expect(pending.state).toBe('implementation_pending');
    const productionEffectiveAt = new Date('2026-07-02T12:00:00.000Z');
    const confirmedCrawlAt = new Date('2026-07-03T12:00:00.000Z');
    await SeoPage.updateOne({ pageKey: 'page-one' }, { $set: {
      'changeTracking.currentVersionKey': 'version-title-change',
      'changeTracking.currentOccurrenceKey': 'occurrence-title-change',
      'changeTracking.lastGoogleCrawlAt': confirmedCrawlAt,
      'changeTracking.detectors.ctr_snippet': {
        versionKey: 'version-title-change',
        occurrenceKey: 'occurrence-title-change',
        productionEffectiveAt,
        productionPrecision: 'exact',
        productionSource: 'manifest_ready_at',
        changedComponents: ['title'],
        awaitingManifestChange: false,
        awaitingProductionEvidence: false,
        crawlConfirmationRequired: false,
        confirmedCrawlAt,
      },
    } });
    await actions.activatePendingMeasurements({
      pageKeys: ['page-one'], observedDate: '2026-07-05', now: new Date('2026-07-06T00:00:00.000Z'),
    });
    const measuring = await SeoAction.findById(first._id);
    expect(measuring.state).toBe('measuring');
    expect(measuring.implementationSnapshot.fields.title).toBe('Page one');
    expect(measuring.implementationSnapshot.verification).toEqual(expect.objectContaining({
      verifiedBy: 'manifest-fingerprint-and-gsc-crawl',
      observedDate: '2026-07-05',
      productionEffectiveAt,
      googleCrawlAt: confirmedCrawlAt,
    }));
    expect(measuring.measurementWindow).toEqual({
      timezone: 'America/Los_Angeles',
      productionDate: '2026-07-02',
      crawlDate: '2026-07-03',
      beforeStartDate: '2026-06-04',
      beforeEndDate: '2026-07-01',
      afterStartDate: '2026-07-04',
      afterEndDate: '2026-07-31',
    });
  });

  test('invalidates a newer assessment when a historical implementation is recorded later', async () => {
    const evaluatedAt = new Date('2026-08-07T09:00:00.000Z');
    const recordedAt = new Date('2026-08-08T12:00:00.000Z');
    const implementedAt = new Date('2026-08-04T12:00:00.000Z');
    await SeoPageAssessment.create({
      siteUrl: 'sc-domain:frontendatlas.com',
      pageKey: 'page-one',
      canonicalUrl: 'https://frontendatlas.com/page-one',
      endDate: '2026-08-04',
      ruleVersion: 'balanced-v2.1',
      primaryState: 'clear',
      evaluatedAt,
    });
    const [created] = await actions.upsertRecommendations(
      [recommendation('historical-implementation-invalidation')],
      recordedAt
    );
    const approved = await actions.transitionAction(
      created._id,
      { event: 'approve', expectedVersion: 0 },
      null,
      recordedAt
    );

    await actions.transitionAction(approved._id, {
      event: 'mark_implemented',
      expectedVersion: 1,
      note: 'The title was changed four days ago',
      implementedAt,
    }, null, recordedAt, {
      captureMetadata: async () => ({
        hash: 'historical-metadata-hash',
        finalUrl: 'https://frontendatlas.com/page-one',
        observedAt: recordedAt,
        fields: {
          title: 'Page one updated', description: '', h1: 'Page one',
          canonical: 'https://frontendatlas.com/page-one', robots: 'index,follow',
        },
      }),
    });

    const page = await SeoPage.findOne({ pageKey: 'page-one' });
    expect(page.changeTracking.materialChangedAt).toBeNull();
    expect(page.changeTracking.analysisInvalidatedAt).toEqual(recordedAt);
    expect(page.changeTracking.detectors.ctr_snippet).toEqual(expect.objectContaining({
      implementationReportedAt: implementedAt,
      awaitingManifestChange: true,
      expectedChangedComponents: ['title', 'description'],
    }));
    expect(await SeoPageAssessment.countDocuments({ pageKey: 'page-one' })).toBe(1);
    const retained = await SeoPageAssessment.findOne({ pageKey: 'page-one' }).lean();
    expect(retained.inputHash || '').not.toBe(page.changeTracking.analysisInputHash);
  });

  test('attributes a matching post-approval deploy when the owner marks implementation after crawl', async () => {
    const [created] = await actions.upsertRecommendations([recommendation('late-owner-mark')]);
    const approvedAt = new Date('2026-07-01T10:00:00.000Z');
    const approved = await actions.transitionAction(
      created._id, { event: 'approve', expectedVersion: 0 }, null, approvedAt
    );
    const productionEffectiveAt = new Date('2026-07-02T12:00:00.000Z');
    const confirmedCrawlAt = new Date('2026-07-03T12:00:00.000Z');
    await SeoPage.updateOne({ pageKey: 'page-one' }, { $set: {
      'changeTracking.detectors.ctr_snippet': {
        versionKey: 'late-title-version',
        productionEffectiveAt,
        productionPrecision: 'exact',
        productionSource: 'manifest_ready_at',
        changedComponents: ['title'],
        awaitingProductionEvidence: false,
        crawlConfirmationRequired: false,
        confirmedCrawlAt,
      },
      'changeTracking.lastGoogleCrawlAt': confirmedCrawlAt,
    } });

    const markedAt = new Date('2026-07-04T12:00:00.000Z');
    const pending = await actions.transitionAction(approved._id, {
      event: 'mark_implemented', expectedVersion: 1, note: 'Verified the title is live', implementedAt: markedAt,
    }, null, markedAt, {
      captureMetadata: async () => ({
        hash: 'late-title-metadata', finalUrl: 'https://frontendatlas.com/page-one', observedAt: markedAt,
        fields: { title: 'Page one', description: '', h1: '', canonical: 'https://frontendatlas.com/page-one', robots: '' },
      }),
    });
    expect(pending.state).toBe('implementation_pending');
    const pageAfterMark = await SeoPage.findOne({ pageKey: 'page-one' }).lean();
    expect(pageAfterMark.changeTracking.detectors.ctr_snippet.awaitingManifestChange).toBe(false);

    expect(await actions.activatePendingMeasurements({
      pageKeys: ['page-one'], observedDate: '2026-07-05', now: new Date('2026-07-06T00:00:00.000Z'),
    })).toBe(1);
    const measuring = await SeoAction.findById(created._id).lean();
    expect(measuring).toEqual(expect.objectContaining({ state: 'measuring' }));
    expect(measuring.measurementWindow).toEqual({
      timezone: 'America/Los_Angeles',
      productionDate: '2026-07-02',
      crawlDate: '2026-07-03',
      beforeStartDate: '2026-06-04',
      beforeEndDate: '2026-07-01',
      afterStartDate: '2026-07-04',
      afterEndDate: '2026-07-31',
    });
  });

  test('does not attribute a matching detector occurrence from before action approval', async () => {
    const [created] = await actions.upsertRecommendations([recommendation('pre-approval-change')]);
    const approvedAt = new Date('2026-07-01T10:00:00.000Z');
    const approved = await actions.transitionAction(
      created._id, { event: 'approve', expectedVersion: 0 }, null, approvedAt
    );
    await SeoPage.updateOne({ pageKey: 'page-one' }, { $set: {
      'changeTracking.detectors.ctr_snippet': {
        versionKey: 'old-title-version',
        productionEffectiveAt: new Date('2026-06-30T12:00:00.000Z'),
        productionPrecision: 'exact',
        productionSource: 'manifest_ready_at',
        changedComponents: ['title'],
        awaitingProductionEvidence: false,
        crawlConfirmationRequired: false,
        confirmedCrawlAt: new Date('2026-07-02T12:00:00.000Z'),
      },
    } });
    const markedAt = new Date('2026-07-04T12:00:00.000Z');
    await actions.transitionAction(approved._id, {
      event: 'mark_implemented', expectedVersion: 1, note: 'Changed title', implementedAt: markedAt,
    }, null, markedAt, { captureMetadata: async () => { throw new Error('unavailable'); } });

    const page = await SeoPage.findOne({ pageKey: 'page-one' }).lean();
    expect(page.changeTracking.detectors.ctr_snippet.awaitingManifestChange).toBe(true);
    expect(await actions.activatePendingMeasurements({
      pageKeys: ['page-one'], observedDate: '2026-07-05', now: new Date('2026-07-06T00:00:00.000Z'),
    })).toBe(0);
    expect((await SeoAction.findById(created._id)).state).toBe('implementation_pending');
  });

  test('keeps a technical action pending until production lineage and a later crawl are verified', async () => {
    const [created] = await actions.upsertRecommendations([{
      ...recommendation('technical-fingerprint'),
      type: 'technical_indexing',
      summary: 'Fix the canonical signal',
      successCriteria: { metric: 'impressions', minimum: 1, observationWindowDays: 28 },
    }]);
    const approved = await actions.transitionAction(created._id, {
      event: 'approve', expectedVersion: 0,
    }, null, new Date('2026-07-01T10:00:00.000Z'));
    const implementedAt = new Date('2026-07-01T12:00:00.000Z');
    const pending = await actions.transitionAction(approved._id, {
      event: 'mark_implemented', expectedVersion: 1, note: 'Canonical now points to this page', implementedAt,
    }, null, implementedAt, {
      captureMetadata: async () => ({
        hash: 'technical-metadata-hash',
        finalUrl: 'https://frontendatlas.com/page-one',
        observedAt: implementedAt,
        fields: {
          title: 'Page one', description: '', h1: 'Page one',
          canonical: 'https://frontendatlas.com/page-one', robots: 'index,follow',
        },
      }),
    });

    expect(pending.state).toBe('implementation_pending');
    expect(pending.measuringUntil).toBeNull();
    expect(pending.implementationSnapshot.source).toBe('live_metadata');
    const page = await SeoPage.findOne({ pageKey: 'page-one' }).lean();
    expect(page.changeTracking.detectors.technical_indexing).toEqual(expect.objectContaining({
      awaitingManifestChange: true,
      implementationReportedAt: implementedAt,
    }));
  });

  test('starts a zero-impression technical measurement after a persisted URL Inspection snapshot', async () => {
    const [created] = await actions.upsertRecommendations([{
      ...recommendation('inspection-fingerprint'),
      type: 'technical_indexing',
      summary: 'Resolve the indexing signal',
    }]);
    const approved = await actions.transitionAction(created._id, {
      event: 'approve', expectedVersion: 0,
    }, null, new Date('2026-08-01T10:00:00.000Z'));
    const implementedAt = new Date('2026-08-01T12:00:00.000Z');
    const pending = await actions.transitionAction(approved._id, {
      event: 'mark_implemented', expectedVersion: 1, note: 'Updated robots and canonical', implementedAt,
    }, null, implementedAt, {
      captureMetadata: async () => { throw new Error('metadata unavailable'); },
    });
    expect(pending.state).toBe('implementation_pending');
    expect(pending.implementationSnapshot.unavailable).toBe(true);
    const productionEffectiveAt = new Date('2026-08-03T12:00:00.000Z');
    await SeoPage.updateOne({ pageKey: 'page-one' }, { $set: {
      firstSeenAt: new Date('2026-01-01T00:00:00.000Z'),
      'changeTracking.currentVersionKey': 'technical-version',
      'changeTracking.currentOccurrenceKey': 'technical-occurrence',
      'changeTracking.detectors.technical_indexing': {
        versionKey: 'technical-version',
        occurrenceKey: 'technical-occurrence',
        productionEffectiveAt,
        productionPrecision: 'exact',
        productionSource: 'manifest_ready_at',
        changedComponents: ['canonical', 'robots'],
        awaitingManifestChange: false,
        awaitingProductionEvidence: false,
        crawlConfirmationRequired: true,
        confirmedCrawlAt: null,
      },
      'changeTracking.crawlConfirmationRequired': true,
    } });

    const observedAt = new Date('2026-08-07T12:00:00.000Z');
    const confirmedCrawlAt = new Date('2026-08-04T12:00:00.000Z');
    const result = await syncService.runUrlInspectionDiagnostics({
      client: {
        inspectUrl: jest.fn(async () => ({
          indexStatusResult: {
            verdict: 'PASS', coverageState: 'Submitted and indexed', robotsTxtState: 'ALLOWED',
            googleCanonical: 'https://frontendatlas.com/page-one/',
            lastCrawlTime: confirmedCrawlAt.toISOString(),
          },
        })),
      },
      config: { siteUrl: 'sc-domain:frontendatlas.com' },
      endDate: '2026-08-04',
      now: observedAt,
    });

    expect(result).toEqual(expect.objectContaining({ persisted: 1, technicalMeasurementsActivated: 1 }));
    expect(await SeoDiagnosticSnapshot.countDocuments({ pageKey: 'page-one', kind: 'urlInspection' })).toBe(1);
    const measuring = await SeoAction.findById(created._id);
    expect(measuring.state).toBe('measuring');
    expect(measuring.implementationSnapshot.verification).toEqual(expect.objectContaining({
      verifiedBy: 'gsc-url-inspection-after-deploy',
      indexStatus: 'PASS',
      canonicalVerdict: 'match',
      productionEffectiveAt,
      googleCrawlAt: confirmedCrawlAt,
    }));
    expect(measuring.measuringUntil).toEqual(new Date('2026-09-01T23:59:59.999Z'));
    expect(measuring.measurementWindow).toEqual({
      timezone: 'America/Los_Angeles',
      productionDate: '2026-08-03',
      crawlDate: '2026-08-04',
      beforeStartDate: '2026-07-06',
      beforeEndDate: '2026-08-02',
      afterStartDate: '2026-08-05',
      afterEndDate: '2026-09-01',
    });
  });

  test('evaluates production-anchored windows against locked lineage and rejects a later scoped deploy', async () => {
    const { shiftDateKey } = require('../services/seo/dates');
    const titleBHash = 'b'.repeat(64);
    const titleCHash = 'c'.repeat(64);
    const measurementWindow = {
      timezone: 'America/Los_Angeles',
      productionDate: '2026-07-02',
      crawlDate: '2026-07-03',
      beforeStartDate: '2026-06-04',
      beforeEndDate: '2026-07-01',
      afterStartDate: '2026-07-04',
      afterEndDate: '2026-07-31',
    };
    await SeoPage.updateOne({ pageKey: 'page-one' }, { $set: {
      'changeTracking.currentVersionKey': 'page-version-b',
      'changeTracking.currentOccurrenceKey': 'page-occurrence-b',
      'changeTracking.componentHashes.title': titleBHash,
      'changeTracking.trustedComponentHashes.title': titleBHash,
      'changeTracking.detectors.ctr_snippet': {
        versionKey: 'detector-version-b',
        occurrenceKey: 'detector-occurrence-b',
        productionEffectiveAt: new Date('2026-07-02T12:00:00.000Z'),
        productionPrecision: 'exact',
        productionSource: 'manifest_ready_at',
        changedComponents: ['title'],
        changedComponentHashes: { title: titleBHash },
        awaitingProductionEvidence: false,
        crawlConfirmationRequired: false,
        confirmedCrawlAt: new Date('2026-07-03T12:00:00.000Z'),
      },
    } });
    await SeoPage.create({
      pageKey: 'page-two', canonicalUrl: 'https://frontendatlas.com/page-two', title: 'Page two', manifest: { present: true },
      changeTracking: {
        currentVersionKey: 'page-version-c',
        currentOccurrenceKey: 'page-occurrence-c',
        componentHashes: { title: titleCHash },
        trustedComponentHashes: { title: titleCHash },
        detectors: {
          ctr_snippet: {
            versionKey: 'detector-version-c',
            occurrenceKey: 'detector-occurrence-c',
            productionEffectiveAt: new Date('2026-07-10T12:00:00.000Z'),
            productionPrecision: 'exact',
            productionSource: 'manifest_ready_at',
            changedComponents: ['title'],
            changedComponentHashes: { title: titleCHash },
            crawlConfirmationRequired: true,
          },
        },
      },
    });

    const baseMeasuring = {
      ...recommendation('locked-lineage-b'),
      state: 'measuring',
      approvedAt: new Date('2026-06-30T12:00:00.000Z'),
      implementedAt: new Date('2026-07-01T12:00:00.000Z'),
      measuringUntil: new Date('2026-07-31T23:59:59.999Z'),
      measurementWindow,
      successCriteria: { metric: 'ctr', minimumRelativeLift: 0.15, maximumPositionLoss: 1 },
      implementationSnapshot: {
        source: 'live_metadata',
        // This is deliberately the pre-deploy title. Verified fingerprint
        // lineage, not this stale mark-time snapshot, owns attribution.
        fields: { title: 'Old title A' },
        verification: {
          verifiedBy: 'manifest-fingerprint-and-gsc-crawl',
          productionEffectiveAt: new Date('2026-07-02T12:00:00.000Z'),
          googleCrawlAt: new Date('2026-07-03T12:00:00.000Z'),
          detectorVersionKey: 'detector-version-b',
          detectorOccurrenceKey: 'detector-occurrence-b',
          changedComponents: ['title'],
          componentHashes: { title: titleBHash },
        },
      },
    };
    const matching = await SeoAction.create(baseMeasuring);
    const contaminated = await SeoAction.create({
      ...baseMeasuring,
      _id: undefined,
      pageKey: 'page-two',
      canonicalUrl: 'https://frontendatlas.com/page-two',
      fingerprint: 'locked-lineage-contaminated',
    });

    const dates = [];
    for (let date = measurementWindow.beforeStartDate; date <= measurementWindow.beforeEndDate; date = shiftDateKey(date, 1)) {
      dates.push({ date, after: false });
    }
    for (let date = measurementWindow.afterStartDate; date <= measurementWindow.afterEndDate; date = shiftDateKey(date, 1)) {
      dates.push({ date, after: true });
    }
    await SeoMetricPartition.insertMany(dates.map(({ date }) => ({
      siteUrl: 'sc-domain:frontendatlas.com', date, slice: 'page', activeGeneration: `page-${date}`,
      status: 'complete', rowCount: 2, impressions: 200, completedAt: new Date(`${date}T23:00:00.000Z`),
    })));
    await SeoPageDailyMetric.insertMany(dates.flatMap(({ date, after }) => ['page-one', 'page-two'].map((pageKey) => ({
      siteUrl: 'sc-domain:frontendatlas.com', date, pageKey,
      canonicalUrl: `https://frontendatlas.com/${pageKey}`,
      generation: `page-${date}`,
      clicks: after ? 2 : 1,
      impressions: 100,
      position: 5,
      positionNumerator: 500,
    }))));

    const captureMetadata = jest.fn();
    expect(await require('../services/seo/analysis').evaluateDueActions({
      siteUrl: 'sc-domain:frontendatlas.com',
      latestFinalizedDate: '2026-07-31',
      now: new Date('2026-08-05T12:00:00.000Z'),
      captureMetadata,
    })).toBe(2);
    expect(captureMetadata).not.toHaveBeenCalled();
    expect((await SeoAction.findById(matching._id)).evaluation.verdict).toBe('success');
    const rejected = await SeoAction.findById(contaminated._id);
    expect(rejected.evaluation.verdict).toBe('inconclusive');
    expect(rejected.evaluation.reason).toContain('fingerprint changed during measurement');
  });

  test('evaluates inspection-verified technical actions on post-window visibility without a before sample', async () => {
    const { pageKeyForUrl } = require('../services/seo/keys');
    const pageOneKey = pageKeyForUrl('https://frontendatlas.com/page-one');
    const pageTwoKey = pageKeyForUrl('https://frontendatlas.com/page-two');
    const pageThreeKey = pageKeyForUrl('https://frontendatlas.com/page-three');
    await SeoPage.deleteMany({});
    await SeoPage.create([
      { pageKey: pageOneKey, canonicalUrl: 'https://frontendatlas.com/page-one', title: 'Page one', manifest: { present: true } },
      { pageKey: pageTwoKey, canonicalUrl: 'https://frontendatlas.com/page-two', title: 'Page two', manifest: { present: true } },
      { pageKey: pageThreeKey, canonicalUrl: 'https://frontendatlas.com/page-three', title: 'Page three', manifest: { present: true } },
    ]);
    const implementedAt = new Date('2026-07-08T12:00:00.000Z');
    const base = {
      ...recommendation('technical-evaluation-base'),
      pageKey: pageOneKey,
      type: 'technical_indexing',
      state: 'measuring',
      implementedAt,
      measuringUntil: new Date('2026-08-04T12:00:00.000Z'),
      successCriteria: { metric: 'impressions', minimum: 1, observationWindowDays: 28 },
      implementationSnapshot: {
        source: 'owner_confirmation', unavailable: true,
        verification: { verifiedBy: 'gsc-url-inspection-after-deploy', observedAt: new Date('2026-07-09T00:00:00.000Z') },
      },
    };
    const visible = await SeoAction.create(base);
    const invisible = await SeoAction.create({
      ...base,
      _id: undefined,
      pageKey: pageTwoKey,
      canonicalUrl: 'https://frontendatlas.com/page-two',
      fingerprint: 'technical-evaluation-invisible',
    });
    const canonicalMismatch = await SeoAction.create({
      ...base,
      _id: undefined,
      pageKey: pageThreeKey,
      canonicalUrl: 'https://frontendatlas.com/page-three',
      fingerprint: 'technical-evaluation-canonical',
      successCriteria: {
        metric: 'urlInspection', requireCanonicalMatch: true, requireIndexPass: false, requireRobotsAllowed: false,
      },
    });
    await SeoDiagnosticSnapshot.create({
      siteUrl: 'sc-domain:frontendatlas.com',
      pageKey: pageThreeKey,
      kind: 'urlInspection',
      observedAt: new Date('2026-08-04T12:00:00.000Z'),
      data: { indexStatus: 'PASS', robots: 'ALLOWED', canonicalVerdict: 'mismatch' },
      expiresAt: new Date('2026-10-01T00:00:00.000Z'),
    });
    const { shiftDateKey } = require('../services/seo/dates');
    for (let date = '2026-07-08'; date <= '2026-08-04'; date = shiftDateKey(date, 1)) {
      await metricsStore.writeSliceGeneration({
        siteUrl: 'sc-domain:frontendatlas.com', date, slice: 'page',
        rows: date === '2026-08-04'
          ? [
            { keys: ['https://frontendatlas.com/page-one'], clicks: 0, impressions: 1, position: 90 },
            { keys: ['https://frontendatlas.com/page-three'], clicks: 0, impressions: 10, position: 20 },
          ]
          : [],
      });
    }
    const captureMetadata = jest.fn();
    const evaluated = await require('../services/seo/analysis').evaluateDueActions({
      siteUrl: 'sc-domain:frontendatlas.com',
      latestFinalizedDate: '2026-08-04',
      now: new Date('2026-08-07T00:00:00.000Z'),
      captureMetadata,
    });
    expect(evaluated).toBe(3);
    expect(captureMetadata).not.toHaveBeenCalled();
    expect((await SeoAction.findById(visible._id)).evaluation.verdict).toBe('success');
    expect((await SeoAction.findById(invisible._id)).evaluation.verdict).toBe('failed');
    expect((await SeoAction.findById(canonicalMismatch._id)).evaluation.verdict).toBe('failed');
  });

  test('retries the original measurement dates instead of sliding to a newer complete window', async () => {
    const { shiftDateKey } = require('../services/seo/dates');
    for (let date = '2026-07-14'; date <= '2026-08-10'; date = shiftDateKey(date, 1)) {
      await metricsStore.writeSliceGeneration({
        siteUrl: 'sc-domain:frontendatlas.com', date, slice: 'page', rows: [],
      });
    }
    const action = await SeoAction.create({
      ...recommendation('anchored-measurement-window'),
      type: 'technical_indexing',
      state: 'measuring',
      implementedAt: new Date('2026-07-08T12:00:00.000Z'),
      measuringUntil: new Date('2026-08-04T12:00:00.000Z'),
      successCriteria: { metric: 'impressions', minimum: 1 },
      implementationSnapshot: {
        verification: { verifiedBy: 'gsc-page-observation', observedDate: '2026-07-08' },
      },
    });
    const analysis = require('../services/seo/analysis');
    const first = await analysis.evaluateDueActions({
      siteUrl: 'sc-domain:frontendatlas.com',
      latestFinalizedDate: '2026-08-10',
      now: new Date('2026-08-11T00:00:00.000Z'),
    });
    expect(first).toBe(0);
    const deferred = await SeoAction.findById(action._id);
    expect(deferred.state).toBe('measuring');
    expect(deferred.nextEvaluationAttemptAt).toEqual(new Date('2026-08-12T00:00:00.000Z'));

    const second = await analysis.evaluateDueActions({
      siteUrl: 'sc-domain:frontendatlas.com',
      latestFinalizedDate: '2026-08-10',
      now: new Date('2026-08-20T00:00:00.000Z'),
    });
    expect(second).toBe(1);
    const exhausted = await SeoAction.findById(action._id);
    expect(exhausted.state).toBe('evaluated');
    expect(exhausted.evaluation).toEqual(expect.objectContaining({
      verdict: 'inconclusive',
      reason: 'Required finalized data or verification remained unavailable after the retry window.',
    }));
  });

  test('suppresses a new snippet hypothesis for 90 days after two failed attempts across page history', async () => {
    await SeoAction.create({
      ...recommendation('old-failure'), state: 'closed', failureCount: 1,
      evaluation: { verdict: 'failed', evaluatedAt: new Date(), reason: 'No lift' },
    });
    const current = await SeoAction.create({ ...recommendation('current-failure'), state: 'evaluated' });
    const closed = await actions.transitionAction(current._id, {
      event: 'override_verdict', expectedVersion: 0, verdict: 'failed', note: 'Confirmed no lift',
    }, null, new Date('2026-08-01T00:00:00.000Z'));
    expect(closed.suppressedUntil).toEqual(new Date('2026-10-30T00:00:00.000Z'));
    const result = await actions.upsertRecommendations([recommendation('brand-new-evidence')], new Date('2026-08-02T00:00:00.000Z'));
    expect(result).toHaveLength(0);
    const serialized = actions.serializeAction(closed);
    expect(serialized.suppressedUntil).toBe('2026-10-30T00:00:00.000Z');
    expect(serialized.suppressionGuidance).toContain('investigate intent and result format');
  });

  test('counts an overridden verdict once and removes its contribution when changed to success', async () => {
    const failed = await SeoAction.create({
      ...recommendation('override-same-failure'), state: 'evaluated', failureCount: 1,
      evaluation: { verdict: 'failed', evaluatedAt: new Date(), reason: 'Automatic failure' },
    });
    const stillFailed = await actions.transitionAction(failed._id, {
      event: 'override_verdict', expectedVersion: 0, verdict: 'failed', note: 'Confirmed',
    }, null, new Date('2026-08-01T00:00:00.000Z'));
    expect(stillFailed.failureCount).toBe(1);

    const corrected = await SeoAction.create({
      ...recommendation('override-to-success'), state: 'evaluated', failureCount: 1,
      evaluation: { verdict: 'failed', evaluatedAt: new Date(), reason: 'Automatic failure' },
    });
    const success = await actions.transitionAction(corrected._id, {
      event: 'override_verdict', expectedVersion: 0, verdict: 'success', note: 'Verified success',
    }, null, new Date('2026-08-01T00:00:00.000Z'));
    expect(success.failureCount).toBe(0);
    expect(success.suppressedUntil).toBeNull();
  });
});

describe('sync cursor selection', () => {
  const config = { datesPerRun: 30, initialBackfillDays: 90, maximumBackfillDays: 480 };

  test('anchors the initial window while finalized dates advance', () => {
    const first = syncService.selectSyncDates({ recentBackfillComplete: false }, '2026-08-01', config);
    const next = syncService.selectSyncDates({
      recentBackfillComplete: false,
      recentBackfillStartDate: first.initialStart,
      recentBackfillEndDate: first.initialEnd,
      recentCursorDate: first.nextCursor,
    }, '2026-08-05', config);
    expect(next.initialEnd).toBe('2026-08-01');
    expect(next.dates[0]).toBe(first.nextCursor);
  });

  test('allows analysis to use the anchored recent window before the full initial backfill completes', () => {
    expect(syncService.analysisEndDateForState({
      recentBackfillEndDate: '2026-08-04',
      recentBackfillComplete: false,
      lastFinalizedDate: null,
    })).toBe('2026-08-04');
    expect(syncService.analysisEndDateForState({
      recentBackfillEndDate: '2026-08-04',
      recentBackfillComplete: true,
      lastFinalizedDate: '2026-08-06',
    })).toBe('2026-08-06');
  });

  test('a gap larger than the batch advances oldest-first without skipping a partial batch', () => {
    const first = syncService.selectSyncDates({ recentBackfillComplete: true, lastFinalizedDate: '2026-06-01' }, '2026-07-16', config);
    expect(first.mode).toBe('catchup');
    expect(first.dates).toHaveLength(30);
    expect(first.dates[0]).toBe('2026-06-02');
    const second = syncService.selectSyncDates({ recentBackfillComplete: true, lastFinalizedDate: first.dates[9] }, '2026-07-16', config);
    expect(second.dates[0]).toBe('2026-06-12');
    expect(second.dates).not.toContain('2026-06-02');
  });

  test('fills a daily catch-up batch with refresh and older work while committing each cursor independently', () => {
    const state = {
      recentBackfillComplete: true,
      recentBackfillStartDate: '2026-05-01',
      recentBackfillEndDate: '2026-07-15',
      lastFinalizedDate: '2026-07-15',
      olderCursorDate: '2026-04-30',
      refreshOffset: 0,
    };
    const selection = syncService.selectSyncDates(state, '2026-07-16', config);
    expect(selection.mode).toBe('mixed');
    expect(selection.dates).toHaveLength(30);
    expect(selection.dates[0]).toBe('2026-07-16');
    expect(selection.rolesByDate['2026-07-16']).toEqual(['catchup', 'refresh']);
    expect(selection.dates[1]).toBe('2026-04-30');

    syncService.applyCompletedDateToState({ state, selection, date: '2026-07-16' });
    expect(state).toEqual(expect.objectContaining({
      lastFinalizedDate: '2026-07-16', refreshOffset: 1, olderCursorDate: '2026-04-30',
    }));
    syncService.applyCompletedDateToState({ state, selection, date: '2026-04-30' });
    expect(state.olderCursorDate).toBe('2026-04-29');
  });

  test('keeps detailed facts in the rolling 180-day priority window only', () => {
    expect(syncService.shouldIncludeDetailsForDate({
      includeDetails: true, storageGuardLevel: 'ok', date: '2026-07-15', latestFinalizedDate: '2026-08-01', roles: ['catchup'],
    })).toBe(true);
    expect(syncService.shouldIncludeDetailsForDate({
      includeDetails: true, storageGuardLevel: 'ok', date: '2026-01-01', latestFinalizedDate: '2026-08-01', roles: ['older'],
    })).toBe(false);
    expect(syncService.shouldIncludeDetailsForDate({
      includeDetails: true, storageGuardLevel: 'warning', date: '2026-05-01', latestFinalizedDate: '2026-08-01', roles: ['older'],
    })).toBe(false);
  });

  test('fails detailed storage closed at the threshold and when collStats is unavailable', async () => {
    await expect(syncService.measureDetailStorageGuard({
      storageBudgetBytes: 1_000,
      estimateStorage: async () => 849,
    })).resolves.toEqual({ bytes: 849, level: 'warning', includeDetails: true });
    await expect(syncService.measureDetailStorageGuard({
      storageBudgetBytes: 1_000,
      estimateStorage: async () => 850,
    })).resolves.toEqual({ bytes: 850, level: 'detail_paused', includeDetails: false });
    await expect(syncService.measureDetailStorageGuard({
      storageBudgetBytes: 1_000,
      estimateStorage: async () => null,
    })).resolves.toEqual({ bytes: null, level: 'unknown', includeDetails: false });
  });
});
