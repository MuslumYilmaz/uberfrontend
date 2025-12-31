import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const API_BASE = String(environment.apiBase || '').replace(/\/+$/, '');

function isApiRequest(url: string): boolean {
  if (!API_BASE) return false;
  return url.startsWith(API_BASE);
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const parts = document.cookie.split(';').map((p) => p.trim());
  const hit = parts.find((p) => p.startsWith(`${name}=`));
  if (!hit) return null;
  try {
    return decodeURIComponent(hit.slice(name.length + 1));
  } catch {
    return hit.slice(name.length + 1);
  }
}

function isStateChanging(method: string): boolean {
  const m = method.toUpperCase();
  return m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE';
}

/**
 * - Sends cookies to the API (required for httpOnly cookie auth in prod).
 * - Adds X-CSRF-Token header when csrf_token cookie exists (double-submit).
 */
export const apiCredentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) return next(req);

  let nextReq = req.clone({ withCredentials: true });

  if (isStateChanging(req.method) && !req.headers.has('X-CSRF-Token')) {
    const csrf = readCookie('csrf_token');
    if (csrf) {
      nextReq = nextReq.clone({ setHeaders: { 'X-CSRF-Token': csrf } });
    }
  }

  return next(nextReq);
};

