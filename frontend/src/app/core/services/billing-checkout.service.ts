import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  PaymentsProvider,
  PlanId,
  resolveCheckoutUrl,
  resolvePaymentsProvider,
} from '../utils/payments-provider.util';
import { GumroadOverlayService } from './gumroad-overlay.service';
import { LemonSqueezyCheckoutContext, LemonSqueezyCheckoutService } from './lemonsqueezy-checkout.service';

export type CheckoutContext = LemonSqueezyCheckoutContext;

type BillingProvider = {
  checkout: (url: string, context?: CheckoutContext) => Promise<CheckoutMode>;
  prefetch?: () => Promise<void>;
};

type CheckoutMode = 'overlay' | 'new-tab';
export type CheckoutResult =
  | { ok: true; mode: CheckoutMode; provider: PaymentsProvider; url: string }
  | { ok: false; reason: 'missing-url' | 'provider-unavailable' | 'invalid-url'; provider: PaymentsProvider };

@Injectable({ providedIn: 'root' })
export class BillingCheckoutService {
  private providers: Record<PaymentsProvider, BillingProvider | null>;

  constructor(
    private gumroadOverlay: GumroadOverlayService,
    private lemonSqueezyCheckout: LemonSqueezyCheckoutService
  ) {
    this.providers = {
      gumroad: {
        checkout: (url) => this.gumroadOverlay.open(url),
        prefetch: () => this.gumroadOverlay.prefetch(),
      },
      lemonsqueezy: {
        checkout: (url, context) => this.lemonSqueezyCheckout.open(url, context),
        prefetch: () => this.lemonSqueezyCheckout.prefetch(),
      },
      stripe: null,
    };
  }

  async prefetch(): Promise<void> {
    if (typeof window !== 'undefined' && typeof (window as any).__faCheckoutRedirect === 'function') {
      return;
    }

    const provider = resolvePaymentsProvider(environment);
    const handler = this.providers[provider];
    if (!handler?.prefetch) return;
    try {
      await handler.prefetch();
    } catch {
      // Ignore preload failures; checkout can still attempt to open later.
    }
  }

  async checkout(planId: PlanId, context?: CheckoutContext): Promise<CheckoutResult> {
    const provider = resolvePaymentsProvider(environment);
    const url = resolveCheckoutUrl(provider, planId, environment);
    if (!url) {
      console.warn('[billing] missing checkout url', { provider, planId });
      return { ok: false, reason: 'missing-url', provider };
    }
    if (provider === 'lemonsqueezy' && !isLemonSqueezyBuyUrl(url)) {
      console.error('[billing] invalid LemonSqueezy checkout url (expected /checkout/buy/)', {
        planId,
        url,
      });
      return { ok: false, reason: 'invalid-url', provider };
    }

    const handler = this.providers[provider];
    if (!handler) {
      console.warn('[billing] checkout provider not implemented', { provider, planId });
      return { ok: false, reason: 'provider-unavailable', provider };
    }

    const mode = await handler.checkout(url, context);
    return { ok: true, mode, provider, url };
  }
}

function isLemonSqueezyBuyUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.pathname.includes('/checkout/buy/');
  } catch {
    return false;
  }
}
