export type ExternalWindowOpenResult = 'opened' | 'blocked' | 'hooked';

export function openExternalWindow(url: string): ExternalWindowOpenResult {
  if (typeof window === 'undefined') return 'opened';

  const hook = (window as any).__faCheckoutRedirect;
  if (typeof hook === 'function') {
    hook(url);
    return 'hooked';
  }

  const opened = window.open(url, '_blank', 'noopener');
  return opened ? 'opened' : 'blocked';
}
