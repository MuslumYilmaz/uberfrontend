const crypto = require('crypto');
const { resolveFrontendBase } = require('../../config/urls');
const { resolveDiscountCampaign } = require('./discount-campaigns');

const PROVIDERS = new Set(['gumroad', 'lemonsqueezy', 'stripe']);
const PLAN_IDS = ['monthly', 'quarterly', 'annual', 'lifetime'];
const PLANS = new Set(PLAN_IDS);
const PROVIDER_UNAVAILABLE = new Set(['stripe']);
const REUSABLE_ATTEMPT_STATUSES = new Set(['created', 'webhook_received', 'pending_user_match']);
const ANALYTICS_SOURCE_PATTERN = /^[a-z0-9_-]{1,64}$/;
const ATTRIBUTION_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const VERSION_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const CHECKOUT_SURFACES = new Set(['hosted_new_tab', 'overlay']);
const DEFAULT_OFFER_VERSION = 'pricing_baseline_v1';
const DEFAULT_CHECKOUT_SURFACE = 'hosted_new_tab';
const PLAN_CATALOG = Object.freeze({
  monthly: Object.freeze({
    amountCents: 1200,
    currency: 'USD',
    interval: 'month',
    intervalCount: 1,
  }),
  quarterly: Object.freeze({
    amountCents: 2900,
    currency: 'USD',
    interval: 'month',
    intervalCount: 3,
  }),
  annual: Object.freeze({
    amountCents: 7900,
    currency: 'USD',
    interval: 'year',
    intervalCount: 1,
  }),
  lifetime: Object.freeze({
    amountCents: 19900,
    currency: 'USD',
    interval: 'one_time',
    intervalCount: null,
  }),
});

class CheckoutStartError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = 'CheckoutStartError';
    this.code = code;
    this.status = status;
  }
}

function normalizeProvider(raw) {
  const value = String(raw || '').trim().toLowerCase();
  return PROVIDERS.has(value) ? value : null;
}

function resolveProvider(raw) {
  const explicit = normalizeProvider(raw);
  if (explicit) return explicit;
  return normalizeProvider(process.env.BILLING_PROVIDER || 'gumroad') || 'gumroad';
}

function resolveMode() {
  const raw = String(process.env.PAYMENTS_MODE || '').trim().toLowerCase();
  if (raw === 'test' || raw === 'live') return raw;
  return process.env.NODE_ENV === 'production' ? 'live' : 'test';
}

function resolvePlanId(raw) {
  const value = String(raw || '').trim().toLowerCase();
  return PLANS.has(value) ? value : null;
}

function normalizeAnalyticsSource(raw) {
  const value = String(raw || '').trim().toLowerCase();
  return value && ANALYTICS_SOURCE_PATTERN.test(value) ? value : 'pricing';
}

const normalizeAnalyticsSurface = normalizeAnalyticsSource;

function normalizeOptionalAttributionId(raw) {
  const value = String(raw || '').trim();
  return value && ATTRIBUTION_ID_PATTERN.test(value) ? value : null;
}

function normalizeVersion(raw, fallback = DEFAULT_OFFER_VERSION) {
  const value = String(raw || '').trim().toLowerCase();
  return value && VERSION_PATTERN.test(value) ? value : fallback;
}

function resolveOfferVersion(raw) {
  const configured = normalizeVersion(process.env.BILLING_OFFER_VERSION, DEFAULT_OFFER_VERSION);
  const requested = normalizeVersion(raw, configured);
  return requested === configured ? requested : configured;
}

function normalizeCheckoutSurface(raw, fallback = DEFAULT_CHECKOUT_SURFACE) {
  const value = String(raw || '').trim().toLowerCase();
  return CHECKOUT_SURFACES.has(value) ? value : fallback;
}

function resolveCheckoutSurface(raw) {
  const configured = normalizeCheckoutSurface(
    process.env.BILLING_CHECKOUT_SURFACE,
    DEFAULT_CHECKOUT_SURFACE
  );
  const requested = normalizeCheckoutSurface(raw, configured);
  return requested === configured ? requested : configured;
}

