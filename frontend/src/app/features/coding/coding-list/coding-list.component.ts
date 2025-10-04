import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SliderModule } from 'primeng/slider';

import { BehaviorSubject, combineLatest, forkJoin, of } from 'rxjs';
import { map, startWith, switchMap, take, tap } from 'rxjs/operators';

import { Difficulty, Question, Technology } from '../../../core/models/question.model';
import { Tech } from '../../../core/models/user.model';
import { MixedQuestion, QuestionService } from '../../../core/services/question.service';

type StructuredDescription = { text: string; examples?: string[] };
type ListSource = 'tech' | 'company' | 'global-coding';
type Kind = 'coding' | 'trivia' | 'debug' | 'all';

type Row = Question & {
  tech?: Tech;
  __kind: 'coding' | 'trivia' | 'debug';
  companies?: string[];
  __sd?: boolean;
};


type PracticeItem = { tech: Tech; kind: 'coding' | 'trivia' | 'debug'; id: string };
type PracticeSession = { items: PracticeItem[]; index: number };

// ---------- Formats categories ----------
type CategoryKey = 'ui' | 'js-fn' | 'algo' | 'system';
type ViewMode = 'tech' | 'formats';

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

function inferCategory(q: any): CategoryKey {
  const tech = (q.technology || '').toLowerCase();
  const type = (q.type || '').toLowerCase();

  if (tech === 'system' || tech === 'system-design' || type === 'system') return 'system';
  if (['angular', 'react', 'vue', 'html', 'css'].includes(tech)) return 'ui';
  if (q.sdk) return 'ui';

  const tags: string[] = (q.tags || []).map((t: string) => (t || '').toLowerCase());
  if (tags.some(t => ALGO_TAGS.has(t))) return 'algo';
  if (tags.some(t => SYSTEM_TAGS.has(t))) return 'system';

  const title = String(q.title || '').toLowerCase();
  const desc = typeof q.description === 'string'
    ? q.description.toLowerCase()
    : (q.description?.text || '').toLowerCase();
  if (SYSTEM_TITLE_HINTS.some(h => title.includes(h) || desc.includes(h))) return 'system';

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
    ChipModule,
    FormsModule
  ],
  templateUrl: './coding-list.component.html',
  styleUrls: ['./coding-list.component.scss']
})
export class CodingListComponent {
  // ----- filter UI state -----
  searchTerm = '';
  sliderValue = 5;

  search$ = new BehaviorSubject<string>('');
  diffs$ = new BehaviorSubject<Difficulty[]>([]);
  maxImp$ = new BehaviorSubject<number>(5);

  // GLOBAL (/coding) local filters
  selectedTech$ = new BehaviorSubject<Tech | null>(null);
  selectedKind$ = new BehaviorSubject<Exclude<Kind, 'all'>>('coding');
  selectedCategory$ = new BehaviorSubject<CategoryKey | null>(null); // only for formats mode

  // ----- context from routing -----
  tech!: Tech; // used on per-tech pages
  source: ListSource = 'tech';
  kind: Kind = 'coding';

  viewMode$ = this.route.queryParamMap.pipe(
    map(qp => (qp.get('view') === 'formats' ? 'formats' : 'tech') as ViewMode),
    tap(vm => {
      this.viewMode = vm;
      if (vm === 'formats') this.selectedTech$.next(null);
      else this.selectedCategory$.next(null);
    }),
    startWith('tech' as ViewMode)
  );
  viewMode: ViewMode = 'tech'; // default

  ALLOWED_TECH = new Set(['javascript', 'angular', 'react', 'vue', 'html', 'css']);

  // company slug from parent param (:slug) OR ?c=
  companySlug$ = (this.route.parent
    ? combineLatest([
      this.route.parent.paramMap.pipe(map(pm => pm.get('slug') || '')),
      this.route.queryParamMap.pipe(map(qp => qp.get('c') || ''))
    ]).pipe(map(([a, b]) => (b || a).toLowerCase()))
    : this.route.queryParamMap.pipe(map(qp => (qp.get('c') || '').toLowerCase()))
  ).pipe(startWith(''));

