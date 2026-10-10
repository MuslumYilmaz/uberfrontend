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
  CD_DIAGNOSIS_HEADINGS,
  CD_FIX_COPY,
  CD_MODES,
  CD_NODES,
  CD_NODE_LABELS,
  CD_OUTCOME_LABELS,
  CD_REASON_COPY,
  CD_RELATED_LINKS,
  CD_SCENARIOS,
  CD_TRIGGERS,
  CdScenario,
  FINAL_TAKEAWAY,
  diagnosisSentence,
  freshHeading,
  freshSentence,
  liveSummary,
  scenarioFragmentId,
  scenarioIdFromFragment,
  scheduleLabel,
  triggerSummary,
} from './angular-change-detection-visualizer.content';
import {
  CD_DEPTH,
  CD_NODE_COUNT,
  CdMode,
  CdNodeId,
  CdScenarioId,
  CdTriggerType,
  CdVisualizerAction,
  createVisualizerState,
  isStale,
  isTriggerAllowed,
  isVisualizerQualified,
  reduceVisualizer,
} from './angular-change-detection-visualizer.model';

type LabInteractionAction =
  | 'scenario_selected'
  | 'scenario_run'
  | 'trigger_fired'
  | 'strategy_toggled'
  | 'mode_switched'
  | 'diagnosis_shown'
  | 'fix_applied'
  | 'reset'
  | 'related_link_clicked';

export const ANGULAR_CHANGE_DETECTION_VISUALIZER_LAB_ID = 'angular_change_detection_visualizer';
const LAB_ID = ANGULAR_CHANGE_DETECTION_VISUALIZER_LAB_ID;
const QUESTION_ID = 'angular-change-detection-strategies';
const QUALIFIED_VIEW_MS = 1_000;
const QUALIFIED_VIEW_RATIO = 0.5;

