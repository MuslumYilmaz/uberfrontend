const { fetchRecentPolarOrders, normalizePolarOrder } = require('../services/billing/providers/polar-orders');
const { buildOrder } = require('./helpers/polar-fixtures');

function page(items, maxPage = 1) {
  return { ok: true, status: 200, json: async () => ({ items, pagination: { total_count: items.length, max_page: maxPage } }) };
}

describe('polar orders for reconciliation', () => {
  test('normalizes a sandbox order into the reconciliation shape', () => {
    const order = buildOrder({ id: 'ord-1', amounts: { subtotal: 1200, discount: 0, tax: 200 }, createdAt: '2026-11-23T08:07:08.018957Z' });
    order.invoice_number = 'FA-0001';
    expect(normalizePolarOrder(order)).toEqual(expect.objectContaining({
      orderId: 'ord-1',
      identifiers: ['ord-1', 'FA-0001'],
      status: 'paid',
      refunded: false,
      billingReason: 'subscription_create',
      totalCents: 1200,
      discountCents: 0,
      taxCents: 200,
      netCents: 1000,
      currency: 'USD',
      createdAt: new Date('2026-11-23T08:07:08.018957Z'),
      testMode: null,
    }));
    expect(normalizePolarOrder({ ...order, status: 'refunded' }).refunded).toBe(true);
  });

  test('reads newest-first pages until the window start and keeps paid orders inside the window', async () => {
    const inside = buildOrder({ id: 'ord-inside', createdAt: '2026-11-20T10:00:00Z' });
    const pending = buildOrder({ id: 'ord-pending', status: 'pending', paid: false, createdAt: '2026-11-20T09:00:00Z' });
    const tooNew = buildOrder({ id: 'ord-new', createdAt: '2026-11-23T12:00:00Z' });
    const older = buildOrder({ id: 'ord-older', createdAt: '2026-11-10T10:00:00Z' });
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce(page([tooNew, inside], 3))
      .mockResolvedValueOnce(page([pending, older], 3));
    const result = await fetchRecentPolarOrders({
      accessToken: 'polar_oat_test',
      mode: 'test',
      createdAfter: new Date('2026-11-15T00:00:00Z'),
      createdBefore: new Date('2026-11-23T00:00:00Z'),
      fetchImpl,
      pageSize: 2,
    });
    expect(result.orders.map((order) => order.orderId)).toEqual(['ord-inside']);
    expect(result.pagesFetched).toBe(2);
    expect(result.truncated).toBe(false);
    const firstUrl = new URL(fetchImpl.mock.calls[0][0]);
    expect(firstUrl.origin + firstUrl.pathname).toBe('https://sandbox-api.polar.sh/v1/orders/');
    expect(firstUrl.searchParams.get('sorting')).toBe('-created_at');
    expect(firstUrl.searchParams.get('limit')).toBe('2');
    expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBe('Bearer polar_oat_test');
  });

  test('reports truncation when the page budget ends before the window start, and fails on bad input', async () => {
    const fetchImpl = jest.fn(async () => page([buildOrder({ createdAt: '2026-11-22T10:00:00Z' })], 50));
    const result = await fetchRecentPolarOrders({
      accessToken: 'polar_oat_test',
      mode: 'live',
      createdAfter: new Date('2026-11-01T00:00:00Z'),
      fetchImpl,
      maxPages: 2,
      pageSize: 1,
    });
    expect(result.pagesFetched).toBe(2);
    expect(result.truncated).toBe(true);
    expect(new URL(fetchImpl.mock.calls[0][0]).origin).toBe('https://api.polar.sh');

    await expect(fetchRecentPolarOrders({ accessToken: '', mode: 'test', createdAfter: new Date(), fetchImpl })).rejects.toThrow(/POLAR_ACCESS_TOKEN/);
    await expect(fetchRecentPolarOrders({ accessToken: 'x', mode: 'test', createdAfter: new Date('2030-01-01'), createdBefore: new Date('2020-01-01'), fetchImpl })).rejects.toThrow(/window is invalid/);
    const failing = jest.fn(async () => ({ ok: false, status: 401, json: async () => ({}) }));
    await expect(fetchRecentPolarOrders({ accessToken: 'x', mode: 'test', createdAfter: new Date('2026-01-01'), fetchImpl: failing })).rejects.toThrow(/401/);
  });
});
