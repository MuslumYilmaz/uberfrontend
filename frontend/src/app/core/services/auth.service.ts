import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = 'http://localhost:3001/api/auth';

  /** Reactive login state for UI bindings */
  isLoggedIn = signal<boolean>(!!localStorage.getItem('auth_token'));

  constructor(private http: HttpClient) {
    // Optional: keep in sync across tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'auth_token') {
        this.isLoggedIn.set(!!e.newValue);
      }
    });
  }

  private setToken(token: string | null) {
    if (token) {
      localStorage.setItem('auth_token', token);
      this.isLoggedIn.set(true);
    } else {
      localStorage.removeItem('auth_token');
      this.isLoggedIn.set(false);
    }
  }

  signup(data: { email: string; username: string; password: string }) {
    return this.http.post<{ token: string; user: any }>(`${this.base}/signup`, data)
      .pipe(tap(res => this.setToken(res.token)));
  }

  login(data: { emailOrUsername: string; password: string }) {
    return this.http.post<{ token: string; user: any }>(`${this.base}/login`, data)
      .pipe(tap(res => this.setToken(res.token)));
  }

  logout() {
    this.setToken(null);
  }

  get token() {
    return localStorage.getItem('auth_token');
  }

  /** Fetch the currently logged-in user */
  me(): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token}`);
    return this.http.get<any>(`${this.base}/me`, { headers });
  }

  /** Update the logged-in user's profile */
  updateUser(id: string, data: any): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token}`);
    return this.http.put<any>(`http://localhost:3001/api/users/${id}`, data, { headers });
  }
}