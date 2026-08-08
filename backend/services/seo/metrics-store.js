'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');
const SeoMetricPartition = require('../../models/SeoMetricPartition');
const SeoPage = require('../../models/SeoPage');
const SeoPageDailyMetric = require('../../models/SeoPageDailyMetric');
const SeoPageDeviceDailyMetric = require('../../models/SeoPageDeviceDailyMetric');
const SeoQueryPageDailyMetric = require('../../models/SeoQueryPageDailyMetric');
const SeoPropertyDailyMetric = require('../../models/SeoPropertyDailyMetric');
const { detailExpiryForDate } = require('./dates');
const {
  isBrandQuery,
  normalizePageIdentityUrl,
  normalizeQuery,
  pageKeyForUrl,
  queryKeyForText,
} = require('./keys');

const SLICE_MODELS = {
  property: SeoPropertyDailyMetric,
  page: SeoPageDailyMetric,
  queryPage: SeoQueryPageDailyMetric,
  devicePage: SeoPageDeviceDailyMetric,
};

const SEO_STORAGE_COLLECTIONS = Object.freeze([
  'seo_pages',
  'seo_page_versions',
  'seo_page_assessments',
  'seo_page_daily_metrics',
  'seo_property_daily_metrics',
  'seo_query_page_daily_metrics',
  'seo_page_device_daily_metrics',
  'seo_metric_partitions',
  'seo_diagnostic_snapshots',
  'seo_actions',
  'seo_digest_deliveries',
  'seo_sync_runs',
  'seo_sync_states',
]);

function safeMetric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function normalizeDevice(value) {
  const normalized = String(value || '').trim().toUpperCase();
  return ['DESKTOP', 'MOBILE', 'TABLET'].includes(normalized) ? normalized : 'UNKNOWN';
}

function commonMetric(row) {
  const impressions = safeMetric(row?.impressions);
  const position = safeMetric(row?.position);
  return {
    clicks: safeMetric(row?.clicks),
    impressions,
    position,
    positionNumerator: impressions * position,
  };
}

function normalizeSliceRows({ slice, siteUrl, date, generation, rows }) {
  const expiresAt = detailExpiryForDate(date);
  return rows.map((row) => {
    if (slice === 'property') return { siteUrl, date, generation, ...commonMetric(row) };
    const keys = Array.isArray(row?.keys) ? row.keys : [];
    const canonicalUrl = normalizePageIdentityUrl(keys[0]);
    if (!canonicalUrl) return null;
    const pageKey = pageKeyForUrl(canonicalUrl);
    const base = { siteUrl, date, pageKey, generation, ...commonMetric(row) };

    if (slice === 'page') return { ...base, canonicalUrl };
    if (slice === 'queryPage') {
      const query = normalizeQuery(keys[1]);
      if (!query) return null;
      return {
        ...base,
        queryKey: queryKeyForText(query),
        query,
        segment: isBrandQuery(query) ? 'brand' : 'nonbrand',
        expiresAt,
      };
    }
    if (slice === 'devicePage') {
      return { ...base, device: normalizeDevice(keys[1]), expiresAt };
    }
    throw new Error(`Unsupported SEO metric slice: ${slice}`);
  }).filter(Boolean);
}

function uniqueFilter(slice, row) {
  const base = {
    siteUrl: row.siteUrl,
    date: row.date,
    pageKey: row.pageKey,
    generation: row.generation,
  };
  if (slice === 'property') return { siteUrl: row.siteUrl, date: row.date, generation: row.generation };
  if (slice === 'queryPage') base.queryKey = row.queryKey;
  if (slice === 'devicePage') base.device = row.device;
  return base;
}

async function upsertObservedPages(rows, now = new Date()) {
  const observed = new Map();
  for (const row of rows) {
    if (!row.canonicalUrl) continue;
    observed.set(row.pageKey, row.canonicalUrl);
  }
  if (!observed.size) return;
  await SeoPage.bulkWrite(Array.from(observed, ([pageKey, canonicalUrl]) => ({
    updateOne: {
      filter: { pageKey },
      update: {
        $set: {
          canonicalUrl,
          path: (() => {
            try { return new URL(canonicalUrl).pathname || '/'; } catch { return ''; }
          })(),
          lastSeenAt: now,
        },
        $setOnInsert: { firstSeenAt: now },
      },
      upsert: true,
    },
  })), { ordered: false });
}

async function writeSliceGeneration({ siteUrl, date, slice, rows, truncated = false, now = new Date() }) {
  const Model = SLICE_MODELS[slice];
  if (!Model) throw new Error(`Unsupported SEO metric slice: ${slice}`);
  const generation = crypto.randomUUID();
  const normalizedRows = normalizeSliceRows({ slice, siteUrl, date, generation, rows: rows || [] });
  const impressions = normalizedRows.reduce((sum, row) => sum + row.impressions, 0);

  if (normalizedRows.length) {
    await Model.bulkWrite(normalizedRows.map((row) => ({
      updateOne: {
        filter: uniqueFilter(slice, row),
        update: { $set: row },
        upsert: true,
      },
    })), { ordered: false });
  }
  if (slice === 'page') await upsertObservedPages(normalizedRows, now);

  const previous = await SeoMetricPartition.findOneAndUpdate(
    { siteUrl, date, slice },
    {
      $set: {
        activeGeneration: generation,
        status: truncated ? 'truncated' : 'complete',
        rowCount: normalizedRows.length,
        impressions,
        truncated,
        ...(slice === 'queryPage' ? { queryCoverage: null } : {}),
        ...(slice === 'devicePage' ? { deviceCoverage: null } : {}),
        completedAt: now,
      },
      $setOnInsert: { siteUrl, date, slice },
    },
    { upsert: true, new: false }
  ).lean();

  if (previous?.activeGeneration && previous.activeGeneration !== generation) {
    await Model.deleteMany({ siteUrl, date, generation: previous.activeGeneration });
  }
  await Model.deleteMany({
    siteUrl,
    date,
    generation: { $ne: generation },
    updatedAt: { $lt: new Date(now.getTime() - 10 * 60 * 1000) },
  });

  return { generation, rowCount: normalizedRows.length, impressions, truncated };
}

