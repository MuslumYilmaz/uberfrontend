const {
  CHECKOUT_API_URL,
  canCreateCustomCheckout,
  createLemonSqueezyCustomCheckout,
  isLemonSqueezyCheckoutUrl,
  resolveLemonSqueezyStoreId,
  resolveLemonSqueezyVariantId,
} = require('../services/billing/providers/lemonsqueezy-checkouts');

const CUSTOM_URL = 'https://frontendatlas.lemonsqueezy.com/checkout/custom/ac470bd4-7c41-474d-b6cd-0f296f5be02a?signature=abc';

function okResponse(customPrice, url = CUSTOM_URL) {
  return {
    ok: true,
    status: 201,
    json: async () => ({ data: { id: 'ls_checkout_1', attributes: { url, custom_price: customPrice } } }),
  };
}

function baseInput(overrides = {}) {
  return {
    apiKey: 'key_test',
    storeId: '12345',
    variantId: '111',
    mode: 'test',
    customPriceCents: 600,
    email: 'ada@university.edu',
    name: 'ada',
    customData: { fa_user_id: 'u1', fa_checkout_attempt_id: 'chk_1', fa_experiment_id: null, fa_price_reason: 'regional', fa_empty: '' },
    redirectUrl: 'https://frontendatlas.com/billing/success?attempt=chk_1',
    now: new Date('2026-10-16T10:00:00.000Z'),
    ...overrides,
  };
}

describe('lemon squeezy custom checkout configuration', () => {
  test('resolves store and variant ids with live never falling back to unscoped values', () => {
    expect(resolveLemonSqueezyStoreId({ LEMONSQUEEZY_STORE_ID: ' 12345 ' })).toBe('12345');
    expect(resolveLemonSqueezyStoreId({ LEMONSQUEEZY_STORE_ID: 'store' })).toBe('');
    expect(resolveLemonSqueezyVariantId('annual', 'live', { LEMONSQUEEZY_ANNUAL_VARIANT_ID: '1', LEMONSQUEEZY_ANNUAL_VARIANT_ID_LIVE: '2' })).toBe('2');
    expect(resolveLemonSqueezyVariantId('annual', 'live', { LEMONSQUEEZY_ANNUAL_VARIANT_ID: '1' })).toBe('');
    expect(resolveLemonSqueezyVariantId('annual', 'test', { LEMONSQUEEZY_ANNUAL_VARIANT_ID: '1' })).toBe('1');
    expect(resolveLemonSqueezyVariantId('annual', 'test', { LEMONSQUEEZY_ANNUAL_VARIANT_ID_TEST: '3', LEMONSQUEEZY_ANNUAL_VARIANT_ID: '1' })).toBe('3');
  });

  test('needs the api key, the store id and a numeric variant id', () => {
    const env = { LEMONSQUEEZY_API_KEY_TEST: 'k', LEMONSQUEEZY_STORE_ID: '12345', LEMONSQUEEZY_MONTHLY_VARIANT_ID_TEST: '111' };
    expect(canCreateCustomCheckout({ planId: 'monthly', mode: 'test', env })).toBe(true);
    expect(canCreateCustomCheckout({ planId: 'annual', mode: 'test', env })).toBe(false);
    expect(canCreateCustomCheckout({ planId: 'monthly', mode: 'live', env })).toBe(false);
    expect(canCreateCustomCheckout({ planId: 'monthly', mode: 'test', env: { ...env, LEMONSQUEEZY_STORE_ID: '' } })).toBe(false);
    expect(canCreateCustomCheckout({ planId: 'monthly', mode: 'test', env: { ...env, LEMONSQUEEZY_API_KEY_TEST: '' } })).toBe(false);
  });

  test('accepts buy and custom checkout links on the provider host only', () => {
    expect(isLemonSqueezyCheckoutUrl('https://frontendatlas.lemonsqueezy.com/checkout/buy/abc')).toBe(true);
    expect(isLemonSqueezyCheckoutUrl(CUSTOM_URL)).toBe(true);
    expect(isLemonSqueezyCheckoutUrl('https://frontendatlas.lemonsqueezy.com/checkout/other/abc')).toBe(false);
    expect(isLemonSqueezyCheckoutUrl('http://frontendatlas.lemonsqueezy.com/checkout/custom/abc')).toBe(false);
    expect(isLemonSqueezyCheckoutUrl('https://attacker.example/checkout/custom/abc')).toBe(false);
  });
});

