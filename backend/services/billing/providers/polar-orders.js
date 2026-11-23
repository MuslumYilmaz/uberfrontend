// Read-only Polar orders for reconciliation (GET /v1/orders/). The list is
// newest first; pages are read until one reaches past the window. Orders have
// no test flag: the mode picks the server (sandbox-api vs api).

const { normalizeMode, resolvePolarApiBase } = require('./polar-config');

const PAID_ORDER_STATUSES = new Set(['paid', 'refunded', 'partially_refunded']);

function parseCents(value) {
  const amount = Number(value);
  return Number.isInteger(amount) && amount >= 0 ? amount : null;
}

function normalizePolarOrder(order) {
  const status = String(order?.status || '').trim().toLowerCase();
  const createdAt = new Date(order?.created_at || 0);
  const identifiers = Array.from(new Set([
    order?.id,
    order?.invoice_number,
  ].map((value) => String(value || '').trim()).filter(Boolean)));
  return {
    orderId: String(order?.id || '').trim(),
    identifiers,
    status,
    refunded: status === 'refunded',
    billingReason: String(order?.billing_reason || '').trim().toLowerCase() || null,
    totalCents: parseCents(order?.total_amount),
    discountCents: parseCents(order?.discount_amount),
    taxCents: parseCents(order?.tax_amount),
    netCents: parseCents(order?.net_amount),
    currency: String(order?.currency || '').trim().toUpperCase() || null,
    createdAt: Number.isNaN(createdAt.getTime()) ? null : createdAt,
    subscriptionId: String(order?.subscription_id || '').trim() || null,
    checkoutId: String(order?.checkout_id || '').trim() || null,
    customerExternalId: String(order?.customer?.external_id || '').trim() || null,
    testMode: null,
  };
}

async function fetchRecentPolarOrders({
  accessToken,
  mode,
  createdAfter,
  createdBefore = new Date(),
  fetchImpl = global.fetch,
  maxPages = 10,
  pageSize = 100,
}) {
  const normalizedToken = String(accessToken || '').trim();
  const normalizedMode = normalizeMode(mode);
  if (!normalizedToken) throw new Error('POLAR_ACCESS_TOKEN is required to reconcile provider orders');
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
  let reachedWindowStart = false;
  let maxPage = Infinity;

  for (let page = 1; page <= safeMaxPages && page <= maxPage && !reachedWindowStart; page += 1) {
    const url = new URL(`${resolvePolarApiBase(normalizedMode)}/v1/orders/`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(safePageSize));
    url.searchParams.set('sorting', '-created_at');
    const response = await fetchImpl(url.toString(), {
      headers: { Accept: 'application/json', Authorization: `Bearer ${normalizedToken}` },
    });
    if (!response.ok) throw new Error(`Polar orders request failed (${response.status})`);
    const payload = await response.json();
    const items = Array.isArray(payload?.items) ? payload.items : [];
    const reportedMaxPage = Number(payload?.pagination?.max_page);
    if (Number.isInteger(reportedMaxPage) && reportedMaxPage > 0) maxPage = reportedMaxPage;
    pagesFetched += 1;
    for (const raw of items) {
      const order = normalizePolarOrder(raw);
      const createdMs = order.createdAt?.getTime();
      if (!Number.isFinite(createdMs)) continue;
      if (createdMs < afterMs) {
        reachedWindowStart = true;
        continue;
      }
      if (createdMs <= beforeMs && PAID_ORDER_STATUSES.has(order.status)) orders.push(order);
    }
    if (items.length < safePageSize) break;
  }

  return {
    orders,
    pagesFetched,
    truncated: !reachedWindowStart && pagesFetched >= safeMaxPages && pagesFetched < maxPage,
  };
}

module.exports = {
  PAID_ORDER_STATUSES,
  fetchRecentPolarOrders,
  normalizePolarOrder,
};
