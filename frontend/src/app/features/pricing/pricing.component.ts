// src/app/features/pricing/pricing.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  PRICING_PAGE_LAYOUT,
  RECOMMENDED_PRICING_PLAN,
  PricingPlansSectionComponent,
} from './components/pricing-plans-section/pricing-plans-section.component';
import { AnalyticsService } from '../../core/services/analytics.service';
import { BillingCheckoutService } from '../../core/services/billing-checkout.service';
import { PlanId } from '../../core/utils/payments-provider.util';

@Component({
  standalone: true,
  selector: 'app-pricing',
  imports: [CommonModule, RouterModule, PricingPlansSectionComponent],
  styleUrls: ['./pricing.component.css'],
  template: `
    <section class="pricing-page">
      <app-pricing-plans-section
        variant="full"
        [paymentsEnabled]="paymentsEnabled"
        [paymentsConfigReady]="paymentsConfigReady"
        [checkoutAvailability]="checkoutAvailability"
        analyticsSource="pricing_page"
        ctaMode="emit">
      </app-pricing-plans-section>
    </section>
  `
})
export class PricingComponent implements OnInit {
  private readonly SRC_PATTERN = /^[a-z0-9_-]{1,64}$/;
  paymentsEnabled = true;
  paymentsConfigReady = false;
  checkoutAvailability: Partial<Record<PlanId, boolean>> | null = null;

  constructor(
    private analytics: AnalyticsService,
    private billingCheckout: BillingCheckoutService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.analytics.track('pricing_viewed', {
      src: this.readSource(),
      page: 'pricing',
      page_layout: PRICING_PAGE_LAYOUT,
      recommended_plan: RECOMMENDED_PRICING_PLAN,
    });

    if (typeof window !== 'undefined') {
      void this.loadCheckoutConfig();
    }
  }

  private readSource(): string {
    const raw = String(this.route.snapshot.queryParamMap.get('src') || '')
      .trim()
      .toLowerCase();
    if (!raw || !this.SRC_PATTERN.test(raw)) return 'direct';
    return raw;
  }

  private async loadCheckoutConfig(): Promise<void> {
    const config = await this.billingCheckout.getCheckoutConfig();
    this.paymentsEnabled = config?.enabled ?? false;
    this.checkoutAvailability = config?.plans ?? null;
    this.paymentsConfigReady = true;
  }
}
