const ActivityCompletion = require('../../models/ActivityCompletion');
const EditorAssistAttempt = require('../../models/EditorAssistAttempt');
const PracticeProgress = require('../../models/PracticeProgress');
const WeeklyGoalBonusCredit = require('../../models/WeeklyGoalBonusCredit');
const { APP_TIMEZONE, SOLVE_KINDS, WEEKLY_GOAL_BONUS_XP } = require('./constants');
const {
  readWeeklyGoalSettings,
  computeLevel,
  readStreakVisibility,
  readDailyChallengeTech,
} = require('./engine');
const { currentWeekBounds, dayKeyInTimezone } = require('./timezone');
const { loadQuestionCatalog } = require('./question-catalog');
const { loadPracticeCatalog } = require('./practice-catalog');
const {
  bucketKey: essentialBucketKey,
  loadEssentialPriority,
  questionKey: essentialQuestionKey,
} = require('./essential-priority');
const {
  analyzeQuestionCoverage,
  getQuestionReadinessBucket,
  questionMatchesBucket,
} = require('./readiness-buckets');
const { ensureCurrentWeeklyGoalState } = require('./weekly-goal-state');
const { buildAchievements } = require('./achievements');
const { loadUserAchievementRecords } = require('./achievement-awards');

const PREP_GOAL_TECHS = ['javascript', 'react', 'angular', 'vue', 'html', 'css'];
const PREP_GOAL_LEVELS = ['foundation', 'intermediate', 'senior'];
const READINESS_LEVEL_PROFILES = {
  foundation: {
    label: 'Foundation',
    targets: { coding: 8, concepts: 12, debug: 1, tradeoffs: 1 },
    breadth: { coding: 3, concepts: 3 },
    difficulty: {},
  },
  intermediate: {
    label: 'Intermediate',
    targets: { coding: 12, concepts: 20, debug: 3, tradeoffs: 3 },
    breadth: { coding: 4, concepts: 5 },
    difficulty: { advanced: 6 },
  },
  senior: {
    label: 'Senior',
    targets: { coding: 18, concepts: 28, debug: 4, tradeoffs: 4 },
    breadth: { coding: 6, concepts: 7 },
    difficulty: { advanced: 12, hard: 4 },
  },
};
const READINESS_WEIGHTS = {
  coding: 30,
  concepts: 25,
  debug: 15,
  tradeoffs: 15,
  consistency: 15,
};
const READINESS_BUCKET_CAPS = {
  coding: 3,
  concepts: 5,
};
const ADVANCED_DIFFICULTIES = new Set(['intermediate', 'hard']);
const FRESHNESS_FULL_CREDIT_DAYS = 180;
const FRESHNESS_AGING_CREDIT_DAYS = 365;
const FRESHNESS_STALE_CREDIT_DAYS = 730;
const FEEDBACK_WINDOW_DAYS = 45;
const JAVASCRIPT_FEEDBACK_LANGS = ['js', 'ts'];
const DAY_MS = 24 * 60 * 60 * 1000;
const TECH_LABELS = {
  javascript: 'JavaScript',
  react: 'React',
  angular: 'Angular',
  vue: 'Vue',
  html: 'HTML',
  css: 'CSS',
};

function toTitleCase(input) {
  return String(input || '')
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function techLabel(tech) {
  const normalized = String(tech || '').trim().toLowerCase();
  return TECH_LABELS[normalized] || toTitleCase(normalized);
}

function normalizedPrepGoalLevel(value) {
  return sanitizePrepGoalLevel(value) || 'intermediate';
}

function pluralizeCountLabel(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function targetProfileSummary(profile) {
  const pieces = [];
  if (profile.targets.coding) {
    pieces.push(pluralizeCountLabel(profile.targets.coding, 'coding', 'coding'));
  }
  pieces.push(pluralizeCountLabel(profile.targets.concepts, 'concept'));
  const debugLabel = profile.availabilityCapped?.debug
    ? 'currently available JS debug scenario'
    : 'JS debug scenario';
  const debugPlural = profile.availabilityCapped?.debug
    ? 'currently available JS debug scenarios'
    : 'JS debug scenarios';
  const tradeoffLabel = profile.availabilityCapped?.tradeoffs
    ? 'currently available JS tradeoff'
    : 'JS tradeoff';
  const tradeoffPlural = profile.availabilityCapped?.tradeoffs
    ? 'currently available JS tradeoffs'
    : 'JS tradeoffs';
  pieces.push(pluralizeCountLabel(profile.targets.debug, debugLabel, debugPlural));
  pieces.push(pluralizeCountLabel(profile.targets.tradeoffs, tradeoffLabel, tradeoffPlural));
  if (profile.difficulty.advanced) {
    pieces.push(`${profile.difficulty.advanced} intermediate/hard drills`);
  }
  if (profile.difficulty.hard) {
    pieces.push(pluralizeCountLabel(profile.difficulty.hard, 'hard drill'));
  }
  return `${profile.label} JavaScript target: ${pieces.join(', ')}.`;
}

function prepTargetProfile(goalOrTech) {
  const level = normalizedPrepGoalLevel(typeof goalOrTech === 'string' ? undefined : goalOrTech?.level);
  const levelProfile = READINESS_LEVEL_PROFILES[level] || READINESS_LEVEL_PROFILES.intermediate;
  const profile = {
    id: 'javascript-core',
    level,
    label: levelProfile.label,
    conceptOnly: false,
    weights: READINESS_WEIGHTS,
    targets: { ...levelProfile.targets },
    breadth: { ...levelProfile.breadth },
    difficulty: { ...levelProfile.difficulty },
  };
  profile.summary = targetProfileSummary(profile);
  return profile;
}

function prepTargetProfilePayload(profile) {
  return {
    label: profile.label,
    summary: profile.summary,
    targets: profile.targets,
    breadth: profile.breadth,
    difficulty: profile.difficulty,
    conceptOnly: profile.conceptOnly,
  };
}

function sanitizePrepGoalTech(value) {
  const tech = String(value || '').trim().toLowerCase();
  return PREP_GOAL_TECHS.includes(tech) ? tech : null;
}

function sanitizePrepGoalLevel(value) {
  const level = String(value || '').trim().toLowerCase();
  return PREP_GOAL_LEVELS.includes(level) ? level : null;
}

function levelLabel(level) {
  if (level === 'foundation') return 'foundation';
  if (level === 'senior') return 'senior';
  return 'intermediate';
}

function buildPrepGoal(user) {
  const level = sanitizePrepGoalLevel(user?.prefs?.prepGoal?.level) || 'intermediate';
  const tech = 'javascript';

  return {
    tech,
    level,
    label: `${techLabel(tech)} ${levelLabel(level)} prep`,
  };
}

function buildReadinessComponent({
  id,
  label,
  current,
  effectiveCurrent,
  target,
  max,
  route,
  breadth,
  freshness,
  feedback,
}) {
  const safeTarget = Math.max(0, Number(target) || 0);
  const safeCurrent = Math.max(0, Number(current) || 0);
  const hasEffectiveCurrent = effectiveCurrent !== undefined && effectiveCurrent !== null;
  const safeEffectiveCurrent = hasEffectiveCurrent
    ? Math.max(0, Number(effectiveCurrent) || 0)
    : safeCurrent;
  const percent = safeTarget > 0 ? Math.min(1, safeEffectiveCurrent / safeTarget) : 1;

  const component = {
    id,
    label,
    score: Math.round(max * percent),
    max,
    current: safeCurrent,
    target: safeTarget,
    percent,
    route,
  };
  if (hasEffectiveCurrent) component.effectiveCurrent = safeEffectiveCurrent;
  if (breadth) component.breadth = breadth;
  if (freshness) component.freshness = freshness;
  if (feedback) component.feedback = feedback;
  return component;
}

function readinessBand(score) {
  if (score >= 85) return 'Strong';
  if (score >= 70) return 'Interview-ready';
  if (score >= 40) return 'Developing';
  return 'Starting';
}

function isPremiumUser(user) {
  return user?.accessTier === 'premium'
    || ['active', 'lifetime'].includes(String(user?.entitlements?.pro?.status || ''));
}

function filterAccessibleQuestions(questions, user) {
  if (isPremiumUser(user)) return questions;
  return questions.filter((question) => question.access !== 'premium');
}

function asDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function freshnessForDate(value, now = new Date()) {
  const date = asDate(value);
  if (!date) {
    return {
      credit: 0,
      status: 'stale',
      latestAt: null,
    };
  }

  const ageDays = Math.max(0, Math.floor((now.getTime() - date.getTime()) / DAY_MS));
  if (ageDays <= FRESHNESS_FULL_CREDIT_DAYS) {
    return {
      credit: 1,
      status: 'fresh',
      latestAt: date,
    };
  }
  if (ageDays <= FRESHNESS_AGING_CREDIT_DAYS) {
    return {
      credit: 0.75,
      status: 'aging',
      latestAt: date,
    };
  }
  if (ageDays <= FRESHNESS_STALE_CREDIT_DAYS) {
    return {
      credit: 0.4,
      status: 'stale',
      latestAt: date,
    };
  }
  return {
    credit: 0,
    status: 'stale',
    latestAt: date,
  };
}

function emptyFreshnessSummary() {
  return {
    fresh: 0,
    aging: 0,
    stale: 0,
    latestAt: null,
  };
}

function recordFreshness(summary, freshness) {
  if (!summary || !freshness) return;
  if (freshness.status === 'fresh') summary.fresh += 1;
  else if (freshness.status === 'aging') summary.aging += 1;
  else summary.stale += 1;

  const latest = asDate(freshness.latestAt);
  if (!latest) return;
  if (!summary.latestAt || latest > summary.latestAt) summary.latestAt = latest;
}

function buildFreshnessPayload(summary) {
  if (!summary) return null;
  return {
    fresh: summary.fresh,
    aging: summary.aging,
    stale: summary.stale,
    latestAt: summary.latestAt ? summary.latestAt.toISOString() : undefined,
  };
}

function isFullPassAttempt(run) {
  return Number(run?.totalCount || 0) > 0
    && Number(run?.passCount || 0) >= Number(run?.totalCount || 0);
}

function failureCategoryLabel(category) {
  return toTitleCase(String(category || 'unknown').replace(/-/g, ' '));
}

function safePassRate(passRuns, attempts) {
  const safeAttempts = Math.max(0, Number(attempts) || 0);
  if (safeAttempts <= 0) return 0;
  return Math.round((Math.max(0, Number(passRuns) || 0) / safeAttempts) * 100) / 100;
}

function topFailureCategoryPayload(categoryCounts, limit = 3) {
  return [...(categoryCounts instanceof Map ? categoryCounts.entries() : [])]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category))
    .slice(0, limit);
}

