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

describe('eligibility campaigns', () => {
  const { resolveEligibilityCampaign, normalizeEligibility } = require('../services/billing/discount-campaigns');
  const student = (overrides = {}) => campaign({
    campaignId: 'student_2026_autumn',
    providerDiscountId: 'discount_456',
    discountCode: 'STUDENT40',
    planIds: ['quarterly', 'annual'],
    analyticsSources: ['pricing_page'],
    eligibility: 'student',
    startsAt: '2026-10-15T00:00:00.000Z',
    endsAt: '2027-02-01T00:00:00.000Z',
    ...overrides,
  });

  test('accepts only known eligibilities and keeps entries without one unchanged', () => {
    expect(normalizeEligibility('Student')).toBe('student');
    expect(normalizeEligibility(undefined)).toBeNull();
    expect(normalizeEligibility('')).toBeNull();
    expect(normalizeEligibility('staff')).toBe(false);
    expect(parseCampaignAllowlist(JSON.stringify([student({ eligibility: 'staff' })]))).toEqual([]);
    expect(parseCampaignAllowlist(JSON.stringify([student()]))[0]).toEqual(
      expect.objectContaining({ campaignId: 'student_2026_autumn', eligibility: 'student' })
    );
    expect(parseCampaignAllowlist(JSON.stringify([campaign()]))[0].eligibility).toBeNull();
  });

  test('resolves the active student entry by provider, mode and plan without a campaign id', () => {
    const env = { BILLING_DISCOUNT_CAMPAIGNS_JSON: JSON.stringify([campaign(), student()]) };
    const input = {
      eligibility: 'student',
      provider: 'lemonsqueezy',
      mode: 'test',
      planId: 'quarterly',
      now: new Date('2026-11-01T12:00:00.000Z'),
      env,
    };

    expect(resolveEligibilityCampaign(input)).toEqual({
      campaignId: 'student_2026_autumn',
      providerDiscountId: 'discount_456',
      discountCode: 'STUDENT40',
      eligibility: 'student',
    });
    expect(resolveEligibilityCampaign({ ...input, planId: 'monthly' })).toBeNull();
    expect(resolveEligibilityCampaign({ ...input, mode: 'live' })).toBeNull();
    expect(resolveEligibilityCampaign({ ...input, provider: 'gumroad' })).toBeNull();
    expect(resolveEligibilityCampaign({ ...input, now: new Date('2027-02-01T00:00:00.000Z') })).toBeNull();
    expect(resolveEligibilityCampaign({ ...input, now: new Date('2026-10-14T00:00:00.000Z') })).toBeNull();
    expect(resolveEligibilityCampaign({ ...input, eligibility: 'staff' })).toBeNull();
    expect(resolveEligibilityCampaign({ ...input, env: { BILLING_DISCOUNT_CAMPAIGNS_JSON: '[]' } })).toBeNull();
  });

  test('never returns a plain campaign for an eligibility lookup, and explicit lookups still work', () => {
    const env = { BILLING_DISCOUNT_CAMPAIGNS_JSON: JSON.stringify([campaign({ planIds: ['quarterly'] })]) };
    expect(resolveEligibilityCampaign({
      eligibility: 'student', provider: 'lemonsqueezy', mode: 'test', planId: 'quarterly',
      now: new Date('2026-08-15T00:00:00.000Z'), env,
    })).toBeNull();
    expect(resolveDiscountCampaign({
      rawCampaignId: 'student_2026_autumn', provider: 'lemonsqueezy', mode: 'test', planId: 'annual',
      analyticsSource: 'pricing_page', now: new Date('2026-11-01T00:00:00.000Z'),
      env: { BILLING_DISCOUNT_CAMPAIGNS_JSON: JSON.stringify([student()]) },
    })).toEqual(expect.objectContaining({ campaignId: 'student_2026_autumn' }));
  });
});
