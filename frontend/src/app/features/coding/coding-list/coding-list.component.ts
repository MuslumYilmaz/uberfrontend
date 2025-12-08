import { CommonModule, Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationStart, Router, RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SliderModule } from 'primeng/slider';

import { BehaviorSubject, combineLatest, forkJoin, Observable, of, Subject, Subscription } from 'rxjs';
import { distinctUntilChanged, map, startWith, switchMap, take, takeUntil, tap } from 'rxjs/operators';

import { TooltipModule } from 'primeng/tooltip';
import { Difficulty, Question, QuestionKind, Technology } from '../../../core/models/question.model';
import { Tech } from '../../../core/models/user.model';
import { FRAMEWORK_FAMILIES, FRAMEWORK_FAMILY_BY_ID, FrameworkVariant, frameworkLabel } from '../../../shared/framework-families';
import { CodingListFilterState, CodingListStateService } from '../../../core/services/coding-list-state';
import { MixedQuestion, QuestionService } from '../../../core/services/question.service';
import { OfflineBannerComponent } from "../../../shared/components/offline-banner/offline-banner";
import { CodingFilterPanelComponent } from '../../filters/coding-filter-panel/coding-filter-panel';
import { CodingTechKindTabsComponent } from '../../filters/coding-tech-kind-tabs.component.ts/coding-tech-kind-tabs.component';
import { UfChipComponent } from '../../../shared/components/chip/uf-chip.component';

type StructuredDescription = { text?: string; summary?: string; examples?: string[] };
type ListSource = 'tech' | 'company' | 'global-coding';

type Kind = QuestionKind | 'all';

type Row = Question & {
  tech?: Tech;
  __kind: QuestionKind;
  companies?: string[];
  __sd?: boolean;
};

type PracticeItem = { tech: Tech; kind: QuestionKind; id: string };
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
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    MultiSelectModule,
    SliderModule,
    ProgressSpinnerModule,
    InputTextModule,
    FormsModule,
    TooltipModule,
    CodingTechKindTabsComponent,
    CodingFilterPanelComponent,
    OfflineBannerComponent,
    UfChipComponent
  ],
  templateUrl: './coding-list.component.html',
  styleUrls: ['./coding-list.component.scss']
})
export class CodingListComponent implements OnInit, OnDestroy {
  private static _instanceCounter = 0;
  readonly instanceId = ++CodingListComponent._instanceCounter;

  // ----- filter UI state -----
  searchTerm = '';
  sliderValue = 5;

  search$ = new BehaviorSubject<string>('');
  diffs$ = new BehaviorSubject<Difficulty[]>([]);
  impTiers$ = new BehaviorSubject<ImportanceTier[]>([]);

  // GLOBAL (/coding) local filters
  selectedTech$ = new BehaviorSubject<Tech | null>(null);
  selectedKind$ = new BehaviorSubject<Kind>('all');
  selectedCategory$ = new BehaviorSubject<CategoryKey | null>(null); // only for formats mode

  selectedTags$ = new BehaviorSubject<string[]>([]);

