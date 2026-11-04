// src/app/features/pricing/pricing.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  PRICING_PAGE_LAYOUT,
  RECOMMENDED_PRICING_PLAN,
  PricingPlanDetails,
  PricingPlansSectionComponent,
} from './components/pricing-plans-section/pricing-plans-section.component';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthService } from '../../core/services/auth.service';
import { BillingCheckoutService, CheckoutSurface, RegionalPricing } from '../../core/services/billing-checkout.service';
import { CheckoutIntentService } from '../../core/services/checkout-intent.service';
import { ConversionContextService } from '../../core/services/conversion-context.service';
import { isProActive } from '../../core/utils/entitlements.util';
import { isSprintOfferVersion, PRERENDER_OFFER_VERSION } from '../../core/utils/offer-version.util';
import { PRERENDER_PLAN_DETAILS } from '../../generated/pricing-defaults';
import { PlanId } from '../../core/utils/payments-provider.util';
import { ConversionStickyCtaComponent } from '../../shared/components/conversion-sticky-cta/conversion-sticky-cta.component';
import { CompanyPlanPricingStripComponent } from '../company/company-plan/company-plan-pricing-strip.component';
import type { CompanyPlanData } from '../company/company-plan/company-plan.engine';
import { companyPlanPricingCopy } from '../company/company-plan/company-plan.format';
import { CompanyPlanService } from '../company/company-plan/company-plan.service';

const COMPANY_PLAN_SOURCE = /^company_plan_(?!general$)[a-z0-9_-]+$/;

@Component({
    selector: 'app-pricing',
    imports: [CommonModule, RouterModule, PricingPlansSectionComponent, ConversionStickyCtaComponent, CompanyPlanPricingStripComponent],
    styleUrls: ['./pricing.component.css'],
    template: `
    <section class="pricing-page">
      @if (waitingPlan(); as waiting) {
        <app-company-plan-pricing-strip [copy]="waiting"></app-company-plan-pricing-strip>
      }
      <app-pricing-plans-section
        variant="full"
        [paymentsEnabled]="paymentsEnabled"
        [paymentsConfigReady]="paymentsConfigReady"
        [checkoutAvailability]="checkoutAvailability"
        [planDetails]="planDetails"
        [offerVersion]="offerVersion"
        [regionalPricing]="regionalPricing"
        [checkoutSurface]="checkoutSurface"
        [analyticsReady]="paymentsConfigReady"
        [analyticsSource]="analyticsSource"
        analyticsSurface="pricing_page"
        ctaMode="checkout"
        [recommendedPlan]="waitingPlan()?.recommendedPlan ?? defaultRecommendedPlan"
        [featureLead]="waitingPlan()?.lead ?? null">
      </app-pricing-plans-section>
    </section>
    <app-conversion-sticky-cta surface="pricing"></app-conversion-sticky-cta>
  `
})
export class PricingComponent implements OnInit {
  paymentsEnabled = false;
  paymentsConfigReady = false;
  checkoutAvailability: Partial<Record<PlanId, boolean>> | null = null;
  // Prerender contract: the static HTML shows the sprint layout and the default
  // prices, so hydration confirms them instead of swapping the page. The checkout
  // config replaces both; buttons stay disabled until it arrives.
  planDetails: PricingPlanDetails | null = PRERENDER_PLAN_DETAILS;
  offerVersion = PRERENDER_OFFER_VERSION;
  // Regional prices arrive with the config; the prerender carries list prices.
  regionalPricing: RegionalPricing | null = null;
  checkoutSurface: CheckoutSurface = 'hosted_new_tab';
  analyticsSource = 'pricing_page';
  private pageViewTracked = false;

  readonly defaultRecommendedPlan = RECOMMENDED_PRICING_PLAN;

  // Injected on every visit, so a draft made as a guest reaches the account once the person signs in on the way.
  private readonly companyPlans = inject(CompanyPlanService);
  private readonly auth = inject(AuthService);
  private readonly checkoutIntent = inject(CheckoutIntentService);
  private readonly planData = signal<CompanyPlanData | null>(null);

  /** The plan someone came here to unlock. Premium members have it already. */
  readonly waitingPlan = computed(() => {
    const data = this.planData();
    const answers = this.companyPlans.answers();
    if (!data || !answers || isProActive(this.auth.user())) return null;
    const plan = this.companyPlans.buildPlan(data, answers);
    return plan.general ? null : companyPlanPricingCopy(data, answers, plan);
  });

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
      this.loadWaitingPlan();
      void this.loadCheckoutConfig();
    } else {
      this.trackPricingPageViewed();
    }
  }

  /** Signing in on the way drops the source from the address, so the saved checkout choice still names it. */
  private loadWaitingPlan(): void {
    const sources = [this.analyticsSource, this.checkoutIntent.load()?.src];
    if (!sources.some((source) => COMPANY_PLAN_SOURCE.test(source ?? ''))) return;
    this.companyPlans.loadData().subscribe((data) => this.planData.set(data));
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
    this.planDetails = config?.planDetails ?? PRERENDER_PLAN_DETAILS;
    this.offerVersion = config?.offerVersion ?? PRERENDER_OFFER_VERSION;
    this.regionalPricing = config?.pricing?.regional ?? null;
    this.checkoutSurface = config?.checkoutSurface ?? 'hosted_new_tab';
    this.paymentsConfigReady = true;
    this.trackPricingPageViewed();
  }

  private trackPricingPageViewed(): void {
    if (this.pageViewTracked) return;
    this.pageViewTracked = true;
    const isSprintLayout = isSprintOfferVersion(this.offerVersion);
    this.analytics.track('pricing_page_viewed', {
      src: this.analyticsSource,
      surface: 'pricing_page',
      page: 'pricing',
      page_layout: isSprintLayout ? this.offerVersion : PRICING_PAGE_LAYOUT,
      offer_version: this.offerVersion,
      checkout_surface: this.checkoutSurface,
      recommended_plan: this.waitingPlan()?.recommendedPlan ?? RECOMMENDED_PRICING_PLAN,
    });
  }
}
