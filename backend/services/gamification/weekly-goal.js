const WeeklyGoalBonusCredit = require('../../models/WeeklyGoalBonusCredit');
const { WEEKLY_GOAL_BONUS_XP, APP_TIMEZONE } = require('./constants');
const { readWeeklyGoalSettings } = require('./engine');
const { currentWeekBounds } = require('./timezone');
const { countWeeklySolvedUnique } = require('./dashboard');

async function awardWeeklyGoalBonusIfEligible(user, { timeZone = APP_TIMEZONE } = {}) {
  const settings = readWeeklyGoalSettings(user);
  const weekBounds = currentWeekBounds(timeZone);
  const weeklyCompleted = await countWeeklySolvedUnique(user._id, weekBounds, { timeZone });
  const reached = settings.enabled && weeklyCompleted >= settings.target;

  let awarded = false;
  let bonusXp = 0;

  if (reached) {
    try {
      await WeeklyGoalBonusCredit.create({
        userId: user._id,
        weekKey: weekBounds.weekKey,
        xp: WEEKLY_GOAL_BONUS_XP,
      });
      user.stats = user.stats || {};
      user.stats.xpTotal = Number(user.stats.xpTotal || 0) + WEEKLY_GOAL_BONUS_XP;
      awarded = true;
      bonusXp = WEEKLY_GOAL_BONUS_XP;
    } catch (error) {
      if (!(error && error.code === 11000)) throw error;
    }
  }

  const bonusAlreadyGranted = await WeeklyGoalBonusCredit.exists({
    userId: user._id,
    weekKey: weekBounds.weekKey,
  });

  return {
    settings,
    weekBounds,
    weeklyCompleted,
    reached,
    awarded,
    bonusXp,
    bonusAlreadyGranted: Boolean(bonusAlreadyGranted),
  };
}

module.exports = {
  awardWeeklyGoalBonusIfEligible,
};
