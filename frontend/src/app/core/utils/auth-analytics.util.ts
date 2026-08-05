export type AuthFailureReason =
  | 'invalid_credentials'
  | 'identity_conflict'
  | 'rate_limited'
  | 'csrf'
  | 'oauth_cancelled'
  | 'oauth_email_unverified'
  | 'network'
  | 'unknown';

const SOURCE_PATTERN = /^[a-z0-9_-]{1,64}$/;

export function normalizeAuthAnalyticsSource(
  value: unknown,
  fallback = 'direct',
): string {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized && SOURCE_PATTERN.test(normalized) ? normalized : fallback;
}

export function classifyAuthFailure(error: any, mode: 'login' | 'signup' | 'link'): AuthFailureReason {
  const status = Number(error?.status || 0);
  const code = String(error?.error?.code || error?.code || '').trim().toUpperCase();
  const detail = String(error?.error?.error || error?.error || error?.message || '').trim().toLowerCase();

  if (code === 'AUTH_CSRF_INVALID' || code.includes('CSRF')) return 'csrf';
  if (status === 429 || code === 'AUTH_RATE_LIMITED' || code.includes('RATE_LIMIT')) return 'rate_limited';
  if (code === 'OAUTH_EMAIL_UNVERIFIED') return 'oauth_email_unverified';
  if (
    code === 'OAUTH_CANCELLED'
    || code === 'ACCESS_DENIED'
    || detail === 'access_denied'
    || detail.includes('oauth_cancelled')
  ) {
    return 'oauth_cancelled';
  }
  if (status === 0) return 'network';
  if (status === 409 || code.includes('CONFLICT') || code === 'EMAIL_IN_USE') return 'identity_conflict';
  if (
    mode === 'login'
    && code !== 'AUTH_SESSION_BOOTSTRAP_FAILED'
    && (status === 401 || code === 'INVALID_CREDENTIALS')
  ) {
    return 'invalid_credentials';
  }
  return 'unknown';
}
