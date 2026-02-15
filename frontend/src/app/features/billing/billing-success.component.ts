import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subscription, of, timer } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthService } from '../../core/services/auth.service';
import { isProActive } from '../../core/utils/entitlements.util';

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

  state = signal<'syncing' | 'timeout' | 'error' | 'login-required'>('syncing');
  errorMessage = signal<string | null>(null);
  attempts = signal(0);

  private pollSub?: Subscription;
  private readonly pollConfig = this.resolvePollConfig();

  constructor(
    private auth: AuthService,
    private router: Router,
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

  startPolling(): void {
    this.pollSub?.unsubscribe();
    this.state.set('syncing');
    this.errorMessage.set(null);
    this.attempts.set(0);
    let tries = 0;

    this.pollSub = timer(0, this.pollConfig.intervalMs)
      .pipe(
        switchMap(() =>
          this.auth.fetchMeStatus().pipe(
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
      });
  }
}
