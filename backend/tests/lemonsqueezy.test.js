const crypto = require('crypto');
const {
  normalizeLemonSqueezyEvent,
  verifyLemonSqueezySignature,
} = require('../services/billing/providers/lemonsqueezy');
const {
  applyNormalizedLemonSqueezyEventToUser,
} = require('../services/billing/user-billing-state');

describe('lemonsqueezy event normalization', () => {
  test('maps subscription created to active with renew date', () => {
    const body = {
      meta: { event_name: 'subscription_created' },
      data: {
        id: 'sub_123',
        attributes: {
          user_email: 'User@Example.com',
          status: 'active',
          renews_at: '2099-01-01T00:00:00Z',
        },
        relationships: {
          customer: { data: { id: 'cust_1' } },
        },
      },
    };

    const out = normalizeLemonSqueezyEvent(body, 'raw');
    expect(out.entitlement.status).toBe('active');
    expect(out.shouldApplyEntitlement).toBe(true);
    expect(out.email).toBe('user@example.com');
    expect(out.customerId).toBe('cust_1');
    expect(out.entitlement.validUntil instanceof Date).toBe(true);
  });

  test('maps subscription cancelled to cancelled with end date', () => {
    const body = {
      meta: { event_name: 'subscription_cancelled' },
      data: {
        id: 'sub_456',
        attributes: {
          user_email: 'user@example.com',
          status: 'cancelled',
          ends_at: '2099-02-01T00:00:00Z',
        },
      },
    };

    const out = normalizeLemonSqueezyEvent(body, 'raw');
    expect(out.entitlement.status).toBe('cancelled');
    expect(out.entitlement.validUntil instanceof Date).toBe(true);
  });

  test('maps payment failed to cancelled until the known paid-through date', () => {
    const body = {
      meta: { event_name: 'subscription_payment_failed' },
      data: {
        id: 'sub_failed',
        attributes: {
          user_email: 'user@example.com',
          status: 'failed',
          renews_at: '2099-03-01T00:00:00Z',
        },
      },
    };

    const out = normalizeLemonSqueezyEvent(body, 'raw');
    expect(out.entitlement.status).toBe('cancelled');
    expect(out.entitlement.validUntil instanceof Date).toBe(true);
  });

  test('maps refund to none', () => {
    const body = {
      meta: { event_name: 'order_refunded' },
      data: {
        id: 'order_1',
        attributes: {
          user_email: 'user@example.com',
        },
      },
    };

    const out = normalizeLemonSqueezyEvent(body, 'raw');
    expect(out.entitlement.status).toBe('none');
    expect(out.entitlement.validUntil).toBeNull();
  });

  test('does not apply non-lifetime order created events', () => {
    const body = {
      meta: { event_name: 'order_created' },
      data: {
        id: 'order_monthly',
        attributes: {
          user_email: 'user@example.com',
          status: 'paid',
          product_name: 'FrontendAtlas Premium',
          variant_name: 'Monthly',
        },
      },
    };

    const out = normalizeLemonSqueezyEvent(body, JSON.stringify(body));
    expect(out.shouldApplyEntitlement).toBe(false);
    expect(out.entitlement.status).toBe('none');
    expect(out.entitlement.validUntil).toBeNull();
  });

  test('applies lifetime order created events as lifetime entitlements', () => {
    const body = {
      meta: { event_name: 'order_created' },
      data: {
        id: 'order_lifetime',
        attributes: {
          user_email: 'user@example.com',
          status: 'paid',
          product_name: 'FrontendAtlas Premium - Lifetime',
          variant_name: 'Lifetime',
        },
      },
    };

    const out = normalizeLemonSqueezyEvent(body, JSON.stringify(body));
    expect(out.shouldApplyEntitlement).toBe(true);
    expect(out.entitlement.status).toBe('lifetime');
    expect(out.entitlement.validUntil).toBeNull();
  });

  test('keeps explicit provider event ids from webhook metadata', () => {
    const body = {
      meta: { event_name: 'subscription_created', event_id: 'evt_provider_123' },
      data: {
        id: 'sub_explicit_event',
        attributes: {
          user_email: 'user@example.com',
          status: 'active',
          renews_at: '2099-01-01T00:00:00Z',
        },
      },
    };

    const out = normalizeLemonSqueezyEvent(body, JSON.stringify(body));
    expect(out.eventId).toBe('evt_provider_123');
  });

  test('distinguishes lifecycle event types that share the same subscription object id', () => {
    const base = {
      data: {
        id: 'sub_same_lifecycle',
        attributes: {
          user_email: 'user@example.com',
        },
      },
    };
    const created = {
      ...base,
      meta: { event_name: 'subscription_created' },
      data: {
        ...base.data,
        attributes: {
          ...base.data.attributes,
          status: 'active',
          renews_at: '2099-01-01T00:00:00Z',
        },
      },
    };
    const cancelled = {
      ...base,
      meta: { event_name: 'subscription_cancelled' },
      data: {
        ...base.data,
        attributes: {
          ...base.data.attributes,
          status: 'cancelled',
          ends_at: '2099-01-01T00:00:00Z',
        },
      },
    };

    const createdOut = normalizeLemonSqueezyEvent(created, JSON.stringify(created));
    const cancelledOut = normalizeLemonSqueezyEvent(cancelled, JSON.stringify(cancelled));

    expect(createdOut.eventId).toContain('subscription_created:sub_same_lifecycle:');
    expect(cancelledOut.eventId).toContain('subscription_cancelled:sub_same_lifecycle:');
    expect(createdOut.eventId).not.toBe(cancelledOut.eventId);
  });

  test('returns the same generated event id for an exact webhook retry payload', () => {
    const body = {
      meta: { event_name: 'subscription_created' },
      data: {
        id: 'sub_retry_exact',
        attributes: {
          user_email: 'user@example.com',
          status: 'active',
          renews_at: '2099-01-01T00:00:00Z',
        },
      },
    };
    const rawBody = JSON.stringify(body);

    const first = normalizeLemonSqueezyEvent(body, rawBody);
    const retry = normalizeLemonSqueezyEvent(body, rawBody);

    expect(first.eventId).toBe(retry.eventId);
  });

  test('distinguishes same event type and object id when payload content changes', () => {
    const first = {
      meta: { event_name: 'subscription_payment_success' },
      data: {
        id: 'sub_same_payment',
        attributes: {
          user_email: 'user@example.com',
          status: 'active',
          renews_at: '2099-01-01T00:00:00Z',
        },
      },
    };
    const second = {
      meta: { event_name: 'subscription_payment_success' },
      data: {
        id: 'sub_same_payment',
        attributes: {
          user_email: 'user@example.com',
          status: 'active',
          renews_at: '2099-02-01T00:00:00Z',
        },
      },
    };

    const firstOut = normalizeLemonSqueezyEvent(first, JSON.stringify(first));
    const secondOut = normalizeLemonSqueezyEvent(second, JSON.stringify(second));

    expect(firstOut.eventId).toContain('subscription_payment_success:sub_same_payment:');
    expect(secondOut.eventId).toContain('subscription_payment_success:sub_same_payment:');
    expect(firstOut.eventId).not.toBe(secondOut.eventId);
  });
});

