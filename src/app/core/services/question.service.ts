import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Question } from '../models/question.model';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class QuestionService {
  private cachePrefix = 'questions-';

  constructor(private http: HttpClient) {}

  loadQuestions(
    technology: string,
    type: string
  ): Observable<Question[]> {
    const key = `${this.cachePrefix}${technology}-${type}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      return of(JSON.parse(cached) as Question[]);
    }
    return this.http
      .get<Question[]>(
        `assets/questions/${technology}/${type}.json`
      )
      .pipe(
        tap((questions) =>
          localStorage.setItem(key, JSON.stringify(questions))
        )
      );
  }
}
