const mongoose = require('mongoose');

const OAuthIdentitySchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ['google', 'github'], required: true, trim: true },
    providerId: { type: String, required: true, trim: true, maxlength: 512 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

OAuthIdentitySchema.index(
  { provider: 1, providerId: 1 },
  { unique: true, name: 'uniq_oauth_provider_identity' }
);

module.exports = mongoose.model('OAuthIdentity', OAuthIdentitySchema);