function resolveTaxInclusive() {
  return String(process.env.BILLING_TAX_INCLUSIVE || 'true').trim().toLowerCase() !== 'false';
}

function resolvePublicPlanDetails() {
  const taxInclusive = resolveTaxInclusive();
  return PLAN_IDS.reduce((acc, planId) => {
    acc[planId] = {
      ...PLAN_CATALOG[planId],
      taxInclusive,
    };
    return acc;
  }, {});
}

function resolveAttemptReuseWindowMs() {
  const value = Number(process.env.CHECKOUT_ATTEMPT_REUSE_WINDOW_MS || 5 * 60 * 1000);
  if (!Number.isFinite(value) || value <= 0) return 5 * 60 * 1000;
  return Math.floor(value);
}

function normalizeUrlCandidate(value) {
  const str = String(value || '').trim();
  if (!str) return '';
  try {
    return new URL(str).toString();
  } catch {
    return '';
  }
}

function normalizeCheckoutIdentity(value) {
  const normalized = normalizeUrlCandidate(value);
  if (!normalized) return '';
  const parsed = new URL(normalized);
  parsed.search = '';
  parsed.hash = '';
  return parsed.toString();
}

function pick(value, fallback) {
  const direct = normalizeUrlCandidate(value);
  if (direct) return direct;
  return normalizeUrlCandidate(fallback);
}

function resolveLemonSqueezyUrlForMode(planId, mode) {
  const suffix = planId.toUpperCase();
  if (mode === 'live') {
    // Live checkouts must be configured explicitly. Falling back to the legacy
    // unscoped URL can silently send production users to a test checkout.
    return normalizeUrlCandidate(process.env[`LEMONSQUEEZY_${suffix}_URL_LIVE`]);
  }
  return pick(
    process.env[`LEMONSQUEEZY_${suffix}_URL_TEST`],
    process.env[`LEMONSQUEEZY_${suffix}_URL`]
  );
}

function resolveCheckoutUrl(provider, planId, mode) {
  if (!PLANS.has(planId) || !['test', 'live'].includes(mode)) return '';
  if (provider === 'lemonsqueezy') {
    const modeValue = resolveLemonSqueezyUrlForMode(planId, mode);
    if (!modeValue) return '';
    const modeIdentity = normalizeCheckoutIdentity(modeValue);

    const oppositeMode = mode === 'live' ? 'test' : 'live';
    // Any URL collision across test/live is unsafe, even when it was copied
    // between different plans (for example test monthly -> live lifetime).
    for (const otherPlanId of PLAN_IDS) {
      if (
        normalizeCheckoutIdentity(resolveLemonSqueezyUrlForMode(otherPlanId, oppositeMode))
        === modeIdentity
      ) {
        return '';
      }
    }

    // A copied URL for a later plan is almost always a configuration mistake.
    // Keep the first configured plan available while failing closed for the
    // duplicate (including a lifetime URL copied from a recurring plan).
    const planIndex = PLAN_IDS.indexOf(planId);
    for (const earlierPlanId of PLAN_IDS.slice(0, planIndex)) {
      if (
        normalizeCheckoutIdentity(resolveLemonSqueezyUrlForMode(earlierPlanId, mode))
        === modeIdentity
      ) {
        return '';
      }
    }
    return modeValue;
  }

  if (provider === 'gumroad') {
    // Gumroad does not expose a separate sandbox URL contract in this app.
    if (mode !== 'live') return '';
    if (planId === 'lifetime') return '';
    return normalizeUrlCandidate(process.env[`GUMROAD_${planId.toUpperCase()}_URL`]);
  }

  return normalizeUrlCandidate(process.env[`STRIPE_${planId.toUpperCase()}_URL`]);
}

function resolveCheckoutConfig(rawProvider) {
  const configuredProvider = resolveProvider(rawProvider);
  const mode = resolveMode();
  const provider = configuredProvider && !PROVIDER_UNAVAILABLE.has(configuredProvider)
    ? configuredProvider
    : null;
  const unavailable = !provider;
  const plans = PLAN_IDS.reduce((acc, planId) => {
    const available = !unavailable && isValidHostedCheckoutUrl(provider, resolveCheckoutUrl(provider, planId, mode));
    acc[planId] = available;
    return acc;
  }, {});

  return {
    configuredProvider,
    provider,
    mode,
    enabled: Object.values(plans).some(Boolean),
    plans,
    planDetails: resolvePublicPlanDetails(),
    offerVersion: resolveOfferVersion(),
    checkoutSurface: resolveCheckoutSurface(),
  };
}

