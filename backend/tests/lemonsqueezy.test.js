const crypto = require('crypto');
const {
  normalizeLemonSqueezyEvent,
  verifyLemonSqueezySignature,
} = require('../services/billing/providers/lemonsqueezy');

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
