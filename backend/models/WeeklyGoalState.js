const mongoose = require('mongoose');

const WeeklyGoalStateSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    weekKey: { type: String, required: true, index: true }, // Monday day key in app timezone
    enabled: { type: Boolean, required: true, default: true },
    target: { type: Number, required: true, default: 10 },
  },
  { timestamps: true }
);

WeeklyGoalStateSchema.index(
  { userId: 1, weekKey: 1 },
  { unique: true, name: 'uniq_user_weekly_goal_state' }
);

module.exports = mongoose.model('WeeklyGoalState', WeeklyGoalStateSchema);