  // ---------- base load ----------
  rawQuestions$ = this.route.data.pipe(
    tap(d => {
      this.source = (d['source'] as ListSource) ?? 'tech';
      this.kind = (d['kind'] as Kind) ?? 'coding';
      if (this.source === 'global-coding' &&
        (this.kind === 'coding' || this.kind === 'trivia' || this.kind === 'debug')) {
        this.selectedKind$.next(this.kind);
      }
    }),
    switchMap(() =>
      combineLatest([
        this.route.queryParamMap.pipe(map(qp => (qp.get('view') as ViewMode | null))),
        of((this.router.getCurrentNavigation()?.extras.state as any)?.view as ViewMode | null)
      ]).pipe(
        map(([qView, sView]) => (qView || sView || 'tech') as ViewMode),
        tap(v => this.viewMode = v),
        take(1),
        switchMap(() => {
          // --------- GLOBAL (/coding or /coding?view=formats) ----------
          if (this.source === 'global-coding') {
            return this.selectedKind$.pipe(
              switchMap((k) => {
                // normal questions
                const base$ = this.qs.loadAllQuestions(k as any).pipe(
                  map((list: MixedQuestion[]) =>
                    list.map<Row>(q => ({ ...q, __kind: k, tech: q.tech }))
                  ),
                  startWith<Row[]>([])
                );

                // in formats view, also bring in system-design rows
                if (this.viewMode === 'formats') {
                  return combineLatest<[Row[], Row[]]>([
                    base$,
                    this.loadSystemDesignRows$()
                  ]).pipe(
                    map(([a, sys]) => [...a, ...sys])
                  );
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
                      .pipe(map((list: Question[]) => list.map<Row>(q => ({ ...q, __kind: 'trivia' })))),
                    this.qs.loadQuestions(this.tech, 'debug')
                      .pipe(map((list: Question[]) => list.map<Row>(q => ({ ...q, __kind: 'debug' }))))
                  ]).pipe(
                    map(([a, b, c]) => [...a, ...b, ...c]),
                    startWith<Row[]>([])
                  );
                }

                const k = this.kind as Exclude<Kind, 'all'>;
                return this.qs.loadQuestions(this.tech, k).pipe(
                  map((list: Question[]) => list.map<Row>(q => ({ ...q, __kind: k }))),
                  startWith<Row[]>([])
                );
              })
            );
          }

          // --------- COMPANY ----------
          if (this.kind === 'all') {
            return forkJoin([
              this.qs.loadAllQuestions('coding')
                .pipe(map((list: MixedQuestion[]) => list.map<Row>(q => ({ ...q, __kind: 'coding', tech: q.tech })))),
              this.qs.loadAllQuestions('trivia')
                .pipe(map((list: MixedQuestion[]) => list.map<Row>(q => ({ ...q, __kind: 'trivia', tech: q.tech }))))
            ]).pipe(
              map(([a, b]) => [...a, ...b]),
              startWith<Row[]>([])
            );
          } else {
            const k: Exclude<Kind, 'all'> = this.kind as Exclude<Kind, 'all'>;
            return this.qs.loadAllQuestions(k as any).pipe(
              map((list: MixedQuestion[]) => list.map<Row>(q => ({ ...q, __kind: k as any, tech: q.tech }))),
              startWith<Row[]>([])
            );
          }
        })
      )
    )
  );

  // Merge filter chain
  filtered$ = combineLatest([
    this.rawQuestions$,
    this.search$,
    this.diffs$,
    this.maxImp$,
    this.companySlug$,
    this.selectedTech$,
    this.selectedCategory$,
  ]).pipe(
    map(([questions, term, diffs, maxImp, companySlug, selectedTech, selectedCategory]) => {
      const t = (term || '').toLowerCase();
      const isFormats = this.isFormatsMode();

      return (questions ?? [])
        .filter(q =>
          (q.title?.toLowerCase()?.includes(t) ?? false) &&
          (diffs.length === 0 || diffs.includes(q.difficulty)) &&
          (q.importance ?? 0) <= maxImp &&
          (!companySlug || ((q as any).companies ?? []).includes(companySlug)) &&
          // Tech filter only in tech mode (global)
          (this.source !== 'global-coding' || isFormats || !selectedTech || q.tech === selectedTech) &&
          // Category filter only in formats mode (global)
          (this.source !== 'global-coding' || !isFormats || !selectedCategory || inferCategory(q) === selectedCategory)
        )
        .sort((a, b) => {
          if (a.importance !== b.importance) return (b.importance ?? 0) - (a.importance ?? 0);
          return (a.title || '').localeCompare(b.title || '');
        });
    })
  );

  // True when /coding?view=forms and the "System design" pill is selected
  isSystemCategoryActive$ = combineLatest([
    this.viewMode$,              // 'tech' | 'formats'
    this.selectedCategory$       // 'ui' | 'js-fn' | 'algo' | 'system' | null
  ]).pipe(
    map(([vm, cat]) => vm === 'formats' && cat === 'system'),
    startWith(false)
  );


  difficultyOptions = [
    { label: 'Beginner', value: 'easy' as Difficulty },
    { label: 'Intermediate', value: 'intermediate' as Difficulty },
    { label: 'Advanced', value: 'hard' as Difficulty }
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
    { key: 'algo', label: 'Algorithmic coding' },
    { key: 'system', label: 'System design' },
  ];

  filteredCount$ = this.filtered$.pipe(map(list => list.length), startWith(0));

  kindTabs: Array<{ key: Exclude<Kind, 'all'>; label: string }> = [
    { key: 'coding', label: 'Coding' },
    { key: 'trivia', label: 'Quiz' },
    { key: 'debug', label: 'Debug' }
  ];

  constructor(
    private route: ActivatedRoute,
    private qs: QuestionService,
    private router: Router
  ) {
    // seed tech filter from ?tech= on global list
    this.route.queryParamMap
      .pipe(
        map(qp => (qp.get('tech') || '').toLowerCase()),
        tap(t => {
          const allowed: Tech[] = ['javascript', 'angular', 'react', 'vue', 'html', 'css'];
          this.selectedTech$.next(allowed.includes(t as Tech) ? (t as Tech) : null);
        })
      )
      .subscribe();
  }

  // ---------- helpers used by template ----------
  descriptionText(q: Question): string {
    const desc: any = (q as any).description;
    if (desc && typeof desc === 'object') return (desc as StructuredDescription).text || '';
    return q.description || '';
  }

  linkTo(q: Row): any[] {
    // System-design rows (from formats view) go to /system-design/:id
    if (q.__sd || (this.isFormatsMode() && inferCategory(q) === 'system')) {
      return ['/system-design', q.id];
    }

    const tech = (q as any).tech ?? this.tech ?? 'javascript';
    if (q.__kind === 'trivia') return ['/', tech, 'trivia', q.id];
    if (q.__kind === 'debug') return ['/', tech, 'debug', q.id];
    return ['/', tech, 'coding', q.id];
  }

  stateForNav(list: Row[], current: Row, companySlug: string | null) {
    const items: PracticeItem[] = list.map((r) => ({
      tech: (r.tech ?? this.tech ?? 'javascript') as Tech,
      kind: r.__kind,
      id: r.id
    }));
    const index = Math.max(0, list.findIndex(r => r.id === current.id));
    const ret = this.detailStateForCompany(companySlug);
    const session: PracticeSession = { items, index };
    return { ...(ret || {}), session };
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
      const kindLabel = k === 'trivia' ? 'Quiz' : (k === 'debug' ? 'Debug' : 'Coding');
      if (this.isFormatsMode()) {
        const cat = this.selectedCategory$.value;
        const catLabel =
          !cat ? '' :
            cat === 'ui' ? ' — User interface' :
              cat === 'js-fn' ? ' — JavaScript functions' :
                cat === 'algo' ? ' — Algorithmic coding' :
                  ' — System design';
        return `All ${kindLabel} Questions${catLabel}`;
      }
      return `All ${kindLabel} Questions`;
    }
    const t = this.tech ?? 'javascript';
    const what =
      this.kind === 'coding' ? 'Coding Challenges'
        : this.kind === 'trivia' ? 'Trivia Questions'
          : this.kind === 'debug' ? 'Debug Tasks'
            : 'All Questions';
    return `${this.capitalize(t)} ${what}`;
  }

  private capitalize(s: string | null | undefined) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

  techName(q: Row) {
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

  // GLOBAL filters
  toggleTech(key: Tech) {
    const curr = this.selectedTech$.value;
    this.selectedTech$.next(curr === key ? null : key);
  }
  selectKind(k: 'coding' | 'trivia' | 'debug') {
    if (this.source === 'global-coding') this.selectedKind$.next(k);
  }
  toggleCategory(key: CategoryKey) {
    const curr = this.selectedCategory$.value;
    const next = curr === key ? null : key;
    this.selectedCategory$.next(next);

    // OPTIONAL: if System design is active, pin kind to coding so the kind
    // pills (hidden) won’t load other lists in the background.
    if (next === 'system') this.selectedKind$.next('coding');
  }

  // ---------- System-Design loader (used when view=forms) ----------
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

  /** True when we're on /coding?view=formats and System design tab is selected */
  isSystemCategoryActive(): boolean {
    return this.isFormatsMode() && this.selectedCategory$.value === 'system';
  }
}
