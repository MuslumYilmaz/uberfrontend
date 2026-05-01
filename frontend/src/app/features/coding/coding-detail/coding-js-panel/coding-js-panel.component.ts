import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, PLATFORM_ID, SimpleChanges, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import type { DecisionGraphBranch, DecisionGraphDocument, DecisionGraphNode } from '../../../../core/models/decision-graph.model';
import type { FailureCategory, FailureHint, InterviewModeSession, StuckLevel, StuckState } from '../../../../core/models/editor-assist.model';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { AttemptInsightsService } from '../../../../core/services/attempt-insights.service';
import { DecisionGraphService } from '../../../../core/services/decision-graph.service';
import { ExperimentService } from '../../../../core/services/experiment.service';
import type { Question } from '../../../../core/models/question.model';
import type { Tech } from '../../../../core/models/user.model';
import { CodeStorageService } from '../../../../core/services/code-storage.service';
import { classifyFailureCategory } from '../../../../core/utils/error-taxonomy.util';
import { buildFailureHint } from '../../../../core/utils/failure-explain-rules';
import { createFailureSignature, normalizeErrorLine, stableHash } from '../../../../core/utils/failure-signature.util';
import { buildRubberDuckPrompts } from '../../../../core/utils/rubber-duck-prompts.util';
import { deriveStuckState, isStuckNudgeVisible, stuckLevelLabel } from '../../../../core/utils/stuck-detector.util';
import { computeJsQuestionContentVersion } from '../../../../core/utils/content-version.util';
import {
  dismissUpdateBanner,
  isUpdateBannerDismissed,
  listOtherVersions,
  makeDraftKey,
  type DraftIndexEntry,
  upsertDraftIndexVersion,
} from '../../../../core/utils/versioned-drafts.util';
import { MonacoEditorComponent, type MonacoLineClickEvent } from '../../../../monaco-editor.component';
import { DraftUpdateBannerComponent } from '../../../../shared/components/draft-update-banner/draft-update-banner';
import { RestoreBannerComponent } from '../../../../shared/components/restore-banner/restore-banner';
import { CodeSnapshotComponent } from '../../../../shared/ui/code-snapshot/code-snapshot.component';
import { FaGlyphComponent } from '../../../../shared/ui/icon/fa-glyph.component';
import { ConsoleEntry, ConsoleLoggerComponent, TestResult } from '../../console-logger/console-logger.component';

declare const monaco: any;

export type JsLang = 'js' | 'ts';
type RunnerOutput = { entries: ConsoleEntry[]; results: TestResult[]; timedOut?: boolean; error?: string };
type Runner = { runWithTests(args: { userCode: string; testCode: string; timeoutMs?: number }): Promise<RunnerOutput> };
type ApplySolutionOptions = {
  decisionGraphAsset?: string | null;
  decisionGraphKey?: string | null;
};
type SolutionDraftSnapshot = {
  lang: JsLang;
  code: string;
};
type ResolvedDecisionNode = {
  node: DecisionGraphNode;
  index: number;
  start: number;
  end: number;
  resolved: boolean;
};
type AssistFlags = {
  stuckDetector: boolean;
  explainFailure: boolean;
  interviewMode: boolean;
  weaknessRadar: boolean;
  rubberDuck: boolean;
  syncTelemetry: boolean;
  assistExperiments: boolean;
};

const DEFAULT_ASSIST_FLAGS: AssistFlags = {
  stuckDetector: true,
  explainFailure: true,
  interviewMode: true,
  weaknessRadar: false,
  rubberDuck: false,
  syncTelemetry: false,
  assistExperiments: false,
};

@Component({
  selector: 'app-coding-js-panel',
  standalone: true,
  imports: [CommonModule, MonacoEditorComponent, ConsoleLoggerComponent, RestoreBannerComponent, DraftUpdateBannerComponent, CodeSnapshotComponent, FaGlyphComponent],
  templateUrl: './coding-js-panel.component.html',
  styleUrls: ['./coding-js-panel.component.css']
})
export class CodingJsPanelComponent implements OnChanges, OnInit, OnDestroy {
  @ViewChild('codeEditor') codeEditor?: MonacoEditorComponent;
  @ViewChild('testsEditor') testsEditor?: MonacoEditorComponent;
  @ViewChild('codeEditorShell') codeEditorShell?: ElementRef<HTMLElement>;
  /* ---------- Inputs ---------- */
  @Input() question: Question | null = null;   // <- allow null until bound
  @Input() tech: Tech = 'javascript';         // for future-proofing
  @Input() kind: 'coding' | 'debug' = 'coding';
  @Input() storageKeyOverride: string | null = null;
  @Input() hideRestoreBanner = false;
  @Input() disablePersistence = false;
  @Input() liteMode = false;
  private _solutionPanelOpen = false;
  @Input() set solutionPanelOpen(value: boolean) {
    this._solutionPanelOpen = !!value;
    if (this._solutionPanelOpen) {
      this.interviewSetupOpen.set(false);
    }
  }
  get solutionPanelOpen(): boolean {
    return this._solutionPanelOpen;
  }

  // optional UI options (pass from parent to keep look consistent)
  @Input() editorOptions: any = {
    fontSize: 12,
    lineHeight: 18,
    minimap: { enabled: false },
    tabSize: 2,
    wordWrap: 'on' as const,
    wordWrapColumn: 100,
    scrollBeyondLastColumn: 2,
    automaticLayout: true,
  };

  // initial language
  @Input() set initialLang(v: JsLang) {
    this.jsLang.set(v);
  }

  /* ---------- Outputs to parent ---------- */
  @Output() solvedChange = new EventEmitter<boolean>();
  @Output() testResultsChange = new EventEmitter<TestResult[]>();
  @Output() consoleEntriesChange = new EventEmitter<ConsoleEntry[]>();
  @Output() codeChange = new EventEmitter<{ lang: JsLang, code: string }>();
  @Output() langChange = new EventEmitter<JsLang>();
  @Output() requestEditorUpgrade = new EventEmitter<void>();

  /* ---------- Local state ---------- */
  jsLang = signal<JsLang>('js');                       // 'js' | 'ts'
  topTab = signal<'code' | 'tests'>('code');
  subTab = signal<'tests' | 'console'>('tests');

  // Draft versioning (question updates)
  private baseDraftKey = signal<string>('');
  private currentContentVersion = signal<string>('');
  private activeDraftVersion = signal<string>('');
  isViewingOlderVersion = computed(() => {
    const cur = this.currentContentVersion();
    const active = this.activeDraftVersion();
    return !!cur && !!active && cur !== active;
  });
  availableOlderDrafts = signal<DraftIndexEntry[]>([]);
  showUpdateBanner = signal(false);

  editorContent = signal<string>('');                  // user code
  testCode = signal<string>('');                       // test code
  hasRunTests = signal(false);
  isRunningTests = signal(false);
  testResults = signal<TestResult[]>([]);
  consoleEntries = signal<ConsoleEntry[]>([]);
  editorRatio = signal(0.65); // top editors take 65% of the vertical space
  private _draggingSplit = signal(false);
  isDraggingSplit = this._draggingSplit.asReadonly();
  private _hydrating = true;
  private volatileBuffers: Record<JsLang, string> = { js: '', ts: '' };
  private _runSeq = 0;
  private persistTimer: any = null;
  private pendingPersist: { key: string; lang: JsLang; code: string } | null = null;
  private resizeRaf: number | null = null;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly analytics = inject(AnalyticsService, { optional: true });
  private readonly attemptInsights = inject(AttemptInsightsService, { optional: true });
  private readonly decisionGraphService = inject(DecisionGraphService, { optional: true });
  private readonly experiment = inject(ExperimentService, { optional: true });
  private readonly assistFlags = {
    ...DEFAULT_ASSIST_FLAGS,
    ...((environment as any)?.assist || {}),
  } as AssistFlags;
  private readonly interventionTimingVariant = this.resolveInterventionTimingVariant();
  private readonly hintDensityVariant = this.resolveHintDensityVariant();
  useMonaco = signal(true);
  codeEditorReady = signal(false);
  testsEditorReady = signal(false);
  private runnerInstance?: Runner;
  private runnerPromise?: Promise<Runner>;
  private interviewTicker: number | null = null;
  private interviewSession: InterviewModeSession | null = null;
  private lastTrackedStuckLevel: StuckLevel = 0;

  stuckState = signal<StuckState | null>(null);
  explainHint = signal<FailureHint | null>(null);
  explainExpanded = signal(false);
  explainDismissed = signal(false);
  hintExpanded = signal(false);
  failureCategory = signal<FailureCategory>('unknown');

  duckOpen = signal(false);
  duckSteps = signal<string[]>([]);
  duckDoneStepIndexes = signal<number[]>([]);
  duckNote = signal('');

  interviewModeEnabled = signal(false);
  interviewDurationMin = signal<15 | 30 | 45>(30);
  interviewRemainingSec = signal(0);
  interviewSummary = signal<{ runs: number; bestPassPct: number; elapsedSec: number } | null>(null);
  interviewSetupOpen = signal(false);

  showStuckNudge = computed(() => {
    if (!this.assistFlags.stuckDetector) return false;
    if (this.interviewModeEnabled()) return false;
    if (!this.hasRunTests()) return false;
    const state = this.stuckState();
    if (!state) return false;
    if (state.level < this.stuckNudgeMinLevel()) return false;
    return isStuckNudgeVisible(state);
  });
  showExplainCard = computed(() => {
    if (!this.assistFlags.explainFailure) return false;
    if (this.interviewModeEnabled()) return false;
    if (this.explainDismissed()) return false;
    return !!this.explainHint();
  });
  showDuckPanel = computed(() => {
    if (!this.assistFlags.rubberDuck) return false;
    if (this.interviewModeEnabled()) return false;
    return this.duckSteps().length > 0;
  });

  ngOnInit() {
    if (!this.isBrowser) return;
    this.configureLiteEditors();
    window.addEventListener('beforeunload', this._persistLangOnUnload);
  }

  ngOnDestroy() {
    this.flushPendingPersist();
    this.stopInterviewTicker();
    if (this.isBrowser) {
      window.removeEventListener('beforeunload', this._persistLangOnUnload);
      if (this.resizeRaf != null) {
        cancelAnimationFrame(this.resizeRaf);
        this.resizeRaf = null;
      }
    }
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
  }

  private _persistLangOnUnload = () => {
    this.flushPendingPersist();
    if (this.disablePersistence) return;
    const q = this.question;
    const key = this.storageKeyFor(q);
    if (q && key) void this.codeStore.setLastLangAsync(key, this.jsLang());
  };

  private cancelPendingPersist() {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    this.pendingPersist = null;
  }

