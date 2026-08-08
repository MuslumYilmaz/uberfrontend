'use strict';

const SeoAction = require('../../models/SeoAction');
const SeoDiagnosticSnapshot = require('../../models/SeoDiagnosticSnapshot');
const SeoPage = require('../../models/SeoPage');
const { DAY_MS, dateKeyInTimezone, shiftDateKey } = require('./dates');
const { captureLiveMetadataSnapshot } = require('./diagnostics');
const { pageKeyForUrl, sha256, validateFrontendAtlasUrl } = require('./keys');
const { analysisInputHashForPage } = require('./manifest');
const { isKnownReasonCode, reasonSummaryForCode } = require('./rule-engine');

const ACTIVE_STATES = ['proposed', 'approved', 'implementation_pending', 'measuring', 'evaluated', 'snoozed'];
const ALLOWED_SNOOZE_DAYS = new Set([14, 30, 60, 90]);
const DETECTOR_SOURCES = Object.freeze(['balanced-v1', 'balanced-v2', 'balanced-v2.1']);
const ACTION_CHANGED_COMPONENTS = Object.freeze({
  ctr_snippet: Object.freeze(['title', 'description']),
  intent_mismatch: Object.freeze(['h1', 'mainContent', 'headingOutline', 'intent']),
  content_decay: Object.freeze(['h1', 'mainContent', 'headingOutline', 'intent']),
  cannibalization: Object.freeze(['h1', 'mainContent', 'headingOutline', 'intent']),
  internal_link: Object.freeze(['internalLinks']),
  technical_indexing: Object.freeze(['canonical', 'robots', 'indexability', 'structuredData']),
});
const SAFE_SEMANTIC_FACETS = new Set([
  'official_reference', 'direct_answer', 'implementation', 'debugging',
  'comparison', 'interview_prep', 'other',
]);
const SAFE_CLUSTER_TECH = new Set([
  'angular', 'react', 'vue', 'svelte', 'javascript', 'typescript', 'rxjs',
  'node', 'html', 'css',
]);
const SAFE_COVERAGE_STATUSES = new Set([
  'complete', 'partial', 'unavailable', 'limited', 'sufficient', 'inconsistent', 'consistent',
]);
const SAFE_BASELINE_LEVELS = new Set(['insufficient', 'low', 'medium', 'high']);
const SAFE_BASELINE_COHORTS = new Set([
  'family+tech+position', 'family+position', 'site+position', 'unavailable',
]);
const DETECTOR_SUCCESS_METRICS = Object.freeze({
  ctr_snippet: new Set(['ctr']),
  intent_mismatch: new Set(['qualifiedClicks']),
  content_decay: new Set(['clicks', 'averagePosition']),
  cannibalization: new Set(['dominantUrlShare']),
  internal_link: new Set(['averagePosition']),
  technical_indexing: new Set(['impressions', 'urlInspection']),
});
const GSC_TIMEZONE = 'America/Los_Angeles';

function isDetectorManagedAction(action) {
  return DETECTOR_SOURCES.includes(String(action?.source || ''));
}

class SeoActionError extends Error {
  constructor(message, status = 400, code = 'SEO_ACTION_INVALID') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function plain(value) {
  return typeof value?.toObject === 'function' ? value.toObject() : { ...(value || {}) };
}

function successCriteriaText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value.description === 'string') return value.description;
  if (value.metric === 'clicks' && value.recoverToPreviousWindowRatio) {
    const minimum = Number.isFinite(Number(value.minimumClicks)) ? ` (${Number(value.minimumClicks)} clicks)` : '';
    return `Recover clicks to at least ${Math.round(value.recoverToPreviousWindowRatio * 100)}% of the detector baseline${minimum}.`;
  }
  if (value.metric === 'averagePosition' && value.minimumImprovement) {
    return `Improve average position by at least ${value.minimumImprovement}.`;
  }
  if (value.metric === 'impressions' && value.minimum) {
    return `Reach at least ${value.minimum} impression${Number(value.minimum) === 1 ? '' : 's'} in the finalized measurement window.`;
  }
  if (value.metric === 'urlInspection') {
    const checks = [
      value.requireCanonicalMatch ? 'selected canonical matches' : null,
      value.requireIndexPass ? 'index verdict passes' : null,
      value.requireRobotsAllowed ? 'robots access is allowed' : null,
    ].filter(Boolean);
    return `Confirm a fresh URL Inspection result where ${checks.join(', ')}.`;
  }
  const parts = [];
  if (value.metric) parts.push(`Improve ${value.metric}`);
  if (value.minimumRelativeLift) parts.push(`by at least ${Math.round(value.minimumRelativeLift * 100)}%`);
  if (value.minimumImprovement) parts.push(`by at least ${value.minimumImprovement}`);
  if (value.observationWindowDays) parts.push(`within ${value.observationWindowDays} finalized days`);
  if (value.guardrail) {
    const tolerance = Number.isFinite(Number(value.maximumPositionLoss))
      ? ` (no more than ${Number(value.maximumPositionLoss)} position of loss)`
      : '';
    parts.push(`while ${value.guardrail} stays within its guardrail${tolerance}`);
  }
  return parts.join(' ') || 'Review the result after one equal finalized measurement window.';
}

function boundedNumber(value, minimum, maximum) {
  const normalized = Number(value);
  return Number.isFinite(normalized) && normalized >= minimum && normalized <= maximum
    ? normalized
    : null;
}

