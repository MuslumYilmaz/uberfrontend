import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import {
  ReviewModeComment,
  ReviewModeFile,
  ReviewModeFormat,
  ReviewModeScenario,
  ReviewModeSeverity,
  ReviewModeTech,
} from '../models/review-mode.model';
import { normalizeAssetPath } from '../utils/asset-url.util';
import { linesOf } from '../utils/line-diff.util';
import { PracticeAssetResolverService } from './practice-asset-resolver.service';

const TECHS: readonly ReviewModeTech[] = ['react', 'angular', 'vue', 'javascript'];
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
    const format: ReviewModeFormat | null = source['format'] === undefined || source['format'] === 'review'
      ? 'review'
      : source['format'] === 'find' ? 'find' : null;
    const sessionMinutes = Number(source['sessionMinutes']);
    const reviewMinutes = source['reviewMinutes'] === undefined ? null : Number(source['reviewMinutes']);
    const supportedQuestions = this.techMap(source['supportedQuestions']);
    const request = this.record(source['mergeRequest']);
    const issue = this.record(request?.['issue']);
    const files = Array.isArray(request?.['files']) && format
      ? (request['files'] as unknown[]).map((file) => this.file(file, format)).filter((file): file is ReviewModeFile => file !== null)
      : [];
    // A find case asks for a calculation by hand before the code; both halves or neither.
    const example = this.record(source['workedExample']);
    const examplePrompt = this.text(example?.['prompt']);
    const exampleAnswer = this.text(example?.['answer']);
    const sample = this.record(source['sampleReview']);
    const paths = new Set(files.map((file) => file.path));
    const comments = Array.isArray(sample?.['comments'])
      ? (sample['comments'] as unknown[]).map((comment) => this.comment(comment)).filter((comment): comment is ReviewModeComment => comment !== null)
      : [];

    if (!schemaVersion || !id || !title || !access || !format || !supportedQuestions) return null;
    if (example && (!examplePrompt || !exampleAnswer)) return null;
    if (!Number.isFinite(sessionMinutes) || sessionMinutes <= 0) return null;
    if (reviewMinutes !== null && (!Number.isInteger(reviewMinutes) || reviewMinutes <= 0)) return null;
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
      format,
      sessionMinutes,
      ...(reviewMinutes !== null ? { reviewMinutes } : {}),
      supportedQuestions,
      ...(example ? { workedExample: { prompt: examplePrompt, answer: exampleAnswer } } : {}),
      mergeRequest: { title: requestTitle, description, issue: { title: issueTitle, requirements }, files },
      sampleReview: { summary, comments },
    };
  }

  /** A merge request's file must change; a find case's file is read as it is, with no file before it. */
  private file(value: unknown, format: ReviewModeFormat): ReviewModeFile | null {
    const source = this.record(value);
    const path = this.text(source?.['path']);
    const before = typeof source?.['before'] === 'string' ? (source['before'] as string) : format === 'find' ? '' : null;
    const after = typeof source?.['after'] === 'string' ? (source['after'] as string) : null;
    if (!path || before === null || !after) return null;
    if (format === 'review' ? before === after : before !== '') return null;
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

  private techMap(value: unknown): Partial<Record<ReviewModeTech, string>> | null {
    const source = this.record(value);
    if (!source) return null;
    const out: Partial<Record<ReviewModeTech, string>> = {};
    for (const tech of TECHS) {
      const id = this.text(source[tech]);
      if (id) out[tech] = id;
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
