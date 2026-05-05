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
  const path = req?.path || req?.originalUrl || req?.url || '';
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
      const shouldLog =
        status >= 500 ||
        status === 429 ||
        durationMs >= slowMs ||
        (sampleRate > 0 && Math.random() < sampleRate);
      if (!shouldLog) return;

      console.log(JSON.stringify({
        type: 'http_request',
        method: req.method,
        path: sanitizePath(req),
        status,
        durationMs: Math.round(durationMs),
      }));
    });

    next();
  };
}

module.exports = {
  createRequestMetricsMiddleware,
};
