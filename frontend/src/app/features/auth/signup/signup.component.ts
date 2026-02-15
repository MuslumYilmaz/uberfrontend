import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { sanitizeRedirectTarget } from '../../../core/utils/redirect.util';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent {
  loading = false;
  error = '';
  submitted = false;
  redirectTo = '/dashboard';
  redirectToPresent = false;

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
    this.analytics.track('signup_started', {
      method: 'password',
      redirect_to_present: this.redirectToPresent,
    });
    this.auth.signup({ email, username, password }).subscribe({
      next: () => {
        this.analytics.track('signup_completed', {
          method: 'password',
          redirect_to_present: this.redirectToPresent,
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
            this.error = data.error || 'Email or username already in use';
          }
        } else {
          this.error = data.error || 'Sign up failed';
        }
        this.loading = false;
      }
    });
  }

  continueWithGoogle() {
    this.analytics.track('signup_started', {
      method: 'oauth_google',
      redirect_to_present: this.redirectToPresent,
    });
    this.auth.oauthStart('google', 'signup', this.redirectTo);
  }

  continueWithGithub() {
    this.analytics.track('signup_started', {
      method: 'oauth_github',
      redirect_to_present: this.redirectToPresent,
    });
    this.auth.oauthStart('github', 'signup', this.redirectTo);
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
