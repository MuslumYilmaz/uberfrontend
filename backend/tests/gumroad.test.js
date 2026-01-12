const { normalizeGumroadEvent } = require('../services/billing/providers/gumroad');

describe('gumroad event normalization', () => {
  test('maps active subscription to active with next billing date', () => {
    const body = {
      resource_name: 'sale',
      email: 'User@Example.com',
      next_billing_date: '2099-01-01T00:00:00Z',
      sale_id: 'sale_123',
    };

    const out = normalizeGumroadEvent(body, 'raw');
    expect(out.entitlement.status).toBe('active');
    expect(out.email).toBe('user@example.com');
    expect(out.entitlement.validUntil instanceof Date).toBe(true);
  });

  test('maps cancelled subscription to cancelled with end date', () => {
    const body = {
      resource_name: 'subscription_cancelled',
      email: 'user@example.com',
      subscription_ended_at: '2099-02-01T00:00:00Z',
      subscription_id: 'sub_123',
    };

    const out = normalizeGumroadEvent(body, 'raw');
    expect(out.entitlement.status).toBe('cancelled');
    expect(out.entitlement.validUntil instanceof Date).toBe(true);
  });

  test('cancelled without end date expires immediately', () => {
    const body = {
      resource_name: 'subscription_cancelled',
      email: 'user@example.com',
      subscription_id: 'sub_456',
    };

    const out = normalizeGumroadEvent(body, 'raw');
    expect(out.entitlement.status).toBe('cancelled');
    expect(out.entitlement.validUntil instanceof Date).toBe(true);
  });

  test('maps refund to none', () => {
    const body = {
      resource_name: 'refund',
      email: 'user@example.com',
      sale_id: 'sale_456',
    };

    const out = normalizeGumroadEvent(body, 'raw');
    expect(out.entitlement.status).toBe('none');
    expect(out.entitlement.validUntil).toBeNull();
  });
});
