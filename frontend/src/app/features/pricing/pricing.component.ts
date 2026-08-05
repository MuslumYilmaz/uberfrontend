// src/app/features/pricing/pricing.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
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
  paymentsEnabled = true;
  paymentsConfigReady = false;
  checkoutAvailability: Partial<Record<PlanId, boolean>> | null = null;

  constructor(
    private analytics: AnalyticsService,
    private billingCheckout: BillingCheckoutService,
  ) { }

  ngOnInit(): void {
    this.analytics.track('pricing_viewed', {
      src: 'pricing_page',
      page: 'pricing',
      page_layout: PRICING_PAGE_LAYOUT,
      recommended_plan: RECOMMENDED_PRICING_PLAN,
    });

    if (typeof window !== 'undefined') {
      void this.loadCheckoutConfig();
    }
  }

  private async loadCheckoutConfig(): Promise<void> {
    const config = await this.billingCheckout.getCheckoutConfig();
    this.paymentsEnabled = config?.enabled ?? false;
    this.checkoutAvailability = config?.plans ?? null;
    this.paymentsConfigReady = true;
  }
}
