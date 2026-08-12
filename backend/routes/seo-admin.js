'use strict';

const express = require('express');
const SeoPage = require('../models/SeoPage');
const SeoSyncRun = require('../models/SeoSyncRun');
const { applySeoPrivateResponsePolicy } = require('../middleware/SeoResponsePolicy');
const { rateLimit } = require('../middleware/rateLimit');
const {
  SeoActionError,
  createManualAction,
  serializeAction,
  transitionAction,
} = require('../services/seo/actions');
const { getSeoRuntimeConfig } = require('../services/seo/config');
const {
  decodeOffset,
  encodeOffset,
  getActionById,
  getOverview,
  getPageDetail,
  listActions,
  listPages,
  updatePageIntent,
} = require('../services/seo/dashboard');
const {
  getQueryOpportunityExamples,
  listOpportunities,
  promoteOpportunity,
  putSerpReview,
} = require('../services/seo/opportunity-api');
const { SeoSyncError, runSeoAnalysis, runSeoSync } = require('../services/seo/sync');

const router = express.Router();
const MANUAL_SYNC_COOLDOWN_MS = 2 * 60 * 1000;
const MANUAL_SYNC_BUDGET_MS = 45_000;
const MANUAL_SYNC_HARD_DEADLINE_MS = 60_000;
const MANUAL_SYNC_DATE_CAP = 30;
const MANUAL_ANALYSIS_HARD_DEADLINE_MS = 55_000;
const AUTO_SYNC_CONFIG_WARNING = 'Production auto-sync is disabled until CRON_SECRET is configured with at least 32 characters. Manual Sync now remains available.';
const ownerRateLimitKey = (req) => String(req.seoOwner?.userId || req.ip || 'unknown');
const opportunityListLimiter = rateLimit({
  name: 'seo-opportunity-list',
  windowMs: 60_000,
  max: 60,
  keyGenerator: ownerRateLimitKey,
  message: 'Too many SEO opportunity requests. Please wait and try again.',
  code: 'SEO_OPPORTUNITY_RATE_LIMITED',
});
const opportunityExamplesLimiter = rateLimit({
  name: 'seo-opportunity-examples',
  windowMs: 60_000,
  max: 10,
  keyGenerator: ownerRateLimitKey,
  message: 'Too many query example requests. Please wait and try again.',
  code: 'SEO_OPPORTUNITY_EXAMPLES_RATE_LIMITED',
});
const opportunityMutationLimiter = rateLimit({
  name: 'seo-opportunity-mutation',
  windowMs: 10 * 60_000,
  max: 30,
  keyGenerator: ownerRateLimitKey,
  message: 'Too many SEO opportunity changes. Please wait and try again.',
  code: 'SEO_OPPORTUNITY_MUTATION_RATE_LIMITED',
});

router.use((_req, res, next) => {
  applySeoPrivateResponsePolicy(res);
  next();
});

function parseWindow(value) {
  const parsed = Number(value || 28);
  return [7, 28, 90].includes(parsed) ? parsed : 28;
}

function parseSegment(value) {
  return ['all', 'brand', 'nonbrand'].includes(value) ? value : 'all';
}

