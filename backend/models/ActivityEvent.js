const mongoose = require('mongoose');

const ActivityEventSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
        kind: { type: String, enum: ['coding', 'trivia', 'debug', 'incident'], required: true },
        tech: {
            type: String,
            enum: ['javascript', 'angular', 'react', 'vue', 'html', 'css', 'system-design'],
            required: true
        },
        itemId: { type: String }, // your internal exercise/trivia id
        source: { type: String, enum: ['tech', 'company', 'course', 'system'], default: 'tech' },
        durationMin: { type: Number, default: 0 },
        xp: { type: Number, default: 0 },
        completedAt: { type: Date, default: Date.now },

        // for fast day grouping (UTC day string)
        dayUTC: { type: String, index: true }, // 'YYYY-MM-DD'
    },
    { timestamps: true }
);

ActivityEventSchema.index(
    { userId: 1, completedAt: -1 },
    { name: 'idx_activity_event_user_completed_at' }
);
ActivityEventSchema.index(
    { userId: 1, dayUTC: 1 },
    { name: 'idx_activity_event_user_day' }
);

module.exports = mongoose.model('ActivityEvent', ActivityEventSchema);