function emptyCodingFeedbackAggregate() {
  return {
    attempts: 0,
    passRuns: 0,
    failRuns: 0,
    repeatedFailures: 0,
    categoryCounts: new Map(),
  };
}

function emptyRecentCodingFeedback() {
  return {
    feedback: null,
    componentFeedback: null,
    questionFeedbackById: new Map(),
    weakSignals: [],
  };
}

function buildComponentFeedback(aggregate) {
  if (!aggregate || aggregate.attempts <= 0) return null;
  return {
    attempts: aggregate.attempts,
    failRuns: aggregate.failRuns,
    passRate: safePassRate(aggregate.passRuns, aggregate.attempts),
    repeatedFailures: aggregate.repeatedFailures,
    topFailureCategories: topFailureCategoryPayload(aggregate.categoryCounts),
  };
}

function summarizeRecentFeedback(feedback) {
  if (!feedback || feedback.attempts <= 0) return '';
  if (feedback.weakSignals.length > 0) {
    return `Recent test runs found ${feedback.weakSignals.length} issue${feedback.weakSignals.length === 1 ? '' : 's'} to review.`;
  }
  if (feedback.strengthSignals.length > 0) {
    return 'Recent coding runs are passing in covered areas.';
  }
  return 'Recent coding runs are available for review.';
}

function buildQuestionFeedbackPayload(stats, weakSignal = null) {
  if (!stats || stats.attempts <= 0) return null;
  const latestRun = stats.latestRun || null;
  const latestAt = stats.latestTs ? new Date(stats.latestTs).toISOString() : undefined;
  const passRate = safePassRate(stats.passRuns, stats.attempts);
  const topCategory = topFailureCategoryPayload(stats.categoryCounts, 1)[0]?.category;
  let status = 'not-tried';
  if (weakSignal || !isFullPassAttempt(latestRun)) status = 'needs-review';
  else status = 'passed-recently';

  const payload = {
    status,
    attempts: stats.attempts,
    passRate,
    latestAt,
    lang: weakSignal?.lang || latestRun?.lang || undefined,
  };
  if (topCategory) payload.category = topCategory;
  return payload;
}

async function buildRecentCodingFeedback({
  userId,
  goal,
  codingDisplayPool,
  codingPool,
  now = new Date(),
}) {
  const questionIds = (Array.isArray(codingDisplayPool) ? codingDisplayPool : [])
    .map((question) => question.id)
    .filter(Boolean);
  if (!userId || questionIds.length === 0) {
    return emptyRecentCodingFeedback();
  }

  const cutoffTs = now.getTime() - (FEEDBACK_WINDOW_DAYS * DAY_MS);
  const attempts = await EditorAssistAttempt.find({
    userId,
    questionId: { $in: questionIds },
    lang: { $in: JAVASCRIPT_FEEDBACK_LANGS },
    ts: { $gte: cutoffTs },
  })
    .select('questionId lang ts passCount totalCount errorCategory tags')
    .sort({ ts: 1 })
    .lean();

  if (!attempts.length) {
    return emptyRecentCodingFeedback();
  }

  const questionById = new Map(codingDisplayPool.map((question) => [question.id, question]));
  const accessibleIds = new Set((Array.isArray(codingPool) ? codingPool : []).map((question) => question.id));
  const questionStats = new Map();
  const bucketStats = new Map();
  const aggregate = emptyCodingFeedbackAggregate();

  for (const run of attempts) {
    const question = questionById.get(run.questionId);
    if (!question || Number(run.totalCount || 0) <= 0) continue;
    const bucket = getQuestionReadinessBucket(question, goal.tech);
    const category = String(run.errorCategory || 'unknown');
    const lang = String(run.lang || '');
    const passed = isFullPassAttempt(run);
    const ts = Number(run.ts || 0);
    const questionKey = question.id;

    if (!questionStats.has(questionKey)) {
      questionStats.set(questionKey, {
        question,
        bucket,
        attempts: 0,
        passRuns: 0,
        failRuns: 0,
        latestTs: 0,
        latestRun: null,
        latestPassTs: 0,
        categoryCounts: new Map(),
        failureGroups: new Map(),
      });
    }
    const qStats = questionStats.get(questionKey);
    qStats.attempts += 1;
    qStats.latestTs = Math.max(qStats.latestTs, ts);
    if (!qStats.latestRun || ts >= Number(qStats.latestRun.ts || 0)) qStats.latestRun = run;

    if (!bucketStats.has(bucket.id)) {
      bucketStats.set(bucket.id, {
        bucket,
        attempts: 0,
        passRuns: 0,
        failRuns: 0,
        latestTs: 0,
        categoryCounts: new Map(),
      });
    }
    const bStats = bucketStats.get(bucket.id);
    bStats.attempts += 1;
    bStats.latestTs = Math.max(bStats.latestTs, ts);
    aggregate.attempts += 1;

    if (passed) {
      qStats.passRuns += 1;
      qStats.latestPassTs = Math.max(qStats.latestPassTs, ts);
      bStats.passRuns += 1;
      aggregate.passRuns += 1;
      continue;
    }

    qStats.failRuns += 1;
    bStats.failRuns += 1;
    aggregate.failRuns += 1;
    qStats.categoryCounts.set(category, (qStats.categoryCounts.get(category) || 0) + 1);
    bStats.categoryCounts.set(category, (bStats.categoryCounts.get(category) || 0) + 1);
    aggregate.categoryCounts.set(category, (aggregate.categoryCounts.get(category) || 0) + 1);

    const failure = qStats.failureGroups.get(category) || {
      category,
      count: 0,
      latestFailTs: 0,
      lang,
    };
    failure.count += 1;
    if (ts >= failure.latestFailTs) {
      failure.latestFailTs = ts;
      failure.lang = lang;
    }
    qStats.failureGroups.set(category, failure);
  }

  if (aggregate.attempts <= 0) {
    return emptyRecentCodingFeedback();
  }

  const weakSignals = [];
  const weakSignalByQuestionId = new Map();
  for (const qStats of questionStats.values()) {
    const unresolved = [...qStats.failureGroups.values()]
      .filter((failure) => failure.count >= 2 && failure.latestFailTs > qStats.latestPassTs)
      .sort((a, b) => b.count - a.count || b.latestFailTs - a.latestFailTs);
    for (const failure of unresolved) {
      const accessible = accessibleIds.has(qStats.question.id);
      const signal = {
        id: `coding:${qStats.bucket.id}:${qStats.question.id}:${failure.category}`,
        kind: 'coding',
        bucket: qStats.bucket.id,
        bucketLabel: qStats.bucket.label,
        label: `${qStats.bucket.label} · ${qStats.question.title}`,
        severity: 'high',
        attempts: qStats.attempts,
        failRuns: qStats.failRuns,
        passRate: safePassRate(qStats.passRuns, qStats.attempts),
        latestAt: new Date(failure.latestFailTs).toISOString(),
        category: failure.category,
        lang: failure.lang || undefined,
        questionId: qStats.question.id,
        accessible,
        access: qStats.question.access || 'free',
        reason: `Recent runs show ${failureCategoryLabel(failure.category)} in ${qStats.bucket.label}.`,
      };
      if (accessible) signal.route = qStats.question.route;
      weakSignals.push(signal);
      if (!weakSignalByQuestionId.has(qStats.question.id)) {
        weakSignalByQuestionId.set(qStats.question.id, signal);
      }
    }
  }

  weakSignals.sort((a, b) => (
    b.failRuns - a.failRuns
    || a.passRate - b.passRate
    || new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime()
    || a.label.localeCompare(b.label)
  ));
  aggregate.repeatedFailures = weakSignals.length;

  const strengthSignals = [...bucketStats.values()]
    .filter((stats) => stats.attempts >= 2 && stats.passRuns > 0 && safePassRate(stats.passRuns, stats.attempts) >= 0.8)
    .map((stats) => ({
      id: `coding:${stats.bucket.id}:strength`,
      kind: 'coding',
      bucket: stats.bucket.id,
      bucketLabel: stats.bucket.label,
      label: `${stats.bucket.label} coding`,
      attempts: stats.attempts,
      passRate: safePassRate(stats.passRuns, stats.attempts),
      latestAt: new Date(stats.latestTs).toISOString(),
      reason: `Recent ${stats.bucket.label} coding runs are mostly passing.`,
      lang: undefined,
    }))
    .sort((a, b) => b.passRate - a.passRate || new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime())
    .slice(0, 2);

  const questionFeedbackById = new Map();
  for (const [questionId, stats] of questionStats.entries()) {
    const payload = buildQuestionFeedbackPayload(stats, weakSignalByQuestionId.get(questionId) || null);
    if (payload) questionFeedbackById.set(questionId, payload);
  }

  const feedback = {
    windowDays: FEEDBACK_WINDOW_DAYS,
    summary: '',
    weakSignals: weakSignals.slice(0, 4),
    strengthSignals,
  };
  feedback.summary = summarizeRecentFeedback({
    attempts: aggregate.attempts,
    weakSignals: feedback.weakSignals,
    strengthSignals,
  });

  return {
    feedback,
    componentFeedback: buildComponentFeedback(aggregate),
    questionFeedbackById,
    weakSignals,
  };
}

