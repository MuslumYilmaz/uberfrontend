const {
  parseRegionalPricing,
  resolveCheckoutPricing,
  resolvePublicPricingRules,
  resolveRegionalPricing,
  STUDENT_PRICE_MULTIPLIER,
  STUDENT_PRICE_PLAN_IDS,
} = require('../services/billing/checkout-pricing');

const PLAN_DETAILS = {
  monthly: { amountCents: 1200 },
  quarterly: { amountCents: 2900 },
  annual: { amountCents: 7900 },
  lifetime: { amountCents: 19900 },
};

describe('regional pricing table', () => {
  test('parses country codes case-insensitively and keeps multipliers inside the allowed band', () => {
    expect(parseRegionalPricing('{"TR":0.5,"in":0.6}')).toEqual({ table: { TR: 0.5, IN: 0.6 }, error: null });
    expect(parseRegionalPricing('')).toEqual({ table: {}, error: null });
    expect(parseRegionalPricing(undefined)).toEqual({ table: {}, error: null });
  });

  test('rejects the whole table on one invalid entry so a typo never prices a country at zero', () => {
    expect(parseRegionalPricing('{"TR":0.5,"TUR":0.5}')).toEqual({ table: {}, error: 'invalid_country:TUR' });
    expect(parseRegionalPricing('{"TR":0}')).toEqual({ table: {}, error: 'invalid_multiplier:TR' });
    expect(parseRegionalPricing('{"TR":1}')).toEqual({ table: {}, error: 'invalid_multiplier:TR' });
    expect(parseRegionalPricing('{"TR":"0.5"}')).toEqual({ table: {}, error: 'invalid_multiplier:TR' });
    expect(parseRegionalPricing('[0.5]')).toEqual({ table: {}, error: 'not_an_object' });
    expect(parseRegionalPricing('{nope')).toEqual({ table: {}, error: 'invalid_json' });
  });

  test('resolves a country from the env table with a display name', () => {
    const env = { BILLING_REGIONAL_PRICING_JSON: '{"TR":0.5}' };
    expect(resolveRegionalPricing('tr', env)).toEqual(expect.objectContaining({ countryCode: 'TR', multiplier: 0.5 }));
    expect(typeof resolveRegionalPricing('tr', env).countryName).toBe('string');
    expect(resolveRegionalPricing('DE', env)).toBeNull();
    expect(resolveRegionalPricing(undefined, env)).toBeNull();
    expect(resolveRegionalPricing('TR', {})).toBeNull();
  });
});

describe('checkout pricing resolution', () => {
  const env = { BILLING_REGIONAL_PRICING_JSON: '{"TR":0.5,"DE":0.75}' };

  test('charges the list price when neither a regional nor a student price applies', () => {
    expect(resolveCheckoutPricing({ planId: 'quarterly', listAmountCents: 2900, countryCode: 'US', env })).toEqual({
      reason: null,
      multiplier: 1,
      listAmountCents: 2900,
      amountCents: 2900,
      countryCode: null,
    });
  });

  test('applies the regional multiplier to every plan and rounds to whole cents', () => {
    expect(resolveCheckoutPricing({ planId: 'quarterly', listAmountCents: 2900, countryCode: 'TR', env })).toEqual({
      reason: 'regional',
      multiplier: 0.5,
      listAmountCents: 2900,
      amountCents: 1450,
      countryCode: 'TR',
    });
    expect(resolveCheckoutPricing({ planId: 'lifetime', listAmountCents: 19900, countryCode: 'tr', env }).amountCents).toBe(9950);
  });

  test('student pricing is 40% off the annual plan on a first purchase only', () => {
    expect(STUDENT_PRICE_MULTIPLIER).toBe(0.6);
    expect(STUDENT_PRICE_PLAN_IDS).toEqual(['annual']);
    const student = { studentEligible: true, firstPurchase: true, env };
    expect(resolveCheckoutPricing({ planId: 'annual', listAmountCents: 7900, countryCode: 'US', ...student })).toEqual(
      expect.objectContaining({ reason: 'student', multiplier: 0.6, amountCents: 4740, countryCode: null }),
    );
    expect(resolveCheckoutPricing({ planId: 'quarterly', listAmountCents: 2900, countryCode: 'US', ...student }).reason).toBeNull();
    expect(resolveCheckoutPricing({ planId: 'annual', listAmountCents: 7900, countryCode: 'US', studentEligible: true, firstPurchase: false, env }).reason).toBeNull();
    expect(resolveCheckoutPricing({ planId: 'annual', listAmountCents: 7900, countryCode: 'US', studentEligible: false, firstPurchase: true, env }).reason).toBeNull();
  });

  test('never stacks: the customer gets the better of the regional and the student price', () => {
    const student = { planId: 'annual', listAmountCents: 7900, studentEligible: true, firstPurchase: true, env };
    expect(resolveCheckoutPricing({ ...student, countryCode: 'TR' })).toEqual(
      expect.objectContaining({ reason: 'regional', multiplier: 0.5, amountCents: 3950 }),
    );
    expect(resolveCheckoutPricing({ ...student, countryCode: 'DE' })).toEqual(
      expect.objectContaining({ reason: 'student', multiplier: 0.6, amountCents: 4740 }),
    );
    const tie = { BILLING_REGIONAL_PRICING_JSON: '{"BR":0.6}' };
    expect(resolveCheckoutPricing({ ...student, countryCode: 'BR', env: tie }).reason).toBe('regional');
  });

  test('keeps the list price when a discounted amount would fall under the minimum charge', () => {
    const tiny = { BILLING_REGIONAL_PRICING_JSON: '{"TR":0.5}' };
    expect(resolveCheckoutPricing({ planId: 'monthly', listAmountCents: 150, countryCode: 'TR', env: tiny })).toEqual(
      expect.objectContaining({ reason: null, amountCents: 150 }),
    );
  });
});

describe('public pricing rules for the pricing page', () => {
  const env = { BILLING_REGIONAL_PRICING_JSON: '{"TR":0.5}' };

  test('always states the student rule and publishes the regional block only when a custom checkout is possible', () => {
    expect(resolvePublicPricingRules({ countryCode: 'TR', planDetails: PLAN_DETAILS, customCheckoutAvailable: false, env })).toEqual({
      student: { multiplier: 0.6, planIds: ['annual'] },
      regional: null,
    });
    const published = resolvePublicPricingRules({ countryCode: 'TR', planDetails: PLAN_DETAILS, customCheckoutAvailable: true, env });
    expect(published.regional).toEqual(expect.objectContaining({
      countryCode: 'TR',
      multiplier: 0.5,
      prices: { monthly: 600, quarterly: 1450, annual: 3950, lifetime: 9950 },
    }));
    expect(resolvePublicPricingRules({ countryCode: 'DE', planDetails: PLAN_DETAILS, customCheckoutAvailable: true, env }).regional).toBeNull();
    expect(resolvePublicPricingRules({ countryCode: undefined, planDetails: PLAN_DETAILS, customCheckoutAvailable: true, env }).regional).toBeNull();
  });

  test('withholds the regional block when any plan could not be charged at the regional price', () => {
    const details = { ...PLAN_DETAILS, monthly: { amountCents: 150 } };
    expect(resolvePublicPricingRules({ countryCode: 'TR', planDetails: details, customCheckoutAvailable: true, env }).regional).toBeNull();
  });
});
