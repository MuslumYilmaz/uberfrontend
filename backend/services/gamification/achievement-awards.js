const UserAchievement = require('../../models/UserAchievement');
const {
  newlyUnlockedAchievements,
  toAchievementAward,
  validAchievementIds,
} = require('./achievements');

function isDuplicateKeyError(error) {
  return Boolean(error && error.code === 11000);
}

async function loadUserAchievementRecords(userId, { session = null } = {}) {
  if (!userId) return [];
  const query = UserAchievement.find({ userId });
  if (session) query.session(session);
  return query.lean();
}

async function awardNewAchievementTransitions({
  userId,
  beforeAchievements,
  afterAchievements,
  earnedAt = new Date(),
  session = null,
} = {}) {
  if (!userId) return [];

  const candidates = newlyUnlockedAchievements(beforeAchievements, afterAchievements);
  if (!candidates.length) return [];

  const awards = [];
  for (const achievement of candidates) {
    try {
      const payload = {
        userId,
        achievementId: achievement.id,
        earnedAt,
        seenAt: null,
      };
      const options = { upsert: true, setDefaultsOnInsert: true };
      if (session) options.session = session;
      const result = await UserAchievement.updateOne(
        { userId, achievementId: achievement.id },
        { $setOnInsert: payload },
        options
      );
      if (Number(result?.upsertedCount || 0) > 0 || result?.upsertedId) {
        awards.push(toAchievementAward(achievement, earnedAt));
      }
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
    }
  }

  return awards;
}

async function markAchievementsSeen({ userId, ids, seenAt = new Date() } = {}) {
  const achievementIds = validAchievementIds(ids);
  if (!userId || !achievementIds.length) {
    return { matchedCount: 0, modifiedCount: 0, ids: [] };
  }

  const result = await UserAchievement.updateMany(
    { userId, achievementId: { $in: achievementIds }, seenAt: null },
    { $set: { seenAt } }
  );

  return {
    matchedCount: Number(result?.matchedCount || 0),
    modifiedCount: Number(result?.modifiedCount || 0),
    ids: achievementIds,
  };
}

module.exports = {
  awardNewAchievementTransitions,
  loadUserAchievementRecords,
  markAchievementsSeen,
};
