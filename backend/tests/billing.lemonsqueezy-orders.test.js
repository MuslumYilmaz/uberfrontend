const {
  fetchRecentLemonSqueezyOrders,
  normalizeOrder,
  resolveLemonSqueezyApiKey,
} = require('../services/billing/providers/lemonsqueezy-orders');

describe('LemonSqueezy read-only orders client', () => {
  test('keeps partial refunds entitlement-eligible and treats full refunds as terminal', () => {
    expect(normalizeOrder({
      id: '1',
      attributes: { order_number: 101, status: 'partial_refund', refunded: false, created_at: new Date() },
    })).toEqual(expect.objectContaining({ orderId: '101', refunded: false }));
    expect(normalizeOrder({
      id: '2',
      attributes: { order_number: 102, status: 'refunded', refunded: true, created_at: new Date() },
    })).toEqual(expect.objectContaining({ orderId: '102', refunded: true }));
  });

  test('uses documented store_id pagination and filters dates locally without retaining PII', async () => {
    const now = new Date('2026-08-23T12:00:00.000Z');
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{
          id: '22',
          attributes: {
            order_number: 202,
            identifier: 'order-uuid',
            user_name: 'Private Name',
            user_email: 'private@example.com',
            status: 'paid',
            total: 1200,
            discount_total: 150,
            currency: 'USD',
            created_at: '2026-08-23T11:00:00.000Z',
            test_mode: false,
          },
        }],
      }),
    });

    const report = await fetchRecentLemonSqueezyOrders({
      apiKey: 'live_read_key',
      storeId: '12345',
      mode: 'live',
      createdAfter: new Date('2026-08-22T12:00:00.000Z'),
      createdBefore: now,
      fetchImpl,
    });

    expect(report).toEqual(expect.objectContaining({ pagesFetched: 1, truncated: false }));
    expect(report.orders).toEqual([
      expect.objectContaining({
        orderId: '202',
        status: 'paid',
        totalCents: 1200,
        discountCents: 150,
      }),
    ]);
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toBe(
      'https://api.lemonsqueezy.com/v1/orders?filter%5Bstore_id%5D=12345&page%5Bnumber%5D=1&page%5Bsize%5D=100'
    );
    expect(options.headers.Authorization).toBe('Bearer live_read_key');
    expect(JSON.stringify(report)).not.toContain('private@example.com');
    expect(JSON.stringify(report)).not.toContain('Private Name');
  });

  test('rejects a key that returns orders from the wrong mode', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{
          id: '1',
          attributes: {
            order_number: 1,
            status: 'paid',
            total: 1200,
            created_at: '2026-08-23T11:00:00.000Z',
            test_mode: true,
          },
        }],
      }),
    });

    await expect(fetchRecentLemonSqueezyOrders({
      apiKey: 'wrong_mode_key',
      storeId: '12345',
      mode: 'live',
      createdAfter: new Date('2026-08-22T12:00:00.000Z'),
      createdBefore: new Date('2026-08-23T12:00:00.000Z'),
      fetchImpl,
    })).rejects.toThrow('wrong live mode');
  });

  test('prefers mode-scoped keys while retaining the legacy fallback', () => {
    const env = {
      LEMONSQUEEZY_API_KEY: 'legacy',
      LEMONSQUEEZY_API_KEY_TEST: 'test-key',
      LEMONSQUEEZY_API_KEY_LIVE: 'live-key',
    };
    expect(resolveLemonSqueezyApiKey('test', env)).toBe('test-key');
    expect(resolveLemonSqueezyApiKey('live', env)).toBe('live-key');
    expect(resolveLemonSqueezyApiKey('live', { LEMONSQUEEZY_API_KEY: 'legacy' })).toBe('legacy');
  });
});
