const {
  checkLemonSqueezyPriceParity,
  compareVariant,
  resolveVariantId,
} = require('../services/billing/price-parity');

describe('LemonSqueezy price parity', () => {
  test('matches recurring and one-time variant contracts', () => {
    expect(compareVariant('quarterly', '29', {
      data: { attributes: { price: 2900, interval: 'month', interval_count: 3, status: 'published' } },
    })).toEqual(expect.objectContaining({ ok: true, mismatches: [] }));
    expect(compareVariant('lifetime', '199', {
      data: { attributes: { price: 19900, interval: null, interval_count: null, status: 'published' } },
    })).toEqual(expect.objectContaining({ ok: true, mismatches: [] }));
  });

  test('reports amount and billing interval drift', () => {
    const result = compareVariant('annual', '79', {
      data: { attributes: { price: 9900, interval: 'month', interval_count: 12 } },
    });

    expect(result.ok).toBe(false);
    expect(result.mismatches).toEqual([
      'amount_mismatch',
      'interval_mismatch',
      'interval_count_mismatch',
    ]);
  });

  test('fails closed when a scoped API key returns a variant from the other mode', () => {
    const result = compareVariant('monthly', '12', {
      data: {
        attributes: {
          price: 1200,
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
        data: { attributes: { price: 1200, interval: 'month', interval_count: 1 } },
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
