'use strict';

const SeoAction = require('../../models/SeoAction');
const SeoDigestDelivery = require('../../models/SeoDigestDelivery');
const SeoSyncState = require('../../models/SeoSyncState');
const User = require('../../models/User');
const { getSeoOwnerConfig } = require('../../middleware/RequireSeoOwner');
const { sendMail } = require('../email');
const { DAY_MS, dateKeyInTimezone } = require('./dates');

const DIGEST_TIMEZONE = 'Europe/Istanbul';
const ACTIVE_ACTION_STATES = Object.freeze([
  'proposed',
  'approved',
  'implementation_pending',
  'measuring',
]);

const ACTION_LABELS = Object.freeze({
  ctr_snippet: 'CTR / snippet',
  intent_mismatch: 'Intent mismatch',
  content_decay: 'Content decay',
  cannibalization: 'Cannibalization',
  internal_link: 'Internal link',
  technical_indexing: 'Technical / indexing',
  manual: 'Manual',
});

const STATUS_LABELS = Object.freeze({
  proposed: 'Proposed',
  approved: 'Approved',
  implementation_pending: 'Implementation pending',
  measuring: 'Measuring',
});

const STORAGE_LABELS = Object.freeze({
  ok: 'OK',
  warning: 'Warning',
  detail_paused: 'Detailed ingestion paused',
  unknown: 'Unknown',
});

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim().toLowerCase());
}

function safeIsoDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function safeDateKey(value) {
  const normalized = String(value || '');
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
}

function safePagePath(value) {
  try {
    const parsed = new URL(String(value || ''));
    if (
      parsed.origin !== 'https://frontendatlas.com' ||
      parsed.username ||
      parsed.password
    ) return '(page unavailable)';
    // Search parameters and fragments are deliberately omitted. They are not
    // part of a canonical page identity and can contain sensitive text.
    return parsed.pathname || '/';
  } catch {
    return '(page unavailable)';
  }
}

function finiteNonNegative(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function isoWeekKeyFromDateKey(dateKey) {
  const [year, month, day] = String(dateKey).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) throw new Error('Invalid local date key');

  const dayNumber = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNumber);
  const isoYear = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil((((date - yearStart) / DAY_MS) + 1) / 7);
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

function istanbulIsoWeekKey(now = new Date()) {
  return isoWeekKeyFromDateKey(dateKeyInTimezone(now, DIGEST_TIMEZONE));
}

function queryWithLean(query, operations = []) {
  let current = query;
  for (const [method, argument] of operations) {
    if (typeof current?.[method] === 'function') current = current[method](argument);
  }
  return typeof current?.lean === 'function' ? current.lean() : current;
}

async function freshOwnerTupleMatches({ ownerConfig, userModel = User }) {
  const ownerUserId = String(ownerConfig?.ownerUserId || '').trim().toLowerCase();
  const ownerEmail = String(ownerConfig?.ownerEmail || '').trim().toLowerCase();
  if (!/^[a-f0-9]{24}$/.test(ownerUserId) || !isValidEmail(ownerEmail)) return false;
  const user = await queryWithLean(
    userModel.findById(ownerUserId),
    [['select', '_id email emailVerifiedAt role']]
  );
  return Boolean(
    user
    && String(user._id || '').trim().toLowerCase() === ownerUserId
    && String(user.email || '').trim().toLowerCase() === ownerEmail
    && user.emailVerifiedAt
    && user.role === 'admin'
  );
}

async function buildWeeklyDigest({
  siteUrl,
  now = new Date(),
  actionModel = SeoAction,
  syncStateModel = SeoSyncState,
} = {}) {
  const actionsQuery = actionModel.find({ state: { $in: ACTIVE_ACTION_STATES } });
  const stateQuery = syncStateModel.findOne({ stateKey: `gsc:${siteUrl}` });
  const [actions, state] = await Promise.all([
    queryWithLean(actionsQuery, [
      ['select', 'type state canonicalUrl priorityScore expectedAdditionalClicks createdAt'],
      ['sort', { priorityScore: -1, createdAt: -1, _id: -1 }],
      ['limit', 10],
    ]),
    queryWithLean(stateQuery, [
      ['select', 'lastSuccessfulSyncAt lastFinalizedDate storageLevel recentBackfillComplete'],
    ]),
  ]);

  return {
    generatedAt: new Date(now),
    actions: Array.isArray(actions) ? actions.slice(0, 10) : [],
    health: {
      lastSuccessfulSyncAt: safeIsoDate(state?.lastSuccessfulSyncAt),
      lastFinalizedDate: safeDateKey(state?.lastFinalizedDate),
      storageLevel: Object.hasOwn(STORAGE_LABELS, state?.storageLevel)
        ? state.storageLevel
        : 'unknown',
      backfillComplete: Boolean(state?.recentBackfillComplete),
    },
  };
}

