const crypto = require('crypto');

const KNOWN_EVENT_TYPES = new Set([
  'order_created',
  'order_refunded',
  'subscription_created',
  'subscription_updated',
  'subscription_cancelled',
  'subscription_canceled',
  'subscription_payment_success',
  'subscription_payment_failed',
]);

function normalizeSignature(sig) {
  if (!sig) return '';
  const raw = String(sig).trim();
  const parts = raw.split('=');
  return parts.length === 2 ? parts[1].trim() : raw;
}

function timingSafeEqual(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function verifyLemonSqueezySignature({ rawBody, signature, secret }) {
  if (!signature || !secret) return false;
  const normalized = normalizeSignature(signature);
  const payload = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody || ''));
  const computed = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return timingSafeEqual(normalized, computed);
}

function parseDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    const ms = value > 1e12 ? value : value * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const str = String(value).trim();
  if (!str) return null;
  const num = Number(str);
  if (!Number.isNaN(num) && /^\d+$/.test(str)) {
    const ms = num > 1e12 ? num : num * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pickDate(attrs, keys) {
  for (const key of keys) {
    const candidate = attrs?.[key];
    const parsed = parseDateValue(candidate);
    if (parsed) return parsed;
  }
  return null;
}

function extractEventType(body) {
  const raw =
    body?.meta?.event_name ||
    body?.meta?.event ||
    body?.event_name ||
    body?.event ||
    body?.type ||
    '';
  return String(raw).trim().toLowerCase();
}

function isEventTypeKnown(eventType) {
  if (!eventType) return false;
  if (KNOWN_EVENT_TYPES.has(eventType)) return true;
  return ['order', 'subscription', 'refund', 'payment'].some((needle) => eventType.includes(needle));
}

function extractEventId(body, rawBody) {
  const candidates = [
    body?.meta?.event_id,
    body?.meta?.eventId,
    body?.data?.id,
    body?.data?.attributes?.order_id,
    body?.data?.attributes?.subscription_id,
    body?.data?.attributes?.id,
    body?.id,
  ];
  for (const c of candidates) {
    if (c !== undefined && c !== null && String(c).trim()) {
      return String(c).trim();
    }
  }
  const payload = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody || JSON.stringify(body || {})));
  return crypto.createHash('sha256').update(payload).digest('hex');
}

function extractEmail(body) {
  const attrs = body?.data?.attributes || {};
  const email =
    attrs.user_email ||
    attrs.customer_email ||
    attrs.email ||
    attrs.billing_email ||
    body?.email ||
    body?.customer_email;
  if (!email) return '';
  return String(email).trim().toLowerCase();
}

function extractCustomerId(body) {
  const rel = body?.data?.relationships?.customer?.data?.id;
  const attr = body?.data?.attributes?.customer_id;
  const candidate = rel || attr;
  return candidate ? String(candidate).trim() : '';
}

function extractSubscriptionId(body) {
  const rel = body?.data?.relationships?.subscription?.data?.id;
  const attr = body?.data?.attributes?.subscription_id;
  const candidate = rel || attr;
  return candidate ? String(candidate).trim() : '';
}

function extractManageUrl(body) {
  const urls = body?.data?.attributes?.urls || {};
  const direct = body?.data?.attributes?.manage_url || body?.data?.attributes?.portal_url;
  const candidates = [
    direct,
    urls.customer_portal,
    urls.portal,
    urls.manage,
    urls.update,
    urls.update_payment_method,
    urls.payment_method,
    urls.cancel,
  ];
  for (const candidate of candidates) {
    if (candidate && String(candidate).trim()) {
      return String(candidate).trim();
    }
  }
  return '';
}

function extractOrderId(body) {
  const attr = body?.data?.attributes?.order_id || body?.data?.attributes?.order_number;
  const candidate = attr || body?.data?.id;
  return candidate ? String(candidate).trim() : '';
}

function extractVariantId(body) {
  const attr = body?.data?.attributes?.variant_id;
  return attr ? String(attr).trim() : '';
}

function extractProductId(body) {
  const attr = body?.data?.attributes?.product_id;
  return attr ? String(attr).trim() : '';
}

function resolveStatus(eventType, attrs) {
  const normalized = String(eventType || '').toLowerCase();
  const statusRaw = String(attrs?.status || '').toLowerCase();

  if (normalized.includes('refund') || normalized.includes('refunded')) return 'none';
  if (normalized.includes('payment_failed')) return 'none';
  if (normalized.includes('cancel')) return 'cancelled';
  if (normalized.includes('expired')) return 'none';

  if (statusRaw === 'cancelled' || statusRaw === 'canceled') return 'cancelled';
  if (['expired', 'unpaid', 'void', 'refunded', 'failed'].includes(statusRaw)) return 'none';

  return 'active';
}

function resolveValidUntil(status, attrs) {
  if (status === 'none') return { value: null, inferred: false };
  if (status === 'cancelled') {
    const value = pickDate(attrs, ['ends_at', 'renews_at', 'trial_ends_at', 'current_period_end']);
    if (value) return { value, inferred: false };
    return { value: new Date(), inferred: true };
  }
  return {
    value: pickDate(attrs, ['renews_at', 'ends_at', 'trial_ends_at', 'current_period_end']),
    inferred: false,
  };
}

function normalizeLemonSqueezyEvent(body, rawBody) {
  const eventType = extractEventType(body);
  const attrs = body?.data?.attributes || {};
  const status = resolveStatus(eventType, attrs);
  const validUntilResult = resolveValidUntil(status, attrs);

  return {
    eventId: extractEventId(body, rawBody),
    eventType,
    email: extractEmail(body),
    customerId: extractCustomerId(body),
    subscriptionId: extractSubscriptionId(body),
    manageUrl: extractManageUrl(body),
    orderId: extractOrderId(body),
    variantId: extractVariantId(body),
    productId: extractProductId(body),
    entitlement: { status, validUntil: validUntilResult.value },
    eventTypeKnown: isEventTypeKnown(eventType),
    validUntilInferred: validUntilResult.inferred,
  };
}

module.exports = {
  normalizeLemonSqueezyEvent,
  verifyLemonSqueezySignature,
  parseDateValue,
  resolveStatus,
  isEventTypeKnown,
};
