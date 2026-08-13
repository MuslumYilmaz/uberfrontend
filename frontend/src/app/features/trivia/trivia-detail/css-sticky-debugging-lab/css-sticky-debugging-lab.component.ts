import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  PLATFORM_ID,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { MonacoEditorComponent } from '../../../../monaco-editor.component';
import { FaButtonComponent } from '../../../../shared/ui/button/fa-button.component';
import { FaCardComponent } from '../../../../shared/ui/card/fa-card.component';
import { FaChipComponent } from '../../../../shared/ui/chip/fa-chip.component';
import {
  CSS_STICKY_CASES,
  CssStickyCase,
  getCssStickyCase,
} from './css-sticky-debugging-lab.content';
import {
  CssStickyCaseId,
  CssStickyFindingId,
  CssStickyInspection,
  CssStickyPane,
  clampCssSource,
  createCssStickyLabState,
  isBrokenStickyFinding,
} from './css-sticky-debugging-lab.model';
import {
  CSS_STICKY_PREVIEW_PORT,
  CSS_STICKY_PREVIEW_PORT_PROVIDER,
  CssStickyPreviewPort,
} from './css-sticky-preview-port';

type LabInteractionAction =
  | 'editor_activated'
  | 'case_selected'
  | 'inspection_run'
  | 'finding_shown'
  | 'suggested_fix_applied'
  | 'reset';

const LAB_ID = 'css_sticky_editor_inspector_v1';
const QUESTION_ID = 'css-position-sticky-not-working';
const QUALIFIED_VIEW_MS = 1_000;
const QUALIFIED_VIEW_RATIO = 0.5;

