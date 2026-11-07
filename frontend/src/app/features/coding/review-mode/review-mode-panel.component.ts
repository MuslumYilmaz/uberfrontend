import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  ReviewModeComment,
  ReviewModeDraft,
  ReviewModePhase,
  ReviewModeScenario,
  ReviewModeSeverity,
} from '../../../core/models/review-mode.model';
import { DiffGap, DiffRow, diffLines, diffStats, foldUnchanged } from '../../../core/utils/line-diff.util';
import { FaButtonComponent } from '../../../shared/ui/button/fa-button.component';
import { FaFieldComponent } from '../../../shared/ui/field/fa-field.component';

const SEVERITY_ORDER: readonly ReviewModeSeverity[] = ['blocker', 'major', 'minor', 'nit'];
const SEVERITY_LABELS: Readonly<Record<ReviewModeSeverity, string>> = {
  blocker: 'Blocks the merge',
  major: 'Must fix',
  minor: 'Should fix',
  nit: 'Nit',
};

export function reviewDraftKey(questionId: string): string {
  return `fa:review-mode:v1:${questionId}`;
}

/** The draft kept on this device, or null when there is none or storage is unavailable. */
export function readReviewDraft(questionId: string): ReviewModeDraft | null {
  try {
    const raw = globalThis.localStorage?.getItem(reviewDraftKey(questionId));
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<ReviewModeDraft>;
    const phase: ReviewModePhase = value.phase === 'fix' || value.phase === 'compare' ? value.phase : 'review';
    const comments = value.comments && typeof value.comments === 'object' ? value.comments : {};
    return {
      open: value.open !== false,
      startedAt: Number.isFinite(value.startedAt) ? Number(value.startedAt) : Date.now(),
      ...(Number.isFinite(value.interviewStartedAt) ? { interviewStartedAt: Number(value.interviewStartedAt) } : {}),
      phase,
      comments: Object.fromEntries(Object.entries(comments).filter(([, text]) => typeof text === 'string')) as Record<string, string>,
      summary: typeof value.summary === 'string' ? value.summary : '',
    };
  } catch {
    return null;
  }
}

function writeReviewDraft(questionId: string, draft: ReviewModeDraft): void {
  try {
    globalThis.localStorage?.setItem(reviewDraftKey(questionId), JSON.stringify(draft));
  } catch {
    // A private window or full storage keeps the review for this visit only.
  }
}

type FileView = {
  readonly path: string;
  readonly rows: readonly (DiffRow | DiffGap)[];
  readonly added: number;
  readonly removed: number;
};

/**
 * The merge request review: read the request and its diff, comment in writing, implement the top fixes in the
 * workspace beside it, then compare with a sample review. The draft stays on this device.
 */