function parseIntentConfirmed(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function serializeSyncRunError(run = {}) {
  if (!run.errorCode) return null;
  const rawCode = String(run.errorCode || '');
  const code = /^(?:SEO|GSC)_[A-Z0-9_]{1,80}$/.test(rawCode) ? rawCode : 'SEO_SYNC_FAILED';
  const message = code === 'SEO_SYNC_NO_PROGRESS'
    ? 'Sync stopped without advancing the finalized cursor.'
    : code === 'SEO_ANALYSIS_FAILED'
      ? 'SEO analysis failed.'
      : code.startsWith('GSC_')
        ? 'Search Console sync failed.'
        : 'SEO sync failed.';
  return { code, message };
}

function sendError(res, error) {
  const status = Number(error?.status || error?.statusCode || 500);
  const safeStatus = status >= 400 && status <= 599 ? status : 500;
  const code = error?.code || 'SEO_REQUEST_FAILED';
  const message = safeStatus >= 500 && !String(code).startsWith('SEO_')
    ? 'SEO request failed.'
    : String(error?.message || 'SEO request failed.');
  return res.status(safeStatus).json({ code, error: message });
}

function automationConfig(config) {
  const baseConfigured = Boolean(config?.configured);
  const cronSecretPresent = Boolean(config?.cronSecretPresent);
  const configured = baseConfigured && cronSecretPresent;
  return {
    configured,
    warning: baseConfigured && !cronSecretPresent ? AUTO_SYNC_CONFIG_WARNING : null,
  };
}

function appendWarning(existing, warning) {
  const current = String(existing || '').trim();
  if (!warning || current.includes(warning)) return current || null;
  return current ? `${current} ${warning}` : warning;
}

function withAutomationHealth(result, config) {
  if (!result?.dataHealth) return result;
  const automation = automationConfig(config);
  return {
    ...result,
    dataHealth: {
      ...result.dataHealth,
      automationConfigured: automation.configured,
      nextScheduledSyncAt: automation.configured
        ? result.dataHealth.nextScheduledSyncAt
        : null,
      warning: appendWarning(result.dataHealth.warning, automation.warning),
    },
  };
}

router.get('/access', (req, res) => {
  const config = getSeoRuntimeConfig();
  return res.json({
    allowed: Boolean(req.seoOwner),
    enabled: config.enabled,
    reason: config.configured ? null : 'The GSC integration or storage budget is not fully configured.',
    automation: automationConfig(config),
    capabilities: {
      contractVersion: 'seo-admin.v2',
      manualAnalysis: true,
      queryOpportunities: true,
    },
  });
});

router.get('/overview', async (req, res) => {
  try {
    const config = getSeoRuntimeConfig();
    const result = await getOverview({
      config,
      windowDays: parseWindow(req.query.window),
      segment: parseSegment(req.query.segment),
    });
    return res.json(withAutomationHealth(result, config));
  } catch (error) {
    return sendError(res, error);
  }
});

router.get('/actions', async (req, res) => {
  try {
    return res.json(await listActions({
      queue: req.query.queue === 'now' ? 'now' : 'backlog',
      status: req.query.status,
      type: req.query.type,
      search: req.query.search,
      cursor: req.query.cursor,
      limit: req.query.limit,
    }));
  } catch (error) {
    return sendError(res, error);
  }
});

router.get('/actions/:id', async (req, res) => {
  try {
    const action = await getActionById(req.params.id);
    if (!action) return res.status(404).json({ code: 'SEO_ACTION_NOT_FOUND', error: 'Action not found' });
    return res.json(action);
  } catch (error) {
    if (error?.name === 'CastError') return res.status(400).json({ code: 'SEO_ACTION_INVALID_ID', error: 'Invalid action id' });
    return sendError(res, error);
  }
});

router.get('/opportunities', opportunityListLimiter, async (req, res) => {
  try {
    return res.json(await listOpportunities({
      config: getSeoRuntimeConfig(),
      lane: req.query.lane,
      cursor: req.query.cursor,
      limit: req.query.limit,
    }));
  } catch (error) {
    return sendError(res, error);
  }
});

router.post('/actions', async (req, res) => {
  try {
    const action = await createManualAction(req.body, req.seoOwner.userId);
    const page = await SeoPage.findOne({ pageKey: action.pageKey }).select('title').lean();
    return res.status(201).json(serializeAction(action, page));
  } catch (error) {
    return sendError(res, error);
  }
});

router.post('/actions/:id/transition', async (req, res) => {
  try {
    const action = await transitionAction(req.params.id, req.body, req.seoOwner.userId);
    const page = await SeoPage.findOne({ pageKey: action.pageKey }).select('title').lean();
    return res.json(serializeAction(action, page));
  } catch (error) {
    if (error?.name === 'CastError') return res.status(400).json({ code: 'SEO_ACTION_INVALID_ID', error: 'Invalid action id' });
    return sendError(res, error);
  }
});

router.get('/pages', async (req, res) => {
  try {
    const config = getSeoRuntimeConfig();
    return res.json(await listPages({
      config,
      search: req.query.search,
      intentConfirmed: parseIntentConfirmed(req.query.intentConfirmed),
      cursor: req.query.cursor,
      limit: req.query.limit,
    }));
  } catch (error) {
    return sendError(res, error);
  }
});

router.get('/pages/:pageKey', async (req, res) => {
  try {
    const page = await getPageDetail({ config: getSeoRuntimeConfig(), pageKey: req.params.pageKey });
    if (!page) return res.status(404).json({ code: 'SEO_PAGE_NOT_FOUND', error: 'Page not found' });
    return res.json(page);
  } catch (error) {
    return sendError(res, error);
  }
});

router.get(
  '/pages/:pageKey/query-opportunities/:opportunityKey/examples',
  opportunityExamplesLimiter,
  async (req, res) => {
    try {
      return res.json(await getQueryOpportunityExamples({
        config: getSeoRuntimeConfig(),
        pageKey: req.params.pageKey,
        opportunityKey: req.params.opportunityKey,
        assessmentInputHash: req.query.assessmentInputHash,
        limit: req.query.limit,
      }));
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.put(
  '/pages/:pageKey/query-opportunities/:opportunityKey/serp-review',
  opportunityMutationLimiter,
  async (req, res) => {
    try {
      return res.json(await putSerpReview({
        config: getSeoRuntimeConfig(),
        pageKey: req.params.pageKey,
        opportunityKey: req.params.opportunityKey,
        assessmentInputHash: req.body?.assessmentInputHash,
        input: req.body,
        actorUserId: req.seoOwner.userId,
      }));
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.post(
  '/pages/:pageKey/query-opportunities/:opportunityKey/promote',
  opportunityMutationLimiter,
  async (req, res) => {
    try {
      return res.json(await promoteOpportunity({
        config: getSeoRuntimeConfig(),
        pageKey: req.params.pageKey,
        opportunityKey: req.params.opportunityKey,
        assessmentInputHash: req.body?.assessmentInputHash,
        actorUserId: req.seoOwner.userId,
      }));
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.put('/pages/:pageKey/intent', async (req, res) => {
  try {
    const updated = await updatePageIntent(req.params.pageKey, req.body);
    if (!updated) return res.status(404).json({ code: 'SEO_PAGE_NOT_FOUND', error: 'Page not found' });
    return res.json(await getPageDetail({ config: getSeoRuntimeConfig(), pageKey: req.params.pageKey }));
  } catch (error) {
    return sendError(res, error);
  }
});

router.post('/analyze', async (_req, res) => {
  const config = getSeoRuntimeConfig();
  if (!config.configured) {
    return res.status(503).json({
      accepted: false,
      status: 'disabled',
      message: 'SEO analysis is not fully configured.',
    });
  }
  try {
    const result = await runSeoAnalysis({
      config,
      deadlineBudgetMs: MANUAL_ANALYSIS_HARD_DEADLINE_MS,
    });
    return res.json({
      accepted: true,
      runId: result.runId,
      status: result.status,
      analysis: result.analysis,
    });
  } catch (error) {
    if (error instanceof SeoSyncError && error.code === 'SEO_ANALYSIS_BUSY') {
      return res.status(429).json({ accepted: false, status: 'busy', message: error.message });
    }
    return sendError(res, error);
  }
});

router.post('/sync', async (_req, res) => {
  const config = getSeoRuntimeConfig();
  if (!config.configured) {
    return res.status(503).json({ accepted: false, status: 'disabled', message: 'SEO sync is not fully configured.' });
  }
  const cooldownSince = new Date(Date.now() - MANUAL_SYNC_COOLDOWN_MS);
  const recentManual = await SeoSyncRun.exists({ trigger: 'manual', startedAt: { $gte: cooldownSince } });
  if (recentManual) {
    return res.status(429).json({ accepted: false, status: 'busy', message: 'Manual sync has a 2-minute cooldown.' });
  }
  try {
    const run = await runSeoSync({
      config: {
        ...config,
        datesPerRun: Math.min(config.datesPerRun, MANUAL_SYNC_DATE_CAP),
        syncBudgetMs: Math.min(config.syncBudgetMs, MANUAL_SYNC_BUDGET_MS),
        hardDeadlineBudgetMs: MANUAL_SYNC_HARD_DEADLINE_MS,
        // A small maintenance sync should also refresh the decision packets.
        // Large backfill batches remain protected by the hard deadline and
        // will report analysis_not_ready until a later run has headroom.
        enrichmentEnabled: true,
      },
      trigger: 'manual',
    });
    const completedDates = [...(run.datesCompleted || [])].sort();
    const firstDate = completedDates[0];
    const lastDate = completedDates[completedDates.length - 1];
    const dateRange = firstDate && lastDate
      ? (firstDate === lastDate ? firstDate : `${firstDate}–${lastDate}`)
      : null;
    const message = run.analysisPrioritized
      ? `Balanced-v2 analysis finished with status ${run.analysis?.status || 'not_ready'}; metric backfill will resume on the next sync.`
      : completedDates.length
      ? `${completedDates.length} finalized GSC ${completedDates.length === 1 ? 'date' : 'dates'} synchronized${dateRange ? ` (${dateRange})` : ''}. Any remaining backfill will resume from the next missing date.`
      : run.status === 'skipped'
        ? 'No new finalized GSC date was available.'
        : run.errorMessage || `Sync finished with status ${run.status}.`;
    return res.json({
      accepted: true,
      runId: run.runId,
      status: run.status,
      datesCompleted: completedDates,
      datesAttempted: run.datesAttempted || [],
      message,
    });
  } catch (error) {
    if (error instanceof SeoSyncError && error.code === 'SEO_SYNC_BUSY') {
      return res.status(429).json({ accepted: false, status: 'busy', message: error.message });
    }
    return sendError(res, error);
  }
});

router.get('/sync-runs', async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const offset = decodeOffset(req.query.cursor);
    const [total, runs] = await Promise.all([
      SeoSyncRun.countDocuments({}),
      SeoSyncRun.find({}).sort({ startedAt: -1, _id: -1 }).skip(offset).limit(limit).lean(),
    ]);
    return res.json({
      items: runs.map((run) => ({
        id: run.runId,
        status: run.status,
        trigger: run.trigger,
        startedAt: new Date(run.startedAt).toISOString(),
        completedAt: run.completedAt ? new Date(run.completedAt).toISOString() : null,
        datesAttempted: run.datesAttempted || [],
        datesCompleted: run.datesCompleted || [],
        rowsWritten: Number(run.rowsWritten || 0),
        truncated: Boolean(run.truncated),
        detailSlicesSkipped: Boolean(run.detailSlicesSkipped),
        error: serializeSyncRunError(run),
      })),
      total,
      nextCursor: offset + runs.length < total ? encodeOffset(offset + runs.length) : null,
    });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
