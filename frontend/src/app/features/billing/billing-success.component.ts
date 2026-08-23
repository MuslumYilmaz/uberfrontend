import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription, of, timer } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthService, User } from '../../core/services/auth.service';
import {
  BillingCheckoutService,
  CheckoutAttemptStatus,
  CheckoutAttemptStatusResult,
} from '../../core/services/billing-checkout.service';
import { isProActive } from '../../core/utils/entitlements.util';
import { sanitizeRedirectTarget } from '../../core/utils/redirect.util';
import { CheckoutIntentService } from '../../core/services/checkout-intent.service';

@Component({
  standalone: true,
  selector: 'app-billing-success',
  imports: [CommonModule, RouterModule],
  templateUrl: './billing-success.component.html',
  styleUrls: ['./billing-success.component.css'],
})
export class BillingSuccessComponent implements OnInit, OnDestroy {
  private static readonly CHECKOUT_PLAN_KEY = 'fa:checkout:last_plan_id';
  private static readonly CHECKOUT_SOURCE_KEY = 'fa:checkout:last_source';

  state = signal<'syncing' | 'ready' | 'timeout' | 'error' | 'login-required' | 'pending-user-match'>('syncing');
  errorMessage = signal<string | null>(null);
  attempts = signal(0);
  attemptId = signal<string | null>(null);
  attemptStatus = signal<CheckoutAttemptStatus | null>(null);
  loginRedirectTo = signal('/billing/success');

  private pollSub?: Subscription;
  private readonly pollConfig = this.resolvePollConfig();
  private checkoutPlanId: string | null = null;
  private checkoutSource: string | null = null;
  private checkoutSurface: string | null = null;
  private checkoutVerifiedTracked = false;
  private premiumChallengeTracked = false;

  constructor(
    private auth: AuthService,
    private billingCheckout: BillingCheckoutService,
    private router: Router,
    private route: ActivatedRoute,
    private analytics: AnalyticsService,
    private checkoutIntent: CheckoutIntentService,
  ) { }

