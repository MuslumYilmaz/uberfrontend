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
  styles: [`
    :host {
      display: inline-flex;
      min-width: 0;
      max-width: 100%;
    }

    .fa-company-signal {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      max-width: 100%;
      padding: 2px 7px 2px 2px;
      border: 1px solid color-mix(in srgb, var(--fa-border-subtle, rgba(255, 255, 255, 0.16)) 80%, var(--fa-text, #fff) 20%);
      border-radius: 999px;
      background: color-mix(in srgb, var(--fa-surface-alt, #121821) 88%, var(--fa-text, #fff) 12%);
      color: color-mix(in srgb, var(--fa-text-muted, #a9b0bc) 84%, var(--fa-text, #fff) 16%);
      line-height: 1;
      text-transform: none;
      letter-spacing: 0;
    }

    .fa-company-signal__mark {
      width: 28px;
      height: 28px;
      border-radius: 999px;
      display: inline-grid;
      place-items: center;
      flex: 0 0 auto;
      border: 1px solid color-mix(in srgb, var(--fa-border-subtle, rgba(255, 255, 255, 0.16)) 72%, var(--fa-text, #fff) 28%);
      background: color-mix(in srgb, var(--fa-bg, #05070a) 70%, var(--fa-text, #fff) 30%);
      overflow: hidden;
    }

    .fa-company-signal__logo {
      width: 18px;
      height: 18px;
      object-fit: contain;
      filter: invert(1) brightness(1.18);
      opacity: 0.94;
    }

    .fa-company-signal__fallback {
      font-size: 11px;
      font-weight: 900;
      color: var(--fa-text, #fff);
    }

    .fa-company-signal__label {
      min-width: 0;
      max-width: 96px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 11px;
      font-weight: 850;
    }

    .fa-company-signal__more {
      flex: 0 0 auto;
      font-size: 10.5px;
      font-weight: 900;
      color: color-mix(in srgb, var(--fa-text-muted, #a9b0bc) 78%, var(--fa-text, #fff) 22%);
    }

    @media (max-width: 640px) {
      .fa-company-signal {
        gap: 5px;
        padding-right: 6px;
      }

      .fa-company-signal__mark {
        width: 26px;
        height: 26px;
      }

      .fa-company-signal__logo {
        width: 17px;
        height: 17px;
      }

      .fa-company-signal__label {
        max-width: 78px;
      }
    }
  `],
})
export class CompanySignalComponent {
  @Input() companies: readonly unknown[] | null | undefined = [];
  @Input() preferredSlug: string | null | undefined = null;

  get signal(): CompanySignal | null {
    return companySignalFor(this.companies, this.preferredSlug);
  }
}

