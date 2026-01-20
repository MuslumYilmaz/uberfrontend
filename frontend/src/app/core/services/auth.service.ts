import { HttpClient, HttpHeaders } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, shareReplay, switchMap, tap } from 'rxjs/operators';
import { Entitlements, Tech } from '../models/user.model';
import { environment } from '../../../environments/environment';
import { apiUrl, getApiBase, getFrontendBase } from '../utils/api-base';

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
  providers?: {
    gumroad?: {
      saleId?: string;
      purchaserEmail?: string;
      lastEventId?: string;
      lastEventAt?: string;
    };
    lemonsqueezy?: {
      customerId?: string;
      subscriptionId?: string;
      manageUrl?: string;
      lastEventId?: string;
      lastEventAt?: string;
    };
    stripe?: {
      customerId?: string;
      subscriptionId?: string;
      lastEventId?: string;
      lastEventAt?: string;
    };
  };
}

export interface User {
  _id: string;
  username: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  role: Role;
  accessTier?: 'free' | 'premium';
  entitlements?: Entitlements;
  accessTierEffective?: 'free' | 'premium';
  effectiveProActive?: boolean;
  prefs: UserPrefs;
  stats?: UserStats;
  billing?: Billing;
  coupons?: Array<{ code: string; scope: 'pro' | 'projects'; appliedAt: string }>;
  solvedQuestionIds?: string[];
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = apiUrl('/auth');
  private frontendBase = getFrontendBase();
  private static readonly SESSION_HINT_KEY = 'fa:auth:session';

  /** Reactive user */
  user = signal<User | null>(null);

  /** Reactive auth state */
  isLoggedIn = computed(() => !!this.user());

  /** Used to ignore stale in-flight /me responses (e.g., logout during request). */
  private sessionSeq = 0;

  constructor(private http: HttpClient) {
    // Avoid an eager /me call for logged-out visitors (prevents noisy 401s in the console).
    if (this.hasSessionHint()) {
      this.fetchMe().subscribe();
    }
  }

  private hasSessionHint(): boolean {
    try { return localStorage.getItem(AuthService.SESSION_HINT_KEY) === '1'; } catch { return false; }
  }

  private setSessionHint(on: boolean) {
    try {
      if (on) localStorage.setItem(AuthService.SESSION_HINT_KEY, '1');
      else localStorage.removeItem(AuthService.SESSION_HINT_KEY);
    } catch { }
  }

  public headers(): HttpHeaders {
    // Cookie-based auth: no JS-readable token.
    return new HttpHeaders();
  }

  // ---------- API ----------
  signup(data: { email: string; username: string; password: string }) {
    return this.http
      .post<{ token?: string; user?: User }>(`${this.base}/signup`, data, { withCredentials: true })
      .pipe(
        tap((res) => {
          this.setSessionHint(true);
          if (res.user) this.user.set(this.cloneUser(res.user));
        }),
        switchMap(() => this.fetchMe()),
        shareReplay(1)
      );
  }

  login(data: { emailOrUsername: string; password: string }) {
    return this.http
      .post<{ token?: string; user?: User }>(`${this.base}/login`, data, { withCredentials: true })
      .pipe(
        tap((res) => {
          this.setSessionHint(true);
          // optional: keep UI snappy if backend returns user
          if (res.user) this.user.set(this.cloneUser(res.user));
        }),
        // ✅ always hydrate full user (solvedQuestionIds, stats, billing, etc.)
        switchMap(() => this.fetchMe()),
        shareReplay(1)
      );
  }

  logout() {
    // Clear reactive state first so dependents react immediately.
    this.sessionSeq++;
    this.user.set(null);
    this.setSessionHint(false);
    return this.http
      .post<void>(`${this.base}/logout`, {}, { withCredentials: true })
      .pipe(catchError(() => of(void 0)));
  }

