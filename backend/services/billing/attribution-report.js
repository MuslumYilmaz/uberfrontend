// Read-only attribution report over checkout attempts. Pure functions: the CLI
// in backend/scripts/report-billing-attribution.js loads the documents and
// prints what buildAttributionReport returns.

const TERMINAL_EVENT_PATTERN = /(refund|chargeback)/i;
const DEFAULT_TOP = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

const DIMENSIONS = Object.freeze([
  { id: 'byWeek', label: 'By ISO week', key: (keys) => keys.week, sort: 'key', limited: false },
  { id: 'byPlan', label: 'By plan', key: (keys) => keys.planId, sort: 'paid', limited: false },
  { id: 'byOfferVersion', label: 'By offer version', key: (keys) => keys.offerVersion, sort: 'paid', limited: false },
  { id: 'byCampaign', label: 'By campaign', key: (keys) => keys.campaignId, sort: 'paid', limited: true },
  { id: 'byAnalyticsSource', label: 'By analytics source', key: (keys) => keys.analyticsSource, sort: 'paid', limited: true },
  { id: 'byLandingPath', label: 'By landing path', key: (keys) => keys.landingPath, sort: 'paid', limited: true },
  { id: 'byCountry', label: 'By country', key: (keys) => keys.countryCode, sort: 'paid', limited: true },
  { id: 'byPriceReason', label: 'By price reason', key: (keys) => keys.priceReason, sort: 'paid', limited: false },
]);

