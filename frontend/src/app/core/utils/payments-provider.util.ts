import { environment } from '../../../environments/environment';

export type PaymentsProvider = 'gumroad' | 'lemonsqueezy' | 'stripe';
export type PaymentsMode = 'test' | 'live';
export type PlanId = 'monthly' | 'quarterly' | 'annual' | 'lifetime';

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
  LEMONSQUEEZY_LIFETIME_URL?: string;
  LEMONSQUEEZY_MANAGE_URL?: string;
  LEMONSQUEEZY_MONTHLY_URL_TEST?: string;
  LEMONSQUEEZY_QUARTERLY_URL_TEST?: string;
  LEMONSQUEEZY_ANNUAL_URL_TEST?: string;
  LEMONSQUEEZY_LIFETIME_URL_TEST?: string;
  LEMONSQUEEZY_MANAGE_URL_TEST?: string;
  LEMONSQUEEZY_MONTHLY_URL_LIVE?: string;
  LEMONSQUEEZY_QUARTERLY_URL_LIVE?: string;
  LEMONSQUEEZY_ANNUAL_URL_LIVE?: string;
  LEMONSQUEEZY_LIFETIME_URL_LIVE?: string;
  LEMONSQUEEZY_MANAGE_URL_LIVE?: string;
  STRIPE_MONTHLY_URL?: string;
  STRIPE_QUARTERLY_URL?: string;
  STRIPE_ANNUAL_URL?: string;
  STRIPE_LIFETIME_URL?: string;
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
  return resolveCheckoutUrlWithMeta(provider, planId, env).url;
}

export type CheckoutUrlResolution = {
  provider: PaymentsProvider;
  planId: PlanId;
  mode: PaymentsMode;
  url: string | null;
  sourceKey: string | null;
};

