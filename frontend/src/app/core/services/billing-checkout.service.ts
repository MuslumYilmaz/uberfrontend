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
import {
  LemonSqueezyCheckoutContext,
  LemonSqueezyCheckoutService,
  LemonSqueezyCheckoutSurface,
  LemonSqueezyLaunchResult,
} from './lemonsqueezy-checkout.service';

export type CheckoutSurface = LemonSqueezyCheckoutSurface;
export type CheckoutOfferVersion = string;
export type CheckoutPlanInterval = 'month' | 'year' | 'one_time';
export type CheckoutPlanDetail = {
  amountCents: number;
  currency: string;
  interval: CheckoutPlanInterval;
  intervalCount: number | null;
  taxInclusive: boolean;
};

export type CheckoutContext = LemonSqueezyCheckoutContext & {
  launchReservation?: ExternalWindowReservation | null;
  analyticsSessionId?: string;
  experimentId?: string;
  campaignId?: string;
  offerVersion?: CheckoutOfferVersion;
};

type BillingProvider = {
  checkout: (url: string, context?: CheckoutContext) => Promise<ProviderCheckoutMode>;
  prefetch?: (checkoutSurface: CheckoutSurface) => Promise<void>;
};

type CheckoutMode = CheckoutLaunchMode;
type ProviderCheckoutMode = CheckoutMode | LemonSqueezyLaunchResult;
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
    campaignId?: string;
    offerVersion?: CheckoutOfferVersion;
    checkoutSurface?: CheckoutSurface;
  }
  | {
    ok: false;
    reason: CheckoutFailureReason;
    provider: PaymentsProvider;
  };

