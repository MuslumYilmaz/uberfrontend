const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const PracticeProgressSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        family: {
            type: String,
            enum: ['question', 'incident', 'code-review', 'tradeoff-battle'],
            required: true,
            trim: true,
        },
        itemId: { type: String, required: true, trim: true },
        started: { type: Boolean, default: false },
        completed: { type: Boolean, default: false },
        passed: { type: Boolean, default: false },
        bestScore: { type: Number, default: 0 },
        lastPlayedAt: { type: Date, default: null },
        extension: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

PracticeProgressSchema.index(
    { userId: 1, family: 1, itemId: 1 },
    { unique: true, name: 'uniq_user_family_item_practice_progress' }
);

module.exports = model('PracticeProgress', PracticeProgressSchema);