function isValidHostedCheckoutUrl(provider, url) {
  const normalized = normalizeUrlCandidate(url);
  if (!normalized) return false;
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();
    if (provider === 'lemonsqueezy') {
      const providerHost = hostname === 'lemonsqueezy.com' || hostname.endsWith('.lemonsqueezy.com');
      return providerHost && /\/checkout\/buy\/[^/]+/.test(parsed.pathname);
    }
    if (provider === 'gumroad') {
      return hostname === 'gumroad.com' || hostname.endsWith('.gumroad.com');
    }
    if (provider === 'stripe') {
      return hostname === 'stripe.com' || hostname.endsWith('.stripe.com');
    }
    return false;
  } catch {
    return false;
  }
}

function buildRedirectUrl(pathname, attemptId) {
  const frontendBase = resolveFrontendBase();
  const target = new URL(pathname, frontendBase || 'http://localhost:4200');
  if (attemptId) {
    target.searchParams.set('attempt', attemptId);
  }
  return target.toString();
}

function appendLemonSqueezyCustomData(parsed, key, value) {
  if (value === null || value === undefined || value === '') return;
  parsed.searchParams.set(`checkout[custom][${key}]`, String(value));
  parsed.searchParams.set(`checkout[custom_data][${key}]`, String(value));
}

function clearLemonSqueezyCustomData(parsed, key) {
  parsed.searchParams.delete(`checkout[custom][${key}]`);
  parsed.searchParams.delete(`checkout[custom_data][${key}]`);
}

function buildLemonSqueezyCheckoutUrl(
  baseUrl,
  {
    user,
    attemptId,
    successUrl,
    cancelUrl,
    analyticsSessionId,
    experimentId,
    offerVersion,
    checkoutSurface,
    campaignId,
    providerDiscountId,
    discountCode,
  }
) {
  const parsed = new URL(baseUrl);
  // Checkout discount behavior is backend-owned. Never inherit a coupon or a
  // visible coupon field from a copied LemonSqueezy share URL.
  parsed.searchParams.delete('checkout[discount_code]');
  parsed.searchParams.delete('discount');
  parsed.searchParams.set('discount', '0');
  if (discountCode) parsed.searchParams.set('checkout[discount_code]', discountCode);
  [
    'fa_user_id',
    'fa_user_email',
    'fa_user_name',
    'fa_checkout_attempt_id',
    'fa_analytics_session_id',
    'fa_experiment_id',
    'fa_offer_version',
    'fa_checkout_surface',
    'fa_campaign_id',
    'fa_provider_discount_id',
    'fa_frontend_origin',
  ].forEach((key) => clearLemonSqueezyCustomData(parsed, key));
  appendLemonSqueezyCustomData(parsed, 'fa_user_id', String(user._id));
  parsed.searchParams.set('checkout[email]', String(user.email || '').trim());
  parsed.searchParams.set('checkout[name]', String(user.username || '').trim());
  appendLemonSqueezyCustomData(parsed, 'fa_checkout_attempt_id', attemptId);
  appendLemonSqueezyCustomData(parsed, 'fa_analytics_session_id', analyticsSessionId);
  appendLemonSqueezyCustomData(parsed, 'fa_experiment_id', experimentId);
  appendLemonSqueezyCustomData(parsed, 'fa_offer_version', offerVersion);
  appendLemonSqueezyCustomData(parsed, 'fa_checkout_surface', checkoutSurface);
  appendLemonSqueezyCustomData(parsed, 'fa_campaign_id', campaignId);
  appendLemonSqueezyCustomData(parsed, 'fa_provider_discount_id', providerDiscountId);
  parsed.searchParams.set('checkout[success_url]', successUrl);
  parsed.searchParams.set('checkout[cancel_url]', cancelUrl);

  const frontendBase = resolveFrontendBase();
  if (frontendBase) {
    parsed.searchParams.set('checkout[custom][fa_frontend_origin]', frontendBase);
    parsed.searchParams.set('checkout[custom_data][fa_frontend_origin]', frontendBase);
  }

  return parsed.toString();
}

