export type ExternalWindowOpenResult = 'opened' | 'blocked' | 'hooked';

export function openExternalWindow(url: string): ExternalWindowOpenResult {
  if (typeof window === 'undefined') return 'opened';

  const hook = (window as any).__faCheckoutRedirect;
  if (typeof hook === 'function') {
    hook(url);
    return 'hooked';
  }

  // Open a same-origin placeholder first so the browser gives us a handle.
  // Some browsers return `null` for `window.open(..., 'noopener')` even when the tab opens,
  // which makes hosted checkout and billing portal launches look falsely blocked.
  const opened = window.open('', '_blank');
  if (!opened) return 'blocked';

  try {
    opened.opener = null;
  } catch { }

  try {
    opened.location.href = url;
    return 'opened';
  } catch {
    try {
      opened.close();
    } catch { }
    return 'blocked';
  }
}
