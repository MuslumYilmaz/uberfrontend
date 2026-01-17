import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  PaymentsProvider,
  PlanId,
  resolveCheckoutUrl,
  resolvePaymentsProvider,
} from '../utils/payments-provider.util';
import { GumroadOverlayService } from './gumroad-overlay.service';
import { LemonSqueezyCheckoutService } from './lemonsqueezy-checkout.service';

type BillingProvider = {
  checkout: (url: string) => Promise<CheckoutMode>;
  prefetch?: () => Promise<void>;
};

type CheckoutMode = 'overlay' | 'new-tab';
export type CheckoutResult =
  | { ok: true; mode: CheckoutMode; provider: PaymentsProvider; url: string }
  | { ok: false; reason: 'missing-url' | 'provider-unavailable'; provider: PaymentsProvider };

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
        checkout: (url) => this.lemonSqueezyCheckout.open(url),
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

  async checkout(planId: PlanId): Promise<CheckoutResult> {
    const provider = resolvePaymentsProvider(environment);
    const url = resolveCheckoutUrl(provider, planId, environment);
    if (!url) {
      console.warn('[billing] missing checkout url', { provider, planId });
      return { ok: false, reason: 'missing-url', provider };
    }

    const handler = this.providers[provider];
    if (!handler) {
      console.warn('[billing] checkout provider not implemented', { provider, planId });
      return { ok: false, reason: 'provider-unavailable', provider };
    }

    const mode = await handler.checkout(url);
    return { ok: true, mode, provider, url };
  }
}
