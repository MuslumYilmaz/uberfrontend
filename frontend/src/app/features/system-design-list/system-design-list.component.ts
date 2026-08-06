import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
  startWith,
  switchMap,
  takeUntil,
} from 'rxjs/operators';
import {
  resolveSystemDesignPractice,
  SystemDesignListItem,
  SystemDesignPracticeMetadata,
  SystemDesignTargetLevel,
} from '../../core/models/system-design.model';
import { AuthService } from '../../core/services/auth.service';
import { isQuestionLockedForTier } from '../../core/models/question.model';
import { AnalyticsService } from '../../core/services/analytics.service';
import { SeoMeta, SeoService } from '../../core/services/seo.service';
import { QuestionService } from '../../core/services/question.service';
import { SystemDesignListResolved } from '../../core/resolvers/question-list.resolver';
import { FaButtonComponent } from '../../shared/ui/button/fa-button.component';
import { FaSelectComponent } from '../../shared/ui/select/fa-select.component';
import { performanceGuideAnchorForQuestion } from './system-design-detail/system-design-guide-link.util';

type FormatCategory = 'application' | 'component' | 'realtime' | 'ai-product';
type AccessFilter = 'free' | 'premium';

type SystemDesignFilterState = {
  q: string;
  level: SystemDesignTargetLevel | null;
  access: AccessFilter | null;
  format: FormatCategory | null;
  tags: string[];
};

type SystemDesignViewItem = SystemDesignListItem & {
  sourceOrder: number;
  practice: SystemDesignPracticeMetadata;
  formatCategory: FormatCategory;
  formatLabel: string;
  formatDetail: string;
  summary: string;
  guideRoute: string[];
  guideLabel: string;
};

type SystemDesignStats = {
  total: number;
  free: number;
  premium: number;
  formatCount: number;
};

type PriorityQuestionSeed = {
  id: string;
  keyword: string;
  detail: string;
};

type PriorityQuestion = PriorityQuestionSeed & {
  title: string;
  access: 'free' | 'premium';
  route: string[];
};

@Component({
  standalone: true,
  selector: 'app-system-design-list',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    InputTextModule,
    FaButtonComponent,
    FaSelectComponent,
  ],
  templateUrl: './system-design-list.component.html',
  styleUrls: ['./system-design-list.component.css']
})
export class SystemDesignListComponent implements OnInit, OnDestroy {
  searchTerm = '';
  selectedLevel: SystemDesignTargetLevel | null = null;
  selectedAccess: AccessFilter | null = null;
  selectedFormat: FormatCategory | null = null;
  selectedTags: string[] = [];

  readonly levelOptions = [
    { label: 'All levels', value: null },
    { label: 'Junior', value: 'junior' as const },
    { label: 'Mid', value: 'mid' as const },
    { label: 'Senior', value: 'senior' as const },
  ];

  readonly accessOptions = [
    { label: 'All access', value: null },
    { label: 'Free', value: 'free' as const },
    { label: 'Premium', value: 'premium' as const },
  ];

  readonly formatOptions = [
    { label: 'All formats', value: null },
    { label: 'Application architecture', value: 'application' as const },
    { label: 'UI component systems', value: 'component' as const },
    { label: 'Realtime and data-heavy UI', value: 'realtime' as const },
    { label: 'AI product workflows', value: 'ai-product' as const },
  ];

  readonly testedAreas = [
    {
      title: 'Requirements',
      detail: 'Clarify users, success metrics, latency, device constraints, and edge cases before drawing UI boxes.',
    },
    {
      title: 'Architecture',
      detail: 'Split client state, server data, rendering paths, routing, and ownership boundaries into defendable pieces.',
    },
    {
      title: 'Data model',
      detail: 'Define the entities, cache keys, pagination windows, optimistic updates, and stale-data behavior.',
    },
    {
      title: 'Interface',
      detail: 'Explain component contracts, accessibility states, loading/error UX, and interaction affordances.',
    },
    {
      title: 'Optimizations',
      detail: 'Choose tradeoffs for performance, virtualization, streaming, resilience, monitoring, and graceful degradation.',
    },
  ];

