// src/app/features/pricing/pricing.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PricingPlansSectionComponent } from './components/pricing-plans-section/pricing-plans-section.component';
import { environment } from '../../../environments/environment';
import {
  buildCheckoutUrls,
  hasCheckoutUrls,
  resolvePaymentsProvider,
} from '../../core/utils/payments-provider.util';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ExperimentService } from '../../core/services/experiment.service';

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
        [checkoutUrls]="checkoutUrls"
        [riskReversalPlacement]="riskReversalPlacement"
        analyticsSource="pricing_page"
        ctaMode="emit">
      </app-pricing-plans-section>
    </section>
  `
})
export class PricingComponent implements OnInit {
  private readonly SRC_PATTERN = /^[a-z0-9_-]{1,64}$/;
  paymentsProvider = resolvePaymentsProvider(environment);
  checkoutUrls = buildCheckoutUrls(this.paymentsProvider, environment);
  paymentsEnabled = hasCheckoutUrls(this.checkoutUrls);
  riskReversalPlacement: 'top' | 'after_plans' = 'top';

  constructor(
    private analytics: AnalyticsService,
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
  }

  private readSource(): string {
    const raw = String(this.route.snapshot.queryParamMap.get('src') || '')
      .trim()
      .toLowerCase();
    if (!raw || !this.SRC_PATTERN.test(raw)) return 'direct';
    return raw;
  }
}
