import { CommonModule, Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BehaviorSubject, combineLatest, distinctUntilChanged, forkJoin, map, Observable, of, shareReplay, Subject, takeUntil } from 'rxjs';
import { Question, QuestionKind } from '../../../core/models/question.model';
import { Tech } from '../../../core/models/user.model';
import { QuestionService } from '../../../core/services/question.service';
import { UserProgressService } from '../../../core/services/user-progress.service';
import { SeoService } from '../../../core/services/seo.service';
import {
  FRAMEWORK_FAMILY_BY_ID,
  frameworkLabel,
  FrameworkVariant,
} from '../../../shared/framework-families';
import {
  TRACK_LOOKUP,
  TrackConfig,
  TrackQuestionKind,
  TrackQuestionRef,
} from '../track.data';
import { FaChipComponent } from '../../../shared/components/chip/fa-chip.component';
import { CodingFilterPanelComponent } from '../../filters/coding-filter-panel/coding-filter-panel';

type PracticeItem = { tech: Tech; kind: QuestionKind; id: string };
type TrackItem = {
  id: string;
  title: string;
  kind: TrackQuestionKind;
  tech?: Tech;
  description?: string;
  difficulty?: string;
  importance?: number;
  tags?: string[];
  category?: string;
};
type ImportanceTier = 'low' | 'medium' | 'high';
type SortKey =
  | 'default'
  | 'title-asc' | 'title-desc'
  | 'difficulty-asc' | 'difficulty-desc'
  | 'importance-desc' | 'importance-asc'
  | 'created-desc' | 'created-asc'
  | 'diff-asc' | 'diff-desc';
type NarrowSortKey = 'diff-asc' | 'diff-desc' | 'importance-desc' | 'title-asc' | 'title-desc';
type TrackTechFilter = 'all' | 'javascript' | 'html' | 'css' | 'ui';

const UI_TECHS: ReadonlySet<Tech> = new Set<Tech>(['react', 'angular', 'vue']);

@Component({
  selector: 'app-track-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FaChipComponent, CodingFilterPanelComponent],
  templateUrl: './track-detail.component.html',
  styleUrls: ['./track-detail.component.css'],
})
export class TrackDetailComponent implements OnInit, OnDestroy {
  track: TrackConfig | null = null;
  featured$?: Observable<TrackItem[]>;
  filtered$?: Observable<TrackItem[]>;

  private destroy$ = new Subject<void>();

