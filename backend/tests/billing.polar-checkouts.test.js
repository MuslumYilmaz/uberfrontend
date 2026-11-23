const {
  canCreatePolarCheckout,
  createPolarCheckout,
  isPolarCheckoutUrl,
  normalizeClientIp,
  sanitizeMetadata,
} = require('../services/billing/providers/polar-checkouts');
const { createPolarCustomerSession } = require('../services/billing/providers/polar-portal');

const PRODUCT = '6fb90ee2-8b50-4764-9d4a-cd9a0d2a6fb8';
const SESSION_URL = 'https://sandbox.polar.sh/checkout/polar_c_abc123';

function respond(status, payload) {
  return { ok: status >= 200 && status < 300, status, json: async () => payload };
}

function sessionPayload(overrides = {}) {
  return {
    id: 'c0ffee00-0000-4000-8000-000000000001',
    url: SESSION_URL,
    status: 'open',
    amount: 2400,
    total_amount: 2400,
    expires_at: '2026-11-24T08:05:23.418661Z',
    client_secret: 'polar_c_secret',
    ...overrides,
  };
}

const baseArgs = {
  accessToken: 'polar_oat_test',
  mode: 'test',
  productId: PRODUCT,
  expectedAmountCents: 2400,
  email: 'buyer@example.com',
  name: 'buyer',
  externalCustomerId: '507f1f77bcf86cd799439011',
  metadata: { fa_user_id: '507f1f77bcf86cd799439011', fa_checkout_attempt_id: 'chk_1', fa_experiment_id: null, fa_price_reason: '', fa_empty: undefined },
  successUrl: 'http://localhost:4310/billing/success?attempt=chk_1',
  returnUrl: 'http://localhost:4310/billing/cancel?attempt=chk_1',
};

describe('polar checkout url and configuration helpers', () => {
  test('accepts only https checkout paths on the host of the mode', () => {
    expect(isPolarCheckoutUrl(SESSION_URL)).toBe(true);
    expect(isPolarCheckoutUrl(SESSION_URL, 'test')).toBe(true);
    expect(isPolarCheckoutUrl(SESSION_URL, 'live')).toBe(false);
    expect(isPolarCheckoutUrl('https://polar.sh/checkout/polar_c_live', 'live')).toBe(true);
    expect(isPolarCheckoutUrl('http://sandbox.polar.sh/checkout/polar_c_abc')).toBe(false);
    expect(isPolarCheckoutUrl('https://evil.polar.sh.example/checkout/polar_c_abc')).toBe(false);
    expect(isPolarCheckoutUrl('https://sandbox.polar.sh/frontendatlas/portal')).toBe(false);
  });

  test('a checkout needs the token and the product id of the mode', () => {
    const env = { POLAR_ACCESS_TOKEN_TEST: 'polar_oat_test', POLAR_MONTHLY_PRODUCT_ID_TEST: PRODUCT };
    expect(canCreatePolarCheckout({ planId: 'monthly', mode: 'test', env })).toBe(true);
    expect(canCreatePolarCheckout({ planId: 'annual', mode: 'test', env })).toBe(false);
    expect(canCreatePolarCheckout({ planId: 'monthly', mode: 'live', env })).toBe(false);
    expect(canCreatePolarCheckout({ planId: 'monthly', mode: 'test', env: { POLAR_MONTHLY_PRODUCT_ID_TEST: PRODUCT } })).toBe(false);
  });

  test('metadata drops empty values and caps keys, values and pairs', () => {
    const metadata = sanitizeMetadata({ a: '', b: null, c: undefined, d: ' kept ', e: 'x'.repeat(600), ['k'.repeat(60)]: 'v' });
    expect(metadata).toEqual({ d: 'kept', e: 'x'.repeat(500), ['k'.repeat(40)]: 'v' });
    const many = Object.fromEntries(Array.from({ length: 60 }, (_, i) => [`key${i}`, 'v']));
    expect(Object.keys(sanitizeMetadata(many))).toHaveLength(50);
  });

  test('client ip takes the first forwarded hop and ignores garbage', () => {
    expect(normalizeClientIp('203.0.113.9, 10.0.0.1')).toBe('203.0.113.9');
    expect(normalizeClientIp('2001:db8::1')).toBe('2001:db8::1');
    expect(normalizeClientIp('not-an-ip')).toBe('');
    expect(normalizeClientIp('')).toBe('');
  });
});

