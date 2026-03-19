import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CheckoutLaunchMode } from '../utils/billing-ux.util';
import {
  PaymentsProvider,
  PlanId,
  resolveCheckoutPaymentsProvider,
  resolvePaymentsProvider,
} from '../utils/payments-provider.util';
import { apiUrl } from '../utils/api-base';
import { GumroadOverlayService } from './gumroad-overlay.service';
import { LemonSqueezyCheckoutContext, LemonSqueezyCheckoutService } from './lemonsqueezy-checkout.service';

export type CheckoutContext = LemonSqueezyCheckoutContext;

type BillingProvider = {
  checkout: (url: string, context?: CheckoutContext) => Promise<CheckoutMode>;
  prefetch?: () => Promise<void>;
};

type CheckoutMode = CheckoutLaunchMode;
type CheckoutFailureReason = 'missing-url' | 'provider-unavailable' | 'invalid-url' | 'start-failed';
export type CheckoutAttemptState =
  | 'awaiting_webhook'
  | 'applied'
  | 'pending_user_match'
  | 'failed'
  | 'expired';
export type CheckoutResult =
  | { ok: true; mode: CheckoutMode; provider: PaymentsProvider; url: string; attemptId: string; reused: boolean }
  | {
    ok: false;
    reason: CheckoutFailureReason;
    provider: PaymentsProvider;
  };

type CheckoutStartResponse = {
  attemptId: string;
  provider: PaymentsProvider;
  planId: PlanId;
  mode: 'test' | 'live';
  checkoutUrl: string;
  successUrl: string;
  cancelUrl: string;
  reused?: boolean;
};

export type CheckoutAttemptStatus = {
  attemptId: string;
  provider: PaymentsProvider;
  planId: PlanId;
  mode: 'test' | 'live';
  state: CheckoutAttemptState;
  rawStatus: string;
  entitlementActive: boolean;
  accessTierEffective: 'free' | 'premium';
  billingEventId: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
};

export type CheckoutAttemptStatusResult = {
  attempt: CheckoutAttemptStatus | null;
  status: number;
  code?: string;
};

export type CheckoutConfig = {
  configuredProvider: string | null;
  provider: PaymentsProvider | null;
  mode: 'test' | 'live';
  enabled: boolean;
  plans: Record<PlanId, boolean>;
};

type CheckoutConfigResponse = CheckoutConfig;

@Injectable({ providedIn: 'root' })
export class BillingCheckoutService {
  private providers: Record<PaymentsProvider, BillingProvider | null>;
  private checkoutConfigCache: CheckoutConfig | null | undefined = undefined;
  private checkoutConfigRequest?: Promise<CheckoutConfig | null>;