function buildQuestionFreshness({ pool, solvedIds, completionRows, kind, now = new Date() }) {
  const poolIds = new Set((Array.isArray(pool) ? pool : []).map((question) => question.id));
  const completionById = new Map();
  for (const row of Array.isArray(completionRows) ? completionRows : []) {
    if (row.kind !== kind || !poolIds.has(row.itemId)) continue;
    const latestAt = asDate(row.lastAttemptAt) || asDate(row.completedAt);
    const existing = completionById.get(row.itemId);
    const existingLatest = asDate(existing?.lastAttemptAt) || asDate(existing?.completedAt);
    if (!existing || (latestAt && (!existingLatest || latestAt > existingLatest))) {
      completionById.set(row.itemId, row);
    }
  }

  const currentIds = new Set();
  for (const id of solvedIds instanceof Set ? solvedIds : new Set()) {
    if (poolIds.has(id)) currentIds.add(id);
  }
  for (const id of completionById.keys()) currentIds.add(id);

  const creditById = new Map();
  const staleIds = new Set();
  const freshIds = new Set();
  const agingIds = new Set();
  const summary = emptyFreshnessSummary();

  for (const id of currentIds) {
    const row = completionById.get(id);
    const freshness = freshnessForDate(row ? (row.lastAttemptAt || row.completedAt) : null, now);
    creditById.set(id, freshness.credit);
    if (freshness.status === 'fresh') freshIds.add(id);
    else if (freshness.status === 'aging') agingIds.add(id);
    else staleIds.add(id);
    recordFreshness(summary, freshness);
  }

  return {
    currentIds,
    creditById,
    staleIds,
    freshIds,
    agingIds,
    freshness: buildFreshnessPayload(summary),
  };
}

function buildPracticeFreshness({
  rows,
  family,
  completedPredicate,
  evidenceDate,
  now = new Date(),
}) {
  const currentIds = new Set();
  const creditById = new Map();
  const staleIds = new Set();
  const freshIds = new Set();
  const agingIds = new Set();
  const summary = emptyFreshnessSummary();

  for (const row of Array.isArray(rows) ? rows : []) {
    if (row.family !== family || !completedPredicate(row)) continue;
    currentIds.add(row.itemId);
    const freshness = freshnessForDate(
      typeof evidenceDate === 'function' ? evidenceDate(row) : row.lastPlayedAt,
      now,
    );
    creditById.set(row.itemId, freshness.credit);
    if (freshness.status === 'fresh') freshIds.add(row.itemId);
    else if (freshness.status === 'aging') agingIds.add(row.itemId);
    else staleIds.add(row.itemId);
    recordFreshness(summary, freshness);
  }

  return {
    currentIds,
    creditById,
    staleIds,
    freshIds,
    agingIds,
    current: currentIds.size,
    effectiveCurrent: [...creditById.values()].reduce((sum, value) => sum + value, 0),
    freshness: buildFreshnessPayload(summary),
  };
}

function pickFirstUnsolvedQuestion(questions, solvedIds) {
  return questions.find((question) => !solvedIds.has(question.id)) || null;
}

function pickStaleQuestionForBucket(questions, staleIds, goal, bucketId, { difficulty } = {}) {
  if (!(staleIds instanceof Set) || staleIds.size === 0) return null;
  const difficultySet = Array.isArray(difficulty)
    ? new Set(difficulty.map((item) => String(item || '').toLowerCase()))
    : null;
  return questions.find((question) => {
    if (!staleIds.has(question.id)) return false;
    if (bucketId && !questionMatchesBucket(question, goal.tech, bucketId)) return false;
    if (difficultySet && !difficultySet.has(String(question.difficulty || '').toLowerCase())) return false;
    return true;
  }) || null;
}

function pickUnsolvedQuestionForBucket(questions, solvedIds, goal, bucketId, { difficulty } = {}) {
  const difficultySet = Array.isArray(difficulty)
    ? new Set(difficulty.map((item) => String(item || '').toLowerCase()))
    : null;
  return questions.find((question) => {
    if (solvedIds.has(question.id)) return false;
    if (bucketId && !questionMatchesBucket(question, goal.tech, bucketId)) return false;
    if (difficultySet && !difficultySet.has(String(question.difficulty || '').toLowerCase())) return false;
    return true;
  }) || null;
}

function buildBreadthPayload(analysis) {
  if (!analysis?.breadth) return null;
  return {
    solved: analysis.breadth.solved,
    required: analysis.breadth.required,
    percent: analysis.breadth.percent,
    gaps: (analysis.breadth.gaps || []).slice(0, 5).map((gap) => ({
      id: gap.id,
      label: gap.label,
      solved: gap.solved,
      target: gap.target,
    })),
    dominant: analysis.breadth.dominant || undefined,
  };
}

function breadthRequirement(targetProfile, kind) {
  return targetProfile?.breadth?.[kind] || 0;
}

