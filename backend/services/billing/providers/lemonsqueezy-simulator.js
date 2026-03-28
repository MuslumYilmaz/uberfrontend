const crypto = require('crypto');

const SUPPORTED_SCENARIOS = new Set([
  'activate',
  'renew',
  'cancel',
  'refund',
  'lifetime',
  'expire',
]);

function readTrimmed(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function readRequiredString(value, fieldName) {
  const out = readTrimmed(value);
  if (!out) {
    const error = new Error(`Missing "${fieldName}"`);
    error.statusCode = 400;
    throw error;
  }
  return out;
}

function readOptionalIsoDate(value, fieldName) {
  const raw = readTrimmed(value);
  if (!raw) return '';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    const error = new Error(`Invalid "${fieldName}" date`);
    error.statusCode = 400;
    throw error;
  }
  return parsed.toISOString();
}

function readBooleanFlag(value, fallback = true) {
  if (typeof value === 'boolean') return value;
  const raw = readTrimmed(value).toLowerCase();
  if (!raw) return fallback;
  if (['true', '1', 'yes'].includes(raw)) return true;
  if (['false', '0', 'no'].includes(raw)) return false;
  return fallback;
}

function readScenario(input) {
  const scenario = readTrimmed(input).toLowerCase() || 'activate';
  if (!SUPPORTED_SCENARIOS.has(scenario)) {
    const error = new Error(`Unsupported scenario "${scenario}"`);
    error.statusCode = 400;
    throw error;
  }
  return scenario;
}

function resolveScenarioDefaults(scenario) {
  switch (scenario) {
    case 'activate':
      return { eventType: 'subscription_created', status: 'active' };
    case 'renew':
      return { eventType: 'subscription_payment_success', status: 'active' };
    case 'cancel':
      return { eventType: 'subscription_cancelled', status: 'cancelled' };
    case 'refund':
      return { eventType: 'order_refunded', status: 'refunded' };
    case 'lifetime':
      return {
        eventType: 'subscription_created',
        status: 'active',
        productName: 'FrontendAtlas Premium - Lifetime',
        variantName: 'Lifetime',
      };
    case 'expire':
      return { eventType: 'subscription_updated', status: 'expired' };
    default:
      return { eventType: 'subscription_created', status: 'active' };
  }
}

function buildLemonSqueezySimulationPayload({ user, input = {} }) {
  const scenario = readScenario(input.scenario);
  const defaults = resolveScenarioDefaults(scenario);
  const validUntil = readOptionalIsoDate(input.validUntil, 'validUntil');
  const startedAt = readOptionalIsoDate(input.startedAt, 'startedAt');
  const manageUrl = readTrimmed(input.manageUrl);
  const purchaseEmail = readTrimmed(input.purchaseEmail).toLowerCase() || user.email;
  const customEmail = readTrimmed(input.customEmail).toLowerCase() || user.email;
  const testMode = readBooleanFlag(input.testMode, true);
  const eventType = readTrimmed(input.eventType).toLowerCase() || defaults.eventType;
  const status = readTrimmed(input.status).toLowerCase() || defaults.status;
  const externalId = readTrimmed(input.externalId) || `sim_${crypto.randomUUID()}`;
  const attemptId = readTrimmed(input.attemptId);
  const customerId = readTrimmed(input.customerId);
  const subscriptionId = readTrimmed(input.subscriptionId);
  const orderId = readTrimmed(input.orderId);
  const productName = readTrimmed(input.productName) || defaults.productName || '';
  const variantName = readTrimmed(input.variantName) || defaults.variantName || '';

  if ((scenario === 'activate' || scenario === 'renew') && !validUntil) {
    const error = new Error('"validUntil" is required for activate and renew scenarios');
    error.statusCode = 400;
    throw error;
  }

  const attributes = {
    user_email: purchaseEmail,
    status,
    custom_data: {
      fa_user_id: readRequiredString(user?._id, 'user._id'),
      fa_user_email: customEmail,
    },
  };

  if (attemptId) {
    attributes.custom_data.fa_checkout_attempt_id = attemptId;
  }

  if (startedAt) attributes.created_at = startedAt;
  if (manageUrl) attributes.manage_url = manageUrl;
  if (customerId) attributes.customer_id = customerId;
  if (subscriptionId) attributes.subscription_id = subscriptionId;
  if (orderId) attributes.order_id = orderId;
  if (productName) attributes.product_name = productName;
  if (variantName) attributes.variant_name = variantName;

  if (scenario === 'cancel' && validUntil) {
    attributes.ends_at = validUntil;
  } else if (validUntil) {
    attributes.renews_at = validUntil;
  }

  const payload = {
    meta: {
      event_name: eventType,
      test_mode: testMode,
    },
    data: {
      id: externalId,
      attributes,
      relationships: {},
    },
  };

  if (customerId) {
    payload.data.relationships.customer = { data: { id: customerId } };
  }
  if (subscriptionId) {
    payload.data.relationships.subscription = { data: { id: subscriptionId } };
  }

  return {
    scenario,
    mode: testMode ? 'test' : 'live',
    payload,
  };
}

module.exports = {
  SUPPORTED_SCENARIOS,
  buildLemonSqueezySimulationPayload,
};
