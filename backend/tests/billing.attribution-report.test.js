const {
  buildAttributionReport,
  formatAttributionReport,
  isoWeekKey,
} = require('../services/billing/attribution-report');
const {
  normalizeCountryCode,
  normalizeLandingPath,
  normalizeReferrerHost,
} = require('../services/billing/checkout-start');

describe('first-touch attribution normalizers', () => {
  test('keeps an absolute route path and strips query and fragment', () => {
    expect(normalizeLandingPath('/companies/waymo?utm_source=x#prompts')).toBe('/companies/waymo');
    expect(normalizeLandingPath('/')).toBe('/');
    expect(normalizeLandingPath('/javascript/coding/js-throttle')).toBe('/javascript/coding/js-throttle');
  });

  test('drops paths that are relative, malformed or oversized', () => {
    expect(normalizeLandingPath('companies/waymo')).toBeNull();
    expect(normalizeLandingPath('javascript:alert(1)')).toBeNull();
    expect(normalizeLandingPath('/with space')).toBeNull();
    expect(normalizeLandingPath(`/${'a'.repeat(200)}`)).toBeNull();
    expect(normalizeLandingPath(undefined)).toBeNull();
    expect(normalizeLandingPath(42)).toBeNull();
  });

  test('reduces a referrer to a lowercase host name', () => {
    expect(normalizeReferrerHost('https://www.Google.com/search?q=waymo')).toBe('www.google.com');
    expect(normalizeReferrerHost('t.co')).toBe('t.co');
    expect(normalizeReferrerHost('News.YCombinator.com.')).toBe('news.ycombinator.com');
    expect(normalizeReferrerHost('android-app://com.google.android.googlequicksearchbox/')).toBe(
      'com.google.android.googlequicksearchbox'
    );
  });

  test('drops referrers that are not host names or are oversized', () => {
    expect(normalizeReferrerHost('not a host name!')).toBeNull();
    expect(normalizeReferrerHost('-bad.example')).toBeNull();
    expect(normalizeReferrerHost(`${'x'.repeat(201)}.example`)).toBeNull();
    expect(normalizeReferrerHost('')).toBeNull();
    expect(normalizeReferrerHost(null)).toBeNull();
  });

  test('accepts only two-letter country codes and uppercases them', () => {
    expect(normalizeCountryCode('tr')).toBe('TR');
    expect(normalizeCountryCode(' us ')).toBe('US');
    expect(normalizeCountryCode('turkey')).toBeNull();
    expect(normalizeCountryCode('T1')).toBeNull();
    expect(normalizeCountryCode(undefined)).toBeNull();
  });
});

describe('isoWeekKey', () => {
  test('labels dates by ISO week and year', () => {
    expect(isoWeekKey('2026-10-15T10:00:00.000Z')).toBe('2026-W42');
    expect(isoWeekKey('2026-01-01T00:00:00.000Z')).toBe('2026-W01');
    expect(isoWeekKey('2025-12-29T00:00:00.000Z')).toBe('2026-W01');
    expect(isoWeekKey('not a date')).toBeNull();
  });
});

