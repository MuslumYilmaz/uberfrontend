'use strict';

const { resolveMongoTarget } = require('../../config/mongo');
const SeoAction = require('../../models/SeoAction');
const SeoMetricPartition = require('../../models/SeoMetricPartition');
const SeoOpportunityReview = require('../../models/SeoOpportunityReview');
const SeoPage = require('../../models/SeoPage');
const SeoPageAssessment = require('../../models/SeoPageAssessment');
const SeoQueryPageDailyMetric = require('../../models/SeoQueryPageDailyMetric');
const SeoSyncRun = require('../../models/SeoSyncRun');
const {
  serializeAction,
  sanitizeExpectedImpact,
  sanitizeNextReview,
} = require('./actions');
const { shiftDateKey } = require('./dates');
const { sha256, validateFrontendAtlasUrl } = require('./keys');
const { activeMetricPipeline } = require('./metrics-store');
const { isKnownReasonCode, reasonSummaryForCode } = require('./rule-engine');
const { buildSemanticClusters, DEFAULT_MAX_QUERIES } = require('./semantic-clustering');

const RULE_VERSION = 'balanced-v2.2';
const MAX_EXAMPLES = 10;
const EXAMPLE_CLUSTER_QUERY_CAP = DEFAULT_MAX_QUERIES;
const REVIEW_TTL_MS = SeoOpportunityReview.REVIEW_TTL_MS || (18 * 30 * 24 * 60 * 60 * 1000);
const REVIEW_REASON_CODES = new Set(SeoOpportunityReview.REVIEW_REASON_CODES || [
  'none',
  'snippet_not_specific',
  'snippet_not_competitive',
  'content_depth_gap',
  'intent_misalignment',
  'source_preference',
  'serp_feature_competition',
  'insufficient_evidence',
]);
const OPPORTUNITY_CLASSIFICATIONS = new Set([
  'snippet_gap',
  'ranking_gap',
  'intent_gap',
  'source_preference',
  'visibility_interruption',
  'not_evaluable',
]);
const OPPORTUNITY_STATES = new Set(['not_evaluable', 'clear', 'watch', 'actionable']);
const OPPORTUNITY_DISPOSITIONS = new Set([
  'insufficient_evidence', 'monitor', 'investigate', 'structural_review', 'change_ready', 'no_change',
]);
const OPPORTUNITY_SURFACES = new Set([
  'none', 'title_description', 'h1_body', 'h2_body', 'url_inspection', 'serp_review',
]);
const REVIEW_DEVICES = new Set(['desktop', 'mobile', 'tablet', 'unknown']);
const REVIEW_RESULT_TYPES = new Set(['official', 'community', 'publisher', 'mixed', 'unknown']);
const REVIEW_FEATURES = new Set([
  'featured_snippet', 'ai_overview', 'people_also_ask', 'video',
  'forum', 'shopping', 'local', 'sitelinks', 'none', 'other',
]);
const REVIEW_OWN_RESULT = new Set(['not_visible', 'present_weak', 'present_competitive', 'unknown']);
const REVIEW_OUTCOMES = new Set(['no_change', 'snippet_test', 'content_test', 'needs_more_evidence']);
const PROMOTION_OUTCOMES = Object.freeze({
  snippet_gap: 'snippet_test',
  ranking_gap: 'content_test',
  intent_gap: 'content_test',
});
const PROMOTION_ACTION_TYPES = Object.freeze({
  snippet_gap: 'ctr_snippet',
  ranking_gap: 'content_decay',
  intent_gap: 'intent_mismatch',
});
const ALLOWED_REVIEW_BLOCKER = 'serp_review_required';
const WILSON_90_Z = 1.6448536269514722;
const MAX_REVIEW_FUTURE_SKEW_MS = 5 * 60 * 1000;
const GLOBAL_PROMOTION_GATES = new Set([
  'production_timing_unverified',
  'performance_window_precedes_production',
  'post_deploy_crawl_required',
  'awaiting_recrawl',
  'awaiting_deployment',
  'awaiting_manifest_change',
  'fingerprint_evidence_unavailable',
  'visibility_interruption_requires_diagnosis',
  'url_inspection_required',
  'post_inspection_14_finalized_days',
  'post_inspection_28_finalized_days',
  'technical_indexing_anomaly',
  'query_coverage_inconsistent',
  'query_coverage_below_threshold',
  'semantic_coverage_below_threshold',
  'device_coverage_below_threshold',
  'device_evidence_unavailable',
  'performance_action_suppressed_by_cooldown',
  'observing_change',
]);

