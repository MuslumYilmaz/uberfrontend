// src/app/features/pricing/pricing.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  PRICING_BASELINE_OFFER_VERSION,
  PRICING_PAGE_LAYOUT,
  PRICING_V2_OFFER_VERSION,
  RECOMMENDED_PRICING_PLAN,
  PricingPlanDetails,
  PricingPlansSectionComponent,
} from './components/pricing-plans-section/pricing-plans-section.component';
import { AnalyticsService } from '../../core/services/analytics.service';
import { BillingCheckoutService, CheckoutSurface } from '../../core/services/billing-checkout.service';
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
        [planDetails]="planDetails"
        [offerVersion]="offerVersion"
        [checkoutSurface]="checkoutSurface"
        [analyticsReady]="paymentsConfigReady"
        [analyticsSource]="analyticsSource"
        analyticsSurface="pricing_page"
        ctaMode="checkout">
      </app-pricing-plans-section>
    </section>
    <app-conversion-sticky-cta surface="pricing"></app-conversion-sticky-cta>
  `
})
export class PricingComponent implements OnInit {
  paymentsEnabled = false;
  paymentsConfigReady = false;
  checkoutAvailability: Partial<Record<PlanId, boolean>> | null = null;
  planDetails: PricingPlanDetails | null = null;
  offerVersion = PRICING_BASELINE_OFFER_VERSION;
  checkoutSurface: CheckoutSurface = 'hosted_new_tab';
  analyticsSource = 'pricing_page';
  private pageViewTracked = false;

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
    if (typeof window !== 'undefined') {
      void this.loadCheckoutConfig();
    } else {
      this.trackPricingPageViewed();
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
    this.planDetails = config?.planDetails ?? null;
    this.offerVersion = config?.offerVersion ?? PRICING_BASELINE_OFFER_VERSION;
    this.checkoutSurface = config?.checkoutSurface ?? 'hosted_new_tab';
    this.paymentsConfigReady = true;
    this.trackPricingPageViewed();
  }

  private trackPricingPageViewed(): void {
    if (this.pageViewTracked) return;
    this.pageViewTracked = true;
    const isOfferV2 = this.offerVersion === PRICING_V2_OFFER_VERSION;
    this.analytics.track('pricing_page_viewed', {
      src: this.analyticsSource,
      surface: 'pricing_page',
      page: 'pricing',
      page_layout: isOfferV2 ? PRICING_V2_OFFER_VERSION : PRICING_PAGE_LAYOUT,
      offer_version: this.offerVersion,
      checkout_surface: this.checkoutSurface,
      recommended_plan: RECOMMENDED_PRICING_PLAN,
    });
  }
}