function formatAction(action, index) {
  const type = Object.hasOwn(ACTION_LABELS, action?.type) ? action.type : null;
  const status = Object.hasOwn(STATUS_LABELS, action?.state) ? action.state : null;
  const path = safePagePath(action?.canonicalUrl);
  const score = Math.round(finiteNonNegative(action?.priorityScore) * 10) / 10;
  const expectedClicks = Math.round(finiteNonNegative(action?.expectedAdditionalClicks) * 10) / 10;
  return {
    text: `${index + 1}. ${type ? ACTION_LABELS[type] : 'SEO action'} | ${status ? STATUS_LABELS[status] : 'Active'} | ${path} | Priority ${score} | Potential clicks +${expectedClicks}`,
    html: `<li><strong>${escapeHtml(type ? ACTION_LABELS[type] : 'SEO action')}</strong> <span>(${escapeHtml(status ? STATUS_LABELS[status] : 'Active')})</span><br>${escapeHtml(path)} · Priority ${score} · Potential clicks +${expectedClicks}</li>`,
  };
}

function renderWeeklyDigest(digest, weekKey) {
  const actionRows = digest.actions.slice(0, 10).map(formatAction);
  const textActions = actionRows.length
    ? actionRows.map((row) => row.text).join('\n')
    : 'No active actions.';
  const htmlActions = actionRows.length
    ? actionRows.map((row) => row.html).join('')
    : '<li>No active actions.</li>';
  const lastSync = digest.health.lastSuccessfulSyncAt || 'No successful sync recorded';
  const finalizedDate = digest.health.lastFinalizedDate || 'No finalized date recorded';
  const storage = STORAGE_LABELS[digest.health.storageLevel] || STORAGE_LABELS.unknown;
  const backfill = digest.health.backfillComplete ? 'Complete' : 'In progress';

  return {
    subject: `FrontendAtlas weekly SEO intelligence · ${weekKey}`,
    text: [
      'FrontendAtlas weekly SEO intelligence',
      `Week: ${weekKey} (${DIGEST_TIMEZONE})`,
      '',
      'Top active actions',
      textActions,
      '',
      'Data health',
      `Last successful sync: ${lastSync}`,
      `Latest finalized GSC date: ${finalizedDate}`,
      `Storage guardrail: ${storage}`,
      `Initial backfill: ${backfill}`,
    ].join('\n'),
    html: [
      '<h2>FrontendAtlas weekly SEO intelligence</h2>',
      `<p>Week: ${escapeHtml(weekKey)} (${escapeHtml(DIGEST_TIMEZONE)})</p>`,
      '<h3>Top active actions</h3>',
      `<ol>${htmlActions}</ol>`,
      '<h3>Data health</h3>',
      '<ul>',
      `<li>Last successful sync: ${escapeHtml(lastSync)}</li>`,
      `<li>Latest finalized GSC date: ${escapeHtml(finalizedDate)}</li>`,
      `<li>Storage guardrail: ${escapeHtml(storage)}</li>`,
      `<li>Initial backfill: ${escapeHtml(backfill)}</li>`,
      '</ul>',
    ].join(''),
  };
}

function isDuplicateKeyError(error) {
  return Number(error?.code) === 11000;
}

async function claimWeeklyDelivery({ deliveryModel, siteUrl, weekKey, now }) {
  try {
    await deliveryModel.create({
      siteUrl,
      weekKey,
      status: 'attempting',
      attemptedAt: now,
      resultCode: '',
      actionCount: 0,
    });
    return { claimed: true };
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;

    // A duplicate-key result itself is enough to suppress another send. The
    // read is best-effort and exists only to return a more precise status.
    try {
      const existing = await queryWithLean(
        deliveryModel.findOne({ siteUrl, weekKey }),
        [['select', 'status sentAt']]
      );
      return {
        claimed: false,
        status: existing?.status === 'sent' ? 'already_sent' : 'already_attempted',
      };
    } catch {
      return { claimed: false, status: 'already_attempted' };
    }
  }
}

