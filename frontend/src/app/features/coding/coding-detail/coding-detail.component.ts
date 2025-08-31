import { CommonModule } from '@angular/common';
import {
  AfterViewInit, Component, computed, effect, ElementRef, NgZone,
  OnDestroy, OnInit, signal, ViewChild, WritableSignal
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { filter } from 'rxjs';
import type { Question, StructuredDescription } from '../../../core/models/question.model';
import { CodeStorageService } from '../../../core/services/code-storage.service';
import { QuestionService } from '../../../core/services/question.service';
import { StackBlitzEmbed } from '../../../core/services/stackblitz-embed.service';
import { UserCodeSandboxService } from '../../../core/services/user-code-sandbox.service';
import { matchesBaseline, normalizeSdkFiles } from '../../../core/utils/snapshot.utils';
import { getJsBaselineKey, getJsKey, getNgBaselineKey, getNgStorageKey } from '../../../core/utils/storage-keys';
import { transformTestCode, wrapExportDefault } from '../../../core/utils/test-transform';
import { MonacoEditorComponent } from '../../../monaco-editor.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { ConsoleEntry, ConsoleLoggerComponent, TestResult } from '../console-logger/console-logger.component';

import type { DailyItemKind } from '../../../core/models/user.model';
import { ActivityService } from '../../../core/services/activity.service';
import { DailyService } from '../../../core/services/daily.service';

declare const monaco: any;

type JsLang = 'js' | 'ts';
type CourseNavState =
  | {
    breadcrumb?: { to: any[]; label: string };
    prev?: { to: any[]; label: string } | null;
    next?: { to: any[]; label: string } | null;
  }
  | null;

/** NOW supports html/css too */
type Tech = 'javascript' | 'angular' | 'html' | 'css';
type Kind = 'coding' | 'debug';
type PracticeItem = { tech: Tech; kind: Kind | 'trivia'; id: string };
type PracticeSession = { items: PracticeItem[]; index: number } | null;

@Component({
  selector: 'app-coding-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, AccordionModule, ButtonModule, DialogModule,
    ProgressSpinnerModule, MonacoEditorComponent, ConsoleLoggerComponent, FooterComponent
  ],
  templateUrl: './coding-detail.component.html',
  styleUrls: ['./coding-detail.component.scss'],
})
export class CodingDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  tech!: Tech;
  kind: Kind = 'coding';
  question = signal<Question | null>(null);

  @ViewChild('sbHost', { read: ElementRef }) sbHost?: ElementRef<HTMLDivElement>;
  private sbVm: any | null = null;
  private embedCleanup?: () => void;

  embedUrl: WritableSignal<SafeResourceUrl | null> = signal(null);

  // JS/TS editor + tests
  editorContent = signal<string>('');
  testCode = signal<string>('');

  // WEB (HTML/CSS)
  private htmlCode = signal<string>('');
  private cssCode = signal<string>('');
  webHtml = () => this.htmlCode();
  webCss = () => this.cssCode();

  // JS/TS language toggle (persisted per question)
  jsLang = signal<JsLang>('js');

  // UI state
  /** unified tab signal used by both modes */
  topTab = signal<'code' | 'tests' | 'html' | 'css' | 'view'>('code');
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

  // Context flags
  isCourseContext = signal(false);

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
  private webSaveTimer: any = null;

  allQuestions: Question[] = [];
  currentIndex = 0;

  // Results + console
  testResults = signal<TestResult[]>([]);
  consoleEntries = signal<ConsoleEntry[]>([]);
  hasRunTests = false;

  // Course breadcrumb + lesson-to-lesson nav
  courseNav = signal<CourseNavState>(null);
  returnLabel = signal<string | null>(null);
  private returnTo: any[] | null = null;

  // Practice session
  private practice: PracticeSession = null;

  // Solution warning
  showSolutionWarning = signal(false);
  private readonly SOLUTION_WARN_SKIP_KEY = 'uf:coding:skipSolutionWarning';

  // Solved persistence
  solved = signal(false);

  @ViewChild('splitContainer', { read: ElementRef }) splitContainer?: ElementRef<HTMLDivElement>;

  // drag state
  private dragging = false;
  private startY = 0;
  private startRatio = 0;
  private draggingHorizontal = false;
  private startX = 0;
  private startRatioH = 0;
  private sessionStart = Date.now();
  private recorded = false;

  private readonly MAX_CONSOLE_LINES = 500;

  // Preview modal (Angular)
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

  // Footer helpers
  get progressText() {
    if (this.practice) return `${this.practice.index + 1} / ${this.practice.items.length}`;
    return `${this.currentIndex + 1} / ${this.allQuestions.length}`;
  }
  hasPrev(): boolean {
    return this.practice ? this.practice.index > 0 : this.currentIndex > 0;
  }
  hasNext(): boolean {
    return this.practice ? (this.practice.index + 1 < this.practice.items.length)
      : (this.currentIndex + 1 < this.allQuestions.length);
  }

  /** live preview HTML for html/css mode */
  // 1) Put <style> in BODY, add an inline fallback wrapper
  previewDocRaw = computed(() => {
    const css = this.cssCode() ?? '';
    const html = this.htmlCode() ?? '';
    return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root { color-scheme: light dark }
  html,body{height:100%}
  body{
    margin:16px;
    font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans","Apple Color Emoji","Segoe UI Emoji";
    background: Canvas; color: CanvasText;
  }
  ${css}
</style>
</head><body>${html}</body></html>`;
  });

  previewDocSafe = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.previewDocRaw())
  );


  // --- course footer/drawer state ---
  courseIdFromState: string | null = null;
  courseOutline: Array<{ id: string; title: string; lessons: any[] }> | null = null;
  leftDrawerLabel: string | null = null;
  currentCourseLessonId: string | null = null;

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

  editorMonacoOptions = {
    fontSize: 12,
    lineHeight: 18,
    minimap: { enabled: false },
    tabSize: 2,
  };
  examplesMonacoOptions = {
    readOnly: true,
    fontSize: 12,
    lineHeight: 18,
    minimap: { enabled: false },
    lineNumbers: 'on' as const,
    folding: false,
    renderLineHighlight: 'none' as const,
    scrollBeyondLastLine: false,
    overviewRulerLanes: 0,
    scrollbar: {
      vertical: 'hidden' as const,
      horizontal: 'hidden' as const,
      useShadows: false,
      verticalScrollbarSize: 0,
      horizontalScrollbarSize: 0,
      alwaysConsumeMouseWheel: false,
    },
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private qs: QuestionService,
    private sanitizer: DomSanitizer,
    private zone: NgZone,
    private codeStore: CodeStorageService,
    private runner: UserCodeSandboxService,
    private ngEmbed: StackBlitzEmbed,
    private daily: DailyService,
    private activity: ActivityService
  ) { }

  // ---------- helpers ----------
  private static sortForPractice(a: Question, b: Question): number {
    const ia = Number((a as any).importance ?? 0);
    const ib = Number((b as any).importance ?? 0);
    if (ia !== ib) return ib - ia;
    return (a.title || '').localeCompare(b.title || '');
  }

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

  private hydrateReturnInfo() {
    const s = (this.router.getCurrentNavigation()?.extras?.state ?? history.state) as any;

    this.courseNav.set(s?.courseNav ?? null);
    this.practice = (s?.session ?? null) as PracticeSession;

    if (s?.courseNav?.breadcrumb) {
      this.returnTo = s.courseNav.breadcrumb.to;
      this.returnLabel.set(s.courseNav.breadcrumb.label ?? 'Back to course');
    } else if (s?.returnTo) {
      this.returnTo = s.returnTo as any[];
      this.returnLabel.set(s.returnLabel ?? 'Back');
    } else {
      this.returnTo = null;
      this.returnLabel.set(null);
    }

    // drawer data (course)
    this.courseIdFromState = s?.courseId ?? null;
    this.courseOutline = s?.outline ?? null;
    this.leftDrawerLabel = s?.leftCourseLabel ?? null;
    this.currentCourseLessonId = s?.currentLessonId ?? null;
  }

  onSelectFromFooter(ev: { topicId: string; lessonId: string }) {
    if (!this.courseIdFromState) return;
    this.router.navigate(['/courses', this.courseIdFromState, ev.topicId, ev.lessonId]);
  }

  // ---------- init ----------
  ngOnInit() {
    const recompute = () => {
      this.hydrateReturnInfo();
      this.isCourseContext.set(this.computeIsCourseContext());
    };
    recompute();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(recompute);

    // determine :tech and :kind up the tree
    this.route.paramMap.subscribe((pm) => {
      // climb to detect tech
      let p: ActivatedRoute | null = this.route;
      let tech: string | null = null;
      while (p && !tech) {
        tech = p.snapshot.paramMap.get('tech');
        p = p.parent!;
      }
      this.tech = ((tech || 'javascript') as Tech);

      // detect kind from this route's path (coding/:id or debug/:id)
      const path = this.route.routeConfig?.path || '';
      this.kind = path.startsWith('debug') ? 'debug' : 'coding';

      // NEW: make sure a Daily set exists for the current tech (works even if service ignores html/css)
      this.daily.ensureTodaySet(this.tech as any);

      // initial layout
      this.horizontalRatio.set(this.isWebTech() || this.tech === 'javascript' ? 0.5 : 0.3);

      const id = pm.get('id')!;
      this.qs.loadQuestions(this.tech, this.kind).subscribe((list) => {
        this.allQuestions = [...list].sort(CodingDetailComponent.sortForPractice);
        this.loadQuestion(id);
      });
    });

    document.body.style.overflow = 'hidden';
  }

  /** Practice vs Course detection – do NOT treat plain returnTo (company) as course. */
  private computeIsCourseContext(): boolean {
    if (this.courseNav()) return true;
    const url = this.router.url.split('?')[0];
    if (url.includes('/courses/')) return true;

    const inTree = this.route.pathFromRoot.some(r =>
      r.snapshot.url.some(s => s.path === 'courses') ||
      (r.snapshot.routeConfig?.path ?? '').includes('courses') ||
      !!r.snapshot.paramMap.get('course') ||
      !!r.snapshot.paramMap.get('courseSlug')
    );
    return inTree;
  }

  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => {
      window.addEventListener('pointermove', this.onPointerMove);
      window.addEventListener('pointerup', this.onPointerUp);
    });

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

  /** ----- WEB (html/css) helpers ----- */
  private getWebStarters(q: any): { html: string; css: string } {
    const w = q.web ?? {};
    let html =
      w.starterHtml ?? q.starterHtml ?? q.htmlStarter ?? w.html ?? q.html ?? '';
    let css =
      w.starterCss ?? q.starterCss ?? q.cssStarter ?? w.css ?? q.css ?? '';

    // Fallback skeletons so editors are never empty
    if (!html || !html.trim()) {
      html = `<!-- Start here: ${q.title ?? 'Challenge'} -->
<div class="container">
  <h1>${q.title ?? 'Challenge'}</h1>
  <p>Edit the HTML and CSS tabs, then check the View tab.</p>
</div>`;
    }
    if (!css || !css.trim()) {
      css = `.container{max-width:640px;margin:2rem auto;padding:1rem;border:1px dashed #555;border-radius:8px}`;
    }
    return { html, css };
  }

  private getWebSolutions(q: any): { html: string; css: string } {
    const w = q.web ?? {};
    const html = w.solutionHtml ?? q.solutionHtml ?? q.htmlSolution ?? w.htmlSolution ?? '';
    const css = w.solutionCss ?? q.solutionCss ?? q.cssSolution ?? w.cssSolution ?? '';
    return { html: String(html ?? ''), css: String(css ?? '') };
  }
  private webKey(q: Question, which: 'html' | 'css') { return `uf:web:${which}:${q.id}`; }
  private webBaseKey(q: Question, which: 'html' | 'css') { return `uf:web:baseline:${which}:${q.id}`; }

  // ---------- solved persistence ----------
  private solvedKey(q: Question) { return `uf:coding:solved:${this.tech}:${q.id}`; }
  private loadSolvedFlag(q: Question) {
    try { return localStorage.getItem(this.solvedKey(q)) === 'true'; } catch { return false; }
  }
  private saveSolvedFlag(q: Question, v: boolean) {
    try { localStorage.setItem(this.solvedKey(q), String(!!v)); } catch { }
  }
  private clearSolvedFlag(q: Question) {
    try { localStorage.removeItem(this.solvedKey(q)); } catch { }
  }

  // ---------- load question ----------
  private async loadQuestion(id: string) {
    const idx = this.allQuestions.findIndex((q) => q.id === id);
    if (idx >= 0) this.currentIndex = idx;

    const q = idx >= 0 ? this.allQuestions[idx] : null;
    if (!q) { this.question.set(null); return; }
    this.question.set(q);

    // restore "solved"
    this.solved.set(this.loadSolvedFlag(q));
    this.loadCollapsePref(q);

    let shouldShowBanner = false;

    if (this.tech === 'angular') {
      // ---------- ANGULAR via StackBlitz ----------
      this.topTab.set('code');
      this.embedLoading.set(true);

      const host = this.sbHost?.nativeElement;
      if (!host) { requestAnimationFrame(() => this.loadQuestion(id)); return; }

      if (this.embedCleanup) { this.embedCleanup(); this.embedCleanup = undefined; }

      const meta = (q as any).sdk as { asset?: string; openFile?: string; storageKey?: string } | undefined;
      const storageKey = getNgStorageKey(q);
      const baselineKey = getNgBaselineKey(q);

      let files = this.loadSavedFiles(storageKey);
      const isEmpty = !files || Object.keys(files).length === 0;

      let dependencies: Record<string, string> | undefined;
      let openFileFromAsset: string | undefined;

      if (isEmpty && meta?.asset) {
        const asset = await this.ngEmbed.fetchAsset(meta.asset);
        if (asset) {
          files = asset.files ?? {};
          dependencies = asset.dependencies;
          openFileFromAsset = asset.openFile;

          if (Object.keys(files).length > 0) {
            try {
              localStorage.setItem(storageKey, JSON.stringify(files));
              if (!localStorage.getItem(baselineKey)) {
                localStorage.setItem(baselineKey, JSON.stringify(files));
              }
            } catch { }
          }
        }
      }

      if (files && Object.keys(files).length > 0) {
        let baseline: Record<string, string> | null = null;

        const baseRaw = localStorage.getItem(baselineKey);
        if (baseRaw) baseline = normalizeSdkFiles(JSON.parse(baseRaw));

        if (!baseline && meta?.asset) {
          const asset = await this.ngEmbed.fetchAsset(meta.asset);
          baseline = asset?.files ?? null;
          try { if (asset?.files) localStorage.setItem(baselineKey, JSON.stringify(asset.files)); } catch { }
        }

        if (baseline && !matchesBaseline(files, baseline)) shouldShowBanner = true;
      } else {
        files = {};
      }

      const openFile = (meta?.openFile ?? openFileFromAsset ?? 'src/app/app.component.ts').replace(/^\/+/, '');
      const { vm, cleanup } = await this.ngEmbed.embedProject(host, {
        title: q.title || 'Angular question',
        files, dependencies, openFile, storageKey
      });
      this.sbVm = vm;
      this.embedCleanup = cleanup;
      this.embedLoading.set(false);

      // reset UI + set banner
      this.activePanel.set(0);
      this.subTab.set('tests');
      this.hasRunTests = false;
      this.testResults.set([]);
      this.consoleEntries.set([]);
      this.showRestoreBanner.set(shouldShowBanner);
      this.sessionStart = Date.now();
      this.recorded = false;
      return;
    }

    if (this.isWebTech()) {
      // --- HTML / CSS mode ---
      const starters = this.getWebStarters(q);
      const htmlBaseKey = this.webBaseKey(q, 'html');
      const cssBaseKey = this.webBaseKey(q, 'css');

      // set baselines if missing
      if (!localStorage.getItem(htmlBaseKey)) try { localStorage.setItem(htmlBaseKey, starters.html); } catch { }
      if (!localStorage.getItem(cssBaseKey)) try { localStorage.setItem(cssBaseKey, starters.css); } catch { }

      // normalize old/empty saves like {"code":""}
      const normalizeSaved = (raw: string | null) => {
        if (raw == null) return null;
        const s = raw.trim();
        if (!s) return null;                     // treat empty string as "no save"
        if (s.startsWith('{')) {
          try {
            const obj = JSON.parse(s);
            if (obj && typeof obj.code === 'string') return obj.code;
          } catch { }
        }
        return s;
      };

      const savedHtml = normalizeSaved(localStorage.getItem(this.webKey(q, 'html')));
      const savedCss = normalizeSaved(localStorage.getItem(this.webKey(q, 'css')));

      // prefer non-empty saves; otherwise use starters
      const html = savedHtml ?? starters.html;
      const css = savedCss ?? starters.css;

      this.htmlCode.set(html);
      this.cssCode.set(css);

      // banner if diverged
      try {
        const baseHtml = localStorage.getItem(htmlBaseKey) ?? '';
        const baseCss = localStorage.getItem(cssBaseKey) ?? '';
        if ((savedHtml && savedHtml !== baseHtml) || (savedCss && savedCss !== baseCss)) {
          shouldShowBanner = true;
        }
      } catch { }

      this.topTab.set('html');
      this.activePanel.set(0);
      this.subTab.set('tests');
      this.hasRunTests = false;
      this.testResults.set([]);
      this.consoleEntries.set([]);
      this.showRestoreBanner.set(shouldShowBanner);
      this.sessionStart = Date.now();
      this.recorded = false;
      return;

    }

    // ---------- JS / TS mode ----------
    const jsKey = getJsKey(q.id);
    const baseKey = getJsBaselineKey(q.id);

    const savedPref = (localStorage.getItem(this.langPrefKey(q)) as JsLang | null);
    const defaultLang = this.getDefaultLang(q);
    const svcSaved = this.codeStore.getJs(q.id);
    const langFromSvc = svcSaved?.language as JsLang | undefined;
    const resolvedLang: JsLang = langFromSvc ?? savedPref ?? defaultLang;
    this.jsLang.set(resolvedLang);

    const starterForResolved = this.getStarter(q, resolvedLang);
    if (!localStorage.getItem(baseKey)) {
      try { localStorage.setItem(baseKey, JSON.stringify({ code: starterForResolved })); } catch { }
    }

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

    this.testCode.set(this.getTests(q, resolvedLang));

    if (this.embedCleanup) this.embedCleanup();
    this.sbVm = null;
    this.embedLoading.set(false);

    // reset UI + set banner
    this.activePanel.set(0);
    this.topTab.set('code');
    this.subTab.set('tests');
    this.hasRunTests = false;
    this.testResults.set([]);
    this.consoleEntries.set([]);
    this.showRestoreBanner.set(shouldShowBanner);
    this.sessionStart = Date.now();
    this.recorded = false;
  }

  private loadSavedFiles(storageKey: string): Record<string, string> | null {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = normalizeSdkFiles(JSON.parse(raw));
      return Object.keys(parsed || {}).length > 0 ? parsed : null;
    } catch {
      return null;
    }
  }

  // ---------- code saving ----------
  onJsCodeChange(code: string) {
    this.editorContent.set(code);
    const q = this.question();
    if (!q || this.tech === 'angular' || this.isWebTech()) return;

    clearTimeout(this.jsSaveTimer);
    this.jsSaveTimer = setTimeout(() => {
      this.codeStore.saveJs(q.id, code, this.jsLang());
      try { localStorage.setItem(getJsKey(q.id), JSON.stringify({ code })); } catch { }
    }, 300);
  }

  onHtmlChange = (code: string) => {
    const q = this.question(); if (!q || !this.isWebTech()) return;
    this.htmlCode.set(code);
    clearTimeout(this.webSaveTimer);
    this.webSaveTimer = setTimeout(() => {
      try { localStorage.setItem(this.webKey(q, 'html'), code); } catch { }
    }, 200);
  };
  onCssChange = (code: string) => {
    const q = this.question(); if (!q || !this.isWebTech()) return;
    this.cssCode.set(code);
    clearTimeout(this.webSaveTimer);
    this.webSaveTimer = setTimeout(() => {
      try { localStorage.setItem(this.webKey(q, 'css'), code); } catch { }
    }, 200);
  };

  private persistJsEffect = effect(() => {
    const q = this.question();
    if (!q || this.tech === 'angular' || this.isWebTech()) return; // <— add isWebTech()
    try {
      localStorage.setItem(getJsKey(q.id), JSON.stringify({ code: this.editorContent() }));
    } catch { }
  });


  // ---------- language toggle ----------
  setLanguage(lang: JsLang) {
    const q = this.question(); if (!q || this.isWebTech() || this.tech === 'angular') return;
    const prevLang = this.jsLang();
    if (lang === prevLang) return;

    try { localStorage.setItem(this.langPrefKey(q), lang); } catch { }
    this.jsLang.set(lang);

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

    const prevTests = this.getTests(q, prevLang);
    const nextTests = this.getTests(q, lang);
    if (this.testCode().trim() === prevTests.trim()) {
      this.testCode.set(nextTests);
    }

    try { localStorage.setItem(getJsBaselineKey(q.id), JSON.stringify({ code: this.getStarter(q, lang) })); } catch { }
    this.codeStore.saveJs(q.id, this.editorContent(), lang);
  }

  // ---------- banner actions ----------
  dismissRestoreBanner() { this.showRestoreBanner.set(false); }
  async resetFromBanner() { await this.resetQuestion(); this.showRestoreBanner.set(false); }

  private shouldWarnForSolution(): boolean {
    return this.isCourseContext() && localStorage.getItem(this.SOLUTION_WARN_SKIP_KEY) !== 'true';
  }
  skipSolutionWarningForever() {
    try { localStorage.setItem(this.SOLUTION_WARN_SKIP_KEY, 'true'); } catch { }
    this.showSolutionWarning.set(false);
  }

  showSolution() {
    const q = this.question();
    if (!q) return;

    if (this.shouldWarnForSolution()) {
      this.showSolutionWarning.set(true);
      return;
    }
    this.loadSolutionCode();
  }

  // ---------- navigation helpers ----------
  private navToPracticeIndex(newIndex: number) {
    if (!this.practice) return;
    const it = this.practice.items[newIndex];
    this.router.navigate(['/', it.tech, it.kind, it.id], {
      state: {
        session: { items: this.practice.items, index: newIndex },
        returnTo: this.returnTo ?? undefined,
        returnLabel: this.returnLabel() ?? undefined
      }
    });
  }

  // ---------- navigation (practice) ----------
  prev() {
    if (this.practice) {
      if (this.practice.index > 0) this.navToPracticeIndex(this.practice.index - 1);
      return;
    }
    if (this.currentIndex > 0) {
      const prevId = this.allQuestions[this.currentIndex - 1].id;
      this.router.navigate(['/', this.tech, this.kind, prevId]);
    }
  }
  next() {
    if (this.practice) {
      if (this.practice.index + 1 < this.practice.items.length) this.navToPracticeIndex(this.practice.index + 1);
      return;
    }
    if (this.currentIndex + 1 < this.allQuestions.length) {
      const nextId = this.allQuestions[this.currentIndex + 1].id;
      this.router.navigate(['/', this.tech, this.kind, nextId]);
    }
  }

  // ---------- course navigations ----------
  goCoursePrev() {
    const c = this.courseNav();
    if (c?.prev) this.router.navigate(c.prev.to);
    else this.backToReturn();
  }
  goCourseNext() {
    const c = this.courseNav();
    if (c?.next) this.router.navigate(c.next.to);
  }

  backToReturn() {
    if (this.courseNav()?.breadcrumb?.to) {
      this.router.navigate(this.courseNav()!.breadcrumb!.to);
    } else if (this.returnTo) {
      this.router.navigate(this.returnTo);
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/courses']);
    }
  }

  // ---------- TS -> JS transpile ----------
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
      return code;
    } finally {
      model.dispose();
    }
  }

  // ---------- run tests ----------
  async runTests(): Promise<void> {
    const q = this.question();
    if (!q || this.tech === 'angular' || this.isWebTech()) return;

    this.subTab.set('console');
    this.hasRunTests = false;
    this.testResults.set([]);
    this.consoleEntries.set([]);

    const lang = this.jsLang();
    const userSrc = this.editorContent();
    const testsSrc = this.testCode();

    const userJs = lang === 'ts' ? await this.transpileTsToJs(userSrc, `${q.id}.ts`) : userSrc;
    const testsJs = lang === 'ts' ? await this.transpileTsToJs(testsSrc, `${q.id}.tests.ts`) : testsSrc;

    // Wrap user's default export and transform tests to reference __user_fn__
    const wrapped = wrapExportDefault(userJs, q.id);
    const testsPrepared = transformTestCode(testsJs, q.id);

    const out = await this.runner.runWithTests({
      userCode: wrapped,
      testCode: testsPrepared,
      timeoutMs: 1500
    });

    this.consoleEntries.set(this.sanitizeLogs(out.entries as ConsoleEntry[]));
    this.testResults.set(out.results ?? []);
    this.hasRunTests = true;

    const passing = this.allPassing();
    this.solved.set(passing);
    this.saveSolvedFlag(q, passing);

    if (passing) {
      this.creditDaily();
      // record with solved=true so server persists progress
      this.activity.complete({
        kind: this.kind,
        tech: this.tech,
        itemId: q.id,
        source: 'tech',
        durationMin: Math.max(1, Math.round((Date.now() - this.sessionStart) / 60000)),
        xp: this.xpFor(q),
        solved: true
      }).subscribe({
        next: (res: any) => {
          this.recorded = true;
          this.activity.activityCompleted$.next({
            kind: this.kind, tech: this.tech, stats: res?.stats
          });
          this.activity.refreshSummary();
        },
        error: (e) => console.error('record completion failed', e),
      });

      await this.celebrate('tests');
    }

    this.subTab.set('tests');
  }

  // ---------- Daily credit helpers ----------
  private creditDailyIfInSet() {
    const q = this.question(); if (!q) return;
    const kind = this.kind as DailyItemKind; // 'coding' | 'debug'
    if (!this.daily.isInTodaySet(kind, q.id)) return;
    this.daily.markCompletedById(kind, q.id);
  }

  // ---------- submit ----------
  async submitCode(): Promise<void> {
    const q = this.question();
    if (!q) return;

    // Angular and Web (html/css) are marked complete on submit
    if (this.tech === 'angular' || this.isWebTech()) {
      this.creditDaily();
      this.recordCompletion('submit');
      await this.celebrate('submit');
      return;
    }

    // JS/TS: always run tests
    await this.runTests();

    // For debug, allow credit even if not all tests passed (avoid double-credit if runTests already did it)
    if (this.kind === 'debug' && !this.allPassing()) {
      this.creditDaily();
      this.activity.complete({
        kind: this.kind,
        tech: this.tech,
        itemId: q.id,
        source: 'tech',
        durationMin: Math.max(1, Math.round((Date.now() - this.sessionStart) / 60000)),
        xp: this.xpFor(q),
        solved: false
      }).subscribe({
        next: (res: any) => {
          this.recorded = true;
          this.activity.activityCompleted$.next({
            kind: this.kind, tech: this.tech, stats: res?.stats
          });
          this.activity.refreshSummary();
        },
        error: (e) => console.error('record completion failed', e),
      });

      await this.celebrate('submit');
    }
  }

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
    const totalWidth = window.innerWidth;
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
      if (this.tech === 'angular') {
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
      } else if (this.isWebTech()) {
        const starters = this.getWebStarters(q);
        localStorage.removeItem(this.webKey(q, 'html'));
        localStorage.removeItem(this.webKey(q, 'css'));
        this.htmlCode.set(starters.html);
        this.cssCode.set(starters.css);
      } else {
        localStorage.removeItem(getJsKey(q.id));
        const lang = this.jsLang();
        this.editorContent.set(this.getStarter(q, lang));
        this.testCode.set(this.getTests(q, lang));
      }

      this.solved.set(false);
      this.clearSolvedFlag(q);

      this.hasRunTests = false;
      this.testResults.set([]);
      this.consoleEntries.set([]);
      this.subTab.set('tests');
      this.topTab.set(this.isWebTech() ? 'html' : 'code');
      this.showRestoreBanner.set(false);
    } finally {
      this.resetting.set(false);
    }
  }

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

  loadSolutionCode() {
    const q = this.question();
    if (!q) return;

    if (this.isWebTech()) {
      const sol = this.getWebSolutions(q);
      const html = sol.html || this.getWebStarters(q).html;
      const css = sol.css || this.getWebStarters(q).css;
      this.htmlCode.set(html);
      this.cssCode.set(css);
      try { localStorage.setItem(this.webKey(q, 'html'), html); } catch { }
      try { localStorage.setItem(this.webKey(q, 'css'), css); } catch { }
      this.activePanel.set(1);
      this.topTab.set('html');
      return;
    }

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

  onSolutionTabClick() {
    if (this.descCollapsed()) this.toggleDescription();
    this.activePanel.set(1);
    this.showSolutionWarning.set(true);
  }
  confirmSolutionReveal() {
    this.loadSolutionCode();
    this.showSolutionWarning.set(false);
  }
  cancelSolutionReveal() {
    this.showSolutionWarning.set(false);
    this.activePanel.set(0);
  }

  private creditDaily(): void {
    const q = this.question();
    if (!q) return;
    this.daily.markCompletedById(this.kind as any, q.id);
  }

  private async fireConfetti(): Promise<void> {
    const mod: any = await import('canvas-confetti');
    const confetti = (mod.default || mod) as (opts: any) => void;

    const count = 140;
    const defaults = { spread: 70, ticks: 90, gravity: 0.9, scalar: 1 };

    const fire = (ratio: number, opts: any = {}) =>
      confetti({ particleCount: Math.floor(count * ratio), ...defaults, ...opts });

    fire(0.30, { startVelocity: 45, origin: { x: 0.15, y: 0.2 } });
    fire(0.30, { startVelocity: 45, origin: { x: 0.85, y: 0.2 } });
    fire(0.20, { spread: 100, decay: 0.92, scalar: 0.9, origin: { y: 0.35 } });
    fire(0.20, { spread: 120, startVelocity: 55, origin: { y: 0.35 } });
  }

  private async celebrate(_reason: 'tests' | 'submit'): Promise<void> {
    try { await this.fireConfetti(); } catch { }
  }

  private xpFor(q: Question): number {
    return Number((q as any).xp ?? 20);
  }
  private recordCompletion(_reason: 'tests' | 'submit') {
    const q = this.question();
    if (!q) return;
    if (this.recorded) return;

    const minutes = Math.max(1, Math.round((Date.now() - this.sessionStart) / 60000));
    this.activity.complete({
      kind: this.kind,
      tech: this.tech,
      itemId: q.id,
      source: 'tech',
      durationMin: minutes,
      xp: this.xpFor(q),
    }).subscribe({
      next: (res: any) => {
        this.recorded = true;
        this.activity.activityCompleted$.next({
          kind: this.kind,
          tech: this.tech,
          stats: res?.stats
        });
        this.activity.refreshSummary();
      },
      error: (e) => console.error('record completion failed', e),
    });
  }

  private sanitizeLogs(list: ConsoleEntry[] | undefined): ConsoleEntry[] {
    if (!Array.isArray(list) || list.length === 0) return [];
    return list.slice(-this.MAX_CONSOLE_LINES);
  }

  /** util */
  isWebTech(): boolean { return this.tech === 'html' || this.tech === 'css'; }
}
