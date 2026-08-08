'use strict';

const SeoQueryPageDailyMetric = require('../../models/SeoQueryPageDailyMetric');
const { sha256 } = require('./keys');
const { activeMetricPipeline } = require('./metrics-store');

const DEFAULT_MAX_ROWS = 100000;
const HARD_MAX_ROWS = 250000;
const DEFAULT_MAX_TIME_MS = 15000;

function boundedInteger(value, fallback, minimum, maximum) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.floor(parsed)));
}

function safeClusterKey(value) {
  const key = String(value || '').trim().toLowerCase();
  if (!key) return '';
  return /^[a-f0-9]{64}$/.test(key) ? key : sha256(`query-key:${key}`);
}

function weekKey(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  return String(value || '').trim();
}

function rowValue(row, key) {
  return row?.[key] ?? row?._id?.[key];
}

function comparePageTotals(left, right) {
  if (right.impressions !== left.impressions) return right.impressions - left.impressions;
  return left.pageKey.localeCompare(right.pageKey);
}

function signalImpact(signal) {
  return signal.clusterImpressions * signal.secondUrlImpressionShare;
}

function shouldReplaceSignal(current, candidate) {
  if (!current) return true;
  const impactDifference = signalImpact(candidate) - signalImpact(current);
  if (Math.abs(impactDifference) > Number.EPSILON) return impactDifference > 0;
  if (candidate.clusterImpressions !== current.clusterImpressions) {
    return candidate.clusterImpressions > current.clusterImpressions;
  }
  return candidate.clusterKey.localeCompare(current.clusterKey) < 0;
}

/**
 * Reduces allowlisted weekly query/page metrics into one deterministic signal per
 * dominant page. `query` is intentionally neither read nor copied: cluster
 * identity is always represented by a SHA-256 key.
 */
function buildCannibalizationSignals(rows = []) {
  const clusters = new Map();

  for (const row of Array.isArray(rows) ? rows : []) {
    const clusterKey = safeClusterKey(rowValue(row, 'queryKey'));
    const pageKey = String(rowValue(row, 'pageKey') || '').trim();
    const week = weekKey(rowValue(row, 'week'));
    const impressions = Number(row?.impressions);
    if (!clusterKey || !pageKey || !week || !Number.isFinite(impressions) || impressions <= 0) continue;

    let pages = clusters.get(clusterKey);
    if (!pages) {
      pages = new Map();
      clusters.set(clusterKey, pages);
    }
    let page = pages.get(pageKey);
    if (!page) {
      page = { pageKey, impressions: 0, weeks: new Map() };
      pages.set(pageKey, page);
    }
    page.impressions += impressions;
    page.weeks.set(week, (page.weeks.get(week) || 0) + impressions);
  }

  const signals = new Map();
  for (const [clusterKey, pages] of clusters) {
    const rankedPages = Array.from(pages.values()).sort(comparePageTotals);
    if (rankedPages.length < 2) continue;

    const dominant = rankedPages[0];
    const second = rankedPages[1];
    const clusterImpressions = dominant.impressions + second.impressions;
    if (clusterImpressions < 100) continue;

    const secondUrlImpressionShare = second.impressions / clusterImpressions;
    if (secondUrlImpressionShare < 0.2) continue;

    const sharedWeeks = [];
    const weeklyLeaders = new Set();
    for (const [week, dominantImpressions] of dominant.weeks) {
      const secondImpressions = second.weeks.get(week) || 0;
      if (dominantImpressions <= 0 || secondImpressions <= 0) continue;
      sharedWeeks.push(week);
      if (dominantImpressions > secondImpressions) weeklyLeaders.add(dominant.pageKey);
      if (secondImpressions > dominantImpressions) weeklyLeaders.add(second.pageKey);
    }
    if (sharedWeeks.length < 3 || weeklyLeaders.size < 2) continue;

    const candidate = {
      clusterKey,
      secondPageKey: second.pageKey,
      clusterImpressions,
      secondUrlImpressionShare,
      alternatingWeeks: sharedWeeks.length,
    };
    const current = signals.get(dominant.pageKey);
    if (shouldReplaceSignal(current, candidate)) signals.set(dominant.pageKey, candidate);
  }

  return signals;
}

function weeklyAggregationPipeline({ siteUrl, startDate, endDate, maxRows }) {
  return activeMetricPipeline({
    slice: 'queryPage',
    match: {
      siteUrl,
      segment: 'nonbrand',
      date: { $gte: startDate, $lte: endDate },
    },
    afterLookup: [
      {
        $project: {
          _id: 0,
          queryKey: 1,
          pageKey: 1,
          impressions: 1,
          week: {
            $dateTrunc: {
              date: {
                $dateFromString: {
                  dateString: '$date',
                  format: '%Y-%m-%d',
                  timezone: 'America/Los_Angeles',
                },
              },
              unit: 'week',
              startOfWeek: 'monday',
              timezone: 'America/Los_Angeles',
            },
          },
        },
      },
      {
        $group: {
          _id: { queryKey: '$queryKey', pageKey: '$pageKey', week: '$week' },
          impressions: { $sum: '$impressions' },
        },
      },
      { $match: { impressions: { $gt: 0 } } },
      { $sort: { '_id.queryKey': 1, '_id.pageKey': 1, '_id.week': 1 } },
      { $limit: maxRows },
    ],
  });
}

async function cannibalizationSignalsByPage({
  siteUrl,
  startDate,
  endDate,
  metricModel = SeoQueryPageDailyMetric,
  maxRows = DEFAULT_MAX_ROWS,
  maxTimeMs = DEFAULT_MAX_TIME_MS,
} = {}) {
  if (!siteUrl || !/^\d{4}-\d{2}-\d{2}$/.test(startDate || '') || !/^\d{4}-\d{2}-\d{2}$/.test(endDate || '')) {
    throw new TypeError('siteUrl, startDate, and endDate are required for cannibalization analysis.');
  }
  if (startDate > endDate) throw new RangeError('startDate must not be after endDate.');

  const rowLimit = boundedInteger(maxRows, DEFAULT_MAX_ROWS, 1, HARD_MAX_ROWS);
  const timeLimit = boundedInteger(maxTimeMs, DEFAULT_MAX_TIME_MS, 1000, 60000);
  const pipeline = weeklyAggregationPipeline({ siteUrl, startDate, endDate, maxRows: rowLimit });
  const aggregate = metricModel.aggregate(pipeline);
  if (typeof aggregate.allowDiskUse === 'function') aggregate.allowDiskUse(true);
  if (typeof aggregate.option === 'function') aggregate.option({ maxTimeMS: timeLimit });
  const rows = typeof aggregate.exec === 'function' ? await aggregate.exec() : await aggregate;
  return buildCannibalizationSignals(rows);
}

module.exports = {
  buildCannibalizationSignals,
  cannibalizationSignalsByPage,
};