describe('lemonsqueezy signature verification', () => {
  test('valid signature passes', () => {
    const secret = 'test_secret';
    const payload = Buffer.from(JSON.stringify({ hello: 'world' }));
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const ok = verifyLemonSqueezySignature({ rawBody: payload, signature, secret });
    expect(ok).toBe(true);
  });

  test('invalid signature fails', () => {
    const secret = 'test_secret';
    const payload = Buffer.from(JSON.stringify({ hello: 'world' }));
    const ok = verifyLemonSqueezySignature({ rawBody: payload, signature: 'bad', secret });
    expect(ok).toBe(false);
  });
});

describe('lemonsqueezy user billing state', () => {
  test('does not mutate user entitlements when the normalized event is not applicable', () => {
    const validUntil = new Date('2099-02-01T00:00:00.000Z');
    const user = {
      accessTier: 'premium',
      entitlements: {
        pro: { status: 'active', validUntil },
        projects: { status: 'none', validUntil: null },
      },
      billing: {
        providers: {
          lemonsqueezy: {
            customerId: 'cust_existing',
          },
        },
      },
    };

    applyNormalizedLemonSqueezyEventToUser(user, {
      eventId: 'order_created:order_ignored:hash',
      eventType: 'order_created',
      shouldApplyEntitlement: false,
      entitlement: { status: 'none', validUntil: null },
      customerId: 'cust_new',
    });

    expect(user.accessTier).toBe('premium');
    expect(user.entitlements.pro.status).toBe('active');
    expect(user.entitlements.pro.validUntil).toBe(validUntil);
    expect(user.billing.providers.lemonsqueezy.customerId).toBe('cust_existing');
  });
});
