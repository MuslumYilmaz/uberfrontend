import { Injectable } from '@angular/core';
import {
  ExternalWindowReservation,
  navigateReservedExternalWindow,
  releaseExternalWindowReservation,
  reserveExternalWindow,
} from '../utils/external-window.util';

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
      return parsed.protocol === 'https:'
        && parsed.hostname === 'frontendatlas.lemonsqueezy.com'
        && /^\/checkout\/buy\/[^/]+/.test(parsed.pathname);
    } catch {
      return false;
    }
  }

  async prefetch(): Promise<void> {
    // Hosted checkout; nothing to prefetch.
    return;
  }

  reserve(): ExternalWindowReservation {
    return reserveExternalWindow();
  }

  release(reservation: ExternalWindowReservation | null | undefined): void {
    releaseExternalWindowReservation(reservation);
  }

  async open(
    url: string,
    _context?: LemonSqueezyCheckoutContext,
    reservation?: ExternalWindowReservation,
  ): Promise<'overlay' | 'new-tab' | 'blocked'> {
    if (!url) return 'new-tab';
    if (typeof window === 'undefined') return 'new-tab';

    const finalUrl = String(url || '').trim();
    if (!finalUrl || !this.isValidBuyUrl(finalUrl)) {
      this.release(reservation);
      console.error('[billing] invalid LemonSqueezy checkout URL.');
      return 'new-tab';
    }
    const openResult = navigateReservedExternalWindow(reservation || this.reserve(), finalUrl);
    if (openResult === 'blocked') {
      console.warn('[billing] LemonSqueezy checkout popup was blocked.');
      return 'blocked';
    }
    return 'new-tab';
  }
}
