import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PUBLIC_CHANGELOG_ENTRIES, PublicChangelogEntry } from '../../core/content/public-changelog';
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({
  standalone: true,
  selector: 'app-changelog',
  imports: [CommonModule, RouterModule],
  template: `
    <section class="changelog-page">
      <div class="changelog-wrap">
        <header class="changelog-hero">
          <p class="kicker">Build in public</p>
          <h1>Product changelog</h1>
          <p class="subtitle">
            Recent FrontendAtlas improvements, organized so you can quickly see what shipped and why it matters.
          </p>
        </header>

        <article
          class="latest-update"
          *ngIf="latestEntry as latest"
          data-testid="changelog-latest"
          [attr.aria-labelledby]="'latest-' + latest.id"
        >
          <div class="latest-update__meta">
            <span class="pill pill--category">{{ latest.category }}</span>
            <span class="pill">{{ latest.area }}</span>
            <time [attr.datetime]="latest.weekOf">{{ formatWeek(latest.weekOf) }}</time>
          </div>
          <div class="latest-update__body">
            <p class="kicker">Latest update</p>
            <h2 [id]="'latest-' + latest.id">{{ latest.title }}</h2>
            <p>{{ latest.summary }}</p>
          </div>
          <a
            *ngIf="latest.cta"
            class="btn btn--primary"
            [routerLink]="latest.cta.route"
            [queryParams]="latest.cta.queryParams"
            (click)="trackCta('latest_update_cta')"
          >
            {{ latest.cta.label }}
          </a>
        </article>

        <div class="timeline" aria-label="Product update history">
          <article
            class="entry"
            *ngFor="let entry of entries"
            [id]="entry.id"
            data-testid="changelog-entry"
          >
            <div class="entry-marker" aria-hidden="true"></div>
            <div class="entry-card">
              <div class="entry-head">
                <div>
                  <div class="entry-meta">
                    <span class="pill pill--category">{{ entry.category }}</span>
                    <span class="pill">{{ entry.area }}</span>
                    <time [attr.datetime]="entry.weekOf">{{ formatWeek(entry.weekOf) }}</time>
                  </div>
                  <h2>{{ entry.title }}</h2>
                </div>
                <a class="entry-anchor" [attr.href]="'#' + entry.id" [attr.aria-label]="'Link to ' + entry.title">
                  #
                </a>
              </div>
              <p class="entry-summary">{{ entry.summary }}</p>
              <ul>
                <li *ngFor="let item of entry.changes">{{ item }}</li>
              </ul>
              <a
                *ngIf="entry.cta"
                class="entry-cta"
                [routerLink]="entry.cta.route"
                [queryParams]="entry.cta.queryParams"
                (click)="trackCta('entry_cta_' + entry.id)"
              >
                {{ entry.cta.label }}
              </a>
            </div>
          </article>
        </div>

        <div class="actions" aria-label="Changelog actions">
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
      padding:44px 18px 68px;
      background:
        radial-gradient(circle at 12% 0%,color-mix(in srgb,var(--uf-accent) 12%,transparent),transparent 42%),
        var(--uf-bg);
      color:var(--uf-text-primary);
    }
    .changelog-wrap{
      max-width:960px;
      margin:0 auto;
      display:grid;
      gap:18px;
    }
    .changelog-hero{
      display:grid;
      gap:8px;
      max-width:760px;
    }
    .kicker{
      margin:0;
      font-size:12px;
      text-transform:uppercase;
      letter-spacing:.12em;
      font-weight:800;
      color:color-mix(in srgb,var(--uf-text-tertiary) 80%,transparent);
    }
    h1{
      margin:0;
      font-size:36px;
      letter-spacing:-.02em;
      line-height:1.06;
    }
    .subtitle{
      margin:0;
      max-width:72ch;
      color:color-mix(in srgb,var(--uf-text-secondary) 88%,transparent);
      line-height:1.5;
      font-weight:600;
    }
    .latest-update{
      display:grid;
      grid-template-columns:minmax(0,1fr) auto;
      gap:16px;
      align-items:end;
      padding:18px;
      border-radius:16px;
      border:1px solid color-mix(in srgb,var(--uf-border-subtle) 68%,var(--uf-accent) 32%);
      background:
        radial-gradient(circle at 88% 8%,color-mix(in srgb,var(--uf-accent) 14%,transparent),transparent 38%),
        linear-gradient(145deg,color-mix(in srgb,var(--uf-surface) 92%,var(--uf-text-primary) 8%),color-mix(in srgb,var(--uf-surface-alt) 90%,var(--uf-surface)));
      box-shadow:var(--uf-card-shadow);
    }
    .latest-update__meta{
      grid-column:1 / -1;
      display:flex;
      flex-wrap:wrap;
      gap:8px;
      align-items:center;
    }
    .latest-update__body{
      display:grid;
      gap:6px;
      min-width:0;
    }
    .latest-update__body h2{
      margin:0;
      font-size:24px;
      letter-spacing:-.015em;
      line-height:1.15;
    }
    .latest-update__body p{
      margin:0;
      color:color-mix(in srgb,var(--uf-text-secondary) 88%,transparent);
      line-height:1.48;
      font-weight:600;
    }
    .pill{
      display:inline-flex;
      align-items:center;
      min-height:24px;
      padding:0 9px;
      border-radius:999px;
      border:1px solid color-mix(in srgb,var(--uf-border-subtle) 70%,var(--uf-text-primary) 18%);
      background:color-mix(in srgb,var(--uf-text-primary) 6%,transparent);
      color:color-mix(in srgb,var(--uf-text-secondary) 88%,transparent);
      font-size:11px;
      font-weight:800;
      line-height:1;
      text-transform:uppercase;
    }
    .pill--category{
      border-color:color-mix(in srgb,var(--uf-accent) 50%,var(--uf-border-subtle));
      background:color-mix(in srgb,var(--uf-accent) 14%,var(--uf-surface));
      color:color-mix(in srgb,var(--uf-accent) 58%,var(--uf-text-primary));
    }
    time{
      color:color-mix(in srgb,var(--uf-text-tertiary) 82%,transparent);
      font-size:12px;
      font-weight:700;
    }
    .timeline{
      position:relative;
      display:grid;
      gap:14px;
      margin-top:2px;
    }
    .timeline::before{
      content:'';
      position:absolute;
      left:11px;
      top:10px;
      bottom:10px;
      width:1px;
      background:color-mix(in srgb,var(--uf-border-subtle) 78%,var(--uf-accent) 22%);
    }
    .entry{
      position:relative;
      display:grid;
      grid-template-columns:24px minmax(0,1fr);
      gap:12px;
      scroll-margin-top:88px;
    }
    .entry-marker{
      width:23px;
      height:23px;
      border-radius:50%;
      border:1px solid color-mix(in srgb,var(--uf-accent) 58%,var(--uf-border-subtle));
      background:
        radial-gradient(circle,color-mix(in srgb,var(--uf-accent) 78%,var(--uf-text-primary) 22%) 0 35%,transparent 37%),
        var(--uf-bg);
      box-shadow:0 0 0 4px var(--uf-bg);
      transform:translateY(14px);
      z-index:1;
    }
    .entry-card{
      border:1px solid var(--uf-border-subtle);
      border-radius:14px;
      background:color-mix(in srgb,var(--uf-surface) 92%,var(--uf-text-primary) 8%);
      box-shadow:var(--uf-card-shadow);
      padding:14px;
      display:grid;
      gap:10px;
      min-width:0;
    }
    .entry-head{
      display:flex;
      justify-content:space-between;
      gap:12px;
      align-items:flex-start;
      min-width:0;
    }
    .entry-meta{
      display:flex;
      flex-wrap:wrap;
      gap:7px;
      align-items:center;
      margin-bottom:8px;
    }
    .entry-head h2{
      margin:0;
      font-size:19px;
      letter-spacing:-.01em;
      line-height:1.2;
    }
    .entry-anchor{
      flex:0 0 auto;
      width:30px;
      height:30px;
      display:inline-grid;
      place-items:center;
      border-radius:8px;
      border:1px solid color-mix(in srgb,var(--uf-border-subtle) 80%,transparent);
      color:color-mix(in srgb,var(--uf-text-tertiary) 80%,transparent);
      text-decoration:none;
      font-weight:800;
    }
    .entry-anchor:hover,
    .entry-anchor:focus-visible,
    .btn:focus-visible,
    .entry-cta:focus-visible{
      outline:2px solid color-mix(in srgb,var(--uf-accent) 76%,white 24%);
      outline-offset:3px;
    }
    .entry-summary{
      margin:0;
      color:color-mix(in srgb,var(--uf-text-secondary) 88%,transparent);
      font-weight:600;
      line-height:1.48;
    }
    .entry ul{
      margin:0;
      padding-left:18px;
      display:grid;
      gap:6px;
      color:color-mix(in srgb,var(--uf-text-secondary) 86%,transparent);
      font-weight:600;
      line-height:1.45;
    }
    .entry-cta{
      width:max-content;
      min-height:32px;
      padding:0 11px;
      border-radius:999px;
      border:1px solid color-mix(in srgb,var(--uf-border-subtle) 62%,var(--uf-accent) 38%);
      background:color-mix(in srgb,var(--uf-accent) 10%,var(--uf-surface));
      color:var(--uf-text-primary);
      display:inline-flex;
      align-items:center;
      text-decoration:none;
      font-weight:800;
      font-size:13px;
    }
    .actions{
      margin-top:4px;
      display:flex;
      gap:10px;
      flex-wrap:wrap;
    }
    .btn{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      border-radius:10px;
      min-height:42px;
      padding:0 14px;
      border:1px solid var(--uf-border-subtle);
      text-decoration:none;
      font-weight:800;
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
      .changelog-page{padding:34px 14px 54px}
      .changelog-wrap{gap:16px}
      h1{font-size:30px}
      .latest-update{grid-template-columns:1fr;padding:15px}
      .latest-update .btn{width:100%}
      .timeline::before{left:9px}
      .entry{grid-template-columns:20px minmax(0,1fr);gap:10px}
      .entry-marker{width:19px;height:19px}
      .entry-card{padding:12px}
      .entry-head{gap:8px}
      .entry-head h2{font-size:17px}
      .actions{display:grid}
      .btn{width:100%}
      .entry-cta{width:100%;justify-content:center}
    }
  `],
})
export class ChangelogComponent implements OnInit {
  entries = PUBLIC_CHANGELOG_ENTRIES;
  latestEntry: PublicChangelogEntry | null = PUBLIC_CHANGELOG_ENTRIES[0] ?? null;

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
    return formatDate(date, 'MMM d, y', 'en-US');
  }

  trackCta(action: string): void {
    this.analytics.track('changelog_cta_clicked', {
      action,
      page: 'changelog',
    });
  }
}
