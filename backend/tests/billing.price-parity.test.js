const {
  checkLemonSqueezyPriceParity,
  checkPolarPriceParity,
  comparePolarProduct,
  compareVariant,
  resolveVariantId,
} = require('../services/billing/price-parity');

describe('Polar price parity', () => {
  const product = (overrides = {}) => ({
    id: '6fb90ee2-8b50-4764-9d4a-cd9a0d2a6fb8',
    name: 'FrontendAtlas Premium — Monthly Access',
    is_archived: false,
    recurring_interval: 'month',
    recurring_interval_count: 1,
    prices: [{ amount_type: 'fixed', price_amount: 2400, price_currency: 'usd' }],
    ...overrides,
  });

  test('matches recurring, quarterly and one-time products against the catalog', () => {
    expect(comparePolarProduct('monthly', 'p1', product())).toEqual(expect.objectContaining({ ok: true, mismatches: [] }));
    expect(comparePolarProduct('quarterly', 'p2', product({ recurring_interval_count: 3, prices: [{ amount_type: 'fixed', price_amount: 4900, price_currency: 'usd' }] }))).toEqual(expect.objectContaining({ ok: true }));
    const lifetime = comparePolarProduct('lifetime', 'p3', product({ recurring_interval: null, recurring_interval_count: null, prices: [{ amount_type: 'fixed', price_amount: 17900, price_currency: 'usd' }] }));
    expect(lifetime.ok).toBe(true);
    expect(lifetime.actual).toEqual(expect.objectContaining({ interval: 'one_time', intervalCount: null, currency: 'USD' }));
  });

  test('reports amount, currency, interval drift, a missing fixed price and an archived product', () => {
    expect(comparePolarProduct('monthly', 'p1', product({ prices: [{ amount_type: 'fixed', price_amount: 2900, price_currency: 'eur' }] })).mismatches)
      .toEqual(['amount_mismatch', 'currency_mismatch']);
    expect(comparePolarProduct('annual', 'p4', product()).mismatches).toEqual(['amount_mismatch', 'interval_mismatch']);
    expect(comparePolarProduct('monthly', 'p1', product({ prices: [{ amount_type: 'custom' }] })).mismatches).toEqual(['fixed_price_missing']);
    expect(comparePolarProduct('monthly', 'p1', product({ is_archived: true })).mismatches).toEqual(['product_archived']);
  });

  test('reads each enabled plan from the API of the mode and flags a missing product id', async () => {
    const env = {
      POLAR_MONTHLY_PRODUCT_ID_TEST: '6fb90ee2-8b50-4764-9d4a-cd9a0d2a6fb8',
      POLAR_LIFETIME_PRODUCT_ID_TEST: '87975549-328f-4a1f-a9c4-09245282d2bd',
    };
    const fetchImpl = jest.fn(async (url) => ({
      ok: true,
      json: async () => (url.includes('87975549')
        ? product({ id: '87975549-328f-4a1f-a9c4-09245282d2bd', recurring_interval: null, recurring_interval_count: null, prices: [{ amount_type: 'fixed', price_amount: 17900, price_currency: 'usd' }] })
        : product()),
    }));
    const report = await checkPolarPriceParity({
      accessToken: 'polar_oat_test',
      mode: 'test',
      enabledPlans: { monthly: true, quarterly: true, lifetime: true },
      env,
      fetchImpl,
    });
    expect(report.provider).toBe('polar');
    expect(report.ok).toBe(false);
    expect(report.results.map((entry) => [entry.planId, entry.ok, entry.mismatches])).toEqual([
      ['monthly', true, []],
      ['quarterly', false, ['product_id_missing']],
      ['lifetime', true, []],
    ]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[0][0]).toBe('https://sandbox-api.polar.sh/v1/products/6fb90ee2-8b50-4764-9d4a-cd9a0d2a6fb8');
    expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBe('Bearer polar_oat_test');
    await expect(checkPolarPriceParity({ accessToken: '', mode: 'test', enabledPlans: {}, env, fetchImpl })).rejects.toThrow(/POLAR_ACCESS_TOKEN/);
  });
});

