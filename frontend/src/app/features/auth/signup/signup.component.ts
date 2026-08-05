import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { classifyAuthFailure, normalizeAuthAnalyticsSource } from '../../../core/utils/auth-analytics.util';
import { getAuthDisplayError } from '../../../core/utils/auth-error.util';
import { sanitizeRedirectTarget } from '../../../core/utils/redirect.util';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent implements OnInit {
  loading = false;
  error = '';
  submitted = false;
  redirectTo = '/dashboard';
  redirectToPresent = false;
  analyticsSource = 'direct';
  authSwitchQueryParams: Record<string, string> = { src: 'direct' };

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    passwords: this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)]],
      confirmPassword: ['', [Validators.required]],
    })
  }, { validators: this.matchPasswords });

  constructor(
    private fb: FormBuilder,
    public auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private analytics: AnalyticsService,
  ) {
    this.redirectTo = sanitizeRedirectTarget(this.route.snapshot.queryParamMap.get('redirectTo'));
    this.redirectToPresent = this.redirectTo !== '/dashboard';
    this.analyticsSource = normalizeAuthAnalyticsSource(this.route.snapshot.queryParamMap.get('src'));
    this.authSwitchQueryParams = {
      ...(this.redirectToPresent ? { redirectTo: this.redirectTo } : {}),
      src: this.analyticsSource,
    };
  }

  ngOnInit(): void {
    this.analytics.track('auth_page_viewed', this.authAnalyticsParams('password'));
  }

  get emailCtrl() { return this.form.get('email'); }
  get usernameCtrl() { return this.form.get('username'); }
  get passwordCtrl() { return this.form.get('passwords.password'); }
  get confirmCtrl() { return this.form.get('passwords.confirmPassword'); }

  showError(ctrl: any) {
    return !!ctrl && (ctrl.touched || this.submitted);
  }

  matchPasswords(group: any) {
    const p = group.get('passwords.password')?.value;
    const c = group.get('passwords.confirmPassword')?.value;
    return p && c && p !== c ? { mismatch: true } : null;
  }

  submit() {
    if (this.loading) return;

    this.submitted = true;

    const emailCtrl = this.emailCtrl;
    const usernameCtrl = this.usernameCtrl;
    const email = String(emailCtrl?.value ?? '').trim();
    const username = String(usernameCtrl?.value ?? '').trim();

    if (emailCtrl && emailCtrl.value !== email) emailCtrl.setValue(email);
    if (usernameCtrl && usernameCtrl.value !== username) usernameCtrl.setValue(username);
    this.clearServerErrors();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const passwords = this.form.get('passwords')?.value as any;
    const password = String(passwords?.password ?? '');

    this.loading = true;
    this.error = '';
    this.analytics.track('auth_submit_started', this.authAnalyticsParams('password'));
    this.auth.signup({ email, username, password }).subscribe({
      next: () => {
        this.analytics.track('sign_up', {
          ...this.authAnalyticsParams('password'),
          method: 'password',
        });
        this.router.navigateByUrl(this.redirectTo);
      },
      error: (err: any) => {
        const data = err?.error || {};
        if (err?.status === 409) {
          const fields = data.fields || {};
          if (fields.email) this.setCtrlError(this.emailCtrl, 'duplicate');
          if (fields.username) this.setCtrlError(this.usernameCtrl, 'duplicate');
          if (!fields.email && !fields.username) {
            this.error = getAuthDisplayError(err, 'Email or username already in use');
          }
        } else {
          this.error = getAuthDisplayError(err, 'Sign up failed');
        }
        this.analytics.track('auth_submit_failed', {
          ...this.authAnalyticsParams('password'),
          failure_reason: classifyAuthFailure(err, 'signup'),
        });
        this.loading = false;
      }
    });
  }

  continueWithGoogle() {
    this.startOAuth('google');
  }

  continueWithGithub() {
    this.startOAuth('github');
  }

  private startOAuth(provider: 'google' | 'github'): void {
    this.analytics.track('auth_submit_started', this.authAnalyticsParams(provider));
    this.auth.oauthStart(provider, 'signup', this.redirectTo, this.analyticsSource);
  }

  private authAnalyticsParams(provider: 'password' | 'google' | 'github'): Record<string, unknown> {
    return {
      auth_mode: 'signup',
      provider,
      src: this.analyticsSource,
      redirect_to_present: this.redirectToPresent,
    };
  }

  private setCtrlError(ctrl: any, key: string) {
    if (!ctrl) return;
    const next = { ...(ctrl.errors || {}), [key]: true };
    ctrl.setErrors(next);
  }

  private clearServerErrors() {
    this.removeCtrlError(this.emailCtrl, 'duplicate');
    this.removeCtrlError(this.usernameCtrl, 'duplicate');
  }

  private removeCtrlError(ctrl: any, key: string) {
    if (!ctrl?.errors || !ctrl.errors[key]) return;
    const { [key]: _removed, ...rest } = ctrl.errors;
    ctrl.setErrors(Object.keys(rest).length ? rest : null);
  }
}
