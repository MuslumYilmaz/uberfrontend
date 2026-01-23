import { Injectable } from '@angular/core';

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

  private buildCheckoutUrl(url: string, context?: LemonSqueezyCheckoutContext): string {
    const base = String(url || '').trim();
    if (!base) return '';
    try {
      const parsed = new URL(base);
      if (context) {
        if (context.userId) {
          parsed.searchParams.set('checkout[custom][fa_user_id]', context.userId);
          parsed.searchParams.set('checkout[custom_data][fa_user_id]', context.userId);
        }
        if (context.email) {
          parsed.searchParams.set('checkout[custom][fa_user_email]', context.email);
          parsed.searchParams.set('checkout[custom_data][fa_user_email]', context.email);
          parsed.searchParams.set('checkout[email]', context.email);
        }
        if (context.username) {
          parsed.searchParams.set('checkout[custom][fa_user_name]', context.username);
          parsed.searchParams.set('checkout[custom_data][fa_user_name]', context.username);
        }
      }
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      if (origin) {
        parsed.searchParams.set('checkout[success_url]', `${origin}/billing/success`);
        parsed.searchParams.set('checkout[cancel_url]', `${origin}/billing/cancel`);
        parsed.searchParams.set('checkout[custom][fa_frontend_origin]', origin);
        parsed.searchParams.set('checkout[custom_data][fa_frontend_origin]', origin);
      }
      return parsed.toString();
    } catch {
      return base;
    }
  }

  async open(url: string, context?: LemonSqueezyCheckoutContext): Promise<'overlay' | 'new-tab'> {
    if (!url) return 'new-tab';
    if (typeof window === 'undefined') return 'new-tab';

    const finalUrl = this.buildCheckoutUrl(url, context);
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
    const testHook = (window as any).__faCheckoutRedirect;
    if (typeof testHook === 'function') {
      testHook(finalUrl);
      return 'new-tab';
    }

    const opened = window.open(finalUrl, '_blank', 'noopener');
    if (!opened) {
      console.warn('[billing] LemonSqueezy checkout popup was blocked.');
    }
    return 'new-tab';
  }
}
