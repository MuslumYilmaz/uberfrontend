const mongoose = require('mongoose');

const PerTechSchema = new mongoose.Schema(
  {
    xp: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
  },
  { _id: false }
);

const EntitlementSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['none', 'active', 'lifetime', 'cancelled', 'expired', 'refunded', 'chargeback'],
      default: 'none',
    },
    validUntil: { type: Date, default: null },
  },
  { _id: false }
);

const GumroadProviderSchema = new mongoose.Schema(
  {
    saleId: String,
    purchaserEmail: String,
    lastEventId: String,
    lastEventAt: Date,
  },
  { _id: false }
);

const LemonSqueezyProviderSchema = new mongoose.Schema(
  {
    customerId: String,
    subscriptionId: String,
    startedAt: Date,
    manageUrl: String,
    purchaserEmail: String,
    lastEventId: String,
    lastEventAt: Date,
  },
  { _id: false }
);

const StripeProviderSchema = new mongoose.Schema(
  {
    customerId: String,
    subscriptionId: String,
    lastEventId: String,
    lastEventAt: Date,
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
    accessTier: { type: String, enum: ['free', 'premium'], default: 'free' },

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
      gamification: {
        weeklyGoalEnabled: { type: Boolean, default: true },
        weeklyGoalTarget: { type: Number, default: 10 },
        showStreakWidget: { type: Boolean, default: true },
        dailyChallengeTech: {
          type: String,
          enum: ['auto', 'javascript', 'react', 'angular', 'vue', 'html', 'css'],
          default: 'auto',
        },
      },
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
      challengeStreak: {
        current: { type: Number, default: 0 },
        longest: { type: Number, default: 0 },
        lastCompletedLocalDate: { type: String, default: null }, // 'YYYY-MM-DD' in Europe/Istanbul
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
      providers: {
        gumroad: { type: GumroadProviderSchema, default: () => ({}) },
        lemonsqueezy: { type: LemonSqueezyProviderSchema, default: () => ({}) },
        stripe: { type: StripeProviderSchema, default: () => ({}) },
      },
    },

    // entitlements (provider-agnostic)
    entitlements: {
      pro: { type: EntitlementSchema, default: () => ({}) },
      projects: { type: EntitlementSchema, default: () => ({}) },
    },

    coupons: [
      {
        code: String,
        scope: { type: String, enum: ['pro', 'projects'] },
        appliedAt: { type: Date, default: Date.now },
      },
    ],

    // progress
    solvedQuestionIds: { type: [String], default: [] },

    // security / housekeeping
    passwordUpdatedAt: Date,
    lastLoginAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
