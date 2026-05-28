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
      [leftNav]="leftNav"
      [readerPromise]="readerPromise || undefined">

      <h2>If You Remember One Thing</h2>
      <p>
        In a <strong>system design interview</strong>, Architecture is not about drawing more boxes.
        It is about proving that each boundary, rendering choice, and data path follows from Requirements.
        In the <strong>RADIO framework</strong>, this is where your <strong>frontend system design</strong>
        answer becomes defensible, measurable, and production-aware.
      </p>

      <h2>Scope Guard: What This Page Covers</h2>
      <p>
        This page is intentionally focused on <strong>system boundaries and rendering strategy</strong>:
        browser/edge/BFF/API boundaries, per-route rendering mode, and resilience guardrails.
        Treat it as a <strong>frontend client side architecture interview</strong> guide, not a backend topology tour.
      </p>
      <ul>
        <li>
          For entity shapes, state ownership tables, and invalidation contracts, continue with
          <a [routerLink]="['/', 'guides', 'system-design-blueprint', 'state-data']">D - Data model deep dive</a>.
        </li>
        <li>
          For interaction flows and UX state behavior, continue with
          <a [routerLink]="['/', 'guides', 'system-design-blueprint', 'ux']">I - Interface deep dive</a>.
        </li>
        <li>
          For budgets and tuning tactics, continue with
          <a [routerLink]="['/', 'guides', 'system-design-blueprint', 'performance']">O - Optimizations deep dive</a>.
        </li>
      </ul>

      <h2>Client-side architecture layers</h2>
      <p>
        A strong frontend architecture answer separates client-side responsibilities before it talks about services.
        This keeps the interview grounded in UI delivery, route ownership, cache behavior, and production signals.
      </p>
      <table>
        <thead>
          <tr>
            <th>Layer</th>
            <th>Owns</th>
            <th>Interview signal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>View layer</td>
            <td>Page shell, reusable components, composition boundaries</td>
            <td>You can keep UI responsibility clear without over-splitting components.</td>
          </tr>
          <tr>
            <td>Routing and rendering</td>
            <td>Route ownership, CSR vs SSR vs SSG choice, hydration handoff</td>
            <td>You choose a frontend rendering strategy system design by route, not by preference.</td>
          </tr>
          <tr>
            <td>Data access / BFF boundary</td>
            <td>API client, auth/session shaping, aggregation, response normalization</td>
            <td>You avoid leaking orchestration and trust decisions into components.</td>
          </tr>
          <tr>
            <td>Server-state cache</td>
            <td>Query keys, freshness, dedupe, refetch, invalidation triggers</td>
            <td>You control consistency, stale behavior, and race risk.</td>
          </tr>
          <tr>
            <td>UI state</td>
            <td>Modals, selected rows, focused item, drafts, optimistic flags</td>
            <td>You keep local interaction state separate from server truth.</td>
          </tr>
          <tr>
            <td>Telemetry</td>
            <td>Web vitals, client errors, API timeout, task completion</td>
            <td>You can prove architecture risk is measurable after launch.</td>
          </tr>
        </tbody>
      </table>

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

      <h2>What to draw in the architecture diagram</h2>
      <p>
        The goal is an <strong>interview-ready frontend architecture diagram</strong>: enough boxes to explain
        boundaries, not enough to disappear into backend internals.
      </p>
      <table>
        <thead>
          <tr>
            <th>Diagram element</th>
            <th>Include</th>
            <th>Why it matters</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Browser and app shell</td>
            <td>Shell, route container, feature modules, hydration boundary</td>
            <td>Shows where interactive frontend work begins.</td>
          </tr>
          <tr>
            <td>Route / rendering boundary</td>
            <td>CSR, SSR, SSG, or edge rendering per key route</td>
            <td>Makes route by route rendering strategy explicit.</td>
          </tr>
          <tr>
            <td>State and cache layers</td>
            <td>Server-state cache, URL state, UI state, persistence if needed</td>
            <td>Prevents server truth and local interaction state from blending together.</td>
          </tr>
          <tr>
            <td>API / BFF boundary</td>
            <td>API client, BFF, downstream APIs, auth/session checks</td>
            <td>Shows where aggregation, trust, and response shaping live.</td>
          </tr>
          <tr>
            <td>Failure and observability hooks</td>
            <td>Timeouts, partial response path, error reporting, web-vitals capture</td>
            <td>Proves the architecture has fallback and measurement paths.</td>
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

      <h2>When BFF and edge belong in the answer</h2>
      <p>
        A <strong>frontend system design BFF</strong> is useful only when it changes the frontend architecture,
        latency path, or trust boundary. Name it deliberately and explain what moves out of the client.
      </p>
      <table>
        <thead>
          <tr>
            <th>Use BFF / edge when</th>
            <th>Skip it when</th>
            <th>Trade-off to say out loud</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Multiple APIs must be aggregated for one screen</td>
            <td>The page calls one stable endpoint directly</td>
            <td>"This reduces client orchestration but adds an operational hop."</td>
          </tr>
          <tr>
            <td>Auth/session shaping or permissions affect response shape</td>
            <td>The client can safely receive the same public payload</td>
            <td>"I am centralizing trust decisions outside reusable UI code."</td>
          </tr>
          <tr>
            <td>Global latency or cacheable personalization matters</td>
            <td>The route is auth-heavy and not cacheable</td>
            <td>"Edge helps the read path, but observability and runtime limits get harder."</td>
          </tr>
          <tr>
            <td>Partial response semantics improve the user experience</td>
            <td>All dependencies must succeed or the flow cannot continue</td>
            <td>"I will return usable partial data with explicit degraded UI state."</td>
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

      <h2>Prompt-specific architecture decisions</h2>
      <p>
        Use prompt families to show that your frontend system design tradeoffs are contextual, not memorized.
      </p>
      <table>
        <thead>
          <tr>
            <th>Prompt</th>
            <th>Architecture decisions to surface</th>
            <th>Risk to call out</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><a [routerLink]="['/', 'system-design', 'realtime-search-debounce-cache']">Autocomplete / realtime search</a></td>
            <td>SSR shell + CSR updates, debounced request path, query-keyed cache, BFF for ranking/personalization if needed</td>
            <td>Stale response races and p95 suggestion latency</td>
          </tr>
          <tr>
            <td><a [routerLink]="['/', 'system-design', 'news-feed-timeline']">News feed</a></td>
            <td>Cursor pagination, virtualized timeline, media prefetch, freshness policy, route-level cache strategy</td>
            <td>Duplicate items, stale feed, and heavy media on low-end devices</td>
          </tr>
          <tr>
            <td><a [routerLink]="['/', 'system-design', 'dashboard-widgets-draggable-resizable']">Dashboard widgets</a></td>
            <td>CSR dashboard, widget isolation, layout persistence, refresh schedule, permission-aware data fetch</td>
            <td>One slow widget blocking the whole screen</td>
          </tr>
          <tr>
            <td><a [routerLink]="['/', 'system-design', 'ai-chat-textarea-design']">AI chat</a></td>
            <td>Streaming path, draft persistence, message ordering, reconnect behavior, optimistic/error states</td>
            <td>Interrupted streams and duplicated messages after retry</td>
          </tr>
          <tr>
            <td><a [routerLink]="['/', 'system-design', 'component-design-system-architecture']">Design system architecture</a></td>
            <td>Package boundaries, token pipeline, component API contracts, documentation/versioning, adoption telemetry</td>
            <td>Breaking changes across teams and inconsistent token usage</td>
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

      <h2>Architecture FAQ</h2>
      <h3>What is frontend system design architecture?</h3>
      <p>
        Frontend system design architecture is the interview step where you choose client-side boundaries,
        rendering strategy, data flow, cache layers, BFF or API boundaries, and resilience guardrails that satisfy the requirements.
      </p>

      <h3>How do I choose CSR, SSR, SSG, or edge rendering?</h3>
      <p>
        Choose rendering per route. Use SSR or SSG for SEO and fast public entry routes, CSR for highly interactive
        authenticated tools, and edge rendering when global latency or cacheable personalization changes the user experience.
      </p>

      <h3>What should I draw in a frontend architecture interview?</h3>
      <p>
        Draw the browser, app shell, router and rendering boundary, server-state cache, UI state, API or BFF boundary,
        downstream services, failure paths, and observability hooks.
      </p>

      <h3>When should I use a BFF in frontend system design?</h3>
      <p>
        Use a BFF when it reduces client orchestration, aggregates multiple APIs, shapes auth/session-aware responses,
        enables partial responses, or gives a cleaner caching and latency boundary. Skip it when it is backend topology noise.
      </p>

      <h3>How is frontend architecture different from data model or interface design?</h3>
      <p>
        Architecture chooses system boundaries, rendering modes, data flow, cache layers, and resilience paths. Data model
        details entities and ownership, while interface design details components, interactions, accessibility, and UI states.
      </p>

      <h2>Next</h2>
      <ul>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'state-data']">D - Data model deep dive</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'ux']">I - Interface deep dive</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'performance']">O - Optimizations deep dive</a></li>
      </ul>
    </fa-guide-shell>
  `,
})
export class SystemDesignArchitectureArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
  @Input() readerPromise: string | null = null;
}
