import { getAuthDisplayError } from './auth-error.util';

describe('auth-error.util', () => {
  it('maps csrf auth errors to a clear recovery message', () => {
    expect(getAuthDisplayError(
      {
        error: {
          code: 'AUTH_CSRF_INVALID',
          error: 'CSRF token missing or invalid',
        },
      },
      'Login failed',
    )).toBe('Your session could not be verified. Refresh the page and sign in again.');
  });

  it('falls back to backend message when available', () => {
    expect(getAuthDisplayError(
      {
        error: {
          code: 'AUTH_SESSION_BOOTSTRAP_FAILED',
          error: 'We could not sign you in. Please try again.',
        },
      },
      'Login failed',
    )).toBe('We could not sign you in. Please try again.');
  });

  it('falls back to the provided default message when backend error text is missing', () => {
    expect(getAuthDisplayError({ error: {} }, 'Login failed')).toBe('Login failed');
  });
});
