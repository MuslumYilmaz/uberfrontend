'use strict';

// Keep the global protection active but out of the way of integration suites
// that intentionally exercise many requests against one in-process app.
process.env.API_RATE_LIMIT_MAX ||= '100000';
process.env.WEBHOOK_RATE_LIMIT_MAX ||= '100000';
process.env.RATE_LIMIT_STORE ||= 'memory';
