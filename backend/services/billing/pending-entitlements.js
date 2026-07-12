const { isDuplicateKeyError } = require('./billing-events');
const {
  applyNormalizedGumroadEventToUser,
  applyNormalizedLemonSqueezyEventToUser,
  syncAccessTierFromEntitlements,
} = require('./user-billing-state');
const { applyOrderedProviderEvent } = require('./ordered-user-event');

function normalizeEmail(raw) {
  if (!raw) return '';
  return String(raw).trim().toLowerCase();
}

async function recordPendingEntitlement(model, data) {
  const provider = String(data.provider || '').trim().toLowerCase();
  const email = normalizeEmail(data.email);
  const userId = data.userId ? String(data.userId).trim() : '';
  const hasSafeBinding = provider === 'lemonsqueezy' ? Boolean(userId || email) : Boolean(email);
  if (!hasSafeBinding) {
    const error = new TypeError(
      provider === 'lemonsqueezy'
        ? 'LemonSqueezy pending entitlement requires a user id or email binding'
        : 'Email-bound pending entitlement requires an email'
    );
    error.code = 'PENDING_ENTITLEMENT_BINDING_REQUIRED';
    throw error;
  }
  try {
    const payload = {
      provider,
      scope: data.scope || 'pro',
      eventId: data.eventId,
      eventType: data.eventType,
      email,
      userId: userId || undefined,
      entitlement: data.entitlement,
      saleId: data.saleId,
      orderId: data.orderId,
      subscriptionId: data.subscriptionId,
      customerId: data.customerId,
      manageUrl: data.manageUrl,
      payload: data.payload,
      eventReceivedAt: data.eventReceivedAt,
      eventOrderKey: data.eventOrderKey,
    };
    await model.create(payload);
    return { duplicate: false };
  } catch (err) {
    if (isDuplicateKeyError(err)) return { duplicate: true };
    throw err;
  }
}

function extractUserIdFromPayload(payload) {
  const custom =
    payload?.meta?.custom_data ||
    payload?.meta?.customData ||
    payload?.data?.attributes?.custom_data ||
    payload?.data?.attributes?.customData ||
    payload?.data?.attributes?.custom ||
    payload?.custom_data ||
    payload?.customData ||
    payload?.custom;
  if (!custom) return '';
  const raw = typeof custom === 'object' ? custom : null;
  const candidate =
    raw?.fa_user_id ||
    raw?.faUserId ||
    raw?.user_id ||
    raw?.userId;
  if (!candidate) return '';
  return String(candidate).trim();
}

function ensureEntitlements(user) {
  user.entitlements = user.entitlements || {};
  if (!user.entitlements.pro) {
    user.entitlements.pro = { status: 'none', validUntil: null };
  }
  if (!user.entitlements.projects) {
    user.entitlements.projects = { status: 'none', validUntil: null };
  }
}

function ensureBillingProviders(user) {
  user.billing = user.billing || {};
  user.billing.providers = user.billing.providers || {};
}

function resolvePendingBindingUserId(item) {
  return item?.userId || extractUserIdFromPayload(item?.payload);
}

function compareReceivedAtAsc(left, right) {
  const leftMs = new Date(left?.receivedAt || left?.createdAt || 0).getTime();
  const rightMs = new Date(right?.receivedAt || right?.createdAt || 0).getTime();
  if (leftMs !== rightMs) return leftMs - rightMs;
  return String(left?._id || '').localeCompare(String(right?._id || ''));
}

function isGrantingEntitlement(item) {
  return ['active', 'lifetime'].includes(String(item?.entitlement?.status || '').toLowerCase());
}

function resolvePendingOrderKey(item) {
  if (item?.eventOrderKey) return String(item.eventOrderKey);
  const receivedAt = new Date(item?.eventReceivedAt || item?.receivedAt || item?.createdAt || 0);
  if (Number.isNaN(receivedAt.getTime()) || !item?._id) return '';
  return `${receivedAt.toISOString()}:${String(item._id)}`;
}

