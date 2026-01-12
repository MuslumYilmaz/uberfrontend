import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { distinctUntilChanged, map, shareReplay, startWith, takeUntil } from 'rxjs/operators';
import { QuestionService } from '../../core/services/question.service';
import { isQuestionLockedForTier } from '../../core/models/question.model';
import { AuthService } from '../../core/services/auth.service';
import { SeoMeta, SeoService } from '../../core/services/seo.service';

type SysDesign = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  type: 'system-design';
  access?: 'free' | 'premium';
};

@Component({
  standalone: true,
  selector: 'app-system-design-list',
  imports: [
    CommonModule, RouterModule, FormsModule,
    InputTextModule, MultiSelectModule, ProgressSpinnerModule, ChipModule, ButtonModule
  ],
  templateUrl: './system-design-list.component.html',
  styleUrls: ['./system-design-list.component.css']
})
export class SystemDesignListComponent implements OnInit, OnDestroy {
  searchTerm = '';
  search$ = new BehaviorSubject<string>('');
  tags$ = new BehaviorSubject<string[]>([]);
  private readonly destroy$ = new Subject<void>();
  private readonly maxItemListItems = 50;

  rawQuestions$ = this.qs.loadSystemDesign().pipe(
    startWith<SysDesign[] | null>(null),
    shareReplay(1),
  );

  tagOptions$ = this.rawQuestions$.pipe(
    map(qs => Array.from(new Set((qs ?? []).flatMap(q => q.tags))).sort()),
    map(tags => tags.map(t => ({ label: t, value: t })))
  );

  filtered$ = combineLatest([this.rawQuestions$, this.search$, this.tags$]).pipe(
    map(([questions, term, pickedTags]) => {
      const q = term.trim().toLowerCase();
      const hasTags = (arr: string[]) => pickedTags.length === 0 || pickedTags.every(t => arr.includes(t));
      return (questions ?? [])
        .filter(x =>
          (x.title.toLowerCase().includes(q) || x.tags.some(t => t.toLowerCase().includes(q))) &&
          hasTags(x.tags)
        )
        .sort((a, b) => a.title.localeCompare(b.title));
    })
  );

  constructor(
    public qs: QuestionService,
    private auth: AuthService,
    private seo: SeoService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.initListSeo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackById = (_: number, q: SysDesign) => q.id;

  isLocked(q: SysDesign): boolean {
    const user = this.auth.user();
    const access = q.access ?? 'free';
    return isQuestionLockedForTier({ access } as any, user);
  }

  handleRowClick(ev: Event, q: SysDesign) {
    if (!this.isLocked(q)) return;
    ev.preventDefault();
    ev.stopPropagation();
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

  private updateListSeo(list: SysDesign[]): void {
    const baseSeo = this.getRouteSeo();
    if (!baseSeo || this.isNoIndex(baseSeo) || list.length === 0) return;

    const itemList = this.buildItemListSchema(list);
    if (!itemList) return;

    this.seo.updateTags({ ...baseSeo, jsonLd: itemList });
  }

  private buildItemListSchema(list: SysDesign[]): Record<string, any> | null {
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
