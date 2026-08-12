'use strict';

const crypto = require('crypto');
const { dateKeyInTimezone, inclusiveDateCount, shiftDateKey } = require('./dates');

const MIN_PRIOR_IMPRESSIONS = 300;
const MIN_PRIOR_VISIBLE_DAYS = 7;
const MIN_ZERO_IMPRESSION_STREAK = 7;
const MIN_SHARE_DROP = 0.7;

function finite(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function ratio(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : 0;
}

function clamp(value, minimum = 0, maximum = 1) {
  return Math.max(minimum, Math.min(maximum, finite(value)));
}

function normalizedDay(day = {}) {
  return {
    date: String(day.date || ''),
    pageImpressions: Math.max(0, finite(day.pageImpressions ?? day.page?.impressions)),
    propertyImpressions: Math.max(0, finite(day.propertyImpressions ?? day.property?.impressions)),
    pagePartitionComplete: day.pagePartitionComplete === true,
    propertyPartitionComplete: day.propertyPartitionComplete === true,
  };
}

function completeDay(day) {
  return day.pagePartitionComplete && day.propertyPartitionComplete;
}

function summarize(days) {
  return days.reduce((total, day) => {
    total.pageImpressions += day.pageImpressions;
    total.propertyImpressions += day.propertyImpressions;
    if (day.pageImpressions > 0) total.visibleDays += 1;
    if (day.propertyImpressions > 0) total.siteActiveDays += 1;
    return total;
  }, {
    pageImpressions: 0,
    propertyImpressions: 0,
    visibleDays: 0,
    siteActiveDays: 0,
  });
}

function zeroStreaks(days) {
  let current = 0;
  let longest = 0;
  let trailing = 0;
  for (const day of days) {
    if (completeDay(day) && day.propertyImpressions > 0 && day.pageImpressions === 0) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  for (let index = days.length - 1; index >= 0; index -= 1) {
    const day = days[index];
    if (!(completeDay(day) && day.propertyImpressions > 0 && day.pageImpressions === 0)) break;
    trailing += 1;
  }
  return { longest, trailing };
}

function unavailableResult(reasonCodes, evidence = {}) {
  return {
    state: 'not_evaluable',
    disposition: 'insufficient_evidence',
    reasonCodes,
    patternConfidence: 0,
    causeConfidence: 0,
    evidence,
    requiresInspection: false,
    interrupted: false,
    nextReview: {
      mode: 'event',
      event: 'coverage_threshold',
      rationale: reasonCodes[0] || 'visibility_evidence_unavailable',
    },
  };
}

function validDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function inspectionIdentity({ inspection = {}, observedAt, crawlAt, data = {} }) {
  const sourceId = inspection?._id ? String(inspection._id) : '';
  return crypto.createHash('sha256').update(JSON.stringify([
    sourceId,
    observedAt?.toISOString?.() || '',
    crawlAt?.toISOString?.() || '',
    String(data.pageVersionKey || ''),
    String(data.indexStatus || '').toUpperCase(),
    String(data.robots || '').toUpperCase(),
    String(data.canonicalVerdict || '').toLowerCase(),
  ])).digest('hex');
}

function normalizedAcceptedInspection(value) {
  if (!value || typeof value !== 'object') return null;
  const observedAt = validDate(value.observedAt);
  if (!observedAt || !/^[a-f0-9]{64}$/.test(String(value.key || ''))) return null;
  const indexStatus = String(value.indexStatus || '').toUpperCase();
  const robots = String(value.robots || '').toUpperCase();
  const canonicalVerdict = String(value.canonicalVerdict || '').toLowerCase();
  const anomaly = value.verdict === 'anomaly'
    || indexStatus === 'FAIL'
    || robots === 'BLOCKED'
    || canonicalVerdict === 'mismatch';
  const pass = value.verdict === 'pass' && !anomaly;
  if (!pass && !anomaly) return null;
  return {
    key: String(value.key),
    observedAt,
    crawlAt: validDate(value.crawlAt),
    reportedVersionKey: String(value.pageVersionKey || ''),
    indexStatus,
    robots,
    canonicalVerdict,
    exactVersionMatch: value.exactVersionMatch === true,
    anomaly,
    pass,
    persisted: true,
  };
}

function acceptedInspectionRecord(inspection) {
  if (!inspection) return null;
  return {
    key: inspection.key,
    observedAt: inspection.observedAt,
    crawlAt: inspection.crawlAt || null,
    pageVersionKey: inspection.reportedVersionKey || '',
    indexStatus: inspection.indexStatus,
    robots: inspection.robots,
    canonicalVerdict: inspection.canonicalVerdict,
    verdict: inspection.anomaly ? 'anomaly' : 'pass',
    exactVersionMatch: inspection.exactVersionMatch === true,
  };
}

function currentInspectionEvidence({
  inspection,
  currentVersionKey = '',
  productionEffectiveAt = null,
  previousInterruptionEvaluatedAt = null,
  inspectionRequestAt = null,
  acceptedInspection = null,
  requirePreviousInterruptionRequest = false,
} = {}) {
  const requestBoundaryAt = validDate(inspectionRequestAt)
    || validDate(previousInterruptionEvaluatedAt);
  const productionAt = validDate(productionEffectiveAt);
  const expectedVersionKey = String(currentVersionKey || '');
  const persisted = normalizedAcceptedInspection(acceptedInspection);
  const persistedCurrent = persisted && (
    !expectedVersionKey
    || (persisted.reportedVersionKey && persisted.reportedVersionKey === expectedVersionKey)
  ) ? persisted : null;

  // Visibility interruption has a request/response lifecycle. On its first
  // detection, an older snapshot must not satisfy the newly-created
  // inspection request merely because it happens to describe the same page
  // version. The next analysis may consume only evidence observed after the
  // persisted interruption packet. Generic technical checks keep the normal
  // version/production validation by leaving this flag disabled.
  if (requirePreviousInterruptionRequest && !requestBoundaryAt) return null;

  let snapshot = null;
  if (inspection && typeof inspection === 'object') {
    const observedAt = validDate(inspection.observedAt);
    const data = inspection.data && typeof inspection.data === 'object'
      ? inspection.data
      : inspection;
    if (observedAt && data && typeof data === 'object') {
      const reportedVersionKey = String(data.pageVersionKey || '');
      const exactVersionMatch = Boolean(
        expectedVersionKey && reportedVersionKey && reportedVersionKey === expectedVersionKey
      );
      const crawlAt = validDate(data.lastCrawlTime);
      const afterRequest = Boolean(requestBoundaryAt && observedAt > requestBoundaryAt);
      const afterCurrentProduction = Boolean(
        productionAt
        && observedAt >= productionAt
        && crawlAt
        && crawlAt > productionAt
      );
      const current = requestBoundaryAt
        ? afterRequest && (exactVersionMatch || afterCurrentProduction || !expectedVersionKey)
        : exactVersionMatch || afterCurrentProduction;
      const indexStatus = String(data.indexStatus || '').toUpperCase();
      const robots = String(data.robots || '').toUpperCase();
      const canonicalVerdict = String(data.canonicalVerdict || '').toLowerCase();
      const anomaly = indexStatus === 'FAIL'
        || robots === 'BLOCKED'
        || canonicalVerdict === 'mismatch';
      const pass = indexStatus === 'PASS' && !anomaly;
      // A current snapshot with an unknown verdict is still unverified evidence.
      // It cannot supersede a previously accepted definitive result.
      if (current && (pass || anomaly)) {
        snapshot = {
          key: inspectionIdentity({ inspection, observedAt, crawlAt, data }),
          observedAt,
          crawlAt,
          reportedVersionKey,
          indexStatus,
          robots,
          canonicalVerdict,
          exactVersionMatch,
          anomaly,
          pass,
          persisted: false,
        };
      }
    }
  }

  if (!snapshot) return persistedCurrent;
  if (!persistedCurrent) return snapshot;
  return snapshot.observedAt >= persistedCurrent.observedAt ? snapshot : persistedCurrent;
}

function postInspectionResult({ base, inspection, endDate }) {
  const evidence = { ...(base.evidence || {}) };
  const inspectionLifecycle = {
    ...(base.inspectionLifecycle || {}),
    accepted: acceptedInspectionRecord(inspection),
  };
  if (inspection.anomaly) {
    return {
      ...base,
      state: 'watch',
      disposition: 'investigate',
      reasonCodes: ['visibility_interruption', 'visibility_inspection_anomaly'],
      causeConfidence: 0.75,
      evidence: {
        ...evidence,
        inspectionCurrent: true,
        inspectionPass: false,
      },
      requiresInspection: false,
      inspectionLifecycle,
      decisionGate: 'technical_indexing_anomaly',
      nextReview: {
        mode: 'event',
        event: 'post_deploy_crawl',
        rationale: 'resolve_inspection_anomaly_then_confirm_crawl',
      },
    };
  }
  if (!inspection.pass) return base;

  const crawlDate = inspection.crawlAt
    ? dateKeyInTimezone(inspection.crawlAt, 'America/Los_Angeles')
    : null;
  const cleanWindowStartDate = crawlDate ? shiftDateKey(crawlDate, 1) : null;
  const cleanFinalizedDays = cleanWindowStartDate && endDate && endDate >= cleanWindowStartDate
    ? inclusiveDateCount(cleanWindowStartDate, endDate)
    : 0;
  const diagnosisRequired = cleanFinalizedDays >= 28;
  const nextReview = cleanFinalizedDays < 14
    ? {
      mode: 'event',
      event: '14_finalized_days',
      rationale: 'observe_initial_post_inspection_recovery_window',
    }
    : cleanFinalizedDays < 28
      ? {
        mode: 'event',
        event: '28_finalized_days',
        rationale: 'observe_full_post_inspection_recovery_window',
      }
      : {
        mode: 'event',
        event: 'next_finalized_sync',
        rationale: 'diagnose_persistent_visibility_interruption',
      };
  const decisionGate = cleanFinalizedDays < 14
    ? 'post_inspection_14_finalized_days'
    : cleanFinalizedDays < 28
      ? 'post_inspection_28_finalized_days'
      : 'visibility_interruption_requires_diagnosis';
  return {
    ...base,
    state: 'watch',
    disposition: diagnosisRequired ? 'investigate' : 'monitor',
    reasonCodes: ['visibility_interruption', 'visibility_inspection_passed', decisionGate],
    causeConfidence: 0.1,
    evidence: {
      ...evidence,
      inspectionCurrent: true,
      inspectionPass: true,
      cleanFinalizedDays,
      cleanWindowStartDate,
    },
    requiresInspection: false,
    inspectionLifecycle,
    decisionGate,
    nextReview,
  };
}

/**
 * Detects a page-level visibility interruption without manufacturing zero rows.
 * A missing page row is treated as zero only when both the page and property
 * partitions for that date are explicitly marked complete by the caller.
 */
function assessVisibilityInterruption({
  days = [],
  currentStart,
  previousStart,
  endDate,
  requiredWindowDays = 28,
  inspection = null,
  currentVersionKey = '',
  productionEffectiveAt = null,
  previousInterruptionEvaluatedAt = null,
  previousVisibility = null,
  evaluatedAt = null,
} = {}) {
  const normalized = (Array.isArray(days) ? days : [])
    .map(normalizedDay)
    .filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day.date))
    .sort((left, right) => left.date.localeCompare(right.date));
  const previous = normalized.filter((day) => day.date >= previousStart && day.date < currentStart);
  const current = normalized.filter((day) => day.date >= currentStart && day.date <= endDate);
  const evidence = {
    firstVisibleDate: normalized.find((day) => day.pageImpressions > 0)?.date || null,
    completePreviousDays: previous.filter(completeDay).length,
    completeCurrentDays: current.filter(completeDay).length,
  };

  if (
    !currentStart
    || !previousStart
    || !endDate
    || evidence.completePreviousDays !== requiredWindowDays
    || evidence.completeCurrentDays !== requiredWindowDays
  ) {
    return unavailableResult(['visibility_partitions_incomplete'], evidence);
  }

  const previousTotals = summarize(previous);
  const currentTotals = summarize(current);
  const previousShare = ratio(previousTotals.pageImpressions, previousTotals.propertyImpressions);
  const currentShare = ratio(currentTotals.pageImpressions, currentTotals.propertyImpressions);
  const shareDrop = previousShare > 0 ? (previousShare - currentShare) / previousShare : 0;
  const streaks = zeroStreaks(current);
  const mature = previousTotals.pageImpressions >= MIN_PRIOR_IMPRESSIONS
    && previousTotals.visibleDays >= MIN_PRIOR_VISIBLE_DAYS;
  Object.assign(evidence, {
    previous: previousTotals,
    current: currentTotals,
    previousShare,
    currentShare,
    shareDrop,
    zeroImpressionStreak: streaks.longest,
    trailingZeroImpressionStreak: streaks.trailing,
    mature,
  });

  if (!mature) {
    const firstVisibleInCurrentWindow = Boolean(
      evidence.firstVisibleDate && evidence.firstVisibleDate >= currentStart
    );
    return unavailableResult([
      firstVisibleInCurrentWindow ? 'new_or_ramping_page' : 'visibility_prior_floor_unmet',
    ], evidence);
  }

  const interrupted = streaks.longest >= MIN_ZERO_IMPRESSION_STREAK && shareDrop >= MIN_SHARE_DROP;
  if (!interrupted) {
    return {
      state: 'clear',
      disposition: 'no_change',
      reasonCodes: ['no_visibility_interruption'],
      patternConfidence: 0.78,
      causeConfidence: 0,
      evidence,
      requiresInspection: false,
      interrupted: false,
      nextReview: null,
    };
  }

  const patternConfidence = clamp(
    0.7
      + Math.min(0.12, (streaks.longest - MIN_ZERO_IMPRESSION_STREAK) * 0.015)
      + Math.min(0.08, Math.max(0, shareDrop - MIN_SHARE_DROP) * 0.25)
      + Math.min(0.05, previousTotals.pageImpressions / 20_000)
  );
  const base = {
    state: 'watch',
    disposition: 'investigate',
    reasonCodes: ['visibility_interruption', 'url_inspection_required'],
    patternConfidence,
    // GSC proves the interruption pattern, not its cause. Inspection is the
    // first causal evidence gate, so cause confidence intentionally stays low.
    causeConfidence: 0.2,
    evidence,
    requiresInspection: true,
    interrupted: true,
    inspectionLifecycle: {
      requestBoundaryAt: validDate(previousVisibility?.inspectionLifecycle?.requestBoundaryAt)
        || validDate(previousInterruptionEvaluatedAt)
        || validDate(evaluatedAt)
        || new Date(),
      accepted: normalizedAcceptedInspection(previousVisibility?.inspectionLifecycle?.accepted)
        ? previousVisibility.inspectionLifecycle.accepted
        : null,
    },
    nextReview: {
      mode: 'event',
      event: 'url_inspection',
      rationale: 'confirm_index_and_crawl_state',
    },
  };
  const currentInspection = currentInspectionEvidence({
    inspection,
    currentVersionKey,
    productionEffectiveAt,
    previousInterruptionEvaluatedAt,
    inspectionRequestAt: base.inspectionLifecycle.requestBoundaryAt,
    acceptedInspection: base.inspectionLifecycle.accepted,
    requirePreviousInterruptionRequest: true,
  });
  return currentInspection
    ? postInspectionResult({ base, inspection: currentInspection, endDate })
    : base;
}

module.exports = {
  MIN_PRIOR_IMPRESSIONS,
  MIN_PRIOR_VISIBLE_DAYS,
  MIN_SHARE_DROP,
  MIN_ZERO_IMPRESSION_STREAK,
  assessVisibilityInterruption,
  currentInspectionEvidence,
};