  /** GET /api/auth/me */
  fetchMe(): Observable<User | null> {
    const seq = ++this.sessionSeq;

    return this.http
      .get<User>(`${this.base}/me`, { withCredentials: true })
      .pipe(
        tap((u) => {
          // If user logged out (or another fetch started) while request was in-flight, ignore it.
          if (this.sessionSeq !== seq) return;
          this.setSessionHint(true);
          this.user.set(this.cloneUser(u));
        }),
        catchError((err) => {
          if (this.sessionSeq !== seq) return of(null);
          // If session cookie is missing/expired, clear user.
          if (err?.status === 401 || err?.status === 403) {
            this.user.set(null);
            this.setSessionHint(false);
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
      entitlements: u.entitlements
        ? {
            ...u.entitlements,
            pro: { ...u.entitlements.pro },
            projects: { ...u.entitlements.projects },
          }
        : u.entitlements,
      prefs: u.prefs ? { ...u.prefs } : u.prefs,
      stats: u.stats ? { ...u.stats } as any : u.stats,
      billing: u.billing ? { ...u.billing } as any : u.billing,
      solvedQuestionIds: Array.isArray(u.solvedQuestionIds) ? [...u.solvedQuestionIds] : []
    };
  }

  /** PUT /api/users/:id */
  updateProfile(id: string, data: Partial<Pick<User, 'username' | 'email' | 'bio' | 'avatarUrl' | 'prefs'>>) {
    return this.http
      .put<User>(apiUrl(`/users/${id}`), data, { withCredentials: true })
      .pipe(tap((u) => this.user.set(u)));
  }

  /** POST /api/auth/change-password */
  changePassword(currentPassword: string, currentPasswordConfirm: string, newPassword: string) {
    return this.http.post<{ ok: boolean }>(
      `${this.base}/change-password`,
      { currentPassword, currentPasswordConfirm, newPassword },
      { withCredentials: true }
    );
  }

  /** GET /api/billing/manage-url */
  getManageSubscriptionUrl(): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(apiUrl('/billing/manage-url'), { withCredentials: true });
  }

  private isLocalHost(host: string): boolean {
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  }

  private isProdRuntime(): boolean {
    if (environment.production) return true;
    if (typeof window === 'undefined') return false;
    const host = window.location.hostname;
    return !!host && !this.isLocalHost(host);
  }

  private shouldDebugOAuth(): boolean {
    if (environment.production) return false;
    if (typeof window === 'undefined') return false;
    return this.isLocalHost(window.location.hostname);
  }

  /** Start OAuth: redirects to backend which 302s to Google */
  oauthStart(provider: 'google' | 'github', mode: 'login' | 'signup' = 'login') {
    const base = this.frontendBase || (typeof window !== 'undefined' ? window.location.origin : '');
    const redirectUri = `${base}/auth/callback`;
    const state = (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`;
    sessionStorage.setItem('oauth:state', state);

    // Adjust path if your backend differs (e.g., /auth/google)
    const url =
      `${this.base}/oauth/${provider}/start` +
      `?redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}` +
      `&mode=${encodeURIComponent(mode)}`;

    if (this.isProdRuntime() && !/^https?:\/\//i.test(url)) {
      throw new Error('OAuth start URL must be absolute in production');
    }

    window.location.assign(url);
  }

  /**
   * Finish OAuth on /auth/callback.
   * Primary: backend sets httpOnly cookie and redirects back to the app.
   * Legacy: backend may still include ?token=... or #token=... (we do not store it).
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

    // token may be in query OR in the hash (legacy)
    let token: string | null = (qp['token'] as string) || (qp['access_token'] as string) || null;
    if (!token && window.location.hash) {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      token = hash.get('token') || hash.get('access_token');
    }

    // Remove sensitive tokens from the URL (query/hash) to avoid leaks via copy/paste or screenshots.
    this.scrubOAuthCallbackUrl();

    // Prefer cookie session (backend should set it). If a legacy token exists, use it once.
    const me$ = token
      ? this.http.get<User>(`${this.base}/me`, {
        withCredentials: true,
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
      })
      : this.http.get<User>(`${this.base}/me`, { withCredentials: true });

    return me$.pipe(
      tap((u) => {
        this.setSessionHint(true);
        this.user.set(this.cloneUser(u));
      }),
      catchError((e) => {
        this.user.set(null);
        this.setSessionHint(false);
        return throwError(() => e);
      })
    );
  }

  private scrubOAuthCallbackUrl() {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      url.searchParams.delete('access_token');
      url.searchParams.delete('state');
      url.searchParams.delete('mode');
      url.hash = '';
      window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
    } catch { }
  }

}
