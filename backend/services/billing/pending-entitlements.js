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

async function applyPendingEntitlementsForUser(model, user) {
  const email = normalizeEmail(user?.email);
  if (!email) return { applied: false };

  const pending = await model.find({ email, appliedAt: null }).sort({ receivedAt: 1 });
  if (!pending.length) return { applied: false };

  const latest = pending[pending.length - 1];

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
