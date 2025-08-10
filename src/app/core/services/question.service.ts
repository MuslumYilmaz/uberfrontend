import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Question } from '../models/question.model';

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

  loadSystemDesign(): Observable<any[]> {
    const key = `${this.cachePrefix}system-design`;
    const cached = localStorage.getItem(key);
    if (cached) return of(JSON.parse(cached) as any[]);
    return this.http
      .get<any[]>(`assets/questions/system-design/system-design.json`)
      .pipe(tap(qs => localStorage.setItem(key, JSON.stringify(qs))));
  }
}