function sanitizeDetectorSuccessCriteria(value, actionType) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const metric = String(value.metric || '');
  if (!DETECTOR_SUCCESS_METRICS[actionType]?.has(metric)) return null;
  const result = { metric };
  const numericFields = {
    recoverToPreviousWindowRatio: [0, 1],
    baselinePreviousClicks: [0, 1_000_000_000],
    minimumClicks: [0, 1_000_000_000],
    minimumImprovement: [0, 100],
    minimum: [0, 1_000_000_000],
    minimumRelativeLift: [0, 5],
    maximumPositionLoss: [0, 100],
    observationWindowDays: [1, 365],
  };
  for (const [field, [minimum, maximum]] of Object.entries(numericFields)) {
    const safe = boundedNumber(value[field], minimum, maximum);
    if (safe !== null) result[field] = safe;
  }
  if (value.guardrail === 'averagePosition') result.guardrail = 'averagePosition';
  for (const field of ['requireCanonicalMatch', 'requireIndexPass', 'requireRobotsAllowed']) {
    if (typeof value[field] === 'boolean') result[field] = value[field];
  }
  return result;
}

function serializeEvidence(evidence = {}, { detectorManaged = false } = {}) {
  // Persisted detector evidence is sanitized on write, but older rows or a
  // manually inserted record may predate that invariant. Sanitize again at
  // the API boundary so a raw GSC query can never escape through an action.
  const sanitized = sanitizeDurableEvidence(evidence);
  const clusters = Array.isArray(sanitized.queryClusters) ? sanitized.queryClusters : [];
  const reasonCodes = Array.isArray(sanitized.reasonCodes)
    ? sanitized.reasonCodes.filter((code) => !detectorManaged || isKnownReasonCode(code))
    : [];
  const detectorSummary = reasonSummaryForCode(reasonCodes[0])
    || 'Versioned detector evidence is available in the page assessment.';
  return {
    // Legacy detector rows may predate the no-raw-query evidence contract.
    // Their arbitrary prose is not safe to echo. Owner-authored/manual
    // evidence remains untouched; detector prose is rebuilt from an
    // allowlisted reason code at the API boundary.
    summary: detectorManaged ? detectorSummary : String(sanitized.summary || ''),
    ...(Number.isFinite(sanitized.windowDays) ? { windowDays: sanitized.windowDays } : {}),
    queryCoveragePercent: Number.isFinite(sanitized.queryCoverage)
      ? Math.round(sanitized.queryCoverage * 10_000) / 100
      : Number.isFinite(evidence.queryCoveragePercent) ? evidence.queryCoveragePercent : null,
    queryClusters: clusters.map((cluster) => ({
      label: String(cluster.label || 'query cluster'),
      facet: cluster.facet || null,
      intent: cluster.intent || null,
      clicks: Number(cluster.clicks || 0),
      impressions: Number(cluster.impressions || 0),
      ctr: Number(cluster.ctr || 0),
      averagePosition: Number(cluster.averagePosition ?? cluster.position ?? 0),
      impressionShare: Number.isFinite(cluster.impressionShare) ? cluster.impressionShare : null,
      fullPageLowerBoundShare: Number.isFinite(cluster.fullPageLowerBoundShare)
        ? cluster.fullPageLowerBoundShare
        : null,
      topicAlignment: Number.isFinite(cluster.topicAlignment) ? cluster.topicAlignment : null,
    })),
    ...(sanitized.coverage && typeof sanitized.coverage === 'object' ? { coverage: sanitized.coverage } : {}),
    ...(sanitized.baselineQuality && typeof sanitized.baselineQuality === 'object'
      ? { baselineQuality: sanitized.baselineQuality }
      : {}),
    ...(reasonCodes.length ? { reasonCodes } : {}),
    signals: detectorManaged ? [] : (Array.isArray(sanitized.signals) ? sanitized.signals : []),
  };
}

function sanitizeClusterIntent(value) {
  const normalized = String(value || '').trim().toLowerCase();
  const allowed = new Set(['informational', 'transactional', 'navigational', 'commercial', 'comparison', 'tutorial', 'reference', 'unknown']);
  return allowed.has(normalized) ? normalized : 'unknown';
}

function sanitizeDurableEvidence(evidence = {}) {
  const clusters = Array.isArray(evidence.queryClusters) ? evidence.queryClusters : [];
  const coverage = evidence.coverage && typeof evidence.coverage === 'object' && !Array.isArray(evidence.coverage)
    ? {
      queryCoveragePercent: finiteOrNull(evidence.coverage.queryCoveragePercent),
      semanticCoveragePercent: finiteOrNull(evidence.coverage.semanticCoveragePercent),
      deviceCoveragePercent: finiteOrNull(evidence.coverage.deviceCoveragePercent),
      status: SAFE_COVERAGE_STATUSES.has(String(evidence.coverage.status))
        ? String(evidence.coverage.status)
        : 'unavailable',
    }
    : null;
  const baselineQuality = evidence.baselineQuality
    && typeof evidence.baselineQuality === 'object'
    && !Array.isArray(evidence.baselineQuality)
    ? {
      level: SAFE_BASELINE_LEVELS.has(String(evidence.baselineQuality.level))
        ? String(evidence.baselineQuality.level)
        : 'insufficient',
      cohort: SAFE_BASELINE_COHORTS.has(String(evidence.baselineQuality.cohort))
        ? String(evidence.baselineQuality.cohort)
        : 'unavailable',
      peers: boundedNumber(evidence.baselineQuality.peers, 0, 1_000_000_000) ?? 0,
      clicks: boundedNumber(evidence.baselineQuality.clicks, 0, 1_000_000_000) ?? 0,
      impressions: boundedNumber(evidence.baselineQuality.impressions, 0, 1_000_000_000) ?? 0,
      zeroClickPeerRate: boundedNumber(evidence.baselineQuality.zeroClickPeerRate, 0, 1),
    }
    : null;
  return {
    summary: String(evidence.summary || '').slice(0, 2000),
    ...(Number.isFinite(evidence.windowDays) ? { windowDays: evidence.windowDays } : {}),
    ...(Number.isFinite(evidence.queryCoverage) ? { queryCoverage: evidence.queryCoverage } : {}),
    ...(coverage ? { coverage } : {}),
    ...(baselineQuality ? { baselineQuality } : {}),
    ...(Array.isArray(evidence.reasonCodes)
      ? { reasonCodes: evidence.reasonCodes.map((code) => String(code).slice(0, 100)).slice(0, 20) }
      : {}),
    signals: Array.isArray(evidence.signals) ? evidence.signals.map((signal) => String(signal).slice(0, 200)).slice(0, 20) : [],
    ...(Array.isArray(evidence.donorPageKeys) ? { donorPageKeys: evidence.donorPageKeys.map(String).slice(0, 20) } : {}),
    queryClusters: clusters.slice(0, 10).map((cluster, index) => {
      const intent = sanitizeClusterIntent(cluster.intent);
      const rawFacet = String(cluster.facet || cluster.dominantFacet || '').trim().toLowerCase();
      const explicitFacet = SAFE_SEMANTIC_FACETS.has(rawFacet);
      const facet = explicitFacet ? rawFacet : 'other';
      const rawTech = String(cluster.tech || '').trim().toLowerCase();
      const tech = SAFE_CLUSTER_TECH.has(rawTech) ? rawTech : '';
      const metrics = cluster.current && typeof cluster.current === 'object' ? cluster.current : cluster;
      return {
        label: tech
          ? `${tech} · ${facet.replaceAll('_', ' ')}`
          : explicitFacet
            ? facet.replaceAll('_', ' ')
            : intent === 'unknown' ? `abstract-cluster-${index + 1}` : `${intent} intent`,
        facet,
        ...(tech ? { tech } : {}),
        intent,
        clicks: Number(metrics.clicks || 0),
        impressions: Number(metrics.impressions || 0),
        ctr: Number(metrics.ctr || 0),
        position: Number(metrics.position ?? metrics.averagePosition ?? 0),
        impressionShare: Number.isFinite(metrics.visibleShare ?? metrics.impressionShare)
          ? Number(metrics.visibleShare ?? metrics.impressionShare)
          : null,
        fullPageLowerBoundShare: finiteOrNull(metrics.fullPageLowerBoundShare),
        topicAlignment: finiteOrNull(cluster.topicAlignment),
      };
    }),
  };
}

