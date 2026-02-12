import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { OfflineBannerComponent } from "../../../../shared/components/offline-banner/offline-banner";
import { SYSTEM, SYSTEM_GROUPS } from '../../../../shared/guides/guide.registry';

@Component({
  standalone: true,
  selector: 'fa-system-design-index',
  imports: [CommonModule, RouterModule, OfflineBannerComponent],
  styles: [`
    :host { display:block; color: var(--uf-text-primary); background: var(--uf-bg); }
    .wrap { max-width: 980px; margin: 0 auto; padding: 24px 0 48px; }
    .hero-title { font-size: 28px; font-weight: 800; margin: 6px 0 6px; color: var(--uf-text-primary); }
    .hero-sub { color: color-mix(in srgb, var(--uf-text-secondary) 88%, transparent); margin-bottom: 18px; }
    .pill-row { display:flex; gap:10px; flex-wrap:wrap; margin:12px 0 18px; }
    .pill { border:1px solid var(--uf-border-subtle); background: color-mix(in srgb, var(--uf-text-primary) 6%, var(--uf-surface)); padding:6px 12px; border-radius:999px; font-size:12px; color: var(--uf-text-secondary); }
    .prep-links { display:flex; gap:8px; flex-wrap:wrap; margin:0 0 16px; }
    .prep-links a {
      display:inline-flex; align-items:center; min-height:30px; padding:0 12px;
      border-radius:999px; text-decoration:none; font-size:12px; font-weight:600;
      border:1px solid var(--uf-border-subtle);
      background: color-mix(in srgb, var(--uf-surface) 94%, var(--uf-surface-alt));
      color: color-mix(in srgb, var(--uf-text-secondary) 84%, transparent);
      transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease;
    }
    .prep-links a:hover {
      border-color: color-mix(in srgb, var(--uf-border-subtle) 58%, var(--uf-accent) 42%);
      background: color-mix(in srgb, var(--uf-accent) 14%, var(--uf-surface));
      color: var(--uf-text-primary);
    }

    .section { margin: 28px 0; }
    .sec-head { font-weight: 800; color: var(--uf-text-primary); margin-bottom: 10px; }

    .card {
      display:flex; align-items:center; gap:14px;
      background: var(--uf-surface);
      border: 1px solid var(--uf-border-subtle);
      box-shadow: var(--uf-card-shadow);
      padding:14px 14px; text-decoration:none; color:inherit; border-radius: var(--uf-card-radius);
      transition: border-color 160ms ease, background-color 160ms ease, box-shadow 180ms ease, transform 120ms ease;
    }
    .card:hover {
      background: color-mix(in srgb, var(--uf-surface) 86%, var(--uf-accent) 14%);
      border-color: color-mix(in srgb, var(--uf-border-subtle) 60%, var(--uf-accent) 40%);
      box-shadow: var(--uf-card-shadow-strong);
      transform: translateY(-1px);
    }
    .num {
      width:28px; height:28px; border-radius:999px; display:grid; place-items:center;
      border:1px solid var(--uf-border-subtle);
      background: color-mix(in srgb, var(--uf-text-primary) 6%, var(--uf-surface-alt));
      font-size:12px; color: var(--uf-text-secondary);
    }
    .body { flex:1; min-width:0; }
    .title { font-weight:700; color: var(--uf-text-primary); }
    .sub { color: color-mix(in srgb, var(--uf-text-secondary) 80%, transparent); font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .mins { font-size:12px; color: color-mix(in srgb, var(--uf-text-tertiary) 75%, transparent); }
    .arrow { color: color-mix(in srgb, var(--uf-text-tertiary) 75%, transparent); transition: transform 160ms ease, opacity 160ms ease; }
    .card:hover .arrow { opacity:1; transform: translateX(4px); color: var(--uf-text-primary); }
  `],
  template: `
    <div class="wrap">
      <h1 class="hero-title">Frontend System Design Blueprint</h1>
      <div class="hero-sub">Use this system design interview roadmap to structure frontend architecture answers, trade-offs, and common mistakes.</div>
      <div class="pill-row">
        <span class="pill fa-chip fa-chip--label">Architecture diagrams</span>
        <span class="pill fa-chip fa-chip--label">Scalability & reliability</span>
        <span class="pill fa-chip fa-chip--label">Trade-offs & checkpoints</span>
      </div>
      <div class="prep-links">
        <a [routerLink]="['/guides/interview-blueprint']">Interview blueprint hub</a>
        <a [routerLink]="['/guides/framework-prep']">Framework prep paths</a>
        <a [routerLink]="['/tracks']">Interview tracks</a>
        <a [routerLink]="['/companies']">Company question sets</a>
      </div>

      <div *ngFor="let g of groups(); let gi = index" class="section">
        <div class="sec-head">{{ g.title }}</div>

        <a *ngFor="let it of g.items; let ii = index"
           class="card"
           [routerLink]="['/','guides','system-design-blueprint', it.slug]">
          <div class="num">{{ starts()[gi] + ii + 1 }}</div>
          <div class="body">
            <div class="title">{{ map().get(it.slug)?.title || it.slug }}</div>
            <div class="sub" *ngIf="map().get(it.slug)?.summary as s">{{ s }}</div>
          </div>
          <div class="mins" *ngIf="map().get(it.slug)?.minutes as m">{{ m }} min</div>
          <div class="arrow" aria-hidden="true">→</div>
        </a>
      </div>
      <app-offline-banner></app-offline-banner>
    </div>
  `
})
export class SystemDesignIndexComponent {
  groups = computed(() => SYSTEM_GROUPS);
  map = computed(() => new Map(SYSTEM.map(e => [e.slug, e])));

  /** cumulative starting index for each group (0-based) */
  starts = computed(() => {
    const gs = this.groups();
    const out: number[] = [];
    let acc = 0;
    for (const g of gs) {
      out.push(acc);
      acc += g.items.length;
    }
    return out;
  });
}
