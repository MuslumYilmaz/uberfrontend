import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map } from 'rxjs/operators';
import { QuestionService, MixedQuestionListItem } from '../services/question.service';

export type QuestionListKind = 'coding' | 'trivia';

export type QuestionListResolved = {
  source: 'global-coding';
  kind: QuestionListKind;
  items: MixedQuestionListItem[];
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
