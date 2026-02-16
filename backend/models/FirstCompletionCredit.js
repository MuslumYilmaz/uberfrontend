const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const FirstCompletionCreditSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        kind: { type: String, enum: ['coding', 'trivia', 'debug'], required: true },
        itemId: { type: String, required: true, trim: true },
        firstCompletedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

FirstCompletionCreditSchema.index(
    { userId: 1, kind: 1, itemId: 1 },
    { unique: true, name: 'uniq_user_kind_item_first_completion' }
);

module.exports = model('FirstCompletionCredit', FirstCompletionCreditSchema);
