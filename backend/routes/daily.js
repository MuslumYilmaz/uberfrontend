const router = require('express').Router();
const { requireAuth } = require('../middleware/Auth');
const User = require('../models/User');
const DailyChallengeCompletion = require('../models/DailyChallengeCompletion');
const { getOrCreateDailyChallenge } = require('../services/gamification/daily-challenge');
const { applyChallengeStreak, computeLevel } = require('../services/gamification/engine');
const { awardWeeklyGoalBonusIfEligible } = require('../services/gamification/weekly-goal');
const WeeklyGoalBonusCredit = require('../models/WeeklyGoalBonusCredit');
const { buildProgressSummary } = require('../services/gamification/dashboard');
const { buildAchievements } = require('../services/gamification/achievements');
const {
  awardNewAchievementTransitions,
  loadUserAchievementRecords,
} = require('../services/gamification/achievement-awards');

async function buildAchievementsForUser(user) {
  const [progress, weeklyGoalBonusCount, earnedRecords] = await Promise.all([
    buildProgressSummary(user),
    WeeklyGoalBonusCredit.countDocuments({ userId: user._id }),
    loadUserAchievementRecords(user._id),
  ]);

  return buildAchievements({
    user,
    progress,
    weeklyGoalBonusCount,
    earnedRecords,
  });
}

router.post('/complete', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId).select('solvedQuestionIds stats prefs');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const challenge = await getOrCreateDailyChallenge({ user });
    if (!challenge) {
      return res.status(503).json({ error: 'Daily challenge is temporarily unavailable.' });
    }
    const requestedQuestionId = typeof req.body?.questionId === 'string' ? req.body.questionId.trim() : '';
    if (!requestedQuestionId) {
      return res.status(400).json({ error: 'questionId is required.' });
    }
    if (requestedQuestionId !== challenge.questionId) {
      return res.status(400).json({ error: 'Question does not match today’s challenge.' });
    }

    const solvedIds = new Set(Array.isArray(user.solvedQuestionIds) ? user.solvedQuestionIds : []);
    if (!solvedIds.has(challenge.questionId)) {
      return res.status(400).json({
        error: 'Solve the daily challenge question first, then mark it complete.',
        challenge: {
          questionId: challenge.questionId,
          route: challenge.route,
        },
      });
    }

    const beforeAchievements = await buildAchievementsForUser(user);
    const buildAlreadyCompletedPayload = async () => {
      const freshUser = await User.findById(req.auth.userId).select('stats prefs solvedQuestionIds');
      if (!freshUser) return null;
      const beforeAlreadyCompletedAchievements = await buildAchievementsForUser(freshUser);
      const weekly = await awardWeeklyGoalBonusIfEligible(freshUser);
      await freshUser.save();
      const afterAlreadyCompletedAchievements = await buildAchievementsForUser(freshUser);
      const achievementAwards = await awardNewAchievementTransitions({
        userId: freshUser._id,
        beforeAchievements: beforeAlreadyCompletedAchievements,
        afterAchievements: afterAlreadyCompletedAchievements,
        earnedAt: new Date(),
      });
      return res.json({
        alreadyCompleted: true,
        dayKey: challenge.dayKey,
        streak: freshUser.stats?.challengeStreak || { current: 0, longest: 0 },
        weeklyGoal: {
          completed: weekly.weeklyCompleted,
          target: weekly.settings.target,
          progress: weekly.settings.target > 0 ? Math.min(1, weekly.weeklyCompleted / weekly.settings.target) : 1,
          reached: weekly.reached,
          bonusGranted: weekly.bonusAlreadyGranted,
        },
        xp: computeLevel(freshUser.stats?.xpTotal || 0),
        achievementAwards,
      });
    };

    const existingCompletion = await DailyChallengeCompletion.findOne({
      userId: user._id,
      dayKey: challenge.dayKey,
    }).select('_id').lean();
    if (existingCompletion) {
      return buildAlreadyCompletedPayload();
    }

    try {
      await DailyChallengeCompletion.create({
        _id: DailyChallengeCompletion.buildId(user._id, challenge.dayKey),
        userId: user._id,
        dayKey: challenge.dayKey,
        questionId: challenge.questionId,
        completedAt: new Date(),
      });
    } catch (error) {
      if (error?.code === 11000) {
        return buildAlreadyCompletedPayload();
      }
      throw error;
    }

    user.stats = user.stats || {};
    const streakUpdate = applyChallengeStreak(user.stats.challengeStreak, challenge.dayKey);
    user.stats.challengeStreak = streakUpdate.next;

    const weekly = await awardWeeklyGoalBonusIfEligible(user);
    await user.save();
    const afterAchievements = await buildAchievementsForUser(user);
    const achievementAwards = await awardNewAchievementTransitions({
      userId: user._id,
      beforeAchievements,
      afterAchievements,
      earnedAt: new Date(),
    });

    return res.json({
      completed: true,
      dayKey: challenge.dayKey,
      streak: user.stats.challengeStreak,
      streakIncremented: streakUpdate.incremented,
      streakBroken: streakUpdate.broken,
      weeklyGoal: {
        completed: weekly.weeklyCompleted,
        target: weekly.settings.target,
        progress: weekly.settings.target > 0 ? Math.min(1, weekly.weeklyCompleted / weekly.settings.target) : 1,
        reached: weekly.reached,
        bonusGranted: weekly.awarded || weekly.bonusAlreadyGranted,
      },
      xpAwarded: weekly.bonusXp,
      levelUp: weekly.awarded,
      xp: computeLevel(user.stats?.xpTotal || 0),
      achievementAwards,
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to complete daily challenge' });
  }
});

module.exports = router;
