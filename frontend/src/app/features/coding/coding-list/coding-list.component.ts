import { CommonModule, Location, isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, afterNextRender, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationStart, Router, RouterModule } from '@angular/router';

import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SliderModule } from 'primeng/slider';

import { BehaviorSubject, combineLatest, forkJoin, Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, distinctUntilChanged, map, shareReplay, startWith, switchMap, take, takeUntil, tap } from 'rxjs/operators';

import { Difficulty, Question, QuestionKind, Technology, isQuestionLockedForTier } from '../../../core/models/question.model';
import { COMPANY_PRACTICE_DISCLAIMER } from '../../../core/content/public-editorial-facts';
import { Tech } from '../../../core/models/user.model';
import { CodingListFilterState, CodingListStateService } from '../../../core/services/coding-list-state';
import { MixedQuestionListItem, QuestionListItem, QuestionService } from '../../../core/services/question.service';
import { QuestionListResolved } from '../../../core/resolvers/question-list.resolver';
import { UserProgressService } from '../../../core/services/user-progress.service';
import { CodeStorageService } from '../../../core/services/code-storage.service';
import { AttemptInsightsService } from '../../../core/services/attempt-insights.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { EssentialQuestionsService } from '../../../core/services/essential-questions.service';
import { OnboardingService } from '../../../core/services/onboarding.service';
import {
  LastRun,
  ProgressFilter,
  editedAgoLabel,
  isProgressFilter,
  lastRunLabel,
  matchesProgressFilter,
  pickContinueTarget,
  practiceStatus,
} from '../../../core/utils/practice-progress.util';
import { CODING_HUB_DEBUG_DISCOVERY, CodingHubGeneratedDiscoveryItem } from '../../../generated/coding-hub-discovery';
import { FaChipComponent } from '../../../shared/ui/chip/fa-chip.component';
import { OfflineBannerComponent } from "../../../shared/components/offline-banner/offline-banner";
import { FRAMEWORK_FAMILY_BY_ID, frameworkLabel, FrameworkVariant } from '../../../shared/framework-families';
import { CodingFilterPanelComponent } from '../../filters/coding-filter-panel/coding-filter-panel';
import { CodingTechKindTabsComponent } from '../../filters/coding-tech-kind-tabs.component.ts/coding-tech-kind-tabs.component';
import { AuthService } from '../../../core/services/auth.service';
import { expandTopicsToTags, loadTopics } from '../../../core/utils/topics.util';
import { SeoMeta, SeoService } from '../../../core/services/seo.service';
import { buildCodingListSeoMeta } from './coding-list-seo.util';
import { interviewPath, warmupPath } from './coding-start-paths.util';
import { FaButtonComponent } from '../../../shared/ui/button/fa-button.component';
import { FaGlyphComponent } from '../../../shared/ui/icon/fa-glyph.component';
import { FaCardComponent } from '../../../shared/ui/card/fa-card.component';
import {
  FaQuestionRowComponent,
  FaQuestionRowMetaChip,
  FaQuestionRowVariant,
} from '../../../shared/ui/question-row/fa-question-row.component';
import { FaSpinnerComponent } from '../../../shared/ui/spinner/fa-spinner.component';
import { StripInlineMarkupPipe } from '../../../shared/ui/inline-code/strip-inline-markup.pipe';
import { PriorityLinksComponent } from '../../../shared/components/priority-links/priority-links.component';
import { CODING_PRIORITY_LINK_GROUPS } from '../../../core/content/priority-links';
import { normalizeEditorialPlainText } from '../../../core/utils/locked-preview.util';

type StructuredDescription = { text?: string; summary?: string; examples?: string[] };
type ListSource = 'tech' | 'company' | 'global-coding';

type Kind = QuestionKind | 'all';
type SelectedKind = QuestionKind;

type Row = Question & {
  tech?: Tech;
  __kind: QuestionKind;
  companies?: string[];
  __sd?: boolean;
  /** A debugging task in a coding list (/coding or a company's set): it opens on its own route, /<tech>/debug/<id>. */
  __debug?: boolean;
};

/** A filter shown above the list: "Angular", "Easy", "#async", a search term. `id` says how to remove it. */
type ActiveFilter = { id: string; label: string };

/** `access` lets the task page's Next step over Premium tasks for a visitor who cannot open them. */
type PracticeItem = { tech: Tech; kind: QuestionKind | 'debug'; id: string; access?: Row['access'] };
type PracticeSession = { items: PracticeItem[]; index: number };
// ---------- Formats categories ----------
type CategoryKey = 'ui' | 'js-fn' | 'html-css' | 'algo' | 'system';
type ViewMode = 'tech' | 'formats';

type ImportanceTier = 'low' | 'medium' | 'high';

type SortKey =
  | 'default'
  | 'title-asc' | 'title-desc'
  | 'difficulty-asc' | 'difficulty-desc'
  | 'importance-desc' | 'importance-asc'
  | 'created-desc' | 'created-asc'
  // for compatibility with shared filter panel in other contexts
  | 'diff-asc' | 'diff-desc';

/** `.fa-sort__menu` min-width and the page gutter it must keep (coding-list.component.scss). */
const SORT_MENU_MIN_WIDTH_PX = 260;
const SORT_MENU_EDGE_PX = 16;
/** The visitor's "Free only" choice, kept in this browser as well as in the address (`access=free`). */
const FREE_ONLY_STORAGE_KEY = 'fa:coding-list:free-only';
/** The progress view (Not solved, In progress, Solved), kept in this browser: it is about this viewer, not the link. */
const PROGRESS_FILTER_STORAGE_KEY = 'fa:coding-list:progress';
const PROGRESS_FILTER_LABELS: Record<Exclude<ProgressFilter, 'all'>, string> = {
  unsolved: 'Not solved',
  'in-progress': 'In progress',
  solved: 'Solved',
};

/** The hero's "Continue" card: the newest draft that is not solved yet. */
type ContinueCard = {
  questionId: string;
  tech?: Tech;
  title: string;
  route: any[];
  editedAgo: string;
  lastRun: string | null;
};

type SupportedPrepTech = Extract<Tech, 'javascript' | 'react' | 'angular' | 'vue'>;

type FrameworkPrepLink = {
  tech: SupportedPrepTech;
  slug: string;
  label: string;
  summary: string;
  outcomes: string[];
  mistakes: string[];
  sequenceLabel: string;
};

type ContextualSupportLink = {
  eyebrow: string;
  title: string;
  body: string;
  route: any[] | string;
  cta: string;
  testId: string;
};

type DiscoveryKind = 'coding' | 'debug';

type CodingHubDiscoveryItem = {
  id: string;
  title: string;
  description: string;
  tech: Tech;
  kind: DiscoveryKind;
  difficulty: string;
  access: string;
  importance: number;
  route: any[] | string;
};

type CodingHubDiscoverySection = {
  title: string;
  description: string;
  totalCount: number;
  items: CodingHubDiscoveryItem[];
};

type FocusSlug =
  | 'accessibility'
  | 'async'
  | 'design-system'
  | 'dom'
  | 'forms'
  | 'polyfills'
  | 'lodash'
  | 'react-hooks'
  | 'state-management'
  | 'promise';   // ✅ yeni

const FOCUS_SEED_TAGS: Record<FocusSlug, string[]> = {
  accessibility: ['accessibility', 'a11y'],
  async: ['async', 'promise', 'async-await'],
  promise: ['promise', 'async-await'],               // ✅ yeni bucket
  'design-system': ['design-system', 'design-system-components', 'component-library'],
  dom: ['dom', 'dom-manipulation', 'events'],
  forms: ['forms', 'reactive-forms', 'template-forms'],
  polyfills: ['polyfill', 'polyfills'],
  lodash: ['lodash'],
  'react-hooks': ['hooks', 'react-hooks'],
  'state-management': ['state-management', 'redux', 'context', 'zustand', 'mobx'],
};

function tierFromImportance(n: number | undefined): ImportanceTier {
  const v = n ?? 0;
  if (v >= 4) return 'high';      // 4–5 → High
  if (v >= 2) return 'medium';    // 2–3 → Medium
  return 'low';                   // 0–1 → Low
}

const ALGO_TAGS = new Set([
  'recursion', 'two-pointers', 'binary-search', 'heap', 'graph', 'bfs', 'dfs',
  'topological', 'trie', 'dynamic-programming', 'dp', 'sorting', 'greedy', 'backtracking'
]);

const SYSTEM_TAGS = new Set([
  'system', 'system-design', 'architecture', 'scalability', 'availability', 'reliability',
  'caching', 'cache', 'queue', 'message-queue', 'kafka', 'rabbitmq',
  'rate-limit', 'rate-limits', 'throughput', 'latency', 'load-balancing', 'replication',
  'sharding', 'partitioning', 'consistency', 'eventual-consistency', 'cdn', 'storage',
  'indexing', 'search', 'feed', 'api', 'api-design', 'microservices', 'distributed',
  'fault-tolerance', 'database', 'hashing', 'ttl'
]);

const SYSTEM_TITLE_HINTS = [
  'system design', 'design a ', 'design an ', 'architecture', 'architect',
  'rate limit', 'url shortener', 'news feed', 'timeline', 'chat system',
  'search', 'recommendation', 'notifications', 'tinyurl', 'bitly'
];

const ALLOWED_CATEGORIES: CategoryKey[] = ['ui', 'js-fn', 'html-css', 'algo', 'system'];
const DISCOVERY_CODING_TECHS: Tech[] = ['javascript', 'react', 'angular', 'vue', 'html', 'css'];
const TECHNOLOGY_QUESTION_HUBS = [
  { tech: 'javascript', label: 'JavaScript interview questions', route: '/javascript/interview-questions' },
  { tech: 'react', label: 'React interview questions', route: '/react/interview-questions' },
  { tech: 'angular', label: 'Angular interview questions', route: '/angular/interview-questions' },
  { tech: 'vue', label: 'Vue interview questions', route: '/vue/interview-questions' },
  { tech: 'html', label: 'HTML interview questions', route: '/html/interview-questions' },
  { tech: 'css', label: 'CSS interview questions', route: '/css/interview-questions' },
  { tech: 'html-css', label: 'HTML/CSS interview questions', route: '/html-css/interview-questions' },
] as const;
const CODING_CHALLENGE_FIT_PILLS = ['Real prompts', 'Starter code', 'Tests', 'Solutions + follow-ups', 'Free to start'] as const;
const CONCEPT_QUESTION_FIT_PILLS = ['Concept and output questions', 'Written answers', 'Nearly all free'] as const;
const PRACTICE_TYPES_FIT_PILLS = ['Format-first', 'Good after basics'] as const;
const SYSTEM_DESIGN_FIT_PILLS = ['Senior signal', 'Architecture + tradeoffs'] as const;
const DEFAULT_START_QUESTION_ID = 'js-debounce';
const DEFAULT_START_ROUTE = ['/', 'javascript', 'coding', DEFAULT_START_QUESTION_ID] as const;
const FRAMEWORK_PREP_LINKS: FrameworkPrepLink[] = [
  {
    tech: 'javascript',
    slug: 'javascript-prep-path',
    label: 'JavaScript prep',
    summary: 'Lock async flows, closures, and state transitions before mixing framework rounds.',
    outcomes: [
      'Answer algorithmic and coding prompts with cleaner state reasoning.',
      'Explain async trade-offs and edge cases without drifting off-topic.',
    ],
    mistakes: [
      'Jumping into framework APIs before mastering core JavaScript behavior.',
      'Practicing random prompts without reviewing async and closure fundamentals.',
    ],
    sequenceLabel: 'JavaScript foundation path',
  },
  {
    tech: 'react',
    slug: 'react-prep-path',
    label: 'React interview preparation',
    summary: 'Sharpen hook decisions, rerender reasoning, and component architecture communication.',
    outcomes: [
      'Write predictable hook-based solutions under interview time pressure.',
      'Defend component boundaries and performance choices with clear trade-offs.',
    ],
    mistakes: [
      'Memorizing hook rules without explaining dependency and rerender behavior.',
      'Over-optimizing early instead of first building readable, correct flows.',
    ],
    sequenceLabel: 'React interview preparation path',
  },
  {
    tech: 'angular',
    slug: 'angular-prep-path',
    label: 'Angular prep',
    summary: 'Focus on RxJS operators, architecture boundaries, and maintainable component contracts.',
    outcomes: [
      'Handle reactive streams and form flows with deliberate operator choices.',
      'Explain module, service, and component boundaries in senior-level terms.',
    ],
    mistakes: [
      'Using RxJS operators without explaining cancellation and memory implications.',
      'Mixing state and side effects across components without clear ownership.',
    ],
    sequenceLabel: 'Angular architecture path',
  },
  {
    tech: 'vue',
    slug: 'vue-prep-path',
    label: 'Vue prep',
    summary: 'Improve reactivity correctness, composition patterns, and component communication clarity.',
    outcomes: [
      'Reason about state updates and computed/watch choices without hesitation.',
      'Structure component communication with predictable, testable patterns.',
    ],
    mistakes: [
      'Treating template convenience as architecture instead of design decisions.',
      'Skipping discussion of reactivity pitfalls in larger component trees.',
    ],
    sequenceLabel: 'Vue reactivity path',
  },
];
const DEBUG_FILTER_STATE = true;

