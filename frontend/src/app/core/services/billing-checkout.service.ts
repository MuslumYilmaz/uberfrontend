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
import { ExternalWindowReservation } from '../utils/external-window.util';
import { GumroadOverlayService } from './gumroad-overlay.service';
import { LemonSqueezyCheckoutContext, LemonSqueezyCheckoutService } from './lemonsqueezy-checkout.service';

export type CheckoutContext = LemonSqueezyCheckoutContext & {
  launchReservation?: ExternalWindowReservation | null;
};

type BillingProvider = {
  checkout: (url: string, context?: CheckoutContext) => Promise<CheckoutMode>;
  prefetch?: () => Promise<void>;
};

type CheckoutMode = CheckoutLaunchMode;
type CheckoutFailureReason =
  | 'missing-url'
  | 'provider-unavailable'
  | 'invalid-url'
  | 'verification-required'
  | 'start-failed';
export type CheckoutAttemptState =
  | 'awaiting_webhook'
  | 'applied'
  | 'pending_user_match'
  | 'failed'
  | 'expired';
export type CheckoutResult =
  | {
    ok: true;
    mode: CheckoutMode;
    checkoutMode: 'test' | 'live';
    provider: PaymentsProvider;
    url: string;
    attemptId: string;
    reused: boolean;
  }
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
  analyticsSurface?: string;
  reused?: boolean;
};

export type CheckoutClientState =
  | 'provider_opened'
  | 'popup_blocked'
  | 'success_redirected'
  | 'cancel_redirected';

