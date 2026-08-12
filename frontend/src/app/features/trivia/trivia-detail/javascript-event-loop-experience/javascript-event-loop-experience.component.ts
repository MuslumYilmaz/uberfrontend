import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { FaButtonComponent } from '../../../../shared/ui/button/fa-button.component';
import { FaCardComponent } from '../../../../shared/ui/card/fa-card.component';
import { FaChipComponent } from '../../../../shared/ui/chip/fa-chip.component';
import {
  CHECKPOINT_CHOICES,
  CheckpointChoiceId,
  EVENT_LOOP_CODE,
  EVENT_LOOP_SNAPSHOTS,
  FINAL_TAKEAWAY,
  PAINT_CHOICES,
  PREDICTION_CHOICES,
  PaintChoiceId,
  PredictionChoiceId,
} from './javascript-event-loop-experience.content';
import {
  EventLoopExperienceAction,
  createEventLoopExperienceState,
  eventLoopExperienceScore,
  reduceEventLoopExperience,
} from './javascript-event-loop-experience.model';

type LabInteractionAction =
  | 'prediction_submitted'
  | 'trace_started'
  | 'checkpoint_submitted'
  | 'paint_submitted'
  | 'trace_completed'
  | 'replayed'
  | 'related_challenge_clicked';

const LAB_ID = 'js_event_loop_75s_v1';
const QUESTION_ID = 'js-event-loop';
const SCENARIO_ID = 'promise_timer_render_v1';
const QUALIFIED_VIEW_MS = 1_000;
const QUALIFIED_VIEW_RATIO = 0.5;

