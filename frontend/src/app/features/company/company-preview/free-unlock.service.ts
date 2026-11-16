import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import type { FreeUnlock } from '../../../core/models/free-unlock.model';
import { AuthService } from '../../../core/services/auth.service';
import { apiUrl } from '../../../core/utils/api-base';

/** What spending the free unlock came to: opened, already spent on another question, or failed. */
export type FreeUnlockResult =
  | { readonly status: 'opened'; readonly unlock: FreeUnlock }
  | { readonly status: 'used'; readonly unlock: FreeUnlock | null }
  | { readonly status: 'error' };

/** A visitor's choice made before signing up, kept on the device until they are back on the guide with an account. */
type FreeUnlockIntent = { readonly company: string; readonly questionId: string; readonly at: number };

const INTENT_KEY = 'fa:free-unlock-intent';
// Long enough to sign up, verify by email and come back; short enough that a stale choice does not spend the unlock.
const INTENT_TTL_MS = 2 * 60 * 60 * 1000;

/** Spends a free account's one free unlock on a reported question of a company guide. */
@Injectable({ providedIn: 'root' })
export class FreeUnlockService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  claim(company: string, questionId: string): Observable<FreeUnlockResult> {
    return this.http
      .post<{ freeUnlock: FreeUnlock }>(apiUrl('/users/me/free-unlock'), { company, questionId }, { headers: this.auth.headers() })
      .pipe(
        map((response): FreeUnlockResult => ({ status: 'opened', unlock: response.freeUnlock })),
        catchError((error: HttpErrorResponse) =>
          of<FreeUnlockResult>(
            error.status === 409 && error.error?.code === 'FREE_UNLOCK_USED'
              ? { status: 'used', unlock: error.error?.freeUnlock ?? null }
              : { status: 'error' },
          ),
        ),
        // The account holds one unlock; whatever the server says it is becomes the reader's, so every guide agrees.
        tap((result) => {
          if (result.status !== 'error' && result.unlock) {
            const unlock = result.unlock;
            this.auth.user.update((user) => (user ? { ...user, freeUnlock: unlock } : user));
          }
        }),
      );
  }

  /** Remembers a visitor's choice of question across signing up or signing in. */
  rememberIntent(company: string, questionId: string): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(INTENT_KEY, JSON.stringify({ company, questionId, at: Date.now() } satisfies FreeUnlockIntent));
    } catch {
      // Storage can be off; the reader then picks the question again after signing in.
    }
  }

  /** The visitor's remembered choice for this company, once: it is cleared whether or not it is used. */
  takeIntent(company: string): string | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(INTENT_KEY);
      if (!raw) return null;
      const intent = JSON.parse(raw) as Partial<FreeUnlockIntent>;
      if (intent.company !== company) return null;
      localStorage.removeItem(INTENT_KEY);
      const fresh = typeof intent.at === 'number' && Date.now() - intent.at < INTENT_TTL_MS;
      return fresh && typeof intent.questionId === 'string' ? intent.questionId : null;
    } catch {
      return null;
    }
  }
}
