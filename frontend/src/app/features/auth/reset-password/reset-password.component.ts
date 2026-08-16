import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { getAuthDisplayError } from '../../../core/utils/auth-error.util';
import { FaButtonComponent } from '../../../shared/ui/button/fa-button.component';

const RESET_TOKEN_STORAGE_KEY = 'fa:password-reset-token';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { mismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FaButtonComponent],
  template: `
    <main class="verify-shell" data-testid="reset-password-page">
      <section class="verify-card" aria-labelledby="reset-password-title">
        <h1 id="reset-password-title">Choose a new password</h1>

        <p class="verify-error" role="alert" *ngIf="!token && !success" data-testid="reset-password-missing">
          This reset link is missing or no longer available.
        </p>

        <form *ngIf="token && !success" [formGroup]="form" (ngSubmit)="submit()" class="recovery-form" novalidate>
          <label class="recovery-field" for="reset-password-password">New password</label>
          <input
            id="reset-password-password"
            name="newPassword"
            type="password"
            autocomplete="new-password"
            formControlName="password"
            required
            data-testid="reset-password-password"
            [attr.aria-invalid]="showPasswordError ? 'true' : null"
            [attr.aria-describedby]="showPasswordError ? 'reset-password-password-error' : null" />
          <p id="reset-password-password-error" class="verify-error" *ngIf="showPasswordError">
            Use at least 8 characters with a letter and a number.
          </p>

          <label class="recovery-field" for="reset-password-confirm">Confirm new password</label>
          <input
            id="reset-password-confirm"
            name="confirmPassword"
            type="password"
            autocomplete="new-password"
            formControlName="confirmPassword"
            required
            data-testid="reset-password-confirm"
            [attr.aria-invalid]="showConfirmError ? 'true' : null"
            [attr.aria-describedby]="showConfirmError ? 'reset-password-confirm-error' : null" />
          <p id="reset-password-confirm-error" class="verify-error" *ngIf="showConfirmError">
            {{ form.hasError('mismatch') ? 'Passwords do not match.' : 'Confirm your new password.' }}
          </p>

          <p class="verify-error" role="alert" *ngIf="error" data-testid="reset-password-error">{{ error }}</p>
          <button faButton variant="primary" type="submit" [disabled]="loading" data-testid="reset-password-submit">
            {{ loading ? 'Updating…' : 'Update password' }}
          </button>
        </form>

        <div *ngIf="success" class="recovery-status" role="status" aria-live="polite" data-testid="reset-password-success">
          <p>Your password was updated. Sign in again on all devices.</p>
        </div>

        <div class="verify-actions" *ngIf="success || !token">
          <a faButton variant="primary" routerLink="/auth/login">Go to sign in</a>
          <a faButton variant="neutral" routerLink="/auth/forgot-password" *ngIf="!token && !success">Request a new link</a>
        </div>
      </section>
    </main>
  `,
  styleUrls: [
    '../verify-email/verify-email.component.css',
    '../forgot-password/password-recovery.component.css',
  ],
})
export class ResetPasswordComponent implements OnInit {
  loading = false;
  submitted = false;
  success = false;
  error = '';
  token = '';

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordsMatch });

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  get showPasswordError(): boolean {
    return this.submitted && this.form.controls.password.invalid;
  }

  get showConfirmError(): boolean {
    return this.submitted && (this.form.controls.confirmPassword.invalid || this.form.hasError('mismatch'));
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const fragmentToken = params.get('token') || '';
    if (fragmentToken) sessionStorage.setItem(RESET_TOKEN_STORAGE_KEY, fragmentToken);
    this.token = sessionStorage.getItem(RESET_TOKEN_STORAGE_KEY) || '';
    window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
  }

  submit(): void {
    if (this.loading || !this.token) return;
    this.submitted = true;
    if (this.form.invalid) return;

    this.loading = true;
    this.error = '';
    this.auth.confirmPasswordReset(this.token, this.form.controls.password.value).subscribe({
      next: () => {
        sessionStorage.removeItem(RESET_TOKEN_STORAGE_KEY);
        this.token = '';
        this.loading = false;
        this.success = true;
      },
      error: (error) => {
        this.loading = false;
        this.error = getAuthDisplayError(error, 'We could not reset your password. Please try again.');
        if (error?.error?.code === 'PASSWORD_RESET_INVALID') {
          sessionStorage.removeItem(RESET_TOKEN_STORAGE_KEY);
          this.token = '';
        }
      },
    });
  }
}
