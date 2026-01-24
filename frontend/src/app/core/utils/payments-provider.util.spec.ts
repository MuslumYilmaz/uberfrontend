import {
  resolveCheckoutUrl,
  resolvePaymentsMode,
  resolvePaymentsProvider,
} from './payments-provider.util';

describe('payments-provider util', () => {
  it('defaults to test mode when not production', () => {
    const env = { production: false };
    expect(resolvePaymentsMode(env)).toBe('test');
  });

  it('defaults to live mode when production', () => {
    const env = { production: true };
    expect(resolvePaymentsMode(env)).toBe('live');
  });

  it('resolves lemonsqueezy test urls when PAYMENTS_MODE=test', () => {
    const env = {
      PAYMENTS_PROVIDER: 'lemonsqueezy',
      PAYMENTS_MODE: 'test',
      LEMONSQUEEZY_MONTHLY_URL_TEST: 'https://test.example.com/monthly',
      LEMONSQUEEZY_QUARTERLY_URL_TEST: 'https://test.example.com/quarterly',
      LEMONSQUEEZY_ANNUAL_URL_TEST: 'https://test.example.com/annual',
      LEMONSQUEEZY_LIFETIME_URL_TEST: 'https://test.example.com/lifetime',
    };
    const provider = resolvePaymentsProvider(env);
    expect(provider).toBe('lemonsqueezy');
    expect(resolveCheckoutUrl(provider, 'monthly', env)).toBe('https://test.example.com/monthly');
    expect(resolveCheckoutUrl(provider, 'quarterly', env)).toBe('https://test.example.com/quarterly');
    expect(resolveCheckoutUrl(provider, 'annual', env)).toBe('https://test.example.com/annual');
    expect(resolveCheckoutUrl(provider, 'lifetime', env)).toBe('https://test.example.com/lifetime');
  });

  it('falls back to legacy lemonsqueezy urls if mode-specific is missing', () => {
    const env = {
      PAYMENTS_PROVIDER: 'lemonsqueezy',
      PAYMENTS_MODE: 'test',
      LEMONSQUEEZY_MONTHLY_URL: 'https://legacy.example.com/monthly',
      LEMONSQUEEZY_LIFETIME_URL: 'https://legacy.example.com/lifetime',
    };
    const provider = resolvePaymentsProvider(env);
    expect(resolveCheckoutUrl(provider, 'monthly', env)).toBe('https://legacy.example.com/monthly');
    expect(resolveCheckoutUrl(provider, 'lifetime', env)).toBe('https://legacy.example.com/lifetime');
  });

  it('guards live annual if it matches quarterly', () => {
    const env = {
      PAYMENTS_PROVIDER: 'lemonsqueezy',
      PAYMENTS_MODE: 'live',
      LEMONSQUEEZY_QUARTERLY_URL_LIVE: 'https://live.example.com/quarterly',
      LEMONSQUEEZY_ANNUAL_URL_LIVE: 'https://live.example.com/quarterly',
    };
    const provider = resolvePaymentsProvider(env);
    expect(resolveCheckoutUrl(provider, 'annual', env)).toBeNull();
    expect(resolveCheckoutUrl(provider, 'quarterly', env)).toBe('https://live.example.com/quarterly');
  });
});
