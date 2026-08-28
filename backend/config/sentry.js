const Sentry = require('@sentry/node');
const {
    interviewPathContract,
    isInterviewPath,
} = require('../services/interview/telemetry-path');

let initialized = false;

const SENSITIVE_REQUEST_HEADERS = new Set([
    'authorization',
    'cookie',
    'csrf-token',
    'forwarded',
    'idempotency-key',
    'proxy-authorization',
    'set-cookie',
    'x-csrf-token',
    'x-forwarded-for',
    'x-real-ip',
    'x-request-id',
    'x-xsrf-token',
]);
const METRIC_ATTRIBUTE_KEYS = new Set([
    'accessMode', 'access_mode', 'artifactKind', 'artifactStatus', 'code', 'event',
    'format', 'httpStatus', 'level', 'limiter', 'method', 'operation', 'operationalState',
    'operational_state', 'outcome', 'path', 'protectedWindow', 'quotaRestored',
    'rate_limit_outcome', 'readinessCode', 'readiness_code', 'redisCode', 'redis_code',
    'replayed', 'selectionPolicyVersion', 'status', 'statusFrom', 'statusTo',
    'status_class', 'storeFallback', 'store_fallback', 'track',
]);
const METRIC_ENUM_VALUES = Object.freeze({
    accessMode: new Set(['off', 'internal', 'cohort', 'public']),
    access_mode: new Set(['off', 'internal', 'cohort', 'public']),
    artifactKind: new Set(['mcq', 'coding', 'system-design']),
    artifactStatus: new Set(['candidate', 'editorial-gold', 'calibrated-gold']),
    code: new Set([
        'not_configured', 'timeout', 'network_error', 'http_error', 'invalid_response',
        'command_error', 'ready', 'probe_not_run', 'rate_limit_allowed',
        'rate_limit_unavailable', 'test_rate_limited',
        'interview_artifacts_blocked', 'interview_dependencies_blocked',
        'interview_release_disabled', 'interview_release_ready',
        'interview_content_unavailable', 'interview_create_ip_rate_limited',
        'interview_create_user_rate_limited', 'interview_idempotency_conflict',
        'interview_monthly_quota_exhausted', 'interview_mutation_rate_limited',
        'interview_outer_rate_limited', 'interview_request_failed',
        'interview_request_too_large', 'interview_selection_unavailable',
        'interview_twist_reveal_rate_limited', 'interview_version_conflict',
    ]),
    event: new Set([
        'availability_checked', 'create_started', 'create_succeeded', 'create_failed',
        'resumed', 'save_conflict', 'deadline_rejected', 'mcq_submitted', 'timed_out',
        'abandoned', 'completed', 'technical_voided', 'quota_denied', 'rate_denied',
        'rate_limit_unavailable', 'rate_limit_fallback', 'artifact_unavailable',
        'inventory_exhausted', 'selection_overlap', 'readiness_checked', 'request_failed',
    ]),
    format: new Set(['coding', 'system-design']),
    level: new Set(['junior', 'mid', 'senior']),
    limiter: new Set([
        'interview-create-ip', 'interview-create-user', 'interview-launch-readiness',
        'interview-mutations', 'interview-outer-ip',
        'interview-system-design-twist-reveal',
    ]),
    method: new Set(['delete', 'get', 'head', 'options', 'patch', 'post', 'put']),
    operation: new Set([
        'abandon', 'active-resume', 'availability', 'bulk-technical-void',
        'coding-check', 'coding-draft', 'coding-start', 'coding-submit', 'control',
        'create', 'mcq-answer', 'mcq-submit', 'release-gate', 'results',
        'session-resume', 'system-design-draft', 'system-design-submit',
        'system-design-twist', 'technical-void', 'unknown',
    ]),
    operationalState: new Set(['normal', 'drain', 'halt']),
    operational_state: new Set(['normal', 'drain', 'halt']),
    outcome: new Set([
        'abandoned', 'available', 'blocked', 'not_started_timeout', 'pending', 'ready',
        'submitted', 'timed_out', 'unavailable',
    ]),
    rate_limit_outcome: new Set(['allowed', 'denied', 'unavailable']),
    readinessCode: new Set([
        'interview_artifacts_blocked', 'interview_dependencies_blocked',
        'interview_release_disabled', 'interview_release_ready',
    ]),
    readiness_code: new Set([
        'interview_artifacts_blocked', 'interview_dependencies_blocked',
        'interview_release_disabled', 'interview_release_ready',
    ]),
    redisCode: new Set([
        'not_configured', 'timeout', 'network_error', 'http_error', 'invalid_response',
        'command_error', 'ready', 'probe_not_run',
    ]),
    redis_code: new Set([
        'not_configured', 'timeout', 'network_error', 'http_error', 'invalid_response',
        'command_error', 'ready', 'probe_not_run',
    ]),
    statusFrom: new Set([
        'mcq_active', 'coding_ready', 'coding_active', 'system_design_active',
        'completed', 'abandoned', 'voided_technical',
    ]),
    statusTo: new Set([
        'mcq_active', 'coding_ready', 'coding_active', 'system_design_active',
        'completed', 'abandoned', 'voided_technical',
    ]),
    track: new Set(['core-web', 'react', 'angular', 'vue']),
    status_class: new Set(['1xx', '2xx', '3xx', '4xx', '5xx']),
});
const BOOLEAN_METRIC_ATTRIBUTE_KEYS = new Set([
    'protectedWindow', 'quotaRestored', 'replayed', 'storeFallback', 'store_fallback',
]);
const NUMBER_METRIC_ATTRIBUTE_KEYS = new Set([
    'httpStatus', 'selectionPolicyVersion', 'status',
]);

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
        if (SENSITIVE_REQUEST_HEADERS.has(normalized)) {
            delete headers[key];
        }
    }

    return event;
}

