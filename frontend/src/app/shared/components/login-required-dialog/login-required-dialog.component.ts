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

/**
 * The account step before a purchase: what is being bought and paid today, why the account comes first, and the
 * purchase terms. Only the pricing checkout passes it; every other prompt keeps its two-button layout.
 */
export type AuthPromptAccountStep = { kicker: string; reason: string; assurance: string };

@Component({
    selector: 'app-login-required-dialog',
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

    /* Grey on grey text needs the underline to read as a link (axe link-in-text-block). */
    .auth-prompt__disclosure a {
      color: var(--uf-text-secondary);
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .auth-prompt__heading { display: grid; gap: 8px; min-width: 0; }

    .auth-prompt__kicker {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--uf-text-secondary);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      line-height: 1.4;
      text-transform: uppercase;
    }

    .auth-prompt__step {
      flex: none;
      width: 22px;
      height: 22px;
      border-radius: 999px;
      display: inline-grid;
      place-items: center;
      background: var(--uf-accent);
      color: var(--uf-bg);
      font-size: 12px;
      letter-spacing: 0;
    }

    .auth-prompt__title--step {
      color: var(--uf-text-primary);
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.01em;
      line-height: 1.2;
    }

    .auth-prompt__body--step { grid-template-columns: minmax(0, 1fr); }

    /* The account step stacks the three ways in, then the sign-in line, the reason and the purchase terms. */
    .auth-prompt__actions--step {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 10px;
    }

    .auth-prompt__actions--step button[faButton] { width: 100%; }

    .auth-prompt__account {
      display: grid;
      gap: 6px;
      margin-top: 4px;
      padding-top: 12px;
      border-top: 1px solid var(--uf-border-subtle);
      text-align: left;
    }

    .auth-prompt__account p,
    .auth-prompt__assurance { margin: 0; line-height: 1.5; text-align: left; }

    .auth-prompt__signin { color: var(--uf-text-secondary); font-size: 14px; }

    /* A sign-in action that reads as a link inside its sentence. */
    .auth-prompt__link {
      padding: 0;
      border: 0;
      background: none;
      color: var(--uf-accent);
      font: inherit;
      font-weight: 600;
      text-decoration: underline;
      text-underline-offset: 3px;
      cursor: pointer;
    }

    .auth-prompt__link:focus-visible {
      outline: 2px solid var(--uf-accent);
      outline-offset: 2px;
      border-radius: 4px;
    }

    .auth-prompt__reason,
    .auth-prompt__assurance { color: var(--uf-text-tertiary); font-size: 12px; text-wrap: pretty; }

    @media (max-width: 600px) {
      .auth-prompt__body { grid-template-columns: 1fr; }
      .auth-prompt__actions { flex-direction: column-reverse; }
      .auth-prompt__actions button[faButton] { width: 100%; }
      .auth-prompt__title--step { font-size: 20px; }
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
      [width]="accountStep ? 'min(520px, calc(100vw - 32px))' : 'min(560px, calc(100vw - 32px))'"
      closeAriaLabel="Close account prompt">
      <span faDialogHeader class="auth-prompt__heading">
        <span class="auth-prompt__kicker" *ngIf="accountStep as step">
          <span class="auth-prompt__step" aria-hidden="true">1</span>
          <span data-testid="login-required-kicker">{{ step.kicker }}</span>
        </span>
        <span data-testid="login-required-title" [class.auth-prompt__title--step]="accountStep">{{ title }}</span>
      </span>

      <div class="auth-prompt__body" [class.auth-prompt__body--step]="accountStep" data-testid="login-required-dialog">
        <span class="auth-prompt__icon" aria-hidden="true" *ngIf="!accountStep"><i class="pi pi-user-plus"></i></span>
        <p data-testid="login-required-body">{{ body }}</p>
      </div>

      <div
        faDialogFooter
        class="auth-prompt__actions"
        [class.auth-prompt__actions--direct]="directAuthActions && !accountStep"
        [class.auth-prompt__actions--step]="directAuthActions && accountStep"
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
            *ngIf="!accountStep"
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
          <ng-container *ngIf="accountStep as step">
            <div class="auth-prompt__account">
              <p class="auth-prompt__signin">
                Already have an account?
                <button
                  type="button"
                  class="auth-prompt__link"
                  data-testid="login-required-email-login"
                  (click)="choose('login')">Sign in</button>
              </p>
              <p class="auth-prompt__reason" data-testid="login-required-reason">{{ step.reason }}</p>
            </div>
            <p class="auth-prompt__assurance" data-testid="login-required-assurance">{{ step.assurance }}</p>
          </ng-container>
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
  `
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
  /** Shown with the direct actions only; see AuthPromptAccountStep. */
  @Input() accountStep: AuthPromptAccountStep | null = null;

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
