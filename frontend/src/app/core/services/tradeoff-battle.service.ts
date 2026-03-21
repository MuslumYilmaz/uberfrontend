import { HttpClient } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { TransferState, makeStateKey } from '@angular/platform-browser';
import { Observable, firstValueFrom, from, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import {
  TradeoffBattleAnswerExample,
  TradeoffBattleEvaluationDimension,
  TradeoffBattleListItem,
  TradeoffBattleMatrixRow,
  TradeoffBattleOption,
  TradeoffBattlePushbackCard,
  TradeoffBattleScenario,
  TradeoffBattleStrongAnswer,
} from '../models/tradeoff-battle.model';
import { ASSET_READER, AssetReader } from './asset-reader';
import { normalizeAssetPath } from '../utils/asset-url.util';
import { PracticeAssetResolverService } from './practice-asset-resolver.service';

type TradeoffLoadOptions = {
  transferState?: boolean;
};

const VALID_TECHS = new Set([
  'javascript',
  'react',
  'angular',
  'vue',
  'html',
  'css',
  'system-design',
]);

@Injectable({ providedIn: 'root' })
export class TradeoffBattleService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isServer = isPlatformServer(this.platformId);
  private readonly transferState = inject(TransferState);
  private readonly assetReader = inject(ASSET_READER) as AssetReader;
  private readonly assetResolver = inject(PracticeAssetResolverService);
  private readonly cachePrefix = 'practice:cache:tradeoff-battles:';
  private index$?: Observable<TradeoffBattleListItem[]>;
  private readonly scenarioCache = new Map<string, Observable<TradeoffBattleScenario | null>>();

  constructor(private readonly http: HttpClient) {}

  loadIndex(options: TradeoffLoadOptions = {}): Observable<TradeoffBattleListItem[]> {
    const useTransferState = options.transferState !== false;
    const tsKey = makeStateKey<TradeoffBattleListItem[]>('tradeoff-battles:index');

    if (this.isServer) {
      return this.readJson<unknown>('tradeoff-battles/index.json').pipe(
        map((payload) => this.normalizeIndex(payload)),
        tap((list) => {
          if (useTransferState) this.transferState.set(tsKey, list);
        }),
      );
    }

    if (useTransferState && this.transferState.hasKey(tsKey)) {
      const value = this.transferState.get(tsKey, [] as TradeoffBattleListItem[]);
      this.transferState.remove(tsKey);
      return of(value);
    }

    if (!this.index$) {
      this.index$ = this.assetResolver.getVersion().pipe(
        switchMap((bankVersion) => from(this.loadIndexClient(bankVersion))),
        catchError(() => of([])),
        shareReplay(1),
      );
    }

    return this.index$;
  }

  loadScenario(id: string, options: TradeoffLoadOptions = {}): Observable<TradeoffBattleScenario | null> {
    const cleanId = String(id || '').trim();
    if (!cleanId) return of(null);

    const useTransferState = options.transferState !== false;
    const tsKey = makeStateKey<TradeoffBattleScenario | null>(`tradeoff-battles:${cleanId}`);

    if (this.isServer) {
      return this.readJson<unknown>(`tradeoff-battles/${cleanId}/scenario.json`).pipe(
        map((payload) => this.normalizeScenario(payload)),
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
      switchMap((bankVersion) => from(this.loadScenarioClient(cleanId, bankVersion))),
      catchError(() => of(null)),
      shareReplay(1),
    );

    this.scenarioCache.set(cleanId, request$);
    return request$;
  }

  private async loadIndexClient(bankVersion: string): Promise<TradeoffBattleListItem[]> {
    await this.assetResolver.ensureCacheVersionAsync(this.cachePrefix, bankVersion);
    const cacheKey = `${this.cachePrefix}index`;
    const cached = await this.assetResolver.getCachedJson<unknown>(cacheKey);
    if (cached) {
      return this.normalizeIndex(cached);
    }

    const { primary, fallback } = this.assetResolver.getAssetUrls('tradeoff-battles/index.json', bankVersion);
    const source$ = primary !== fallback
      ? this.http.get<unknown>(primary).pipe(catchError(() => this.http.get<unknown>(fallback)))
      : this.http.get<unknown>(fallback);
    const list = await firstValueFrom(source$.pipe(
      map((payload) => this.normalizeIndex(payload)),
      catchError(() => of([])),
    ));

    await this.assetResolver.setCachedJson(cacheKey, list);
    return list;
  }

  private async loadScenarioClient(id: string, bankVersion: string): Promise<TradeoffBattleScenario | null> {
    await this.assetResolver.ensureCacheVersionAsync(this.cachePrefix, bankVersion);
    const cacheKey = `${this.cachePrefix}${id}`;
    const cached = await this.assetResolver.getCachedJson<unknown>(cacheKey);
    if (cached) {
      return this.normalizeScenario(cached);
    }

    const { primary, fallback } = this.assetResolver.getAssetUrls(`tradeoff-battles/${id}/scenario.json`, bankVersion);
    const source$ = primary !== fallback
      ? this.http.get<unknown>(primary).pipe(catchError(() => this.http.get<unknown>(fallback)))
      : this.http.get<unknown>(fallback);
    const scenario = await firstValueFrom(source$.pipe(
      map((payload) => this.normalizeScenario(payload)),
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

  private normalizeIndex(payload: unknown): TradeoffBattleListItem[] {
    if (!Array.isArray(payload)) return [];
    return payload
      .map((item) => this.normalizeMeta(item))
      .filter((item): item is TradeoffBattleListItem => item !== null);
  }

  private normalizeScenario(payload: unknown): TradeoffBattleScenario | null {
    if (!payload || typeof payload !== 'object') return null;
    const source = payload as Record<string, unknown>;
    const meta = this.normalizeMeta(source['meta']);
    const scenario = String(source['scenario'] || '').trim();
    const prompt = String(source['prompt'] || '').trim();
    const options = Array.isArray(source['options'])
      ? source['options']
        .map((item) => this.normalizeOption(item))
        .filter((item): item is TradeoffBattleOption => item !== null)
      : [];
    const decisionMatrix = Array.isArray(source['decisionMatrix'])
      ? source['decisionMatrix']
        .map((item) => this.normalizeMatrixRow(item, options))
        .filter((item): item is TradeoffBattleMatrixRow => item !== null)
      : [];
    const evaluationDimensions = Array.isArray(source['evaluationDimensions'])
      ? source['evaluationDimensions']
        .map((item) => this.normalizeDimension(item))
        .filter((item): item is TradeoffBattleEvaluationDimension => item !== null)
      : [];
    const strongAnswer = this.normalizeStrongAnswer(source['strongAnswer']);
    const interviewerPushback = Array.isArray(source['interviewerPushback'])
      ? source['interviewerPushback']
        .map((item) => this.normalizePushback(item))
        .filter((item): item is TradeoffBattlePushbackCard => item !== null)
      : [];
    const answerExamples = Array.isArray(source['answerExamples'])
      ? source['answerExamples']
        .map((item) => this.normalizeAnswerExample(item))
        .filter((item): item is TradeoffBattleAnswerExample => item !== null)
      : [];
    const answerFramework = Array.isArray(source['answerFramework'])
      ? source['answerFramework'].filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];
    const antiPatterns = Array.isArray(source['antiPatterns'])
      ? source['antiPatterns'].filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];

    if (!meta || !scenario || !prompt || !options.length || !evaluationDimensions.length || !strongAnswer) {
      return null;
    }

    return {
      meta,
      scenario,
      prompt,
      options,
      decisionMatrix,
      evaluationDimensions,
      strongAnswer,
      interviewerPushback,
      answerExamples,
      answerFramework,
      antiPatterns,
    };
  }

  private normalizeMeta(payload: unknown): TradeoffBattleListItem | null {
    if (!payload || typeof payload !== 'object') return null;
    const source = payload as Record<string, unknown>;
    const id = String(source['id'] || '').trim();
    const title = String(source['title'] || '').trim();
    if (!id || !title) return null;

    const tech = String(source['tech'] || 'javascript');
    const difficulty = String(source['difficulty'] || 'easy');
    return {
      id,
      title,
      tech: VALID_TECHS.has(tech) ? tech as TradeoffBattleListItem['tech'] : 'javascript',
      difficulty: difficulty === 'hard' ? 'hard' : difficulty === 'intermediate' ? 'intermediate' : 'easy',
      summary: String(source['summary'] || '').trim(),
      tags: Array.isArray(source['tags'])
        ? source['tags'].filter((tag): tag is string => typeof tag === 'string')
        : [],
      access: String(source['access'] || 'free') === 'premium' ? 'premium' : 'free',
      estimatedMinutes: typeof source['estimatedMinutes'] === 'number' ? source['estimatedMinutes'] : 12,
      updatedAt: String(source['updatedAt'] || '').trim(),
    };
  }

  private normalizeOption(payload: unknown): TradeoffBattleOption | null {
    if (!payload || typeof payload !== 'object') return null;
    const source = payload as Record<string, unknown>;
    const id = String(source['id'] || '').trim();
    const label = String(source['label'] || '').trim();
    const summary = String(source['summary'] || '').trim();
    if (!id || !label || !summary) return null;

    return {
      id,
      label,
      summary,
      whenItWins: Array.isArray(source['whenItWins'])
        ? source['whenItWins'].filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : [],
      watchOutFor: Array.isArray(source['watchOutFor'])
        ? source['watchOutFor'].filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : [],
    };
  }

  private normalizeDimension(payload: unknown): TradeoffBattleEvaluationDimension | null {
    if (!payload || typeof payload !== 'object') return null;
    const source = payload as Record<string, unknown>;
    const id = String(source['id'] || '').trim();
    const title = String(source['title'] || '').trim();
    const description = String(source['description'] || '').trim();
    if (!id || !title || !description) return null;

    return { id, title, description };
  }

  private normalizeMatrixRow(
    payload: unknown,
    options: TradeoffBattleOption[],
  ): TradeoffBattleMatrixRow | null {
    if (!payload || typeof payload !== 'object') return null;
    const source = payload as Record<string, unknown>;
    const id = String(source['id'] || '').trim();
    const title = String(source['title'] || '').trim();
    const prompt = String(source['prompt'] || '').trim();
    const validOptionIds = new Set(options.map((option) => option.id));
    const cells = Array.isArray(source['cells'])
      ? source['cells']
        .filter((cell): cell is Record<string, unknown> => !!cell && typeof cell === 'object')
        .map((cell) => ({
          optionId: String(cell['optionId'] || '').trim(),
          verdict: String(cell['verdict'] || '').trim(),
          note: String(cell['note'] || '').trim(),
        }))
        .filter((cell) =>
          !!cell.optionId
          && validOptionIds.has(cell.optionId)
          && (cell.verdict === 'best-fit' || cell.verdict === 'reasonable' || cell.verdict === 'stretch')
          && !!cell.note,
        )
      : [];
    if (!id || !title || !prompt || cells.length !== options.length) return null;

    return {
      id,
      title,
      prompt,
      cells: cells as TradeoffBattleMatrixRow['cells'],
    };
  }

  private normalizeStrongAnswer(payload: unknown): TradeoffBattleStrongAnswer | null {
    if (!payload || typeof payload !== 'object') return null;
    const source = payload as Record<string, unknown>;
    const title = String(source['title'] || '').trim();
    const summary = String(source['summary'] || '').trim();
    const reasoning = Array.isArray(source['reasoning'])
      ? source['reasoning'].filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];
    if (!title || !summary || !reasoning.length) return null;

    return {
      title,
      summary,
      reasoning,
      recommendation: typeof source['recommendation'] === 'string'
        ? String(source['recommendation']).trim()
        : undefined,
    };
  }

  private normalizePushback(payload: unknown): TradeoffBattlePushbackCard | null {
    if (!payload || typeof payload !== 'object') return null;
    const source = payload as Record<string, unknown>;
    const question = String(source['question'] || '').trim();
    const answer = String(source['answer'] || '').trim();
    if (!question || !answer) return null;

    return { question, answer };
  }

  private normalizeAnswerExample(payload: unknown): TradeoffBattleAnswerExample | null {
    if (!payload || typeof payload !== 'object') return null;
    const source = payload as Record<string, unknown>;
    const level = String(source['level'] || '').trim();
    const title = String(source['title'] || '').trim();
    const answer = String(source['answer'] || '').trim();
    const whyItWorks = String(source['whyItWorks'] || '').trim();
    if (!title || !answer || !whyItWorks) return null;
    if (level !== 'weak' && level !== 'decent' && level !== 'strong') return null;

    return {
      level,
      title,
      answer,
      whyItWorks,
    };
  }
}