@Component({
  selector: 'app-css-sticky-debugging-lab',
  standalone: true,
  imports: [
    CommonModule,
    MonacoEditorComponent,
    FaButtonComponent,
    FaCardComponent,
    FaChipComponent,
  ],
  providers: [CSS_STICKY_PREVIEW_PORT_PROVIDER],
  templateUrl: './css-sticky-debugging-lab.component.html',
  styleUrls: ['./css-sticky-debugging-lab.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CssStickyDebuggingLabComponent implements AfterViewInit, OnDestroy {
  private readonly analytics = inject(AnalyticsService);
  private readonly previewPort = inject<CssStickyPreviewPort>(CSS_STICKY_PREVIEW_PORT);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  @ViewChild('previewFrame') private previewFrame?: ElementRef<HTMLIFrameElement>;
  @Output() readonly completed = new EventEmitter<void>();

  readonly cases = CSS_STICKY_CASES;
  readonly editorOptions = {
    fontSize: 13,
    lineHeight: 21,
    wordWrap: 'on',
    tabSize: 2,
    insertSpaces: true,
    padding: { top: 12, bottom: 12 },
    accessibilitySupport: 'auto',
  } as const;
  readonly state = signal(
    createCssStickyLabState(CSS_STICKY_CASES[0].id, CSS_STICKY_CASES[0].initialCss),
  );
  readonly selectedCase = computed(() => getCssStickyCase(this.state().selectedCaseId));
  readonly inspection = computed(() => this.state().inspection);
  readonly liveMessage = signal('');
  readonly highlightedAncestor = signal<number | null>(null);

  private observer?: IntersectionObserver;
  private viewTimer: number | null = null;
  private focusTimer: number | null = null;
  private intersectionRatio = 0;
  private viewTracked = false;
  private startedAt: number | null = null;
  private mountSequence = 0;
  private inspectionController: AbortController | null = null;
  private destroyed = false;

  private readonly onDocumentVisibilityChange = (): void => {
    this.syncQualifiedViewTimer();
  };

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    this.document.addEventListener('visibilitychange', this.onDocumentVisibilityChange);
    const Observer = this.document.defaultView?.IntersectionObserver;
    if (typeof Observer === 'function') {
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

    void this.mountPreview(this.selectedCase().id);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.mountSequence += 1;
    this.abortInspection();
    this.previewPort.destroy();
    this.observer?.disconnect();
    this.clearQualifiedViewTimer();
    this.clearFocusTimer();
    if (this.isBrowser) {
      this.document.removeEventListener('visibilitychange', this.onDocumentVisibilityChange);
    }
  }

  selectCase(id: CssStickyCaseId): void {
    if (id === this.state().selectedCaseId || !this.cases.some((entry) => entry.id === id)) {
      return;
    }

    const nextCase = getCssStickyCase(id);
    this.beginInteraction();
    this.abortInspection();
    this.highlightedAncestor.set(null);
    this.previewPort.highlight(null);
    this.state.update((current) => ({
      ...createCssStickyLabState(id, nextCase.initialCss),
      attempt: current.attempt,
      editorActive: current.editorActive,
      editorFallback: current.editorFallback,
      status: 'activating',
    }));
    this.liveMessage.set(`${nextCase.label} selected. The preview is rebuilding.`);
    this.trackInteraction('case_selected');
    void this.mountPreview(id);
  }

  selectPane(pane: CssStickyPane): void {
    this.state.update((current) => ({ ...current, pane }));
  }

  activateEditor(): void {
    if (this.state().editorActive) return;
    this.beginInteraction();
    this.state.update((current) => ({ ...current, editorActive: true }));
    this.liveMessage.set('CSS editor activated. Changes are applied only when you run the inspector.');
    this.trackInteraction('editor_activated');
  }

  onEditorReady(): void {
    this.liveMessage.set('CSS editor ready.');
  }

  onEditorLoadFailed(): void {
    this.state.update((current) => ({
      ...current,
      editorFallback: true,
      editorActive: true,
    }));
    this.liveMessage.set('The enhanced editor could not load. An editable text area is available instead.');
  }

  onCssChange(source: string): void {
    const css = clampCssSource(source);
    if (this.state().status === 'running') {
      this.abortInspection();
    }
    this.state.update((current) => ({
      ...current,
      css,
      stale: current.inspection !== null,
      status: current.status === 'error' || current.status === 'running'
        ? 'ready'
        : current.status,
      errorMessage: '',
    }));
    if (source.length > css.length) {
      this.liveMessage.set('CSS is limited to 20,000 characters. Extra text was not retained.');
    }
  }

  async runInspection(): Promise<void> {
    const current = this.state();
    if (current.status === 'activating' || current.status === 'running') return;

    this.beginInteraction();
    this.abortInspection();
    const controller = new AbortController();
    this.inspectionController = controller;
    const caseId = current.selectedCaseId;
    this.highlightedAncestor.set(null);
    this.previewPort.highlight(null);
    this.state.update((state) => ({
      ...state,
      pane: 'preview',
      status: 'running',
      inspection: null,
      stale: false,
      errorMessage: '',
    }));
    this.liveMessage.set('Running the sticky geometry inspection.');
    this.trackInteraction('inspection_run');

    try {
      const result = await this.previewPort.inspect({
        caseId,
        css: current.css,
        signal: controller.signal,
      });
      if (controller.signal.aborted || this.destroyed || this.state().selectedCaseId !== caseId) {
        return;
      }

      const sawBrokenFinding = current.sawBrokenFinding || isBrokenStickyFinding(result.finding);
      const completed = current.completed || (sawBrokenFinding && result.finding === 'working');
      this.state.update((state) => ({
        ...state,
        pane: 'inspector',
        status: 'result',
        inspection: result,
        stale: false,
        sawBrokenFinding,
        completed,
      }));
      this.liveMessage.set(result.summary);
      this.trackInteraction('finding_shown', result.finding);

      if (completed && !current.completed) {
        this.analytics.track('trivia_lab_completed', {
          ...this.analyticsPayload(),
          finding: result.finding,
        });
        this.completed.emit();
      }
      this.focusAfterStateChange('inspector-result');
    } catch (error: unknown) {
      if (controller.signal.aborted || this.destroyed) return;
      this.state.update((state) => ({
        ...state,
        pane: 'inspector',
        status: 'error',
        inspection: null,
        stale: false,
        errorMessage: 'The preview did not return a valid inspection. Reset the lab and try again.',
      }));
      this.liveMessage.set('Inspection failed. Reset the lab and try again.');
      this.focusAfterStateChange('inspector-result');
    } finally {
      if (this.inspectionController === controller) {
        this.inspectionController = null;
      }
    }
  }

  applySuggestedFix(): void {
    const stickyCase = this.selectedCase();
    this.beginInteraction();
    this.state.update((current) => ({
      ...current,
      pane: 'code',
      css: stickyCase.fixedCss,
      stale: current.inspection !== null,
      status: current.status === 'error' ? 'ready' : current.status,
      errorMessage: '',
    }));
    this.liveMessage.set('Suggested CSS applied. Run the inspector again to verify the geometry.');
    this.trackInteraction('suggested_fix_applied');
  }

  reset(): void {
    const stickyCase = this.selectedCase();
    const current = this.state();
    this.beginInteraction();
    const resetPayload = this.analyticsPayload();
    this.abortInspection();
    this.highlightedAncestor.set(null);
    this.previewPort.highlight(null);
    this.state.set({
      ...createCssStickyLabState(stickyCase.id, stickyCase.initialCss),
      attempt: current.attempt + 1,
      editorActive: current.editorActive,
      editorFallback: current.editorFallback,
      status: 'activating',
    });
    this.startedAt = null;
    this.liveMessage.set('The case was reset to its original broken CSS.');
    this.analytics.track('trivia_lab_interacted', {
      ...resetPayload,
      action: 'reset',
    });
    void this.mountPreview(stickyCase.id);
  }

  highlightAncestor(index: number): void {
    const nextIndex = this.highlightedAncestor() === index ? null : index;
    this.highlightedAncestor.set(nextIndex);
    this.previewPort.highlight(nextIndex);
  }

  findingLabel(finding: CssStickyFindingId): string {
    return finding.replaceAll('_', ' ');
  }

  scrollOwner(result: CssStickyInspection) {
    return result.ancestors.find((ancestor) => ancestor.isScrollContainer) ?? null;
  }

  trackCase(_: number, stickyCase: CssStickyCase): CssStickyCaseId {
    return stickyCase.id;
  }

  trackAncestor(_: number, ancestor: { readonly index: number }): number {
    return ancestor.index;
  }

  private async mountPreview(caseId: CssStickyCaseId): Promise<void> {
    if (!this.isBrowser || !this.previewFrame) return;
    const sequence = ++this.mountSequence;
    this.state.update((current) => ({
      ...current,
      status: 'activating',
      errorMessage: '',
    }));

    try {
      await this.previewPort.mount(this.previewFrame.nativeElement, caseId);
      if (this.destroyed || sequence !== this.mountSequence || this.state().selectedCaseId !== caseId) {
        return;
      }
      this.state.update((current) => ({ ...current, status: 'ready' }));
      this.liveMessage.set(`${getCssStickyCase(caseId).label} preview ready.`);
    } catch {
      if (this.destroyed || sequence !== this.mountSequence) return;
      this.state.update((current) => ({
        ...current,
        pane: 'inspector',
        status: 'error',
        errorMessage: 'The isolated preview could not start. Reset the lab to retry.',
      }));
      this.liveMessage.set('The isolated preview could not start.');
    }
  }

  private abortInspection(): void {
    this.inspectionController?.abort();
    this.inspectionController = null;
  }

  private focusAfterStateChange(target: string): void {
    if (!this.isBrowser) return;
    this.clearFocusTimer();
    this.focusTimer = this.document.defaultView?.setTimeout(() => {
      this.focusTimer = null;
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
    if (!this.isBrowser || this.startedAt !== null) return;
    this.startedAt = Date.now();
  }

  private trackInteraction(
    action: LabInteractionAction,
    finding?: CssStickyFindingId,
  ): void {
    this.analytics.track('trivia_lab_interacted', {
      ...this.analyticsPayload(),
      action,
      ...(finding ? { finding } : {}),
    });
  }

  private analyticsPayload(): Record<string, unknown> {
    return {
      lab_id: LAB_ID,
      question_id: QUESTION_ID,
      scenario_id: this.state().selectedCaseId,
      attempt_bucket: this.state().attempt === 1 ? 'first' : 'repeat',
      elapsed_sec: this.elapsedSeconds(),
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
