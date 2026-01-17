import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LemonSqueezyCheckoutService {
  async prefetch(): Promise<void> {
    // Hosted checkout; nothing to prefetch.
    return;
  }

  async open(url: string): Promise<'overlay' | 'new-tab'> {
    if (!url) return 'new-tab';
    if (typeof window === 'undefined') return 'new-tab';

    const testHook = (window as any).__faCheckoutRedirect;
    if (typeof testHook === 'function') {
      testHook(url);
      return 'overlay';
    }

    const opened = window.open(url, '_blank', 'noopener');
    if (!opened) {
      console.warn('[billing] LemonSqueezy checkout popup was blocked.');
    }
    return 'new-tab';
  }
}
