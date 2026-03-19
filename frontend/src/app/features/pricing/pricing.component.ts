// src/app/features/pricing/pricing.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PricingPlansSectionComponent } from './components/pricing-plans-section/pricing-plans-section.component';
import { AnalyticsService } from '../../core/services/analytics.service';
import { BillingCheckoutService } from '../../core/services/billing-checkout.service';
import { ExperimentService } from '../../core/services/experiment.service';
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
        [riskReversalPlacement]="riskReversalPlacement"
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
  riskReversalPlacement: 'top' | 'after_plans' = 'top';

  constructor(
    private analytics: AnalyticsService,
    private billingCheckout: BillingCheckoutService,
    private experiments: ExperimentService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.riskReversalPlacement = this.experiments.variant(
      'pricing_risk_reversal_placement_v1',
      'pricing_page',
    );
    this.experiments.expose(
      'pricing_risk_reversal_placement_v1',
      this.riskReversalPlacement,
      'pricing_page',
      'pricing_page',
    );

    this.analytics.track('pricing_viewed', {
      src: this.readSource(),
      page: 'pricing',
      risk_reversal_variant: this.riskReversalPlacement,
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
