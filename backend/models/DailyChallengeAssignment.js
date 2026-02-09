const mongoose = require('mongoose');

const DailyChallengeAssignmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    dayKey: { type: String, required: true, index: true }, // YYYY-MM-DD (Europe/Istanbul)
    questionId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    kind: { type: String, enum: ['coding', 'trivia', 'debug'], required: true },
    tech: { type: String, required: true },
    difficulty: { type: String, default: 'intermediate' },
    route: { type: String, required: true },
  },
  { timestamps: true }
);

DailyChallengeAssignmentSchema.index({ userId: 1, dayKey: 1 }, { unique: true });

module.exports = mongoose.model('DailyChallengeAssignment', DailyChallengeAssignmentSchema);
