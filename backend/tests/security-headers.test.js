const express = require('express');
const request = require('supertest');
const { createSecurityHeadersMiddleware } = require('../middleware/securityHeaders');

function createTestApp(env) {
    const app = express();
    app.use(createSecurityHeadersMiddleware({ env }));
    app.get('/ok', (_req, res) => res.json({ ok: true }));
    return app;
}

describe('security headers middleware', () => {
    test('sets API hardening headers without local HSTS by default', async () => {
        const app = createTestApp({ NODE_ENV: 'test' });

        const response = await request(app).get('/ok').expect(200);

        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
        expect(response.headers['x-frame-options']).toBe('DENY');
        expect(response.headers['permissions-policy']).toContain('camera=()');
        expect(response.headers['content-security-policy']).toContain("default-src 'none'");
        expect(response.headers['strict-transport-security']).toBeUndefined();
    });

    test('sets HSTS in production', async () => {
        const app = createTestApp({ NODE_ENV: 'production' });

        const response = await request(app).get('/ok').expect(200);

        expect(response.headers['strict-transport-security']).toBe('max-age=31536000; includeSubDomains; preload');
    });

    test('allows explicit HSTS enablement outside production', async () => {
        const app = createTestApp({ NODE_ENV: 'test', SECURITY_HSTS_ENABLED: 'true' });

        const response = await request(app).get('/ok').expect(200);

        expect(response.headers['strict-transport-security']).toBe('max-age=31536000; includeSubDomains; preload');
    });
});
