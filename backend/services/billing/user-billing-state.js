const { isProEntitlementActive } = require('./entitlements');

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

function toDateMs(value) {
  if (!value) return null;
  const asDate = value instanceof Date ? value : new Date(value);
  const ms = asDate.getTime();
  return Number.isNaN(ms) ? null : ms;
}

function pickLaterValidUntil(existingValue, incomingValue) {
  const existingMs = toDateMs(existingValue);
  const incomingMs = toDateMs(incomingValue);

  if (existingMs == null) return incomingValue || null;
  if (incomingMs == null) return existingValue || null;
  return incomingMs >= existingMs ? incomingValue : existingValue;
}

function syncAccessTierFromEntitlements(user) {
  const isActive = isProEntitlementActive(user.entitlements?.pro);
  user.accessTier = isActive ? 'premium' : 'free';
  return isActive;
}

function applyNormalizedGumroadEventToUser(user, normalized, options = {}) {
  ensureEntitlements(user);
  ensureBillingProviders(user);

  user.entitlements.pro = {
    status: normalized.entitlement.status,
    validUntil: normalized.entitlement.validUntil,
  };

  const gumroadMeta = user.billing.providers.gumroad || {};
  if (normalized.saleId) gumroadMeta.saleId = normalized.saleId;
  if (options.purchaserEmail) gumroadMeta.purchaserEmail = options.purchaserEmail;
  gumroadMeta.lastEventId = options.eventId || normalized.eventId || gumroadMeta.lastEventId;
  gumroadMeta.lastEventAt = new Date();
  user.billing.providers.gumroad = gumroadMeta;

  syncAccessTierFromEntitlements(user);
  return user;
}

function applyNormalizedLemonSqueezyEventToUser(user, normalized, options = {}) {
  ensureEntitlements(user);
  ensureBillingProviders(user);

  const existingPro = user.entitlements.pro || {};
  let nextProStatus = normalized.entitlement.status;
  let nextProValidUntil = normalized.entitlement.validUntil;
  const eventTypeLower = String(normalized.eventType || '').toLowerCase();
  const isRefundEvent = eventTypeLower.includes('refund') || eventTypeLower.includes('chargeback');

  if (existingPro.status === 'lifetime' && nextProStatus !== 'lifetime' && !isRefundEvent) {
    user.entitlements.pro = { status: 'lifetime', validUntil: null };
  } else {
    if (nextProStatus === 'active' || nextProStatus === 'cancelled') {
      const mergedValidUntil = pickLaterValidUntil(existingPro.validUntil, nextProValidUntil);
      const existingMs = toDateMs(existingPro.validUntil);
      const incomingMs = toDateMs(nextProValidUntil);

      if (
        nextProStatus === 'cancelled' &&
        existingPro.status === 'active' &&
        existingMs != null &&
        incomingMs != null &&
        incomingMs < existingMs
      ) {
        nextProStatus = 'active';
      }

      nextProValidUntil = mergedValidUntil;
    }

    if (nextProStatus === 'cancelled' && !nextProValidUntil) {
      user.entitlements.pro = { status: 'none', validUntil: null };
    } else {
      user.entitlements.pro = {
        status: nextProStatus,
        validUntil: nextProValidUntil,
      };
    }
  }

  const lsMeta = user.billing.providers.lemonsqueezy || {};
  if (normalized.customerId) lsMeta.customerId = normalized.customerId;
  if (normalized.subscriptionId) lsMeta.subscriptionId = normalized.subscriptionId;
  if (normalized.startedAt && (!lsMeta.startedAt || normalized.startedAt < lsMeta.startedAt)) {
    lsMeta.startedAt = normalized.startedAt;
  }
  if (normalized.manageUrl) lsMeta.manageUrl = normalized.manageUrl;
  if (options.purchaseEmail) lsMeta.purchaserEmail = options.purchaseEmail;
  lsMeta.lastEventId = options.eventId || normalized.eventId || lsMeta.lastEventId;
  lsMeta.lastEventAt = new Date();
  user.billing.providers.lemonsqueezy = lsMeta;

  syncAccessTierFromEntitlements(user);
  return user;
}

module.exports = {
  applyNormalizedGumroadEventToUser,
  applyNormalizedLemonSqueezyEventToUser,
  syncAccessTierFromEntitlements,
};