  kindFilter$ = new BehaviorSubject<TrackQuestionKind | 'all'>('all');
  techFilter$ = new BehaviorSubject<TrackTechFilter>('all');
  search$ = new BehaviorSubject<string>('');
  searchTerm = '';
  diffFilter$ = new BehaviorSubject<Set<'easy' | 'intermediate' | 'hard'>>(new Set());
  impFilter$ = new BehaviorSubject<Set<ImportanceTier>>(new Set());
  sort$ = new BehaviorSubject<NarrowSortKey>('diff-asc');
  sortOpen = false;
  sortOptions: Array<{ key: NarrowSortKey; label: string; hint?: string }> = [
    { key: 'diff-asc', label: 'Easiest first' },
    { key: 'diff-desc', label: 'Hardest first' },
    { key: 'importance-desc', label: 'Highest importance' },
    { key: 'title-asc', label: 'Title A-Z' },
  ];
  popularTags: string[] = [];
  selectedTags: string[] = [];
  tagMatchMode: 'all' | 'any' = 'all';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private qs: QuestionService,
    private seo: SeoService,
    private location: Location,
    public progress: UserProgressService,
  ) { }

  isSolved(id: string | undefined): boolean {
    return id ? this.progress.isSolved(id) : false;
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((pm) => (pm.get('slug') || '').toLowerCase()),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe((slug) => this.loadTrack(slug));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTrack(slug: string) {
    const track = TRACK_LOOKUP.get(slug as any) ?? null;

    if (!track) {
      this.router.navigateByUrl('/404');
      return;
    }

    const qp = this.route.snapshot.queryParamMap;
    const qInit = qp.get('q') || '';
    const kindInit = (qp.get('kind') as TrackQuestionKind | 'all') || 'all';
    const techInit = qp.get('tech');
    const diffInit = qp.get('diff') ?? null;
    const impInit = qp.get('imp') ?? null;
    const sortInit = (qp.get('sort') as 'diff-asc' | 'diff-desc' | 'importance-desc' | 'title-asc' | null) || null;

    const allowedKinds = new Set<TrackQuestionKind | 'all'>(['all', 'coding', 'trivia', 'system-design']);
    const allowedSorts = new Set(['diff-asc', 'diff-desc', 'importance-desc', 'title-asc']);

    // Reset/hydrate filter state from URL every time the track changes.
    this.searchTerm = qInit;
    this.search$.next(qInit);
    this.kindFilter$.next(allowedKinds.has(kindInit) ? kindInit : 'all');
    this.techFilter$.next(this.normalizeTechFilter(techInit));

    const parsedDiffs = (diffInit || '')
      .split(',')
      .map((d) => d.trim())
      .filter((d) => !!d)
      .map((d) => this.normalizeDifficulty(d)) as Array<'easy' | 'intermediate' | 'hard'>;
    this.diffFilter$.next(new Set(parsedDiffs));

    const parsedImps = (impInit || '')
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter((d) => d === 'low' || d === 'medium' || d === 'high') as ImportanceTier[];
    this.impFilter$.next(new Set(parsedImps));

    this.sort$.next(sortInit && allowedSorts.has(sortInit) ? sortInit : 'diff-asc');
    this.sortOpen = false;

    this.track = track;
    this.featured$ = this.loadFeatured(track).pipe(shareReplay(1));
    this.filtered$ = combineLatest([
      this.featured$,
      this.kindFilter$,
      this.techFilter$,
      this.search$,
      this.diffFilter$,
      this.impFilter$,
      this.sort$,
    ]).pipe(
      map(([items, kind, tech, term, diffs, imps, sortKey]) => {
        const t = term.trim().toLowerCase();
        const activeDiffs = diffs?.size
          ? diffs
          : new Set<'easy' | 'intermediate' | 'hard'>(['easy', 'intermediate', 'hard']);
        const activeImps = imps?.size
          ? imps
          : new Set<ImportanceTier>(['low', 'medium', 'high']);

        const filtered = (items || []).filter((it) => {
          const kindOk = kind === 'all' ? true : it.kind === kind;
          const techOk = tech === 'all'
            ? true
            : tech === 'ui'
              ? this.isUiTech(it.tech)
              : it.tech === tech;
          const normDiff = this.normalizeDifficulty(it.difficulty);
          const impTier = this.tierFromImportance(it.importance);
          const diffOk = activeDiffs.has(normDiff);
          const impOk = activeImps.has(impTier);
          const termOk = !t || it.title.toLowerCase().includes(t) || (it.description || '').toLowerCase().includes(t);
          return kindOk && techOk && diffOk && impOk && termOk;
        });
        const sorted = filtered.slice().sort((a, b) => this.sortItems(a, b, sortKey));
        return tech === 'ui' ? this.dedupeUiFamilies(sorted) : sorted;
      }),
    );

    this.seo.updateTags({
      title: `${track.title} track`,
      description: track.subtitle,
      keywords: [track.title, 'front end interview track', 'coding practice', 'system design'],
      canonical: undefined,
    });
  }

  onSearch(term: string) {
    this.searchTerm = term ?? '';
    this.search$.next(this.searchTerm);
    this.syncQueryParams();
  }

  onKindChange(val: TrackQuestionKind | 'all') {
    const allowed = new Set<TrackQuestionKind | 'all'>(['all', 'coding', 'trivia', 'system-design']);
    const next = allowed.has(val) ? val : 'all';
    this.kindFilter$.next(next);
    this.syncQueryParams();
  }

  onTechChange(val: TrackTechFilter | Tech) {
    const next = this.normalizeTechFilter(val);
    this.techFilter$.next(next);
    this.syncQueryParams();
  }

  onDiffToggle(level: 'easy' | 'intermediate' | 'hard') {
    const current = new Set(this.diffFilter$.value);
    if (current.has(level)) {
      current.delete(level);
    } else {
      current.add(level);
    }
    this.diffFilter$.next(current);
    this.syncQueryParams();
  }

  onDifficultyChange(val: { difficulty: 'easy' | 'intermediate' | 'hard'; checked: boolean }) {
    const next = new Set(this.diffFilter$.value);
    if (val.checked) {
      next.add(val.difficulty);
    } else {
      next.delete(val.difficulty);
    }
    this.diffFilter$.next(next);
    this.syncQueryParams();
  }

  onImportanceChange(val: { tier: ImportanceTier; checked: boolean }) {
    const next = new Set(this.impFilter$.value);
    if (val.checked) {
      next.add(val.tier);
    } else {
      next.delete(val.tier);
    }
    this.impFilter$.next(next);
    this.syncQueryParams();
  }

  onSortChange(val: SortKey) {
    const next = this.clampSortKey(val);
    this.sort$.next(next);
    this.syncQueryParams();
  }

  toggleSort() { this.sortOpen = !this.sortOpen; }
  closeSort() { this.sortOpen = false; }
  setSort(val: SortKey) {
    this.onSortChange(val);
    this.sortOpen = false;
  }

  onTagToggled(_tag: string) { /* tags not used in tracks */ }
  onClearTags() { this.selectedTags = []; }
  onTagMatchToggle() { this.tagMatchMode = this.tagMatchMode === 'all' ? 'any' : 'all'; }

  get difficultySelection(): Array<'easy' | 'intermediate' | 'hard'> {
    return Array.from(this.diffFilter$.value);
  }

  get importanceSelection(): ImportanceTier[] {
    return Array.from(this.impFilter$.value);
  }

  private syncQueryParams() {
    const q = this.searchTerm.trim();
    const kind = this.kindFilter$.value;
    const tech = this.techFilter$.value;
    const diff = Array.from(this.diffFilter$.value);
    const imp = Array.from(this.impFilter$.value);
    const sort = this.sort$.value;

    // We intentionally use `Location.replaceState()` (no navigation / no history pollution).
    // Merge against the *actual* current URL to avoid dropping previously-set params.
    const url = new URL(window.location.href);

    const setOrDelete = (key: string, value: string | null) => {
      if (!value) url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    };

    setOrDelete('q', q || null);
    setOrDelete('kind', kind === 'all' ? null : kind);
    setOrDelete('tech', tech === 'all' ? null : tech);

    const diffParam = diff.length === 0 || diff.length === 3 ? null : diff.join(',');
    setOrDelete('diff', diffParam);

    const impParam = imp.length === 0 || imp.length === 3 ? null : imp.join(',');
    setOrDelete('imp', impParam);

    setOrDelete('sort', sort === 'diff-asc' ? null : sort);

    const qs = url.searchParams.toString();
    this.location.replaceState(`${url.pathname}${qs ? `?${qs}` : ''}${url.hash}`);
  }

  startPractice(items: TrackItem[]): void {
    const practice = this.toPracticeItems(items);
    if (!practice.length) {
      const first = items[0];
      if (first) {
        this.router.navigate(this.linkFor(first));
      }
      return;
    }

    const first = practice[0];
    const returnToUrl = this.location.path(true) || `/tracks/${this.track?.slug}`;

    this.router.navigate(
      ['/', first.tech, first.kind === 'trivia' ? 'trivia' : 'coding', first.id],
      {
        state: {
          session: { items: practice, index: 0 },
          returnToUrl,
          returnLabel: this.track?.title,
        },
      },
    );
  }

  hasPractice(items: TrackItem[]): boolean {
    return this.toPracticeItems(items).length > 0;
  }

  displayDifficulty(d?: string): string {
    const v = (d || '').toLowerCase();
    if (v === 'easy') return 'Beginner';
    if (v === 'medium' || v === 'intermediate') return 'Intermediate';
    if (v === 'hard') return 'Hard';
    return v ? v.charAt(0).toUpperCase() + v.slice(1) : '—';
  }

  linkFor(item: TrackItem): any[] {
    if (item.kind === 'system-design') {
      return ['/system-design', item.id];
    }
    const seg = item.kind === 'trivia' ? 'trivia' : 'coding';
    const tech = item.tech ?? 'javascript';
    return ['/', tech, seg, item.id];
  }

  frameworkOptions(item: TrackItem): FrameworkVariant[] {
    if (item.kind !== 'coding') return [];
    const fam = FRAMEWORK_FAMILY_BY_ID.get(item.id);
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
        returnToUrl: this.location.path(true) || this.router.url,
        returnLabel: this.track?.title ?? 'Back to track',
      },
    });
  }

  navState(items: TrackItem[], current: TrackItem) {
    if (current.kind === 'system-design') return undefined;
    const practice = this.toPracticeItems(items);
    if (!practice.length) return undefined;

    const idx = Math.max(
      0,
      practice.findIndex(
        (p) => p.id === current.id && p.kind === current.kind && p.tech === current.tech,
      ),
    );

    return {
      session: { items: practice, index: idx },
      returnToUrl: this.location.path(true) || `/tracks/${this.track?.slug}`,
      returnLabel: this.track?.title,
    };
  }

  preview(text?: string, max = 140): string {
    if (!text) return '';
    const t = text.trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max).trimEnd()}…`;
  }

  categoryLabel(item: TrackItem): string {
    if (item.kind === 'system-design') return 'System design';
    if (item.category) return item.category;
    return 'User interface';
  }

  categoryIcon(item: TrackItem): string {
    if (item.kind === 'system-design') return '🏗️';
    if (item.category?.toLowerCase().includes('html')) return '</>';
    if (item.category?.toLowerCase().includes('css')) return '</>';
    if (item.category?.toLowerCase().includes('javascript')) return 'JS';
    return '</>';
  }

  diffClass(d?: string): string {
    const v = (d || '').toLowerCase();
    if (v === 'easy') return 'diff-easy';
    if (v === 'hard') return 'diff-hard';
    return 'diff-mid';
  }

  private familyKey(item: TrackItem): string | null {
    const fam = FRAMEWORK_FAMILY_BY_ID.get(item.id);
    return fam ? fam.key : null;
  }

  private dedupeUiFamilies(items: TrackItem[]): TrackItem[] {
    const seen = new Set<string>();
    const result: TrackItem[] = [];
    for (const it of items) {
      const key = this.familyKey(it) ?? it.id;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(it);
    }
    return result;
  }

  private isUiTech(tech?: Tech | null): boolean {
    return tech ? UI_TECHS.has(tech) : false;
  }

  private inferCategory(tech?: Tech | null): string {
    if (!tech) return 'User interface';
    if (tech === 'html' || tech === 'css') return 'HTML & CSS';
    if (tech === 'javascript') return 'JavaScript';
    if (this.isUiTech(tech)) return 'User interface';
    return 'User interface';
  }

  private diffRank(d?: string): number {
    const v = (d || '').toLowerCase();
    if (v === 'easy') return 0;
    if (v === 'medium' || v === 'intermediate') return 1;
    if (v === 'hard') return 2;
    return 1;
  }

  private tierFromImportance(n?: number | null): ImportanceTier {
    const v = n ?? 0;
    if (v >= 4) return 'high';
    if (v >= 2) return 'medium';
    return 'low';
  }

  private normalizeDifficulty(d?: string | null): 'easy' | 'intermediate' | 'hard' {
    const v = (d || '').toLowerCase();
    if (v === 'easy') return 'easy';
    if (v === 'hard') return 'hard';
    return 'intermediate';
  }

  private normalizeTechFilter(val: string | TrackTechFilter | Tech | null): TrackTechFilter {
    const v = (val || '').toString().toLowerCase();
    if (v === 'all') return 'all';
    if (v === 'javascript' || v === 'html' || v === 'css') return v as TrackTechFilter;
    if (v === 'ui' || v === 'user-interface') return 'ui';
    if (v === 'react' || v === 'angular' || v === 'vue') return 'ui';
    return 'all';
  }

  private sortItems(
    a: TrackItem,
    b: TrackItem,
    sortKey: NarrowSortKey,
  ) {
    const aw = this.isWarmupTitle(a.title);
    const bw = this.isWarmupTitle(b.title);
    if (aw !== bw) return aw ? -1 : 1;

    if (sortKey === 'diff-desc') {
      return this.diffRank(b.difficulty) - this.diffRank(a.difficulty) || (b.importance ?? 0) - (a.importance ?? 0);
    }
    if (sortKey === 'importance-desc') {
      return (b.importance ?? 0) - (a.importance ?? 0) || this.diffRank(a.difficulty) - this.diffRank(b.difficulty);
    }
    if (sortKey === 'title-asc') {
      return a.title.localeCompare(b.title);
    }
    if (sortKey === 'title-desc') {
      return b.title.localeCompare(a.title);
    }
    return this.diffRank(a.difficulty) - this.diffRank(b.difficulty) || (b.importance ?? 0) - (a.importance ?? 0);
  }

  private isWarmupTitle(title: string | null | undefined): boolean {
    return /\bwarm[-\s]?up\b/i.test(title ?? '');
  }

  private normalizeSortKey(val: SortKey): SortKey {
    if (val === 'difficulty-asc') return 'diff-asc';
    if (val === 'difficulty-desc') return 'diff-desc';
    return val;
  }

  private clampSortKey(val: SortKey): NarrowSortKey {
    const normalized = this.normalizeSortKey(val);
    if (normalized === 'diff-asc' || normalized === 'diff-desc' || normalized === 'importance-desc' || normalized === 'title-asc' || normalized === 'title-desc') {
      return normalized;
    }
    return 'diff-asc';
  }

  private loadFeatured(track: TrackConfig): Observable<TrackItem[]> {
    const system$ = this.qs.loadSystemDesign().pipe(shareReplay(1));

    const loaders = track.featured.map((ref) => {
      if (ref.kind === 'system-design') {
        return system$.pipe(
          map((list: any[]) => {
            const hit = (list || []).find((it) => it.id === ref.id);
            return hit ? this.toSystemItem(hit) : null;
          }),
        );
      }

      if (!ref.tech) {
        return of(null);
      }

      return this.qs.getById(ref.tech, ref.kind as QuestionKind, ref.id).pipe(
        map((q) => (q ? this.toTrackItem(ref, q) : null)),
      );
    });

    if (!loaders.length) return of([]);

    return forkJoin(loaders).pipe(
      map((items) => items.filter(Boolean) as TrackItem[]),
    );
  }

  private toTrackItem(ref: TrackQuestionRef, q: Question): TrackItem {
    return {
      id: q.id,
      kind: ref.kind,
      tech: ref.tech,
      title: q.title,
      description: this.descriptionText(q),
      difficulty: q.difficulty,
      importance: q.importance,
      tags: q.tags || [],
      category: this.inferCategory(ref.tech),
    };
  }

  private toSystemItem(meta: any): TrackItem {
    return {
      id: meta.id,
      kind: 'system-design',
      title: meta.title,
      description: typeof meta.description === 'string' ? meta.description : '',
      difficulty: 'intermediate',
      importance: 4,
      tags: meta.tags || [],
      category: 'System design',
    };
  }

  private descriptionText(q: Question): string {
    const d: any = (q as any).description;
    if (typeof d === 'string') return d;
    if (d && typeof d === 'object') {
      return (d.summary || d.text || '') as string;
    }
    return '';
  }

  private toPracticeItems(items: TrackItem[]): PracticeItem[] {
    return items
      .filter((it) => it.kind !== 'system-design' && !!it.tech)
      .map((it) => ({
        tech: it.tech as Tech,
        kind: it.kind as QuestionKind,
        id: it.id,
      }));
  }
}
