import { SENTRY_DEBUG, SENTRY_DSN, SENTRY_RELEASE, SENTRY_TRACES_SAMPLE_RATE } from './sentry.env';

export const environment = {
    production: true,
    dataVersion: "2025-08-19a", // already there
    apiBase: "https://api.frontendatlas.com",
    frontendBase: "https://frontendatlas.com",
    cdnBaseUrl: '',
    cdnEnabled: false,
    sentryDsn: SENTRY_DSN,
    sentryRelease: SENTRY_RELEASE,
    sentryTracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    sentryDebug: SENTRY_DEBUG,
    PAYMENTS_PROVIDER: 'lemonsqueezy',
    GUMROAD_MONTHLY_URL: 'https://frontendatlas.gumroad.com/l/xsoew',
    GUMROAD_QUARTERLY_URL: 'https://frontendatlas.gumroad.com/l/rwsapy',
    GUMROAD_ANNUAL_URL: 'https://frontendatlas.gumroad.com/l/rwurwg',
    GUMROAD_MANAGE_URL: 'https://gumroad.com/subscriptions',
    LEMONSQUEEZY_MONTHLY_URL: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/634cd291-623f-4358-9ec3-9ef79e0a3bee',
    LEMONSQUEEZY_QUARTERLY_URL: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/00215452-82d4-40c3-ba10-4ccc879bf0d0',
    LEMONSQUEEZY_ANNUAL_URL: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/00215452-82d4-40c3-ba10-4ccc879bf0d0',
    LEMONSQUEEZY_MANAGE_URL: '',
    STRIPE_MONTHLY_URL: '',
    STRIPE_QUARTERLY_URL: '',
    STRIPE_ANNUAL_URL: '',
    STRIPE_MANAGE_URL: '',
};
