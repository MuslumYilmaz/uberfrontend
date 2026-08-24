import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { sanitizeRedirectTarget } from '../../../core/utils/redirect.util';
import { FaButtonComponent } from '../../ui/button/fa-button.component';
import { FaDialogComponent } from '../../ui/dialog/fa-dialog.component';

export type AuthPromptContext =
  | 'coding_submit'
  | 'coding_pressure'
  | 'trivia_complete'
  | 'tradeoff_complete'
  | 'pricing_checkout'
  | 'unknown';

@Component({
  selector: 'app-login-required-dialog',
  standalone: true,
  imports: [CommonModule, RouterModule, FaButtonComponent, FaDialogComponent],
  styles: [`
    :host { display: block; }

    .auth-prompt__body {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 14px;
      align-items: start;
      color: var(--uf-text-secondary);
      line-height: 1.55;
    }

    .auth-prompt__icon {
      width: 40px;
      height: 40px;
      border: 1px solid var(--uf-border-subtle);
      border-radius: 8px;
      display: grid;
      place-items: center;
      color: var(--uf-accent);
      background: var(--uf-surface-muted);
    }

    .auth-prompt__body p { margin: 0; max-width: 52ch; }

    .auth-prompt__actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      width: 100%;
    }

    .auth-prompt__actions--direct {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .auth-prompt__actions--direct button { width: 100%; }

    .auth-prompt__disclosure {
      grid-column: 1 / -1;
      margin: 2px 0 0;
      color: var(--uf-text-tertiary);
      font-size: 12px;
      line-height: 1.45;
      text-align: left;
    }

    .auth-prompt__disclosure a { color: var(--uf-text-secondary); }

    @media (max-width: 600px) {
      .auth-prompt__body { grid-template-columns: 1fr; }
      .auth-prompt__actions { flex-direction: column-reverse; }
      .auth-prompt__actions button { width: 100%; }
      .auth-prompt__actions--direct { grid-template-columns: 1fr; }
      .auth-prompt__disclosure { grid-column: 1; }
    }
  `],
  template: `
    <fa-dialog
      [visible]="visible"
      (visibleChange)="onVisibleChange($event)"
      [modal]="true"
      [dismissableMask]="true"
      [closable]="true"
      [showFooter]="true"
      width="min(560px, calc(100vw - 32px))"
      closeAriaLabel="Close account prompt">
      <span faDialogHeader data-testid="login-required-title">{{ title }}</span>

      <div class="auth-prompt__body" data-testid="login-required-dialog">
        <span class="auth-prompt__icon" aria-hidden="true"><i class="pi pi-user-plus"></i></span>
        <p data-testid="login-required-body">{{ body }}</p>
      </div>

      <div
        faDialogFooter
        class="auth-prompt__actions"
        [class.auth-prompt__actions--direct]="directAuthActions"
        [attr.data-testid]="directAuthActions ? 'login-required-direct-actions' : null">
        <ng-container *ngIf="directAuthActions; else standardAuthActions">
          <button
            type="button"
            faButton
            variant="primary"
            data-testid="login-required-google"
            (click)="chooseOAuth('google')">
            Continue with Google
          </button>
          <button
            type="button"
            faButton
            variant="neutral"
            data-testid="login-required-github"
            (click)="chooseOAuth('github')">
            Continue with GitHub
          </button>
          <button
            type="button"
            faButton
            variant="neutral"
            data-testid="login-required-email-signup"
            (click)="choose('sign_up')">
            Continue with email
          </button>
          <button
            type="button"
            faButton
            variant="neutral"
            data-testid="login-required-email-login"
            (click)="choose('login')">
            Sign in with email
          </button>
          <p class="auth-prompt__disclosure">
            By continuing, you agree to the <a routerLink="/legal/terms">Terms</a> and
            acknowledge the <a routerLink="/legal/privacy">Privacy Policy</a>.
          </p>
        </ng-container>

        <ng-template #standardAuthActions>
          <button
            type="button"
            faButton
            variant="neutral"
            data-testid="login-required-login"
            (click)="choose('login')">
            {{ loginLabel }}
          </button>
          <button
            type="button"
            faButton
            variant="primary"
            data-testid="login-required-signup"
            (click)="choose('sign_up')">
            {{ signupLabel }}
          </button>
        </ng-template>
      </div>
    </fa-dialog>
  `,
})
export class LoginRequiredDialogComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() context: AuthPromptContext = 'unknown';
  @Input() title = 'Save your progress';
  @Input() body = 'Create a free account to keep this result and continue where you left off. Already have an account? Sign in.';
  @Input() signupLabel = 'Create free account';
  @Input() loginLabel = 'Sign in';
  @Input() redirectTo?: string;
  @Input() directAuthActions = false;
  @Input() offerVersion = 'pricing_baseline_v1';
  @Input() checkoutSurface: 'hosted_new_tab' | 'overlay' = 'hosted_new_tab';

  private shownForOpenCycle = false;
  private actionInFlight = false;

  constructor(
    private readonly router: Router,
    private readonly analytics: AnalyticsService,
    private readonly auth: AuthService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const visibleChange = changes['visible'];
    if (!visibleChange) return;
    if (visibleChange.currentValue === true && visibleChange.previousValue !== true) {
      this.trackShown();
    }
    if (visibleChange.currentValue === false) {
      this.shownForOpenCycle = false;
      this.actionInFlight = false;
    }
  }

  onVisibleChange(nextVisible: boolean): void {
    if (nextVisible) {
      this.visible = true;
      this.trackShown();
      this.visibleChange.emit(true);
      return;
    }

    if (this.visible && !this.actionInFlight) {
      this.trackAction('dismiss');
    }
    this.visible = false;
    this.visibleChange.emit(false);
    this.shownForOpenCycle = false;
    this.actionInFlight = false;
  }

  choose(action: 'sign_up' | 'login'): void {
    this.actionInFlight = true;
    this.trackAction(action);
    const redirectTo = sanitizeRedirectTarget(this.redirectTo || this.router.url || '/');
    const route = action === 'sign_up' ? '/auth/signup' : '/auth/login';
    const src = this.normalizedContext();
    this.visible = false;
    this.visibleChange.emit(false);
    this.router.navigate([route], { queryParams: { redirectTo, src } });
  }

  chooseOAuth(provider: 'google' | 'github'): void {
    this.actionInFlight = true;
    this.trackAction(provider);
    const redirectTo = sanitizeRedirectTarget(this.redirectTo || this.router.url || '/');
    const src = this.normalizedContext();
    this.visible = false;
    this.visibleChange.emit(false);
    this.auth.oauthStart(provider, 'signup', redirectTo, src);
  }

  private trackShown(): void {
    if (this.shownForOpenCycle) return;
    this.shownForOpenCycle = true;
    this.analytics.track('auth_prompt', {
      prompt_context: this.normalizedContext(),
      src: this.normalizedContext(),
      primary_action: 'sign_up',
      auth_state: 'guest',
      ...this.billingAnalyticsContext(),
    });
  }

  private trackAction(authAction: 'sign_up' | 'login' | 'google' | 'github' | 'dismiss'): void {
    this.analytics.track('auth_prompt_action', {
      prompt_context: this.normalizedContext(),
      src: this.normalizedContext(),
      primary_action: 'sign_up',
      auth_action: authAction,
      auth_state: 'guest',
      ...this.billingAnalyticsContext(),
    });
  }

  private normalizedContext(): AuthPromptContext {
    const value = String(this.context || '').trim().toLowerCase();
    switch (value) {
      case 'coding_submit':
      case 'coding_pressure':
      case 'trivia_complete':
      case 'tradeoff_complete':
      case 'pricing_checkout':
        return value;
      default:
        return 'unknown';
    }
  }

  private billingAnalyticsContext(): Record<string, string> {
    if (this.normalizedContext() !== 'pricing_checkout') return {};
    const offerVersion = String(this.offerVersion || '').trim().toLowerCase();
    return {
      offer_version: /^[a-z0-9][a-z0-9_-]{0,63}$/.test(offerVersion)
        ? offerVersion
        : 'pricing_baseline_v1',
      checkout_surface: this.checkoutSurface === 'overlay' ? 'overlay' : 'hosted_new_tab',
    };
  }
}
