const WeeklyGoalState = require('../../models/WeeklyGoalState');
const { APP_TIMEZONE } = require('./constants');
const { currentWeekBounds } = require('./timezone');
const { readWeeklyGoalSettings } = require('./engine');

function normalizeSnapshot(doc, fallbackSettings) {
  if (!doc) return fallbackSettings;
  return {
    enabled: doc.enabled !== false,
    target: Number(doc.target || fallbackSettings.target),
  };
}

async function findWeeklyGoalState(userId, weekKey, session = null) {
  const query = WeeklyGoalState.findOne({ userId, weekKey });
  if (session) query.session(session);
  return query.lean();
}

async function ensureCurrentWeeklyGoalState(
  user,
  { timeZone = APP_TIMEZONE, session = null, sourceSettings = null } = {}
) {
  const weekBounds = currentWeekBounds(timeZone);
  const fallbackSettings = sourceSettings || readWeeklyGoalSettings(user);

  let state = await findWeeklyGoalState(user._id, weekBounds.weekKey, session);
  if (!state) {
    const snapshot = {
      userId: user._id,
      weekKey: weekBounds.weekKey,
      enabled: fallbackSettings.enabled !== false,
      target: Number(fallbackSettings.target ?? 10),
    };
    try {
      if (session) {
        await WeeklyGoalState.create([snapshot], { session });
      } else {
        await WeeklyGoalState.create(snapshot);
      }
    } catch (error) {
      if (!(error && error.code === 11000)) throw error;
    }
    state = await findWeeklyGoalState(user._id, weekBounds.weekKey, session);
  }

  return {
    weekBounds,
    state,
    settings: normalizeSnapshot(state, fallbackSettings),
  };
}

module.exports = {
  ensureCurrentWeeklyGoalState,
};
