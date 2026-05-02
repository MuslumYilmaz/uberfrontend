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
            <div
              class="fa-question-row__title fa-card-title"
              [attr.data-testid]="testId ? 'question-row-title-' + testId : null"
            >
              {{ title }}
            </div>
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
  styleUrls: ['./fa-question-row.component.css'],
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