  readonly formatGroups = [
    {
      category: 'application' as FormatCategory,
      title: 'Application architecture',
      detail: 'Dashboards, feeds, preferences, multi-step flows, and feature slices where ownership and data flow matter.',
    },
    {
      category: 'component' as FormatCategory,
      title: 'UI component systems',
      detail: 'Design systems, forms, uploaders, toasts, drag/drop, accessibility states, and reusable contracts.',
    },
    {
      category: 'realtime' as FormatCategory,
      title: 'Realtime and data-heavy UI',
      detail: 'Notifications, live comments, charts, streams, infinite scroll, caching, and high-frequency updates.',
    },
    {
      category: 'ai-product' as FormatCategory,
      title: 'AI product workflows',
      detail: 'Streaming chat, image generation, model-progress dashboards, resilience, cancellation, and user control.',
    },
  ];

  readonly radioSteps = [
    {
      label: 'R',
      title: 'Requirements',
      route: ['/', 'guides', 'system-design-blueprint', 'radio-requirements'],
    },
    {
      label: 'A',
      title: 'Architecture',
      route: ['/', 'guides', 'system-design-blueprint', 'architecture'],
    },
    {
      label: 'D',
      title: 'Data model',
      route: ['/', 'guides', 'system-design-blueprint', 'state-data'],
    },
    {
      label: 'I',
      title: 'Interface',
      route: ['/', 'guides', 'system-design-blueprint', 'ux'],
    },
    {
      label: 'O',
      title: 'Optimizations',
      route: ['/', 'guides', 'system-design-blueprint', 'performance'],
    },
  ];

  readonly premiumSignals = [
    'Full RADIO breakdowns for premium prompts',
    'Tradeoff framing for state, APIs, caching, rendering, and performance',
    'Locked prompt previews explain the case while full premium solutions stay protected',
  ];

  readonly relatedFocusLinks = [
    {
      label: 'UI coding interview questions',
      detail: 'Practice the UI implementation round before turning a widget into a system-design answer.',
      route: ['/machine-coding'],
    },
    {
      label: '30-day guided plan',
      detail: 'Add frontend system design after JavaScript, UI coding, and framework fundamentals are stable.',
      route: ['/tracks', 'foundations-30d', 'preview'],
    },
    {
      label: 'JavaScript interview questions',
      detail: 'Review async, DOM, debounce, throttle, and state behavior that often drives design tradeoffs.',
      route: ['/javascript/interview-questions'],
    },
    {
      label: 'Company prep',
      detail: 'Use company-specific loops after you can explain architecture tradeoffs consistently.',
      route: ['/companies'],
    },
  ];

  readonly startSteps = [
    {
      step: 'Step 1',
      title: 'Start with a familiar UI problem',
      detail: 'Practice global ownership, visible limits, timer cleanup, and accessible announcements in a junior-sized prompt.',
      route: ['/', 'system-design', 'notification-toast-system'],
      cta: 'Design a toast notification system',
    },
    {
      step: 'Step 2',
      title: 'Learn the RADIO answer sequence',
      detail: 'Use Requirements, Architecture, Data, Interface, and Optimizations to make your decisions easy to follow.',
      route: ['/', 'guides', 'system-design-blueprint', 'radio-framework'],
      cta: 'Open the RADIO framework',
    },
    {
      step: 'Step 3',
      title: 'Handle async sends and streaming',
      detail: 'Move to IME-safe sending, attachment readiness, stop/retry behavior, and stale stream protection.',
      route: ['/', 'system-design', 'ai-chat-textarea-design'],
      cta: 'Design an AI chat composer',
    },
    {
      step: 'Step 4',
      title: 'Finish with a senior layout case',
      detail: 'Defend drag, resize, persistence, migration, performance, and ownership decisions across responsive layouts.',
      route: ['/', 'system-design', 'dashboard-widgets-draggable-resizable'],
      cta: 'Design a customizable dashboard',
    },
  ];

