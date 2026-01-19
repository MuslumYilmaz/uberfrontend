import { environment } from '../../../environments/environment';

export type PaymentsProvider = 'gumroad' | 'lemonsqueezy' | 'stripe';
export type PaymentsMode = 'test' | 'live';
export type PlanId = 'monthly' | 'quarterly' | 'annual';

type PaymentsEnv = {
  PAYMENTS_PROVIDER?: PaymentsProvider | string;
  PAYMENTS_MODE?: PaymentsMode | string;
  production?: boolean;
  GUMROAD_MONTHLY_URL?: string;
  GUMROAD_QUARTERLY_URL?: string;
  GUMROAD_ANNUAL_URL?: string;
  GUMROAD_MANAGE_URL?: string;
  LEMONSQUEEZY_MONTHLY_URL?: string;
  LEMONSQUEEZY_QUARTERLY_URL?: string;
  LEMONSQUEEZY_ANNUAL_URL?: string;
  LEMONSQUEEZY_MANAGE_URL?: string;
  LEMONSQUEEZY_MONTHLY_URL_TEST?: string;
  LEMONSQUEEZY_QUARTERLY_URL_TEST?: string;
  LEMONSQUEEZY_ANNUAL_URL_TEST?: string;
  LEMONSQUEEZY_MANAGE_URL_TEST?: string;
  LEMONSQUEEZY_MONTHLY_URL_LIVE?: string;
  LEMONSQUEEZY_QUARTERLY_URL_LIVE?: string;
  LEMONSQUEEZY_ANNUAL_URL_LIVE?: string;
  LEMONSQUEEZY_MANAGE_URL_LIVE?: string;
  STRIPE_MONTHLY_URL?: string;
  STRIPE_QUARTERLY_URL?: string;
  STRIPE_ANNUAL_URL?: string;
  STRIPE_MANAGE_URL?: string;
};

const PROVIDERS: PaymentsProvider[] = ['gumroad', 'lemonsqueezy', 'stripe'];

export function resolvePaymentsProvider(env: PaymentsEnv = environment): PaymentsProvider {
  const raw = String(env.PAYMENTS_PROVIDER || 'gumroad').trim().toLowerCase();
  return (PROVIDERS as string[]).includes(raw) ? (raw as PaymentsProvider) : 'gumroad';
}

export function resolvePaymentsMode(env: PaymentsEnv = environment): PaymentsMode {
  const raw = String(env.PAYMENTS_MODE || '').trim().toLowerCase();
  if (raw === 'test' || raw === 'live') return raw as PaymentsMode;
  return env.production ? 'live' : 'test';
}

export function resolveCheckoutUrl(
  provider: PaymentsProvider,
  planId: PlanId,
  env: PaymentsEnv = environment
): string | null {
  const mode = resolvePaymentsMode(env);
  const lsUrls = {
    test: {
      monthly: env.LEMONSQUEEZY_MONTHLY_URL_TEST || env.LEMONSQUEEZY_MONTHLY_URL,
      quarterly: env.LEMONSQUEEZY_QUARTERLY_URL_TEST || env.LEMONSQUEEZY_QUARTERLY_URL,
      annual: env.LEMONSQUEEZY_ANNUAL_URL_TEST || env.LEMONSQUEEZY_ANNUAL_URL,
    },
    live: {
      monthly: env.LEMONSQUEEZY_MONTHLY_URL_LIVE || env.LEMONSQUEEZY_MONTHLY_URL,
      quarterly: env.LEMONSQUEEZY_QUARTERLY_URL_LIVE || env.LEMONSQUEEZY_QUARTERLY_URL,
      annual: env.LEMONSQUEEZY_ANNUAL_URL_LIVE || env.LEMONSQUEEZY_ANNUAL_URL,
    },
  };

  if (provider === 'lemonsqueezy') {
    const liveAnnual = lsUrls.live.annual;
    const liveQuarterly = lsUrls.live.quarterly;
    if (mode === 'live' && liveAnnual && liveQuarterly && liveAnnual === liveQuarterly) {
      return planId === 'annual' ? null : lsUrls.live[planId] || null;
    }
  }

  const map: Record<PaymentsProvider, Record<PlanId, string | undefined>> = {
    gumroad: {
      monthly: env.GUMROAD_MONTHLY_URL,
      quarterly: env.GUMROAD_QUARTERLY_URL,
      annual: env.GUMROAD_ANNUAL_URL,
    },
    lemonsqueezy: {
      monthly: lsUrls[mode].monthly,
      quarterly: lsUrls[mode].quarterly,
      annual: lsUrls[mode].annual,
    },
    stripe: {
      monthly: env.STRIPE_MONTHLY_URL,
      quarterly: env.STRIPE_QUARTERLY_URL,
      annual: env.STRIPE_ANNUAL_URL,
    },
  };
  const url = map[provider]?.[planId];
  return url ? url : null;
}

export function buildCheckoutUrls(
  provider: PaymentsProvider,
  env: PaymentsEnv = environment
): Record<PlanId, string> {
  return {
    monthly: resolveCheckoutUrl(provider, 'monthly', env) || '',
    quarterly: resolveCheckoutUrl(provider, 'quarterly', env) || '',
    annual: resolveCheckoutUrl(provider, 'annual', env) || '',
  };
}

export function hasCheckoutUrls(urls: Record<PlanId, string>): boolean {
  return Object.values(urls).some((value) => !!value);
}

export function resolveManageUrl(
  provider: PaymentsProvider,
  env: PaymentsEnv = environment
): string | null {
  const mode = resolvePaymentsMode(env);
  const lsManage =
    mode === 'live'
      ? env.LEMONSQUEEZY_MANAGE_URL_LIVE || env.LEMONSQUEEZY_MANAGE_URL
      : env.LEMONSQUEEZY_MANAGE_URL_TEST || env.LEMONSQUEEZY_MANAGE_URL;
  const map: Record<PaymentsProvider, string | undefined> = {
    gumroad: env.GUMROAD_MANAGE_URL,
    lemonsqueezy: lsManage,
    stripe: env.STRIPE_MANAGE_URL,
  };
  const url = map[provider];
  return url ? url : null;
}