export type VerifiedPurchase = {
  transactionId: string;
  currency: string;
  value: number;
  tax: number;
  total: number;
  items: Array<Record<string, unknown>>;
  source: string;
  verifiedAt: string;
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
  analyticsSurface?: string | null;
  providerOpenedAt?: string | null;
  popupBlockedAt?: string | null;
  successRedirectedAt?: string | null;
  cancelRedirectedAt?: string | null;
  purchase: VerifiedPurchase | null;
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
  private static readonly CONFIG_CACHE_TTL_MS = 5 * 60 * 1000;
  private static readonly CONFIG_RETRY_DELAYS_MS = [0, 500, 1500] as const;
  private providers: Record<PaymentsProvider, BillingProvider | null>;
  private checkoutConfigCache?: { value: CheckoutConfig; expiresAt: number };
  private checkoutConfigRequest?: Promise<CheckoutConfig | null>;

  constructor(
    private http: HttpClient,
    private gumroadOverlay: GumroadOverlayService,
    private lemonSqueezyCheckout: LemonSqueezyCheckoutService
  ) {
    this.providers = {
      gumroad: {
        checkout: (url, context) => {
          this.lemonSqueezyCheckout.release(context?.launchReservation);
          return this.gumroadOverlay.open(url);
        },
        prefetch: () => this.gumroadOverlay.prefetch(),
      },
      lemonsqueezy: {
        checkout: (url, context) => this.lemonSqueezyCheckout.open(
          url,
          context,
          context?.launchReservation || undefined,
        ),
        prefetch: () => this.lemonSqueezyCheckout.prefetch(),
      },
    };
  }

  async getCheckoutConfig(force = false): Promise<CheckoutConfig | null> {
    if (typeof window === 'undefined') {
      return null;
    }
    if (!force && this.checkoutConfigCache?.expiresAt && this.checkoutConfigCache.expiresAt > Date.now()) {
      return this.checkoutConfigCache.value;
    }
    if (this.checkoutConfigCache && this.checkoutConfigCache.expiresAt <= Date.now()) {
      this.checkoutConfigCache = undefined;
    }
    if (this.checkoutConfigRequest) {
      return this.checkoutConfigRequest;
    }

    const request = this.fetchCheckoutConfigWithRetry()
      .then((config) => {
        const normalized = normalizeCheckoutConfig(config);
        if (normalized) {
          this.checkoutConfigCache = {
            value: normalized,
            expiresAt: Date.now() + BillingCheckoutService.CONFIG_CACHE_TTL_MS,
          };
        }
        return normalized;
      })
      .catch(() => {
        // A transient config failure must not disable checkout for the whole session.
        this.checkoutConfigCache = undefined;
        return null;
      })
      .finally(() => {
        this.checkoutConfigRequest = undefined;
      });

    this.checkoutConfigRequest = request;
    return request;
  }

  reserveCheckoutWindow(): ExternalWindowReservation | null {
    const cachedProvider = this.checkoutConfigCache?.value.provider;
    if (cachedProvider === 'gumroad') return null;
    return this.lemonSqueezyCheckout.reserve();
  }

  releaseCheckoutWindow(reservation: ExternalWindowReservation | null | undefined): void {
    this.lemonSqueezyCheckout.release(reservation);
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

  async checkout(
    planId: PlanId,
    context?: CheckoutContext,
    analyticsSource = 'pricing',
    analyticsSurface = analyticsSource,
  ): Promise<CheckoutResult> {
    const fallbackProvider =
      (await this.getCheckoutConfig())?.provider ||
      resolveCheckoutPaymentsProvider(environment) ||
      'lemonsqueezy';

    let start: CheckoutStartResponse;
    try {
      start = await firstValueFrom(
        this.http.post<CheckoutStartResponse>(
          apiUrl('/billing/checkout/start'),
          { planId, analyticsSource, analyticsSurface },
          { withCredentials: true }
        )
      );
    } catch (error) {
      this.releaseCheckoutWindow(context?.launchReservation);
      const reason = mapCheckoutStartError(error, fallbackProvider);
      return { ok: false, reason, provider: fallbackProvider };
    }

    const handler = this.providers[start.provider];
    if (!handler) {
      this.releaseCheckoutWindow(context?.launchReservation);
      console.warn('[billing] checkout provider not implemented', { provider: start.provider, planId });
      return { ok: false, reason: 'provider-unavailable', provider: start.provider };
    }

    if (!start?.checkoutUrl) {
      this.releaseCheckoutWindow(context?.launchReservation);
      console.warn('[billing] missing checkout url from backend', { provider: start.provider, planId });
      return { ok: false, reason: 'missing-url', provider: start.provider };
    }
    if (start.provider === 'lemonsqueezy' && !isLemonSqueezyBuyUrl(start.checkoutUrl)) {
      this.releaseCheckoutWindow(context?.launchReservation);
      console.error('[billing] invalid LemonSqueezy checkout URL.');
      return { ok: false, reason: 'invalid-url', provider: start.provider };
    }

    let mode: CheckoutMode;
    try {
      mode = await handler.checkout(start.checkoutUrl, context);
    } catch {
      this.releaseCheckoutWindow(context?.launchReservation);
      return { ok: false, reason: 'provider-unavailable', provider: start.provider };
    }
    return {
      ok: true,
      mode,
      checkoutMode: start.mode,
      provider: start.provider,
      url: start.checkoutUrl,
      attemptId: start.attemptId,
      reused: start.reused === true,
    };
  }

  recordAttemptClientState(
    attemptId: string,
    state: CheckoutClientState,
  ): Observable<CheckoutAttemptStatus> {
    return this.http.post<CheckoutAttemptStatus>(
      apiUrl(`/billing/checkout/attempts/${encodeURIComponent(attemptId)}/client-state`),
      { state },
      { withCredentials: true },
    );
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

  private async fetchCheckoutConfigWithRetry(): Promise<CheckoutConfigResponse> {
    let lastError: unknown;
    for (const delayMs of BillingCheckoutService.CONFIG_RETRY_DELAYS_MS) {
      if (delayMs > 0) {
        await new Promise<void>((resolve) => window.setTimeout(resolve, delayMs));
      }
      try {
        return await firstValueFrom(
          this.http.get<CheckoutConfigResponse>(apiUrl('/billing/checkout/config')),
        );
      } catch (error) {
        lastError = error;
        if (!shouldRetryCheckoutConfig(error)) break;
      }
    }
    throw lastError;
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
    return parsed.protocol === 'https:'
      && parsed.hostname === 'frontendatlas.lemonsqueezy.com'
      && /^\/checkout\/buy\/[^/]+/.test(parsed.pathname);
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
  if (code === 'EMAIL_VERIFICATION_REQUIRED') return 'verification-required';
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

function shouldRetryCheckoutConfig(error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse)) return true;
  return error.status === 0 || error.status === 408 || error.status === 429 || error.status >= 500;
}
