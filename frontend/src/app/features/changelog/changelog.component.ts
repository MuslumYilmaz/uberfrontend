import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PUBLIC_CHANGELOG_ENTRIES } from '../../core/content/public-changelog';
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({
  standalone: true,
  selector: 'app-changelog',
  imports: [CommonModule, RouterModule],
  template: `
    <section class="changelog-page">
      <div class="changelog-wrap">
        <p class="kicker">Build in public</p>
        <h1>What changed this week</h1>
        <p class="subtitle">
          Weekly product updates for FrontendAtlas. No fake urgency, no vague promises.
        </p>

        <article class="entry" *ngFor="let entry of entries">
          <div class="entry-head">
            <h2>{{ entry.title }}</h2>
            <span>{{ formatWeek(entry.weekOf) }}</span>
          </div>
          <ul>
            <li *ngFor="let item of entry.changes">{{ item }}</li>
          </ul>
        </article>

        <div class="actions">
          <a class="btn btn--primary" [routerLink]="['/pricing']" [queryParams]="{ src: 'changelog_page' }" (click)="trackCta('view_pricing')">
            View pricing
          </a>
          <a class="btn" [routerLink]="['/react', 'coding', 'react-counter']" [queryParams]="{ src: 'changelog_page' }" (click)="trackCta('try_free_challenge')">
            Try free challenge
          </a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .changelog-page{
      min-height:100vh;
      padding:42px 18px 64px;
      background:radial-gradient(circle at 12% 0%,color-mix(in srgb,var(--uf-accent) 14%,transparent),transparent 42%),var(--uf-bg);
      color:var(--uf-text-primary);
    }
    .changelog-wrap{max-width:880px;margin:0 auto;display:grid;gap:14px}
    .kicker{
      margin:0;
      font-size:12px;
      text-transform:uppercase;
      letter-spacing:.12em;
      font-weight:800;
      color:color-mix(in srgb,var(--uf-text-tertiary) 80%,transparent);
    }
    h1{margin:0;font-size:34px;letter-spacing:-.02em}
    .subtitle{
      margin:0;
      max-width:70ch;
      color:color-mix(in srgb,var(--uf-text-secondary) 88%,transparent);
      line-height:1.5;
      font-weight:600;
    }
    .entry{
      margin-top:8px;
      border:1px solid var(--uf-border-subtle);
      border-radius:14px;
      background:color-mix(in srgb,var(--uf-surface) 92%,var(--uf-text-primary) 8%);
      box-shadow:var(--uf-card-shadow);
      padding:14px;
      display:grid;
      gap:10px;
    }
    .entry-head{
      display:flex;
      flex-wrap:wrap;
      justify-content:space-between;
      gap:8px;
      align-items:baseline;
    }
    .entry-head h2{
      margin:0;
      font-size:19px;
      letter-spacing:-.01em;
    }
    .entry-head span{
      font-size:12px;
      color:color-mix(in srgb,var(--uf-text-secondary) 82%,transparent);
      font-weight:700;
    }
    .entry ul{
      margin:0;
      padding-left:18px;
      display:grid;
      gap:6px;
      color:color-mix(in srgb,var(--uf-text-secondary) 88%,transparent);
      font-weight:600;
      line-height:1.45;
    }
    .actions{
      margin-top:8px;
      display:flex;
      gap:10px;
      flex-wrap:wrap;
    }
    .btn{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      border-radius:10px;
      padding:10px 14px;
      border:1px solid var(--uf-border-subtle);
      text-decoration:none;
      font-weight:700;
      color:var(--uf-text-primary);
      background:color-mix(in srgb,var(--uf-surface) 80%,transparent);
    }
    .btn--primary{
      background:var(--uf-accent);
      border-color:var(--uf-accent);
      color:var(--uf-bg);
      box-shadow:0 10px 24px color-mix(in srgb,var(--uf-accent) 34%,transparent);
    }
    @media (max-width:640px){
      .actions{display:grid}
      .btn{width:100%}
      h1{font-size:29px}
    }
  `],
})
export class ChangelogComponent implements OnInit {
  entries = PUBLIC_CHANGELOG_ENTRIES;

  constructor(private analytics: AnalyticsService) { }

  ngOnInit(): void {
    this.analytics.track('changelog_viewed', {
      page: 'changelog',
      src: 'direct',
    });
  }

  formatWeek(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `Week of ${formatDate(date, 'MMM d, y', 'en-US')}`;
  }

  trackCta(action: string): void {
    this.analytics.track('changelog_cta_clicked', {
      action,
      page: 'changelog',
    });
  }
}
