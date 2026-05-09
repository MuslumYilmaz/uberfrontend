const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const UserAchievementSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    achievementId: { type: String, required: true, trim: true },
    earnedAt: { type: Date, default: Date.now },
    seenAt: { type: Date, default: null },
  },
  { timestamps: true }
);

UserAchievementSchema.index(
  { userId: 1, achievementId: 1 },
  { unique: true, name: 'uniq_user_achievement' }
);

module.exports = model('UserAchievement', UserAchievementSchema);
