import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-oauth-callback',
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-neutral-900 text-gray-100 p-6">
      <div class="max-w-md w-full text-center">
        <h1 class="text-xl font-semibold mb-3">Signing you in…</h1>
        <p class="text-white/70">Completing Google authentication.</p>
        <p *ngIf="error" class="mt-4 text-red-400">{{ error }}</p>
      </div>
    </div>
  `
})
export class OAuthCallbackComponent implements OnInit {
  error = '';

  constructor(private route: ActivatedRoute, private router: Router, private auth: AuthService) { }

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParams || {};
    this.auth.completeOAuthCallback(qp).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (e) => this.error = e?.message || 'OAuth failed'
    });
  }
}
