const crypto = require('crypto');
const { resolveFrontendBase } = require('../../config/urls');

const PROVIDERS = new Set(['gumroad', 'lemonsqueezy', 'stripe']);
const PLAN_IDS = ['monthly', 'quarterly', 'annual', 'lifetime'];
const PLANS = new Set(PLAN_IDS);
const PROVIDER_UNAVAILABLE = new Set(['stripe']);
const REUSABLE_ATTEMPT_STATUSES = new Set(['created', 'webhook_received', 'pending_user_match']);

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

function pick(value, fallback) {
  const direct = normalizeUrlCandidate(value);
  if (direct) return direct;
  return normalizeUrlCandidate(fallback);
}

function resolveCheckoutUrl(provider, planId, mode) {
  if (provider === 'lemonsqueezy') {
    const suffix = planId.toUpperCase();
    const modeValue = mode === 'live'
      ? pick(
          process.env[`LEMONSQUEEZY_${suffix}_URL_LIVE`],
          process.env[`LEMONSQUEEZY_${suffix}_URL`]
        )
      : pick(
          process.env[`LEMONSQUEEZY_${suffix}_URL_TEST`],
          process.env[`LEMONSQUEEZY_${suffix}_URL`]
        );

    if (mode === 'live' && planId === 'annual') {
      const annual = modeValue;
      const quarterly = pick(
        process.env.LEMONSQUEEZY_QUARTERLY_URL_LIVE,
        process.env.LEMONSQUEEZY_QUARTERLY_URL
      );
      if (annual && quarterly && annual === quarterly) return '';
    }
    return modeValue;
  }

  if (provider === 'gumroad') {
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
  };
}

function isValidHostedCheckoutUrl(provider, url) {
  const normalized = normalizeUrlCandidate(url);
  if (!normalized) return false;
  if (provider === 'lemonsqueezy') {
    try {
      return new URL(normalized).pathname.includes('/checkout/buy/');
    } catch {
      return false;
    }
  }
  return /^https?:\/\//i.test(normalized);
}

function buildRedirectUrl(pathname, attemptId) {
  const frontendBase = resolveFrontendBase();
  const target = new URL(pathname, frontendBase || 'http://localhost:4200');
  if (attemptId) {
    target.searchParams.set('attempt', attemptId);
  }
  return target.toString();
}

function buildLemonSqueezyCheckoutUrl(baseUrl, { user, attemptId, successUrl, cancelUrl }) {
  const parsed = new URL(baseUrl);
  parsed.searchParams.set('checkout[custom][fa_user_id]', String(user._id));
  parsed.searchParams.set('checkout[custom_data][fa_user_id]', String(user._id));
  parsed.searchParams.set('checkout[custom][fa_user_email]', String(user.email || '').trim());
  parsed.searchParams.set('checkout[custom_data][fa_user_email]', String(user.email || '').trim());
  parsed.searchParams.set('checkout[email]', String(user.email || '').trim());
  parsed.searchParams.set('checkout[custom][fa_user_name]', String(user.username || '').trim());
  parsed.searchParams.set('checkout[custom_data][fa_user_name]', String(user.username || '').trim());
  parsed.searchParams.set('checkout[custom][fa_checkout_attempt_id]', attemptId);
  parsed.searchParams.set('checkout[custom_data][fa_checkout_attempt_id]', attemptId);
  parsed.searchParams.set('checkout[success_url]', successUrl);
  parsed.searchParams.set('checkout[cancel_url]', cancelUrl);

  const frontendBase = resolveFrontendBase();
  if (frontendBase) {
    parsed.searchParams.set('checkout[custom][fa_frontend_origin]', frontendBase);
    parsed.searchParams.set('checkout[custom_data][fa_frontend_origin]', frontendBase);
  }

  return parsed.toString();
}

function buildFinalCheckoutUrl(provider, baseUrl, user, attemptId) {
  const successUrl = buildRedirectUrl('/billing/success', attemptId);
  const cancelUrl = buildRedirectUrl('/billing/cancel', attemptId);
  if (provider === 'lemonsqueezy') {
    return {
      checkoutUrl: buildLemonSqueezyCheckoutUrl(baseUrl, { user, attemptId, successUrl, cancelUrl }),
      successUrl,
      cancelUrl,
    };
  }
  return { checkoutUrl: baseUrl, successUrl, cancelUrl };
}

async function findReusableCheckoutAttempt(CheckoutAttempt, { user, provider, planId, mode }) {
  const threshold = new Date(Date.now() - resolveAttemptReuseWindowMs());
  return CheckoutAttempt.findOne({
    userId: user._id,
    provider,
    planId,
    mode,
    status: { $in: Array.from(REUSABLE_ATTEMPT_STATUSES) },
    startedAt: { $gte: threshold },
  })
    .sort({ startedAt: -1, createdAt: -1 })
    .lean();
}

async function createCheckoutAttempt(CheckoutAttempt, { user, provider: rawProvider, planId: rawPlanId }) {
  const provider = resolveProvider(rawProvider);
  const planId = resolvePlanId(rawPlanId);

  if (!provider) {
    throw new CheckoutStartError('UNSUPPORTED_PROVIDER', 'Provider not supported', 400);
  }
  if (PROVIDER_UNAVAILABLE.has(provider)) {
    throw new CheckoutStartError('PROVIDER_UNAVAILABLE', 'Provider unavailable', 409);
  }
  if (!planId) {
    throw new CheckoutStartError('INVALID_PLAN', 'Plan not supported', 400);
  }

  const mode = resolveMode();
  const baseUrl = resolveCheckoutUrl(provider, planId, mode);
  if (!baseUrl) {
    throw new CheckoutStartError('CHECKOUT_UNAVAILABLE', 'Checkout unavailable', 409);
  }
  if (!isValidHostedCheckoutUrl(provider, baseUrl)) {
    throw new CheckoutStartError('INVALID_CHECKOUT_URL', 'Checkout URL invalid', 409);
  }

  const reusableAttempt = await findReusableCheckoutAttempt(CheckoutAttempt, {
    user,
    provider,
    planId,
    mode,
  });
  if (reusableAttempt?.attemptId && isValidHostedCheckoutUrl(provider, reusableAttempt.checkoutUrl)) {
    return {
      attempt: reusableAttempt,
      provider,
      planId,
      mode,
      attemptId: reusableAttempt.attemptId,
      checkoutUrl: reusableAttempt.checkoutUrl,
      successUrl: reusableAttempt.successUrl,
      cancelUrl: reusableAttempt.cancelUrl,
      reused: true,
    };
  }

  const attemptId = `chk_${crypto.randomBytes(10).toString('hex')}`;
  const { checkoutUrl, successUrl, cancelUrl } = buildFinalCheckoutUrl(provider, baseUrl, user, attemptId);

  if (!isValidHostedCheckoutUrl(provider, checkoutUrl)) {
    throw new CheckoutStartError('INVALID_CHECKOUT_URL', 'Checkout URL invalid', 409);
  }

  const attempt = await CheckoutAttempt.create({
    attemptId,
    userId: user._id,
    provider,
    planId,
    mode,
    status: 'created',
    checkoutUrl,
    successUrl,
    cancelUrl,
    customerEmail: user.email,
    customerUserId: String(user._id),
    metadata: {
      username: user.username || '',
    },
  });

  return {
    attempt,
    provider,
    planId,
    mode,
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
};