  private schedulePersist(key: string, lang: JsLang, code: string) {
    if (this.disablePersistence) return;
    this.pendingPersist = { key, lang, code };

    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      const p = this.pendingPersist;
      this.pendingPersist = null;
      this.persistTimer = null;
      if (!p) return;
      void this.codeStore.saveJsAsync(p.key, p.code, p.lang, { allowEmpty: true });
    }, 200);
  }

  private flushPendingPersist() {
    if (!this.pendingPersist) return;
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    const p = this.pendingPersist;
    this.pendingPersist = null;
    if (!this.disablePersistence) {
      void this.codeStore.saveJsAsync(p.key, p.code, p.lang, { allowEmpty: true });
    }
  }

  private scheduleResize() {
    if (!this.isBrowser) return;
    if (this.resizeRaf != null) return;
    this.resizeRaf = requestAnimationFrame(() => {
      this.resizeRaf = null;
      window.dispatchEvent(new Event('resize'));
    });
  }

  private endHydrationSoon() {
    if (!this.isBrowser) {
      this._hydrating = false;
      return;
    }
    requestAnimationFrame(() =>
      requestAnimationFrame(() => { this._hydrating = false; })
    );
  }

  viewingSolution = signal(false);
  decisionGraphEnabled = !!((environment as any)?.content?.decisionGraph);
  decisionGraphDoc = signal<DecisionGraphDocument | null>(null);
  decisionGraphLoading = signal(false);
  decisionGraphNodeId = signal<string | null>(null);
  decisionGraphExpanded = signal<Record<string, DecisionGraphBranch[]>>({});
  private decisionGraphSeenBranchesByNode = new Map<string, Set<DecisionGraphBranch>>();
  private decisionGraphLoadToken = 0;
  private applySolutionToken = 0;
  decisionGraphUserEnabled = signal(true);
  decisionGraphPopupOpen = signal(false);
  decisionGraphPopupSide = signal<'left' | 'right'>('right');
  decisionGraphPopupTop = signal(16);

  decisionGraphVisible = computed(() => {
    if (!this.decisionGraphEnabled) return false;
    if (!this.decisionGraphUserEnabled()) return false;
    if (this.topTab() !== 'code') return false;
    const doc = this.decisionGraphDoc();
    if (!doc) return false;
    if (doc.language === 'javascript' && this.jsLang() !== 'js') return false;
    if (doc.language === 'typescript' && this.jsLang() !== 'ts') return false;
    if (this.viewingSolution()) return true;
    return this.isDecisionGraphCodeAligned(doc);
  });

  decisionGraphLanguageMismatch = computed(() => {
    if (!this.decisionGraphEnabled) return false;
    if (!this.decisionGraphUserEnabled()) return false;
    if (this.topTab() !== 'code') return false;
    const doc = this.decisionGraphDoc();
    if (!doc || !doc.language) return false;
    const unlocked = this.viewingSolution() || this.isDecisionGraphCodeAligned(doc);
    if (!unlocked) return false;
    if (doc.language === 'javascript' && this.jsLang() === 'ts') return true;
    if (doc.language === 'typescript' && this.jsLang() === 'js') return true;
    return false;
  });

  decisionGraphShellVisible = computed(() => {
    if (this.topTab() !== 'code') return false;
    if (!this.decisionGraphEnabled) return false;
    if (this.decisionGraphLoading()) return true;
    const doc = this.decisionGraphDoc();
    if (!doc) return false;
    const unlocked = this.viewingSolution() || this.isDecisionGraphCodeAligned(doc);
    if (!unlocked) return false;
    if (!this.decisionGraphUserEnabled()) return true;
    if (this.decisionGraphLanguageMismatch()) return true;
    return this.decisionGraphVisible();
  });

  decisionGraphHintVisible = computed(() => {
    if (!this.decisionGraphShellVisible()) return false;
    if (this.decisionGraphLoading()) return false;
    if (this.decisionGraphLanguageMismatch()) return false;
    return !this.decisionGraphPopupOpen();
  });

  decisionGraphPopupVisible = computed(() => {
    if (!this.decisionGraphVisible()) return false;
    if (!this.decisionGraphPopupOpen()) return false;
    return !!this.activeDecisionNode();
  });

  decisionGraphNodes = computed<ResolvedDecisionNode[]>(() => {
    const doc = this.decisionGraphDoc();
    if (!doc) return [];
    const code = this.editorContent();
    return this.resolveDecisionNodes(doc.nodes, code);
  });

  activeDecisionNode = computed<ResolvedDecisionNode | null>(() => {
    const nodes = this.decisionGraphNodes();
    if (!nodes.length) return null;
    const selected = this.decisionGraphNodeId();
    if (!selected) return nodes[0];
    return nodes.find((item) => item.node.id === selected) || nodes[0];
  });

  // --- restore banner state ---
  restoredFromStorage = signal(false);
  restoreDismissed = signal(false);
  private solutionDraftSnapshot = signal<SolutionDraftSnapshot | null>(null);
  canRevertToUserCode = computed(() => !!this.solutionDraftSnapshot());
  restoreBannerIsSolutionContext = computed(
    () => this.viewingSolution() || this.canRevertToUserCode()
  );
  restoreBannerActionLabel = computed(() => {
    if (!this.restoreBannerIsSolutionContext()) return null;
    return this.canRevertToUserCode() ? 'Revert to your code' : 'Reset to default';
  });

  dismissRestoreBanner() { this.restoreDismissed.set(true); }

  private exitSolutionMode(): void {
    this.viewingSolution.set(false);
    this.decisionGraphPopupOpen.set(false);
  }

  private clearSolutionDraftSnapshot(): void {
    this.solutionDraftSnapshot.set(null);
  }

  private captureSolutionDraftSnapshot(): void {
    if (this.solutionDraftSnapshot()) return;
    this.solutionDraftSnapshot.set({
      lang: this.jsLang(),
      code: this.editorContent(),
    });
  }

  async revertToUserCodeFromBanner(): Promise<void> {
    const snapshot = this.solutionDraftSnapshot();
    if (!snapshot) {
      await this.resetToDefault();
      return;
    }

    const q = this.question;
    if (!q) return;

    const targetLang = snapshot.lang;
    const targetCode = snapshot.code;
    this.cancelPendingPersist();
    this._hydrating = true;

    this.jsLang.set(targetLang);
    this.langChange.emit(targetLang);
    this.editorContent.set(targetCode);
    this.testCode.set(this.pickTests(q as any, targetLang));

    if (this.disablePersistence) {
      this.volatileBuffers[targetLang] = targetCode;
    } else {
      const storageKey = this.storageKeyFor(q);
      if (storageKey) {
        await this.codeStore.saveJsAsync(storageKey, targetCode, targetLang, { force: true });
        await this.codeStore.setLastLangAsync(storageKey, targetLang);
      }
    }

    this.codeChange.emit({ lang: targetLang, code: targetCode });
    this.clearSolutionDraftSnapshot();
    this.restoredFromStorage.set(false);
    this.restoreDismissed.set(true);
    this.exitSolutionMode();
    this.hasRunTests.set(false);
    this.testResults.set([]);
    this.consoleEntries.set([]);
    this.refreshDecisionGraphDecorations();
    this.endHydrationSoon();
  }

  async resetToDefault(): Promise<void> {
    const q = this.question;
    if (!q) return;
    this.cancelPendingPersist();
    this.clearSolutionDraftSnapshot();
    if (this.disablePersistence) {
      const { js: starterJs, ts: starterTs } = this.startersForBoth(q);
      this.volatileBuffers = { js: starterJs, ts: starterTs };
      const lang = this.jsLang();
      const currentStarter = (lang === 'ts') ? starterTs : starterJs;
      this.editorContent.set(currentStarter);
      this.testCode.set(this.pickTests(q as any, lang));
      this.restoredFromStorage.set(false);
      this.restoreDismissed.set(true);
      this.exitSolutionMode();
      this.hasRunTests.set(false);
      this.testResults.set([]);
      this.consoleEntries.set([]);
      this.solvedChange.emit(false);
      this.codeChange.emit({ lang, code: currentStarter });
      return;
    }
    const storageKey = this.storageKeyFor(q);
    if (!storageKey) return;

    const lang = this.jsLang();
    const { js: starterJs, ts: starterTs } = this.startersForBoth(q);

    // 1) Persist fresh baselines + code for BOTH languages in LS and IDB
    await this.codeStore.resetJsBothAsync(storageKey, { js: starterJs, ts: starterTs });

    // 2) Hydrate editor with the active language's starter
    const currentStarter = (lang === 'ts') ? starterTs : starterJs;
    this.editorContent.set(currentStarter);

    // 3) Ensure per-lang record exists and last write wins (bypass guards)
    await this.codeStore.saveJsAsync(storageKey, currentStarter, lang, { force: true });

    // 4) Banner & UI state
    this.restoredFromStorage.set(false); // no user divergence after a clean reset
    this.restoreDismissed.set(true);     // hide the banner immediately
    this.exitSolutionMode();

    // 5) Notify parent listeners
    this.codeChange.emit({ lang, code: currentStarter });

    // 6) Optional: clear local test/console state for a clean slate
    this.hasRunTests.set(false);
    this.testResults.set([]);
    this.consoleEntries.set([]);
  }

  passedCount = computed(() => this.testResults().filter(r => r.passed).length);
  totalCount = computed(() => this.testResults().length);
  allPassing = computed(() => this.totalCount() > 0 && this.passedCount() === this.totalCount());

  startSplitDrag(ev: PointerEvent) {
    ev.preventDefault();
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
    this._draggingSplit.set(true);

    // Host column that holds the whole editors/results stack
    const host = (ev.currentTarget as HTMLElement).closest('.flex-1.flex.flex-col') as HTMLElement;
    const rect = host?.getBoundingClientRect();

    const onMove = (e: PointerEvent) => {
      if (!rect) return;
      const y = e.clientY - rect.top;
      const ratio = Math.min(0.9, Math.max(0.2, y / rect.height)); // clamp 20%–90%
      this.editorRatio.set(ratio);
      this.scheduleResize();
    };

    const onUp = () => {
      (ev.target as HTMLElement).releasePointerCapture(ev.pointerId);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      this._draggingSplit.set(false);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  private syncDecisionGraphDecorations(
    visible: boolean,
    nodes: ResolvedDecisionNode[],
    active: ResolvedDecisionNode | null,
    _ready: boolean,
  ): void {
    if (!this.isBrowser) return;
    const editor = this.codeEditor;
    if (!editor || !visible || !nodes.length) {
      editor?.clearLineHighlights?.();
      return;
    }

    const mappedNodes = nodes.filter((item) => item.resolved);
    if (!mappedNodes.length) {
      editor.clearLineHighlights?.();
      return;
    }

    editor.setLineHighlights?.(
      mappedNodes.map((item) => ({
        start: item.start,
        end: item.end,
        active: !!active && item.node.id === active.node.id,
        hoverLabel: `Decision ${item.index + 1}: ${item.node.title}`,
      })),
    );
  }

  private resolveDecisionNodes(nodes: DecisionGraphNode[], code: string): ResolvedDecisionNode[] {
    const codeLines = String(code || '').replace(/\r\n/g, '\n').split('\n');
    const lineCount = Math.max(1, codeLines.length);
    const normalizedLines = codeLines.map((line) => this.normalizeDecisionText(line));

    return nodes.map((node, index) => {
      const anchorStart = Math.max(1, Math.floor(node.anchor.lineStart || 1));
      const anchorEndRaw = Math.max(anchorStart, Math.floor(node.anchor.lineEnd ?? node.anchor.lineStart ?? anchorStart));
      const anchorLength = Math.max(0, anchorEndRaw - anchorStart);
      const snippetNorm = this.normalizeDecisionText(node.anchor.snippet || '');

      let resolvedStart: number | null = null;
      if (snippetNorm) {
        const snippetIdx = normalizedLines.findIndex((line) => line.includes(snippetNorm));
        if (snippetIdx >= 0) {
          resolvedStart = snippetIdx + 1;
        }
      }

      if (resolvedStart == null && anchorStart <= lineCount) {
        resolvedStart = anchorStart;
      }

      if (resolvedStart == null) {
        return {
          node,
          index,
          start: anchorStart,
          end: anchorEndRaw,
          resolved: false,
        };
      }

      const end = Math.min(lineCount, resolvedStart + anchorLength);
      return {
        node,
        index,
        start: resolvedStart,
        end,
        resolved: true,
      };
    });
  }

  private normalizeDecisionText(value: string): string {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private normalizeDecisionCode(value: string): string {
    return String(value || '')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => line.replace(/\s+$/g, ''))
      .join('\n')
      .trim();
  }

  private syncViewingSolutionFromDecisionGraph(doc: DecisionGraphDocument | null): void {
    if (!doc) return;
    if (!this.isDecisionGraphCodeAligned(doc)) return;

    this.viewingSolution.set(true);
  }

  private isDecisionGraphCodeAligned(doc: DecisionGraphDocument | null): boolean {
    if (!doc) return false;
    if (doc.language === 'javascript' && this.jsLang() !== 'js') return false;
    if (doc.language === 'typescript' && this.jsLang() !== 'ts') return false;

    const current = this.normalizeDecisionCode(this.editorContent());
    const canonical = this.normalizeDecisionCode(doc.code);
    if (!current || !canonical) return false;
    return current === canonical;
  }

  decisionNodeBadge(node: ResolvedDecisionNode): string {
    return `D${node.index + 1}`;
  }

  selectDecisionNode(node: ResolvedDecisionNode, track = true): void {
    this.decisionGraphNodeId.set(node.node.id);
    if (node.resolved) {
      this.codeEditor?.revealLine?.(node.start);
    }

    if (!track) return;
    const q = this.question;
    if (!q) return;
    this.analytics?.track('decision_graph_node_opened', {
      question_id: q.id,
      node_id: node.node.id,
      node_index: node.index + 1,
      line_start: node.start,
      line_end: node.end,
      lang: this.jsLang(),
    });
  }

  onDecisionNodeSpace(event: Event, node: ResolvedDecisionNode): void {
    event.preventDefault();
    this.selectDecisionNode(node);
  }

  onCodeEditorLineClick(event: MonacoLineClickEvent): void {
    if (!this.decisionGraphVisible()) return;
    const line = Math.max(1, Math.floor(Number(event?.lineNumber) || 0));
    if (!line) return;

    const target = this.decisionGraphNodes().find((node) =>
      node.resolved && line >= node.start && line <= node.end,
    );

    if (!target) {
      this.decisionGraphPopupOpen.set(false);
      return;
    }

    this.selectDecisionNode(target);
    this.setDecisionDefaultBranch(target.node.id);
    this.positionDecisionPopup(event);
    this.decisionGraphPopupOpen.set(true);
  }

  closeDecisionPopup(): void {
    this.decisionGraphPopupOpen.set(false);
  }

  private positionDecisionPopup(event: MonacoLineClickEvent): void {
    const shell = this.codeEditorShell?.nativeElement;
    if (!shell) {
      this.decisionGraphPopupSide.set('right');
      this.decisionGraphPopupTop.set(16);
      return;
    }

    const rect = shell.getBoundingClientRect();
    const clickX = Number(event?.clientX) || rect.left;
    const clickY = Number(event?.clientY) || rect.top;
    const side: 'left' | 'right' = clickX < rect.left + rect.width / 2 ? 'right' : 'left';
    const maxTop = Math.max(12, rect.height - 320);
    const nextTop = Math.max(12, Math.min(maxTop, clickY - rect.top - 110));

    this.decisionGraphPopupSide.set(side);
    this.decisionGraphPopupTop.set(nextTop);
  }

  isDecisionBranchExpanded(branch: DecisionGraphBranch): boolean {
    const active = this.activeDecisionNode();
    if (!active) return false;
    return (this.decisionGraphExpanded()[active.node.id] || []).includes(branch);
  }

  toggleDecisionBranch(branch: DecisionGraphBranch): void {
    const active = this.activeDecisionNode();
    if (!active) return;

    const nodeId = active.node.id;
    const state = { ...this.decisionGraphExpanded() };
    const current = new Set<DecisionGraphBranch>(state[nodeId] || []);
    const expanding = !current.has(branch);
    if (expanding) current.add(branch);
    else current.delete(branch);
    state[nodeId] = [...current];
    this.decisionGraphExpanded.set(state);

    if (!expanding) return;

    let seen = this.decisionGraphSeenBranchesByNode.get(nodeId);
    if (!seen) {
      seen = new Set<DecisionGraphBranch>();
      this.decisionGraphSeenBranchesByNode.set(nodeId, seen);
    }
    if (seen.has(branch)) return;

    seen.add(branch);
    const q = this.question;
    if (!q) return;
    this.analytics?.track('decision_graph_branch_viewed', {
      question_id: q.id,
      node_id: nodeId,
      branch,
      lang: this.jsLang(),
    });
  }

  onDecisionBranchSpace(event: Event, branch: DecisionGraphBranch): void {
    event.preventDefault();
    this.toggleDecisionBranch(branch);
  }

  private setDecisionDefaultBranch(nodeId: string): void {
    if (!nodeId) return;
    const state = { ...this.decisionGraphExpanded() };
    state[nodeId] = ['why'];
    this.decisionGraphExpanded.set(state);
  }

  toggleDecisionGraphUserEnabled(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const next = !this.decisionGraphUserEnabled();
    this.setDecisionGraphUserEnabled(next);
  }

  private setDecisionGraphUserEnabled(enabled: boolean): void {
    this.decisionGraphUserEnabled.set(!!enabled);
    if (!enabled) this.decisionGraphPopupOpen.set(false);
    this.refreshDecisionGraphDecorations();
  }

  private clearDecisionGraphState(clearDoc = true): void {
    this.decisionGraphLoadToken += 1;
    this.decisionGraphLoading.set(false);
    if (clearDoc) this.decisionGraphDoc.set(null);
    this.decisionGraphNodeId.set(null);
    this.decisionGraphExpanded.set({});
    this.decisionGraphSeenBranchesByNode.clear();
    this.decisionGraphPopupOpen.set(false);
    this.codeEditor?.clearLineHighlights?.();
  }

  private async loadDecisionGraphForQuestion(
    question: Question,
    assetPathOverride?: string | null,
    allowQuestionFallback = true,
    decisionGraphKeyOverride?: string | null,
  ): Promise<void> {
    this.clearDecisionGraphState();

    if (!this.decisionGraphEnabled || !this.isBrowser || !this.decisionGraphService) return;
    const override =
      assetPathOverride === undefined ? '' : String(assetPathOverride || '').trim();
    const questionAsset = String((question as any)?.decisionGraphAsset || '').trim();
    const assetPath = override || (allowQuestionFallback ? questionAsset : '');
    const normalizedKeyRaw =
      decisionGraphKeyOverride == null ? '' : String(decisionGraphKeyOverride).trim();
    const normalizedKey = normalizedKeyRaw || undefined;
    if (!assetPath) return;

    const token = ++this.decisionGraphLoadToken;
    this.decisionGraphLoading.set(true);
    try {
      const doc = await firstValueFrom(
        normalizedKey === undefined
          ? this.decisionGraphService.load(assetPath)
          : this.decisionGraphService.load(assetPath, normalizedKey || null),
      );
      if (token !== this.decisionGraphLoadToken) return;
      if (!doc || (doc.questionId && doc.questionId !== question.id)) {
        this.decisionGraphDoc.set(null);
        return;
      }
      this.decisionGraphDoc.set(doc);
      this.decisionGraphNodeId.set(doc.nodes[0]?.id ?? null);
      this.syncViewingSolutionFromDecisionGraph(doc);
    } catch {
      if (token !== this.decisionGraphLoadToken) return;
      this.decisionGraphDoc.set(null);
    } finally {
      if (token === this.decisionGraphLoadToken) {
        this.decisionGraphLoading.set(false);
      }
    }
  }

  private resolveApproachDecisionGraphSelectionForCode(
    question: Question,
    lang: JsLang,
    code: string,
  ): { asset: string | null; key: string | null } | undefined {
    const normalizedCode = this.normalizeDecisionCode(code);
    if (!normalizedCode) return undefined;

    const approaches = Array.isArray((question as any)?.solutionBlock?.approaches)
      ? ((question as any).solutionBlock.approaches as Array<Record<string, unknown>>)
      : [];
    if (!approaches.length) return undefined;

    const codeKey = lang === 'ts' ? 'codeTs' : 'codeJs';
    for (let index = 0; index < approaches.length; index += 1) {
      const approach = approaches[index] || {};
      const approachCode = this.normalizeDecisionCode(String(approach[codeKey] || ''));
      if (!approachCode || approachCode !== normalizedCode) continue;

      const explicitKey = String(approach['decisionGraphKey'] || '').trim();
      const explicitAsset = String(approach['decisionGraphAsset'] || '').trim();
      if (explicitAsset) {
        return {
          asset: explicitAsset,
          key: explicitKey || null,
        };
      }

      const questionAsset = String((question as any)?.decisionGraphAsset || '').trim();
      if (questionAsset) {
        return {
          asset: questionAsset,
          key: explicitKey || `approach${index + 1}`,
        };
      }

      return {
        asset: null,
        key: explicitKey || null,
      };
    }

    return undefined;
  }

  private async loadDecisionGraphForCurrentCode(
    question: Question,
    lang: JsLang,
    code: string,
  ): Promise<void> {
    if (!this.decisionGraphEnabled || !this.isBrowser || !this.decisionGraphService) return;

    const selection = this.resolveApproachDecisionGraphSelectionForCode(question, lang, code);
    const hasAssetOverride = selection !== undefined;
    await this.loadDecisionGraphForQuestion(
      question,
      selection?.asset,
      !hasAssetOverride,
      selection?.key,
    );
    this.refreshDecisionGraphDecorations();
  }

  constructor(
    public codeStore: CodeStorageService,
  ) {
    effect(() => {
      const visible = this.decisionGraphVisible();
      const nodes = this.decisionGraphNodes();
      const active = this.activeDecisionNode();
      const ready = this.codeEditorReady();
      this.syncDecisionGraphDecorations(visible, nodes, active, ready);
      if (!visible && this.decisionGraphPopupOpen()) {
        this.decisionGraphPopupOpen.set(false);
      }
    }, { allowSignalWrites: true });
  }

  ngOnChanges(ch: SimpleChanges) {
    if (ch['question'] && this.question) {
      this.initFromQuestion();                 // inputs are ready, initialize
    }
    if (ch['liteMode']) {
      this.configureLiteEditors();
    }
  }

  private configureLiteEditors() {
    if (!this.isBrowser) {
      this.useMonaco.set(false);
      return;
    }
    this.useMonaco.set(!this.liteMode);
    this.codeEditorReady.set(false);
    this.testsEditorReady.set(false);
  }

  onCodeEditorReady() {
    this.codeEditorReady.set(true);
    this.refreshDecisionGraphDecorations();
  }

  onTestsEditorReady() {
    this.testsEditorReady.set(true);
  }

  /* ---------- Lifecycle-ish setup API (call once from parent) ---------- */
  /* ---------- Lifecycle-ish setup API (call once from parent) ---------- */
  async initFromQuestion() {
    const q = this.question as Question; if (!q) return;
    this.resetRunnerStateForQuestionChange();
    this.clearSolutionDraftSnapshot();
    this._hydrating = true;
    const { js: sJs, ts: sTs } = this.startersForBoth(q);

    // Compute draft identity: baseKey + contentVersion
    const baseKey = (this.storageKeyOverride || '').trim() || q.id;
    const contentVersion = computeJsQuestionContentVersion(q as any);
    this.baseDraftKey.set(baseKey);
    this.currentContentVersion.set(contentVersion);
    this.activeDraftVersion.set(contentVersion);

    if (!this.isBrowser) {
      this.volatileBuffers = { js: sJs, ts: sTs };
      const preferred: JsLang = 'js';
      this.jsLang.set(preferred);
      this.editorContent.set(sJs);
      this.testCode.set(this.pickTests(q as any, preferred));
      this.restoredFromStorage.set(false);
      this.restoreDismissed.set(true);
      this.viewingSolution.set(false);
      this.hasRunTests.set(false);
      this.testResults.set([]);
      this.consoleEntries.set([]);
      this.syncViewingSolutionFromDecisionGraph(this.decisionGraphDoc());
      this._hydrating = false;
      return;
    }

    if (this.disablePersistence) {
      this.volatileBuffers = { js: sJs, ts: sTs };
      const preferred: JsLang = 'js';
      this.jsLang.set(preferred);
      this.langChange.emit(preferred);
      this.editorContent.set(sJs);
      this.testCode.set(this.pickTests(q as any, preferred));
      this.restoredFromStorage.set(false);
      this.restoreDismissed.set(true);
      this.viewingSolution.set(false);
      this.hasRunTests.set(false);
      this.testResults.set([]);
      this.consoleEntries.set([]);
      this.loadAssistStateForQuestion(q);
      await this.loadDecisionGraphForCurrentCode(q, preferred, sJs);
      queueMicrotask(() => window.dispatchEvent(new Event('resize')));
      requestAnimationFrame(() => requestAnimationFrame(() => { this._hydrating = false; }));
      return;
    }

    const storageKey = this.storageKeyFor(q);
    if (!storageKey) return;

    // Backward-compat: if legacy (unversioned) draft exists, keep it archived and start fresh for this version.
    const now = new Date().toISOString();
    const legacy = await this.codeStore.getJsAsync(baseKey);
    if (legacy) {
      const legacyKey = makeDraftKey(baseKey, 'legacy');
      await this.codeStore.cloneJsBundleAsync(baseKey, legacyKey).catch(() => false);
      upsertDraftIndexVersion(
        baseKey,
        { version: 'legacy', updatedAt: legacy.updatedAt || now, lang: legacy.language },
        { latestVersion: contentVersion }
      );
    }

    // Track current version in the draft index (used for "updated question" banner)
    const existingCurrent = await this.codeStore.getJsAsync(storageKey);
    const idx = upsertDraftIndexVersion(
      baseKey,
      { version: contentVersion, updatedAt: existingCurrent?.updatedAt || now, lang: existingCurrent?.language },
      { latestVersion: contentVersion }
    );

    const others = listOtherVersions(idx, contentVersion);
    this.availableOlderDrafts.set(others);
    this.showUpdateBanner.set(others.length > 0 && !isUpdateBannerDismissed(baseKey, contentVersion));

    // Seed baselines so "dirty" comparisons work reliably
    await Promise.all([
      this.codeStore.setJsBaselineAsync(storageKey, 'js', sJs),
      this.codeStore.setJsBaselineAsync(storageKey, 'ts', sTs),
    ]);

    // Decide preferred language: default to JS unless TS is dirty (user-edited)
    const tsState = await this.codeStore.getJsLangStateAsync(storageKey, 'ts').catch(() => null as any);
    const preferred: JsLang = tsState?.dirty ? 'ts' : 'js';

    this.jsLang.set(preferred);
    this.langChange.emit(preferred);
    await this.codeStore.setLastLangAsync(storageKey, preferred);        // keep sticky

    // 2) Ensure per-lang slots exist (post-migration safety)
    const jsSlot = await this.codeStore.getJsForLangAsync(storageKey, 'js');
    if (!(typeof jsSlot === 'string' && jsSlot.trim())) {
      await this.codeStore.saveJsAsync(storageKey, sJs, 'js', { force: true });
    }
    const tsSlot = await this.codeStore.getJsForLangAsync(storageKey, 'ts');
    if (!(typeof tsSlot === 'string' && tsSlot.trim())) {
      await this.codeStore.saveJsAsync(storageKey, sTs, 'ts', { force: true });
    }

    // 3) Hydrate editor/tests for chosen lang
    const starter = preferred === 'ts' ? sTs : sJs;
    const { initial, restored } = await this.codeStore.initJsAsync(storageKey, preferred, starter);

    this.editorContent.set(initial);
    this.testCode.set(this.pickTests(q as any, preferred));

    this.restoredFromStorage.set(restored);
    this.restoreDismissed.set(false);
    this.loadAssistStateForQuestion(q);
    await this.loadDecisionGraphForCurrentCode(q, preferred, initial);

    // Nudge Monaco once the first frame is ready (prevents first-frame squiggles)
    queueMicrotask(() => window.dispatchEvent(new Event('resize')));   // NEW

    // End hydration on next tick
    requestAnimationFrame(() => requestAnimationFrame(() => { this._hydrating = false; }));
  }

  private resetRunnerStateForQuestionChange(): void {
    this._runSeq += 1; // invalidate any in-flight run for the previous question
    this.clearDecisionGraphState();
    this.isRunningTests.set(false);
    this.hasRunTests.set(false);
    this.testResults.set([]);
    this.consoleEntries.set([]);
    this.stuckState.set(null);
    this.explainHint.set(null);
    this.explainExpanded.set(false);
    this.explainDismissed.set(false);
    this.hintExpanded.set(false);
    this.failureCategory.set('unknown');
    this.duckOpen.set(false);
    this.duckSteps.set([]);
    this.duckDoneStepIndexes.set([]);
    this.duckNote.set('');
    this.interviewSummary.set(null);
    this.lastTrackedStuckLevel = 0;
    this.interviewModeEnabled.set(false);
    this.interviewRemainingSec.set(0);
    this.interviewSetupOpen.set(false);
    this.interviewSession = null;
    this.stopInterviewTicker();
    this.subTab.set('tests');
    this.testResultsChange.emit([]);
    this.consoleEntriesChange.emit([]);
  }

  assistInterviewEnabled(): boolean {
    return !!this.assistFlags.interviewMode;
  }

  showInterviewSetup(): boolean {
    if (!this.assistInterviewEnabled()) return false;
    if (this.interviewModeEnabled()) return false;
    return !this.solutionPanelOpen;
  }

  assistRubberDuckEnabled(): boolean {
    return !!this.assistFlags.rubberDuck;
  }

  assistNudgeTitle(): string {
    const state = this.stuckState();
    if (!state || state.level < 1) return 'Keep going';
    if (state.level >= 3) return 'You are likely deeply stuck';
    if (state.level >= 2) return 'You are likely stuck on the same failure';
    return 'Small nudge: same failure is repeating';
  }

  private resolveInterventionTimingVariant(): 'early_l1' | 'late_l2' {
    if (!this.assistFlags.assistExperiments || !this.experiment) return 'early_l1';
    return this.experiment.variant('assist_intervention_timing_v1', 'coding_js_panel');
  }

  private resolveHintDensityVariant(): 'full' | 'compact' {
    if (!this.assistFlags.assistExperiments || !this.experiment) return 'full';
    return this.experiment.variant('assist_hint_density_v1', 'coding_js_panel');
  }

  private stuckNudgeMinLevel(): 1 | 2 {
    return this.interventionTimingVariant === 'late_l2' ? 2 : 1;
  }

  private applyHintDensityVariant(hint: FailureHint): FailureHint {
    if (this.hintDensityVariant !== 'compact') return hint;
    return {
      ...hint,
      actions: hint.actions.slice(0, 2),
    };
  }

  assistNudgeBody(): string {
    const state = this.stuckState();
    if (!state || state.level < 1) return '';
    const label = stuckLevelLabel(state.level).toLowerCase();
    return `${label}: ${state.consecutiveCount} similar run${state.consecutiveCount === 1 ? '' : 's'} in a row. Focus on the first failed test only.`;
  }

  toggleHintExpanded(): void {
    this.hintExpanded.set(!this.hintExpanded());
  }

  collapseHintPanel(): void {
    this.hintExpanded.set(false);
  }

  dismissHintPanel(): void {
    this.dismissStuckNudge();
    this.hintExpanded.set(false);
  }

  dismissStuckNudge(): void {
    const q = this.question;
    if (!q || !this.attemptInsights) return;
    const until = this.attemptInsights.dismissStuckNudge(q.id, 30);
    const state = this.stuckState();
    if (state) {
      this.stuckState.set({ ...state, dismissedUntilTs: until });
    }
    this.analytics?.track('assist_hint_dismissed', {
      question_id: q.id,
      reason: 'manual_dismiss_30m',
    });
  }

  toggleExplainExpanded(): void {
    const next = !this.explainExpanded();
    this.explainExpanded.set(next);
    if (next) {
      const q = this.question;
      this.analytics?.track('assist_explain_opened', {
        question_id: q?.id || 'unknown',
        category: this.failureCategory(),
      });
    }
  }

  dismissExplainPanel(): void {
    this.explainExpanded.set(false);
    this.explainDismissed.set(true);
    const q = this.question;
    this.analytics?.track('assist_hint_dismissed', {
      question_id: q?.id || 'unknown',
      reason: 'manual_explain_dismiss',
      category: this.failureCategory(),
    });
  }

  toggleDuckPanel(): void {
    this.duckOpen.set(!this.duckOpen());
  }

  onDuckStepToggle(stepIndex: number): void {
    const current = new Set(this.duckDoneStepIndexes());
    if (current.has(stepIndex)) current.delete(stepIndex);
    else current.add(stepIndex);
    const next = [...current].sort((a, b) => a - b);
    this.duckDoneStepIndexes.set(next);
    this.persistDuckState(this.stuckState()?.signature);
  }

  onDuckNoteInput(value: string): void {
    this.duckNote.set(String(value || ''));
    this.persistDuckState(this.stuckState()?.signature);
  }

  onInterviewDurationChange(value: string): void {
    const normalized = Number(value);
    if (normalized === 15 || normalized === 30 || normalized === 45) {
      this.interviewDurationMin.set(normalized);
    }
  }

  toggleInterviewSetupPanel(): void {
    if (this.interviewModeEnabled()) return;
    this.interviewSetupOpen.set(!this.interviewSetupOpen());
  }

  closeInterviewSetupPanel(): void {
    this.interviewSetupOpen.set(false);
  }

  startInterviewMode(): void {
    if (!this.assistFlags.interviewMode) return;
    const q = this.question;
    if (!q) return;

    const now = Date.now();
    this.interviewSummary.set(null);
    this.interviewModeEnabled.set(true);
    this.topTab.set('code');
    this.subTab.set('tests');
    this.hintExpanded.set(false);
    this.explainExpanded.set(false);
    this.explainDismissed.set(false);
    this.interviewSetupOpen.set(false);

    this.interviewSession = {
      questionId: q.id,
      startedAt: now,
      durationMin: this.interviewDurationMin(),
      runs: 0,
      bestPassPct: 0,
      updatedAt: now,
    };
    this.attemptInsights?.saveInterviewSession(this.interviewSession);
    this.syncInterviewRemaining();
    this.startInterviewTicker();

    this.analytics?.track('interview_mode_started', {
      question_id: q.id,
      duration_min: this.interviewDurationMin(),
    });
  }

  endInterviewMode(reason: 'manual' | 'expired' = 'manual'): void {
    if (!this.interviewModeEnabled()) return;
    const q = this.question;
    const session = this.interviewSession;
    const now = Date.now();
    const elapsedSec = session ? Math.max(0, Math.round((now - session.startedAt) / 1000)) : 0;
    const bestPassPct = session ? Math.round(session.bestPassPct * 100) : 0;

    this.interviewModeEnabled.set(false);
    this.interviewRemainingSec.set(0);
    this.stopInterviewTicker();
    if (q) this.attemptInsights?.clearInterviewSession(q.id);

    if (session) {
      this.interviewSummary.set({
        runs: session.runs,
        bestPassPct,
        elapsedSec,
      });
    }

    this.analytics?.track('interview_mode_completed', {
      question_id: q?.id || 'unknown',
      reason,
      runs: session?.runs ?? 0,
      best_pass_pct: bestPassPct,
      elapsed_sec: elapsedSec,
    });

    this.interviewSession = null;
  }

  interviewRemainingLabel(): string {
    const total = Math.max(0, this.interviewRemainingSec());
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${String(secs).padStart(2, '0')} left`;
  }

  private loadAssistStateForQuestion(question: Question): void {
    if (!this.attemptInsights) return;
    const runs = this.attemptInsights.getRunsForQuestion(question.id);
    const dismissedUntilTs = this.attemptInsights.getStuckDismissedUntil(question.id);
    const state = deriveStuckState(runs, { dismissedUntilTs });
    this.stuckState.set(state.level > 0 ? state : null);
    this.hintExpanded.set(false);
    this.explainDismissed.set(false);
    this.lastTrackedStuckLevel = state.level;

    this.restoreInterviewSession(question.id);
  }

  private restoreInterviewSession(questionId: string): void {
    if (!this.assistFlags.interviewMode || !this.attemptInsights) return;
    const session = this.attemptInsights.getInterviewSession(questionId);
    if (!session) return;
    const expiresAt = session.startedAt + session.durationMin * 60_000;
    if (Date.now() >= expiresAt) {
      this.attemptInsights.clearInterviewSession(questionId);
      return;
    }

    this.interviewDurationMin.set(session.durationMin);
    this.interviewModeEnabled.set(true);
    this.interviewSession = session;
    this.topTab.set('code');
    this.syncInterviewRemaining();
    this.startInterviewTicker();
  }

  private syncInterviewRemaining(): void {
    if (!this.interviewSession) {
      this.interviewRemainingSec.set(0);
      return;
    }
    const expiresAt = this.interviewSession.startedAt + this.interviewSession.durationMin * 60_000;
    const remainingMs = Math.max(0, expiresAt - Date.now());
    this.interviewRemainingSec.set(Math.ceil(remainingMs / 1000));
    if (remainingMs <= 0) {
      this.endInterviewMode('expired');
    }
  }

  private startInterviewTicker(): void {
    this.stopInterviewTicker();
    if (!this.isBrowser || !this.interviewModeEnabled()) return;
    this.interviewTicker = window.setInterval(() => this.syncInterviewRemaining(), 1000);
  }

  private stopInterviewTicker(): void {
    if (this.interviewTicker != null) {
      clearInterval(this.interviewTicker);
      this.interviewTicker = null;
    }
  }

  private persistDuckState(signature?: string): void {
    const q = this.question;
    if (!q || !this.attemptInsights || !this.assistFlags.rubberDuck) return;
    this.attemptInsights.saveRubberDuckState(q.id, {
      note: this.duckNote(),
      doneStepIndexes: this.duckDoneStepIndexes(),
      signature,
    });
  }

  private refreshDuckPrompts(input: { category: FailureCategory; errorLine: string; signature: string }): void {
    if (!this.assistFlags.rubberDuck) {
      this.duckSteps.set([]);
      this.duckOpen.set(false);
      return;
    }
    const q = this.question;
    if (!q) return;

    const steps = buildRubberDuckPrompts({
      category: input.category,
      questionTitle: q.title,
      tags: q.tags,
      errorLine: input.errorLine,
    });
    this.duckSteps.set(steps);

    const persisted = this.attemptInsights?.getRubberDuckState(q.id);
    if (persisted && persisted.signature === input.signature) {
      this.duckDoneStepIndexes.set(persisted.doneStepIndexes || []);
      this.duckNote.set(persisted.note || '');
    } else {
      this.duckDoneStepIndexes.set([]);
      this.duckNote.set('');
      this.persistDuckState(input.signature);
    }

    if ((this.stuckState()?.level || 0) >= 2) {
      this.duckOpen.set(true);
    }
  }

  dismissDraftUpdateBanner(): void {
    const baseKey = this.baseDraftKey();
    const current = this.currentContentVersion();
    if (baseKey && current) dismissUpdateBanner(baseKey, current);
    this.showUpdateBanner.set(false);
  }

  async backToLatestDraft(): Promise<void> {
    if (!this.isViewingOlderVersion()) return;
    this.flushPendingPersist();
    await this.initFromQuestion();
  }

  async openOlderDraft(versionRaw: string): Promise<void> {
    const version = String(versionRaw ?? '').trim();
    const q = this.question as Question;
    if (!q || !version) return;
    if (this.disablePersistence) return;

    const baseKey = this.baseDraftKey() || (this.storageKeyOverride || '').trim() || q.id;
    const currentVersion = this.currentContentVersion() || computeJsQuestionContentVersion(q as any);
    if (version === currentVersion) {
      await this.backToLatestDraft();
      return;
    }

    // Persist current buffer before switching drafts.
    this.flushPendingPersist();
    const activeKey = makeDraftKey(baseKey, this.activeDraftVersion() || currentVersion);
    await this.codeStore.saveJsAsync(activeKey, this.editorContent(), this.jsLang(), { allowEmpty: true }).catch(() => { });

    this._hydrating = true;
    this.clearSolutionDraftSnapshot();
    this.exitSolutionMode();
    this.topTab.set('code');
    this.subTab.set('tests');
    this.hasRunTests.set(false);
    this.testResults.set([]);
    this.consoleEntries.set([]);

    this.activeDraftVersion.set(version);
    const storageKey = makeDraftKey(baseKey, version);

    const [jsState, tsState, last] = await Promise.all([
      this.codeStore.getJsLangStateAsync(storageKey, 'js').catch(() => null as any),
      this.codeStore.getJsLangStateAsync(storageKey, 'ts').catch(() => null as any),
      this.codeStore.getLastLang(storageKey).catch(() => null),
    ]);

    const preferred: JsLang =
      (tsState?.dirty && !jsState?.dirty)
        ? 'ts'
        : (jsState?.dirty && !tsState?.dirty)
          ? 'js'
          : ((last === 'ts' || last === 'js') ? last : 'js');

    const state = preferred === 'ts' ? tsState : jsState;
    if (!state) {
      // Couldn't load the requested version; fall back to latest.
      await this.initFromQuestion();
      return;
    }

    const visible = state.hasUserCode ? state.code : state.baseline;
    this.jsLang.set(preferred);
    this.langChange.emit(preferred);
    this.editorContent.set(visible || '');
    this.testCode.set(this.pickTests(q as any, preferred));

    this.restoredFromStorage.set(state.dirty);
    this.restoreDismissed.set(false);

    await this.codeStore.setLastLangAsync(storageKey, preferred).catch(() => { });

    queueMicrotask(() => window.dispatchEvent(new Event('resize')));
    this.endHydrationSoon();
  }

  async copyDraftIntoLatest(versionRaw: string): Promise<void> {
    const fromVersion = String(versionRaw ?? '').trim();
    const q = this.question as Question;
    if (!q || !fromVersion) return;
    if (this.disablePersistence) return;

    const baseKey = this.baseDraftKey() || (this.storageKeyOverride || '').trim() || q.id;
    const currentVersion = this.currentContentVersion() || computeJsQuestionContentVersion(q as any);
    if (!currentVersion) return;

    const fromKey = makeDraftKey(baseKey, fromVersion);
    const toKey = makeDraftKey(baseKey, currentVersion);

    const { js: starterJs, ts: starterTs } = this.startersForBoth(q);
    const langToCopy: JsLang = this.jsLang();
    const starterForLang = langToCopy === 'ts' ? starterTs : starterJs;

    // Ensure current baselines exist so "dirty" comparisons remain meaningful.
    await Promise.all([
      this.codeStore.setJsBaselineAsync(toKey, 'js', starterJs),
      this.codeStore.setJsBaselineAsync(toKey, 'ts', starterTs),
    ]).catch(() => { });

    const state = await this.codeStore.getJsLangStateAsync(fromKey, langToCopy).catch(() => null as any);
    const nextCode = (state?.hasUserCode ? state.code : state?.baseline) || starterForLang;

    await this.codeStore.saveJsAsync(toKey, nextCode, langToCopy, { force: true }).catch(() => { });

    // If we were looking at an older draft, jump back to latest so the user sees the copied content.
    if (this.isViewingOlderVersion()) {
      await this.initFromQuestion();
      return;
    }

    // We are already on latest → update editor in-place.
    this._hydrating = true;
    this.clearSolutionDraftSnapshot();
    this.editorContent.set(nextCode);
    this.testCode.set(this.pickTests(q as any, langToCopy));
    this.exitSolutionMode();
    this.restoredFromStorage.set(true);
    this.restoreDismissed.set(false);
    this.hasRunTests.set(false);
    this.testResults.set([]);
    this.consoleEntries.set([]);
    this.endHydrationSoon();
  }

  copyActiveDraftIntoLatest(): Promise<void> {
    return this.copyDraftIntoLatest(this.activeDraftVersion());
  }

  // REPLACE your current setLanguage with this one
  async setLanguage(lang: string) {
    const next: JsLang = (lang === 'ts') ? 'ts' : 'js';
    const currentLang = this.jsLang();
    if (next === currentLang) return;

    const q = this.question;
    if (!q) return;
    if (this.disablePersistence) {
      this.volatileBuffers[currentLang] = this.editorContent();
      const { js: sJs, ts: sTs } = this.startersForBoth(q);
      const nextDefault = next === 'ts' ? sTs : sJs;
      const nextCode = this.volatileBuffers[next] || nextDefault;
      this.editorContent.set(nextCode);
      this.testCode.set(this.pickTests(q as any, next));
      this.viewingSolution.set(false);
      this.restoredFromStorage.set(false);
      this.restoreDismissed.set(true);
      this.hasRunTests.set(false);
      this.testResults.set([]);
      this.consoleEntries.set([]);
      this.jsLang.set(next);
      this.langChange.emit(next);
      this.endHydrationSoon();
      return;
    }
    const storageKey = this.storageKeyFor(q);
    if (!storageKey) return;

    // 1) Persist current code for the current lang (unless we're hydrating)
    if (!this._hydrating) {
      this.cancelPendingPersist();
      await this.codeStore.saveJsAsync(storageKey, this.editorContent(), currentLang, { allowEmpty: true });
    }

    // Snapshot UI flags so we don't lose the banner states
    const bannerWasRestored = this.restoredFromStorage();
    const bannerWasDismissed = this.restoreDismissed();

    this._hydrating = true;

    // 2) Pull any existing code for the target language
    const { js: starterJs, ts: starterTs } = this.startersForBoth(q as Question);
    const rawPerLang = await this.codeStore.getJsForLangAsync(storageKey, next);

    let nextCode = (typeof rawPerLang === 'string' && rawPerLang.trim())
      ? rawPerLang
      : '';

    // 3) If target slot is empty, seed it intelligently
    if (!nextCode) {
      if (next === 'js') {
        // We’re switching TS -> JS: derive JS from current TS editor
        const tsNow = this.editorContent();
        const cameFromTs = currentLang === 'ts';
        nextCode = cameFromTs ? await this.ensureJs(tsNow, `${q.id}.ts`) : tsNow;
        if (!nextCode?.trim()) nextCode = starterJs;
      } else {
        // Switching JS -> TS: simplest & safest default is to copy JS verbatim
        const jsNow = this.editorContent();
        nextCode = jsNow?.trim() ? jsNow : starterTs;
      }

      // Persist the seed so subsequent switches are stable
      await this.codeStore.saveJsAsync(storageKey, nextCode, next, { force: true });
    }

    const nextTests = this.pickTests(q as any, next);

    // 4) Hydrate editor + tests for the new lang in one sync batch to avoid transient squiggles
    this.editorContent.set(nextCode);
    this.testCode.set(nextTests);

    // Restore banners as they were
    this.restoredFromStorage.set(bannerWasRestored);
    this.restoreDismissed.set(bannerWasDismissed);

    // Reset local UI state
    this.topTab.set('code');
    this.subTab.set('tests');
    this.hasRunTests.set(false);
    this.testResults.set([]);
    this.consoleEntries.set([]);

    // Only now flip the language so Monaco sees consistent (lang, code) at once
    this.jsLang.set(next);
    this.langChange.emit(next);
    await this.codeStore.setLastLangAsync(storageKey, next);

    // End hydration
    this.endHydrationSoon();
  }

  /* ---------- Handlers ---------- */
  onCodeChange(code: string) {
    if (this._hydrating) return;
    const q = this.question; if (!q) return;
    if (this.disablePersistence) {
      if (code === this.editorContent()) return;
      this.editorContent.set(code);
      this.volatileBuffers[this.jsLang()] = code;
      this.codeChange.emit({ lang: this.jsLang(), code });
      if (this.viewingSolution()) {
        this.viewingSolution.set(false);
      }
      return;
    }
    const storageKey = this.storageKeyFor(q);
    if (!storageKey) return;
    if (code === this.editorContent()) return;

    this.editorContent.set(code);
    this.schedulePersist(storageKey, this.jsLang(), code);
    this.codeChange.emit({ lang: this.jsLang(), code });

    if (this.viewingSolution()) {
      this.viewingSolution.set(false);
      // keep banner visible for manual revert
    }
  }

  // Tests change is fine – it doesn't touch question
  onTestsChange = (code: string) => { this.testCode.set(code); };

  // Run tests
  async runTests() {
    const q = this.question; if (!q) return;
    let rawUserSnapshot = this.editorContent();

    const runId = ++this._runSeq;
    this.isRunningTests.set(true);
    this.hasRunTests.set(false);
    this.testResults.set([]);
    this.consoleEntries.set([]);
    this.consoleEntriesChange.emit([]);

    try {
      await this.flushEditorBuffer();
      const rawUser = this.codeEditor?.getValue?.() ?? this.editorContent();
      rawUserSnapshot = rawUser;
      const rawTests = this.testsEditor?.getValue?.() ?? this.testCode();
      this.syncEditorBuffers(rawUser, rawTests);
      const userSrc = await this.ensureJs(rawUser, `${q.id}.ts`);
      if (runId !== this._runSeq) return;

      const testsSrc = await this.ensureJs(rawTests, `${q.id}.tests.ts`);
      if (runId !== this._runSeq) return;

      const wrapped = this.wrapExportDefault(userSrc);
      const prepared = this.transformTestCode(testsSrc);
      let sandboxOut: RunnerOutput | null = null;

      try {
        const runner = await this.loadRunner();
        const out = await runner.runWithTests({ userCode: wrapped, testCode: prepared, timeoutMs: 1500 });
        if (runId !== this._runSeq) return;
        sandboxOut = out;
        this.consoleEntries.set(this.sanitizeLogs(out?.entries));
        const sandboxResults = out?.results || [];
        if (sandboxResults.length === 0 && (out?.timedOut || !!out?.error)) {
          this.testResults.set([this.buildSandboxFailureResult(out)]);
        } else {
          this.testResults.set(sandboxResults);
        }
      } catch (e: any) {
        if (runId !== this._runSeq) return;
        this.testResults.set([{ name: 'Test runner error', passed: false, error: this.short(e) }]);
      }

      /* ---------- LOCAL FALLBACK if sandbox produced no cases ---------- */
      const canUseLocalFallback =
        prepared.trim() &&
        !!sandboxOut &&
        !sandboxOut.timedOut &&
        !sandboxOut.error &&
        (this.testResults() || []).length === 0;
      if (canUseLocalFallback) {
        try {
          const results: TestResult[] = [];
          const logs: ConsoleEntry[] = [];
          const MAX_LOGS = 200;
          const MAX_LOG_CHARS = 2000;
          const MAX_PREVIEW_DEPTH = 4;
          const MAX_PREVIEW_KEYS = 20;
          const MAX_PREVIEW_ARRAY_ITEMS = 20;
          let logLimitHit = false;

          const clamp = (s: string) => s.length > MAX_LOG_CHARS ? `${s.slice(0, MAX_LOG_CHARS)}…` : s;

          const tagOf = (v: any) => Object.prototype.toString.call(v);
          const formatSpecial = (v: any): string | null => {
            if (v && (typeof v === 'object' || typeof v === 'function')) {
              if (tagOf(v) === '[object Promise]') return 'Promise {<pending>}';
              if (v instanceof Error) {
                const name = v?.name ? String(v.name) : 'Error';
                const msg = v?.message ? String(v.message) : '';
                return msg ? `${name}: ${msg}` : name;
              }
            }
            return null;
          };
          const safeStringify = (v: any) => {
            try {
              if (v === null) return 'null';
              const t = typeof v;
              if (t === 'string') return v.length > MAX_LOG_CHARS ? `${v.slice(0, MAX_LOG_CHARS)}…` : v;
              if (t === 'undefined') return 'undefined';
              if (t === 'number' || t === 'boolean' || t === 'bigint') return String(v);
              if (t === 'symbol') return v.toString();
              if (t === 'function') return `[Function ${v.name || 'anonymous'}]`;

              const special = formatSpecial(v);
              if (special) return special;

              const seen = new WeakSet<object>();
              const depths = new WeakMap<object, number>();
              const json = JSON.stringify(v, function (this: any, key: string, val: any) {
                const specialInner = formatSpecial(val);
                if (specialInner) return specialInner;

                if (typeof val === 'string') {
                  return val.length > MAX_LOG_CHARS ? `${val.slice(0, MAX_LOG_CHARS)}…` : val;
                }
                if (typeof val === 'symbol') return val.toString();
                if (typeof val === 'function') return `[Function ${val.name || 'anonymous'}]`;

                if (!val || (typeof val !== 'object' && typeof val !== 'function')) return val;

                const holder: any = this;
                const holderDepth =
                  holder && (typeof holder === 'object' || typeof holder === 'function')
                    ? (depths.get(holder) ?? 0)
                    : 0;
                const nextDepth = key === '' ? 0 : holderDepth + 1;
                if (!depths.has(val)) depths.set(val, nextDepth);
                const depth = depths.get(val) ?? nextDepth;
                if (depth > MAX_PREVIEW_DEPTH) return tagOf(val);

                if (typeof val === 'object') {
                  if (seen.has(val)) return '[Circular]';
                  seen.add(val);

                  if (Array.isArray(val)) {
                    if (val.length > MAX_PREVIEW_ARRAY_ITEMS) {
                      const head = val.slice(0, MAX_PREVIEW_ARRAY_ITEMS);
                      return [...head, `… +${val.length - MAX_PREVIEW_ARRAY_ITEMS} more`];
                    }
                    return val;
                  }

                  if (val instanceof Map) {
                    const entries: any[] = [];
                    let i = 0;
                    for (const [k, v] of val.entries()) {
                      if (i++ >= MAX_PREVIEW_KEYS) { entries.push(['…', '…']); break; }
                      entries.push([k, v]);
                    }
                    return { '[[Map]]': entries, size: val.size };
                  }

                  if (val instanceof Set) {
                    const values: any[] = [];
                    let i = 0;
                    for (const item of val.values()) {
                      if (i++ >= MAX_PREVIEW_KEYS) { values.push('…'); break; }
                      values.push(item);
                    }
                    return { '[[Set]]': values, size: val.size };
                  }

                  const proto = Object.getPrototypeOf(val);
                  const isPlain = proto === Object.prototype || proto === null;
                  if (isPlain) {
                    const out: Record<string, any> = {};
                    let count = 0;
                    for (const k in val as any) {
                      if (!Object.prototype.hasOwnProperty.call(val, k)) continue;
                      if (count++ >= MAX_PREVIEW_KEYS) { out['…'] = '…'; break; }
                      out[k] = (val as any)[k];
                    }
                    return out;
                  }
                }
                return val;
              });
              return typeof json === 'string' ? json : String(v);
            } catch {
              try { return String(v); } catch { return '[Unserializable]'; }
            }
          };
          const formatArgs = (args: any[]) => {
            let msg = '';
            for (const a of args) {
              const part = safeStringify(a);
              if (!msg) msg = part;
              else msg += ` ${part}`;
              if (msg.length > MAX_LOG_CHARS) return clamp(msg);
            }
            return clamp(msg);
          };
          const push = (level: 'log' | 'info' | 'warn' | 'error', args: any[]) => {
            if (logs.length >= MAX_LOGS) {
              if (!logLimitHit) {
                logs.push({ level: 'warn', message: `Log limit reached (${MAX_LOGS})`, timestamp: Date.now() });
                logLimitHit = true;
              }
              return;
            }
            logs.push({ level, message: formatArgs(args), timestamp: Date.now() });
          };
          const consoleProxy = {
            log: (...a: any[]) => push('log', a),
            info: (...a: any[]) => push('info', a),
            warn: (...a: any[]) => push('warn', a),
            error: (...a: any[]) => push('error', a),
          };

          const isObj = (v: any) => v !== null && typeof v === 'object';
          const deepEqual = (a: any, b: any): boolean => {
            if (Object.is(a, b)) return true;
            if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
            if (isObj(a) && isObj(b)) {
              const ka = Object.keys(a), kb = Object.keys(b);
              if (ka.length !== kb.length) return false;
              for (const k of ka) if (!deepEqual(a[k], b[k])) return false;
              return true;
            }
            return false;
          };
          const matchesPartial = (actual: any, expected: any): boolean => {
            if (expected === null || expected === undefined) return Object.is(actual, expected);
            if (Array.isArray(expected)) {
              if (!Array.isArray(actual) || actual.length < expected.length) return false;
              return expected.every((item, i) => matchesPartial(actual[i], item));
            }
            if (typeof expected === 'object') {
              if (!isObj(actual)) return false;
              return Object.keys(expected).every((k) => matchesPartial(actual?.[k], expected[k]));
            }
            return Object.is(actual, expected);
          };
          const asMsg = (v: any) => String(v?.message ?? v);
          const assertErrorLike = (err: any, expected?: any) => {
            if (expected === undefined) return;
            const msg = asMsg(err);
            if (typeof expected === 'string') {
              if (!msg.includes(expected)) throw new Error(`Expected error message to include ${expected}, received ${msg}`);
              return;
            }
            if (expected instanceof RegExp) {
              if (!expected.test(msg)) throw new Error(`Expected error message to match ${expected}, received ${msg}`);
              return;
            }
            if (typeof expected === 'function') {
              const ctorName = expected?.name || '';
              const actualName = err?.name || '';
              if (!(err instanceof expected) && (!ctorName || actualName !== ctorName)) {
                throw new Error(`Expected error type ${ctorName || 'Error'}`);
              }
            }
          };
          const expect = (received: any) => {
            const base = {
              toBe: (exp: any) => {
                if (!Object.is(received, exp)) throw new Error(`Expected ${safeStringify(received)} to be ${safeStringify(exp)}`);
              },
              toEqual: (exp: any) => {
                if (!deepEqual(received, exp)) throw new Error(`Expected ${safeStringify(received)} to equal ${safeStringify(exp)}`);
              },
              toStrictEqual: (exp: any) => {
                if (!deepEqual(received, exp)) throw new Error(`Expected ${safeStringify(received)} to strictly equal ${safeStringify(exp)}`);
              },
              toBeTruthy: () => {
                if (!received) throw new Error(`Expected value to be truthy, received ${safeStringify(received)}`);
              },
              toMatchObject: (exp: any) => {
                if (!matchesPartial(received, exp)) throw new Error(`Expected ${safeStringify(received)} to match object ${safeStringify(exp)}`);
              },
              toThrow: (expected?: any) => {
                if (typeof received !== 'function') throw new Error('toThrow matcher expects a function');
                let thrown: any;
                try {
                  received();
                } catch (err: any) {
                  thrown = err;
                }
                if (!thrown) throw new Error('Expected function to throw');
                assertErrorLike(thrown, expected);
              },
            };
            return {
              ...base,
              resolves: {
                toBe: async (exp: any) => {
                  const value = await Promise.resolve(received);
                  if (!Object.is(value, exp)) throw new Error(`Expected ${safeStringify(value)} to be ${safeStringify(exp)}`);
                },
                toEqual: async (exp: any) => {
                  const value = await Promise.resolve(received);
                  if (!deepEqual(value, exp)) throw new Error(`Expected ${safeStringify(value)} to equal ${safeStringify(exp)}`);
                },
                toMatchObject: async (exp: any) => {
                  const value = await Promise.resolve(received);
                  if (!matchesPartial(value, exp)) throw new Error(`Expected ${safeStringify(value)} to match object ${safeStringify(exp)}`);
                },
              },
              rejects: {
                toThrow: async (expected?: any) => {
                  let resolved = false;
                  try {
                    await Promise.resolve(received);
                    resolved = true;
                  } catch (err: any) {
                    assertErrorLike(err, expected);
                    return;
                  }
                  if (resolved) throw new Error('Expected promise to reject');
                },
                toMatchObject: async (exp: any) => {
                  let resolved = false;
                  try {
                    await Promise.resolve(received);
                    resolved = true;
                  } catch (err: any) {
                    if (!matchesPartial(err, exp)) throw new Error(`Expected ${safeStringify(err)} to match object ${safeStringify(exp)}`);
                    return;
                  }
                  if (resolved) throw new Error('Expected promise to reject');
                },
              },
            };
          };

          const scheduled: Promise<void>[] = [];
          const runCase = async (name: string, fn: (...args: any[]) => any | Promise<any>) => {
            try {
              if (typeof fn !== 'function') throw new Error('Test case is not callable');
              if (fn.length >= 1) {
                await new Promise<void>((resolve, reject) => {
                  const done = (err?: any) => (err ? reject(err) : resolve());
                  try {
                    fn(done);
                  } catch (e) {
                    reject(e);
                  }
                });
              } else {
                await fn();
              }
              results.push({ name, passed: true });
            } catch (e: any) {
              results.push({ name, passed: false, error: String(e?.message ?? e) });
            }
          };
          const it = (name: string, fn: (...args: any[]) => any | Promise<any>) => {
            const task = runCase(name, fn);
            scheduled.push(task);
            return task;
          };
          const test = it;
          const describe = (name: string, fn: () => void) => {
            try {
              fn();
            } catch (e: any) {
              results.push({ name: name || 'describe block', passed: false, error: String(e?.message ?? e) });
            }
          };

          const prevConsole = (globalThis as any).console;
          const unhandledRejections: string[] = [];
          const onUnhandledRejection = (event: any) => {
            try { event?.preventDefault?.(); } catch { }
            const reason = event?.reason;
            unhandledRejections.push(String(reason?.message ?? reason ?? 'Unhandled promise rejection'));
          };
          if (this.isBrowser && typeof window !== 'undefined') {
            window.addEventListener('unhandledrejection', onUnhandledRejection as any);
          }
          (globalThis as any).console = consoleProxy;
          try {
            new Function(wrapped)(); // define user default on global
            await new Function('describe', 'test', 'it', 'expect', 'console', prepared)(
              describe as any, test as any, it as any, expect as any, consoleProxy as any
            );
            await Promise.allSettled(scheduled);
          } finally {
            if (this.isBrowser && typeof window !== 'undefined') {
              window.removeEventListener('unhandledrejection', onUnhandledRejection as any);
            }
            (globalThis as any).console = prevConsole;
          }
          if (unhandledRejections.length) {
            const seen = new Set<string>();
            for (const msg of unhandledRejections) {
              const normalized = String(msg || '').trim() || 'Unhandled promise rejection';
              if (seen.has(normalized)) continue;
              seen.add(normalized);
              results.push({ name: 'Unhandled async rejection', passed: false, error: normalized });
            }
          }

          if (runId !== this._runSeq) return;
          this.consoleEntries.set(this.sanitizeLogs(logs));
          this.testResults.set(results);
        } catch (e: any) {
          if (runId !== this._runSeq) return;
          this.testResults.set([{ name: 'Local runner error', passed: false, error: this.short(e) }]);
        }
      }
      /* ---------- end fallback ---------- */

      if (runId !== this._runSeq) return;
      this.hasRunTests.set(true);
      const passing = this.allPassing();
      this.solvedChange.emit(passing);
      this.testResultsChange.emit(this.testResults());
      this.consoleEntriesChange.emit(this.consoleEntries());
      this.processAssistAfterRun(q, rawUserSnapshot, this.testResults());
      this.subTab.set('tests');
    } finally {
      if (runId === this._runSeq) this.isRunningTests.set(false);
    }
  }

  private buildSandboxFailureResult(out: RunnerOutput | null | undefined): TestResult {
    const error = this.short(out?.error || 'Test execution failed.');
    if (out?.timedOut || this.isTimeoutLikeRunnerError(error)) {
      return { name: 'Test execution timed out', passed: false, error };
    }
    return { name: 'Test runner failed', passed: false, error };
  }

  private isTimeoutLikeRunnerError(message: string | null | undefined): boolean {
    const normalized = String(message || '').toLowerCase();
    if (!normalized) return false;
    return normalized.includes('timed out')
      || normalized.includes('force-stopped')
      || normalized.includes('execution blocked');
  }

  private processAssistAfterRun(question: Question, rawUserCode: string, results: TestResult[]): void {
    if (!this.attemptInsights) return;

    const totalCount = results.length;
    if (totalCount <= 0) return;
    const passCount = results.filter((item) => item.passed).length;
    const firstFail = results.find((item) => !item.passed);
    const failCount = Math.max(0, totalCount - passCount);
    const normalizedError = normalizeErrorLine(firstFail?.error || '');
    const signature = createFailureSignature({
      firstFailName: firstFail?.name,
      errorLine: normalizedError,
      failCount,
    });
    const codeHash = stableHash(rawUserCode);
    const existingRuns = this.attemptInsights.getRunsForQuestion(question.id);
    const previousRun = existingRuns.length ? existingRuns[existingRuns.length - 1] : null;
    const prevHash = previousRun?.codeHash || '';
    const category = classifyFailureCategory(firstFail?.error || normalizedError);

    const out = this.attemptInsights.recordRun({
      questionId: question.id,
      lang: this.jsLang(),
      ts: Date.now(),
      passCount,
      totalCount,
      firstFailName: String(firstFail?.name || ''),
      errorLine: normalizedError,
      signature,
      codeHash,
      codeChanged: prevHash ? prevHash !== codeHash : true,
      interviewMode: this.interviewModeEnabled(),
      errorCategory: category,
      tags: question.tags || [],
    });

    if (Number.isFinite(out.runToPassMs) && (out.runToPassMs || 0) > 0) {
      this.analytics?.track('run_to_pass_ms', {
        question_id: question.id,
        duration_ms: Math.round(out.runToPassMs!),
        lang: this.jsLang(),
        interview_mode: this.interviewModeEnabled(),
      });
    }

    const dismissedUntilTs = this.attemptInsights.getStuckDismissedUntil(question.id);
    const stuck = deriveStuckState(out.runsForQuestion, { dismissedUntilTs });
    this.stuckState.set(stuck.level > 0 ? stuck : null);
    this.hintExpanded.set(false);

    if (
      this.assistFlags.assistExperiments &&
      this.experiment &&
      !this.interviewModeEnabled() &&
      stuck.level >= this.stuckNudgeMinLevel()
    ) {
      this.experiment.expose(
        'assist_intervention_timing_v1',
        this.interventionTimingVariant,
        `${question.id}:${stuck.level}`,
        'coding_js_panel',
      );
    }

    if (!this.interviewModeEnabled() && stuck.level > this.lastTrackedStuckLevel && stuck.level > 0) {
      this.analytics?.track('assist_stuck_level_reached', {
        question_id: question.id,
        level: stuck.level,
        consecutive_count: stuck.consecutiveCount,
      });
    }
    this.lastTrackedStuckLevel = stuck.level;

    if (firstFail && this.assistFlags.explainFailure && !this.interviewModeEnabled()) {
      const rawHint = buildFailureHint({
        questionId: question.id,
        errorLine: normalizedError,
        firstFailName: firstFail.name,
        category,
        passCount,
        totalCount,
        failCount,
        failedTests: results
          .filter((item) => !item.passed)
          .map((item) => ({ name: item.name, errorLine: String(item.error || '') })),
        previousRun: previousRun
          ? {
            passCount: previousRun.passCount,
            totalCount: previousRun.totalCount,
            firstFailName: previousRun.firstFailName,
            signature: previousRun.signature,
          }
          : undefined,
      });
      const hint = this.applyHintDensityVariant(rawHint);
      this.explainHint.set(hint);
      this.failureCategory.set(category);
      this.explainExpanded.set(false);
      this.explainDismissed.set(false);
      this.analytics?.track('assist_hint_shown', {
        question_id: question.id,
        rule_id: hint.ruleId,
        category,
      });
      if (this.assistFlags.assistExperiments && this.experiment) {
        this.experiment.expose(
          'assist_hint_density_v1',
          this.hintDensityVariant,
          `${question.id}:${category}`,
          'coding_js_panel',
        );
      }
    } else {
      this.explainHint.set(null);
      this.failureCategory.set('unknown');
      this.explainExpanded.set(false);
      this.explainDismissed.set(false);
    }

    if (firstFail && !this.interviewModeEnabled()) {
      this.refreshDuckPrompts({
        category,
        errorLine: normalizedError,
        signature,
      });
    } else if (!firstFail) {
      this.duckSteps.set([]);
      this.duckOpen.set(false);
      this.duckDoneStepIndexes.set([]);
      this.duckNote.set('');
    }

    if (this.interviewModeEnabled() && this.interviewSession) {
      const passPct = totalCount > 0 ? passCount / totalCount : 0;
      this.interviewSession = {
        ...this.interviewSession,
        runs: this.interviewSession.runs + 1,
        bestPassPct: Math.max(this.interviewSession.bestPassPct, passPct),
        updatedAt: Date.now(),
      };
      this.attemptInsights.saveInterviewSession(this.interviewSession);
      this.syncInterviewRemaining();
    }
  }

  private async loadRunner(): Promise<Runner> {
    if (this.runnerInstance) return this.runnerInstance;
    if (this.runnerPromise) return this.runnerPromise;
    this.runnerPromise = import('../../../../core/services/user-code-sandbox.service')
      .then((mod) => {
        const instance = new mod.UserCodeSandboxService();
        this.runnerInstance = instance;
        return instance as Runner;
      })
      .finally(() => {
        this.runnerPromise = undefined;
      });
    return this.runnerPromise;
  }

  private async flushEditorBuffer(): Promise<void> {
    await new Promise<void>((resolve) => {
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => resolve());
      } else {
        Promise.resolve().then(resolve);
      }
    });
  }

  private syncEditorBuffers(rawUser: string, rawTests: string): void {
    if (rawUser !== this.editorContent()) {
      this.editorContent.set(rawUser);
      if (this.disablePersistence) {
        this.volatileBuffers[this.jsLang()] = rawUser;
      } else {
        const storageKey = this.storageKeyFor(this.question);
        if (storageKey) this.schedulePersist(storageKey, this.jsLang(), rawUser);
      }
      this.codeChange.emit({ lang: this.jsLang(), code: rawUser });
      if (this.viewingSolution()) {
        this.viewingSolution.set(false);
      }
    }

    if (rawTests !== this.testCode()) {
      this.testCode.set(rawTests);
    }
  }

  /* ---------- Helpers (trimmed copies of your originals) ---------- */
  private pickTests(q: any, lang: JsLang): string {
    const keysJs = ['tests', 'testsJs', 'unitTests', 'spec', 'specs', 'testCode'];
    const keysTs = ['testsTs', 'tests', 'unitTestsTs', 'specTs', 'specsTs', 'testCodeTs'];
    const pick = (obj: any, keys: string[]) => {
      for (const k of keys) {
        const v = obj?.[k];
        if (typeof v === 'string' && v.trim()) return v;
      }
      return '';
    };
    return lang === 'ts' ? pick(q, keysTs) : pick(q, keysJs);
  }

  private async ensureJs(code: string, fileName: string): Promise<string> {
    if (!code) return '';

    const cleaned = this.stripCommentsAndStrings(code);
    const looksTs =
      /\binterface\b/.test(cleaned) ||
      /\benum\s+[A-Za-z_$]/.test(cleaned) ||
      /\btype\s+[A-Za-z_$][\w$]*\s*=/.test(cleaned) ||
      /\bas\s+[A-Za-z_$][\w$<>\[\]\|&\s,]*/.test(cleaned) ||
      /\b(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*:\s*[A-Za-z_$]/.test(cleaned) ||
      /\)\s*:\s*[A-Za-z_$]/.test(cleaned);

    const stripTypes = (s: string) =>
      s
        .replace(/:\s*[^=;,)]+(?=[=;,)])/g, '')
        .replace(/\sas\s+[A-Za-z_$][\w$<>\[\]\|&\s,]*/g, '')
        .replace(/\binterface\b[\s\S]*?\{[\s\S]*?\}\s*/g, '')
        .replace(/\btype\s+[A-Za-z_$][\w$]*\s*=\s*[\s\S]*?;/g, '')
        .replace(/\benum\s+[A-Za-z_$][\w$]*\s*\{[\s\S]*?\}\s*/g, '');

    if (this.jsLang() === 'ts' || looksTs) {
      try {
        const uri = monaco.Uri.parse(`inmemory://model/${fileName}`);
        const model = monaco.editor.createModel(code, 'typescript', uri);
        try {
          const getWorker = await monaco.languages.typescript.getTypeScriptWorker();
          const svc = await getWorker(uri);
          const out = await svc.getEmitOutput(uri.toString());
          const js = out?.outputFiles?.[0]?.text ?? '';
          if (js && js.trim()) return js;        // ✅ only trust non-empty emit
        } finally {
          // always dispose
          model.dispose();
        }
      } catch {
        // ignore and fall through to strip
      }
      // ✅ fallback when emit was empty or worker failed
      return stripTypes(code);
    }

    return code;
  }

  private stripCommentsAndStrings(code: string): string {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/(['"`])(?:\\.|(?!\1)[\s\S])*?\1/g, '');
  }

  private wrapExportDefault(src: string): string {
    let name: string | null = null;
    let s = src;
    s = s.replace(/\bexport\s+default\s+function\s+([A-Za-z0-9_]+)?/m, (_m, n) => {
      name = n || '__FA_DefaultFn__';
      return `function ${name}`;
    });
    s = s.replace(/\bexport\s+default\s+class\s+([A-Za-z0-9_]+)?/m, (_m, n) => {
      name = n || '__FA_DefaultClass__';
      return `class ${name}`;
    });
    if (!/\b__FA_Default(Fn|Class)__\b/.test(s)) {
      const before = s;
      s = s.replace(/\bexport\s+default\s+/m, 'const __FA_Default__ = ');
      if (s !== before) name = name || '__FA_Default__';
    }
    s += `
      ;globalThis.__FA_USER_DEFAULT__ = (typeof ${name} !== "undefined") ? ${name} : undefined;
      ;try { if (${JSON.stringify(name)} && typeof ${name} !== "undefined") { globalThis[${JSON.stringify(name)}] = ${name}; } } catch {}
    `;
    return s;
  }

  private transformTestCode(src: string): string {
    const REL_DEFAULT = /import\s+([A-Za-z0-9_$*\s{},]+)\s+from\s+['"]\.\/[A-Za-z0-9_\-./]+['"];?/g;
    let out = src.replace(REL_DEFAULT, (_m, bindings) => {
      const first = bindings.includes('{')
        ? bindings.replace(/[{}*\s]/g, '').split(',')[0] || '__user'
        : bindings.trim();
      return `const ${first} = globalThis.__FA_USER_DEFAULT__;`;
    });
    // Common TS->JS output patterns when module transform yields CJS helpers.
    out = out.replace(
      /\b(?:var|const|let)\s+([A-Za-z0-9_$]+)\s*=\s*__importDefault\(require\(['"]\.\/[^'"]+['"]\)\);?/g,
      'const $1 = { default: globalThis.__FA_USER_DEFAULT__ };',
    );
    out = out.replace(
      /\b(?:var|const|let)\s+([A-Za-z0-9_$]+)\s*=\s*require\(['"]\.\/[^'"]+['"]\);?/g,
      'const $1 = globalThis.__FA_USER_DEFAULT__;',
    );
    out = out.replace(/^\s*import\s+[^;]+from\s+['"](jest|vitest)['"];\s*$/mg, '');
    out = out.replace(/^\s*export\s*\{\s*\};?\s*$/mg, '');
    out = out.replace(/^\s*Object\.defineProperty\(exports,\s*['"]__esModule['"],\s*\{[^}]*\}\);\s*$/mg, '');
    return out;
  }

  private sanitizeLogs(raw: any[]): ConsoleEntry[] {
    const now = Date.now();
    const MAX_LOGS = 200;
    const MAX_CHARS = 2000;
    const clamp = (s: string) => s.length > MAX_CHARS ? `${s.slice(0, MAX_CHARS)}…` : s;
    const toStr = (v: any) => {
      try {
        if (v === null) return 'null';
        if (v === undefined) return 'undefined';
        const t = typeof v;
        if (t === 'string') return clamp(v);
        if (t === 'number' || t === 'boolean' || t === 'bigint') return String(v);
        if (t === 'symbol') return v.toString();
        if (t === 'function') return `[Function ${v.name || 'anonymous'}]`;
        return clamp(String(v));
      } catch {
        return '[Unserializable]';
      }
    };
    const toMsg = (parts: any[] | any) => {
      if (Array.isArray(parts)) return clamp(parts.map(toStr).join(' '));
      return toStr(parts);
    };
    return (raw || []).slice(-MAX_LOGS).map((r: any) => {
      if (r?.level && r?.message) {
        const stack = typeof r.stack === 'string' ? r.stack : undefined;
        const name = typeof r.name === 'string' ? r.name : undefined;
        return {
          level: r.level,
          message: clamp(String(r.message)),
          timestamp: r.timestamp ?? now,
          stack,
          name,
        };
      }
      if (r?.type) {
        const level = (['info', 'warn', 'error'].includes(r.type) ? r.type : 'log') as ConsoleEntry['level'];
        return { level, message: toMsg(r.args), timestamp: now };
      }
      return { level: 'log', message: toStr(r), timestamp: now };
    });
  }

  private short(e: any) {
    const raw = e?.stack || e?.message || String(e);
    return raw.split('\n')[0]?.trim() || raw;
  }

  // inside CodingJsPanelComponent
  public async setCode(code: string) {
    this.cancelPendingPersist();
    this.editorContent.set(code);
    const q = this.question;
    const storageKey = this.storageKeyFor(q);
    if (this.disablePersistence) {
      this.volatileBuffers[this.jsLang()] = code;
    } else if (q && storageKey) {
      await this.codeStore.saveJsAsync(storageKey, code, this.jsLang(), { allowEmpty: true });
    }
    this.codeChange.emit({ lang: this.jsLang(), code });
  }

  private startersForBoth(q: Question): { js: string; ts: string } {
    const anyQ = q as any;
    const js = (anyQ?.starterCode ?? '') as string;
    const ts = (anyQ?.starterCodeTs ?? anyQ?.starterCode ?? '') as string;
    return { js, ts };
  }

  public async applySolution(raw: string, options?: ApplySolutionOptions) {
    const runToken = ++this.applySolutionToken;
    this.topTab.set('code');
    this.captureSolutionDraftSnapshot();

    const q = this.question;
    if (this.decisionGraphEnabled && q) {
      const hasAssetOverride = !!options && Object.prototype.hasOwnProperty.call(options, 'decisionGraphAsset');
      const hasKeyOverride = !!options && Object.prototype.hasOwnProperty.call(options, 'decisionGraphKey');
      const graphAssetOverride = hasAssetOverride ? (options?.decisionGraphAsset ?? null) : undefined;
      const graphKeyOverride = hasKeyOverride ? (options?.decisionGraphKey ?? null) : undefined;
      await this.loadDecisionGraphForQuestion(
        q,
        graphAssetOverride,
        !hasAssetOverride,
        graphKeyOverride,
      );
      if (runToken !== this.applySolutionToken) return;
    }

    let code = raw ?? '';
    if (this.jsLang() === 'js') {
      // convert if it looks like TS (ensureJs already handles detection + fallbacks)
      code = await this.ensureJs(code, 'solution.ts');
      if (runToken !== this.applySolutionToken) return;
    }

    // Set the code and persist immediately
    await this.setCode(code);
    if (runToken !== this.applySolutionToken) return;

    // Mark the solution banner visible
    this.viewingSolution.set(true);
    this.restoredFromStorage.set(true);
    this.restoreDismissed.set(false);
    this.refreshDecisionGraphDecorations();

    queueMicrotask(() => {
      if (runToken !== this.applySolutionToken) return;
      const first = this.decisionGraphNodes()[0];
      if (!first) return;
      this.selectDecisionNode(first, false);
      this.refreshDecisionGraphDecorations();
    });

    if (this.isBrowser) {
      requestAnimationFrame(() => {
        if (runToken !== this.applySolutionToken) return;
        this.refreshDecisionGraphDecorations();
      });
    }
  }

  private refreshDecisionGraphDecorations(): void {
    this.syncDecisionGraphDecorations(
      this.decisionGraphVisible(),
      this.decisionGraphNodes(),
      this.activeDecisionNode(),
      this.codeEditorReady(),
    );
  }

  private storageKeyFor(q: Question | null): string | null {
    if (!q || this.disablePersistence) return null;
    const baseKey = (this.storageKeyOverride || '').trim() || q.id;
    const version = (this.activeDraftVersion() || computeJsQuestionContentVersion(q as any)).trim();
    return makeDraftKey(baseKey, version);
  }
}
