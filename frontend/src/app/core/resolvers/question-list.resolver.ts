import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { forkJoin } from 'rxjs';
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
  /** The debugging tasks, listed with the coding tasks; each opens on /<tech>/debug/<id>. */
  debugItems?: MixedQuestionListItem[];
};

export type SystemDesignListResolved = {
  source: 'system-design';
  items: SystemDesignListItem[];
};

export const globalCodingListResolver: ResolveFn<QuestionListResolved> = (route) => {
  const qs = inject(QuestionService);
  const kind = (route.data?.['kind'] as QuestionListKind | undefined) ?? 'coding';
  const items$ = qs.loadAllQuestionSummaries(kind, { transferState: false });
  if (kind !== 'coding') {
    return items$.pipe(map((items): QuestionListResolved => ({ source: 'global-coding', kind, items })));
  }
  // Loaded with the coding tasks, so the server-rendered list and the browser's first list count the same rows.
  return forkJoin([items$, qs.loadAllDebugSummaries({ transferState: false })]).pipe(
    map(([items, debugItems]): QuestionListResolved => ({ source: 'global-coding', kind, items, debugItems })),
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