class SeoOpportunityError extends Error {
  constructor(message, status = 400, code = 'SEO_OPPORTUNITY_INVALID') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function plain(value) {
  return typeof value?.toObject === 'function' ? value.toObject() : { ...(value || {}) };
}

function queryWithSession(query, session) {
  return session && typeof query?.session === 'function' ? query.session(session) : query;
}

function boundedNumber(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= minimum && numeric <= maximum ? numeric : null;
}

function safeHash(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return /^[a-f0-9]{64}$/.test(normalized) ? normalized : null;
}

function requireHash(value, field) {
  const safe = safeHash(value);
  if (!safe) throw new SeoOpportunityError(`${field} is invalid`, 400, 'SEO_OPPORTUNITY_INVALID_ID');
  return safe;
}

function safeIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function validDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function requireAssessmentEvaluatedAt(assessment) {
  const evaluatedAt = validDate(assessment?.evaluatedAt);
  if (!evaluatedAt) {
    throw new SeoOpportunityError(
      'The assessment freshness marker is unavailable; run analysis again.',
      409,
      'SEO_OPPORTUNITY_STALE_ASSESSMENT'
    );
  }
  return evaluatedAt;
}

function safeMetric(value = {}) {
  const impressions = boundedNumber(value.impressions) ?? 0;
  const clicks = boundedNumber(value.clicks) ?? 0;
  return {
    clicks,
    impressions,
    ctr: boundedNumber(value.ctr, 0, 1) ?? (impressions > 0 ? clicks / impressions : 0),
    position: boundedNumber(value.position, 0) ?? 0,
  };
}

function safeCoverage(value = {}) {
  const ratio = (input) => boundedNumber(input, 0, 1);
  return {
    query: ratio(value.query),
    semantic: ratio(value.semantic),
    device: ratio(value.device),
  };
}

function safePersistence(value = {}) {
  return {
    stableWeeks: boundedNumber(value.stableWeeks, 0, 52) ?? 0,
    requiredWeeks: boundedNumber(value.requiredWeeks, 0, 52) ?? 0,
    totalWeeks: boundedNumber(value.totalWeeks, 0, 52) ?? 0,
    zeroImpressionStreak: boundedNumber(value.zeroImpressionStreak, 0, 3650) ?? 0,
  };
}

function safeStructuralFinding(internalLink = {}, assessment = {}) {
  const evidence = internalLink?.evidence && typeof internalLink.evidence === 'object'
    && !Array.isArray(internalLink.evidence)
    ? internalLink.evidence
    : {};
  const reasonCodes = Array.from(new Set((Array.isArray(internalLink.reasonCodes)
    ? internalLink.reasonCodes
    : [])
    .map(String)
    .filter(isKnownReasonCode))).slice(0, 12);
  const donors = (Array.isArray(evidence.qualifiedDonors) ? evidence.qualifiedDonors : [])
    .slice(0, 10)
    .flatMap((donor) => {
      if (!donor || typeof donor !== 'object' || Array.isArray(donor)) return [];
      const canonicalUrl = validateFrontendAtlasUrl(donor.canonicalUrl);
      const relevanceScore = boundedNumber(donor.relevanceScore, 0.35, 1);
      if (!canonicalUrl || relevanceScore === null) return [];
      return [{
        title: String(donor.title || '').trim().slice(0, 300),
        canonicalUrl,
        relevanceScore,
        reasonCodes: Array.from(new Set((Array.isArray(donor.reasonCodes)
          ? donor.reasonCodes
          : []).map(String).filter((code) => /^[a-z0-9][a-z0-9_-]{0,99}$/.test(code)))).slice(0, 10),
        anchorDirection: String(donor.anchorDirection || '').trim().slice(0, 300),
      }];
    });
  const metric = (key, maximum = Number.MAX_SAFE_INTEGER) => (
    boundedNumber(evidence[key], 0, maximum)
  );
  return {
    state: 'watch',
    disposition: 'structural_review',
    summary: reasonSummaryForCode(reasonCodes[0])
      || 'A structural internal-link review is supported by comparable pages.',
    patternConfidence: boundedNumber(
      internalLink.patternConfidence ?? internalLink.confidence ?? assessment.patternConfidence,
      0,
      1
    ) ?? 0,
    causeConfidence: boundedNumber(
      internalLink.causeConfidence ?? assessment.causeConfidence,
      0,
      1
    ) ?? 0,
    reasonCodes,
    decisionGates: Array.from(new Set((Array.isArray(internalLink.decisionGates)
      ? internalLink.decisionGates
      : []).map(String).filter((code) => /^[a-z0-9][a-z0-9_-]{0,99}$/.test(code)))).slice(0, 12),
    evidence: {
      position: metric('position', 1000),
      impressions: metric('impressions'),
      inboundCount: metric('inboundCount'),
      cohortP25: metric('cohortP25'),
      peerCount: metric('peerCount'),
      linkDeficit: metric('linkDeficit'),
      donorPageCount: metric('donorPageCount'),
      qualifiedDonors: donors,
    },
    nextReview: sanitizeNextReview(internalLink.nextReview || assessment.nextReview) || {
      mode: 'event',
      event: 'structural_review',
      rationale: 'review_qualified_donors',
    },
  };
}

function serializeOpportunity(opportunity) {
  if (!opportunity || typeof opportunity !== 'object' || Array.isArray(opportunity)) return null;
  const classification = String(opportunity.classification || '');
  const key = safeHash(opportunity.key);
  if (!key || !OPPORTUNITY_CLASSIFICATIONS.has(classification)) return null;
  const state = OPPORTUNITY_STATES.has(String(opportunity.state))
    ? String(opportunity.state)
    : 'not_evaluable';
  const disposition = OPPORTUNITY_DISPOSITIONS.has(String(opportunity.disposition))
    ? String(opportunity.disposition)
    : 'insufficient_evidence';
  const recommendedSurface = OPPORTUNITY_SURFACES.has(String(opportunity.recommendedSurface))
    ? String(opportunity.recommendedSurface)
    : 'none';
  return {
    key,
    classification,
    state,
    disposition,
    clusterKey: safeHash(opportunity.clusterKey),
    safeLabel: String(opportunity.safeLabel || '').trim().slice(0, 160),
    patternConfidence: boundedNumber(opportunity.patternConfidence, 0, 1) ?? 0,
    causeConfidence: boundedNumber(opportunity.causeConfidence, 0, 1) ?? 0,
    current: safeMetric(opportunity.current),
    previous: safeMetric(opportunity.previous),
    coverage: safeCoverage(opportunity.coverage),
    persistence: safePersistence(opportunity.persistence),
    recommendedSurface,
    blockers: Array.from(new Set((Array.isArray(opportunity.blockers) ? opportunity.blockers : [])
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(isKnownReasonCode)))
      .slice(0, 12),
    reviewReady: opportunity.reviewReady === true,
    expectedImpact: sanitizeExpectedImpact(opportunity.expectedImpact),
    nextReview: sanitizeNextReview(opportunity.nextReview),
  };
}

function serializeReview(review) {
  if (!review) return null;
  const value = plain(review);
  const device = REVIEW_DEVICES.has(String(value.device)) ? String(value.device) : 'unknown';
  const dominantResultType = REVIEW_RESULT_TYPES.has(String(value.dominantResultType))
    ? String(value.dominantResultType)
    : 'unknown';
  const ownResultStatus = REVIEW_OWN_RESULT.has(String(value.ownResultStatus))
    ? String(value.ownResultStatus)
    : 'unknown';
  const outcome = REVIEW_OUTCOMES.has(String(value.outcome)) ? String(value.outcome) : null;
  const reasonCode = REVIEW_REASON_CODES.has(String(value.reasonCode))
    ? String(value.reasonCode)
    : 'none';
  if (!outcome) return null;
  return {
    observedAt: safeIso(value.observedAt),
    locale: String(value.locale || '').slice(0, 20),
    device,
    dominantResultType,
    serpFeatures: Array.from(new Set((Array.isArray(value.serpFeatures) ? value.serpFeatures : [])
      .map(String)
      .filter((feature) => REVIEW_FEATURES.has(feature))))
      .slice(0, 12),
    ownResultStatus,
    outcome,
    reasonCode,
    updatedAt: safeIso(value.updatedAt),
    expiresAt: safeIso(value.expiresAt),
  };
}

function encodeOffset(offset) {
  return Buffer.from(JSON.stringify({ offset }), 'utf8').toString('base64url');
}

function decodeOffset(cursor) {
  if (!cursor) return 0;
  try {
    const value = JSON.parse(Buffer.from(String(cursor), 'base64url').toString('utf8'));
    return Number.isInteger(value.offset) && value.offset >= 0 ? value.offset : 0;
  } catch {
    return 0;
  }
}

function emptyOpportunityLane(lane, readiness) {
  return {
    lane,
    items: [],
    total: 0,
    nextCursor: null,
    readiness,
  };
}

async function currentOpportunityAnalysis(siteUrl, session = null) {
  const latestPartitionQuery = SeoMetricPartition.findOne({
    siteUrl,
    slice: 'page',
    status: 'complete',
    truncated: { $ne: true },
  }).sort({ date: -1 }).select('date');
  const latestPartition = await queryWithSession(latestPartitionQuery, session).lean();
  if (!latestPartition?.date) {
    return {
      status: 'not_ready',
      ruleVersion: RULE_VERSION,
      endDate: null,
      reason: 'complete_page_partition_unavailable',
    };
  }
  const runQuery = SeoSyncRun.findOne({
    siteUrl,
    'analysis.status': 'complete',
    'analysis.ruleVersion': RULE_VERSION,
    'analysis.endDate': latestPartition.date,
  }).sort({ 'analysis.completedAt': -1, startedAt: -1 }).select('analysis');
  const run = await queryWithSession(runQuery, session).lean();
  const analysis = run?.analysis || {};
  const totalPages = Number(analysis.totalPages || 0);
  const evaluatedPages = Number(analysis.evaluatedPages || 0);
  const committedAssessmentPages = Number(analysis.committedAssessmentPages || 0);
  if (totalPages <= 0 || evaluatedPages !== totalPages || committedAssessmentPages !== totalPages) {
    return {
      status: 'not_ready',
      ruleVersion: RULE_VERSION,
      endDate: latestPartition.date,
      reason: 'analysis_not_fully_committed',
      totalPages,
      evaluatedPages,
      committedAssessmentPages,
    };
  }
  const manifestCountQuery = queryWithSession(
    SeoPage.countDocuments({ 'manifest.present': true }),
    session
  );
  const assessmentAggregate = SeoPageAssessment.aggregate([
      { $match: { siteUrl, ruleVersion: RULE_VERSION, endDate: latestPartition.date } },
      {
        $lookup: {
          from: 'seo_pages',
          localField: 'pageKey',
          foreignField: 'pageKey',
          as: 'page',
        },
      },
      { $unwind: '$page' },
      { $match: { 'page.manifest.present': true } },
      {
        $match: {
          $expr: {
            $and: [
              { $ne: [{ $ifNull: ['$page.changeTracking.analysisInputHash', ''] }, ''] },
              { $ne: [{ $ifNull: ['$page.changeTracking.currentVersionKey', ''] }, ''] },
              {
                $eq: [
                  { $ifNull: ['$inputHash', ''] },
                  { $ifNull: ['$page.changeTracking.analysisInputHash', ''] },
                ],
              },
              {
                $eq: [
                  { $ifNull: ['$pageVersionKey', ''] },
                  { $ifNull: ['$page.changeTracking.currentVersionKey', ''] },
                ],
              },
              {
                $or: [
                  { $eq: [{ $ifNull: ['$page.changeTracking.materialChangedAt', null] }, null] },
                  { $gte: ['$evaluatedAt', '$page.changeTracking.materialChangedAt'] },
                ],
              },
              {
                $or: [
                  { $eq: [{ $ifNull: ['$page.changeTracking.analysisInvalidatedAt', null] }, null] },
                  { $gte: ['$evaluatedAt', '$page.changeTracking.analysisInvalidatedAt'] },
                ],
              },
            ],
          },
        },
      },
      { $count: 'count' },
    ]);
  if (session && typeof assessmentAggregate.session === 'function') {
    assessmentAggregate.session(session);
  }
  const [manifestPages, currentAssessmentRows] = await Promise.all([
    manifestCountQuery,
    assessmentAggregate,
  ]);
  const currentAssessmentPages = Number(currentAssessmentRows[0]?.count || 0);
  if (manifestPages <= 0
    || totalPages !== manifestPages
    || currentAssessmentPages !== manifestPages
    || committedAssessmentPages !== currentAssessmentPages) {
    return {
      status: 'not_ready',
      ruleVersion: RULE_VERSION,
      endDate: latestPartition.date,
      reason: 'analysis_manifest_out_of_date',
      totalPages,
      evaluatedPages,
      committedAssessmentPages,
      manifestPages,
      currentAssessmentPages,
    };
  }
  return {
    status: 'ready',
    runId: run?._id ? String(run._id) : null,
    completedAt: safeIso(analysis.completedAt),
    promotionGuardRevision: Number(analysis.promotionGuardRevision || 0),
    ruleVersion: RULE_VERSION,
    endDate: latestPartition.date,
    reason: null,
    totalPages,
    evaluatedPages,
    committedAssessmentPages,
    manifestPages,
    currentAssessmentPages,
  };
}

async function listOpportunities({ config, lane = 'investigate', cursor, limit = 30, now = new Date() }) {
  if (!['investigate', 'structural'].includes(lane)) {
    throw new SeoOpportunityError('lane must be investigate or structural');
  }
  const boundedLimit = Math.min(100, Math.max(1, Number(limit) || 30));
  const offset = decodeOffset(cursor);
  const readiness = await currentOpportunityAnalysis(config.siteUrl);
  if (readiness.status !== 'ready') return emptyOpportunityLane(lane, readiness);

  const assessments = await SeoPageAssessment.find({
    siteUrl: config.siteUrl,
    ruleVersion: RULE_VERSION,
    endDate: readiness.endDate,
    ...(lane === 'investigate' ? {
      $or: [
        { disposition: 'investigate' },
        { 'queryOpportunities.disposition': 'investigate' },
      ],
    } : {
      $or: [
        { disposition: 'structural_review' },
        { 'detectorAssessments.internal_link.disposition': 'structural_review' },
        { 'detectorAssessments.internal_link.state': 'watch' },
      ],
    }),
  }).sort({ evaluatedAt: -1, pageKey: 1 }).lean();
  const rows = [];
  for (const assessment of assessments) {
    const assessmentInputHash = safeHash(assessment.inputHash);
    if (!assessmentInputHash) continue;
    if (lane === 'structural') {
      const internalLink = assessment.detectorAssessments?.internal_link || {};
      const disposition = String(internalLink.disposition || assessment.disposition || '');
      if (disposition !== 'structural_review' && internalLink.state !== 'watch') continue;
      rows.push({
        pageKey: assessment.pageKey,
        canonicalUrl: assessment.canonicalUrl,
        assessmentInputHash,
        structuralFinding: safeStructuralFinding(internalLink, assessment),
      });
      continue;
    }
    for (const rawOpportunity of assessment.queryOpportunities || []) {
      const opportunity = serializeOpportunity(rawOpportunity);
      if (!opportunity || opportunity.disposition !== 'investigate') continue;
      rows.push({
        pageKey: assessment.pageKey,
        canonicalUrl: assessment.canonicalUrl,
        assessmentInputHash,
        assessmentEvaluatedAt: safeIso(assessment.evaluatedAt),
        opportunity,
      });
    }
  }
  const total = rows.length;
  const slice = rows.slice(offset, offset + boundedLimit);
  const [pages, reviews] = await Promise.all([
    SeoPage.find({ pageKey: { $in: slice.map((row) => row.pageKey) } }).select('pageKey title').lean(),
    slice.length && lane === 'investigate' ? SeoOpportunityReview.find({
      siteUrl: config.siteUrl,
      expiresAt: { $gt: now },
      $or: slice.map((row) => ({
        pageKey: row.pageKey,
        assessmentInputHash: row.assessmentInputHash,
        opportunityKey: row.opportunity.key,
      })),
    }).lean() : Promise.resolve([]),
  ]);
  const pageMap = new Map(pages.map((page) => [page.pageKey, page]));
  const reviewMap = new Map(reviews.map((review) => [
    `${review.pageKey}|${review.assessmentInputHash}|${review.opportunityKey}`,
    review,
  ]));
  return {
    lane,
    items: slice.map((row) => lane === 'structural' ? ({
      kind: 'structural_finding',
      pageKey: row.pageKey,
      canonicalUrl: row.canonicalUrl,
      pageTitle: pageMap.get(row.pageKey)?.title || null,
      assessmentInputHash: row.assessmentInputHash,
      finding: row.structuralFinding,
    }) : ({
      kind: 'query_opportunity',
      pageKey: row.pageKey,
      canonicalUrl: row.canonicalUrl,
      pageTitle: pageMap.get(row.pageKey)?.title || null,
      assessmentInputHash: row.assessmentInputHash,
      opportunity: row.opportunity,
      review: (() => {
        const review = reviewMap.get(
          `${row.pageKey}|${row.assessmentInputHash}|${row.opportunity.key}`
        );
        const observedAt = validDate(review?.observedAt);
        const evaluatedAt = validDate(row.assessmentEvaluatedAt);
        return observedAt && evaluatedAt && observedAt >= evaluatedAt
          ? serializeReview(review)
          : null;
      })(),
    })),
    total,
    nextCursor: offset + slice.length < total ? encodeOffset(offset + slice.length) : null,
    readiness,
  };
}

async function currentAssessment({ siteUrl, pageKey, assessmentInputHash, opportunityKey, session = null }) {
  const safePageKey = requireHash(pageKey, 'pageKey');
  const safeInputHash = requireHash(assessmentInputHash, 'assessmentInputHash');
  const safeOpportunityKey = requireHash(opportunityKey, 'opportunityKey');
  const assessmentQuery = SeoPageAssessment.findOne({
    siteUrl,
    pageKey: safePageKey,
    ruleVersion: RULE_VERSION,
  });
  const assessment = await queryWithSession(assessmentQuery, session).lean();
  if (!assessment || assessment.inputHash !== safeInputHash) {
    throw new SeoOpportunityError(
      'The page assessment has changed; refresh before continuing.',
      409,
      'SEO_OPPORTUNITY_STALE_ASSESSMENT'
    );
  }
  const opportunity = (assessment.queryOpportunities || [])
    .find((item) => item.key === safeOpportunityKey);
  if (!opportunity) {
    throw new SeoOpportunityError(
      'The opportunity is no longer current.',
      409,
      'SEO_OPPORTUNITY_STALE_KEY'
    );
  }
  const safeOpportunity = serializeOpportunity(opportunity);
  if (!safeOpportunity) {
    throw new SeoOpportunityError('The opportunity evidence is invalid.', 409, 'SEO_OPPORTUNITY_INVALID_EVIDENCE');
  }
  return { assessment, opportunity: safeOpportunity, rawOpportunity: plain(opportunity) };
}

async function queryRowsForOpportunity({ siteUrl, pageKey, endDate }) {
  const currentStart = shiftDateKey(endDate, -27);
  const previousEnd = shiftDateKey(currentStart, -1);
  const previousStart = shiftDateKey(previousEnd, -27);
  const rows = await SeoQueryPageDailyMetric.aggregate(activeMetricPipeline({
    slice: 'queryPage',
    match: { siteUrl, pageKey, date: { $gte: previousStart, $lte: endDate } },
    afterLookup: [
      {
        $group: {
          _id: { queryKey: '$queryKey', query: '$query' },
          currentClicks: { $sum: { $cond: [{ $gte: ['$date', currentStart] }, '$clicks', 0] } },
          currentImpressions: { $sum: { $cond: [{ $gte: ['$date', currentStart] }, '$impressions', 0] } },
          currentPositionNumerator: { $sum: { $cond: [{ $gte: ['$date', currentStart] }, '$positionNumerator', 0] } },
          previousClicks: { $sum: { $cond: [{ $lt: ['$date', currentStart] }, '$clicks', 0] } },
          previousImpressions: { $sum: { $cond: [{ $lt: ['$date', currentStart] }, '$impressions', 0] } },
          previousPositionNumerator: { $sum: { $cond: [{ $lt: ['$date', currentStart] }, '$positionNumerator', 0] } },
        },
      },
      { $set: { totalVisibleImpressions: { $add: ['$currentImpressions', '$previousImpressions'] } } },
      { $sort: { totalVisibleImpressions: -1, '_id.query': 1, '_id.queryKey': 1 } },
      { $limit: EXAMPLE_CLUSTER_QUERY_CAP },
    ],
  })).option({ maxTimeMS: 8_000 });
  return rows.map((row) => ({
    queryKey: String(row._id?.queryKey || ''),
    query: String(row._id?.query || '').slice(0, 1000),
    current: {
      clicks: Number(row.currentClicks || 0),
      impressions: Number(row.currentImpressions || 0),
      positionNumerator: Number(row.currentPositionNumerator || 0),
    },
    previous: {
      clicks: Number(row.previousClicks || 0),
      impressions: Number(row.previousImpressions || 0),
      positionNumerator: Number(row.previousPositionNumerator || 0),
    },
  }));
}

async function assertCompleteQueryEvidenceWindow({ siteUrl, endDate }) {
  const startDate = shiftDateKey(endDate, -55);
  const dates = await SeoMetricPartition.distinct('date', {
    siteUrl,
    slice: 'queryPage',
    date: { $gte: startDate, $lte: endDate },
    status: 'complete',
    truncated: false,
  });
  const found = new Set((dates || []).map(String));
  for (let date = startDate; date <= endDate; date = shiftDateKey(date, 1)) {
    if (!found.has(date)) {
      throw new SeoOpportunityError(
        'Complete query evidence is unavailable; sync before showing examples.',
        409,
        'SEO_OPPORTUNITY_QUERY_EVIDENCE_NOT_READY'
      );
    }
  }
}

function publicExampleMetric(metric) {
  const impressions = Number(metric?.impressions || 0);
  const clicks = Number(metric?.clicks || 0);
  return {
    clicks,
    impressions,
    ctr: impressions > 0 ? clicks / impressions : 0,
    position: impressions > 0 ? Number(metric?.positionNumerator || 0) / impressions : 0,
  };
}

async function getQueryOpportunityExamples({ config, pageKey, opportunityKey, assessmentInputHash, limit }) {
  const boundedLimit = Math.min(MAX_EXAMPLES, Math.max(1, Number(limit) || MAX_EXAMPLES));
  const { assessment, opportunity } = await currentAssessment({
    siteUrl: config.siteUrl,
    pageKey,
    assessmentInputHash,
    opportunityKey,
  });
  const page = await assertCurrentAnalysis({ config, assessment });
  if (!opportunity.clusterKey) {
    throw new SeoOpportunityError(
      'This page-level opportunity has no query examples.',
      409,
      'SEO_OPPORTUNITY_EXAMPLES_UNAVAILABLE'
    );
  }
  await assertCompleteQueryEvidenceWindow({
    siteUrl: config.siteUrl,
    endDate: assessment.endDate,
  });
  const rows = await queryRowsForOpportunity({
    siteUrl: config.siteUrl,
    pageKey: assessment.pageKey,
    endDate: assessment.endDate,
  });
  const currentRows = rows.map((row) => ({ queryKey: row.queryKey, query: row.query, ...row.current }));
  const previousRows = rows.map((row) => ({ queryKey: row.queryKey, query: row.query, ...row.previous }));
  const semantic = buildSemanticClusters({
    currentRows,
    previousRows,
    pageIntent: [
      page.intent?.targetKeyword,
      page.intent?.intendedIntent,
      page.intent?.readerPromise,
      page.title,
      page.h1,
    ].filter(Boolean).join(' '),
    pageTech: page.tech || '',
    pageCurrentImpressions: Number(assessment.metrics?.current?.impressions || 0),
    pagePreviousImpressions: Number(assessment.metrics?.previous?.impressions || 0),
    maxQueries: EXAMPLE_CLUSTER_QUERY_CAP,
  });
  const cluster = (semantic.clusters || []).find((item) => item.clusterKey === opportunity.clusterKey);
  if (!cluster) {
    throw new SeoOpportunityError(
      'The query evidence has changed; run analysis again.',
      409,
      'SEO_OPPORTUNITY_STALE_CLUSTER'
    );
  }
  const members = new Set(cluster.memberQueryKeys || []);
  const matching = rows.filter((row) => members.has(row.queryKey));
  return {
    assessmentInputHash: safeHash(assessment.inputHash),
    opportunityKey: opportunity.key,
    items: matching.slice(0, boundedLimit).map((row) => ({
      query: row.query,
      current: publicExampleMetric(row.current),
      previous: publicExampleMetric(row.previous),
    })),
    totalVisibleMembers: matching.length,
    truncated: matching.length > boundedLimit,
  };
}

function validateReviewInput(input, now = new Date()) {
  const observedAt = input?.observedAt ? new Date(input.observedAt) : now;
  const oldestAllowed = new Date(now.getTime() - REVIEW_TTL_MS);
  const latestAllowed = new Date(now.getTime() + MAX_REVIEW_FUTURE_SKEW_MS);
  if (
    Number.isNaN(observedAt.getTime())
    || observedAt <= oldestAllowed
    || observedAt > latestAllowed
  ) {
    throw new SeoOpportunityError('observedAt must be within the last 18 months');
  }
  const locale = String(input?.locale || '').trim();
  if (!/^[A-Za-z]{2,3}(?:[-_][A-Za-z]{2})?$/.test(locale)) {
    throw new SeoOpportunityError('locale is invalid');
  }
  const device = String(input?.device || 'unknown');
  const dominantResultType = String(input?.dominantResultType || 'unknown');
  const ownResultStatus = String(input?.ownResultStatus || 'unknown');
  const outcome = String(input?.outcome || '');
  const reasonCode = String(input?.reasonCode || 'none');
  if (!REVIEW_DEVICES.has(device)) throw new SeoOpportunityError('device is invalid');
  if (!REVIEW_RESULT_TYPES.has(dominantResultType)) throw new SeoOpportunityError('dominantResultType is invalid');
  if (!REVIEW_OWN_RESULT.has(ownResultStatus)) throw new SeoOpportunityError('ownResultStatus is invalid');
  if (!REVIEW_OUTCOMES.has(outcome)) throw new SeoOpportunityError('outcome is invalid');
  if (!REVIEW_REASON_CODES.has(reasonCode)) throw new SeoOpportunityError('reasonCode is invalid');
  if (String(input?.notes || '').trim()) {
    throw new SeoOpportunityError(
      'Free-form SERP review notes are not accepted; use a structured reasonCode.',
      400,
      'SEO_SERP_REVIEW_FREE_TEXT_REJECTED'
    );
  }
  const serpFeatures = Array.from(new Set((Array.isArray(input?.serpFeatures) ? input.serpFeatures : [])
    .map(String)));
  if (serpFeatures.length > 12 || serpFeatures.some((feature) => !REVIEW_FEATURES.has(feature))) {
    throw new SeoOpportunityError('serpFeatures contains an unsupported value');
  }
  return {
    observedAt,
    locale: locale.replace('_', '-'),
    device,
    dominantResultType,
    serpFeatures,
    ownResultStatus,
    outcome,
    reasonCode,
  };
}

async function putSerpReview({ config, pageKey, opportunityKey, assessmentInputHash, input, actorUserId, now = new Date() }) {
  const { assessment, opportunity } = await currentAssessment({
    siteUrl: config.siteUrl,
    pageKey,
    assessmentInputHash,
    opportunityKey,
  });
  await assertCurrentAnalysis({ config, assessment });
  if (!['snippet_gap', 'ranking_gap', 'intent_gap', 'source_preference'].includes(opportunity.classification)) {
    throw new SeoOpportunityError('This opportunity does not support a SERP review.', 409, 'SEO_SERP_REVIEW_NOT_APPLICABLE');
  }
  const reviewInput = validateReviewInput(input, now);
  const assessmentEvaluatedAt = requireAssessmentEvaluatedAt(assessment);
  if (reviewInput.observedAt < assessmentEvaluatedAt) {
    throw new SeoOpportunityError(
      'The SERP observation predates the current assessment; review the current evidence again.',
      409,
      'SEO_SERP_REVIEW_STALE'
    );
  }
  const expiresAt = new Date(Math.min(
    reviewInput.observedAt.getTime() + REVIEW_TTL_MS,
    now.getTime() + REVIEW_TTL_MS
  ));
  const review = await SeoOpportunityReview.findOneAndUpdate(
    {
      siteUrl: config.siteUrl,
      pageKey: assessment.pageKey,
      assessmentInputHash: assessment.inputHash,
      opportunityKey: opportunity.key,
    },
    {
      $set: {
        ...reviewInput,
        expiresAt,
      },
      // Remove any legacy free-form note if this review is updated.
      $unset: { notes: 1 },
      $setOnInsert: { createdBy: actorUserId },
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  return {
    assessmentInputHash: safeHash(assessment.inputHash),
    opportunityKey: opportunity.key,
    review: serializeReview(review),
  };
}

function wilsonInterval(clicks, impressions, z = WILSON_90_Z) {
  const n = boundedNumber(impressions, 1);
  if (n === null) return { low: 0, high: 1 };
  const successes = Math.min(n, boundedNumber(clicks, 0) ?? 0);
  const proportion = successes / n;
  const squared = z * z;
  const denominator = 1 + squared / n;
  const center = (proportion + squared / (2 * n)) / denominator;
  const margin = z * Math.sqrt((proportion * (1 - proportion) + squared / (4 * n)) / n) / denominator;
  return { low: Math.max(0, center - margin), high: Math.min(1, center + margin) };
}

function promotionFailure(opportunity, assessment) {
  if (!PROMOTION_ACTION_TYPES[opportunity.classification]) return 'classification_not_promotable';
  if (opportunity.reviewReady !== true) return 'detector_review_gate_not_ready';
  if (opportunity.state !== 'watch' || opportunity.disposition !== 'investigate') return 'opportunity_state_not_reviewable';
  const blockers = opportunity.blockers.filter((blocker) => blocker !== ALLOWED_REVIEW_BLOCKER);
  if (blockers.length) return blockers[0];
  // The matching current owner review satisfies the SERP-review gate. Only
  // assessment-wide production, crawl, and evidence-quality gates may veto a
  // promotion; detector-local gates from unrelated findings must not leak
  // across opportunities.
  const assessmentGates = (Array.isArray(assessment.decisionGates)
    ? assessment.decisionGates
    : []).filter((gate) => GLOBAL_PROMOTION_GATES.has(String(gate)));
  if (assessmentGates.length) return String(assessmentGates[0]);
  if (opportunity.current.impressions < 300) return 'insufficient_impressions';
  if ((opportunity.coverage.query ?? 0) < 0.6) return 'query_coverage_below_threshold';
  if ((opportunity.coverage.semantic ?? 0) < 0.9) return 'semantic_coverage_below_threshold';
  if ((opportunity.coverage.device ?? 0) < 0.6) return 'device_coverage_below_threshold';
  if (opportunity.persistence.stableWeeks < 3 || opportunity.persistence.requiredWeeks < 3) {
    return 'position_not_stable';
  }
  if (opportunity.classification === 'snippet_gap') {
    const impact = sanitizeExpectedImpact(opportunity.expectedImpact);
    if (impact.quality !== 'modeled' || impact.point === null || impact.point < 3) {
      return 'modeled_impact_not_positive';
    }
    if (opportunity.current.position < 4 || opportunity.current.position > 8) return 'outside_snippet_position_band';
    const baseline = assessment.ctrBaseline || {};
    if (!['medium', 'high'].includes(String(baseline.quality))) return 'baseline_quality_insufficient';
    const baselineLow = boundedNumber(baseline.lower90, 0, 1);
    const currentWilson = wilsonInterval(opportunity.current.clicks, opportunity.current.impressions);
    if (baselineLow === null || currentWilson.high >= baselineLow) return 'statistically_uncertain';
  }
  return null;
}

async function assertCurrentAnalysis({ config, assessment, session = null, includeReadiness = false }) {
  const pageQuery = SeoPage.findOne({ pageKey: assessment.pageKey, 'manifest.present': true });
  const [readiness, page] = await Promise.all([
    currentOpportunityAnalysis(config.siteUrl, session),
    queryWithSession(pageQuery, session).lean(),
  ]);
  const pageInputCurrent = Boolean(
    page
    && page.changeTracking?.analysisInputHash === assessment.inputHash
    && (!page.changeTracking?.currentVersionKey
      || page.changeTracking.currentVersionKey === assessment.pageVersionKey)
  );
  if (readiness.status !== 'ready'
    || readiness.endDate !== assessment.endDate
    || !pageInputCurrent) {
    throw new SeoOpportunityError(
      'The assessment is no longer current; run analysis again.',
      409,
      'SEO_OPPORTUNITY_STALE_ASSESSMENT'
    );
  }
  return includeReadiness ? { page, readiness } : page;
}

function promotionCopy(classification) {
  if (classification === 'snippet_gap') return {
    summary: 'A reviewed semantic cluster has a statistically supported snippet opportunity.',
    hypothesis: 'A focused title or description experiment may improve qualified CTR for this cluster.',
    checklist: ['Use the recorded SERP review as context.', 'Change one snippet surface at a time.', 'Measure 28 finalized days after Google recrawls the change.'],
    successMetric: 'ctr',
  };
  if (classification === 'ranking_gap') return {
    summary: 'A reviewed semantic cluster has a supported ranking-content opportunity.',
    hypothesis: 'A focused content experiment may improve relevance and average position for this cluster.',
    checklist: ['Address the reviewed cluster in the most relevant heading and body section.', 'Keep the primary page intent unchanged.', 'Measure after Google recrawls the change.'],
    successMetric: 'averagePosition',
  };
  return {
    summary: 'A reviewed semantic cluster has a supported intent-content opportunity.',
    hypothesis: 'A focused intent-alignment experiment may improve qualified clicks for this cluster.',
    checklist: ['Use the owner-confirmed intent contract.', 'Change the smallest relevant content surface.', 'Measure after Google recrawls the change.'],
    successMetric: 'qualifiedClicks',
  };
}

function requiresTransactionalOpportunityPromotion(env = process.env) {
  const runtime = String(env.NODE_ENV || '').trim().toLowerCase();
  const vercelEnvironment = String(env.VERCEL_ENV || '').trim().toLowerCase();
  const mongoTarget = env === process.env
    ? resolveMongoTarget()
    : String(env.MONGO_TARGET || env.LOCAL_MONGO_TARGET || '').trim().toLowerCase();
  return runtime === 'production'
    || vercelEnvironment === 'production'
    || mongoTarget !== 'test';
}

function supportsOpportunityTransactions(connection = SeoAction.db) {
  const topologyType = String(connection?.client?.topology?.description?.type || '');
  if (topologyType === 'Single') return false;
  return ['ReplicaSetWithPrimary', 'Sharded', 'LoadBalanced'].includes(topologyType);
}

async function claimCurrentPromotionPublication({ assessment, readiness, page, review, session }) {
  if (!session) return;
  const completedAt = validDate(readiness.completedAt);
  if (!readiness.runId || !completedAt) {
    throw new SeoOpportunityError(
      'The current analysis publication marker is unavailable.',
      409,
      'SEO_OPPORTUNITY_STALE_ASSESSMENT'
    );
  }
  const markerRevision = Number(readiness.promotionGuardRevision || 0);
  const markerResult = await SeoSyncRun.updateOne(
    {
      _id: readiness.runId,
      siteUrl: assessment.siteUrl,
      'analysis.status': 'complete',
      'analysis.ruleVersion': RULE_VERSION,
      'analysis.endDate': assessment.endDate,
      'analysis.completedAt': completedAt,
      'analysis.totalPages': readiness.totalPages,
      'analysis.evaluatedPages': readiness.evaluatedPages,
      'analysis.committedAssessmentPages': readiness.committedAssessmentPages,
      $or: [
        { 'analysis.promotionGuardRevision': markerRevision },
        ...(markerRevision === 0 ? [{ 'analysis.promotionGuardRevision': { $exists: false } }] : []),
      ],
    },
    { $inc: { 'analysis.promotionGuardRevision': 1 } },
    { session, runValidators: true, timestamps: false }
  );
  if (markerResult.modifiedCount !== 1) {
    throw new SeoOpportunityError(
      'The analysis publication changed before promotion completed.',
      409,
      'SEO_OPPORTUNITY_STALE_ASSESSMENT'
    );
  }

  const assessmentRevision = Number(assessment.promotionGuardRevision || 0);
  const assessmentResult = await SeoPageAssessment.updateOne(
    {
      _id: assessment._id,
      siteUrl: assessment.siteUrl,
      pageKey: assessment.pageKey,
      ruleVersion: RULE_VERSION,
      endDate: assessment.endDate,
      inputHash: assessment.inputHash,
      pageVersionKey: assessment.pageVersionKey,
      evaluatedAt: requireAssessmentEvaluatedAt(assessment),
      $or: [
        { promotionGuardRevision: assessmentRevision },
        ...(assessmentRevision === 0 ? [{ promotionGuardRevision: { $exists: false } }] : []),
      ],
    },
    { $inc: { promotionGuardRevision: 1 } },
    { session, runValidators: true, timestamps: false }
  );
  if (assessmentResult.modifiedCount !== 1) {
    throw new SeoOpportunityError(
      'The page assessment changed before promotion completed.',
      409,
      'SEO_OPPORTUNITY_STALE_ASSESSMENT'
    );
  }

  const pageRevision = Number(page.changeTracking?.promotionGuardRevision || 0);
  const pageResult = await SeoPage.updateOne(
    {
      _id: page._id,
      pageKey: assessment.pageKey,
      'manifest.present': true,
      contentUpdatedAt: validDate(page.contentUpdatedAt),
      'changeTracking.analysisInputHash': assessment.inputHash,
      'changeTracking.currentVersionKey': assessment.pageVersionKey,
      'changeTracking.materialChangedAt': validDate(page.changeTracking?.materialChangedAt),
      'changeTracking.analysisInvalidatedAt': validDate(page.changeTracking?.analysisInvalidatedAt),
      $or: [
        { 'changeTracking.promotionGuardRevision': pageRevision },
        ...(pageRevision === 0
          ? [{ 'changeTracking.promotionGuardRevision': { $exists: false } }]
          : []),
      ],
    },
    { $inc: { 'changeTracking.promotionGuardRevision': 1 } },
    { session, runValidators: true, timestamps: false }
  );
  if (pageResult.modifiedCount !== 1) {
    throw new SeoOpportunityError(
      'The page changed before promotion completed.',
      409,
      'SEO_OPPORTUNITY_STALE_ASSESSMENT'
    );
  }

  const reviewObservedAt = validDate(review.observedAt);
  const reviewExpiresAt = validDate(review.expiresAt);
  if (!review?._id || !reviewObservedAt || !reviewExpiresAt) {
    throw new SeoOpportunityError(
      'The current SERP review marker is unavailable.',
      409,
      'SEO_OPPORTUNITY_REVIEW_REQUIRED'
    );
  }
  const reviewRevision = Number(review.promotionGuardRevision || 0);
  const reviewResult = await SeoOpportunityReview.updateOne(
    {
      _id: review._id,
      siteUrl: assessment.siteUrl,
      pageKey: assessment.pageKey,
      assessmentInputHash: assessment.inputHash,
      opportunityKey: review.opportunityKey,
      outcome: review.outcome,
      observedAt: reviewObservedAt,
      expiresAt: reviewExpiresAt,
      $or: [
        { promotionGuardRevision: reviewRevision },
        ...(reviewRevision === 0 ? [{ promotionGuardRevision: { $exists: false } }] : []),
      ],
    },
    { $inc: { promotionGuardRevision: 1 } },
    { session, runValidators: true, timestamps: false }
  );
  if (reviewResult.modifiedCount !== 1) {
    throw new SeoOpportunityError(
      'The SERP review changed before promotion completed.',
      409,
      'SEO_OPPORTUNITY_REVIEW_REQUIRED'
    );
  }
}

async function promoteOpportunity({
  config,
  pageKey,
  opportunityKey,
  assessmentInputHash,
  actorUserId,
  now = new Date(),
  beforePromotionWrite = null,
}) {
  const execute = async (session = null) => {
    const { assessment, opportunity } = await currentAssessment({
      siteUrl: config.siteUrl,
      pageKey,
      assessmentInputHash,
      opportunityKey,
      session,
    });
    const { page, readiness } = await assertCurrentAnalysis({
      config,
      assessment,
      session,
      includeReadiness: true,
    });
    const assessmentEvaluatedAt = requireAssessmentEvaluatedAt(assessment);
    const oldestReviewAt = new Date(now.getTime() - REVIEW_TTL_MS);
    const reviewNotBefore = new Date(Math.max(
      assessmentEvaluatedAt.getTime(),
      oldestReviewAt.getTime() + 1
    ));
    const reviewQuery = SeoOpportunityReview.findOne({
      siteUrl: config.siteUrl,
      pageKey: assessment.pageKey,
      assessmentInputHash: assessment.inputHash,
      opportunityKey: opportunity.key,
      expiresAt: { $gt: now },
      observedAt: {
        $gte: reviewNotBefore,
        $lte: new Date(now.getTime() + MAX_REVIEW_FUTURE_SKEW_MS),
      },
    });
    const review = await queryWithSession(reviewQuery, session).lean();
    const requiredOutcome = PROMOTION_OUTCOMES[opportunity.classification];
    const reviewObservedAt = review?.observedAt ? new Date(review.observedAt) : null;
    const reviewExpiresAt = review?.expiresAt ? new Date(review.expiresAt) : null;
    const reviewIsFresh = Boolean(
      reviewObservedAt
      && reviewExpiresAt
      && !Number.isNaN(reviewObservedAt.getTime())
      && !Number.isNaN(reviewExpiresAt.getTime())
      && reviewObservedAt > new Date(now.getTime() - REVIEW_TTL_MS)
      && reviewObservedAt >= assessmentEvaluatedAt
      && reviewObservedAt <= new Date(now.getTime() + MAX_REVIEW_FUTURE_SKEW_MS)
      && reviewExpiresAt > now
    );
    if (!reviewIsFresh || !requiredOutcome || review.outcome !== requiredOutcome) {
      throw new SeoOpportunityError(
        'A matching current SERP review is required before promotion.',
        409,
        'SEO_OPPORTUNITY_REVIEW_REQUIRED'
      );
    }
    const blocker = promotionFailure(opportunity, assessment);
    if (blocker) {
      throw new SeoOpportunityError(
        'Detector evidence does not meet the promotion threshold.',
        409,
        'SEO_OPPORTUNITY_PROMOTION_BLOCKED'
      );
    }
    const actionType = PROMOTION_ACTION_TYPES[opportunity.classification];
    const copy = promotionCopy(opportunity.classification);
    const fingerprint = sha256([
      RULE_VERSION,
      'owner-reviewed-opportunity',
      assessment.pageKey,
      assessment.inputHash,
      opportunity.key,
      actionType,
    ].join('|'));
    const impact = sanitizeExpectedImpact(opportunity.expectedImpact);
    if (typeof beforePromotionWrite === 'function') {
      await beforePromotionWrite({ assessment, readiness });
    }
    await claimCurrentPromotionPublication({ assessment, readiness, page, review, session });
    const action = await upsertPromotedAction({
      promotionKey: fingerprint,
      fingerprint,
      session,
      payload: {
        pageKey: assessment.pageKey,
        canonicalUrl: assessment.canonicalUrl,
        type: actionType,
        state: 'proposed',
        // The detector establishes the evidence gates, but the owner explicitly
        // promotes this reviewed hypothesis. Keep it outside detector-owned
        // reconciliation so future rule migrations cannot auto-close it.
        source: 'owner',
        ruleVersion: RULE_VERSION,
        queueKind: 'performance',
        summary: copy.summary,
        hypothesis: copy.hypothesis,
        evidence: {
          summary: copy.summary,
          windowDays: 28,
          coverage: {
            queryCoveragePercent: opportunity.coverage.query === null ? null : opportunity.coverage.query * 100,
            semanticCoveragePercent: opportunity.coverage.semantic === null ? null : opportunity.coverage.semantic * 100,
            deviceCoveragePercent: opportunity.coverage.device === null ? null : opportunity.coverage.device * 100,
            status: 'sufficient',
          },
          reasonCodes: [],
        },
        recommendation: {
          rationale: copy.hypothesis,
          checklist: copy.checklist,
        },
        successCriteria: {
          metric: copy.successMetric,
          observationWindowDays: 28,
        },
        priorityScore: impact.point ?? 0,
        confidence: opportunity.causeConfidence,
        patternConfidence: opportunity.patternConfidence,
        causeConfidence: opportunity.causeConfidence,
        expectedAdditionalClicks: impact.point,
        expectedImpact: impact,
        nextReview: {
          mode: 'event',
          event: '28_finalized_days',
          rationale: 'measure_after_implementation_and_google_recrawl',
        },
        detectorActive: false,
        lastDetectedAt: now,
        events: [{
          event: 'owner_promoted_serp_review',
          at: now,
          actorUserId,
          fromState: '',
          toState: 'proposed',
        }],
      },
    });
    return {
      assessmentInputHash: safeHash(assessment.inputHash),
      opportunityKey: opportunity.key,
      action: serializeAction(action, page),
    };
  };

  const connection = SeoAction.db;
  if (!supportsOpportunityTransactions(connection)) {
    if (requiresTransactionalOpportunityPromotion()) {
      throw new SeoOpportunityError(
        'MongoDB transactions are required to promote SEO opportunities.',
        503,
        'SEO_OPPORTUNITY_TRANSACTION_REQUIRED'
      );
    }
    // Unit tests and explicitly test-scoped standalone MongoDB may exercise
    // the workflow without transactions. Production-like targets never use
    // this non-atomic path.
    return execute(null);
  }

  const session = await connection.startSession();
  let result = null;
  try {
    await session.withTransaction(async () => {
      result = await execute(session);
    }, {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    });
    if (!result) {
      throw new SeoOpportunityError(
        'The promotion transaction completed without an action.',
        409,
        'SEO_OPPORTUNITY_STALE_ASSESSMENT'
      );
    }
    return result;
  } finally {
    await session.endSession();
  }
}

function duplicateKeyError(error) {
  return Number(error?.code) === 11000 || String(error?.name || '') === 'MongoServerError'
    && /duplicate key/i.test(String(error?.message || ''));
}

async function upsertPromotedAction({ promotionKey, fingerprint, payload, session = null }) {
  const safePromotionKey = requireHash(promotionKey, 'promotionKey');
  const safeFingerprint = requireHash(fingerprint, 'fingerprint');
  const filter = {
    $or: [
      { ownerPromotionKey: safePromotionKey },
      // Adopt an action created before ownerPromotionKey existed without
      // changing its state, history, or owner-managed lifecycle.
      { fingerprint: safeFingerprint, source: 'owner' },
    ],
  };
  const update = {
    $set: { ownerPromotionKey: safePromotionKey },
    $setOnInsert: {
      ...payload,
      fingerprint: safeFingerprint,
    },
  };
  try {
    return await SeoAction.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
      ...(session ? { session } : {}),
    });
  } catch (error) {
    // A unique index is the concurrency boundary. If two first-time requests
    // race, the loser reads the winner instead of creating or reopening an
    // action.
    if (!duplicateKeyError(error)) throw error;
    const existingQuery = SeoAction.findOne({ ownerPromotionKey: safePromotionKey });
    const existing = await queryWithSession(existingQuery, session);
    if (existing) return existing;
    throw error;
  }
}

async function reviewsForAssessment({
  siteUrl,
  pageKey,
  assessmentInputHash,
  assessmentEvaluatedAt,
  now = new Date(),
}) {
  const evaluatedAt = validDate(assessmentEvaluatedAt);
  if (!safeHash(pageKey) || !safeHash(assessmentInputHash) || !evaluatedAt) return new Map();
  const reviewNotBefore = new Date(Math.max(
    evaluatedAt.getTime(),
    now.getTime() - REVIEW_TTL_MS + 1
  ));
  const reviews = await SeoOpportunityReview.find({
    siteUrl,
    pageKey,
    assessmentInputHash,
    expiresAt: { $gt: now },
    observedAt: {
      $gte: reviewNotBefore,
      $lte: new Date(now.getTime() + MAX_REVIEW_FUTURE_SKEW_MS),
    },
  }).lean();
  return new Map(reviews
    .filter((review) => {
      const observedAt = validDate(review?.observedAt);
      const expiresAt = validDate(review?.expiresAt);
      return Boolean(
        observedAt
        && expiresAt
        && observedAt >= evaluatedAt
        && observedAt >= reviewNotBefore
        && observedAt <= new Date(now.getTime() + MAX_REVIEW_FUTURE_SKEW_MS)
        && expiresAt > now
      );
    })
    .map((review) => [review.opportunityKey, serializeReview(review)]));
}

module.exports = {
  EXAMPLE_CLUSTER_QUERY_CAP,
  RULE_VERSION,
  SeoOpportunityError,
  getQueryOpportunityExamples,
  listOpportunities,
  promoteOpportunity,
  putSerpReview,
  reviewsForAssessment,
  promotionFailure,
  serializeOpportunity,
  serializeReview,
  validateReviewInput,
  upsertPromotedAction,
};
