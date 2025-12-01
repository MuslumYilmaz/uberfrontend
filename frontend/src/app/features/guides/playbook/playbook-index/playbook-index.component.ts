import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PLAYBOOK, PLAYBOOK_GROUPS } from '../../../../shared/guides/guide.registry';
import { OfflineBannerComponent } from "../../../../shared/components/offline-banner/offline-banner";

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, OfflineBannerComponent],
  styles: [`
    :host { display:block; }
    .wrap { max-width: 980px; margin: 0 auto; padding: 18px 0 48px; }
    .hero-title { font-size: 28px; font-weight: 800; margin: 6px 0 6px; }
    .hero-sub { opacity:.85; margin-bottom: 18px; }
    .pill-row { display:flex; gap:10px; flex-wrap:wrap; margin:12px 0 18px; }
    .pill { border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.04); padding:4px 10px; border-radius:999px; font-size:12px; }

    .section { margin: 28px 0; }
    .sec-head { font-weight: 800; opacity:.95; margin-bottom: 10px; }

    .card { display:flex; align-items:center; gap:14px;
      border:1px solid rgba(255,255,255,.14); border-radius:12px;
      background:linear-gradient(180deg,#141414,#101010);
      padding:14px 14px; text-decoration:none; color:inherit; }
    .card:hover { background: rgba(255,255,255,.06); }
    .num { width:28px; height:28px; border-radius:999px; display:grid; place-items:center;
      border:1px solid rgba(255,255,255,.2); background:rgba(255,255,255,.05); font-size:12px; }
    .body { flex:1; min-width:0; }
    .title { font-weight:700; }
    .sub { opacity:.75; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .mins { font-size:12px; opacity:.7; }
    .arrow { opacity:.6; }
  `],
  template: `
    <div class="wrap">
      <h1 class="hero-title">Front End Interview Playbook</h1>
      <div class="hero-sub">The definitive guide to front end interviews.</div>
      <div class="pill-row">
        <span class="pill">End-to-end guide</span>
        <span class="pill">Tips for all question types</span>
        <span class="pill">500+ practice questions</span>
      </div>

      <div *ngFor="let g of groups()" class="section">
        <div class="sec-head">{{ g.title }}</div>

        <a *ngFor="let it of g.items"
           class="card" [routerLink]="['/','guides','playbook', it.slug]">
          <div class="num">{{ globalIdx().get(it.slug) }}</div>
          <div class="body">
            <div class="title">{{ entries().get(it.slug)?.title || it.slug }}</div>
            <div class="sub">{{ entries().get(it.slug)?.summary }}</div>
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