@Component({
  selector: 'app-javascript-event-loop-experience',
  standalone: true,
  imports: [CommonModule, FaButtonComponent, FaCardComponent, FaChipComponent],
  templateUrl: './javascript-event-loop-experience.component.html',
  styleUrls: ['./javascript-event-loop-experience.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JavaScriptEventLoopExperienceComponent implements AfterViewInit, OnDestroy {
  private readonly analytics = inject(AnalyticsService);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  @Output() readonly completed = new EventEmitter<void>();

  readonly code = EVENT_LOOP_CODE;
  readonly predictionChoices = PREDICTION_CHOICES;
  readonly checkpointChoices = CHECKPOINT_CHOICES;
  readonly paintChoices = PAINT_CHOICES;
  readonly finalTakeaway = FINAL_TAKEAWAY;
  readonly state = signal(createEventLoopExperienceState());
  readonly score = computed(() => eventLoopExperienceScore(this.state()));
  readonly snapshot = computed(() => EVENT_LOOP_SNAPSHOTS[this.state().traceStep]);
  readonly liveMessage = signal('');
  readonly checkpointFeedback = computed(() => {
    const correct = this.state().checkpointCorrect;
    if (correct === null) return '';
    return correct
      ? 'Correct. The microtask checkpoint drains before the browser chooses the timer task.'
      : 'Not quite. A zero-delay timer is only eligible for a later task; the queued Promise microtask drains first.';
  });
  readonly paintFeedback = computed(() => {
    const correct = this.state().paintCorrect;
    if (correct === null) return '';
    return correct
      ? 'Correct. If the queue empties, the browser can consider rendering after the checkpoint, but a paint is not guaranteed.'
      : 'Not quite. If every microtask indefinitely queues another, the checkpoint never finishes, so no render opportunity is reached.';
  });

  private observer?: IntersectionObserver;
  private viewTimer: number | null = null;
  private focusTimer: number | null = null;
  private intersectionRatio = 0;
  private viewTracked = false;
  private startedAt: number | null = null;
  private lastCompletedAttempt = 0;

  private readonly onDocumentVisibilityChange = (): void => {
    this.syncQualifiedViewTimer();
  };

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    this.document.addEventListener('visibilitychange', this.onDocumentVisibilityChange);
    const Observer = this.document.defaultView?.IntersectionObserver;
    if (typeof Observer !== 'function') return;

    this.observer = new Observer(
      (entries) => {
        const entry = entries[0];
        this.intersectionRatio = entry?.isIntersecting ? entry.intersectionRatio : 0;
        this.syncQualifiedViewTimer();
      },
      { threshold: [0, QUALIFIED_VIEW_RATIO, 1] },
    );
    this.observer.observe(this.host.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.clearQualifiedViewTimer();
    this.clearFocusTimer();
    if (this.isBrowser) {
      this.document.removeEventListener('visibilitychange', this.onDocumentVisibilityChange);
    }
  }

  selectPrediction(choice: PredictionChoiceId): void {
    this.beginInteraction();
    this.dispatch({ type: 'select-prediction', choice });
  }

  submitPrediction(): void {
    const before = this.state();
    if (before.phase !== 'prediction' || !before.predictionSelection) return;

    this.beginInteraction();
    this.dispatch({ type: 'submit-prediction' });
    this.liveMessage.set('Prediction locked. Start the trace to test it without revealing the answer yet.');
    this.trackInteraction('prediction_submitted', this.state().predictionCorrect ?? false);
    this.focusAfterStateChange('trace-ready');
  }

  startTrace(): void {
    if (this.state().phase !== 'trace-ready') return;

    this.beginInteraction();
    this.dispatch({ type: 'start-trace' });
    this.liveMessage.set('The current script finished. Choose what the browser runs next.');
    this.trackInteraction('trace_started');
    this.focusAfterStateChange('checkpoint');
  }

  selectCheckpoint(choice: CheckpointChoiceId): void {
    this.beginInteraction();
    this.dispatch({ type: 'select-checkpoint', choice });
  }

  submitCheckpoint(): void {
    const before = this.state();
    if (before.phase !== 'checkpoint' || !before.checkpointSelection) return;

    this.beginInteraction();
    this.dispatch({ type: 'submit-checkpoint' });
    const correct = this.state().checkpointCorrect ?? false;
    this.liveMessage.set(this.checkpointFeedback());
    this.trackInteraction('checkpoint_submitted', correct);
    this.focusAfterStateChange('checkpoint-feedback');
  }

  drainMicrotasks(): void {
    if (this.state().phase !== 'microtask-ready') return;

    this.beginInteraction();
    this.dispatch({ type: 'drain-microtasks' });
    this.liveMessage.set('The Promise callback logged promise and the microtask queue is now empty.');
    this.focusAfterStateChange('paint');
  }

  selectPaint(choice: PaintChoiceId): void {
    this.beginInteraction();
    this.dispatch({ type: 'select-paint', choice });
  }

  submitPaint(): void {
    const before = this.state();
    if (before.phase !== 'paint' || !before.paintSelection) return;

    this.beginInteraction();
    this.dispatch({ type: 'submit-paint' });
    const correct = this.state().paintCorrect ?? false;
    this.liveMessage.set(this.paintFeedback());
    this.trackInteraction('paint_submitted', correct);
    this.focusAfterStateChange('paint-feedback');
  }

  finishTrace(): void {
    const before = this.state();
    if (before.phase !== 'next-task-ready') return;

    this.beginInteraction();
    this.dispatch({ type: 'finish-trace' });
    const current = this.state();
    const perfect = this.score() === 3;
    this.liveMessage.set(`Trace complete. Your first-answer score is ${this.score()} out of 3.`);
    this.trackInteraction('trace_completed', perfect);
    this.analytics.track('trivia_lab_completed', this.analyticsPayload(perfect));

    if (this.lastCompletedAttempt !== current.attempt) {
      this.lastCompletedAttempt = current.attempt;
      this.completed.emit();
    }
    this.focusAfterStateChange('result');
  }

  replay(): void {
    if (this.state().phase !== 'complete') return;

    this.beginInteraction();
    this.trackInteraction('replayed');
    this.dispatch({ type: 'replay' });
    this.startedAt = null;
    this.liveMessage.set('The lab was reset for another attempt.');
    this.focusAfterStateChange('prediction');
  }

  onRelatedChallengeClick(): void {
    this.beginInteraction();
    this.trackInteraction('related_challenge_clicked');
  }

  trackChoice(_: number, choice: { readonly id: string }): string {
    return choice.id;
  }

  choiceMarker(index: number): string {
    return String.fromCharCode(65 + index);
  }

  private dispatch(action: EventLoopExperienceAction): void {
    this.state.update((current) => reduceEventLoopExperience(current, action));
  }

  private focusAfterStateChange(target: string): void {
    if (!this.isBrowser) return;
    this.clearFocusTimer();
    this.focusTimer = this.document.defaultView?.setTimeout(() => {
      this.focusTimer = null;
      this.changeDetector.detectChanges();
      this.host.nativeElement
        .querySelector<HTMLElement>(`[data-focus-target="${target}"]`)
        ?.focus({ preventScroll: true });
    }, 0) ?? null;
  }

  private clearFocusTimer(): void {
    if (this.focusTimer === null) return;
    this.document.defaultView?.clearTimeout(this.focusTimer);
    this.focusTimer = null;
  }

  private beginInteraction(): void {
    if (!this.isBrowser) return;
    if (this.startedAt === null) this.startedAt = Date.now();
  }

  private trackInteraction(action: LabInteractionAction, correct?: boolean): void {
    this.analytics.track('trivia_lab_interacted', {
      ...this.analyticsPayload(correct),
      action,
    });
  }

  private analyticsPayload(correct?: boolean): Record<string, unknown> {
    return {
      lab_id: LAB_ID,
      question_id: QUESTION_ID,
      scenario_id: SCENARIO_ID,
      attempt_bucket: this.state().attempt === 1 ? 'first' : 'repeat',
      elapsed_sec: this.elapsedSeconds(),
      ...(typeof correct === 'boolean' ? { correct } : {}),
    };
  }

  private elapsedSeconds(): number {
    if (this.startedAt === null) return 0;
    return Math.max(0, Math.round((Date.now() - this.startedAt) / 1_000));
  }

  private syncQualifiedViewTimer(): void {
    if (!this.isBrowser || this.viewTracked) {
      this.clearQualifiedViewTimer();
      return;
    }

    const qualifies =
      this.intersectionRatio >= QUALIFIED_VIEW_RATIO
      && this.document.visibilityState === 'visible';
    if (!qualifies) {
      this.clearQualifiedViewTimer();
      return;
    }
    if (this.viewTimer !== null) return;

    this.viewTimer = this.document.defaultView?.setTimeout(() => {
      this.viewTimer = null;
      if (
        this.intersectionRatio >= QUALIFIED_VIEW_RATIO
        && this.document.visibilityState === 'visible'
      ) {
        this.trackQualifiedView();
      }
    }, QUALIFIED_VIEW_MS) ?? null;
  }

  private clearQualifiedViewTimer(): void {
    if (this.viewTimer === null) return;
    this.document.defaultView?.clearTimeout(this.viewTimer);
    this.viewTimer = null;
  }

  private trackQualifiedView(): void {
    if (!this.isBrowser || this.viewTracked) return;
    this.viewTracked = true;
    this.clearQualifiedViewTimer();
    this.analytics.track('trivia_lab_viewed', this.analyticsPayload());
  }
}