@Component({
  selector: 'app-review-mode-panel',
  standalone: true,
  imports: [FaButtonComponent, FaFieldComponent],
  templateUrl: './review-mode-panel.component.html',
  styleUrl: './review-mode-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewModePanelComponent implements OnChanges {
  @Input({ required: true }) scenario!: ReviewModeScenario;
  @Input({ required: true }) questionId!: string;
  /** The reader left the review; the page shows the task's description again. */
  @Output() readonly exit = new EventEmitter<void>();

  readonly phase = signal<ReviewModePhase>('review');
  readonly comments = signal<Readonly<Record<string, string>>>({});
  readonly summary = signal('');
  private readonly startedAt = signal(Date.now());
  /** The interview's clock, from the moment the written review was handed in. */
  private readonly interviewStartedAt = signal<number | null>(null);
  private readonly now = signal(Date.now());
  private readonly scenarioSignal = signal<ReviewModeScenario | null>(null);

  readonly files = computed<readonly FileView[]>(() => (this.scenarioSignal()?.mergeRequest.files ?? []).map((file) => {
    const rows = diffLines(file.before, file.after);
    return { path: file.path, rows: foldUnchanged(rows), ...diffStats(rows) };
  }));

  // Most severe first, then in the order the request lists its files, as the diff reads.
  readonly sortedComments = computed<readonly ReviewModeComment[]>(() => {
    const scenario = this.scenarioSignal();
    const fileOrder = (scenario?.mergeRequest.files ?? []).map((file) => file.path);
    return [...(scenario?.sampleReview.comments ?? [])].sort((a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
      || fileOrder.indexOf(a.path) - fileOrder.indexOf(b.path)
      || a.line - b.line);
  });

  readonly ownComments = computed(() => this.files()
    .map((file) => ({ path: file.path, text: (this.comments()[file.path] ?? '').trim() }))
    .filter((entry) => entry.text));

  readonly timerLabel = computed(() => {
    const scenario = this.scenarioSignal();
    const session = scenario?.sessionMinutes ?? 0;
    // A review sent ahead has its own clock; the fixes and the comparison then run on the interview's.
    if (!scenario?.reviewMinutes) return this.clock(this.startedAt(), session, '');
    return this.phase() === 'review'
      ? this.clock(this.startedAt(), scenario.reviewMinutes, 'Review')
      : this.clock(this.interviewStartedAt() ?? this.now(), session, 'Interview');
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    // The clock only runs in the browser; the prerendered page shows the full session.
    afterNextRender(() => {
      this.now.set(Date.now());
      const timer = setInterval(() => this.now.set(Date.now()), 15_000);
      destroyRef.onDestroy(() => clearInterval(timer));
    });
  }

  ngOnChanges(): void {
    this.scenarioSignal.set(this.scenario ?? null);
    const draft = this.questionId ? readReviewDraft(this.questionId) : null;
    this.phase.set(draft?.phase ?? 'review');
    this.comments.set(draft?.comments ?? {});
    this.summary.set(draft?.summary ?? '');
    // A review started again keeps its comments and starts new clocks, the interview's too when it reopens there.
    this.startedAt.set(draft?.open ? draft.startedAt : Date.now());
    this.interviewStartedAt.set(draft?.open
      ? draft.interviewStartedAt ?? null
      : this.phase() === 'review' ? null : Date.now());
    this.now.set(Date.now());
    this.save();
  }

  private clock(from: number, total: number, name: string): string {
    const elapsed = Math.max(0, Math.floor((this.now() - from) / 60_000));
    const left = total - elapsed;
    if (!name) return left > 0 ? `${left} of ${total} min left` : `Time is up: ${-left} min over ${total}`;
    return left > 0 ? `${name}: ${left} of ${total} min left` : `${name}: time is up, ${-left} min over ${total}`;
  }

  severityLabel(severity: ReviewModeSeverity): string {
    return SEVERITY_LABELS[severity];
  }

  marker(row: DiffRow): string {
    return row.kind === 'added' ? '+' : row.kind === 'removed' ? '-' : ' ';
  }

  oldLine(row: DiffRow): number | '' {
    return row.kind === 'added' ? '' : row.oldLine;
  }

  newLine(row: DiffRow): number | '' {
    return row.kind === 'removed' ? '' : row.newLine;
  }

  /** A file without a comment yet has no key, and a textarea would print undefined. */
  commentFor(path: string): string {
    return this.comments()[path] ?? '';
  }

  setComment(path: string, event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.comments.update((current) => ({ ...current, [path]: value }));
    this.save();
  }

  setSummary(event: Event): void {
    this.summary.set((event.target as HTMLTextAreaElement).value);
    this.save();
  }

  go(phase: ReviewModePhase): void {
    // Handing in the written review starts the interview.
    if (phase !== 'review' && this.interviewStartedAt() === null) this.interviewStartedAt.set(Date.now());
    this.phase.set(phase);
    this.now.set(Date.now());
    this.save();
  }

  leave(): void {
    this.save(false);
    this.exit.emit();
  }

  private save(open = true): void {
    if (!this.questionId) return;
    const interviewStartedAt = this.interviewStartedAt();
    writeReviewDraft(this.questionId, {
      open,
      startedAt: this.startedAt(),
      ...(interviewStartedAt !== null ? { interviewStartedAt } : {}),
      phase: this.phase(),
      comments: this.comments(),
      summary: this.summary(),
    });
  }
}