function inferCategory(q: any): CategoryKey {
  if (q.__sd) return 'system';

  const tech = (q.technology || '').toLowerCase();
  const type = (q.type || '').toLowerCase();

  // HTML & CSS sorularını ayrı kategoriye al
  if (tech === 'html' || tech === 'css') return 'html-css';

  if (['angular', 'react', 'vue'].includes(tech)) return 'ui';
  if (q.sdk) return 'ui';

  const tags: string[] = (q.tags || []).map((t: string) => (t || '').toLowerCase());

  if (tags.some(t => ALGO_TAGS.has(t))) return 'algo';

  return 'js-fn';
}

@Component({
    selector: 'app-coding-list',
    imports: [
        CommonModule,
        RouterModule,
        MultiSelectModule,
        SliderModule,
        InputTextModule,
        FormsModule,
        CodingTechKindTabsComponent,
        CodingFilterPanelComponent,
        OfflineBannerComponent,
        FaChipComponent,
        FaButtonComponent,
        FaCardComponent,
        FaGlyphComponent,
        FaSpinnerComponent,
        FaQuestionRowComponent,
        StripInlineMarkupPipe,
        PriorityLinksComponent,
    ],
    templateUrl: './coding-list.component.html',
    styleUrls: ['./coding-list.component.scss']
})
export class CodingListComponent implements OnInit, OnDestroy {
  readonly companyPracticeDisclaimer = COMPANY_PRACTICE_DISCLAIMER;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly questionHubViewReady = signal(!this.isBrowser);
  private readonly codeStore = inject(CodeStorageService);
  private readonly attemptInsights = inject(AttemptInsightsService);
  private readonly analytics = inject(AnalyticsService);
  private readonly essentialQuestions = inject(EssentialQuestionsService);
  /** A technology's default order: Essential 60 first, unless onboarding said "junior", who sees warm-ups first. */
  private readonly prefersWarmupsFirst = inject(OnboardingService).getProfile()?.targetRole === 'junior_frontend';
  /** Essential 60 ranks by `<kind>:<id>`, read in the browser after the first render; empty until then. */
  private readonly essentialRanks$ = new BehaviorSubject<ReadonlyMap<string, number>>(new Map());
  private static _instanceCounter = 0;
  readonly instanceId = ++CodingListComponent._instanceCounter;
  mobileFiltersOpen = false;
  solvedIds = this.progress.solvedIds;
  solvedSet = computed(() => new Set(this.progress.solvedIds()));
  solvedIds$ = toObservable(this.progress.solvedIds);

  // ----- filter UI state -----
  searchTerm = '';
  sliderValue = 5;

  search$ = new BehaviorSubject<string>('');
  diffs$ = new BehaviorSubject<Difficulty[]>([]);
  impTiers$ = new BehaviorSubject<ImportanceTier[]>([]);

  // GLOBAL (/coding) local filters
  selectedTech$ = new BehaviorSubject<Tech | null>(null);
  selectedKind$ = new BehaviorSubject<SelectedKind>('coding');
  selectedCategory$ = new BehaviorSubject<CategoryKey | null>(null); // only for formats mode

  selectedTags$ = new BehaviorSubject<string[]>([]);

  sort$ = new BehaviorSubject<SortKey>('default');
  sortOpen = false;
  /** The menu opens toward the free side of the trigger: a phone wraps the sort to the row's start. */
  sortMenuAlignStart = false;
  sortOptions: Array<{ key: SortKey; label: string; hint?: string }> = [
    {
      key: 'default',
      label: 'Recommended order',
      hint: 'Easy → Hard, then practice priority High → Low'
    },
    { key: 'title-asc', label: 'Title: A to Z' },
    { key: 'title-desc', label: 'Title: Z to A' },
    { key: 'difficulty-asc', label: 'Difficulty: Easy to Hard' },
    { key: 'difficulty-desc', label: 'Difficulty: Hard to Easy' },
    { key: 'importance-desc', label: 'Practice priority: High to Low' },
    { key: 'importance-asc', label: 'Practice priority: Low to High' },
    { key: 'created-desc', label: 'Created: Newest to Oldest' },
    { key: 'created-asc', label: 'Created: Oldest to Newest' },
  ];

  // ----- context from routing -----
  tech!: Tech; // used on per-tech pages
  source: ListSource = 'tech';
  kind: Kind = 'coding';

