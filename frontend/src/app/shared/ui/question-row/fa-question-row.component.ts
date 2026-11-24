import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Params, RouterModule } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';

import { CompanySignalComponent } from '../../components/company-signal/company-signal.component';
import { FaCardComponent } from '../card/fa-card.component';
import { FaGlyphComponent } from '../icon/fa-glyph.component';
import { StripInlineMarkupPipe } from '../inline-code/strip-inline-markup.pipe';

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
    imports: [
        CommonModule,
        RouterModule,
        TooltipModule,
        CompanySignalComponent,
        FaCardComponent,
        FaGlyphComponent,
        StripInlineMarkupPipe,
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
        [routerLink]="routeLink"
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
        <span
          class="fa-question-row__status"
          [class.is-solved]="solved"
          [class.is-todo]="isTodo()"
          [class.is-in-progress]="isInProgress()"
          [class.fa-question-row__locked]="isLockedRow()"
          [attr.data-testid]="solved ? solvedTestId() : null"
          [attr.role]="statusLabel() ? 'img' : null"
          [attr.aria-label]="statusLabel() || null"
          [attr.title]="statusLabel() || null"
        >
          <app-fa-glyph *ngIf="solved" icon="check-circle" size="16"></app-fa-glyph>
          <app-fa-glyph *ngIf="isLockedRow()" icon="lock" size="13"></app-fa-glyph>
        </span>

        <div class="fa-question-row__body">
          <span class="fa-question-row__kind" *ngIf="kindLabel">{{ kindLabel }}</span>
          <div class="fa-question-row__titleline">
            <div
              class="fa-question-row__title fa-card-title"
              [class.fa-question-row__concealed]="concealed"
              [class.premium-locked]="concealed"
              [attr.data-nosnippet]="concealed ? '' : null"
              [attr.aria-hidden]="concealed ? 'true' : null"
              [attr.data-testid]="testId ? 'question-row-title-' + testId : null"
            >
              {{ title | stripInlineMarkup }}
            </div>
            <app-company-signal
              *ngIf="companies.length"
              class="fa-question-row__company-signal"
              [companies]="companies"
              [preferredSlug]="preferredCompanySlug"
            ></app-company-signal>
          </div>

          <div
            class="fa-question-row__description fa-meta-text"
            *ngIf="description"
            [class.fa-question-row__concealed]="concealed"
            [class.premium-locked]="concealed"
            [attr.data-nosnippet]="concealed ? '' : null"
            [attr.aria-hidden]="concealed ? 'true' : null"
            [pTooltip]="descriptionTooltip || description"
            tooltipPosition="bottom"
            tooltipStyleClass="desc-tip"
            appendTo="body"
            [showDelay]="150"
            [hideDelay]="0"
            [autoHide]="true"
            [life]="0"
            [escape]="false"
            [tooltipDisabled]="concealed || !(descriptionTooltip || description)"
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
          <ng-container *ngFor="let chip of metaChips; trackBy: trackByMetaChip">
            <span
              *ngIf="isPrimaryMetaChip(chip)"
              class="fa-question-row__meta-chip"
              [ngClass]="metaToneClass(chip)"
              [attr.aria-label]="chip.ariaLabel"
            >
              <span
                *ngIf="difficultyLevel(chip) as level"
                class="fa-question-row__meter"
                [attr.data-level]="level"
                aria-hidden="true"
              ></span>
              <span class="fa-question-row__meta-label">{{ chip.label }}</span>
            </span>
          </ng-container>

          <span class="fa-question-row__sr-meta" *ngIf="secondaryMetaSummary()">
            {{ secondaryMetaSummary() }}
          </span>
        </div>

        <span class="fa-question-row__chevron" *ngIf="hasLink() && !disabled" aria-hidden="true">
          <app-fa-glyph icon="chevron-right" size="16"></app-fa-glyph>
        </span>
      </div>
    </ng-template>
  `,
    styleUrls: ['./fa-question-row.component.css']
})
export class FaQuestionRowComponent {
  @Input() testId?: string;
  @Input() title = '';
  @Input() description = '';
  @Input() descriptionTooltip = '';
  @Input() kindLabel = '';
  @Input() routeLink: string | any[] | null = null;
  @Input() queryParams: Params | null = null;
  @Input() state: { [k: string]: any } | undefined = undefined;
  @Input() disabled = false;
  @Input() solved = false;
  /** The viewer has a draft of this item that differs from its starter code and has not solved it yet. */
  @Input() inProgress = false;
  @Input() lockedLabel = '';
  /** A Premium item shown to a viewer without Premium: title and description stay in the page, under a blur. */
  @Input() concealed = false;
  @Input() companies: readonly unknown[] = [];
  @Input() preferredCompanySlug: string | null | undefined = null;
  @Input() metaChips: readonly FaQuestionRowMetaChip[] = [];
  @Input() variants: readonly FaQuestionRowVariant[] = [];

  @Output() rowClick = new EventEmitter<Event>();
  @Output() variantSelected = new EventEmitter<FaQuestionRowVariant>();

  hasLink(): boolean {
    if (Array.isArray(this.routeLink)) return this.routeLink.length > 0;
    return typeof this.routeLink === 'string' && this.routeLink.length > 0;
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

  trackByMetaChip = (_: number, chip: FaQuestionRowMetaChip): string =>
    `${chip.priority || 'primary'}:${chip.tone || 'neutral'}:${chip.ariaLabel}`;

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

  /** A Premium item the viewer cannot open: a lock in the status column, named for screen readers. */
  isLockedRow(): boolean {
    return !this.solved && !!this.lockedLabel;
  }

  /** An open item with an unfinished draft: a half-filled ring. */
  isInProgress(): boolean {
    return this.inProgress && !this.solved && !this.lockedLabel;
  }

  /** An open item not started yet: an empty ring in the status column, as a to-do mark. */
  isTodo(): boolean {
    return this.hasLink() && !this.solved && !this.lockedLabel && !this.inProgress;
  }

  statusLabel(): string {
    if (this.solved) return 'Solved';
    if (this.lockedLabel) return this.lockedLabel;
    return this.isInProgress() ? 'In progress' : '';
  }

  /** Filled bars for a difficulty chip: 1 easy, 2 intermediate, 3 hard; null for any other chip. */
  difficultyLevel(chip: FaQuestionRowMetaChip): 1 | 2 | 3 | null {
    if (chip.tone !== 'difficulty') return null;
    const label = (chip.label || '').trim().toLowerCase();
    if (label === 'easy' || label === 'beginner') return 1;
    if (label === 'intermediate' || label === 'medium') return 2;
    if (label === 'hard' || label === 'advanced') return 3;
    return null;
  }

  solvedTestId(): string | null {
    if (!this.testId?.startsWith('question-card-')) return null;
    return `question-card-solved-mark-${this.testId.slice('question-card-'.length)}`;
  }
}
