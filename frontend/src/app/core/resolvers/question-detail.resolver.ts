import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { TransferState, makeStateKey } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Question } from '../models/question.model';
import {
  normalizeSystemDesignQuestion,
  resolveSystemDesignPractice,
  SystemDesignQuestion,
} from '../models/system-design.model';
import { Tech } from '../models/user.model';
import { ASSET_READER } from '../services/asset-reader';
import { QuestionListItem, QuestionService } from '../services/question.service';
import { resolveSolutionFiles } from '../utils/solution-asset.util';
import { stripTriviaReferenceOnlyBlocks } from '../utils/trivia-search-intent.util';

type QuestionKind = 'coding' | 'trivia' | 'debug';

export type SolutionSnapshot = {
  files: Record<string, string>;
  initialPath: string;
};

export type QuestionDetailResolved = {
  tech: Tech;
  kind: QuestionKind;
  id: string;
  list: Question[];
  listSummaries?: QuestionListItem[];
  question: Question | null;
  solutionSnapshot?: SolutionSnapshot;
};

export interface SystemDesignQuestionResolved extends SystemDesignQuestion {
  title: string;
  description: string;
  tags: string[];
  access: 'free' | 'premium';
  type: 'system-design';
  contentLoadState: 'ready' | 'error';
}

export type SystemDesignDetailResolved = {
  id: string;
  list: SystemDesignQuestion[];
  question: SystemDesignQuestionResolved | null;
};

function toDetailListItem(q: Question): QuestionListItem {
  return {
    id: q.id,
    title: q.title,
    type: q.type,
    technology: q.technology,
    access: q.access,
    difficulty: q.difficulty,
    tags: Array.isArray(q.tags) ? q.tags : [],
    importance: Number(q.importance ?? 0),
    companies: Array.isArray(q.companies) ? q.companies : [],
    questionFormat: q.questionFormat,
    description: undefined,
    shortDescription: undefined,
  };
}

function buildQuestionDetailResolved(
  tech: Tech,
  kind: QuestionKind,
  id: string,
  list: Question[],
): QuestionDetailResolved {
  const useLightweightList = kind === 'trivia';
  const matchedQuestion = list.find((q) => q.id === id) ?? null;
  return {
    tech,
    kind,
    id,
    list: useLightweightList ? [] : list,
    listSummaries: useLightweightList ? list.map(toDetailListItem) : undefined,
    question: useLightweightList && matchedQuestion
      ? stripTriviaReferenceOnlyBlocks(matchedQuestion)
      : matchedQuestion,
  };
}

function questionDetailStateKey(tech: Tech, kind: QuestionKind, id: string) {
  return makeStateKey<QuestionDetailResolved>(`question-detail:${tech}:${kind}:${id}`);
}

function solutionAssetPath(resolved: QuestionDetailResolved, pressureRequested: boolean): string | null {
  const { question, tech, kind } = resolved;
  // Check access before touching protected/lazy solution properties. Public
  // prerender snapshots never depend on a visitor's browser entitlement.
  if (pressureRequested || !question || question.access !== 'free'
    || (kind !== 'coding' && kind !== 'debug')
    || !['react', 'angular', 'vue'].includes(tech)) return null;

  const asset = (question as Question & { solutionAsset?: unknown }).solutionAsset;
  if (typeof asset !== 'string') return null;
  // ServerAssetReader accepts filesystem paths; only allow catalog solution
  // assets, without absolute URLs, traversal, query strings, or other folders.
  const allowedPath = new RegExp(`^assets/sb/${tech}/solution/[a-zA-Z0-9][a-zA-Z0-9._-]*\\.json$`);
  return allowedPath.test(asset) ? asset : null;
}

function normalizeSolutionSnapshot(raw: unknown): SolutionSnapshot | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const asset = raw as { files?: unknown; openFile?: unknown };
  const files = asset.files;
  if (!files || typeof files !== 'object' || Array.isArray(files)
    || (asset.openFile !== undefined && typeof asset.openFile !== 'string')) return undefined;

  const entries = Object.entries(files);
  if (!entries.length || entries.some(([path, value]) => !path.replace(/^\/+/, '')
    || (typeof value !== 'string'
      && (!value || typeof value !== 'object' || typeof value.code !== 'string')))) return undefined;

  const snapshot = resolveSolutionFiles(raw);
  return Object.values(snapshot.files).some((code) => code.trim()) ? snapshot : undefined;
}

