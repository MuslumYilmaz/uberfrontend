import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map } from 'rxjs/operators';
import { QuestionService, MixedQuestionListItem } from '../services/question.service';

export type QuestionListKind = 'coding' | 'trivia';
export type SystemDesignListItem = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  type: 'system-design';
  access?: 'free' | 'premium';
  difficulty?: string;
  companies?: string[];
  updatedAt?: string;
};

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
        .map((item): SystemDesignListItem => ({
          id: String(item?.id || ''),
          title: String(item?.title || item?.id || ''),
          description: String(item?.description || ''),
          tags: Array.isArray(item?.tags) ? item.tags.map((tag: unknown) => String(tag)) : [],
          type: 'system-design',
          access: item?.access === 'premium' ? 'premium' : 'free',
          difficulty: item?.difficulty ? String(item.difficulty) : undefined,
          companies: Array.isArray(item?.companies)
            ? item.companies.map((company: unknown) => String(company))
            : [],
          updatedAt: item?.updatedAt ? String(item.updatedAt) : undefined,
        }))
        .filter((item) => item.id && item.title),
    })),
  );
};
