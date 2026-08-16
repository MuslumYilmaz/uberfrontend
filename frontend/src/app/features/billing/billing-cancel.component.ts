import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AnalyticsService } from '../../core/services/analytics.service';
import { OnboardingService } from '../../core/services/onboarding.service';
import { BillingCheckoutService } from '../../core/services/billing-checkout.service';
import { CheckoutIntentService } from '../../core/services/checkout-intent.service';
import {
  freeChallengeForFramework,
  frameworkLabel,
  preferredFramework,
  timelineLabel,
} from '../../core/utils/onboarding-personalization.util';

@Component({
  standalone: true,
  selector: 'app-billing-cancel',
  imports: [CommonModule, RouterModule],
  templateUrl: './billing-cancel.component.html',
  styleUrls: ['./billing-cancel.component.css'],
})
export class BillingCancelComponent implements OnInit {
  private static readonly CHECKOUT_PLAN_KEY = 'fa:checkout:last_plan_id';
  private static readonly CHECKOUT_SOURCE_KEY = 'fa:checkout:last_source';

  planId: string | null = null;
  attemptId: string | null = null;
  source = 'billing_cancel';
  surface = 'billing_cancel';
  freeChallengeRoute: any[] = ['/react', 'coding', 'react-counter'];
  freeChallengeLabel = 'Try free challenge';
  personalizedHint = 'You can continue with free questions and upgrade only when you need deeper premium sets.';

  constructor(
    private analytics: AnalyticsService,
    private route: ActivatedRoute,
    private onboarding: OnboardingService,
    private billingCheckout: BillingCheckoutService,
    private checkoutIntent: CheckoutIntentService,
  ) { }

  ngOnInit(): void {
    this.hydrateCheckoutContext();
    const event: Record<string, unknown> = {
      src: this.source,
      surface: this.surface,
      method: 'billing_cancel_page',
    };
    if (this.planId) event['plan_id'] = this.planId;

    const attemptId = this.route.snapshot.queryParamMap.get('attempt');
    if (attemptId) {
      this.attemptId = attemptId;
      event['attempt_id'] = attemptId;
      if (typeof window !== 'undefined') {
        this.billingCheckout.recordAttemptClientState(attemptId, 'cancel_redirected').subscribe({
          error: () => undefined,
        });
      }
    }

    const profile = this.onboarding.getProfile();
    const framework = preferredFramework(profile);
    const challenge = freeChallengeForFramework(framework);
    this.freeChallengeRoute = challenge.route;
    this.freeChallengeLabel = challenge.label;

    if (profile) {
      this.personalizedHint = `Your ${frameworkLabel(framework)} ${timelineLabel(profile.timeline)} can keep moving on free questions today.`;
      event['framework'] = profile.framework;
      event['timeline'] = profile.timeline;
      event['target_role'] = profile.targetRole;
    }

    this.analytics.track('checkout_canceled', event);
    this.clearCheckoutContext();
  }

  trackWinback(action: string): void {
    const profile = this.onboarding.getProfile();
    this.analytics.track('checkout_cancel_winback_clicked', {
      action,
      plan_id: this.planId,
      attempt_id: this.attemptId,
      src: this.source,
      surface: this.surface,
      framework: profile?.framework ?? null,
      timeline: profile?.timeline ?? null,
      target_role: profile?.targetRole ?? null,
    });
  }

  private hydrateCheckoutContext(): void {
    const intent = this.checkoutIntent.load();
    if (intent) {
      this.planId = intent.planId;
      this.source = intent.src;
      this.surface = intent.surface;
    }

    if (typeof window === 'undefined') return;
    try {
      const planId = sessionStorage.getItem(BillingCancelComponent.CHECKOUT_PLAN_KEY);
      const source = sessionStorage.getItem(BillingCancelComponent.CHECKOUT_SOURCE_KEY);
      if (!this.planId && this.isPlanId(planId)) this.planId = planId;
      if (this.source === 'billing_cancel' && source && /^[a-z0-9_-]{1,64}$/i.test(source)) {
        this.source = source.toLowerCase();
      }
    } catch { }
  }

  private clearCheckoutContext(): void {
    this.checkoutIntent.clear();
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(BillingCancelComponent.CHECKOUT_PLAN_KEY);
      sessionStorage.removeItem(BillingCancelComponent.CHECKOUT_SOURCE_KEY);
    } catch { }
  }

  private isPlanId(value: string | null): value is 'monthly' | 'quarterly' | 'annual' | 'lifetime' {
    return value === 'monthly' || value === 'quarterly' || value === 'annual' || value === 'lifetime';
  }
}
