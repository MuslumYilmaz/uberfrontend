import type { RegionalPricing } from '../services/billing-checkout.service';

type PlanAmounts = Partial<Record<'monthly' | 'annual', { amountCents?: number } | null | undefined>>;

/** "$24" for whole dollars, "$9.60" otherwise; the checkout charges US dollars everywhere. */
export function formatPlanDollars(cents: number): string {
  const dollars = cents / 100;
  const digits = Number.isInteger(dollars) ? 0 : 2;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(dollars);
}

/** The monthly and yearly price a visitor pays: the regional one once the checkout config names it, else the list price. */
export function premiumPlanPrices(
  details: PlanAmounts | null | undefined,
  regional: RegionalPricing | null | undefined,
): { monthly: number; annual: number } | null {
  const cents = (plan: 'monthly' | 'annual') => regional?.prices?.[plan] ?? details?.[plan]?.amountCents;
  const monthly = cents('monthly');
  const annual = cents('annual');
  return monthly && annual ? { monthly, annual } : null;
}

/** Premium's price on a lock page, from the same figures as the plan cards, so the two never disagree. */
export function premiumPriceLine(
  details: PlanAmounts | null | undefined,
  regional: RegionalPricing | null | undefined,
): string | null {
  const prices = premiumPlanPrices(details, regional);
  if (!prices) return null;
  const where = regional ? ` (prices for ${regional.countryName})` : ', less in many countries';
  return `Premium is ${formatPlanDollars(prices.monthly)} a month or ${formatPlanDollars(prices.annual)} a year${where}.`;
}
