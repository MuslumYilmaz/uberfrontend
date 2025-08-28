import { HttpClient, HttpHeaders } from '@angular/common/http';
import { computed, effect, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';

export type Role = 'user' | 'admin';
export type Theme = 'dark' | 'light' | 'system';
export type Tech = 'javascript' | 'angular';

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
  prefs: UserPrefs;
  stats?: UserStats;
  billing?: Billing;
  coupons?: Array<{ code: string; scope: 'pro' | 'projects'; appliedAt: string }>;
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

  private authHeaders(): HttpHeaders {
    return new HttpHeaders(this.token ? { Authorization: `Bearer ${this.token}` } : {});
  }

  // ---------- API ----------
  signup(data: { email: string; username: string; password: string }) {
    return this.http.post<{ token: string; user: User }>(`${this.base}/signup`, data).pipe(
      tap((res) => {
        this.setToken(res.token);
        this.user.set(res.user);
      }),
      shareReplay(1)
    );
  }

  login(data: { emailOrUsername: string; password: string }) {
    return this.http.post<{ token: string; user: User }>(`${this.base}/login`, data).pipe(
      tap((res) => {
        this.setToken(res.token);
        this.user.set(res.user);
      }),
      shareReplay(1)
    );
  }

  logout() {
    this.setToken(null);
    this.user.set(null);
  }

  /** GET /api/auth/me */
  fetchMe(): Observable<User | null> {
    if (!this.token) return of(null);
    return this.http
      .get<User>(`${this.base}/me`, { headers: this.authHeaders() })
      .pipe(tap((u) => this.user.set(u)));
  }

  /** Lazy-load user when needed. */
  ensureMe(): Observable<User | null> {
    if (this.user()) return of(this.user());
    return this.fetchMe();
  }

  /** PUT /api/users/:id */
  updateProfile(id: string, data: Partial<Pick<User, 'username' | 'email' | 'bio' | 'avatarUrl' | 'prefs'>>) {
    return this.http
      .put<User>(`http://localhost:3001/api/users/${id}`, data, { headers: this.authHeaders() })
      .pipe(tap((u) => this.user.set(u)));
  }
}