// src/app/core/services/question.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { Question } from '../models/question.model';
import { Tech } from '../models/user.model';

type Kind = 'coding' | 'trivia' | 'debug';
export type MixedQuestion = Question & { tech: Tech };

type DataVersion = { version: string };

@Injectable({ providedIn: 'root' })
export class QuestionService {
  private readonly cachePrefix = 'qcache:';
  private readonly dvKey = `${this.cachePrefix}dv`;
  private version$?: Observable<string>;

  constructor(private http: HttpClient) { }

  // ---------- public API ----------------------------------------------------

  /** Load questions for a given tech + kind. Handles array OR single-object JSON. */
  loadQuestions(technology: Tech, kind: Kind): Observable<Question[]> {
    return this.getVersion().pipe(
      switchMap(() => {
        const key = this.key(technology, kind);
        const cached = localStorage.getItem(key);
        if (cached) return of(JSON.parse(cached) as Question[]);

        // Accept any shape and normalize to Question[]
        return this.http.get<any>(this.url(technology, kind)).pipe(
          map((raw) => this.normalizeQuestions(raw, technology, kind)),
          catchError(() => of([] as Question[])),
          tap((list) => localStorage.setItem(key, JSON.stringify(list)))
        );
      })
    );
  }

  /** Load all questions for multiple techs (for companies pages, etc.). */
  loadAllQuestions(kind: Exclude<Kind, 'debug'>): Observable<MixedQuestion[]> {
    const TECHS: Tech[] = ['javascript', 'angular', 'react', 'vue', 'html', 'css'];
    return forkJoin(
      TECHS.map((t) =>
        this.loadQuestions(t, kind).pipe(
          map((list) => list.map((q) => ({ ...q, tech: t } as MixedQuestion)))
        )
      )
    ).pipe(map((buckets) => buckets.flat()));
  }

  /** Convenience: fetch a single question by id. */
  getById(technology: Tech, kind: Kind, id: string): Observable<Question | null> {
    return this.loadQuestions(technology, kind).pipe(
      map((list) => list.find((q) => q.id === id) ?? null)
    );
  }

  /** System design list (simple cache). */
  loadSystemDesign(): Observable<any[]> {
    const key = `${this.cachePrefix}system-design`;
    const cached = localStorage.getItem(key);
    if (cached) return of(JSON.parse(cached) as any[]);

    return this.http
      .get<any[]>(`assets/questions/system-design/system-design.json`)
      .pipe(
        catchError(() => of([] as any[])),
        tap((qs) => localStorage.setItem(key, JSON.stringify(qs)))
      );
  }

  /** Handy during development: clear all cached lists managed by this service. */
  clearCache(): void {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(this.cachePrefix)) localStorage.removeItem(k);
    });
  }

  // ---------- internals -----------------------------------------------------

  private key(tech: Tech, kind: Kind) {
    return `${this.cachePrefix}${tech}:${kind}`;
  }
  private url(tech: Tech, kind: Kind) {
    return `assets/questions/${tech}/${kind}.json`;
  }

  /** Normalize any supported JSON shape to Question[] and add safe defaults. */
  private normalizeQuestions(raw: any, technology: Tech, kind: Kind): Question[] {
    // Supported shapes:
    // - Array<Question>
    // - { questions: Question[] }
    // - Single Question object
    const list: any[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.questions)
        ? raw.questions
        : raw && typeof raw === 'object'
          ? [raw]
          : [];

    const normalized: Question[] = list.map((q: any) => ({
      ...q,
      // Ensure these exist so downstream code (sorting, language defaults) is happy
      technology: q?.technology ?? technology,
      type: q?.type ?? kind,
      difficulty: q?.difficulty ?? 'easy',
      importance: Number(q?.importance ?? 0),
      languageDefault: q?.languageDefault ?? 'js',
    }));

    // Keep your previous sort: importance desc, then title asc
    normalized.sort((a, b) => {
      const ia = Number((a as any).importance ?? 0);
      const ib = Number((b as any).importance ?? 0);
      if (ia !== ib) return ib - ia;
      return (a.title || '').localeCompare(b.title || '');
    });

    return normalized;
  }

  /** Fetch data-version once; invalidate local cache when it changes. */
  private getVersion(): Observable<string> {
    if (!this.version$) {
      this.version$ = this.http.get<DataVersion>('assets/data-version.json').pipe(
        map((v) => String((v as any)?.version ?? '0')),
        catchError(() => of('0')),
        tap((ver) => this.ensureCacheVersion(ver)),
        shareReplay(1)
      );
    }
    return this.version$;
  }

  private ensureCacheVersion(ver: string): void {
    const prev = localStorage.getItem(this.dvKey);
    if (prev !== ver) {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith(this.cachePrefix)) localStorage.removeItem(k);
      });
      localStorage.setItem(this.dvKey, ver);
    }
  }
}
