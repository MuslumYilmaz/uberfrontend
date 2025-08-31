// src/app/core/services/question.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { Question } from '../models/question.model';
import { Tech } from '../models/user.model';

type Kind = 'coding' | 'trivia' | 'debug';          // ← debug added
export type MixedQuestion = Question & { tech: Tech };

type DataVersion = { version: string };

@Injectable({ providedIn: 'root' })
export class QuestionService {
  private readonly cachePrefix = 'qcache:';        // localStorage key prefix
  private readonly dvKey = `${this.cachePrefix}dv`; // stored data-version
  private version$?: Observable<string>;            // memoized version stream

  constructor(private http: HttpClient) { }

  // ----- public API ---------------------------------------------------------

  /** Load questions for a given tech + kind. Caches per data-version. */
  loadQuestions(technology: Tech, kind: Kind): Observable<Question[]> {
    return this.getVersion().pipe(
      switchMap(() => {
        const key = this.key(technology, kind);
        const cached = localStorage.getItem(key);
        if (cached) return of(JSON.parse(cached) as Question[]);

        return this.http.get<Question[]>(this.url(technology, kind)).pipe(
          // If a JSON file doesn't exist (e.g., no debug for a tech), return [].
          catchError(() => of([] as Question[])),
          tap(list => localStorage.setItem(key, JSON.stringify(list)))
        );
      })
    );
  }

  /** Load all questions for both techs, for a given kind (companies pages). */
  loadAllQuestions(kind: Exclude<Kind, 'debug'>): Observable<MixedQuestion[]> {
    const TECHS: Tech[] = ['javascript', 'angular', 'html', 'css'];
    return forkJoin(
      TECHS.map(t =>
        this.loadQuestions(t, kind).pipe(
          map(list => list.map(q => ({ ...q, tech: t as any })))
        )
      )
    ).pipe(map(buckets => buckets.flat()));
  }


  /** Convenience: fetch a single question by id. */
  getById(technology: Tech, kind: Kind, id: string): Observable<Question | null> {
    return this.loadQuestions(technology, kind).pipe(
      map(list => list.find(q => q.id === id) ?? null)
    );
  }

  /** System design list (left as a simple cache like before). */
  loadSystemDesign(): Observable<any[]> {
    const key = `${this.cachePrefix}system-design`;
    const cached = localStorage.getItem(key);
    if (cached) return of(JSON.parse(cached) as any[]);

    return this.http
      .get<any[]>(`assets/questions/system-design/system-design.json`)
      .pipe(
        catchError(() => of([] as any[])),
        tap(qs => localStorage.setItem(key, JSON.stringify(qs)))
      );
  }

  /** Handy during development: clear all cached lists. */
  clearCache(): void {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith(this.cachePrefix)) localStorage.removeItem(k);
    });
  }

  // ----- internals ----------------------------------------------------------

  private key(tech: Tech, kind: Kind) {
    return `${this.cachePrefix}${tech}:${kind}`;
  }
  private url(tech: Tech, kind: Kind) {
    return `assets/questions/${tech}/${kind}.json`;
  }

  /** Fetch data-version once; invalidate local cache when it changes. */
  private getVersion(): Observable<string> {
    if (!this.version$) {
      this.version$ = this.http.get<DataVersion>('assets/data-version.json').pipe(
        map(v => String((v as any)?.version ?? '0')),
        catchError(() => of('0')),
        tap(ver => this.ensureCacheVersion(ver)),
        shareReplay(1)
      );
    }
    return this.version$;
  }

  private ensureCacheVersion(ver: string): void {
    const prev = localStorage.getItem(this.dvKey);
    if (prev !== ver) {
      // wipe only this service's keys
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(this.cachePrefix)) localStorage.removeItem(k);
      });
      localStorage.setItem(this.dvKey, ver);
    }
  }
}