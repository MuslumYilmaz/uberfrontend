// coding-detail.component.ts
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {
  AfterViewInit, Component, computed,
  ElementRef, NgZone,
  OnDestroy, OnInit, signal, ViewChild
} from '@angular/core';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { filter, firstValueFrom, Subject, takeUntil } from 'rxjs';

import type { Question, StructuredDescription } from '../../../core/models/question.model';
import { CodeStorageService } from '../../../core/services/code-storage.service';
import { QuestionService } from '../../../core/services/question.service';
import { matchesBaseline, normalizeSdkFiles } from '../../../core/utils/snapshot.utils';
import {
  getNgBaselineKey, getNgStorageKey,
  getReactBaselineKey, getReactStorageKey
} from '../../../core/utils/storage-keys';
import { MonacoEditorComponent } from '../../../monaco-editor.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { ConsoleEntry, ConsoleLoggerComponent, TestResult } from '../console-logger/console-logger.component';

import type { Tech } from '../../../core/models/user.model';
import { ActivityService } from '../../../core/services/activity.service';
import { DailyService } from '../../../core/services/daily.service';
import { makeAngularPreviewHtmlV1 } from '../../../core/utils/angular-preview-builder';
import { makeReactPreviewHtml } from '../../../core/utils/react-preview-builder';
import { makeVuePreviewHtml } from '../../../core/utils/vue-preview-builder';
import { CodingJsPanelComponent, JsLang } from './coding-js-panel/coding-js-panel.component';

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

type TreeNode =
  | { type: 'dir'; name: string; path: string; children: TreeNode[] }
  | { type: 'file'; name: string; path: string; crumb?: string };

// --- Solution (structured) ---
type UFApproach = {
  title: string;
  prose?: string;
  codeJs?: string;
  codeTs?: string;
  codeHtml?: string;
  codeCss?: string;
};

type UFFollowUpRef = string | { id: string };

type UFSolutionBlock = {
  overview?: string;
  approaches?: UFApproach[];
  notes?: { pitfalls?: string[]; edgeCases?: string[]; techniques?: string[] };
  followUp?: string[];
  followUpQuestions?: UFFollowUpRef[];
  resources?: { title: string; url: string }[];
  explanation?: string;
  codeJs?: string;
  codeTs?: string;
};

