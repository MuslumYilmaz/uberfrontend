import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  loading = false;
  error = '';
  submitted = false;

  form = this.fb.group({
    email: ['', [Validators.required]],    // can be email OR username
    password: ['', [Validators.required]],
  });

  constructor(
    private fb: FormBuilder,
    public auth: AuthService,
    private router: Router
  ) { }

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

    const { password } = this.form.value as {
      email: string;
      password: string;
    };

    // backend expects { emailOrUsername, password }
    this.auth
      .login({ emailOrUsername: emailValue, password })
      .subscribe({
        next: () => this.router.navigateByUrl('/dashboard'),
        error: (err) => {
          const data = err?.error || {};
          if (err?.status === 401) {
            this.form.setErrors({ ...(this.form.errors || {}), invalidCredentials: true });
            this.error = data.error || 'Invalid credentials';
          } else {
            this.error = data.error || 'Login failed';
          }
          this.loading = false;
        },
      });
  }

  continueWithGoogle() {
    this.auth.oauthStart('google', 'login');
  }

  private clearFormError(key: string) {
    const errs = this.form.errors;
    if (!errs || !errs[key]) return;
    const { [key]: _removed, ...rest } = errs;
    this.form.setErrors(Object.keys(rest).length ? rest : null);
  }
}
