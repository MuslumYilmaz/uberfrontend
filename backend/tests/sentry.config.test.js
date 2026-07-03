function loadSentryConfig() {
    jest.resetModules();
    const sentryMock = {
        captureException: jest.fn(() => 'event-id'),
        expressIntegration: jest.fn(() => ({ name: 'express' })),
        init: jest.fn(),
        mongooseIntegration: jest.fn(() => ({ name: 'mongoose' })),
        setupExpressErrorHandler: jest.fn(),
    };

    jest.doMock('@sentry/node', () => sentryMock);

    return {
        sentryConfig: require('../config/sentry'),
        sentryMock,
    };
}

describe('backend Sentry config', () => {
    afterEach(() => {
        jest.dontMock('@sentry/node');
        jest.resetModules();
    });

    test('stays disabled when no DSN is configured', () => {
        const { sentryConfig, sentryMock } = loadSentryConfig();

        expect(sentryConfig.initSentry({ NODE_ENV: 'production' })).toBe(false);
        expect(sentryConfig.isSentryInitialized()).toBe(false);
        expect(sentryMock.init).not.toHaveBeenCalled();
    });

    test('honors an explicit disable flag even when a DSN exists', () => {
        const { sentryConfig, sentryMock } = loadSentryConfig();

        expect(
            sentryConfig.initSentry({
                SENTRY_ENABLED: 'false',
                SENTRY_DSN: 'https://public@example.ingest.sentry.io/1',
            })
        ).toBe(false);
        expect(sentryMock.init).not.toHaveBeenCalled();
    });

    test('initializes with Express integration and redacts sensitive request headers', () => {
        const { sentryConfig, sentryMock } = loadSentryConfig();

        expect(
            sentryConfig.initSentry({
                NODE_ENV: 'production',
                SENTRY_DSN: 'https://public@example.ingest.sentry.io/1',
                SENTRY_ENVIRONMENT: 'production',
                SENTRY_RELEASE: 'release-123',
                SENTRY_TRACES_SAMPLE_RATE: '0.25',
            })
        ).toBe(true);

        expect(sentryMock.expressIntegration).toHaveBeenCalledTimes(1);
        expect(sentryMock.init).toHaveBeenCalledTimes(1);
        const initOptions = sentryMock.init.mock.calls[0][0];
        expect(initOptions).toMatchObject({
            dsn: 'https://public@example.ingest.sentry.io/1',
            environment: 'production',
            release: 'release-123',
            sendDefaultPii: false,
            tracesSampleRate: 0.25,
        });

        const event = {
            request: {
                headers: {
                    authorization: 'Bearer secret',
                    Cookie: 'access_token=secret',
                    'set-cookie': 'refresh=secret',
                    'x-request-id': 'req-1',
                },
            },
        };

        initOptions.beforeSend(event);

        expect(event.request.headers.authorization).toBeUndefined();
        expect(event.request.headers.Cookie).toBeUndefined();
        expect(event.request.headers['set-cookie']).toBeUndefined();
        expect(event.request.headers['x-request-id']).toBe('req-1');
    });

    test('wires Express error handler and capture only after initialization', () => {
        const { sentryConfig, sentryMock } = loadSentryConfig();
        const app = {};
        const error = new Error('boom');

        expect(sentryConfig.setupSentryErrorHandler(app)).toBe(false);
        expect(sentryConfig.captureException(error)).toBeUndefined();

        sentryConfig.initSentry({ SENTRY_DSN: 'https://public@example.ingest.sentry.io/1' });

        expect(sentryConfig.setupSentryErrorHandler(app)).toBe(true);
        expect(sentryMock.setupExpressErrorHandler).toHaveBeenCalledWith(app);
        expect(sentryConfig.captureException(error, { tags: { route: 'test' } })).toBe('event-id');
        expect(sentryMock.captureException).toHaveBeenCalledWith(error, { tags: { route: 'test' } });
    });
});
