import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import {
  ReviewModeComment,
  ReviewModeFile,
  ReviewModeFramework,
  ReviewModeScenario,
  ReviewModeSeverity,
} from '../models/review-mode.model';
import { normalizeAssetPath } from '../utils/asset-url.util';
import { linesOf } from '../utils/line-diff.util';
import { PracticeAssetResolverService } from './practice-asset-resolver.service';

const FRAMEWORKS: readonly ReviewModeFramework[] = ['react', 'angular', 'vue'];
const SEVERITIES: readonly ReviewModeSeverity[] = ['blocker', 'major', 'minor', 'nit'];

/** Loads a merge request review scenario and drops one that would render half a review. */
@Injectable({ providedIn: 'root' })
export class ReviewModeService {
  private readonly http = inject(HttpClient);
  private readonly assets = inject(PracticeAssetResolverService);
  private readonly cache = new Map<string, Observable<ReviewModeScenario | null>>();

  load(assetPathRaw: string): Observable<ReviewModeScenario | null> {
    const assetPath = normalizeAssetPath(assetPathRaw);
    if (!/^assets\/questions\/review-modes\/[a-z0-9.-]+\.json$/i.test(assetPath)) return of(null);

    const cached = this.cache.get(assetPath);
    if (cached) return cached;

    const request$ = this.assets.getVersion().pipe(
      switchMap((version) => {
        const { primary, fallback } = this.assets.getAssetUrls(assetPath, version);
        return primary !== fallback
          ? this.http.get<unknown>(primary).pipe(catchError(() => this.http.get<unknown>(fallback)))
          : this.http.get<unknown>(fallback);
      }),
      map((payload) => this.normalize(payload)),
      catchError(() => of(null)),
      shareReplay(1),
    );
    this.cache.set(assetPath, request$);
    return request$;
  }

  normalize(payload: unknown): ReviewModeScenario | null {
    const source = this.record(payload);
    if (!source) return null;
    const schemaVersion = this.text(source['schemaVersion']);
    const id = this.text(source['id']);
    const title = this.text(source['title']);
    const access = source['access'] === 'premium' ? 'premium' : source['access'] === 'free' ? 'free' : null;
    const sessionMinutes = Number(source['sessionMinutes']);
    const supportedQuestions = this.frameworkMap(source['supportedQuestions']);
    const request = this.record(source['mergeRequest']);
    const issue = this.record(request?.['issue']);
    const files = Array.isArray(request?.['files'])
      ? (request['files'] as unknown[]).map((file) => this.file(file)).filter((file): file is ReviewModeFile => file !== null)
      : [];
    const sample = this.record(source['sampleReview']);
    const paths = new Set(files.map((file) => file.path));
    const comments = Array.isArray(sample?.['comments'])
      ? (sample['comments'] as unknown[]).map((comment) => this.comment(comment)).filter((comment): comment is ReviewModeComment => comment !== null)
      : [];

    if (!schemaVersion || !id || !title || !access || !supportedQuestions) return null;
    if (!Number.isFinite(sessionMinutes) || sessionMinutes <= 0) return null;
    if (!request || !issue || !files.length || paths.size !== files.length) return null;
    const requestTitle = this.text(request['title']);
    const description = this.text(request['description']);
    const issueTitle = this.text(issue['title']);
    const requirements = this.stringList(issue['requirements']);
    const summary = this.text(sample?.['summary']);
    if (!requestTitle || !description || !issueTitle || !requirements.length || !summary || !comments.length) return null;
    // Every sample comment points at a real line of a file in the request.
    const lineCounts = new Map(files.map((file) => [file.path, linesOf(file.after).length]));
    if (comments.some((comment) => !paths.has(comment.path) || comment.line > (lineCounts.get(comment.path) ?? 0))) return null;

    return {
      schemaVersion,
      id,
      title,
      access,
      sessionMinutes,
      supportedQuestions,
      mergeRequest: { title: requestTitle, description, issue: { title: issueTitle, requirements }, files },
      sampleReview: { summary, comments },
    };
  }

  private file(value: unknown): ReviewModeFile | null {
    const source = this.record(value);
    const path = this.text(source?.['path']);
    const before = typeof source?.['before'] === 'string' ? (source['before'] as string) : null;
    const after = typeof source?.['after'] === 'string' ? (source['after'] as string) : null;
    if (!path || before === null || !after || before === after) return null;
    return { path, before, after };
  }

  private comment(value: unknown): ReviewModeComment | null {
    const source = this.record(value);
    const path = this.text(source?.['path']);
    const line = Number(source?.['line']);
    const severity = SEVERITIES.find((entry) => entry === source?.['severity']) ?? null;
    const title = this.text(source?.['title']);
    const body = this.text(source?.['body']);
    if (!path || !Number.isInteger(line) || line < 1 || !severity || !title || !body) return null;
    return { path, line, severity, title, body, checked: source?.['checked'] === true };
  }

  private frameworkMap(value: unknown): Partial<Record<ReviewModeFramework, string>> | null {
    const source = this.record(value);
    if (!source) return null;
    const out: Partial<Record<ReviewModeFramework, string>> = {};
    for (const framework of FRAMEWORKS) {
      const id = this.text(source[framework]);
      if (id) out[framework] = id;
    }
    return Object.keys(out).length ? out : null;
  }

  private record(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  }

  private text(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private stringList(value: unknown): string[] {
    return Array.isArray(value) ? value.map((entry) => this.text(entry)).filter(Boolean) : [];
  }
}
