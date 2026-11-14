import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { AuthoredSectionCopy } from '../../../../shared/company-previews/authored-company-preview.model';
import type { CompanyGuideViewer } from '../company-question-list/company-question-list.component';

/** One source as the list at the end of a guide shows it: who reported it and when, in place of a link up the page. */
export type GuideSourceRow = {
  readonly label: string;
  readonly url: string;
  readonly kind: 'official' | 'report';
  readonly note: string;
  readonly who: string | null;
  /** YYYY-MM, for an account. */
  readonly date: string | null;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Every source behind a guide, once, at the end of the page: closed, small and quiet, so a reader is not led off the
 * page mid-read, yet the attribution and the notes stay in the HTML for anyone who looks. The links open with a free
 * account.
 */
@Component({
  selector: 'app-company-guide-sources',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './company-guide-sources.component.html',
  styleUrl: './company-guide-sources.component.css',
})
export class CompanyGuideSourcesComponent {
  readonly slug = input.required<string>();
  readonly sources = input.required<readonly GuideSourceRow[]>();
  /** What the sources can and cannot establish, read before the list. */
  readonly boundary = input<AuthoredSectionCopy | null>(null);
  readonly viewer = input<CompanyGuideViewer>('guest');

  readonly headingId = computed(() => `${this.slug()}-sources`);
  readonly hasAccounts = computed(() => this.sources().some((row) => row.kind === 'report'));
  readonly signupParams = computed(() => ({ redirectTo: `/companies/${this.slug()}/preview` }));

  when(row: GuideSourceRow): string {
    const match = row.date ? /^(\d{4})-(\d{2})/.exec(row.date) : null;
    return match ? `${MONTHS[Number(match[2]) - 1]} ${match[1]}` : '';
  }

  rel(row: GuideSourceRow): string {
    return row.kind === 'report' ? 'noopener noreferrer nofollow' : 'noopener noreferrer';
  }
}