function applyProjectsPendingEntitlement(user, item, eventOrderKey) {
  ensureEntitlements(user);
  ensureBillingProviders(user);

  user.entitlements.projects = {
    status: item.entitlement?.status || 'none',
    validUntil: item.entitlement?.validUntil || null,
  };

  if (item.provider === 'gumroad') {
    const gumroadMeta = user.billing.providers.gumroad || {};
    if (item.saleId) gumroadMeta.saleId = item.saleId;
    gumroadMeta.purchaserEmail = normalizeEmail(item.email);
    gumroadMeta.lastEventId = item.eventId;
    gumroadMeta.lastEventAt = item.receivedAt || new Date();
    if (item.eventReceivedAt) gumroadMeta.lastEventReceivedAt = item.eventReceivedAt;
    if (eventOrderKey) gumroadMeta.lastEventOrderKey = eventOrderKey;
    user.billing.providers.gumroad = gumroadMeta;
  }

  if (item.provider === 'lemonsqueezy') {
    const lsMeta = user.billing.providers.lemonsqueezy || {};
    if (item.customerId) lsMeta.customerId = item.customerId;
    if (item.subscriptionId) lsMeta.subscriptionId = item.subscriptionId;
    if (item.manageUrl) lsMeta.manageUrl = item.manageUrl;
    lsMeta.lastEventId = item.eventId;
    lsMeta.lastEventAt = item.receivedAt || new Date();
    if (item.eventReceivedAt) lsMeta.lastEventReceivedAt = item.eventReceivedAt;
    if (eventOrderKey) lsMeta.lastEventOrderKey = eventOrderKey;
    user.billing.providers.lemonsqueezy = lsMeta;
  }

  if (item.provider === 'stripe') {
    const stripeMeta = user.billing.providers.stripe || {};
    if (item.customerId) stripeMeta.customerId = item.customerId;
    if (item.subscriptionId) stripeMeta.subscriptionId = item.subscriptionId;
    stripeMeta.lastEventId = item.eventId;
    stripeMeta.lastEventAt = item.receivedAt || new Date();
    if (item.eventReceivedAt) stripeMeta.lastEventReceivedAt = item.eventReceivedAt;
    if (eventOrderKey) stripeMeta.lastEventOrderKey = eventOrderKey;
    user.billing.providers.stripe = stripeMeta;
  }

  syncAccessTierFromEntitlements(user);
}

function applyPendingEntitlementToUser(user, item, eventOrderKey) {
  if (item.scope === 'projects') {
    applyProjectsPendingEntitlement(user, item, eventOrderKey);
    return;
  }

  if (item.provider === 'gumroad') {
    applyNormalizedGumroadEventToUser(
      user,
      {
        eventId: item.eventId,
        eventType: item.eventType,
        entitlement: item.entitlement || {},
        saleId: item.saleId,
      },
      {
        eventId: item.eventId,
        purchaserEmail: normalizeEmail(item.email),
        eventReceivedAt: item.eventReceivedAt,
        eventOrderKey,
      }
    );
    return;
  }

  if (item.provider === 'lemonsqueezy') {
    applyNormalizedLemonSqueezyEventToUser(
      user,
      {
        eventId: item.eventId,
        eventType: item.eventType,
        entitlement: item.entitlement || {},
        customerId: item.customerId,
        subscriptionId: item.subscriptionId,
        manageUrl: item.manageUrl,
      },
      {
        eventId: item.eventId,
        purchaseEmail: normalizeEmail(item.email),
        eventReceivedAt: item.eventReceivedAt,
        eventOrderKey,
      }
    );
    return;
  }

  if (item.provider === 'stripe') {
    ensureEntitlements(user);
    ensureBillingProviders(user);
    user.entitlements.pro = {
      status: item.entitlement?.status || 'none',
      validUntil: item.entitlement?.validUntil || null,
    };
    const stripeMeta = user.billing.providers.stripe || {};
    if (item.customerId) stripeMeta.customerId = item.customerId;
    if (item.subscriptionId) stripeMeta.subscriptionId = item.subscriptionId;
    stripeMeta.lastEventId = item.eventId;
    stripeMeta.lastEventAt = item.receivedAt || new Date();
    if (item.eventReceivedAt) stripeMeta.lastEventReceivedAt = item.eventReceivedAt;
    if (eventOrderKey) stripeMeta.lastEventOrderKey = eventOrderKey;
    user.billing.providers.stripe = stripeMeta;
    syncAccessTierFromEntitlements(user);
    return;
  }

  applyProjectsPendingEntitlement(user, item, eventOrderKey);
}

