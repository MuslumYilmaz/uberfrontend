const mongoose = require('mongoose');

const PerTechSchema = new mongoose.Schema(
  {
    xp: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    // identity
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    // profile
    bio: { type: String, maxlength: 280 },
    avatarUrl: { type: String },

    // preferences
    prefs: {
      tz: { type: String, default: 'Europe/Istanbul' },
      theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
      defaultTech: { type: String, enum: ['javascript', 'angular'], default: 'javascript' },
      keyboard: { type: String, enum: ['default', 'vim'], default: 'default' },
      marketingEmails: { type: Boolean, default: false },
    },

    // aggregates for fast UI
    stats: {
      xpTotal: { type: Number, default: 0 },
      completedTotal: { type: Number, default: 0 },
      perTech: {
        javascript: { type: PerTechSchema, default: () => ({}) },
        angular: { type: PerTechSchema, default: () => ({}) },
      },
      streak: {
        current: { type: Number, default: 0 },
        longest: { type: Number, default: 0 },
        lastActiveUTCDate: { type: String, default: null }, // 'YYYY-MM-DD'
      },
    },

    // social providers (future)
    providers: [
      {
        provider: { type: String, enum: ['github', 'google'] },
        providerId: String,
        linkedAt: { type: Date, default: Date.now },
      },
    ],

    // billing (future / Stripe-ready)
    billing: {
      stripeCustomerId: String,
      pro: {
        status: { type: String, enum: ['none', 'lifetime', 'active', 'canceled'], default: 'none' },
        planId: String,
        subscriptionId: String,
        renewsAt: Date,
        canceledAt: Date,
      },
      projects: {
        status: { type: String, enum: ['none', 'active', 'canceled'], default: 'none' },
        planId: String,
        subscriptionId: String,
        renewsAt: Date,
        canceledAt: Date,
      },
    },

    coupons: [
      {
        code: String,
        scope: { type: String, enum: ['pro', 'projects'] },
        appliedAt: { type: Date, default: Date.now },
      },
    ],

    // security / housekeeping
    passwordUpdatedAt: Date,
    lastLoginAt: Date,
  },
  { timestamps: true }
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);
