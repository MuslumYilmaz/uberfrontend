const { isProEntitlementActive } = require('./entitlements');

const DEFAULT_LOOKBACK_DAYS = 7;
const DEFAULT_GRACE_MINUTES = 15;
const TERMINAL_EVENT_PATTERN = /(refund|chargeback)/i;

function clampInteger(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function nonnegativeCents(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

async function findVerifiedPurchaseEntitlementMismatches({
  CheckoutAttempt,
  User,
  BillingEvent,
  now = new Date(),
  mode = 'live',
  lookbackDays = DEFAULT_LOOKBACK_DAYS,
  graceMinutes = DEFAULT_GRACE_MINUTES,
  limit = 200,
}) {
  const normalizedMode = mode === 'test' ? 'test' : 'live';
  const safeLookbackDays = clampInteger(lookbackDays, DEFAULT_LOOKBACK_DAYS, 1, 90);
  const safeGraceMinutes = clampInteger(graceMinutes, DEFAULT_GRACE_MINUTES, 0, 1440);
  const safeLimit = clampInteger(limit, 200, 1, 1000);
  const nowMs = new Date(now).getTime();
  if (!Number.isFinite(nowMs)) throw new Error('Reconciliation "now" value is invalid');
  const verifiedAfter = new Date(nowMs - safeLookbackDays * 24 * 60 * 60 * 1000);
  const verifiedBefore = new Date(nowMs - safeGraceMinutes * 60 * 1000);

  const attempts = await CheckoutAttempt.find({
    provider: 'lemonsqueezy',
    mode: normalizedMode,
    paymentVerifiedAt: { $gte: verifiedAfter, $lte: verifiedBefore },
    paymentTotalCents: { $gt: 0 },
  })
    .sort({ paymentVerifiedAt: -1 })
    .limit(safeLimit)
    .lean();

  const userIds = Array.from(new Set(attempts.map((attempt) => String(attempt.userId || '')).filter(Boolean)));
  const eventIds = Array.from(new Set(attempts.map((attempt) => attempt.billingEventId).filter(Boolean)));
  const eventFilters = [];
  if (eventIds.length) eventFilters.push({ eventId: { $in: eventIds } });
  if (userIds.length) {
    eventFilters.push({
      userId: { $in: userIds },
      eventType: { $regex: TERMINAL_EVENT_PATTERN },
      receivedAt: { $gte: verifiedAfter },
    });
  }
  const [users, events] = await Promise.all([
    userIds.length
      ? User.find({ _id: { $in: userIds } })
        .select('_id accessTier entitlements.pro')
        .lean()
      : [],
    eventFilters.length
      ? BillingEvent.find({ provider: 'lemonsqueezy', $or: eventFilters })
        .select('eventId eventType processingStatus userId receivedAt')
        .lean()
      : [],
  ]);
  const usersById = new Map(users.map((user) => [String(user._id), user]));
  const eventsById = new Map(events.map((event) => [event.eventId, event]));
  const terminalEventsByUserId = new Map();
  for (const event of events) {
    if (!TERMINAL_EVENT_PATTERN.test(String(event.eventType || '')) || !event.userId) continue;
    const userId = String(event.userId);
    const existing = terminalEventsByUserId.get(userId);
    if (!existing || new Date(event.receivedAt).getTime() > new Date(existing.receivedAt).getTime()) {
      terminalEventsByUserId.set(userId, event);
    }
  }

  let ignoredTerminalEvents = 0;
  const mismatches = [];
  const campaignsByKey = new Map();
  for (const attempt of attempts) {
    const campaignId = String(attempt.campaignId || '').trim() || null;
    const providerDiscountId = String(attempt.providerDiscountId || '').trim() || null;
    let campaignSummary = null;
    if (campaignId || providerDiscountId) {
      const campaignKey = `${campaignId || 'missing'}:${providerDiscountId || 'missing'}`;
      campaignSummary = campaignsByKey.get(campaignKey) || {
        campaignId,
        providerDiscountId,
        purchases: 0,
        includedPurchases: 0,
        healthy: 0,
        mismatches: 0,
        ignoredTerminalEvents: 0,
        discountAppliedPurchases: 0,
        discountMissingPurchases: 0,
        subtotalCents: 0,
        discountCents: 0,
        taxCents: 0,
        totalCents: 0,
        recordedRevenueExcludingTaxCents: 0,
      };
      campaignSummary.purchases += 1;
      campaignsByKey.set(campaignKey, campaignSummary);
    }

    const billingEvent = eventsById.get(attempt.billingEventId);
    const terminalEvent = terminalEventsByUserId.get(String(attempt.userId || ''));
    const terminalAfterPayment = terminalEvent
      && new Date(terminalEvent.receivedAt).getTime() >= new Date(attempt.paymentVerifiedAt).getTime();
    if (TERMINAL_EVENT_PATTERN.test(String(billingEvent?.eventType || '')) || terminalAfterPayment) {
      ignoredTerminalEvents += 1;
      if (campaignSummary) campaignSummary.ignoredTerminalEvents += 1;
      continue;
    }

    if (campaignSummary) {
      const subtotalCents = nonnegativeCents(attempt.paymentSubtotalCents);
      const discountCents = nonnegativeCents(attempt.paymentDiscountCents);
      const taxCents = nonnegativeCents(attempt.paymentTaxCents);
      const totalCents = nonnegativeCents(attempt.paymentTotalCents);
      campaignSummary.includedPurchases += 1;
      campaignSummary.subtotalCents += subtotalCents;
      campaignSummary.discountCents += discountCents;
      campaignSummary.taxCents += taxCents;
      campaignSummary.totalCents += totalCents;
      // This intentionally is not called net revenue: provider/recovery/affiliate
      // fees are not present in CheckoutAttempt and must be joined separately.
      campaignSummary.recordedRevenueExcludingTaxCents += Math.max(0, totalCents - taxCents);
      if (discountCents > 0) campaignSummary.discountAppliedPurchases += 1;
      else campaignSummary.discountMissingPurchases += 1;
    }

    const user = usersById.get(String(attempt.userId || ''));
    const reasons = [];
    if (!!campaignId !== !!providerDiscountId) reasons.push('campaign_attribution_incomplete');
    if (campaignId && providerDiscountId && nonnegativeCents(attempt.paymentDiscountCents) === 0) {
      reasons.push('campaign_discount_not_applied');
    }
    if (!user) reasons.push('user_missing');
    if (attempt.status !== 'applied') reasons.push('attempt_not_applied');
    if (!attempt.billingEventId || !billingEvent) reasons.push('billing_event_missing');
    if (billingEvent && !String(billingEvent.processingStatus || '').startsWith('processed')) {
      reasons.push('billing_event_not_processed');
    }
    if (user && !isProEntitlementActive(user.entitlements?.pro)) {
      reasons.push('entitlement_inactive');
    }
    if (user && user.accessTier !== 'premium') reasons.push('access_tier_not_premium');

    if (reasons.length) {
      if (campaignSummary) campaignSummary.mismatches += 1;
      mismatches.push({
        attemptId: attempt.attemptId,
        supportReference: attempt.attemptId,
        userId: attempt.userId ? String(attempt.userId) : null,
        planId: attempt.planId,
        campaignId,
        providerDiscountId,
        paymentDiscountCents: nonnegativeCents(attempt.paymentDiscountCents),
        mode: attempt.mode,
        status: attempt.status,
        billingEventId: attempt.billingEventId || null,
        paymentVerifiedAt: attempt.paymentVerifiedAt,
        reasons,
      });
    } else if (campaignSummary) {
      campaignSummary.healthy += 1;
    }
  }

  return {
    mode: normalizedMode,
    window: {
      verifiedAfter,
      verifiedBefore,
      lookbackDays: safeLookbackDays,
      graceMinutes: safeGraceMinutes,
    },
    summary: {
      candidates: attempts.length,
      healthy: attempts.length - mismatches.length - ignoredTerminalEvents,
      mismatches: mismatches.length,
      ignoredTerminalEvents,
    },
    campaigns: Array.from(campaignsByKey.values())
      .sort((left, right) => String(left.campaignId).localeCompare(String(right.campaignId))),
    mismatches,
  };
}

async function findProviderOrderMismatches({
  CheckoutAttempt,
  User,
  orders,
  mode = 'live',
}) {
  const normalizedMode = mode === 'test' ? 'test' : 'live';
  const safeOrders = Array.isArray(orders) ? orders : [];
  const orderIdentifiers = Array.from(new Set(
    safeOrders.flatMap((order) => Array.isArray(order.identifiers) ? order.identifiers : [])
      .map((value) => String(value || '').trim())
      .filter(Boolean)
  ));
  const attempts = orderIdentifiers.length
    ? await CheckoutAttempt.find({
      provider: 'lemonsqueezy',
      mode: normalizedMode,
      providerOrderId: { $in: orderIdentifiers },
    }).lean()
    : [];
  const attemptsByProviderOrderId = new Map();
  for (const attempt of attempts) {
    const providerOrderId = String(attempt.providerOrderId || '').trim();
    if (providerOrderId) attemptsByProviderOrderId.set(providerOrderId, attempt);
  }
  const userIds = Array.from(new Set(attempts.map((attempt) => String(attempt.userId || '')).filter(Boolean)));
  const users = userIds.length
    ? await User.find({ _id: { $in: userIds } })
      .select('_id accessTier entitlements.pro')
      .lean()
    : [];
  const usersById = new Map(users.map((user) => [String(user._id), user]));

  const mismatches = [];
  for (const order of safeOrders) {
    const identifiers = Array.isArray(order.identifiers) ? order.identifiers : [];
    const attempt = identifiers
      .map((identifier) => attemptsByProviderOrderId.get(String(identifier)))
      .find(Boolean);
    const reasons = [];
    if (!attempt) {
      reasons.push('checkout_attempt_missing');
    } else {
      const purchaseVerified = !!attempt.paymentVerifiedAt
        && !!attempt.paymentEventId
        && Number(attempt.paymentTotalCents) > 0;
      if (!purchaseVerified) reasons.push('purchase_unverified');
      if (
        purchaseVerified
        && Number.isInteger(order.totalCents)
        && Number(attempt.paymentTotalCents) !== order.totalCents
      ) {
        reasons.push('purchase_amount_mismatch');
      }
      if (
        purchaseVerified
        && Number.isInteger(order.discountCents)
        && Number(attempt.paymentDiscountCents) !== order.discountCents
      ) {
        reasons.push('purchase_discount_mismatch');
      }
      if (
        purchaseVerified
        && order.currency
        && String(attempt.paymentCurrency || '').trim().toUpperCase() !== order.currency
      ) {
        reasons.push('purchase_currency_mismatch');
      }

      if (!order.refunded) {
        const user = usersById.get(String(attempt.userId || ''));
        if (!user) reasons.push('entitlement_user_missing');
        if (attempt.status !== 'applied') reasons.push('entitlement_not_applied');
        if (user && !isProEntitlementActive(user.entitlements?.pro)) {
          reasons.push('entitlement_inactive');
        }
        if (user && user.accessTier !== 'premium') {
          reasons.push('entitlement_access_tier_mismatch');
        }
      }
    }

    if (reasons.length) {
      mismatches.push({
        orderId: order.orderId || identifiers[0] || null,
        attemptId: attempt?.attemptId || null,
        campaignId: attempt?.campaignId || null,
        providerDiscountId: attempt?.providerDiscountId || null,
        supportReference: attempt?.attemptId || order.orderId || identifiers[0] || null,
        status: order.status || null,
        createdAt: order.createdAt || null,
        reasons,
      });
    }
  }

  return {
    mode: normalizedMode,
    summary: {
      orders: safeOrders.length,
      matched: safeOrders.length - mismatches.filter((item) => item.reasons.includes('checkout_attempt_missing')).length,
      mismatches: mismatches.length,
    },
    mismatches,
  };
}

module.exports = {
  findVerifiedPurchaseEntitlementMismatches,
  findProviderOrderMismatches,
};
