import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CompanyBrand, companyBrandFor } from '../../company-branding';

@Component({
  selector: 'app-company-logo-mark',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      *ngIf="brand as item"
      class="fa-company-logo-mark"
      [attr.aria-hidden]="decorative ? 'true' : null"
      [attr.aria-label]="decorative ? null : accessibleLabel(item)"
      [attr.data-testid]="'company-logo-mark-' + item.slug"
    >
      <img
        *ngIf="item.logoUrl; else fallbackMark"
        class="fa-company-logo-mark__image"
        [src]="item.logoUrl"
        alt=""
        loading="lazy"
        decoding="async"
      />
      <ng-template #fallbackMark>
        <span class="fa-company-logo-mark__fallback">{{ item.monogram }}</span>
      </ng-template>
    </span>
  `,
  styleUrls: ['./company-logo-mark.component.css'],
})
export class CompanyLogoMarkComponent {
  @Input() company: unknown;
  @Input() decorative = false;
  @Input() labelPrefix = 'Company logo';

  get brand(): CompanyBrand | null {
    return companyBrandFor(this.company);
  }

  accessibleLabel(item: CompanyBrand): string {
    return this.labelPrefix ? `${this.labelPrefix}: ${item.label}` : item.label;
  }
}
