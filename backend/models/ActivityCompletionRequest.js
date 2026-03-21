const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const ActivityCompletionRequestSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        requestId: { type: String, required: true, trim: true },
        action: { type: String, enum: ['complete'], default: 'complete' },
        kind: { type: String, enum: ['coding', 'trivia', 'debug', 'incident'], required: true },
        tech: { type: String, required: true, trim: true },
        itemId: { type: String, required: true, trim: true },
        response: { type: Schema.Types.Mixed, default: null },
    },
    { timestamps: true }
);

ActivityCompletionRequestSchema.index(
    { userId: 1, requestId: 1 },
    { unique: true, name: 'uniq_user_activity_request' }
);

module.exports = model('ActivityCompletionRequest', ActivityCompletionRequestSchema);
