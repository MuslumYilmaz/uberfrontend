import { HttpClient } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { TransferState, makeStateKey } from '@angular/platform-browser';
import { take } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { ASSET_READER, AssetReader } from './asset-reader';
import {
  PracticeCatalogEntry,
  PracticeFamily,
  PracticeRegistryItem,
} from '../models/practice.model';
import { normalizeAssetPath } from '../utils/asset-url.util';
import { PracticeAssetResolverService } from './practice-asset-resolver.service';

const DEFAULT_CATALOG: PracticeCatalogEntry[] = [
  { key: 'question-library', label: 'Question library', icon: 'pi pi-database', route: '/coding', family: 'question' },
  { key: 'incidents', label: 'Debug scenarios', icon: 'pi pi-bolt', route: '/incidents', family: 'incident' },
  {
    key: 'system-design',
    label: 'System design',
    icon: 'pi pi-sitemap',
    route: '/coding',
    query: { view: 'formats', category: 'system' },
    family: 'question',
  },
  { key: 'tradeoff-battles', label: 'Tradeoff battles', icon: 'pi pi-directions-alt', route: '/tradeoffs', family: 'tradeoff-battle' },
  { key: 'tracks', label: 'Interview prep tracks', icon: 'pi pi-directions', route: '/tracks', isSupplemental: true },
  {
    key: 'question-formats',
    label: 'Question formats',
    icon: 'pi pi-clone',
    route: '/coding',
    query: { view: 'formats' },
    isSupplemental: true,
  },
];

@Injectable({ providedIn: 'root' })
export class PracticeRegistryService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isServer = isPlatformServer(this.platformId);
  private readonly transferState = inject(TransferState);
  private readonly assetReader = inject(ASSET_READER) as AssetReader;
  private readonly http = inject(HttpClient);
  private readonly assetResolver = inject(PracticeAssetResolverService);
  private registry$?: Observable<PracticeRegistryItem[]>;
  private readonly registryState = signal<PracticeRegistryItem[]>([]);
  private readonly catalogState = signal<PracticeCatalogEntry[]>(DEFAULT_CATALOG);

  readonly registry = computed(() => this.registryState());
  readonly catalogEntries = computed(() => this.catalogState());
  readonly primaryHubEntries = computed(() => this.catalogState().filter((entry) => !entry.isSupplemental));

  constructor() {
    this.loadRegistry({ transferState: true })
      .pipe(take(1))
      .subscribe((items) => {
        this.registryState.set(items);
        this.catalogState.set(this.buildCatalogEntries(items));
      });
  }

  loadRegistry(options: { transferState?: boolean } = {}): Observable<PracticeRegistryItem[]> {
    const useTransferState = options.transferState !== false;
    const tsKey = makeStateKey<PracticeRegistryItem[]>('practice:registry');

    if (this.isServer) {
      return this.assetReader.readJson(normalizeAssetPath('practice/registry.json')).pipe(
        map((payload) => this.normalizeRegistry(payload)),
        tap((items) => {
          this.registryState.set(items);
          this.catalogState.set(this.buildCatalogEntries(items));
          if (useTransferState) this.transferState.set(tsKey, items);
        }),
        catchError(() => of([])),
      );
    }

    if (useTransferState && this.transferState.hasKey(tsKey)) {
      const value = this.transferState.get(tsKey, [] as PracticeRegistryItem[]);
      this.transferState.remove(tsKey);
      return of(value);
    }

    if (!this.registry$) {
      this.registry$ = this.assetResolver.getVersion().pipe(
        switchMap((bankVersion) => {
          const { primary, fallback } = this.assetResolver.getAssetUrls('practice/registry.json', bankVersion);
          return primary !== fallback
            ? this.http.get<unknown>(primary).pipe(catchError(() => this.http.get<unknown>(fallback)))
            : this.http.get<unknown>(fallback);
        }),
        map((payload) => this.normalizeRegistry(payload)),
        tap((items) => {
          this.registryState.set(items);
          this.catalogState.set(this.buildCatalogEntries(items));
        }),
        catchError(() => of([])),
        shareReplay(1),
      );
    }

    return this.registry$;
  }

  private buildCatalogEntries(items: PracticeRegistryItem[]): PracticeCatalogEntry[] {
    if (!items.length) return DEFAULT_CATALOG;

    const hasQuestionLibrary = items.some((item) => item.family === 'question' && item.tech !== 'system-design');
    const hasSystemDesign = items.some((item) => item.family === 'question' && item.tech === 'system-design');
    const families = new Set(items.map((item) => item.family));

    return DEFAULT_CATALOG
      .filter((entry) => {
        if (entry.isSupplemental) return true;
        if (entry.key === 'question-library') return hasQuestionLibrary;
        if (entry.key === 'system-design') return hasSystemDesign;
        return entry.family ? families.has(entry.family) : true;
      })
      .map((entry) => ({
        ...entry,
        badge: this.resolveCatalogBadge(entry, items),
      }));
  }

  private resolveCatalogBadge(entry: PracticeCatalogEntry, items: PracticeRegistryItem[]): string | null {
    switch (entry.key) {
      case 'incidents':
        return items.some((item) => item.family === 'incident') ? 'New' : null;
      case 'tradeoff-battles':
        return items.some((item) => item.family === 'tradeoff-battle') ? 'New' : null;
      default:
        return null;
    }
  }

  private normalizeRegistry(payload: unknown): PracticeRegistryItem[] {
    if (!Array.isArray(payload)) return [];
    return payload
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map((item) => ({
        id: String(item['id'] || '').trim(),
        family: this.normalizeFamily(item['family']),
        title: String(item['title'] || '').trim(),
        route: String(item['route'] || '').trim(),
        tech: this.normalizeTech(item['tech']),
        difficulty: this.normalizeDifficulty(item['difficulty']),
        summary: String(item['summary'] || ''),
        tags: Array.isArray(item['tags']) ? item['tags'].filter((tag): tag is string => typeof tag === 'string') : [],
        access: (String(item['access'] || 'free') === 'premium' ? 'premium' : 'free') as PracticeRegistryItem['access'],
        estimatedMinutes: typeof item['estimatedMinutes'] === 'number' ? item['estimatedMinutes'] : 10,
        updatedAt: String(item['updatedAt'] || ''),
        schemaVersion: String(item['schemaVersion'] || 'unknown'),
        assetRef: String(item['assetRef'] || '').trim(),
      }))
      .filter((item) => !!item.id && !!item.title && !!item.route && !!item.assetRef);
  }

  private normalizeFamily(value: unknown): PracticeFamily {
    const raw = String(value || '').trim();
    if (raw === 'incident' || raw === 'code-review' || raw === 'tradeoff-battle') return raw;
    return 'question';
  }

  private normalizeTech(value: unknown): PracticeRegistryItem['tech'] {
    const raw = String(value || '').trim();
    if (raw === 'javascript' || raw === 'react' || raw === 'angular' || raw === 'vue' || raw === 'html' || raw === 'css' || raw === 'system-design') {
      return raw;
    }
    return 'javascript';
  }

  private normalizeDifficulty(value: unknown): PracticeRegistryItem['difficulty'] {
    const raw = String(value || '').trim();
    if (raw === 'intermediate' || raw === 'hard') return raw;
    return 'easy';
  }
}
