import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  PLATFORM_ID,
  TransferState,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  makeStateKey,
  output,
  signal,
  untracked,
} from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import type { FreeUnlock } from '../../../../core/models/free-unlock.model';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { isPremiumRoute } from '../../../../core/utils/premium-route.util';
import type { AuthoredPracticePrompt } from '../../../../shared/company-previews/authored-company-preview.model';
import type {
  CompanyInterviewProcess,
  InterviewProcessSource,
  ReportedBehaviouralQuestion,
  ReportedQuestion,
} from '../../../../shared/company-previews/company-interview-processes';
import { isNewQuestion, type QuestionListRow, type QuestionListSummary } from '../../../../shared/company-previews/company-question-list';
import { describeReporter } from '../../../../shared/company-previews/company-source-reporter';
import { companyBrandFor } from '../../../../shared/company-branding';
import { FaButtonComponent } from '../../../../shared/ui/button/fa-button.component';
import { InlineCodeComponent } from '../../../../shared/ui/inline-code/inline-code.component';
import type { CompanyGuideFeatures } from '../company-guide-features';

export type CompanyGuideViewer = 'guest' | 'account' | 'member';

/** Where spending the free unlock on a question stands, while it runs or after it failed. */
export type FreeUnlockState = {
  readonly questionId: string;
  readonly status: 'pending' | 'error' | 'used';
};

/** The offer card's price: the list or regional monthly price, and the line under it. */
export type CompanyQuestionOffer = {
  readonly price: string;
  readonly priceNote: string;
};

