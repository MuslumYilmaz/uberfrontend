import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, GuideShellComponent],
  template: `
    <uf-guide-shell
      title="One-Page Checklist for Interviews"
      [minutes]="7"
      [tags]="['system design','checklist','cheatsheet']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">

      <p>
        A quick mental map for any front-end system design interview. 
        Use this to keep your answer structured under pressure.
      </p>

      <h2>Before you start (30–60s)</h2>
      <ul>
        <li><strong>Clarify users:</strong> public vs internal, mobile vs desktop.</li>
        <li><strong>Clarify goals:</strong> SEO? fast first load? logged-in speed?</li>
        <li><strong>Scope v1:</strong> must-haves vs nice-to-haves.</li>
      </ul>

      <h2>Five-step flow (the spine)</h2>
      <ol>
        <li><strong>Clarify:</strong> users, use cases, non-goals.</li>
        <li><strong>Decompose:</strong> name core components.</li>
        <li><strong>Choose rendering/architecture:</strong> with a reason.</li>
        <li><strong>Cross-cutting:</strong> performance, a11y, i18n, testing.</li>
        <li><strong>Trade-offs & next steps:</strong> v1 now, scale later.</li>
      </ol>

      <h2>Rendering choice: quick picks</h2>
      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Context</th>
            <th style="text-align:left;">Leaning</th>
            <th style="text-align:left;">Why</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Public marketing / SEO</td>
            <td><strong>SSR / SSG</strong></td>
            <td>Fast first paint, indexable content</td>
          </tr>
          <tr>
            <td>Internal dashboard / auth</td>
            <td><strong>CSR</strong></td>
            <td>Simple deploy, fast iteration</td>
          </tr>
          <tr>
            <td>Mixed static + interactive</td>
            <td><strong>Islands / Hybrid</strong></td>
            <td>Static shell; hydrate only what’s needed</td>
          </tr>
          <tr>
            <td>Very large org / many teams</td>
            <td><strong>Microfrontends</strong></td>
            <td>Team autonomy, independent deploys</td>
          </tr>
        </tbody>
      </table>

      <h2>State, data flow & fetching</h2>
      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Decision</th>
            <th style="text-align:left;">Default</th>
            <th style="text-align:left;">Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>State split</td>
            <td>UI local • minimal global • server cache</td>
            <td>Normalize server data by <code>id</code></td>
          </tr>
          <tr>
            <td>Flow</td>
            <td>Unidirectional</td>
            <td>View → Action → Store/Cache → View</td>
          </tr>
          <tr>
            <td>Fetching</td>
            <td>On demand + prefetch</td>
            <td>Prefetch likely next route; use cursors</td>
          </tr>
          <tr>
            <td>Refresh</td>
            <td>Background on focus/reconnect</td>
            <td>Keep UI responsive while refreshing</td>
          </tr>
        </tbody>
      </table>

      <h2>Caching & invalidation</h2>
      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Layer</th>
            <th style="text-align:left;">Use</th>
            <th style="text-align:left;">Invalidation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>HTTP / CDN</td>
            <td>Static assets, GET APIs</td>
            <td>TTL, purge on deploy</td>
          </tr>
          <tr>
            <td>App memory</td>
            <td>Normalized entities</td>
            <td>Tag/event-based after writes</td>
          </tr>
          <tr>
            <td>Service Worker</td>
            <td>Shell + recent data, offline</td>
            <td>Versioned precache; sync queue</td>
          </tr>
        </tbody>
      </table>
      <p><em>One-liner:</em> “SWR for reads; tag-based invalidation on writes.”</p>

      <h2>Real-time & offline</h2>
      <ul>
        <li><strong>Start simple:</strong> polling → upgrade to SSE/WebSocket if needed.</li>
        <li><strong>Offline:</strong> SW cache shell, queue writes, handle conflicts (version/merge).</li>
      </ul>

      <h2>Performance quick fixes (symptom → fix)</h2>
      <ul>
        <li><strong>Page feels slow to load:</strong> optimize images, inline above-the-fold CSS, split bundles.</li>
        <li><strong>Clicks feel laggy:</strong> reduce JS, debounce handlers, move heavy work off main thread.</li>
        <li><strong>Layout jumps around:</strong> reserve dimensions for images/ads, load fonts predictably.</li>
        <li><strong>Scrolling is janky:</strong> virtualize long lists, throttle scroll, keep frames smooth.</li>
      </ul>

      <h2>Cross-cutting essentials</h2>
      <ul>
        <li><strong>a11y:</strong> semantic HTML, focus order, keyboard support, contrast.</li>
        <li><strong>i18n:</strong> text expansion, RTL, locale formats (dates/numbers/currency).</li>
        <li><strong>Testing:</strong> happy paths + errors + empty states; contract tests for APIs.</li>
      </ul>

      <h2>Close strong (1–2 sentences)</h2>
      <blockquote>
        “For v1, I’d ship <em>X</em> for speed. If <em>Y</em> becomes a priority, we’ll evolve to <em>Z</em>. 
        Trade-offs: we optimize for A now, and revisit B at scale.”
      </blockquote>

      <h2>Phrases that score</h2>
      <ul>
        <li>“Given the need for <strong>X</strong>, I’d pick <strong>Y</strong> because it optimizes for <strong>Z</strong>.”</li>
        <li>“Must-haves for v1 are…, nice-to-haves later are…”</li>
        <li>“We’ll keep UI state local, minimal global, and treat server data as a cache.”</li>
        <li>“We’ll start with polling; if interaction requires it, move to SSE/WebSocket.”</li>
      </ul>

      <h2>Red flags to avoid</h2>
      <ul>
        <li>Jumping into diagrams without clarifying scope.</li>
        <li>Listing buzzwords without a reason tied to context.</li>
        <li>Designing for a billion users in v1.</li>
        <li>Forgetting a11y/i18n/offline or error/empty states.</li>
        <li>Rambling without structure.</li>
      </ul>

      <h2>Mini runbook (10–15s to say out loud)</h2>
      <ol>
        <li>“Users & goals are …; v1 scope is …”</li>
        <li>“Components: …”</li>
        <li>“Rendering: choose … because …”</li>
        <li>“Perf/a11y/i18n considerations: …”</li>
        <li>“Trade-offs now; next steps at scale: …”</li>
      </ol>

    </uf-guide-shell>
  `,
})
export class SystemDesignChecklistArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
}