function effectiveCatalogCoverageTarget({ pool, tech, target, perBucketCap }) {
  const bucketCounts = new Map();
  for (const question of Array.isArray(pool) ? pool : []) {
    const bucket = getQuestionReadinessBucket(question, tech);
    bucketCounts.set(bucket.id, (bucketCounts.get(bucket.id) || 0) + 1);
  }
  const cappedAvailable = [...bucketCounts.values()].reduce(
    (sum, count) => sum + Math.min(Math.max(0, Number(count) || 0), perBucketCap),
    0,
  );
  const safeTarget = Math.max(0, Number(target) || 0);
  if (cappedAvailable <= 0) return safeTarget;
  return Math.max(1, Math.min(safeTarget, cappedAvailable));
}

function questionKindForCoverageKind(kind) {
  return kind === 'concepts' ? 'trivia' : 'coding';
}

function coverageQuestionPayload({ question, essentialMeta, feedback }) {
  const payload = {
    id: question.id,
    title: question.title,
    route: question.route,
    access: question.access || 'free',
    difficulty: question.difficulty || 'intermediate',
  };
  if (essentialMeta) {
    payload.importanceScore = essentialMeta.importanceScore;
    payload.essentialRank = essentialMeta.essentialRank;
    if (essentialMeta.rationale) payload.rationale = essentialMeta.rationale;
  }
  if (feedback) payload.feedback = feedback;
  return payload;
}

function sortCoverageQuestions(a, b) {
  return (
    Number(a.counted) - Number(b.counted)
    || Number(b.meta?.importanceScore || 0) - Number(a.meta?.importanceScore || 0)
    || Number(a.meta?.essentialRank || Number.MAX_SAFE_INTEGER)
      - Number(b.meta?.essentialRank || Number.MAX_SAFE_INTEGER)
    || a.question.title.localeCompare(b.question.title)
  );
}

function buildCoverageGapQuestions({
  goal,
  kind,
  displayPool,
  gap,
  essentialPriority,
  creditById,
  questionFeedbackById,
  limit = 5,
}) {
  const questionKind = questionKindForCoverageKind(kind);
  return (Array.isArray(displayPool) ? displayPool : [])
    .filter((question) => question.kind === questionKind && questionMatchesBucket(question, goal.tech, gap.id))
    .map((question) => {
      const meta = essentialPriority.byQuestionKey.get(essentialQuestionKey(question));
      return {
        question,
        meta,
        counted: Number(creditById?.get(question.id) || 0) > 0,
      };
    })
    .sort(sortCoverageQuestions)
    .slice(0, limit)
    .map(({ question, meta }) => coverageQuestionPayload({
      question,
      essentialMeta: meta,
      feedback: questionFeedbackById?.get(question.id),
    }));
}

function coverageGapFromBucket({
  goal,
  kind,
  accessiblePool,
  displayPool,
  solvedIds,
  gap,
  essentialPriority,
  creditById,
  questionFeedbackById,
}) {
  if (!gap) return null;
  const questionKind = questionKindForCoverageKind(kind);
  const question = pickUnsolvedQuestionForBucket(accessiblePool, solvedIds, goal, gap.id);
  const fullBucketQuestions = (Array.isArray(displayPool) ? displayPool : [])
    .filter((item) => item.kind === questionKind && questionMatchesBucket(item, goal.tech, gap.id));
  const bucketMeta = essentialPriority.byBucketKey.get(essentialBucketKey({
    tech: goal.tech,
    kind: questionKind,
    bucketId: gap.id,
  }));
  return {
    id: `${kind}:${gap.id}`,
    label: `${gap.label} ${kind === 'coding' ? 'coding' : 'concepts'}`,
    kind,
    route: question?.route || `/${goal.tech}/interview-questions`,
    priorityScore: Number(bucketMeta?.priorityScore || 0),
    source: bucketMeta ? 'essential-60' : 'catalog',
    solved: Number(gap.solved || 0),
    target: Number(gap.target || 0),
    available: fullBucketQuestions.length,
    questions: buildCoverageGapQuestions({
      goal,
      kind,
      displayPool,
      gap,
      essentialPriority,
      creditById,
      questionFeedbackById,
    }),
  };
}

function gapNeedScore(gap) {
  const target = Math.max(0, Number(gap?.target || 0));
  const solved = Math.max(0, Number(gap?.solved || 0));
  return target > 0 ? Math.max(0, target - solved) / target : 0;
}

function sortCoverageGapRows(primaryWeakness, hasCoreProgress) {
  return (a, b) => {
    const primaryKind = primaryWeakness?.id === 'concepts'
      ? 'concepts'
      : primaryWeakness?.id === 'coding'
        ? 'coding'
        : null;
    const primaryDelta = hasCoreProgress && primaryKind
      ? Number(a.kind !== primaryKind) - Number(b.kind !== primaryKind)
      : 0;
    return (
      primaryDelta
      || Number(b.priorityScore || 0) - Number(a.priorityScore || 0)
      || gapNeedScore(b) - gapNeedScore(a)
      || Number(b.available || 0) - Number(a.available || 0)
      || a.label.localeCompare(b.label)
    );
  };
}

function mixInitialCoverageGaps(rows, shouldMixKinds) {
  if (!shouldMixKinds || rows.length <= 3) return rows;
  const selected = [];
  const rest = [];
  const counts = new Map();
  for (const row of rows) {
    const count = counts.get(row.kind) || 0;
    if (selected.length < 3 && count < 2) {
      selected.push(row);
      counts.set(row.kind, count + 1);
    } else {
      rest.push(row);
    }
  }
  return [...selected, ...rest];
}

function buildCoverageGaps({
  goal,
  codingPool,
  conceptPool,
  codingDisplayPool,
  conceptDisplayPool,
  solvedIds,
  codingAnalysis,
  conceptAnalysis,
  primaryWeakness,
  essentialPriority,
  codingCreditById,
  conceptCreditById,
  questionFeedbackById,
}) {
  const codingGaps = (codingAnalysis?.breadth?.gaps || [])
    .map((gap) => coverageGapFromBucket({
      goal,
      kind: 'coding',
      accessiblePool: codingPool,
      displayPool: codingDisplayPool,
      solvedIds,
      gap,
      essentialPriority,
      creditById: codingCreditById,
      questionFeedbackById,
    }))
    .filter(Boolean);
  const conceptGaps = (conceptAnalysis?.breadth?.gaps || [])
    .map((gap) => coverageGapFromBucket({
      goal,
      kind: 'concepts',
      accessiblePool: conceptPool,
      displayPool: conceptDisplayPool,
      solvedIds,
      gap,
      essentialPriority,
      creditById: conceptCreditById,
      questionFeedbackById,
    }))
    .filter(Boolean);
  const hasCoreProgress = (codingAnalysis?.current || 0) + (conceptAnalysis?.current || 0) > 0;
  const shouldMixKinds = !hasCoreProgress && codingGaps.length > 0 && conceptGaps.length > 0;
  const sorted = [...codingGaps, ...conceptGaps].sort(sortCoverageGapRows(primaryWeakness, hasCoreProgress));
  return mixInitialCoverageGaps(sorted, shouldMixKinds);
}

function isAdvancedQuestion(question) {
  return ADVANCED_DIFFICULTIES.has(String(question?.difficulty || '').toLowerCase());
}

function isHardQuestion(question) {
  return String(question?.difficulty || '').toLowerCase() === 'hard';
}

function drillKindLabel(targetProfile) {
  return targetProfile?.conceptOnly ? 'concept drill' : 'drill';
}

function buildDifficultyGate(goal, codingPool, conceptPool, solvedIds, targetProfile) {
  const difficulty = targetProfile?.difficulty || {};
  const advancedTarget = Number(difficulty.advanced || 0);
  const hardTarget = Number(difficulty.hard || 0);
  if (advancedTarget <= 0 && hardTarget <= 0) return null;

  const combined = [...codingPool, ...conceptPool];
  const advancedAvailable = combined.filter(isAdvancedQuestion).length;
  const advancedSolved = combined.filter((question) => solvedIds.has(question.id) && isAdvancedQuestion(question)).length;
  const advancedRequired = Math.min(advancedTarget, advancedAvailable);
  if (advancedSolved < advancedRequired) {
    const missing = advancedRequired - advancedSolved;
    const drillLabel = drillKindLabel(targetProfile);
    return {
      maxScore: 69,
      reason: `Solve ${missing} more intermediate or hard ${techLabel(goal.tech)} ${drillLabel}${missing === 1 ? '' : 's'}.`,
      difficulty: ['intermediate', 'hard'],
    };
  }

  if (hardTarget > 0) {
    const hardAvailable = combined.filter(isHardQuestion).length;
    const hardSolved = combined.filter((question) => solvedIds.has(question.id) && isHardQuestion(question)).length;
    const hardRequired = Math.min(hardTarget, hardAvailable);
    if (hardSolved < hardRequired) {
      const missing = hardRequired - hardSolved;
      const drillLabel = drillKindLabel(targetProfile);
      return {
        maxScore: 69,
        reason: `Solve ${missing} more hard ${techLabel(goal.tech)} ${drillLabel}${missing === 1 ? '' : 's'}.`,
        difficulty: ['hard'],
      };
    }
  }

  return null;
}

