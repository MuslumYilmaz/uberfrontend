const ACHIEVEMENT_CATALOG = [
  {
    id: 'first-steps',
    title: 'First Steps',
    reason: 'Complete 3 practice units.',
    icon: 'flag',
    theme: 'gold',
    target: 3,
    readCurrent: ({ progress }) => progress?.practice?.completedCount,
  },
  {
    id: 'question-builder',
    title: 'Problem Solver',
    reason: 'Solve 10 current-catalog questions.',
    icon: 'code',
    theme: 'cyan',
    target: 10,
    readCurrent: ({ progress }) => progress?.questions?.solvedCount,
  },
  {
    id: 'coverage-builder',
    title: 'Coverage Builder',
    reason: 'Complete 25 practice units.',
    icon: 'target',
    theme: 'blue',
    target: 25,
    readCurrent: ({ progress }) => progress?.practice?.completedCount,
  },
  {
    id: 'debug-starter',
    title: 'Debug Starter',
    reason: 'Pass 1 debug scenario.',
    icon: 'bug',
    theme: 'green',
    target: 1,
    readCurrent: ({ progress }) => progress?.incidents?.passedCount,
  },
  {
    id: 'tradeoff-starter',
    title: 'Tradeoff Starter',
    reason: 'Complete 1 tradeoff battle.',
    icon: 'shuffle',
    theme: 'violet',
    target: 1,
    readCurrent: ({ progress }) => progress?.tradeoffBattles?.completedCount,
  },
  {
    id: 'weekly-finisher',
    title: 'Weekly Finisher',
    reason: 'Earn 1 weekly-goal bonus.',
    icon: 'calendar',
    theme: 'amber',
    target: 1,
    readCurrent: ({ weeklyGoalBonusCount }) => weeklyGoalBonusCount,
  },
  {
    id: 'consistency',
    title: 'Consistency',
    reason: 'Reach a 7-day activity streak.',
    icon: 'flame',
    theme: 'rose',
    target: 7,
    readCurrent: ({ user }) => user?.stats?.streak?.longest,
  },
];

const ACHIEVEMENT_IDS = new Set(ACHIEVEMENT_CATALOG.map((entry) => entry.id));

function clampNumber(value, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.min(max, Math.max(min, numeric));
}

function toIsoString(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeAchievementRecord(record) {
  const achievementId = String(record?.achievementId || record?.id || '').trim();
  if (!achievementId || !ACHIEVEMENT_IDS.has(achievementId)) return null;
  return {
    achievementId,
    earnedAt: toIsoString(record?.earnedAt),
    seenAt: toIsoString(record?.seenAt),
  };
}

function buildRecordMap(records = []) {
  const map = new Map();
  for (const record of Array.isArray(records) ? records : []) {
    const normalized = normalizeAchievementRecord(record);
    if (!normalized) continue;
    map.set(normalized.achievementId, normalized);
  }
  return map;
}

function stripInternalAchievementFields(achievement) {
  const { _record, ...publicAchievement } = achievement;
  return publicAchievement;
}

function toAchievement(entry, context, recordById) {
  const target = Math.max(1, Number(entry.target) || 1);
  const rawCurrent = Math.max(0, Number(entry.readCurrent(context)) || 0);
  const current = clampNumber(rawCurrent, 0, target);
  const progress = target > 0 ? current / target : 1;
  const record = recordById?.get(entry.id) || null;
  const earnedFromProgress = rawCurrent >= target;
  const unlocked = earnedFromProgress || Boolean(record);

  return {
    id: entry.id,
    title: entry.title,
    reason: entry.reason,
    icon: entry.icon,
    theme: entry.theme,
    current: unlocked ? Math.max(current, target) : current,
    target,
    progress: unlocked ? 1 : progress,
    unlocked,
    ...(record?.earnedAt ? { earnedAt: record.earnedAt } : {}),
    _record: record,
  };
}

function buildAchievements({ user, progress, weeklyGoalBonusCount = 0, earnedRecords = [] } = {}) {
  const context = {
    user,
    progress: progress || {},
    weeklyGoalBonusCount,
  };
  const recordById = buildRecordMap(earnedRecords);

  const all = ACHIEVEMENT_CATALOG.map((entry) => toAchievement(entry, context, recordById));
  const unlocked = all.filter((achievement) => achievement.unlocked);
  const next = all
    .filter((achievement) => !achievement.unlocked)
    .sort((a, b) => {
      const progressDelta = b.progress - a.progress;
      if (progressDelta !== 0) return progressDelta;
      return ACHIEVEMENT_CATALOG.findIndex((entry) => entry.id === a.id)
        - ACHIEVEMENT_CATALOG.findIndex((entry) => entry.id === b.id);
    });

  return {
    summary: {
      unlockedCount: unlocked.length,
      totalCount: all.length,
    },
    unlocked: unlocked.map(stripInternalAchievementFields),
    next: next.slice(0, 3).map(stripInternalAchievementFields),
    unseen: unlocked
      .filter((achievement) => achievement._record?.earnedAt && !achievement._record?.seenAt)
      .map(stripInternalAchievementFields),
  };
}

function unlockedAchievementIds(achievements) {
  return new Set((achievements?.unlocked || []).map((achievement) => achievement.id));
}

function newlyUnlockedAchievements(beforeAchievements, afterAchievements) {
  const beforeUnlocked = unlockedAchievementIds(beforeAchievements);
  return (afterAchievements?.unlocked || []).filter((achievement) => !beforeUnlocked.has(achievement.id));
}

function toAchievementAward(achievement, earnedAt) {
  return {
    id: achievement.id,
    title: achievement.title,
    reason: achievement.reason,
    icon: achievement.icon,
    theme: achievement.theme,
    current: achievement.current,
    target: achievement.target,
    progress: achievement.progress,
    earnedAt: toIsoString(earnedAt) || toIsoString(new Date()),
  };
}

function validAchievementIds(ids = []) {
  return Array.from(new Set(
    (Array.isArray(ids) ? ids : [])
      .map((id) => String(id || '').trim())
      .filter((id) => ACHIEVEMENT_IDS.has(id))
  ));
}

module.exports = {
  ACHIEVEMENT_CATALOG,
  ACHIEVEMENT_IDS,
  buildAchievements,
  newlyUnlockedAchievements,
  toAchievementAward,
  validAchievementIds,
};
