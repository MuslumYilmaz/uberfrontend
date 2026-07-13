const { isDeepStrictEqual } = require('util');

const MAX_CAS_ATTEMPTS = 5;

function toPlain(value) {
  if (value && typeof value.toObject === 'function') {
    return value.toObject({ depopulate: true });
  }
  return value || {};
}

function getProviderMetadata(user, provider) {
  return user?.billing?.providers?.[provider] || {};
}

function classifyProviderEvent(user, provider, eventId, eventOrderKey) {
  const metadata = getProviderMetadata(user, provider);
  if (metadata.lastEventId && String(metadata.lastEventId) === String(eventId)) {
    return 'already_applied';
  }
  if (
    metadata.lastEventOrderKey &&
    eventOrderKey &&
    String(eventOrderKey).localeCompare(String(metadata.lastEventOrderKey)) <= 0
  ) {
    return 'stale';
  }
  return 'apply';
}

function buildMarkerExpectation(markerPath, expectedOrderKey) {
  if (expectedOrderKey) return { [markerPath]: expectedOrderKey };
  return {
    $or: [
      { [markerPath]: { $exists: false } },
      { [markerPath]: null },
      { [markerPath]: '' },
    ],
  };
}

function buildObservedStateGuard(path, value) {
  if (value === 'none' || value === 'free') {
    return {
      $or: [
        { [path]: value },
        { [path]: { $exists: false } },
      ],
    };
  }
  // Mongo's null equality intentionally matches both null and absent legacy fields.
  return { [path]: value };
}

function addChangedProviderMetadata(update, provider, beforeMetadata, afterMetadata) {
  const before = toPlain(beforeMetadata);
  const after = toPlain(afterMetadata);
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    const path = `billing.providers.${provider}.${key}`;
    if (after[key] === undefined) {
      if (before[key] !== undefined) update.$unset[path] = '';
      continue;
    }
    if (!isDeepStrictEqual(before[key], after[key])) {
      update.$set[path] = after[key];
    }
  }
}

function captureEntitlementState(user) {
  return {
    'entitlements.pro.status': user.entitlements?.pro?.status || 'none',
    'entitlements.pro.validUntil': user.entitlements?.pro?.validUntil || null,
    'entitlements.projects.status': user.entitlements?.projects?.status || 'none',
    'entitlements.projects.validUntil': user.entitlements?.projects?.validUntil || null,
    accessTier: user.accessTier || 'free',
  };
}

function buildOrderedUpdate(user, provider, beforeMetadata, beforeState, stateScope) {
  const afterState = captureEntitlementState(user);
  const guardedPaths = stateScope === 'projects'
    ? ['entitlements.projects.status', 'entitlements.projects.validUntil', 'accessTier']
    : ['entitlements.pro.status', 'entitlements.pro.validUntil', 'accessTier'];
  const update = {
    $set: {},
    $unset: {},
  };
  const stateGuards = [];
  for (const path of guardedPaths) {
    update.$set[path] = afterState[path];
    stateGuards.push(buildObservedStateGuard(path, beforeState[path]));
  }
  addChangedProviderMetadata(
    update,
    provider,
    beforeMetadata,
    getProviderMetadata(user, provider)
  );
  if (!Object.keys(update.$unset).length) delete update.$unset;
  return { update, stateGuards };
}

async function applyOrderedProviderEvent({
  user,
  provider,
  eventId,
  eventOrderKey,
  mutate,
  stateScope = 'pro',
  maxAttempts = MAX_CAS_ATTEMPTS,
}) {
  if (!user?._id || !user?.constructor?.updateOne || !user?.constructor?.findById) {
    throw new TypeError('A persisted user document is required for ordered billing updates');
  }
  if (!eventOrderKey) {
    const error = new Error('Billing event order key is required');
    error.code = 'BILLING_EVENT_ORDER_KEY_MISSING';
    throw error;
  }

  const UserModel = user.constructor;
  const markerPath = `billing.providers.${provider}.lastEventOrderKey`;
  const eventIdPath = `billing.providers.${provider}.lastEventId`;
  let current = user;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const classification = classifyProviderEvent(current, provider, eventId, eventOrderKey);
    if (classification !== 'apply') {
      return { outcome: classification, user: current, attempts: attempt };
    }

    const beforeMetadata = toPlain(getProviderMetadata(current, provider));
    const beforeState = captureEntitlementState(current);
    const expectedOrderKey = beforeMetadata.lastEventOrderKey
      ? String(beforeMetadata.lastEventOrderKey)
      : '';
    mutate(current);
    const { update, stateGuards } = buildOrderedUpdate(
      current,
      provider,
      beforeMetadata,
      beforeState,
      stateScope
    );
    const filter = {
      _id: current._id,
      [eventIdPath]: { $ne: eventId },
      $and: [buildMarkerExpectation(markerPath, expectedOrderKey), ...stateGuards],
    };
    const result = await UserModel.updateOne(filter, update, { runValidators: true });
    if ((result.modifiedCount || result.nModified || 0) === 1) {
      return { outcome: 'applied', user: current, attempts: attempt };
    }

    current = await UserModel.findById(current._id);
    if (!current) {
      const error = new Error('User disappeared during billing event processing');
      error.code = 'BILLING_EVENT_USER_NOT_FOUND';
      throw error;
    }
  }

  const error = new Error('Billing event user update was contended too many times');
  error.code = 'BILLING_EVENT_CAS_EXHAUSTED';
  throw error;
}

module.exports = {
  MAX_CAS_ATTEMPTS,
  applyOrderedProviderEvent,
  classifyProviderEvent,
};