function buildBreadthCap(goal, codingAnalysis, conceptAnalysis) {
  const codingBreadth = codingAnalysis?.breadth;
  const conceptBreadth = conceptAnalysis?.breadth;
  const codingMissing = codingBreadth && codingBreadth.solved < codingBreadth.required;
  const conceptMissing = conceptBreadth && conceptBreadth.solved < conceptBreadth.required;
  const hasConcentration = codingAnalysis?.hasConcentrationPenalty || conceptAnalysis?.hasConcentrationPenalty;
  const hasEnoughProgressForCap = (codingAnalysis?.current || 0) + (conceptAnalysis?.current || 0) >= 5;

  if (!codingMissing && !conceptMissing && !hasConcentration) return null;
  if (!hasConcentration && !hasEnoughProgressForCap) return null;

  const source = codingMissing || codingAnalysis?.hasConcentrationPenalty
    ? { label: `${techLabel(goal.tech)} coding`, breadth: codingBreadth }
    : { label: `${techLabel(goal.tech)} concepts`, breadth: conceptBreadth };
  const dominantLabel = source.breadth?.dominant?.label;

  return {
    maxScore: 69,
    reason: dominantLabel
      ? `Broaden ${source.label} beyond ${dominantLabel}.`
      : `Broaden ${source.label} across more topics.`,
  };
}

function buildFormatGateCap(score, passedIncidentCount, completedTradeoffCount) {
  if (score <= 84) return null;
  if (passedIncidentCount > 0 && completedTradeoffCount > 0) return null;
  if (passedIncidentCount === 0 && completedTradeoffCount === 0) {
    return {
      maxScore: 84,
      reason: 'Add debug and tradeoff practice before this can be Strong.',
    };
  }
  return {
    maxScore: 84,
    reason: passedIncidentCount === 0
      ? 'Add debug practice before this can be Strong.'
      : 'Add tradeoff practice before this can be Strong.',
  };
}

function buildFreshnessGateCap(score, { coding, concepts, debug, tradeoffs, conceptOnly = false } = {}) {
  if (score <= 69) return null;
  const missingCore = [];
  if (!conceptOnly && Number(coding?.fresh || 0) <= 0) missingCore.push('coding');
  if (Number(concepts?.fresh || 0) <= 0) missingCore.push('concepts');
  if (missingCore.length) {
    return {
      maxScore: 69,
      reason: `Refresh recent ${missingCore.join(' and ')} practice to verify readiness.`,
    };
  }

  if (score <= 84) return null;
  const missingStrong = [];
  if (Number(debug?.fresh || 0) <= 0) missingStrong.push('debug');
  if (Number(tradeoffs?.fresh || 0) <= 0) missingStrong.push('tradeoff');
  if (!missingStrong.length) return null;

  return {
    maxScore: 84,
    reason: `Refresh recent ${missingStrong.join(' and ')} practice before this can be Strong.`,
  };
}

function buildFeedbackGateCap(score, feedbackContext) {
  const weakSignals = Array.isArray(feedbackContext?.weakSignals) ? feedbackContext.weakSignals : [];
  if (!weakSignals.length) return null;

  const severe = weakSignals.length >= 2
    || weakSignals.some((signal) => Number(signal.failRuns || 0) >= 3 && Number(signal.passRate || 0) === 0);
  if (severe && score > 69) {
    return {
      maxScore: 69,
      reason: 'Clear repeated coding failures before this can be Interview-ready.',
    };
  }

  if (score > 84) {
    return {
      maxScore: 84,
      reason: 'Resolve recent coding failures before this can be Strong.',
    };
  }

  return null;
}

function pickStrictestCap(caps) {
  return caps.filter(Boolean).sort((a, b) => a.maxScore - b.maxScore)[0] || null;
}

function pickPracticeEntry(entries, completedIds) {
  return entries.find((entry) => !completedIds.has(entry.id)) || null;
}

function pickStalePracticeEntry(entries, staleIds) {
  if (!(staleIds instanceof Set) || staleIds.size === 0) return null;
  return entries.find((entry) => staleIds.has(entry.id)) || null;
}

function filterPracticeRowsForEntries(rows, family, entries) {
  const entryIds = new Set((Array.isArray(entries) ? entries : []).map((entry) => entry.id));
  return (Array.isArray(rows) ? rows : []).filter((row) => row.family === family && entryIds.has(row.itemId));
}

function effectivePracticeTarget(target, entries) {
  const safeTarget = Math.max(0, Number(target) || 0);
  const available = Array.isArray(entries) ? entries.length : 0;
  return available > 0 ? Math.min(safeTarget, available) : safeTarget;
}

function buildFallbackDrill(goal) {
  return {
    title: 'JavaScript practice library',
    route: '/coding',
    family: 'question',
    reason: 'Use the library while the recommendation pool refreshes.',
    cta: 'Open library',
  };
}

function buildFeedbackNextDrill({ feedbackContext, goal, codingPool, codingFreshness, difficultyGate }) {
  const signal = feedbackContext?.weakSignals?.find((item) => item.severity === 'high')
    || feedbackContext?.weakSignals?.[0];
  if (!signal) return null;

  const sameQuestion = codingPool.find((question) => question.id === signal.questionId) || null;
  const difficultyFilter = difficultyGate?.difficulty ? { difficulty: difficultyGate.difficulty } : undefined;
  const bucketQuestion = pickUnsolvedQuestionForBucket(
    codingPool,
    codingFreshness.currentIds,
    goal,
    signal.bucket,
    difficultyFilter,
  )
    || codingPool.find((question) => questionMatchesBucket(question, goal.tech, signal.bucket))
    || null;
  const question = sameQuestion || bucketQuestion;
  if (!question) return null;

  return {
    title: question.title,
    route: question.route,
    family: 'question',
    reason: signal.reason || `Recent runs show a coding weakness in ${signal.bucketLabel || techLabel(goal.tech)}.`,
    cta: sameQuestion ? 'Review coding drill' : 'Start coding drill',
  };
}

