import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PLAYBOOK, PLAYBOOK_GROUPS } from '../../../../shared/guides/guide.registry';
import { OfflineBannerComponent } from "../../../../shared/components/offline-banner/offline-banner";

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, OfflineBannerComponent],
  styles: [`
    :host { display:block; color: var(--uf-text-primary); background: var(--uf-bg); }
    .wrap { max-width: 980px; margin: 0 auto; padding: 24px 0 48px; }
    .hero-title { margin: 6px 0 6px; }
    .hero-sub { color: color-mix(in srgb, var(--uf-text-secondary) 88%, transparent); margin-bottom: 18px; }
    .pill-row { display:flex; gap:10px; flex-wrap:wrap; margin:12px 0 18px; }
    .pill { padding:6px 12px; }

    .section { margin: 28px 0; }
    .sec-head { margin-bottom: 10px; color: var(--uf-text-primary); }

    .card {
      display:flex; align-items:center; gap:14px;
      padding:14px 14px; text-decoration:none; color:inherit;
      background: var(--uf-surface);
      border: 1px solid var(--uf-border-subtle);
      border-radius: var(--uf-card-radius);
      box-shadow: var(--uf-card-shadow);
      transition: border-color 160ms ease, background-color 160ms ease, box-shadow 180ms ease, transform 120ms ease;
    }
    .card:hover {
      background: color-mix(in srgb, var(--uf-surface) 86%, var(--uf-accent) 14%);
      border-color: color-mix(in srgb, var(--uf-border-subtle) 60%, var(--uf-accent) 40%);
      box-shadow: var(--uf-card-shadow-strong);
      transform: translateY(-1px);
    }
    .num { min-width:32px; height:32px; border-radius: var(--uf-radius-pill); display:grid; place-items:center; }
    .body { flex:1; min-width:0; }
    .title { margin:0; }
    .sub { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color: color-mix(in srgb, var(--uf-text-secondary) 80%, transparent); }
    .mins { font-size:12px; color: color-mix(in srgb, var(--uf-text-tertiary) 75%, transparent); }
    .arrow { color: color-mix(in srgb, var(--uf-text-tertiary) 75%, transparent); transition: transform 160ms ease, opacity 160ms ease; }
    .card:hover .arrow { opacity:1; transform: translateX(4px); color: var(--uf-text-primary); }
  `],
  template: `
    <div class="wrap fa-body">
      <h1 class="hero-title fa-page-title">FrontendAtlas Interview Blueprint</h1>
      <div class="hero-sub fa-meta-text">The definitive guide to front end interviews.</div>
      <div class="pill-row">
        <span class="pill fa-chip fa-chip--label">End-to-end guide</span>
        <span class="pill fa-chip fa-chip--label">Tips for all question types</span>
        <span class="pill fa-chip fa-chip--label">500+ practice questions</span>
      </div>

      <div *ngFor="let g of groups()" class="section">
        <div class="sec-head fa-section-title">{{ g.title }}</div>

        <a *ngFor="let it of g.items"
           class="card" [routerLink]="['/','guides','interview-blueprint', it.slug]">
          <div class="num fa-chip fa-chip--label">{{ globalIdx().get(it.slug) }}</div>
          <div class="body">
            <div class="title fa-card-title">{{ entries().get(it.slug)?.title || it.slug }}</div>
            <div class="sub fa-meta-text">{{ entries().get(it.slug)?.summary }}</div>
          </div>
          <div class="mins" *ngIf="entries().get(it.slug)?.minutes as m">{{ m }} min</div>
          <div class="arrow" aria-hidden="true">→</div>
        </a>
      </div>

       <app-offline-banner></app-offline-banner>
    </div>
  `
})
export class PlaybookIndexComponent {
  /** Section groups (order matters). */
  groups = computed(() => PLAYBOOK_GROUPS);

  /** Quick lookup: slug -> GuideEntry */
  entries = computed(() => new Map(PLAYBOOK.map(e => [e.slug, e])));

  /** Global numbering: slug -> 1..N across all sections */
  globalIdx = computed(() => {
    const map = new Map<string, number>();
    let n = 0;
    for (const g of PLAYBOOK_GROUPS) {
      for (const it of g.items) map.set(it.slug, ++n);
    }
    return map;
  });
}