function sanitizeMetricAttributes(attributes) {
    const source = attributes && typeof attributes === 'object' ? attributes : {};
    const safe = {};
    for (const [key, value] of Object.entries(source)) {
        if (!METRIC_ATTRIBUTE_KEYS.has(key)) continue;
        if (typeof value === 'boolean') {
            if (BOOLEAN_METRIC_ATTRIBUTE_KEYS.has(key)) safe[key] = value;
            continue;
        }
        if (typeof value === 'number' && Number.isFinite(value)) {
            if (NUMBER_METRIC_ATTRIBUTE_KEYS.has(key)) {
                safe[key] = Math.max(-1_000_000, Math.min(1_000_000, value));
            }
            continue;
        }
        const text = String(value ?? '').trim().toLowerCase();
        if (key === 'path') {
            if (isInterviewPath(text)) safe[key] = interviewPathContract(text);
            continue;
        }
        const enumValues = METRIC_ENUM_VALUES[key];
        if (enumValues?.has(text)) safe[key] = text;
    }
    return safe;
}

function scrubExceptionData(event) {
    delete event.message;
    delete event.logentry;
    const values = event?.exception?.values;
    if (!Array.isArray(values)) return;
    event.exception.values = values.map((exception) => {
        const frames = exception?.stacktrace?.frames;
        const rawType = String(exception?.type || 'Error');
        const safeType = new Set([
            'CastError', 'Error', 'MongoServerError', 'SyntaxError', 'ValidationError',
        ]).has(rawType) ? rawType : 'Error';
        return {
            type: safeType,
            value: 'Interview request failed',
            ...(Array.isArray(frames)
                ? {
                    stacktrace: {
                        frames: frames.map((frame) => ({
                            ...(frame?.filename ? { filename: String(frame.filename).slice(0, 240) } : {}),
                            ...(frame?.function ? { function: String(frame.function).slice(0, 160) } : {}),
                            ...(Number.isFinite(frame?.lineno) ? { lineno: frame.lineno } : {}),
                            ...(Number.isFinite(frame?.colno) ? { colno: frame.colno } : {}),
                            ...(typeof frame?.in_app === 'boolean' ? { in_app: frame.in_app } : {}),
                        })),
                    },
                }
                : {}),
        };
    });
}

function scrubInterviewRequest(event) {
    redactRequestHeaders(event);
    const request = event?.request;
    const requestUrl = request?.url || request?.path || '';
    const transaction = String(event?.transaction || '');
    const interviewEvent = isInterviewPath(requestUrl) || isInterviewPath(transaction);
    if (!interviewEvent) return event;

    if (request && typeof request === 'object') {
        const method = String(request.method || '').trim().toUpperCase();
        event.request = {
            url: interviewPathContract(requestUrl || transaction),
            ...(['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'].includes(method)
                ? { method }
                : {}),
            headers: {},
        };
    }
    if (transaction) event.transaction = interviewPathContract(transaction);
    event.contexts = {};
    delete event.user;
    delete event.extra;
    event.tags = sanitizeMetricAttributes(event.tags);
    scrubExceptionData(event);

    if (Array.isArray(event?.breadcrumbs)) {
        event.breadcrumbs = [];
    }
    if (Array.isArray(event?.spans)) {
        event.spans = event.spans.map((span) => {
            const description = String(span?.description || span?.name || '');
            const spanData = span?.data && typeof span.data === 'object' ? span.data : {};
            const candidateUrl = description
                || spanData.url
                || spanData['http.url']
                || spanData['http.target']
                || '';
            return {
                ...(span?.op ? { op: String(span.op).slice(0, 64) } : {}),
                ...(span?.status ? { status: String(span.status).slice(0, 32) } : {}),
                ...(Number.isFinite(span?.start_timestamp)
                    ? { start_timestamp: span.start_timestamp }
                    : {}),
                ...(Number.isFinite(span?.timestamp) ? { timestamp: span.timestamp } : {}),
                ...(span?.trace_id ? { trace_id: span.trace_id } : {}),
                ...(span?.span_id ? { span_id: span.span_id } : {}),
                ...(span?.parent_span_id ? { parent_span_id: span.parent_span_id } : {}),
                description: isInterviewPath(candidateUrl)
                    ? interviewPathContract(candidateUrl)
                    : '[redacted]',
                data: {
                    ...(spanData['http.method'] ? { 'http.method': spanData['http.method'] } : {}),
                    ...(spanData['http.status_code']
                        ? { 'http.status_code': spanData['http.status_code'] }
                        : {}),
                },
            };
        });
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
        beforeSend: scrubInterviewRequest,
        beforeSendTransaction: scrubInterviewRequest,
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

function captureMetric(type, name, value, { attributes, unit } = {}) {
    if (!initialized) return false;
    const metricType = String(type || '').trim().toLowerCase();
    const metricName = String(name || '').trim();
    if (!['count', 'distribution', 'gauge'].includes(metricType)) return false;
    if (!/^interview\.[a-z0-9_.-]{1,100}$/.test(metricName)) return false;
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return false;
    const metric = Sentry.metrics?.[metricType];
    if (typeof metric !== 'function') return false;
    try {
        metric(metricName, numericValue, {
            ...(unit ? { unit } : {}),
            attributes: sanitizeMetricAttributes(attributes),
        });
        return true;
    } catch {
        return false;
    }
}

module.exports = {
    captureMetric,
    captureException,
    initSentry,
    isSentryInitialized,
    parseBooleanFlag,
    parseTracesSampleRate,
    redactRequestHeaders,
    sanitizeMetricAttributes,
    scrubInterviewRequest,
    setupSentryErrorHandler,
};
