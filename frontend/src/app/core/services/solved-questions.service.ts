import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, shareReplay } from 'rxjs';
import { Tech } from '../models/user.model';
import { QuestionService, MixedQuestion } from './question.service';

export type SolvedQuestion = {
  id: string;
  title: string;
  tech: Tech | 'system-design' | 'unknown';
  kind: 'coding' | 'trivia' | 'debug' | 'system-design' | 'unknown';
};

@Injectable({ providedIn: 'root' })
export class SolvedQuestionsService {
  private index$?: Observable<Map<string, SolvedQuestion>>;

  constructor(private qs: QuestionService) { }

  /** Build a map of id -> meta across coding, trivia, and system design. */
  private buildIndex(): Observable<Map<string, SolvedQuestion>> {
    if (!this.index$) {
      this.index$ = forkJoin({
        coding: this.qs.loadAllQuestions('coding'),
        trivia: this.qs.loadAllQuestions('trivia'),
        debug: this.loadAllDebug(),
        systemDesign: this.qs.loadSystemDesign()
      }).pipe(
        map(({ coding, trivia, debug, systemDesign }) => {
          const map = new Map<string, SolvedQuestion>();

          for (const q of coding || []) map.set(q.id, this.rowFrom(q, 'coding'));
          for (const q of trivia || []) map.set(q.id, this.rowFrom(q, 'trivia'));

          for (const q of systemDesign || []) {
            if (!q) continue;
            const title = q.title || q.name || (q.meta && q.meta.title) || q.id;
            map.set(q.id, { id: q.id, title, tech: 'system-design', kind: 'system-design' });
          }
          return map;
        }),
        shareReplay(1)
      );
    }
    return this.index$;
  }

  /** Load debug items across supported techs (JS, Angular). */
  private loadAllDebug(): Observable<MixedQuestion[]> {
    const TECHS: Tech[] = ['javascript', 'angular'];
    return forkJoin(
      TECHS.map((t) =>
        this.qs.loadQuestions(t, 'debug').pipe(
          map((list) => list.map((q) => ({ ...q, tech: t } as MixedQuestion)))
        )
      )
    ).pipe(map((buckets) => buckets.flat()));
  }

  /** Resolve a list of solved ids to display-friendly rows (preserving order). */
  resolved(ids: string[]): Observable<SolvedQuestion[]> {
    if (!ids?.length) return of([]);

    return this.buildIndex().pipe(
      map((index) =>
        ids.map((id) => index.get(id) ?? { id, title: id, tech: 'unknown', kind: 'unknown' })
      )
    );
  }

  private rowFrom(q: MixedQuestion, kind: 'coding' | 'trivia'): SolvedQuestion {
    return { id: q.id, title: q.title, tech: q.tech, kind };
  }
}