  private readonly priorityQuestionSeeds: PriorityQuestionSeed[] = [
    {
      id: 'infinite-scroll-list',
      keyword: 'Infinite lists',
      detail: 'Pagination, virtualization, loading states, and scroll performance.',
    },
    {
      id: 'notification-toast-system',
      keyword: 'Notification systems',
      detail: 'Global toast APIs, timers, stacking, portals, cleanup, and accessible announcements.',
    },
    {
      id: 'realtime-search-debounce-cache',
      keyword: 'Autocomplete and search',
      detail: 'Debounce, cancellation, stale responses, caching, and perceived speed.',
    },
    {
      id: 'news-feed-timeline',
      keyword: 'Feeds and timelines',
      detail: 'Feed hydration, cursor pagination, media lazy loading, and realtime updates.',
    },
    {
      id: 'ai-chat-textarea-design',
      keyword: 'Streaming chat',
      detail: 'IME composition, attachments, submit/cancel/retry, and current-turn streaming.',
    },
    {
      id: 'component-design-system-architecture',
      keyword: 'Design systems',
      detail: 'Tokens, component APIs, accessibility contracts, theming, and versioning.',
    },
    {
      id: 'live-comments-global-stream',
      keyword: 'Realtime collaboration',
      detail: 'WebSocket/SSE updates, buffering, moderation UI, and burst control.',
    },
    {
      id: 'dashboard-widgets-draggable-resizable',
      keyword: 'Staff-level dashboards',
      detail: 'Layout persistence, drag/resize performance, constraints, and ownership boundaries.',
    },
  ];

  readonly commonMistakes = [
    {
      title: 'Jumping into components too early',
      fix: 'Clarify scope, users, scale, and success metrics before drawing the component tree.',
    },
    {
      title: 'Giving vague state management answers',
      fix: 'Separate local UI state, shared client state, server state, cache state, and hot interaction state.',
    },
    {
      title: 'Ignoring rendering and caching strategy',
      fix: 'Name SSR/CSR tradeoffs, cache keys, freshness rules, invalidation, and perceived performance.',
    },
    {
      title: 'Skipping accessibility, security, and reliability',
      fix: 'Include keyboard flows, ARIA states, safe rendering, auth boundaries, retry, and fallback behavior.',
    },
    {
      title: 'Not naming tradeoffs',
      fix: 'Explain why the chosen architecture beats at least one alternative under the given constraints.',
    },
  ];

  readonly evaluationRubric = [
    { area: 'Requirements', signal: 'Defines users, scope, non-goals, scale, latency, and success metrics.' },
    { area: 'Architecture', signal: 'Shows rendering strategy, state boundaries, route ownership, and service contracts.' },
    { area: 'Data/state', signal: 'Separates server data, client state, cache, optimistic queues, and transient UI state.' },
    { area: 'APIs/events', signal: 'Explains payloads, pagination, mutations, realtime events, retries, and cancellation.' },
    { area: 'Interface/accessibility', signal: 'Covers component APIs, loading/error/empty states, keyboard behavior, and announcements.' },
    { area: 'Performance/reliability', signal: 'Sets budgets, chooses optimizations, handles failure modes, and adds observability.' },
    { area: 'Communication', signal: 'Narrates tradeoffs clearly and adapts when requirements change.' },
  ];

  readonly faqItems = [
    {
      question: 'What is a frontend system design interview?',
      answer: 'A frontend system design interview is an architecture round focused on client-side decisions: rendering strategy, state ownership, API contracts, caching, accessibility, performance, resilience, and product tradeoffs.',
    },
    {
      question: 'How do I prepare for frontend system design interviews?',
      answer: 'Start with a repeatable framework such as RADIO, practice common prompts like infinite scroll and notifications, then add realtime, data-heavy, and senior/staff scenarios where tradeoffs become harder.',
    },
    {
      question: 'What frontend system design questions are commonly asked?',
      answer: 'Common prompts include infinite scroll, autocomplete search, notification systems, news feeds, chat interfaces, dashboards, design systems, file upload components, and realtime collaboration surfaces.',
    },
    {
      question: 'How is frontend system design different from backend system design?',
      answer: 'Frontend system design still needs backend awareness, but the scoring centers on UI architecture, rendering, browser performance, accessibility, client/server state boundaries, and failure states users can see.',
    },
    {
      question: 'Should I start with app architecture or UI components?',
      answer: 'Start with app architecture when the prompt is product-scale, such as feeds or dashboards. Start with UI component architecture when the prompt is an interaction-heavy component, such as autocomplete, modal, upload, or design system primitives.',
    },
  ];

