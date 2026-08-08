'use strict';

function parseBoolean(value, fallback = false) {
  if (value == null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function boundedInteger(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function parseServiceAccountJson(raw = process.env.GSC_SERVICE_ACCOUNT_JSON) {
  const value = String(raw || '').trim();
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (!parsed?.client_email || !parsed?.private_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

function getSeoRuntimeConfig(env = process.env) {
  const enabled = parseBoolean(env.SEO_DASHBOARD_ENABLED, false);
  const siteUrl = String(env.GSC_SITE_URL || '').trim() || null;
  const credentials = parseServiceAccountJson(env.GSC_SERVICE_ACCOUNT_JSON);
  const rawStorageBudget = String(env.SEO_STORAGE_BUDGET_BYTES || '').trim();
  const storageBudgetBytes = rawStorageBudget
    ? boundedInteger(rawStorageBudget, null, 16 * 1024 * 1024, 2 * 1024 * 1024 * 1024)
    : null;
  const configured = Boolean(enabled && siteUrl && credentials && storageBudgetBytes);
  const maximumBackfillDays = boundedInteger(env.GSC_MAX_BACKFILL_DAYS, 480, 90, 480);
  const initialBackfillDays = Math.min(
    boundedInteger(env.GSC_INITIAL_BACKFILL_DAYS, 90, 7, 180),
    maximumBackfillDays
  );

  return {
    enabled,
    configured,
    siteUrl,
    credentials,
    credentialsPresent: Boolean(credentials),
    cronSecretPresent: String(env.CRON_SECRET || '').trim().length >= 32,
    storageBudgetBytes,
    finalizedLagDays: boundedInteger(env.GSC_FINALIZED_LAG_DAYS, 3, 2, 7),
    initialBackfillDays,
    maximumBackfillDays,
    datesPerRun: boundedInteger(env.GSC_SYNC_DATES_PER_RUN, 30, 1, 90),
    syncBudgetMs: boundedInteger(env.GSC_SYNC_BUDGET_MS, 220_000, 10_000, 240_000),
    sourceTimezone: 'America/Los_Angeles',
  };
}

module.exports = {
  boundedInteger,
  getSeoRuntimeConfig,
  parseBoolean,
  parseServiceAccountJson,
};
