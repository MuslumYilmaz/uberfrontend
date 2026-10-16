const {
  PLAN_CATALOG,
  parsePlanPriceOverrides,
  resolvePlanCatalog,
} = require('../services/billing/checkout-start');
const { compareVariant } = require('../services/billing/price-parity');

describe('resolvePlanCatalog', () => {
  const defaults = {
    monthly: 2400,
    quarterly: 4900,
    annual: 9900,
    lifetime: 17900,
  };

  test('returns the default catalog when no override is configured', () => {
    for (const env of [{}, { BILLING_PLAN_PRICES_JSON: '' }, { BILLING_PLAN_PRICES_JSON: '   ' }]) {
      const catalog = resolvePlanCatalog(env);
      for (const [planId, amountCents] of Object.entries(defaults)) {
        expect(catalog[planId]).toEqual(PLAN_CATALOG[planId]);
        expect(catalog[planId].amountCents).toBe(amountCents);
      }
    }
  });

  test('applies a full or partial override to amounts only', () => {
    const full = resolvePlanCatalog({
      BILLING_PLAN_PRICES_JSON: '{"monthly":2900,"quarterly":5900,"annual":11900,"lifetime":19900}',
    });
    expect(full.monthly).toEqual({ amountCents: 2900, currency: 'USD', interval: 'month', intervalCount: 1 });
    expect(full.quarterly).toEqual({ amountCents: 5900, currency: 'USD', interval: 'month', intervalCount: 3 });
    expect(full.annual).toEqual({ amountCents: 11900, currency: 'USD', interval: 'year', intervalCount: 1 });
    expect(full.lifetime).toEqual({ amountCents: 19900, currency: 'USD', interval: 'one_time', intervalCount: null });

    const partial = resolvePlanCatalog({ BILLING_PLAN_PRICES_JSON: '{"annual":11900}' });
    expect(partial.annual.amountCents).toBe(11900);
    expect(partial.monthly.amountCents).toBe(2400);
    expect(partial.quarterly.amountCents).toBe(4900);
    expect(partial.lifetime.amountCents).toBe(17900);
  });

  test('rejects the whole override when any entry is invalid', () => {
    const cases = [
      ['{"quarterly":4900,', 'invalid_json'],
      ['[4900]', 'not_an_object'],
      ['"4900"', 'not_an_object'],
      ['{"weekly":900}', 'unknown_plan:weekly'],
      ['{"quarterly":0}', 'invalid_amount:quarterly'],
      ['{"quarterly":-4900}', 'invalid_amount:quarterly'],
      ['{"quarterly":49.5}', 'invalid_amount:quarterly'],
      ['{"quarterly":"4900"}', 'invalid_amount:quarterly'],
      ['{"quarterly":99}', 'invalid_amount:quarterly'],
      ['{"lifetime":1000001}', 'invalid_amount:lifetime'],
      ['{"annual":9900,"quarterly":null}', 'invalid_amount:quarterly'],
    ];
    for (const [raw, error] of cases) {
      expect(parsePlanPriceOverrides(raw)).toEqual({ overrides: {}, error });
      const catalog = resolvePlanCatalog({ BILLING_PLAN_PRICES_JSON: raw });
      for (const [planId, amountCents] of Object.entries(defaults)) {
        expect(catalog[planId].amountCents).toBe(amountCents);
      }
    }
  });

  test('never leaks a bogus plan into the catalog', () => {
    const catalog = resolvePlanCatalog({ BILLING_PLAN_PRICES_JSON: '{"annual":9900}' });
    expect(Object.keys(catalog).sort()).toEqual(['annual', 'lifetime', 'monthly', 'quarterly']);
    expect(Object.isFrozen(catalog.annual)).toBe(true);
  });
});

describe('price parity with overridden prices', () => {
  test('compares the provider variant against the overridden amount', () => {
    const env = { BILLING_PLAN_PRICES_JSON: '{"quarterly":5900}' };
    const payload = { data: { attributes: { price: 5900, interval: 'month', interval_count: 3 } } };

    expect(compareVariant('quarterly', 'v59', payload, null, env)).toEqual(
      expect.objectContaining({ ok: true, expected: expect.objectContaining({ amountCents: 5900 }) })
    );
    expect(compareVariant('quarterly', 'v49', payload, null, {})).toEqual(
      expect.objectContaining({ ok: false, mismatches: ['amount_mismatch'] })
    );
  });
});
