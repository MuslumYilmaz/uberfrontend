// coding-detail.component.ts
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {
  AfterViewInit, Component, computed, effect, ElementRef, NgZone,
  OnDestroy, OnInit, signal, ViewChild
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { filter, firstValueFrom } from 'rxjs';

import type { Question, StructuredDescription } from '../../../core/models/question.model';
import { CodeStorageService } from '../../../core/services/code-storage.service';
import { QuestionService } from '../../../core/services/question.service';
import { UserCodeSandboxService } from '../../../core/services/user-code-sandbox.service';
import { matchesBaseline, normalizeSdkFiles } from '../../../core/utils/snapshot.utils';
import {
  getJsBaselineKey, getJsKey, getNgBaselineKey, getNgStorageKey,
  getReactBaselineKey, getReactStorageKey
} from '../../../core/utils/storage-keys';
import { MonacoEditorComponent } from '../../../monaco-editor.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { ConsoleEntry, ConsoleLoggerComponent, TestResult } from '../console-logger/console-logger.component';

import type { DailyItemKind, Tech } from '../../../core/models/user.model';
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

type Kind = 'coding' | 'debug';
type PracticeItem = { tech: Tech; kind: Kind | 'trivia'; id: string };
type PracticeSession = { items: PracticeItem[]; index: number } | null;

type SdkAsset = {
  files: Record<string, string>;
  dependencies?: Record<string, string>;
  openFile?: string;
};

@Component({
  selector: 'app-coding-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, HttpClientModule, ButtonModule, DialogModule,
    MonacoEditorComponent, ConsoleLoggerComponent, FooterComponent
  ],
  templateUrl: './coding-detail.component.html',
  styleUrls: ['./coding-detail.component.css'],
})
export class CodingDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  tech!: Tech;
  kind: Kind = 'coding';
  question = signal<Question | null>(null);

  // JS/TS editor + tests
  editorContent = signal<string>('');
  testCode = signal<string>('');
  frameworkEntryFile = '';

  // WEB (HTML/CSS)
  private htmlCode = signal<string>('');
  private cssCode = signal<string>('');
  webHtml = () => this.htmlCode();
  webCss = () => this.cssCode();

  // JS/TS language toggle (persisted per question)
  jsLang = signal<JsLang>('js');

  // UI state
  topTab = signal<'code' | 'tests' | 'html' | 'css'>('code');
  activePanel = signal<number>(0);
  subTab = signal<'code' | 'tests' | 'console'>('tests');
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

  // Context flags + course bits
  isCourseContext = signal(false);
  copiedExamples = signal(false);
  isDraggingVertical = signal(false);
  isDraggingHorizontal = signal(false);

  courseIdFromState: string | null = null;
  courseOutline: Array<{ id: string; title: string; lessons: any[] }> | null = null;
  leftDrawerLabel: string | null = null;
  currentCourseLessonId: string | null = null;

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

  // loading / reset / banner
  resetting = signal(false);
  showEditor = signal(true);
  showRestoreBanner = signal(false);

  private jsSaveTimer: any = null;
  private webSaveTimer: any = null;

  allQuestions: Question[] = [];
  currentIndex = 0;

  // Results + console
  testResults = signal<TestResult[]>([]);
  consoleEntries = signal<ConsoleEntry[]>([]);
  hasRunTests = false;

  // Course breadcrumb + nav
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
  @ViewChild('previewFrame', { read: ElementRef }) previewFrame?: ElementRef<HTMLIFrameElement>;
  @ViewChild('previewSplit', { read: ElementRef }) previewSplit?: ElementRef<HTMLDivElement>;

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

  // Preview dialog (Angular)
  previewVisible = false;
  previewOnlyUrl: SafeResourceUrl | null = null;

  // computed
  passedCount = computed(() => this.testResults().filter(r => r.passed).length);
  totalCount = computed(() => this.testResults().length);
  failedCount = computed(() => this.testResults().filter(r => !r.passed).length);
  allPassing = computed(() => this.totalCount() > 0 && this.failedCount() === 0);

  previewTopTab = signal<'preview' | 'testcode'>('preview');
  isPreviewTop = computed(() => this.previewTopTab() === 'preview');
  isTestCodeTop = computed(() => this.previewTopTab() === 'testcode');

  isTestsTab = computed(() => this.subTab() === 'tests');
  isConsoleTab = computed(() => this.subTab() === 'console');
  isTopCodeTab = computed(() => this.topTab() === 'code');
  isTopTestsTab = computed(() => this.topTab() === 'tests');
  hasAnyTests = computed(() => !!(this.testCode()?.trim()));

  // --- file explorer state for framework techs ---
  filesMap = signal<Record<string, string>>({});
  openPath = signal<string>('');

  fileList = computed(() =>
    Object.keys(this.filesMap()).sort((a, b) => {
      const da = a.split('/').length, db = b.split('/').length;
      if (da !== db) return da - db;
      return a.localeCompare(b);
    })
  );

  // --- state ---
  webColsRatio = signal(0.5);
  previewRatio = signal(0.7);

  // preview url
  private _previewUrl = signal<SafeResourceUrl | null>(null);
  previewUrl = () => this._previewUrl();

  isDraggingCols = signal(false);
  isDraggingRight = signal(false);
  showFileDrawer = signal(false);

  private draggingCols = false;
  private startXCols = 0;
  private startColsRatio = 0;

  private draggingPreview = false;
  private startYPreview = 0;
  private startPreviewRatio = 0;

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
  previewDocRaw = computed(() => {
    const css = this.cssCode() ?? '';
    const html = this.htmlCode() ?? '';
    return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root { color-scheme: light }
  * { box-sizing: border-box }
  html,body { height: 100%; background:#fff; color:#111; }
  body {
    margin:16px;
    font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial;
  }
  ${css}
</style></head><body>${html}</body></html>`;
  });

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
    private router: Router,
    private qs: QuestionService,
    private sanitizer: DomSanitizer,
    private zone: NgZone,
    private codeStore: CodeStorageService,
    private runner: UserCodeSandboxService,
    private daily: DailyService,
    private activity: ActivityService,
    private http: HttpClient
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

    // determine :tech and :kind
    this.route.paramMap.subscribe((pm) => {
      let p: ActivatedRoute | null = this.route;
      let tech: string | null = null;
      while (p && !tech) {
        tech = p.snapshot.paramMap.get('tech');
        p = p.parent!;
      }
      this.tech = ((tech || 'javascript') as Tech);

      const path = this.route.routeConfig?.path || '';
      this.kind = path.startsWith('debug') ? 'debug' : 'coding';

      this.daily.ensureTodaySet(this.tech as any);
      this.horizontalRatio.set(this.isWebTech() || this.tech === 'javascript' ? 0.5 : 0.3);

      const id = pm.get('id')!;
      this.qs.loadQuestions(this.tech, this.kind).subscribe((list) => {
        this.allQuestions = [...list].sort(CodingDetailComponent.sortForPractice);
        this.loadQuestion(id);
      });
    });

    document.body.style.overflow = 'hidden';
  }

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
  }

  ngOnDestroy() {
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    document.body.style.overflow = '';
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
    // most-specific first, then fallbacks
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

  private langPrefKey(q: Question) { return `uf:lang:${q.id}`; }

  // ---------- WEB (html/css) utilities ----------
  private pickString(obj: any, paths: string[]): string {
    for (const p of paths) {
      const val = p.split('.').reduce((o: any, k) => (o && k in o ? (o as any)[k] : undefined), obj as any);
      if (typeof val === 'string' && val.trim()) return val;
    }
    return '';
  }
  private findCssLike(obj: any): string {
    const scan = (o: any) => {
      if (!o || typeof o !== 'object') return '';
      for (const [k, v] of Object.entries(o)) {
        if (typeof v === 'string' && /css/i.test(k) && !/solution/i.test(k) && v.trim()) return v;
      }
      return '';
    };
    return scan(obj?.web) || scan(obj) || '';
  }
  private prettifyCss(css: string): string {
    if (!css) return '';
    try {
      return css
        .replace(/\s*{\s*/g, ' {\n  ')
        .replace(/;\s*/g, ';\n  ')
        .replace(/\s*}\s*/g, '\n}\n')
        .replace(/\n\s*\n/g, '\n')
        .trim();
    } catch { return css; }
  }
  private getWebStarters(q: any): { html: string; css: string } {
    const htmlRaw = this.pickString(q, [
      'web.starterHtml', 'starterHtml', 'htmlStarter', 'web.html', 'html'
    ]);

    let cssRaw = this.pickString(q, [
      'web.starterCss', 'starterCss', 'cssStarter', 'web.css', 'css', 'starterStyles', 'styles', 'starterCSS'
    ]);
    if (!cssRaw) cssRaw = this.findCssLike(q);

    const html = htmlRaw || `<!-- Start here: ${q.title ?? 'Challenge'} -->`;
    const css = this.prettifyCss(cssRaw || '');
    return { html, css };
  }
  private getWebSolutions(q: any): { html: string; css: string } {
    const w = q.web ?? {};
    const html = w.solutionHtml ?? q.solutionHtml ?? q.htmlSolution ?? w.htmlSolution ?? '';
    const css = w.solutionCss ?? q.solutionCss ?? q.cssSolution ?? w.cssSolution ?? '';
    return { html: String(html ?? ''), css: String(css ?? '') };
  }
  private getWebTests(q: any): string {
    return this.pickString(q, ['web.tests', 'tests', 'testsDom', 'testsHtml']) || '';
  }
  private webKey(q: Question, which: 'html' | 'css') { return `uf:web:${which}:${q.id}`; }
  private webBaseKey(q: Question, which: 'html' | 'css') {
    return `uf:web:baseline:v2:${which}:${q.id}`;
  }

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

  // ---------- Load question ----------
  private async loadQuestion(id: string) {
    const idx = this.allQuestions.findIndex(q => q.id === id);
    if (idx < 0) {
      this.router.navigateByUrl('/404', { state: { from: this.router.url } });
      return;
    }

    this.currentIndex = idx;
    const q = this.allQuestions[idx];
    this.question.set(q);

    this.solved.set(this.loadSolvedFlag(q));
    this.loadCollapsePref(q);

    let shouldShowBanner = false;

    // FRAMEWORK (Angular/React)
    if (this.isFrameworkTech()) {
      this.topTab.set('code');

      const storageKey = this.tech === 'angular' ? getNgStorageKey(q) : getReactStorageKey(q);
      const baselineKey = this.tech === 'angular' ? getNgBaselineKey(q) : getReactBaselineKey(q);

      // 1) Load saved snapshot
      let files = this.loadSavedFiles(storageKey);

      // 2) If first time, bootstrap from sdk.asset (JSON) or fallback
      if (!files || Object.keys(files).length === 0) {
        const meta = (q as any).sdk as { asset?: string; openFile?: string } | undefined;
        const assetUrl = meta?.asset;
        if (assetUrl) {
          try {
            const asset = await this.fetchSdkAsset(assetUrl);
            files = normalizeSdkFiles(asset.files || {});
            const openFromAsset = (meta?.openFile ?? asset.openFile) || undefined;

            // persist baseline + current
            try {
              localStorage.setItem(storageKey, JSON.stringify(files));
              localStorage.setItem(baselineKey, JSON.stringify(files));
            } catch { }
            // choose entry
            const open = (openFromAsset || this.defaultEntry()).replace(/^\/+/, '');
            this.frameworkEntryFile = open;
          } catch {
            files = this.createFrameworkFallbackFiles();
          }
        } else {
          files = this.createFrameworkFallbackFiles();
        }
      } else {
        // decide banner against baseline
        const baseRaw = localStorage.getItem(baselineKey);
        const baseline = baseRaw ? normalizeSdkFiles(JSON.parse(baseRaw)) : null;
        if (baseline && !matchesBaseline(files, baseline)) shouldShowBanner = true;
      }

      // 3) Initialize editor
      const openFile = this.pickFirstOpen(files);
      this.frameworkEntryFile = openFile;
      this.filesMap.set(files);
      this.openPath.set(openFile);
      this.editorContent.set(files[openFile] ?? '');

      // 4) Preview (simple html-only placeholder)
      this.rebuildFrameworkPreview();

      // reset UI
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

    // ---------- HTML / CSS ----------
    if (this.isWebTech()) {
      const starters = this.getWebStarters(q);
      const htmlBaseKey = this.webBaseKey(q, 'html');
      const cssBaseKey = this.webBaseKey(q, 'css');

      if (!localStorage.getItem(htmlBaseKey)) try { localStorage.setItem(htmlBaseKey, starters.html); } catch { }
      if (!localStorage.getItem(cssBaseKey)) try { localStorage.setItem(cssBaseKey, starters.css); } catch { }

      const normalizeSaved = (raw: string | null) => {
        if (raw == null) return null;
        const s = raw.trim();
        if (!s) return null;
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

      const html = savedHtml ?? starters.html;
      const css = savedCss ?? starters.css;

      this.htmlCode.set(html);
      this.cssCode.set(css);

      try {
        const baseHtml = localStorage.getItem(htmlBaseKey) ?? '';
        const baseCss = localStorage.getItem(cssBaseKey) ?? '';
        if ((savedHtml && savedHtml !== baseHtml) || (savedCss && savedCss !== baseCss)) {
          shouldShowBanner = true;
        }
      } catch { }

      this.testCode.set(this.getWebTests(q));
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

    // ---------- JS / TS ----------
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

  private defaultEntry(): string {
    return this.tech === 'angular' ? 'src/app/app.component.ts' : 'src/App.tsx';
  }

  private pickFirstOpen(files: Record<string, string>): string {
    const dflt = this.defaultEntry();
    if (files[dflt]) return dflt;
    const candidates = ['src/main.tsx', 'src/main.ts', 'src/index.tsx', 'src/index.ts', 'src/App.tsx', 'src/app/app.component.ts'];
    const found = candidates.find(f => f in files);
    if (found) return found;
    const [first] = Object.keys(files);
    return (first || dflt).replace(/^\/+/, '');
  }

  private async fetchSdkAsset(url: string): Promise<SdkAsset> {
    // Resolve relative to <base href> to support subpaths
    const href = new URL(url, document.baseURI).toString();
    return await firstValueFrom(this.http.get<SdkAsset>(href));
  }

  private createFrameworkFallbackFiles(): Record<string, string> {
    if (this.tech === 'react') {
      return {
        'public/index.html': `<!doctype html><html><head><meta charset="utf-8"><title>React</title></head><body><div id="root">React preview placeholder</div></body></html>`,
        'src/App.tsx': `export default function App(){ return <div>Hello React</div> }`,
      };
    } else {
      return {
        'src/app/app.component.ts': `import { Component } from '@angular/core';\n@Component({selector:'app-root', standalone:true, template:\`<h1>Hello Angular</h1>\`})\nexport class AppComponent{}`,
        'src/main.ts': `import { bootstrapApplication } from '@angular/platform-browser';\nimport { AppComponent } from './app/app.component';\nbootstrapApplication(AppComponent);`,
        'index.html': `<!doctype html><html><head><meta charset="utf-8"><title>Angular</title></head><body><app-root>Angular preview placeholder</app-root></body></html>`,
      };
    }
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
    if (!q || this.tech === 'angular' || this.isWebTech()) return;
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

  // ---------- TS -> JS transpile (for tests) ----------
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

  // ---------- run tests (JS/TS) ----------
  async runTests(): Promise<void> {
    const q = this.question();
    if (!q || this.tech === 'angular') return;

    // Delegate to DOM runner for HTML/CSS questions
    if (this.isWebTech()) { await this.runWebTests(); return; }

    // UI reset
    this.subTab.set('console');
    this.hasRunTests = false;
    this.testResults.set([]);
    this.consoleEntries.set([]);

    const testsSrcRaw = (this.testCode() || '').trim();
    if (!testsSrcRaw) {
      // Nothing to run – show "No tests reported"
      this.hasRunTests = true;
      this.testResults.set([]);
      this.subTab.set('tests');
      return;
    }

    // Prepare sources
    const lang = this.jsLang();
    // Prepare sources
    const userSrc = this.editorContent();
    const testsSrc = (this.testCode() || '').trim();

    // Always ensure JS (transpile if needed) for BOTH user & tests
    const userJs = await this.ensureJs(userSrc, `${q.id}.ts`);
    const testsJs = await this.ensureJs(testsSrc, `${q.id}.tests.ts`);

    const wrapped = this.wrapExportDefault(userJs, q.id);
    const testsPrepared = this.transformTestCode(testsJs, q.id);


    // 1) Try the sandbox first
    try {
      const out = await this.runner.runWithTests({ userCode: wrapped, testCode: testsPrepared, timeoutMs: 1500 });
      this.consoleEntries.set(this.sanitizeLogs((out?.entries as ConsoleEntry[]) || []));
      this.testResults.set(out?.results || []);
    } catch (e: any) {
      this.testResults.set([{ name: 'Test runner error', passed: false, error: String(e?.message ?? e) }]);
    }

    // 2) Fallback: local harness if the sandbox produced no results
    if ((this.testResults() || []).length === 0 && testsPrepared.trim()) {
      try {
        // Evaluate user's code so default export is on the global
        new Function(wrapped)();

        // Minimal harness
        const results: TestResult[] = [];
        const logs: ConsoleEntry[] = [];
        const pushLog = (type: 'log' | 'warn' | 'error', args: any[]) => { try { logs.push({ type, args } as any); } catch { } };

        const consoleProxy = {
          log: (...a: any[]) => pushLog('log', a),
          warn: (...a: any[]) => pushLog('warn', a),
          error: (...a: any[]) => pushLog('error', a),
        };

        const isObj = (v: any) => v !== null && typeof v === 'object';
        const deepEqual = (a: any, b: any): boolean => {
          if (Object.is(a, b)) return true;
          if (Array.isArray(a) && Array.isArray(b)) {
            return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
          }
          if (isObj(a) && isObj(b)) {
            const ka = Object.keys(a), kb = Object.keys(b);
            if (ka.length !== kb.length) return false;
            for (const k of ka) if (!deepEqual(a[k], (b as any)[k])) return false;
            return true;
          }
          return false;
        };

        const expect = (received: any) => ({
          toBe: (exp: any) => { if (!Object.is(received, exp)) throw new Error(`Expected ${JSON.stringify(received)} to be ${JSON.stringify(exp)}`); },
          toEqual: (exp: any) => { if (!deepEqual(received, exp)) throw new Error(`Expected ${JSON.stringify(received)} to equal ${JSON.stringify(exp)}`); },
          toStrictEqual: (exp: any) => { if (!deepEqual(received, exp)) throw new Error(`Expected ${JSON.stringify(received)} to strictly equal ${JSON.stringify(exp)}`); },
        });

        const runCase = async (name: string, fn: () => any | Promise<any>) => {
          try { await fn(); results.push({ name, passed: true }); }
          catch (e: any) { results.push({ name, passed: false, error: String(e?.message ?? e) }); }
        };

        const it = (name: string, fn: () => any | Promise<any>) => runCase(name, fn);
        const test = it;
        const describe = (_: string, fn: () => void) => { try { fn(); } catch { /* ignore */ } };

        // Execute tests with harness in scope
        new Function('describe', 'test', 'it', 'expect', 'console', testsPrepared)(
          describe as any, test as any, it as any, expect as any, consoleProxy as any
        );

        this.consoleEntries.set(this.sanitizeLogs(logs));
        this.testResults.set(results);
      } catch (e: any) {
        this.testResults.set([{ name: 'Local runner error', passed: false, error: String(e?.message ?? e) }]);
      }
    }

    // End-of-run bookkeeping
    this.hasRunTests = true;

    const passing = this.allPassing();
    this.solved.set(passing);
    this.saveSolvedFlag(q, passing);

    if (passing) {
      this.creditDaily();
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
          this.activity.activityCompleted$.next({ kind: this.kind, tech: this.tech, stats: res?.stats });
          this.activity.refreshSummary();
        },
        error: (e) => console.error('record completion failed', e),
      });

      await this.celebrate('tests');
    }

    this.subTab.set('tests');
  }

  // Add this helper near your transpileTsToJs()
  private async ensureJs(code: string, fileName: string): Promise<string> {
    if (!code) return '';

    // Heuristic: does the code look like TypeScript?
    const looksTs =
      /:\s*[A-Za-z_$][\w$<>\[\]\|&\s,]*/.test(code) || // type annotations
      /\sas\s+[A-Za-z_$][\w$<>\[\]\|&\s,]*/.test(code) || // "as" casts
      /\binterface\b|\btype\s+[^=]+\=/.test(code) ||     // interfaces / type aliases
      /\benum\s+[A-Za-z_$]/.test(code);                  // enums

    if (this.jsLang() === 'ts' || looksTs) {
      // Prefer real TS emit
      const js = await this.transpileTsToJs(code, fileName);
      if (js && js.trim()) return js;

      // Fallback: strip some common TS syntax if monaco worker isn’t ready
      return code
        .replace(/:\s*[^=;,)]+(?=[=;,)])/g, '')         // remove ": type"
        .replace(/\sas\s+[A-Za-z_$][\w$<>\[\]\|&\s,]*/g, '') // remove "as Type"
        .replace(/\binterface\b[\s\S]*?\{[\s\S]*?\}\s*/g, '') // drop interfaces
        .replace(/\btype\s+[A-Za-z_$][\w$]*\s*=\s*[\s\S]*?;/g, ''); // drop type aliases
    }

    return code;
  }

  // ---------- run tests (HTML/CSS DOM) ----------
  private fmt(v: any): string {
    try {
      if (v instanceof Element) return `<${v.tagName.toLowerCase()}>`;
      return JSON.stringify(v);
    } catch { return String(v); }
  }

  private makeDomExpect(doc: Document, win: Window) {
    const expect = (received: any) => ({
      toBe: (exp: any) => {
        if (received !== exp) throw new Error(`Expected ${this.fmt(received)} to be ${this.fmt(exp)}`);
      },
      toBeTruthy: () => {
        if (!received) throw new Error(`Expected value to be truthy, got ${this.fmt(received)}`);
      },
      toHaveAttribute: (name: string, value?: string) => {
        if (!(received instanceof Element)) throw new Error('toHaveAttribute expects an Element');
        const got = received.getAttribute(name);
        const ok = (value === undefined) ? got !== null : got === value;
        if (!ok) throw new Error(`Expected element to have [${name}${value !== undefined ? `="${value}"` : ''}], got ${this.fmt(got)}`);
      },
      toHaveText: (substr: string) => {
        if (!(received instanceof Element)) throw new Error('toHaveText expects an Element');
        const txt = (received.textContent || '').trim();
        if (!txt.includes(substr)) throw new Error(`Expected text to include "${substr}", got "${txt}"`);
      },
      toBeVisible: () => {
        if (!(received instanceof Element)) throw new Error('toBeVisible expects Element');
        const cs = win.getComputedStyle(received);
        if (cs.display === 'none' || cs.visibility === 'hidden') {
          throw new Error('Element is not visible');
        }
      }
    });
    return expect;
  }

  private async ensurePreviewLoaded(frame: HTMLIFrameElement): Promise<void> {
    const d = frame.contentDocument;
    if (d && d.readyState === 'complete') return;
    await new Promise<void>((res) => {
      const on = () => { frame.removeEventListener('load', on); res(); };
      frame.addEventListener('load', on, { once: true });
    });
  }

  async runWebTests(): Promise<void> {
    const q = this.question();
    if (!q || !this.isWebTech()) return;

    this.subTab.set('tests');
    this.hasRunTests = false;
    this.testResults.set([]);
    this.consoleEntries.set([]);

    const code = (this.testCode() || '').trim();
    if (!code) {
      // nothing to run
      this.hasRunTests = true;
      this.testResults.set([]);
      return;
    }

    const iframe = this.previewFrame?.nativeElement;
    if (!iframe) return;

    await this.ensurePreviewLoaded(iframe);
    const doc = iframe.contentDocument as Document;
    const win = iframe.contentWindow as Window;

    const results: TestResult[] = [];
    const it = async (name: string, fn: () => any | Promise<any>) => {
      try { await fn(); results.push({ name, passed: true }); }
      catch (e: any) { results.push({ name, passed: false, error: String(e?.message ?? e) }); }
    };
    // alias
    const test = it;

    const expect = this.makeDomExpect(doc, win);

    // small helpers
    const q$ = (sel: string) => doc.querySelector(sel);
    const qa$ = (sel: string) => Array.from(doc.querySelectorAll(sel));

    try {
      // Execute tests with a controlled scope
      const runner = new Function(
        'document',
        'window',
        'it',
        'test',
        'expect',
        'q',
        'qa',
        code
      );
      await runner.call(undefined, doc, win, it, test, expect as any, q$, qa$);
    } catch (e: any) {
      results.unshift({ name: 'Failed to execute test file', passed: false, error: String(e?.message ?? e) });
    }

    this.testResults.set(results);
    this.hasRunTests = true;

    const passing = this.allPassing();
    this.solved.set(passing);
    this.saveSolvedFlag(q, passing);
    if (passing) {
      this.creditDaily();
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
          this.activity.activityCompleted$.next({ kind: this.kind, tech: this.tech, stats: res?.stats });
          this.activity.refreshSummary();
        },
        error: (e) => console.error('record completion failed', e),
      });

      await this.celebrate('tests');
    }
  }
  
  // ---------- submit ----------
  async submitCode(): Promise<void> {
    const q = this.question();
    if (!q) return;

    // Angular and Web are still “mark complete” on submit (tests are optional)
    if (this.tech === 'angular' || this.isWebTech()) {
      if (this.isFrameworkTech() || this.isWebTech()) {
        this.creditDaily();
        this.recordCompletion('submit');
        await this.celebrate('submit');
        return;
      }
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
          this.activity.activityCompleted$.next({ kind: this.kind, tech: this.tech, stats: res?.stats });
          this.activity.refreshSummary();
        },
        error: (e) => console.error('record completion failed', e),
      });

      await this.celebrate('submit');
    }
  }

  // --- handlers (reuse your global pointer listeners) ---
  startWebColumnDrag = (ev: PointerEvent) => {
    ev.preventDefault();
    this.draggingCols = true;
    this.isDraggingCols.set(true);
    this.startXCols = ev.clientX;
    this.startColsRatio = this.webColsRatio();
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
    const stop = () => { this.draggingCols = false; this.isDraggingCols.set(false); document.removeEventListener('pointerup', stop); };
    document.addEventListener('pointerup', stop);
  };

  private onPointerMoveCols = (ev: PointerEvent) => {
    if (!this.draggingCols) return;
    const delta = ev.clientX - this.startXCols;
    let r = this.startColsRatio + delta / window.innerWidth;
    r = Math.max(0.25, Math.min(0.75, r));
    this.zone.run(() => this.webColsRatio.set(r));
  };

  startPreviewDrag = (ev: PointerEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    this.draggingPreview = true;
    this.isDraggingRight.set(true);
    this.startYPreview = ev.clientY;
    this.startPreviewRatio = this.previewRatio();
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
    const stop = () => { this.draggingPreview = false; this.isDraggingRight.set(false); document.removeEventListener('pointerup', stop); };
    document.addEventListener('pointerup', stop);
  };

  private onPointerMovePreview = (ev: PointerEvent) => {
    if (!this.draggingPreview || !this.previewSplit) return;
    const rect = this.previewSplit.nativeElement.getBoundingClientRect();
    const delta = ev.clientY - this.startYPreview;
    let r = (rect.height * this.startPreviewRatio + delta) / rect.height;
    r = Math.max(0.2, Math.min(0.9, r));
    this.zone.run(() => this.previewRatio.set(r));
  };

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
    if (this.draggingHorizontal) { this.onPointerMoveHorizontal(ev); return; } // aside splitter
    if (this.draggingCols) { this.onPointerMoveCols(ev); return; } // middle splitter
    if (this.draggingPreview) { this.onPointerMovePreview(ev); return; } // right splitter

    // HTML ↔ CSS splitter
    if (!this.dragging || !this.splitContainer) return;
    const rect = this.splitContainer.nativeElement.getBoundingClientRect();
    const delta = ev.clientY - this.startY;
    const newEditorPx = rect.height * this.startRatio + delta;
    let newRatio = newEditorPx / rect.height;
    newRatio = Math.max(0.2, Math.min(0.9, newRatio));
    this.zone.run(() => this.editorRatio.set(newRatio));
  };

  private onPointerUp = () => {
    if (this.dragging) this.dragging = false;
    if (this.draggingHorizontal) this.draggingHorizontal = false;
    if (this.draggingCols) this.draggingCols = false;
    if (this.draggingPreview) this.draggingPreview = false;
  };

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

  openPreview() {
    const url = this.previewUrl(); if (!url) return;
    this.previewOnlyUrl = url;
    this.previewVisible = true;
  }
  closePreview() { this.previewVisible = false; setTimeout(() => { this.previewOnlyUrl = null; }, 200); }

  // ---------- reset ----------
  async resetQuestion() {
    const q = this.question();
    if (!q || this.resetting()) return;

    this.resetting.set(true);
    try {
      if (this.isFrameworkTech()) {
        // Clear saved snapshot and reload question; loadQuestion will re-bootstrap files/preview
        const storageKey = this.tech === 'angular' ? getNgStorageKey(q) : getReactStorageKey(q);
        try { localStorage.removeItem(storageKey); } catch { }
        await this.loadQuestion(q.id);
      } else if (this.isWebTech()) {
        const starters = this.getWebStarters(q);
        try { localStorage.removeItem(this.webKey(q, 'html')); } catch { }
        try { localStorage.removeItem(this.webKey(q, 'css')); } catch { }
        this.htmlCode.set(starters.html);
        this.cssCode.set(starters.css);
      } else {
        // JS/TS
        try { localStorage.removeItem(getJsKey(q.id)); } catch { }
        const lang = this.jsLang();
        this.editorContent.set(this.getStarter(q, lang));
        this.testCode.set(this.getTests(q, lang));
      }

      // common cleanup
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
        this.activity.activityCompleted$.next({ kind: this.kind, tech: this.tech, stats: res?.stats });
        this.activity.refreshSummary();
      },
      error: (e) => console.error('record completion failed', e),
    });
  }

  private sanitizeLogs(list: ConsoleEntry[] | undefined): ConsoleEntry[] {
    if (!Array.isArray(list) || list.length === 0) return [];
    return list.slice(-this.MAX_CONSOLE_LINES);
  }

  langFromPath(p: string): 'typescript' | 'javascript' | 'html' | 'css' | 'json' | 'plaintext' {
    const lc = (p || '').toLowerCase();
    if (lc.endsWith('.ts') || lc.endsWith('.tsx')) return 'typescript';
    if (lc.endsWith('.js') || lc.endsWith('.jsx')) return 'javascript';
    if (lc.endsWith('.html')) return 'html';
    if (lc.endsWith('.css') || lc.endsWith('.scss')) return 'css';
    if (lc.endsWith('.json')) return 'json';
    return 'plaintext';
  }

  openFile(path: string) {
    const files = this.filesMap();
    if (!path || !(path in files)) return;
    this.openPath.set(path);
    this.frameworkEntryFile = path;
    this.editorContent.set(files[path] ?? '');
    this.remountEditor();
  }

  toggleFiles() { this.showFileDrawer.set(!this.showFileDrawer()); }
  closeFiles() { this.showFileDrawer.set(false); }

  isWebTech(): boolean { return this.tech === 'html' || this.tech === 'css'; }
  isFrameworkTech(): boolean { return this.tech === 'angular' || this.tech === 'react'; }

  onFrameworkCodeChange(code: string) {
    this.editorContent.set(code);
    const q = this.question(); if (!q) return;

    const path = this.openPath() || this.frameworkEntryFile; if (!path) return;

    // update in-memory map
    this.filesMap.update(m => ({ ...m, [path]: code }));

    // persist whole snapshot (so we can restore all files)
    const storageKey = this.tech === 'angular' ? getNgStorageKey(q) : getReactStorageKey(q);
    try { localStorage.setItem(storageKey, JSON.stringify(this.filesMap())); } catch { }

    // Debounced rebuild hook
    this.scheduleRebuild();
  }

  private rebuildTimer: any = null;
  private scheduleRebuild() {
    if (this.rebuildTimer) clearTimeout(this.rebuildTimer);
    this.rebuildTimer = setTimeout(() => this.rebuildFrameworkPreview(), 200);
  }

  private remountEditor() {
    this.showEditor.set(false);
    setTimeout(() => this.showEditor.set(true), 0);
  }

  /** Rebuilds the preview iframe for framework techs using the saved files */
  async rebuildFrameworkPreview() {
    const files = this.filesMap();

    if (this.tech === 'react') {
      const html = this.makeReactPreviewHtml(files);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      this._previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
      return;
    }

    // Angular (basic fallback: just show index.html if present)
    const html = files['index.html'] || files['public/index.html'] || '';
    if (!html) { this._previewUrl.set(null); return; }
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    this._previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
  }

  /** Build a self-contained preview HTML for React using UMD + Babel in the iframe */
  private makeReactPreviewHtml(files: Record<string, string>): string {
    let user = files['src/App.tsx']
      ?? files['src/App.jsx']
      ?? files['src/App.ts']
      ?? files['src/App.js']
      ?? `export default function App(){ return <div>Empty App</div> }`;

    const appSrc = this.rewriteReactModuleToUMD(user);

    const css = files['src/App.css'] ?? files['src/index.css'] ?? files['public/styles.css'] ?? '';

    return `<!doctype html>
                <html>
                <head>
                  <meta charset="utf-8"/>
                  <meta name="viewport" content="width=device-width,initial-scale=1"/>
                  <title>Preview</title>
                  <style>html,body,#root{height:100%}body{margin:16px;font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,Arial}</style>
                  ${css ? `<style>${css}</style>` : ''}
                  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
                  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
                  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
                </head>
                <body>
                  <div id="root"></div>

                  <!-- User code (TS/JSX) – imports stripped, hooks aliased -->
                  <script type="text/babel" data-presets="typescript,react">
                    const { useState, useEffect, useMemo, useRef, useReducer, useContext } = React;
                ${appSrc}
                  </script>

                  <!-- Mount -->
                  <script type="text/babel" data-presets="typescript,react">
                    const root = ReactDOM.createRoot(document.getElementById('root'));
                    if (typeof App === 'function' || (typeof App === 'object' && App)) {
                      root.render(React.createElement(App));
                    } else {
                      root.render(React.createElement('div', null, 'No App component exported'));
                    }
                  </script>
                </body>
                </html>`;
  }


  /** Turn a module-style React file into plain script that runs with UMD globals */
  private rewriteReactModuleToUMD(src: string): string {
    let s = src;

    // 1) Remove React/ReactDOM (and client) imports – we load UMD versions in the page
    s = s.replace(/^\s*import\s+[^;]*from\s+['"]react(?:-dom(?:\/client)?)?['"];?\s*$/mg, '');

    // 2) Remove side-effect CSS imports like `import './App.css'`
    s = s.replace(/^\s*import\s+['"][^'"]+\.css['"];?\s*$/mg, '');

    // 3) Normalize default exports to `App` in global scope
    //    export default function App() {}    -> function App() {}
    s = s.replace(/\bexport\s+default\s+function\s+([A-Za-z0-9_]+)?/m, 'function App');
    //    export default class App {}        -> class App {}
    s = s.replace(/\bexport\s+default\s+class\s+([A-Za-z0-9_]+)?/m, 'class App');
    //    export default (...)               -> const App = (...)
    s = s.replace(/\bexport\s+default\s+/m, 'const App = ');

    // 4) Remove any remaining named `export` keywords (not needed in the preview)
    s = s.replace(/^\s*export\s+(?=(const|let|var|function|class)\b)/mg, '');

    return s.trim();
  }

  private wrapExportDefault(src: string, _id: string): string {
    let name: string | null = null;
    let s = src;

    // 1) export default function NAME(...) { ... }  -> function NAME(...) { ... }
    s = s.replace(/\bexport\s+default\s+function\s+([A-Za-z0-9_]+)?/m, (_m, n) => {
      name = n || '__UF_DefaultFn__';
      return `function ${name}`;
    });

    // 2) export default class NAME {...} -> class NAME {...}
    s = s.replace(/\bexport\s+default\s+class\s+([A-Za-z0-9_]+)?/m, (_m, n) => {
      name = n || '__UF_DefaultClass__';
      return `class ${name}`;
    });

    // 3) export default <expr>; -> const __UF_Default__ = <expr>;
    if (!/\b__UF_Default(Fn|Class)__\b/.test(s)) {
      const before = s;
      s = s.replace(/\bexport\s+default\s+/m, 'const __UF_Default__ = ');
      if (s !== before) name = name || '__UF_Default__';
    }

    // 4) Publish to globals (both generic and named)
    s += `
      ;globalThis.__UF_USER_DEFAULT__ = (typeof ${name} !== "undefined") ? ${name} : undefined;
      ;try { if (${JSON.stringify(name)} && typeof ${name} !== "undefined") { globalThis[${JSON.stringify(name)}] = ${name}; } } catch {}
    `;

    return s;
  }


  private transformTestCode(src: string, _id: string): string {
    const REL_DEFAULT = /import\s+([A-Za-z0-9_$*\s{},]+)\s+from\s+['"]\.\/[A-Za-z0-9_\-./]+['"];?/g;

    let out = src.replace(REL_DEFAULT, (_m, bindings) => {
      const first = bindings.includes('{')
        ? bindings.replace(/[{}*\s]/g, '').split(',')[0] || '__user'
        : bindings.trim();

      // ✅ no TS here:
      return `const ${first} = globalThis.__UF_USER_DEFAULT__;`;
    });

    out = out.replace(/^\s*import\s+[^;]+from\s+['"](jest|vitest)['"];\s*$/mg, '');
    return out;
  }
}