async function applyPendingEntitlementsForUser(model, user) {
  const email = normalizeEmail(user?.email);
  const userId = String(user?._id || '').trim();
  if (!email && !userId) return { applied: false };

  const bindingQueries = [];
  if (email) {
    bindingQueries.push({ provider: { $ne: 'lemonsqueezy' }, email });
    // Legacy LemonSqueezy records are still discovered by email, then rejected unless their user id matches.
    bindingQueries.push({ provider: 'lemonsqueezy', email });
  }
  if (userId) bindingQueries.push({ provider: 'lemonsqueezy', userId });

  const pending = await model
    .find({ appliedAt: null, ignoredAt: null, $or: bindingQueries })
    .sort({ receivedAt: 1, _id: 1 });
  if (!pending.length) return { applied: false };

  const applicable = [];
  let sawLemonSqueezyMismatch = false;
  let sawLemonSqueezyWithoutBinding = false;
  let sawUnverifiedGumroadGrant = false;

  for (const item of pending) {
    if (item.provider === 'gumroad' && isGrantingEntitlement(item) && !user.emailVerifiedAt) {
      sawUnverifiedGumroadGrant = true;
      continue;
    }
    if (item.provider !== 'lemonsqueezy') {
      applicable.push(item);
      continue;
    }

    const pendingUserId = resolvePendingBindingUserId(item);
    if (!pendingUserId) {
      sawLemonSqueezyWithoutBinding = true;
      continue;
    }
    if (String(pendingUserId) !== String(user._id)) {
      sawLemonSqueezyMismatch = true;
      continue;
    }
    applicable.push(item);
  }

  if (!applicable.length) {
    if (sawLemonSqueezyMismatch) {
      return { applied: false, reason: 'lemonsqueezy_user_mismatch', eventId: pending[pending.length - 1]?.eventId };
    }
    if (sawLemonSqueezyWithoutBinding) {
      return { applied: false, reason: 'lemonsqueezy_user_binding_missing', eventId: pending[pending.length - 1]?.eventId };
    }
    if (sawUnverifiedGumroadGrant) {
      return { applied: false, reason: 'gumroad_email_verification_required', eventId: pending[pending.length - 1]?.eventId };
    }
    return { applied: false };
  }

  ensureEntitlements(user);
  ensureBillingProviders(user);

  const orderedApplicable = [...applicable].sort(compareReceivedAtAsc);
  let currentUser = user;
  for (const item of orderedApplicable) {
    const eventOrderKey = resolvePendingOrderKey(item);
    if (item.provider === 'gumroad' || item.provider === 'lemonsqueezy' || item.provider === 'stripe') {
      const orderedUpdate = await applyOrderedProviderEvent({
        user: currentUser,
        provider: item.provider,
        eventId: item.eventId,
        eventOrderKey,
        stateScope: item.scope === 'projects' ? 'projects' : 'pro',
        mutate: (targetUser) => applyPendingEntitlementToUser(targetUser, item, eventOrderKey),
      });
      currentUser = orderedUpdate.user;
    } else {
      const error = new Error(`Unsupported pending entitlement provider: ${item.provider}`);
      error.code = 'PENDING_ENTITLEMENT_PROVIDER_UNSUPPORTED';
      throw error;
    }
  }

  // Callers serialize the document they supplied, so mirror the CAS result without
  // issuing a second unconditional save.
  user.entitlements = currentUser.entitlements;
  user.billing = currentUser.billing;
  user.accessTier = currentUser.accessTier;

  const now = new Date();
  await model.updateMany(
    { _id: { $in: orderedApplicable.map((item) => item._id) } },
    { $set: { appliedAt: now, appliedUserId: currentUser._id } }
  );

  return {
    applied: true,
    appliedCount: orderedApplicable.length,
    eventId: orderedApplicable[orderedApplicable.length - 1]?.eventId,
  };
}

module.exports = {
  recordPendingEntitlement,
  applyPendingEntitlementsForUser,
  normalizeEmail,
};