@Component({
  selector: 'app-coding-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, HttpClientModule, ButtonModule, DialogModule,
    MonacoEditorComponent, ConsoleLoggerComponent, FooterComponent, CodingJsPanelComponent
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

  private openDirs = signal<Set<string>>(new Set());


  // WEB (HTML/CSS)
  private htmlCode = signal<string>('');
  private cssCode = signal<string>('');
  webHtml = () => this.htmlCode();
  webCss = () => this.cssCode();

  // UI state
  topTab = signal<'code' | 'tests' | 'html' | 'css'>('code');
  activePanel = signal<number>(0);
  subTab = signal<'code' | 'tests' | 'console'>('tests');
  editorRatio = signal(0.6);
  horizontalRatio = signal(0.3);

  similarOpen = signal(true);

  currentJsLang = signal<'js' | 'ts'>('js');

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
    insertSpaces: true,          // ✅ force spaces
    detectIndentation: false,    // ✅ don't auto-guess
    wordWrap: 'on' as const,
    wordWrapColumn: 100,
    scrollBeyondLastColumn: 2,
    automaticLayout: true,
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
    tabSize: 2,
    insertSpaces: true,          // ✅ force spaces
    detectIndentation: false,    // ✅ don't auto-guess
    wordWrap: 'on' as const,
    automaticLayout: true,
  };

  // loading / reset / banner
  resetting = signal(false);
  showEditor = signal(true);
  showRestoreBanner = signal(false);

  private webSaveTimer: any = null;

  private previewObjectUrl: string | null = null;
  private destroy$ = new Subject<void>();
  private lastPreviewHtml: string | null = null;

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

  copiedIdx: number | null = null;
  private copyTimer?: any;

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
  @ViewChild('jsPanel') jsPanel?: CodingJsPanelComponent;

  // drag state
  private dragging = false;
  private startY = 0;
  private startRatio = 0;
  private draggingHorizontal = false;
  private startX = 0;
  private startRatioH = 0;
  private sessionStart = Date.now();
  private recorded = false;

  // --- HTML/CSS solution preview toggle ---
  showingSolutionPreview = false;
  private solutionPreviewUrl: SafeResourceUrl | null = null;

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

  // Current path + short label for the header
  currentPath = computed(() => this.openPath() || this.frameworkEntryFile || '');
  currentFileLabel = computed(() => {
    const p = this.currentPath();
    if (!p) return 'Select a file';
    const i = p.lastIndexOf('/');
    return i >= 0 ? p.slice(i + 1) : p;
  });


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
    const html = this.unescapeJsLiterals(this.htmlCode() ?? '');
    return this.buildWebPreviewDoc(html, css);
  });


  descriptionText = computed(() => {
    const q = this.question();
    if (!q) return '';
    const d = q.description;
    if (typeof d === 'string') return d;
    if (d && typeof d === 'object') return (d as StructuredDescription).summary || '';
    return '';
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

    return exs
      .map((ex: any) => {
        const raw = typeof ex === 'string' ? ex.trim() : String(ex);
        return this.unescapeJsLiterals(raw);   // ✅ use your helper
      })
      .join('\n\n');
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private qs: QuestionService,
    private sanitizer: DomSanitizer,
    private zone: NgZone,
    public codeStore: CodeStorageService,
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
      // Give HTML/CSS more room for the editor by default
      // aside (description) width = horizontalRatio * 100%
      const initialAside =
        this.isWebTech() ? 0.28 :               // HTML/CSS: ~28% aside, 72% editors
          this.tech === 'javascript' ? 0.5 :     // JS: a bit wider spec area
            0.30;                                   // Frameworks: compact aside
      this.horizontalRatio.set(initialAside);
      this.lastAsideRatio = initialAside;       // keep for restore after collapse

      const id = pm.get('id')!;
      this.qs.loadQuestions(this.tech, this.kind).subscribe((list) => {
        this.allQuestions = [...list].sort(CodingDetailComponent.sortForPractice);
        this.loadQuestion(id);
      });
    });

    this.router.events
      .pipe(
        filter(
          (e): e is NavigationStart =>
            e instanceof NavigationStart && e.navigationTrigger === 'popstate'
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.router.navigateByUrl('/coding', { replaceUrl: true });
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
    clearTimeout(this.copyTimer);

    this.destroy$.next();
    this.destroy$.complete();

    document.body.style.overflow = '';
  }

  // ---------- helpers to pick code by language ----------

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
  public prettifyCss(css: string): string {
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

    const html = this.unescapeJsLiterals(htmlRaw) || `<!-- Start here: ${q.title ?? 'Challenge'} -->`;
    const css = this.prettifyCss(this.unescapeJsLiterals(cssRaw) || '');
    return { html, css };
  }

  private getWebSolutions(q: any): { html: string; css: string } {
    const w = q.web ?? {};
    const html = w.solutionHtml ?? q.webSolutionHtml ?? q.solutionHtml ?? q.htmlSolution ?? w.htmlSolution ?? '';
    const css = w.solutionCss ?? q.webSolutionCss ?? q.solutionCss ?? q.cssSolution ?? w.cssSolution ?? '';
    return {
      html: this.unescapeJsLiterals(String(html ?? '')),
      css: this.unescapeJsLiterals(String(css ?? '')),
    };
  }

  private getWebTests(q: any): string {
    const raw = this.pickString(q, ['web.tests', 'tests', 'testsDom', 'testsHtml']) || '';
    return this.unescapeJsLiterals(raw);
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
  public saveSolvedFlag(q: Question, v: boolean) {
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

    // common flags
    this.solved.set(this.loadSolvedFlag(q));
    this.loadCollapsePref(q);
    let shouldShowBanner = false;

    // ---------- Frameworks (Angular/React/Vue) ----------
    if (this.isFrameworkTech()) {
      this.topTab.set('code');

      const storageKey = this.tech === 'angular' ? getNgStorageKey(q) : getReactStorageKey(q);
      const baselineKey = this.tech === 'angular' ? getNgBaselineKey(q) : getReactBaselineKey(q);

      // 1) Load saved snapshot
      let files = this.loadSavedFiles(storageKey);

      // 2) Bootstrap from SDK asset or fallback
      if (!files || Object.keys(files).length === 0) {
        const meta = (q as any).sdk as { asset?: string; openFile?: string } | undefined;
        const assetUrl = meta?.asset;
        if (assetUrl) {
          try {
            const asset = await this.fetchSdkAsset(assetUrl);
            files = normalizeSdkFiles(asset.files || {});
            const openFromAsset = (meta?.openFile ?? asset.openFile) || undefined;

            try {
              localStorage.setItem(storageKey, JSON.stringify(files));
              localStorage.setItem(baselineKey, JSON.stringify(files));
            } catch { }
            const open = (openFromAsset || this.defaultEntry()).replace(/^\/+/, '');
            this.frameworkEntryFile = open;
          } catch {
            files = this.createFrameworkFallbackFiles();
          }
        } else {
          files = this.createFrameworkFallbackFiles();
        }
      } else {
        // compare to baseline to show restore banner
        const baseRaw = localStorage.getItem(baselineKey);
        const baseline = baseRaw ? normalizeSdkFiles(JSON.parse(baseRaw)) : null;
        if (baseline && !matchesBaseline(files, baseline)) shouldShowBanner = true;
      }

      // 3) Init editor + preview
      const openFile = this.pickFirstOpen(files);
      this.frameworkEntryFile = openFile;
      this.filesMap.set(files);
      this.openAllDirsFromPaths(Object.keys(files));
      this.openPath.set(openFile);
      this.editorContent.set(files[openFile] ?? '');
      this.rebuildFrameworkPreview();

      // 4) UI reset
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
      const preferred = 0.28;
      this.horizontalRatio.set(preferred);
      this.lastAsideRatio = preferred;

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
            if (obj && typeof obj.code === 'string') return this.unescapeJsLiterals(obj.code);
          } catch { /* ignore */ }
        }
        return this.unescapeJsLiterals(s);
      };

      const savedHtml = normalizeSaved(localStorage.getItem(this.webKey(q, 'html')));
      const savedCss = normalizeSaved(localStorage.getItem(this.webKey(q, 'css')));

      const html = savedHtml ?? starters.html;
      const css = savedCss ?? starters.css;

      this.htmlCode.set(html);
      this.cssCode.set(css);
      this.scheduleWebPreview();

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

    // ---------- Plain JS / TS ----------
    // Parent no longer touches starters/tests; the child panel + CodeStorageService own it.
    // Decide which language tab to show, then ask the child to init itself.
    const svcSaved = this.codeStore.getJs(q.id);
    const hinted = (q as any)?.defaultLang;
    const resolvedLang: JsLang =
      (svcSaved?.language === 'ts' || svcSaved?.language === 'js')
        ? svcSaved.language
        : (hinted === 'ts' ? 'ts' : 'js');

    this.currentJsLang.set(resolvedLang);

    // UI/reset; banner is handled by the child if it wants one.
    this.activePanel.set(0);
    this.topTab.set('code');
    this.subTab.set('tests');
    this.hasRunTests = false;
    this.testResults.set([]);
    this.consoleEntries.set([]);
    this.showRestoreBanner.set(false);
    this.sessionStart = Date.now();
    this.recorded = false;

    // Let the child pull everything it needs (starters, tests, baselines) from the service/question.
    // If the child isn't mounted yet, setTimeout defers until after view init.
    setTimeout(() => this.jsPanel?.initFromQuestion(), 0);
  }

  private getActiveJsLang(): 'js' | 'ts' {
    const fromChild = this.jsPanel?.['jsLang']?.();
    return (fromChild === 'ts' || fromChild === 'js') ? fromChild : this.currentJsLang();
  }

  private defaultEntry(): string {
    if (this.tech === 'angular') return 'src/app/app.component.ts';
    if (this.tech === 'react') return 'src/App.tsx';
    return 'src/App.ts';
  }


  private pickFirstOpen(files: Record<string, string>): string {
    const dflt = this.defaultEntry();
    if (files[dflt]) return dflt;
    const candidates = [
      'src/main.tsx', 'src/main.ts', 'src/index.tsx', 'src/index.ts',
      'src/App.tsx', 'src/App.ts', 'src/App.js', 'src/App.vue',
      'src/app/app.component.ts'
    ];
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

  onHtmlChange = (code: string) => {
    const q = this.question(); if (!q || !this.isWebTech()) return;
    this.htmlCode.set(code);
    clearTimeout(this.webSaveTimer);
    this.webSaveTimer = setTimeout(() => {
      try { localStorage.setItem(this.webKey(q, 'html'), code); } catch { }
    }, 200);
    this.scheduleWebPreview(); // ✅
  };

  onCssChange = (code: string) => {
    const q = this.question(); if (!q || !this.isWebTech()) return;
    this.cssCode.set(code);
    clearTimeout(this.webSaveTimer);
    this.webSaveTimer = setTimeout(() => {
      try { localStorage.setItem(this.webKey(q, 'css'), code); } catch { }
    }, 200);
    this.scheduleWebPreview(); // ✅
  };

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

  // ---------- run tests (JS/TS) ----------
  async runTests(): Promise<void> {
    const q = this.question();
    if (!q) return;

    // Frameworks use the preview pipeline; nothing to run here.
    if (this.isFrameworkTech()) return;

    // HTML/CSS uses the DOM runner that lives in this component.
    if (this.isWebTech()) {
      await this.runWebTests();
      return;
    }

    // Plain JS/TS -> delegate to child panel
    this.subTab.set('console');
    this.hasRunTests = false;
    this.testResults.set([]);
    this.consoleEntries.set([]);

    // Ask the child to run; results/console/solved will arrive via outputs.
    await this.jsPanel?.runTests();

    // Mark completed locally for UI that depends on this flag.
    this.hasRunTests = true;

    // Post-run bookkeeping (credit + celebration) if everything passed.
    const qNow = this.question();         // re-read in case of navigation
    if (!qNow) return;

    const passing = this.allPassing();
    this.solved.set(passing);
    this.saveSolvedFlag(qNow, passing);

    if (passing) {
      this.creditDaily();
      this.activity.complete({
        kind: this.kind,
        tech: this.tech,
        itemId: qNow.id,
        source: 'tech',
        durationMin: Math.max(1, Math.round((Date.now() - this.sessionStart) / 60000)),
        xp: this.xpFor(qNow),
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
      this.hasRunTests = true;
      this.testResults.set([]);
      return;
    }

    // Build a complete HTML doc from the current editor values (not the preview)
    const htmlDoc = this.previewDocRaw(); // already uses buildWebPreviewDoc(html, css)

    // Mount into an offscreen iframe so tests don't rely on the visible preview
    const { frame, doc, win } = await this.mountScratchDoc(htmlDoc);

    const results: TestResult[] = [];
    const it = async (name: string, fn: () => any | Promise<any>) => {
      try { await fn(); results.push({ name, passed: true }); }
      catch (e: any) { results.push({ name, passed: false, error: String(e?.message ?? e) }); }
    };
    const test = it;
    const expect = this.makeDomExpect(doc, win);

    const q$ = (sel: string) => doc.querySelector(sel);
    const qa$ = (sel: string) => Array.from(doc.querySelectorAll(sel));

    try {
      const runner = new Function('document', 'window', 'it', 'test', 'expect', 'q', 'qa', code);
      await runner.call(undefined, doc, win, it, test, expect as any, q$, qa$);
    } catch (e: any) {
      results.unshift({ name: 'Failed to execute test file', passed: false, error: String(e?.message ?? e) });
    } finally {
      // Clean up the hidden frame regardless of pass/fail
      try { frame.remove(); } catch { /* ignore */ }
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

    // Angular/framework preview and Web DOM work are "mark complete" on submit.
    if (this.isFrameworkTech() || this.isWebTech()) {
      this.creditDaily();
      this.recordCompletion('submit');
      await this.celebrate('submit');
      return;
    }

    // JS/TS: always run tests (delegates to the panel).
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
    this.startX = ev.clientX;
    this.startRatioH = this.horizontalRatio();

    const stop = () => { this.draggingHorizontal = false; document.removeEventListener('pointerup', stop); };
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
    document.addEventListener('pointerup', stop);
  };


  private onPointerMoveHorizontal = (ev: PointerEvent) => {
    if (!this.draggingHorizontal) return;
    const totalWidth = window.innerWidth;
    const delta = ev.clientX - this.startX;
    let newRatio = this.startRatioH + delta / totalWidth;

    // Tighter bounds in HTML/CSS so editors stay dominant
    const min = this.isWebTech() ? 0.18 : 0.20;  // minimum ~18% for web
    const max = this.isWebTech() ? 0.45 : 0.80;  // cap aside at 45% for web

    newRatio = Math.max(min, Math.min(max, newRatio));
    this.zone.run(() => this.horizontalRatio.set(newRatio));
  };

  showPreview(kind: 'user' | 'solution' = 'user') {
    let full: string | null = null;

    if (kind === 'solution') {
      const q = this.question(); if (!q) return;
      const sol = this.getWebSolutions(q);
      const html = this.unescapeJsLiterals(sol.html || '');
      const css = this.prettifyCss(this.unescapeJsLiterals(sol.css || ''));
      full = this.buildWebPreviewDoc(html, css);
    } else {
      // From editors (what you see in the live pane)
      full = this.previewDocRaw();
    }

    if (!full) return;

    try { if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl); } catch { }
    const blob = new Blob([full], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    this.previewObjectUrl = url;
    this.previewOnlyUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.previewVisible = true;
  }

  closePreview() {
    this.previewVisible = false;
    setTimeout(() => {
      try { if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl); } catch { }
      this.previewObjectUrl = null;
      this.previewOnlyUrl = null;
    }, 200);
  }

  openPreview() {
    if (!this.lastPreviewHtml) return;
    try { if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl); } catch { }
    const blob = new Blob([this.lastPreviewHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    this.previewObjectUrl = url;
    this.previewOnlyUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.previewVisible = true;
  }

  // Replace the right preview with the official solution (no modal)
  openSolutionPreview() {
    const q = this.question(); if (!q || !this.isWebTech()) return;
    const sol = this.getWebSolutions(q);
    const html = this.unescapeJsLiterals(sol.html || '');
    const css = this.prettifyCss(this.unescapeJsLiterals(sol.css || ''));
    const full = this.buildWebPreviewDoc(html, css);

    // 🔁 Paint the right-side iframe
    this.setPreviewHtml(full);

    // UI flag + make sure the top area is on the Preview tab
    this.showingSolutionPreview = true;
    this.previewTopTab.set('preview');
  }

  // Go back to the user’s code in the right preview
  closeSolutionPreview() {
    // 🔁 Rebuild from current editor code
    this.scheduleWebPreview();

    this.showingSolutionPreview = false;
  }


  // ---------- reset ----------
  async resetQuestion() {
    const q = this.question();
    if (!q || this.resetting()) return;

    this.resetting.set(true);
    try {
      if (this.isFrameworkTech()) {
        const storageKey = this.tech === 'angular' ? getNgStorageKey(q) : getReactStorageKey(q);
        try { localStorage.removeItem(storageKey); } catch { }
        await this.loadQuestion(q.id);
      } else if (this.isWebTech()) {
        const starters = this.getWebStarters(q);
        try { localStorage.removeItem(this.webKey(q, 'html')); } catch { }
        try { localStorage.removeItem(this.webKey(q, 'css')); } catch { }

        // Reset to starter code
        this.htmlCode.set(starters.html);
        this.cssCode.set(starters.css);

        // ✅ Rebuild preview from fresh starter HTML/CSS
        this.scheduleWebPreview();
      } else {
        // JS/TS — clear saved state and restore baseline from starters
        // JS/TS — delegate to service, then re-init the child panel
        this.jsPanel?.resetToDefault?.();
        this.jsPanel?.initFromQuestion();
      }

      // common cleanup
      this.consoleEntries.set([]);
      this.testResults.set([]);
      this.hasRunTests = false;
      this.solved.set(false);
      this.clearSolvedFlag(q);
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

  copySolutionCode() {
    const code = this.solutionCodeFor(this.getActiveJsLang()) || '';
    if (!code.trim()) {
      console.warn('No solution code to copy.');
      return;
    }
    navigator.clipboard
      .writeText(code)
      .then(() => {
        this.copiedExamples.set(true);
        setTimeout(() => this.copiedExamples.set(false), 1200);
      })
      .catch((e) => console.error('Clipboard write failed', e));
  }

  goToCustomTests(e?: Event) { if (e) e.preventDefault(); this.topTab.set('tests'); this.subTab.set('tests'); }

  loadSolutionCode() {
    const q = this.question(); if (!q || this.isWebTech()) return;

    const lang = this.getActiveJsLang();        // <-- live value at click time
    const s = this.structuredSolution();
    const first = s?.approaches?.[0];

    let value = '';

    if (first) {
      value = (lang === 'ts')
        ? (first.codeTs ?? '')
        : (first.codeJs ?? '');
    }

    if (!value?.trim()) {
      const block = this.solutionInfo();
      value = (lang === 'ts')
        ? (block.codeTs ?? '')
        : (block.codeJs ?? '');
    }

    if (!value?.trim()) return;

    if (!this.isFrameworkTech()) {
      // child will also TS→JS transpile when current tab is JS
      this.jsPanel?.applySolution(value);
      this.topTab.set('code');
      return;
    }

    // frameworks unchanged
    this.editorContent.set(value);
  }

  private solutionCodeFor(lang: 'js' | 'ts'): string {
    const s = this.structuredSolution();
    const first = s?.approaches?.[0];
    if (first) return lang === 'ts' ? (first.codeTs ?? '') : (first.codeJs ?? '');
    const legacy = this.solutionInfo();
    return (lang === 'ts' && (legacy.codeTs?.trim()?.length)) ? legacy.codeTs : legacy.codeJs;
  }

  cancelSolutionReveal() {
    this.showSolutionWarning.set(false);
    this.activePanel.set(0);
  }

  onChildLang(v: 'js' | 'ts') {
    this.currentJsLang.set(v);
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
  isFrameworkTech(): boolean { return this.tech === 'angular' || this.tech === 'react' || this.tech === 'vue'; }

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
    this.rebuildTimer = setTimeout(() => {
      // guard so preview errors never take down the app
      this.rebuildFrameworkPreview().catch(err => {
        console.error('rebuild failed', err);
        this.setPreviewHtml(null);
      });
    }, 200);
  }

  // --- WEB (html/css) preview rebuild (debounced, unified with frameworks) ---
  private webPreviewTimer: any = null;

  private scheduleWebPreview() {
    if (!this.isWebTech()) return;
    if (this.webPreviewTimer) clearTimeout(this.webPreviewTimer);
    this.webPreviewTimer = setTimeout(() => {
      try {
        const htmlDoc = this.previewDocRaw();  // already unescapes HTML
        this.setPreviewHtml(htmlDoc);          // ✅ reuse blob URL mechanism
      } catch (e) {
        console.error('web preview build failed', e);
        this.setPreviewHtml(null);
      }
    }, 120);
  }

  private remountEditor() {
    this.showEditor.set(false);
    setTimeout(() => this.showEditor.set(true), 0);
  }

  /** Rebuilds the preview iframe for framework techs using the saved files */
  /** Rebuilds the preview iframe for framework techs (safe) */
  async rebuildFrameworkPreview() {
    try {
      const files = this.filesMap();

      if (this.tech === 'react') {
        const html = makeReactPreviewHtml(files);
        this.setPreviewHtml(html);
        return;
      }

      if (this.tech === 'angular') {
        const html = makeAngularPreviewHtmlV1(files);
        this.setPreviewHtml(html);
        return;
      }

      if (this.tech === 'vue') {
        const html = makeVuePreviewHtml(this.filesMap());
        this.setPreviewHtml(html);
        return;
      }

      // Fallback for plain index.html
      const html = files['index.html'] || files['public/index.html'] || '';
      this.setPreviewHtml(html || null);
    } catch (e) {
      console.error('preview build failed', e);
      this.setPreviewHtml(null);
    }
  }

  private setPreviewHtml(html: string | null) {
    this.lastPreviewHtml = html;

    // cleanup old URL
    try { if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl); } catch { }
    this.previewObjectUrl = null;

    const frameEl = this.previewFrame?.nativeElement;

    // If the iframe isn’t in the view yet, try once on the next frame and bail.
    if (!frameEl) {
      requestAnimationFrame(() => {
        const f = this.previewFrame?.nativeElement;
        if (f) this.setPreviewHtml(html); // one-shot retry
      });
      return;
    }

    // Empty -> clear content
    if (!html) {
      const doc = frameEl.contentDocument;
      if (doc) { doc.open(); doc.write('<!doctype html><meta charset="utf-8">'); doc.close(); }
      return;
    }

    // Build blob URL & load
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    this.previewObjectUrl = url;

    // First mount: if no document yet, set src so the frame initializes,
    // then subsequent updates use location.replace (no history bloat).
    const cw = frameEl.contentWindow;
    if (cw) {
      cw.location.replace(url);
    } else {
      frameEl.onload = () => frameEl.contentWindow?.location.replace(url);
      frameEl.setAttribute('src', url);
    }
  }

  isOpen = (p: string) => this.openDirs().has(p);
  toggleDir(p: string) {
    const s = new Set(this.openDirs());
    if (s.has(p)) s.delete(p); else s.add(p);
    this.openDirs.set(s);
  }

  private buildTree(paths: string[]): TreeNode[] {
    // build a trie
    const root: Record<string, any> = {};
    for (const full of paths) {
      const parts = full.split('/').filter(Boolean);
      let cur = root;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;
        cur[part] = cur[part] || (isFile ? { __file: full } : { __dir: true });
        cur = isFile ? cur : cur[part];
      }
    }

    const toNodes = (node: any, prefix: string): TreeNode[] => {
      const dirs: TreeNode[] = [];
      const files: TreeNode[] = [];

      for (const key of Object.keys(node).sort()) {
        const v = node[key];
        if (v?.__dir) {
          const path = prefix ? `${prefix}/${key}` : key;
          dirs.push({ type: 'dir', name: key, path, children: toNodes(v, path) });
        } else if (v?.__file) {
          const full = v.__file as string;
          const name = key;
          // optional crumb (parent dirs) for context on similarly named files
          const crumb = prefix || '';
          files.push({ type: 'file', name, path: full, crumb });
        }
      }

      // folders first, then files
      return [...dirs, ...files];
    };

    return toNodes(root, '');
  }

  // Tree roots computed from your existing file list
  treeRoots = computed<TreeNode[]>(() => this.buildTree(this.fileList()));

  /** Open all directory paths derived from the file list */
  private openAllDirsFromPaths(paths: string[]) {
    const opened = new Set(this.openDirs());
    for (const full of paths) {
      const parts = full.split('/').filter(Boolean);
      let pref = '';
      // open every parent directory for this file
      for (let i = 0; i < parts.length - 1; i++) {
        pref = pref ? `${pref}/${parts[i]}` : parts[i];
        opened.add(pref);
      }
    }
    this.openDirs.set(opened);
  }

  // ---- Description normalizers ----
  descSummary = computed(() => {
    const q = this.question(); if (!q) return '';
    if (q.description && typeof q.description === 'object') {
      return (q.description as StructuredDescription).summary || '';
    }
    // fallback to plain description (what you already had)
    return this.descriptionText(); // uses your existing helper
  });

  descArgs = computed(() => {
    const q = this.question(); if (!q) return [] as Array<{ name: string; type?: string; desc?: string }>;
    if (q.description && typeof q.description === 'object') {
      return (q.description as StructuredDescription).arguments || [];
    }
    return [];
  });

  descReturns = computed(() => {
    const q = this.question(); if (!q) return null as null | { type?: string; desc?: string };
    if (q.description && typeof q.description === 'object') {
      return (q.description as StructuredDescription).returns || null;
    }
    return null;
  });

  // keep your existing descriptionExamples()/combinedExamples()

  // ---- Solution normalizer ----
  solutionInfo = computed(() => {
    const q = this.question(); if (!q) return { explanation: '', codeJs: '', codeTs: '' };
    const block = (q as any).solutionBlock as { explanation?: string; codeJs?: string; codeTs?: string } | undefined;

    // preferred: solutionBlock
    if (block) {
      return {
        explanation: block.explanation || (q.solution || ''),
        codeJs: block.codeJs || (q.solution ?? ''),   // fallback to legacy strings
        codeTs: block.codeTs || (q as any).solutionTs || ''
      };
    }

    // legacy: use solution as code/explanation best-effort
    return {
      explanation: (q.solution && /\w/.test(q.solution) ? q.solution : ''),
      codeJs: (q as any).solution || '',
      codeTs: (q as any).solutionTs || ''
    };
  });

  // NORMALIZED access to the *new* structured solution (keeps legacy fallback)
  structuredSolution = computed<UFSolutionBlock>(() => {
    const q = this.question();
    const raw = (q as any)?.solutionBlock as UFSolutionBlock | undefined;

    // If a real structured block exists, return it
    if (raw && (raw.overview || raw.approaches || raw.notes || raw.followUp || raw.resources)) {
      return raw;
    }

    // Legacy JS/TS fallback (what you already had)
    const legacy = this.solutionInfo();

    // ✅ NEW: If this is an HTML/CSS challenge, fallback to web solution fields
    if (this.isWebTech()) {
      const web = this.getWebSolutions(q as any); // uses your existing helper
      if ((web.html && web.html.trim()) || (web.css && web.css.trim())) {
        return {
          overview: legacy.explanation,
          approaches: [{
            title: 'Approach 1: Official web solution',
            prose: 'Mapped from legacy web.solutionHtml / web.solutionCss fields.',
            codeHtml: web.html,
            codeCss: web.css
          }]
        };
      }
    }

    // Default (legacy JS/TS)
    return {
      overview: legacy.explanation,
      approaches: [{
        title: 'Approach 1: Reference implementation',
        prose: 'Baseline solution from legacy fields.',
        codeJs: legacy.codeJs,
        codeTs: legacy.codeTs
      }]
    };
  });

  // Convenience getters for template
  approaches = computed<UFApproach[]>(() => {
    const arr = this.structuredSolution()?.approaches ?? [];
    // Map to prettified copies for display
    return arr.map(ap => ({
      ...ap,
      codeHtml: this.prettifyHtml(this.unescapeJsLiterals(ap.codeHtml ?? '')),
      codeCss: this.prettifyCss(this.unescapeJsLiterals(ap.codeCss ?? '')),
      // keep JS/TS as-is
      codeJs: ap.codeJs,
      codeTs: ap.codeTs,
    }));
  });

  hasAnyNotes = computed<boolean>(() => {
    const n = this.structuredSolution()?.notes;
    return !!(n && ((n.pitfalls?.length ?? 0) + (n.edgeCases?.length ?? 0) + (n.techniques?.length ?? 0)));
  });

  // Pick code for current lang
  codeFor(ap: UFApproach): string {
    return this.currentJsLang() === 'ts'
      ? (ap.codeTs ?? '')
      : (ap.codeJs ?? '');
  }

  // Load one approach directly into the editor (doesn't switch tabs)
  loadApproach(ap: UFApproach) {
    if (this.isWebTech()) {
      const html = this.prettifyHtml(this.unescapeJsLiterals(ap.codeHtml ?? ''));
      const css = this.prettifyCss(this.unescapeJsLiterals(ap.codeCss ?? ''));

      this.htmlCode.set(html);
      this.cssCode.set(css);
      this.topTab.set('html');
      this.scheduleWebPreview();

      const q = this.question();
      if (q) {
        try { localStorage.setItem(this.webKey(q, 'html'), html); } catch { }
        try { localStorage.setItem(this.webKey(q, 'css'), css); } catch { }
      }
      return;
    }

    // JS/TS & frameworks (unchanged)
    const lang = this.getActiveJsLang();
    const code = lang === 'ts' ? (ap.codeTs ?? '') : (ap.codeJs ?? '');
    if (!code?.trim()) return;

    if (!this.isFrameworkTech()) {
      this.jsPanel?.setCode(code);
      this.topTab.set('code');
      return;
    }

    this.editorContent.set(code);
  }

  // Tiny copier (you already have copySolutionCode for the legacy case)
  async copyText(text: string) {
    try { await navigator.clipboard.writeText(text ?? ''); } catch { }
  }

  // Render markdown-lite to safe HTML using your existing explanation parser
  md(s?: string): SafeHtml {
    return this.explanationToHtml(s ?? '');
  }

  // Convenience for showing the code in the Solution tab in the current JS/TS choice
  solutionCodeForCurrentLang = computed(() => {
    const s = this.structuredSolution();
    const first = (s?.approaches && s.approaches[0]) || null;
    if (first) return this.codeFor(first);

    // fallback to legacy single block
    const legacy = this.solutionInfo();
    return this.currentJsLang() === 'ts' && (legacy.codeTs?.trim()?.length)
      ? legacy.codeTs
      : legacy.codeJs;
  });

  onSolutionTabClick() {
    if (this.descCollapsed()) this.toggleDescription();
    this.activePanel.set(1);
    // Only warn when it makes sense (course context, etc.)
    if (this.shouldWarnForSolution()) {
      this.showSolutionWarning.set(true);
    } else {
      this.showSolutionWarning.set(false);
    }
  }

  // “View solution” from the warning — don’t overwrite code.
  confirmSolutionReveal() {
    this.showSolutionWarning.set(false);
    this.activePanel.set(1); // shows read-only solution panel
  }

  // Keep a dedicated overwrite action
  loadSolutionIntoEditor() {
    this.loadSolutionCode(); // your existing method that writes into the editor
  }

  /** Keep only the first line of an error/stack */
  private shortStack(value: any): string {
    const raw =
      (value && typeof value.stack === 'string') ? value.stack :
        (value && typeof value.message === 'string') ? value.message :
          String(value);
    const first = raw.split('\n')[0]?.trim() || raw;
    // Normalise leading "Stack:" formatting
    return first.replace(/^Stack:\s*/i, '');
  }

  /** Normalise console messages (shorten stacks on errors) */
  private normaliseConsoleMessage(level: 'log' | 'info' | 'warn' | 'error', msg: string): string {
    if (level === 'error') {
      const first = msg.split('\n')[0]?.trim() || msg;
      // If the message already starts with "ReferenceError: ..." (or similar), keep just that line
      return first;
    }
    return msg;
  }

  // Turn "### Heading" into bold titles and strip emoji bullets.
  // Also wrap inline `code` in <code>. Returns SafeHtml for [innerHTML].
  private explanationToHtml(raw: string): SafeHtml {
    if (!raw || !raw.trim()) {
      return this.sanitizer.bypassSecurityTrustHtml('<p class="sol-p">No explanation provided.</p>');
    }

    // Decode any HTML entities that may have been double-escaped
    raw = this.decodeHtmlEntities(raw);

    // Best-effort strip of emoji pictographs (optional)
    try { raw = raw.replace(/[\p{Extended_Pictographic}\u2600-\u27BF]/gu, ''); } catch { /* ignore */ }

    const lines = raw.replace(/\r\n?/g, '\n').split('\n');

    const escapeHtml = (t: string) =>
      t.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

    // Renders inline `code` spans safely
    const renderInline = (t: string) => {
      let out = '';
      let last = 0;
      const re = /`([^`]+)`/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(t))) {
        out += escapeHtml(t.slice(last, m.index));         // text before code
        out += `<code>${escapeHtml(m[1])}</code>`;         // code content
        last = re.lastIndex;
      }
      out += escapeHtml(t.slice(last));                    // tail
      return out;
    };

    let html = '';
    let inUl = false;
    let inOl = false;

    const closeLists = () => {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
    };

    for (const rawLine of lines) {
      const line = rawLine.trimRight();

      // blank line -> break paragraph/list
      if (!line.trim()) { closeLists(); continue; }

      // "### Heading"
      const mH3 = /^###\s*(.+)$/.exec(line);
      if (mH3) {
        closeLists();
        html += `<h3 class="sol-h3">${escapeHtml(mH3[1])}</h3>`;
        continue;
      }

      // ordered list: "1. Something"
      const mOl = /^\d+\.\s+(.+)$/.exec(line);
      if (mOl) {
        if (inUl) { html += '</ul>'; inUl = false; }
        if (!inOl) { html += '<ol class="sol-ol">'; inOl = true; }
        html += `<li>${renderInline(mOl[1])}</li>`;
        continue;
      }

      // unordered list: "- Something"
      const mUl = /^-\s+(.+)$/.exec(line);
      if (mUl) {
        if (inOl) { html += '</ol>'; inOl = false; }
        if (!inUl) { html += '<ul class="sol-ul">'; inUl = true; }
        html += `<li>${renderInline(mUl[1])}</li>`;
        continue;
      }

      // plain paragraph
      closeLists();
      html += `<p class="sol-p">${renderInline(line.trim())}</p>`;
    }

    closeLists();
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  // Add once in the component (top-level private helper is fine)
  private decodeHtmlEntities(s: string): string {
    // Fast path for common entities (works even if double-escaped)
    s = s
      .replace(/&amp;(?=lt;|gt;|amp;|quot;|#39;)/g, '&') // &amp;lt; -> &lt; (etc.)
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');
    return s;
  }

  // Computed value you can bind to
  solutionExplanationHtml = computed(() =>
    this.explanationToHtml(this.solutionInfo().explanation || '')
  );

  onCopyApproach(i: number, code: string) {
    navigator.clipboard.writeText(code).catch(() => { });
    this.copiedIdx = i;
    clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => (this.copiedIdx = null), 1200);
  }

  /** Normalize follow-up refs: accept ["id","id2"] or [{id:"id"}] */
  private normalizeFollowUpRefs(
    list: UFFollowUpRef[] | undefined
  ): { id: string }[] {
    const arr = Array.isArray(list) ? list : [];
    return arr
      .map((it) => (typeof it === 'string' ? { id: it } : it))
      .filter((it) => typeof it.id === 'string' && it.id.trim().length > 0);
  }

  /** Find a question object by id from the loaded bank */
  private findQuestionById(id: string): Question | undefined {
    return (this.allQuestions || []).find(q => (q as any).id === id);
  }

  /** Simple, explicit follow-ups: resolve to {title, difficulty, link} and cap to 2 */
  followUpItems = computed(() => {
    const q = this.question();
    if (!q) return [] as Array<{ id: string; title: string; difficulty: string; to: any[] }>;

    const s = this.structuredSolution();
    const explicit = this.normalizeFollowUpRefs(s?.followUpQuestions).slice(0, 2);

    return explicit
      .map(({ id }) => {
        const target = this.findQuestionById(id);
        if (!target) return null;
        const title = (target as any).title || id;
        const difficulty = String((target as any).difficulty || '').replace(/^\s*$/, '');
        const to = ['/', (target as any).technology ?? this.tech, (target as any).type ?? this.kind, id];
        return { id, title, difficulty, to };
      })
      .filter(Boolean) as Array<{ id: string; title: string; difficulty: string; to: any[] }>;
  });

  // ---------- child outputs ----------
  onChildSolved = (v: boolean) => {
    this.solved.set(v);
    const q = this.question();
    if (!q) return;

    this.saveSolvedFlag(q, v);

    // If the panel ran tests directly (its own Run button), also handle crediting here.
    if (v) {
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
    }
  };

  onChildResults = (results: TestResult[]) => {
    this.testResults.set(results);
  };

  onChildConsole = (entries: ConsoleEntry[]) => {
    this.consoleEntries.set(entries);
  };

  onChildCode = (payload: { lang: 'js' | 'ts'; code: string }) => {
    this.currentJsLang.set(payload.lang);
  };

  /** Turn "\n", "\t", "\r" etc. into real characters. Leaves normal text alone. */
  public unescapeJsLiterals(s: string | null | undefined): string {
    if (!s) return '';
    // Fast path: if no backslash-n/t/r, skip work
    if (!/[\\][nrt\\'"]/.test(s)) return s;
    return s
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }

  public prettifyHtml(html: string): string {
    if (!html) return '';

    // Fast bail-out for already indented multi-line code blocks
    const hasLinebreaks = /\n/.test(html);
    const src = hasLinebreaks ? html : html.replace(/>\s+</g, '><'); // collapse internal whitespace if one-liner

    // Tokenize tags vs text
    const tokens: string[] = [];
    const re = /(<[^>]+>|[^<]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) tokens.push(m[0]);

    // HTML voids that don’t change indent
    const voids = new Set([
      'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
      'meta', 'param', 'source', 'track', 'wbr'
    ]);

    // Tags whose inner text should not be reflowed/indented
    const rawBlocks = new Set(['pre', 'code', 'textarea', 'script', 'style']);

    let out: string[] = [];
    let indent = 0;
    const step = '  '; // 2 spaces
    let inRaw: string | null = null;

    const openTagName = (t: string) => {
      const m = /^<\s*([a-zA-Z0-9:-]+)/.exec(t);
      return m ? m[1].toLowerCase() : '';
    };

    const closeTagName = (t: string) => {
      const m = /^<\s*\/\s*([a-zA-Z0-9:-]+)/.exec(t);
      return m ? m[1].toLowerCase() : '';
    };

    for (const t of tokens) {
      if (inRaw) {
        out.push(t); // keep raw content as-is
        if (t.toLowerCase().includes(`</${inRaw}>`)) inRaw = null;
        continue;
      }

      if (t.startsWith('<')) {
        const isClose = /^<\s*\//.test(t);
        const isSelfClose = /\/\s*>$/.test(t);
        const name = isClose ? closeTagName(t) : openTagName(t);

        // Closing tag -> outdent first
        if (isClose) indent = Math.max(0, indent - 1);

        // Decide line prefix
        out.push(step.repeat(indent) + t.trim());

        // Opening tag (not self-close/void) increases indent
        if (!isClose && !isSelfClose && !voids.has(name)) {
          // Raw blocks: switch to passthrough until we meet their close tag
          if (rawBlocks.has(name)) {
            inRaw = name;
          } else {
            indent++;
          }
        }
      } else {
        // Text node
        const txt = t.replace(/\s+/g, ' ').trim();
        if (txt) out.push(step.repeat(indent) + txt);
      }
    }

    // Join and ensure one newline between blocks
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  // Add this helper near other helpers
  private buildWebPreviewDoc(userHtml: string, css: string): string {
    const html = (userHtml || '').trim();
    const cssBlock = (css || '').trim();
    const isFullDoc = /<!doctype\s+html/i.test(html) || /<html[\s>]/i.test(html);

    if (isFullDoc) {
      if (!cssBlock) return html;

      // has <head>? inject <style> inside; else create one
      if (/<head[\s>]/i.test(html)) {
        return html.replace(/<head([^>]*)>/i, (_m, attrs) => `<head${attrs}>\n<style>\n${cssBlock}\n</style>`);
      }
      // no <head>, try to put one after <html …>
      if (/<html[^>]*>/i.test(html)) {
        return html.replace(/<html([^>]*)>/i,
          (_m, attrs) => `<html${attrs}>\n<head><style>\n${cssBlock}\n</style></head>`);
      }
      // fallback (very unlikely)
      return `<!doctype html><html><head><style>${cssBlock}</style></head><body>${html}</body></html>`;
    }

    // Not a full doc: wrap like before
    return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root { color-scheme: light }
  * { box-sizing: border-box }
  html,body { height: 100%; background:#fff; color:#111; }
  body { margin:16px; font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial; }
  ${cssBlock}
</style></head><body>${html}</body></html>`;
  }

  // Place near other private helpers
  private async mountScratchDoc(html: string): Promise<{ frame: HTMLIFrameElement; doc: Document; win: Window }> {
    const frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    frame.style.cssText = 'position:fixed;left:-10000px;top:-10000px;width:0;height:0;border:0;visibility:hidden;';
    document.body.appendChild(frame);

    const doc = frame.contentDocument as Document;
    doc.open();
    doc.write(html);
    doc.close();

    await new Promise<void>((res) => {
      if (doc.readyState === 'complete' || doc.readyState === 'interactive') res();
      else doc.addEventListener('DOMContentLoaded', () => res(), { once: true });
    });

    const win = frame.contentWindow as Window;
    return { frame, doc, win };
  }
} 