type Row = {
  readonly question: ReportedQuestion;
  readonly summary: QuestionListRow;
  readonly number: number;
  readonly guide: AuthoredPracticePrompt | null;
  readonly who: string;
  readonly frequency: string;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Rows shown before "Show all": the open one and the next seven. */
const VISIBLE_ROWS = 8;
// The prerender's day travels with the page, so a reader's first render shows the NEW tags the HTML has.
const TODAY_KEY = makeStateKey<string>('company-guide-today');

function month(value: string | null): string {
  const match = value ? /^(\d{4})-(\d{2})/.exec(value) : null;
  return match ? `${MONTHS[Number(match[2]) - 1]} ${match[1]}` : '';
}

/** "Reported in 3 accounts · Jan 2026", "Reported in 1 account and a question bank · Nov 2025". */
function frequencyLine(row: Pick<QuestionListRow, 'accounts' | 'banks' | 'latest'>): string {
  if (!row.accounts) return 'Listed in a candidate question bank';
  const accounts = `${row.accounts} ${row.accounts === 1 ? 'account' : 'accounts'}`;
  const bank = row.banks ? ' and a question bank' : '';
  return `Reported in ${accounts}${bank} · ${month(row.latest)}`;
}

/** The id the plan and the solved list use for a practice task: a question's id, or a guide's route. */
export function practiceTaskId(path: string): string {
  return path.startsWith('/guides/') ? path : path.slice(path.lastIndexOf('/') + 1);
}

/** "a", "a and b", "a, b and c". */
function listOf(parts: readonly string[]): string {
  return parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/** Who stands behind a question: its newest account, or the bank when no account names it. */
function whoLine(sources: readonly InterviewProcessSource[]): string {
  const accounts = sources.filter((source) => source.kind === 'report' && !source.reportForm);
  const newest = [...accounts].sort((a, b) => b.date.localeCompare(a.date))[0];
  return newest ? describeReporter(newest) ?? '' : 'Candidate question bank';
}

/**
 * A guide's reported questions: the first open to everyone, the rest with their round, kind, reporter and frequency
 * in view and the question itself under a Premium lock, which stays in the page for search under `.premium-locked`.
 * Clicking a locked row offers the reader's one free unlock beside Premium. Behavioural questions follow, open.
 */
@Component({
  selector: 'app-company-question-list',
  standalone: true,
  imports: [RouterLink, FaButtonComponent, InlineCodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './company-question-list.component.html',
  styleUrl: './company-question-list.component.css',
})
export class CompanyQuestionListComponent {
  readonly slug = input.required<string>();
  readonly companyLabel = input.required<string>();
  readonly process = input.required<CompanyInterviewProcess>();
  readonly summary = input.required<QuestionListSummary>();
  /** The guide's practice prompts by id; a row's answer guide is one of them. */
  readonly guides = input<Readonly<Record<string, AuthoredPracticePrompt>>>({});
  readonly viewer = input<CompanyGuideViewer>('guest');
  readonly features = input.required<CompanyGuideFeatures>();
  readonly offer = input<CompanyQuestionOffer | null>(null);
  readonly pricingSource = input('');
  readonly returnState = input<{ [key: string]: unknown } | undefined>(undefined);
  /** The account's free unlock, wherever it was spent; null for a visitor or an account that has not used it. */
  readonly freeUnlock = input<FreeUnlock | null>(null);
  /** The practice tasks a reader with an account has solved or marked done in a plan; null for a visitor. */
  readonly practised = input<ReadonlySet<string> | null>(null);
  readonly unlockState = input<FreeUnlockState | null>(null);
  /**
   * The reader chose the free unlock for a question, by id: an account spends it, a visitor's choice is kept until
   * they come back with an account.
   */
  readonly unlock = output<string>();

  private readonly analytics = inject(AnalyticsService);
  private readonly today = (() => {
    const state = inject(TransferState);
    const now = new Date().toISOString().slice(0, 10);
    if (isPlatformServer(inject(PLATFORM_ID))) {
      state.set(TODAY_KEY, now);
      return now;
    }
    return state.get(TODAY_KEY, now);
  })();

  readonly expanded = signal(false);
  /** The locked row whose choice is open. */
  readonly choosing = signal<string | null>(null);
  private readonly injector = inject(Injector);
  private readonly fragment = toSignal(inject(ActivatedRoute, { optional: true })?.fragment ?? of(null), { initialValue: null });

  constructor() {
    // A link to a row behind "Show all" (a round's count in the process table, a shared address) opens the list there.
    effect(() => {
      const fragment = this.fragment();
      const row = fragment ? this.rows().find((candidate) => this.rowId(candidate) === fragment) : undefined;
      if (!row || !this.extra(row) || untracked(this.expanded)) return;
      this.expanded.set(true);
      afterNextRender(() => document.getElementById(fragment!)?.scrollIntoView({ block: 'start' }), { injector: this.injector });
    });
  }

  readonly headingId = computed(() => `${this.slug()}-questions`);
  /** The list locks for anyone without Premium while the switch is on. */
  readonly locking = computed(() => this.features().lockedQuestions && this.viewer() !== 'member');
  readonly lockedCount = computed(() => (this.locking() ? this.summary().total - (this.unlockedId() ? 2 : 1) : 0));

  /** The question this guide's reader opened with the free unlock, if it is one of this guide's. */
  readonly unlockedId = computed(() => {
    const unlock = this.freeUnlock();
    return unlock && unlock.company === this.slug() ? unlock.questionId : null;
  });

  /** The company whose question took the free unlock, when it is another guide's. */
  readonly usedElsewhere = computed(() => {
    const unlock = this.freeUnlock();
    return unlock && unlock.company !== this.slug() ? companyBrandFor(unlock.company)?.label ?? unlock.company : null;
  });

  readonly rows = computed<readonly Row[]>(() => {
    const guides = this.guides();
    const summaries = this.summary().rows;
    return this.process().questions!.map((question, index) => ({
      question,
      summary: summaries[index],
      number: index + 1,
      guide: question.answerGuide ? guides[question.answerGuide] ?? null : null,
      who: whoLine(question.sources),
      frequency: frequencyLine(summaries[index]),
    }));
  });

  readonly behavioural = computed(() => {
    const rows = this.summary().behavioural;
    return (this.process().behaviouralQuestions ?? []).map((question: ReportedBehaviouralQuestion, index) => ({
      question,
      frequency: frequencyLine(rows[index]),
    }));
  });

  /** Counted by distinct sources, so questions from one long account do not read as several reports. */
  readonly behaviouralIntro = computed(() => {
    const questions = this.process().behaviouralQuestions ?? [];
    const sources = new Set(questions.flatMap((question) => question.sources.map((source) => source.url))).size;
    const asked = `${questions.length} ${questions.length === 1 ? 'question' : 'questions'}`;
    return `Open to everyone: ${asked} from ${sources === 1 ? 'one public source' : `${sources} public sources`}.`;
  });

  readonly newCount = computed(() => this.summary().rows.filter((row) => isNewQuestion(row, this.today)).length);

  readonly intro = computed(() => {
    const total = this.summary().total;
    if (!this.features().lockedQuestions) return `All ${total} are open to read, with their practice tasks and answer guides where they have one.`;
    if (this.viewer() === 'member') return `Premium opens all ${total}, with their practice tasks and answer guides where they have one.`;
    const first = this.viewer() === 'guest' ? 'The first question is open to read; its answer outline opens with a free account.' : 'The first question is open.';
    const locked = this.lockedCount();
    if (!locked) return first;
    return `${first} The others show their topic and what is behind the lock; Premium opens ${locked === 1 ? 'the one still locked' : `all ${locked} still locked`}.`;
  });

  readonly freshness = computed(() => {
    const newest = this.summary().newestAccount;
    return newest ? `Newest account ${month(newest)}` : '';
  });

  /** The free unlock explained once, above the rows, for a reader without Premium. */
  readonly allowance = computed(() => {
    if (!this.features().premiumPull || !this.locking()) return null;
    if (this.viewer() === 'guest') {
      return 'Locked questions are Premium, but you can open one free with an account: one per account, across all company guides.';
    }
    const opened = this.rows().find((row) => row.question.id === this.unlockedId());
    if (opened) return `You opened question ${opened.number} with your free unlock. Premium opens the rest.`;
    if (this.usedElsewhere()) return `You used your free unlock in the ${this.usedElsewhere()} guide. Premium opens the rest.`;
    // Spent here on a question the list no longer carries: still spent.
    if (this.freeUnlock()) return 'You used your free unlock on this guide. Premium opens the rest.';
    return 'You have one free unlock. Click a locked question to use it there; it counts across all company guides.';
  });

  /** A reader with an account sees how many of the list's practice tasks they have solved, as their plan counts them. */
  readonly progress = computed(() => {
    const practised = this.practised();
    if (!practised || this.viewer() === 'guest') return null;
    const tasks = new Set(this.rows().flatMap((row) => (row.question.practice ? [practiceTaskId(row.question.practice.path)] : [])));
    if (!tasks.size) return null;
    const solved = [...tasks].filter((task) => practised.has(task)).length;
    return { solved, total: tasks.size };
  });

  /** Said of this list's tasks, so it does not read as another count of the company's set or of a plan. */
  readonly progressLine = computed(() => {
    const count = this.progress();
    if (!count) return null;
    const tasks = count.total === 1 ? 'the one practice task in this list' : `the ${count.total} practice tasks in this list`;
    return `Your ${this.companyLabel()} prep: ${count.solved} of ${tasks} solved`;
  });

  readonly showOffer = computed(() => this.features().premiumPull && this.locking() && this.offer() !== null);

  readonly signupParams = computed(() => ({ redirectTo: `/companies/${this.slug()}/preview` }));

  readonly pricingParams = computed(() => ({ src: this.pricingSource() }));

  rowSolved(row: Row): boolean {
    const practised = this.practised();
    return !!practised && this.viewer() !== 'guest' && !!row.question.practice && practised.has(practiceTaskId(row.question.practice.path));
  }

  rowId(row: Row): string {
    return `${this.slug()}-question-${row.question.id}`;
  }

  roundLabel(row: Row): string {
    return row.question.round ?? 'Round not stated';
  }

  isNew(row: Row): boolean {
    return this.features().premiumPull && isNewQuestion(row.summary, this.today);
  }

  rowLocked(row: Row): boolean {
    return this.locking() && !row.summary.open && row.question.id !== this.unlockedId();
  }

  /** Opened with the reader's free unlock. */
  rowUnlocked(row: Row): boolean {
    return this.locking() && row.question.id === this.unlockedId();
  }

  /**
   * What a locked row holds, so a reader can choose before spending the free unlock or paying: the question (or only
   * the accounts' description when they keep the prompt), its answer guide and a Premium practice task. A practice task
   * that is free for everyone is said to be free and never named, since its title would give the question away.
   */
  lockedContents(row: Row): string {
    const parts = [row.question.promptNotShared ? 'the accounts\' description (they do not share the prompt)' : 'the question'];
    if (row.guide) parts.push('an answer guide');
    const practice = row.question.practice;
    if (practice && isPremiumRoute(practice.path)) parts.push('a Premium practice task');
    const only = parts.length === 1 ? ' only' : '';
    const free = practice && !isPremiumRoute(practice.path) ? ' Its practice task is free for everyone.' : '';
    return `Behind the lock: ${listOf(parts)}${only}.${free}`;
  }

  /** The chooser offers the free unlock on this row: it may be opened and the reader has not spent theirs. */
  offersFreeUnlock(row: Row): boolean {
    return this.features().premiumPull && row.summary.unlockable && !this.freeUnlock();
  }

  stateOf(row: Row): FreeUnlockState['status'] | null {
    const state = this.unlockState();
    return state && state.questionId === row.question.id ? state.status : null;
  }

  /** The open row's answer outline waits for a free account. */
  outlineLocked(): boolean {
    return this.features().lockedQuestions && this.viewer() === 'guest';
  }

  extra(row: Row): boolean {
    return row.number > VISIBLE_ROWS;
  }

  hiddenCount(): number {
    return Math.max(0, this.summary().total - VISIBLE_ROWS);
  }

  practiceLocked(path: string | undefined): boolean {
    return Boolean(path) && this.viewer() === 'guest' && isPremiumRoute(path);
  }

  practicePremium(path: string | undefined): boolean {
    return Boolean(path) && this.viewer() !== 'member' && isPremiumRoute(path);
  }

  toggleChoice(row: Row): void {
    const id = row.question.id;
    const opening = this.choosing() !== id;
    this.choosing.set(opening ? id : null);
    if (opening) {
      this.analytics.track('company_question_locked_clicked', {
        company: this.slug(),
        question_id: id,
        round: this.roundLabel(row),
        viewer: this.viewer(),
        unlockable: row.summary.unlockable,
      });
    }
  }

  choose(row: Row, choice: 'free_unlock' | 'premium'): void {
    this.analytics.track('company_question_choice', { company: this.slug(), question_id: row.question.id, choice, viewer: this.viewer() });
    if (choice === 'free_unlock') this.unlock.emit(row.question.id);
  }
}