function buildFinalCheckoutUrl(provider, baseUrl, user, attemptId, attribution = {}) {
  const successUrl = buildRedirectUrl('/billing/success', attemptId);
  const cancelUrl = buildRedirectUrl('/billing/cancel', attemptId);
  if (provider === 'lemonsqueezy') {
    return {
      checkoutUrl: buildLemonSqueezyCheckoutUrl(baseUrl, {
        user,
        attemptId,
        successUrl,
        cancelUrl,
        ...attribution,
      }),
      successUrl,
      cancelUrl,
    };
  }
  return { checkoutUrl: baseUrl, successUrl, cancelUrl };
}

async function findReusableCheckoutAttempt(
  CheckoutAttempt,
  {
    user,
    provider,
    planId,
    mode,
    analyticsSurface,
    analyticsSource,
    analyticsSessionId,
    experimentId,
    offerVersion,
    checkoutSurface,
    campaignId,
    providerDiscountId,
  }
) {
  const threshold = new Date(Date.now() - resolveAttemptReuseWindowMs());
  const attributionFilters = [{ analyticsSurface, analyticsSource }];
  if (analyticsSurface === analyticsSource) {
    attributionFilters.push({
      analyticsSurface: { $exists: false },
      analyticsSource,
    });
  }
  return CheckoutAttempt.findOne({
    userId: user._id,
    provider,
    planId,
    mode,
    analyticsSessionId,
    experimentId,
    offerVersion,
    checkoutSurface,
    campaignId,
    providerDiscountId,
    $or: attributionFilters,
    status: { $in: Array.from(REUSABLE_ATTEMPT_STATUSES) },
    startedAt: { $gte: threshold },
  })
    .sort({ startedAt: -1, createdAt: -1 })
    .lean();
}

