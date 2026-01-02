import { CommonModule, Location } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [`
    :host { display:block; color:var(--uf-text-primary); }

    /* Fill space between your fixed header & footer */
    .wrap {
      min-height: calc(100vh - var(--app-safe-top, 64px) - 56px);
      display: grid;
      place-items: center;
      padding: 32px;
      /* soft colored glow that fits the dark UI */
      background:
        radial-gradient(1200px 600px at 20% -10%, color-mix(in srgb, var(--uf-accent) 12%, transparent), transparent 60%),
        radial-gradient(800px 400px at 100% 20%, color-mix(in srgb, var(--uf-text-primary) 8%, transparent), transparent 60%),
        var(--uf-bg);
    }

    .card {
      max-width: 720px; width: 100%;
      background: var(--uf-surface);
      border: 1px solid var(--uf-border-subtle);
      border-radius: var(--uf-card-radius);
      padding: 24px;
      box-shadow: var(--uf-card-shadow-strong);
    }

    .kicker {
      display:inline-flex; align-items:center; gap:8px;
      padding:4px 10px; border-radius:9999px;
      font-size:12px; color:color-mix(in srgb, var(--uf-text-tertiary) 80%, transparent);
      background: color-mix(in srgb, var(--uf-text-primary) 4%, var(--uf-surface));
      border: 1px solid var(--uf-border-subtle);
    }

    .big {
      margin: 10px 0 4px;
      font-size: 56px; line-height: 1.05; font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(90deg, color-mix(in srgb, var(--uf-accent) 60%, var(--uf-text-primary) 40%), color-mix(in srgb, var(--uf-text-primary) 70%, transparent));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .subtitle { font-size: 18px; margin: 0 0 10px; color:color-mix(in srgb, var(--uf-text-secondary) 85%, transparent); }

    .p { color:color-mix(in srgb, var(--uf-text-tertiary) 80%, transparent); margin: 8px 0 0; }
    .url {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
      background: color-mix(in srgb, var(--uf-text-primary) 6%, var(--uf-surface));
      padding: 2px 6px; border-radius: 6px;
      border: 1px solid var(--uf-border-subtle);
      color:var(--uf-text-primary);
    }

    .actions { display:flex; gap:12px; margin-top:18px; flex-wrap:wrap; }

    .btn {
      appearance:none; cursor:pointer; user-select:none;
      border:1px solid color-mix(in srgb, var(--uf-border-subtle) 70%, var(--uf-text-secondary) 30%);
      background: var(--uf-surface-alt); color:var(--uf-text-primary);
      padding:10px 14px; border-radius:10px; font-weight:600;
      text-decoration:none;
      transition: transform .05s ease, background .2s ease, border-color .2s ease;
    }
    .btn:hover { background: color-mix(in srgb, var(--uf-text-primary) 6%, var(--uf-surface)); border-color: color-mix(in srgb, var(--uf-border-subtle) 60%, var(--uf-text-secondary) 40%); }
    .btn:active { transform: translateY(1px); }

    .btn.primary { background: var(--uf-accent); border-color: var(--uf-accent); color: var(--uf-bg); box-shadow: 0 6px 16px color-mix(in srgb, var(--uf-accent) 30%, transparent); }
    .btn.primary:hover { background: var(--uf-accent-strong); border-color: var(--uf-accent-strong); }

    .small { font-size:12px; color:color-mix(in srgb, var(--uf-text-tertiary) 80%, transparent); margin-top:8px; }
  `],
  template: `
    <div class="wrap" data-testid="not-found-page">
      <div class="card">
        <span class="kicker">Not found</span>
        <div class="big">404</div>
        <div class="subtitle">This page doesn’t exist.</div>

        <p class="p">It may have been moved, or the URL is mistyped.</p>

        <div class="actions">
          <a class="btn primary" routerLink="/dashboard">Go to dashboard</a>
        </div>

        <div class="small">Tip: check the address bar or use the navigation above.</div>
      </div>
    </div>
  `
})
export class NotFoundComponent {
  constructor(public router: Router, private location: Location) { }
}
