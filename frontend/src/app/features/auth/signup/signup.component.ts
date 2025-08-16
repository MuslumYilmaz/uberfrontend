import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent {
  loading = false;
  error = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    passwords: this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    })
  }, { validators: this.matchPasswords });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) { }

  get confirmCtrl() { return this.form.get('passwords.confirmPassword'); }

  matchPasswords(group: any) {
    const p = group.get('passwords.password')?.value;
    const c = group.get('passwords.confirmPassword')?.value;
    return p && c && p !== c ? { mismatch: true } : null;
  }

  submit() {
    if (this.form.invalid) return;
    const { email, username, passwords } = this.form.value as any;
    this.loading = true; this.error = '';
    this.auth.signup({ email, username, password: passwords.password }).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err: any) => { this.error = err.error?.error || 'Sign up failed'; this.loading = false; }
    });
  }
}