function resolveDetail(tech: Tech, kind: QuestionKind, id: string, pressureRequested = false) {
  const qs = inject(QuestionService);
  const assetReader = inject(ASSET_READER);
  const transferState = inject(TransferState);
  const platformId = inject(PLATFORM_ID);
  const stateKey = questionDetailStateKey(tech, kind, id);
  const useLightweightTransferState = kind === 'trivia';

  if (useLightweightTransferState && isPlatformBrowser(platformId) && transferState.hasKey(stateKey)) {
    const cached = transferState.get(stateKey, {
      tech,
      kind,
      id,
      list: [],
      listSummaries: [],
      question: null,
    });
    transferState.remove(stateKey);
    return of({
      ...cached,
      question: cached.question ? stripTriviaReferenceOnlyBlocks(cached.question) : null,
    });
  }

  return qs.loadQuestions(tech, kind, { transferState: false }).pipe(
    switchMap((list) => {
      const resolved = buildQuestionDetailResolved(tech, kind, id, list);
      if (useLightweightTransferState && isPlatformServer(platformId)) {
        transferState.set(stateKey, resolved);
      }
      const assetPath = solutionAssetPath(resolved, pressureRequested);
      if (!assetPath) return of(resolved);

      const solutionKey = makeStateKey<SolutionSnapshot>(`question-solution:${tech}:${kind}:${id}:${assetPath}`);
      if (isPlatformBrowser(platformId)) {
        if (!transferState.hasKey(solutionKey)) return of(resolved);
        const cached = transferState.get(solutionKey, null as SolutionSnapshot | null);
        transferState.remove(solutionKey);
        const solutionSnapshot = cached && normalizeSolutionSnapshot({
          files: cached.files,
          openFile: cached.initialPath,
        });
        return of(solutionSnapshot ? { ...resolved, solutionSnapshot } : resolved);
      }
      if (!isPlatformServer(platformId)) return of(resolved);

      // Returning the asset read from the resolver keeps route activation (and
      // prerender completion) waiting for every solution file, without HTTP.
      return assetReader.readJson(assetPath).pipe(
        map((raw) => {
          const solutionSnapshot = normalizeSolutionSnapshot(raw);
          if (!solutionSnapshot) return resolved;
          transferState.set(solutionKey, solutionSnapshot);
          return { ...resolved, solutionSnapshot };
        }),
        catchError(() => of(resolved)),
      );
    }),
  );
}

export const triviaDetailResolver: ResolveFn<QuestionDetailResolved> = (route) => {
  const tech = (route.parent?.paramMap.get('tech') || 'javascript') as Tech;
  const id = route.paramMap.get('id') || '';
  return resolveDetail(tech, 'trivia', id);
};

export const codingDetailResolver: ResolveFn<QuestionDetailResolved> = (route) => {
  const tech = (route.parent?.paramMap.get('tech') || 'javascript') as Tech;
  const id = route.paramMap.get('id') || '';
  const kind =
    (route.data?.['kind'] as QuestionKind | undefined)
    || (route.routeConfig?.path?.startsWith('debug') ? 'debug' : 'coding');
  const pressureRequested = String(route.queryParamMap?.get('mode') || '').trim().toLowerCase() === 'pressure';
  return resolveDetail(tech, kind, id, pressureRequested);
};

export function normalizeSystemDesignDetail(
  id: string,
  list: readonly unknown[],
  detail: unknown | null,
): SystemDesignQuestionResolved | null {
  const normalizedList = (Array.isArray(list) ? list : []).flatMap((item) => {
    const normalized = normalizeSystemDesignQuestion(item);
    return normalized ? [normalized] : [];
  });
  const detailRecord = detail && typeof detail === 'object' && !Array.isArray(detail)
    ? detail as Record<string, unknown>
    : null;
  const normalizedDetail = normalizeSystemDesignQuestion(
    detailRecord ? { ...detailRecord, id } : null,
  );
  const fromIndex = normalizedList.find((item) => item?.id === id) ?? null;

  if (!fromIndex && !normalizedDetail) return null;
  const merged = normalizeSystemDesignQuestion({
    ...(normalizedDetail || {}),
    ...(fromIndex || {}),
    id,
  });
  if (!merged) return null;

  return {
    ...merged,
    title: merged.title || id,
    description: merged.description || '',
    tags: merged.tags ?? [],
    type: 'system-design',
    access: merged.access === 'premium' ? 'premium' : 'free',
    practice: resolveSystemDesignPractice(merged),
    contentLoadState: !normalizedDetail || normalizedDetail.contentLoadState === 'error'
      ? 'error'
      : 'ready',
  };
}

export const systemDesignDetailResolver: ResolveFn<SystemDesignDetailResolved> = (route) => {
  const qs = inject(QuestionService);
  const id = route.paramMap.get('id') || '';

  return forkJoin({
    list: qs.loadSystemDesign({ transferState: false }),
    detail: qs.loadSystemDesignQuestion(id, { transferState: false }),
  }).pipe(
    map(({ list, detail }) => {
      const normalizedList = (Array.isArray(list) ? list : []).map((item) => ({
        ...item,
        practice: resolveSystemDesignPractice(item),
      }));
      return {
        id,
        list: normalizedList,
        question: normalizeSystemDesignDetail(id, normalizedList, detail),
      };
    }),
    catchError(() =>
      of({
        id,
        list: [],
        question: null,
      }),
    ),
  );
};
