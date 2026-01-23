const express = require('express');
const User = require('../models/User');
const BillingEvent = require('../models/BillingEvent');
const PendingEntitlement = require('../models/PendingEntitlement');
const { createBillingEventStore } = require('../services/billing/billing-events');
const { isProEntitlementActive } = require('../services/billing/entitlements');
const { normalizeGumroadEvent, verifyGumroadSignature } = require('../services/billing/providers/gumroad');
const {
  normalizeLemonSqueezyEvent,
  verifyLemonSqueezySignature,
} = require('../services/billing/providers/lemonsqueezy');
const { recordPendingEntitlement } = require('../services/billing/pending-entitlements');

const router = express.Router();
const { requireAuth } = require('../middleware/Auth');
const SUPPORTED_PROVIDERS = new Set(['gumroad', 'lemonsqueezy', 'stripe']);
const DEFAULT_PROVIDER = String(process.env.BILLING_PROVIDER || 'gumroad').toLowerCase();

function normalizeProvider(raw) {
  const candidate = String(raw || '').toLowerCase();
  return SUPPORTED_PROVIDERS.has(candidate) ? candidate : null;
}

function resolveProvider(raw) {
  if (!raw) {
    return normalizeProvider(DEFAULT_PROVIDER) || 'gumroad';
  }
  return normalizeProvider(raw);
}

const gumroadParsers = [
  express.urlencoded({
    extended: false,
    verify: (req, _res, buf) => {
      if (buf?.length) req.rawBody = buf;
    },
  }),
  express.json({
    verify: (req, _res, buf) => {
      if (buf?.length) req.rawBody = buf;
    },
  }),
];

const eventStore = createBillingEventStore(BillingEvent);

