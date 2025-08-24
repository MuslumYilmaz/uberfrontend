// src/app/core/services/question.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Question } from '../models/question.model';

type Tech = 'javascript' | 'angular';
type Kind = 'coding' | 'trivia';
export type MixedQuestion = Question & { tech: Tech };

@Injectable({ providedIn: 'root' })
export class QuestionService {
  private cachePrefix = 'questions-';

  constructor(private http: HttpClient) { }

  loadQuestions(technology: string, type: string): Observable<Question[]> {
    const key = `${this.cachePrefix}${technology}-${type}`;
    const cached = localStorage.getItem(key);
    if (cached) return of(JSON.parse(cached) as Question[]);

    return this.http
      .get<Question[]>(`assets/questions/${technology}/${type}.json`)
      .pipe(tap(qs => localStorage.setItem(key, JSON.stringify(qs))));
  }

  // Pull both techs for a kind (for Companies pages)
  loadAllQuestions(kind: Kind): Observable<MixedQuestion[]> {
    return forkJoin([
      this.loadQuestions('javascript', kind).pipe(map(list => list.map(q => ({ ...q, tech: 'javascript' as const })))),
      this.loadQuestions('angular', kind).pipe(map(list => list.map(q => ({ ...q, tech: 'angular' as const })))),
    ]).pipe(map(([a, b]) => [...a, ...b]));
  }

  loadSystemDesign(): Observable<any[]> {
    const key = `${this.cachePrefix}system-design`;
    const cached = localStorage.getItem(key);
    if (cached) return of(JSON.parse(cached) as any[]);
    return this.http
      .get<any[]>(`assets/questions/system-design/system-design.json`)
      .pipe(tap(qs => localStorage.setItem(key, JSON.stringify(qs))));
  }
}