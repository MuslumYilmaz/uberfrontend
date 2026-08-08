import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, throwError } from 'rxjs';
import {
  SeoAction,
  SeoActionListQuery,
  SeoActionListResponse,
  SeoActionTransitionRequest,
  SeoAnalyzeResponse,
  SeoIntentOverrideRequest,
  SeoManualActionRequest,
  SeoOverview,
  SeoOwnerAccess,
  SeoPageDetail,
  SeoPageListResponse,
  SeoSearchSegment,
  SeoSyncResponse,
  SeoSyncRunListResponse,
  SeoWindowDays,
} from '../models/seo-admin.model';
import { apiUrl } from '../utils/api-base';

const DENIED_ACCESS: SeoOwnerAccess = {
  allowed: false,
  enabled: false,
  reason: null,
};

@Injectable({ providedIn: 'root' })
export class SeoAdminService {
  private readonly base = apiUrl('/admin/seo');
  private readonly accessState = signal<SeoOwnerAccess | null>(null);
  private accessPrincipalUserId: string | null | undefined;
  private accessRequest$: Observable<SeoOwnerAccess> | null = null;
  private accessGeneration = 0;
  private ambiguousNotFoundRevalidationPending = false;

  readonly ownerAccess = this.accessState.asReadonly();
  readonly ownerAllowed = computed(() => this.accessState()?.allowed === true);
  readonly accessChecked = computed(() => this.accessState() !== null);
  readonly manualAnalysisAvailable = computed(() => (
    this.accessState()?.allowed === true
    && this.accessState()?.enabled === true
    && this.accessState()?.capabilities?.manualAnalysis === true
  ));

  constructor(private readonly http: HttpClient) {}

  /**
   * Bind the cached owner capability to the authenticated account. Both the
   * header and route guard call this during auth hydration, so repeating the
   * same principal must be idempotent. A real account change invalidates every
   * in-flight response before any owner-only state can be reused.
   */
  bindOwnerPrincipal(userId: string | null): void {
    if (this.accessPrincipalUserId === userId) return;
    this.accessPrincipalUserId = userId;
    this.clearAccess();
  }