describe('createLemonSqueezyCustomCheckout', () => {
  test('posts a JSON:API checkout with the custom price, the mode, the custom data and the redirect', async () => {
    const fetchImpl = jest.fn(async () => okResponse(600));

    const result = await createLemonSqueezyCustomCheckout(baseInput({ fetchImpl, embed: true }));

    expect(result).toEqual({ ok: true, url: CUSTOM_URL, checkoutId: 'ls_checkout_1', expiresAt: new Date('2026-10-17T10:00:00.000Z') });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(CHECKOUT_API_URL);
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer key_test');
    expect(init.headers.Accept).toBe('application/vnd.api+json');
    const body = JSON.parse(init.body);
    expect(body).toEqual({
      data: {
        type: 'checkouts',
        attributes: {
          custom_price: 600,
          test_mode: true,
          expires_at: '2026-10-17T10:00:00.000Z',
          product_options: { enabled_variants: [111], redirect_url: 'https://frontendatlas.com/billing/success?attempt=chk_1' },
          checkout_options: { discount: false, embed: true },
          checkout_data: {
            email: 'ada@university.edu',
            name: 'ada',
            custom: { fa_user_id: 'u1', fa_checkout_attempt_id: 'chk_1', fa_price_reason: 'regional' },
          },
        },
        relationships: {
          store: { data: { type: 'stores', id: '12345' } },
          variant: { data: { type: 'variants', id: '111' } },
        },
      },
    });
  });

  test('marks live checkouts as live and leaves embed off for hosted checkouts', async () => {
    const fetchImpl = jest.fn(async () => okResponse(4740));
    await createLemonSqueezyCustomCheckout(baseInput({ fetchImpl, mode: 'live', customPriceCents: 4740 }));
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body.data.attributes.test_mode).toBe(false);
    expect(body.data.attributes.checkout_options.embed).toBe(false);
  });

  test('fails closed on invalid input without calling the API', async () => {
    const fetchImpl = jest.fn();
    expect(await createLemonSqueezyCustomCheckout(baseInput({ fetchImpl, apiKey: '' }))).toEqual({ ok: false, reason: 'missing_api_key' });
    expect(await createLemonSqueezyCustomCheckout(baseInput({ fetchImpl, storeId: 'x' }))).toEqual({ ok: false, reason: 'invalid_store_id' });
    expect(await createLemonSqueezyCustomCheckout(baseInput({ fetchImpl, variantId: '' }))).toEqual({ ok: false, reason: 'invalid_variant_id' });
    expect(await createLemonSqueezyCustomCheckout(baseInput({ fetchImpl, customPriceCents: 0 }))).toEqual({ ok: false, reason: 'invalid_price' });
    expect(await createLemonSqueezyCustomCheckout(baseInput({ fetchImpl, customPriceCents: 12.5 }))).toEqual({ ok: false, reason: 'invalid_price' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('rejects a response whose url is not a provider checkout or whose price differs', async () => {
    const badUrl = jest.fn(async () => okResponse(600, 'https://attacker.example/checkout/custom/abc'));
    expect(await createLemonSqueezyCustomCheckout(baseInput({ fetchImpl: badUrl }))).toEqual({ ok: false, reason: 'invalid_checkout_url' });
    const badPrice = jest.fn(async () => okResponse(1200));
    expect(await createLemonSqueezyCustomCheckout(baseInput({ fetchImpl: badPrice }))).toEqual({ ok: false, reason: 'price_mismatch' });
  });

  test('retries once on a 5xx or a network error and gives up on a 4xx', async () => {
    const flaky = jest.fn()
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) })
      .mockResolvedValueOnce(okResponse(600));
    expect((await createLemonSqueezyCustomCheckout(baseInput({ fetchImpl: flaky }))).ok).toBe(true);
    expect(flaky).toHaveBeenCalledTimes(2);

    const down = jest.fn(async () => ({ ok: false, status: 502, json: async () => ({}) }));
    expect(await createLemonSqueezyCustomCheckout(baseInput({ fetchImpl: down }))).toEqual({ ok: false, reason: 'http_502' });
    expect(down).toHaveBeenCalledTimes(2);

    const rejected = jest.fn(async () => ({ ok: false, status: 422, json: async () => ({}) }));
    expect(await createLemonSqueezyCustomCheckout(baseInput({ fetchImpl: rejected }))).toEqual({ ok: false, reason: 'http_422' });
    expect(rejected).toHaveBeenCalledTimes(1);

    const offline = jest.fn(async () => { throw new TypeError('fetch failed'); });
    expect(await createLemonSqueezyCustomCheckout(baseInput({ fetchImpl: offline }))).toEqual({ ok: false, reason: 'network_error' });
    expect(offline).toHaveBeenCalledTimes(2);
  });
});
