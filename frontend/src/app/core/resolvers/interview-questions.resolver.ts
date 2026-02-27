import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Tech } from '../models/user.model';
import { QuestionListItem, QuestionService } from '../services/question.service';

type InterviewQuestionKind = 'coding' | 'trivia';
type ResolvedQuestionRow = QuestionListItem & { tech: Tech };

export type InterviewQuestionsHubResolved = {
  techs: Tech[];
  coding: ResolvedQuestionRow[];
  trivia: ResolvedQuestionRow[];
};

const DEFAULT_TECHS: Tech[] = ['javascript'];
const SUPPORTED_TECHS = new Set<Tech>(['javascript', 'react', 'angular', 'vue', 'html', 'css']);

function resolveTechs(route: ActivatedRouteSnapshot): Tech[] {
  const configured = (route.data?.['interviewQuestions'] as { techs?: unknown } | undefined)?.techs;
  if (!Array.isArray(configured)) return DEFAULT_TECHS;

  const techs = configured.filter((value): value is Tech => SUPPORTED_TECHS.has(value as Tech));
  return techs.length ? techs : DEFAULT_TECHS;
}

function loadRowsForKind(
  qs: QuestionService,
  techs: Tech[],
  kind: InterviewQuestionKind,
) {
  return forkJoin(
    techs.map((tech) =>
      qs.loadQuestionSummaries(tech, kind, { transferState: false }).pipe(
        map((rows) => rows.map((row) => ({ ...row, tech } as ResolvedQuestionRow))),
        catchError(() => of([] as ResolvedQuestionRow[])),
      ),
    ),
  ).pipe(map((buckets) => buckets.flat()));
}

export const interviewQuestionsHubResolver: ResolveFn<InterviewQuestionsHubResolved> = (route) => {
  const qs = inject(QuestionService);
  const techs = resolveTechs(route);

  return forkJoin({
    coding: loadRowsForKind(qs, techs, 'coding'),
    trivia: loadRowsForKind(qs, techs, 'trivia'),
  }).pipe(
    map(({ coding, trivia }) => ({
      techs,
      coding,
      trivia,
    })),
  );
};
