import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Tech } from '../models/user.model';
import { TriviaIncidentOption } from '../models/question.model';
import { apiUrl } from '../utils/api-base';

export type TriviaIncidentPrompt = {
  questionId: string;
  tech: Tech;
  title: string;
  scenario: string;
  options: TriviaIncidentOption[];
};

export type TriviaIncidentAnswerResult = {
  questionId: string;
  tech: Tech;
  correct: boolean;
  feedback: string;
  rereadRecommended: boolean;
};

@Injectable({ providedIn: 'root' })
export class TriviaIncidentService {
  constructor(private http: HttpClient) { }

  getIncident(tech: Tech, questionId: string): Observable<TriviaIncidentPrompt | null> {
    const safeTech = String(tech || '').trim().toLowerCase();
    const safeId = String(questionId || '').trim();
    if (!safeTech || !safeId) return of(null);

    const path = `/trivia/${encodeURIComponent(safeTech)}/${encodeURIComponent(safeId)}/incident`;
    return this.http.get<TriviaIncidentPrompt>(apiUrl(path)).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err?.status === 404) return of(null);
        return throwError(() => err);
      }),
    );
  }

  answerIncident(tech: Tech, questionId: string, optionId: string): Observable<TriviaIncidentAnswerResult> {
    const safeTech = String(tech || '').trim().toLowerCase();
    const safeId = String(questionId || '').trim();
    const safeOptionId = String(optionId || '').trim();
    const path = `/trivia/${encodeURIComponent(safeTech)}/${encodeURIComponent(safeId)}/incident/answer`;
    return this.http.post<TriviaIncidentAnswerResult>(apiUrl(path), { optionId: safeOptionId });
  }
}
