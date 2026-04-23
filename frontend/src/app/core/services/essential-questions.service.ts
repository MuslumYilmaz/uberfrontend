import { HttpClient } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { TransferState, makeStateKey } from '@angular/platform-browser';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import {
  EssentialCollectionItem,
  EssentialQuestionRef,
  EssentialQuestionsCollection,
  EssentialQuestionsResolved,
  EssentialResolvedItem,
  EssentialResolvedVariant,
} from '../models/essential-questions.model';
import { AccessLevel, Difficulty } from '../models/question.model';
import { Tech } from '../models/user.model';
import { ASSET_READER, AssetReader } from './asset-reader';
import { PracticeAssetResolverService } from './practice-asset-resolver.service';
import { MixedQuestionListItem, QuestionListItem, QuestionService } from './question.service';

type SystemDesignListItem = {
  id: string;
  title?: string;
  description?: string;
  access?: AccessLevel;
  difficulty?: Difficulty | 'intermediate';
  tags?: string[];
  companies?: string[];
};

const EMPTY_COLLECTION: EssentialQuestionsCollection = {
  id: 'frontend-essential-60',
  title: 'FrontendAtlas Essential 60',
  description: '',
  updatedAt: '',
  benchmarkSources: [],
  items: [],
};

@Injectable({ providedIn: 'root' })
export class EssentialQuestionsService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isServer = isPlatformServer(this.platformId);
  private readonly transferState = inject(TransferState);
  private readonly assetReader = inject(ASSET_READER) as AssetReader;
  private readonly assetResolver = inject(PracticeAssetResolverService);

  private collection$?: Observable<EssentialQuestionsCollection>;
  private resolved$?: Observable<EssentialQuestionsResolved>;

  constructor(
    private readonly http: HttpClient,
    private readonly questionService: QuestionService,
  ) {}

  loadResolvedCollection(): Observable<EssentialQuestionsResolved> {
    if (!this.resolved$) {
      this.resolved$ = forkJoin({
        collection: this.loadCollection(),
        coding: this.questionService.loadAllQuestionSummaries('coding', { transferState: false }),
        trivia: this.questionService.loadAllQuestionSummaries('trivia', { transferState: false }),
        system: this.questionService.loadSystemDesign({ transferState: false }),
      }).pipe(
        map(({ collection, coding, trivia, system }) => ({
          collection,
          items: this.resolveItems(collection.items, coding, trivia, system),
        })),
        shareReplay(1),
      );
    }

    return this.resolved$;
  }

  private loadCollection(): Observable<EssentialQuestionsCollection> {
    if (!this.collection$) {
      if (this.isServer) {
        this.collection$ = this.assetReader
          .readJson('assets/questions/collections/frontend-essential-60.json')
          .pipe(
            map((raw) => this.normalizeCollection(raw)),
            tap((collection) => this.transferState.set(this.collectionStateKey(), collection)),
            catchError(() => of(EMPTY_COLLECTION)),
            shareReplay(1),
          );
      } else {
        const tsKey = this.collectionStateKey();
        if (this.transferState.hasKey(tsKey)) {
          const cached = this.transferState.get(tsKey, EMPTY_COLLECTION);
          this.transferState.remove(tsKey);
          this.collection$ = of(cached).pipe(shareReplay(1));
        } else {
          this.collection$ = this.assetResolver.getVersion().pipe(
            switchMap((version) => {
              const { primary, fallback } = this.assetResolver.getAssetUrls(
                'questions/collections/frontend-essential-60.json',
                version,
              );
              const source$ = primary !== fallback
                ? this.http.get(primary).pipe(catchError(() => this.http.get(fallback)))
                : this.http.get(fallback);
              return source$;
            }),
            map((raw) => this.normalizeCollection(raw)),
            catchError(() => of(EMPTY_COLLECTION)),
            shareReplay(1),
          );
        }
      }
    }

    return this.collection$;
  }

  private normalizeCollection(raw: unknown): EssentialQuestionsCollection {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return EMPTY_COLLECTION;
    const source = raw as EssentialQuestionsCollection;
    const items = Array.isArray(source.items) ? source.items : [];
    return {
      id: String(source.id || EMPTY_COLLECTION.id),
      title: String(source.title || EMPTY_COLLECTION.title),
      description: String(source.description || ''),
      updatedAt: String(source.updatedAt || ''),
      benchmarkSources: Array.isArray(source.benchmarkSources)
        ? source.benchmarkSources
            .filter((entry) => entry && typeof entry === 'object')
            .map((entry) => ({
              label: String(entry.label || '').trim(),
              url: String(entry.url || '').trim(),
            }))
            .filter((entry) => entry.label && entry.url)
        : [],
      items: items
        .filter((item) => item && typeof item === 'object')
        .map((item) => item as EssentialCollectionItem)
        .sort((a, b) => Number(a.rank || 0) - Number(b.rank || 0)),
    };
  }

  private resolveItems(
    items: EssentialCollectionItem[],
    codingRows: MixedQuestionListItem[],
    triviaRows: MixedQuestionListItem[],
    systemRows: SystemDesignListItem[],
  ): EssentialResolvedItem[] {
    const codingByKey = new Map<string, MixedQuestionListItem>();
    const triviaByKey = new Map<string, MixedQuestionListItem>();
    const systemById = new Map<string, SystemDesignListItem>();

    for (const row of codingRows) {
      codingByKey.set(this.questionKey(row.tech, 'coding', row.id), row);
    }
    for (const row of triviaRows) {
      triviaByKey.set(this.questionKey(row.tech, 'trivia', row.id), row);
    }
    for (const row of systemRows) {
      if (!row?.id) continue;
      systemById.set(String(row.id), row);
    }

    return items
      .map((item) => this.resolveItem(item, codingByKey, triviaByKey, systemById))
      .filter((item): item is EssentialResolvedItem => !!item)
      .sort((a, b) => a.rank - b.rank);
  }

  private resolveItem(
    item: EssentialCollectionItem,
    codingByKey: Map<string, MixedQuestionListItem>,
    triviaByKey: Map<string, MixedQuestionListItem>,
    systemById: Map<string, SystemDesignListItem>,
  ): EssentialResolvedItem | null {
    const primarySource = this.resolveReference(item.primary, codingByKey, triviaByKey, systemById);
    if (!primarySource) return null;

    const variants = [item.primary, ...(item.alternates ?? [])]
      .map((ref) => this.resolveVariant(ref, codingByKey, triviaByKey, systemById))
      .filter((variant): variant is EssentialResolvedVariant => !!variant);

    const uniqueVariants: EssentialResolvedVariant[] = [];
    const seenVariants = new Set<string>();
    for (const variant of variants) {
      const key = `${variant.kind}:${variant.tech || 'system'}:${variant.id}`;
      if (seenVariants.has(key)) continue;
      seenVariants.add(key);
      uniqueVariants.push(variant);
    }

    const companies = new Set<string>();
    const tags = new Set<string>();
    const technologies = new Set<Tech>();
    for (const variant of uniqueVariants) {
      if (variant.tech) technologies.add(variant.tech);
    }
    for (const source of [primarySource, ...uniqueVariants.map((variant) => this.resolveReference({
      tech: variant.tech,
      kind: variant.kind,
      id: variant.id,
    }, codingByKey, triviaByKey, systemById))]) {
      const row = source as MixedQuestionListItem | SystemDesignListItem | null;
      if (!row) continue;
      for (const company of Array.isArray((row as any).companies) ? (row as any).companies : []) {
        companies.add(String(company));
      }
      for (const tag of Array.isArray((row as any).tags) ? (row as any).tags : []) {
        tags.add(String(tag));
      }
    }

    const title = this.displayTitle(primarySource.title || item.primary.id, uniqueVariants.length > 1);
    const shortDescription = this.extractDescription(primarySource) || item.rationale;
    const access = this.readAccess(primarySource);
    const difficulty = this.readDifficulty(primarySource);

    return {
      ...item,
      title,
      shortDescription,
      access,
      difficulty,
      technologies: [...technologies],
      companies: [...companies],
      tags: [...tags],
      route: this.routeForReference(item.primary),
      path: this.pathForReference(item.primary),
      isSystemDesign: item.primary.kind === 'system-design',
      variants: uniqueVariants,
    };
  }

  private resolveVariant(
    ref: EssentialQuestionRef,
    codingByKey: Map<string, MixedQuestionListItem>,
    triviaByKey: Map<string, MixedQuestionListItem>,
    systemById: Map<string, SystemDesignListItem>,
  ): EssentialResolvedVariant | null {
    const source = this.resolveReference(ref, codingByKey, triviaByKey, systemById);
    if (!source) return null;
    const title = source.title || ref.id;
    return {
      tech: ref.tech,
      kind: ref.kind,
      id: ref.id,
      title,
      route: this.routeForReference(ref),
      path: this.pathForReference(ref),
      access: this.readAccess(source),
      difficulty: this.readDifficulty(source),
      techLabel: this.techLabel(ref.tech, ref.kind),
    };
  }

  private resolveReference(
    ref: EssentialQuestionRef,
    codingByKey: Map<string, MixedQuestionListItem>,
    triviaByKey: Map<string, MixedQuestionListItem>,
    systemById: Map<string, SystemDesignListItem>,
  ): MixedQuestionListItem | SystemDesignListItem | null {
    if (ref.kind === 'system-design') {
      return systemById.get(ref.id) ?? null;
    }
    if (!ref.tech) return null;
    const key = this.questionKey(ref.tech, ref.kind, ref.id);
    return ref.kind === 'coding'
      ? codingByKey.get(key) ?? null
      : triviaByKey.get(key) ?? null;
  }

  private questionKey(tech: Tech, kind: 'coding' | 'trivia', id: string): string {
    return `${tech}:${kind}:${id}`;
  }

  private routeForReference(ref: EssentialQuestionRef): any[] {
    if (ref.kind === 'system-design') return ['/system-design', ref.id];
    return ['/', ref.tech, ref.kind, ref.id];
  }

  private pathForReference(ref: EssentialQuestionRef): string {
    if (ref.kind === 'system-design') return `/system-design/${ref.id}`;
    return `/${ref.tech}/${ref.kind}/${ref.id}`;
  }

  private techLabel(tech: Tech | undefined, kind: EssentialQuestionRef['kind']): string {
    if (kind === 'system-design') return 'System design';
    switch (tech) {
      case 'javascript':
        return 'JavaScript';
      case 'react':
        return 'React';
      case 'angular':
        return 'Angular';
      case 'vue':
        return 'Vue';
      case 'html':
        return 'HTML';
      case 'css':
        return 'CSS';
      default:
        return 'Frontend';
    }
  }

  private displayTitle(rawTitle: string, hasAlternates: boolean): string {
    const title = String(rawTitle || '').trim();
    if (!hasAlternates) return title;
    return title.replace(/^(React|Angular|Vue)\s+/i, '').trim();
  }

  private extractDescription(row: QuestionListItem | SystemDesignListItem): string {
    const direct = typeof row.description === 'string' ? row.description : '';
    return String(direct || '').replace(/\s+/g, ' ').trim();
  }

  private readAccess(row: QuestionListItem | SystemDesignListItem): AccessLevel {
    return row.access === 'premium' ? 'premium' : 'free';
  }

  private readDifficulty(row: QuestionListItem | SystemDesignListItem): Difficulty | 'intermediate' {
    const difficulty = row.difficulty;
    return difficulty === 'easy' || difficulty === 'hard' || difficulty === 'intermediate'
      ? difficulty
      : 'intermediate';
  }

  private collectionStateKey() {
    return makeStateKey<EssentialQuestionsCollection>('essential-questions:collection');
  }
}