  constructor(
    private http: HttpClient,
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
    };
  }

  async getCheckoutConfig(force = false): Promise<CheckoutConfig | null> {
    if (typeof window === 'undefined') {
      return null;
    }
    if (!force && this.checkoutConfigCache !== undefined) {
      return this.checkoutConfigCache;
    }
    if (!force && this.checkoutConfigRequest) {
      return this.checkoutConfigRequest;
    }

    const request = firstValueFrom(
      this.http.get<CheckoutConfigResponse>(apiUrl('/billing/checkout/config'))
    )
      .then((config) => {
        const normalized = normalizeCheckoutConfig(config);
        this.checkoutConfigCache = normalized;
        return normalized;
      })
      .catch((error) => {
        console.error('[billing] failed to load checkout config', { error });
        this.checkoutConfigCache = null;
        return null;
      })
      .finally(() => {
        this.checkoutConfigRequest = undefined;
      });

    this.checkoutConfigRequest = request;
    return request;
  }

  async prefetch(): Promise<void> {
    if (typeof window !== 'undefined' && typeof (window as any).__faCheckoutRedirect === 'function') {
      return;
    }

    const provider = (await this.getCheckoutConfig())?.provider;
    if (!provider) return;
    const handler = this.providers[provider];
    if (!handler?.prefetch) return;
    try {
      await handler.prefetch();
    } catch {
      // Ignore preload failures; checkout can still attempt to open later.
    }
  }

  async checkout(planId: PlanId, context?: CheckoutContext): Promise<CheckoutResult> {
    const fallbackProvider =
      (await this.getCheckoutConfig())?.provider ||
      resolveCheckoutPaymentsProvider(environment) ||
      'lemonsqueezy';

    let start: CheckoutStartResponse;
    try {
      start = await firstValueFrom(
        this.http.post<CheckoutStartResponse>(
          apiUrl('/billing/checkout/start'),
          { planId },
          { withCredentials: true }
        )
      );
    } catch (error) {
      const reason = mapCheckoutStartError(error, fallbackProvider);
      return { ok: false, reason, provider: fallbackProvider };
    }

    const handler = this.providers[start.provider];
    if (!handler) {
      console.warn('[billing] checkout provider not implemented', { provider: start.provider, planId });
      return { ok: false, reason: 'provider-unavailable', provider: start.provider };
    }

    if (!start?.checkoutUrl) {
      console.warn('[billing] missing checkout url from backend', { provider: start.provider, planId });
      return { ok: false, reason: 'missing-url', provider: start.provider };
    }
    if (start.provider === 'lemonsqueezy' && !isLemonSqueezyBuyUrl(start.checkoutUrl)) {
      console.error('[billing] invalid LemonSqueezy checkout url (expected /checkout/buy/)', {
        planId,
        url: start.checkoutUrl,
      });
      return { ok: false, reason: 'invalid-url', provider: start.provider };
    }

    const mode = await handler.checkout(start.checkoutUrl, context);
    return {
      ok: true,
      mode,
      provider: start.provider,
      url: start.checkoutUrl,
      attemptId: start.attemptId,
      reused: start.reused === true,
    };
  }

  fetchAttemptStatus(attemptId: string): Observable<CheckoutAttemptStatusResult> {
    return this.http
      .get<CheckoutAttemptStatus>(apiUrl(`/billing/checkout/attempts/${encodeURIComponent(attemptId)}/status`), {
        withCredentials: true,
        observe: 'response',
      })
      .pipe(
        map((response) => ({
          attempt: response.body || null,
          status: response.status,
        })),
        catchError((error: unknown) => {
          if (!(error instanceof HttpErrorResponse)) {
            throw error;
          }
          return of({
            attempt: null,
            status: error.status,
            code: String(error.error?.code || '').trim() || undefined,
          });
        })
      );
  }
}

function normalizeCheckoutConfig(value: CheckoutConfigResponse | null | undefined): CheckoutConfig | null {
  if (!value?.mode) return null;
  return {
    configuredProvider: value.configuredProvider || value.provider || null,
    provider: value.provider || null,
    mode: value.mode,
    enabled: value.enabled === true,
    plans: {
      monthly: value.plans?.monthly === true,
      quarterly: value.plans?.quarterly === true,
      annual: value.plans?.annual === true,
      lifetime: value.plans?.lifetime === true,
    },
  };
}

function isLemonSqueezyBuyUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.pathname.includes('/checkout/buy/');
  } catch {
    return false;
  }
}

function mapCheckoutStartError(error: unknown, provider: PaymentsProvider): CheckoutFailureReason {
  if (!(error instanceof HttpErrorResponse)) {
    console.error('[billing] checkout start failed', { provider, error });
    return 'start-failed';
  }

  const code = String(error.error?.code || '').trim().toUpperCase();
  if (code === 'CHECKOUT_UNAVAILABLE') return 'missing-url';
  if (code === 'INVALID_CHECKOUT_URL') return 'invalid-url';
  if (code === 'PROVIDER_UNAVAILABLE' || code === 'UNSUPPORTED_PROVIDER') return 'provider-unavailable';

  console.error('[billing] checkout start failed', {
    provider,
    status: error.status,
    code,
    error: error.error,
  });
  return 'start-failed';
}
