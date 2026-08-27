function loadSentryConfig() {
    jest.resetModules();
    const sentryMock = {
        captureException: jest.fn(() => 'event-id'),
        expressIntegration: jest.fn(() => ({ name: 'express' })),
        init: jest.fn(),
        metrics: {
            count: jest.fn(),
            distribution: jest.fn(),
            gauge: jest.fn(),
        },
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
                    'Idempotency-Key': 'mutation-secret',
                    'X-CSRF-Token': 'csrf-secret',
                    'X-Forwarded-For': '198.51.100.10',
                },
            },
        };

        initOptions.beforeSend(event);

        expect(event.request.headers.authorization).toBeUndefined();
        expect(event.request.headers.Cookie).toBeUndefined();
        expect(event.request.headers['set-cookie']).toBeUndefined();
        expect(event.request.headers['x-request-id']).toBeUndefined();
        expect(event.request.headers['Idempotency-Key']).toBeUndefined();
        expect(event.request.headers['X-CSRF-Token']).toBeUndefined();
        expect(event.request.headers['X-Forwarded-For']).toBeUndefined();
    });

    test('scrubs Interview request payloads, identifiers, queries and transaction names', () => {
        const { sentryConfig, sentryMock } = loadSentryConfig();
        sentryConfig.initSentry({ SENTRY_DSN: 'https://public@example.ingest.sentry.io/1' });
        const initOptions = sentryMock.init.mock.calls[0][0];
        const event = {
            transaction: 'PUT /api/interviews/session-secret/mcq/question-secret',
            request: {
                url: 'https://api.example.com/API/INTERVIEWS/session-secret/mcq/question-secret?answer=private',
                query_string: 'answer=private',
                data: { selectedOptionId: 'private-answer' },
                path: '/API/INTERVIEWS/session-secret/private-path',
                query: { answer: 'private-answer' },
                json: { draft: 'private-code' },
                cookies: { access_token: 'secret' },
                headers: {
                    cookie: 'access_token=secret',
                    'Idempotency-Key': 'mutation-secret',
                    'X-CSRF-Token': 'csrf-secret',
                    'X-Forwarded-For': '198.51.100.10',
                },
            },
            contexts: {
                request: { body: 'private-answer' },
                custom: { draft: 'private-code' },
            },
            user: { id: 'user-secret' },
            extra: { draft: 'private-code' },
            tags: { operation: 'mcq-answer', session_id: 'session-secret', prompt: 'private-code' },
            message: 'private-answer failed',
            exception: { values: [{ type: 'Error', value: 'private-code' }] },
            breadcrumbs: [{ data: { url: '/api/interviews/session-secret/results' } }],
            spans: [{
                description: 'PUT /api/interviews/session-secret/coding/draft',
                data: {
                    'http.method': 'PUT',
                    'http.status_code': 200,
                    body: 'private-code',
                },
            }],
        };

        expect(initOptions.beforeSend(event)).toBe(event);
        expect(event.transaction).toBe('/api/interviews/:sessionId/mcq/:questionId');
        expect(event.request).toEqual({
            url: '/api/interviews/:sessionId/mcq/:questionId',
            headers: {},
        });
        expect(event.contexts.request).toBeUndefined();
        expect(event.user).toBeUndefined();
        expect(event.extra).toBeUndefined();
        expect(event.tags).toEqual({ operation: 'mcq-answer' });
        expect(event.message).toBeUndefined();
        expect(event.exception.values).toEqual([{
            type: 'Error',
            value: 'Interview request failed',
        }]);
        expect(event.breadcrumbs).toEqual([]);
        expect(event.spans).toEqual([{
            description: '/api/interviews/:sessionId/coding/draft',
            data: { 'http.method': 'PUT', 'http.status_code': 200 },
        }]);
        expect(initOptions.beforeSendTransaction).toBe(initOptions.beforeSend);
        expect(JSON.stringify(event)).not.toContain('session-secret');
        expect(JSON.stringify(event)).not.toContain('private-answer');
        expect(JSON.stringify(event)).not.toContain('private-code');
    });

    test('captures only allowlisted Interview metrics after initialization', () => {
        const { sentryConfig, sentryMock } = loadSentryConfig();
        expect(sentryConfig.captureMetric('count', 'interview.http.requests', 1)).toBe(false);

        sentryConfig.initSentry({ SENTRY_DSN: 'https://public@example.ingest.sentry.io/1' });
        expect(sentryConfig.captureMetric('count', 'interview.http.requests', 1, {
            attributes: {
                operation: 'mcq-answer',
                sessionId: 'session secret is rejected',
                session_id: '507f1f77bcf86cd799439011',
                prompt: 'private-code',
                track: 123456,
            },
        })).toBe(true);
        expect(sentryMock.metrics.count).toHaveBeenCalledWith(
            'interview.http.requests',
            1,
            { attributes: { operation: 'mcq-answer' } }
        );
        expect(sentryConfig.captureMetric('count', 'other.metric', 1)).toBe(false);
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
