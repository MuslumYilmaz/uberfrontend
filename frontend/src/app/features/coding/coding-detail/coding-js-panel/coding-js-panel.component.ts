import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, PLATFORM_ID, SimpleChanges, ViewChild, computed, inject, signal } from '@angular/core';
import type { Question } from '../../../../core/models/question.model';
import type { Tech } from '../../../../core/models/user.model';
import { CodeStorageService } from '../../../../core/services/code-storage.service';
import { UserCodeSandboxService } from '../../../../core/services/user-code-sandbox.service';
import { computeJsQuestionContentVersion } from '../../../../core/utils/content-version.util';
import {
  dismissUpdateBanner,
  isUpdateBannerDismissed,
  listOtherVersions,
  makeDraftKey,
  type DraftIndexEntry,
  upsertDraftIndexVersion,
} from '../../../../core/utils/versioned-drafts.util';
import { MonacoEditorComponent } from '../../../../monaco-editor.component';
import { DraftUpdateBannerComponent } from '../../../../shared/components/draft-update-banner/draft-update-banner';
import { RestoreBannerComponent } from '../../../../shared/components/restore-banner/restore-banner';
import { ConsoleEntry, ConsoleLoggerComponent, TestResult } from '../../console-logger/console-logger.component';

declare const monaco: any;

export type JsLang = 'js' | 'ts';

@Component({
  selector: 'app-coding-js-panel',
  standalone: true,
  imports: [CommonModule, MonacoEditorComponent, ConsoleLoggerComponent, RestoreBannerComponent, DraftUpdateBannerComponent],
  templateUrl: './coding-js-panel.component.html',
  styleUrls: ['./coding-js-panel.component.css']
})
export class CodingJsPanelComponent implements OnChanges, OnInit, OnDestroy {
  @ViewChild('codeEditor') codeEditor?: MonacoEditorComponent;
  @ViewChild('testsEditor') testsEditor?: MonacoEditorComponent;
  /* ---------- Inputs ---------- */
  @Input() question: Question | null = null;   // <- allow null until bound
  @Input() tech: Tech = 'javascript';         // for future-proofing
  @Input() kind: 'coding' | 'debug' = 'coding';
  @Input() storageKeyOverride: string | null = null;
  @Input() hideRestoreBanner = false;
  @Input() disablePersistence = false;
  @Input() liteMode = false;

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
  useMonaco = signal(true);
  codeEditorReady = signal(false);
  testsEditorReady = signal(false);

  ngOnInit() {
    if (!this.isBrowser) return;
    this.configureLiteEditors();
    window.addEventListener('beforeunload', this._persistLangOnUnload);
  }