function detailCoverageRatio(referenceImpressions, detailImpressions, { reconcile = false } = {}) {
  const reference = Math.max(0, Number(referenceImpressions || 0));
  const detail = Math.max(0, Number(detailImpressions || 0));
  if (reference === 0) return detail === 0 ? 1 : 0;
  if (reconcile) return Math.min(reference, detail) / Math.max(reference, detail);
  return Math.min(1, detail / reference);
}

async function updateDetailCoverage({ siteUrl, date, detailSlice, coverageField, reconcile = false }) {
  const [pagePartition, detailPartition] = await Promise.all([
    SeoMetricPartition.findOne({ siteUrl, date, slice: 'page' }).lean(),
    SeoMetricPartition.findOne({ siteUrl, date, slice: detailSlice }).lean(),
  ]);
  if (!pagePartition || !detailPartition) return null;
  const coverage = detailCoverageRatio(
    pagePartition.impressions,
    detailPartition.impressions,
    { reconcile }
  );
  await SeoMetricPartition.updateOne(
    { _id: detailPartition._id, activeGeneration: detailPartition.activeGeneration },
    { $set: { [coverageField]: coverage } }
  );
  return coverage;
}

async function updateQueryCoverage({ siteUrl, date }) {
  return updateDetailCoverage({ siteUrl, date, detailSlice: 'queryPage', coverageField: 'queryCoverage' });
}

async function updateDeviceCoverage({ siteUrl, date }) {
  return updateDetailCoverage({
    siteUrl,
    date,
    detailSlice: 'devicePage',
    coverageField: 'deviceCoverage',
    reconcile: true,
  });
}

function activeGenerationLookup(slice) {
  return {
    $lookup: {
      from: 'seo_metric_partitions',
      let: { metricSite: '$siteUrl', metricDate: '$date', metricGeneration: '$generation' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$siteUrl', '$$metricSite'] },
                { $eq: ['$date', '$$metricDate'] },
                { $eq: ['$slice', slice] },
                { $eq: ['$activeGeneration', '$$metricGeneration'] },
                { $in: ['$status', ['complete', 'truncated']] },
              ],
            },
          },
        },
        { $limit: 1 },
      ],
      as: '_activePartition',
    },
  };
}

async function invalidateDetailPartitions({ siteUrl, date }) {
  const [queryResult, deviceResult] = await Promise.all([
    SeoMetricPartition.updateMany(
      { siteUrl, date, slice: 'queryPage' },
      { $set: { status: 'stale', queryCoverage: null } }
    ),
    SeoMetricPartition.updateMany(
      { siteUrl, date, slice: 'devicePage' },
      { $set: { status: 'stale', deviceCoverage: null } }
    ),
  ]);
  return Number(queryResult.modifiedCount || 0) + Number(deviceResult.modifiedCount || 0);
}

async function pruneMetricHistoryBefore({ siteUrl, cutoffDate }) {
  if (!siteUrl || !/^\d{4}-\d{2}-\d{2}$/.test(String(cutoffDate || ''))) {
    throw new TypeError('siteUrl and a valid cutoffDate are required');
  }
  const filter = { siteUrl, date: { $lt: cutoffDate } };
  const results = await Promise.all([
    SeoPropertyDailyMetric.deleteMany(filter),
    SeoPageDailyMetric.deleteMany(filter),
    SeoQueryPageDailyMetric.deleteMany(filter),
    SeoPageDeviceDailyMetric.deleteMany(filter),
    SeoMetricPartition.deleteMany(filter),
  ]);
  return results.reduce((sum, result) => sum + Number(result.deletedCount || 0), 0);
}

function activeMetricPipeline({ slice, match = {}, afterLookup = [] }) {
  return [
    { $match: match },
    activeGenerationLookup(slice),
    { $match: { '_activePartition.0': { $exists: true } } },
    ...afterLookup,
    { $unset: '_activePartition' },
  ];
}

async function estimateSeoStorageBytes() {
  const db = mongoose.connection?.db;
  if (!db) return null;
  let total = 0;
  try {
    for (const name of SEO_STORAGE_COLLECTIONS) {
      try {
        const stats = await db.command({ collStats: name, scale: 1 });
        total += Number(stats?.storageSize || 0) + Number(stats?.totalIndexSize || 0);
      } catch (error) {
        if (error?.codeName === 'NamespaceNotFound' || error?.code === 26) continue;
        throw error;
      }
    }
    return total;
  } catch {
    return null;
  }
}

function storageLevel(bytes, budgetBytes) {
  if (!Number.isFinite(bytes)) return 'unknown';
  if (bytes >= budgetBytes * 0.85) return 'detail_paused';
  if (bytes >= budgetBytes * 0.7) return 'warning';
  return 'ok';
}

module.exports = {
  SEO_STORAGE_COLLECTIONS,
  SLICE_MODELS,
  activeGenerationLookup,
  activeMetricPipeline,
  detailCoverageRatio,
  estimateSeoStorageBytes,
  invalidateDetailPartitions,
  normalizeSliceRows,
  pruneMetricHistoryBefore,
  storageLevel,
  updateDeviceCoverage,
  updateQueryCoverage,
  writeSliceGeneration,
};