describe('createPolarCheckout', () => {
  test('creates a list-price session with our user id, metadata and return urls', async () => {
    const fetchImpl = jest.fn(async () => respond(201, sessionPayload()));
    const result = await createPolarCheckout({ ...baseArgs, fetchImpl, customerIpAddress: '203.0.113.9, 10.0.0.1', embedOrigin: 'http://localhost:4310' });
    expect(result).toEqual(expect.objectContaining({ ok: true, url: SESSION_URL, checkoutId: 'c0ffee00-0000-4000-8000-000000000001', amountCents: 2400, totalCents: 2400 }));
    expect(result.expiresAt).toEqual(new Date('2026-11-24T08:05:23.418661Z'));
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://sandbox-api.polar.sh/v1/checkouts/');
    expect(init.headers.Authorization).toBe('Bearer polar_oat_test');
    const body = JSON.parse(init.body);
    expect(body).toEqual({
      products: [PRODUCT],
      external_customer_id: '507f1f77bcf86cd799439011',
      customer_email: 'buyer@example.com',
      customer_name: 'buyer',
      metadata: { fa_user_id: '507f1f77bcf86cd799439011', fa_checkout_attempt_id: 'chk_1' },
      success_url: baseArgs.successUrl,
      return_url: baseArgs.returnUrl,
      embed_origin: 'http://localhost:4310',
      allow_discount_codes: false,
      customer_ip_address: '203.0.113.9',
    });
    expect(body.prices).toBeUndefined();
  });

  test('a custom price becomes an ad-hoc fixed price for the product and must come back unchanged', async () => {
    const fetchImpl = jest.fn(async () => respond(201, sessionPayload({ amount: 1200, total_amount: 1200 })));
    const result = await createPolarCheckout({ ...baseArgs, customPriceCents: 1200, fetchImpl });
    expect(result.ok).toBe(true);
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body.prices).toEqual({ [PRODUCT]: [{ amount_type: 'fixed', price_amount: 1200, price_currency: 'usd' }] });

    const wrong = jest.fn(async () => respond(201, sessionPayload({ amount: 2400 })));
    expect(await createPolarCheckout({ ...baseArgs, customPriceCents: 1200, fetchImpl: wrong })).toEqual({ ok: false, reason: 'price_mismatch' });
  });

  test('a campaign discount is sent by id, never together with a custom price', async () => {
    const fetchImpl = jest.fn(async () => respond(201, sessionPayload({ amount: 9900, total_amount: 5940, discount_id: 'disc-1' })));
    const result = await createPolarCheckout({ ...baseArgs, expectedAmountCents: 9900, discountId: 'disc-1', fetchImpl });
    expect(result.ok).toBe(true);
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body).discount_id).toBe('disc-1');
    expect(await createPolarCheckout({ ...baseArgs, customPriceCents: 1200, discountId: 'disc-1', fetchImpl })).toEqual({ ok: false, reason: 'discount_with_custom_price' });
  });

  test('live sessions are created on the production API and must come back on polar.sh', async () => {
    const fetchImpl = jest.fn(async () => respond(201, sessionPayload({ url: 'https://polar.sh/checkout/polar_c_live' })));
    const result = await createPolarCheckout({ ...baseArgs, mode: 'live', fetchImpl });
    expect(result.ok).toBe(true);
    expect(fetchImpl.mock.calls[0][0]).toBe('https://api.polar.sh/v1/checkouts/');

    const sandboxUrlInLive = jest.fn(async () => respond(201, sessionPayload()));
    expect(await createPolarCheckout({ ...baseArgs, mode: 'live', fetchImpl: sandboxUrlInLive })).toEqual({ ok: false, reason: 'invalid_checkout_url' });
  });

  test('fails closed on bad input, 4xx answers, and after one retry on a transient failure', async () => {
    expect(await createPolarCheckout({ ...baseArgs, accessToken: '' })).toEqual({ ok: false, reason: 'missing_access_token' });
    expect(await createPolarCheckout({ ...baseArgs, productId: 'nope' })).toEqual({ ok: false, reason: 'invalid_product_id' });
    expect(await createPolarCheckout({ ...baseArgs, customPriceCents: 0 })).toEqual({ ok: false, reason: 'invalid_price' });
    expect(await createPolarCheckout({ ...baseArgs, fetchImpl: null })).toEqual({ ok: false, reason: 'fetch_unavailable' });

    const unprocessable = jest.fn(async () => respond(422, { error: 'PolarRequestValidationError', detail: [] }));
    expect(await createPolarCheckout({ ...baseArgs, fetchImpl: unprocessable })).toEqual({ ok: false, reason: 'http_422', status: 422 });
    expect(unprocessable).toHaveBeenCalledTimes(1);

    const flaky = jest.fn()
      .mockResolvedValueOnce(respond(503, {}))
      .mockResolvedValueOnce(respond(201, sessionPayload()));
    expect((await createPolarCheckout({ ...baseArgs, fetchImpl: flaky })).ok).toBe(true);
    expect(flaky).toHaveBeenCalledTimes(2);

    const down = jest.fn(async () => respond(502, {}));
    expect(await createPolarCheckout({ ...baseArgs, fetchImpl: down })).toEqual({ ok: false, reason: 'http_502', status: 0 });
    expect(down).toHaveBeenCalledTimes(2);

    const network = jest.fn(async () => { throw new Error('ECONNRESET'); });
    expect(await createPolarCheckout({ ...baseArgs, fetchImpl: network })).toEqual({ ok: false, reason: 'network_error', status: 0 });

    const expired = jest.fn(async () => respond(201, sessionPayload({ status: 'expired' })));
    expect(await createPolarCheckout({ ...baseArgs, fetchImpl: expired })).toEqual({ ok: false, reason: 'checkout_expired' });
  });
});

