// src/app/features/pricing/pricing.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PricingPlansSectionComponent } from './components/pricing-plans-section/pricing-plans-section.component';

@Component({
  standalone: true,
  selector: 'app-pricing',
  imports: [CommonModule, RouterModule, PricingPlansSectionComponent],
  styleUrls: ['./pricing.component.css'],
  template: `
    <section class="pricing-page">
      <app-pricing-plans-section
        variant="full"
        [paymentsEnabled]="false"
        ctaMode="emit">
      </app-pricing-plans-section>
    </section>
  `
})
export class PricingComponent { }
