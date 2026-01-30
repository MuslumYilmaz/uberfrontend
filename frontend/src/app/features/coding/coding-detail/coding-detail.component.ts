// coding-detail.component.ts
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { filter, Subject, Subscription } from 'rxjs';

import type { Question, StructuredDescription } from '../../../core/models/question.model';
import { isQuestionLockedForTier } from '../../../core/models/question.model';
import { buildLockedPreviewForCoding, LockedPreviewData } from '../../../core/utils/locked-preview.util';
import { CodeStorageService } from '../../../core/services/code-storage.service';
import { QuestionService } from '../../../core/services/question.service';
import { MonacoEditorComponent } from '../../../monaco-editor.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { LockedPreviewComponent } from '../../../shared/components/locked-preview/locked-preview.component';
import { ConsoleEntry, ConsoleLoggerComponent, TestResult } from '../console-logger/console-logger.component';

import type { Tech } from '../../../core/models/user.model';
import { ActivityService } from '../../../core/services/activity.service';
import { AuthService } from '../../../core/services/auth.service';
import { DailyService } from '../../../core/services/daily.service';
import { QuestionDetailResolved } from '../../../core/resolvers/question-detail.resolver';
import { SEO_SUPPRESS_TOKEN } from '../../../core/services/seo-context';
import { SeoService } from '../../../core/services/seo.service';
import { UserProgressService } from '../../../core/services/user-progress.service';
import { writeHtmlToIframe } from '../../../core/utils/iframe-preview.util';
import { fetchSdkAsset, resolveSolutionFiles } from '../../../core/utils/solution-asset.util';
import { PreviewBuilderService } from '../../../core/services/preview-builder.service';
import { LoginRequiredDialogComponent } from '../../../shared/components/login-required-dialog/login-required-dialog.component';
import { SafeHtmlPipe } from '../../../core/pipes/safe-html.pipe';
import { CodingFrameworkPanelComponent } from './coding-framework-panel/coding-framework-panel';
import { CodingJsPanelComponent, JsLang } from './coding-js-panel/coding-js-panel.component';
import { CodingWebPanelComponent } from './coding-web-panel/coding-web-panel.component';

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

type TreeNode =
  | { type: 'dir'; name: string; path: string; children: TreeNode[] }
  | { type: 'file'; name: string; path: string; crumb?: string };

// --- Solution (structured) ---
type FAApproach = {
  title: string;
  prose?: string;
  codeJs?: string;
  codeTs?: string;
  codeHtml?: string;
  codeCss?: string;
};

type FAFollowUpRef = string | { id: string };

