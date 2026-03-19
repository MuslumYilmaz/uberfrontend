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

  state = signal<'syncing' | 'timeout' | 'error' | 'login-required' | 'pending-user-match'>('syncing');
  errorMessage = signal<string | null>(null);
  attempts = signal(0);
  attemptId = signal<string | null>(null);
  attemptStatus = signal<CheckoutAttemptStatus | null>(null);
  loginRedirectTo = signal('/billing/success');

  private pollSub?: Subscription;
  private readonly pollConfig = this.resolvePollConfig();

  constructor(
    private auth: AuthService,
    private billingCheckout: BillingCheckoutService,
    private router: Router,
    private route: ActivatedRoute,
    private analytics: AnalyticsService,
  ) { }

  ngOnInit(): void {
    this.trackCheckoutCompleted();
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

  private trackCheckoutCompleted() {
    const event: Record<string, unknown> = {
      src: 'billing_success',
      method: 'billing_success_page',
    };

    const attemptId = this.route.snapshot.queryParamMap.get('attempt');
    if (attemptId) {
      this.attemptId.set(attemptId);
      event['attempt_id'] = attemptId;
    }
    this.loginRedirectTo.set(this.resolveLoginRedirectTarget(attemptId));

    if (typeof window !== 'undefined') {
      try {
        const planId = sessionStorage.getItem(BillingSuccessComponent.CHECKOUT_PLAN_KEY);
        const source = sessionStorage.getItem(BillingSuccessComponent.CHECKOUT_SOURCE_KEY);
        if (planId) event['plan_id'] = planId;
        if (source) event['src'] = source;
        sessionStorage.removeItem(BillingSuccessComponent.CHECKOUT_PLAN_KEY);
        sessionStorage.removeItem(BillingSuccessComponent.CHECKOUT_SOURCE_KEY);
      } catch { }
    }

    this.analytics.track('checkout_completed', event);
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
        this.router.navigateByUrl('/profile').catch(() => void 0);
        this.pollSub?.unsubscribe();
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
      this.router.navigateByUrl('/profile').catch(() => void 0);
      this.pollSub?.unsubscribe();
      return;
    }

    if (tries >= this.pollConfig.maxAttempts) {
      console.warn('[billing] entitlements still inactive after polling');
      this.state.set('timeout');
      this.pollSub?.unsubscribe();
    }
  }
}
