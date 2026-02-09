const {
  DIFFICULTY_XP,
  LEVEL_STEP_XP,
  DAILY_CHALLENGE_TECH_OPTIONS,
  WEEKLY_GOAL_DEFAULT_TARGET,
  WEEKLY_GOAL_MIN_TARGET,
  WEEKLY_GOAL_MAX_TARGET,
} = require('./constants');
const { dayDiffByKey } = require('./timezone');

function normalizeDifficulty(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'easy' || raw === 'hard') return raw;
  return 'intermediate';
}

function xpForCompletion({ kind, difficulty }) {
  if (kind === 'trivia') return 5;
  if (kind === 'coding' || kind === 'debug') {
    return DIFFICULTY_XP[normalizeDifficulty(difficulty)] || DIFFICULTY_XP.intermediate;
  }
  return 0;
}

function computeLevel(totalXp) {
  const xp = Math.max(0, Number(totalXp) || 0);
  const level = Math.floor(xp / LEVEL_STEP_XP) + 1;
  const currentLevelXp = xp % LEVEL_STEP_XP;
  const nextLevelXp = level * LEVEL_STEP_XP;
  const progress = LEVEL_STEP_XP > 0 ? currentLevelXp / LEVEL_STEP_XP : 1;

  return {
    totalXp: xp,
    level,
    levelStepXp: LEVEL_STEP_XP,
    currentLevelXp,
    nextLevelXp,
    progress,
  };
}

function sanitizeWeeklyGoalTarget(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return WEEKLY_GOAL_DEFAULT_TARGET;
  return Math.min(WEEKLY_GOAL_MAX_TARGET, Math.max(WEEKLY_GOAL_MIN_TARGET, Math.round(n)));
}

function readWeeklyGoalSettings(user) {
  const prefs = user?.prefs?.gamification || {};
  return {
    enabled: prefs.weeklyGoalEnabled !== false,
    target: sanitizeWeeklyGoalTarget(prefs.weeklyGoalTarget),
  };
}

function readStreakVisibility(user) {
  return user?.prefs?.gamification?.showStreakWidget !== false;
}

function sanitizeDailyChallengeTech(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'auto';
  if (DAILY_CHALLENGE_TECH_OPTIONS.includes(raw)) return raw;
  return 'auto';
}

function readDailyChallengeTech(user) {
  return sanitizeDailyChallengeTech(user?.prefs?.gamification?.dailyChallengeTech);
}

function applyChallengeStreak(previous, completionDayKey) {
  const state = {
    current: Math.max(0, Number(previous?.current) || 0),
    longest: Math.max(0, Number(previous?.longest) || 0),
    lastCompletedLocalDate: previous?.lastCompletedLocalDate || null,
  };

  if (state.lastCompletedLocalDate === completionDayKey) {
    return {
      next: state,
      changed: false,
      incremented: false,
      broken: false,
    };
  }

  const diff = dayDiffByKey(state.lastCompletedLocalDate, completionDayKey);
  const broken = Number.isFinite(diff) && diff > 1 && state.current > 0;

  if (diff === 1) {
    state.current += 1;
  } else {
    state.current = 1;
  }
  state.longest = Math.max(state.longest, state.current);
  state.lastCompletedLocalDate = completionDayKey;

  return {
    next: state,
    changed: true,
    incremented: true,
    broken,
  };
}

module.exports = {
  normalizeDifficulty,
  xpForCompletion,
  computeLevel,
  sanitizeWeeklyGoalTarget,
  readWeeklyGoalSettings,
  readStreakVisibility,
  sanitizeDailyChallengeTech,
  readDailyChallengeTech,
  applyChallengeStreak,
};