  checkAccess(force = false): Observable<SeoOwnerAccess> {
    if (force) {
      this.accessGeneration += 1;
      this.accessRequest$ = null;
    } else {
      if (this.accessState()) return of(this.accessState()!);
      if (this.accessRequest$) return this.accessRequest$;
    }
    const generation = this.accessGeneration;

    const request$ = this.withOwnerAuthorizationGuard(
      this.http.get<SeoOwnerAccess>(`${this.base}/access`, { withCredentials: true }),
      { accessProbe: true },
    )
      .pipe(
        map((access) => {
          if (generation !== this.accessGeneration) {
            throw new Error('Stale SEO owner access response');
          }
          this.accessState.set(access);
          return access;
        }),
        catchError((error) => {
          if (generation === this.accessGeneration) this.accessState.set(DENIED_ACCESS);
          return throwError(() => error);
        }),
        finalize(() => {
          if (this.accessRequest$ === request$) this.accessRequest$ = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    this.accessRequest$ = request$;
    return request$;
  }

  ensureAccess(): Observable<SeoOwnerAccess> {
    return this.checkAccess().pipe(catchError(() => of(DENIED_ACCESS)));
  }

  clearAccess(): void {
    this.accessGeneration += 1;
    this.accessState.set(null);
    this.accessRequest$ = null;
  }

  getOverview(windowDays: SeoWindowDays, segment: SeoSearchSegment): Observable<SeoOverview> {
    const params = new HttpParams()
      .set('window', windowDays)
      .set('segment', segment);
    return this.withOwnerAuthorizationGuard(this.http.get<SeoOverview>(`${this.base}/overview`, {
      params,
      withCredentials: true,
    }));
  }

  getActions(query: SeoActionListQuery): Observable<SeoActionListResponse> {
    let params = new HttpParams();
    if (query.queue) params = params.set('queue', query.queue);
    if (query.status && query.status !== 'all') params = params.set('status', query.status);
    if (query.type && query.type !== 'all') params = params.set('type', query.type);
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.cursor) params = params.set('cursor', query.cursor);
    if (query.limit) params = params.set('limit', query.limit);

    return this.withOwnerAuthorizationGuard(this.http.get<SeoActionListResponse>(`${this.base}/actions`, {
      params,
      withCredentials: true,
    }));
  }

  getAction(actionId: string): Observable<SeoAction> {
    return this.withOwnerAuthorizationGuard(this.http.get<SeoAction>(`${this.base}/actions/${encodeURIComponent(actionId)}`, {
      withCredentials: true,
    }));
  }

  createAction(payload: SeoManualActionRequest): Observable<SeoAction> {
    return this.withOwnerAuthorizationGuard(this.http.post<SeoAction>(`${this.base}/actions`, payload, {
      withCredentials: true,
    }));
  }

  transitionAction(actionId: string, payload: SeoActionTransitionRequest): Observable<SeoAction> {
    return this.withOwnerAuthorizationGuard(this.http.post<SeoAction>(
      `${this.base}/actions/${encodeURIComponent(actionId)}/transition`,
      payload,
      { withCredentials: true },
    ));
  }

  getPages(
    search = '',
    cursor: string | null = null,
    limit = 30,
    intentConfirmed?: boolean,
  ): Observable<SeoPageListResponse> {
    let params = new HttpParams().set('limit', limit);
    if (search.trim()) params = params.set('search', search.trim());
    if (cursor) params = params.set('cursor', cursor);
    if (intentConfirmed !== undefined) params = params.set('intentConfirmed', intentConfirmed);
    return this.withOwnerAuthorizationGuard(this.http.get<SeoPageListResponse>(`${this.base}/pages`, {
      params,
      withCredentials: true,
    }));
  }

  getPage(pageKey: string): Observable<SeoPageDetail> {
    return this.withOwnerAuthorizationGuard(this.http.get<SeoPageDetail>(`${this.base}/pages/${encodeURIComponent(pageKey)}`, {
      withCredentials: true,
    }));
  }

  updateIntent(pageKey: string, payload: SeoIntentOverrideRequest): Observable<SeoPageDetail> {
    return this.withOwnerAuthorizationGuard(this.http.put<SeoPageDetail>(
      `${this.base}/pages/${encodeURIComponent(pageKey)}/intent`,
      payload,
      { withCredentials: true },
    ));
  }

  requestSync(): Observable<SeoSyncResponse> {
    return this.withOwnerAuthorizationGuard(
      this.http.post<SeoSyncResponse>(`${this.base}/sync`, {}, { withCredentials: true }),
    );
  }

  requestAnalysis(): Observable<SeoAnalyzeResponse> {
    return this.withOwnerAuthorizationGuard(
      this.http.post<SeoAnalyzeResponse>(`${this.base}/analyze`, {}, { withCredentials: true }),
    );
  }

  getSyncRuns(limit = 6, cursor: string | null = null): Observable<SeoSyncRunListResponse> {
    let params = new HttpParams().set('limit', limit);
    if (cursor) params = params.set('cursor', cursor);
    return this.withOwnerAuthorizationGuard(this.http.get<SeoSyncRunListResponse>(`${this.base}/sync-runs`, {
      params,
      withCredentials: true,
    }));
  }

  private withOwnerAuthorizationGuard<T>(
    request: Observable<T>,
    options: { accessProbe?: boolean } = {},
  ): Observable<T> {
    return request.pipe(catchError((error: unknown) => {
      const candidate = error as { status?: unknown; error?: unknown } | null;
      const status = Number(candidate?.status);
      const responseBody = candidate?.error && typeof candidate.error === 'object'
        ? candidate.error as { code?: unknown }
        : null;
      const responseCode = String(responseBody?.code || '');
      const ambiguousNotFound = status === 404 && !responseCode.startsWith('SEO_');
      const confirmedOwnerDenial = status === 401
        || status === 403
        || (ambiguousNotFound && options.accessProbe === true);
      if (confirmedOwnerDenial) {
        // A request-level authorization failure is stronger than the cached
        // capability. An unlabelled 404 is only conclusive when it comes from
        // the access probe itself: another endpoint may simply be absent from
        // a stale backend process. Mark confirmed denials as completed so
        // owner-only components purge immediately.
        this.accessGeneration += 1;
        this.accessRequest$ = null;
        this.accessState.set(DENIED_ACCESS);
      } else if (ambiguousNotFound) {
        // Revalidate through the fail-closed access endpoint before revoking
        // the owner session. This distinguishes a disabled dashboard from a
        // frontend/backend version mismatch without weakening authorization.
        this.revalidateAfterAmbiguousNotFound();
      }
      return throwError(() => error);
    }));
  }

  private revalidateAfterAmbiguousNotFound(): void {
    if (this.ambiguousNotFoundRevalidationPending) return;
    this.ambiguousNotFoundRevalidationPending = true;
    this.accessGeneration += 1;
    this.accessRequest$ = null;
    const generation = this.accessGeneration;
    this.withOwnerAuthorizationGuard(
      this.http.get<SeoOwnerAccess>(`${this.base}/access`, { withCredentials: true }),
      { accessProbe: true },
    ).pipe(
      finalize(() => {
        this.ambiguousNotFoundRevalidationPending = false;
      }),
    ).subscribe({
      next: (access) => {
        if (generation === this.accessGeneration) this.accessState.set(access);
      },
      // A transient probe failure is not evidence that a previously verified
      // owner lost access. Initial route access remains fail-closed through
      // checkAccess(); only 401/403/access-probe 404 revoke here.
      error: () => undefined,
    });
  }
}
