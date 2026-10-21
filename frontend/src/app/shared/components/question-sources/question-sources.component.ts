import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { QuestionSource } from '../../../core/models/question.model';
import { formatQuestionSourceDate, normalizeQuestionSources } from '../../../core/utils/question-sources.util';
import { companyBrandFor } from '../../company-branding';

export type QuestionSourcesVariant = 'full' | 'compact';
export type QuestionSourceCompanyLink = { slug: string; label: string };

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
  imports: [CommonModule, RouterLink],
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
      <p
        class="question-sources__company"
        *ngFor="let company of companyLinks(); trackBy: trackBySlug"
        data-testid="question-sources-company">
        Reported in a public {{ company.label }} interview account.
        <a class="question-sources__link" [routerLink]="['/companies', company.slug, 'preview']">{{ company.label }} frontend interview questions</a>
      </p>
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
      </ng-container><ng-container *ngFor="let company of companyLinks(); trackBy: trackBySlug"> · <a
          class="question-sources__link"
          [routerLink]="['/companies', company.slug, 'preview']">{{ company.label }} frontend interview questions</a></ng-container>
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

  /** One internal link per company named by a source, so a sourced item points back to its company guide. */
  companyLinks(): QuestionSourceCompanyLink[] {
    const seen = new Set<string>();
    const links: QuestionSourceCompanyLink[] = [];
    for (const source of this.entries()) {
      const slug = source.company;
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      links.push({ slug, label: companyBrandFor(slug)?.label ?? slug });
    }
    return links;
  }

  trackBySlug(_index: number, link: QuestionSourceCompanyLink): string {
    return link.slug;
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
