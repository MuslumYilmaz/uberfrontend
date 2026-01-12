const express = require('express');
const User = require('../models/User');
const BillingEvent = require('../models/BillingEvent');
const PendingEntitlement = require('../models/PendingEntitlement');
const { createBillingEventStore } = require('../services/billing/billing-events');
const { isProEntitlementActive } = require('../services/billing/entitlements');
const { normalizeGumroadEvent, verifyGumroadSignature } = require('../services/billing/providers/gumroad');
const { recordPendingEntitlement } = require('../services/billing/pending-entitlements');

const router = express.Router();
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

router.post('/webhooks/:provider', gumroadParsers, async (req, res) => {
  const provider = resolveProvider(req.params.provider);
  if (!provider) {
    return res.status(404).json({ error: 'Provider not supported' });
  }
  if (provider === 'gumroad') {
    return handleGumroadWebhook(req, res);
  }
  return res.status(404).json({ error: `Provider not supported: ${provider}` });
});

module.exports = router;
