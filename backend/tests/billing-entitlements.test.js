'use strict';

const { isProEntitlementActive } = require('../services/billing/entitlements');

describe('billing entitlement evaluation', () => {
  test('evaluates a dated entitlement against the supplied server time', () => {
    const entitlement = {
      status: 'cancelled',
      validUntil: new Date('2026-09-01T00:00:00.000Z'),
    };

    expect(isProEntitlementActive(
      entitlement,
      new Date('2026-08-31T23:59:59.999Z')
    )).toBe(true);
    expect(isProEntitlementActive(
      entitlement,
      new Date('2026-09-01T00:00:00.000Z')
    )).toBe(false);
  });

  test('preserves an undated lifetime entitlement', () => {
    expect(isProEntitlementActive(
      { status: 'lifetime', validUntil: null },
      new Date('2099-01-01T00:00:00.000Z')
    )).toBe(true);
  });

  test('fails closed when a paid entitlement has a malformed expiry', () => {
    expect(isProEntitlementActive(
      { status: 'active', validUntil: 'not-a-timestamp' },
      new Date('2026-08-24T00:00:00.000Z')
    )).toBe(false);
  });
});