async function recordDeliveryResult({ deliveryModel, siteUrl, weekKey, update }) {
  try {
    await deliveryModel.updateOne(
      { siteUrl, weekKey, status: 'attempting' },
      { $set: update }
    );
  } catch {
    // The unique attempt record still prevents a second delivery. Avoid
    // surfacing database or provider details in a cron response.
  }
}

function skippedResult(reason, extra = {}) {
  return { status: 'skipped', sent: false, reason, ...extra };
}

function failedResult(reason, extra = {}) {
  return { status: 'failed', sent: false, reason, ...extra };
}

async function sendWeeklySeoDigest({
  config,
  now = new Date(),
  ownerConfig = getSeoOwnerConfig(),
  dependencies = {},
} = {}) {
  const normalizedNow = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(normalizedNow.getTime())) return failedResult('invalid_time');
  if (!config?.enabled) return skippedResult('disabled');

  const siteUrl = String(config?.siteUrl || '').trim();
  const recipient = String(ownerConfig?.ownerEmail || '').trim().toLowerCase();
  if (
    !config?.configured ||
    !siteUrl ||
    !ownerConfig?.available ||
    !isValidEmail(recipient)
  ) {
    return skippedResult('misconfigured');
  }

  const actionModel = dependencies.actionModel || SeoAction;
  const syncStateModel = dependencies.syncStateModel || SeoSyncState;
  const deliveryModel = dependencies.deliveryModel || SeoDigestDelivery;
  const userModel = dependencies.userModel || User;
  const mailer = dependencies.sendMail || sendMail;
  const weekKey = istanbulIsoWeekKey(normalizedNow);

  let ownerAuthorized;
  try {
    ownerAuthorized = await freshOwnerTupleMatches({ ownerConfig, userModel });
  } catch {
    return failedResult('owner_verification_unavailable', { weekKey });
  }
  if (!ownerAuthorized) return skippedResult('owner_mismatch', { weekKey });

  let claim;
  try {
    claim = await claimWeeklyDelivery({ deliveryModel, siteUrl, weekKey, now: normalizedNow });
  } catch {
    return failedResult('idempotency_unavailable', { weekKey });
  }
  if (!claim.claimed) {
    return {
      status: claim.status,
      sent: false,
      reason: 'duplicate_week',
      weekKey,
    };
  }

  let digest;
  try {
    digest = await buildWeeklyDigest({ siteUrl, now: normalizedNow, actionModel, syncStateModel });
  } catch {
    await recordDeliveryResult({
      deliveryModel,
      siteUrl,
      weekKey,
      update: { status: 'failed', resultCode: 'data_unavailable' },
    });
    return failedResult('data_unavailable', { weekKey });
  }

  const message = renderWeeklyDigest(digest, weekKey);
  try {
    await mailer({ to: recipient, ...message });
  } catch (error) {
    const smtpUnavailable = error?.code === 'SMTP_NOT_CONFIGURED';
    const reason = smtpUnavailable ? 'smtp_unavailable' : 'delivery_failed';
    await recordDeliveryResult({
      deliveryModel,
      siteUrl,
      weekKey,
      update: { status: 'failed', resultCode: reason, actionCount: digest.actions.length },
    });
    return smtpUnavailable
      ? skippedResult(reason, { weekKey })
      : failedResult(reason, { weekKey });
  }

  await recordDeliveryResult({
    deliveryModel,
    siteUrl,
    weekKey,
    update: {
      status: 'sent',
      sentAt: normalizedNow,
      resultCode: 'sent',
      actionCount: digest.actions.length,
    },
  });
  return {
    status: 'sent',
    sent: true,
    weekKey,
    actionCount: digest.actions.length,
    // Compatibility aliases for the existing internal route response. The
    // digest is now based on active actions rather than creation time.
    newActionCount: digest.actions.length,
    evaluationCount: 0,
  };
}

module.exports = {
  ACTIVE_ACTION_STATES,
  DIGEST_TIMEZONE,
  buildWeeklyDigest,
  escapeHtml,
  freshOwnerTupleMatches,
  isoWeekKeyFromDateKey,
  istanbulIsoWeekKey,
  renderWeeklyDigest,
  safePagePath,
  sendWeeklySeoDigest,
};
