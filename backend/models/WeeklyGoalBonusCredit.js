const mongoose = require('mongoose');

const WeeklyGoalBonusCreditSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    weekKey: { type: String, required: true, index: true }, // Monday day key in Europe/Istanbul
    xp: { type: Number, required: true, default: 50 },
    grantedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

WeeklyGoalBonusCreditSchema.index(
  { userId: 1, weekKey: 1 },
  { unique: true, name: 'uniq_user_weekly_goal_bonus' }
);

module.exports = mongoose.model('WeeklyGoalBonusCredit', WeeklyGoalBonusCreditSchema);
