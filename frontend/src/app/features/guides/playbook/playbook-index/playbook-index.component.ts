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

    .prep-cluster {
      margin: 10px 0 24px;
      padding: 14px;
      border-radius: var(--uf-card-radius);
      border: 1px solid var(--uf-border-subtle);
      background: color-mix(in srgb, var(--uf-surface) 94%, var(--uf-surface-alt));
      box-shadow: var(--uf-card-shadow);
      display: grid;
      gap: 12px;
    }
    .prep-grid {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .prep-card {
      padding: 12px;
      border-radius: 12px;
      border: 1px solid var(--uf-border-subtle);
      background: color-mix(in srgb, var(--uf-surface) 92%, var(--uf-surface-alt));
    }
    .prep-card h3 {
      margin: 0;
      font-size: 13px;
      letter-spacing: .06em;
      text-transform: uppercase;
      color: color-mix(in srgb, var(--uf-text-tertiary) 85%, transparent);
    }
    .prep-card ul, .prep-card ol {
      margin: 8px 0 0 18px;
      color: color-mix(in srgb, var(--uf-text-secondary) 84%, transparent);
      font-size: 13px;
    }
    .prep-card li { margin: 6px 0; }
    .framework-links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .framework-links a {
      display: inline-flex;
      align-items: center;
      min-height: 30px;
      padding: 0 12px;
      border-radius: var(--uf-radius-pill);
      border: 1px solid var(--uf-border-subtle);
      background: color-mix(in srgb, var(--uf-surface) 90%, var(--uf-surface-alt));
      color: color-mix(in srgb, var(--uf-text-secondary) 84%, transparent);
      text-decoration: none;
      font-size: 12px;
      font-weight: 600;
      transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease;
    }
    .framework-links a:hover {
      border-color: color-mix(in srgb, var(--uf-border-subtle) 60%, var(--uf-accent) 40%);
      background: color-mix(in srgb, var(--uf-accent) 12%, var(--uf-surface));
      color: var(--uf-text-primary);
    }
    @media (max-width: 900px) {
      .prep-grid { grid-template-columns: 1fr; }
    }

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
      <h1 class="hero-title fa-page-title">Frontend Interview Preparation Blueprint</h1>
      <div class="hero-sub fa-meta-text">A practical interview roadmap covering coding, UI, JavaScript, system design, and behavioral prep.</div>
      <div class="pill-row">
        <span class="pill fa-chip fa-chip--label">End-to-end guide</span>
        <span class="pill fa-chip fa-chip--label">Tips for all question types</span>
        <span class="pill fa-chip fa-chip--label">500+ practice questions</span>
      </div>

      <section class="prep-cluster" aria-label="Interview preparation path and outcomes">
        <div class="prep-grid">
          <article class="prep-card">
            <h3>Outcomes</h3>
            <ul>
              <li>Know exactly what to practice each week for frontend interview preparation.</li>
              <li>Move from random solving to a repeatable interview roadmap.</li>
              <li>Improve coding, UI, system design, and behavioral consistency.</li>
            </ul>
          </article>
          <article class="prep-card">
            <h3>Common mistakes</h3>
            <ul>
              <li>Over-focusing on trivia without implementation practice.</li>
              <li>Ignoring communication quality and trade-off reasoning.</li>
              <li>Switching topics daily instead of completing one prep loop.</li>
            </ul>
          </article>
          <article class="prep-card">
            <h3>Suggested sequence</h3>
            <ol>
              <li><a [routerLink]="['/guides/interview-blueprint/intro']">Interview process</a></li>
              <li><a [routerLink]="['/guides/interview-blueprint/coding-interviews']">Coding rounds</a></li>
              <li><a [routerLink]="['/guides/interview-blueprint/ui-interviews']">UI rounds</a></li>
              <li><a [routerLink]="['/guides/interview-blueprint/system-design']">System design rounds</a></li>
            </ol>
          </article>
        </div>

        <div class="framework-links">
          <a [routerLink]="['/guides/framework-prep']">Browse all framework prep paths</a>
          <a [routerLink]="['/guides/framework-prep/javascript-prep-path']">JavaScript path</a>
          <a [routerLink]="['/guides/framework-prep/react-prep-path']">React path</a>
          <a [routerLink]="['/guides/framework-prep/angular-prep-path']">Angular path</a>
          <a [routerLink]="['/guides/framework-prep/vue-prep-path']">Vue path</a>
        </div>
      </section>

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
