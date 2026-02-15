import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AnalyticsService } from '../../core/services/analytics.service';
import { OnboardingService } from '../../core/services/onboarding.service';
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
  source = 'billing_cancel';
  freeChallengeRoute: any[] = ['/react', 'coding', 'react-counter'];
  freeChallengeLabel = 'Try free challenge';
  personalizedHint = 'You can continue with free questions and upgrade only when you need deeper premium sets.';

  constructor(
    private analytics: AnalyticsService,
    private onboarding: OnboardingService,
  ) { }

  ngOnInit(): void {
    const event: Record<string, unknown> = {
      src: 'billing_cancel',
      method: 'billing_cancel_page',
    };

    if (typeof window !== 'undefined') {
      try {
        const planId = sessionStorage.getItem(BillingCancelComponent.CHECKOUT_PLAN_KEY);
        const source = sessionStorage.getItem(BillingCancelComponent.CHECKOUT_SOURCE_KEY);
        this.planId = planId || null;
        if (planId) event['plan_id'] = planId;
        if (source) {
          this.source = source;
          event['src'] = source;
        }
        sessionStorage.removeItem(BillingCancelComponent.CHECKOUT_PLAN_KEY);
        sessionStorage.removeItem(BillingCancelComponent.CHECKOUT_SOURCE_KEY);
      } catch { }
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
  }

  trackWinback(action: string): void {
    const profile = this.onboarding.getProfile();
    this.analytics.track('checkout_cancel_winback_clicked', {
      action,
      plan_id: this.planId,
      src: this.source,
      framework: profile?.framework ?? null,
      timeline: profile?.timeline ?? null,
      target_role: profile?.targetRole ?? null,
    });
  }
}
