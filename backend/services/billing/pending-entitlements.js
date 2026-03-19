const { isDuplicateKeyError } = require('./billing-events');
const {
  applyNormalizedGumroadEventToUser,
  applyNormalizedLemonSqueezyEventToUser,
  syncAccessTierFromEntitlements,
} = require('./user-billing-state');

function normalizeEmail(raw) {
  if (!raw) return '';
  return String(raw).trim().toLowerCase();
}

async function recordPendingEntitlement(model, data) {
  try {
    const payload = {
      provider: data.provider,
      scope: data.scope || 'pro',
      eventId: data.eventId,
      eventType: data.eventType,
      email: normalizeEmail(data.email),
      userId: data.userId ? String(data.userId).trim() : undefined,
      entitlement: data.entitlement,
      saleId: data.saleId,
      orderId: data.orderId,
      subscriptionId: data.subscriptionId,
      customerId: data.customerId,
      manageUrl: data.manageUrl,
      payload: data.payload,
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

function applyProjectsPendingEntitlement(user, item) {
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
    user.billing.providers.gumroad = gumroadMeta;
  }

  if (item.provider === 'lemonsqueezy') {
    const lsMeta = user.billing.providers.lemonsqueezy || {};
    if (item.customerId) lsMeta.customerId = item.customerId;
    if (item.subscriptionId) lsMeta.subscriptionId = item.subscriptionId;
    if (item.manageUrl) lsMeta.manageUrl = item.manageUrl;
    lsMeta.lastEventId = item.eventId;
    lsMeta.lastEventAt = item.receivedAt || new Date();
    user.billing.providers.lemonsqueezy = lsMeta;
  }

  syncAccessTierFromEntitlements(user);
}

function applyPendingEntitlementToUser(user, item) {
  if (item.scope === 'projects') {
    applyProjectsPendingEntitlement(user, item);
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
      }
    );
    return;
  }

  applyProjectsPendingEntitlement(user, item);
}

async function applyPendingEntitlementsForUser(model, user) {
  const email = normalizeEmail(user?.email);
  if (!email) return { applied: false };

  const pending = await model.find({ email, appliedAt: null }).sort({ receivedAt: 1, _id: 1 });
  if (!pending.length) return { applied: false };

  const applicable = [];
  let sawLemonSqueezyMismatch = false;
  let sawLemonSqueezyWithoutBinding = false;

  for (const item of pending) {
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
    return { applied: false };
  }

  ensureEntitlements(user);
  ensureBillingProviders(user);

  const orderedApplicable = [...applicable].sort(compareReceivedAtAsc);
  for (const item of orderedApplicable) {
    applyPendingEntitlementToUser(user, item);
  }

  await user.save();

  const now = new Date();
  await model.updateMany(
    { _id: { $in: orderedApplicable.map((item) => item._id) } },
    { $set: { appliedAt: now, appliedUserId: user._id } }
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
