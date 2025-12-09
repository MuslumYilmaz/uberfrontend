import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-legal-index',
  imports: [CommonModule, RouterModule],
  template: `
    <section class="legal-shell">
      <header class="hero">
        <p class="eyebrow">Compliance hub</p>
        <h1>Legal Center</h1>
        <p class="lede">
          Plain-language policies that mirror the rest of the product: concise, respectful,
          and easy to navigate.
        </p>
      </header>

      <div class="cards">
        <a class="card fa-card" [routerLink]="['/legal/terms']">
          <div class="card-head">
            <span class="pill">Policy</span>
            <span class="hint">User agreement</span>
          </div>
          <h2>Terms of Service</h2>
          <p>Use of FrontendAtlas, acceptable use, ownership, and limitations of liability.</p>
        </a>

        <a class="card fa-card" [routerLink]="['/legal/privacy']">
          <div class="card-head">
            <span class="pill pill-green">Privacy</span>
            <span class="hint">Data handling</span>
          </div>
          <h2>Privacy Notice</h2>
          <p>How we collect, use, store, and transfer your personal information.</p>
        </a>

        <a class="card fa-card" [routerLink]="['/legal/cookies']">
          <div class="card-head">
            <span class="pill pill-blue">Cookies</span>
            <span class="hint">Preferences</span>
          </div>
          <h2>Cookie Policy</h2>
          <p>Details on analytics, preferences, and how to manage cookie choices.</p>
        </a>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .legal-shell {
      max-width: 1024px;
      margin: 32px auto 56px;
      padding: 0 18px;
      color: #e6e9ef;
    }
    .hero {
      background: radial-gradient(circle at 20% 20%, rgba(79, 70, 229, 0.12), transparent 38%),
                  radial-gradient(circle at 80% 0%, rgba(14, 165, 233, 0.10), transparent 30%),
                  #0b1220;
      border: 1px solid #1f2634;
      border-radius: 16px;
      padding: 22px 22px 18px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.35);
    }
    .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 11px;
      color: #8ab4ff;
      margin: 0 0 6px;
    }
    h1 {
      margin: 0;
      font-size: clamp(26px, 4vw, 34px);
      font-weight: 800;
      letter-spacing: 0.2px;
    }
    .lede {
      margin: 8px 0 0;
      color: #cfd6df;
      max-width: 640px;
      line-height: 1.55;
    }

    .cards {
      margin-top: 18px;
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    }
    .card {
      --fa-card-bg: linear-gradient(145deg, #0f172a, #0b1220);
      --fa-card-bg-hover: linear-gradient(145deg, #111b32, #0d1524);
      --fa-card-border: #1f2634;
      --fa-card-border-strong: #2b3550;
      --fa-card-radius: 14px;
      --fa-card-shadow: 0 6px 26px rgba(0,0,0,0.28);
      --fa-card-shadow-hover: 0 12px 34px rgba(0,0,0,0.32);
      display: block;
      border-radius: var(--fa-card-radius);
      padding: 16px 16px 14px;
      color: inherit;
      text-decoration: none;
    }
    .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 11px;
      letter-spacing: 0.03em;
      background: rgba(148, 163, 184, 0.18);
      color: #e6e9ef;
      border: 1px solid rgba(148, 163, 184, 0.3);
    }
    .pill-green { background: rgba(34, 197, 94, 0.16); border-color: rgba(34, 197, 94, 0.4); color: #bbf7d0; }
    .pill-blue { background: rgba(59, 130, 246, 0.16); border-color: rgba(59, 130, 246, 0.38); color: #bfdbfe; }
    .hint {
      font-size: 12px;
      color: #94a3b8;
    }
    h2 {
      margin: 0 0 6px;
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 0.1px;
    }
    .card p {
      margin: 0;
      color: #cfd6df;
      line-height: 1.5;
      font-size: 14px;
    }
  `]
})
export class LegalIndexComponent { }
