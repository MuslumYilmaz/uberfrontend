// server/models/XpCredit.js
const { Schema, model } = require('mongoose');

const XpCreditSchema = new Schema(
    {
        userId: { type: String, required: true },                 // store as string for easy unique key
        dayUTC: { type: String, required: true },                 // 'YYYY-MM-DD'
        kind: { type: String, enum: ['coding', 'trivia', 'debug'], required: true },
    },
    { timestamps: true }
);

// One XP credit per user per day per kind
XpCreditSchema.index({ userId: 1, dayUTC: 1, kind: 1 }, { unique: true, name: 'uniq_user_day_kind' });

module.exports = model('XpCredit', XpCreditSchema);
