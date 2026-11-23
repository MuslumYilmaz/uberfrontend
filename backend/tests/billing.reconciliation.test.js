const {
  findProviderOrderMismatches,
  findVerifiedPurchaseEntitlementMismatches,
} = require('../services/billing/reconciliation');

function leanQuery(result) {
  const query = {};
  query.sort = jest.fn(() => query);
  query.limit = jest.fn(() => query);
  query.select = jest.fn(() => query);
  query.lean = jest.fn(async () => result);
  return query;
}

describe('billing reconciliation providers', () => {
  test('scans Lemon Squeezy and Polar attempts by default and only the asked provider otherwise', async () => {
    const CheckoutAttempt = { find: jest.fn(() => leanQuery([])) };
    const User = { find: jest.fn(() => leanQuery([])) };
    const BillingEvent = { find: jest.fn(() => leanQuery([])) };

    const both = await findVerifiedPurchaseEntitlementMismatches({ CheckoutAttempt, User, BillingEvent, mode: 'live' });
    expect(both.providers).toEqual(['lemonsqueezy', 'polar']);
    expect(CheckoutAttempt.find.mock.calls[0][0].provider).toEqual({ $in: ['lemonsqueezy', 'polar'] });

    const polarOnly = await findVerifiedPurchaseEntitlementMismatches({ CheckoutAttempt, User, BillingEvent, mode: 'test', providers: 'polar' });
    expect(polarOnly.providers).toEqual(['polar']);
    expect(CheckoutAttempt.find.mock.calls[1][0].provider).toEqual({ $in: ['polar'] });

    const unknown = await findVerifiedPurchaseEntitlementMismatches({ CheckoutAttempt, User, BillingEvent, mode: 'test', providers: ['stripe'] });
    expect(unknown.providers).toEqual(['lemonsqueezy', 'polar']);
  });

  test('matches Polar orders to Polar attempts by provider order id with tax-inclusive totals', async () => {
    const userId = '68a000000000000000000002';
    const attempt = {
      attemptId: 'chk_polar_order',
      userId,
      provider: 'polar',
      planId: 'monthly',
      mode: 'test',
      status: 'applied',
      providerOrderId: 'ord-1',
      paymentEventId: 'test:msg_1',
      paymentVerifiedAt: new Date('2026-11-23T08:07:08Z'),
      paymentCurrency: 'USD',
      paymentSubtotalCents: 1000,
      paymentDiscountCents: 0,
      paymentTaxCents: 200,
      paymentTotalCents: 1200,
    };
    const CheckoutAttempt = { find: jest.fn(() => leanQuery([attempt])) };
    const User = {
      find: jest.fn(() => leanQuery([{ _id: userId, accessTier: 'premium', entitlements: { pro: { status: 'active', validUntil: '2026-12-23T08:07:07Z' } } }])),
    };
    const orders = [
      { orderId: 'ord-1', identifiers: ['ord-1'], status: 'paid', refunded: false, totalCents: 1200, discountCents: 0, currency: 'USD', createdAt: new Date('2026-11-23T08:07:08Z') },
      { orderId: 'ord-2', identifiers: ['ord-2'], status: 'paid', refunded: false, totalCents: 2400, discountCents: 0, currency: 'USD', createdAt: new Date('2026-11-23T09:00:00Z') },
    ];
    const report = await findProviderOrderMismatches({ CheckoutAttempt, User, orders, mode: 'test', provider: 'polar' });
    expect(report.provider).toBe('polar');
    expect(CheckoutAttempt.find.mock.calls[0][0]).toEqual(expect.objectContaining({ provider: 'polar', mode: 'test' }));
    expect(report.summary).toEqual({ orders: 2, matched: 1, mismatches: 1 });
    expect(report.mismatches[0]).toEqual(expect.objectContaining({ orderId: 'ord-2', reasons: ['checkout_attempt_missing'] }));
  });
});

describe('billing campaign reconciliation', () => {
  test('reports refunded campaign purchases without counting them in recorded revenue totals', async () => {
    const userId = '68a000000000000000000001';
    const paymentVerifiedAt = new Date('2026-08-23T10:00:00.000Z');
    const attempt = {
      attemptId: 'chk_refunded_campaign',
      userId,
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'live',
      campaignId: 'partner_august',
      providerDiscountId: 'discount_123',
      status: 'applied',
      billingEventId: 'live:order_created:paid',
      paymentSubtotalCents: 1200,
      paymentDiscountCents: 200,
      paymentTaxCents: 0,
      paymentTotalCents: 1000,
      paymentVerifiedAt,
    };
    const CheckoutAttempt = { find: jest.fn(() => leanQuery([attempt])) };
    const User = {
      find: jest.fn(() => leanQuery([{
        _id: userId,
        accessTier: 'free',
        entitlements: { pro: { status: 'none', validUntil: null } },
      }])),
    };
    const BillingEvent = {
      find: jest.fn(() => leanQuery([
        {
          eventId: attempt.billingEventId,
          eventType: 'order_created',
          processingStatus: 'processed',
          userId,
          receivedAt: paymentVerifiedAt,
        },
        {
          eventId: 'live:order_refunded:paid',
          eventType: 'order_refunded',
          processingStatus: 'processed',
          userId,
          receivedAt: new Date('2026-08-23T10:05:00.000Z'),
        },
      ])),
    };

    const report = await findVerifiedPurchaseEntitlementMismatches({
      CheckoutAttempt,
      User,
      BillingEvent,
      now: new Date('2026-08-23T12:00:00.000Z'),
      mode: 'live',
      lookbackDays: 1,
      graceMinutes: 0,
    });

    expect(report.summary).toEqual({
      candidates: 1,
      healthy: 0,
      mismatches: 0,
      ignoredTerminalEvents: 1,
    });
    expect(report.campaigns).toEqual([
      expect.objectContaining({
        campaignId: 'partner_august',
        providerDiscountId: 'discount_123',
        purchases: 1,
        includedPurchases: 0,
        ignoredTerminalEvents: 1,
        discountAppliedPurchases: 0,
        subtotalCents: 0,
        discountCents: 0,
        taxCents: 0,
        totalCents: 0,
        recordedRevenueExcludingTaxCents: 0,
      }),
    ]);
  });
});
