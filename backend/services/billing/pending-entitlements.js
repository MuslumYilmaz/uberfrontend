const { isDuplicateKeyError } = require('./billing-events');
const { isProEntitlementActive } = require('./entitlements');

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

async function applyPendingEntitlementsForUser(model, user) {
  const email = normalizeEmail(user?.email);
  if (!email) return { applied: false };

  const pending = await model.find({ email, appliedAt: null }).sort({ receivedAt: 1 });
  if (!pending.length) return { applied: false };

  const latest = pending[pending.length - 1];
  if (latest.provider === 'lemonsqueezy') {
    const pendingUserId = latest.userId || extractUserIdFromPayload(latest.payload);
    if (!pendingUserId || String(pendingUserId) !== String(user._id)) {
      return { applied: false, reason: 'lemonsqueezy_user_mismatch', eventId: latest.eventId };
    }
  }

  user.entitlements = user.entitlements || {};
  if (latest.scope === 'projects') {
    user.entitlements.projects = {
      status: latest.entitlement?.status || 'none',
      validUntil: latest.entitlement?.validUntil || null,
    };
  } else {
    user.entitlements.pro = {
      status: latest.entitlement?.status || 'none',
      validUntil: latest.entitlement?.validUntil || null,
    };
  }
  if (!user.entitlements.projects) {
    user.entitlements.projects = { status: 'none', validUntil: null };
  }

  user.billing = user.billing || {};
  user.billing.providers = user.billing.providers || {};
  if (latest.provider === 'gumroad') {
    const gumroadMeta = user.billing.providers.gumroad || {};
    if (latest.saleId) gumroadMeta.saleId = latest.saleId;
    gumroadMeta.purchaserEmail = email;
    gumroadMeta.lastEventId = latest.eventId;
    gumroadMeta.lastEventAt = latest.receivedAt || new Date();
    user.billing.providers.gumroad = gumroadMeta;
  }
  if (latest.provider === 'lemonsqueezy') {
    const lsMeta = user.billing.providers.lemonsqueezy || {};
    if (latest.customerId) lsMeta.customerId = latest.customerId;
    if (latest.subscriptionId) lsMeta.subscriptionId = latest.subscriptionId;
    if (latest.manageUrl) lsMeta.manageUrl = latest.manageUrl;
    lsMeta.lastEventId = latest.eventId;
    lsMeta.lastEventAt = latest.receivedAt || new Date();
    user.billing.providers.lemonsqueezy = lsMeta;
  }

  if (latest.scope === 'pro') {
    const isActive = isProEntitlementActive(user.entitlements.pro);
    user.accessTier = isActive ? 'premium' : 'free';
  }

  await user.save();

  const now = new Date();
  await model.updateMany(
    { _id: { $in: pending.map((p) => p._id) } },
    { $set: { appliedAt: now, appliedUserId: user._id } }
  );

  return { applied: true, appliedCount: pending.length, eventId: latest.eventId };
}

module.exports = {
  recordPendingEntitlement,
  applyPendingEntitlementsForUser,
  normalizeEmail,
};