  sort$ = new BehaviorSubject<SortKey>('default');
  sortOpen = false;
  sortOptions: Array<{ key: SortKey; label: string; hint?: string }> = [
    {
      key: 'default',
      label: 'Difficulty: Easy to Hard',
      hint: 'Easy → Hard, then Importance High → Low'
    },
    { key: 'title-asc', label: 'Title: A to Z' },
    { key: 'title-desc', label: 'Title: Z to A' },
    { key: 'difficulty-asc', label: 'Difficulty: Easy to Hard' },
    { key: 'difficulty-desc', label: 'Difficulty: Hard to Easy' },
    { key: 'importance-desc', label: 'Importance: High to Low' },
    { key: 'importance-asc', label: 'Importance: Low to High' },
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

  viewMode$ = this.route.queryParamMap.pipe(
    map(qp => (qp.get('view') === 'formats' ? 'formats' : 'tech') as ViewMode),
    tap(vm => this.onViewModeChange(vm))
  );

  viewMode: ViewMode = 'tech'; // default

  ALLOWED_TECH = new Set(['javascript', 'angular', 'react', 'vue', 'html', 'css']);

  public tagMatchMode: 'all' | 'any' = 'all';

  currentCompanySlug: string | null = null;

  // company slug from parent param (:slug) OR ?c=
  companySlug$ = (this.route.parent
    ? combineLatest([
      this.route.parent.paramMap.pipe(map(pm => pm.get('slug') || '')),
      this.route.queryParamMap.pipe(map(qp => qp.get('c') || ''))
    ]).pipe(map(([a, b]) => (b || a).toLowerCase()))
    : this.route.queryParamMap.pipe(map(qp => (qp.get('c') || '').toLowerCase()))
  ).pipe(startWith(''));

  // ---------- base load ----------
  rawQuestions$: Observable<any> = this.route.data.pipe(
    tap(d => {
      this.source = (d['source'] as ListSource) ?? 'tech';
      this.kind = (d['kind'] as Kind) ?? 'coding';
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
                if (k === 'all') {
                  // Load only kinds supported by loadAllQuestions
                  return forkJoin([
                    this.qs.loadAllQuestions('coding')
                      .pipe(map((list: MixedQuestion[]) =>
                        list.map<Row>(q => ({ ...q, __kind: 'coding', tech: q.tech }))
                      )),
                    this.qs.loadAllQuestions('trivia')
                      .pipe(map((list: MixedQuestion[]) =>
                        list.map<Row>(q => ({ ...q, __kind: 'trivia', tech: q.tech }))
                      )),
                  ]).pipe(
                    map(([a, b]) => [...a, ...b]),
                    startWith<Row[]>([])
                  );
                }

                // single kind
                const base$ = this.qs.loadAllQuestions(k as any).pipe(
                  map((list: MixedQuestion[]) => list.map<Row>(q => ({ ...q, __kind: k as any, tech: q.tech }))),
                  startWith<Row[]>([])
                );

                if (this.viewMode === 'formats') {
                  return combineLatest<[Row[], Row[]]>([
                    base$,
                    this.loadSystemDesignRows$()
                  ]).pipe(map(([a, sys]) => [...a, ...sys]));
                }
                return base$;
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
                    this.qs.loadQuestions(this.tech, 'coding')
                      .pipe(map((list: Question[]) => list.map<Row>(q => ({ ...q, __kind: 'coding' })))),
                    this.qs.loadQuestions(this.tech, 'trivia')
                      .pipe(map((list: Question[]) => list.map<Row>(q => ({ ...q, __kind: 'trivia' }))))
                  ]).pipe(
                    map(([a, b]) => [...a, ...b]),
                    startWith<Row[]>([])
                  );
                }

                const k = this.kind as QuestionKind;
                return this.qs.loadQuestions(this.tech, k).pipe(
                  map((list: Question[]) => list.map<Row>(q => ({ ...q, __kind: k }))),
                  startWith<Row[]>([])
                );
              })
            );
          }

          // --------- COMPANY ----------
          if (this.source === 'company') {

            // 1) ALL company questions (coding + trivia + system)
            if (this.kind === 'all') {
              return forkJoin<[Row[], Row[], Row[]]>([
                this.qs.loadAllQuestions('coding').pipe(
                  map(list =>
                    list.map<Row>(q => ({ ...q, __kind: 'coding', tech: q.tech }))
                  )
                ),
                this.qs.loadAllQuestions('trivia').pipe(
                  map(list =>
                    list.map<Row>(q => ({ ...q, __kind: 'trivia', tech: q.tech }))
                  )
                ),
                this.loadSystemDesignRows$()
              ]).pipe(
                map(([coding, trivia, system]) => [...coding, ...trivia, ...system]),
                startWith<Row[]>([])
              );
            }

            // 2) CODING
            if (this.kind === 'coding') {
              return this.qs.loadAllQuestions('coding').pipe(
                map(list =>
                  list.map<Row>(q => ({ ...q, __kind: 'coding', tech: q.tech }))
                ),
                startWith<Row[]>([])
              );
            }

            // 3) TRIVIA
            if (this.kind === 'trivia') {
              return this.qs.loadAllQuestions('trivia').pipe(
                map(list =>
                  list.map<Row>(q => ({ ...q, __kind: 'trivia', tech: q.tech }))
                ),
                startWith<Row[]>([])
              );
            }

            if (this.kind === 'system-design') {
              return this.loadSystemDesignRows$().pipe(
                startWith<Row[]>([])
              );
            }
          }
          return of<Row[]>([]);
        })
      )
    )
  );

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
  filtered$ = combineLatest([
    this.rawQuestions$,
    this.search$,
    this.diffs$,
    this.impTiers$,
    this.companySlug$,
    this.selectedTech$,
    this.selectedCategory$,
    this.selectedTags$,
    this.sort$,
  ]).pipe(
    map(([questions, term, diffs, tiers, companySlug, selectedTech, selectedCategory, selTags, sortKey]) => {
      const t = (term || '').toLowerCase();
      const isFormats = this.isFormatsMode();

      const filtered = (questions ?? []).filter((q: any) =>
        (q.title?.toLowerCase()?.includes(t) ?? false) &&

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

      // Ensure system design items are always retained when that category is selected
      if (isFormats && selectedCategory === 'system') {
        const sys = filtered.filter((q: any) => (q as any).__sd === true);
        if (sys.length === 0) {
          // fallback: ignore filters except category to avoid accidental empty state
          return (questions ?? []).filter((q: any) => (q as any).__sd === true);
        }
        return sys;
      }

      const cmp = this.makeComparator(sortKey as SortKey);
      const deduped = this.dedupeFrameworkRows(filtered);
      return deduped.slice().sort(cmp);
    })
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
    { label: 'Beginner', value: 'easy' as Difficulty },
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
    { key: 'system', label: 'System design' },
  ];

  filteredCount$ = this.filtered$.pipe(map(list => list.length), startWith(0));

  kindTabs: Array<{ key: QuestionKind; label: string }> = [
    { key: 'coding', label: 'Coding' },
    { key: 'trivia', label: 'Quiz' }
  ];

  // --- UI handlers for sorting ---
  currentSortLabel(k: SortKey | null | undefined): string {
    const opt = this.sortOptions.find(o => o.key === k);
    return opt?.label || 'Difficulty: Easy to Hard';
  }
  toggleSort() { this.sortOpen = !this.sortOpen; }
  closeSort() { this.sortOpen = false; }
  setSort(k: SortKey) { this.sort$.next(k); this.closeSort(); }

  constructor(
    private route: ActivatedRoute,
    private qs: QuestionService,
    private router: Router,
    private location: Location,
    private listState: CodingListStateService
  ) {
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

          const k = qp.get('kind') as Kind | null;
          const allowed = new Set<Kind>(['all', 'coding', 'trivia']);
          this.selectedKind$.next(allowed.has((k || '') as Kind) ? (k as Kind) : 'all');
          this.debug('seed kind from qp', { k, applied: this.selectedKind$.value });
        })
      )
      .subscribe();

    document.addEventListener(
      'click',
      (e) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.sort-wrap')) this.closeSort();
      },
      { capture: true }
    );

    this.companySlug$.subscribe((slug) => {
      this.currentCompanySlug = slug || null;
    });

    // seed category filter from ?category= on global formats list
    this.route.queryParamMap
      .pipe(
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

    if (this.source !== 'global-coding') return;

    const qp = this.route.snapshot.queryParamMap;
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
      this.selectedKind$.next('all');
      this.selectedCategory$.next(null);
    }

    const techFromUrl = (qp.get('tech') || '').toLowerCase() as Tech;
    const kindFromUrl = qp.get('kind') as Kind | null;
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

      const allowedKinds = new Set<Kind>(['all', 'coding', 'trivia']);
      if (kindFromUrl && allowedKinds.has(kindFromUrl as Kind)) {
        this.selectedKind$.next(kindFromUrl as Kind);
      } else if (shouldReset) {
        // reset geldiyse formats için default 'all'
        this.selectedKind$.next('all');
      }

      const qFromUrl = qp.get('q');
      if (qFromUrl !== null) {
        this.searchTerm = qFromUrl;
        this.search$.next(qFromUrl);
      }

      const focus = qp.get('focus') as FocusSlug | null;
      if (focus && FOCUS_SEED_TAGS[focus]) {
        this.selectedTags$.next([...FOCUS_SEED_TAGS[focus]]);
        this.tagMatchMode = 'any';
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
      this.selectedKind$.next(saved.selectedKind);
      this.selectedCategory$.next(saved.selectedCategory);
    }

    // ---- URL değerleri saved'in ÜSTÜNE yazıyor (veya reset modunda default'u override ediyor) ----
    const allowedTech: Tech[] = ['javascript', 'angular', 'react', 'vue', 'html', 'css'];
    if (allowedTech.includes(techFromUrl)) {
      this.selectedTech$.next(techFromUrl);
    }

    const allowedKinds = new Set<Kind>(['all', 'coding', 'trivia']);
    if (kindFromUrl && allowedKinds.has(kindFromUrl as Kind)) {
      this.selectedKind$.next(kindFromUrl as Kind);
    } else if (shouldReset) {
      this.selectedKind$.next('all');
    }

    const focus = qp.get('focus') as FocusSlug | null;
    if (focus && FOCUS_SEED_TAGS[focus]) {
      this.selectedTags$.next([...FOCUS_SEED_TAGS[focus]]);
      this.tagMatchMode = 'any';
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

    // URL'de tech/kind yok ama state'ten restore ettiysek, bir kez URL'ye sync et
    if (this.source === 'global-coding' && viewKey === 'tech' && restoredFromState) {
      const qpTech = qp.get('tech');
      const qpKind = qp.get('kind');

      const tech = this.selectedTech$.value;
      const kind = this.selectedKind$.value;

      // Hiçbiri yoksa URL'yi filtrelere göre güncelle
      if (!qpTech && !qpKind && (tech || (kind && kind !== 'all'))) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            tech: tech ?? null,
            kind: kind && kind !== 'all' ? kind : null,
          },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }
    }
  }

  // ---------- helpers used by template ----------
  descriptionText(q: Question): string {
    const d: any = (q as any).description;
    if (typeof d === 'string') return d;
    if (d && typeof d === 'object') {
      return (d.summary || d.text || '') as string;
    }
    return '';
  }

  linkTo(q: Row): any[] {
    // System-design rows (from formats view) go to /system-design/:id
    if (q.__sd || (this.isFormatsMode() && inferCategory(q) === 'system')) {
      return ['/system-design', q.id];
    }

    const tech = (q as any).tech ?? this.tech ?? 'javascript';
    if (q.__kind === 'trivia') return ['/', tech, 'trivia', q.id];
    // 🔻 debug branch kaldırıldı
    return ['/', tech, 'coding', q.id];
  }

  stateForNav(list: Row[], current: Row, companySlug: string | null) {
    const items: PracticeItem[] = list.map((r) => ({
      tech: (r.tech ?? this.tech ?? 'javascript') as Tech,
      kind: r.__kind,
      id: r.id,
    }));
    const index = Math.max(0, list.findIndex((r) => r.id === current.id));
    const session: PracticeSession = { items, index };

    let returnToUrl = this.router.url;

    // 🔹 Global /coding listesi: encode current filters into return URL
    if (this.source === 'global-coding') {
      const viewKey = this.getActiveViewKey();
      returnToUrl = this.buildReturnUrl(viewKey);

      // Drop reset=1 if present
      try {
        const url = new URL(returnToUrl, window.location.origin);
        url.searchParams.delete('reset');
        returnToUrl = url.pathname + url.search;
      } catch {
        // ignore
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
            ? 'Quiz'
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
        k === 'all' ? '' :
          k === 'trivia' ? 'Quiz' : 'Coding';

      if (this.isFormatsMode()) {
        const cat = this.selectedCategory$.value;
        const catLabel =
          !cat ? '' :
            cat === 'ui' ? ' — User interface' :
              cat === 'js-fn' ? ' — JavaScript functions' :
                cat === 'html-css' ? ' — HTML & CSS' :
                  cat === 'algo' ? ' — Algorithmic coding' :
                    ' — System design';
        return `All ${kindLabel || 'Questions'}${catLabel}`;
      }
      return `All ${kindLabel || 'Questions'}`;
    }

    const t = this.tech ?? 'javascript';
    const what =
      this.kind === 'coding' ? 'Coding Challenges'
        : this.kind === 'trivia' ? 'Trivia Questions'
          : 'All Questions';
    return `${this.capitalize(t)} ${what}`;
  }

  private capitalize(s: string | null | undefined) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

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

  private replaceQueryParams(params: Record<string, any>) {
    const tree = this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
    this.location.replaceState(this.router.serializeUrl(tree));
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
  }

  selectKind(k: Kind) {
    this.debug('selectKind', { k, source: this.source, view: this.currentViewKey });
    if (this.source === 'global-coding') {
      this.selectedKind$.next(k);

      this.replaceQueryParams({ kind: k === 'all' ? null : k });
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
  }

  private loadSystemDesignRows$() {
    const anyQs = this.qs as any;
    const fn =
      anyQs.loadSystemDesignList ||
      anyQs.loadSystemDesignIndex ||
      anyQs.loadSystemDesign;

    if (typeof fn !== 'function') {
      return of<Row[]>([]);
    }
    return (fn.call(anyQs) as any).pipe(
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
          __kind: 'coding',
          tech: undefined,
          __sd: true
        }))
      ),
      startWith<Row[]>([])
    );
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
  }

  onImpChange(tier: ImportanceTier, ev: Event) {
    const checked = (ev.target as HTMLInputElement | null)?.checked ?? false;
    const curr = new Set(this.impTiers$.value);
    checked ? curr.add(tier) : curr.delete(tier);
    const next = Array.from(curr);
    this.impTiers$.next(next);
    this.syncImpToQuery(next);
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
  }
  clearTag(tag: string) {
    const curr = new Set(this.selectedTags$.value);
    if (curr.delete(tag)) this.selectedTags$.next(Array.from(curr));
  }
  clearAllTags() { this.selectedTags$.next([]); }

  toggleTagMatchMode() {
    this.tagMatchMode = this.tagMatchMode === 'all' ? 'any' : 'all';
  }

  private difficultyRank(d: Difficulty | string | undefined): number {
    const map: Record<string, number> = { easy: 0, intermediate: 1, hard: 2 };
    return map[String(d || '').toLowerCase()] ?? 1;
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
    this.router.navigate(commands, { state });
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

  goToFramework(ev: Event, opt: FrameworkVariant) {
    ev.stopPropagation();
    ev.preventDefault();

    const path = ['/', opt.tech, opt.kind === 'trivia' ? 'trivia' : 'coding', opt.id];
    this.router.navigate(path, {
      state: {
        returnToUrl: this.router.url,
        returnLabel: 'Back to questions',
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Global /coding listesi için, çıkarken son filtre durumunu kaydet
    if (this.source === 'global-coding' && this.hydrated) {
      const viewKey = this.getActiveViewKey(); // 'tech' veya 'formats'
      this.saveFiltersTo(viewKey);
      this.debug('ngOnDestroy save', { viewKey });
    }

    this.viewModeSub?.unsubscribe();
    this.navSub?.unsubscribe();
  }

  private getViewKeyFromRoute(): ViewMode {
    const qp = this.route.snapshot.queryParamMap;
    const view = qp.get('view');
    return view === 'formats' ? 'formats' : 'tech';
  }

  onSearchTermChange(term: string) {
    this.searchTerm = term;
    this.search$.next(term);

    // Hem tech hem formats için q'yu URL'ye yaz
    if (this.source === 'global-coding') {
      this.replaceQueryParams({ q: term || null });
    }
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
  }

  private syncDiffsToQuery(next: Difficulty[]) {
    if (this.source !== 'global-coding' || this.isFormatsMode()) return;
    const value = next.length ? next.join(',') : null;
    this.replaceQueryParams({ diff: value });
  }

  private syncImpToQuery(next: ImportanceTier[]) {
    if (this.source !== 'global-coding' || this.isFormatsMode()) return;
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
    if (!this.hydrated) {
      this.debug('saveFiltersTo skipped (not hydrated)', { view });
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
        this.selectedKind$.next('all');
      } else {
        // tech view için her şeyi sıfırla
        this.selectedTech$.next(null);
        this.selectedCategory$.next(null);
        this.selectedKind$.next('all');
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
      this.selectedKind$.next(saved.selectedKind);
      this.selectedCategory$.next(saved.selectedCategory);
    } else {
      // tech view'de hepsini yükle
      this.selectedTech$.next(saved.selectedTech);
      this.selectedKind$.next(saved.selectedKind);
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
    if (kind && kind !== 'all') queryParams['kind'] = kind;

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
