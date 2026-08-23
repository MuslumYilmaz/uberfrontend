const {
  normalizeCampaignId,
  normalizeProviderDiscountId,
  parseCampaignAllowlist,
  resolveDiscountCampaign,
} = require('../services/billing/discount-campaigns');

function campaign(overrides = {}) {
  return {
    enabled: true,
    campaignId: 'partner_august',
    provider: 'lemonsqueezy',
    providerDiscountId: 'discount_123',
    discountCode: 'PARTNER15',
    modes: ['test'],
    planIds: ['monthly'],
    analyticsSources: ['partner_august'],
    startsAt: '2026-08-01T00:00:00.000Z',
    endsAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('server-owned billing discount campaigns', () => {
  test('normalizes safe identifiers and rejects coupon-like unsafe values', () => {
    expect(normalizeCampaignId(' Partner_August ')).toBe('partner_august');
    expect(normalizeCampaignId('partner@example.com')).toBeNull();
    expect(normalizeProviderDiscountId(' discount:123.v2 ')).toBe('discount:123.v2');
    expect(normalizeProviderDiscountId('discount id')).toBeNull();
  });

  test('keeps campaigns disabled for absent, malformed, disabled, duplicate, or incomplete config', () => {
    expect(parseCampaignAllowlist('')).toEqual([]);
    expect(parseCampaignAllowlist('{not-json')).toEqual([]);
    expect(parseCampaignAllowlist(JSON.stringify([campaign({ enabled: false })]))).toEqual([]);
    expect(parseCampaignAllowlist(JSON.stringify([campaign({ endsAt: null })]))).toEqual([]);
    expect(parseCampaignAllowlist(JSON.stringify([
      campaign(),
      campaign({ providerDiscountId: 'discount_456', discountCode: 'OTHER15' }),
    ]))).toEqual([]);
  });

  test('fails an entire configured campaign closed when any allowlist member is invalid', () => {
    expect(parseCampaignAllowlist(JSON.stringify([
      campaign({ modes: ['test', 'production'] }),
    ]))).toEqual([]);
    expect(parseCampaignAllowlist(JSON.stringify([
      campaign({ planIds: ['monthly', 'weekly'] }),
    ]))).toEqual([]);
    expect(parseCampaignAllowlist(JSON.stringify([
      campaign({ analyticsSources: ['partner_august', 'unsafe source'] }),
    ]))).toEqual([]);
  });

  test('resolves only an exact provider, mode, plan, source, and active time window match', () => {
    const env = {
      BILLING_DISCOUNT_CAMPAIGNS_JSON: JSON.stringify([campaign()]),
    };
    const input = {
      rawCampaignId: 'PARTNER_AUGUST',
      provider: 'lemonsqueezy',
      mode: 'test',
      planId: 'monthly',
      analyticsSource: 'partner_august',
      now: new Date('2026-08-23T12:00:00.000Z'),
      env,
    };

    expect(resolveDiscountCampaign(input)).toEqual({
      campaignId: 'partner_august',
      providerDiscountId: 'discount_123',
      discountCode: 'PARTNER15',
    });
    expect(resolveDiscountCampaign({ ...input, provider: 'gumroad' })).toBeNull();
    expect(resolveDiscountCampaign({ ...input, mode: 'live' })).toBeNull();
    expect(resolveDiscountCampaign({ ...input, planId: 'annual' })).toBeNull();
    expect(resolveDiscountCampaign({ ...input, analyticsSource: 'pricing' })).toBeNull();
    expect(resolveDiscountCampaign({ ...input, now: new Date('2026-09-01T00:00:00.000Z') }))
      .toBeNull();
  });
});
