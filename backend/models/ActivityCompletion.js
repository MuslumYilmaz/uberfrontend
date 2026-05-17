const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const ActivityCompletionSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        kind: { type: String, enum: ['coding', 'trivia', 'debug', 'incident'], required: true },
        itemId: { type: String, required: true, trim: true },
        tech: { type: String, required: true, trim: true },
        source: { type: String, default: 'tech', trim: true },
        durationMin: { type: Number, default: 0 },
        difficultySnapshot: { type: String, default: 'intermediate', trim: true },
        xpAwarded: { type: Number, default: 0 },
        completedAt: { type: Date, default: Date.now },
        dayUTC: { type: String, required: true, trim: true },
        active: { type: Boolean, default: true },
        createdFromLegacyCredit: { type: Boolean, default: false },
        lastAttemptAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

ActivityCompletionSchema.index(
    { userId: 1, kind: 1, itemId: 1 },
    { unique: true, name: 'uniq_user_kind_item_completion' }
);
ActivityCompletionSchema.index(
    { userId: 1, active: 1, completedAt: -1 },
    { name: 'idx_activity_completion_user_active_completed_at' }
);
ActivityCompletionSchema.index(
    { userId: 1, active: 1, tech: 1, kind: 1, lastAttemptAt: -1 },
    { name: 'idx_activity_completion_dashboard_prep' }
);

module.exports = model('ActivityCompletion', ActivityCompletionSchema);
