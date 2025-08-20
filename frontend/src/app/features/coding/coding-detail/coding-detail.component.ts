import { CommonModule } from '@angular/common';
import {
  AfterViewInit, Component, computed, effect, ElementRef, NgZone,
  OnDestroy, OnInit, signal, ViewChild, WritableSignal
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import type { Question, StructuredDescription } from '../../../core/models/question.model';
import { CodeStorageService } from '../../../core/services/code-storage.service';
import { QuestionService } from '../../../core/services/question.service';
import { StackBlitzEmbed } from '../../../core/services/stackblitz-embed.service';
import { UserCodeSandboxService } from '../../../core/services/user-code-sandbox.service';
import { matchesBaseline, normalizeSdkFiles } from '../../../core/utils/snapshot.utils';
import { getJsBaselineKey, getJsKey, getNgBaselineKey, getNgStorageKey } from '../../../core/utils/storage-keys';
import { transformTestCode, wrapExportDefault } from '../../../core/utils/test-transform';
import { MonacoEditorComponent } from '../../../monaco-editor.component';
import { ConsoleEntry, ConsoleLoggerComponent, TestResult } from '../console-logger/console-logger.component';

declare const monaco: any; // Monaco global (loaded in index.html)

type JsLang = 'js' | 'ts';

@Component({
  selector: 'app-coding-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, AccordionModule, ButtonModule, DialogModule,
    ProgressSpinnerModule, MonacoEditorComponent, ConsoleLoggerComponent,
  ],
  templateUrl: './coding-detail.component.html',
  styleUrls: ['./coding-detail.component.scss'],
})
export class CodingDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  tech!: string;
  question = signal<Question | null>(null);

  @ViewChild('sbHost', { read: ElementRef }) sbHost?: ElementRef<HTMLDivElement>;
  private sbVm: any | null = null;
  private embedCleanup?: () => void;

  embedUrl: WritableSignal<SafeResourceUrl | null> = signal(null);

  // JS/TS editor + tests
  editorContent = signal<string>('');
  testCode = signal<string>('');

  // JS/TS language toggle (persisted per question)
  jsLang = signal<JsLang>('js');

  // UI state
  topTab = signal<'code' | 'tests'>('code');
  activePanel = signal<number>(0);
  subTab = signal<'tests' | 'console'>('tests');
  editorRatio = signal(0.6);
  horizontalRatio = signal(0.3);

  // Collapsible left column
  private readonly COLLAPSED_PX = 48;
  descCollapsed = signal(false);
  private lastAsideRatio = 0.3;
  asideFlex = computed(
    () => this.descCollapsed()
      ? `0 0 ${this.COLLAPSED_PX}px`
      : `0 0 ${this.horizontalRatio() * 100}%`
  );

  copiedExamples = signal(false);
  isDraggingVertical = signal(false);
  isDraggingHorizontal = signal(false);

  // loading / reset
  embedLoading = signal(false);
  previewLoading = signal(false);
  resetting = signal(false);

  // banner
  showRestoreBanner = signal(false);

  private jsSaveTimer: any = null;

  allQuestions: Question[] = [];
  currentIndex = 0;

  // Results + console
  testResults = signal<TestResult[]>([]);
  consoleEntries = signal<ConsoleEntry[]>([]);
  hasRunTests = false;

  @ViewChild('splitContainer', { read: ElementRef }) splitContainer?: ElementRef<HTMLDivElement>;

  // drag state
  private dragging = false;
  private startY = 0;
  private startRatio = 0;
  private draggingHorizontal = false;
  private startX = 0;
  private startRatioH = 0;

  // Preview modal
  previewVisible = false;
  previewOnlyUrl: SafeResourceUrl | null = null;

  // computed
  passedCount = computed(() => this.testResults().filter(r => r.passed).length);
  totalCount = computed(() => this.testResults().length);
  failedCount = computed(() => this.testResults().filter(r => !r.passed).length);
  allPassing = computed(() => this.totalCount() > 0 && this.failedCount() === 0);
  isTestsTab = computed(() => this.subTab() === 'tests');
  isConsoleTab = computed(() => this.subTab() === 'console');
  isTopCodeTab = computed(() => this.topTab() === 'code');
  isTopTestsTab = computed(() => this.topTab() === 'tests');

  descriptionText = computed(() => {
    const q = this.question();
    if (!q) return '';
    if (typeof q.description === 'object' && q.description !== null) {
      return (q.description as StructuredDescription).text || '';
    }
    return q.description || '';
  });
  descriptionExamples = computed(() => {
    const q = this.question();
    if (!q) return [] as string[];
    if (typeof q.description === 'object' && q.description !== null) {
      return ((q.description as StructuredDescription).examples || []) as string[];
    }
    return (q as any).examples || [];
  });
  combinedExamples = computed(() => {
    const exs = this.descriptionExamples();
    if (!exs || exs.length === 0) return '';
    return exs.map((ex: any, i: any) => `// Example ${i + 1}\n${ex.trim()}`).join('\n\n// --------\n\n');
  });

  constructor(
    private route: ActivatedRoute,
    private qs: QuestionService,
    private sanitizer: DomSanitizer,
    private zone: NgZone,
    private codeStore: CodeStorageService,
    private runner: UserCodeSandboxService,
    private ngEmbed: StackBlitzEmbed
  ) { }

  // ---------- collapse prefs ----------
  private collapseKey(q: Question) { return `uf:coding:descCollapsed:${this.tech}:${q.id}`; }
  private loadCollapsePref(q: Question) {
    try { this.descCollapsed.set(!!JSON.parse(localStorage.getItem(this.collapseKey(q)) || 'false')); }
    catch { this.descCollapsed.set(false); }
  }
  private saveCollapsePref(q: Question, v: boolean) {
    try { localStorage.setItem(this.collapseKey(q), JSON.stringify(v)); } catch { }
  }
  toggleDescription() {
    const q = this.question(); if (!q) return;
    if (this.descCollapsed()) {
      this.descCollapsed.set(false);
      this.horizontalRatio.set(this.lastAsideRatio || 0.3);
      this.saveCollapsePref(q, false);
    } else {
      this.lastAsideRatio = this.horizontalRatio();
      this.descCollapsed.set(true);
      this.saveCollapsePref(q, true);
    }
  }

  // ---------- init ----------
  ngOnInit() {
    // route shape: /:tech/coding/:id
    this.route.parent!.paramMap.subscribe(() => { /* noop */ });
    this.route.paramMap.subscribe((pm) => {
      this.tech = this.route.parent!.snapshot.paramMap.get('tech')!;
      this.horizontalRatio.set(this.tech === 'javascript' ? 0.5 : 0.3);

      const id = pm.get('id')!;
      this.qs.loadQuestions(this.tech, 'coding').subscribe((list) => {
        this.allQuestions = list;
        this.loadQuestion(id);
      });
    });

    document.body.style.overflow = 'hidden';
  }

  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => {
      window.addEventListener('pointermove', this.onPointerMove);
      window.addEventListener('pointerup', this.onPointerUp);
    });

    // TS compiler defaults for Monaco (emit ES modules)
    try {
      monaco?.languages?.typescript?.typescriptDefaults?.setCompilerOptions?.({
        module: monaco.languages.typescript.ModuleKind.ESNext,
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        strict: false,
        noEmitOnError: false,
        allowJs: true,
        isolatedModules: true,
      });
    } catch { /* ignore */ }
  }

  ngOnDestroy() {
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    document.body.style.overflow = '';
    if (this.embedCleanup) this.embedCleanup();
  }

  // ---------- helpers to pick code by language ----------
  private getDefaultLang(q: Question): JsLang {
    const v = (q as any).languageDefault;
    return v === 'ts' ? 'ts' : 'js';
  }
  private getStarter(q: any, lang: JsLang) {
    return lang === 'ts' ? (q.starterCodeTs ?? q.starterCode ?? '') : (q.starterCode ?? q.starterCodeTs ?? '');
  }
  private getSolution(q: any, lang: JsLang) {
    return lang === 'ts' ? (q.solutionTs ?? q.solution ?? '') : (q.solution ?? q.solutionTs ?? '');
  }
  private getTests(q: any, lang: JsLang) {
    return lang === 'ts' ? (q.testsTs ?? q.tests ?? '') : (q.tests ?? q.testsTs ?? '');
  }
  private langPrefKey(q: Question) { return `uf:lang:${q.id}`; }

  // ---------- load question ----------
  private async loadQuestion(id: string) {
    const idx = this.allQuestions.findIndex((q) => q.id === id);
    if (idx < 0) return;

    this.currentIndex = idx;
    const q = this.allQuestions[idx];
    this.question.set(q);

    this.loadCollapsePref(q);

    let shouldShowBanner = false;

    if (this.tech !== 'angular') {
      // JS/TS track
      const jsKey = getJsKey(q.id);
      const baseKey = getJsBaselineKey(q.id);

      // language preference
      const savedPref = (localStorage.getItem(this.langPrefKey(q)) as JsLang | null);
      const defaultLang = this.getDefaultLang(q);
      // if we have a CodeStorageService save with language, respect that first
      const svcSaved = this.codeStore.getJs(q.id);
      const langFromSvc = svcSaved?.language as JsLang | undefined;
      const resolvedLang: JsLang = langFromSvc ?? savedPref ?? defaultLang;
      this.jsLang.set(resolvedLang);

      // set baselines (for legacy banner check)
      const starterForResolved = this.getStarter(q, resolvedLang);
      if (!localStorage.getItem(baseKey)) {
        try { localStorage.setItem(baseKey, JSON.stringify({ code: starterForResolved })); } catch { }
      }

      // restore saved user code if any
      const savedSvcCode = svcSaved?.code;
      const savedLegacyRaw = localStorage.getItem(jsKey);
      const savedLegacy = savedLegacyRaw ? (() => { try { return JSON.parse(savedLegacyRaw); } catch { return null; } })() : null;
      const restored = savedSvcCode ?? savedLegacy?.code ?? null;

      if (restored != null) {
        this.editorContent.set(restored);
        const base = JSON.parse(localStorage.getItem(baseKey) || '{"code":""}');
        if (restored !== base.code) shouldShowBanner = true;
      } else {
        this.editorContent.set(starterForResolved);
      }

      // tests default by lang
      this.testCode.set(this.getTests(q, resolvedLang));

      // cleanup any Angular VM
      if (this.embedCleanup) this.embedCleanup();
      this.sbVm = null;
      this.embedLoading.set(false);
    } else {
      // Angular track
      this.embedLoading.set(true);

      const host = this.sbHost?.nativeElement;
      if (!host) { requestAnimationFrame(() => this.loadQuestion(id)); return; }

      if (this.embedCleanup) { this.embedCleanup(); this.embedCleanup = undefined; }

      const meta = (q as any).sdk as { asset?: string; openFile?: string; storageKey?: string } | undefined;
      const storageKey = getNgStorageKey(q);
      const baselineKey = getNgBaselineKey(q);

      let files = this.loadSavedFiles(storageKey);
      let dependencies: Record<string, string> | undefined;
      let openFileFromAsset: string | undefined;

      if (!files && meta?.asset) {
        const asset = await this.ngEmbed.fetchAsset(meta.asset);
        if (asset) {
          files = asset.files;
          dependencies = asset.dependencies;
          openFileFromAsset = asset.openFile;
          try {
            localStorage.setItem(storageKey, JSON.stringify(files));
            if (!localStorage.getItem(baselineKey)) {
              localStorage.setItem(baselineKey, JSON.stringify(files));
            }
          } catch { /* ignore */ }
        }
      }

      if (files) {
        let baseline: Record<string, string> | null = null;
        const baseRaw = localStorage.getItem(baselineKey);
        if (baseRaw) baseline = normalizeSdkFiles(JSON.parse(baseRaw));
        if (!baseline && meta?.asset) {
          const asset = await this.ngEmbed.fetchAsset(meta.asset);
          baseline = asset?.files ?? null;
          try { if (asset?.files) localStorage.setItem(baselineKey, JSON.stringify(asset.files)); } catch { }
        }
        if (baseline && !matchesBaseline(files, baseline)) shouldShowBanner = true;
      }

      if (!files) files = {};

      host.innerHTML = '';
      const openFile = (meta?.openFile ?? openFileFromAsset ?? 'src/app/app.component.ts').replace(/^\/+/, '');

      const { vm, cleanup } = await this.ngEmbed.embedProject(host, {
        title: q.title || 'Angular question',
        files, dependencies, openFile, storageKey
      });
      this.sbVm = vm;
      this.embedCleanup = cleanup;
      this.embedLoading.set(false);
    }

    // reset UI + set banner
    this.activePanel.set(0);
    this.topTab.set('code');
    this.subTab.set('tests');
    this.hasRunTests = false;
    this.testResults.set([]);
    this.consoleEntries.set([]);
    this.showRestoreBanner.set(shouldShowBanner);
  }

  private loadSavedFiles(storageKey: string): Record<string, string> | null {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      return normalizeSdkFiles(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  // ---------- code saving ----------
  onJsCodeChange(code: string) {
    this.editorContent.set(code);
    const q = this.question();
    if (!q || this.tech === 'angular') return;

    clearTimeout(this.jsSaveTimer);
    this.jsSaveTimer = setTimeout(() => {
      // canonical save
      this.codeStore.saveJs(q.id, code, this.jsLang());
      // legacy key (kept for banner compare/reset paths)
      try { localStorage.setItem(getJsKey(q.id), JSON.stringify({ code })); } catch { }
    }, 300);
  }
  private persistJsEffect = effect(() => {
    const q = this.question();
    if (!q || this.tech === 'angular') return;
    try { localStorage.setItem(getJsKey(q.id), JSON.stringify({ code: this.editorContent() })); } catch { }
  });

  // ---------- language toggle ----------
  setLanguage(lang: JsLang) {
    const q = this.question(); if (!q) return;
    const prevLang = this.jsLang();
    if (lang === prevLang) return;

    // Persist preference
    try { localStorage.setItem(this.langPrefKey(q), lang); } catch { }
    this.jsLang.set(lang);

    // Swap boilerplate to matching variant *only if* current content looks like baseline of the previous lang
    const prevStarter = this.getStarter(q, prevLang);
    const nextStarter = this.getStarter(q, lang);
    const prevSolution = this.getSolution(q, prevLang);
    const nextSolution = this.getSolution(q, lang);

    const current = this.editorContent();
    if (current.trim() === prevStarter.trim()) {
      this.editorContent.set(nextStarter);
    } else if (prevSolution && current.trim() === prevSolution.trim()) {
      this.editorContent.set(nextSolution || nextStarter);
    }
    // Swap tests similarly if they match previous baseline
    const prevTests = this.getTests(q, prevLang);
    const nextTests = this.getTests(q, lang);
    if (this.testCode().trim() === prevTests.trim()) {
      this.testCode.set(nextTests);
    }

    // Update baseline key used by the restore banner (so it compares against correct lang)
    try { localStorage.setItem(getJsBaselineKey(q.id), JSON.stringify({ code: this.getStarter(q, lang) })); } catch { }

    // Save current content under service with new lang
    this.codeStore.saveJs(q.id, this.editorContent(), lang);
  }

  // ---------- banner actions ----------
  dismissRestoreBanner() { this.showRestoreBanner.set(false); }
  async resetFromBanner() { await this.resetQuestion(); this.showRestoreBanner.set(false); }

  // ---------- show solution (respect lang) ----------
  showSolution() {
    const q = this.question();
    if (!q) return;
    const lang = this.jsLang();
    const solution = this.getSolution(q, lang);
    const fallback = this.getSolution(q, lang === 'ts' ? 'js' : 'ts');
    const value = solution || fallback || '';
    this.editorContent.set(value);
    if (this.tech !== 'angular') {
      try { localStorage.setItem(getJsKey(q.id), JSON.stringify({ code: value })); } catch { }
      this.codeStore.saveJs(q.id, value, lang);
    }
    this.activePanel.set(1);
    this.topTab.set('code');
  }

  // ---------- navigation ----------
  prev() {
    if (this.currentIndex > 0) {
      const prevId = this.allQuestions[this.currentIndex - 1].id;
      location.pathname = `/${this.tech}/coding/${prevId}`;
    }
  }
  next() {
    if (this.currentIndex + 1 < this.allQuestions.length) {
      const nextId = this.allQuestions[this.currentIndex + 1].id;
      location.pathname = `/${this.tech}/coding/${nextId}`;
    }
  }

  // ---------- TS -> JS transpile with Monaco ----------
  private async transpileTsToJs(code: string, fileName: string): Promise<string> {
    if (!monaco?.languages?.typescript || typeof code !== 'string') return code;
    const uri = monaco.Uri.parse(`inmemory://model/${fileName}`);
    const model = monaco.editor.createModel(code, 'typescript', uri);
    try {
      const getWorker = await monaco.languages.typescript.getTypeScriptWorker();
      const svc = await getWorker(uri);
      const out = await svc.getEmitOutput(uri.toString());
      const js = out?.outputFiles?.[0]?.text ?? '';
      return js || '';
    } catch {
      return code; // fallback: runner will report syntax error
    } finally {
      model.dispose();
    }
  }

  // ---------- run tests (worker) ----------
  async runTests() {
    const q = this.question(); if (!q) return;
    if (this.tech === 'angular') return;

    // shift UI
    this.subTab.set('console');
    this.hasRunTests = false;
    this.testResults.set([]);
    this.consoleEntries.set([]);

    const lang = this.jsLang();
    const userSrc = this.editorContent();
    const testsSrc = this.testCode();

    // transpile if TS
    const userJs = lang === 'ts' ? await this.transpileTsToJs(userSrc, `${q.id}.ts`) : userSrc;
    const testsLangLooksTs = (lang === 'ts'); // we bound tests to lang when loading/toggling
    const testsJs = testsLangLooksTs ? await this.transpileTsToJs(testsSrc, `${q.id}.tests.ts`) : testsSrc;

    const wrapped = wrapExportDefault(userJs, q.id);
    const testsPrepared = transformTestCode(testsJs, q.id);

    const out = await this.runner.runWithTests({ userCode: wrapped, testCode: testsPrepared, timeoutMs: 1500 });

    this.consoleEntries.set(out.entries ?? []);
    this.testResults.set(out.results ?? []);
    this.hasRunTests = true;

    this.subTab.set('tests');
  }

  submitCode() { console.log('Submit:', this.editorContent()); }
  get progressText() { return `${this.currentIndex + 1} / ${this.allQuestions.length}`; }

  // ---------- splitters ----------
  startDrag = (ev: PointerEvent) => {
    ev.preventDefault();
    this.dragging = true;
    this.isDraggingHorizontal.set(true);
    this.startY = ev.clientY;
    this.startRatio = this.editorRatio();
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
    const stop = () => { this.dragging = false; this.isDraggingHorizontal.set(false); document.removeEventListener('pointerup', stop); };
    document.addEventListener('pointerup', stop);
  };
  private onPointerMove = (ev: PointerEvent) => {
    if (this.draggingHorizontal) { this.onPointerMoveHorizontal(ev); return; }
    if (!this.dragging || !this.splitContainer) return;
    const rect = this.splitContainer!.nativeElement.getBoundingClientRect();
    const delta = ev.clientY - this.startY;
    const newEditorPx = rect.height * this.startRatio + delta;
    let newRatio = newEditorPx / rect.height;
    newRatio = Math.max(0.2, Math.min(0.9, newRatio));
    this.zone.run(() => this.editorRatio.set(newRatio));
  };
  private onPointerUp = () => { if (this.dragging) this.dragging = false; if (this.draggingHorizontal) this.draggingHorizontal = false; };

  startHorizontalDrag = (ev: PointerEvent) => {
    ev.preventDefault();
    this.draggingHorizontal = true;
    this.startX = ev.clientX;
    this.startRatioH = this.horizontalRatio();
    this.copiedExamples.set(true);
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
    const stop = () => { this.draggingHorizontal = false; this.copiedExamples.set(false); document.removeEventListener('pointerup', stop); };
    document.addEventListener('pointerup', stop);
  };
  private onPointerMoveHorizontal = (ev: PointerEvent) => {
    if (!this.draggingHorizontal) return;
    const totalWidth = window.innerWidth;
    const delta = ev.clientX - this.startX;
    let newRatio = this.startRatioH + delta / totalWidth;
    newRatio = Math.max(0.2, Math.min(0.8, newRatio));
    this.zone.run(() => this.horizontalRatio.set(newRatio));
  };

  // ---------- preview helpers ----------
  private toPreviewOnly(base: string): string {
    const u = new URL(base);
    u.searchParams.set('embed', '1');
    u.searchParams.set('view', 'preview');
    u.searchParams.set('hideExplorer', '1');
    u.searchParams.set('hideNavigation', '1');
    u.searchParams.set('hideDevTools', '1');
    u.searchParams.set('terminalHeight', '0');
    u.searchParams.set('forceEmbedLayout', '1');
    u.searchParams.set('ctl', '0');
    u.searchParams.delete('file');
    return u.toString();
  }
  openPreview() {
    const q = this.question();
    if (!q || this.tech !== 'angular') return;
    const base = ((q as any).stackblitzSolutionUrl as string | undefined) ?? ((q as any).stackblitzEmbedUrl as string | undefined);
    if (!base) return;
    this.previewLoading.set(true);
    const url = this.toPreviewOnly(base);
    this.previewOnlyUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.previewVisible = true;
  }
  closePreview() {
    this.previewVisible = false;
    setTimeout(() => { this.previewOnlyUrl = null; this.previewLoading.set(false); }, 200);
  }

  // ---------- reset ----------
  async resetQuestion() {
    const q = this.question();
    if (!q || this.resetting()) return;

    this.resetting.set(true);
    try {
      if (this.tech !== 'angular') {
        localStorage.removeItem(getJsKey(q.id));
        // reset to current language baseline
        const lang = this.jsLang();
        this.editorContent.set(this.getStarter(q, lang));
        this.testCode.set(this.getTests(q, lang));
      } else {
        const storageKey = getNgStorageKey(q);
        localStorage.removeItem(storageKey);
        this.embedLoading.set(true);

        const meta = (q as any).sdk as { asset?: string; openFile?: string } | undefined;
        if (this.sbVm && meta?.asset) {
          try {
            const asset = await this.ngEmbed.fetchAsset(meta.asset);
            const openFile = (meta.openFile ?? asset?.openFile ?? 'src/app/app.component.ts').replace(/^\/+/, '');
            if (asset?.files) {
              await this.ngEmbed.replaceFromAsset(this.sbVm, asset.files, openFile, storageKey);
            }
          } finally {
            this.embedLoading.set(false);
          }
        } else {
          requestAnimationFrame(() => this.loadQuestion(q.id));
        }
      }

      this.hasRunTests = false;
      this.testResults.set([]);
      this.consoleEntries.set([]);
      this.subTab.set('tests');
      this.topTab.set('code');
      this.showRestoreBanner.set(false);
    } finally {
      this.resetting.set(false);
    }
  }

  // ---------- misc ----------
  copyExamples() {
    const examples = this.combinedExamples();
    if (!examples) return;
    navigator.clipboard
      .writeText(examples)
      .then(() => {
        this.copiedExamples.set(true);
        setTimeout(() => this.copiedExamples.set(false), 1200);
      })
      .catch((e) => {
        console.warn('Copy failed', e);
      });
  }
  goToCustomTests(e?: Event) { if (e) e.preventDefault(); this.topTab.set('tests'); this.subTab.set('tests'); }
}