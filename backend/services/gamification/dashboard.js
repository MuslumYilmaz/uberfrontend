const ActivityEvent = require('../../models/ActivityEvent');
const WeeklyGoalBonusCredit = require('../../models/WeeklyGoalBonusCredit');
const { APP_TIMEZONE, SOLVE_KINDS, WEEKLY_GOAL_BONUS_XP } = require('./constants');
const {
  computeLevel,
  readWeeklyGoalSettings,
  readStreakVisibility,
  readDailyChallengeTech,
} = require('./engine');
const { currentWeekBounds, dayKeyInTimezone } = require('./timezone');
const { loadQuestionCatalog } = require('./question-catalog');

function toTitleCase(input) {
  return String(input || '')
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function countWeeklySolvedUnique(userId, weekBounds, { timeZone = APP_TIMEZONE } = {}) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 14);

  const rows = await ActivityEvent.find({
    userId,
    kind: { $in: Array.from(SOLVE_KINDS) },
    itemId: { $exists: true, $ne: '' },
    completedAt: { $gte: since },
  })
    .select('kind itemId completedAt')
    .lean();

  const unique = new Set();
  for (const row of rows) {
    const dayKey = dayKeyInTimezone(new Date(row.completedAt), timeZone);
    if (dayKey < weekBounds.startDayKey || dayKey > weekBounds.endDayKey) continue;
    unique.add(`${row.kind}:${row.itemId}`);
  }
  return unique.size;
}

function buildProgressSummary(user) {
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

  if (progress.solvedPercent < 30) {
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
  const weekBounds = currentWeekBounds(timeZone);
  const weeklyGoalSettings = readWeeklyGoalSettings(user);
  const weeklyCompleted = await countWeeklySolvedUnique(user._id, weekBounds, { timeZone });
  const weeklyProgress = weeklyGoalSettings.target > 0
    ? Math.min(1, weeklyCompleted / weeklyGoalSettings.target)
    : 1;

  const weeklyBonusAlreadyGranted = await WeeklyGoalBonusCredit.exists({
    userId: user._id,
    weekKey: weekBounds.weekKey,
  });

  const xpLevel = computeLevel(user?.stats?.xpTotal || 0);
  const progress = buildProgressSummary(user);

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
    settings: {
      showStreakWidget: readStreakVisibility(user),
      dailyChallengeTech: readDailyChallengeTech(user),
    },
  };
}

module.exports = {
  countWeeklySolvedUnique,
  buildProgressSummary,
  deriveNextBestAction,
  buildDashboardPayload,
};
