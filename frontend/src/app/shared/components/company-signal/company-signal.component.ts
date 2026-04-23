import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompanySignal, companySignalFor } from '../../company-branding';

@Component({
  selector: 'app-company-signal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      *ngIf="signal as item"
      class="fa-company-signal"
      [attr.aria-label]="item.ariaLabel"
      [attr.data-testid]="'company-signal-' + item.primary.slug"
    >
      <span class="fa-company-signal__mark" aria-hidden="true">
        <img
          *ngIf="item.primary.logoUrl; else fallbackMark"
          class="fa-company-signal__logo"
          [src]="item.primary.logoUrl"
          alt=""
          loading="lazy"
          decoding="async"
          data-testid="company-signal-logo"
        />
        <ng-template #fallbackMark>
          <span class="fa-company-signal__fallback" data-testid="company-signal-fallback">
            {{ item.primary.monogram }}
          </span>
        </ng-template>
      </span>
      <span class="fa-company-signal__label" aria-hidden="true">{{ item.primary.label }}</span>
      <span
        *ngIf="item.overflowCount > 0"
        class="fa-company-signal__more"
        aria-hidden="true"
        data-testid="company-signal-overflow"
      >
        +{{ item.overflowCount }}
      </span>
    </span>
  `,
  styleUrls: ['./company-signal.component.css'],
})
export class CompanySignalComponent {
  @Input() companies: readonly unknown[] | null | undefined = [];
  @Input() preferredSlug: string | null | undefined = null;

  get signal(): CompanySignal | null {
    return companySignalFor(this.companies, this.preferredSlug);
  }
}
