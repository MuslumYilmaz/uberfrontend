const router = require('express').Router();
const { requireAuth } = require('../middleware/Auth');
const User = require('../models/User');
const DailyChallengeCompletion = require('../models/DailyChallengeCompletion');
const { getOrCreateDailyChallenge } = require('../services/gamification/daily-challenge');
const { applyChallengeStreak, computeLevel } = require('../services/gamification/engine');
const { awardWeeklyGoalBonusIfEligible } = require('../services/gamification/weekly-goal');

router.post('/complete', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId).select('solvedQuestionIds stats prefs');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const challenge = await getOrCreateDailyChallenge({ user });
    if (!challenge) {
      return res.status(503).json({ error: 'Daily challenge is temporarily unavailable.' });
    }
    const requestedQuestionId = typeof req.body?.questionId === 'string' ? req.body.questionId.trim() : '';
    if (requestedQuestionId && requestedQuestionId !== challenge.questionId) {
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

    const existing = await DailyChallengeCompletion.findOne({
      userId: user._id,
      dayKey: challenge.dayKey,
    }).lean();

    if (existing) {
      const weekly = await awardWeeklyGoalBonusIfEligible(user);
      await user.save();
      return res.json({
        alreadyCompleted: true,
        dayKey: challenge.dayKey,
        streak: user.stats?.challengeStreak || { current: 0, longest: 0 },
        weeklyGoal: {
          completed: weekly.weeklyCompleted,
          target: weekly.settings.target,
          progress: weekly.settings.target > 0 ? Math.min(1, weekly.weeklyCompleted / weekly.settings.target) : 1,
          reached: weekly.reached,
          bonusGranted: weekly.bonusAlreadyGranted,
        },
        xp: computeLevel(user.stats?.xpTotal || 0),
      });
    }

    await DailyChallengeCompletion.create({
      userId: user._id,
      dayKey: challenge.dayKey,
      questionId: challenge.questionId,
    });

    user.stats = user.stats || {};
    const streakUpdate = applyChallengeStreak(user.stats.challengeStreak, challenge.dayKey);
    user.stats.challengeStreak = streakUpdate.next;

    const weekly = await awardWeeklyGoalBonusIfEligible(user);
    await user.save();

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
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to complete daily challenge' });
  }
});

module.exports = router;
