import { Injectable } from '@angular/core';
import { openExternalWindow } from '../utils/external-window.util';

export type LemonSqueezyCheckoutContext = {
  userId?: string;
  email?: string;
  username?: string;
};

@Injectable({ providedIn: 'root' })
export class LemonSqueezyCheckoutService {
  private isValidBuyUrl(value: string): boolean {
    try {
      const parsed = new URL(value);
      return parsed.pathname.includes('/checkout/buy/');
    } catch {
      return false;
    }
  }

  async prefetch(): Promise<void> {
    // Hosted checkout; nothing to prefetch.
    return;
  }

  async open(url: string, context?: LemonSqueezyCheckoutContext): Promise<'overlay' | 'new-tab' | 'blocked'> {
    if (!url) return 'new-tab';
    if (typeof window === 'undefined') return 'new-tab';

    const finalUrl = String(url || '').trim();
    if (!finalUrl || !this.isValidBuyUrl(finalUrl)) {
      console.error('[billing] invalid lemonsqueezy checkout url (expected /checkout/buy/)', {
        baseUrl: url,
        finalUrl,
      });
      return 'new-tab';
    }
    (window as any).__faCheckoutLastUrl = finalUrl;
    const debug = typeof window !== 'undefined' && localStorage.getItem('fa:debug:billing') === '1';
    if (debug) {
      console.log('[billing] lemonsqueezy checkout url', {
        baseUrl: url,
        finalUrl,
        hasUserId: !!context?.userId,
        hasEmail: !!context?.email,
      });
    }
    const openResult = openExternalWindow(finalUrl);
    if (openResult === 'blocked') {
      console.warn('[billing] LemonSqueezy checkout popup was blocked.');
      return 'blocked';
    }
    return 'new-tab';
  }
}
