import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = 'http://localhost:3001/api/auth';
  constructor(private http: HttpClient) { }

  signup(data: { email: string; username: string; password: string }) {
    return this.http.post<{ token: string; user: any }>(`${this.base}/signup`, data)
      .pipe(tap(res => localStorage.setItem('auth_token', res.token)));
  }

  login(data: { emailOrUsername: string; password: string }) {
    return this.http.post<{ token: string; user: any }>(`${this.base}/login`, data)
      .pipe(tap(res => localStorage.setItem('auth_token', res.token)));
  }

  logout() { localStorage.removeItem('auth_token'); }
  get token() { return localStorage.getItem('auth_token'); }
}
