import { environment } from '../../../environments/environment';

export type PaymentsProvider = 'gumroad' | 'lemonsqueezy' | 'stripe';
export type PlanId = 'monthly' | 'quarterly' | 'annual';

type PaymentsEnv = {
  PAYMENTS_PROVIDER?: PaymentsProvider | string;
  GUMROAD_MONTHLY_URL?: string;
  GUMROAD_QUARTERLY_URL?: string;
  GUMROAD_ANNUAL_URL?: string;
  LEMONSQUEEZY_MONTHLY_URL?: string;
  LEMONSQUEEZY_QUARTERLY_URL?: string;
  LEMONSQUEEZY_ANNUAL_URL?: string;
  STRIPE_MONTHLY_URL?: string;
  STRIPE_QUARTERLY_URL?: string;
  STRIPE_ANNUAL_URL?: string;
};

const PROVIDERS: PaymentsProvider[] = ['gumroad', 'lemonsqueezy', 'stripe'];

export function resolvePaymentsProvider(env: PaymentsEnv = environment): PaymentsProvider {
  const raw = String(env.PAYMENTS_PROVIDER || 'gumroad').trim().toLowerCase();
  return (PROVIDERS as string[]).includes(raw) ? (raw as PaymentsProvider) : 'gumroad';
}

export function resolveCheckoutUrl(
  provider: PaymentsProvider,
  planId: PlanId,
  env: PaymentsEnv = environment
): string | null {
  const map: Record<PaymentsProvider, Record<PlanId, string | undefined>> = {
    gumroad: {
      monthly: env.GUMROAD_MONTHLY_URL,
      quarterly: env.GUMROAD_QUARTERLY_URL,
      annual: env.GUMROAD_ANNUAL_URL,
    },
    lemonsqueezy: {
      monthly: env.LEMONSQUEEZY_MONTHLY_URL,
      quarterly: env.LEMONSQUEEZY_QUARTERLY_URL,
      annual: env.LEMONSQUEEZY_ANNUAL_URL,
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
