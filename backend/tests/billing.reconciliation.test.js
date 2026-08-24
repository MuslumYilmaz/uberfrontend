const {
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