  private destroy$ = new Subject<void>();
  private currentViewKey: ViewMode = 'tech'; // aktif bucket
  private viewModeInitialized = false;
  private viewModeSub?: Subscription;
  private navSub?: Subscription;
  private hydrated = false;
  private navigatingToDetail = false;
  private lastScopedFilter: { topic: string | null; focus: string | null } = { topic: null, focus: null };
  private resolvedList: QuestionListResolved | null = null;
  private systemDesignRowsCache$: Observable<Row[]> | null = null;
  private readonly handleDocumentClick = (e: MouseEvent) => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target?.closest('.sort-wrap')) this.closeSort();
  };

  viewMode$ = this.route.queryParamMap.pipe(
    map(qp => (qp.get('view') === 'formats' ? 'formats' : 'tech') as ViewMode),
    tap(vm => this.onViewModeChange(vm))
  );

  viewMode: ViewMode = 'tech'; // default

  ALLOWED_TECH = new Set(['javascript', 'angular', 'react', 'vue', 'html', 'css']);

  public tagMatchMode: 'all' | 'any' = 'all';

  currentCompanySlug: string | null = null;
  private readonly maxItemListItems = 50;
  private latestSeoList: Row[] = [];

  // company slug from parent param (:slug) OR ?c=
  companySlug$ = (this.route.parent
    ? combineLatest([
      this.route.parent.paramMap.pipe(map(pm => pm.get('slug') || '')),
      this.route.queryParamMap.pipe(map(qp => qp.get('c') || ''))
    ]).pipe(map(([a, b]) => (b || a).toLowerCase()))
    : this.route.queryParamMap.pipe(map(qp => (qp.get('c') || '').toLowerCase()))
  ).pipe(startWith(''));

  // ---------- base load ----------
  rawQuestions$: Observable<Row[] | null> = this.route.data.pipe(
    tap(d => {
      this.source = (d['source'] as ListSource) ?? 'tech';
      this.kind = (d['kind'] as Kind) ?? 'coding';
      this.resolvedList = (d['questionList'] as QuestionListResolved | undefined) ?? null;
    }),
    switchMap(() =>
      combineLatest([
        this.route.queryParamMap.pipe(map(qp => (qp.get('view') as ViewMode | null))),
        of((this.router.getCurrentNavigation()?.extras.state as any)?.view as ViewMode | null)
      ]).pipe(
        map(([qView, sView]) => (qView || sView || 'tech') as ViewMode),
        tap(v => this.viewMode = v),
        distinctUntilChanged(),
        switchMap(() => {
          // --------- GLOBAL (/coding or /coding?view=formats) ----------
          if (this.source === 'global-coding') {
            return this.selectedKind$.pipe(
              switchMap((k) => {
                const preloaded = this.resolvedGlobalList(k);
                let base$: Observable<Row[]>;
                if (preloaded) {
                  base$ = of(preloaded).pipe(
                    map((list: MixedQuestionListItem[]) => list.map<Row>(q => ({ ...q, __kind: k as any, tech: q.tech })))
                  );
                } else {
                  base$ = this.qs.loadAllQuestionSummaries(k as any, { transferState: false }).pipe(
                    map((list: MixedQuestionListItem[]) => list.map<Row>(q => ({ ...q, __kind: k as any, tech: q.tech }))),
                  );
                }

                if (this.viewMode === 'formats') {
                  return combineLatest<[Row[], Row[]]>([
                    base$,
                    this.loadSystemDesignRows$()
                  ]).pipe(
                    map(([a, sys]) => [...a, ...sys]),
                  );
                }
                if (k !== 'coding') return base$;
                return combineLatest<[Row[], Row[]]>([
                  base$,
                  this.debugRows$(this.resolvedList?.debugItems),
                ]).pipe(
                  map(([coding, debug]) => [...coding, ...debug]),
                );
              })
            );
          }

          // --------- PER-TECH (/:tech/...) ----------
          if (this.source === 'tech') {
            return this.route.parent!.paramMap.pipe(
              map(pm => (pm.get('tech') ?? '').toLowerCase()),
              switchMap((t) => {
                if (!this.ALLOWED_TECH.has(t)) {
                  this.router.navigateByUrl('/404');
                  return of<Row[]>([]);
                }
                this.tech = t as Tech;

                if (this.kind === 'all') {
                  return forkJoin([
                    this.qs.loadQuestionSummaries(this.tech, 'coding', { transferState: false })
                      .pipe(map((list: Question[]) => list.map<Row>(q => ({ ...q, __kind: 'coding' })))),
                    this.qs.loadQuestionSummaries(this.tech, 'trivia', { transferState: false })
                      .pipe(map((list: Question[]) => list.map<Row>(q => ({ ...q, __kind: 'trivia' }))))
                  ]).pipe(
                    map(([a, b]) => [...a, ...b]),
                    startWith<Row[] | null>(null)
                  );
                }

                const k = this.kind as QuestionKind;
                return this.qs.loadQuestionSummaries(this.tech, k, { transferState: false }).pipe(
                  map((list: Question[]) => list.map<Row>(q => ({ ...q, __kind: k }))),
                  startWith<Row[] | null>(null)
                );
              })
            );
          }

          // --------- COMPANY ----------
          if (this.source === 'company') {

            // 1) ALL company questions (coding, debugging, trivia, system)
            if (this.kind === 'all') {
              return forkJoin<[Row[], Row[], Row[], Row[]]>([
                this.qs.loadAllQuestionSummaries('coding', { transferState: false }).pipe(
                  map(list =>
                    list.map<Row>(q => ({ ...q, __kind: 'coding', tech: q.tech }))
                  )
                ),
                this.debugRows$(),
                this.qs.loadAllQuestionSummaries('trivia', { transferState: false }).pipe(
                  map(list =>
                    list.map<Row>(q => ({ ...q, __kind: 'trivia', tech: q.tech }))
                  )
                ),
                this.loadSystemDesignRows$()
              ]).pipe(
                map(([coding, debug, trivia, system]) => [...coding, ...debug, ...trivia, ...system]),
                startWith<Row[] | null>(null)
              );
            }

            // 2) CODING, with the debugging tasks the company's rounds ask for (a bug squash is code to fix)
            if (this.kind === 'coding') {
              return forkJoin<[Row[], Row[]]>([
                this.qs.loadAllQuestionSummaries('coding', { transferState: false }).pipe(
                  map(list =>
                    list.map<Row>(q => ({ ...q, __kind: 'coding', tech: q.tech }))
                  )
                ),
                this.debugRows$(),
              ]).pipe(
                map(([coding, debug]) => [...coding, ...debug]),
                startWith<Row[] | null>(null)
              );
            }

            // 3) TRIVIA
            if (this.kind === 'trivia') {
              return this.qs.loadAllQuestionSummaries('trivia', { transferState: false }).pipe(
                map(list =>
                  list.map<Row>(q => ({ ...q, __kind: 'trivia', tech: q.tech }))
                ),
                startWith<Row[] | null>(null)
              );
            }

            if (this.kind === 'system-design') {
              return this.loadSystemDesignRows$().pipe(
                startWith<Row[] | null>(null)
              );
            }
          }
          return of<Row[]>([]);
        })
      )
    )
  ) as unknown as Observable<Row[] | null>;

  private resolvedGlobalList(kind: SelectedKind): MixedQuestionListItem[] | null {
    const resolved = this.resolvedList;
    if (!resolved || resolved.source !== 'global-coding') return null;
    if (resolved.kind !== kind) return null;
    return resolved.items;
  }

  private loadDiscoveryRows(kind: DiscoveryKind): Observable<CodingHubDiscoveryItem[]> {
    if (kind === 'debug') {
      return of(this.generatedDebugDiscoveryItems());
    }

    const techs = DISCOVERY_CODING_TECHS;
    return forkJoin(
      techs.map((tech) => {
        return this.qs.loadQuestionSummaries(tech, kind, { transferState: false }).pipe(
          map((list): CodingHubDiscoveryItem[] =>
            (list ?? [])
              .filter((q) => q?.id && q?.title)
              .map((q) => this.toDiscoveryItem(q, tech, kind)),
          ),
          catchError(() => of([] as CodingHubDiscoveryItem[])),
        );
      }),
    ).pipe(
      map((buckets) => buckets.flat()),
    );
  }

  private generatedDebugDiscoveryItems(): CodingHubDiscoveryItem[] {
    return CODING_HUB_DEBUG_DISCOVERY.map((item, index) => this.toGeneratedDiscoveryItem(item, index));
  }

  private toGeneratedDiscoveryItem(item: CodingHubGeneratedDiscoveryItem, index: number): CodingHubDiscoveryItem {
    return {
      id: item.id,
      title: item.title,
      description: this.preview(this.decodeHtmlEntities(item.summary || ''), 112),
      tech: item.tech as Tech,
      kind: 'debug',
      difficulty: String(item.difficulty || 'easy'),
      access: String(item.access || 'free'),
      importance: Math.max(0, 1000 - index),
      route: item.route,
    };
  }

  private toDiscoveryItem(
    q: Question | QuestionListItem,
    tech: Tech,
    kind: DiscoveryKind,
  ): CodingHubDiscoveryItem {
    return {
      id: q.id,
      title: q.title,
      description: this.discoveryDescription(q),
      tech,
      kind,
      difficulty: String(q.difficulty || 'easy'),
      access: String(q.access || 'free'),
      importance: Number(q.importance ?? 0),
      route: ['/', tech, kind, q.id],
    };
  }

  private discoveryDescription(q: QuestionListItem): string {
    const raw = (q.shortDescription || q.description || '') as any;
    const text = typeof raw === 'string'
      ? raw
      : String(raw?.summary || raw?.text || '');
    return this.preview(this.decodeHtmlEntities(text), 112);
  }

  private buildCodingHubDiscoverySections(
    coding: CodingHubDiscoveryItem[],
    debug: CodingHubDiscoveryItem[],
  ): CodingHubDiscoverySection[] {
    const section = (
      title: string,
      description: string,
      allItems: CodingHubDiscoveryItem[],
      limit = 3,
    ): CodingHubDiscoverySection | null => {
      const items = this.sortDiscoveryItems(
        allItems.filter((item) => !this.isPremiumDiscoveryItem(item)),
      ).slice(0, limit);

      if (!allItems.length || !items.length) return null;
      return {
        title,
        description,
        totalCount: allItems.length,
        items,
      };
    };

    return [
      section(
        'JavaScript coding challenges',
        'Function, async, DOM, data-structure, and browser utility prompts with testable edge cases.',
        coding.filter((item) => item.tech === 'javascript'),
      ),
      section(
        'React UI challenges',
        'Focused component exercises for state, hooks, lists, forms, async UI, and interaction states.',
        coding.filter((item) => item.tech === 'react'),
      ),
      section(
        'Angular challenges',
        'Standalone component, RxJS, forms, template-state, and service-boundary implementation drills.',
        coding.filter((item) => item.tech === 'angular'),
      ),
      section(
        'Vue challenges',
        'Composition API, reactivity, forms, list rendering, and component communication exercises.',
        coding.filter((item) => item.tech === 'vue'),
      ),
      section(
        'HTML/CSS implementation exercises',
        'Semantic markup, forms, accessibility, Flexbox, Grid, responsive layout, and CSS state drills.',
        coding.filter((item) => item.tech === 'html' || item.tech === 'css'),
      ),
      section(
        'Debugging challenges',
        'Small broken implementations with failing behavior for practicing root-cause analysis and fixes.',
        debug,
      ),
    ].filter((value): value is CodingHubDiscoverySection => value !== null);
  }

  private buildResolvedCodingHubDiscoverySections(data: Record<string, unknown>): CodingHubDiscoverySection[] {
    const resolved = data['questionList'] as QuestionListResolved | undefined;
    if (!resolved || resolved.source !== 'global-coding' || resolved.kind !== 'coding') {
      return [];
    }

    const coding = (resolved.items ?? [])
      .filter((q) => q?.id && q?.title && q?.tech)
      .map((q) => this.toDiscoveryItem(q, q.tech, 'coding'));

    return this.buildCodingHubDiscoverySections(coding, this.generatedDebugDiscoveryItems());
  }

  private sortDiscoveryItems(items: CodingHubDiscoveryItem[]): CodingHubDiscoveryItem[] {
    return items.slice().sort((a, b) => {
      if (a.importance !== b.importance) return b.importance - a.importance;
      const diff = this.difficultyRank(a.difficulty) - this.difficultyRank(b.difficulty);
      if (diff !== 0) return diff;
      return a.title.localeCompare(b.title);
    });
  }

  private isPremiumDiscoveryItem(item: CodingHubDiscoveryItem): boolean {
    return item.access.toLowerCase() === 'premium';
  }

  allTagCounts$ = this.rawQuestions$.pipe(
    map(rows => {
      const counts = new Map<string, number>();
      for (const q of rows ?? []) {
        for (const tag of (q.tags || [])) {
          const t = String(tag).trim();
          if (!t) continue;
          counts.set(t, (counts.get(t) || 0) + 1);
        }
      }
      return counts;
    })
  );

  popularTags$ = this.allTagCounts$.pipe(
    map(counts =>
      Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([tag]) => tag)
    )
  );

  // Merge filter chain
  private readonly baseFiltered$ = combineLatest([
    this.rawQuestions$,
    this.search$,
    this.diffs$,
    this.impTiers$,
    this.companySlug$,
    this.selectedTech$,
    this.selectedCategory$,
    this.selectedTags$,
    this.sort$,
    this.essentialRanks$,
  ]).pipe(
    map(([questions, term, diffs, tiers, companySlug, selectedTech, selectedCategory, selTags, sortKey, ranks]) => {
      if (questions === null) return null;
      const t = (term || '').toLowerCase();
      const isFormats = this.isFormatsMode();

      if (isFormats && selectedCategory === 'system') {
        const sysBase = (questions ?? []).filter((q: any) => (q as any).__sd === true);
        const sysFiltered = sysBase.filter((q: any) =>
          this.searchRank(q, t) >= 0 &&
          (!companySlug || ((q as any).companies ?? []).includes(companySlug)) &&
          (selTags.length === 0
            ? true
            : (this.tagMatchMode === 'all'
              ? selTags.every(tag => (q.tags || []).includes(tag))
              : selTags.some(tag => (q.tags || []).includes(tag))
            )
          )
        );

        const cmp = this.makeComparator(sortKey as SortKey);
        const promoteDefaultStart = this.shouldPromoteDefaultStart({
          term,
          diffs,
          tiers,
          selectedTech,
          selectedCategory,
          selTags,
          sortKey: sortKey as SortKey,
          isFormats,
        });
        const deduped = this.dedupeFrameworkRows(sysFiltered);
        const warmupFirst = (a: any, b: any) => {
          const byRelevance = this.searchRank(a, t) - this.searchRank(b, t);
          if (byRelevance) return byRelevance;

          if (promoteDefaultStart) {
            return this.compareDefaultStartRows(a, b);
          }

          if (this.source === 'global-coding') {
            const aPremium = this.isPremiumQuestion(a);
            const bPremium = this.isPremiumQuestion(b);
            if (aPremium !== bPremium) return aPremium ? 1 : -1;
          }

          const aw = this.isWarmupTitle(a?.title);
          const bw = this.isWarmupTitle(b?.title);
          if (aw !== bw) return aw ? -1 : 1;
          return cmp(a, b);
        };

        return deduped.slice().sort(warmupFirst);
      }

      const filtered = (questions ?? []).filter((q: any) =>
        this.searchRank(q, t) >= 0 &&

        (diffs.length === 0 || diffs.includes(q.difficulty)) &&

        (tiers.length === 0 || tiers.includes(tierFromImportance(q.importance))) &&

        (!companySlug || ((q as any).companies ?? []).includes(companySlug)) &&

        (this.source !== 'global-coding' || isFormats || !selectedTech || q.tech === selectedTech) &&

        (this.source !== 'global-coding' || !isFormats || !selectedCategory ||
          (
            selectedCategory === 'system'
              ? (q as any).__sd === true
              : inferCategory(q) === selectedCategory
          )
        ) &&

        (selTags.length === 0
          ? true
          : (this.tagMatchMode === 'all'
            ? selTags.every(tag => (q.tags || []).includes(tag))
            : selTags.some(tag => (q.tags || []).includes(tag))
          )
        )
      );

      const cmp = this.makeComparator(sortKey as SortKey);
      const promoteDefaultStart = this.shouldPromoteDefaultStart({
        term,
        diffs,
        tiers,
        selectedTech,
        selectedCategory,
        selTags,
        sortKey: sortKey as SortKey,
        isFormats,
      });
      const deduped = this.dedupeFrameworkRows(filtered);
      // One technology in the default order: the Essential 60 tasks first, by rank, for everyone but a self-declared
      // junior, who keeps the warm-ups first.
      const essentialFirst = this.source === 'global-coding' && !isFormats && !!selectedTech
        && sortKey === 'default' && !this.prefersWarmupsFirst;
      const defaultOrder = (a: any, b: any) => {
        const byRelevance = this.searchRank(a, t) - this.searchRank(b, t);
        if (byRelevance) return byRelevance;

        if (promoteDefaultStart) {
          return this.compareDefaultStartRows(a, b);
        }

        if (this.source === 'global-coding') {
          const aPremium = this.isPremiumQuestion(a);
          const bPremium = this.isPremiumQuestion(b);
          if (aPremium !== bPremium) return aPremium ? 1 : -1;
        }

        if (essentialFirst) return this.compareEssentialRows(a, b, ranks);

        const aw = this.isWarmupTitle(a?.title);
        const bw = this.isWarmupTitle(b?.title);
        if (aw !== bw) return aw ? -1 : 1;
        return cmp(a, b);
      };

      return deduped.slice().sort(defaultOrder);
    })
  );

  /** "Free only": a guest or a free account can hide the tasks they would meet a lock on (kept per browser). */
  readonly freeOnly$ = new BehaviorSubject<boolean>(this.readFreeOnlyPreference());

  /** This browser's drafts that differ from their starters, by task id: when each was last edited. */
  readonly editedDrafts = signal<ReadonlyMap<string, number>>(new Map());
  private readonly lastRuns = signal<ReadonlyMap<string, LastRun>>(new Map());
  private readonly editedDrafts$ = toObservable(this.editedDrafts);
  private readonly viewer$ = toObservable(this.auth.user);
  readonly progressFilter$ = new BehaviorSubject<ProgressFilter>(this.readProgressFilterPreference());

  // Filtered again when the account, its solved list or this browser's drafts change. A member who once chose
  // "Free only" has no locks, so nothing is hidden; a visitor has no solved list, so only "In progress" applies.
  filtered$ = combineLatest([
    this.baseFiltered$,
    this.freeOnly$,
    this.viewer$,
    this.progressFilter$,
    this.solvedIds$,
    this.editedDrafts$,
  ]).pipe(
    map(([list, freeOnly, user, progress, solvedIds, drafts]) => {
      if (!list) return list;
      const open = freeOnly ? list.filter((q) => !isQuestionLockedForTier(q, user)) : list;
      const view = this.effectiveProgressFilter(progress);
      if (view === 'all') return open;
      const solved = new Set(solvedIds);
      return open.filter((q) => matchesProgressFilter(practiceStatus(q.id, solved, drafts), view));
    }),
  );

  /** /coding's newest unsolved draft, offered in the hero as "Continue"; none until this browser's drafts are read. */
  readonly continueCard$: Observable<ContinueCard | null> = this.editedDrafts$.pipe(
    switchMap((drafts) => {
      if (drafts.size === 0 || this.source !== 'global-coding') return of(null);
      return combineLatest([this.rawQuestions$, this.solvedIds$, this.viewer$]).pipe(
        map(([rows, solvedIds, user]) => {
          const target = pickContinueTarget(rows ?? [], new Set(solvedIds), drafts,
            (row) => !isQuestionLockedForTier(row, user));
          return target ? this.continueCard(target.row, target.editedAt) : null;
        }),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  // Emit list again whenever solved ids change, so UI reacts immediately to auth/progress updates.
  visible$ = combineLatest([this.filtered$, this.solvedIds$]).pipe(
    map(([qs]) => qs),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  // True when /coding?view=forms and the "System design" pill is selected
  isSystemCategoryActive$ = combineLatest([
    this.viewMode$,
    this.selectedCategory$
  ]).pipe(
    map(([vm, cat]) => vm === 'formats' && cat === 'system'),
    startWith(false)
  );

  difficultyOptions = [
    { label: 'Easy', value: 'easy' as Difficulty },
    { label: 'Intermediate', value: 'intermediate' as Difficulty },
    { label: 'Hard', value: 'hard' as Difficulty }
  ];

  techTabs = [
    { key: 'javascript' as Tech, label: 'JavaScript', badge: 'JS', cls: 'bg-yellow-400 text-black' },
    { key: 'react' as Tech, label: 'React', badge: 'R', cls: 'bg-sky-300 text-black' },
    { key: 'angular' as Tech, label: 'Angular', badge: 'A', cls: 'bg-red-600 text-white' },
    { key: 'vue' as Tech, label: 'Vue', badge: 'V', cls: 'bg-emerald-400 text-black' },
    { key: 'html' as Tech, label: 'HTML', badge: 'H5', cls: 'bg-orange-600 text-white' },
    { key: 'css' as Tech, label: 'CSS', badge: 'C3', cls: 'bg-blue-600 text-white' },
  ];

  categoryTabs: Array<{ key: CategoryKey; label: string }> = [
    { key: 'ui', label: 'User interface' },
    { key: 'js-fn', label: 'JavaScript functions' },
    { key: 'html-css', label: 'HTML & CSS' },
    { key: 'algo', label: 'Algorithmic coding' },
    { key: 'system', label: 'System design practice' },
  ];

  filteredCount$ = this.filtered$.pipe(map(list => list?.length ?? 0), startWith(0));

  kindTabs: Array<{ key: QuestionKind; label: string }> = [
    { key: 'coding', label: 'Coding' },
    { key: 'trivia', label: 'Concepts' }
  ];

  codingHubDiscovery$ = this.route.data.pipe(
    switchMap((data) => {
      const source = (data['source'] as ListSource | undefined) ?? this.source;
      if (source !== 'global-coding') return of<CodingHubDiscoverySection[]>([]);
      const initialSections = this.buildResolvedCodingHubDiscoverySections(data);

      return forkJoin({
        coding: this.loadDiscoveryRows('coding'),
        debug: this.loadDiscoveryRows('debug'),
      }).pipe(
        map(({ coding, debug }) => this.buildCodingHubDiscoverySections(coding, debug)),
        startWith(initialSections),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  currentFrameworkPrep(): FrameworkPrepLink | null {
    if (this.currentViewKey === 'formats') return null;
    const selectedTech = this.selectedTech$.value;
    if (!selectedTech) return null;
    return FRAMEWORK_PREP_LINKS.find((entry) => entry.tech === selectedTech) ?? null;
  }

  technologyQuestionHubs(): ReadonlyArray<(typeof TECHNOLOGY_QUESTION_HUBS)[number]> {
    if (this.source !== 'global-coding') return [];
    // /coding is prerendered without query filters. Claim its links before applying client-only filters.
    if (!this.questionHubViewReady()) return TECHNOLOGY_QUESTION_HUBS;
    if (this.isFormatsMode()) return [];
    const tech = this.selectedTech$.value;
    return tech ? TECHNOLOGY_QUESTION_HUBS.filter((hub) => hub.tech === tech) : TECHNOLOGY_QUESTION_HUBS;
  }

  readonly priorityLinkGroups = CODING_PRIORITY_LINK_GROUPS;

  showPriorityLinks(): boolean {
    if (this.source !== 'global-coding') return false;
    // Claim the prerendered /coding block before applying the client-only formats view.
    if (!this.questionHubViewReady()) return true;
    return !this.isFormatsMode();
  }

  contextualSupportLinks(): ContextualSupportLink[] {
    if (this.source !== 'global-coding') return [];

    const links: ContextualSupportLink[] = [];
    if (!this.isFormatsMode()) {
      links.push({
        eyebrow: 'Concept Q&A',
        title: 'Need explanations instead of coding?',
        body: 'Use the interview questions hub for conceptual frontend questions and concise answer practice.',
        route: ['/interview-questions'],
        cta: 'Open interview Q&A',
        testId: 'interview-hub-support-link',
      });
      links.push({
        eyebrow: 'Curated shortlist',
        title: 'Want the highest-signal questions only?',
        body: 'Open Essential 60 when you want a tighter route through JavaScript utilities, UI coding, system design, and concepts.',
        route: ['/interview-questions/essential'],
        cta: 'Open Essential 60',
        testId: 'essential-questions-support-link',
      });
    }

    if (this.showFrameworkPrepSupport()) {
      const prep = this.currentFrameworkPrep();
      links.push({
        eyebrow: 'Framework Prep Guide',
        title: 'Need the framework guide first?',
        body: prep
          ? `${prep.label} sequences the concepts, drills, and review steps before you go deep on prompts.`
          : 'Use the Framework Prep Guide to sequence JavaScript, React, Angular, and Vue before UI drills.',
        route: prep ? ['/guides/framework-prep', prep.slug] : ['/guides/framework-prep'],
        cta: prep ? `Open ${prep.label}` : 'Open Framework Prep Guide',
        testId: 'framework-prep-support-link',
      });
    }

    return links;
  }

  showFrameworkPrepSupport(): boolean {
    if (this.source !== 'global-coding') return false;
    if (this.isFormatsMode()) {
      const category = this.selectedCategory$.value;
      return !category || category === 'ui';
    }
    return !!this.currentFrameworkPrep();
  }

  pageKicker(): string {
    if (this.source === 'global-coding') {
      if (this.isSystemCategoryActive()) return 'System Design Practice';
      if (this.isFormatsMode()) return 'Practice Types';
      if (this.isGlobalConceptsView()) return 'Concept Question Hub';
      return 'Coding Challenge Hub';
    }

    if (this.source === 'company') return 'Company practice';
    if (this.kind === 'trivia') return 'Concept route';
    if (this.kind === 'all') return 'Question route';
    return 'Coding route';
  }

  pageTitle(): string {
    if (this.source === 'global-coding') {
      if (this.isSystemCategoryActive()) return 'System Design Practice';
      if (this.isFormatsMode()) return 'Practice Types';
      if (this.isGlobalConceptsView()) return 'Frontend Concept Questions';
      return 'Frontend Coding Challenges';
    }

    return this.heading();
  }

  pageSubtitle(): string {
    if (this.source === 'global-coding') {
      if (this.isSystemCategoryActive()) {
        return 'Practice frontend system design prompts from the unified Question Library, then open each scenario in the dedicated design workspace.';
      }

      if (this.isFormatsMode()) {
        return 'Choose the format you want to rehearse, then filter the focused list without leaving the practice surface.';
      }

      if (this.isGlobalConceptsView()) {
        return 'Questions an interviewer asks out loud about JavaScript, React, Angular, Vue, HTML and CSS, each with a written answer.';
      }

      if (this.isGuestDefaultGlobalLibrary()) {
        return 'Build and debug focused frontend prompts across JavaScript functions, UI exercises, HTML/CSS implementation, and debugging tasks.';
      }

      return 'Search by technology, difficulty, and focus area, then open a prompt with starter code, tests, solutions, and follow-ups.';
    }

    if (this.source === 'company') {
      return 'Filter this FrontendAtlas editorial practice grouping and open the next prompt with your current list preserved.';
    }

      return 'Filter by difficulty and focus area, then start one prompt immediately.';
  }

  pageFitPills(): readonly string[] {
    if (this.source !== 'global-coding') return [];
    if (this.isSystemCategoryActive()) return SYSTEM_DESIGN_FIT_PILLS;
    if (this.isFormatsMode()) return PRACTICE_TYPES_FIT_PILLS;
    if (this.isGlobalConceptsView()) return CONCEPT_QUESTION_FIT_PILLS;
    return CODING_CHALLENGE_FIT_PILLS;
  }

  pageAccessNote(): string {
    if (this.isGlobalConceptsView()) {
      return 'Nearly every concept question is free to read; a few belong to Premium.';
    }
    return 'Selected frontend coding challenges are free to start. Premium unlocks additional question sets and deeper solution context while locked items stay gated.';
  }

  primaryActionLabel(): string {
    if (this.source === 'global-coding') {
      if (this.isSystemCategoryActive()) return 'Start system design prompt';
      if (this.isFormatsMode()) return 'Start format practice';
      if (this.isGlobalConceptsView()) {
        return this.hasSolvedAny() ? 'Open next concept question' : 'Start first concept question';
      }
      return this.hasSolvedAny() ? 'Open next unsolved task' : 'Start first question';
    }

    if (this.source === 'company') return 'Start practice prompt';
    return this.kind === 'trivia' ? 'Start concept question' : 'Start coding question';
  }

  primaryActionHint(): string {
    if (this.source === 'global-coding') {
      if (this.isSystemCategoryActive()) return 'Opens the first matching system design scenario.';
      if (this.isFormatsMode()) return 'Opens the first matching prompt in this format.';
      if (this.isGlobalConceptsView()) {
        return this.hasSolvedAny()
          ? 'Opens the first question in this view you have not marked complete.'
          : 'Opens the first matching concept question from the current view.';
      }
      return this.hasSolvedAny()
        ? 'Opens the first task in this view you have not solved yet.'
        : 'Opens the first matching coding challenge from the current view.';
    }

    return 'Opens the first matching prompt from this filtered list.';
  }

  /** Every filter narrowing the list now, the restored ones included, so none hides out of view; each one removable. */
  activeFilters(): ActiveFilter[] {
    const filters: ActiveFilter[] = [];
    const term = (this.searchTerm || '').trim();
    if (term) filters.push({ id: 'search', label: `“${term}”` });
    if (this.source === 'global-coding' && !this.isFormatsMode() && this.selectedTech$.value) {
      const tech = this.selectedTech$.value;
      filters.push({ id: `tech:${tech}`, label: this.techTabs.find((tab) => tab.key === tech)?.label ?? tech });
    }
    if (this.source === 'global-coding' && this.isFormatsMode() && this.selectedCategory$.value) {
      const category = this.selectedCategory$.value;
      filters.push({ id: `category:${category}`, label: this.categoryTabs.find((tab) => tab.key === category)?.label ?? category });
    }
    for (const diff of this.diffs$.value) {
      filters.push({ id: `diff:${diff}`, label: this.difficultyOptions.find((option) => option.value === diff)?.label ?? diff });
    }
    for (const tier of this.impTiers$.value) filters.push({ id: `imp:${tier}`, label: `${this.capitalize(tier)} priority` });
    for (const tag of this.selectedTags$.value) filters.push({ id: `tag:${tag}`, label: `#${tag}` });
    if (this.freeOnly$.value && this.freeOnlyAvailable()) filters.push({ id: 'free', label: 'Free only' });
    const progress = this.progressFilterShown();
    if (progress !== 'all') filters.push({ id: 'progress', label: PROGRESS_FILTER_LABELS[progress] });
    return filters;
  }

  removeActiveFilter(id: string): void {
    if (id === 'search') return this.onSearchTermChange('');
    if (id === 'free') return this.toggleFreeOnly();
    if (id === 'progress') return this.setProgressFilter('all', 'chip');
    const separator = id.indexOf(':');
    const type = id.slice(0, separator);
    const value = id.slice(separator + 1);
    if (type === 'tech') this.toggleTech(value as Tech);
    else if (type === 'category') this.toggleCategory(value as CategoryKey);
    else if (type === 'diff') this.toggleDiff(value as Difficulty, false);
    else if (type === 'imp') this.toggleImp(value as ImportanceTier, false);
    else if (type === 'tag') this.clearTag(value);
  }

  trackByActiveFilter = (_: number, filter: ActiveFilter): string => filter.id;

  /** A search that finds no coding task may still name a concept ("closure"): the empty list offers that list. */
  canSearchConcepts(): boolean {
    return this.source === 'global-coding'
      && !this.isFormatsMode()
      && this.selectedKind$.value === 'coding'
      && !!(this.searchTerm || '').trim();
  }

  /** "1 match", "12 matches": a count with the word that fits it. */
  countLabel(count: number | null | undefined, one: string, many: string): string {
    const n = count ?? 0;
    return `${n} ${n === 1 ? one : many}`;
  }

  /** /coding with Concepts chosen: the same list surface, filled with concept questions. */
  private isGlobalConceptsView(): boolean {
    return this.source === 'global-coding' && !this.isFormatsMode() && this.selectedKind$.value === 'trivia';
  }

  private hasSolvedAny(): boolean {
    return this.solvedSet().size > 0;
  }

  get hasAppliedFilters(): boolean {
    return this.diffs$.value.length > 0
      || this.impTiers$.value.length > 0
      || this.selectedTags$.value.length > 0
      || (this.source === 'global-coding' && !this.isFormatsMode() && !!this.selectedTech$.value)
      || this.progressFilterShown() !== 'all';
  }

  // --- UI handlers for sorting ---
  currentSortLabel(k: SortKey | null | undefined): string {
    const opt = this.sortOptions.find(o => o.key === k);
    return opt?.label || 'Recommended order';
  }
  toggleSort(event?: Event) {
    this.sortOpen = !this.sortOpen;
    // A right-aligned menu needs its full width to the trigger's left; without it, it opens to the right instead.
    const trigger = event?.currentTarget;
    if (this.sortOpen && trigger instanceof HTMLElement) {
      this.sortMenuAlignStart = trigger.getBoundingClientRect().right < SORT_MENU_MIN_WIDTH_PX + SORT_MENU_EDGE_PX;
    }
  }
  closeSort() { this.sortOpen = false; }
  setSort(k: SortKey) {
    this.sort$.next(k);
    this.closeSort();
    this.saveFiltersTo(this.getActiveViewKey());
  }
  toggleMobileFilters() {
    if (this.mobileFiltersOpen) {
      this.closeMobileFilters();
      return;
    }
    this.closeSort();
    this.mobileFiltersOpen = true;
  }
  closeMobileFilters() {
    this.mobileFiltersOpen = false;
  }

  isSolved(id: string): boolean {
    return this.solvedSet().has(id);
  }

  isLocked(q: Row): boolean {
    const user = this.auth.user();
    return isQuestionLockedForTier(q, user);
  }

  /** Only a visitor who would meet locks has a use for "Free only"; a member sees every task open. */
  freeOnlyAvailable(): boolean {
    return isQuestionLockedForTier({ access: 'premium' }, this.auth.user());
  }

  /** The global list already sorts Premium tasks after free ones (baseFiltered$); other lists keep their order. */
  freeOnlyTitle(): string {
    return this.source === 'global-coding'
      ? 'Premium tasks are listed after the free ones; this hides them.'
      : 'Hides the Premium tasks.';
  }

  /** "Free only" lives in the URL (`access=free`) as well as in this browser, so a shared link keeps it. */
  toggleFreeOnly(): void {
    const on = !this.freeOnly$.value;
    this.setFreeOnly(on);
    this.replaceQueryParams({ access: on ? 'free' : null });
  }

  private setFreeOnly(on: boolean): void {
    this.freeOnly$.next(on);
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(FREE_ONLY_STORAGE_KEY, on ? '1' : '0');
    } catch {
      // Storage can be off (private mode); the toggle still works for this visit.
    }
  }

  private readFreeOnlyPreference(): boolean {
    if (!this.isBrowser) return false;
    try {
      return localStorage.getItem(FREE_ONLY_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  /** Signed in, every progress view applies; a visitor has no solved list, so only "In progress", with a draft. */
  private effectiveProgressFilter(filter: ProgressFilter): ProgressFilter {
    if (this.auth.user()) return filter;
    return filter === 'in-progress' && this.editedDrafts().size > 0 ? filter : 'all';
  }

  /** The progress views exist once there is progress to show: an account, or a draft in this browser. */
  progressFilterAvailable(): boolean {
    return !!this.auth.user() || this.editedDrafts().size > 0;
  }

  progressOptions(): Array<{ value: ProgressFilter; label: string }> {
    const inProgress = { value: 'in-progress' as const, label: PROGRESS_FILTER_LABELS['in-progress'] };
    if (!this.auth.user()) return [{ value: 'all', label: 'All' }, inProgress];
    return [
      { value: 'all', label: 'All' },
      { value: 'unsolved', label: PROGRESS_FILTER_LABELS.unsolved },
      inProgress,
      { value: 'solved', label: PROGRESS_FILTER_LABELS.solved },
    ];
  }

  /** The view the Progress options show as chosen: the one that applies, so a visitor's stored "Solved" reads All. */
  progressFilterShown(): ProgressFilter {
    return this.effectiveProgressFilter(this.progressFilter$.value);
  }

  /** "Hide solved" is "Not solved" in one click, for an account that has solved something. */
  hideSolvedAvailable(): boolean {
    return !!this.auth.user() && this.solvedIds().length > 0;
  }

  toggleHideSolved(): void {
    this.setProgressFilter(this.progressFilter$.value === 'unsolved' ? 'all' : 'unsolved', 'toolbar');
  }

  setProgressFilter(filter: ProgressFilter, control: 'panel' | 'toolbar' | 'chip' | 'reset' = 'panel'): void {
    if (this.progressFilter$.value === filter) return;
    this.progressFilter$.next(filter);
    if (control !== 'reset') this.analytics.track('coding_progress_filter_changed', { filter, control });
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(PROGRESS_FILTER_STORAGE_KEY, filter);
    } catch {
      // Storage can be off (private mode); the view still applies for this visit.
    }
  }

  private readProgressFilterPreference(): ProgressFilter {
    if (!this.isBrowser) return 'all';
    try {
      const stored = localStorage.getItem(PROGRESS_FILTER_STORAGE_KEY);
      return isProgressFilter(stored) ? stored : 'all';
    } catch {
      return 'all';
    }
  }

  isInProgress(id: string): boolean {
    return this.editedDrafts().has(id) && !this.solvedSet().has(id);
  }

  /** "12 solved · 3-day streak", for an account that has solved something. */
  progressStats(): string | null {
    const user = this.auth.user();
    const solved = this.solvedIds().length;
    if (!user || solved === 0) return null;
    const streak = user.stats?.streak?.current ?? 0;
    return streak > 0 ? `${solved} solved · ${streak}-day streak` : `${solved} solved`;
  }

  trackContinue(card: ContinueCard): void {
    this.analytics.track('coding_continue_clicked', {
      question_id: card.questionId,
      tech: card.tech ?? null,
      has_run: !!card.lastRun,
    });
  }

  /** Drafts live in this browser's IndexedDB: read after the first render, so the server's HTML is what hydrates. */
  private async loadPracticeProgress(): Promise<void> {
    try {
      const drafts = await this.codeStore.listEditedDraftsAsync();
      this.lastRuns.set(this.attemptInsights.latestRunsByQuestion());
      this.editedDrafts.set(new Map(drafts.map((draft) => [draft.questionId, draft.editedAt])));
    } catch {
      // Unreadable storage leaves the list as a first visit sees it.
    }
  }

  private continueCard(row: Row, editedAt: number): ContinueCard {
    return {
      questionId: row.id,
      tech: row.tech,
      title: row.title,
      route: this.linkTo(row),
      editedAgo: editedAgoLabel(editedAt, Date.now()),
      lastRun: lastRunLabel(this.lastRuns().get(row.id)),
    };
  }

  trackByQuestionId = (_: number, q: Row): string => q.id;
  trackByFrameworkOption = (_: number, option: FrameworkVariant): string =>
    `${option.kind}:${option.tech}:${option.id}`;
  trackByDiscoverySection = (_: number, section: CodingHubDiscoverySection): string => section.title;
  trackByDiscoveryItem = (_: number, item: CodingHubDiscoveryItem): string =>
    `${item.kind}:${item.tech}:${item.id}`;

  /**
   * A first-time visitor's two ways in: five warm-ups, or the JavaScript utilities interviewers ask for most, from
   * Debounce on. Each opens its first task with the path as the task page's Prev and Next.
   */
  startPath(entry: 'warmups' | 'interview'): void {
    this.analytics.track('coding_start_entry_clicked', { entry });
    this.visible$.pipe(take(1)).subscribe((list) => {
      const rows = list ?? [];
      const path = entry === 'warmups'
        ? warmupPath(rows)
        : interviewPath(rows, this.essentialRanks$.value, DEFAULT_START_QUESTION_ID);
      if (path.length) this.go(path[0], path);
      else if (entry === 'interview') void this.router.navigate([...DEFAULT_START_ROUTE]);
    });
  }

  openFirstVisible(): void {
    this.visible$
      .pipe(take(1))
      .subscribe((list) => {
        const rows = list ?? [];
        // A returning visitor goes on to the first open task they have not solved, not back to one they finished.
        const target = rows.find((row) => !this.isLocked(row) && !this.isSolved(row.id))
          ?? rows.find((row) => !this.isLocked(row))
          ?? rows[0];
        if (!target) return;
        this.go(target, rows);
      });
  }

  constructor(
    private route: ActivatedRoute,
    private qs: QuestionService,
    private router: Router,
    private location: Location,
    private listState: CodingListStateService,
    private progress: UserProgressService,
    public auth: AuthService,
    private seo: SeoService
  ) {
    afterNextRender(() => {
      this.questionHubViewReady.set(true);
      void this.loadPracticeProgress();
      this.essentialQuestions.loadRanks().pipe(take(1)).subscribe((ranks) => this.essentialRanks$.next(ranks));
    });
    this.debug('ctor', {
      instance: this.instanceId,
      source: this.source,
      kind: this.kind,
      qp: this.route.snapshot.queryParams
    });

    const d = this.route.snapshot.data as any;
    this.source = (d['source'] as ListSource) ?? this.source;
    this.kind = (d['kind'] as Kind) ?? this.kind;
    this.debug('ctor after data', { source: this.source, kind: this.kind, data: d });

    // seed tech filter from ?tech= on global list (only once)
    this.route.queryParamMap
      .pipe(
        take(1),
        tap(qp => {
          if (this.source !== 'global-coding') return;

          const t = (qp.get('tech') || '').toLowerCase();
          const allowed: Tech[] = ['javascript', 'angular', 'react', 'vue', 'html', 'css'];
          this.selectedTech$.next(allowed.includes(t as Tech) ? (t as Tech) : null);
          this.debug('seed tech from qp', { t, allowed: allowed.includes(t as Tech) });
        })
      )
      .subscribe();

    // seed kind from ?kind= on global list (only once)
    // seed kind from ?kind= on global list (only once, ONLY tech view)
    this.route.queryParamMap
      .pipe(
        take(1),
        tap(qp => {
          if (this.source !== 'global-coding') return;

          const view = qp.get('view');
          if (view === 'formats') {
            // formats view kind'i sadece state’ten gelir, URL’den asla seed etme
            return;
          }

          const k = qp.get('kind');
          this.selectedKind$.next(this.normalizeSelectedKind(k));
          this.debug('seed kind from qp', { k, applied: this.selectedKind$.value });
        })
      )
      .subscribe();

    if (this.isBrowser) {
      document.addEventListener(
        'click',
        this.handleDocumentClick,
        { capture: true }
      );
    }

    this.companySlug$
      .pipe(takeUntil(this.destroy$))
      .subscribe((slug) => {
        this.currentCompanySlug = slug || null;
      });

    // seed category filter from ?category= on global formats list
    this.route.queryParamMap
      .pipe(
        takeUntil(this.destroy$),
        tap(qp => {
          if (this.source !== 'global-coding') return;

          const view = qp.get('view');
          if (view !== 'formats') return;

          const raw = (qp.get('category') || '') as CategoryKey;
          const cat = ALLOWED_CATEGORIES.includes(raw) ? raw : null;
          this.selectedCategory$.next(cat);
          this.debug('seed category from qp', { raw, cat });
        })
      )
      .subscribe();

    this.viewModeSub = this.viewMode$.subscribe();
    // Ensure current view key mirrors the initial URL before async viewMode$ emits
    this.currentViewKey = this.getViewKeyFromRoute();
    this.debug('init view key', { currentViewKey: this.currentViewKey });

    // Track when we leave /coding to avoid wiping state on route change to detail
    this.navSub = this.router.events
      .pipe(
        takeUntil(this.destroy$),
        tap((e) => {
          if (!(e instanceof NavigationStart)) return;
          const viewKey = this.getViewKeyFromRoute();
          this.currentViewKey = viewKey;

          // We only care about departures from /coding to other pages (e.g., detail)
          const staysOnCoding = e.url.startsWith('/coding');
          if (!staysOnCoding && this.source === 'global-coding') {
            this.saveFiltersTo(viewKey);
          }
          this.debug('NavigationStart', { to: e.url, staysOnCoding, viewKey, source: this.source });
        })
      )
      .subscribe();
  }

  ngOnInit(): void {
    this.debug('ngOnInit entry', {
      source: this.source,
      kind: this.kind,
      qp: this.route.snapshot.queryParams,
      globalState: this.source === 'global-coding' ? this.listState.globalCodingState : null
    });

    const qp = this.route.snapshot.queryParamMap;
    this.lastScopedFilter = { topic: qp.get('topic'), focus: qp.get('focus') };
    this.initListSeo();

    // If we navigate from a scoped focus/topic URL back to plain /coding (same component instance),
    // the in-memory tag filters would otherwise "stick". Treat leaving a scoped URL as a reset.
    if (this.source === 'global-coding') {
      this.route.queryParamMap
        .pipe(
          takeUntil(this.destroy$),
          map((nextQp) => ({ topic: nextQp.get('topic'), focus: nextQp.get('focus') })),
          distinctUntilChanged((a, b) => a.topic === b.topic && a.focus === b.focus),
          tap((next) => {
            const wasScoped = !!(this.lastScopedFilter.topic || this.lastScopedFilter.focus);
            const isScoped = !!(next.topic || next.focus);

            if (wasScoped && !isScoped) {
              this.lastScopedFilter = next;
              this.resetAllFilters();
              return;
            }

            // Support in-place navigation between scoped URLs.
            if (next.topic && next.topic !== this.lastScopedFilter.topic) {
              this.lastScopedFilter = next;
              this.applyTopic(next.topic);
              return;
            }

            const focus = next.focus as FocusSlug | null;
            if (focus && focus !== this.lastScopedFilter.focus && FOCUS_SEED_TAGS[focus]) {
              this.lastScopedFilter = next;
              this.tagMatchMode = 'any';
              this.selectedTags$.next([...FOCUS_SEED_TAGS[focus]]);
              return;
            }

            this.lastScopedFilter = next;
          })
        )
        .subscribe();
    }

    // Non-global lists still need to hydrate URL-backed filters (q/diff/imp).
    if (this.source !== 'global-coding') {
      const qFromUrl = qp.get('q');
      if (qFromUrl !== null) {
        this.searchTerm = qFromUrl;
        this.search$.next(qFromUrl);
      }

      const diffFromUrl = qp.get('diff');
      if (diffFromUrl !== null) {
        const allowed: Difficulty[] = ['easy', 'intermediate', 'hard'];
        const parts = diffFromUrl
          .split(',')
          .map(x => x.trim() as Difficulty)
          .filter(x => allowed.includes(x));
        this.diffs$.next(parts);
      }

      const impFromUrl = qp.get('imp');
      if (impFromUrl !== null) {
        const allowed: ImportanceTier[] = ['low', 'medium', 'high'];
        const parts = impFromUrl
          .split(',')
          .map(x => x.trim() as ImportanceTier)
          .filter(x => allowed.includes(x));
        this.impTiers$.next(parts);
      }

      return;
    }
    const viewKey: ViewMode =
      qp.get('view') === 'formats' ? 'formats' : 'tech';

    const shouldReset = qp.get('reset') === '1';   // 👈

    if (shouldReset) {
      // Persisted state'i tamamen temizle (tech/formats view switch'te geri gelmesin)
      (this.listState as any).globalCodingState = {};

      // Runtime filtreleri sıfırla
      this.searchTerm = '';
      this.sliderValue = 5;
      this.search$.next('');
      this.diffs$.next([]);
      this.impTiers$.next([]);
      this.selectedTags$.next([]);
      this.sort$.next('default');
      this.tagMatchMode = 'all';
      this.selectedTech$.next(null);
      this.selectedKind$.next('coding');
      this.selectedCategory$.next(null);
    }

    const techFromUrl = (qp.get('tech') || '').toLowerCase() as Tech;
    const kindFromUrl = qp.get('kind');
    const categoryRaw = qp.get('category') as CategoryKey | null;
    const categoryFromUrl =
      categoryRaw && ALLOWED_CATEGORIES.includes(categoryRaw)
        ? (categoryRaw as CategoryKey)
        : null;

    // ---------- FORMATS VIEW (/coding?view=formats) ----------
    if (viewKey === 'formats') {
      if (!shouldReset) {
        // sadece reset yoksa saved state'i restore et
        this.restoreFiltersFrom('formats');
      }

      if (categoryFromUrl) {
        this.selectedCategory$.next(categoryFromUrl);
      }

      if (kindFromUrl) {
        this.selectedKind$.next(this.normalizeSelectedKind(kindFromUrl));
      } else if (shouldReset) {
        // reset geldiyse formats için default 'coding'
        this.selectedKind$.next('coding');
      }

      const qFromUrl = qp.get('q');
      if (qFromUrl !== null) {
        this.searchTerm = qFromUrl;
        this.search$.next(qFromUrl);
      }

      const topic = qp.get('topic');
      if (topic) {
        this.applyTopic(topic);
      } else {
        const focus = qp.get('focus') as FocusSlug | null;
        if (focus && FOCUS_SEED_TAGS[focus]) {
          this.tagMatchMode = 'any';
          this.selectedTags$.next([...FOCUS_SEED_TAGS[focus]]);
        }
      }

      this.hydrated = true;
      this.debug('ngOnInit hydrated', {
        viewKey,
        filters: {
          searchTerm: this.searchTerm,
          selectedKind: this.selectedKind$.value,
          selectedTech: this.selectedTech$.value,
          selectedCategory: this.selectedCategory$.value,
          diffs: this.diffs$.value,
          imps: this.impTiers$.value
        }
      });

      this.saveFiltersTo(viewKey);
      return;
    }

    // ---------- TECH VIEW (/coding) ----------
    const allSaved = shouldReset ? {} as any : this.listState.globalCodingState;
    const saved = allSaved[viewKey];
    const restoredFromState = !!saved && !shouldReset;

    // Search term + slider
    const qFromUrl = qp.get('q');
    if (qFromUrl !== null) {
      this.searchTerm = qFromUrl;
      this.search$.next(qFromUrl);
      if (saved) {
        this.sliderValue = saved.sliderValue;
      }
    } else if (saved) {
      this.searchTerm = saved.searchTerm;
      this.sliderValue = saved.sliderValue;
      this.search$.next(saved.searchTerm);
    }

    // Difficulty filters
    const diffFromUrl = qp.get('diff');
    if (diffFromUrl !== null) {
      const allowed: Difficulty[] = ['easy', 'intermediate', 'hard'];
      const parts = diffFromUrl
        .split(',')
        .map(x => x.trim() as Difficulty)
        .filter(x => allowed.includes(x));
      this.diffs$.next(parts);
    } else if (saved) {
      this.diffs$.next([...saved.diffs]);
    }

    // Importance filters
    const impFromUrl = qp.get('imp');
    if (impFromUrl !== null) {
      const allowed: ImportanceTier[] = ['low', 'medium', 'high'];
      const parts = impFromUrl
        .split(',')
        .map(x => x.trim() as ImportanceTier)
        .filter(x => allowed.includes(x));
      this.impTiers$.next(parts);
    } else if (saved) {
      this.impTiers$.next([...saved.impTiers]);
    }

    if (saved && !shouldReset) {
      this.selectedTags$.next([...saved.selectedTags]);
      this.sort$.next(saved.sort);
      this.tagMatchMode = saved.tagMatchMode;

      this.selectedTech$.next(saved.selectedTech);
      this.selectedKind$.next(this.normalizeSelectedKind(saved.selectedKind));
      this.selectedCategory$.next(saved.selectedCategory);
    }

    // ---- URL değerleri saved'in ÜSTÜNE yazıyor (veya reset modunda default'u override ediyor) ----
    const allowedTech: Tech[] = ['javascript', 'angular', 'react', 'vue', 'html', 'css'];
    if (allowedTech.includes(techFromUrl)) {
      this.selectedTech$.next(techFromUrl);
    }

    // A URL names kind only for concepts (`?kind=trivia`), so a link that sets any other filter means the coding
    // list, whichever kind this visitor last had open.
    const linkNamesFilters = ['tech', 'q', 'diff', 'imp', 'focus', 'topic', 'category', 'access'].some((k) => qp.get(k) !== null);
    if (kindFromUrl) {
      this.selectedKind$.next(this.normalizeSelectedKind(kindFromUrl));
    } else if (shouldReset || linkNamesFilters) {
      this.selectedKind$.next('coding');
    }
    if (qp.get('access') === 'free') this.setFreeOnly(true);

    const focus = qp.get('focus') as FocusSlug | null;
    const topic = qp.get('topic');
    if (topic) {
      this.applyTopic(topic);
    } else if (focus && FOCUS_SEED_TAGS[focus]) {
      this.tagMatchMode = 'any';
      this.selectedTags$.next([...FOCUS_SEED_TAGS[focus]]);
    }

    this.hydrated = true;
    this.debug('ngOnInit hydrated', {
      viewKey,
      filters: {
        searchTerm: this.searchTerm,
        selectedKind: this.selectedKind$.value,
        selectedTech: this.selectedTech$.value,
        selectedCategory: this.selectedCategory$.value,
        diffs: this.diffs$.value,
        imps: this.impTiers$.value
      }
    });

    // If we restored from persisted state and the URL is "plain /coding",
    // sync the full filter set into the URL once (replaceUrl) so refresh/share works.
    if (this.source === 'global-coding' && viewKey === 'tech' && restoredFromState) {
      const hasAnyExplicitFilter = ['tech', 'kind', 'q', 'diff', 'imp', 'focus', 'topic', 'category', 'access']
        .some((k) => qp.get(k) !== null);

      const tech = this.selectedTech$.value;
      const kind = this.selectedKind$.value;
      const q = (this.searchTerm || '').trim();
      const diffs = this.diffs$.value;
      const imps = this.impTiers$.value;

      if (!hasAnyExplicitFilter) {
        const queryParams: Record<string, any> = {
          tech: tech ?? null,
          kind: kind !== 'coding' ? kind : null,
          q: q || null,
          diff: diffs.length ? diffs.join(',') : null,
          imp: imps.length ? imps.join(',') : null,
          access: this.freeOnly$.value ? 'free' : null,
        };
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams,
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }
    }

    this.saveFiltersTo(viewKey);
  }

  private initListSeo(): void {
    if (!this.shouldApplyListSeo()) return;

    this.filtered$
      .pipe(
        takeUntil(this.destroy$),
        map(list => (list ?? []).filter((q) => q?.id && q?.title)),
        map(list => ({ list, key: list.slice(0, this.maxItemListItems).map((q) => q.id).join('|') })),
        distinctUntilChanged((a, b) => a.key === b.key),
      )
      .subscribe(({ list }) => {
        this.latestSeoList = list;
        this.updateListSeo(list);
      });

    this.route.queryParamMap
      .pipe(
        takeUntil(this.destroy$),
        map((params) => params.keys.slice().sort().join('|')),
        distinctUntilChanged(),
      )
      .subscribe(() => {
        this.updateListSeo(this.latestSeoList);
      });
  }

  private updateListSeo(list: Row[]): void {
    const baseSeo = this.getRouteSeo();
    if (!baseSeo || this.isNoIndex(baseSeo)) return;
    const queryKeys = this.route.snapshot.queryParamMap.keys;
    const seoMeta = buildCodingListSeoMeta(baseSeo, queryKeys);
    const jsonLd = this.buildCodingHubJsonLd(list);
    this.seo.updateTags({
      ...seoMeta,
      canonical: this.seo.buildCanonicalUrl('/coding'),
      jsonLd,
    });
  }

  private buildCodingHubJsonLd(list: Row[]): Record<string, any>[] {
    const canonical = this.seo.buildCanonicalUrl('/coding');
    const itemList = this.buildItemListSchema(list, canonical);
    const schemas: Record<string, any>[] = [
      {
        '@type': 'CollectionPage',
        '@id': canonical,
        url: canonical,
        name: 'Frontend Coding Challenges',
        description:
          'Choose a challenge, write the solution in the browser, run tests, and review follow-up questions for JavaScript, React, Angular, Vue, HTML, or CSS.',
        inLanguage: 'en',
        about: [
          { '@type': 'Thing', name: 'frontend coding challenges' },
          { '@type': 'Thing', name: 'JavaScript coding challenges' },
          { '@type': 'Thing', name: 'React UI challenges' },
          { '@type': 'Thing', name: 'Angular coding challenges' },
          { '@type': 'Thing', name: 'Vue coding challenges' },
          { '@type': 'Thing', name: 'HTML and CSS implementation exercises' },
          { '@type': 'Thing', name: 'frontend debugging challenges' },
        ],
      },
      {
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
            name: 'Frontend Coding Challenges',
            item: canonical,
          },
        ],
      },
    ];

    if (itemList) schemas.push(itemList);
    return schemas;
  }

  private buildItemListSchema(list: Row[], canonical: string): Record<string, any> | null {
    const items = list
      .filter((q) => q?.id && q?.title)
      .slice(0, this.maxItemListItems)
      .map((q, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: q.title,
        url: this.seo.buildCanonicalUrl(this.listItemPath(q)),
      }));

    if (!items.length) return null;
    return {
      '@type': 'ItemList',
      '@id': `${canonical}#coding-challenges`,
      url: canonical,
      name: 'Frontend Coding Challenges',
      numberOfItems: list.length,
      itemListElement: items,
    };
  }

  private listItemPath(q: Row): string {
    const commands = this.linkTo(q);
    const tree = this.router.createUrlTree(commands);
    return this.router.serializeUrl(tree);
  }

  private getRouteSeo(): SeoMeta | null {
    return (this.route.snapshot.data['seo'] as SeoMeta | undefined) ?? null;
  }

  private shouldApplyListSeo(): boolean {
    const baseSeo = this.getRouteSeo();
    if (!baseSeo) return false;
    if (this.isNoIndex(baseSeo)) return false;
    return this.source === 'global-coding';
  }

  private isNoIndex(seo: SeoMeta): boolean {
    return (seo.robots || '').toLowerCase().includes('noindex');
  }

  private applyTopic(topicId: string) {
    const id = (topicId || '').trim();
    if (!id) return;

    loadTopics()
      .then((registry) => {
        const tags = expandTopicsToTags([id], registry);
        if (!tags.length) return;
        this.tagMatchMode = 'any';
        this.selectedTags$.next([...tags]);
      })
      .catch(() => {
        // ignore (topic registry is optional at runtime)
      });
  }

  // ---------- helpers used by template ----------
  /** A row names its kind only where it differs from the list's own kind: no "Coding" on every row of a coding list. */
  questionRowKindLabel(q: Row): string {
    if (q.__sd) return 'System design';
    if (q.__debug) return 'Debugging';
    if (q.questionFormat === 'output') return 'Output';
    const listKind = this.source === 'global-coding' ? this.selectedKind$.value : this.kind;
    if (q.__kind === listKind) return '';
    return q.__kind === 'trivia' ? 'Concept' : 'Coding';
  }

  questionRowDescription(q: Row): string {
    return this.preview(this.descriptionText(q), 120);
  }

  questionRowMetaChips(q: Row): FaQuestionRowMetaChip[] {
    const chips: FaQuestionRowMetaChip[] = [
      {
        label: this.capitalize(q.difficulty),
        ariaLabel: `Difficulty: ${this.capitalize(q.difficulty)}`,
        tone: 'difficulty',
      },
      {
        label: `Priority: ${this.capitalize(this.impLabel(q))}`,
        ariaLabel: `Practice priority: ${this.capitalize(this.impLabel(q))}`,
        tone: 'importance',
        // The recommended and priority orders already rank by it; there it is read out, not drawn on every row.
        priority: this.priorityChipShown() ? 'primary' : 'secondary',
      },
    ];

    if (this.source !== 'tech') {
      chips.push({
        label: this.techName(q),
        ariaLabel: `Technology: ${this.techName(q)}`,
        tone: 'tech',
      });
    }

    return chips;
  }

  private priorityChipShown(): boolean {
    const sort = this.sort$.value;
    return sort !== 'default' && sort !== 'importance-desc' && sort !== 'importance-asc';
  }

  questionRowVariants(q: Row): FaQuestionRowVariant[] {
    return this.frameworkOptions(q).map((option) => ({
      id: option.id,
      label: this.frameworkLabel(option.tech),
      active: option.id === q.id,
      ariaLabel: `Open ${this.frameworkLabel(option.tech)} version`,
    }));
  }

  handleQuestionVariantSelected(variant: FaQuestionRowVariant, q: Row): void {
    const target = this.frameworkOptions(q).find((option) => option.id === variant.id);
    if (!target) return;
    this.goToFramework(new Event('click'), target, q);
  }

  descriptionText(q: Question): string {
    const d: any = (q as any).description;
    // Row previews and tooltips are plain text, so inline markup is stripped
    // the same way the SEO description is.
    if (typeof d === 'string') return normalizeEditorialPlainText(d);
    if (d && typeof d === 'object') {
      return normalizeEditorialPlainText((d.summary || d.text || '') as string);
    }
    return '';
  }

  /**
   * How a row answers a lowercase search term: 0 when its title has the term, 1 when only a tag or its description
   * has it, -1 when nothing does. Title matches sort first. An empty term matches every row.
   */
  private searchRank(q: Question, rawTerm: string): number {
    const term = rawTerm.trim();
    if (!term) return 0;
    if ((q.title || '').toLowerCase().includes(term)) return 0;
    if ((q.tags || []).some((tag) => String(tag || '').toLowerCase().includes(term))) return 1;
    return this.descriptionText(q).toLowerCase().includes(term) ? 1 : -1;
  }

  private decodeHtmlEntities(value: string): string {
    return (value || '')
      .replace(/&amp;(?=lt;|gt;|amp;|quot;|#39;)/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');
  }

  linkTo(q: Row): any[] {
    // System-design rows (from formats view) go to /system-design/:id
    if (q.__sd || (this.isFormatsMode() && inferCategory(q) === 'system')) {
      return ['/system-design', q.id];
    }

    const tech = (q as any).tech ?? this.tech ?? 'javascript';
    if (q.__kind === 'trivia') return ['/', tech, 'trivia', q.id];
    if (q.__debug) return ['/', tech, 'debug', q.id];
    return ['/', tech, 'coding', q.id];
  }

  stateForNav(list: Row[], current: Row, companySlug: string | null) {
    const items: PracticeItem[] = list.map((r) => ({
      tech: (r.tech ?? this.tech ?? 'javascript') as Tech,
      kind: r.__debug ? 'debug' : r.__kind,
      id: r.id,
      access: r.access,
    }));
    const index = Math.max(0, list.findIndex((r) => r.id === current.id));
    const session: PracticeSession = { items, index };

    let returnToUrl = this.location.path(true) || this.router.url;

    // 🔹 Global /coding listesi: encode current filters into return URL
    if (this.source === 'global-coding') {
      const viewKey = this.getActiveViewKey();
      returnToUrl = this.buildReturnUrl(viewKey);

      // Drop reset=1 if present
      if (this.isBrowser) {
        try {
          const url = new URL(returnToUrl, window.location.origin);
          url.searchParams.delete('reset');
          returnToUrl = url.pathname + url.search;
        } catch {
          // ignore
        }
      }
    }

    const returnLabel =
      this.source === 'company'
        ? this.companyLabel(companySlug || undefined)
        : this.source === 'global-coding'
          ? this.isFormatsMode()
            ? 'All formats'
            : 'All questions'
          : `${this.capitalize(this.tech ?? 'javascript')} ${this.kind === 'trivia'
            ? 'Concepts'
            : this.kind === 'coding'
              ? 'Coding'
              : 'Questions'
          }`;

    return {
      session,
      returnToUrl,
      returnLabel,
    };
  }

  detailStateForCompany(companySlug: string | null): { [k: string]: any } | undefined {
    if (this.source !== 'company') return undefined;
    return {
      returnTo: ['/companies', this.kind === 'all' ? 'all' : this.kind],
      returnLabel: this.companyLabel(companySlug)
    };
  }

  heading(): string {
    if (this.source === 'global-coding') {
      const k = this.selectedKind$.value;
      const kindLabel =
        k === 'trivia' ? 'Concept' : 'Coding';

      if (this.isFormatsMode()) {
        const cat = this.selectedCategory$.value;
        const catLabel =
          !cat ? '' :
            cat === 'ui' ? ' — User interface' :
              cat === 'js-fn' ? ' — JavaScript functions' :
                cat === 'html-css' ? ' — HTML & CSS' :
                  cat === 'algo' ? ' — Algorithmic coding' :
                    ' — System design';
        return `${kindLabel} questions${catLabel}`;
      }
      return `${kindLabel} questions`;
    }

    const t = this.tech ?? 'javascript';
    const what =
      this.kind === 'coding' ? 'Coding Challenges'
        : this.kind === 'trivia' ? 'Interview Concept Questions'
          : 'All Questions';
    return `${this.capitalize(t)} ${what}`;
  }

  private capitalize(s: string | null | undefined) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

  private normalizeSelectedKind(value: string | null | undefined): SelectedKind {
    return value === 'trivia' ? 'trivia' : 'coding';
  }

  techName(q: Row) {
    // System design questions: show a custom label
    if (q.__sd) {
      return 'System design';
    }

    const tech = (q.tech ?? 'javascript') as Tech;
    switch (tech) {
      case 'angular': return 'Angular';
      case 'react': return 'React';
      case 'vue': return 'Vue';
      case 'html': return 'HTML';
      case 'css': return 'CSS';
      default: return 'JavaScript';
    }
  }

  companyLabel(slug?: string | null) {
    if (!slug) return 'Companies';
    const map: Record<string, string> = {
      google: 'Google', amazon: 'Amazon', apple: 'Apple', meta: 'Meta',
      microsoft: 'Microsoft', uber: 'Uber', airbnb: 'Airbnb', netflix: 'Netflix',
      faang: 'FAANG'
    };
    return map[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
  }

  techLabel(tech: Tech | null | undefined): string {
    switch (tech) {
      case 'angular': return 'Angular';
      case 'react': return 'React';
      case 'vue': return 'Vue';
      case 'html': return 'HTML';
      case 'css': return 'CSS';
      default: return 'JavaScript';
    }
  }

  discoverySectionTestId(section: CodingHubDiscoverySection): string {
    return section.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private replaceQueryParams(params: Record<string, any>) {
    if (!this.isBrowser || this.navigatingToDetail) return;
    // NOTE: We intentionally use `Location.replaceState()` (no navigation / no history pollution),
    // so Angular Router's internal `ActivatedRoute` query state can be stale.
    // Merge against the *actual* current URL to avoid dropping previously-set params.
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined || value === '') {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, String(value));
      }
    }

    const qs = url.searchParams.toString();
    this.location.replaceState(`${url.pathname}${qs ? `?${qs}` : ''}${url.hash}`);
  }

  tabsQueryParams(): Record<string, any> {
    const q = (this.searchTerm || '').trim();
    const diffs = this.diffs$.value;
    const imps = this.impTiers$.value;
    return {
      q: q || null,
      diff: diffs.length ? diffs.join(',') : null,
      imp: imps.length ? imps.join(',') : null,
    };
  }

  // GLOBAL filters
  toggleTech(key: Tech) {
    const curr = this.selectedTech$.value;
    const next = curr === key ? null : key;

    this.selectedTech$.next(next);
    this.debug('toggleTech', { key, next });

    // Formats view'de URL'yi kirletme, sadece state kalsın
    if (this.source === 'global-coding' && !this.isFormatsMode()) {
      this.replaceQueryParams({ tech: next ?? null });
    }
    this.saveFiltersTo(this.getActiveViewKey());
  }

  selectKind(k: SelectedKind) {
    this.debug('selectKind', { k, source: this.source, view: this.currentViewKey });
    if (this.source === 'global-coding') {
      this.selectedKind$.next(k);

      this.replaceQueryParams({ kind: k === 'coding' ? null : k });
      this.saveFiltersTo(this.getActiveViewKey());
    } else {
      this.kind = k as any;
    }
  }

  toggleCategory(key: CategoryKey) {
    const curr = this.selectedCategory$.value;
    const next = curr === key ? null : key;
    this.selectedCategory$.next(next);
    this.debug('toggleCategory', { key, next });

    if (this.source === 'global-coding') {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          view: 'formats',
          category: next ?? null
        },
        queryParamsHandling: 'merge',
      });
    }

    if (next === 'system') {
      this.selectedKind$.next('coding');
    }

    this.saveFiltersTo(this.getActiveViewKey());
  }

  /** A company's debugging tasks, such as Stripe's bug squash: counted and listed with its coding tasks. */
  /** Debugging tasks are code to fix, so they list with the coding tasks; `preloaded` comes from the route resolver. */
  private debugRows$(preloaded?: MixedQuestionListItem[]): Observable<Row[]> {
    const items$ = preloaded ? of(preloaded) : this.qs.loadAllDebugSummaries({ transferState: false });
    return items$.pipe(
      map((list) => list.map<Row>((q) => ({ ...q, __kind: 'coding', __debug: true, tech: q.tech }))),
    );
  }

  private loadSystemDesignRows$(): Observable<Row[]> {
    const cached = this.systemDesignRowsCache$;
    if (cached) {
      return cached;
    }

    const anyQs = this.qs as any;
    const fn =
      anyQs.loadSystemDesignList ||
      anyQs.loadSystemDesignIndex ||
      anyQs.loadSystemDesign;

    if (typeof fn !== 'function') {
      const empty$ = of<Row[]>([]);
      this.systemDesignRowsCache$ = empty$;
      return empty$;
    }
    const rows$ = (fn.call(anyQs, { transferState: false }) as any).pipe(
      map((items: any[]) =>
        (items || []).map<Row>(it => ({
          id: it.id,
          title: it.title,
          description: typeof it.description === 'string'
            ? it.description
            : (it.description?.text || ''),
          technology: 'javascript' as Technology,
          type: 'coding',
          difficulty: 'intermediate',
          importance: 4,
          tags: it.tags ?? [],
          companies: it.companies ?? [],
          access: (it as any).access ?? 'free',
          __kind: 'coding',
          tech: undefined,
          __sd: true
        }))
      ),
      shareReplay(1),
    );
    this.systemDesignRowsCache$ = rows$;
    return rows$;
  }

  private isFormatsMode(): boolean {
    return this.source === 'global-coding' && this.viewMode === 'formats';
  }

  isSystemCategoryActive(): boolean {
    return this.isFormatsMode() && this.selectedCategory$.value === 'system';
  }

  onDiffChange(d: Difficulty, ev: Event) {
    const checked = (ev.target as HTMLInputElement | null)?.checked ?? false;
    this.toggleDiff(d, checked);
  }

  toggleDiff(d: Difficulty, checked: boolean) {
    const curr = new Set(this.diffs$.value);
    checked ? curr.add(d) : curr.delete(d);
    const next = Array.from(curr);
    this.diffs$.next(next);
    this.syncDiffsToQuery(next);
    this.saveFiltersTo(this.getActiveViewKey());
  }

  onImpChange(tier: ImportanceTier, ev: Event) {
    this.toggleImp(tier, (ev.target as HTMLInputElement | null)?.checked ?? false);
  }

  toggleImp(tier: ImportanceTier, checked: boolean) {
    const curr = new Set(this.impTiers$.value);
    checked ? curr.add(tier) : curr.delete(tier);
    const next = Array.from(curr);
    this.impTiers$.next(next);
    this.syncImpToQuery(next);
    this.saveFiltersTo(this.getActiveViewKey());
  }

  impLabel(q: Row): ImportanceTier {
    return tierFromImportance(q.importance);
  }

  // ---------- Tag helpers ----------
  toggleTag(tag: string) {
    tag = (tag || '').trim();
    if (!tag) return;
    const curr = new Set(this.selectedTags$.value);
    curr.has(tag) ? curr.delete(tag) : curr.add(tag);
    this.selectedTags$.next(Array.from(curr));
    this.saveFiltersTo(this.getActiveViewKey());
  }
  clearTag(tag: string) {
    const curr = new Set(this.selectedTags$.value);
    if (curr.delete(tag)) {
      this.selectedTags$.next(Array.from(curr));
      this.saveFiltersTo(this.getActiveViewKey());
    }
  }
  clearAllTags() {
    this.selectedTags$.next([]);
    this.saveFiltersTo(this.getActiveViewKey());
  }

  resetAllFilters() {
    if (this.source === 'global-coding') {
      // Clear persisted view state so filters don't "snap back" later.
      (this.listState as any).globalCodingState = {};
    }

    // Runtime state
    this.searchTerm = '';
    this.sliderValue = 5;
    this.search$.next('');
    this.diffs$.next([]);
    this.impTiers$.next([]);
    this.selectedTags$.next([]);
    this.sort$.next('default');
    this.tagMatchMode = 'all';
    this.selectedTech$.next(null);
    this.selectedKind$.next('coding');
    this.selectedCategory$.next(null);
    this.setFreeOnly(false);
    this.setProgressFilter('all', 'reset');
    this.closeSort();

    // URL state
    this.replaceQueryParams({
      q: null,
      diff: null,
      imp: null,
      tech: null,
      kind: null,
      category: null,
      focus: null,
      topic: null,
      access: null,
      reset: null,
    });
  }

  toggleTagMatchMode() {
    this.tagMatchMode = this.tagMatchMode === 'all' ? 'any' : 'all';
    this.selectedTags$.next([...this.selectedTags$.value]);
    this.saveFiltersTo(this.getActiveViewKey());
  }

  private difficultyRank(d: Difficulty | string | undefined): number {
    const map: Record<string, number> = { easy: 0, intermediate: 1, hard: 2 };
    return map[String(d || '').toLowerCase()] ?? 1;
  }

  private isWarmupTitle(title: string | null | undefined): boolean {
    return /\bwarm[-\s]?up\b/i.test(title ?? '');
  }

  private isPremiumQuestion(q: Row | null | undefined): boolean {
    return String((q as any)?.access || '').toLowerCase() === 'premium';
  }

  isGuestDefaultGlobalLibrary(): boolean {
    return this.source === 'global-coding'
      && !this.auth.user()
      && !this.isFormatsMode()
      && this.selectedKind$.value === 'coding'
      && !this.selectedTech$.value
      && !this.selectedCategory$.value
      && !(this.searchTerm || '').trim()
      && this.diffs$.value.length === 0
      && this.impTiers$.value.length === 0
      && this.selectedTags$.value.length === 0
      && this.sort$.value === 'default';
  }

  private shouldPromoteDefaultStart(state: {
    term: string;
    diffs: Difficulty[];
    tiers: ImportanceTier[];
    selectedTech: Tech | null;
    selectedCategory: CategoryKey | null;
    selTags: string[];
    sortKey: SortKey;
    isFormats: boolean;
  }): boolean {
    return this.source === 'global-coding'
      && !this.auth.user()
      && !state.isFormats
      && this.selectedKind$.value === 'coding'
      && !state.selectedTech
      && !state.selectedCategory
      && !String(state.term || '').trim()
      && state.diffs.length === 0
      && state.tiers.length === 0
      && state.selTags.length === 0
      && state.sortKey === 'default';
  }

  /** Essential 60 tasks first by rank, then practice priority, difficulty and title. */
  private compareEssentialRows(a: Row, b: Row, ranks: ReadonlyMap<string, number>): number {
    const rank = (row: Row): number => ranks.get(`${row.__kind}:${row.id}`) ?? Number.POSITIVE_INFINITY;
    const byRank = rank(a) - rank(b);
    if (byRank) return byRank;
    const byImportance = (b.importance ?? 0) - (a.importance ?? 0);
    if (byImportance) return byImportance;
    return this.difficultyRank(a.difficulty) - this.difficultyRank(b.difficulty)
      || (a.title || '').localeCompare(b.title || '');
  }

  private compareDefaultStartRows(a: Row, b: Row): number {
    const aDefault = a.id === DEFAULT_START_QUESTION_ID;
    const bDefault = b.id === DEFAULT_START_QUESTION_ID;
    if (aDefault !== bDefault) return aDefault ? -1 : 1;

    const aPremium = this.isPremiumQuestion(a);
    const bPremium = this.isPremiumQuestion(b);
    if (aPremium !== bPremium) return aPremium ? 1 : -1;

    const aImportance = Number.isFinite(a.importance) ? (a.importance ?? 0) : 0;
    const bImportance = Number.isFinite(b.importance) ? (b.importance ?? 0) : 0;
    if (aImportance !== bImportance) return bImportance - aImportance;

    const aDifficulty = this.difficultyRank(a.difficulty);
    const bDifficulty = this.difficultyRank(b.difficulty);
    if (aDifficulty !== bDifficulty) return aDifficulty - bDifficulty;

    return (a.title || '').localeCompare(b.title || '');
  }
  private createdTs(q: any): number {
    const raw = q.createdAt || q.created || q.date || q.addedAt || q.added;
    const t = raw ? new Date(raw).getTime() : NaN;
    return Number.isFinite(t) ? t : 0;
  }

  private makeComparator(key: SortKey) {
    const titleAsc = (a: any, b: any) => (a.title || '').localeCompare(b.title || '');
    const titleDesc = (a: any, b: any) => titleAsc(b, a);
    const imp = (q: any) => Number.isFinite(q.importance) ? (q.importance ?? 0) : 0;

    switch (key) {
      case 'title-asc': return titleAsc;
      case 'title-desc': return titleDesc;
      case 'difficulty-asc':
        return (a: any, b: any) =>
          this.difficultyRank(a.difficulty) - this.difficultyRank(b.difficulty) || titleAsc(a, b);
      case 'difficulty-desc':
        return (a: any, b: any) =>
          this.difficultyRank(b.difficulty) - this.difficultyRank(a.difficulty) || titleAsc(a, b);
      case 'importance-asc':
        return (a: any, b: any) => imp(a) - imp(b) || titleAsc(a, b);
      case 'importance-desc':
        return (a: any, b: any) => imp(b) - imp(a) || titleAsc(a, b);
      case 'created-asc':
        return (a: any, b: any) => this.createdTs(a) - this.createdTs(b) || titleAsc(a, b);
      case 'created-desc':
        return (a: any, b: any) => this.createdTs(b) - this.createdTs(a) || titleAsc(a, b);
      case 'default':
      default:
        return (a: any, b: any) => {
          // 1) Difficulty: Easy → Hard
          const da = this.difficultyRank(a.difficulty);
          const db = this.difficultyRank(b.difficulty);
          if (da !== db) return da - db;

          // 2) Importance: High → Low
          const ia = imp(a);
          const ib = imp(b);
          if (ia !== ib) return ib - ia;

          // 3) Son çare: Title A–Z
          return titleAsc(a, b);
        };
    }
  }

  preview(text: string, max = 80): string {
    if (!text) return '';
    const t = text.trim();
    if (t.length <= max) return t;
    return t.slice(0, max).trimEnd() + '…';
  }

  go(q: Row, list: Row[]) {
    this.debug('go -> detail', {
      viewKey: this.getActiveViewKey(),
      currentViewKey: this.currentViewKey,
      selectedKind: this.selectedKind$.value,
      selectedTech: this.selectedTech$.value,
      selectedCategory: this.selectedCategory$.value,
      searchTerm: this.searchTerm,
    });

    if (this.source === 'global-coding') {
      const viewKey = this.getActiveViewKey();  // 🔸 artık state'e göre
      this.saveFiltersTo(viewKey);
    }

    const commands = this.linkTo(q);
    const state = this.stateForNav(list, q, this.currentCompanySlug);
    this.navigatingToDetail = true;
    void this.router.navigate(commands, { state }).finally(() => {
      this.navigatingToDetail = false;
    });
  }

  private dedupeFrameworkRows(list: Row[]): Row[] {
    const shouldDedupe = this.source === 'global-coding' || this.source === 'company';
    if (!shouldDedupe) return list;

    const nonFam: Row[] = [];
    const buckets = new Map<string, Row[]>();

    for (const row of list) {
      const fam = FRAMEWORK_FAMILY_BY_ID.get(row.id);
      if (!fam) {
        nonFam.push(row);
        continue;
      }
      const arr = buckets.get(fam.key) ?? [];
      arr.push(row);
      buckets.set(fam.key, arr);
    }

    const choose = (rows: Row[]): Row => {
      const preferred = this.selectedTech$.value;
      if (preferred) {
        const hit = rows.find(r => r.tech === preferred);
        if (hit) return hit;
      }

      const fallbackOrder: Tech[] = ['react', 'angular', 'vue', 'javascript', 'html', 'css'];
      for (const t of fallbackOrder) {
        const hit = rows.find(r => r.tech === t);
        if (hit) return hit;
      }
      return rows[0];
    };

    const collapsed: Row[] = [];
    for (const rows of buckets.values()) {
      collapsed.push(choose(rows));
    }

    return [...nonFam, ...collapsed];
  }

  frameworkOptions(q: Row): FrameworkVariant[] {
    if (q.__kind !== 'coding') return [];
    const fam = FRAMEWORK_FAMILY_BY_ID.get(q.id);
    return fam ? fam.members : [];
  }

  frameworkLabel(tech: Tech): string {
    return frameworkLabel(tech);
  }

  goToFramework(ev: Event, opt: FrameworkVariant, source?: Row) {
    ev.stopPropagation();
    ev.preventDefault();

    const path = ['/', opt.tech, opt.kind === 'trivia' ? 'trivia' : 'coding', opt.id];
    this.router.navigate(path, {
      state: {
        returnToUrl: this.location.path(true) || this.router.url,
        returnLabel: 'Back to questions',
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeMobileFilters();

    // Global /coding listesi için, çıkarken son filtre durumunu kaydet
    if (this.source === 'global-coding' && this.hydrated) {
      const viewKey = this.getActiveViewKey(); // 'tech' veya 'formats'
      this.saveFiltersTo(viewKey);
      this.debug('ngOnDestroy save', { viewKey });
    }

    this.viewModeSub?.unsubscribe();
    this.navSub?.unsubscribe();
    if (this.isBrowser) {
      document.removeEventListener('click', this.handleDocumentClick, { capture: true });
    }
  }

  private getViewKeyFromRoute(): ViewMode {
    const qp = this.route.snapshot.queryParamMap;
    const view = qp.get('view');
    return view === 'formats' ? 'formats' : 'tech';
  }

  onSearchTermChange(term: string) {
    this.searchTerm = term;
    this.search$.next(term);

    this.replaceQueryParams({ q: term || null });
    this.saveFiltersTo(this.getActiveViewKey());
  }

  onDifficultyToggleFromChild(evt: { difficulty: Difficulty; checked: boolean }) {
    this.toggleDiff(evt.difficulty, evt.checked);
  }

  onImportanceToggleFromChild(evt: { tier: ImportanceTier; checked: boolean }) {
    const curr = new Set(this.impTiers$.value);
    evt.checked ? curr.add(evt.tier) : curr.delete(evt.tier);
    const next = Array.from(curr);
    this.impTiers$.next(next);
    this.syncImpToQuery(next);
    this.saveFiltersTo(this.getActiveViewKey());
  }

  private syncDiffsToQuery(next: Difficulty[]) {
    if (this.isFormatsMode()) return;
    const value = next.length ? next.join(',') : null;
    this.replaceQueryParams({ diff: value });
  }

  private syncImpToQuery(next: ImportanceTier[]) {
    if (this.isFormatsMode()) return;
    const value = next.length ? next.join(',') : null;
    this.replaceQueryParams({ imp: value });
  }

  private onViewModeChange(next: ViewMode) {
    const prev = this.currentViewKey;

    if (!this.viewModeInitialized) {
      this.currentViewKey = next;
      this.viewMode = next;
      this.viewModeInitialized = true;
      this.debug('viewMode init', { next });
      return;
    }

    if (prev === next) {
      this.viewMode = next;
      this.debug('viewMode same', { prev, next });
      return;
    }

    this.currentViewKey = next;

    if (this.source === 'global-coding') {
      this.saveFiltersTo(prev);
      this.restoreFiltersFrom(next);
    }

    this.viewMode = next;

    if (next === 'tech') {
      this.selectedCategory$.next(null);
    }

    this.debug('viewMode change', { prev, next, savedPrev: prev, restoredNext: next, currentViewKey: this.currentViewKey });
  }

  private saveFiltersTo(view: ViewMode) {
    if (this.source !== 'global-coding') return;
    if (!this.isBrowser) return;
    if (!this.hydrated) {
      this.debug('saveFiltersTo skipped (not hydrated)', { view });
      return;
    }

    const url = new URL(window.location.href);
    const topic = url.searchParams.get('topic');
    const focus = url.searchParams.get('focus');
    if (topic || focus) {
      // URL-scoped focus/topic filters shouldn't leak into persisted state.
      return;
    }

    const snapshot: CodingListFilterState = {
      searchTerm: this.searchTerm,
      sliderValue: this.sliderValue,
      diffs: this.diffs$.value,
      impTiers: this.impTiers$.value,
      selectedTech: this.selectedTech$.value,
      selectedKind: this.selectedKind$.value,
      selectedCategory: this.selectedCategory$.value,
      selectedTags: this.selectedTags$.value,
      sort: this.sort$.value,
      tagMatchMode: this.tagMatchMode,
    };

    this.listState.globalCodingState = {
      ...this.listState.globalCodingState,
      [view]: snapshot,
    };

    this.debug('saveFiltersTo', { view, snapshot });
  }

  private restoreFiltersFrom(view: ViewMode) {
    if (this.source !== 'global-coding') return;

    const saved = this.listState.globalCodingState[view];
    this.debug('restoreFiltersFrom: start', { view, hasSaved: !!saved, saved });

    if (!saved) {
      // temiz başlangıç
      this.searchTerm = '';
      this.sliderValue = 5;
      this.search$.next('');
      this.diffs$.next([]);
      this.impTiers$.next([]);
      this.selectedTags$.next([]);
      this.sort$.next('default');
      this.tagMatchMode = 'all';

      if (view === 'formats') {
        // formats için: URL'deki category param'ını oku
        const qp = this.route.snapshot.queryParamMap;
        const raw = (qp.get('category') || '') as CategoryKey;
        const cat = ALLOWED_CATEGORIES.includes(raw) ? raw : null;

        this.selectedCategory$.next(cat);
        this.selectedKind$.next('coding');
      } else {
        // tech view için her şeyi sıfırla
        this.selectedTech$.next(null);
        this.selectedCategory$.next(null);
        this.selectedKind$.next('coding');
      }
      return;
    }

    this.searchTerm = saved.searchTerm;
    this.sliderValue = saved.sliderValue;
    this.search$.next(saved.searchTerm);

    this.diffs$.next([...saved.diffs]);
    this.impTiers$.next([...saved.impTiers]);
    this.selectedTags$.next([...saved.selectedTags]);
    this.sort$.next(saved.sort);
    this.tagMatchMode = saved.tagMatchMode;

    if (view === 'formats') {
      // formats'ta selectedTech global kalsın, sadece formats'a ait olanları yükle
      this.selectedKind$.next(this.normalizeSelectedKind(saved.selectedKind));
      this.selectedCategory$.next(saved.selectedCategory);
    } else {
      // tech view'de hepsini yükle
      this.selectedTech$.next(saved.selectedTech);
      this.selectedKind$.next(this.normalizeSelectedKind(saved.selectedKind));
      this.selectedCategory$.next(saved.selectedCategory);
    }

    this.debug('restoreFiltersFrom: applied', { view, searchTerm: this.searchTerm, selectedKind: this.selectedKind$.value, selectedTech: this.selectedTech$.value, selectedCategory: this.selectedCategory$.value });
  }

  private getActiveViewKey(): ViewMode {
    // Derive from the current URL so we save/restore under the correct bucket
    return this.getViewKeyFromRoute();
  }

  private buildReturnUrl(view: ViewMode): string {
    const queryParams: Record<string, any> = {};

    if (view === 'formats') {
      queryParams['view'] = 'formats';
      const cat = this.selectedCategory$.value;
      if (cat) queryParams['category'] = cat;
    } else {
      const tech = this.selectedTech$.value;
      if (tech) queryParams['tech'] = tech;
    }

    const kind = this.selectedKind$.value;
    if (kind !== 'coding') queryParams['kind'] = kind;

    const q = (this.searchTerm || '').trim();
    if (q) queryParams['q'] = q;

    const diffs = this.diffs$.value;
    if (diffs.length) queryParams['diff'] = diffs.join(',');

    const imps = this.impTiers$.value;
    if (imps.length) queryParams['imp'] = imps.join(',');

    const tree = this.router.createUrlTree(['/coding'], { queryParams });
    return this.router.serializeUrl(tree);
  }

  private debug(_msg: string, _data?: any) {
    // debug logging disabled
  }
}
