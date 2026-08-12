// -----------------------------------------------------------------------------
// Frontend System Design Interview Preparation Guide
// Purpose
//   - Own preparation, readiness, and mock-practice intent.
//   - Send question discovery to /system-design.
//   - Send detailed answer-framework intent to the RADIO guide.
// -----------------------------------------------------------------------------

import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PUBLIC_EDITORIAL_FACTS } from '../../../core/content/public-editorial-facts';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [GuideShellComponent, RouterModule],
  styles: [`
    a {
      color: #7cc2ff;
      font-weight: 600;
      text-decoration: none;
    }
    a:hover {
      color: #a9dbff;
      text-decoration: underline;
    }
    .freshness {
      margin: 0 0 16px;
      color: color-mix(in srgb, var(--uf-text-tertiary) 86%, transparent);
      font-size: 12px;
    }
    .proof-band,
    .radio-teaser,
    .mock-callout {
      display: grid;
      gap: 14px;
      margin: 18px 0 24px;
      padding: 14px;
      border: 1px solid var(--uf-border-subtle);
      border-left: 3px solid color-mix(in srgb, var(--uf-accent) 50%, var(--uf-border-subtle));
      border-radius: 8px;
      background: color-mix(in srgb, var(--uf-surface-alt) 82%, transparent);
    }
    .proof-grid,
    .signal-grid,
    .format-grid,
    .checklist-grid,
    .practice-grid,
    .mistake-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
      gap: 12px;
      padding-left: 0;
      list-style: none;
    }
    .proof-grid {
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 140px), 1fr));
    }
    .proof-stat,
    .signal-card,
    .format-card,
    .practice-card,
    .mistake-card,
    .checklist-grid li {
      min-width: 0;
      border: 1px solid var(--uf-border-subtle);
      border-radius: 8px;
      padding: 12px;
      background: color-mix(in srgb, var(--uf-surface-alt) 74%, transparent);
    }
    .proof-stat strong {
      display: block;
      color: var(--uf-text-primary);
      font-size: 1rem;
    }
    .proof-stat span,
    .signal-card p,
    .format-card p,
    .practice-card p,
    .mistake-card p,
    .radio-teaser p,
    .mock-callout p {
      margin: 0;
      color: color-mix(in srgb, var(--uf-text-secondary) 90%, transparent);
    }
    .proof-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .proof-cta,
    .practice-card {
      display: grid;
      gap: 8px;
      text-decoration: none;
    }
    .proof-cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 40px;
      padding: 8px 12px;
      border: 1px solid var(--uf-border-subtle);
      border-radius: 8px;
      background: color-mix(in srgb, var(--uf-surface) 88%, transparent);
    }
    .proof-cta--primary {
      color: var(--uf-bg);
      background: var(--uf-accent);
      border-color: color-mix(in srgb, var(--uf-accent) 84%, var(--uf-border-subtle));
    }
    .practice-card:hover,
    .proof-cta:hover {
      border-color: color-mix(in srgb, var(--uf-accent) 50%, var(--uf-border-subtle));
      text-decoration: none;
    }
    .signal-card h3,
    .format-card h3,
    .practice-card h3,
    .mistake-card h3,
    .radio-teaser h3,
    .mock-callout h3 {
      margin: 0;
      color: var(--uf-text-primary);
    }
    .format-card ul,
    .radio-teaser ul,
    .mock-callout ul {
      margin-bottom: 0;
    }
    .prompt-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      color: color-mix(in srgb, var(--uf-text-tertiary) 88%, transparent);
      font-size: 0.78rem;
    }
    .prompt-meta span {
      padding: 2px 8px;
      border: 1px solid var(--uf-border-subtle);
      border-radius: 999px;
      background: color-mix(in srgb, var(--uf-surface) 82%, transparent);
    }
    .table-scroll {
      overflow-x: auto;
      margin: 14px 0;
    }
    table {
      width: 100%;
      min-width: 680px;
      border-collapse: collapse;
      font-size: 0.92rem;
    }
    th,
    td {
      border: 1px solid var(--uf-border-subtle);
      padding: 10px 12px;
      text-align: left;
      vertical-align: top;
    }
    th {
      color: var(--uf-text-primary);
      background: color-mix(in srgb, var(--uf-surface-alt) 86%, transparent);
    }
    .prep-sequence,
    .mock-loop {
      display: grid;
      gap: 10px;
      padding-left: 0;
      list-style: none;
      counter-reset: preparation-step;
    }
    .prep-sequence li,
    .mock-loop li {
      position: relative;
      min-width: 0;
      padding: 12px 12px 12px 52px;
      border: 1px solid var(--uf-border-subtle);
      border-radius: 8px;
      background: color-mix(in srgb, var(--uf-surface-alt) 74%, transparent);
      counter-increment: preparation-step;
    }
    .prep-sequence li::before,
    .mock-loop li::before {
      position: absolute;
      top: 12px;
      left: 12px;
      display: grid;
      width: 28px;
      height: 28px;
      place-items: center;
      border-radius: 999px;
      color: var(--uf-bg);
      background: var(--uf-accent);
      content: counter(preparation-step);
      font-weight: 700;
    }
    .prep-sequence strong,
    .mock-loop strong {
      color: var(--uf-text-primary);
    }
    .checklist-grid li {
      position: relative;
      padding-left: 38px;
    }
    .checklist-grid li::before {
      position: absolute;
      top: 12px;
      left: 12px;
      color: var(--uf-accent);
      content: '✓';
      font-weight: 800;
    }
    @media (max-width: 560px) {
      .proof-actions {
        align-items: stretch;
        flex-direction: column;
      }
      .proof-cta {
        width: 100%;
      }
    }
  `],
  template: `
  <fa-guide-shell
    title="Frontend System Design Interview Preparation Guide"
    subtitle="Build a focused preparation plan for frontend architecture interviews, from question formats and core signals to timed mocks and readiness checks."
    [minutes]="18"
    [tags]="['system-design','frontend','preparation','interviews']"
    [prev]="prev"
    [next]="next"
    [leftNav]="leftNav"
    [readerPromise]="readerPromise || undefined"
  >
    <div class="freshness" data-testid="system-design-guide-freshness">
      Last updated: August 2026 | Author: {{ editorialAuthor }}
    </div>

    <p>
      Frontend system design interview preparation is easier when you separate three
      jobs: learn what interviewers evaluate, practice both common question formats,
      and use feedback to close one weakness at a time. This guide gives you that
      preparation path without asking you to memorize a single ideal architecture.
    </p>
    <p>
      Start by choosing a prompt that matches your level:
      <a [routerLink]="['/system-design']">Browse frontend system design interview questions</a>.
      When you need a detailed
      structure for answering a prompt, continue to the
      <a [routerLink]="['/guides','system-design-blueprint','radio-framework']">RADIO answer framework</a>.
    </p>

    <div class="proof-band" data-testid="system-design-guide-proof">
      <div class="proof-grid" aria-label="Frontend system design preparation coverage">
        <div class="proof-stat">
          <strong>2 formats</strong>
          <span>application and component design</span>
        </div>
        <div class="proof-stat">
          <strong>5 stages</strong>
          <span>focused preparation sequence</span>
        </div>
        <div class="proof-stat">
          <strong>8 prompts</strong>
          <span>progressive practice map</span>
        </div>
        <div class="proof-stat">
          <strong>1 rubric</strong>
          <span>repeatable feedback loop</span>
        </div>
      </div>
      <div class="proof-actions" aria-label="System design preparation actions">
        <a class="proof-cta proof-cta--primary" [routerLink]="['/system-design']">
          Choose a practice question
        </a>
        <a class="proof-cta" [routerLink]="['/guides','system-design-blueprint','radio-framework']">
          Study the RADIO framework
        </a>
      </div>
    </div>

    <h2 id="what-frontend-system-design-interviews-test">What frontend system design interviews test</h2>
    <p>
      The interviewer is evaluating how you reduce ambiguity and defend client-side
      decisions, not how many tools you can name. Keep one user flow as the thread and
      explain what happens when data is slow, stale, missing, inaccessible, or larger
      than the first version can comfortably render.
    </p>
    <div class="signal-grid" data-testid="system-design-signal-grid">
      <div class="signal-card">
        <h3>Problem framing</h3>
        <p>Clarify users, core tasks, constraints, non-goals, scale, and success measures before choosing an architecture.</p>
      </div>
      <div class="signal-card">
        <h3>Frontend architecture</h3>
        <p>Show rendering paths, feature and component boundaries, ownership, state placement, and API integration.</p>
      </div>
      <div class="signal-card">
        <h3>Interface quality</h3>
        <p>Cover responsive behavior, accessibility, loading, empty, error, offline, and recovery states.</p>
      </div>
      <div class="signal-card">
        <h3>Trade-off judgment</h3>
        <p>Choose the simplest viable design, name its limits, and explain which evidence would justify more complexity.</p>
      </div>
    </div>

    <h2 id="frontend-vs-backend-scope">Frontend vs backend system design interview scope</h2>
    <p>
      Frontend answers still need backend awareness, but only at the boundary that
      changes browser behavior or the user experience. A preparation plan should spend
      most of its time on client architecture and use backend details to make contracts
      and constraints concrete.
    </p>
    <div class="table-scroll">
      <table data-testid="frontend-backend-scope-table">
        <thead>
          <tr>
            <th>Area</th>
            <th>Prioritize in a frontend interview</th>
            <th>Keep at boundary level</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Requirements</td>
            <td>User flow, devices, accessibility, latency, freshness, and failure expectations.</td>
            <td>Traffic estimates only when they change rendering, caching, or delivery choices.</td>
          </tr>
          <tr>
            <td>Architecture</td>
            <td>Routes, rendering strategy, feature ownership, component boundaries, and shared UI contracts.</td>
            <td>Service topology as a simple dependency map rather than a full infrastructure design.</td>
          </tr>
          <tr>
            <td>Data</td>
            <td>Client/server state boundaries, request shape, caching, invalidation, retries, and optimistic behavior.</td>
            <td>Storage and queue choices only when they affect the frontend contract.</td>
          </tr>
          <tr>
            <td>Quality</td>
            <td>Performance budgets, keyboard and screen-reader behavior, resilience, telemetry, and rollout.</td>
            <td>Capacity planning beyond the user-visible service levels you depend on.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2 id="frontend-system-design-interview-format">The two frontend system design question formats</h2>
    <p>
      Most prompts lean toward either product-scale application architecture or a deep
      UI component/system design. Identify the format early because each one rewards a
      different level of zoom.
    </p>
    <div class="format-grid" data-testid="system-design-question-formats">
      <article class="format-card">
        <h3>Application architecture</h3>
        <p>Examples include feeds, dashboards, collaborative tools, and cross-device applications.</p>
        <ul>
          <li>Prioritize routes, rendering, feature boundaries, and data flow.</li>
          <li>Explain cache ownership, realtime updates, permissions, and degraded modes.</li>
          <li>Show how teams can extend the design without coupling every feature.</li>
        </ul>
      </article>
      <article class="format-card">
        <h3>UI component and system design</h3>
        <p>Examples include autocomplete, notifications, uploaders, tables, and design systems.</p>
        <ul>
          <li>Prioritize component APIs, state machines, composition, and accessibility.</li>
          <li>Walk through interaction, async, loading, error, and keyboard states.</li>
          <li>Explain reuse boundaries, performance costs, testing, and versioning.</li>
        </ul>
      </article>
    </div>

    <h2 id="preparation-sequence">A practical frontend system design interview preparation sequence</h2>
    <p>
      Move through these stages in order. Repeat a stage when the rubric reveals a gap;
      accumulating more prompts is not a substitute for improving the same weak signal.
    </p>
    <ol class="prep-sequence" data-testid="system-design-preparation-sequence">
      <li><strong>Take a baseline.</strong> Answer one familiar prompt aloud without notes, then mark where you lost structure, depth, or time.</li>
      <li><strong>Close foundation gaps.</strong> Review rendering, state boundaries, API consumption, caching, accessibility, performance, and failure recovery.</li>
      <li><strong>Alternate question formats.</strong> Pair one application prompt with one component prompt so you learn when to zoom out or in.</li>
      <li><strong>Practise under changing constraints.</strong> Repeat a prompt after changing scale, device support, network quality, or collaboration needs.</li>
      <li><strong>Run scored mocks.</strong> Use the rubric below, choose one improvement, and redo the prompt until that signal becomes explicit.</li>
    </ol>

    <aside class="radio-teaser" data-testid="system-design-radio-teaser">
      <h3>Need a repeatable answer structure?</h3>
      <p>
        RADIO keeps an interview answer moving through Requirements, Architecture,
        Data, Interface, and Optimizations. Use this page to plan your preparation;
        use the dedicated guide for the complete method.
      </p>
      <a class="proof-cta" [routerLink]="['/guides','system-design-blueprint','radio-framework']">
        Use the RADIO framework for the 45-minute answer
      </a>
    </aside>

    <h2 id="readiness-checklist">Frontend system design interview readiness checklist</h2>
    <p>
      You are approaching interview readiness when you can demonstrate these behaviors
      without relying on a memorized solution.
    </p>
    <ul class="checklist-grid" data-testid="system-design-readiness-checklist">
      <li>Classify the prompt as application architecture, component/system design, or a hybrid.</li>
      <li>Clarify the main user flow, constraints, non-goals, scale, and success measures.</li>
      <li>Draw boundaries and name which layer or team owns each important decision.</li>
      <li>Separate local UI state, URL state, shared client state, and server data.</li>
      <li>Make request, cache, mutation, retry, cancellation, and stale-data behavior concrete.</li>
      <li>Cover loading, empty, error, offline, keyboard, focus, and screen-reader states.</li>
      <li>Connect performance and resilience choices to a bottleneck or measurable budget.</li>
      <li>Recap trade-offs and adapt the design when the interviewer changes a constraint.</li>
    </ul>

    <h2 id="rubric">Frontend system design interview rubric</h2>
    <p>
      Score the evidence you actually communicated, not the sophistication of the final
      diagram. A strong candidate makes priorities and trade-offs easy to follow.
    </p>
    <div class="table-scroll">
      <table data-testid="system-design-rubric-table">
        <thead>
          <tr>
            <th>Signal</th>
            <th>Needs work</th>
            <th>Interview-ready</th>
            <th>Strong signal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Requirements</td>
            <td>Starts designing before the core flow is clear.</td>
            <td>Clarifies users, scope, constraints, scale, and non-goals.</td>
            <td>Prioritizes conflicts and ties decisions to measurable user outcomes.</td>
          </tr>
          <tr>
            <td>Architecture</td>
            <td>Lists components without ownership or data flow.</td>
            <td>Explains rendering, feature boundaries, components, data flow, and dependencies.</td>
            <td>Shows extension, rollout, and team ownership boundaries with explicit costs.</td>
          </tr>
          <tr>
            <td>State and contracts</td>
            <td>Uses vague global state and leaves server behavior implicit.</td>
            <td>Separates state types and defines requests, cache policy, failures, and updates.</td>
            <td>Handles races, invalidation, optimistic behavior, degraded data, and recovery.</td>
          </tr>
          <tr>
            <td>Interface quality</td>
            <td>Describes only the successful pointer interaction.</td>
            <td>Covers responsive, loading, empty, error, keyboard, and accessibility states.</td>
            <td>Explains inclusive interaction policy and user-visible recovery under stress.</td>
          </tr>
          <tr>
            <td>Trade-offs</td>
            <td>Names patterns without explaining why they fit.</td>
            <td>Compares a viable option with at least one alternative and names its cost.</td>
            <td>Uses budgets and metrics to explain when the design should evolve.</td>
          </tr>
          <tr>
            <td>Communication</td>
            <td>Jumps between details and does not close the answer.</td>
            <td>Maintains a clear thread, checks alignment, and recaps the design.</td>
            <td>Adapts calmly when constraints change and preserves the decision narrative.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2 id="common-mistakes">Common mistakes in frontend system design preparation</h2>
    <div class="mistake-grid" data-testid="system-design-mistakes">
      <div class="mistake-card">
        <h3>Collecting prompts without feedback</h3>
        <p>Score every attempt and repeat the same prompt after fixing one weak signal.</p>
      </div>
      <div class="mistake-card">
        <h3>Memorizing one architecture</h3>
        <p>Change a constraint and practice rebuilding the decision instead of repeating a diagram.</p>
      </div>
      <div class="mistake-card">
        <h3>Preparing like a backend candidate</h3>
        <p>Bring the discussion back to rendering, state, interaction, accessibility, and user-visible failure.</p>
      </div>
      <div class="mistake-card">
        <h3>Skipping component questions</h3>
        <p>Practice reusable APIs and interaction state as deliberately as product-scale architecture.</p>
      </div>
      <div class="mistake-card">
        <h3>Ignoring difficult states</h3>
        <p>Add slow, empty, error, offline, stale, keyboard, and recovery behavior to every practice review.</p>
      </div>
      <div class="mistake-card">
        <h3>Waiting too long to run mocks</h3>
        <p>Begin speaking aloud early; silent study does not expose sequencing or communication gaps.</p>
      </div>
    </div>

    <h2 id="practice-map">Practice map</h2>
    <p>
      For example, start with a contained UI system, then add async data, application boundaries,
      realtime behavior, and senior-level ownership. The full
      <a [routerLink]="['/system-design']">question bank</a> lets you filter by level and format.
    </p>
    <div class="practice-grid" data-testid="system-design-practice-map">
      <a class="practice-card" [routerLink]="['/system-design','notification-toast-system']">
        <div class="prompt-meta"><span>Start</span><span>UI system</span></div>
        <h3>Toast Notification System</h3>
        <p>Practice ownership, queueing, timers, portals, focus safety, and live-region behavior.</p>
      </a>
      <a class="practice-card" [routerLink]="['/system-design','realtime-search-debounce-cache']">
        <div class="prompt-meta"><span>Async</span><span>Component</span></div>
        <h3>Realtime Search</h3>
        <p>Practice request timing, stale-result safety, caching, keyboard selection, and perceived speed.</p>
      </a>
      <a class="practice-card" [routerLink]="['/system-design','infinite-scroll-list']">
        <div class="prompt-meta"><span>Data</span><span>Performance</span></div>
        <h3>Infinite Scroll</h3>
        <p>Practice pagination, virtualization thresholds, restoration, and loading boundaries.</p>
      </a>
      <a class="practice-card" [routerLink]="['/system-design','news-feed-timeline']">
        <div class="prompt-meta"><span>Application</span><span>Freshness</span></div>
        <h3>News Feed Timeline</h3>
        <p>Practice route architecture, cursor data, optimistic interactions, media, and degraded states.</p>
      </a>
      <a class="practice-card" [routerLink]="['/system-design','ai-chat-textarea-design']">
        <div class="prompt-meta"><span>AI UI</span><span>Streaming</span></div>
        <h3>AI Chat Composer</h3>
        <p>Practice streaming state, send and cancel behavior, drafts, retries, and user control.</p>
      </a>
      <a class="practice-card" [routerLink]="['/system-design','component-design-system-architecture']">
        <div class="prompt-meta"><span>System</span><span>Scale</span></div>
        <h3>Component Design System</h3>
        <p>Practice API governance, tokens, accessibility contracts, versioning, and migration risk.</p>
      </a>
      <a class="practice-card" [routerLink]="['/system-design','live-comments-global-stream']">
        <div class="prompt-meta"><span>Realtime</span><span>Resilience</span></div>
        <h3>Live Comments Stream</h3>
        <p>Practice event flow, backpressure, batching, moderation, and scroll behavior.</p>
      </a>
      <a class="practice-card" [routerLink]="['/system-design','dashboard-widgets-draggable-resizable']">
        <div class="prompt-meta"><span>Senior</span><span>Ownership</span></div>
        <h3>Dashboard Widgets</h3>
        <p>Practice layout persistence, drag and resize state, permissions, migrations, and budgets.</p>
      </a>
    </div>

    <h2 id="mock-interview-loop">A repeatable mock interview loop</h2>
    <p>
      A mock is useful only when it changes the next attempt. Use the same loop for a
      solo recording, a peer session, or a realistic interviewer-led practice round.
    </p>
    <ol class="mock-loop" data-testid="system-design-mock-loop">
      <li><strong>Set the prompt and evidence.</strong> Choose a question, expected interview length, target level, and the rubric signals you want to demonstrate.</li>
      <li><strong>Answer aloud without rescue notes.</strong> Draw and narrate as you would in the interview; ask the mock interviewer to introduce one changed constraint.</li>
      <li><strong>Score observable behavior.</strong> Mark what you actually said for requirements, architecture, state, interface quality, trade-offs, and communication.</li>
      <li><strong>Choose one correction.</strong> Rewrite or rehearse only the weakest decision, then explain it in plain language.</li>
      <li><strong>Run the prompt again.</strong> Repeat later with a different constraint and confirm that the improvement survives without memorized wording.</li>
    </ol>
    <aside class="mock-callout">
      <h3>Keep a compact practice log</h3>
      <p>
        Record the prompt, format, date, weakest rubric signal, one correction, and the
        result of the repeat attempt. That history shows whether your preparation is
        building transferable judgment rather than familiarity with one question.
      </p>
    </aside>

    <h2 id="preparation-faq">Frontend system design interview preparation FAQ</h2>

    <h3>What is a frontend system design interview?</h3>
    <p>
      A frontend system design interview tests how you scope an ambiguous UI problem,
      define client architecture and state boundaries, consume APIs, handle user-visible
      failures, and explain accessibility, performance, and product trade-offs.
    </p>

    <h3>How do I prepare for a frontend system design interview?</h3>
    <p>
      Learn the round format, baseline yourself on a familiar prompt, use a repeatable
      answer method, practice both application and UI-component questions, score each
      attempt with a rubric, and repeat timed mocks until your gaps are predictable.
    </p>

    <h3>What format does a frontend system design interview use?</h3>
    <p>
      Most rounds use either a product-scale application prompt or a focused UI-component
      prompt. Both expect clarifying questions, a clear architecture, concrete state and
      interface decisions, and defensible trade-offs.
    </p>

    <h3>How are application architecture and UI component questions different?</h3>
    <p>
      Application prompts emphasize page boundaries, rendering, routing, data flow,
      caching, and cross-feature ownership. UI-component prompts go deeper on component
      APIs, interaction states, accessibility, async behavior, and performance.
    </p>

    <h3>How should I practice frontend system design questions?</h3>
    <p>
      Rotate through familiar, realtime, data-heavy, and senior architecture prompts.
      Record assumptions, draw the design, narrate trade-offs, score the result, and
      repeat the weakest section before attempting another full mock. Use the
      <a [routerLink]="['/system-design']">question bank</a> to choose the next prompt.
    </p>

    <h3>How do I know I am ready for a frontend system design interview?</h3>
    <p>
      You are ready when you can clarify scope quickly, keep one user flow as the thread,
      draw implementable client boundaries, cover loading and failure states, and explain
      the highest-risk trade-offs without relying on a memorized solution.
    </p>
  </fa-guide-shell>
  `,
})
export class FeSystemDesignFastFrameworkArticle {
  readonly editorialAuthor = PUBLIC_EDITORIAL_FACTS.author.name;
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
  @Input() readerPromise: string | null = null;
}
