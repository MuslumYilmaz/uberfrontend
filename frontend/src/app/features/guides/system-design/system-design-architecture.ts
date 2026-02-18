import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, GuideShellComponent],
  template: `
    <fa-guide-shell
      title="A - Architecture Deep Dive for Frontend System Design Interviews"
      [minutes]="18"
      [tags]="['system design','architecture','radio framework']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">

      <h2>If You Remember One Thing</h2>
      <p>
        In a <strong>system design interview</strong>, Architecture is not about drawing more boxes.
        It is about proving that each boundary, rendering choice, and data path follows from Requirements.
        In the <strong>RADIO framework</strong>, this is where your <strong>frontend system design</strong>
        answer becomes defensible, measurable, and production-aware.
      </p>

      <h2>What Architecture Must Produce</h2>
      <p>
        Your architecture section should end with concrete artifacts, not vague claims.
      </p>
      <table>
        <thead>
          <tr>
            <th>Artifact</th>
            <th>Minimum interview bar</th>
            <th>Why interviewer cares</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>High-level architecture diagram</td>
            <td>Browser, CDN/edge, BFF/API, data services, observability hooks</td>
            <td>Tests structure and boundary clarity</td>
          </tr>
          <tr>
            <td>Route-by-route rendering matrix</td>
            <td>Which routes are CSR/SSR/SSG/edge and why</td>
            <td>Tests if trade-offs are context-driven</td>
          </tr>
          <tr>
            <td>Data flow and state boundaries</td>
            <td>Server truth vs client-derived state and sync points</td>
            <td>Tests consistency and failure thinking</td>
          </tr>
          <tr>
            <td>Caching and invalidation plan</td>
            <td>HTTP, CDN, app cache, and invalidation triggers</td>
            <td>Tests scale and reliability readiness</td>
          </tr>
          <tr>
            <td>Risk and fallback notes</td>
            <td>Known bottlenecks + mitigation path</td>
            <td>Tests senior-level production judgment</td>
          </tr>
        </tbody>
      </table>

      <h2>Inputs You Must Pull from Requirements</h2>
      <p>
        Architecture quality depends on what you carried from Requirements. This is why
        <strong>system design interview preparation</strong> should include a Requirements gate.
      </p>
      <table>
        <thead>
          <tr>
            <th>Requirement input</th>
            <th>Architecture decision it drives</th>
            <th>What to say out loud</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>SEO-critical entry pages</td>
            <td>SSR/SSG on public routes, CSR for post-login flows</td>
            <td>"I will split rendering by route to protect crawlability and interaction speed."</td>
          </tr>
          <tr>
            <td>High burst traffic</td>
            <td>CDN caching, edge compute for read-heavy endpoints</td>
            <td>"I am pushing cacheable work to edge/CDN to flatten origin load."</td>
          </tr>
          <tr>
            <td>Strict interaction latency</td>
            <td>BFF aggregation + request dedupe + streaming/skeleton strategy</td>
            <td>"I will optimize the request path for p95 interaction, not just average latency."</td>
          </tr>
          <tr>
            <td>A11y baseline and global audience</td>
            <td>Architecture supports focus management, i18n bundles, graceful degradation</td>
            <td>"Accessibility and localization are first-class architecture constraints, not polish."</td>
          </tr>
          <tr>
            <td>Team ownership constraints</td>
            <td>Modular monolith or microfrontend boundary by domain</td>
            <td>"I am choosing boundaries by ownership and deploy risk, not trend."</td>
          </tr>
        </tbody>
      </table>

      <h2>Architecture Options Matrix</h2>
      <table>
        <thead>
          <tr>
            <th>Option</th>
            <th>When it wins</th>
            <th>Trade-offs</th>
            <th>Failure mode to watch</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>CSR-heavy SPA</td>
            <td>Auth-gated tools, frequent interaction, low SEO pressure</td>
            <td>Great DX and velocity; weaker first paint on slow devices</td>
            <td>Large bundles hurt Time to Interactive</td>
          </tr>
          <tr>
            <td>SSR by default</td>
            <td>Public content with SEO + faster first contentful render</td>
            <td>Higher server cost and cache complexity</td>
            <td>Origin saturation during traffic spikes</td>
          </tr>
          <tr>
            <td>SSG/ISR for stable content</td>
            <td>Docs, marketing, category pages with predictable updates</td>
            <td>Build/revalidation complexity for freshness</td>
            <td>Stale pages if invalidation is weak</td>
          </tr>
          <tr>
            <td>Hybrid per-route (recommended default)</td>
            <td>Mixed app: SEO entry + rich dashboard interactions</td>
            <td>More moving pieces but best fit-to-route</td>
            <td>Inconsistent rules across teams/routes</td>
          </tr>
          <tr>
            <td>Edge rendering and BFF</td>
            <td>Global latency sensitivity + multi-API aggregation needs</td>
            <td>Operational complexity and observability depth needed</td>
            <td>Hard-to-debug edge/runtime mismatches</td>
          </tr>
        </tbody>
      </table>

      <h2>Baseline Reference Architecture</h2>
      <h3>Use this as your default starting point</h3>
      <div class="code-wrap">
        <pre><code>User Browser
  -> CDN/Edge (cache, WAF, bot/rate controls)
  -> App Renderer (SSR for entry routes, CSR hydration for interactive routes)
  -> BFF (auth checks, API aggregation, response shaping)
  -> Domain APIs (search, profile, catalog, recommendations)
  -> Data stores / cache layers

Client side:
  Router + feature modules + server-state cache + UI-state store + telemetry SDK</code></pre>
      </div>
      <ul>
        <li><strong>Boundary 1:</strong> keep auth/session logic outside raw UI components.</li>
        <li><strong>Boundary 2:</strong> centralize cross-domain aggregation in BFF, not in components.</li>
        <li><strong>Boundary 3:</strong> separate server state cache from local UI state.</li>
      </ul>

      <h3>Route-by-route rendering strategy</h3>
      <table>
        <thead>
          <tr>
            <th>Route type</th>
            <th>Rendering mode</th>
            <th>Cache strategy</th>
            <th>Reasoning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Home / landing / SEO pages</td>
            <td>SSR or SSG + hydration</td>
            <td>CDN cache with short revalidation</td>
            <td>Protect discoverability and first content speed</td>
          </tr>
          <tr>
            <td>Search results shell</td>
            <td>SSR shell + CSR updates</td>
            <td>CDN for shell, client cache for queries</td>
            <td>Fast first paint + responsive filtering</td>
          </tr>
          <tr>
            <td>Dashboard / account</td>
            <td>CSR</td>
            <td>Client cache + API cache headers</td>
            <td>High interactivity, low SEO need</td>
          </tr>
          <tr>
            <td>High-read static docs</td>
            <td>SSG/ISR</td>
            <td>Long CDN TTL + controlled invalidation</td>
            <td>Cheap and globally fast delivery</td>
          </tr>
        </tbody>
      </table>

      <h2>Data Flow, State Boundaries, and Caching</h2>
      <h3>Server truth vs client-derived state</h3>
      <table>
        <thead>
          <tr>
            <th>State category</th>
            <th>Owner</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Server truth</td>
            <td>APIs + server-state cache</td>
            <td>Product entities, permissions, pricing</td>
          </tr>
          <tr>
            <td>Client view state</td>
            <td>UI store/component state</td>
            <td>Selected tab, modal open, sort toggle</td>
          </tr>
          <tr>
            <td>URL state</td>
            <td>Router</td>
            <td>Search query, filters, pagination</td>
          </tr>
        </tbody>
      </table>

      <h3>Cache hierarchy and invalidation rules</h3>
      <ul>
        <li><strong>CDN cache:</strong> cache public GET responses with explicit TTL and revalidation tags.</li>
        <li><strong>BFF cache:</strong> short-lived aggregation cache for hot endpoints.</li>
        <li><strong>Client server-state cache:</strong> dedupe requests, background refresh, stale-while-revalidate UX.</li>
        <li><strong>Invalidation triggers:</strong> write mutation, permission change, deploy with schema change, manual admin purge.</li>
      </ul>

      <h2>Failure Modes and Resilience Design</h2>
      <table>
        <thead>
          <tr>
            <th>Failure</th>
            <th>User-facing behavior</th>
            <th>Architecture guardrail</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Slow upstream API</td>
            <td>Skeleton + partial data + stale banner</td>
            <td>Timeout budgets + fallback response path</td>
          </tr>
          <tr>
            <td>One dependency fails in aggregated response</td>
            <td>Partial render with explicit degraded state</td>
            <td>BFF partial response contract</td>
          </tr>
          <tr>
            <td>Burst traffic event</td>
            <td>Graceful latency increase, no white screen</td>
            <td>CDN offload + rate limiting + circuit breaker</td>
          </tr>
          <tr>
            <td>Auth refresh failure</td>
            <td>Soft logout + preserved intent for retry</td>
            <td>Centralized session refresh policy</td>
          </tr>
        </tbody>
      </table>

      <h2>Performance and Cost Trade-offs</h2>
      <ul>
        <li>Set a performance budget before optimizations (for example, p95 interaction under 150ms).</li>
        <li>Prioritize two biggest wins: request path reduction and JS bundle pressure.</li>
        <li>Call cost trade-off explicitly: aggressive SSR improves first paint but increases origin spend.</li>
        <li>Use progressive enhancement so low-end devices still complete core tasks reliably.</li>
      </ul>

      <h2>Security and Trust Boundaries</h2>
      <ul>
        <li>Keep tokens out of fragile client storage patterns; use secure session strategy aligned with platform.</li>
        <li>Define trust boundaries at CDN, BFF, and API edges.</li>
        <li>Mitigate XSS/CSRF with CSP, strict output encoding, and anti-CSRF controls where needed.</li>
        <li>Treat rate-limiting and abuse detection as architecture components, not afterthoughts.</li>
      </ul>

      <h2>Observability Plan</h2>
      <table>
        <thead>
          <tr>
            <th>Signal</th>
            <th>Metric</th>
            <th>Alert direction</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Frontend responsiveness</td>
            <td>p95 interaction latency by route</td>
            <td>Alert if sustained over budget for 15m</td>
          </tr>
          <tr>
            <td>Reliability</td>
            <td>Client-visible error rate for core flow</td>
            <td>Alert on threshold and region skew</td>
          </tr>
          <tr>
            <td>API health</td>
            <td>BFF upstream timeout and partial-response rate</td>
            <td>Alert on sudden slope changes</td>
          </tr>
          <tr>
            <td>User outcome</td>
            <td>Task completion rate for primary flow</td>
            <td>Alert on statistically significant drop</td>
          </tr>
        </tbody>
      </table>

      <h2>What to Say Out Loud (Architecture Script Cues)</h2>
      <ol>
        <li>"I will map architecture decisions directly to the requirements we already locked."</li>
        <li>"I am choosing rendering per route, not globally, because route goals differ."</li>
        <li>"I will use BFF to reduce client orchestration and keep domain contracts stable."</li>
        <li>"I am separating server truth from view state to prevent sync bugs."</li>
        <li>"I will make failure behavior explicit: empty, error, stale, and partial states."</li>
        <li>"Trade-off here: this improves first paint but increases server cost and cache complexity."</li>
        <li>"I will define invalidation triggers now so stale behavior is predictable."</li>
        <li>"I am adding observability hooks so architecture risk is measurable after launch."</li>
        <li>"Given time, I will prioritize the highest-traffic path before secondary flows."</li>
        <li>"I have a clear default now; next I will detail the data model and contracts."</li>
      </ol>

      <h2>Architecture Timebox for Interviews</h2>
      <h3>45-minute interview</h3>
      <table>
        <thead>
          <tr>
            <th>Time range</th>
            <th>What to do</th>
            <th>Output artifact</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>0:00-2:00</td>
            <td>Confirm requirement inputs that drive architecture</td>
            <td>Decision driver list</td>
          </tr>
          <tr>
            <td>2:00-5:00</td>
            <td>Draw high-level architecture and trust boundaries</td>
            <td>System diagram</td>
          </tr>
          <tr>
            <td>5:00-7:00</td>
            <td>Define route rendering strategy</td>
            <td>Route-by-route matrix</td>
          </tr>
          <tr>
            <td>7:00-9:00</td>
            <td>State/caching/failure model summary</td>
            <td>Risk + fallback notes</td>
          </tr>
        </tbody>
      </table>

      <h3>60-minute interview</h3>
      <table>
        <thead>
          <tr>
            <th>Time range</th>
            <th>What to do</th>
            <th>Output artifact</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>0:00-3:00</td>
            <td>Confirm requirement drivers and trade-off priorities</td>
            <td>Prioritized constraints list</td>
          </tr>
          <tr>
            <td>3:00-7:00</td>
            <td>Draw architecture and call out boundaries</td>
            <td>Full architecture diagram</td>
          </tr>
          <tr>
            <td>7:00-10:00</td>
            <td>Route rendering + caching layers</td>
            <td>Rendering and cache matrix</td>
          </tr>
          <tr>
            <td>10:00-12:00</td>
            <td>Resilience, observability, security recap</td>
            <td>Hardening checklist</td>
          </tr>
        </tbody>
      </table>

      <h2>Quick Drill: Typeahead Search Architecture in 7 Minutes</h2>
      <ul>
        <li><strong>Minute 0-1:</strong> Declare route strategy: SSR shell for first load, CSR for keystroke updates.</li>
        <li><strong>Minute 1-2:</strong> Draw request path: Browser -> CDN -> BFF -> Search API.</li>
        <li><strong>Minute 2-3:</strong> State split: server suggestions cache vs UI focus/index state.</li>
        <li><strong>Minute 3-4:</strong> Add cache rules: query-keyed client cache + short CDN TTL for popular prefixes.</li>
        <li><strong>Minute 4-5:</strong> Failure behavior: timeout fallback, empty state, partial stale display.</li>
        <li><strong>Minute 5-6:</strong> Add observability: p95 suggestion latency, error rate, zero-result rate.</li>
        <li><strong>Minute 6-7:</strong> State trade-off: simpler now with upgrade path for ranking/personalization later.</li>
      </ul>

      <h2>Before You Move to Data Model</h2>
      <ul>
        <li>You chose rendering mode by route and explained why.</li>
        <li>Boundaries between browser, edge, BFF, and APIs are explicit.</li>
        <li>Server truth, UI state, and URL state ownership is clear.</li>
        <li>Cache layers and invalidation triggers are concrete.</li>
        <li>Failure, observability, security, and cost trade-offs are acknowledged.</li>
      </ul>

      <h2>Next</h2>
      <ul>
        <li><a [routerLink]="['/', 'guides', 'system-design', 'radio', 'data-model']">D - Data model deep dive</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design', 'radio', 'interface']">I - Interface deep dive</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design', 'radio', 'optimizations']">O - Optimizations deep dive</a></li>
      </ul>
    </fa-guide-shell>
  `,
})
export class SystemDesignArchitectureArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
}
