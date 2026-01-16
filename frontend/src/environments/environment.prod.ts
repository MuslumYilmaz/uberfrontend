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
    PAYMENTS_PROVIDER: 'gumroad',
    GUMROAD_MONTHLY_URL: 'https://frontendatlas.gumroad.com/l/xsoew',
    GUMROAD_QUARTERLY_URL: 'https://frontendatlas.gumroad.com/l/rwsapy',
    GUMROAD_ANNUAL_URL: 'https://frontendatlas.gumroad.com/l/rwurwg',
    GUMROAD_MANAGE_URL: 'https://gumroad.com/subscriptions',
    LEMONSQUEEZY_MONTHLY_URL: '',
    LEMONSQUEEZY_QUARTERLY_URL: '',
    LEMONSQUEEZY_ANNUAL_URL: '',
    LEMONSQUEEZY_MANAGE_URL: '',
    STRIPE_MONTHLY_URL: '',
    STRIPE_QUARTERLY_URL: '',
    STRIPE_ANNUAL_URL: '',
    STRIPE_MANAGE_URL: '',
};
