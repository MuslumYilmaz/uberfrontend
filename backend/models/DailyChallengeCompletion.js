const mongoose = require('mongoose');

const DailyChallengeCompletionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    dayKey: { type: String, required: true, index: true }, // YYYY-MM-DD (Europe/Istanbul)
    questionId: { type: String, required: true },
    completedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

DailyChallengeCompletionSchema.index(
  { userId: 1, dayKey: 1 },
  { unique: true, name: 'uniq_user_daily_challenge_completion' }
);

module.exports = mongoose.model('DailyChallengeCompletion', DailyChallengeCompletionSchema);