  ngOnDestroy() {
    this.flushPendingPersist();
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
      void this.codeStore.saveJsAsync(p.key, p.code, p.lang);
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
      void this.codeStore.saveJsAsync(p.key, p.code, p.lang);
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

  // --- restore banner state ---
  restoredFromStorage = signal(false);
  restoreDismissed = signal(false);

  dismissRestoreBanner() { this.restoreDismissed.set(true); }

  async resetToDefault(): Promise<void> {
    const q = this.question;
    if (!q) return;
    this.cancelPendingPersist();
    if (this.disablePersistence) {
      const { js: starterJs, ts: starterTs } = this.startersForBoth(q);
      this.volatileBuffers = { js: starterJs, ts: starterTs };
      const lang = this.jsLang();
      const currentStarter = (lang === 'ts') ? starterTs : starterJs;
      this.editorContent.set(currentStarter);
      this.testCode.set(this.pickTests(q as any, lang));
      this.restoredFromStorage.set(false);
      this.restoreDismissed.set(true);
      this.viewingSolution.set(false);
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

  constructor(
    private runner: UserCodeSandboxService,
    public codeStore: CodeStorageService,
  ) { }

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
  }

  onTestsEditorReady() {
    this.testsEditorReady.set(true);
  }

  /* ---------- Lifecycle-ish setup API (call once from parent) ---------- */
  /* ---------- Lifecycle-ish setup API (call once from parent) ---------- */
  async initFromQuestion() {
    const q = this.question as Question; if (!q) return;
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

    // Nudge Monaco once the first frame is ready (prevents first-frame squiggles)
    queueMicrotask(() => window.dispatchEvent(new Event('resize')));   // NEW

    // End hydration on next tick
    requestAnimationFrame(() => requestAnimationFrame(() => { this._hydrating = false; }));
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
    await this.codeStore.saveJsAsync(activeKey, this.editorContent(), this.jsLang()).catch(() => { });

    this._hydrating = true;
    this.viewingSolution.set(false);
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
    this.editorContent.set(nextCode);
    this.testCode.set(this.pickTests(q as any, langToCopy));
    this.viewingSolution.set(false);
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
      await this.codeStore.saveJsAsync(storageKey, this.editorContent(), currentLang);
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

    const runId = ++this._runSeq;
    this.isRunningTests.set(true);
    this.hasRunTests.set(false);
    this.testResults.set([]);
    this.consoleEntries.set([]);
    this.consoleEntriesChange.emit([]);

    try {
      await this.flushEditorBuffer();
      const rawUser = this.codeEditor?.getValue?.() ?? this.editorContent();
      const rawTests = this.testsEditor?.getValue?.() ?? this.testCode();
      this.syncEditorBuffers(rawUser, rawTests);
      const userSrc = await this.ensureJs(rawUser, `${q.id}.ts`);
      if (runId !== this._runSeq) return;

      const testsSrc = await this.ensureJs(rawTests, `${q.id}.tests.ts`);
      if (runId !== this._runSeq) return;

      const wrapped = this.wrapExportDefault(userSrc);
      const prepared = this.transformTestCode(testsSrc);

      try {
        const out = await this.runner.runWithTests({ userCode: wrapped, testCode: prepared, timeoutMs: 1500 });
        if (runId !== this._runSeq) return;
        this.consoleEntries.set(this.sanitizeLogs(out?.entries));
        this.testResults.set(out?.results || []);
      } catch (e: any) {
        if (runId !== this._runSeq) return;
        this.testResults.set([{ name: 'Test runner error', passed: false, error: this.short(e) }]);
      }

      /* ---------- LOCAL FALLBACK if sandbox produced no cases ---------- */
	      if ((this.testResults() || []).length === 0 && prepared.trim()) {
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
          const expect = (received: any) => ({
            toBe: (exp: any) => { if (!Object.is(received, exp)) throw new Error(`Expected ${JSON.stringify(received)} to be ${JSON.stringify(exp)}`); },
            toEqual: (exp: any) => { if (!deepEqual(received, exp)) throw new Error(`Expected ${JSON.stringify(received)} to equal ${JSON.stringify(exp)}`); },
            toStrictEqual: (exp: any) => { if (!deepEqual(received, exp)) throw new Error(`Expected ${JSON.stringify(received)} to strictly equal ${JSON.stringify(exp)}`); },
          });

          const it = async (name: string, fn: () => any | Promise<any>) => {
            try { await fn(); results.push({ name, passed: true }); }
            catch (e: any) { results.push({ name, passed: false, error: String(e?.message ?? e) }); }
          };
          const test = it;
          const describe = (_: string, fn: () => void) => { try { fn(); } catch { } };

          const prevConsole = (globalThis as any).console;
          (globalThis as any).console = consoleProxy;
          try {
            new Function(wrapped)(); // define user default on global
            await new Function('describe', 'test', 'it', 'expect', 'console', prepared)(
              describe as any, test as any, it as any, expect as any, consoleProxy as any
            );
          } finally {
            (globalThis as any).console = prevConsole;
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
      this.subTab.set('tests');
    } finally {
      if (runId === this._runSeq) this.isRunningTests.set(false);
    }
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
    out = out.replace(/^\s*import\s+[^;]+from\s+['"](jest|vitest)['"];\s*$/mg, '');
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
      await this.codeStore.saveJsAsync(storageKey, code, this.jsLang());
    }
    this.codeChange.emit({ lang: this.jsLang(), code });
  }

  private startersForBoth(q: Question): { js: string; ts: string } {
    const anyQ = q as any;
    const js = (anyQ?.starterCode ?? '') as string;
    const ts = (anyQ?.starterCodeTs ?? anyQ?.starterCode ?? '') as string;
    return { js, ts };
  }

  public async applySolution(raw: string) {
    let code = raw ?? '';
    if (this.jsLang() === 'js') {
      // convert if it looks like TS (ensureJs already handles detection + fallbacks)
      code = await this.ensureJs(code, 'solution.ts');
    }

    // Set the code and persist immediately
    await this.setCode(code);

    // Mark the solution banner visible
    this.viewingSolution.set(true);
    this.restoredFromStorage.set(true);
    this.restoreDismissed.set(false);
  }

  private storageKeyFor(q: Question | null): string | null {
    if (!q || this.disablePersistence) return null;
    const baseKey = (this.storageKeyOverride || '').trim() || q.id;
    const version = (this.activeDraftVersion() || computeJsQuestionContentVersion(q as any)).trim();
    return makeDraftKey(baseKey, version);
  }
}
