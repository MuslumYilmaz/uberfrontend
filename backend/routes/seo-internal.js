'use strict';

const crypto = require('crypto');
const express = require('express');
const { applySeoPrivateResponsePolicy } = require('../middleware/SeoResponsePolicy');
const { getSeoRuntimeConfig } = require('../services/seo/config');
const { sendWeeklySeoDigest } = require('../services/seo/digest');
const { SeoSyncError, runSeoSync } = require('../services/seo/sync');

const router = express.Router();

function secretMatches(provided, expected) {
  const left = Buffer.from(String(provided || ''));
  const right = Buffer.from(String(expected || ''));
  return left.length > 0 && left.length === right.length && crypto.timingSafeEqual(left, right);
}

function requireCronSecret(req, res, next) {
  applySeoPrivateResponsePolicy(res);
  const expected = String(process.env.CRON_SECRET || '').trim();
  const header = String(req.headers.authorization || '');
  const provided = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (expected.length < 32 || !secretMatches(provided, expected)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
}

router.use(requireCronSecret);

router.get('/daily-sync', async (_req, res) => {
  const config = getSeoRuntimeConfig();
  try {
    const run = await runSeoSync({ config, trigger: 'cron' });
    return res.json({ runId: run.runId, status: run.status, datesCompleted: run.datesCompleted.length });
  } catch (error) {
    if (error instanceof SeoSyncError && error.code === 'SEO_SYNC_BUSY') {
      return res.status(202).json({ status: 'busy' });
    }
    const code = error instanceof SeoSyncError ? error.code : 'SEO_SYNC_FAILED';
    return res.status(error instanceof SeoSyncError ? error.status : 500).json({
      code: code || 'SEO_SYNC_FAILED',
      error: 'SEO sync failed.',
    });
  }
});

router.get('/weekly-digest', async (_req, res) => {
  try {
    const result = await sendWeeklySeoDigest({
      config: getSeoRuntimeConfig(),
    });
    const body = {
      status: result.status,
      sent: result.sent,
      reason: result.reason || null,
      weekKey: result.weekKey || null,
      actionCount: Number(result.actionCount || 0),
    };
    return res.status(result.status === 'failed' ? 503 : 200).json(body);
  } catch (error) {
    return res.status(503).json({ code: error.code || 'SEO_DIGEST_FAILED', error: 'SEO digest could not be sent.' });
  }
});

module.exports = { requireCronSecret, router, secretMatches };