function finiteOrNull(value) {
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function serializeAction(action, page = null) {
  const value = plain(action);
  const recommendation = value.recommendation || {};
  const detectorManaged = isDetectorManagedAction(value);
  const detectorSuccessCriteria = detectorManaged
    ? sanitizeDetectorSuccessCriteria(value.successCriteria, value.type)
    : null;
  const ownerSuccessCriteriaText = typeof value.ownerSuccessCriteriaText === 'string'
    ? value.ownerSuccessCriteriaText.trim().slice(0, 2000)
    : '';
  return {
    id: String(value._id || value.id || ''),
    version: Number(value.version || 0),
    pageKey: String(value.pageKey || ''),
    url: String(value.canonicalUrl || ''),
    pageTitle: page?.title || null,
    type: value.type,
    status: value.state,
    verdict: value.evaluation?.verdict || null,
    title: String(value.summary || ''),
    priorityScore: Number(value.priorityScore || 0),
    confidence: Number(value.confidence || 0),
    expectedAdditionalClicks: Number.isFinite(value.expectedAdditionalClicks) ? value.expectedAdditionalClicks : null,
    effort: value.effort || null,
    risk: value.risk || null,
    detectedAt: new Date(value.createdAt || Date.now()).toISOString(),
    updatedAt: new Date(value.updatedAt || value.createdAt || Date.now()).toISOString(),
    snoozedUntil: value.snoozedUntil ? new Date(value.snoozedUntil).toISOString() : null,
    suppressedUntil: value.suppressedUntil ? new Date(value.suppressedUntil).toISOString() : null,
    suppressionGuidance: value.suppressedUntil
      ? 'Pause further snippet changes; investigate intent and result format before another title experiment.'
      : null,
    evidence: serializeEvidence(value.evidence, { detectorManaged }),
    recommendation: {
      hypothesis: String(value.hypothesis || ''),
      rationale: recommendation.rationale || null,
      checklist: Array.isArray(recommendation.checklist) ? recommendation.checklist.map(String) : [],
      copyDirection: recommendation.copyDirection || null,
      successCriteria: successCriteriaText(
        detectorManaged
          ? (ownerSuccessCriteriaText || detectorSuccessCriteria || {})
          : value.successCriteria
      ),
    },
    events: Array.isArray(value.events) ? value.events.map((event) => ({
      event: String(event.event || ''),
      at: new Date(event.at || value.updatedAt || Date.now()).toISOString(),
      note: event.note || null,
      actor: event.actorUserId ? String(event.actorUserId) : null,
    })) : [],
    campaignId: value.campaignId || null,
    historicalUnverified: Boolean(value.historicalUnverified),
  };
}

function resurfaceExpiredSnooze(action, now) {
  if (action.state !== 'snoozed' || !action.snoozedUntil || new Date(action.snoozedUntil) > now) return false;
  action.state = 'proposed';
  action.snoozedUntil = null;
  action.events.push({
    event: 'snooze_expired_redetected',
    at: now,
    fromState: 'snoozed',
    toState: 'proposed',
    note: 'The detector found the condition again after the snooze expired.',
  });
  return true;
}

async function upsertRecommendations(
  recommendations,
  now = new Date(),
  { deadlineMs = Infinity, clock = Date.now, progress = null } = {}
) {
  const items = recommendations || [];
  const results = [];
  let processed = 0;
  if (progress && typeof progress === 'object') {
    Object.assign(progress, { processed: 0, total: items.length, complete: items.length === 0 });
  }
  for (const recommendation of items) {
    if (clock() >= deadlineMs) break;
    processed += 1;
    if (recommendation.type === 'ctr_snippet') {
      const suppression = await SeoAction.exists({
        pageKey: recommendation.pageKey,
        type: 'ctr_snippet',
        suppressedUntil: { $gt: now },
      });
      if (suppression) continue;
    }
    const existing = await SeoAction.findOne({
      fingerprint: recommendation.fingerprint,
      state: { $in: ACTIVE_STATES },
    }).sort({ createdAt: -1 });
    if (existing) {
      if (['proposed', 'snoozed'].includes(existing.state)) {
        const detectorManaged = isDetectorManagedAction(existing);
        const detectorOwned = detectorManaged
          && (existing.state === 'proposed' || (!existing.approvedAt && !existing.implementedAt));
        if (detectorManaged) {
          if (detectorOwned) {
            existing.source = recommendation.source || 'balanced-v2.1';
            existing.ruleVersion = recommendation.ruleVersion || 'balanced-v2.1';
            existing.summary = recommendation.summary;
            existing.hypothesis = recommendation.hypothesis;
            existing.recommendation = recommendation.recommendation;
            existing.successCriteria = recommendation.successCriteria;
          }
          existing.priorityScore = recommendation.priorityScore;
          existing.confidence = recommendation.confidence;
          existing.expectedAdditionalClicks = recommendation.expectedAdditionalClicks;
          existing.evidence = sanitizeDurableEvidence(recommendation.evidence);
          existing.detectorActive = true;
          existing.lastDetectedAt = now;
          existing.clearedAt = null;
          existing.autoResolved = false;
          if (detectorOwned) resurfaceExpiredSnooze(existing, now);
          existing.version += 1;
          await existing.save();
        }
      }
      results.push(existing);
      continue;
    }
    const autoResolved = await SeoAction.findOne({
      fingerprint: recommendation.fingerprint,
      source: { $in: DETECTOR_SOURCES },
      state: 'closed',
      autoResolved: true,
    }).sort({ createdAt: -1 });
    if (autoResolved) {
      autoResolved.source = recommendation.source || 'balanced-v2.1';
      autoResolved.ruleVersion = recommendation.ruleVersion || 'balanced-v2.1';
      autoResolved.state = 'proposed';
      autoResolved.summary = recommendation.summary;
      autoResolved.hypothesis = recommendation.hypothesis;
      autoResolved.recommendation = recommendation.recommendation;
      autoResolved.successCriteria = recommendation.successCriteria;
      autoResolved.priorityScore = recommendation.priorityScore;
      autoResolved.confidence = recommendation.confidence;
      autoResolved.expectedAdditionalClicks = recommendation.expectedAdditionalClicks;
      autoResolved.evidence = sanitizeDurableEvidence(recommendation.evidence);
      autoResolved.detectorActive = true;
      autoResolved.lastDetectedAt = now;
      autoResolved.clearedAt = null;
      autoResolved.autoResolved = false;
      autoResolved.version += 1;
      autoResolved.events.push({
        event: 'detector_redetected', at: now, fromState: 'closed', toState: 'proposed',
      });
      await autoResolved.save();
      results.push(autoResolved);
      continue;
    }
    const dismissed = await SeoAction.findOne({
      fingerprint: recommendation.fingerprint,
      state: 'dismissed',
    }).sort({ createdAt: -1 });
    if (dismissed) {
      results.push(dismissed);
      continue;
    }
    const activeSameType = await SeoAction.findOne({
      pageKey: recommendation.pageKey,
      type: recommendation.type,
      state: { $in: ACTIVE_STATES },
    }).sort({ createdAt: -1 });
    if (activeSameType) {
      if (['proposed', 'snoozed'].includes(activeSameType.state)) {
        const detectorManaged = isDetectorManagedAction(activeSameType);
        const detectorOwned = detectorManaged && (
          activeSameType.state === 'proposed'
          || (!activeSameType.approvedAt && !activeSameType.implementedAt)
        );
        if (detectorManaged) {
          if (detectorOwned) {
            activeSameType.source = recommendation.source || 'balanced-v2.1';
            activeSameType.ruleVersion = recommendation.ruleVersion || 'balanced-v2.1';
            activeSameType.fingerprint = recommendation.fingerprint;
            activeSameType.summary = recommendation.summary;
            activeSameType.hypothesis = recommendation.hypothesis;
            activeSameType.recommendation = recommendation.recommendation;
            activeSameType.successCriteria = recommendation.successCriteria;
          }
          activeSameType.priorityScore = recommendation.priorityScore;
          activeSameType.confidence = recommendation.confidence;
          activeSameType.expectedAdditionalClicks = recommendation.expectedAdditionalClicks;
          activeSameType.evidence = sanitizeDurableEvidence(recommendation.evidence);
          activeSameType.detectorActive = true;
          activeSameType.lastDetectedAt = now;
          activeSameType.clearedAt = null;
          activeSameType.autoResolved = false;
          if (detectorOwned) resurfaceExpiredSnooze(activeSameType, now);
          activeSameType.version += 1;
          await activeSameType.save();
        }
      }
      results.push(activeSameType);
      continue;
    }
    const action = await SeoAction.create({
      ...recommendation,
      evidence: sanitizeDurableEvidence(recommendation.evidence),
      state: 'proposed',
      detectorActive: true,
      lastDetectedAt: now,
      events: [{ event: 'detected', at: now, fromState: '', toState: 'proposed' }],
    });
    results.push(action);
  }
  if (progress && typeof progress === 'object') {
    Object.assign(progress, { processed, total: items.length, complete: processed === items.length });
  }
  return results;
}

async function reconcileDetectorRecommendations({
  evaluatedPageKeys,
  recommendations,
  querySafePageKeys = new Set(),
  eligibleTypesByPage = null,
  migrationEligibleTypesByPage = null,
  now = new Date(),
  deadlineMs = Infinity,
  clock = Date.now,
  progress = null,
} = {}) {
  const pageKeys = Array.from(new Set(evaluatedPageKeys || []));
  if (!pageKeys.length) {
    if (progress && typeof progress === 'object') {
      Object.assign(progress, { processed: 0, total: 0, complete: true });
    }
    return 0;
  }
  const emitted = new Set((recommendations || []).map((item) => `${item.pageKey}|${item.type}`));
  const candidates = await SeoAction.find({
    source: { $in: DETECTOR_SOURCES },
    state: 'proposed',
    pageKey: { $in: pageKeys },
  }).select('_id pageKey type source version').lean();
  let cleared = 0;
  let processed = 0;
  if (progress && typeof progress === 'object') {
    Object.assign(progress, { processed: 0, total: candidates.length, complete: candidates.length === 0 });
  }
  for (const action of candidates) {
    if (clock() >= deadlineMs) break;
    processed += 1;
    if (emitted.has(`${action.pageKey}|${action.type}`)) continue;
    const typeEligibility = action.source === 'balanced-v1' && migrationEligibleTypesByPage instanceof Map
      ? migrationEligibleTypesByPage
      : eligibleTypesByPage;
    if (typeEligibility instanceof Map) {
      const eligibleTypes = typeEligibility.get(action.pageKey);
      if (!(eligibleTypes instanceof Set) || !eligibleTypes.has(action.type)) continue;
    }
    if (['intent_mismatch', 'cannibalization'].includes(action.type) && !querySafePageKeys.has(action.pageKey)) continue;
    const result = await SeoAction.updateOne(
      {
        _id: action._id,
        source: { $in: DETECTOR_SOURCES },
        state: 'proposed',
        version: action.version,
      },
      {
        $set: {
          state: 'closed', detectorActive: false, autoResolved: true, clearedAt: now,
        },
        $inc: { version: 1 },
        $push: {
          events: {
            event: 'detector_cleared', at: now, fromState: 'proposed', toState: 'closed',
            note: 'A complete analysis run no longer detected this condition.',
          },
        },
      }
    );
    cleared += result.modifiedCount || 0;
  }
  if (progress && typeof progress === 'object') {
    Object.assign(progress, {
      processed,
      total: candidates.length,
      complete: processed === candidates.length,
    });
  }
  return cleared;
}

async function createManualAction(input, actorUserId, now = new Date()) {
  const canonicalUrl = validateFrontendAtlasUrl(input?.url);
  if (!canonicalUrl) throw new SeoActionError('url must be a canonical https://frontendatlas.com URL without credentials or a fragment');
  const title = String(input?.title || '').trim();
  const hypothesis = String(input?.hypothesis || '').trim();
  if (!title || !hypothesis) throw new SeoActionError('title and hypothesis are required');
  const pageKey = pageKeyForUrl(canonicalUrl);
  const type = String(input?.type || 'manual');
  if (!SeoAction.ACTION_TYPES.includes(type)) throw new SeoActionError('Unsupported action type');
  const implementedAt = input?.implementedAt ? new Date(input.implementedAt) : null;
  if (implementedAt && Number.isNaN(implementedAt.getTime())) throw new SeoActionError('implementedAt must be a valid date');
  if (input?.historicalUnverified && !implementedAt) {
    throw new SeoActionError('implementedAt is required for a historical action');
  }
  const historical = Boolean(input?.historicalUnverified);

  await SeoPage.findOneAndUpdate(
    { pageKey },
    {
      $set: { canonicalUrl, path: (() => { try { return new URL(canonicalUrl).pathname; } catch { return ''; } })(), lastSeenAt: now },
      $setOnInsert: { firstSeenAt: now },
    },
    { upsert: true }
  );

  return SeoAction.create({
    pageKey,
    canonicalUrl,
    type,
    state: historical ? 'closed' : 'proposed',
    source: historical ? 'historical' : 'owner',
    ruleVersion: 'owner-v1',
    fingerprint: sha256(['owner-v1', type, pageKey, title.toLowerCase(), implementedAt?.toISOString() || 'new'].join('|')),
    summary: title,
    hypothesis,
    changeSummary: String(input?.changeSummary || '').trim(),
    implementedAt,
    historicalUnverified: historical,
    confidence: 1,
    recommendation: { checklist: [] },
    successCriteria: { description: 'Owner-created actions require manual review.', ownerDefined: true },
    events: [{
      event: historical ? 'historical_recorded' : 'manual_created',
      at: now,
      actorUserId,
      fromState: '',
      toState: historical ? 'closed' : 'proposed',
    }],
  });
}

function transitionMutation(action, request, actorUserId, now, { priorFailedCtrCount = 0, implementationSnapshot = null } = {}) {
  const event = String(request?.event || '');
  const note = String(request?.note || '').trim();
  const fromState = action.state;
  const set = {};
  const unset = {};
  let toState;

  if (event === 'approve' && action.state === 'proposed') {
    toState = 'approved';
    set.approvedAt = now;
    set.experimentLockKey = action.pageKey;
    if (request.copyDirection != null) set['recommendation.copyDirection'] = String(request.copyDirection).trim();
    if (request.successCriteria != null) {
      const description = String(request.successCriteria).trim();
      if (description.length > 2000) throw new SeoActionError('successCriteria must be 2000 characters or fewer');
      const generatedDescription = successCriteriaText(action.successCriteria);
      set.successCriteria = description === generatedDescription
        ? { ...(plain(action.successCriteria) || {}), description }
        : { description, ownerDefined: true };
      set.ownerSuccessCriteriaText = description === generatedDescription ? '' : description;
    }
  } else if (event === 'mark_implemented' && action.state === 'approved') {
    const implementedAt = new Date(request.implementedAt || now);
    if (Number.isNaN(implementedAt.getTime())) throw new SeoActionError('implementedAt must be a valid date');
    if (!note) throw new SeoActionError('A change note is required when marking an action implemented');
    // A live fetch verifies current markup, but cannot prove which production
    // deployment Google crawled. Measurement starts after manifest lineage and
    // a strictly-later Google crawl confirm the scoped change.
    toState = 'implementation_pending';
    set.implementedAt = implementedAt;
    set.changeSummary = note;
    set.implementationSnapshot = implementationSnapshot || {};
    set.measurementWindow = {};
  } else if (event === 'snooze' && ['proposed', 'approved', 'implementation_pending'].includes(action.state)) {
    const days = Number(request.snoozeDays || 30);
    if (!ALLOWED_SNOOZE_DAYS.has(days)) throw new SeoActionError('snoozeDays must be 14, 30, 60, or 90');
    toState = 'snoozed';
    set.snoozedUntil = new Date(now.getTime() + days * DAY_MS);
    if (action.experimentLockKey) unset.experimentLockKey = 1;
  } else if (event === 'dismiss' && ['proposed', 'approved', 'implementation_pending', 'measuring'].includes(action.state)) {
    if (!note) throw new SeoActionError('A reason is required when dismissing an action');
    toState = 'dismissed';
    set.dismissedReason = note;
    if (action.experimentLockKey) unset.experimentLockKey = 1;
  } else if (event === 'acknowledge_verdict' && action.state === 'evaluated' && action.evaluation?.verdict) {
    toState = 'closed';
    if (action.experimentLockKey) unset.experimentLockKey = 1;
  } else if (event === 'override_verdict' && action.state === 'evaluated') {
    if (!['success', 'failed', 'inconclusive'].includes(request.verdict) || !note) {
      throw new SeoActionError('verdict and a reason are required for an override');
    }
    toState = 'closed';
    if (action.experimentLockKey) unset.experimentLockKey = 1;
    set.evaluation = { verdict: request.verdict, evaluatedAt: now, reason: note, ownerOverride: true };
    const previousVerdictContribution = action.evaluation?.verdict === 'failed' ? 1 : 0;
    const nextVerdictContribution = request.verdict === 'failed' ? 1 : 0;
    const nextFailureCount = Math.max(
      0,
      Number(action.failureCount || 0) - previousVerdictContribution + nextVerdictContribution
    );
    set.failureCount = nextFailureCount;
    if (action.type === 'ctr_snippet') {
      if (priorFailedCtrCount + nextFailureCount >= 2) {
        set.suppressedUntil = action.suppressedUntil || new Date(now.getTime() + 90 * DAY_MS);
      } else {
        set.suppressedUntil = null;
      }
    }
  } else if (event === 'reopen' && ['snoozed', 'dismissed', 'closed'].includes(action.state)) {
    toState = 'proposed';
    set.snoozedUntil = null;
    set.dismissedReason = '';
    set.approvedAt = null;
    set.implementedAt = null;
    set.changeSummary = '';
    set.implementationSnapshot = {};
    set.measurementWindow = {};
    set.measuringUntil = null;
    set.evaluation = { verdict: null, evaluatedAt: null, reason: '', ownerOverride: false };
    unset.experimentLockKey = 1;
  } else {
    throw new SeoActionError(`Transition ${event || '(missing)'} is not allowed from ${action.state}`, 409, 'SEO_ACTION_TRANSITION_CONFLICT');
  }

  return {
    set: { ...set, state: toState },
    unset,
    event: { event, at: now, actorUserId, fromState, toState, note },
  };
}

async function activatePendingMeasurements({ pageKeys, observedDate, now = new Date() }) {
  const uniquePageKeys = Array.from(new Set((pageKeys || []).filter(Boolean)));
  if (!uniquePageKeys.length || !observedDate) return 0;
  const endOfObservedDate = new Date(`${observedDate}T23:59:59.999Z`);
  const pending = await SeoAction.find({
    pageKey: { $in: uniquePageKeys },
    state: 'implementation_pending',
    implementedAt: { $lte: endOfObservedDate },
  }).lean();
  if (!pending.length) return 0;
  const pages = await SeoPage.find({ pageKey: { $in: pending.map((action) => action.pageKey) } }).lean();
  const byPageKey = new Map(pages.map((page) => [page.pageKey, page]));
  let activated = 0;
  for (const action of pending) {
    const anchor = measurementAnchorForAction(byPageKey.get(action.pageKey), action);
    if (!anchor || anchor.googleCrawlAt > endOfObservedDate) continue;
    const measurementWindow = measurementWindowForAnchor(anchor);
    const result = await SeoAction.updateOne(
      { _id: action._id, version: action.version, state: 'implementation_pending' },
      {
        $set: {
          state: 'measuring',
          'implementationSnapshot.verification': {
            verifiedBy: 'manifest-fingerprint-and-gsc-crawl',
            observedDate,
            verifiedAt: now,
            productionEffectiveAt: anchor.productionEffectiveAt,
            googleCrawlAt: anchor.googleCrawlAt,
            detectorVersionKey: anchor.detectorVersionKey,
            detectorOccurrenceKey: anchor.detectorOccurrenceKey,
            changedComponents: anchor.changedComponents,
            componentHashes: anchor.componentHashes,
          },
          measurementWindow,
          measuringUntil: new Date(`${measurementWindow.afterEndDate}T23:59:59.999Z`),
        },
        $inc: { version: 1 },
        $push: {
          events: {
            event: 'implementation_observed',
            at: now,
            fromState: 'implementation_pending',
            toState: 'measuring',
            note: 'The scoped production fingerprint changed and Google crawled it before the finalized measurement slice.',
          },
        },
      }
    );
    activated += result.modifiedCount || 0;
  }
  return activated;
}

function validActionDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function measurementWindowForAnchor(anchor) {
  const productionDate = dateKeyInTimezone(anchor.productionEffectiveAt, GSC_TIMEZONE);
  const crawlDate = dateKeyInTimezone(anchor.googleCrawlAt, GSC_TIMEZONE);
  const beforeEndDate = shiftDateKey(productionDate, -1);
  const afterStartDate = shiftDateKey(crawlDate, 1);
  return {
    timezone: GSC_TIMEZONE,
    productionDate,
    crawlDate,
    beforeStartDate: shiftDateKey(beforeEndDate, -27),
    beforeEndDate,
    afterStartDate,
    afterEndDate: shiftDateKey(afterStartDate, 27),
  };
}

function measurementAnchorForAction(page, action) {
  const detector = page?.changeTracking?.detectors?.[action?.type];
  if (
    !detector
    || detector.awaitingManifestChange === true
    || detector.awaitingSourceRecrawl === true
    || detector.sourceRecrawlNotEvaluable === true
  ) return null;
  const productionEffectiveAt = validActionDate(detector.productionEffectiveAt);
  const googleCrawlAt = validActionDate(detector.confirmedCrawlAt);
  const attributionLowerBound = validActionDate(action?.approvedAt)
    || validActionDate(action?.implementedAt);
  const expectedComponents = ACTION_CHANGED_COMPONENTS[action?.type] || ['mainContent'];
  const observedComponents = new Set((detector.changedComponents || []).map(String));
  const componentMatches = expectedComponents.some((component) => observedComponents.has(component));
  if (!productionEffectiveAt || !googleCrawlAt || googleCrawlAt <= productionEffectiveAt) return null;
  if (attributionLowerBound && productionEffectiveAt <= attributionLowerBound) return null;
  if (!componentMatches) return null;
  const componentHashes = Object.fromEntries((detector.changedComponents || []).flatMap((component) => {
    const hash = String(
      detector.changedComponentHashes?.[component]
      || page?.changeTracking?.trustedComponentHashes?.[component]
      || page?.changeTracking?.componentHashes?.[component]
      || ''
    );
    return /^[a-f0-9]{64}$/i.test(hash) ? [[String(component), hash.toLowerCase()]] : [];
  }));
  return {
    productionEffectiveAt,
    googleCrawlAt,
    detectorVersionKey: String(detector.versionKey || ''),
    detectorOccurrenceKey: String(detector.occurrenceKey || ''),
    changedComponents: Array.from(new Set((detector.changedComponents || []).map(String))),
    componentHashes,
  };
}

function meaningfulInspectionSnapshot(snapshot) {
  const data = snapshot?.data;
  if (!data || typeof data !== 'object') return false;
  return data.indexStatus !== 'UNKNOWN'
    || Boolean(data.coverageState)
    || data.robots !== 'UNKNOWN'
    || ['match', 'mismatch'].includes(data.canonicalVerdict);
}

async function activateTechnicalMeasurementsFromInspections({ snapshots, now = new Date() } = {}) {
  const activatedAt = new Date(now);
  if (Number.isNaN(activatedAt.getTime())) throw new TypeError('A valid activation time is required');
  const latestByPage = new Map();
  for (const snapshot of Array.isArray(snapshots) ? snapshots : []) {
    const pageKey = String(snapshot?.pageKey || '');
    const observedAt = new Date(snapshot?.observedAt);
    if (!pageKey || Number.isNaN(observedAt.getTime()) || !meaningfulInspectionSnapshot(snapshot)) continue;
    const current = latestByPage.get(pageKey);
    if (!current || observedAt > current.observedAt) latestByPage.set(pageKey, { observedAt, data: snapshot.data });
  }

  const pending = await SeoAction.find({
    pageKey: { $in: Array.from(latestByPage.keys()) },
    type: 'technical_indexing',
    state: 'implementation_pending',
  }).lean();
  const pages = pending.length
    ? await SeoPage.find({ pageKey: { $in: pending.map((action) => action.pageKey) } }).lean()
    : [];
  const pageByKey = new Map(pages.map((page) => [page.pageKey, page]));
  let activated = 0;
  for (const [pageKey, snapshot] of latestByPage) {
    const actions = pending.filter((action) => action.pageKey === pageKey);
    for (const action of actions) {
      const anchor = measurementAnchorForAction(pageByKey.get(pageKey), action);
      if (!anchor || snapshot.observedAt < anchor.googleCrawlAt) continue;
      const measurementWindow = measurementWindowForAnchor(anchor);
      const result = await SeoAction.updateOne(
        { _id: action._id, version: action.version, state: 'implementation_pending' },
        {
        $set: {
          state: 'measuring',
          'implementationSnapshot.verification': {
            verifiedBy: 'gsc-url-inspection-after-deploy',
            observedAt: snapshot.observedAt,
            indexStatus: snapshot.data.indexStatus,
            canonicalVerdict: snapshot.data.canonicalVerdict,
            productionEffectiveAt: anchor.productionEffectiveAt,
            googleCrawlAt: anchor.googleCrawlAt,
            detectorVersionKey: anchor.detectorVersionKey,
            detectorOccurrenceKey: anchor.detectorOccurrenceKey,
            changedComponents: anchor.changedComponents,
            componentHashes: anchor.componentHashes,
          },
          measurementWindow,
          measuringUntil: new Date(`${measurementWindow.afterEndDate}T23:59:59.999Z`),
        },
        $inc: { version: 1 },
        $push: {
          events: {
            event: 'implementation_observed',
            at: activatedAt,
            fromState: 'implementation_pending',
            toState: 'measuring',
            note: 'URL Inspection confirmed Google crawled the scoped production fingerprint.',
          },
        },
      }
      );
      activated += result.modifiedCount || 0;
    }
  }
  return activated;
}

async function transitionAction(actionId, request, actorUserId, now = new Date(), dependencies = {}) {
  const expectedVersion = Number(request?.expectedVersion);
  if (!Number.isInteger(expectedVersion) || expectedVersion < 0) throw new SeoActionError('expectedVersion is required');
  const action = await SeoAction.findById(actionId);
  if (!action) throw new SeoActionError('Action not found', 404, 'SEO_ACTION_NOT_FOUND');
  if (action.version !== expectedVersion) throw new SeoActionError('Action changed since it was loaded', 409, 'SEO_ACTION_VERSION_CONFLICT');
  if (request.event === 'approve') {
    const concurrent = await SeoAction.exists({
      _id: { $ne: action._id },
      pageKey: action.pageKey,
      state: { $in: ['approved', 'implementation_pending', 'measuring'] },
    });
    if (concurrent) {
      throw new SeoActionError('This page already has an active approved or measuring action', 409, 'SEO_PAGE_EXPERIMENT_ACTIVE');
    }
  }
  let priorFailedCtrCount = 0;
  if (action.type === 'ctr_snippet' && request.event === 'override_verdict' && request.verdict === 'failed') {
    const totals = await SeoAction.aggregate([
      { $match: { _id: { $ne: action._id }, pageKey: action.pageKey, type: 'ctr_snippet' } },
      { $group: { _id: null, attempts: { $sum: '$failureCount' } } },
    ]);
    priorFailedCtrCount = Number(totals[0]?.attempts || 0);
  }
  let implementationSnapshot = null;
  if (request.event === 'mark_implemented') {
    const captureMetadata = dependencies.captureMetadata || captureLiveMetadataSnapshot;
    try {
      const snapshot = await captureMetadata(action.canonicalUrl, { now: () => now });
      implementationSnapshot = {
        hash: snapshot.hash,
        fields: snapshot.fields,
        finalUrl: snapshot.finalUrl,
        observedAt: snapshot.observedAt,
        source: 'live_metadata',
      };
    } catch {
      implementationSnapshot = { observedAt: now, source: 'owner_confirmation', unavailable: true };
    }
  }
  const mutation = transitionMutation(action, request, actorUserId, now, { priorFailedCtrCount, implementationSnapshot });
  const update = { $set: mutation.set, $inc: { version: 1 }, $push: { events: mutation.event } };
  if (Object.keys(mutation.unset).length) update.$unset = mutation.unset;
  let updated;
  try {
    updated = await SeoAction.findOneAndUpdate(
      { _id: action._id, version: expectedVersion },
      update,
      { new: true, runValidators: true }
    );
  } catch (error) {
    if (request.event === 'approve' && Number(error?.code) === 11000) {
      throw new SeoActionError('This page already has an active approved or measuring action', 409, 'SEO_PAGE_EXPERIMENT_ACTIVE');
    }
    throw error;
  }
  if (!updated) throw new SeoActionError('Action changed since it was loaded', 409, 'SEO_ACTION_VERSION_CONFLICT');
  if (request.event === 'override_verdict' && action.type === 'ctr_snippet') {
    const totals = await SeoAction.aggregate([
      { $match: { pageKey: action.pageKey, type: 'ctr_snippet' } },
      { $group: { _id: null, attempts: { $sum: '$failureCount' } } },
    ]);
    if (Number(totals[0]?.attempts || 0) < 2) {
      await SeoAction.updateMany(
        { pageKey: action.pageKey, type: 'ctr_snippet', suppressedUntil: { $ne: null } },
        { $set: { suppressedUntil: null } }
      );
      updated.suppressedUntil = null;
    }
  }
  if (request.event === 'mark_implemented' && implementationSnapshot?.fields) {
    try {
      await SeoDiagnosticSnapshot.create({
        siteUrl: String(process.env.GSC_SITE_URL || 'sc-domain:frontendatlas.com'),
        pageKey: action.pageKey,
        kind: 'liveMetadata',
        observedAt: implementationSnapshot.observedAt || now,
        data: { hash: implementationSnapshot.hash, fields: implementationSnapshot.fields },
        expiresAt: new Date(now.getTime() + 90 * DAY_MS),
      });
    } catch {
      // The action carries the attribution snapshot itself. A secondary
      // diagnostic-history write must not turn a committed transition into a
      // false 500 response.
    }
  }
  if (request.event === 'mark_implemented') {
    const implementationReportedAt = updated.implementedAt || now;
    try {
      const page = await SeoPage.findOne({ pageKey: action.pageKey }).lean();
      if (page) {
        const changedComponents = ACTION_CHANGED_COMPONENTS[action.type] || ['mainContent'];
        const priorTracking = page.changeTracking || {};
        const priorDetectors = priorTracking.detectors || {};
        const scopedDetector = ACTION_CHANGED_COMPONENTS[action.type] ? action.type : 'content_decay';
        const priorDetector = priorDetectors[scopedDetector] || {};
        const priorEffectiveAt = priorDetector.productionEffectiveAt
          ? new Date(priorDetector.productionEffectiveAt)
          : null;
        const attributionLowerBound = action.approvedAt || implementationReportedAt;
        const observedComponents = new Set((priorDetector.changedComponents || []).map(String));
        const componentMatches = changedComponents.some((component) => observedComponents.has(component));
        const deployAlreadyObserved = Boolean(
          priorEffectiveAt
          && !Number.isNaN(priorEffectiveAt.getTime())
          && priorEffectiveAt > attributionLowerBound
          && componentMatches
          && priorDetector.awaitingProductionEvidence !== true
        );
        const detectors = {
          ...priorDetectors,
          [scopedDetector]: {
            ...priorDetector,
            implementationReportedAt,
            expectedChangedComponents: changedComponents,
            awaitingManifestChange: !deployAlreadyObserved,
          },
        };
        const nextTracking = {
          ...priorTracking,
          analysisInvalidatedAt: now,
          // Owner confirmation is evidence that an implementation exists, not
          // evidence that it is live. The next manifest fingerprint/deployment
          // observation establishes the production anchor and starts cooldown.
          materialChangeKind: 'owner_action_pending_deployment',
          detectors,
        };
        nextTracking.analysisInputHash = analysisInputHashForPage({
          ...page,
          changeTracking: nextTracking,
        });
        await SeoPage.updateOne({ pageKey: action.pageKey }, { $set: {
          'changeTracking.analysisInvalidatedAt': nextTracking.analysisInvalidatedAt,
          'changeTracking.materialChangeKind': nextTracking.materialChangeKind,
          [`changeTracking.detectors.${scopedDetector}`]: detectors[scopedDetector],
          'changeTracking.analysisInputHash': nextTracking.analysisInputHash,
        } });
      }
    } catch {
      // The action transition is already committed. The next manifest pass can
      // rediscover the material hash; never return a false transition failure.
    }
  }
  return updated;
}

module.exports = {
  ACTIVE_STATES,
  SeoActionError,
  activatePendingMeasurements,
  activateTechnicalMeasurementsFromInspections,
  createManualAction,
  reconcileDetectorRecommendations,
  serializeAction,
  serializeEvidence,
  sanitizeDurableEvidence,
  transitionAction,
  transitionMutation,
  upsertRecommendations,
};
