const { captureMetric } = require('../config/sentry');
const {
  interviewOperation,
  interviewPathContract,
  isInterviewPath,
} = require('../services/interview/telemetry-path');

function readNumberEnv(name, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function metricsEnabled() {
  const raw = String(process.env.REQUEST_METRICS_ENABLED || '').trim().toLowerCase();
  if (raw) return ['1', 'true', 'yes', 'on'].includes(raw);
  return process.env.NODE_ENV === 'production';
}

function sanitizePath(req) {
  const path = req?.originalUrl || req?.url || req?.path || '';
  if (isInterviewPath(path)) return interviewPathContract(path);
  return String(path).split('?')[0].slice(0, 240) || '/';
}

function createRequestMetricsMiddleware() {
  const slowMs = readNumberEnv('REQUEST_METRICS_SLOW_MS', 1000, { min: 1, max: 60_000 });
  const sampleRate = readNumberEnv('REQUEST_METRICS_SAMPLE_RATE', 0, { min: 0, max: 1 });

  return function requestMetrics(req, res, next) {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      if (!metricsEnabled()) return;
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      const status = Number(res.statusCode || 0);
      const originalPath = req?.originalUrl || req?.url || req?.path || '';
      const interviewRequest = isInterviewPath(originalPath);
      const shouldLog =
        interviewRequest ||
        status >= 500 ||
        status === 429 ||
        durationMs >= slowMs ||
        (sampleRate > 0 && Math.random() < sampleRate);
      if (!shouldLog) return;

      const path = sanitizePath(req);
      const operation = interviewRequest
        ? (req.interviewTelemetryOperation || interviewOperation(originalPath, req.method))
        : undefined;
      const rateLimit = res.locals?.rateLimit;
      const entry = {
        type: interviewRequest ? 'interview_http' : 'http_request',
        method: req.method,
        path,
        status,
        statusClass: `${Math.floor(status / 100)}xx`,
        durationMs: Math.round(durationMs),
        ...(operation ? { operation } : {}),
        ...(rateLimit?.limiter ? { limiter: rateLimit.limiter } : {}),
        ...(rateLimit?.outcome ? { rateLimitOutcome: rateLimit.outcome } : {}),
        ...(rateLimit?.code ? { rateLimitCode: String(rateLimit.code).toLowerCase() } : {}),
        ...(rateLimit?.storeFallback === true ? { storeFallback: true } : {}),
      };
      console.log(JSON.stringify(entry));

      if (interviewRequest) {
        const attributes = {
          method: req.method,
          operation: operation || 'unknown',
          path,
          status,
          status_class: entry.statusClass,
          ...(rateLimit?.limiter ? { limiter: rateLimit.limiter } : {}),
          ...(rateLimit?.outcome ? { rate_limit_outcome: rateLimit.outcome } : {}),
          ...(rateLimit?.storeFallback === true ? { store_fallback: true } : {}),
        };
        captureMetric('count', 'interview.http.requests', 1, { attributes });
        captureMetric('distribution', 'interview.http.duration_ms', durationMs, {
          attributes,
          unit: 'millisecond',
        });
      }
    });

    next();
  };
}

module.exports = {
  createRequestMetricsMiddleware,
  metricsEnabled,
  sanitizePath,
};
