import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { TransferState, makeStateKey } from '@angular/platform-browser';
import { ResolveFn } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { Question } from '../models/question.model';
import { Tech } from '../models/user.model';
import { QuestionListItem, QuestionService } from '../services/question.service';

type QuestionKind = 'coding' | 'trivia' | 'debug';

export type QuestionDetailResolved = {
  tech: Tech;
  kind: QuestionKind;
  id: string;
  list: Question[];
  listSummaries?: QuestionListItem[];
  question: Question | null;
};

export type SystemDesignQuestionResolved = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  access: 'free' | 'premium';
  type: string;
  [key: string]: unknown;
};

export type SystemDesignDetailResolved = {
  id: string;
  list: SystemDesignQuestionResolved[];
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
  return {
    tech,
    kind,
    id,
    list: useLightweightList ? [] : list,
    listSummaries: useLightweightList ? list.map(toDetailListItem) : undefined,
    question: list.find((q) => q.id === id) ?? null,
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
    return of(cached);
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

function normalizeSystemDesignDetail(
  id: string,
  list: any[],
  detail: any | null,
): SystemDesignQuestionResolved | null {
  const normalizedList = Array.isArray(list) ? list : [];
  const fromIndex = normalizedList.find((item) => item?.id === id) ?? null;

  if (!fromIndex && !detail) return null;

  if (!fromIndex && detail) {
    return {
      id,
      title: String(detail?.title || id),
      description: String(detail?.description || ''),
      tags: Array.isArray(detail?.tags) ? detail.tags : [],
      type: String(detail?.type || 'system-design'),
      access: String(detail?.access || 'free') === 'premium' ? 'premium' : 'free',
      ...(detail || {}),
    };
  }

  if (fromIndex && !detail) {
    return {
      id: String(fromIndex.id || id),
      title: String(fromIndex.title || id),
      description: String(fromIndex.description || ''),
      tags: Array.isArray(fromIndex.tags) ? fromIndex.tags : [],
      type: String(fromIndex.type || 'system-design'),
      access: String(fromIndex.access || 'free') === 'premium' ? 'premium' : 'free',
      ...fromIndex,
    };
  }

  return {
    id: String(fromIndex.id || id),
    title: String(fromIndex.title || detail?.title || id),
    description: String(fromIndex.description || detail?.description || ''),
    tags: Array.isArray(fromIndex.tags) && fromIndex.tags.length
      ? fromIndex.tags
      : (Array.isArray(detail?.tags) ? detail.tags : []),
    type: String(fromIndex.type || detail?.type || 'system-design'),
    ...(detail || {}),
    access: String(fromIndex.access || detail?.access || 'free') === 'premium' ? 'premium' : 'free',
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
      const normalizedList = Array.isArray(list) ? list : [];
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
