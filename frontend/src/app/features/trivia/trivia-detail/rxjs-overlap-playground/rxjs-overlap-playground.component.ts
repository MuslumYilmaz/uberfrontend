import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DOCUMENT,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { FaButtonComponent } from '../../../../shared/ui/button/fa-button.component';
import { FaCardComponent } from '../../../../shared/ui/card/fa-card.component';
import { FaChipComponent } from '../../../../shared/ui/chip/fa-chip.component';
import {
  BURST_LABELS,
  FINAL_TAKEAWAY,
  HAZARD_TITLES,
  INTENT_LABELS,
  OPERATOR_TAGLINES,
  OVERLAP_RELATED_LINKS,
  OVERLAP_SCENARIOS,
  OverlapScenario,
  choiceLabel,
  hazardSentence,
  laneSummary,
  predictionFeedback,
  requestSentence,
  scenarioFragmentId,
  scenarioIdFromFragment,
  streamSentence,
  uiSummary,
  verdictHeading,
  verdictSentence,
} from './rxjs-overlap-playground.content';
import {
  AXIS_MS,
  BURST_PATTERNS,
  BurstPattern,
  DURATION_STEP_MS,
  HazardSeverity,
  MAX_DURATION_MS,
  MAX_TRIGGERS,
  MAX_TRIGGER_AT,
  MIN_DURATION_MS,
  OVERLAP_INTENTS,
  OVERLAP_OPERATORS,
  OverlapAction,
  OverlapIntent,
  OverlapOperator,
  OverlapRunResult,
  OverlapScenarioId,
  OverlapView,
  RECOMMENDED_OPERATOR,
  RequestOutcome,
  buildPredictionChoices,
  createOverlapState,
  evaluateVerdict,
  overlapQualification,
  predictionNeeded,
  reduceOverlap,
} from './rxjs-overlap-playground.model';
import { RXJS_VIRTUAL_TIME_ENGINE } from './rxjs-overlap-playground.rxjs-engine';

type LabInteractionAction =
  | 'scenario_selected'
  | 'operator_selected'
  | 'intent_selected'
  | 'view_switched'
  | 'duration_changed'
  | 'trigger_added'
  | 'trigger_moved'
  | 'trigger_removed'
  | 'trigger_duration_overridden'
  | 'burst_applied'
  | 'prediction_submitted'
  | 'revealed'
  | 'compare_revealed'
  | 'fix_applied'
  | 'cursor_stepped'
  | 'played'
  | 'reset'
  | 'related_link_clicked';

interface BarView {
  readonly triggerId: string;
  readonly label: string;
  readonly outcome: RequestOutcome;
  readonly row: number;
  readonly startPct: number;
  readonly widthPct: number;
  readonly tailStartPct: number;
  readonly tailWidthPct: number;
  readonly waitStartPct: number;
  readonly waitWidthPct: number;
  readonly title: string;
}

interface MarkerView {
  readonly triggerId: string;
  readonly label: string;
  readonly pct: number;
  readonly at: number;
}

interface LaneView {
  readonly operator: OverlapOperator;
  readonly tagline: string;
  readonly revealed: boolean;
  readonly heightPx: number;
  readonly bars: readonly BarView[];
  readonly drops: readonly MarkerView[];
  readonly deliveries: readonly MarkerView[];
  readonly sentences: readonly string[];
  readonly uiLine: string;
  readonly summary: string;
}

interface HazardView {
  readonly code: string;
  readonly severity: HazardSeverity;
  readonly title: string;
  readonly sentence: string;
}

export const RXJS_OVERLAP_PLAYGROUND_LAB_ID = 'rxjs_overlap_playground';
const LAB_ID = RXJS_OVERLAP_PLAYGROUND_LAB_ID;
const QUESTION_ID = 'rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use';
const QUALIFIED_VIEW_MS = 1_000;
const QUALIFIED_VIEW_RATIO = 0.5;
const ROW_PX = 30;
const PLAY_TICK_MS = 40;
const PLAY_STEP_MS = 20;
const TICKS_MS = [0, 300, 600, 900, 1200];

function toPct(ms: number): number {
  return Math.round((ms / AXIS_MS) * 10000) / 100;
}

