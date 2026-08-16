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
import { ConversionContextService } from '../../core/services/conversion-context.service';
import { PlanId } from '../../core/utils/payments-provider.util';
import { ConversionStickyCtaComponent } from '../../shared/components/conversion-sticky-cta/conversion-sticky-cta.component';

@Component({
  standalone: true,
  selector: 'app-pricing',
  imports: [CommonModule, RouterModule, PricingPlansSectionComponent, ConversionStickyCtaComponent],
  styleUrls: ['./pricing.component.css'],
  template: `
    <section class="pricing-page">
      <app-pricing-plans-section
        variant="full"
        [paymentsEnabled]="paymentsEnabled"
        [paymentsConfigReady]="paymentsConfigReady"
        [checkoutAvailability]="checkoutAvailability"
        [analyticsSource]="analyticsSource"
        analyticsSurface="pricing_page"
        ctaMode="emit">
      </app-pricing-plans-section>
    </section>
    <app-conversion-sticky-cta surface="pricing"></app-conversion-sticky-cta>
  `
})
export class PricingComponent implements OnInit {
  paymentsEnabled = true;
  paymentsConfigReady = false;
  checkoutAvailability: Partial<Record<PlanId, boolean>> | null = null;
  analyticsSource = 'pricing_page';

  constructor(
    private analytics: AnalyticsService,
    private billingCheckout: BillingCheckoutService,
    private conversionContext: ConversionContextService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    const context = this.conversionContext.resolvePricingContext(
      this.route.snapshot.queryParamMap.get('src'),
    );
    this.analyticsSource = context.src;
    this.analytics.track('pricing_page_viewed', {
      src: this.analyticsSource,
      surface: 'pricing_page',
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
    if (!config) {
      this.analytics.track('checkout_config_failed', {
        src: this.analyticsSource,
        surface: 'pricing_page',
        failure_reason: 'unavailable_after_retry',
      });
    }
    this.paymentsEnabled = config?.enabled ?? false;
    this.checkoutAvailability = config?.plans ?? null;
    this.paymentsConfigReady = true;
  }
}