async function createCheckoutAttempt(
  CheckoutAttempt,
  {
    user,
    provider: rawProvider,
    planId: rawPlanId,
    analyticsSurface: rawAnalyticsSurface,
    analyticsSource: rawAnalyticsSource,
    analyticsSessionId: rawAnalyticsSessionId,
    experimentId: rawExperimentId,
    offerVersion: rawOfferVersion,
    checkoutSurface: rawCheckoutSurface,
    campaignId: rawCampaignId,
  }
) {
  const provider = resolveProvider(rawProvider);
  const planId = resolvePlanId(rawPlanId);
  // Source (campaign/referrer) and surface (UI placement) are separate
  // attribution dimensions. Each falls back to the other only for clients
  // that send one side of the compatibility contract.
  const analyticsSource = normalizeAnalyticsSource(rawAnalyticsSource || rawAnalyticsSurface);
  const analyticsSurface = normalizeAnalyticsSurface(rawAnalyticsSurface || rawAnalyticsSource);
  const analyticsSessionId = normalizeOptionalAttributionId(rawAnalyticsSessionId);
  const experimentId = normalizeOptionalAttributionId(rawExperimentId);
  const offerVersion = resolveOfferVersion(rawOfferVersion);
  const checkoutSurface = resolveCheckoutSurface(rawCheckoutSurface);

  if (!provider) {
    throw new CheckoutStartError('UNSUPPORTED_PROVIDER', 'Provider not supported', 400);
  }
  if (PROVIDER_UNAVAILABLE.has(provider)) {
    throw new CheckoutStartError('PROVIDER_UNAVAILABLE', 'Provider unavailable', 409);
  }
  if (!planId) {
    throw new CheckoutStartError('INVALID_PLAN', 'Plan not supported', 400);
  }
  if (provider === 'gumroad' && !user?.emailVerifiedAt) {
    throw new CheckoutStartError(
      'EMAIL_VERIFICATION_REQUIRED',
      'Verify your email before starting a Gumroad checkout',
      409
    );
  }

  const mode = resolveMode();
  const baseUrl = resolveCheckoutUrl(provider, planId, mode);
  if (!baseUrl) {
    throw new CheckoutStartError('CHECKOUT_UNAVAILABLE', 'Checkout unavailable', 409);
  }
  if (!isValidHostedCheckoutUrl(provider, baseUrl)) {
    throw new CheckoutStartError('INVALID_CHECKOUT_URL', 'Checkout URL invalid', 409);
  }
  const campaign = resolveDiscountCampaign({
    rawCampaignId,
    provider,
    mode,
    planId,
    analyticsSource,
  });
  const campaignId = campaign?.campaignId || null;
  const providerDiscountId = campaign?.providerDiscountId || null;

  const reusableAttempt = await findReusableCheckoutAttempt(CheckoutAttempt, {
    user,
    provider,
    planId,
    mode,
    analyticsSurface,
    analyticsSource,
    analyticsSessionId,
    experimentId,
    offerVersion,
    checkoutSurface,
    campaignId,
    providerDiscountId,
  });
  if (reusableAttempt?.attemptId && isValidHostedCheckoutUrl(provider, reusableAttempt.checkoutUrl)) {
    return {
      attempt: reusableAttempt,
      provider,
      planId,
      mode,
      analyticsSurface: reusableAttempt.analyticsSurface || reusableAttempt.analyticsSource || analyticsSurface,
      analyticsSource: reusableAttempt.analyticsSource || analyticsSource,
      analyticsSessionId: reusableAttempt.analyticsSessionId || null,
      experimentId: reusableAttempt.experimentId || null,
      offerVersion: reusableAttempt.offerVersion || offerVersion,
      checkoutSurface: reusableAttempt.checkoutSurface || checkoutSurface,
      campaignId: reusableAttempt.campaignId || null,
      providerDiscountId: reusableAttempt.providerDiscountId || null,
      attemptId: reusableAttempt.attemptId,
      checkoutUrl: reusableAttempt.checkoutUrl,
      successUrl: reusableAttempt.successUrl,
      cancelUrl: reusableAttempt.cancelUrl,
      reused: true,
    };
  }

  const attemptId = `chk_${crypto.randomBytes(10).toString('hex')}`;
  const { checkoutUrl, successUrl, cancelUrl } = buildFinalCheckoutUrl(
    provider,
    baseUrl,
    user,
    attemptId,
    {
      analyticsSessionId,
      experimentId,
      offerVersion,
      checkoutSurface,
      campaignId,
      providerDiscountId,
      discountCode: campaign?.discountCode || null,
    }
  );

  if (!isValidHostedCheckoutUrl(provider, checkoutUrl)) {
    throw new CheckoutStartError('INVALID_CHECKOUT_URL', 'Checkout URL invalid', 409);
  }

  const attempt = await CheckoutAttempt.create({
    attemptId,
    userId: user._id,
    provider,
    planId,
    mode,
    analyticsSurface,
    analyticsSource,
    analyticsSessionId,
    experimentId,
    offerVersion,
    checkoutSurface,
    campaignId,
    providerDiscountId,
    status: 'created',
    checkoutUrl,
    successUrl,
    cancelUrl,
    customerEmail: user.email,
    customerUserId: String(user._id),
  });

  return {
    attempt,
    provider,
    planId,
    mode,
    analyticsSurface,
    analyticsSource,
    analyticsSessionId,
    experimentId,
    offerVersion,
    checkoutSurface,
    campaignId,
    providerDiscountId,
    attemptId,
    checkoutUrl,
    successUrl,
    cancelUrl,
    reused: false,
  };
}

module.exports = {
  CheckoutStartError,
  createCheckoutAttempt,
  resolveCheckoutConfig,
  resolveProvider,
  resolveMode,
  resolveCheckoutUrl,
  isValidHostedCheckoutUrl,
  normalizeAnalyticsSource,
  normalizeAnalyticsSurface,
  normalizeOptionalAttributionId,
  resolveOfferVersion,
  resolveCheckoutSurface,
  resolvePublicPlanDetails,
  PLAN_CATALOG,
};
