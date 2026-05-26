import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import { distinctUntilChanged, map, shareReplay, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { isQuestionLockedForTier } from '../../core/models/question.model';
import { SeoMeta, SeoService } from '../../core/services/seo.service';
import { QuestionService } from '../../core/services/question.service';
import {
  SystemDesignListItem,
  SystemDesignListResolved,
} from '../../core/resolvers/question-list.resolver';

type FormatCategory = 'application' | 'component' | 'realtime' | 'ai-product';

type SystemDesignViewItem = SystemDesignListItem & {
  access: 'free' | 'premium';
  difficulty: string;
  formatCategory: FormatCategory;
  formatLabel: string;
  formatDetail: string;
  answerFocus: string[];
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

@Component({
  standalone: true,
  selector: 'app-system-design-list',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    InputTextModule,
    MultiSelectModule,
  ],
  templateUrl: './system-design-list.component.html',
  styleUrls: ['./system-design-list.component.css']
})
export class SystemDesignListComponent implements OnInit, OnDestroy {
  searchTerm = '';
  search$ = new BehaviorSubject<string>('');
  tags$ = new BehaviorSubject<string[]>([]);

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
    'Preview pages stay indexable while full solutions stay protected',
  ];

  readonly relatedFocusLinks = [
    {
      label: 'Machine coding hub',
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
      title: 'Learn RADIO',
      detail: 'Use the frontend system design interview framework before you open a prompt.',
      route: ['/', 'guides', 'system-design-blueprint', 'radio-framework'],
      cta: 'Frontend system design interview framework',
    },
    {
      step: 'Step 2',
      title: 'Start with core prompts',
      detail: 'Practice infinite scroll and notification systems first because they expose state, rendering, and UX basics.',
      route: ['/', 'system-design', 'infinite-scroll-list'],
      cta: 'Design infinite scroll frontend system design',
    },
    {
      step: 'Step 3',
      title: 'Move into realtime UI',
      detail: 'Add caching, streaming, batching, reconnect behavior, and high-frequency rendering tradeoffs.',
      route: ['/', 'system-design', 'scalable-notifications-feed'],
      cta: 'Frontend system design realtime UI',
    },
    {
      step: 'Step 4',
      title: 'Practice senior/staff rounds',
      detail: 'Use premium previews to understand the expected shape of senior frontend system design interview answers.',
      route: ['/', 'system-design', 'netflix-scale-expansion'],
      cta: 'Senior frontend system design interview',
    },
  ];

  readonly priorityQuestions = [
    {
      title: 'Infinite Scroll List System Design',
      keyword: 'design infinite scroll frontend system design',
      detail: 'Pagination, virtualization, loading states, and scroll performance.',
      route: ['/', 'system-design', 'infinite-scroll-list'],
    },
    {
      title: 'Notification Toast System',
      keyword: 'design notification system frontend',
      detail: 'Global APIs, timers, stacking, portals, and accessible announcements.',
      route: ['/', 'system-design', 'notification-toast-system'],
    },
    {
      title: 'Real-time Search with Debounce & Caching',
      keyword: 'design autocomplete frontend system design',
      detail: 'Debounce, cancellation, stale responses, caching, and perceived speed.',
      route: ['/', 'system-design', 'realtime-search-debounce-cache'],
    },
    {
      title: 'News Feed / Timeline Front-End System Design',
      keyword: 'design news feed frontend system design',
      detail: 'Feed hydration, cursor pagination, media lazy loading, and realtime updates.',
      route: ['/', 'system-design', 'news-feed-timeline'],
    },
    {
      title: 'AI Chat Text Area',
      keyword: 'design chat app frontend system design',
      detail: 'Streaming responses, persistence, cancellation, API contracts, and UX control.',
      route: ['/', 'system-design', 'ai-chat-textarea-design'],
    },
    {
      title: 'Component-driven Design System Architecture',
      keyword: 'frontend system design UI component questions',
      detail: 'Tokens, component APIs, accessibility contracts, theming, and versioning.',
      route: ['/', 'system-design', 'component-design-system-architecture'],
    },
    {
      title: 'Live Comments for Global Streams',
      keyword: 'frontend system design realtime UI',
      detail: 'WebSocket/SSE updates, buffering, moderation UI, and burst control.',
      route: ['/', 'system-design', 'live-comments-global-stream'],
    },
    {
      title: 'Dashboard with Draggable & Resizable Widgets',
      keyword: 'staff frontend engineer system design interview',
      detail: 'Layout persistence, drag/resize performance, constraints, and ownership boundaries.',
      route: ['/', 'system-design', 'dashboard-widgets-draggable-resizable'],
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

  private readonly destroy$ = new Subject<void>();
  private readonly maxItemListItems = 50;

  constructor(
    public qs: QuestionService,
    private auth: AuthService,
    private seo: SeoService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
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

    this.filtered$ = combineLatest([this.rawQuestions$, this.search$, this.tags$]).pipe(
      map(([questions, term, pickedTags]) => this.filterQuestions(questions ?? [], term, pickedTags)),
    );

    this.stats$ = this.rawQuestions$.pipe(
      map((questions) => this.buildStats(questions ?? [])),
    );
  }

  ngOnInit(): void {
    this.initListSeo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackById = (_: number, q: SystemDesignViewItem) => q.id;

  isLocked(q: SystemDesignViewItem): boolean {
    const user = this.auth.user();
    return isQuestionLockedForTier({ access: q.access } as any, user);
  }

  private toViewItems(items: unknown): SystemDesignViewItem[] {
    return (Array.isArray(items) ? items : [])
      .map((item) => this.toViewItem(item as Partial<SystemDesignListItem>))
      .filter((item): item is SystemDesignViewItem => Boolean(item));
  }

  private toViewItem(item: Partial<SystemDesignListItem>): SystemDesignViewItem | null {
    const id = String(item?.id || '').trim();
    const title = String(item?.title || id).trim();
    if (!id || !title) return null;

    const tags = Array.isArray(item.tags) ? item.tags.map((tag) => String(tag)) : [];
    const formatCategory = this.deriveFormatCategory(id, title, tags);
    const format = this.formatGroups.find((group) => group.category === formatCategory) ?? this.formatGroups[0];
    const answerFocus = this.deriveAnswerFocus(tags);

    return {
      id,
      title,
      description: String(item.description || '').trim(),
      tags,
      type: 'system-design',
      access: item.access === 'premium' ? 'premium' : 'free',
      difficulty: String(item.difficulty || 'intermediate'),
      companies: Array.isArray(item.companies) ? item.companies : [],
      updatedAt: item.updatedAt,
      formatCategory,
      formatLabel: format.title,
      formatDetail: format.detail,
      answerFocus,
      summary: this.toSummary(item.description),
      ...this.guideFor(formatCategory, tags),
    };
  }

  private filterQuestions(
    questions: SystemDesignViewItem[],
    term: string,
    pickedTags: string[],
  ): SystemDesignViewItem[] {
    const query = term.trim().toLowerCase();
    const selectedTags = pickedTags ?? [];

    return questions.filter((item) => {
      const matchesText = !query
        || item.title.toLowerCase().includes(query)
        || item.summary.toLowerCase().includes(query)
        || item.formatLabel.toLowerCase().includes(query)
        || item.answerFocus.some((focus) => focus.toLowerCase().includes(query))
        || item.tags.some((tag) => tag.toLowerCase().includes(query));
      const matchesTags = selectedTags.length === 0
        || selectedTags.every((tag) => item.tags.includes(tag));
      return matchesText && matchesTags;
    });
  }

  private buildStats(questions: SystemDesignViewItem[]): SystemDesignStats {
    return {
      total: questions.length,
      free: questions.filter((item) => item.access !== 'premium').length,
      premium: questions.filter((item) => item.access === 'premium').length,
      formatCount: new Set(questions.map((item) => item.formatCategory)).size,
    };
  }

  private deriveFormatCategory(id: string, title: string, tags: string[]): FormatCategory {
    const haystack = [id, title, ...tags].join(' ').toLowerCase();
    if (/\b(ai|model|image-generation|image generation|chatgpt|chat)\b/.test(haystack)) {
      return 'ai-product';
    }
    if (this.hasAny(haystack, ['real-time', 'realtime', 'streams', 'streaming', 'charts', 'notifications', 'feed', 'live'])) {
      return 'realtime';
    }
    if (this.hasAny(haystack, ['component', 'design-system', 'theming', 'forms', 'upload', 'toast', 'validation', 'drag-drop', 'dashboard'])) {
      return 'component';
    }
    return 'application';
  }

  private deriveAnswerFocus(tags: string[]): string[] {
    const normalized = tags.map((tag) => tag.toLowerCase());
    const focusMap: Array<{ label: string; tags: string[] }> = [
      { label: 'State', tags: ['state-management', 'global-state', 'local-storage', 'storage'] },
      { label: 'APIs', tags: ['api-calls', 'services'] },
      { label: 'Performance', tags: ['performance', 'virtualization', 'lazy-loading', 'optimization'] },
      { label: 'Accessibility', tags: ['accessibility', 'aria'] },
      { label: 'Caching', tags: ['caching', 'cdn'] },
      { label: 'Realtime', tags: ['real-time', 'streams', 'streaming', 'events'] },
      { label: 'UX', tags: ['ux', 'loading-states', 'responsive-ui', 'error-handling'] },
      { label: 'Validation', tags: ['validation', 'forms'] },
    ];

    const labels = focusMap
      .filter((entry) => entry.tags.some((tag) => normalized.includes(tag)))
      .map((entry) => entry.label);

    return labels.length ? labels.slice(0, 4) : ['Architecture'];
  }

  private guideFor(
    category: FormatCategory,
    tags: string[],
  ): Pick<SystemDesignViewItem, 'guideRoute' | 'guideLabel'> {
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

    this.filtered$
      .pipe(
        takeUntil(this.destroy$),
        map(list => list.filter((q) => q?.id && q?.title)),
        map(list => list.slice(0, this.maxItemListItems)),
        map(list => ({ list, key: list.map((q) => q.id).join('|') })),
        distinctUntilChanged((a, b) => a.key === b.key),
      )
      .subscribe(({ list }) => this.updateListSeo(list));
  }

  private updateListSeo(list: SystemDesignViewItem[]): void {
    const baseSeo = this.getRouteSeo();
    if (!baseSeo || this.isNoIndex(baseSeo) || list.length === 0) return;

    const itemList = this.buildItemListSchema(list);
    if (!itemList) return;

    const canonical = this.seo.buildCanonicalUrl(this.router.url);
    this.seo.updateTags({
      ...baseSeo,
      canonical,
      jsonLd: [itemList, this.buildFaqSchema()],
    });
  }

  private buildItemListSchema(list: SystemDesignViewItem[]): Record<string, any> | null {
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

  private buildFaqSchema(): Record<string, any> {
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
