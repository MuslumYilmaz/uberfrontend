import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CompanyPlanPricingCopy } from './company-plan.format';

/** The plan someone built, on top of the pricing page, with the way back to it. */
@Component({
  selector: 'app-company-plan-pricing-strip',
  imports: [RouterLink],
  templateUrl: './company-plan-pricing-strip.component.html',
  styleUrls: ['./company-plan-pricing-strip.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyPlanPricingStripComponent {
  readonly copy = input.required<CompanyPlanPricingCopy>();
}
