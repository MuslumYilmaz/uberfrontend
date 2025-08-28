const mongoose = require('mongoose');

const ActivityEventSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
        kind: { type: String, enum: ['coding', 'trivia', 'debug'], required: true },
        tech: { type: String, enum: ['javascript', 'angular'], required: true },
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

module.exports = mongoose.model('ActivityEvent', ActivityEventSchema);
