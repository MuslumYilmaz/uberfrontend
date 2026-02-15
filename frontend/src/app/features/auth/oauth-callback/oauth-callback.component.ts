import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
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
      </div>
    </div>
  `
})
export class OAuthCallbackComponent implements OnInit {
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private analytics: AnalyticsService,
  ) { }

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParams || {};
    const queryRedirect = sanitizeRedirectTarget(this.route.snapshot.queryParamMap.get('redirectTo'));
    const oauthMode = this.auth.consumeOAuthMode();
    const redirectTo = this.auth.consumeOAuthRedirect(queryRedirect);
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
      error: (e) => this.error = e?.message || 'OAuth failed'
    });
  }
}