async function buildPrepLoop(user, { weeklyGoal, dailyChallenge } = {}) {
  const goal = buildPrepGoal(user);
  const targetProfile = prepTargetProfile(goal);
  const weights = targetProfile.weights;
  const questionCatalog = loadQuestionCatalog();
  const practiceCatalog = loadPracticeCatalog();
  const solvedIds = new Set(Array.isArray(user?.solvedQuestionIds) ? user.solvedQuestionIds : []);

  const codingDisplayPool = questionCatalog.all
    .filter((question) => question.tech === goal.tech && question.kind === 'coding');
  const conceptDisplayPool = questionCatalog.all
    .filter((question) => question.tech === goal.tech && question.kind === 'trivia');
  const codingPool = filterAccessibleQuestions(codingDisplayPool, user);
  const conceptPool = filterAccessibleQuestions(conceptDisplayPool, user);
  const essentialPriority = loadEssentialPriority();
  const targets = targetProfile.targets;
  const conceptReadinessTarget = targetProfile.conceptOnly
    ? effectiveCatalogCoverageTarget({
        pool: conceptPool,
        tech: goal.tech,
        target: targets.concepts,
        perBucketCap: READINESS_BUCKET_CAPS.concepts,
      })
    : targets.concepts;

  const completionRows = await ActivityCompletion.find({
    userId: user._id,
    active: true,
    tech: goal.tech,
    kind: { $in: ['coding', 'trivia'] },
  })
    .select('kind itemId completedAt lastAttemptAt')
    .lean();
  const codingFreshness = buildQuestionFreshness({
    pool: codingPool,
    solvedIds,
    completionRows,
    kind: 'coding',
  });
  const conceptFreshness = buildQuestionFreshness({
    pool: conceptPool,
    solvedIds,
    completionRows,
    kind: 'trivia',
  });
  const creditedSolvedIds = new Set([
    ...[...codingFreshness.creditById.entries()].filter(([, credit]) => credit > 0).map(([id]) => id),
    ...[...conceptFreshness.creditById.entries()].filter(([, credit]) => credit > 0).map(([id]) => id),
  ]);

  const codingAnalysis = analyzeQuestionCoverage({
    pool: codingPool,
    solvedIds: codingFreshness.currentIds,
    creditById: codingFreshness.creditById,
    tech: goal.tech,
    target: targets.coding || 0,
    perBucketCap: READINESS_BUCKET_CAPS.coding,
    requiredBreadth: breadthRequirement(targetProfile, 'coding'),
  });
  const conceptAnalysis = analyzeQuestionCoverage({
    pool: conceptPool,
    solvedIds: conceptFreshness.currentIds,
    creditById: conceptFreshness.creditById,
    tech: goal.tech,
    target: conceptReadinessTarget,
    perBucketCap: READINESS_BUCKET_CAPS.concepts,
    requiredBreadth: breadthRequirement(targetProfile, 'concepts'),
  });
  const feedbackContext = targetProfile.conceptOnly
    ? emptyRecentCodingFeedback()
    : await buildRecentCodingFeedback({
        userId: user._id,
        goal,
        codingDisplayPool,
        codingPool,
      });

  const practiceRows = await PracticeProgress.find({
    userId: user._id,
    family: { $in: ['incident', 'tradeoff-battle'] },
  })
    .select('family itemId passed completed lastPlayedAt passedAt completedAt')
    .lean();

  const incidentEntries = (Array.isArray(practiceCatalog.byFamily.get('incident'))
    ? practiceCatalog.byFamily.get('incident')
    : [])
    .filter((entry) => entry.tech === 'javascript');
  const tradeoffEntries = (Array.isArray(practiceCatalog.byFamily.get('tradeoff-battle'))
    ? practiceCatalog.byFamily.get('tradeoff-battle')
    : [])
    .filter((entry) => entry.tech === 'javascript');
  const incidentRows = filterPracticeRowsForEntries(practiceRows, 'incident', incidentEntries);
  const tradeoffRows = filterPracticeRowsForEntries(practiceRows, 'tradeoff-battle', tradeoffEntries);
  const debugTarget = effectivePracticeTarget(targets.debug, incidentEntries);
  const tradeoffTarget = effectivePracticeTarget(targets.tradeoffs, tradeoffEntries);
  const displayTargetProfile = {
    ...targetProfile,
    availabilityCapped: {
      debug: debugTarget < targetProfile.targets.debug,
      tradeoffs: tradeoffTarget < targetProfile.targets.tradeoffs,
    },
    targets: {
      ...targetProfile.targets,
      debug: debugTarget,
      tradeoffs: tradeoffTarget,
    },
  };
  displayTargetProfile.summary = targetProfileSummary(displayTargetProfile);

  const incidentFreshness = buildPracticeFreshness({
    rows: incidentRows,
    family: 'incident',
    completedPredicate: (row) => row.passed === true,
    evidenceDate: (row) => row.passedAt,
  });
  const tradeoffFreshness = buildPracticeFreshness({
    rows: tradeoffRows,
    family: 'tradeoff-battle',
    completedPredicate: (row) => row.completed === true,
    evidenceDate: (row) => row.completedAt,
  });
  const creditedIncidentIds = new Set(
    [...incidentFreshness.creditById.entries()].filter(([, credit]) => credit > 0).map(([id]) => id),
  );
  const creditedTradeoffIds = new Set(
    [...tradeoffFreshness.creditById.entries()].filter(([, credit]) => credit > 0).map(([id]) => id),
  );

  const consistencyPercent = weeklyGoal?.enabled === false
    ? 1
    : Math.min(1, Math.max(0, Number(weeklyGoal?.progress || 0)));
  const consistencyTarget = weeklyGoal?.enabled === false ? 1 : Number(weeklyGoal?.target || 0);

  const components = [];
  if (!targetProfile.conceptOnly) {
    components.push(buildReadinessComponent({
      id: 'coding',
      label: `${techLabel(goal.tech)} coding`,
      current: codingAnalysis.current,
      effectiveCurrent: codingAnalysis.effectiveCurrent,
      target: targets.coding,
      max: weights.coding,
      route: `/${goal.tech}/interview-questions`,
      breadth: buildBreadthPayload(codingAnalysis),
      freshness: codingFreshness.freshness,
      feedback: feedbackContext.componentFeedback,
    }));
  }
  components.push(
    buildReadinessComponent({
      id: 'concepts',
      label: `${techLabel(goal.tech)} concepts`,
      current: conceptAnalysis.current,
      effectiveCurrent: conceptAnalysis.effectiveCurrent,
      target: conceptReadinessTarget,
      max: weights.concepts,
      route: `/${goal.tech}/interview-questions`,
      breadth: buildBreadthPayload(conceptAnalysis),
      freshness: conceptFreshness.freshness,
    }),
    buildReadinessComponent({
      id: 'debug',
      label: 'Debug practice',
      current: incidentFreshness.current,
      effectiveCurrent: incidentFreshness.effectiveCurrent,
      target: debugTarget,
      max: weights.debug,
      route: '/incidents',
      freshness: incidentFreshness.freshness,
    }),
    buildReadinessComponent({
      id: 'tradeoffs',
      label: 'Tradeoff practice',
      current: tradeoffFreshness.current,
      effectiveCurrent: tradeoffFreshness.effectiveCurrent,
      target: tradeoffTarget,
      max: weights.tradeoffs,
      route: '/tradeoffs',
      freshness: tradeoffFreshness.freshness,
    }),
    buildReadinessComponent({
      id: 'consistency',
      label: 'Weekly consistency',
      current: Math.round(consistencyPercent * consistencyTarget),
      target: consistencyTarget,
      max: weights.consistency,
      route: '/dashboard',
    }),
  );

  const rawScore = Math.max(0, Math.min(100, components.reduce((sum, item) => sum + item.score, 0)));
  const coreDifficultyPool = targetProfile.conceptOnly ? [] : codingPool;
  const difficultyGate = buildDifficultyGate(goal, coreDifficultyPool, conceptPool, creditedSolvedIds, targetProfile);
  const breadthCap = buildBreadthCap(goal, targetProfile.conceptOnly ? null : codingAnalysis, conceptAnalysis);
  const hasConcentrationPenalty = (targetProfile.conceptOnly ? false : codingAnalysis.hasConcentrationPenalty)
    || conceptAnalysis.hasConcentrationPenalty;
  const cap = pickStrictestCap([
    breadthCap && (rawScore > breadthCap.maxScore || hasConcentrationPenalty) ? breadthCap : null,
    difficultyGate && rawScore > difficultyGate.maxScore ? difficultyGate : null,
    buildFormatGateCap(rawScore, incidentFreshness.effectiveCurrent, tradeoffFreshness.effectiveCurrent),
    buildFreshnessGateCap(rawScore, {
      coding: codingFreshness.freshness,
      concepts: conceptFreshness.freshness,
      debug: incidentFreshness.freshness,
      tradeoffs: tradeoffFreshness.freshness,
      conceptOnly: targetProfile.conceptOnly,
    }),
    targetProfile.conceptOnly ? null : buildFeedbackGateCap(rawScore, feedbackContext),
  ]);
  const score = cap ? Math.min(rawScore, cap.maxScore) : rawScore;
  const weaknesses = [...components]
    .sort((a, b) => a.percent - b.percent || a.score - b.score || a.id.localeCompare(b.id))
    .slice(0, 2);
  const primaryWeakness = weaknesses[0] || components[0];
  const currentQuestionIds = targetProfile.conceptOnly
    ? new Set([...conceptFreshness.currentIds])
    : new Set([...codingFreshness.currentIds, ...conceptFreshness.currentIds]);
  const coverageGaps = buildCoverageGaps({
    goal,
    codingPool: targetProfile.conceptOnly ? [] : codingPool,
    conceptPool,
    codingDisplayPool: targetProfile.conceptOnly ? [] : codingDisplayPool,
    conceptDisplayPool,
    solvedIds: currentQuestionIds,
    codingAnalysis: targetProfile.conceptOnly ? null : codingAnalysis,
    conceptAnalysis,
    primaryWeakness,
    essentialPriority,
    codingCreditById: targetProfile.conceptOnly ? new Map() : codingFreshness.creditById,
    conceptCreditById: conceptFreshness.creditById,
    questionFeedbackById: targetProfile.conceptOnly ? new Map() : feedbackContext.questionFeedbackById,
  });

  let nextDrill = buildFallbackDrill(goal);
  const feedbackNextDrill = targetProfile.conceptOnly
    ? null
    : buildFeedbackNextDrill({
        feedbackContext,
        goal,
        codingPool,
        codingFreshness,
        difficultyGate,
      });
  if (feedbackNextDrill) {
    nextDrill = feedbackNextDrill;
  } else if (primaryWeakness?.id === 'coding') {
    const preferredGap = codingAnalysis.breadth.gaps[0];
    const staleQuestion = pickStaleQuestionForBucket(
      codingPool,
      codingFreshness.staleIds,
      goal,
      preferredGap?.id,
      difficultyGate?.difficulty ? { difficulty: difficultyGate.difficulty } : undefined,
    )
      || pickStaleQuestionForBucket(codingPool, codingFreshness.staleIds, goal, null);
    const question = staleQuestion || pickUnsolvedQuestionForBucket(
      codingPool,
      codingFreshness.currentIds,
      goal,
      preferredGap?.id,
      difficultyGate?.difficulty ? { difficulty: difficultyGate.difficulty } : undefined,
    )
      || (difficultyGate?.difficulty
        ? pickUnsolvedQuestionForBucket(codingPool, codingFreshness.currentIds, goal, null, { difficulty: difficultyGate.difficulty })
        : null)
      || pickFirstUnsolvedQuestion(codingPool, codingFreshness.currentIds);
    if (question) {
      const gapLabel = preferredGap?.label;
      nextDrill = {
        title: question.title,
        route: question.route,
        family: 'question',
        reason: staleQuestion
          ? `Refresh ${techLabel(goal.tech)} coding evidence${gapLabel ? ` in ${gapLabel}` : ''}.`
          : gapLabel
          ? `Build ${techLabel(goal.tech)} coding coverage in ${gapLabel}.`
          : `Build ${techLabel(goal.tech)} coding coverage.`,
        cta: 'Start coding drill',
      };
    }
  } else if (primaryWeakness?.id === 'concepts') {
    const preferredGap = conceptAnalysis.breadth.gaps[0];
    const staleQuestion = pickStaleQuestionForBucket(
      conceptPool,
      conceptFreshness.staleIds,
      goal,
      preferredGap?.id,
      difficultyGate?.difficulty ? { difficulty: difficultyGate.difficulty } : undefined,
    )
      || pickStaleQuestionForBucket(conceptPool, conceptFreshness.staleIds, goal, null);
    const question = staleQuestion || pickUnsolvedQuestionForBucket(
      conceptPool,
      conceptFreshness.currentIds,
      goal,
      preferredGap?.id,
      difficultyGate?.difficulty ? { difficulty: difficultyGate.difficulty } : undefined,
    )
      || (difficultyGate?.difficulty
        ? pickUnsolvedQuestionForBucket(conceptPool, conceptFreshness.currentIds, goal, null, { difficulty: difficultyGate.difficulty })
        : null)
      || pickFirstUnsolvedQuestion(conceptPool, conceptFreshness.currentIds);
    if (question) {
      const gapLabel = preferredGap?.label;
      nextDrill = {
        title: question.title,
        route: question.route,
        family: 'question',
        reason: staleQuestion
          ? `Refresh ${techLabel(goal.tech)} explanation evidence${gapLabel ? ` in ${gapLabel}` : ''}.`
          : gapLabel
          ? `Improve ${techLabel(goal.tech)} explanations in ${gapLabel}.`
          : `Improve ${techLabel(goal.tech)} explanation coverage.`,
        cta: 'Open concept drill',
      };
    }
  } else if (primaryWeakness?.id === 'debug') {
    const staleIncident = pickStalePracticeEntry(incidentEntries, incidentFreshness.staleIds);
    const incident = staleIncident || pickPracticeEntry(incidentEntries, creditedIncidentIds);
    if (incident) {
      nextDrill = {
        title: incident.title,
        route: incident.route || `/incidents/${incident.id}`,
        family: 'incident',
        reason: staleIncident
          ? 'Refresh an older debugging result with a scored scenario.'
          : 'Build debugging practice with a scored scenario.',
        cta: 'Start debug drill',
      };
    }
  } else if (primaryWeakness?.id === 'tradeoffs') {
    const staleTradeoff = pickStalePracticeEntry(tradeoffEntries, tradeoffFreshness.staleIds);
    const tradeoff = staleTradeoff || pickPracticeEntry(tradeoffEntries, creditedTradeoffIds);
    if (tradeoff) {
      nextDrill = {
        title: tradeoff.title,
        route: tradeoff.route || `/tradeoffs/${tradeoff.id}`,
        family: 'tradeoff-battle',
        reason: staleTradeoff
          ? 'Refresh an older tradeoff practice result.'
          : 'Practice defending architecture tradeoffs clearly.',
        cta: 'Start tradeoff drill',
      };
    }
  } else if (primaryWeakness?.id === 'consistency') {
    const dailyChallengeFitsTarget = targetProfile.conceptOnly
      ? dailyChallenge?.kind === 'trivia'
      : true;
    nextDrill = dailyChallengeFitsTarget && dailyChallenge?.available !== false && dailyChallenge?.route && !dailyChallenge?.completed
      ? {
          title: dailyChallenge.title,
          route: dailyChallenge.route,
          family: 'question',
          reason: 'Complete today’s practice to move your weekly goal.',
          cta: 'Start today’s practice',
        }
      : {
          title: 'Move your weekly goal forward',
          route: targetProfile.conceptOnly ? `/${goal.tech}/interview-questions` : '/coding',
          family: 'question',
          reason: targetProfile.conceptOnly
            ? 'One completed concept question improves consistency.'
            : 'One completed practice item improves consistency.',
          cta: targetProfile.conceptOnly ? 'Continue concepts' : 'Continue practice',
        };
  }

  return {
    goal,
    targetProfile: prepTargetProfilePayload(displayTargetProfile),
    readiness: {
      score,
      band: readinessBand(score),
      cap: cap
        ? {
            maxScore: cap.maxScore,
            reason: cap.reason,
          }
        : undefined,
      components,
    },
    weaknesses,
    coverageGaps,
    feedback: feedbackContext.feedback || undefined,
    nextDrill,
  };
}

