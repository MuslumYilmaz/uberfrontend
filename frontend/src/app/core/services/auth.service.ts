import { HttpClient, HttpHeaders } from '@angular/common/http';
import { computed, effect, Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, shareReplay, switchMap, tap } from 'rxjs/operators';
import { Tech } from '../models/user.model';

export type Role = 'user' | 'admin';
export type Theme = 'dark' | 'light' | 'system';

export interface UserPrefs {
  tz: string;
  theme: Theme;
  defaultTech: Tech;
  keyboard: 'default' | 'vim';
  marketingEmails: boolean;
}

export interface Streak {
  current: number;
  longest: number;
  lastActiveUTCDate: string | null;
}

export interface PerTech { xp: number; completed: number; }
export interface UserStats {
  xpTotal: number;
  completedTotal: number;
  perTech: { javascript: PerTech; angular: PerTech };
  streak: Streak;
}

export interface BillingUnit {
  status: 'none' | 'lifetime' | 'active' | 'canceled';
  planId?: string;
  subscriptionId?: string;
  renewsAt?: string;
  canceledAt?: string;
}
export interface Billing {
  stripeCustomerId?: string;
  pro: BillingUnit;
  projects: BillingUnit;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  role: Role;
  accessTier?: 'free' | 'premium';
  prefs: UserPrefs;
  stats?: UserStats;
  billing?: Billing;
  coupons?: Array<{ code: string; scope: 'pro' | 'projects'; appliedAt: string }>;
  solvedQuestionIds?: string[];
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = 'http://localhost:3001/api/auth';

  /** Reactive token + user */
  private _token = signal<string | null>(localStorage.getItem('auth_token'));
  user = signal<User | null>(null);

  /** Reactive auth state */
  isLoggedIn = computed(() => !!this._token());

  constructor(private http: HttpClient) {
    // Keep tabs/windows in sync
    window.addEventListener('storage', (e) => {
      if (e.key === 'auth_token') {
        this._token.set(e.newValue);
        if (e.newValue) {
          this.fetchMe().subscribe();
        } else {
          this.user.set(null);
        }
      }
    });

    // If we already have a token on startup but no user yet, load it
    effect(() => {
      if (this._token() && !this.user()) {
        this.fetchMe().subscribe();
      }
    });
  }

  // ---------- token helpers ----------
  private setToken(token: string | null) {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
    this._token.set(token);
  }

  get token(): string | null {
    return this._token();
  }

  private authHeaders(token: string | null = this.token): HttpHeaders {
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  public headers(): HttpHeaders {
    return this.authHeaders();
  }

  // ---------- API ----------
  signup(data: { email: string; username: string; password: string }) {
    return this.http
      .post<{ token: string; user?: User }>(`${this.base}/signup`, data)
      .pipe(
        tap((res) => {
          this.setToken(res.token);
          if (res.user) this.user.set(this.cloneUser(res.user));
        }),
        switchMap(() => this.fetchMe()),
        shareReplay(1)
      );
  }

  login(data: { emailOrUsername: string; password: string }) {
    return this.http
      .post<{ token: string; user?: User }>(`${this.base}/login`, data)
      .pipe(
        tap((res) => {
          this.setToken(res.token);

          // optional: keep UI snappy if backend returns user
          if (res.user) this.user.set(this.cloneUser(res.user));
        }),
        // ✅ always hydrate full user (solvedQuestionIds, stats, billing, etc.)
        switchMap(() => this.fetchMe()),
        shareReplay(1)
      );
  }

  logout() {
    // Clear reactive state first so dependents react immediately
    this.user.set(null);
    this.setToken(null);
  }

  /** GET /api/auth/me */
  fetchMe(): Observable<User | null> {
    const tokenAtCall = this.token;
    if (!tokenAtCall) return of(null);

    return this.http
      .get<User>(`${this.base}/me`, { headers: this.authHeaders(tokenAtCall) })
      .pipe(
        tap((u) => {
          // If user logged out (or token changed) while request was in-flight, ignore it.
          if (this.token !== tokenAtCall) return;
          this.user.set(this.cloneUser(u));
        }),
        catchError((err) => {
          // optional but recommended: if token is invalid, clear it
          if (this.token === tokenAtCall && (err?.status === 401 || err?.status === 403)) {
            this.user.set(null);
            this.setToken(null);
            return of(null);
          }
          return throwError(() => err);
        })
      );
  }
  
  /** Lazy-load user when needed. */
  ensureMe(): Observable<User | null> {
    if (this.user()) return of(this.user());
    return this.fetchMe();
  }

  private cloneUser(u: User): User {
    return {
      ...u,
      accessTier: u.accessTier ?? 'free',
      prefs: u.prefs ? { ...u.prefs } : u.prefs,
      stats: u.stats ? { ...u.stats } as any : u.stats,
      billing: u.billing ? { ...u.billing } as any : u.billing,
      solvedQuestionIds: Array.isArray(u.solvedQuestionIds) ? [...u.solvedQuestionIds] : []
    };
  }

  /** PUT /api/users/:id */
  updateProfile(id: string, data: Partial<Pick<User, 'username' | 'email' | 'bio' | 'avatarUrl' | 'prefs'>>) {
    return this.http
      .put<User>(`http://localhost:3001/api/users/${id}`, data, { headers: this.authHeaders() })
      .pipe(tap((u) => this.user.set(u)));
  }

  /** Start OAuth: redirects to backend which 302s to Google */
  oauthStart(provider: 'google' | 'github', mode: 'login' | 'signup' = 'login') {
    const redirectUri = `${window.location.origin}/auth/callback`;
    const state = (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`;
    sessionStorage.setItem('oauth:state', state);

    // Adjust path if your backend differs (e.g., /auth/google)
    const url =
      `${this.base}/oauth/${provider}/start` +
      `?redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}` +
      `&mode=${encodeURIComponent(mode)}`;

    window.location.assign(url);
  }

  /**
   * Finish OAuth on /auth/callback.
   * Expects backend to redirect back with ?token=... (or #token=...),
   * then we fetch /me to populate the user.
   */
  completeOAuthCallback(qp: Record<string, any>): Observable<User | null> {
    const expected = sessionStorage.getItem('oauth:state');
    if (qp['state'] && expected && qp['state'] !== expected) {
      return throwError(() => new Error('Invalid OAuth state'));
    }
    sessionStorage.removeItem('oauth:state');

    if (qp['error']) {
      return throwError(() => new Error(String(qp['error'])));
    }

    // token may be in query OR in the hash
    let token: string | null =
      (qp['token'] as string) || (qp['access_token'] as string) || null;

    if (!token && window.location.hash) {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      token = hash.get('token') || hash.get('access_token');
    }

    if (!token) {
      return throwError(() => new Error('No token in OAuth callback'));
    }

    this.setToken(token);
    return this.fetchMe().pipe(
      catchError((e) => {
        // if /me fails, invalidate token so UI doesn’t think we’re logged in
        this.setToken(null);
        return throwError(() => e);
      })
    );
  }

}