@Component({
  selector: 'app-angular-change-detection-visualizer',
  imports: [FaButtonComponent, FaCardComponent, FaChipComponent],
  templateUrl: './angular-change-detection-visualizer.component.html',
  styleUrls: ['./angular-change-detection-visualizer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AngularChangeDetectionVisualizerComponent implements AfterViewInit, OnDestroy {
  private readonly analytics = inject(AnalyticsService);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  @Output() readonly completed = new EventEmitter<void>();

  readonly nodeCount = CD_NODE_COUNT;
  readonly scenarios = CD_SCENARIOS;
  readonly modes = CD_MODES;
  readonly relatedLinks = CD_RELATED_LINKS;
  readonly finalTakeaway = FINAL_TAKEAWAY;
  readonly state = signal(createVisualizerState());
  readonly liveMessage = signal('');

  readonly selectedScenario = computed<CdScenario | null>(() => {
    const id = this.state().scenario?.id;
    return id ? CD_SCENARIOS.find((scenario) => scenario.id === id) ?? null : null;
  });
  readonly selectedScenarioIndex = computed(() => {
    const scenario = this.selectedScenario();
    return scenario ? CD_SCENARIOS.indexOf(scenario) + 1 : 0;
  });
  readonly selectedNodeLabel = computed(() => CD_NODE_LABELS[this.state().selectedNodeId]);
  readonly lastRun = computed(() => this.state().lastRun);
  readonly checkedCount = computed(() => this.state().lastRun?.checkedCount ?? 0);
  readonly runLabel = computed(() => (this.state().stage === 'ready' ? 'Run scenario' : 'Run again'));
  readonly triggers = computed(() => {
    const nodeId = this.state().selectedNodeId;
    return CD_TRIGGERS.map((trigger) => ({ ...trigger, disabled: !isTriggerAllowed(trigger.type, nodeId) }));
  });
  readonly nodeViews = computed(() => {
    const { nodes, selectedNodeId } = this.state();
    return CD_NODES.map((meta) => {
      const node = nodes[meta.id];
      return {
        meta,
        node,
        depth: CD_DEPTH[meta.id],
        selected: selectedNodeId === meta.id,
        stale: isStale(node),
        outcomeLabel: CD_OUTCOME_LABELS[node.outcome],
        strategyLabel: node.strategy === 'onpush' ? 'OnPush' : 'Default',
      };
    });
  });
  readonly traceSteps = computed(() => {
    const run = this.state().lastRun;
    if (!run) return [];
    return run.steps.map((step) => ({
      ...step,
      nodeLabel: step.nodeId ? CD_NODE_LABELS[step.nodeId] : 'Scheduler',
      text: `${CD_REASON_COPY[step.reason]}${step.domUpdated ? '. DOM updated' : ''}`,
    }));
  });
  readonly traceHeading = computed(() => {
    const run = this.state().lastRun;
    return run ? scheduleLabel(run) : '';
  });
  readonly traceTrigger = computed(() => {
    const run = this.state().lastRun;
    return run ? triggerSummary(run) : '';
  });
  readonly diagnosis = computed(() => {
    const diagnosis = this.state().lastRun?.diagnosis;
    if (!diagnosis) return null;
    const fix = CD_FIX_COPY[diagnosis.fix];
    return {
      code: diagnosis.code,
      heading: CD_DIAGNOSIS_HEADINGS[diagnosis.code],
      sentence: diagnosisSentence(diagnosis),
      fixTitle: fix.title,
      fixCode: fix.code,
      fixExplanation: fix.explanation,
    };
  });
  readonly fresh = computed(() => {
    const run = this.state().lastRun;
    if (!run || run.diagnosis) return null;
    return { heading: freshHeading(run), sentence: freshSentence(run) };
  });

  private observer?: IntersectionObserver;
  private viewTimer: number | null = null;
  private focusTimer: number | null = null;
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

  fragmentId(id: CdScenarioId): string {
    return scenarioFragmentId(id);
  }

  selectScenario(id: CdScenarioId): void {
    if (!this.applyScenarioSelection(id)) return;
    this.beginInteraction();
    this.liveMessage.set(`Loaded scenario: ${this.selectedScenario()?.title ?? id}. Run it to trace the pass.`);
    this.trackInteraction('scenario_selected');
    this.focusAfterStateChange('scenario');
  }

  runScenario(): void {
    if (!this.state().scenario) return;
    this.beginInteraction();
    this.dispatch({ type: 'run-scenario' });
    this.afterRun('scenario_run');
  }

  applyFix(): void {
    if (!this.state().lastRun?.diagnosis) return;
    this.beginInteraction();
    this.dispatch({ type: 'apply-fix' });
    this.afterRun('fix_applied');
  }

  fireTrigger(type: CdTriggerType): void {
    const nodeId = this.state().selectedNodeId;
    if (!isTriggerAllowed(type, nodeId)) return;
    this.beginInteraction();
    this.dispatch({ type: 'run-trigger', trigger: { type, nodeId } });
    this.afterRun('trigger_fired');
  }

  toggleStrategy(nodeId: CdNodeId): void {
    const current = this.state().nodes[nodeId].strategy;
    this.beginInteraction();
    this.dispatch({ type: 'set-strategy', nodeId, strategy: current === 'onpush' ? 'default' : 'onpush' });
    const next = this.state().nodes[nodeId].strategy === 'onpush' ? 'OnPush' : 'Default';
    this.liveMessage.set(`${CD_NODE_LABELS[nodeId]} now uses ${next}. Run a trigger to compare.`);
    this.trackInteraction('strategy_toggled', { node: nodeId, strategy: this.state().nodes[nodeId].strategy });
  }

  setMode(mode: CdMode): void {
    if (this.state().mode === mode) return;
    this.beginInteraction();
    this.dispatch({ type: 'set-mode', mode });
    this.liveMessage.set(mode === 'zone'
      ? 'Zone.js mode: finished async tasks schedule a pass from the root.'
      : 'Zoneless mode: only signals, markForCheck(), events, and async pipes schedule a pass.');
    this.trackInteraction('mode_switched');
  }

  selectNode(nodeId: CdNodeId): void {
    this.dispatch({ type: 'select-node', nodeId });
  }

  reset(): void {
    this.beginInteraction();
    this.dispatch({ type: 'reset' });
    this.liveMessage.set(this.state().scenario
      ? 'Scenario reset to its starting state.'
      : 'Sandbox reset: every component is Default and fresh.');
    this.trackInteraction('reset');
    this.focusAfterStateChange('scenario');
  }

  onRelatedLinkClick(linkId: string): void {
    this.beginInteraction();
    this.trackInteraction('related_link_clicked', { link: linkId });
  }

  private applyScenarioSelection(id: CdScenarioId): boolean {
    const scenario = CD_SCENARIOS.find((candidate) => candidate.id === id);
    if (!scenario) return false;
    this.dispatch({ type: 'select-scenario', preset: scenario.preset });
    return true;
  }

  private afterRun(action: LabInteractionAction): void {
    const run = this.state().lastRun;
    if (!run) return;
    this.liveMessage.set(liveSummary(run));
    this.trackInteraction(action, {
      trigger: run.trigger.type,
      node: run.trigger.nodeId,
      mode: run.mode,
      schedule: run.schedule,
      checked_count: run.checkedCount,
      stale: run.staleNodeIds.length > 0,
    });
    if (run.diagnosis) {
      this.trackInteraction('diagnosis_shown', { diagnosis: run.diagnosis.code, fix: run.diagnosis.fix });
    }
    this.maybeComplete();
    this.focusAfterStateChange('result');
  }

  private maybeComplete(): void {
    if (this.completionEmitted || !isVisualizerQualified(this.state())) return;
    this.completionEmitted = true;
    this.analytics.track('trivia_lab_completed', this.analyticsPayload({
      scenarios_run: this.state().scenariosRun.length,
      fixes_applied: this.state().fixesApplied,
    }));
    this.completed.emit();
  }

  private dispatch(action: CdVisualizerAction): void {
    this.state.update((current) => reduceVisualizer(current, action));
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
      attempt_bucket: state.runCount <= 1 ? 'first' : 'repeat',
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