describe('createPolarCustomerSession', () => {
  test('returns the portal url for our user id and reports a missing customer', async () => {
    const fetchImpl = jest.fn(async () => respond(201, {
      customer_portal_url: 'https://sandbox.polar.sh/frontendatlas/portal?customer_session_token=polar_mst_x&email=a%40b.c',
      expires_at: '2026-11-23T09:07:41.732382Z',
      customer_id: 'd63e5340-24d6-4619-881d-4b3e4575b5d5',
      token: 'polar_mst_x',
    }));
    const result = await createPolarCustomerSession({ accessToken: 'polar_oat_test', mode: 'test', externalCustomerId: '507f1f77bcf86cd799439011', fetchImpl });
    expect(result).toEqual(expect.objectContaining({ ok: true, customerId: 'd63e5340-24d6-4619-881d-4b3e4575b5d5' }));
    expect(result.url).toContain('https://sandbox.polar.sh/frontendatlas/portal');
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://sandbox-api.polar.sh/v1/customer-sessions/');
    expect(JSON.parse(init.body)).toEqual({ external_customer_id: '507f1f77bcf86cd799439011' });

    const missing = jest.fn(async () => respond(422, { error: 'PolarRequestValidationError', detail: [{ type: 'value_error', loc: ['body', 'external_customer_id'], msg: 'Customer does not exist.' }] }));
    expect(await createPolarCustomerSession({ accessToken: 'polar_oat_test', mode: 'test', externalCustomerId: 'x', fetchImpl: missing })).toEqual({ ok: false, reason: 'customer_missing', status: 422 });

    const unauthorized = jest.fn(async () => respond(401, { error: 'invalid_token' }));
    expect(await createPolarCustomerSession({ accessToken: 'bad', mode: 'test', externalCustomerId: 'x', fetchImpl: unauthorized })).toEqual({ ok: false, reason: 'http_401', status: 401 });

    const foreign = jest.fn(async () => respond(201, { customer_portal_url: 'https://polar.sh/other/portal' }));
    expect(await createPolarCustomerSession({ accessToken: 'polar_oat_test', mode: 'test', externalCustomerId: 'x', fetchImpl: foreign })).toEqual({ ok: false, reason: 'invalid_portal_url' });
    expect(await createPolarCustomerSession({ accessToken: 'polar_oat_test', mode: 'test', fetchImpl })).toEqual({ ok: false, reason: 'missing_customer' });
  });
});
