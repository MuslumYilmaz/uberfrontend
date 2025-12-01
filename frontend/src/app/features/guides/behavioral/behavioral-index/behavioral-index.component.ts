import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BEHAVIORAL, BEHAVIORAL_GROUPS } from '../../../../shared/guides/guide.registry';
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
  `], template: `
    <div class="wrap">
      <h1 class="hero-title">Behavioral Interview Guide</h1>
      <div class="hero-sub">Show your impact with crisp stories and strong signals.</div>
      <div class="pill-row">
        <span class="pill">STAR stories</span>
        <span class="pill">Signals & examples</span>
        <span class="pill">FE-focused prompts</span>
      </div>

      <div *ngFor="let g of groups(); let gi = index" class="section">
        <div class="sec-head">{{ g.title }}</div>

        <a *ngFor="let it of g.items; let ii = index"
           class="card"
           [routerLink]="['/','guides','behavioral', it.slug]">
          <div class="num">{{ starts()[gi] + ii + 1 }}</div>
          <div class="body">
            <div class="title">{{ map().get(it.slug)?.title || it.slug }}</div>
            <div class="sub">{{ map().get(it.slug)?.summary }}</div>
          </div>
          <div class="mins" *ngIf="map().get(it.slug)?.minutes as m">{{ m }} min</div>
          <div class="arrow" aria-hidden="true">→</div>
        </a>
      </div>
      <app-offline-banner></app-offline-banner>
    </div>
  `
})
export class BehavioralIndexComponent {
  groups = computed(() => BEHAVIORAL_GROUPS);
  map = computed(() => new Map(BEHAVIORAL.map(e => [e.slug, e])));

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
