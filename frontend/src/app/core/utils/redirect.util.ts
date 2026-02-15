const FALLBACK_REDIRECT = '/dashboard';

/**
 * Only allow same-origin absolute-path redirects.
 * Reject protocol-relative and absolute external URLs.
 */
export function sanitizeRedirectTarget(
  rawTarget: string | null | undefined,
  fallback = FALLBACK_REDIRECT,
): string {
  const target = String(rawTarget || '').trim();
  if (!target) return fallback;
  if (!target.startsWith('/')) return fallback;
  if (target.startsWith('//')) return fallback;

  try {
    const base = new URL('https://frontendatlas.local');
    const parsed = new URL(target, base);
    if (parsed.origin !== base.origin) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function hasRedirectTarget(rawTarget: string | null | undefined): boolean {
  return sanitizeRedirectTarget(rawTarget, '') !== '';
}

