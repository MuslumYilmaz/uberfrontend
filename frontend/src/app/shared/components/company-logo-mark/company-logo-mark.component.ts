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
  styles: [`
    :host {
      display: inline-flex;
      flex: 0 0 auto;
    }

    .fa-company-logo-mark {
      width: var(--fa-company-logo-size, 44px);
      height: var(--fa-company-logo-size, 44px);
      border-radius: var(--fa-company-logo-radius, 14px);
      display: inline-grid;
      place-items: center;
      border: 1px solid color-mix(in srgb, var(--uf-border-subtle, rgba(255, 255, 255, 0.16)) 70%, var(--uf-text-primary, #fff) 30%);
      background:
        radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--uf-text-primary, #fff) 14%, transparent), transparent 34%),
        color-mix(in srgb, var(--uf-surface-alt, #141922) 84%, var(--uf-text-primary, #fff) 16%);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
      overflow: hidden;
    }

    .fa-company-logo-mark__image {
      width: var(--fa-company-logo-image-size, 22px);
      height: var(--fa-company-logo-image-size, 22px);
      object-fit: contain;
      filter: invert(1) brightness(1.16);
      opacity: 0.94;
    }

    .fa-company-logo-mark__fallback {
      color: var(--uf-text-primary, #fff);
      font-size: 15px;
      font-weight: 900;
      line-height: 1;
    }
  `],
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
