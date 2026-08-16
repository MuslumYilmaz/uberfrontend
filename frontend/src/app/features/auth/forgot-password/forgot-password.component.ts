import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { getAuthDisplayError } from '../../../core/utils/auth-error.util';
import { FaButtonComponent } from '../../../shared/ui/button/fa-button.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FaButtonComponent],
  template: `
    <main class="verify-shell" data-testid="forgot-password-page">
      <section class="verify-card" aria-labelledby="forgot-password-title">
        <h1 id="forgot-password-title">Reset your password</h1>
        <p>Enter your account email. If an account matches, we’ll send a reset link.</p>

        <form *ngIf="!success" [formGroup]="form" (ngSubmit)="submit()" class="recovery-form" novalidate>
          <label class="recovery-field" for="forgot-password-email">Email</label>
          <input
            id="forgot-password-email"
            name="email"
            type="email"
            inputmode="email"
            autocomplete="email"
            formControlName="email"
            required
            data-testid="forgot-password-email"
            [attr.aria-invalid]="submitted && form.controls.email.invalid ? 'true' : null"
            [attr.aria-describedby]="submitted && form.controls.email.invalid ? 'forgot-password-email-error' : null" />
          <p id="forgot-password-email-error" class="verify-error" *ngIf="submitted && form.controls.email.invalid">
            Enter a valid email address.
          </p>
          <p class="verify-error" role="alert" *ngIf="error" data-testid="forgot-password-error">{{ error }}</p>
          <button faButton variant="primary" type="submit" [disabled]="loading" data-testid="forgot-password-submit">
            {{ loading ? 'Sending…' : 'Send reset link' }}
          </button>
        </form>

        <div *ngIf="success" class="recovery-status" role="status" aria-live="polite" data-testid="forgot-password-success">
          <p>If an account matches that email, a password reset link is on its way.</p>
        </div>

        <div class="verify-actions">
          <a faButton variant="neutral" routerLink="/auth/login">Back to sign in</a>
        </div>
      </section>
    </main>
  `,
  styleUrls: [
    '../verify-email/verify-email.component.css',
    './password-recovery.component.css',
  ],
})
export class ForgotPasswordComponent {
  loading = false;
  submitted = false;
  success = false;
  error = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  submit(): void {
    if (this.loading) return;
    this.submitted = true;
    const email = this.form.controls.email.value.trim();
    this.form.controls.email.setValue(email);
    if (this.form.invalid) return;

    this.loading = true;
    this.error = '';
    this.auth.requestPasswordReset(email).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
      },
      error: (error) => {
        this.loading = false;
        this.error = getAuthDisplayError(error, 'We could not submit this request. Please try again.');
      },
    });
  }
}
