import {
  HttpBackend,
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { apiUrl, getApiRoot } from '../utils/api-base';
import { AuthSessionAuthorityService } from '../services/auth-session-authority.service';

const API_ROOT = getApiRoot();
const REFRESH_URL = apiUrl('/auth/refresh');
const SESSION_ERRORS = new Set(['Missing token', 'Invalid or expired token']);
const SESSION_ERROR_CODES = new Set(['AUTH_MISSING', 'AUTH_INVALID']);
const UNRECOVERABLE_REFRESH_CODES = new Set(['REFRESH_MISSING', 'REFRESH_INVALID', 'AUTH_CSRF_INVALID']);

let refreshInFlight$: Observable<{ ok: boolean }> | null = null;

function isApiRequest(url: string): boolean {
  if (!API_ROOT) return false;
  return url.startsWith(API_ROOT);
}

function isRefreshRequest(url: string): boolean {
  return url === REFRESH_URL;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const parts = document.cookie.split(';').map((part) => part.trim());
  const hit = parts.find((part) => part.startsWith(`${name}=`));
  if (!hit) return null;
  try {
    return decodeURIComponent(hit.slice(name.length + 1));
  } catch {
    return hit.slice(name.length + 1);
  }
}

function extractErrorCode(err: HttpErrorResponse): string {
  return String(err.error?.code || '').trim();
}

function extractErrorMessage(err: HttpErrorResponse): string {
  return String(err.error?.error || '').trim();
}

function shouldAttemptRefresh(
  req: { url: string },
  err: unknown,
  authAuthority: AuthSessionAuthorityService,
): err is HttpErrorResponse {
  if (!(err instanceof HttpErrorResponse)) return false;
  if (err.status !== 401) return false;
  if (!isApiRequest(req.url) || isRefreshRequest(req.url)) return false;
  if (!authAuthority.hasSessionHint()) return false;

  const code = extractErrorCode(err);
  if (SESSION_ERROR_CODES.has(code)) return true;

  return SESSION_ERRORS.has(extractErrorMessage(err));
}

function shouldForceSignOut(err: unknown): boolean {
  if (!(err instanceof HttpErrorResponse)) return false;
  if (err.status !== 401 && err.status !== 403) return false;

  const code = extractErrorCode(err);
  if (code && UNRECOVERABLE_REFRESH_CODES.has(code)) return true;

  const message = extractErrorMessage(err);
  return message === 'Missing refresh token' || message === 'Invalid or expired refresh session';
}

function getRefreshHeaders(): HttpHeaders {
  let headers = new HttpHeaders();
  const csrf = readCookie('csrf_token');
  if (csrf) {
    headers = headers.set('X-CSRF-Token', csrf);
  }
  return headers;
}

function refreshSession(rawHttp: HttpClient) {
  if (!refreshInFlight$) {
    refreshInFlight$ = rawHttp
      .post<{ ok: boolean }>(REFRESH_URL, {}, {
        withCredentials: true,
        headers: getRefreshHeaders(),
      })
      .pipe(
        map(() => ({ ok: true })),
        finalize(() => {
          refreshInFlight$ = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
  }

  return refreshInFlight$;
}

export const authRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url) || isRefreshRequest(req.url)) {
    return next(req);
  }

  const rawHttp = new HttpClient(inject(HttpBackend));
  const authAuthority = inject(AuthSessionAuthorityService);

  return next(req).pipe(
    catchError((err) => {
      if (!shouldAttemptRefresh(req, err, authAuthority)) {
        return throwError(() => err);
      }

      authAuthority.markRefreshing();
      return refreshSession(rawHttp).pipe(
        switchMap(() => next(req).pipe(
          tap(() => authAuthority.finishRefresh()),
        )),
        catchError((refreshErr) => {
          if (shouldForceSignOut(refreshErr)) {
            authAuthority.forceSignOut('session_expired');
          }
          return throwError(() => err);
        })
      );
    })
  );
};
