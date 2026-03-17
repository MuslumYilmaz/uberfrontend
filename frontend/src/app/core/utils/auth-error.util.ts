export function getAuthDisplayError(error: any, fallback: string): string {
  const code = String(error?.error?.code || '').trim();
  const message = String(error?.error?.error || '').trim();

  if (code === 'AUTH_CSRF_INVALID') {
    return 'Your session could not be verified. Refresh the page and sign in again.';
  }

  return message || fallback;
}