function toMs(value) {
  if (value === null || value === undefined || value === '') return null;
  const ms = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function nonnegativeCents(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function clampTop(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_TOP;
  return Math.min(500, Math.max(1, Math.floor(parsed)));
}

function isoWeekKey(value) {
  const ms = toMs(value);
  if (ms === null) return null;
  const date = new Date(ms);
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekday = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - weekday);
  const yearStart = Date.UTC(utc.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((utc.getTime() - yearStart) / DAY_MS + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function labelOf(value, fallback) {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function emptyRow(key) {
  return { key, attempts: 0, paid: 0, conversionRate: 0, grossCents: 0, refunds: 0, refundedCents: 0 };
}

function indexTerminalEvents(terminalEvents) {
  const byUser = new Map();
  for (const event of terminalEvents || []) {
    if (!event?.userId || !TERMINAL_EVENT_PATTERN.test(String(event.eventType || ''))) continue;
    const receivedMs = toMs(event.receivedAt);
    if (receivedMs === null) continue;
    const userId = String(event.userId);
    const list = byUser.get(userId) || [];
    list.push(receivedMs);
    byUser.set(userId, list);
  }
  return byUser;
}

function finalizeRows(rows, dimension, top) {
  const list = Array.from(rows.values()).map((row) => ({
    ...row,
    conversionRate: row.attempts ? Math.round((row.paid / row.attempts) * 1000) / 10 : 0,
  }));
  if (dimension.sort === 'key') {
    list.sort((a, b) => a.key.localeCompare(b.key));
  } else {
    list.sort((a, b) => (b.paid - a.paid) || (b.attempts - a.attempts) || a.key.localeCompare(b.key));
  }
  return dimension.limited ? list.slice(0, top) : list;
}

function buildAttributionReport({ attempts = [], terminalEvents = [], now = new Date(), top = DEFAULT_TOP } = {}) {
  const safeTop = clampTop(top);
  const terminalByUser = indexTerminalEvents(terminalEvents);
  const rowsByDimension = new Map(DIMENSIONS.map((dimension) => [dimension.id, new Map()]));
  const totals = { ...emptyRow('all'), currencies: [] };
  const currencies = new Set();

  for (const attempt of attempts || []) {
    const verifiedMs = toMs(attempt?.paymentVerifiedAt);
    const paid = verifiedMs !== null;
    const grossCents = paid ? nonnegativeCents(attempt.paymentTotalCents) : 0;
    const refunded = paid
      && (terminalByUser.get(String(attempt.userId || '')) || []).some((receivedMs) => receivedMs >= verifiedMs);
    if (paid && attempt.paymentCurrency) currencies.add(String(attempt.paymentCurrency).toUpperCase());

    const keys = {
      week: isoWeekKey(attempt.startedAt || attempt.createdAt) || 'unknown',
      planId: labelOf(attempt.planId, 'unknown'),
      offerVersion: labelOf(attempt.offerVersion, 'unknown'),
      campaignId: labelOf(attempt.campaignId, 'none'),
      analyticsSource: labelOf(attempt.analyticsSource, 'unknown'),
      landingPath: labelOf(attempt.landingPath, 'unknown'),
      countryCode: labelOf(attempt.countryCode, 'unknown'),
      priceReason: labelOf(attempt.priceReason, 'list'),
    };

    const targets = [totals];
    for (const dimension of DIMENSIONS) {
      const rows = rowsByDimension.get(dimension.id);
      const key = dimension.key(keys);
      if (!rows.has(key)) rows.set(key, emptyRow(key));
      targets.push(rows.get(key));
    }
    for (const row of targets) {
      row.attempts += 1;
      if (paid) {
        row.paid += 1;
        row.grossCents += grossCents;
      }
      if (refunded) {
        row.refunds += 1;
        row.refundedCents += grossCents;
      }
    }
  }

  totals.conversionRate = totals.attempts ? Math.round((totals.paid / totals.attempts) * 1000) / 10 : 0;
  totals.currencies = Array.from(currencies).sort();

  const report = {
    generatedAt: new Date(toMs(now) ?? Date.now()).toISOString(),
    top: safeTop,
    totals,
  };
  for (const dimension of DIMENSIONS) {
    report[dimension.id] = finalizeRows(rowsByDimension.get(dimension.id), dimension, safeTop);
  }
  return report;
}

function formatMoney(cents) {
  const units = (nonnegativeCents(cents) / 100).toFixed(2);
  return units.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function pad(value, width, alignRight = false) {
  const text = String(value);
  if (text.length >= width) return text;
  return alignRight ? ' '.repeat(width - text.length) + text : text + ' '.repeat(width - text.length);
}

function formatSection(title, rows) {
  const keyWidth = Math.max(8, ...rows.map((row) => row.key.length));
  const header = `${pad('key', keyWidth)}  ${pad('attempts', 8, true)}  ${pad('paid', 6, true)}  ${pad('conv %', 7, true)}  ${pad('gross', 12, true)}  ${pad('refunds', 7, true)}  ${pad('refunded', 12, true)}`;
  const lines = [`## ${title}`, header, '-'.repeat(header.length)];
  if (!rows.length) lines.push('(no attempts)');
  for (const row of rows) {
    lines.push(
      `${pad(row.key, keyWidth)}  ${pad(row.attempts, 8, true)}  ${pad(row.paid, 6, true)}  ${pad(row.conversionRate.toFixed(1), 7, true)}  ${pad(formatMoney(row.grossCents), 12, true)}  ${pad(row.refunds, 7, true)}  ${pad(formatMoney(row.refundedCents), 12, true)}`
    );
  }
  return lines.join('\n');
}

function formatAttributionReport(report) {
  const { totals } = report;
  const lines = [
    `# Billing attribution report (generated ${report.generatedAt})`,
  ];
  if (report.window) {
    const { since, until, mode, target } = report.window;
    lines.push(`window: ${new Date(since).toISOString()} to ${new Date(until).toISOString()}, mode ${mode}, target ${target}`);
  }
  lines.push(
    `totals: ${totals.attempts} attempts, ${totals.paid} paid (${totals.conversionRate.toFixed(1)}%), gross ${formatMoney(totals.grossCents)}, ${totals.refunds} refunds (${formatMoney(totals.refundedCents)})`
  );
  if (totals.currencies.length > 1) {
    lines.push(`warning: payments recorded in several currencies (${totals.currencies.join(', ')}); gross sums mix them`);
  } else if (totals.currencies.length === 1) {
    lines.push(`currency: ${totals.currencies[0]}`);
  }
  lines.push(`top rows per limited dimension: ${report.top}`);
  for (const dimension of DIMENSIONS) {
    lines.push('', formatSection(dimension.label, report[dimension.id] || []));
  }
  return lines.join('\n');
}

module.exports = {
  TERMINAL_EVENT_PATTERN,
  buildAttributionReport,
  formatAttributionReport,
  isoWeekKey,
};
