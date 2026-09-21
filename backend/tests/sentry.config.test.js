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
        flush: jest.fn(async () => true),
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
        expect(sentryConfig.isSentryConfigured({
            SENTRY_ENABLED: 'false',
            SENTRY_DSN: 'https://public@example.ingest.sentry.io/1',
        })).toBe(false);
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
                monitoring_code: 'ready',
                track: 123456,
            },
        })).toBe(true);
        expect(sentryMock.metrics.count).toHaveBeenCalledWith(
            'interview.http.requests',
            1,
            { attributes: { operation: 'mcq-answer', monitoring_code: 'ready' } }
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

    test('captures a handled Interview exception with only a sanitized error and bounded tags', () => {
        const { sentryConfig, sentryMock } = loadSentryConfig();
        const rawError = new Error('private-answer from session-secret');
        rawError.name = 'InterviewServiceError';
        rawError.stack = [
            'InterviewServiceError: private-answer from session-secret',
            '    at saveAnswer (/srv/app/private-handler.js:42:7)',
        ].join('\n');

        expect(sentryConfig.captureInterviewException(rawError, {
            operation: 'results',
            code: 'INTERVIEW_RESULTS_UNAVAILABLE',
            status: 500,
            userId: 'user-secret',
        })).toBeUndefined();
        sentryConfig.initSentry({ SENTRY_DSN: 'https://public@example.ingest.sentry.io/1' });
        expect(sentryConfig.captureInterviewException(rawError, {
            operation: 'results',
            code: 'INTERVIEW_RESULTS_UNAVAILABLE',
            status: 500,
            userId: 'user-secret',
        })).toBe('event-id');

        const [capturedError, context] = sentryMock.captureException.mock.calls[0];
        expect(capturedError).not.toBe(rawError);
        expect(capturedError.name).toBe('InterviewServiceError');
        expect(capturedError.message).toBe('Interview request failed');
        expect(capturedError.stack).toContain('private-handler.js:42:7');
        expect(context.tags).toMatchObject({
            operation: 'results',
            code: 'interview_results_unavailable',
            status: 500,
        });
        const capturedText = JSON.stringify({
            name: capturedError.name,
            message: capturedError.message,
            stack: capturedError.stack,
            context,
        });
        expect(capturedText).not.toMatch(/private-answer|session-secret|user-secret/);
    });

    test('throttles each operational issue signal for five minutes', () => {
        const { sentryConfig, sentryMock } = loadSentryConfig();
        sentryConfig.initSentry({ SENTRY_DSN: 'https://public@example.ingest.sentry.io/1' });
        sentryConfig.resetInterviewIssueSignalThrottle();

        expect(sentryConfig.captureInterviewIssueSignal('redis_degraded', {
            operation: 'coding-draft',
            code: 'timeout',
            status: 503,
            now: 1_000,
            sessionId: 'session-secret',
        })).toBe(true);
        expect(sentryConfig.captureInterviewIssueSignal('redis_degraded', {
            operation: 'coding-draft',
            code: 'network_error',
            status: 503,
            now: 300_999,
        })).toBe(false);
        expect(sentryConfig.captureInterviewIssueSignal('redis_degraded', {
            operation: 'coding-draft',
            code: 'network_error',
            status: 503,
            now: 301_000,
        })).toBe(true);
        expect(sentryConfig.captureInterviewIssueSignal('user-controlled-signal', {
            now: 1_000_000,
        })).toBe(false);

        expect(sentryMock.captureException).toHaveBeenCalledTimes(2);
        for (const [capturedError, context] of sentryMock.captureException.mock.calls) {
            expect(capturedError.message).toBe('Interview request failed');
            expect(context).toMatchObject({
                fingerprint: ['interview-operational-signal', 'redis_degraded'],
                tags: {
                    signal: 'redis_degraded',
                    operation: 'coding-draft',
                    status: 503,
                },
            });
            expect(JSON.stringify({ capturedError: capturedError.stack, context }))
                .not.toContain('session-secret');
        }
    });

    test('accepts exactly four fixed issue signals and scrubs marked events without request context', () => {
        const { sentryConfig, sentryMock } = loadSentryConfig();
        sentryConfig.initSentry({ SENTRY_DSN: 'https://public@example.ingest.sentry.io/1' });
        sentryConfig.resetInterviewIssueSignalThrottle();
        const signals = [
            'readiness_blocked',
            'redis_degraded',
            'protected_overlap',
            'unexpected_5xx',
        ];

        for (const signal of signals) {
            expect(sentryConfig.captureInterviewIssueSignal(signal, {
                error: new Error('private-answer session-secret'),
                operation: 'release-gate',
                status: 503,
                now: 10_000,
            })).toBe(true);
        }
        expect(sentryConfig.captureInterviewIssueSignal('private-user-signal', {
            now: 10_000,
        })).toBe(false);
        expect(sentryMock.captureException).toHaveBeenCalledTimes(4);
        sentryMock.captureException.mock.calls.forEach(([, context], index) => {
            expect(context.fingerprint).toEqual([
                'interview-operational-signal',
                signals[index],
            ]);
        });

        const [, context] = sentryMock.captureException.mock.calls[3];
        const event = {
            tags: context.tags,
            message: 'private-answer',
            user: { id: 'user-secret' },
            extra: { draft: 'private-code' },
            contexts: { request: { body: 'private-answer' } },
            exception: {
                values: [{ type: 'InterviewServiceError', value: 'session-secret' }],
            },
            breadcrumbs: [{ message: 'private-answer' }],
        };
        const beforeSend = sentryMock.init.mock.calls[0][0].beforeSend;
        expect(beforeSend(event)).toBe(event);
        expect(event.tags).toEqual({
            operation: 'release-gate',
            signal: 'unexpected_5xx',
            status: 503,
        });
        expect(JSON.stringify(event)).not.toMatch(
            /private-answer|session-secret|user-secret|private-code|interview_capture_kind/
        );
    });

    test('flushes only after Sentry has initialized', async () => {
        const { sentryConfig, sentryMock } = loadSentryConfig();
        await expect(sentryConfig.flushSentry()).resolves.toBe(false);
        sentryConfig.initSentry({ SENTRY_DSN: 'https://public@example.ingest.sentry.io/1' });
        await expect(sentryConfig.flushSentry(20_000)).resolves.toBe(true);
        expect(sentryMock.flush).toHaveBeenCalledWith(10_000);
    });
});