export type CheckoutStartResponse = {
  attemptId: string;
  provider: PaymentsProvider;
  planId: PlanId;
  mode: 'test' | 'live';
  checkoutUrl: string;
  successUrl: string;
  cancelUrl: string;
  analyticsSurface?: string;
  analyticsSessionId?: string | null;
  experimentId?: string | null;
  campaignId?: string | null;
  providerDiscountId?: string | null;
  offerVersion?: CheckoutOfferVersion;
  checkoutSurface?: CheckoutSurface;
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
  analyticsSessionId?: string | null;
  experimentId?: string | null;
  campaignId?: string | null;
  providerDiscountId?: string | null;
  offerVersion?: CheckoutOfferVersion | null;
  checkoutSurface?: CheckoutSurface | null;
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
  planDetails: Partial<Record<PlanId, CheckoutPlanDetail>>;
  offerVersion: CheckoutOfferVersion;
  checkoutSurface: CheckoutSurface;
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
        checkout: async (url, context) => {
          const result = await this.lemonSqueezyCheckout.open(
            url,
            context,
            context?.launchReservation || undefined,
          );
          return result === 'same_tab' ? 'same-tab' : result;
        },
        prefetch: (surface) => this.lemonSqueezyCheckout.prefetch(surface),
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
    const cachedConfig = this.checkoutConfigCache?.value;
    const cachedProvider = cachedConfig?.provider;
    if (cachedProvider === 'gumroad') return null;
    if (cachedProvider === 'lemonsqueezy' && cachedConfig?.checkoutSurface === 'overlay') return null;
    return this.lemonSqueezyCheckout.reserve();
  }

  releaseCheckoutWindow(reservation: ExternalWindowReservation | null | undefined): void {
    this.lemonSqueezyCheckout.release(reservation);
  }

  async prefetch(): Promise<void> {
    if (typeof window !== 'undefined' && typeof (window as any).__faCheckoutRedirect === 'function') {
      return;
    }

    const config = await this.getCheckoutConfig();
    const provider = config?.provider;
    if (!provider) return;
    const handler = this.providers[provider];
    if (!handler?.prefetch) return;
    try {
      await handler.prefetch(config.checkoutSurface);
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
    const config = await this.getCheckoutConfig();
    const fallbackProvider =
      config?.provider ||
      resolveCheckoutPaymentsProvider(environment) ||
      'lemonsqueezy';

    const requestBody: Record<string, unknown> = { planId, analyticsSource, analyticsSurface };
    const analyticsSessionId = normalizeOptionalAttributionId(context?.analyticsSessionId);
    const experimentId = normalizeOptionalAttributionId(context?.experimentId);
    const campaignId = normalizeCampaignId(context?.campaignId);
    const offerVersion = normalizeOfferVersion(context?.offerVersion || config?.offerVersion, null);
    const requestedSurface = normalizeCheckoutSurface(context?.checkoutSurface || config?.checkoutSurface);
    if (analyticsSessionId) requestBody['analyticsSessionId'] = analyticsSessionId;
    if (experimentId) requestBody['experimentId'] = experimentId;
    if (campaignId) requestBody['campaignId'] = campaignId;
    if (offerVersion) requestBody['offerVersion'] = offerVersion;
    if (context?.checkoutSurface || config?.checkoutSurface) {
      requestBody['checkoutSurface'] = requestedSurface;
    }

    let start: CheckoutStartResponse;
    try {
      start = await firstValueFrom(
        this.http.post<CheckoutStartResponse>(
          apiUrl('/billing/checkout/start'),
          requestBody,
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

    const checkoutSurface = normalizeCheckoutSurface(start.checkoutSurface);
    let providerMode: ProviderCheckoutMode;
    try {
      providerMode = await handler.checkout(start.checkoutUrl, {
        ...context,
        checkoutSurface,
        successUrl: start.successUrl,
      });
    } catch {
      this.releaseCheckoutWindow(context?.launchReservation);
      return { ok: false, reason: 'provider-unavailable', provider: start.provider };
    }
    if (providerMode === 'failed') {
      this.releaseCheckoutWindow(context?.launchReservation);
      return { ok: false, reason: 'provider-unavailable', provider: start.provider };
    }
    const mode: CheckoutMode = providerMode === 'same_tab' ? 'same-tab' : providerMode;
    const resolvedCampaignId = normalizeCampaignId(start.campaignId);
    return {
      ok: true,
      mode,
      checkoutMode: start.mode,
      provider: start.provider,
      url: start.checkoutUrl,
      attemptId: start.attemptId,
      reused: start.reused === true,
      ...(resolvedCampaignId ? { campaignId: resolvedCampaignId } : {}),
      offerVersion: normalizeOfferVersion(start.offerVersion, 'pricing_baseline_v1') || 'pricing_baseline_v1',
      checkoutSurface,
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
    planDetails: normalizePlanDetails(value.planDetails),
    offerVersion: normalizeOfferVersion(value.offerVersion, 'pricing_baseline_v1') || 'pricing_baseline_v1',
    checkoutSurface: normalizeCheckoutSurface(value.checkoutSurface),
  };
}

function normalizePlanDetails(
  value: Partial<Record<PlanId, CheckoutPlanDetail>> | null | undefined,
): Partial<Record<PlanId, CheckoutPlanDetail>> {
  const result: Partial<Record<PlanId, CheckoutPlanDetail>> = {};
  for (const planId of ['monthly', 'quarterly', 'annual', 'lifetime'] as const) {
    const detail = value?.[planId];
    if (!detail) continue;
    const amountCents = Number(detail.amountCents);
    const currency = String(detail.currency || '').trim().toUpperCase();
    const interval = detail.interval;
    const intervalCount = detail.intervalCount === null ? null : Number(detail.intervalCount);
    if (!Number.isInteger(amountCents) || amountCents <= 0) continue;
    if (!/^[A-Z]{3}$/.test(currency)) continue;
    if (interval !== 'month' && interval !== 'year' && interval !== 'one_time') continue;
    if (interval === 'one_time' && intervalCount !== null) continue;
    if (interval !== 'one_time' && (!Number.isInteger(intervalCount) || Number(intervalCount) <= 0)) continue;
    result[planId] = {
      amountCents,
      currency,
      interval,
      intervalCount,
      taxInclusive: detail.taxInclusive === true,
    };
  }
  return result;
}

function normalizeCheckoutSurface(value: unknown): CheckoutSurface {
  return String(value || '').trim().toLowerCase() === 'overlay' ? 'overlay' : 'hosted_new_tab';
}

function normalizeOfferVersion(value: unknown, fallback: string | null): string | null {
  const normalized = String(value || '').trim().toLowerCase();
  return /^[a-z0-9][a-z0-9_-]{0,63}$/.test(normalized) ? normalized : fallback;
}

function normalizeCampaignId(value: unknown): string | null {
  const normalized = String(value || '').trim().toLowerCase();
  return /^[a-z0-9][a-z0-9_-]{0,63}$/.test(normalized) ? normalized : null;
}

function normalizeOptionalAttributionId(value: unknown): string | null {
  const normalized = String(value || '').trim();
  return /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(normalized) ? normalized : null;
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
