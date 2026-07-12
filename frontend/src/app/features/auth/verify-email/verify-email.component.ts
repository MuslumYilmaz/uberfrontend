import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { take } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { FaButtonComponent } from '../../../shared/ui/button/fa-button.component';

const TOKEN_STORAGE_KEY = 'fa:email-verification-token';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule, FaButtonComponent],
  styleUrls: ['./verify-email.component.css'],
  template: `
    <main class="verify-shell" data-testid="verify-email-page">
      <section class="verify-card" aria-live="polite">
        <h1>{{ success() ? 'Email verified' : 'Verify your email' }}</h1>
        <p *ngIf="loading()">Checking your verification link…</p>
        <p class="verify-success" *ngIf="success()" data-testid="verify-email-success">
          Your email is verified and your account is ready.
        </p>
        <p class="verify-error" *ngIf="error()" data-testid="verify-email-error">{{ error() }}</p>
        <div class="verify-actions" *ngIf="!loading()">
          <a faButton variant="primary" routerLink="/profile" *ngIf="success()">Go to profile</a>
          <button faButton variant="primary" (click)="confirm()" *ngIf="error() && canRetry()">Try again</button>
          <a faButton variant="neutral" routerLink="/profile" [queryParams]="{ tab: 'account' }" *ngIf="error()">
            Email settings
          </a>
        </div>
      </section>
    </main>
  `,
})
export class VerifyEmailComponent implements OnInit {
  loading = signal(true);
  success = signal(false);
  error = signal<string | null>(null);
  canRetry = signal(false);

  private token = '';
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.captureAndScrubToken();
    this.token = sessionStorage.getItem(TOKEN_STORAGE_KEY) || '';
    if (!this.token) {
      this.loading.set(false);
      this.error.set('This verification link is missing or no longer available.');
      return;
    }

    this.auth.ensureMe().pipe(take(1)).subscribe({
      next: (user) => {
        if (!user) {
          this.router.navigate(['/auth/login'], { queryParams: { redirectTo: '/verify-email' } });
          return;
        }
        this.confirm();
      },
      error: () => {
        this.router.navigate(['/auth/login'], { queryParams: { redirectTo: '/verify-email' } });
      },
    });
  }

  confirm(): void {
    if (!this.token) return;
    this.loading.set(true);
    this.error.set(null);
    this.canRetry.set(false);
    this.auth.confirmEmailVerification(this.token).pipe(take(1)).subscribe({
      next: () => {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        this.loading.set(false);
        this.success.set(true);
      },
      error: (error) => {
        this.loading.set(false);
        this.error.set(error?.error?.error || 'We could not verify this email.');
        const status = Number(error?.status || 0);
        if (status === 401 || status === 403) {
          this.router.navigate(['/auth/login'], { queryParams: { redirectTo: '/verify-email' } });
          return;
        }
        if (status === 409 && error?.error?.code === 'EMAIL_VERIFICATION_PENDING') {
          this.canRetry.set(true);
          return;
        }
        this.canRetry.set(status === 0 || status >= 500);
        if (status >= 400 && status < 500) {
          sessionStorage.removeItem(TOKEN_STORAGE_KEY);
          this.token = '';
        }
      },
    });
  }

  private captureAndScrubToken(): void {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = params.get('token') || '';
    if (token) sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
  }
}
