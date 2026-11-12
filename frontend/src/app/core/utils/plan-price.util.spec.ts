import { formatPlanDollars, premiumPriceLine } from './plan-price.util';

describe('premiumPriceLine', () => {
  const details = { monthly: { amountCents: 2400 }, annual: { amountCents: 9900 } };

  it('names the list price until the checkout config names the visitor’s regional one', () => {
    expect(premiumPriceLine(details, null)).toBe('Premium is $24 a month or $99 a year, less in many countries.');
    expect(premiumPriceLine(details, {
      countryCode: 'IN',
      countryName: 'India',
      multiplier: 0.4,
      prices: { monthly: 960, annual: 3960 },
    })).toBe('Premium is $9.60 a month or $39.60 a year (prices for India).');
  });

  it('says nothing rather than half a price', () => {
    expect(premiumPriceLine({ monthly: { amountCents: 2400 } }, null)).toBeNull();
    expect(premiumPriceLine(null, null)).toBeNull();
  });

  it('writes whole dollars without cents', () => {
    expect(formatPlanDollars(4900)).toBe('$49');
    expect(formatPlanDollars(1960)).toBe('$19.60');
  });
});
