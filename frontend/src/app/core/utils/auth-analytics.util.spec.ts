import { classifyAuthFailure, normalizeAuthAnalyticsSource } from './auth-analytics.util';

describe('auth analytics helpers', () => {
  it('normalizes safe sources and rejects arbitrary values', () => {
    expect(normalizeAuthAnalyticsSource(' Coding_Submit ')).toBe('coding_submit');
    expect(normalizeAuthAnalyticsSource('pricing page?<script>')).toBe('direct');
  });

  it('maps auth failures only to the analytics allowlist', () => {
    expect(classifyAuthFailure({ status: 401 }, 'login')).toBe('invalid_credentials');
    expect(classifyAuthFailure({ status: 409 }, 'signup')).toBe('identity_conflict');
    expect(classifyAuthFailure({ status: 429 }, 'login')).toBe('rate_limited');
    expect(classifyAuthFailure({ error: { code: 'AUTH_CSRF_INVALID' } }, 'login')).toBe('csrf');
    expect(classifyAuthFailure({ error: { error: 'access_denied' } }, 'signup')).toBe('oauth_cancelled');
    expect(classifyAuthFailure({ error: { code: 'OAUTH_EMAIL_UNVERIFIED' } }, 'signup'))
      .toBe('oauth_email_unverified');
    expect(classifyAuthFailure({ status: 0 }, 'login')).toBe('network');
    expect(classifyAuthFailure({ status: 418, error: { error: 'raw backend detail' } }, 'login'))
      .toBe('unknown');
  });
});
