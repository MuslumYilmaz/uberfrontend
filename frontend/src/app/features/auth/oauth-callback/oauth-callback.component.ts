import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { getAuthDisplayError } from '../../../core/utils/auth-error.util';
import { sanitizeRedirectTarget } from '../../../core/utils/redirect.util';

@Component({
  standalone: true,
  selector: 'app-oauth-callback',
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-neutral-900 text-gray-100 p-6" data-testid="oauth-callback-page">
      <div class="max-w-md w-full text-center">
        <h1 class="text-xl font-semibold mb-3">Signing you in…</h1>
        <p class="text-white/70">Completing Google authentication.</p>
        <p *ngIf="error" class="mt-4 text-red-400" data-testid="oauth-callback-error">{{ error }}</p>
        <div *ngIf="error" class="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            class="fa-btn fa-btn--primary"
            data-testid="oauth-callback-login"
            (click)="goToLogin()">
            Go to sign in
          </button>
        </div>
      </div>
    </div>
  `
})
export class OAuthCallbackComponent implements OnInit {
  error = '';
  private redirectTo = '/dashboard';
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private analytics: AnalyticsService,
  ) { }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    const qp = this.route.snapshot.queryParams || {};
    const queryRedirect = sanitizeRedirectTarget(this.route.snapshot.queryParamMap.get('redirectTo'));
    const oauthMode = this.auth.consumeOAuthMode();
    const redirectTo = this.auth.consumeOAuthRedirect(queryRedirect);
    this.redirectTo = redirectTo;
    this.auth.completeOAuthCallback(qp).subscribe({
      next: () => {
        if (oauthMode === 'signup') {
          this.analytics.track('signup_completed', {
            method: 'oauth',
            redirect_to_present: redirectTo !== '/dashboard',
          });
        }
        this.router.navigateByUrl(redirectTo);
      },
      error: (e) => {
        this.error = getAuthDisplayError(
          e,
          e?.message || 'We could not finish authentication. Please try again.',
        );
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login'], {
      queryParams: { redirectTo: this.redirectTo },
    });
  }
}
