const crypto = require('crypto');

const CANCELLED_EVENT_MATCH = ['cancel', 'cancelled', 'canceled'];
const ENDED_EVENT_MATCH = ['ended', 'expired', 'refund', 'chargeback'];
const KNOWN_EVENT_TYPES = new Set([
  'sale',
  'subscription_updated',
  'subscription_cancelled',
  'subscription_canceled',
  'subscription_ended',
  'subscription_expired',
  'refund',
  'chargeback',
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

function verifyGumroadSignature({ rawBody, signature, secret }) {
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

function pickDate(body, keys) {
  for (const key of keys) {
    const candidate = body?.[key];
    const parsed = parseDateValue(candidate);
    if (parsed) return parsed;
  }
  return null;
}

function normalizeEmail(body) {
  const email =
    body?.email ||
    body?.purchaser_email ||
    body?.user_email ||
    body?.buyer_email ||
    body?.customer_email;
  if (!email) return '';
  return String(email).trim().toLowerCase();
}

function extractEventType(body) {
  const raw = body?.resource_name || body?.event || body?.type || '';
  return String(raw).trim().toLowerCase();
}

function isEventTypeKnown(eventType) {
  if (!eventType) return false;
  if (KNOWN_EVENT_TYPES.has(eventType)) return true;
  return [...CANCELLED_EVENT_MATCH, ...ENDED_EVENT_MATCH, 'sale', 'subscription', 'refund', 'chargeback']
    .some((needle) => eventType.includes(needle));
}

function extractEventId(body, rawBody) {
  const candidates = [
    body?.event_id,
    body?.eventId,
    body?.resource_id,
    body?.resourceId,
    body?.sale_id,
    body?.saleId,
    body?.subscription_id,
    body?.subscriptionId,
    body?.chargeback_id,
    body?.refund_id,
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

function extractSaleId(body) {
  const candidate = body?.sale_id || body?.saleId || '';
  return candidate ? String(candidate).trim() : '';
}

function resolveStatus(eventType, body) {
  const normalized = String(eventType || '').toLowerCase();
  const refunded = String(body?.refunded || '').toLowerCase() === 'true';
  const chargeback = String(body?.chargeback || '').toLowerCase() === 'true';
  if (ENDED_EVENT_MATCH.some((needle) => normalized.includes(needle)) || refunded || chargeback) {
    return 'none';
  }
  if (
    CANCELLED_EVENT_MATCH.some((needle) => normalized.includes(needle)) ||
    body?.subscription_cancelled_at ||
    body?.subscription_canceled_at ||
    String(body?.cancelled || '').toLowerCase() === 'true'
  ) {
    return 'cancelled';
  }
  return 'active';
}

function resolveValidUntil(status, body) {
  if (status === 'none') return { value: null, inferred: false };
  if (status === 'cancelled') {
    const value = pickDate(body, [
      'subscription_ended_at',
      'subscription_ends_at',
      'subscription_end_date',
      'next_billing_date',
      'next_billing_at',
      'next_billing',
    ]);
    if (value) return { value, inferred: false };
    // Policy: cancelled without an end date expires immediately.
    return { value: new Date(), inferred: true };
  }
  return { value: pickDate(body, ['next_billing_date', 'next_billing_at', 'next_billing']), inferred: false };
}

function normalizeGumroadEvent(body, rawBody) {
  const eventType = extractEventType(body);
  const status = resolveStatus(eventType, body);
  const validUntilResult = resolveValidUntil(status, body);
  const validUntil = validUntilResult.value;
  return {
    eventId: extractEventId(body, rawBody),
    eventType,
    email: normalizeEmail(body),
    saleId: extractSaleId(body),
    entitlement: { status, validUntil },
    eventTypeKnown: isEventTypeKnown(eventType),
    validUntilInferred: validUntilResult.inferred,
  };
}

module.exports = {
  normalizeGumroadEvent,
  verifyGumroadSignature,
  parseDateValue,
  resolveStatus,
  isEventTypeKnown,
};
