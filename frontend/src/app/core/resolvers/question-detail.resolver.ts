import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { TransferState, makeStateKey } from '@angular/platform-browser';
import { ResolveFn } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { Question } from '../models/question.model';
import {
  normalizeSystemDesignQuestion,
  resolveSystemDesignPractice,
  SystemDesignQuestion,
} from '../models/system-design.model';
import { Tech } from '../models/user.model';
import { QuestionListItem, QuestionService } from '../services/question.service';
import { stripTriviaReferenceOnlyBlocks } from '../utils/trivia-search-intent.util';

type QuestionKind = 'coding' | 'trivia' | 'debug';

export type QuestionDetailResolved = {
  tech: Tech;
  kind: QuestionKind;
  id: string;
  list: Question[];
  listSummaries?: QuestionListItem[];
  question: Question | null;
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

function resolveDetail(tech: Tech, kind: QuestionKind, id: string) {
  const qs = inject(QuestionService);
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
    map((list) => {
      const resolved = buildQuestionDetailResolved(tech, kind, id, list);
      if (useLightweightTransferState && isPlatformServer(platformId)) {
        transferState.set(stateKey, resolved);
      }
      return resolved;
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
  return resolveDetail(tech, kind, id);
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
