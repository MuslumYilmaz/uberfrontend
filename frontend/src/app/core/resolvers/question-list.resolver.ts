import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map } from 'rxjs/operators';
import {
  normalizeSystemDesignQuestion,
  resolveSystemDesignPractice,
  SystemDesignListItem,
} from '../models/system-design.model';
import { QuestionService, MixedQuestionListItem } from '../services/question.service';

export type { SystemDesignListItem } from '../models/system-design.model';

export type QuestionListKind = 'coding' | 'trivia';
export type QuestionListResolved = {
  source: 'global-coding';
  kind: QuestionListKind;
  items: MixedQuestionListItem[];
};

export type SystemDesignListResolved = {
  source: 'system-design';
  items: SystemDesignListItem[];
};

export const globalCodingListResolver: ResolveFn<QuestionListResolved> = (route) => {
  const qs = inject(QuestionService);
  const kind = (route.data?.['kind'] as QuestionListKind | undefined) ?? 'coding';
  return qs.loadAllQuestionSummaries(kind, { transferState: false }).pipe(
    map((items) => ({
      source: 'global-coding',
      kind,
      items,
    })),
  );
};

export const systemDesignListResolver: ResolveFn<SystemDesignListResolved> = () => {
  const qs = inject(QuestionService);
  return qs.loadSystemDesign().pipe(
    map((rawItems) => ({
      source: 'system-design' as const,
      items: (Array.isArray(rawItems) ? rawItems : [])
        .map((item) => normalizeSystemDesignQuestion(item))
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .map((item): SystemDesignListItem => ({
          ...item,
          title: item.title || item.id,
          description: item.description || '',
          tags: item.tags ?? [],
          type: 'system-design',
          access: item.access === 'premium' ? 'premium' : 'free',
          practice: resolveSystemDesignPractice(item),
        }))
        .filter((item) => item.id && item.title),
    })),
  );
};