async function countWeeklySolvedUnique(userId, weekBounds, { timeZone = APP_TIMEZONE, session = null } = {}) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 14);

  const query = ActivityCompletion.find({
    userId,
    active: true,
    kind: { $in: Array.from(SOLVE_KINDS) },
    itemId: { $exists: true, $ne: '' },
    completedAt: { $gte: since },
  })
    .select('kind itemId completedAt');
  if (session) query.session(session);

  const rows = await query.lean();

  const unique = new Set();
  for (const row of rows) {
    const dayKey = dayKeyInTimezone(new Date(row.completedAt), timeZone);
    if (dayKey < weekBounds.startDayKey || dayKey > weekBounds.endDayKey) continue;
    unique.add(`${row.kind}:${row.itemId}`);
  }
  return unique.size;
}

async function countTodayCompletedKinds(userId, dayKey, { timeZone = APP_TIMEZONE, session = null } = {}) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 2);

  const query = ActivityCompletion.find({
    userId,
    active: true,
    kind: { $in: Array.from(SOLVE_KINDS) },
    completedAt: { $gte: since },
  }).select('kind completedAt');
  if (session) query.session(session);

  const rows = await query.lean();
  const uniqueKinds = new Set();
  for (const row of rows) {
    const rowDayKey = dayKeyInTimezone(new Date(row.completedAt), timeZone);
    if (rowDayKey !== dayKey) continue;
    uniqueKinds.add(row.kind);
  }
  return uniqueKinds.size;
}