export function resolveCheckoutUrlWithMeta(
  provider: PaymentsProvider,
  planId: PlanId,
  env: PaymentsEnv = environment
): CheckoutUrlResolution {
  const mode = resolvePaymentsMode(env);
  const pick = (value: string | undefined, key: string, fallback?: { value?: string; key: string }) => {
    if (value) return { url: value, sourceKey: key };
    if (fallback?.value) return { url: fallback.value, sourceKey: fallback.key };
    return { url: null, sourceKey: null };
  };

  if (provider === 'lemonsqueezy') {
    const testKeys: Record<PlanId, { value?: string; key: string; fallback?: { value?: string; key: string } }> = {
      monthly: {
        value: env.LEMONSQUEEZY_MONTHLY_URL_TEST,
        key: 'LEMONSQUEEZY_MONTHLY_URL_TEST',
        fallback: { value: env.LEMONSQUEEZY_MONTHLY_URL, key: 'LEMONSQUEEZY_MONTHLY_URL' },
      },
      quarterly: {
        value: env.LEMONSQUEEZY_QUARTERLY_URL_TEST,
        key: 'LEMONSQUEEZY_QUARTERLY_URL_TEST',
        fallback: { value: env.LEMONSQUEEZY_QUARTERLY_URL, key: 'LEMONSQUEEZY_QUARTERLY_URL' },
      },
      annual: {
        value: env.LEMONSQUEEZY_ANNUAL_URL_TEST,
        key: 'LEMONSQUEEZY_ANNUAL_URL_TEST',
        fallback: { value: env.LEMONSQUEEZY_ANNUAL_URL, key: 'LEMONSQUEEZY_ANNUAL_URL' },
      },
      lifetime: {
        value: env.LEMONSQUEEZY_LIFETIME_URL_TEST,
        key: 'LEMONSQUEEZY_LIFETIME_URL_TEST',
        fallback: { value: env.LEMONSQUEEZY_LIFETIME_URL, key: 'LEMONSQUEEZY_LIFETIME_URL' },
      },
    };
    const liveKeys: Record<PlanId, { value?: string; key: string; fallback?: { value?: string; key: string } }> = {
      monthly: {
        value: env.LEMONSQUEEZY_MONTHLY_URL_LIVE,
        key: 'LEMONSQUEEZY_MONTHLY_URL_LIVE',
        fallback: { value: env.LEMONSQUEEZY_MONTHLY_URL, key: 'LEMONSQUEEZY_MONTHLY_URL' },
      },
      quarterly: {
        value: env.LEMONSQUEEZY_QUARTERLY_URL_LIVE,
        key: 'LEMONSQUEEZY_QUARTERLY_URL_LIVE',
        fallback: { value: env.LEMONSQUEEZY_QUARTERLY_URL, key: 'LEMONSQUEEZY_QUARTERLY_URL' },
      },
      annual: {
        value: env.LEMONSQUEEZY_ANNUAL_URL_LIVE,
        key: 'LEMONSQUEEZY_ANNUAL_URL_LIVE',
        fallback: { value: env.LEMONSQUEEZY_ANNUAL_URL, key: 'LEMONSQUEEZY_ANNUAL_URL' },
      },
      lifetime: {
        value: env.LEMONSQUEEZY_LIFETIME_URL_LIVE,
        key: 'LEMONSQUEEZY_LIFETIME_URL_LIVE',
        fallback: { value: env.LEMONSQUEEZY_LIFETIME_URL, key: 'LEMONSQUEEZY_LIFETIME_URL' },
      },
    };

    const map = mode === 'live' ? liveKeys : testKeys;
    const chosen = pick(map[planId].value, map[planId].key, map[planId].fallback);

    if (mode === 'live') {
      const liveAnnual = liveKeys.annual.value || liveKeys.annual.fallback?.value;
      const liveQuarterly = liveKeys.quarterly.value || liveKeys.quarterly.fallback?.value;
      if (planId === 'annual' && liveAnnual && liveQuarterly && liveAnnual === liveQuarterly) {
        return { provider, planId, mode, url: null, sourceKey: null };
      }
    }

    return { provider, planId, mode, url: chosen.url, sourceKey: chosen.sourceKey };
  }

  if (provider === 'gumroad') {
    const map: Record<PlanId, { value?: string; key: string }> = {
      monthly: { value: env.GUMROAD_MONTHLY_URL, key: 'GUMROAD_MONTHLY_URL' },
      quarterly: { value: env.GUMROAD_QUARTERLY_URL, key: 'GUMROAD_QUARTERLY_URL' },
      annual: { value: env.GUMROAD_ANNUAL_URL, key: 'GUMROAD_ANNUAL_URL' },
      lifetime: { value: undefined, key: 'GUMROAD_LIFETIME_URL' },
    };
    const chosen = map[planId];
    return { provider, planId, mode, url: chosen.value || null, sourceKey: chosen.value ? chosen.key : null };
  }

  const stripeMap: Record<PlanId, { value?: string; key: string }> = {
    monthly: { value: env.STRIPE_MONTHLY_URL, key: 'STRIPE_MONTHLY_URL' },
    quarterly: { value: env.STRIPE_QUARTERLY_URL, key: 'STRIPE_QUARTERLY_URL' },
    annual: { value: env.STRIPE_ANNUAL_URL, key: 'STRIPE_ANNUAL_URL' },
    lifetime: { value: env.STRIPE_LIFETIME_URL, key: 'STRIPE_LIFETIME_URL' },
  };
  const stripeChosen = stripeMap[planId];
  return {
    provider,
    planId,
    mode,
    url: stripeChosen.value || null,
    sourceKey: stripeChosen.value ? stripeChosen.key : null,
  };
}

export function buildCheckoutUrls(
  provider: PaymentsProvider,
  env: PaymentsEnv = environment
): Record<PlanId, string> {
  return {
    monthly: resolveCheckoutUrl(provider, 'monthly', env) || '',
    quarterly: resolveCheckoutUrl(provider, 'quarterly', env) || '',
    annual: resolveCheckoutUrl(provider, 'annual', env) || '',
    lifetime: resolveCheckoutUrl(provider, 'lifetime', env) || '',
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
