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

  form = this.fb.group({
    email: ['', [Validators.required]],    // can be email OR username
    password: ['', [Validators.required]],
  });

  constructor(
    private fb: FormBuilder,
    public auth: AuthService,
    private router: Router
  ) { }

  submit() {
    if (this.loading || this.form.invalid) return;

    this.loading = true;
    this.error = '';

    const { email, password } = this.form.value as {
      email: string;
      password: string;
    };

    // backend expects { emailOrUsername, password }
    this.auth
      .login({ emailOrUsername: email.trim(), password })
      .subscribe({
        next: () => this.router.navigateByUrl('/dashboard'),
        error: (err) => {
          // show a friendly message
          this.error =
            err?.error?.error ||
            (err?.status === 401 ? 'Invalid credentials' : 'Login failed');
          this.loading = false;
        },
      });
  }

  continueWithGoogle() {
    this.auth.oauthStart('google', 'login');
  }
}
