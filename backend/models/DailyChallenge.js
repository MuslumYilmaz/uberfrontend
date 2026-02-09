const mongoose = require('mongoose');

const DailyChallengeSchema = new mongoose.Schema(
  {
    dayKey: { type: String, required: true, unique: true, index: true }, // YYYY-MM-DD (Europe/Istanbul)
    questionId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    kind: { type: String, enum: ['coding', 'trivia', 'debug'], required: true },
    tech: { type: String, required: true },
    difficulty: { type: String, default: 'intermediate' },
    route: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DailyChallenge', DailyChallengeSchema);