function buildQuestionProgressSummary(user) {
  const catalog = loadQuestionCatalog();
  const solvedIds = new Set(Array.isArray(user?.solvedQuestionIds) ? user.solvedQuestionIds : []);

  let solvedCount = 0;
  for (const id of solvedIds) {
    if (catalog.byId.has(id)) solvedCount += 1;
  }

  const totalCount = catalog.all.length;
  const solvedPercent = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

  const totalByTopic = new Map();
  const solvedByTopic = new Map();

  for (const question of catalog.all) {
    const tags = Array.isArray(question.tags) ? question.tags : [];
    for (const tag of tags) {
      totalByTopic.set(tag, (totalByTopic.get(tag) || 0) + 1);
      if (solvedIds.has(question.id)) {
        solvedByTopic.set(tag, (solvedByTopic.get(tag) || 0) + 1);
      }
    }
  }

  const topTopics = Array.from(totalByTopic.entries())
    .map(([topic, total]) => {
      const solved = solvedByTopic.get(topic) || 0;
      const percent = total > 0 ? Math.round((solved / total) * 100) : 0;
      return {
        topic,
        label: toTitleCase(topic),
        solved,
        total,
        percent,
      };
    })
    .filter((entry) => entry.solved > 0)
    .sort((a, b) => b.solved - a.solved || b.percent - a.percent || a.topic.localeCompare(b.topic))
    .slice(0, 3);

  return {
    solvedCount,
    totalCount,
    solvedPercent,
    topTopics,
  };
}

async function buildIncidentProgressSummary(userId, { session = null } = {}) {
  const catalog = loadPracticeCatalog();
  const incidentEntries = Array.isArray(catalog.byFamily.get('incident')) ? catalog.byFamily.get('incident') : [];
  const totalCount = incidentEntries.length;
  const incidentIds = incidentEntries.map((entry) => entry.id);

  if (!incidentIds.length) {
    return {
      passedCount: 0,
      totalCount: 0,
      passedPercent: 0,
    };
  }

  const passedQuery = PracticeProgress.countDocuments({
    userId,
    family: 'incident',
    passed: true,
    itemId: { $in: incidentIds },
  });
  if (session) passedQuery.session(session);
  const passedCount = await passedQuery;

  return {
    passedCount,
    totalCount,
    passedPercent: totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0,
  };
}

async function buildTradeoffBattleProgressSummary(userId, { session = null } = {}) {
  const catalog = loadPracticeCatalog();
  const tradeoffEntries = Array.isArray(catalog.byFamily.get('tradeoff-battle')) ? catalog.byFamily.get('tradeoff-battle') : [];
  const totalCount = tradeoffEntries.length;
  const tradeoffIds = tradeoffEntries.map((entry) => entry.id);

  if (!tradeoffIds.length) {
    return {
      completedCount: 0,
      totalCount: 0,
      completedPercent: 0,
    };
  }

  const completedQuery = PracticeProgress.countDocuments({
    userId,
    family: 'tradeoff-battle',
    completed: true,
    itemId: { $in: tradeoffIds },
  });
  if (session) completedQuery.session(session);
  const completedCount = await completedQuery;

  return {
    completedCount,
    totalCount,
    completedPercent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
  };
}

async function buildProgressSummary(user, { session = null } = {}) {
  const questions = buildQuestionProgressSummary(user);
  const incidents = await buildIncidentProgressSummary(user?._id, { session });
  const tradeoffBattles = await buildTradeoffBattleProgressSummary(user?._id, { session });
  const practiceCompletedCount = questions.solvedCount + incidents.passedCount + tradeoffBattles.completedCount;
  const practiceTotalCount = questions.totalCount + incidents.totalCount + tradeoffBattles.totalCount;

  return {
    questions,
    incidents,
    tradeoffBattles,
    practice: {
      completedCount: practiceCompletedCount,
      totalCount: practiceTotalCount,
      completedPercent: practiceTotalCount > 0
        ? Math.round((practiceCompletedCount / practiceTotalCount) * 100)
        : 0,
    },
  };
}

function deriveNextBestAction({ dailyChallengeCompleted, weeklyGoal, progress, challenge }) {
  if (challenge?.questionId && !dailyChallengeCompleted && challenge?.route) {
    return {
      id: 'daily_challenge',
      title: 'Complete today’s daily challenge',
      description: 'Maintain momentum with one focused question.',
      route: challenge.route,
      cta: 'Open challenge',
    };
  }

  if (weeklyGoal.enabled && weeklyGoal.completed < weeklyGoal.target) {
    return {
      id: 'weekly_goal',
      title: 'Move your weekly goal forward',
      description: `You are at ${weeklyGoal.completed}/${weeklyGoal.target}. One solved question moves this forward.`,
      route: '/coding',
      cta: 'Continue practice',
    };
  }

  if ((progress?.questions?.solvedPercent || 0) < 30) {
    return {
      id: 'foundation',
      title: 'Build core interview coverage',
      description: 'Prioritize easy/medium practice to expand solved coverage quickly.',
      route: '/coding',
      cta: 'Practice core set',
    };
  }

  return {
    id: 'interview_targeting',
    title: 'Target interview-style practice',
    description: 'Use tracks and company sets to sharpen role-specific preparation.',
    route: '/tracks',
    cta: 'Explore tracks',
  };
}

async function buildDashboardPayload(user, { challenge, challengeCompletion, timeZone = APP_TIMEZONE } = {}) {
  const { weekBounds, settings: weeklyGoalSettings } = await ensureCurrentWeeklyGoalState(user, { timeZone });
  const weeklyCompleted = await countWeeklySolvedUnique(user._id, weekBounds, { timeZone });
  const weeklyProgress = weeklyGoalSettings.target > 0
    ? Math.min(1, weeklyCompleted / weeklyGoalSettings.target)
    : 1;

  const weeklyBonusAlreadyGranted = await WeeklyGoalBonusCredit.exists({
    userId: user._id,
    weekKey: weekBounds.weekKey,
  });
  const weeklyGoalBonusCount = await WeeklyGoalBonusCredit.countDocuments({
    userId: user._id,
  });
  const earnedRecords = await loadUserAchievementRecords(user._id);

  const xpLevel = computeLevel(user?.stats?.xpTotal || 0);
  const progress = await buildProgressSummary(user);
  const achievements = buildAchievements({
    user,
    progress,
    weeklyGoalBonusCount,
    earnedRecords,
  });
  const preferenceSettings = readWeeklyGoalSettings(user);

  const dailyChallenge = challenge
    ? {
        dayKey: challenge.dayKey,
        questionId: challenge.questionId,
        title: challenge.title,
        kind: challenge.kind,
        tech: challenge.tech,
        difficulty: challenge.difficulty,
        route: challenge.route,
        available: true,
        completed: Boolean(challengeCompletion),
        streak: {
          current: Number(user?.stats?.challengeStreak?.current || 0),
          longest: Number(user?.stats?.challengeStreak?.longest || 0),
        },
      }
    : {
        dayKey: '',
        questionId: '',
        title: 'Daily challenge unavailable',
        kind: 'coding',
        tech: 'javascript',
        difficulty: 'intermediate',
        route: '/coding',
        available: false,
        completed: false,
        streak: {
          current: Number(user?.stats?.challengeStreak?.current || 0),
          longest: Number(user?.stats?.challengeStreak?.longest || 0),
        },
      };

  const weeklyGoal = {
    enabled: weeklyGoalSettings.enabled,
    target: weeklyGoalSettings.target,
    completed: weeklyCompleted,
    progress: weeklyProgress,
    weekKey: weekBounds.weekKey,
    bonusXp: WEEKLY_GOAL_BONUS_XP,
    bonusGranted: Boolean(weeklyBonusAlreadyGranted),
  };

  return {
    nextBestAction: deriveNextBestAction({
      dailyChallengeCompleted: dailyChallenge.completed,
      weeklyGoal,
      progress,
      challenge,
    }),
    dailyChallenge,
    weeklyGoal,
    xpLevel,
    progress,
    achievements,
    prepLoop: await buildPrepLoop(user, { weeklyGoal, dailyChallenge }),
    settings: {
      weeklyGoalEnabled: preferenceSettings.enabled,
      weeklyGoalTarget: preferenceSettings.target,
      showStreakWidget: readStreakVisibility(user),
      dailyChallengeTech: readDailyChallengeTech(user),
    },
  };
}

module.exports = {
  countWeeklySolvedUnique,
  countTodayCompletedKinds,
  buildQuestionProgressSummary,
  buildIncidentProgressSummary,
  buildTradeoffBattleProgressSummary,
  buildProgressSummary,
  buildPrepGoal,
  buildPrepLoop,
  sanitizePrepGoalTech,
  sanitizePrepGoalLevel,
  deriveNextBestAction,
  buildDashboardPayload,
};
