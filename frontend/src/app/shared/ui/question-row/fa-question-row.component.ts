import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Params, RouterModule } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';

import { CompanySignalComponent } from '../../components/company-signal/company-signal.component';
import { FaCardComponent } from '../card/fa-card.component';
import { FaGlyphComponent } from '../icon/fa-glyph.component';

export type FaQuestionRowMetaTone =
  | 'difficulty'
  | 'importance'
  | 'tech'
  | 'tier'
  | 'score'
  | 'access'
  | 'time'
  | 'neutral';

export type FaQuestionRowMetaChip = {
  label: string;
  ariaLabel: string;
  tone?: FaQuestionRowMetaTone;
  priority?: 'primary' | 'secondary';
};

export type FaQuestionRowVariant = {
  id: string;
  label: string;
  active?: boolean;
  ariaLabel: string;
};

@Component({
  selector: 'fa-question-row',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TooltipModule,
    CompanySignalComponent,
    FaCardComponent,
    FaGlyphComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *ngIf="hasLink(); else staticRow">
      <a
        faCard
        interactive
        class="fa-question-row"
        [attr.data-testid]="testId || null"
        [class.is-solved]="solved"
        [class.is-disabled]="disabled"
        [class.has-variants]="variants.length > 1"
        [routerLink]="routerLink"
        [queryParams]="queryParams"
        [state]="state"
        [attr.aria-disabled]="disabled ? 'true' : null"
        [attr.tabindex]="disabled ? -1 : null"
        (click)="handleRowClick($event)"
      >
        <ng-container [ngTemplateOutlet]="contentTpl"></ng-container>
      </a>
    </ng-container>

    <ng-template #staticRow>
      <div
        faCard
        class="fa-question-row fa-question-row--static"
        [attr.data-testid]="testId || null"
        [class.is-solved]="solved"
        [class.is-disabled]="disabled"
        [class.has-variants]="variants.length > 1"
        [attr.aria-disabled]="disabled ? 'true' : null"
        (click)="handleRowClick($event)"
      >
        <ng-container [ngTemplateOutlet]="contentTpl"></ng-container>
      </div>
    </ng-template>

    <ng-template #contentTpl>
      <div class="fa-question-row__content">
        <div class="fa-question-row__body">
          <div class="fa-question-row__topline">
            <span class="fa-question-row__kind" *ngIf="kindLabel">{{ kindLabel }}</span>
            <div class="fa-question-row__title fa-card-title">{{ title }}</div>
            <span
              class="fa-question-row__solved-mark"
              *ngIf="solved"
              [attr.data-testid]="solvedTestId()"
              aria-label="Solved"
              title="Solved"
            >
              <app-fa-glyph icon="check-circle" size="16"></app-fa-glyph>
            </span>
            <app-company-signal
              *ngIf="companies.length"
              class="fa-question-row__company-signal"
              [companies]="companies"
              [preferredSlug]="preferredCompanySlug"
            ></app-company-signal>
            <span class="fa-question-row__locked" *ngIf="lockedLabel">{{ lockedLabel }}</span>
          </div>

          <div
            class="fa-question-row__description fa-meta-text"
            *ngIf="description"
            [pTooltip]="descriptionTooltip || description"
            tooltipPosition="bottom"
            appendTo="body"
            [showDelay]="150"
            [hideDelay]="0"
            [autoHide]="true"
            [life]="0"
            [escape]="false"
            [tooltipDisabled]="!(descriptionTooltip || description)"
            tabindex="0"
          >
            {{ description }}
          </div>

          <div class="fa-question-row__variants" *ngIf="variants.length > 1">
            <button
              *ngFor="let variant of variants; trackBy: trackByVariant"
              type="button"
              class="fa-question-row__variant"
              [class.is-active]="variant.active"
              [attr.aria-label]="variant.ariaLabel"
              [attr.data-testid]="'question-row-variant-' + variant.id"
              (click)="handleVariantClick($event, variant)"
            >
              {{ variant.label }}
            </button>
          </div>
        </div>

        <div class="fa-question-row__meta" role="group" aria-label="Question metadata">
          <ng-container *ngFor="let chip of metaChips">
            <span
              *ngIf="isPrimaryMetaChip(chip)"
              class="fa-question-row__meta-chip"
              [ngClass]="metaToneClass(chip)"
              [attr.aria-label]="chip.ariaLabel"
            >
              <span class="fa-question-row__meta-mark" aria-hidden="true">{{ metaMark(chip) }}</span>
              <span class="fa-question-row__meta-label">{{ chip.label }}</span>
            </span>
          </ng-container>

          <span class="fa-question-row__sr-meta" *ngIf="secondaryMetaSummary()">
            {{ secondaryMetaSummary() }}
          </span>

          <span class="fa-question-row__chevron" *ngIf="hasLink() && !disabled" aria-hidden="true">
            <app-fa-glyph icon="chevron-right" size="16"></app-fa-glyph>
          </span>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    :host {
      display: block;
      min-width: 0;
    }

    .fa-question-row {
      display: block;
      min-height: 96px;
      padding: 12px 14px;
      overflow: visible;
      border-radius: var(--fa-radius-12);
      border-color: color-mix(in srgb, var(--fa-border-subtle) 82%, var(--fa-text-muted) 18%);
      background:
        linear-gradient(135deg, color-mix(in srgb, var(--fa-text) 4%, transparent), color-mix(in srgb, var(--fa-accent) 5%, transparent)),
        var(--fa-surface);
      color: inherit;
      text-decoration: none;
      box-shadow:
        0 8px 24px rgba(var(--fa-bg-rgb), 0.28),
        inset 0 1px 0 rgba(var(--fa-text-rgb), 0.04);
      will-change: auto;
    }

    .fa-question-row.fa-card--interactive:hover {
      transform: translateY(-1px);
      background:
        linear-gradient(135deg, color-mix(in srgb, var(--fa-text) 5%, transparent), color-mix(in srgb, var(--fa-accent) 8%, transparent)),
        color-mix(in srgb, var(--fa-surface) 92%, var(--fa-surface-alt) 8%);
      border-color: color-mix(in srgb, var(--fa-border-strong) 72%, var(--fa-accent) 28%);
      box-shadow: 0 14px 32px rgba(var(--fa-bg-rgb), 0.36);
    }

    .fa-question-row--static {
      cursor: default;
    }

    .fa-question-row.is-disabled {
      cursor: not-allowed;
      opacity: 0.86;
    }

    .fa-question-row.is-solved {
      border-color: color-mix(in srgb, var(--fa-border-subtle) 50%, var(--fa-accent) 50%);
      background: color-mix(in srgb, var(--fa-surface) 88%, var(--fa-accent) 12%);
      box-shadow:
        0 8px 24px rgba(var(--fa-bg-rgb), 0.28),
        0 0 0 1px color-mix(in srgb, var(--fa-accent) 34%, transparent);
    }

    .fa-question-row.has-variants {
      min-height: 108px;
    }

    .fa-question-row__content {
      display: grid;
      grid-template-columns: minmax(0, 1fr) fit-content(34rem);
      align-items: center;
      gap: 14px;
    }

    .fa-question-row.has-variants .fa-question-row__content {
      align-items: start;
    }

    .fa-question-row__body {
      min-width: 0;
    }

    .fa-question-row__topline {
      display: flex;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 6px 8px;
      min-width: 0;
    }

    .fa-question-row__kind {
      display: inline-flex;
      align-items: center;
      flex: 0 0 auto;
      min-height: 22px;
      padding: 3px 7px;
      border-radius: 7px;
      border: 1px solid color-mix(in srgb, var(--fa-border-subtle) 82%, var(--fa-text-muted) 18%);
      background: color-mix(in srgb, var(--fa-surface-alt) 74%, var(--fa-surface) 26%);
      color: color-mix(in srgb, var(--fa-text-muted) 86%, var(--fa-text) 14%);
      font-size: 10.5px;
      font-weight: 800;
      line-height: 1.1;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .fa-question-row__title {
      display: -webkit-box;
      flex: 1 1 18rem;
      min-width: 0;
      max-width: 100%;
      overflow: hidden;
      color: var(--fa-text);
      font-size: 15px;
      font-weight: 750;
      line-height: 1.28;
      text-overflow: ellipsis;
      white-space: normal;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    .fa-question-row__description {
      display: block;
      max-width: 100%;
      margin-top: 5px;
      overflow: hidden;
      color: color-mix(in srgb, var(--fa-text-muted) 76%, transparent);
      font-size: 12.5px;
      line-height: 1.35;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: help;
    }

    .fa-question-row__company-signal {
      flex: 0 1 auto;
      letter-spacing: 0;
    }

    .fa-question-row__solved-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      width: 24px;
      height: 24px;
      border-radius: 999px;
      color: color-mix(in srgb, var(--fa-accent) 82%, var(--fa-text) 18%);
      background: color-mix(in srgb, var(--fa-accent) 18%, var(--fa-surface));
      border: 1px solid color-mix(in srgb, var(--fa-accent) 52%, var(--fa-border-subtle) 48%);
      box-shadow: inset 0 1px 0 color-mix(in srgb, var(--fa-text) 6%, transparent);
    }

    .fa-question-row__locked {
      display: inline-flex;
      align-items: center;
      flex: 0 0 auto;
      min-height: 22px;
      padding: 3px 8px;
      border-radius: 999px;
      border: 1px solid color-mix(in srgb, var(--fa-accent) 40%, var(--fa-border-subtle));
      background: color-mix(in srgb, var(--fa-accent) 22%, transparent);
      color: var(--fa-text);
      font-size: 10.5px;
      font-weight: 800;
      line-height: 1.1;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .fa-question-row__variants {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 7px;
    }

    .fa-question-row__variant {
      min-height: 26px;
      border: 1px solid color-mix(in srgb, var(--fa-border-subtle) 82%, var(--fa-text-muted) 18%);
      border-radius: var(--fa-radius-8);
      background: color-mix(in srgb, var(--fa-surface-alt) 78%, var(--fa-surface) 22%);
      color: color-mix(in srgb, var(--fa-text-muted) 88%, var(--fa-text) 12%);
      font-size: 11px;
      font-weight: 750;
      line-height: 1.1;
      padding: 5px 8px;
      cursor: pointer;
      transition: background-color 0.12s ease, border-color 0.12s ease, color 0.12s ease, box-shadow 0.12s ease;
    }

    .fa-question-row__variant:hover {
      background: color-mix(in srgb, var(--fa-text) 6%, transparent);
      border-color: var(--fa-accent);
      color: var(--fa-text);
    }

    .fa-question-row__variant.is-active {
      background: var(--fa-accent-soft);
      border-color: var(--fa-accent);
      color: var(--fa-text);
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--fa-accent) 26%, transparent);
    }

    .fa-question-row__meta {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 6px;
      min-width: 0;
      max-width: 34rem;
    }

    .fa-question-row__meta-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 28px;
      padding: 5px 8px;
      border-radius: var(--fa-radius-pill);
      border: 1px solid color-mix(in srgb, var(--fa-border-subtle) 76%, var(--fa-text-muted) 24%);
      background: color-mix(in srgb, var(--fa-surface-alt) 78%, var(--fa-surface) 22%);
      color: var(--fa-text);
      font-size: 12px;
      font-weight: 650;
      line-height: 1.1;
      white-space: nowrap;
      box-shadow: inset 0 1px 0 color-mix(in srgb, var(--fa-text) 8%, transparent);
    }

    .fa-question-row__sr-meta {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .fa-question-row__meta-mark {
      display: inline-grid;
      place-items: center;
      width: 15px;
      height: 15px;
      border-radius: 4px;
      background: color-mix(in srgb, var(--fa-text) 8%, var(--fa-surface));
      color: inherit;
      font-size: 9px;
      font-weight: 900;
      line-height: 1;
      letter-spacing: 0;
    }

    .fa-question-row__meta-chip--difficulty {
      border-color: color-mix(in srgb, var(--fa-accent) 38%, var(--fa-border-subtle));
      background: color-mix(in srgb, var(--fa-accent) 12%, var(--fa-surface));
    }

    .fa-question-row__meta-chip--importance {
      border-color: color-mix(in srgb, var(--fa-accent-strong) 40%, var(--fa-border-subtle));
      background: color-mix(in srgb, var(--fa-accent-strong) 14%, var(--fa-surface));
    }

    .fa-question-row__meta-chip--tech,
    .fa-question-row__meta-chip--time {
      border-color: color-mix(in srgb, var(--fa-text-muted) 36%, var(--fa-border-subtle));
      background: color-mix(in srgb, var(--fa-text-muted) 10%, var(--fa-surface));
    }

    .fa-question-row__meta-chip--tier,
    .fa-question-row__meta-chip--score {
      border-color: color-mix(in srgb, var(--fa-accent) 42%, var(--fa-border-subtle));
      background: color-mix(in srgb, var(--fa-accent) 16%, var(--fa-surface));
    }

    .fa-question-row__meta-chip--access {
      border-color: color-mix(in srgb, var(--fa-accent-strong) 46%, var(--fa-border-subtle));
      background: color-mix(in srgb, var(--fa-accent-strong) 18%, var(--fa-surface));
    }

    .fa-question-row__chevron {
      display: inline-grid;
      place-items: center;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      border: 1px solid color-mix(in srgb, var(--fa-border-subtle) 80%, var(--fa-text-muted) 20%);
      background: color-mix(in srgb, var(--fa-surface-alt) 68%, transparent);
      color: color-mix(in srgb, var(--fa-text-muted) 72%, var(--fa-text) 28%);
      transition: border-color 150ms ease, color 150ms ease, transform 150ms ease;
    }

    .fa-question-row:hover .fa-question-row__chevron {
      border-color: color-mix(in srgb, var(--fa-accent) 46%, var(--fa-border-subtle));
      color: var(--fa-text);
      transform: translateX(1px);
    }

    @media (max-width: 760px) {
      .fa-question-row {
        min-height: 112px;
        padding: 10px;
      }

      .fa-question-row__content {
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .fa-question-row__topline {
        flex-wrap: wrap;
      }

      .fa-question-row__title {
        flex-basis: 100%;
      }

      .fa-question-row__meta {
        justify-content: flex-start;
        min-width: 0;
        max-width: 100%;
      }
    }

    @media (max-width: 460px) {
      .fa-question-row__title {
        flex-basis: 100%;
      }

      .fa-question-row__description {
        font-size: 12px;
      }
    }
  `],
})
export class FaQuestionRowComponent {
  @Input() testId?: string;
  @Input() title = '';
  @Input() description = '';
  @Input() descriptionTooltip = '';
  @Input() kindLabel = '';
  @Input() routerLink: string | any[] | null = null;
  @Input() queryParams: Params | null = null;
  @Input() state: { [k: string]: any } | undefined = undefined;
  @Input() disabled = false;
  @Input() solved = false;
  @Input() lockedLabel = '';
  @Input() companies: readonly unknown[] = [];
  @Input() preferredCompanySlug: string | null | undefined = null;
  @Input() metaChips: readonly FaQuestionRowMetaChip[] = [];
  @Input() variants: readonly FaQuestionRowVariant[] = [];

  @Output() rowClick = new EventEmitter<Event>();
  @Output() variantSelected = new EventEmitter<FaQuestionRowVariant>();

  hasLink(): boolean {
    if (Array.isArray(this.routerLink)) return this.routerLink.length > 0;
    return typeof this.routerLink === 'string' && this.routerLink.length > 0;
  }

  handleRowClick(event: Event): void {
    if (this.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    this.rowClick.emit(event);
  }

  handleVariantClick(event: Event, variant: FaQuestionRowVariant): void {
    event.preventDefault();
    event.stopPropagation();
    this.variantSelected.emit(variant);
  }

  trackByVariant = (_: number, variant: FaQuestionRowVariant): string => variant.id;

  isPrimaryMetaChip(chip: FaQuestionRowMetaChip): boolean {
    return chip.priority !== 'secondary';
  }

  secondaryMetaSummary(): string {
    const labels = this.metaChips
      .filter((chip) => chip.priority === 'secondary')
      .map((chip) => chip.ariaLabel)
      .filter((label) => label.trim().length > 0);

    return labels.length ? `Additional metadata: ${labels.join(', ')}` : '';
  }

  metaToneClass(chip: FaQuestionRowMetaChip): string {
    return `fa-question-row__meta-chip--${chip.tone || 'neutral'}`;
  }

  metaMark(chip: FaQuestionRowMetaChip): string {
    const tone = chip.tone || 'neutral';
    if (tone === 'tech') return '*';
    if (tone === 'score') return '#';
    if (tone === 'time') return 'T';
    if (tone === 'access') return '$';
    const first = (chip.label || '').trim().charAt(0);
    return first ? first.toUpperCase() : '-';
  }

  solvedTestId(): string | null {
    if (!this.testId?.startsWith('question-card-')) return null;
    return `question-card-solved-mark-${this.testId.slice('question-card-'.length)}`;
  }
}
