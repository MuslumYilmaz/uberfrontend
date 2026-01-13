import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map } from 'rxjs/operators';
import { Question } from '../models/question.model';
import { Tech } from '../models/user.model';
import { QuestionService } from '../services/question.service';

type QuestionKind = 'coding' | 'trivia' | 'debug';

export type QuestionDetailResolved = {
  tech: Tech;
  kind: QuestionKind;
  id: string;
  list: Question[];
  question: Question | null;
};

function resolveDetail(tech: Tech, kind: QuestionKind, id: string) {
  const qs = inject(QuestionService);
  return qs.loadQuestions(tech, kind).pipe(
    map((list) => ({
      tech,
      kind,
      id,
      list,
      question: list.find((q) => q.id === id) ?? null,
    })),
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
