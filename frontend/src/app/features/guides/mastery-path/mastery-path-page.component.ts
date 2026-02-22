import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { MasteryPathResolved } from '../../../core/resolvers/mastery-path.resolver';
import { MasteryProgressService } from '../../../core/services/mastery-progress.service';
import { SeoService } from '../../../core/services/seo.service';
import {
  MasteryItem,
  MasteryItemType,
  MasteryModuleView,
} from '../../../shared/mastery/mastery-path.model';
import { OfflineBannerComponent } from '../../../shared/components/offline-banner/offline-banner';
import { MasteryModuleListComponent } from './components/mastery-module-list.component';
import { MasterySidePanelComponent } from './components/mastery-side-panel.component';

type ItemTypeFilter = 'all' | MasteryItemType;

@Component({
  selector: 'app-mastery-path-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    OfflineBannerComponent,
    MasteryModuleListComponent,
    MasterySidePanelComponent,
  ],
  styles: [`
    :host { display: block; color: var(--uf-text-primary); background: var(--uf-bg); }

    .wrap {
      --mastery-accent: var(--uf-mastery-accent);
      --mastery-accent-soft: var(--uf-mastery-accent-soft);
      --mastery-tint: var(--uf-mastery-surface-tint);

      max-width: 1120px;
      margin: 0 auto;
      padding: 24px 0 48px;
      display: grid;
      gap: 16px;
    }

    .hero {
      border-radius: var(--uf-card-radius);
      border: 1px solid color-mix(in srgb, var(--mastery-accent) 44%, var(--uf-border-subtle) 56%);
      background: linear-gradient(
        140deg,
        color-mix(in srgb, var(--mastery-accent-soft) 26%, var(--uf-surface) 74%) 0%,
        color-mix(in srgb, var(--mastery-tint) 28%, var(--uf-surface-alt) 72%) 100%
      );
      box-shadow: var(--uf-card-shadow);
      padding: 16px;
      display: grid;
      gap: 12px;
    }

    .hero__title {
      margin: 0;
      color: var(--uf-text-primary);
    }

    .hero__subtitle {
      margin: 0;
      max-width: 860px;
      color: color-mix(in srgb, var(--uf-text-primary) 78%, transparent);
    }

    .hero__meta {
      display: grid;
      gap: 6px;
    }

    .hero__meta-line {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
      font-size: 13px;
      color: color-mix(in srgb, var(--uf-text-primary) 68%, transparent);
    }

    .hero__bar {
      position: relative;
      height: 8px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--uf-surface-alt) 80%, var(--uf-surface));
      overflow: hidden;
    }

    .hero__bar > span {
      position: absolute;
      inset: 0;
      width: var(--progress, 0%);
      border-radius: 999px;
      background: color-mix(in srgb, var(--mastery-accent) 64%, #10b981 36%);
    }

    .hero__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }

    .hero__resume,
    .hero__reset {
      border-radius: var(--uf-radius-pill);
      border: 1px solid var(--uf-border-subtle);
      text-decoration: none;
      background: color-mix(in srgb, var(--uf-surface) 92%, var(--uf-surface-alt));
      color: var(--uf-text-primary);
      font-size: 12px;
      font-weight: 700;
      padding: 8px 12px;
      transition: border-color 160ms ease, background-color 160ms ease;
      cursor: pointer;
    }

    .hero__resume:hover,
    .hero__reset:hover {
      border-color: color-mix(in srgb, var(--uf-border-subtle) 60%, var(--mastery-accent) 40%);
      background: color-mix(in srgb, var(--mastery-accent) 16%, var(--uf-surface));
    }

    .hero__reset {
      font-family: inherit;
    }

    .rail {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 8px;
    }

    .rail__item {
      border: 1px solid var(--uf-border-subtle);
      border-radius: 10px;
      background: color-mix(in srgb, var(--uf-surface) 94%, var(--uf-surface-alt));
      color: var(--uf-text-primary);
      padding: 10px;
      display: grid;
      gap: 4px;
      text-align: left;
      cursor: pointer;
      transition: border-color 160ms ease, background-color 160ms ease;
    }

    .rail__item:hover {
      border-color: color-mix(in srgb, var(--uf-border-subtle) 60%, var(--mastery-accent) 40%);
      background: color-mix(in srgb, var(--mastery-accent) 12%, var(--uf-surface));
    }

    .rail__item--active {
      border-color: color-mix(in srgb, var(--mastery-accent) 62%, var(--uf-border-subtle));
      background: color-mix(in srgb, var(--mastery-accent) 18%, var(--uf-surface));
    }

    .rail__item--locked .rail__title,
    .rail__item--locked .rail__meta {
      color: color-mix(in srgb, var(--uf-text-tertiary) 86%, transparent);
    }

    .rail__item--active.rail__item--locked .rail__title,
    .rail__item--active.rail__item--locked .rail__meta {
      color: color-mix(in srgb, var(--uf-text-primary) 82%, transparent);
    }

    .rail__title {
      font-size: 12px;
      font-weight: 700;
      line-height: 1.2;
    }

    .rail__meta {
      font-size: 11px;
      color: color-mix(in srgb, var(--uf-text-secondary) 84%, transparent);
    }

    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    .filter {
      border-radius: var(--uf-radius-pill);
      border: 1px solid var(--uf-border-subtle);
      background: color-mix(in srgb, var(--uf-surface) 94%, var(--uf-surface-alt));
      color: var(--uf-text-secondary);
      padding: 6px 11px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }

    .filter--active {
      color: var(--uf-text-primary);
      border-color: color-mix(in srgb, var(--uf-border-subtle) 58%, var(--mastery-accent) 42%);
      background: color-mix(in srgb, var(--mastery-accent) 15%, var(--uf-surface));
    }

    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 300px;
      gap: 14px;
      align-items: start;
    }

    .coming {
      border-radius: var(--uf-card-radius);
      border: 1px solid var(--uf-border-subtle);
      background: color-mix(in srgb, var(--uf-surface) 94%, var(--uf-surface-alt));
      box-shadow: var(--uf-card-shadow);
      padding: 16px;
      display: grid;
      gap: 8px;
    }

    .coming h2,
    .coming p {
      margin: 0;
    }

    .coming p {
      color: color-mix(in srgb, var(--uf-text-secondary) 84%, transparent);
      max-width: 820px;
    }

    .coming a {
      text-decoration: none;
      color: var(--uf-text-primary);
      font-weight: 700;
      border-bottom: 1px dotted color-mix(in srgb, var(--uf-text-tertiary) 70%, transparent);
      width: fit-content;
    }

    @media (max-width: 1080px) {
      .layout { grid-template-columns: 1fr; }
      .rail { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }

    @media (max-width: 760px) {
      .rail { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .hero { padding: 14px; }
    }
  `],
  template: `
    <div
      class="wrap fa-body"
      *ngIf="path() as masteryPath"
    >
      <section class="hero">
        <h1 class="hero__title fa-page-title">{{ masteryPath.title }}</h1>
        <p class="hero__subtitle fa-meta-text">{{ masteryPath.subtitle }}</p>

        <div class="hero__meta">
          <div class="hero__meta-line">
            <span>{{ overallCompletedCount() }}/{{ totalItemCount() }} complete</span>
            <span>{{ overallPercent() }}/100 mastery score</span>
            <span>Knowledge {{ masteryPath.scoring.knowledgeWeight }}% · Coding {{ masteryPath.scoring.codingWeight }}%</span>
          </div>
          <div class="hero__bar" [style.--progress]="overallPercent() + '%'">
            <span></span>
          </div>
        </div>

        <div class="hero__actions" *ngIf="masteryPath.availability === 'active'">
          <a
            *ngIf="resumeItem() as resume"
            class="hero__resume"
            [routerLink]="resume.target?.route"
            [queryParams]="resume.target?.queryParams">
            Resume: {{ resume.title }}
          </a>

          <button type="button" class="hero__reset" (click)="resetProgress()">Reset progress</button>
        </div>
      </section>

      <section class="coming" *ngIf="masteryPath.availability === 'coming-soon'; else activeTrack">
        <h2>{{ masteryPath.title }} is coming soon</h2>
        <p>
          The modular mastery engine is ready. This framework pack has not been published yet.
          JavaScript path is live today.
        </p>
        <a [routerLink]="['/guides', 'framework-prep', 'javascript-prep-path', 'mastery']">Open JavaScript mastery track</a>
      </section>

      <ng-template #activeTrack>
        <nav class="rail" aria-label="Mastery modules">
          <button
            *ngFor="let view of unfilteredModuleViews()"
            type="button"
            class="rail__item"
            [class.rail__item--active]="view.module.id === activeModuleId()"
            [class.rail__item--locked]="view.locked"
            (click)="setActiveModule(view.module.id)">
            <span class="rail__title">{{ view.module.title }}</span>
            <span class="rail__meta">{{ view.module.scoreBand }}</span>
            <span class="rail__meta">{{ view.completedCount }}/{{ view.totalCount }} complete</span>
          </button>
        </nav>

        <section class="filters" aria-label="Mastery filters">
          <button
            *ngFor="let option of typeFilters"
            type="button"
            class="filter"
            [class.filter--active]="typeFilter() === option.id"
            (click)="setTypeFilter(option.id)">
            {{ option.label }}
          </button>

          <button
            type="button"
            class="filter"
            [class.filter--active]="incompleteOnly()"
            (click)="toggleIncompleteOnly()">
            Incomplete only
          </button>
        </section>

        <section class="layout">
          <app-mastery-module-list
            [moduleViews]="filteredModuleViews()"
            [activeModuleId]="activeModuleId()"
            [completedItemIds]="completedSet()"
            (moduleSelected)="setActiveModule($event)"
            (toggleItemCompletion)="toggleItemCompletion($event)">
          </app-mastery-module-list>

          <app-mastery-side-panel
            [module]="activeModuleView()?.module ?? null"
            [moduleCompletionPercent]="activeModuleView()?.completionPercent ?? 0"
            [moduleCompletedCount]="activeModuleView()?.completedCount ?? 0"
            [moduleTotalCount]="activeModuleView()?.totalCount ?? 0"
            [moduleLocked]="activeModuleView()?.locked ?? false"
            [knowledgeWeight]="masteryPath.scoring.knowledgeWeight"
            [codingWeight]="masteryPath.scoring.codingWeight">
          </app-mastery-side-panel>
        </section>
      </ng-template>

      <app-offline-banner></app-offline-banner>
    </div>
  `,
})
export class MasteryPathPageComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  private readonly progress = inject(MasteryProgressService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private sub?: Subscription;

  readonly typeFilters: Array<{ id: ItemTypeFilter; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'trivia', label: 'Trivia' },
    { id: 'predict', label: 'Predict Output' },
    { id: 'coding', label: 'Coding' },
    { id: 'checkpoint', label: 'Checkpoint' },
  ];

  readonly resolvedSig = signal<MasteryPathResolved | null>(null);
  readonly activeModuleId = signal<string | null>(null);
  readonly typeFilter = signal<ItemTypeFilter>('all');
  readonly incompleteOnly = signal(false);

  readonly completedSet = this.progress.completedSet;

  readonly path = computed(() => this.resolvedSig()?.path ?? null);

  readonly moduleLockMap = computed(() => {
    const path = this.path();
    const completed = this.completedSet();
    const map = new Map<string, boolean>();

    if (!path) return map;

    for (const module of path.modules) {
      const unlock = module.unlockRule;
      const locked = unlock.kind === 'checkpoint' ? !completed.has(unlock.checkpointItemId) : false;
      map.set(module.id, locked);
    }

    return map;
  });

  readonly unfilteredModuleViews = computed<MasteryModuleView[]>(() => {
    const path = this.path();
    if (!path) return [];

    const lockMap = this.moduleLockMap();
    const completed = this.completedSet();

    const itemsByModule = new Map<string, MasteryItem[]>();
    for (const module of path.modules) itemsByModule.set(module.id, []);
    for (const item of path.items) {
      const bucket = itemsByModule.get(item.moduleId);
      if (!bucket) continue;
      bucket.push(item);
    }

    return path.modules.map((module) => {
      const items = itemsByModule.get(module.id) ?? [];
      const totalCount = items.length;
      const completedCount = items.reduce((count, item) => (completed.has(item.id) ? count + 1 : count), 0);
      const completionPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

      return {
        module,
        items,
        totalCount,
        completedCount,
        completionPercent,
        locked: lockMap.get(module.id) ?? false,
      };
    });
  });

  readonly filteredModuleViews = computed<MasteryModuleView[]>(() => {
    const selectedType = this.typeFilter();
    const incompleteOnly = this.incompleteOnly();
    const completed = this.completedSet();

    return this.unfilteredModuleViews().map((view) => {
      const items = view.items.filter((item) => {
        if (selectedType !== 'all' && item.type !== selectedType) return false;
        if (incompleteOnly && completed.has(item.id)) return false;
        return true;
      });

      return {
        ...view,
        items,
      };
    });
  });

  readonly activeModuleView = computed<MasteryModuleView | null>(() => {
    const activeId = this.activeModuleId();
    const views = this.unfilteredModuleViews();
    if (!views.length) return null;

    return views.find((view) => view.module.id === activeId) ?? views[0];
  });

  readonly totalItemCount = computed(() => this.path()?.items.length ?? 0);

  readonly overallCompletedCount = computed(() => {
    const itemIds = (this.path()?.items ?? []).map((item) => item.id);
    return this.progress.completedCount(itemIds);
  });

  readonly overallPercent = computed(() => {
    const itemIds = (this.path()?.items ?? []).map((item) => item.id);
    return this.progress.completionPercent(itemIds);
  });

  readonly resumeItem = computed<MasteryItem | null>(() => {
    const completed = this.completedSet();

    for (const view of this.unfilteredModuleViews()) {
      if (view.locked) continue;
      for (const item of view.items) {
        if (!completed.has(item.id)) return item;
      }
    }

    return null;
  });

  constructor() {
    this.sub = this.route.data
      .pipe(
        startWith(this.route.snapshot.data),
        map((data) => (data['masteryPath'] as MasteryPathResolved | null) ?? null),
        distinctUntilChanged((a, b) => a?.slug === b?.slug),
      )
      .subscribe((resolved) => {
        if (!resolved) {
          this.go404();
          return;
        }

        this.resolvedSig.set(resolved);
        this.progress.load(resolved.slug);
        this.typeFilter.set('all');
        this.incompleteOnly.set(false);

        this.seo.updateTags({
          title: resolved.path.title,
          description: resolved.path.description,
          canonical: `/guides/framework-prep/${resolved.slug}/mastery`,
          keywords: ['javascript mastery', 'frontend interview preparation', 'coding + trivia track'],
        });
      });

    effect(
      () => {
        const views = this.unfilteredModuleViews();
        const current = this.activeModuleId();
        if (!views.length) {
          this.activeModuleId.set(null);
          return;
        }

        if (current && views.some((view) => view.module.id === current)) return;

        const firstUnlocked = views.find((view) => !view.locked);
        this.activeModuleId.set(firstUnlocked?.module.id ?? views[0].module.id);
      },
      { allowSignalWrites: true },
    );
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  setActiveModule(moduleId: string): void {
    this.activeModuleId.set(moduleId);
  }

  setTypeFilter(filter: ItemTypeFilter): void {
    this.typeFilter.set(filter);
  }

  toggleIncompleteOnly(): void {
    this.incompleteOnly.update((prev) => !prev);
  }

  toggleItemCompletion(itemId: string): void {
    if (!itemId) return;

    const path = this.path();
    if (!path) return;

    const item = path.items.find((entry) => entry.id === itemId);
    if (!item) return;

    const isLocked = this.moduleLockMap().get(item.moduleId) ?? false;
    if (isLocked) return;

    this.progress.toggle(itemId);
  }

  resetProgress(): void {
    this.progress.resetActive();
  }

  private go404(): void {
    const missing = this.router.url;
    if (this.isBrowser) {
      try {
        sessionStorage.setItem('fa:lastMissing', missing);
      } catch {
        // no-op
      }
    }

    this.router.navigateByUrl('/404', { state: { missing }, replaceUrl: true });
  }
}
