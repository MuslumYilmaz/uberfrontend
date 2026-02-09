const router = require('express').Router();
const { requireAuth } = require('../middleware/Auth');
const User = require('../models/User');
const {
  sanitizeWeeklyGoalTarget,
  readStreakVisibility,
  sanitizeDailyChallengeTech,
  readDailyChallengeTech,
} = require('../services/gamification/engine');
const { countWeeklySolvedUnique } = require('../services/gamification/dashboard');
const { currentWeekBounds } = require('../services/gamification/timezone');

router.post('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId).select('prefs');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const enabled = req.body?.enabled !== false;
    const target = sanitizeWeeklyGoalTarget(req.body?.target);
    const showStreakWidget = req.body?.showStreakWidget !== false;
    const dailyChallengeTech = sanitizeDailyChallengeTech(req.body?.dailyChallengeTech);

    user.prefs = user.prefs || {};
    user.prefs.gamification = user.prefs.gamification || {};
    user.prefs.gamification.weeklyGoalEnabled = enabled;
    user.prefs.gamification.weeklyGoalTarget = target;
    user.prefs.gamification.showStreakWidget = showStreakWidget;
    user.prefs.gamification.dailyChallengeTech = dailyChallengeTech;

    await user.save();

    const weekBounds = currentWeekBounds();
    const weeklyCompleted = await countWeeklySolvedUnique(user._id, weekBounds);
    const progress = target > 0 ? Math.min(1, weeklyCompleted / target) : 1;

    return res.json({
      weeklyGoal: {
        enabled,
        target,
        completed: weeklyCompleted,
        progress,
        weekKey: weekBounds.weekKey,
      },
      settings: {
        showStreakWidget: readStreakVisibility(user),
        dailyChallengeTech: readDailyChallengeTech(user),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to update weekly goal' });
  }
});

module.exports = router;
