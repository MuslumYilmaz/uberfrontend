import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CvAnalyzeResponse, CvRole } from '../models/cv-linter.model';
import { apiUrl } from '../utils/api-base';

@Injectable({ providedIn: 'root' })
export class CvLinterService {
  private readonly endpoint = apiUrl('/tools/cv/analyze');

  constructor(private readonly http: HttpClient) {}

  analyzeFile(file: File, role: CvRole): Observable<CvAnalyzeResponse> {
    const payload = new FormData();
    payload.append('file', file);
    payload.append('targetRole', role);
    return this.http.post<CvAnalyzeResponse>(this.endpoint, payload);
  }

  analyzeText(text: string, role: CvRole): Observable<CvAnalyzeResponse> {
    return this.http.post<CvAnalyzeResponse>(this.endpoint, {
      text,
      targetRole: role,
    });
  }
}
