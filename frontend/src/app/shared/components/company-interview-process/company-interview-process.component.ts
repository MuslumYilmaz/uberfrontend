import { ChangeDetectionStrategy, Component, Input, afterNextRender, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { isProActive } from '../../../core/utils/entitlements.util';
import { isPremiumRoute } from '../../../core/utils/premium-route.util';
import type {
  CompanyInterviewProcess,
  InterviewProcessSource,
  InterviewProcessStage,
} from '../../company-previews/company-interview-processes';
import { describeReporter } from '../../company-previews/company-source-reporter';

/** The free task under the table that lets a reader try the first technical round's shape at once. */
export type InterviewProcessTryNow = {
  readonly stage: string;
  readonly label: string;
  readonly path: string;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The interview stages a company's official pages and public reports describe. Renders nothing without data. */
@Component({
  selector: 'app-company-interview-process',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './company-interview-process.component.html',
  styleUrl: './company-interview-process.component.css',
})
export class CompanyInterviewProcessComponent {
  @Input() slug = '';
  @Input() companyLabel = '';
  @Input() process: CompanyInterviewProcess | null = null;
  /** The viewer has no Premium, so a practice link to a Premium page keeps its name under a blur. */
  @Input() lockPremium = false;
  /** Navigation state for the practice links: a locked task page shows the way back to the guide. */
  @Input() returnState: { [key: string]: any } | undefined;
  /**
   * Rows say who reported a round and when, with no links: the guide lists its sources once, at the end. Without it,
   * each row links its sources.
   */
  @Input() reportedBy = false;
  /** Reported questions per stage name, shown under each stage with a link to the question list. */
  @Input() questionCounts: Readonly<Record<string, number>> | null = null;
  /** Reported questions no source places in a round. */
  @Input() roundNotStated = 0;
  /** The id of the question list the counts link to. */
  @Input() questionsAnchor = '';
  /** The list locks its questions for this reader, so a count with a locked question shows a lock. */
  @Input() questionsLocked = false;
  @Input() tryNow: InterviewProcessTryNow | null = null;

  /** The rows whose source list a phone reader opened; wider screens show every list regardless. */
  private readonly opened = signal<ReadonlySet<string>>(new Set());

  private readonly auth = inject(AuthService);
  /** Set after the first render, so the prerendered table stays the visitor's. */
  private readonly rendered = signal(false);
  /** A free account reads Premium names on the guide, so a Premium practice link keeps its tag. */
  private readonly freeAccount = computed(() => {
    const user = this.auth.user();
    return this.rendered() && Boolean(user) && user?.role !== 'admin' && !isProActive(user);
  });

  constructor() {
    afterNextRender(() => this.rendered.set(true));
  }

  expanded(variantIndex: number, stage: InterviewProcessStage): boolean {
    return this.opened().has(`${variantIndex}:${stage.stage}`);
  }

  toggleSources(variantIndex: number, stage: InterviewProcessStage): void {
    const key = `${variantIndex}:${stage.stage}`;
    this.opened.update((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  practiceLocked(path: string): boolean {
    return this.lockPremium && isPremiumRoute(path);
  }

  practicePremium(path: string): boolean {
    return this.freeAccount() && isPremiumRoute(path);
  }

  get headingId(): string {
    return `${this.slug || 'company'}-interview-process`;
  }

  heading(process: CompanyInterviewProcess): string {
    return process.title || `${this.companyLabel} frontend interview process`;
  }

  variantId(index: number): string {
    return `${this.headingId}-${index + 1}`;
  }

  /** Row id for deep links from round sections: `<variant id>-stage-<stage name in kebab case>`. */
  stageId(variantIndex: number, stage: InterviewProcessStage): string {
    const name = stage.stage.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return `${this.variantId(variantIndex)}-stage-${name}`;
  }

  formatMonth(value: string): string {
    const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(value);
    if (!match) return value;
    const month = MONTHS[Number(match[2]) - 1];
    return month ? `${month} ${match[1]}` : value;
  }

  /** How strong the evidence for a stage is: an official page, several reports, or a single account. */
  evidenceLabel(stage: InterviewProcessStage): string {
    const reports = stage.sources.filter((source) => source.kind === 'report');
    const official = stage.sources.length - reports.length;
    const years = reports.map((source) => source.date.slice(0, 4)).sort();
    const span = years.length ? (years[0] === years[years.length - 1] ? years[0] : `${years[0]}–${years[years.length - 1]}`) : '';

    if (official) {
      if (!reports.length) return 'Official page';
      return `Official page and ${reports.length === 1 ? 'one report' : `${reports.length} reports`}`;
    }
    return reports.length === 1 ? `One public report, ${span}` : `${reports.length} public reports, ${span}`;
  }

  /** "Newest: Senior software engineer, United States · Jan 2026", or the official pages when no account backs the round. */
  newestReporter(stage: InterviewProcessStage): string {
    const reports = stage.sources.filter((source) => source.kind === 'report' && !source.reportForm);
    const newest = [...reports].sort((a, b) => b.date.localeCompare(a.date))[0];
    if (newest) return `Newest: ${describeReporter(newest)} · ${this.formatMonth(newest.date)}`;
    return stage.sources.filter((source) => source.kind === 'official').map((source) => source.label).join(' · ');
  }

  questionCount(stage: InterviewProcessStage): number {
    return this.questionCounts?.[stage.stage] ?? 0;
  }

  /** A stage's count leads to its first question in the list (the list opens there if the row is past "Show all"). */
  questionHref(stage: InterviewProcessStage): string {
    const first = this.process?.questions?.find((question) => question.round === stage.stage);
    return `#${first && this.slug ? `${this.slug}-question-${first.id}` : this.questionsAnchor}`;
  }

  /** What the try-now pick is, so the line does not call a guide, a quiz or a walkthrough a task. */
  tryNowKind(path: string): string {
    if (path.endsWith('/quiz')) return 'a free quiz';
    if (path.startsWith('/guides/')) return 'a free guide to read';
    if (path.includes('/trivia/')) return 'a free concept question';
    if (path.startsWith('/system-design/')) return 'a free system design walkthrough';
    return 'a free task';
  }

  /** The questions no source places in a round lead to the first of them. */
  notStatedHref(): string {
    const first = this.process?.questions?.find((question) => !question.round);
    return `#${first && this.slug ? `${this.slug}-question-${first.id}` : this.questionsAnchor}`;
  }

  /** A stage holds a locked question: any of its questions but the list's first, which is open to everyone. */
  questionsLockedIn(stage: InterviewProcessStage): boolean {
    const questions = this.process?.questions ?? [];
    return this.questionsLocked && questions.some((question, index) => index > 0 && question.round === stage.stage);
  }

  /** Reports carry their month in the link text so several links from one site stay distinguishable. */
  sourceText(source: InterviewProcessSource): string {
    return source.kind === 'report' ? `${source.label}, ${this.formatMonth(source.date)}` : source.label;
  }

  rel(source: InterviewProcessSource): string {
    return source.kind === 'report' ? 'noopener noreferrer nofollow' : 'noopener noreferrer';
  }
}
