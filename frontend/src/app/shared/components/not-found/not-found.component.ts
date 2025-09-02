import { CommonModule, Location } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [`
    :host { display:block; color:#e5e7eb; }

    /* Fill space between your fixed header & footer */
    .wrap {
      min-height: calc(100vh - var(--app-safe-top, 64px) - 56px);
      display: grid;
      place-items: center;
      padding: 32px;
      /* soft colored glow that fits the dark UI */
      background:
        radial-gradient(1200px 600px at 20% -10%, rgba(59,130,246,.12), transparent 60%),
        radial-gradient(800px 400px at 100% 20%, rgba(236,72,153,.10), transparent 60%);
    }

    .card {
      max-width: 720px; width: 100%;
      background: #0b0f19;
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 16px;
      padding: 28px;
      box-shadow: 0 20px 40px rgba(0,0,0,.35);
    }

    .kicker {
      display:inline-flex; align-items:center; gap:8px;
      padding:4px 10px; border-radius:9999px;
      font-size:12px; color:#a1a1aa;
      background: rgba(255,255,255,.02);
      border: 1px solid rgba(255,255,255,.12);
    }

    .big {
      margin: 10px 0 4px;
      font-size: 56px; line-height: 1.05; font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(90deg, #60a5fa, #a78bfa);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .subtitle { font-size: 18px; margin: 0 0 10px; color:#cbd5e1; }

    .p { color:#94a3b8; margin: 8px 0 0; }
    .url {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
      background: rgba(2,6,23,.6);
      padding: 2px 6px; border-radius: 6px;
      border: 1px solid rgba(255,255,255,.08);
      color:#e5e7eb;
    }

    .actions { display:flex; gap:12px; margin-top:18px; flex-wrap:wrap; }

    .btn {
      appearance:none; cursor:pointer; user-select:none;
      border:1px solid rgba(59,130,246,.4);
      background:#1f2937; color:#e5e7eb;
      padding:10px 14px; border-radius:10px; font-weight:600;
      text-decoration:none;
      transition: transform .05s ease, background .2s ease, border-color .2s ease;
    }
    .btn:hover { background:#223045; border-color:#60a5fa; }
    .btn:active { transform: translateY(1px); }

    .btn.primary { background:#2563eb; border-color:#2563eb; }
    .btn.primary:hover { background:#1d4ed8; }

    .small { font-size:12px; color:#9ca3af; margin-top:8px; }
  `],
  template: `
    <div class="wrap">
      <div class="card">
        <span class="kicker">Not found</span>
        <div class="big">404</div>
        <div class="subtitle">This page doesn’t exist.</div>

        <p class="p">It may have been moved, or the URL is mistyped.</p>

        <div class="actions">
          <a class="btn primary" routerLink="/">Go to dashboard</a>
        </div>

        <div class="small">Tip: check the address bar or use the navigation above.</div>
      </div>
    </div>
  `
})
export class NotFoundComponent {
  constructor(public router: Router, private location: Location) { }
}
