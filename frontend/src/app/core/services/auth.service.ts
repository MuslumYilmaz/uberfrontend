import { HttpClient, HttpHeaders } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { Entitlements, Tech } from '../models/user.model';
import { environment } from '../../../environments/environment';
import { apiUrl, getFrontendBase } from '../utils/api-base';
import { resolvePaymentsProvider } from '../utils/payments-provider.util';
import { sanitizeRedirectTarget } from '../utils/redirect.util';
import { AttemptInsightsService } from './attempt-insights.service';
import { AuthSessionAuthorityService, AuthSyncEvent } from './auth-session-authority.service';

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
  lastActiveUTCDate: string | null; // app-local day key from backend
}

export interface PerTech { xp: number; completed: number; }
export interface UserStats {
  xpTotal: number;
  completedTotal: number;
  perTech: Record<string, PerTech>;
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

type AuthBootstrapContext = 'login' | 'signup' | 'oauth';

function buildSessionBootstrapError(context: AuthBootstrapContext) {
  const action =
    context === 'login' ? 'sign you in' :
    context === 'signup' ? 'create your session' :
    'finish authentication';

  return {
    code: 'AUTH_SESSION_BOOTSTRAP_FAILED',
    error: `We could not ${action}. Please try again.`,
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private static readonly AUTH_CONTEXT_HEADER = 'X-Auth-Context-Id';
  private static readonly AUTH_REQUEST_HEADER = 'X-Auth-Request-Id';
  private base = apiUrl('/auth');
  private frontendBase = getFrontendBase();
  private static readonly OAUTH_STATE_KEY = 'oauth:state';
  private static readonly OAUTH_REDIRECT_KEY = 'oauth:redirect';
  private static readonly OAUTH_MODE_KEY = 'oauth:mode';
  private readonly attemptInsights = inject(AttemptInsightsService, { optional: true });
  private readonly authAuthority = inject(AuthSessionAuthorityService);

  /** Reactive user */
  user = signal<User | null>(null);

  /** Reactive auth state */
  isLoggedIn = computed(() => !!this.user());

  /** Used to ignore stale in-flight /me responses when newer /me calls complete first. */
  private meSeq = 0;
  private pendingMeRequest$: Observable<User | null> | null = null;
  private pendingMeBroadcast = false;
  private readonly pendingLoginAttempts = new Map<string, Observable<User>>();
  private readonly pendingSignupAttempts = new Map<string, Observable<User>>();

  constructor(private http: HttpClient) {
    this.authAuthority.events$.subscribe((event) => this.handleAuthorityEvent(event));

    // Avoid an eager /me call for logged-out visitors (prevents noisy 401s in the console).
    if (this.authAuthority.hasSessionHint()) {
      this.fetchMe().subscribe({ error: () => undefined });
    }
  }

  public headers(): HttpHeaders {
    // Cookie-based auth: no JS-readable token.
    return new HttpHeaders();
  }

  // ---------- API ----------
  signup(data: { email: string; username: string; password: string }) {
    const key = this.buildSignupAttemptKey(data);
    const existing = this.pendingSignupAttempts.get(key);
    if (existing) return existing;

    const authEpoch = this.authAuthority.captureEpoch();
    const headers = this.buildAuthAttemptHeaders();
    const request$ = this.http
      .post<{ token?: string; user?: User }>(`${this.base}/signup`, data, { withCredentials: true, headers })
      .pipe(
        tap((res) => {
          this.authAuthority.noteSessionHintPresent();
          if (res.user && this.authAuthority.isCurrentEpoch(authEpoch)) {
            this.user.set(this.cloneUser(res.user));
          }
          this.attemptInsights?.notifyAuthSessionStarted();
        }),
        switchMap(() => this.hydrateAuthenticatedUser('signup', { broadcastLogin: true })),
        finalize(() => this.pendingSignupAttempts.delete(key)),
        shareReplay(1)
      );
    this.pendingSignupAttempts.set(key, request$);
    return request$;
  }

  login(data: { emailOrUsername: string; password: string }) {
    const key = this.buildLoginAttemptKey(data);
    const existing = this.pendingLoginAttempts.get(key);
    if (existing) return existing;

    const authEpoch = this.authAuthority.captureEpoch();
    const headers = this.buildAuthAttemptHeaders();
    const request$ = this.http
      .post<{ token?: string; user?: User }>(`${this.base}/login`, data, { withCredentials: true, headers })
      .pipe(
        tap((res) => {
          this.authAuthority.noteSessionHintPresent();
          // optional: keep UI snappy if backend returns user
          if (res.user && this.authAuthority.isCurrentEpoch(authEpoch)) {
            this.user.set(this.cloneUser(res.user));
          }
          this.attemptInsights?.notifyAuthSessionStarted();
        }),
        // ✅ always hydrate full user (solvedQuestionIds, stats, billing, etc.)
        switchMap(() => this.hydrateAuthenticatedUser('login', { broadcastLogin: true })),
        finalize(() => this.pendingLoginAttempts.delete(key)),
        shareReplay(1)
      );
    this.pendingLoginAttempts.set(key, request$);
    return request$;
  }

  logout() {
    this.authAuthority.forceSignOut('logout');
    this.meSeq++;
    return this.http
      .post<void>(`${this.base}/logout`, {}, { withCredentials: true })
      .pipe(catchError(() => of(void 0)));
  }

  /** GET /api/auth/me */
  fetchMe(options?: { broadcastLogin?: boolean }): Observable<User | null> {
    this.pendingMeBroadcast = this.pendingMeBroadcast || options?.broadcastLogin === true;

    const existing = this.pendingMeRequest$;
    if (existing) return existing;

    const seq = ++this.meSeq;
    const authEpoch = this.authAuthority.captureEpoch();

    const request$ = this.http
      .get<User>(`${this.base}/me`, { withCredentials: true })
      .pipe(
        map((u) => {
          if (!this.canApplyAuthResponse(seq, authEpoch)) return null;
          const cloned = this.cloneUser(u);
          this.authAuthority.commitAuthenticated({ broadcast: this.pendingMeBroadcast });
          this.user.set(cloned);
          this.attemptInsights?.notifyAuthSessionStarted();
          return cloned;
        }),
        catchError((err) => {
          if (!this.canApplyAuthResponse(seq, authEpoch)) return of(null);
          // If session cookie is missing/expired, clear user.
          if (err?.status === 401 || err?.status === 403) {
            this.authAuthority.forceSignOut('session_expired');
            return of(null);
          }
          return throwError(() => err);
        }),
        finalize(() => {
          if (this.pendingMeRequest$ === request$) {
            this.pendingMeRequest$ = null;
            this.pendingMeBroadcast = false;
          }
        }),
        shareReplay(1)
      );

    this.pendingMeRequest$ = request$;
    return request$;
  }

  /** GET /api/auth/me with status (used by billing success polling). */
  fetchMeStatus(): Observable<{ user: User | null; status: number }> {
    const seq = ++this.meSeq;
    const authEpoch = this.authAuthority.captureEpoch();
    return this.http
      .get<User>(`${this.base}/me`, { withCredentials: true, observe: 'response' })
      .pipe(
        map((res) => {
          if (this.canApplyAuthResponse(seq, authEpoch) && res.body) {
            this.authAuthority.commitAuthenticated();
            const cloned = this.cloneUser(res.body);
            this.user.set(cloned);
            this.attemptInsights?.notifyAuthSessionStarted();
            return { user: cloned, status: res.status };
          }
          return { user: null, status: res.status };
        }),
        catchError((err) => {
          if (!this.canApplyAuthResponse(seq, authEpoch)) return of({ user: null, status: err?.status ?? 0 });
          if (err?.status === 401 || err?.status === 403) {
            this.authAuthority.forceSignOut('session_expired');
            return of({ user: null, status: err.status });
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
    const provider = resolvePaymentsProvider(environment);
    const query = provider ? `?provider=${encodeURIComponent(provider)}` : '';
    return this.http.get<{ url: string }>(apiUrl(`/billing/manage-url${query}`), { withCredentials: true });
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
  oauthStart(
    provider: 'google' | 'github',
    mode: 'login' | 'signup' = 'login',
    redirectTo?: string | null,
  ) {
    const base = this.frontendBase || (typeof window !== 'undefined' ? window.location.origin : '');
    const redirectUri = `${base}/auth/callback`;
    const state = (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`;
    const safeRedirect = sanitizeRedirectTarget(redirectTo, '');
    try {
      sessionStorage.setItem(AuthService.OAUTH_STATE_KEY, state);
      sessionStorage.setItem(AuthService.OAUTH_MODE_KEY, mode);
      if (safeRedirect) sessionStorage.setItem(AuthService.OAUTH_REDIRECT_KEY, safeRedirect);
      else sessionStorage.removeItem(AuthService.OAUTH_REDIRECT_KEY);
    } catch { }

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
    const expected = sessionStorage.getItem(AuthService.OAUTH_STATE_KEY);
    if (qp['state'] && expected && qp['state'] !== expected) {
      return throwError(() => new Error('Invalid OAuth state'));
    }
    try {
      sessionStorage.removeItem(AuthService.OAUTH_STATE_KEY);
    } catch { }

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

    const seq = ++this.meSeq;
    const authEpoch = this.authAuthority.captureEpoch();

    return me$.pipe(
      map((u) => {
        if (!this.canApplyAuthResponse(seq, authEpoch)) return null;
        const cloned = this.cloneUser(u);
        this.authAuthority.commitAuthenticated({ broadcast: true });
        this.user.set(cloned);
        return cloned;
      }),
      catchError((error) => {
        if (this.canApplyAuthResponse(seq, authEpoch)) {
          this.authAuthority.forceSignOut('session_expired');
        }
        if (error?.status === 401 || error?.status === 403) {
          return throwError(() => ({
            status: error.status,
            error: buildSessionBootstrapError('oauth'),
          }));
        }
        return throwError(() => error);
      }),
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

  consumeOAuthRedirect(fallback = '/dashboard'): string {
    try {
      const stored = sessionStorage.getItem(AuthService.OAUTH_REDIRECT_KEY);
      sessionStorage.removeItem(AuthService.OAUTH_REDIRECT_KEY);
      return sanitizeRedirectTarget(stored, fallback);
    } catch {
      return fallback;
    }
  }

  consumeOAuthMode(): 'login' | 'signup' | null {
    try {
      const stored = sessionStorage.getItem(AuthService.OAUTH_MODE_KEY);
      sessionStorage.removeItem(AuthService.OAUTH_MODE_KEY);
      return stored === 'login' || stored === 'signup' ? stored : null;
    } catch {
      return null;
    }
  }

  forceSignOut(reason: 'logout' | 'session_expired' = 'session_expired'): void {
    this.authAuthority.forceSignOut(reason);
  }

  private canApplyAuthResponse(seq: number, authEpoch: number): boolean {
    return this.meSeq === seq && this.authAuthority.isCurrentEpoch(authEpoch);
  }

  private buildAuthAttemptHeaders(): HttpHeaders {
    const requestId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    return new HttpHeaders({
      [AuthService.AUTH_CONTEXT_HEADER]: this.authAuthority.getContextId(),
      [AuthService.AUTH_REQUEST_HEADER]: requestId,
    });
  }

  private buildLoginAttemptKey(data: { emailOrUsername: string; password: string }): string {
    return [
      'login',
      String(data.emailOrUsername || '').trim().toLowerCase(),
      String(data.password || ''),
    ].join('|');
  }

  private buildSignupAttemptKey(data: { email: string; username: string; password: string }): string {
    return [
      'signup',
      String(data.email || '').trim().toLowerCase(),
      String(data.username || '').trim(),
      String(data.password || ''),
    ].join('|');
  }

  private hydrateAuthenticatedUser(
    context: AuthBootstrapContext,
    options?: { broadcastLogin?: boolean },
  ): Observable<User> {
    return this.fetchMe(options).pipe(
      switchMap((user) => {
        if (user) return of(user);
        const bootstrapError = buildSessionBootstrapError(context);
        return throwError(() => ({
          status: 401,
          error: bootstrapError,
        }));
      }),
      catchError((error) => {
        if (error?.status === 401 || error?.status === 403) {
          return throwError(() => ({
            status: error.status,
            error: buildSessionBootstrapError(context),
          }));
        }
        return throwError(() => error);
      }),
    );
  }

  private handleAuthorityEvent(event: AuthSyncEvent): void {
    if (event.type === 'login') {
      if (event.local) return;
      this.authAuthority.noteSessionHintPresent();
      this.fetchMe().subscribe({ error: () => undefined });
      return;
    }

    this.meSeq++;
    this.user.set(null);
  }

}
