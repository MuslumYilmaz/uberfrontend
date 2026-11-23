// Polar customer portal access: POST /v1/customer-sessions/ returns a short
// lived portal URL (about an hour) for the customer bound to our user id. The
// customer only exists after the first confirmed checkout, so "Customer does
// not exist" is a normal answer before any purchase.

const { normalizeMode, resolvePolarApiBase, resolvePolarCheckoutHost } = require('./polar-config');
const { DEFAULT_TIMEOUT_MS, requestWithRetry } = require('./polar-checkouts');

function isPolarPortalUrl(value, mode) {
  try {
    const parsed = new URL(String(value || '').trim());
    return parsed.protocol === 'https:' && parsed.hostname.toLowerCase() === resolvePolarCheckoutHost(mode);
  } catch {
    return false;
  }
}

function isCustomerMissing(payload) {
  const detail = Array.isArray(payload?.detail) ? payload.detail : [];
  return detail.some((entry) => /customer does not exist/i.test(String(entry?.msg || '')));
}

async function createPolarCustomerSession({
  accessToken,
  mode,
  externalCustomerId,
  customerId,
  returnUrl,
  fetchImpl = global.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  const normalizedToken = String(accessToken || '').trim();
  const normalizedMode = normalizeMode(mode);
  const external = String(externalCustomerId || '').trim();
  const customer = String(customerId || '').trim();
  if (!normalizedToken) return { ok: false, reason: 'missing_access_token' };
  if (!external && !customer) return { ok: false, reason: 'missing_customer' };
  if (typeof fetchImpl !== 'function') return { ok: false, reason: 'fetch_unavailable' };

  const body = {
    ...(external ? { external_customer_id: external } : { customer_id: customer }),
    ...(returnUrl ? { return_url: String(returnUrl) } : {}),
  };
  const result = await requestWithRetry({
    url: `${resolvePolarApiBase(normalizedMode)}/v1/customer-sessions/`,
    accessToken: normalizedToken,
    body,
    fetchImpl,
    timeoutMs,
  });
  if (!result.ok) {
    if (result.status === 422 && isCustomerMissing(result.payload)) return { ok: false, reason: 'customer_missing', status: 422 };
    if (result.status === 404) return { ok: false, reason: 'customer_missing', status: 404 };
    return { ok: false, reason: result.reason, status: result.status };
  }
  const url = String(result.payload.customer_portal_url || '').trim();
  if (!isPolarPortalUrl(url, normalizedMode)) return { ok: false, reason: 'invalid_portal_url' };
  const expiresAt = result.payload.expires_at ? new Date(result.payload.expires_at) : null;
  return {
    ok: true,
    url,
    customerId: String(result.payload.customer_id || '').trim() || null,
    expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null,
  };
}

module.exports = { createPolarCustomerSession, isPolarPortalUrl };
