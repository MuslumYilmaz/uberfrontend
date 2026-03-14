import {
  HttpBackend,
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, switchMap } from 'rxjs/operators';
import { apiUrl, getApiRoot } from '../utils/api-base';

const API_ROOT = getApiRoot();
const REFRESH_URL = apiUrl('/auth/refresh');
const SESSION_ERRORS = new Set(['Missing token', 'Invalid or expired token']);

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

function hasSessionHint(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem('fa:auth:session') === '1';
  } catch {
    return false;
  }
}

function shouldAttemptRefresh(req: { url: string }, err: unknown): err is HttpErrorResponse {
  if (!(err instanceof HttpErrorResponse)) return false;
  if (err.status !== 401) return false;
  if (!isApiRequest(req.url) || isRefreshRequest(req.url)) return false;
  if (!hasSessionHint()) return false;

  const message = String(err.error?.error || '').trim();
  return SESSION_ERRORS.has(message);
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

  return next(req).pipe(
    catchError((err) => {
      if (!shouldAttemptRefresh(req, err)) {
        return throwError(() => err);
      }

      return refreshSession(rawHttp).pipe(
        switchMap(() => next(req)),
        catchError(() => throwError(() => err))
      );
    })
  );
};