  ngOnInit(): void {
    this.hydrateCheckoutContext();
    const attemptId = this.attemptId();
    if (attemptId && typeof window !== 'undefined') {
      this.billingCheckout.recordAttemptClientState(attemptId, 'success_redirected').subscribe({
        error: () => undefined,
      });
    }
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  private resolvePollConfig(): { maxAttempts: number; intervalMs: number } {
    if (typeof window !== 'undefined') {
      const config = (window as any).__billingPollConfig;
      if (config && typeof config === 'object') {
        const maxAttempts = Number(config.maxAttempts);
        const intervalMs = Number(config.intervalMs);
        if (Number.isFinite(maxAttempts) && Number.isFinite(intervalMs)) {
          return { maxAttempts, intervalMs };
        }
      }
    }
    return { maxAttempts: 15, intervalMs: 2000 };
  }

  private hydrateCheckoutContext(): void {
    const attemptId = this.route.snapshot.queryParamMap.get('attempt');
    if (attemptId) {
      this.attemptId.set(attemptId);
    }
    this.loginRedirectTo.set(this.resolveLoginRedirectTarget(attemptId));

    const intent = this.checkoutIntent.load();
    if (intent) {
      this.checkoutPlanId = intent.planId;
      this.checkoutSource = intent.src;
      this.checkoutSurface = intent.surface;
    }

    if (typeof window !== 'undefined') {
      try {
        const planId = sessionStorage.getItem(BillingSuccessComponent.CHECKOUT_PLAN_KEY);
        const source = sessionStorage.getItem(BillingSuccessComponent.CHECKOUT_SOURCE_KEY);
        if (!this.checkoutPlanId && this.isPlanId(planId)) this.checkoutPlanId = planId;
        if (!this.checkoutSource && source && /^[a-z0-9_-]{1,64}$/i.test(source)) {
          this.checkoutSource = source.toLowerCase();
        }
      } catch { }
    }
  }

  private resolveLoginRedirectTarget(attemptId: string | null): string {
    const fallback = attemptId
      ? `/billing/success?attempt=${encodeURIComponent(attemptId)}`
      : '/billing/success';
    const currentUrl = String(this.router.url || '').trim();
    if (!currentUrl || currentUrl === '/') {
      return fallback;
    }
    return sanitizeRedirectTarget(currentUrl, fallback);
  }

  startPolling(): void {
    this.pollSub?.unsubscribe();
    this.state.set('syncing');
    this.errorMessage.set(null);
    this.attempts.set(0);
    this.attemptStatus.set(null);
    let tries = 0;
    const attemptId = this.attemptId();

    this.pollSub = timer(0, this.pollConfig.intervalMs)
      .pipe(
        switchMap(() =>
          attemptId
            ? this.billingCheckout.fetchAttemptStatus(attemptId).pipe(
              catchError(() => {
                this.errorMessage.set('Unable to verify payment yet. Retrying...');
                return of({ attempt: null, status: 0 } satisfies CheckoutAttemptStatusResult);
              })
            )
            : this.auth.fetchMeStatus().pipe(
              catchError(() => {
                this.errorMessage.set('Unable to refresh your session. Retrying...');
                return of({ user: null, status: 0 });
              })
            )
        )
      )
      .subscribe((result) => {
        tries += 1;
        this.attempts.set(tries);

        if (attemptId) {
          this.handleAttemptPollingResult(result as CheckoutAttemptStatusResult, tries);
          return;
        }

        this.handleLegacyPollingResult(result as { user: User | null; status: number }, tries);
      });
  }

  private handleAttemptPollingResult(result: CheckoutAttemptStatusResult, tries: number): void {
    if (result.status === 401 || result.status === 403) {
      this.state.set('login-required');
      this.pollSub?.unsubscribe();
      return;
    }

    if (result.status === 404) {
      this.state.set('error');
      this.errorMessage.set('We could not find this checkout attempt. Please contact support if you were charged.');
      this.pollSub?.unsubscribe();
      return;
    }

    if (result.attempt) {
      this.attemptStatus.set(result.attempt);

      if (result.attempt.state === 'applied' && result.attempt.entitlementActive) {
        this.trackCheckoutVerified(result.attempt);
        this.finishPolling(result.attempt);
        return;
      }

      if (result.attempt.state === 'pending_user_match') {
        this.state.set('pending-user-match');
        this.pollSub?.unsubscribe();
        return;
      }

      if (result.attempt.state === 'failed' || result.attempt.state === 'expired') {
        this.state.set('error');
        this.errorMessage.set(
          result.attempt.lastErrorMessage || 'We could not confirm this payment automatically. Please contact support.'
        );
        this.pollSub?.unsubscribe();
        return;
      }
    }

    if (tries >= this.pollConfig.maxAttempts) {
      console.warn('[billing] checkout attempt still awaiting webhook after polling', {
        attemptId: this.attemptId(),
      });
      this.state.set('timeout');
      this.pollSub?.unsubscribe();
    }
  }

  private handleLegacyPollingResult(
    result: { user: User | null; status: number },
    tries: number
  ): void {
    if (result.status === 401 || result.status === 403) {
      this.state.set('login-required');
      this.pollSub?.unsubscribe();
      return;
    }

    if (result.user && isProActive(result.user)) {
      this.trackCheckoutVerified();
      this.finishPolling();
      return;
    }

    if (tries >= this.pollConfig.maxAttempts) {
      console.warn('[billing] entitlements still inactive after polling');
      this.state.set('timeout');
      this.pollSub?.unsubscribe();
    }
  }

  private trackCheckoutVerified(attempt?: CheckoutAttemptStatus): void {
    if (this.checkoutVerifiedTracked) return;
    this.checkoutVerifiedTracked = true;
    this.analytics.track('checkout_verified', {
      src: this.checkoutSource || attempt?.purchase?.source || 'billing_success',
      surface: this.checkoutSurface || 'billing_success',
      plan_id: this.checkoutPlanId || attempt?.planId || null,
      provider: attempt?.provider || 'unknown',
      checkout_mode: attempt?.mode || 'unknown',
      entitlement_applied: true,
      ...this.serverOfferAnalytics(attempt),
    });
  }

  trackPremiumChallengeStarted(): void {
    if (this.premiumChallengeTracked || this.state() !== 'ready') return;
    this.premiumChallengeTracked = true;
    const attempt = this.attemptStatus();
    this.analytics.track('premium_challenge_started', {
      src: 'billing_success',
      surface: 'billing_success',
      entry_point: 'post_purchase_primary_cta',
      plan_id: attempt?.planId || this.checkoutPlanId,
      provider: attempt?.provider || 'unknown',
      entitlement_applied: true,
      ...this.serverOfferAnalytics(attempt || undefined),
    });
  }

  private serverOfferAnalytics(attempt?: CheckoutAttemptStatus): Record<string, string> {
    if (!attempt) return {};
    const campaignId = this.normalizeOfferToken(attempt.campaignId);
    const offerVersion = this.normalizeOfferToken(attempt.offerVersion);
    const checkoutSurface = attempt.checkoutSurface === 'overlay'
      ? 'overlay'
      : attempt.checkoutSurface === 'hosted_new_tab'
        ? 'hosted_new_tab'
        : null;
    return {
      ...(campaignId ? { offer_campaign_id: campaignId } : {}),
      ...(offerVersion ? { offer_version: offerVersion } : {}),
      ...(checkoutSurface ? { checkout_surface: checkoutSurface } : {}),
    };
  }

  private normalizeOfferToken(value: unknown): string | null {
    const normalized = String(value || '').trim().toLowerCase();
    return /^[a-z0-9][a-z0-9_-]{0,63}$/.test(normalized) ? normalized : null;
  }

  private finishPolling(attempt?: CheckoutAttemptStatus): void {
    this.clearCheckoutContext();
    this.pollSub?.unsubscribe();
    if (attempt?.offerVersion === 'interview_sprint_v2') {
      this.state.set('ready');
      this.errorMessage.set(null);
      return;
    }
    this.router.navigateByUrl('/profile').catch(() => void 0);
  }

  private clearCheckoutContext(): void {
    this.checkoutIntent.clear();
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(BillingSuccessComponent.CHECKOUT_PLAN_KEY);
      sessionStorage.removeItem(BillingSuccessComponent.CHECKOUT_SOURCE_KEY);
    } catch { }
  }

  private isPlanId(value: string | null): value is 'monthly' | 'quarterly' | 'annual' | 'lifetime' {
    return value === 'monthly' || value === 'quarterly' || value === 'annual' || value === 'lifetime';
  }
}
