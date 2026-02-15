import { hasRedirectTarget, sanitizeRedirectTarget } from './redirect.util';

describe('redirect.util', () => {
  it('allows same-origin absolute paths', () => {
    expect(
      sanitizeRedirectTarget('/react/coding/react-counter?src=lp_hero#tests'),
    ).toBe('/react/coding/react-counter?src=lp_hero#tests');
  });

  it('falls back for empty redirects', () => {
    expect(sanitizeRedirectTarget('')).toBe('/dashboard');
    expect(sanitizeRedirectTarget(null)).toBe('/dashboard');
  });

  it('blocks protocol-relative redirects', () => {
    expect(sanitizeRedirectTarget('//evil.example/steal')).toBe('/dashboard');
  });

  it('blocks absolute external redirects', () => {
    expect(sanitizeRedirectTarget('https://evil.example/steal')).toBe('/dashboard');
    expect(sanitizeRedirectTarget('http://evil.example/steal')).toBe('/dashboard');
  });

  it('blocks non-path redirects', () => {
    expect(sanitizeRedirectTarget('javascript:alert(1)')).toBe('/dashboard');
    expect(sanitizeRedirectTarget('auth/login')).toBe('/dashboard');
  });

  it('respects custom fallback', () => {
    expect(sanitizeRedirectTarget('https://evil.example', '/pricing')).toBe('/pricing');
  });

  it('detects valid redirect targets', () => {
    expect(hasRedirectTarget('/pricing')).toBeTrue();
    expect(hasRedirectTarget('https://evil.example')).toBeFalse();
  });
});
