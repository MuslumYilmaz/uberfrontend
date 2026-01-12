import { isProActive } from './entitlements.util';
import type { Entitlements } from '../models/user.model';

describe('entitlements.util', () => {
  it('returns false for guests', () => {
    expect(isProActive(null)).toBe(false);
  });

  it('uses entitlement status and validUntil', () => {
    const now = Date.now();
    const baseEntitlements: Entitlements = {
      pro: { status: 'none', validUntil: null },
      projects: { status: 'none', validUntil: null },
    };

    expect(
      isProActive({
        entitlements: { ...baseEntitlements, pro: { status: 'active', validUntil: null } },
      })
    ).toBe(true);

    expect(
      isProActive({
        entitlements: {
          ...baseEntitlements,
          pro: { status: 'active', validUntil: new Date(now + 60_000).toISOString() },
        },
      })
    ).toBe(true);

    expect(
      isProActive({
        entitlements: {
          ...baseEntitlements,
          pro: { status: 'active', validUntil: new Date(now - 60_000).toISOString() },
        },
      })
    ).toBe(false);

    expect(
      isProActive({
        entitlements: {
          ...baseEntitlements,
          pro: { status: 'cancelled', validUntil: new Date(now + 60_000).toISOString() },
        },
      })
    ).toBe(true);
  });

  it('prefers entitlements over accessTier', () => {
    expect(
      isProActive({
        accessTier: 'premium',
        entitlements: {
          pro: { status: 'none', validUntil: null },
          projects: { status: 'none', validUntil: null },
        },
      })
    ).toBe(false);
  });

  it('falls back to accessTier when entitlements are missing', () => {
    expect(isProActive({ accessTier: 'premium' })).toBe(true);
    expect(isProActive({ accessTier: 'free' })).toBe(false);
  });
});
