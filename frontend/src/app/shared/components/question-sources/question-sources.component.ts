import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { QuestionSource } from '../../../core/models/question.model';
import { formatQuestionSourceDate, normalizeQuestionSources } from '../../../core/utils/question-sources.util';

export type QuestionSourcesVariant = 'full' | 'compact';

export const QUESTION_SOURCES_HEADING = 'Public interview reports';
export const QUESTION_SOURCES_PROVENANCE =
  'These public, self-reported interview accounts informed this practice version. '
  + 'The exercise is modelled on reported rounds, not copied from them, '
  + 'and the reports are not verified official questions or endorsements.';

/**
 * Lists the public interview reports behind a practice question.
 * Pure template with attribute bindings only, so the same markup renders on the server.
 */
@Component({
  selector: 'app-question-sources',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      *ngIf="variant === 'full' && entries().length"
      class="question-sources"
      data-testid="question-sources">
      <h3 class="question-sources__title">{{ heading }}</h3>
      <p class="question-sources__provenance">{{ provenance }}</p>
      <ul class="question-sources__list">
        <li class="question-sources__item" *ngFor="let source of entries(); trackBy: trackByUrl">
          <a
            class="question-sources__link"
            [href]="source.url"
            target="_blank"
            rel="noopener noreferrer nofollow">{{ source.label }}</a>
          <span class="question-sources__meta" *ngIf="metaLabel(source) as meta"> · {{ meta }}</span>
          <p class="question-sources__note" *ngIf="source.note">{{ source.note }}</p>
        </li>
      </ul>
    </section>
    <p
      *ngIf="variant === 'compact' && entries().length"
      class="question-sources question-sources--compact"
      data-testid="question-sources-compact">
      <span class="question-sources__compact-label">{{ heading }}:</span>&ngsp;<ng-container *ngFor="let source of entries(); let last = last; trackBy: trackByUrl">
        <a
          class="question-sources__link"
          [href]="source.url"
          target="_blank"
          rel="noopener noreferrer nofollow">{{ compactLabel(source) }}</a><ng-container *ngIf="!last">, </ng-container>
      </ng-container>
    </p>
  `,
  styleUrls: ['./question-sources.component.css'],
})
export class QuestionSourcesComponent {
  @Input() sources: QuestionSource[] | null | undefined = [];
  @Input() variant: QuestionSourcesVariant = 'full';

  readonly heading = QUESTION_SOURCES_HEADING;
  readonly provenance = QUESTION_SOURCES_PROVENANCE;

  entries(): QuestionSource[] {
    return normalizeQuestionSources(this.sources);
  }

  metaLabel(source: QuestionSource): string {
    const date = formatQuestionSourceDate(source.date);
    return [source.publisher, date].filter(Boolean).join(', ');
  }

  compactLabel(source: QuestionSource): string {
    const name = source.publisher || source.label;
    const date = formatQuestionSourceDate(source.date);
    return date ? `${name} (${date})` : name;
  }

  trackByUrl(_index: number, source: QuestionSource): string {
    return source.url;
  }
}