async function handleGumroadWebhook(req, res) {
  try {
    const debug =
      process.env.BILLING_WEBHOOK_DEBUG === 'true' || process.env.NODE_ENV !== 'production';
    const secret = process.env.GUMROAD_WEBHOOK_SECRET;
    if (!secret) {
      console.error('[gumroad] missing GUMROAD_WEBHOOK_SECRET');
      return res.status(500).json({ error: 'Webhook secret missing' });
    }

    const contentType = req.get('content-type') || '(none)';
    const rawBody = req.rawBody || '';
    const rawBodyLength = Buffer.isBuffer(rawBody)
      ? rawBody.length
      : Buffer.byteLength(String(rawBody || ''));
    const headerNames = Array.isArray(req.rawHeaders)
      ? req.rawHeaders.filter((_, i) => i % 2 === 0)
      : [];
    const signatureHeader =
      headerNames.find((name) => String(name).toLowerCase() === 'x-gumroad-signature') || 'none';
    if (debug) {
      console.log('[gumroad] webhook received', { contentType, rawBodyLength, signatureHeader });
    }

    const signature = req.get('x-gumroad-signature') || req.get('X-Gumroad-Signature');
    const valid = verifyGumroadSignature({ rawBody, signature, secret });
    if (!valid) {
      if (debug) {
        console.warn('[gumroad] signature verification failed');
      }
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const normalized = normalizeGumroadEvent(req.body || {}, rawBody);
    if (!normalized.eventTypeKnown) {
      console.warn('[gumroad] unknown event type', {
        eventId: normalized.eventId,
        eventType: normalized.eventType,
        keys: Object.keys(req.body || {}),
      });
    }
    if (normalized.validUntilInferred && normalized.entitlement.status === 'cancelled') {
      console.warn('[gumroad] cancelled event missing end date; expiring immediately', {
        eventId: normalized.eventId,
        eventType: normalized.eventType,
      });
    }
    const normalizedEmail = normalized.email ? normalized.email.trim().toLowerCase() : '';
    if (!normalized.eventId) {
      if (debug) {
        console.warn('[gumroad] missing event id');
      }
      return res.status(400).json({ error: 'Missing event id' });
    }
    if (!normalizedEmail) {
      if (debug) {
        console.warn('[gumroad] missing email');
      }
      return res.status(400).json({ error: 'Missing email' });
    }

    const { duplicate } = await eventStore.recordEvent({
      provider: 'gumroad',
      eventId: normalized.eventId,
      eventType: normalized.eventType,
      email: normalizedEmail,
      payload: req.body,
      processingStatus: normalized.eventTypeKnown ? 'received' : 'received_unknown_type',
    });

    if (duplicate) {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      if (debug) {
        console.warn(`[gumroad] user not found for event ${normalized.eventId}`);
      }
      await recordPendingEntitlement(PendingEntitlement, {
        provider: 'gumroad',
        eventId: normalized.eventId,
        eventType: normalized.eventType,
        email: normalizedEmail,
        entitlement: normalized.entitlement,
        saleId: normalized.saleId,
        payload: req.body,
      });
      await BillingEvent.updateOne(
        { provider: 'gumroad', eventId: normalized.eventId },
        { $set: { processingStatus: 'pending_user', processedAt: new Date() } }
      );
      return res.status(200).json({ ok: true, userFound: false });
    }

    user.entitlements = user.entitlements || {};
    user.entitlements.pro = {
      status: normalized.entitlement.status,
      validUntil: normalized.entitlement.validUntil,
    };
    if (!user.entitlements.projects) {
      user.entitlements.projects = { status: 'none', validUntil: null };
    }

    user.billing = user.billing || {};
    user.billing.providers = user.billing.providers || {};
    const gumroadMeta = user.billing.providers.gumroad || {};
    if (normalized.saleId) gumroadMeta.saleId = normalized.saleId;
    gumroadMeta.purchaserEmail = normalizedEmail;
    gumroadMeta.lastEventId = normalized.eventId;
    gumroadMeta.lastEventAt = new Date();
    user.billing.providers.gumroad = gumroadMeta;

    const isActive = isProEntitlementActive(user.entitlements.pro);
    user.accessTier = isActive ? 'premium' : 'free';

    await user.save();
    const processedStatus = normalized.eventTypeKnown ? 'processed' : 'processed_unknown_type';
    await BillingEvent.updateOne(
      { provider: 'gumroad', eventId: normalized.eventId },
      { $set: { processingStatus: processedStatus, processedAt: new Date(), userId: user._id } }
    );
    if (debug) {
      console.log(`[gumroad] updated user ${user._id} -> ${user.entitlements.pro.status}`);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[gumroad] webhook error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleLemonSqueezyWebhook(req, res) {
  try {
    const debug =
      process.env.BILLING_WEBHOOK_DEBUG === 'true' || process.env.NODE_ENV !== 'production';
    const legacySecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    const testSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET_TEST || legacySecret;
    const liveSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET_LIVE;
    const modeHint = resolveLemonSqueezyMode(req.body || {});
    const hasLegacy = !!legacySecret;
    const hasTest = !!testSecret;
    const hasLive = !!liveSecret;
    const expectedMode = modeHint === 'test' ? 'test' : modeHint === 'live' ? 'live' : 'unknown';
    const missingExpected =
      (expectedMode === 'test' && !testSecret && !legacySecret) ||
      (expectedMode === 'live' && !liveSecret && !legacySecret);
    if (!hasTest && !hasLive || missingExpected) {
      if (debug) {
        console.warn('[lemonsqueezy] webhook secrets missing', {
          hasLegacy,
          hasTest,
          hasLive,
          modeHint: expectedMode,
        });
      }
      return res.status(500).json({ error: `Webhook secret missing (mode: ${expectedMode})` });
    }

    const contentType = req.get('content-type') || '(none)';
    const rawBody = req.rawBody || '';
    const rawBodyLength = Buffer.isBuffer(rawBody)
      ? rawBody.length
      : Buffer.byteLength(String(rawBody || ''));
    const headerNames = Array.isArray(req.rawHeaders)
      ? req.rawHeaders.filter((_, i) => i % 2 === 0)
      : [];
    const signatureHeader =
      headerNames.find((name) => String(name).toLowerCase() === 'x-signature') || 'none';
    if (debug) {
      console.log('[lemonsqueezy] webhook received', { contentType, rawBodyLength, signatureHeader });
    }

    const signature = req.get('x-signature') || req.get('X-Signature');
    let verifiedMode = null;
    let valid = false;

    const verifyWithSecret = (secret, modeLabel) => {
      if (!secret) return false;
      const ok = verifyLemonSqueezySignature({ rawBody, signature, secret });
      if (ok) {
        verifiedMode = modeLabel;
      }
      return ok;
    };

    if (expectedMode === 'test') {
      valid = verifyWithSecret(testSecret, 'test') || verifyWithSecret(legacySecret, 'legacy');
    } else if (expectedMode === 'live') {
      valid = verifyWithSecret(liveSecret, 'live') || verifyWithSecret(legacySecret, 'legacy');
    } else {
      // Unknown mode: try test, then live, then legacy.
      valid =
        verifyWithSecret(testSecret, 'test') ||
        verifyWithSecret(liveSecret, 'live') ||
        verifyWithSecret(legacySecret, 'legacy');
    }

    const chosenMode = verifiedMode || expectedMode;
    if (debug) {
      const eventName =
        req.body?.meta?.event_name ||
        req.body?.meta?.event ||
        req.body?.event_name ||
        req.body?.event ||
        req.body?.type ||
        'unknown';
      const requestId =
        req.get('x-vercel-id') || req.get('x-request-id') || req.get('x-amzn-trace-id') || 'none';
      console.log('[lemonsqueezy] webhook secret status', {
        hasLegacy,
        hasTest,
        hasLive,
        chosenMode,
        expectedMode,
        eventName,
        requestId,
      });
    }

    if (!valid) {
      if (debug) {
        console.warn('[lemonsqueezy] signature verification failed');
      }
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const normalized = normalizeLemonSqueezyEvent(req.body || {}, rawBody);
    if (!normalized.eventTypeKnown) {
      console.warn('[lemonsqueezy] unknown event type', {
        eventId: normalized.eventId,
        eventType: normalized.eventType,
        keys: Object.keys(req.body || {}),
      });
    }
    if (normalized.validUntilInferred && normalized.entitlement.status === 'cancelled') {
      console.warn('[lemonsqueezy] cancelled event missing end date; preserving existing validUntil', {
        eventId: normalized.eventId,
        eventType: normalized.eventType,
      });
    }
    const normalizedEmail = normalized.email ? normalized.email.trim().toLowerCase() : '';
    const purchaseEmail = normalized.purchaseEmail ? normalized.purchaseEmail.trim().toLowerCase() : '';
    const normalizedUserId = normalized.userId ? String(normalized.userId).trim() : '';
    const eventMode = chosenMode || 'unknown';
    const eventId = normalized.eventId ? `${eventMode}:${normalized.eventId}` : '';
    if (!normalized.eventId) {
      if (debug) {
        console.warn('[lemonsqueezy] missing event id');
      }
      return res.status(400).json({ error: 'Missing event id' });
    }
    if (!normalizedEmail && !normalizedUserId) {
      if (debug) {
        console.warn('[lemonsqueezy] missing email and user id');
      }
      return res.status(400).json({ error: 'Missing email' });
    }

    const { duplicate } = await eventStore.recordEvent({
      provider: 'lemonsqueezy',
      eventId,
      eventType: normalized.eventType,
      email: normalizedEmail || purchaseEmail || undefined,
      payload: req.body,
      processingStatus: normalized.eventTypeKnown ? 'received' : 'received_unknown_type',
    });

    if (duplicate) {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    let user = null;
    if (normalizedUserId) {
      user = await User.findById(normalizedUserId);
    }

    if (!normalizedUserId && normalizedEmail) {
      if (debug) {
        console.warn('[lemonsqueezy] missing userId in custom_data; deferring to pending entitlement', {
          eventId,
          eventType: normalized.eventType,
        });
      }
      await recordPendingEntitlement(PendingEntitlement, {
        provider: 'lemonsqueezy',
        eventId,
        eventType: normalized.eventType,
        userId: normalizedUserId || undefined,
        email: normalizedEmail,
        entitlement: normalized.entitlement,
        orderId: normalized.orderId,
        subscriptionId: normalized.subscriptionId,
        customerId: normalized.customerId,
        manageUrl: normalized.manageUrl,
        payload: req.body,
      });
      await BillingEvent.updateOne(
        { provider: 'lemonsqueezy', eventId },
        { $set: { processingStatus: 'pending_user', processedAt: new Date() } }
      );
      return res.status(200).json({ ok: true, userFound: false });
    }

    if (!user) {
      if (debug) {
        console.warn(`[lemonsqueezy] user not found for event ${eventId}`);
      }
      if (normalizedEmail) {
        await recordPendingEntitlement(PendingEntitlement, {
          provider: 'lemonsqueezy',
          eventId,
          eventType: normalized.eventType,
          userId: normalizedUserId || undefined,
          email: normalizedEmail,
          entitlement: normalized.entitlement,
          orderId: normalized.orderId,
          subscriptionId: normalized.subscriptionId,
          customerId: normalized.customerId,
          manageUrl: normalized.manageUrl,
          payload: req.body,
        });
        await BillingEvent.updateOne(
          { provider: 'lemonsqueezy', eventId },
          { $set: { processingStatus: 'pending_user', processedAt: new Date() } }
        );
      }
      return res.status(200).json({ ok: true, userFound: false });
    }

    user.entitlements = user.entitlements || {};
    const existingPro = user.entitlements.pro || {};
    const nextProStatus = normalized.entitlement.status;
    let nextProValidUntil = normalized.entitlement.validUntil;
    if (nextProStatus === 'cancelled' && !nextProValidUntil) {
      nextProValidUntil = existingPro.validUntil || null;
    }
    user.entitlements.pro = {
      status: nextProStatus,
      validUntil: nextProValidUntil,
    };
    if (!user.entitlements.projects) {
      user.entitlements.projects = { status: 'none', validUntil: null };
    }

    user.billing = user.billing || {};
    user.billing.providers = user.billing.providers || {};
    const lsMeta = user.billing.providers.lemonsqueezy || {};
    if (normalized.customerId) lsMeta.customerId = normalized.customerId;
    if (normalized.subscriptionId) lsMeta.subscriptionId = normalized.subscriptionId;
    if (normalized.startedAt && (!lsMeta.startedAt || normalized.startedAt < lsMeta.startedAt)) {
      lsMeta.startedAt = normalized.startedAt;
    }
    if (normalized.manageUrl) lsMeta.manageUrl = normalized.manageUrl;
    if (purchaseEmail) lsMeta.purchaserEmail = purchaseEmail;
    lsMeta.lastEventId = eventId;
    lsMeta.lastEventAt = new Date();
    user.billing.providers.lemonsqueezy = lsMeta;

    const isActive = isProEntitlementActive(user.entitlements.pro);
    user.accessTier = isActive ? 'premium' : 'free';

    await user.save();
    const processedStatus = normalized.eventTypeKnown ? 'processed' : 'processed_unknown_type';
    await BillingEvent.updateOne(
      { provider: 'lemonsqueezy', eventId },
      { $set: { processingStatus: processedStatus, processedAt: new Date(), userId: user._id } }
    );
    if (debug) {
      console.log(`[lemonsqueezy] updated user ${user._id} -> ${user.entitlements.pro.status}`);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[lemonsqueezy] webhook error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

function normalizeManageUrlCandidate(url) {
  if (!url) return '';
  const str = String(url).trim();
  if (!str) return '';
  if (!/^https?:\/\//i.test(str)) return '';
  return str;
}

function pickManageUrlFromApiPayload(payload) {
  const urls = payload?.data?.attributes?.urls || {};
  const candidates = [
    payload?.data?.attributes?.manage_url,
    payload?.data?.attributes?.portal_url,
    urls.customer_portal,
    urls.portal,
    urls.manage,
    urls.update,
    urls.update_payment_method,
    urls.payment_method,
    urls.cancel,
  ];
  for (const candidate of candidates) {
    const normalized = normalizeManageUrlCandidate(candidate);
    if (normalized) return normalized;
  }
  return '';
}

async function fetchLemonSqueezyManageUrl({ apiKey, subscriptionId, customerId }) {
  if (!apiKey) return { url: '', source: 'missing_api_key' };
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
  };

  const tryFetch = async (resource, id) => {
    if (!id) return '';
    const url = `https://api.lemonsqueezy.com/v1/${resource}/${id}`;
    const res = await fetch(url, { headers });
    if (!res.ok) return '';
    const payload = await res.json();
    return pickManageUrlFromApiPayload(payload);
  };

  const fromSubscription = await tryFetch('subscriptions', subscriptionId);
  if (fromSubscription) return { url: fromSubscription, source: 'subscription' };

  const fromCustomer = await tryFetch('customers', customerId);
  if (fromCustomer) return { url: fromCustomer, source: 'customer' };

  return { url: '', source: 'not_found' };
}

router.get('/manage-url', requireAuth, async (req, res) => {
  try {
    const provider = String(process.env.BILLING_PROVIDER || 'gumroad').toLowerCase();
    if (provider !== 'lemonsqueezy') {
      return res.status(400).json({ error: 'Provider not supported for manage URL' });
    }

    const user = await User.findById(req.auth.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const lsMeta = user?.billing?.providers?.lemonsqueezy || {};
    if (lsMeta.manageUrl) {
      return res.status(200).json({ url: lsMeta.manageUrl });
    }

    const apiKey = process.env.LEMONSQUEEZY_API_KEY || '';
    if (!apiKey) {
      return res.status(409).json({ error: 'Manage URL unavailable' });
    }

    const { url } = await fetchLemonSqueezyManageUrl({
      apiKey,
      subscriptionId: lsMeta.subscriptionId,
      customerId: lsMeta.customerId,
    });

    if (!url) {
      return res.status(409).json({ error: 'Manage URL unavailable' });
    }

    lsMeta.manageUrl = url;
    lsMeta.lastEventAt = lsMeta.lastEventAt || new Date();
    user.billing.providers.lemonsqueezy = lsMeta;
    await user.save();

    return res.status(200).json({ url });
  } catch (err) {
    console.error('[lemonsqueezy] manage-url error:', err);
    return res.status(500).json({ error: 'Failed to resolve manage URL' });
  }
});

function coerceBooleanFlag(value) {
  if (value === true || value === false) return value;
  if (value === null || value === undefined) return null;
  const raw = String(value).trim().toLowerCase();
  if (!raw) return null;
  if (['true', '1', 'yes'].includes(raw)) return true;
  if (['false', '0', 'no'].includes(raw)) return false;
  return null;
}

function resolveLemonSqueezyMode(body) {
  const flag =
    body?.meta?.test_mode ??
    body?.meta?.testMode ??
    body?.data?.attributes?.test_mode ??
    body?.data?.attributes?.testMode ??
    body?.data?.attributes?.is_test_mode;
  const parsed = coerceBooleanFlag(flag);
  if (parsed === true) return 'test';
  if (parsed === false) return 'live';
  return null;
}

router.post('/webhooks/:provider', gumroadParsers, async (req, res) => {
  const provider = resolveProvider(req.params.provider);
  if (!provider) {
    return res.status(404).json({ error: 'Provider not supported' });
  }
  if (provider === 'gumroad') {
    return handleGumroadWebhook(req, res);
  }
  if (provider === 'lemonsqueezy') {
    return handleLemonSqueezyWebhook(req, res);
  }
  return res.status(404).json({ error: `Provider not supported: ${provider}` });
});

module.exports = router;