type FASolutionBlock = {
  overview?: string;
  approaches?: FAApproach[];
  notes?: { pitfalls?: string[]; edgeCases?: string[]; techniques?: string[] };
  followUp?: string[];
  followUpQuestions?: FAFollowUpRef[];
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
    MonacoEditorComponent, ConsoleLoggerComponent, FooterComponent,
    CodingJsPanelComponent, CodingWebPanelComponent, CodingFrameworkPanelComponent,
    LockedPreviewComponent,
    LoginRequiredDialogComponent,
    SafeHtmlPipe,
  ],
  templateUrl: './coding-detail.component.html',
  styleUrls: ['./coding-detail.component.css'],
})
export class CodingDetailComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() questionId: string | null = null;
  @Input() questionTech: Tech = 'javascript';
  @Input() demoMode = false;
  @Input() liteMode = false;
  @Input() storageKeyOverride: string | null = null;
  @Input() hideRestoreBanner = false;
  @Input() hideFooterBar = false;
  @Input() footerLinkLabel = 'Open in full workspace';
  @Input() footerLinkTo: any[] | string | null = null;
  @Input() disablePersistence = false;
  private readonly suppressSeo = inject(SEO_SUPPRESS_TOKEN);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly previewBuilder = inject(PreviewBuilderService);

  tech!: Tech;
  kind: Kind = 'coding';
  question = signal<Question | null>(null);
  loadState = signal<'loading' | 'loaded' | 'notFound'>('loading');
  private dataLoaded = false;
  liteEditors = signal(false);
  litePreloadActive = signal(false);
  private liteUpgradeScheduled = false;
  private liteUpgradeTimer?: number;
  private liteReadyPollTimer?: number;
  private liteReadyAttempts = 0;

  // JS/TS editor + tests
  editorContent = signal<string>('');
  testCode = signal<string>('');
  frameworkEntryFile = '';

  private openDirs = signal<Set<string>>(new Set());

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

  private previewObjectUrl: string | null = null;
  private destroy$ = new Subject<void>();
  private lastPreviewHtml: string | null = null;
  private routeParamSub?: Subscription;
  private routeDataSub?: Subscription;

  allQuestions: Question[] = [];
  currentIndex = 0;

  // Results + console
  testResults = signal<TestResult[]>([]);
  consoleEntries = signal<ConsoleEntry[]>([]);
  hasRunTests = false;

  // Course breadcrumb + nav
  courseNav = signal<CourseNavState>(null);
  returnLabel = signal<string | null>(null);
  private returnTo: any[] | null = null;      // old array-based navigation
  private returnToUrl: string | null = null;  // 🔹 new: full URL for global/company lists


  copiedIdx: number | null = null;
  private copyTimer?: any;

  // Practice session
  private practice: PracticeSession = null;

  // Solution warning
  showSolutionWarning = signal(false);
  private readonly SOLUTION_WARN_SKIP_KEY = 'fa:coding:skipSolutionWarning';

  // Solved persistence
  solved = signal(false);
  locked = computed(() => {
    const q = this.question();
    const user = this.auth.user();
    return q ? isQuestionLockedForTier(q, user) : false;
  });
  lockedTitle = computed(() => this.question()?.title || 'Premium question');
  lockedSummary = computed(() => {
    const q = this.question();
    if (!q) return '';
    const raw = this.descriptionText();
    const fallback = this.questionDescription(q);
    const normalized = this.normalizePreviewText(raw || fallback);
    return this.trimWords(normalized, 45);
  });
  lockedBullets = computed(() => {
    const requirements = this.descSpecs()?.requirements ?? [];
    return requirements
      .filter((item): item is string => Boolean(item))
      .map((item) => this.trimWords(this.normalizePreviewText(item), 12))
      .filter((item) => item.length > 0)
      .slice(0, 2);
  });
  lockedPreview = computed<LockedPreviewData | null>(() => {
    const q = this.question();
    if (!q) return null;
    return buildLockedPreviewForCoding(q, {
      candidates: this.allQuestions as any,
      tech: this.tech,
      kind: 'coding',
    });
  });

  // ✅ UI solved: only true when authenticated
  uiSolved = computed(() => this.auth.isLoggedIn() && this.solved());

  descSpecs = computed(() => {
    const q = this.question();
    if (!q || !q.description || typeof q.description !== 'object') return null;

    const d = q.description as any;
    const specs = d.specs || null;

    if (!specs) return null;

    return {
      requirements: specs.requirements as string[] | undefined,
      expectedBehavior: specs.expectedBehavior as string[] | undefined,
      implementationNotes: specs.implementationNotes as string[] | undefined,
      techFocus: specs.techFocus as string[] | undefined,
    };
  });

  // --- Solution files (read-only, GreatFrontEnd-style) ---
  solutionFilesMap = signal<Record<string, string>>({});
  solutionOpenPath = signal<string>('');

  // sorted list of solution file paths
  solutionFileList = computed(() => {
    const files = this.solutionFilesMap();
    return Object.keys(files).sort((a, b) => {
      const da = a.split('/').length, db = b.split('/').length;
      if (da !== db) return da - db;
      return a.localeCompare(b);
    });
  });

  solutionCurrentPath = computed(() => {
    const list = this.solutionFileList();
    if (!list.length) return '';
    return this.solutionOpenPath() || list[0];
  });

  solutionCurrentFileLabel = computed(() => this.solutionShortName(this.solutionCurrentPath()));

  copiedSolutionFile = signal(false);
  private overflowPatched = false;

  @ViewChild('splitContainer', { read: ElementRef }) splitContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('previewFrame', { read: ElementRef }) previewFrame?: ElementRef<HTMLIFrameElement>;
  @ViewChild('previewSplit', { read: ElementRef }) previewSplit?: ElementRef<HTMLDivElement>;
  @ViewChild('jsPanel') jsPanel?: CodingJsPanelComponent;
  @ViewChild('webPanel') webPanel?: CodingWebPanelComponent;
  @ViewChild('frameworkPanel') frameworkPanel?: CodingFrameworkPanelComponent;

  // drag state
  private dragging = false;
  private startY = 0;
  private startRatio = 0;
  private draggingHorizontal = false;
  private startX = 0;
  private startRatioH = 0;
  private sessionStart = Date.now();
  private recorded = false;

  // Preview dialog (Angular)
  previewVisible = false;
  previewOnlyUrl: SafeResourceUrl | null = null;
  loginPromptOpen = false;

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

  submitLabel(): string {
    const canSave = this.auth.isLoggedIn();
    const solved = canSave && this.solved();

    if (this.isFrameworkTech() || this.isWebTech()) {
      return solved ? 'Mark as incomplete' : 'Mark as complete';
    }
    return solved ? 'Mark as incomplete' : 'Submit';
  }

  ensureAuthenticated(): boolean {
    if (this.auth.isLoggedIn()) return true;
    this.loginPromptOpen = true;
    return false;
  }

  goToLogin() {
    this.loginPromptOpen = false;
    this.router.navigate(['/auth/login']);
  }

  goToPricing() {
    this.router.navigate(['/pricing']);
  }

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

  // Framework-only: whether right preview is showing solution UI instead of user code
  showingFrameworkSolutionPreview = signal(false);

  isDraggingCols = signal(false);
  isDraggingRight = signal(false);
  showFileDrawer = signal(false);

  private draggingCols = false;
  private startXCols = 0;
  private startColsRatio = 0;

  private draggingPreview = false;
  private startYPreview = 0;
  private startPreviewRatio = 0;

  // backup before loading solution files so we can restore user code
  private userFilesBackup: Record<string, string> | null = null

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
    public router: Router,
    private qs: QuestionService,
    private sanitizer: DomSanitizer,
    private zone: NgZone,
    public codeStore: CodeStorageService,
    private daily: DailyService,
    private activity: ActivityService,
    private seo: SeoService,
    private http: HttpClient,
    private progress: UserProgressService,
    public auth: AuthService
  ) {
    this.codeStore.migrateAllJsToIndexedDbOnce().catch(() => { });

    effect(() => {
      const q = this.question();
      const solvedIds = this.progress.solvedIds();
      if (q) {
        this.solved.set(solvedIds.includes(q.id));
      }
    }, { allowSignalWrites: true });
  }

  // ---------- helpers ----------
  private static sortForPractice(a: Question, b: Question): number {
    const ia = Number((a as any).importance ?? 0);
    const ib = Number((b as any).importance ?? 0);
    if (ia !== ib) return ib - ia;
    return (a.title || '').localeCompare(b.title || '');
  }

  private collapseKey(q: Question) { return `fa:coding:descCollapsed:${this.tech}:${q.id}`; }
  private loadCollapsePref(q: Question) {
    if (!this.isBrowser) {
      this.descCollapsed.set(false);
      return;
    }
    try { this.descCollapsed.set(!!JSON.parse(localStorage.getItem(this.collapseKey(q)) || 'false')); }
    catch { this.descCollapsed.set(false); }
  }
  private saveCollapsePref(q: Question, v: boolean) {
    if (!this.isBrowser) return;
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

  private setInitialAsideWidth() {
    const initialAside =
      this.isWebTech() ? 0.35 :               // HTML/CSS: ~35% aside, 65% editors
        this.tech === 'javascript' ? 0.5 :     // JS: a bit wider spec area
          0.37;                                   // Frameworks: compact aside
    this.horizontalRatio.set(initialAside);
    this.lastAsideRatio = initialAside;
  }

  private hydrateReturnInfo() {
    const navState = this.router.getCurrentNavigation()?.extras?.state as any | undefined;
    const s = (navState ?? (this.isBrowser ? history.state : null)) as any;

    this.courseNav.set(s?.courseNav ?? null);
    this.practice = (s?.session ?? null) as PracticeSession;

    // 🔹 always capture URL-based return target if provided
    this.returnToUrl = typeof s?.returnToUrl === 'string' ? s.returnToUrl : null;

    if (s?.courseNav?.breadcrumb) {
      // Course context (keeps existing behaviour)
      this.returnTo = s.courseNav.breadcrumb.to;
      this.returnLabel.set(s.courseNav.breadcrumb.label ?? 'Back to course');
    } else if (s?.returnTo) {
      // Old array-based navigation (still supported)
      this.returnTo = s.returnTo as any[];
      this.returnLabel.set(s.returnLabel ?? 'Back');
    } else if (this.returnToUrl) {
      // 🔹 New: URL-only navigation (e.g. /coding?view=formats, /companies/google/all)
      this.returnTo = null;
      this.returnLabel.set(s?.returnLabel ?? null);
    } else {
      this.returnTo = null;
      this.returnToUrl = null;
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
    if (this.questionId) {
      this.initDirectQuestion();
    } else {
      const recompute = () => {
        this.hydrateReturnInfo();
        this.isCourseContext.set(this.computeIsCourseContext());
      };
      recompute();
      this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(recompute);

      // determine :tech and :kind
      this.routeDataSub = this.route.data.subscribe((data) => {
        const resolved = data['questionDetail'] as QuestionDetailResolved | undefined;
        if (resolved) {
          this.applyResolved(resolved);
          return;
        }

        if (this.routeParamSub) return;
        this.routeParamSub = this.route.paramMap.subscribe((pm) => {
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
          this.setInitialAsideWidth();

          const id = pm.get('id')!;
          this.qs.loadQuestions(this.tech, this.kind).subscribe((list) => {
            this.allQuestions = [...list].sort(CodingDetailComponent.sortForPractice);
            this.dataLoaded = true;
            this.loadQuestion(id);
          });
        });
      });
    }

    if (!this.demoMode && this.isBrowser) {
      document.body.style.overflow = 'hidden';
      this.overflowPatched = true;
    }

    this.configureLiteEditors();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['liteMode']) {
      this.configureLiteEditors();
    }
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

  private initDirectQuestion() {
    this.tech = (this.questionTech || 'javascript') as Tech;
    this.kind = 'coding';
    this.daily.ensureTodaySet(this.tech as any);
    this.setInitialAsideWidth();

    this.qs.loadQuestions(this.tech, this.kind).subscribe((list) => {
      this.allQuestions = [...list].sort(CodingDetailComponent.sortForPractice);
      this.dataLoaded = true;
      const preferred = this.questionId;
      const fallback = this.allQuestions[0]?.id;
      const resolvedId = preferred && this.allQuestions.some(q => q.id === preferred) ? preferred : fallback;
      if (resolvedId) this.loadQuestion(resolvedId);
    });
  }

  private applyResolved(resolved: QuestionDetailResolved) {
    this.tech = resolved.tech;
    this.kind = resolved.kind === 'debug' ? 'debug' : 'coding';
    this.daily.ensureTodaySet(this.tech as any);
    this.setInitialAsideWidth();
    this.allQuestions = [...(resolved.list || [])].sort(CodingDetailComponent.sortForPractice);
    this.dataLoaded = true;
    if (resolved.id) {
      this.loadQuestion(resolved.id);
    }
  }

  ngAfterViewInit() {
    if (!this.isBrowser) return;
    this.zone.runOutsideAngular(() => {
      window.addEventListener('pointermove', this.onPointerMove);
      window.addEventListener('pointerup', this.onPointerUp);
    });
  }

  ngOnDestroy() {
    this.routeParamSub?.unsubscribe();
    this.routeDataSub?.unsubscribe();
    if (this.isBrowser) {
      window.removeEventListener('pointermove', this.onPointerMove);
      window.removeEventListener('pointerup', this.onPointerUp);
    }
    clearTimeout(this.copyTimer);
    if (this.liteUpgradeTimer) clearTimeout(this.liteUpgradeTimer);
    if (this.liteReadyPollTimer) clearInterval(this.liteReadyPollTimer);

    this.destroy$.next();
    this.destroy$.complete();

    if (this.isBrowser && this.overflowPatched) {
      document.body.style.overflow = '';
    }

    if (this.demoMode || this.disablePersistence) {
      const key = this.storageKeyOverride || this.demoStorageKey(this.questionId || this.question()?.id || null);
      if (key) {
        if (this.isFrameworkTech()) {
          void this.codeStore.clearFrameworkAsync(this.tech as any, key);
        } else if (this.isWebTech()) {
          void this.codeStore.clearWebAsync(key);
        } else {
          void this.codeStore.clearJsAsync(key);
        }
      }
    }
  }

  private configureLiteEditors() {
    if (!this.isBrowser || !this.liteMode) {
      this.liteEditors.set(false);
      this.litePreloadActive.set(false);
      return;
    }
    this.liteEditors.set(true);
    this.litePreloadActive.set(false);
    if (!this.demoMode) {
      this.scheduleLiteUpgrade();
    }
  }

  private scheduleLiteUpgrade() {
    if (!this.isBrowser || this.liteUpgradeScheduled) return;
    this.liteUpgradeScheduled = true;
    const upgrade = () => {
      if (!this.liteMode) return;
      this.litePreloadActive.set(true);
      this.startMonacoReadyPolling();
    };
    if (typeof (window as any).requestIdleCallback === 'function') {
      (window as any).requestIdleCallback(upgrade, { timeout: 1200 });
    } else {
      this.liteUpgradeTimer = window.setTimeout(upgrade, 900);
    }
  }

  private startMonacoReadyPolling() {
    if (!this.isBrowser || this.liteReadyPollTimer) return;
    this.liteReadyAttempts = 0;
    this.liteReadyPollTimer = window.setInterval(() => {
      this.liteReadyAttempts += 1;
      if ((window as any).__faMonacoReady) {
        clearInterval(this.liteReadyPollTimer);
        this.liteReadyPollTimer = undefined;
        if (this.liteMode) {
          this.liteEditors.set(false);
          this.litePreloadActive.set(false);
        }
        return;
      }
      if (this.liteReadyAttempts > 80) {
        clearInterval(this.liteReadyPollTimer);
        this.liteReadyPollTimer = undefined;
      }
    }, 150);
  }

  // ---------- WEB (html/css) utilities ----------
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

  private questionDescription(q: Question): string {
    const raw = typeof q.description === 'string'
      ? q.description
      : (q.description as StructuredDescription)?.summary ?? '';

    const plain = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (plain) return plain;

    const tech = (q as any).tech ?? (q as any).technology ?? this.tech;
    return `Front-end ${this.kind} question for ${tech}.`;
  }

  private normalizePreviewText(text: string): string {
    return String(text || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/`+/g, '')
      .replace(/\*\*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private trimWords(text: string, maxWords: number): string {
    if (!text) return '';
    const words = text.split(/\s+/);
    if (words.length <= maxWords) return text;
    return `${words.slice(0, maxWords).join(' ')}…`;
  }

  private questionKeywords(q: Question): string[] {
    const tags = Array.isArray(q.tags) ? q.tags : [];
    const companies: string[] = (q as any).companies ?? (q as any).companyTags ?? [];
    const base = [
      'front end interview',
      `${this.tech} interview question`,
      `${this.kind} interview challenge`,
    ];

    return Array.from(
      new Set([...base, ...tags, ...companies, ...this.frameworkSeoKeywords()].map(k => String(k || '').trim()).filter(Boolean))
    );
  }

  private frameworkSeoModifier(): string | null {
    switch ((this.tech || '').toLowerCase()) {
      case 'react':
        return 'React-focused: hooks (useState/useEffect), props-driven components, and immutable updates.';
      case 'vue':
        return 'Vue-focused: refs/reactive state, computed/watch, and v-if/v-for directives.';
      case 'angular':
        return 'Angular-focused: standalone components, template bindings, and @Input/@Output patterns.';
      default:
        return null;
    }
  }

  private frameworkSeoKeywords(): string[] {
    switch ((this.tech || '').toLowerCase()) {
      case 'react':
        return ['react hooks', 'jsx components', 'react state'];
      case 'vue':
        return ['vue composition api', 'vue reactivity', 'single-file components'];
      case 'angular':
        return ['angular standalone components', 'rxjs', 'dependency injection'];
      default:
        return [];
    }
  }

  private resolveAuthor(q: Question): string {
    return String((q as any).author || 'FrontendAtlas Team').trim() || 'FrontendAtlas Team';
  }

  private resolveUpdatedIso(q: Question): string | null {
    const raw = (q as any).updatedAt;
    if (!raw) return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  authorLabel(q?: Question | null): string {
    if (!q) return 'FrontendAtlas Team';
    return this.resolveAuthor(q);
  }

  updatedLabel(q?: Question | null): string | null {
    if (!q) return null;
    const iso = this.resolveUpdatedIso(q);
    if (!iso) return null;
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  demoStorageKey(id?: string | null): string | null {
    if (!id) return null;
    return `showcase-demo:${id}`;
  }

  private updateSeoForQuestion(q: Question): void {
    if (this.demoMode || this.suppressSeo) return;
    const canonical = this.seo.buildCanonicalUrl(`/${this.tech}/${this.kind}/${q.id}`);
    let description = this.questionDescription(q);
    const modifier = this.frameworkSeoModifier();
    if (modifier && !description.toLowerCase().includes(modifier.toLowerCase())) {
      description = `${description} ${modifier}`;
    }
    const keywords = this.questionKeywords(q);
    const authorName = this.resolveAuthor(q);
    const dateModified = this.resolveUpdatedIso(q);

    const breadcrumb = {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'FrontendAtlas',
          item: this.seo.buildCanonicalUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Practice',
          item: this.seo.buildCanonicalUrl('/coding'),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: q.title,
          item: canonical,
        },
      ],
    };

    const article = {
      '@type': 'TechArticle',
      '@id': canonical,
      headline: q.title,
      description,
      mainEntityOfPage: canonical,
      inLanguage: 'en',
      author: { '@type': 'Organization', name: authorName },
      isAccessibleForFree: q.access !== 'premium',
      keywords: keywords.join(', '),
      ...(dateModified ? { dateModified } : {}),
    };

    const howTo = this.buildHowToSchema(q, canonical);
    const jsonLd = howTo ? [breadcrumb, article, howTo] : [breadcrumb, article];

    this.seo.updateTags({
      title: q.title,
      description,
      keywords,
      canonical,
      ogType: 'article',
      jsonLd,
    });
  }

  private buildHowToSchema(q: Question, canonical: string): Record<string, any> | null {
    // Avoid exposing premium solutions; keep steps derived from prompt-level fields only.
    const steps = this.buildHowToSteps(q);
    if (!steps.length) return null;

    return {
      '@type': 'HowTo',
      '@id': `${canonical}#howto`,
      name: q.title,
      description: this.questionDescription(q),
      inLanguage: 'en',
      step: steps.map((text, idx) => ({
        '@type': 'HowToStep',
        position: idx + 1,
        name: this.trimWords(text, 12),
        text,
      })),
    };
  }

  private buildHowToSteps(q: Question): string[] {
    const steps: string[] = [];
    const desc = q.description as any;
    const add = (value?: string) => {
      const normalized = this.normalizePreviewText(value || '');
      if (normalized) steps.push(normalized);
    };

    const summary = typeof desc === 'string'
      ? desc
      : (desc && typeof desc === 'object' ? (desc as StructuredDescription).summary || '' : '');
    add(summary);

    const specs = (desc && typeof desc === 'object') ? (desc as any).specs : null;
    if (specs) {
      const pushList = (items?: string[]) => {
        if (!Array.isArray(items)) return;
        items.forEach((item) => add(item));
      };
      pushList(specs.requirements);
      pushList(specs.expectedBehavior);
      pushList(specs.implementationNotes);
    } else if (desc && typeof desc === 'object') {
      const args = (desc as StructuredDescription).arguments || [];
      if (args.length) {
        add(`Inputs: ${args.map((a) => a.name).join(', ')}`);
      }
      const returns = (desc as StructuredDescription).returns;
      if (returns?.desc || returns?.type) {
        add(`Return: ${returns?.desc || returns?.type}`);
      }
    }

    const unique: string[] = [];
    const seen = new Set<string>();
    for (const s of steps) {
      const key = s.toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      unique.push(this.trimWords(s, 22));
    }

    return unique.slice(0, 8);
  }

  // ---------- Load question ----------
  private async loadQuestion(id: string) {
    this.loadState.set('loading');
    const idx = this.allQuestions.findIndex(q => q.id === id);
    if (idx < 0) {
      if (this.questionId && this.allQuestions.length) {
        const fallback = this.allQuestions[0].id;
        if (fallback && fallback !== id) {
          await this.loadQuestion(fallback);
          return;
        }
      } else if (this.isBrowser && this.dataLoaded) {
        this.loadState.set('notFound');
        this.router.navigateByUrl('/404', { state: { from: this.router.url } });
      }
      return;
    }

    this.currentIndex = idx;
    const q = this.allQuestions[idx];
    this.question.set(q);
    this.loadState.set('loaded');
    this.updateSeoForQuestion(q);

    // reset solution files for new question before loading
    this.solutionFilesMap.set({});
    this.solutionOpenPath.set('');

    if (!this.isBrowser) return;

    await this.loadSolutionAssetIfAny(q);

    // common flags
    this.solved.set(this.progress.isSolved(q.id));
    this.loadCollapsePref(q);
    let shouldShowBanner = false;

    // ---------- Frameworks (Angular/React/Vue) ----------
    if (this.isFrameworkTech()) {
      // Reset shared UI bits
      this.activePanel.set(0);
      this.subTab.set('tests');
      this.hasRunTests = false;
      this.testResults.set([]);
      this.consoleEntries.set([]);
      this.sessionStart = Date.now();
      this.recorded = false;

      // Let the dedicated panel bootstrap itself
      setTimeout(() => this.frameworkPanel?.initFromQuestion(), 0);
      return;
    }

    // ---------- HTML / CSS ----------
    if (this.isWebTech()) {
      const preferred = 0.28;
      this.horizontalRatio.set(preferred);
      this.lastAsideRatio = preferred;

      // Reset common UI
      this.topTab.set('tests'); // parent doesn't own HTML/CSS editors anymore
      this.activePanel.set(0);
      this.subTab.set('tests');
      this.hasRunTests = false;
      this.testResults.set([]);
      this.consoleEntries.set([]);
      this.sessionStart = Date.now();
      this.recorded = false;

      // Let the child own starters, storage, preview, tests
      setTimeout(() => this.webPanel?.initFromQuestion(), 0);
      return;
    }

    // ---------- Plain JS / TS ----------
    // Parent no longer touches starters/tests; the child panel + CodeStorageService own it.
    // Decide which language tab to show, then ask the child to init itself.
    const svcSaved = await this.codeStore.getJsAsync(q.id);
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
    this.sessionStart = Date.now();
    this.recorded = false;

    // Let the child pull everything it needs (starters, tests, baselines) from the service/question.
    // If the child isn't mounted yet, setTimeout defers until after view init.
    setTimeout(() => this.jsPanel?.initFromQuestion(), 0);
  }


  private async loadSolutionAssetIfAny(q: Question): Promise<void> {
    const assetPath = (q as any).solutionAsset as string | undefined;

    if (!assetPath) {
      this.solutionFilesMap.set({});
      this.solutionOpenPath.set('');
      return;
    }

    try {
      const raw = await fetchSdkAsset(this.http, assetPath);
      const { files, initialPath } = resolveSolutionFiles(raw);

      if (!Object.keys(files).length) {
        this.solutionFilesMap.set({});
        this.solutionOpenPath.set('');
        return;
      }

      this.solutionFilesMap.set(files);
      this.solutionOpenPath.set(initialPath);
    } catch (err) {
      this.solutionFilesMap.set({});
      this.solutionOpenPath.set('');
    }
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

    const max = this.practice.items.length - 1;
    const clamped = Math.max(0, Math.min(max, newIndex));

    // 🔹 Local state'i güncelle ki progressText değişsin
    this.practice = {
      ...this.practice,
      index: clamped,
    };

    const it = this.practice.items[clamped];

    this.router.navigate(['/', it.tech, it.kind, it.id], {
      state: {
        session: this.practice,
        returnTo: this.returnTo ?? undefined,
        returnToUrl: this.returnToUrl ?? undefined,
        returnLabel: this.returnLabel() ?? undefined,
      },
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
      // Course context
      this.router.navigate(this.courseNav()!.breadcrumb!.to);
    } else if (this.returnTo) {
      // Old array-based navigation
      this.router.navigate(this.returnTo);
    } else if (this.returnToUrl) {
      // 🔹 New: go back to the exact URL we came from
      this.router.navigateByUrl(this.returnToUrl);
    } else if (window.history.length > 1) {
      // Fallback: normal browser history
      window.history.back();
    } else {
      // Final fallback (rare)
      this.router.navigate(['/coding']);
    }
  }

  // ---------- run tests (JS/TS) ----------
  async runTests(): Promise<void> {
    const q = this.question();
    if (!q) return;

    if (this.isFrameworkTech() || this.isWebTech()) return;

    // Plain JS/TS -> delegate to child panel
    this.subTab.set('console');
    this.hasRunTests = false;
    this.testResults.set([]);
    this.consoleEntries.set([]);
    await this.jsPanel?.runTests();
    this.hasRunTests = true;

    this.subTab.set('tests');
  }

  // ---------- submit ----------
  async submitCode(): Promise<void> {
    if (!this.ensureAuthenticated()) {
      return;
    }

    const q = this.question();
    if (!q) return;

    // Toggle off if already completed
    if (this.solved()) {
      await this.progress.unmarkSolved(q.id);
      this.solved.set(false);
      return;
    }

    // Angular/framework preview submissions are manual-complete.
    if (this.isFrameworkTech() || this.isWebTech()) {
      await this.progress.markSolved(q.id);
      this.solved.set(true);
      this.creditDaily();
      this.recordCompletion('submit');
      await this.celebrate('submit');
      return;
    }

    // JS/TS: always run tests (delegates to the panel).
    await this.runTests();

    const passing = this.allPassing();
    this.solved.set(passing);

    if (!passing) {
      return;
    }

    await this.progress.markSolved(q.id);
    this.creditDaily();
    this.recordCompletion('submit');
    await this.celebrate('submit');
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
    this.webPanel?.openSolutionPreview();
  }

  // Go back to the user’s code in the right preview
  closeSolutionPreview() { this.webPanel?.closeSolutionPreview?.(); }

  private exitFrameworkSolutionPreview() {
    if (!this.showingFrameworkSolutionPreview()) return;
    this.showingFrameworkSolutionPreview.set(false);
  }

  openFrameworkSolutionPreview() {
    void this.frameworkPanel?.openSolutionPreview();
  }

  async closeFrameworkSolutionPreview() {
    await this.frameworkPanel?.closeSolutionPreview();
  }

  // ---------- reset ----------
  async resetQuestion() {
    const q = this.question();
    if (!q || this.resetting()) return;

    this.resetting.set(true);
    try {
      // --- common preview cleanup (blob URLs, modal, solution flag) ---
      try { if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl); } catch { /* noop */ }
      this.previewObjectUrl = null;
      this.previewVisible = false;
      this.previewOnlyUrl = null;
      // clear right-side iframe immediately to avoid “stale” page
      this.setPreviewHtml(null);

      if (this.isFrameworkTech()) {
        this.frameworkPanel?.resetToStarter();
      } else if (this.isWebTech()) {
        this.webPanel?.externalResetToDefault?.();
        // Parent does not manage web preview or storage anymore
        this.topTab.set('tests');
        this.subTab.set('tests');
      }
      else {
        // Plain JS/TS
        this.jsPanel?.resetToDefault?.();
        this.jsPanel?.initFromQuestion();
        this.topTab.set('code');
        this.subTab.set('tests');
      }

      // --- common cleanup / flags ---
      this.consoleEntries.set([]);
      this.testResults.set([]);
      this.hasRunTests = false;
      this.solved.set(false);
      try { await this.progress.unmarkSolved(q.id); } catch { }
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
      .catch(() => { });
  }

  copySolutionCode() {
    const code = this.solutionCodeFor(this.getActiveJsLang()) || '';
    if (!code.trim()) {
      return;
    }
    navigator.clipboard
      .writeText(code)
      .then(() => {
        this.copiedExamples.set(true);
        setTimeout(() => this.copiedExamples.set(false), 1200);
      })
      .catch(() => { });
  }

  goToCustomTests(e?: Event) { if (e) e.preventDefault(); this.topTab.set('tests'); this.subTab.set('tests'); }

  loadSolutionCode() {
    const q = this.question();
    if (!q) return;

    // --- Framework techs: use solutionAsset files, not inline snippets ---
    if (this.isFrameworkTech()) {
      const sol = this.solutionFilesMap();
      if (Object.keys(sol || {}).length) {
        this.frameworkPanel?.applySolutionFiles();
        return;
      }
      // If no solutionAsset, fall through to legacy snippet behavior.
    }

    // --- Non-framework (JS/TS, etc.): keep existing behavior ---
    if (this.isWebTech()) return; // web panel handles its own solution

    const lang = this.getActiveJsLang();
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

    this.jsPanel?.applySolution(value);
    this.topTab.set('code');
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

  onChildLang(lang: 'js' | 'ts') {
    this.currentJsLang.set(lang);
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
      error: () => { },
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
  }

  toggleFiles() { this.showFileDrawer.set(!this.showFileDrawer()); }
  closeFiles() { this.showFileDrawer.set(false); }

  isWebTech(): boolean { return this.tech === 'html' || this.tech === 'css'; }
  isFrameworkTech(): boolean { return this.tech === 'angular' || this.tech === 'react' || this.tech === 'vue'; }

  private rebuildTimer: any = null;
  private scheduleRebuild() {
    if (this.rebuildTimer) clearTimeout(this.rebuildTimer);
    this.rebuildTimer = setTimeout(() => {
      // guard so preview errors never take down the app
      this.rebuildFrameworkPreview().catch(err => {
        this.setPreviewHtml(null);
      });
    }, 200);
  }

  /** Rebuilds the preview iframe for framework techs using the saved files */
  async rebuildFrameworkPreview() {
    try {
      const files = this.filesMap();
      const html = await this.previewBuilder.build(this.tech as 'react' | 'angular' | 'vue', files);
      this.setPreviewHtml(html || null);
    } catch (e) {
      this.setPreviewHtml(null);
    }
  }

  private setPreviewHtml(html: string | null) {
    const frameEl = this.previewFrame?.nativeElement;
    const current = this._previewUrl() || null;
    writeHtmlToIframe(frameEl, this.sanitizer, html, current, v => this._previewUrl.set(v));
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
  structuredSolution = computed<FASolutionBlock>(() => {
    const q = this.question();
    const block = (q as any)?.solutionBlock as FASolutionBlock | undefined;
    if (block) return block;
    const legacy = this.solutionInfo();
    return { overview: legacy.explanation };
  });


  // Convenience getters for template
  approaches = computed<FAApproach[]>(() => {
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
  codeFor(ap: FAApproach): string {
    return this.currentJsLang() === 'ts'
      ? (ap.codeTs ?? '')
      : (ap.codeJs ?? '');
  }

  // Load one approach directly into the appropriate editor
  loadApproach(ap: FAApproach) {
    // 1) HTML/CSS questions → delegate to web panel
    if (this.isWebTech()) {
      const html = this.prettifyHtml(this.unescapeJsLiterals(ap.codeHtml ?? ''));
      const css = this.prettifyCss(this.unescapeJsLiterals(ap.codeCss ?? ''));

      this.webPanel?.applySolution({ html, css });
      this.topTab.set('html');
      return;
    }

    // 2) Framework questions (Angular / React / Vue)
    if (this.isFrameworkTech()) {
      // Prefer solutionAsset files if present: hand off to framework panel
      const sol = this.solutionFilesMap();
      if (sol && Object.keys(sol).length) {
        this.frameworkPanel?.applySolutionFiles();
        return;
      }

      // Fallback: if this approach has inline framework code, push it into the current file
      const code =
        (ap.codeTs && ap.codeTs.trim())
          ? ap.codeTs
          : (ap.codeJs || '');

      if (!code?.trim()) return;

      // Let the framework panel handle saving + preview rebuild
      this.frameworkPanel?.onFrameworkCodeChange(code);
      return;
    }

    // 3) Plain JS / TS questions
    const lang = this.getActiveJsLang();
    let code = lang === 'ts'
      ? (ap.codeTs ?? '')
      : (ap.codeJs ?? '');

    // Fallback: if selected lang empty, but other exists, use that.
    if (!code.trim()) {
      code = (ap.codeTs || ap.codeJs || '');
    }

    if (!code.trim()) return;

    this.jsPanel?.applySolution(code);
    this.topTab.set('code');
  }

  // Tiny copier (you already have copySolutionCode for the legacy case)
  async copyText(text: string) {
    const value = text ?? '';
    if (!value.trim()) {
      return;
    }

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(value);
      } else {
        // Fallback for older / restricted environments
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }

      this.copiedSolutionFile.set(true);
      setTimeout(() => this.copiedSolutionFile.set(false), 1200);
    } catch (err) {
    }
  }

  // Render markdown-lite to safe HTML using your existing explanation parser
  md(s?: string): string {
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
    // For frameworks: delegate to panel; for JS/TS keep existing behavior.
    if (this.isFrameworkTech()) {
      this.frameworkPanel?.applySolutionFiles(this.solutionOpenPath());
      return;
    }
    this.loadSolutionCode(); // JS/TS legacy
  }

  // Turn "### Heading" into bold titles and strip emoji bullets.
  // Also wrap inline `code` in <code>. Returns a string for [innerHTML] (sanitized in template).
  private explanationToHtml(raw: string): string {
    if (!raw || !raw.trim()) {
      return '<p class="sol-p">No explanation provided.</p>';
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
    return html;
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
    list: FAFollowUpRef[] | undefined
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

  public solutionShortName(path: string): string {
    if (!path) return '';
    const clean = path.replace(/^\/+/, '');
    const i = clean.lastIndexOf('/');
    return i >= 0 ? clean.slice(i + 1) : clean;
  }

  openSolutionFile(path: string) {
    const files = this.solutionFilesMap();
    if (!path || !(path in files)) return;
    this.solutionOpenPath.set(path);
  }
} 
