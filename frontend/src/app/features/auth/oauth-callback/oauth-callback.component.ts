import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { getAuthDisplayError } from '../../../core/utils/auth-error.util';
import { classifyAuthFailure } from '../../../core/utils/auth-analytics.util';
import { sanitizeRedirectTarget } from '../../../core/utils/redirect.util';

@Component({
  standalone: true,
  selector: 'app-oauth-callback',
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-neutral-900 text-gray-100 p-6" data-testid="oauth-callback-page">
      <div class="max-w-md w-full text-center">
        <h1 class="text-xl font-semibold mb-3">Signing you in…</h1>
        <p class="text-white/70">Completing authentication.</p>
        <p *ngIf="error" class="mt-4 text-red-400" data-testid="oauth-callback-error">{{ error }}</p>
        <div *ngIf="error" class="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            class="fa-btn fa-btn--primary"
            data-testid="oauth-callback-login"
            (click)="goToAuth()">
            {{ retryMode === 'signup' ? 'Go to sign up' : 'Go to sign in' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class OAuthCallbackComponent implements OnInit {
  error = '';
  private redirectTo = '/dashboard';
  private analyticsSource = 'direct';
  retryMode: 'login' | 'signup' = 'login';
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
    const oauthContext = this.auth.consumeOAuthContext(queryRedirect);
    this.redirectTo = oauthContext.redirectTo;
    this.analyticsSource = oauthContext.source;
    this.retryMode = oauthContext.mode === 'signup' ? 'signup' : 'login';
    this.auth.completeOAuthCallback(qp).subscribe({
      next: (completion) => {
        if (completion.action === 'signup' || completion.action === 'login') {
          this.analytics.track(completion.action === 'signup' ? 'sign_up' : 'login', {
            method: oauthContext.provider || 'oauth',
            provider: oauthContext.provider || 'unknown',
            auth_mode: completion.action,
            src: oauthContext.source,
            redirect_to_present: oauthContext.redirectTo !== '/dashboard',
          });
        }
        this.router.navigateByUrl(oauthContext.redirectTo);
      },
      error: (e) => {
        this.analytics.track('auth_submit_failed', {
          auth_mode: oauthContext.mode || 'login',
          provider: oauthContext.provider || 'unknown',
          src: oauthContext.source,
          redirect_to_present: oauthContext.redirectTo !== '/dashboard',
          failure_reason: classifyAuthFailure(e, oauthContext.mode || 'login'),
        });
        this.error = getAuthDisplayError(
          e,
          e?.message || 'We could not finish authentication. Please try again.',
        );
      }
    });
  }

  goToAuth(): void {
    this.router.navigate([`/auth/${this.retryMode}`], {
      queryParams: { redirectTo: this.redirectTo, src: this.analyticsSource },
    });
  }
}
