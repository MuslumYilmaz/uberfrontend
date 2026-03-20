import { HttpClient } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { TransferState, makeStateKey } from '@angular/platform-browser';
import { Observable, firstValueFrom, from, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import {
  IncidentListItem,
  IncidentMeta,
  IncidentScenario,
  IncidentStage,
  IncidentTeachingBlock,
} from '../models/incident.model';
import { ASSET_READER, AssetReader } from './asset-reader';
import { normalizeAssetPath } from '../utils/asset-url.util';
import { PracticeAssetResolverService } from './practice-asset-resolver.service';

type IncidentLoadOptions = {
  transferState?: boolean;
};

const INCIDENT_TECHS = new Set(['javascript', 'react', 'angular', 'vue']);

@Injectable({ providedIn: 'root' })
export class IncidentService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isServer = isPlatformServer(this.platformId);
  private readonly transferState = inject(TransferState);
  private readonly assetReader = inject(ASSET_READER) as AssetReader;
  private readonly assetResolver = inject(PracticeAssetResolverService);
  private readonly cachePrefix = 'practice:cache:incidents:';
  private index$?: Observable<IncidentListItem[]>;
  private readonly scenarioCache = new Map<string, Observable<IncidentScenario | null>>();

  constructor(private readonly http: HttpClient) {}

  loadIncidentIndex(options: IncidentLoadOptions = {}): Observable<IncidentListItem[]> {
    const useTransferState = options.transferState !== false;
    const tsKey = makeStateKey<IncidentListItem[]>('incidents:index');
    if (this.isServer) {
      return this.readJson<unknown>('incidents/index.json').pipe(
        map((payload) => this.normalizeIncidentIndex(payload)),
        tap((list) => {
          if (useTransferState) this.transferState.set(tsKey, list);
        }),
      );
    }

    if (useTransferState && this.transferState.hasKey(tsKey)) {
      const value = this.transferState.get(tsKey, [] as IncidentListItem[]);
      this.transferState.remove(tsKey);
      return of(value);
    }

    if (!this.index$) {
      this.index$ = this.assetResolver.getVersion().pipe(
        switchMap((bankVersion) => from(this.loadIncidentIndexClient(bankVersion))),
        catchError(() => of([])),
        shareReplay(1),
      );
    }

    return this.index$;
  }

  loadIncidentScenario(id: string, options: IncidentLoadOptions = {}): Observable<IncidentScenario | null> {
    const cleanId = String(id || '').trim();
    if (!cleanId) return of(null);

    const useTransferState = options.transferState !== false;
    const tsKey = makeStateKey<IncidentScenario | null>(`incidents:${cleanId}`);
    if (this.isServer) {
      return this.readJson<unknown>(`incidents/${cleanId}/scenario.json`).pipe(
        map((payload) => this.normalizeIncidentScenario(payload)),
        tap((scenario) => {
          if (useTransferState) this.transferState.set(tsKey, scenario);
        }),
      );
    }

    if (useTransferState && this.transferState.hasKey(tsKey)) {
      const value = this.transferState.get(tsKey, null);
      this.transferState.remove(tsKey);
      return of(value);
    }

    const cached = this.scenarioCache.get(cleanId);
    if (cached) return cached;

    const request$ = this.assetResolver.getVersion().pipe(
      switchMap((bankVersion) => from(this.loadIncidentScenarioClient(cleanId, bankVersion))),
      catchError(() => of(null)),
      shareReplay(1),
    );

    this.scenarioCache.set(cleanId, request$);
    return request$;
  }

  private async loadIncidentIndexClient(bankVersion: string): Promise<IncidentListItem[]> {
    await this.assetResolver.ensureCacheVersionAsync(this.cachePrefix, bankVersion);

    const cacheKey = `${this.cachePrefix}index`;
    const cached = await this.assetResolver.getCachedJson<unknown>(cacheKey);
    if (cached) {
      return this.normalizeIncidentIndex(cached);
    }

    const { primary, fallback } = this.assetResolver.getAssetUrls('incidents/index.json', bankVersion);
    const source$ = primary !== fallback
      ? this.http.get<unknown>(primary).pipe(catchError(() => this.http.get<unknown>(fallback)))
      : this.http.get<unknown>(fallback);

    const list = await firstValueFrom(source$.pipe(
      map((payload) => this.normalizeIncidentIndex(payload)),
      catchError(() => of([])),
    ));

    await this.assetResolver.setCachedJson(cacheKey, list);
    return list;
  }

  private async loadIncidentScenarioClient(id: string, bankVersion: string): Promise<IncidentScenario | null> {
    await this.assetResolver.ensureCacheVersionAsync(this.cachePrefix, bankVersion);

    const cacheKey = `${this.cachePrefix}${id}`;
    const cached = await this.assetResolver.getCachedJson<unknown>(cacheKey);
    if (cached) {
      return this.normalizeIncidentScenario(cached);
    }

    const { primary, fallback } = this.assetResolver.getAssetUrls(`incidents/${id}/scenario.json`, bankVersion);
    const source$ = primary !== fallback
      ? this.http.get<unknown>(primary).pipe(catchError(() => this.http.get<unknown>(fallback)))
      : this.http.get<unknown>(fallback);

    const scenario = await firstValueFrom(source$.pipe(
      map((payload) => this.normalizeIncidentScenario(payload)),
      catchError(() => of(null)),
    ));

    if (scenario) {
      await this.assetResolver.setCachedJson(cacheKey, scenario);
    } else {
      await this.assetResolver.removeCachedValue(cacheKey);
    }

    return scenario;
  }

  private readJson<T>(assetPath: string): Observable<T | null> {
    return this.assetReader.readJson(normalizeAssetPath(assetPath));
  }

  private normalizeIncidentIndex(payload: unknown): IncidentListItem[] {
    if (!Array.isArray(payload)) return [];
    return payload
      .map((item) => this.normalizeIncidentMeta(item))
      .filter((item): item is IncidentListItem => item !== null);
  }

  private normalizeIncidentScenario(payload: unknown): IncidentScenario | null {
    if (!payload || typeof payload !== 'object') return null;
    const source = payload as Record<string, unknown>;
    const meta = this.normalizeIncidentMeta(source['meta']);
    if (!meta) return null;

    const contextSource = source['context'];
    const stagesSource = source['stages'];
    const debriefSource = source['debrief'];
    const relatedPracticeSource = source['relatedPractice'];
    if (!contextSource || typeof contextSource !== 'object') return null;
    if (!Array.isArray(stagesSource) || stagesSource.length === 0) return null;
    if (!debriefSource || typeof debriefSource !== 'object') return null;

    const contextRecord = contextSource as Record<string, unknown>;
    const debriefRecord = debriefSource as Record<string, unknown>;
    const stages = stagesSource
      .map((stage) => this.normalizeIncidentStage(stage))
      .filter((stage): stage is IncidentStage => stage !== null);
    if (!stages.length) return null;

    const scoreBands = Array.isArray(debriefRecord['scoreBands'])
      ? (debriefRecord['scoreBands'] as Array<Record<string, unknown>>)
        .filter((band) => typeof band?.['label'] === 'string')
        .map((band) => ({
          min: typeof band['min'] === 'number' ? band['min'] : 0,
          max: typeof band['max'] === 'number' ? band['max'] : 0,
          label: String(band['label']),
          summary: String(band['summary'] || ''),
        }))
      : [];
    const idealRunbook = Array.isArray(debriefRecord['idealRunbook'])
      ? (debriefRecord['idealRunbook'] as unknown[])
        .filter((item): item is string => typeof item === 'string')
      : [];
    const teachingBlocks = Array.isArray(debriefRecord['teachingBlocks'])
      ? (debriefRecord['teachingBlocks'] as unknown[])
        .map((block) => this.normalizeTeachingBlock(block))
        .filter((block): block is IncidentTeachingBlock => block !== null)
      : [];
    const relatedPractice = Array.isArray(relatedPracticeSource)
      ? relatedPracticeSource
        .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
        .map((item) => ({
          tech: String(item['tech'] || 'javascript') as IncidentScenario['relatedPractice'][number]['tech'],
          kind: String(item['kind'] || 'trivia') as IncidentScenario['relatedPractice'][number]['kind'],
          id: String(item['id'] || ''),
        }))
        .filter((item) => !!item.id)
      : [];

    return {
      meta,
      context: {
        symptom: String(contextRecord['symptom'] || ''),
        userImpact: String(contextRecord['userImpact'] || ''),
        environment: String(contextRecord['environment'] || ''),
        evidence: Array.isArray(contextRecord['evidence'])
          ? (contextRecord['evidence'] as unknown[])
            .filter((card): card is Record<string, unknown> => !!card && typeof card === 'object')
            .map((card) => ({
              type: String(card['type'] || 'note') as IncidentScenario['context']['evidence'][number]['type'],
              title: String(card['title'] || ''),
              body: String(card['body'] || ''),
              language: typeof card['language'] === 'string' ? card['language'] : undefined,
            }))
            .filter((card) => !!card.title && !!card.body)
          : [],
      },
      stages,
      debrief: {
        scoreBands,
        idealRunbook,
        teachingBlocks,
        optionalReflectionPrompt: typeof debriefRecord['optionalReflectionPrompt'] === 'string'
          ? String(debriefRecord['optionalReflectionPrompt'])
          : undefined,
      },
      relatedPractice,
    };
  }

  private normalizeIncidentMeta(payload: unknown): IncidentMeta | null {
    if (!payload || typeof payload !== 'object') return null;
    const item = payload as Record<string, unknown>;
    const id = String(item['id'] || '').trim();
    const title = String(item['title'] || '').trim();
    if (!id || !title) return null;

    const tech = String(item['tech'] || 'javascript');
    const difficulty = String(item['difficulty'] || 'easy');
    return {
      id,
      title,
      tech: INCIDENT_TECHS.has(tech) ? tech as IncidentMeta['tech'] : 'javascript',
      difficulty: difficulty === 'hard' ? 'hard' : difficulty === 'intermediate' ? 'intermediate' : 'easy',
      summary: String(item['summary'] || ''),
      signals: Array.isArray(item['signals'])
        ? (item['signals'] as unknown[]).filter((signal): signal is string => typeof signal === 'string')
        : [],
      estimatedMinutes: typeof item['estimatedMinutes'] === 'number' ? item['estimatedMinutes'] : 10,
      tags: Array.isArray(item['tags']) ? (item['tags'] as unknown[]).filter((tag): tag is string => typeof tag === 'string') : [],
      updatedAt: String(item['updatedAt'] || ''),
      access: String(item['access'] || 'free') === 'premium' ? 'premium' : 'free',
    };
  }

  private normalizeIncidentStage(payload: unknown): IncidentStage | null {
    if (!payload || typeof payload !== 'object') return null;
    const stage = payload as Record<string, unknown>;
    const id = String(stage['id'] || '').trim();
    const title = String(stage['title'] || '').trim();
    const prompt = String(stage['prompt'] || '').trim();
    const type = String(stage['type'] || '').trim();
    if (!id || !title || !prompt) return null;

    if (type === 'single-select' || type === 'multi-select') {
      const options = Array.isArray(stage['options'])
        ? (stage['options'] as unknown[])
          .filter((option): option is Record<string, unknown> => !!option && typeof option === 'object')
          .map((option) => ({
            id: String(option['id'] || ''),
            label: String(option['label'] || ''),
            points: typeof option['points'] === 'number' ? option['points'] : 0,
            feedback: String(option['feedback'] || ''),
            isHarmful: option['isHarmful'] === true,
          }))
          .filter((option) => !!option.id && !!option.label)
        : [];
      if (!options.length) return null;

      return {
        id,
        title,
        prompt,
        type,
        helperText: typeof stage['helperText'] === 'string' ? stage['helperText'] : undefined,
        options,
      };
    }

    if (type === 'priority-order') {
      const candidates = Array.isArray(stage['candidates'])
        ? (stage['candidates'] as unknown[])
          .filter((candidate): candidate is Record<string, unknown> => !!candidate && typeof candidate === 'object')
          .map((candidate) => ({
            id: String(candidate['id'] || ''),
            label: String(candidate['label'] || ''),
            description: typeof candidate['description'] === 'string' ? candidate['description'] : undefined,
          }))
          .filter((candidate) => !!candidate.id && !!candidate.label)
        : [];
      const expectedOrder = Array.isArray(stage['expectedOrder'])
        ? (stage['expectedOrder'] as unknown[]).filter((item): item is string => typeof item === 'string')
        : [];
      const slotWeights = Array.isArray(stage['slotWeights'])
        ? (stage['slotWeights'] as unknown[]).filter((item): item is number => typeof item === 'number')
        : [];
      if (!candidates.length || !expectedOrder.length || !slotWeights.length) return null;

      return {
        id,
        title,
        prompt,
        type,
        helperText: typeof stage['helperText'] === 'string' ? stage['helperText'] : undefined,
        candidates,
        expectedOrder,
        slotWeights,
      };
    }

    return null;
  }

  private normalizeTeachingBlock(payload: unknown): IncidentTeachingBlock | null {
    if (!payload || typeof payload !== 'object') return null;
    const block = payload as Record<string, unknown>;
    const type = String(block['type'] || '').trim();
    if (type === 'text') {
      return {
        type,
        text: String(block['text'] || ''),
      };
    }

    if (type === 'callout') {
      const variant = String(block['variant'] || 'info');
      return {
        type,
        title: typeof block['title'] === 'string' ? block['title'] : undefined,
        text: String(block['text'] || ''),
        variant:
          variant === 'success' || variant === 'warning' || variant === 'danger' || variant === 'info'
            ? variant
            : 'info',
      };
    }

    if (type === 'checklist' || type === 'steps') {
      return {
        type,
        title: typeof block['title'] === 'string' ? block['title'] : undefined,
        items: Array.isArray(block['items']) ? (block['items'] as unknown[]).filter((item): item is string => typeof item === 'string') : [],
      };
    }

    return null;
  }
}