@Component({
  selector: 'app-rxjs-overlap-playground',
  imports: [FaButtonComponent, FaCardComponent, FaChipComponent],
  templateUrl: './rxjs-overlap-playground.component.html',
  styleUrls: ['./rxjs-overlap-playground.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RxjsOverlapPlaygroundComponent implements AfterViewInit, OnDestroy {
  private readonly analytics = inject(AnalyticsService);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly engine = RXJS_VIRTUAL_TIME_ENGINE;

  @Output() readonly completed = new EventEmitter<void>();

  readonly axisMs = AXIS_MS;
  readonly rowPx = ROW_PX;
  readonly maxTriggerAt = MAX_TRIGGER_AT;
  readonly maxTriggers = MAX_TRIGGERS;
  readonly minDuration = MIN_DURATION_MS;
  readonly maxDuration = MAX_DURATION_MS;
  readonly durationStep = DURATION_STEP_MS;
  readonly scenarios = OVERLAP_SCENARIOS;
  readonly operators = OVERLAP_OPERATORS;
  readonly intents = OVERLAP_INTENTS;
  readonly taglines = OPERATOR_TAGLINES;
  readonly intentLabels = INTENT_LABELS;
  readonly burstPatterns = Object.keys(BURST_PATTERNS) as BurstPattern[];
  readonly burstLabels = BURST_LABELS;
  readonly relatedLinks = OVERLAP_RELATED_LINKS;
  readonly finalTakeaway = FINAL_TAKEAWAY;
  readonly ticks = TICKS_MS.map((ms) => ({ ms, pct: toPct(ms) }));

  readonly state = signal(createOverlapState(RXJS_VIRTUAL_TIME_ENGINE));
  readonly liveMessage = signal('');
  readonly reducedMotion = signal(true);
  readonly playing = signal(false);

  readonly scenario = computed<OverlapScenario | null>(() => {
    const id = this.state().scenario?.id;
    return id ? OVERLAP_SCENARIOS.find((scenario) => scenario.id === id) ?? null : null;
  });
  readonly scenarioIndex = computed(() => {
    const scenario = this.scenario();
    return scenario ? OVERLAP_SCENARIOS.indexOf(scenario) + 1 : 0;
  });
  readonly revealed = computed(() => this.state().stage === 'revealed');
  readonly intentLabel = computed(() => INTENT_LABELS[this.state().intent]);
  readonly recommendedOperator = computed(() => RECOMMENDED_OPERATOR[this.state().intent]);
  readonly streamText = computed(() => streamSentence(this.state().triggers, this.state().defaultDurationMs));
  readonly canAddTrigger = computed(() => this.state().triggers.length < MAX_TRIGGERS);
  readonly cursorPct = computed(() => toPct(this.state().cursorMs));
  readonly stageLabel = computed(() => (this.revealed() ? 'Revealed' : 'Ready to reveal'));
  readonly triggerMarkers = computed<MarkerView[]>(() =>
    this.state().triggers.map((trigger) => ({ triggerId: trigger.id, label: trigger.label, pct: toPct(trigger.at), at: trigger.at })));
  readonly triggerRows = computed(() => this.state().triggers.map((trigger) => ({ ...trigger })));
  readonly predictionChoices = computed(() =>
    buildPredictionChoices(this.state().runs).map((choice) => ({ ...choice, label: choiceLabel(choice) })));
  readonly predictionNeeded = computed(() => predictionNeeded(buildPredictionChoices(this.state().runs)));
  readonly showPrediction = computed(() => !this.revealed() && this.state().view === 'single' && this.predictionNeeded());
  readonly canReveal = computed(() => {
    const state = this.state();
    if (state.stage !== 'ready') return false;
    if (state.view === 'compare' || !this.predictionNeeded()) return true;
    return Boolean(state.prediction.choiceKey);
  });
  readonly revealLabel = computed(() => {
    if (this.state().view === 'compare') return 'Reveal all four';
    return this.predictionNeeded() ? 'Lock prediction and reveal' : 'Reveal';
  });
  readonly lanes = computed<LaneView[]>(() => {
    const state = this.state();
    const operators = state.view === 'compare' ? OVERLAP_OPERATORS : [state.operator];
    return operators.map((operator) => this.laneView(state.runs[operator], state.stage === 'revealed', state.cursorMs));
  });
  readonly verdict = computed(() => {
    const state = this.state();
    if (state.stage !== 'revealed' || state.view !== 'single') return null;
    const run = state.runs[state.operator];
    const verdict = evaluateVerdict(run, state.intent);
    const chosen = this.predictionChoices().find((choice) => choice.key === state.prediction.choiceKey);
    return {
      fits: verdict.fits,
      heading: verdictHeading(verdict),
      sentence: verdictSentence(verdict, run),
      hazards: verdict.hazards.map((hazard): HazardView => ({
        code: hazard.code,
        severity: hazard.severity,
        title: HAZARD_TITLES[hazard.code],
        sentence: hazardSentence(hazard, run),
      })),
      predictionCorrect: state.prediction.correct,
      predictionFeedback: predictionFeedback(state.prediction.correct, chosen?.label ?? null, uiSummary(run.deliveries)),
      fixLabel: state.operator === verdict.recommended ? null : `Switch to ${verdict.recommended} and reveal again`,
    };
  });
  readonly compareRows = computed(() => {
    const state = this.state();
    if (state.stage !== 'revealed' || state.view !== 'compare') return [];
    return OVERLAP_OPERATORS.map((operator) => {
      const run = state.runs[operator];
      const verdict = evaluateVerdict(run, state.intent);
      const danger = verdict.hazards.filter((hazard) => hazard.severity === 'danger');
      return {
        operator,
        fits: verdict.fits,
        uiSummary: uiSummary(run.deliveries),
        verdict: verdict.fits
          ? 'Fits the promise'
          : danger.length
            ? danger.map((hazard) => HAZARD_TITLES[hazard.code]).join('; ')
            : `Works, but ${verdict.recommended} states the intent`,
      };
    });
  });
  readonly scoreText = computed(() => {
    const state = this.state();
    const parts = [`Predictions: ${state.correctPredictions} of ${state.predictionsSubmitted} correct.`];
    parts.push(`Scenarios revealed: ${state.revealedScenarioIds.length} of ${OVERLAP_SCENARIOS.length}.`);
    if (state.compareReveals) parts.push(`Compare runs: ${state.compareReveals}.`);
    return parts.join(' ');
  });

  private observer?: IntersectionObserver;
  private viewTimer: number | null = null;
  private focusTimer: number | null = null;
  private playTimer: number | null = null;
  private intersectionRatio = 0;
  private viewTracked = false;
  private startedAt: number | null = null;
  private completionEmitted = false;

  private readonly onDocumentVisibilityChange = (): void => {
    this.syncQualifiedViewTimer();
  };

  constructor() {
    const preset = scenarioIdFromFragment(this.route?.snapshot?.fragment);
    if (preset) this.applyScenarioSelection(preset);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    const view = this.document.defaultView;
    const query = view?.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (query) {
      this.reducedMotion.set(query.matches);
      this.changeDetector.markForCheck();
    }

    this.document.addEventListener('visibilitychange', this.onDocumentVisibilityChange);
    const Observer = view?.IntersectionObserver;
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
    this.stopPlaying();
    if (this.isBrowser) {
      this.document.removeEventListener('visibilitychange', this.onDocumentVisibilityChange);
    }
  }

  fragmentId(id: OverlapScenarioId): string {
    return scenarioFragmentId(id);
  }

  choiceMarker(index: number): string {
    return String.fromCharCode(65 + index);
  }

  selectScenario(id: OverlapScenarioId): void {
    if (!this.applyScenarioSelection(id)) return;
    this.beginInteraction();
    this.stopPlaying();
    this.liveMessage.set(`Loaded scenario: ${this.scenario()?.title ?? id}. Predict the UI result, then reveal.`);
    this.trackInteraction('scenario_selected');
    this.focusAfterStateChange('scenario');
  }

  setOperator(operator: OverlapOperator): void {
    if (this.state().operator === operator) return;
    this.beginInteraction();
    this.stopPlaying();
    this.dispatch({ type: 'set-operator', operator });
    this.liveMessage.set(`${operator} selected: ${OPERATOR_TAGLINES[operator]}.`);
    this.trackInteraction('operator_selected');
  }

  setIntent(value: string): void {
    const intent = OVERLAP_INTENTS.find((candidate) => candidate === value);
    if (!intent || this.state().intent === intent) return;
    this.beginInteraction();
    this.stopPlaying();
    this.dispatch({ type: 'set-intent', intent });
    this.liveMessage.set(`UI promise: ${INTENT_LABELS[intent]}. ${RECOMMENDED_OPERATOR[intent]} encodes it.`);
    this.trackInteraction('intent_selected');
  }

  setView(view: OverlapView): void {
    if (this.state().view === view) return;
    this.beginInteraction();
    this.stopPlaying();
    this.dispatch({ type: 'set-view', view });
    this.liveMessage.set(view === 'compare'
      ? 'Compare mode: the next reveal runs all four operators on the same stream.'
      : 'Single operator mode: predict before you reveal.');
    this.trackInteraction('view_switched');
  }

  setDefaultDuration(value: string | number): void {
    const ms = Number(value);
    if (!Number.isFinite(ms)) return;
    this.beginInteraction();
    this.stopPlaying();
    const before = this.state().defaultDurationMs;
    this.dispatch({ type: 'set-default-duration', ms });
    if (this.state().defaultDurationMs === before) return;
    this.liveMessage.set(`Requests now take ${this.state().defaultDurationMs} ms.`);
    this.trackInteraction('duration_changed', { duration_ms: this.state().defaultDurationMs });
  }

  addTrigger(at?: number): void {
    if (!this.canAddTrigger()) return;
    this.beginInteraction();
    this.stopPlaying();
    const before = this.state().triggers.length;
    this.dispatch({ type: 'add-trigger', at });
    if (this.state().triggers.length === before) return;
    const added = this.state().triggers.reduce((latest, trigger) =>
      Number(trigger.id.slice(1)) > Number(latest.id.slice(1)) ? trigger : latest);
    this.liveMessage.set(`Added trigger ${added.label} at ${added.at} ms.`);
    this.trackInteraction('trigger_added', { trigger_at: added.at });
    this.openEditor();
    this.focusAfterStateChange(`trigger-${added.id}`);
  }

  addTriggerFromAxis(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement | null;
    if (!target || event.detail === 0) {
      this.addTrigger();
      return;
    }
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0) {
      this.addTrigger();
      return;
    }
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    this.addTrigger(Math.round(ratio * AXIS_MS));
  }

  moveTrigger(id: string, value: string | number): void {
    const at = Number(value);
    if (!Number.isFinite(at)) return;
    this.beginInteraction();
    this.stopPlaying();
    const before = this.state();
    this.dispatch({ type: 'move-trigger', id, at });
    if (this.state() === before) return;
    const moved = this.state().triggers.find((trigger) => trigger.id === id);
    this.liveMessage.set(moved ? `Trigger ${moved.label} moved to ${moved.at} ms.` : 'Trigger moved.');
    this.trackInteraction('trigger_moved', { trigger_at: moved?.at ?? null });
  }

  setTriggerDuration(id: string, value: string | number): void {
    const raw = String(value).trim();
    const ms = raw === '' ? null : Number(raw);
    if (ms !== null && !Number.isFinite(ms)) return;
    this.beginInteraction();
    this.stopPlaying();
    const before = this.state();
    this.dispatch({ type: 'set-trigger-duration', id, ms });
    if (this.state() === before) return;
    const changed = this.state().triggers.find((trigger) => trigger.id === id);
    this.liveMessage.set(changed?.durationMs === null
      ? `Trigger ${changed.label} uses the default request duration again.`
      : `Trigger ${changed?.label} request now takes ${changed?.durationMs} ms.`);
    this.trackInteraction('trigger_duration_overridden', { duration_ms: changed?.durationMs ?? null });
  }

  removeTrigger(id: string): void {
    this.beginInteraction();
    this.stopPlaying();
    const before = this.state();
    this.dispatch({ type: 'remove-trigger', id });
    if (this.state() === before) return;
    this.liveMessage.set(`Trigger removed. ${this.state().triggers.length} left.`);
    this.trackInteraction('trigger_removed');
  }

  applyBurst(pattern: BurstPattern): void {
    this.beginInteraction();
    this.stopPlaying();
    this.dispatch({ type: 'apply-burst', pattern });
    this.liveMessage.set(`${BURST_LABELS[pattern]} loaded.`);
    this.trackInteraction('burst_applied', { burst: pattern });
  }

  selectPrediction(key: string): void {
    this.beginInteraction();
    this.dispatch({ type: 'select-prediction', key });
  }

  reveal(): void {
    if (!this.canReveal()) return;
    this.beginInteraction();
    this.stopPlaying();
    const compare = this.state().view === 'compare';
    this.dispatch({ type: 'reveal' });
    if (this.state().stage !== 'revealed') return;
    const state = this.state();
    if (state.prediction.submitted) {
      this.trackInteraction('prediction_submitted', {
        correct: state.prediction.correct,
        choice_index: this.predictionChoices().findIndex((choice) => choice.key === state.prediction.choiceKey),
      });
    }
    this.afterReveal(compare ? 'compare_revealed' : 'revealed');
  }

  applyFix(): void {
    if (!this.verdict()?.fixLabel) return;
    this.beginInteraction();
    this.stopPlaying();
    const from = this.state().operator;
    this.dispatch({ type: 'apply-fix' });
    this.trackInteraction('fix_applied', { from_operator: from, to_operator: this.state().operator });
    this.afterReveal('revealed');
  }

  setCursor(value: string | number): void {
    const ms = Number(value);
    if (!Number.isFinite(ms)) return;
    this.stopPlaying();
    this.dispatch({ type: 'set-cursor', ms });
  }

  stepCursor(direction: 1 | -1): void {
    this.beginInteraction();
    this.stopPlaying();
    const before = this.state().cursorMs;
    this.dispatch({ type: 'step-cursor', direction });
    if (this.state().cursorMs === before) return;
    this.liveMessage.set(`Cursor at ${this.state().cursorMs} ms.`);
    this.trackInteraction('cursor_stepped', { cursor_ms: this.state().cursorMs });
  }

  togglePlay(): void {
    if (this.playing()) {
      this.stopPlaying();
      return;
    }
    if (!this.isBrowser || this.reducedMotion()) return;
    this.beginInteraction();
    if (this.state().cursorMs >= AXIS_MS) this.dispatch({ type: 'set-cursor', ms: 0 });
    this.playing.set(true);
    this.trackInteraction('played');
    this.playTimer = this.document.defaultView?.setInterval(() => {
      const next = Math.min(AXIS_MS, this.state().cursorMs + PLAY_STEP_MS);
      this.dispatch({ type: 'set-cursor', ms: next });
      if (next >= AXIS_MS) this.stopPlaying();
      this.changeDetector.markForCheck();
    }, PLAY_TICK_MS) ?? null;
  }

  reset(): void {
    this.beginInteraction();
    this.stopPlaying();
    this.dispatch({ type: 'reset' });
    this.liveMessage.set(this.state().scenario ? 'Scenario reset to its starting stream.' : 'Playground reset to the seed stream.');
    this.trackInteraction('reset');
    this.focusAfterStateChange('scenario');
  }

  focusTrigger(id: string, event: Event): void {
    event.stopPropagation();
    this.openEditor();
    this.focusAfterStateChange(`trigger-${id}`);
  }

  /** The trigger inputs live inside a collapsed details element; open it before handing focus to them. */
  private openEditor(): void {
    if (!this.isBrowser) return;
    const details = this.host.nativeElement.querySelector<HTMLDetailsElement>('[data-testid="overlap-editor"]');
    if (details && !details.open) details.open = true;
  }

  onRelatedLinkClick(linkId: string): void {
    this.beginInteraction();
    this.trackInteraction('related_link_clicked', { link: linkId });
  }

  private laneView(run: OverlapRunResult, revealed: boolean, cursorMs: number): LaneView {
    const bars: BarView[] = [];
    const drops: MarkerView[] = [];
    const deliveries: MarkerView[] = [];
    if (revealed) {
      for (const request of run.requests) {
        if (request.outcome === 'dropped') {
          if (request.triggeredAt <= cursorMs) {
            drops.push({ triggerId: request.triggerId, label: request.label, pct: toPct(request.triggeredAt), at: request.triggeredAt });
          }
          continue;
        }
        const waitStart = request.triggeredAt;
        const waitEnd = request.outcome === 'queued' ? AXIS_MS : (request.startedAt ?? request.triggeredAt);
        const barStart = request.startedAt ?? AXIS_MS;
        const barEnd = request.outcome === 'running' ? AXIS_MS : (request.endedAt ?? AXIS_MS);
        const tailStart = request.outcome === 'cancelled' ? (request.endedAt ?? barEnd) : barEnd;
        const tailEnd = request.outcome === 'cancelled' ? Math.min(AXIS_MS, request.serverEndsAt ?? tailStart) : tailStart;
        const clip = (start: number, end: number): [number, number] => [Math.min(start, cursorMs), Math.min(end, cursorMs)];
        const [ws, we] = clip(waitStart, waitEnd);
        const [bs, be] = clip(barStart, barEnd);
        const [ts, te] = clip(tailStart, tailEnd);
        bars.push({
          triggerId: request.triggerId,
          label: request.label,
          outcome: request.outcome,
          row: Math.max(0, request.row),
          startPct: toPct(bs),
          widthPct: Math.max(0, toPct(be) - toPct(bs)),
          tailStartPct: toPct(ts),
          tailWidthPct: Math.max(0, toPct(te) - toPct(ts)),
          waitStartPct: toPct(ws),
          waitWidthPct: Math.max(0, toPct(we) - toPct(ws)),
          title: requestSentence(request),
        });
      }
      for (const delivery of run.deliveries) {
        if (delivery.at <= cursorMs) {
          deliveries.push({ triggerId: delivery.triggerId, label: delivery.label, pct: toPct(delivery.at), at: delivery.at });
        }
      }
    }
    return {
      operator: run.operator,
      tagline: OPERATOR_TAGLINES[run.operator],
      revealed,
      heightPx: Math.max(1, run.rowCount) * ROW_PX,
      bars,
      drops,
      deliveries,
      sentences: revealed ? run.requests.map((request) => requestSentence(request)) : [],
      uiLine: uiSummary(run.deliveries),
      summary: laneSummary(run),
    };
  }

  private applyScenarioSelection(id: OverlapScenarioId): boolean {
    const scenario = OVERLAP_SCENARIOS.find((candidate) => candidate.id === id);
    if (!scenario) return false;
    this.dispatch({ type: 'select-scenario', preset: scenario.preset });
    return true;
  }

  private afterReveal(action: 'revealed' | 'compare_revealed'): void {
    const state = this.state();
    if (state.view === 'compare') {
      this.liveMessage.set(`Revealed all four operators. ${OVERLAP_OPERATORS.map((operator) => `${operator}: ${uiSummary(state.runs[operator].deliveries)}`).join('. ')}.`);
      this.trackInteraction(action, { deliveries: OVERLAP_OPERATORS.map((operator) => state.runs[operator].deliveries.length) });
    } else {
      const verdict = evaluateVerdict(state.runs[state.operator], state.intent);
      this.liveMessage.set(`${verdictHeading(verdict)}. ${verdictSentence(verdict, state.runs[state.operator])}`);
      this.trackInteraction(action, {
        fits: verdict.fits,
        hazards: verdict.hazards.map((hazard) => hazard.code),
        danger_count: verdict.hazards.filter((hazard) => hazard.severity === 'danger').length,
        deliveries: state.runs[state.operator].deliveries.length,
      });
    }
    this.maybeComplete();
    this.focusAfterStateChange('result');
  }

  private maybeComplete(): void {
    const qualification = overlapQualification(this.state());
    if (this.completionEmitted || !qualification) return;
    this.completionEmitted = true;
    const state = this.state();
    this.analytics.track('trivia_lab_completed', this.analyticsPayload({
      qualification,
      correct_predictions: state.correctPredictions,
      scenarios_revealed: state.revealedScenarioIds.length,
      compare_reveals: state.compareReveals,
      fixes_applied: state.fixesApplied,
    }));
    this.completed.emit();
  }

  private dispatch(action: OverlapAction): void {
    this.state.update((current) => reduceOverlap(current, action, this.engine));
  }

  private stopPlaying(): void {
    if (this.playTimer !== null) {
      this.document.defaultView?.clearInterval(this.playTimer);
      this.playTimer = null;
    }
    if (this.playing()) this.playing.set(false);
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

  private trackInteraction(action: LabInteractionAction, extra: Record<string, unknown> = {}): void {
    this.analytics.track('trivia_lab_interacted', {
      ...this.analyticsPayload(extra),
      action,
    });
  }

  private analyticsPayload(extra: Record<string, unknown> = {}): Record<string, unknown> {
    const state = this.state();
    return {
      lab_id: LAB_ID,
      question_id: QUESTION_ID,
      scenario_id: state.scenario?.id ?? 'custom',
      scenario_dirty: state.scenarioDirty,
      operator: state.operator,
      intent: state.intent,
      view: state.view,
      trigger_count: state.triggers.length,
      attempt_bucket: state.revealCount <= 1 ? 'first' : 'repeat',
      elapsed_sec: this.elapsedSeconds(),
      ...extra,
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
