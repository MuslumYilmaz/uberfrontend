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
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loading = false;
  error = '';
  submitted = false;
  redirectTo = '/dashboard';
  redirectToPresent = false;
  analyticsSource = 'direct';
  authSwitchQueryParams: Record<string, string> = { src: 'direct' };

  form = this.fb.group({
    email: ['', [Validators.required]],    // can be email OR username
    password: ['', [Validators.required]],
  });

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
  get passwordCtrl() { return this.form.get('password'); }

  showError(ctrl: any) {
    return !!ctrl && (ctrl.touched || this.submitted);
  }

  submit() {
    if (this.loading) return;
    this.submitted = true;

    const emailCtrl = this.emailCtrl;
    const emailValue = String(emailCtrl?.value ?? '').trim();
    if (emailCtrl && emailCtrl.value !== emailValue) emailCtrl.setValue(emailValue);

    this.clearFormError('invalidCredentials');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    this.analytics.track('auth_submit_started', this.authAnalyticsParams('password'));

    const { password } = this.form.value as {
      email: string;
      password: string;
    };

    // backend expects { emailOrUsername, password }
    this.auth
      .login({ emailOrUsername: emailValue, password })
      .subscribe({
        next: () => {
          this.analytics.track('login', {
            ...this.authAnalyticsParams('password'),
            method: 'password',
          });
          this.router.navigateByUrl(this.redirectTo);
        },
        error: (err) => {
          if (err?.status === 401) {
            this.form.setErrors({ ...(this.form.errors || {}), invalidCredentials: true });
            this.error = getAuthDisplayError(err, 'Invalid credentials');
          } else {
            this.error = getAuthDisplayError(err, 'Login failed');
          }
          this.analytics.track('auth_submit_failed', {
            ...this.authAnalyticsParams('password'),
            failure_reason: classifyAuthFailure(err, 'login'),
          });
          this.loading = false;
        },
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
    this.auth.oauthStart(provider, 'login', this.redirectTo, this.analyticsSource);
  }

  private authAnalyticsParams(provider: 'password' | 'google' | 'github'): Record<string, unknown> {
    return {
      auth_mode: 'login',
      provider,
      src: this.analyticsSource,
      redirect_to_present: this.redirectToPresent,
    };
  }

  private clearFormError(key: string) {
    const errs = this.form.errors;
    if (!errs || !errs[key]) return;
    const { [key]: _removed, ...rest } = errs;
    this.form.setErrors(Object.keys(rest).length ? rest : null);
  }
}