describe('LemonSqueezy price parity', () => {
  test('matches recurring and one-time variant contracts', () => {
    expect(compareVariant('quarterly', '49', {
      data: { attributes: { price: 4900, interval: 'month', interval_count: 3, status: 'published' } },
    })).toEqual(expect.objectContaining({ ok: true, mismatches: [] }));
    expect(compareVariant('lifetime', '179', {
      data: { attributes: { price: 17900, interval: null, interval_count: null, status: 'published' } },
    })).toEqual(expect.objectContaining({ ok: true, mismatches: [] }));
  });

  test('treats a single-payment variant as one-time even when it still reports an interval', () => {
    // Shape returned by the live lifetime variant on 2026-10-16.
    const lifetime = compareVariant('lifetime', '1247629', {
      data: { attributes: { price: 17900, interval: 'month', interval_count: 1, is_subscription: false, status: 'published' } },
    });
    expect(lifetime).toEqual(expect.objectContaining({ ok: true, mismatches: [] }));
    expect(lifetime.actual).toEqual(expect.objectContaining({ interval: 'one_time', intervalCount: null }));

    // A subscription variant keeps the interval check.
    const annual = compareVariant('annual', '99', {
      data: { attributes: { price: 9900, interval: 'month', interval_count: 1, is_subscription: true } },
    });
    expect(annual.ok).toBe(false);
    expect(annual.mismatches).toEqual(['interval_mismatch']);

    // A recurring plan whose variant was switched to a single payment is reported.
    const quarterly = compareVariant('quarterly', '49', {
      data: { attributes: { price: 4900, interval: 'month', interval_count: 3, is_subscription: false } },
    });
    expect(quarterly.ok).toBe(false);
    expect(quarterly.mismatches).toEqual(['interval_mismatch', 'interval_count_mismatch']);
  });

  test('reports amount and billing interval drift', () => {
    const result = compareVariant('annual', '99', {
      data: { attributes: { price: 11900, interval: 'month', interval_count: 12 } },
    });

    expect(result.ok).toBe(false);
    expect(result.mismatches).toEqual([
      'amount_mismatch',
      'interval_mismatch',
      'interval_count_mismatch',
    ]);
  });

  test('fails closed when a scoped API key returns a variant from the other mode', () => {
    const result = compareVariant('monthly', '24', {
      data: {
        attributes: {
          price: 2400,
          interval: 'month',
          interval_count: 1,
          test_mode: true,
        },
      },
    }, 'live');

    expect(result.ok).toBe(false);
    expect(result.mismatches).toContain('mode_mismatch');
  });

  test('checks only enabled plans through the read-only variants API', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { attributes: { price: 2400, interval: 'month', interval_count: 1 } },
      }),
    });
    const report = await checkLemonSqueezyPriceParity({
      apiKey: 'secret_api_key',
      mode: 'test',
      enabledPlans: { monthly: true, quarterly: false, annual: false, lifetime: false },
      env: { LEMONSQUEEZY_MONTHLY_VARIANT_ID_TEST: 'variant_monthly_test' },
      fetchImpl,
    });

    expect(report.ok).toBe(true);
    expect(report.checkedPlans).toBe(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.lemonsqueezy.com/v1/variants/variant_monthly_test',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer secret_api_key' }),
      })
    );
    expect(JSON.stringify(report)).not.toContain('secret_api_key');
  });

  test('fails closed when a variant id is missing and never reuses a test id in live mode', async () => {
    expect(resolveVariantId('monthly', 'live', {
      LEMONSQUEEZY_MONTHLY_VARIANT_ID: 'legacy-test-id',
      LEMONSQUEEZY_MONTHLY_VARIANT_ID_TEST: 'test-id',
    })).toBe('');

    const fetchImpl = jest.fn();
    const report = await checkLemonSqueezyPriceParity({
      apiKey: 'secret_api_key',
      mode: 'live',
      enabledPlans: { monthly: true },
      env: {},
      fetchImpl,
    });
    expect(report.ok).toBe(false);
    expect(report.results[0].mismatches).toEqual(['variant_id_missing']);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