  readonly rawQuestions$: Observable<SystemDesignViewItem[] | null>;
  readonly filtered$: Observable<SystemDesignViewItem[]>;
  readonly tagOptions$: Observable<Array<{ label: string; value: string }>>;
  readonly stats$: Observable<SystemDesignStats>;
  readonly priorityQuestions$: Observable<PriorityQuestion[]>;

  private readonly destroy$ = new Subject<void>();
  private readonly searchInput$ = new Subject<string>();
  private readonly filters$ = new BehaviorSubject<SystemDesignFilterState>({
    q: '',
    level: null,
    access: null,
    format: null,
    tags: [],
  });
  private readonly maxItemListItems = 50;
  private knownTags: Set<string> | null = null;
  private latestQueryParams: ParamMap;

  constructor(
    public qs: QuestionService,
    private auth: AuthService,
    private seo: SeoService,
    private route: ActivatedRoute,
    private router: Router,
    private analytics: AnalyticsService,
  ) {
    this.latestQueryParams = this.route.snapshot.queryParamMap;
    this.applyFilterState(this.filtersFromParamMap(this.latestQueryParams));

    this.rawQuestions$ = this.route.data.pipe(
      map((data) => (data['systemDesignList'] as SystemDesignListResolved | undefined)?.items ?? []),
      switchMap((resolvedItems) =>
        resolvedItems.length ? of(resolvedItems) : this.qs.loadSystemDesign(),
      ),
      map((items) => this.toViewItems(items)),
      startWith(null),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    this.tagOptions$ = this.rawQuestions$.pipe(
      map((questions) => Array.from(new Set((questions ?? []).flatMap((q) => q.tags))).sort()),
      map((tags) => tags.map((tag) => ({ label: tag, value: tag }))),
    );

    this.filtered$ = combineLatest([this.rawQuestions$, this.filters$]).pipe(
      map(([questions, filters]) => this.filterQuestions(questions ?? [], filters)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    this.stats$ = this.rawQuestions$.pipe(
      map((questions) => this.buildStats(questions ?? [])),
    );

    this.priorityQuestions$ = this.rawQuestions$.pipe(
      map((questions) => this.buildPriorityQuestions(questions ?? [])),
    );
  }

  ngOnInit(): void {
    this.searchInput$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe((term) => this.commitFilters({
        ...this.filters$.value,
        q: term.trim(),
      }));

    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.latestQueryParams = params;
        const restored = this.filtersFromParamMap(params, this.knownTags);
        this.searchInput$.next(restored.q);
        this.applyFilterState(restored);
      });

    this.rawQuestions$
      .pipe(
        filter((questions): questions is SystemDesignViewItem[] => questions !== null),
        takeUntil(this.destroy$),
      )
      .subscribe((questions) => {
        this.knownTags = new Set(questions.flatMap((question) => question.tags));
        this.applyFilterState(this.filtersFromParamMap(this.latestQueryParams, this.knownTags));
      });

    this.initListSeo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackById = (_: number, q: SystemDesignViewItem) => q.id;

  isLocked(q: SystemDesignViewItem): boolean {
    const user = this.auth.user();
    return isQuestionLockedForTier(q, user);
  }

  onSearchChanged(value: string): void {
    this.searchTerm = String(value ?? '');
    this.searchInput$.next(this.searchTerm);
  }

  onLevelChanged(value: unknown): void {
    this.commitFilters({
      ...this.filters$.value,
      q: this.searchTerm.trim(),
      level: this.isTargetLevel(value) ? value : null,
    });
  }

  onAccessChanged(value: unknown): void {
    this.commitFilters({
      ...this.filters$.value,
      q: this.searchTerm.trim(),
      access: value === 'free' || value === 'premium' ? value : null,
    });
  }

  onFormatChanged(value: unknown): void {
    this.commitFilters({
      ...this.filters$.value,
      q: this.searchTerm.trim(),
      format: this.isFormatCategory(value) ? value : null,
    });
  }

  onTagsChanged(value: unknown): void {
    const tags = Array.isArray(value)
      ? value
        .map((tag) => String(tag).trim())
        .filter((tag, index, all) =>
          Boolean(tag)
          && all.indexOf(tag) === index
          && (!this.knownTags || this.knownTags.has(tag))
        )
      : [];
    this.commitFilters({
      ...this.filters$.value,
      q: this.searchTerm.trim(),
      tags,
    });
  }

  clearFilters(): void {
    this.searchInput$.next('');
    this.searchTerm = '';
    this.commitFilters({ q: '', level: null, access: null, format: null, tags: [] });
  }

  hasActiveFilters(): boolean {
    const filters = this.filters$.value;
    return Boolean(
      this.searchTerm.trim()
      || filters.q
      || filters.level
      || filters.access
      || filters.format
      || filters.tags.length,
    );
  }

  levelLabel(level: SystemDesignTargetLevel): string {
    return level.charAt(0).toUpperCase() + level.slice(1);
  }

  private toViewItems(items: unknown): SystemDesignViewItem[] {
    return (Array.isArray(items) ? items : [])
      .map((item, sourceOrder) => this.toViewItem(item as Partial<SystemDesignListItem>, sourceOrder))
      .filter((item): item is SystemDesignViewItem => Boolean(item))
      .sort((a, b) => {
        const rank = { junior: 0, mid: 1, senior: 2 } as const;
        return rank[a.practice.targetLevel] - rank[b.practice.targetLevel]
          || a.sourceOrder - b.sourceOrder;
      });
  }

  private toViewItem(
    item: Partial<SystemDesignListItem>,
    sourceOrder: number,
  ): SystemDesignViewItem | null {
    const id = String(item?.id || '').trim();
    const title = String(item?.title || id).trim();
    if (!id || !title) return null;
    const description = String(item.description || '').trim();

    const tags = Array.isArray(item.tags) ? item.tags.map((tag) => String(tag)) : [];
    const formatCategory = this.deriveFormatCategory(id, title, tags);
    const format = this.formatGroups.find((group) => group.category === formatCategory) ?? this.formatGroups[0];
    const difficulty = item.difficulty ?? 'intermediate';
    const practice = resolveSystemDesignPractice({
      description,
      difficulty,
      practice: item.practice,
      tags,
    });
    const guide = this.guideFor({ id, title, description, tags }, formatCategory, tags);
    const authoredGuideLabel = String(item.discovery?.guideLabel || '').trim();
    const authoredTeaser = String(item.discovery?.teaser || '').trim();

    return {
      ...item,
      id,
      title,
      description,
      tags,
      type: 'system-design',
      access: item.access === 'premium' ? 'premium' : 'free',
      difficulty,
      companies: Array.isArray(item.companies) ? item.companies : [],
      updatedAt: item.updatedAt,
      sourceOrder,
      practice,
      formatCategory,
      formatLabel: format.title,
      formatDetail: format.detail,
      summary: this.toSummary(authoredTeaser || description),
      ...guide,
      guideLabel: authoredGuideLabel || guide.guideLabel,
    };
  }

  private filterQuestions(
    questions: SystemDesignViewItem[],
    filters: SystemDesignFilterState,
  ): SystemDesignViewItem[] {
    const query = filters.q.trim().toLowerCase();

    return questions.filter((item) => {
      const matchesText = !query
        || item.title.toLowerCase().includes(query)
        || item.summary.toLowerCase().includes(query)
        || item.description.toLowerCase().includes(query)
        || item.formatLabel.toLowerCase().includes(query)
        || item.practice.candidatePrompt.toLowerCase().includes(query)
        || item.practice.coreSkills.some((skill) => skill.toLowerCase().includes(query))
        || item.tags.some((tag) => tag.toLowerCase().includes(query));
      const matchesLevel = !filters.level || item.practice.targetLevel === filters.level;
      const matchesAccess = !filters.access || item.access === filters.access;
      const matchesFormat = !filters.format || item.formatCategory === filters.format;
      const matchesTags = filters.tags.length === 0
        || filters.tags.some((tag) => item.tags.includes(tag));
      return matchesText && matchesLevel && matchesAccess && matchesFormat && matchesTags;
    });
  }

  private commitFilters(next: SystemDesignFilterState): void {
    const normalized: SystemDesignFilterState = {
      q: String(next.q || '').trim(),
      level: this.isTargetLevel(next.level) ? next.level : null,
      access: next.access === 'free' || next.access === 'premium' ? next.access : null,
      format: this.isFormatCategory(next.format) ? next.format : null,
      tags: next.tags.filter((tag, index, all) =>
        Boolean(tag)
        && all.indexOf(tag) === index
        && (!this.knownTags || this.knownTags.has(tag))
      ),
    };

    if (this.filterStatesEqual(this.filters$.value, normalized)) return;
    this.applyFilterState(normalized);

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: normalized.q || null,
        level: normalized.level,
        access: normalized.access,
        format: normalized.format,
        tag: normalized.tags.length ? normalized.tags : null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    this.analytics.track('system_design_filter_changed', {
      level: normalized.level || 'all',
      access: normalized.access || 'all',
      format: normalized.format || 'all',
      tag_count: normalized.tags.length,
      has_search: Boolean(normalized.q),
    });
  }

  private applyFilterState(next: SystemDesignFilterState): void {
    this.searchTerm = next.q;
    this.selectedLevel = next.level;
    this.selectedAccess = next.access;
    this.selectedFormat = next.format;
    this.selectedTags = [...next.tags];
    if (!this.filterStatesEqual(this.filters$.value, next)) {
      this.filters$.next({ ...next, tags: [...next.tags] });
    }
  }

  private filtersFromParamMap(
    params: ParamMap,
    knownTags: Set<string> | null = null,
  ): SystemDesignFilterState {
    const rawLevel = params.get('level');
    const rawAccess = params.get('access');
    const rawFormat = params.get('format');
    const tags = params.getAll('tag')
      .map((tag) => tag.trim())
      .filter((tag, index, all) =>
        Boolean(tag)
        && all.indexOf(tag) === index
        && (!knownTags || knownTags.has(tag))
      );

    return {
      q: String(params.get('q') || '').trim(),
      level: this.isTargetLevel(rawLevel) ? rawLevel : null,
      access: rawAccess === 'free' || rawAccess === 'premium' ? rawAccess : null,
      format: this.isFormatCategory(rawFormat) ? rawFormat : null,
      tags,
    };
  }

  private filterStatesEqual(a: SystemDesignFilterState, b: SystemDesignFilterState): boolean {
    return a.q === b.q
      && a.level === b.level
      && a.access === b.access
      && a.format === b.format
      && a.tags.length === b.tags.length
      && a.tags.every((tag, index) => tag === b.tags[index]);
  }

  private isTargetLevel(value: unknown): value is SystemDesignTargetLevel {
    return value === 'junior' || value === 'mid' || value === 'senior';
  }

  private isFormatCategory(value: unknown): value is FormatCategory {
    return value === 'application'
      || value === 'component'
      || value === 'realtime'
      || value === 'ai-product';
  }

  private buildStats(questions: SystemDesignViewItem[]): SystemDesignStats {
    return {
      total: questions.length,
      free: questions.filter((item) => item.access !== 'premium').length,
      premium: questions.filter((item) => item.access === 'premium').length,
      formatCount: new Set(questions.map((item) => item.formatCategory)).size,
    };
  }

  private buildPriorityQuestions(questions: SystemDesignViewItem[]): PriorityQuestion[] {
    const byId = new Map(questions.map((question) => [question.id, question]));
    return this.priorityQuestionSeeds.flatMap((seed) => {
      const question = byId.get(seed.id);
      if (!question) return [];
      return [{
        ...seed,
        title: question.title,
        access: question.access,
        route: ['/', 'system-design', question.id],
      }];
    });
  }

  private deriveFormatCategory(id: string, title: string, tags: string[]): FormatCategory {
    const haystack = [id, title, ...tags].join(' ').toLowerCase();
    if (/\b(ai|model|image-generation|image generation|chatgpt|chat)\b/.test(haystack)) {
      return 'ai-product';
    }
    if (this.hasAny(haystack, ['component', 'design-system', 'theming', 'forms', 'upload', 'toast', 'validation', 'drag-drop', 'dashboard'])) {
      return 'component';
    }
    if (this.hasAny(haystack, ['real-time', 'realtime', 'streams', 'streaming', 'charts', 'notifications', 'feed', 'live'])) {
      return 'realtime';
    }
    return 'application';
  }

  private guideFor(
    question: Pick<SystemDesignViewItem, 'id' | 'title' | 'description' | 'tags'>,
    category: FormatCategory,
    tags: string[],
  ): Pick<SystemDesignViewItem, 'guideRoute' | 'guideLabel'> {
    const performanceAnchor = performanceGuideAnchorForQuestion(question);
    if (performanceAnchor) {
      return {
        guideRoute: ['/', 'guides', 'system-design-blueprint', 'performance'],
        guideLabel: performanceAnchor,
      };
    }

    const normalized = tags.map((tag) => tag.toLowerCase());
    if (category === 'realtime' || normalized.includes('performance') || normalized.includes('caching')) {
      return {
        guideRoute: ['/', 'guides', 'system-design-blueprint', 'performance'],
        guideLabel: 'Review optimization tradeoffs',
      };
    }
    if (category === 'component' || normalized.includes('ux') || normalized.includes('accessibility')) {
      return {
        guideRoute: ['/', 'guides', 'system-design-blueprint', 'ux'],
        guideLabel: 'Review interface design',
      };
    }
    if (category === 'ai-product' || normalized.includes('state-management') || normalized.includes('storage')) {
      return {
        guideRoute: ['/', 'guides', 'system-design-blueprint', 'state-data'],
        guideLabel: 'Review data model design',
      };
    }
    return {
      guideRoute: ['/', 'guides', 'system-design-blueprint', 'architecture'],
      guideLabel: 'Review architecture slices',
    };
  }

  private toSummary(description: unknown): string {
    const normalized = String(description || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return 'Practice the requirements, architecture, data model, interface, and optimization tradeoffs for this frontend system design prompt.';
    const maxLength = 180;
    return normalized.length > maxLength
      ? `${normalized.slice(0, maxLength - 1).trimEnd()}…`
      : normalized;
  }

  private hasAny(value: string, terms: string[]): boolean {
    return terms.some((term) => value.includes(term));
  }

  private initListSeo(): void {
    if (!this.shouldApplyListSeo()) return;

    this.rawQuestions$
      .pipe(
        takeUntil(this.destroy$),
        filter((list): list is SystemDesignViewItem[] => list !== null),
        map(list => list.filter((q) => q?.id && q?.title)),
        map(list => list.slice(0, this.maxItemListItems)),
        map(list => ({ list, key: list.map((q) => q.id).join('|') })),
        distinctUntilChanged((a, b) => a.key === b.key),
      )
      .subscribe(({ list }) => this.updateListSeo(list));
  }

  private updateListSeo(list: SystemDesignViewItem[]): void {
    const baseSeo = this.getRouteSeo();
    if (!baseSeo || this.isNoIndex(baseSeo)) return;

    const canonical = this.seo.buildCanonicalUrl('/system-design');
    const itemList = this.buildItemListSchema(list);
    this.seo.updateTags({
      ...baseSeo,
      canonical,
      jsonLd: [
        ...(itemList ? [itemList] : []),
        this.buildFaqSchema(),
      ],
    });
  }

  private buildItemListSchema(list: SystemDesignViewItem[]): Record<string, unknown> | null {
    const items = list
      .filter((q) => q?.id && q?.title)
      .slice(0, this.maxItemListItems)
      .map((q, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: q.title,
        url: this.seo.buildCanonicalUrl(`/system-design/${q.id}`),
      }));

    if (!items.length) return null;
    return { '@type': 'ItemList', itemListElement: items };
  }

  private buildFaqSchema(): Record<string, unknown> {
    return {
      '@type': 'FAQPage',
      mainEntity: this.faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };
  }

  private getRouteSeo(): SeoMeta | null {
    const dataSeo = this.route.snapshot.data['seo'] as SeoMeta | undefined;
    const parentSeo = this.route.parent?.snapshot.data['seo'] as SeoMeta | undefined;
    return dataSeo ?? parentSeo ?? null;
  }

  private shouldApplyListSeo(): boolean {
    const baseSeo = this.getRouteSeo();
    if (!baseSeo) return false;
    return !this.isNoIndex(baseSeo);
  }

  private isNoIndex(seo: SeoMeta): boolean {
    return (seo.robots || '').toLowerCase().includes('noindex');
  }
}
