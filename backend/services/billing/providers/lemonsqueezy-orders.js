const PAID_ORDER_STATUSES = new Set(['paid', 'refunded', 'partially_refunded', 'partial_refund']);

function resolveLemonSqueezyApiKey(mode, env = process.env) {
  const normalizedMode = mode === 'test' ? 'test' : 'live';
  const scopedName = normalizedMode === 'test'
    ? 'LEMONSQUEEZY_API_KEY_TEST'
    : 'LEMONSQUEEZY_API_KEY_LIVE';
  return String(env[scopedName] || env.LEMONSQUEEZY_API_KEY || '').trim();
}

function normalizeOrder(resource) {
  const attributes = resource?.attributes || {};
  const status = String(attributes.status || '').trim().toLowerCase();
  const createdAt = new Date(attributes.created_at || attributes.createdAt || 0);
  const totalCents = Number(attributes.total);
  const discountCents = Number(attributes.discount_total);
  const identifiers = Array.from(new Set([
    resource?.id,
    attributes.order_number,
    attributes.identifier,
  ].map((value) => String(value || '').trim()).filter(Boolean)));
  return {
    orderId: String(attributes.order_number || resource?.id || '').trim(),
    identifiers,
    status,
    refunded: attributes.refunded === true || status === 'refunded',
    totalCents: Number.isInteger(totalCents) && totalCents >= 0 ? totalCents : null,
    discountCents: Number.isInteger(discountCents) && discountCents >= 0 ? discountCents : null,
    currency: String(attributes.currency || '').trim().toUpperCase() || null,
    createdAt: Number.isNaN(createdAt.getTime()) ? null : createdAt,
    testMode: typeof attributes.test_mode === 'boolean' ? attributes.test_mode : null,
  };
}

async function fetchRecentLemonSqueezyOrders({
  apiKey,
  storeId,
  mode,
  createdAfter,
  createdBefore = new Date(),
  fetchImpl = global.fetch,
  maxPages = 10,
  pageSize = 100,
}) {
  const normalizedApiKey = String(apiKey || '').trim();
  const normalizedStoreId = String(storeId || '').trim();
  const normalizedMode = mode === 'test' ? 'test' : 'live';
  if (!normalizedApiKey) throw new Error('LEMONSQUEEZY_API_KEY is required to reconcile provider orders');
  if (!/^[0-9]+$/.test(normalizedStoreId)) {
    throw new Error('LEMONSQUEEZY_STORE_ID must be a numeric store id');
  }
  if (typeof fetchImpl !== 'function') throw new Error('Global fetch is unavailable');

  const afterMs = new Date(createdAfter).getTime();
  const beforeMs = new Date(createdBefore).getTime();
  if (!Number.isFinite(afterMs) || !Number.isFinite(beforeMs) || afterMs > beforeMs) {
    throw new Error('Provider-order reconciliation window is invalid');
  }
  const safeMaxPages = Math.min(25, Math.max(1, Number(maxPages) || 10));
  const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 100));
  const orders = [];
  let pagesFetched = 0;
  let lastPageWasFull = false;

  for (let page = 1; page <= safeMaxPages; page += 1) {
    const url = new URL('https://api.lemonsqueezy.com/v1/orders');
    url.searchParams.set('filter[store_id]', normalizedStoreId);
    url.searchParams.set('page[number]', String(page));
    url.searchParams.set('page[size]', String(safePageSize));
    const response = await fetchImpl(url.toString(), {
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${normalizedApiKey}`,
      },
    });
    if (!response.ok) {
      throw new Error(`LemonSqueezy orders request failed (${response.status})`);
    }
    const payload = await response.json();
    const resources = Array.isArray(payload?.data) ? payload.data : [];
    const expectedTestMode = normalizedMode === 'test';
    if (resources.some((resource) => (
      typeof resource?.attributes?.test_mode === 'boolean'
      && resource.attributes.test_mode !== expectedTestMode
    ))) {
      throw new Error(`LemonSqueezy API key returned orders from the wrong ${normalizedMode} mode`);
    }
    pagesFetched += 1;
    lastPageWasFull = resources.length === safePageSize;
    for (const resource of resources) {
      const order = normalizeOrder(resource);
      const createdMs = order.createdAt?.getTime();
      const modeMatches = order.testMode === null
        || order.testMode === (normalizedMode === 'test');
      if (
        modeMatches
        && PAID_ORDER_STATUSES.has(order.status)
        && Number.isFinite(createdMs)
        && createdMs >= afterMs
        && createdMs <= beforeMs
      ) {
        orders.push(order);
      }
    }
    if (resources.length < safePageSize) break;
  }

  return {
    orders,
    pagesFetched,
    truncated: pagesFetched === safeMaxPages && lastPageWasFull,
  };
}

module.exports = {
  fetchRecentLemonSqueezyOrders,
  normalizeOrder,
  resolveLemonSqueezyApiKey,
};