describe('buildAttributionReport', () => {
  const attempt = (overrides) => ({
    userId: 'u1',
    planId: 'quarterly',
    offerVersion: 'interview_sprint_v2',
    campaignId: null,
    analyticsSource: 'pricing_page',
    landingPath: '/companies/waymo',
    countryCode: 'TR',
    startedAt: '2026-10-12T09:00:00.000Z',
    paymentVerifiedAt: null,
    paymentTotalCents: null,
    paymentCurrency: null,
    ...overrides,
  });

  const attempts = [
    attempt({ paymentVerifiedAt: '2026-10-12T09:05:00.000Z', paymentTotalCents: 2900, paymentCurrency: 'USD' }),
    attempt({ userId: 'u2', landingPath: '/pricing', countryCode: 'US', planId: 'annual', paymentVerifiedAt: '2026-10-13T09:05:00.000Z', paymentTotalCents: 7900, paymentCurrency: 'USD' }),
    attempt({ userId: 'u3', landingPath: '/pricing', countryCode: 'US', startedAt: '2026-10-05T09:00:00.000Z', paymentVerifiedAt: '2026-10-05T09:05:00.000Z', paymentTotalCents: 2900, paymentCurrency: 'USD' }),
    attempt({ userId: 'u4', landingPath: null, countryCode: null, analyticsSource: null }),
    attempt({ userId: 'u5', campaignId: 'fall_sprint', startedAt: 'garbage' }),
  ];
  const terminalEvents = [
    { eventId: 'evt_refund', eventType: 'order_refunded', userId: 'u3', receivedAt: '2026-10-07T00:00:00.000Z' },
    { eventId: 'evt_before', eventType: 'order_refunded', userId: 'u2', receivedAt: '2026-10-01T00:00:00.000Z' },
    { eventId: 'evt_other', eventType: 'subscription_updated', userId: 'u1', receivedAt: '2026-10-14T00:00:00.000Z' },
  ];

  test('counts attempts, verified payments, gross revenue and refunds after payment', () => {
    const report = buildAttributionReport({ attempts, terminalEvents, now: '2026-10-15T12:00:00.000Z' });

    expect(report.generatedAt).toBe('2026-10-15T12:00:00.000Z');
    expect(report.totals).toEqual({
      key: 'all',
      attempts: 5,
      paid: 3,
      conversionRate: 60,
      grossCents: 13700,
      refunds: 1,
      refundedCents: 2900,
      currencies: ['USD'],
    });
  });

  test('groups by landing path, country and week with fallbacks for missing values', () => {
    const report = buildAttributionReport({ attempts, terminalEvents });

    expect(report.byLandingPath).toEqual([
      expect.objectContaining({ key: '/pricing', attempts: 2, paid: 2, conversionRate: 100, grossCents: 10800, refunds: 1 }),
      expect.objectContaining({ key: '/companies/waymo', attempts: 2, paid: 1, conversionRate: 50, grossCents: 2900 }),
      expect.objectContaining({ key: 'unknown', attempts: 1, paid: 0, conversionRate: 0 }),
    ]);
    expect(report.byCountry.map((row) => row.key)).toEqual(['US', 'TR', 'unknown']);
    expect(report.byWeek.map((row) => row.key)).toEqual(['2026-W41', '2026-W42', 'unknown']);
    expect(report.byCampaign.map((row) => row.key)).toEqual(['none', 'fall_sprint']);
    expect(report.byAnalyticsSource.find((row) => row.key === 'unknown')).toEqual(
      expect.objectContaining({ attempts: 1 })
    );
    expect(report.byPlan).toEqual([
      expect.objectContaining({ key: 'quarterly', attempts: 4, paid: 2 }),
      expect.objectContaining({ key: 'annual', attempts: 1, paid: 1 }),
    ]);
  });

  test('limits only the open-ended dimensions to the top N rows', () => {
    const many = Array.from({ length: 30 }, (_, index) => attempt({ userId: `u${index}`, landingPath: `/page-${index}` }));
    const report = buildAttributionReport({ attempts: many, top: 5 });

    expect(report.byLandingPath).toHaveLength(5);
    expect(report.byWeek).toHaveLength(1);
    expect(report.byPlan).toHaveLength(1);
  });

  test('formats a readable text report', () => {
    const report = buildAttributionReport({ attempts, terminalEvents, now: '2026-10-15T12:00:00.000Z' });
    report.window = { since: '2026-07-17T00:00:00.000Z', until: '2026-10-15T12:00:00.000Z', mode: 'live', target: 'test' };
    const text = formatAttributionReport(report);

    expect(text).toContain('totals: 5 attempts, 3 paid (60.0%), gross 137.00, 1 refunds (29.00)');
    expect(text).toContain('## By landing path');
    expect(text).toContain('/companies/waymo');
    expect(text).toContain('currency: USD');
    expect(text).toContain('mode live, target test');
  });

  test('warns when payments mix currencies', () => {
    const report = buildAttributionReport({
      attempts: [
        attempt({ paymentVerifiedAt: '2026-10-12T09:05:00.000Z', paymentTotalCents: 2900, paymentCurrency: 'USD' }),
        attempt({ userId: 'u2', paymentVerifiedAt: '2026-10-12T09:05:00.000Z', paymentTotalCents: 120000, paymentCurrency: 'TRY' }),
      ],
    });

    expect(report.totals.currencies).toEqual(['TRY', 'USD']);
    expect(formatAttributionReport(report)).toContain('warning: payments recorded in several currencies (TRY, USD)');
  });
});
