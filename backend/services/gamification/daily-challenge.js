const DailyChallenge = require('../../models/DailyChallenge');
const DailyChallengeAssignment = require('../../models/DailyChallengeAssignment');
const {
  DAILY_CHALLENGE_RECENT_WINDOW_DAYS,
  APP_TIMEZONE,
  DAILY_CHALLENGE_TECH_PRIORITY,
} = require('./constants');
const { readDailyChallengeTech } = require('./engine');
const { loadQuestionCatalog } = require('./question-catalog');
const { dayKeyInTimezone, shiftDayKey } = require('./timezone');

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickDeterministicQuestion(pool, dayKey) {
  const seed = hashString(`frontendatlas-daily:${dayKey}`);
  const index = seed % pool.length;
  return pool[index];
}

function choosePreferredTechFromSolved(user, catalog) {
  const solvedIds = Array.isArray(user?.solvedQuestionIds) ? user.solvedQuestionIds : [];
  if (!solvedIds.length) return null;

  const counts = new Map();
  for (const id of solvedIds) {
    const question = catalog.byId.get(id);
    const tech = String(question?.tech || '').toLowerCase();
    if (!tech || !DAILY_CHALLENGE_TECH_PRIORITY.includes(tech)) continue;
    counts.set(tech, (counts.get(tech) || 0) + 1);
  }

  if (!counts.size) return null;

  let bestTech = null;
  let bestCount = -1;
  for (const tech of DAILY_CHALLENGE_TECH_PRIORITY) {
    const count = counts.get(tech) || 0;
    if (count > bestCount) {
      bestTech = tech;
      bestCount = count;
    }
  }
  return bestCount > 0 ? bestTech : null;
}

function resolveDailyChallengeTechPreference(user, catalog) {
  const explicit = readDailyChallengeTech(user);
  if (explicit && explicit !== 'auto') return explicit;
  return choosePreferredTechFromSolved(user, catalog);
}

function getRecentEligiblePool(pool, recentIds) {
  const filtered = pool.filter((question) => !recentIds.has(question.id));
  const minPoolSize = Math.max(5, Math.floor(pool.length * 0.2));
  return filtered.length >= minPoolSize ? filtered : pool;
}

function selectDailyChallengeQuestion({ basePool, dayKey, userId, preferredTech, recentIds }) {
  const preferredPool = preferredTech
    ? basePool.filter((question) => question.tech === preferredTech)
    : basePool;
  const scopedPool = preferredPool.length ? preferredPool : basePool;
  const recentFilteredPool = getRecentEligiblePool(scopedPool, recentIds);
  const deterministicScope = `${dayKey}:${preferredTech || 'all'}:${userId || 'anon'}`;
  return pickDeterministicQuestion(recentFilteredPool, deterministicScope);
}

function toChallengeDoc(question, dayKey) {
  const questionId = question?.questionId || question?.id;
  return {
    dayKey,
    questionId,
    title: question?.title,
    kind: question?.kind,
    tech: question?.tech,
    difficulty: question?.difficulty || 'intermediate',
    route: question?.route,
  };
}

async function getOrCreateDailyChallenge({ user = null, now = new Date(), timeZone = APP_TIMEZONE } = {}) {
  const dayKey = dayKeyInTimezone(now, timeZone);
  const existing = await DailyChallenge.findOne({ dayKey }).lean();

  if (user?._id) {
    const existingAssignment = await DailyChallengeAssignment.findOne({
      userId: user._id,
      dayKey,
    }).lean();
    if (existingAssignment) {
      return toChallengeDoc(existingAssignment, dayKey);
    }
  }

  const catalog = loadQuestionCatalog();
  const basePool = (catalog.freeCodingPool || []).slice().sort((a, b) => a.id.localeCompare(b.id));
  if (!basePool.length) return null;

  const lookbackStart = shiftDayKey(dayKey, -(DAILY_CHALLENGE_RECENT_WINDOW_DAYS - 1));
  const recent = await DailyChallenge.find({
    dayKey: { $gte: lookbackStart, $lt: dayKey },
  }).select('questionId').lean();
  const recentIds = new Set(recent.map((row) => row.questionId));

  if (!existing) {
    const globalSelected = selectDailyChallengeQuestion({
      basePool,
      dayKey,
      userId: 'global',
      preferredTech: null,
      recentIds,
    });
    const payload = toChallengeDoc(globalSelected, dayKey);

    try {
      await DailyChallenge.create(payload);
    } catch (error) {
      if (!(error && error.code === 11000)) throw error;
    }
  }

  const preferredTech = resolveDailyChallengeTechPreference(user, catalog);
  const selected = selectDailyChallengeQuestion({
    basePool,
    dayKey,
    userId: String(user?._id || user?.id || 'anon'),
    preferredTech,
    recentIds,
  });
  const challengeDoc = toChallengeDoc(selected, dayKey);

  if (!user?._id) {
    return challengeDoc;
  }

  try {
    await DailyChallengeAssignment.create({
      userId: user._id,
      ...challengeDoc,
    });
    return challengeDoc;
  } catch (error) {
    if (!(error && error.code === 11000)) throw error;
  }

  const existingAssignment = await DailyChallengeAssignment.findOne({
    userId: user._id,
    dayKey,
  }).lean();
  return existingAssignment ? toChallengeDoc(existingAssignment, dayKey) : challengeDoc;
}

module.exports = {
  getOrCreateDailyChallenge,
  resolveDailyChallengeTechPreference,
  selectDailyChallengeQuestion,
};
