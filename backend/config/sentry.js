const Sentry = require('@sentry/node');

let initialized = false;

function parseBooleanFlag(value) {
    if (value === undefined || value === null || value === '') return undefined;
    const normalized = String(value).trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
    return undefined;
}

function parseTracesSampleRate(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return Math.min(parsed, 1);
}

function redactRequestHeaders(event) {
    const headers = event?.request?.headers;
    if (!headers || typeof headers !== 'object') return event;

    for (const key of Object.keys(headers)) {
        const normalized = key.toLowerCase();
        if (['authorization', 'cookie', 'set-cookie'].includes(normalized)) {
            delete headers[key];
        }
    }

    return event;
}

function initSentry(env = process.env) {
    const explicitEnabled = parseBooleanFlag(env.SENTRY_ENABLED);
    const dsn = String(env.SENTRY_DSN || '').trim();
    const enabled = explicitEnabled === undefined ? Boolean(dsn) : explicitEnabled;

    if (!enabled || !dsn) {
        initialized = false;
        return false;
    }

    const integrations = [];
    if (typeof Sentry.expressIntegration === 'function') {
        integrations.push(Sentry.expressIntegration());
    }
    if (typeof Sentry.mongooseIntegration === 'function') {
        integrations.push(Sentry.mongooseIntegration());
    }

    const release = env.SENTRY_RELEASE || env.VERCEL_GIT_COMMIT_SHA || env.GITHUB_SHA;
    const options = {
        dsn,
        environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV || 'development',
        sendDefaultPii: false,
        tracesSampleRate: parseTracesSampleRate(env.SENTRY_TRACES_SAMPLE_RATE),
        integrations,
        beforeSend: redactRequestHeaders,
    };

    if (release) options.release = release;

    Sentry.init(options);
    initialized = true;
    return true;
}

function setupSentryErrorHandler(app) {
    if (!initialized || typeof Sentry.setupExpressErrorHandler !== 'function') {
        return false;
    }

    Sentry.setupExpressErrorHandler(app);
    return true;
}

function captureException(error, context) {
    if (!initialized || typeof Sentry.captureException !== 'function') {
        return undefined;
    }

    return Sentry.captureException(error, context);
}

function isSentryInitialized() {
    return initialized;
}

module.exports = {
    captureException,
    initSentry,
    isSentryInitialized,
    parseBooleanFlag,
    parseTracesSampleRate,
    redactRequestHeaders,
    setupSentryErrorHandler,
};
