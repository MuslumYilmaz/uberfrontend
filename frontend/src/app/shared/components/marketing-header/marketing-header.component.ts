import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { isProActive } from '../../../core/utils/entitlements.util';

@Component({
  selector: 'app-marketing-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./marketing-header.component.css'],
  template: `
    <header class="famh-topbar" role="banner">
      <div class="famh-shell">
        <a class="famh-brand" routerLink="/">FrontendAtlas</a>

        <nav class="famh-nav" aria-label="Primary">
          <a class="famh-link" routerLink="/coding">Browse coding</a>
          <a class="famh-link" routerLink="/interview-questions">Interview Questions</a>
          <a class="famh-link" *ngIf="!isPro()" routerLink="/pricing">Pricing</a>
        </nav>

        <div class="famh-actions">
          <a class="famh-link" *ngIf="auth.isLoggedIn()" routerLink="/dashboard">Dashboard</a>
          <a class="famh-link" *ngIf="auth.isLoggedIn()" routerLink="/profile">Profile</a>
          <a class="famh-link" *ngIf="!auth.isLoggedIn()" routerLink="/auth/login">Log in</a>
          <a class="famh-cta" [routerLink]="ctaLink()">{{ ctaLabel() }}</a>
        </div>
      </div>
    </header>
  `,
})
export class MarketingHeaderComponent {
  readonly auth = inject(AuthService);
  readonly isPro = computed(() => isProActive(this.auth.user()));
  readonly ctaLabel = computed(() => (this.auth.isLoggedIn() ? 'Open dashboard' : 'Start free'));
  readonly ctaLink = computed(() => (this.auth.isLoggedIn() ? '/dashboard' : '/auth/signup'));
}
