import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, GuideShellComponent],
  styles: [`
    .radio-steps {
      display: grid;
      gap: 14px;
      margin: 8px 0 4px;
      width: 100%;
      max-width: none;
    }

    .radio-flow {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 8px;
      margin: 10px 0 14px;
      padding: 10px;
      border: 1px solid var(--uf-border-subtle);
      border-radius: 14px;
      background: color-mix(in srgb, var(--uf-text-primary) 4%, var(--uf-surface));
    }

    .radio-flow-step {
      min-width: 0;
      border: 1px solid color-mix(in srgb, var(--uf-border-subtle) 78%, var(--uf-accent) 22%);
      border-radius: 10px;
      padding: 9px 10px;
      background: color-mix(in srgb, var(--uf-surface-alt) 88%, var(--uf-surface));
    }

    .radio-flow-step strong {
      display: block;
      margin-bottom: 3px;
      color: var(--uf-text-primary);
      font-size: 13px;
    }

    .radio-flow-step span {
      display: block;
      color: color-mix(in srgb, var(--uf-text-secondary) 90%, transparent);
      font-size: 12px;
      line-height: 1.35;
    }

    .answer-asset {
      border: 1px solid color-mix(in srgb, var(--uf-border-subtle) 74%, var(--uf-accent) 26%);
      border-radius: 14px;
      padding: 14px;
      margin: 8px 0 18px;
      background:
        linear-gradient(180deg, color-mix(in srgb, var(--uf-accent) 10%, transparent), transparent 48%),
        color-mix(in srgb, var(--uf-surface) 94%, var(--uf-surface-alt));
      box-shadow: var(--uf-card-shadow);
    }

    .answer-asset p {
      margin-bottom: 10px;
    }

    .asset-signals {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin: 10px 0 0;
    }

    .asset-signal {
      border: 1px solid var(--uf-border-subtle);
      border-radius: 10px;
      padding: 10px;
      background: color-mix(in srgb, var(--uf-text-primary) 4%, var(--uf-surface));
    }

    .asset-signal strong {
      display: block;
      margin-bottom: 4px;
      color: var(--uf-text-primary);
      font-size: 13px;
    }

    .asset-signal span {
      color: color-mix(in srgb, var(--uf-text-secondary) 90%, transparent);
      font-size: 12px;
      line-height: 1.4;
    }

    .answer-template {
      margin: 10px 0 16px;
      padding: 12px;
      border-radius: 12px;
      border: 1px solid var(--uf-border-subtle);
      background: color-mix(in srgb, #020617 86%, var(--uf-surface));
      color: #e5e7eb;
      overflow-x: auto;
      white-space: pre-wrap;
      font-size: 13px;
      line-height: 1.55;
    }

    .answer-template code {
      color: inherit;
      background: transparent;
      padding: 0;
      white-space: pre-wrap;
    }

    .worked-example {
      display: grid;
      gap: 10px;
      margin: 10px 0 16px;
    }

    .worked-example-step {
      border: 1px solid var(--uf-border-subtle);
      border-radius: 10px;
      padding: 10px 12px;
      background: color-mix(in srgb, var(--uf-text-primary) 4%, var(--uf-surface));
    }

    .worked-example-step strong {
      display: block;
      margin-bottom: 4px;
      color: var(--uf-text-primary);
    }

    .radio-step {
      border: 1px solid var(--uf-border-subtle);
      border-radius: 14px;
      padding: 14px;
      width: 100%;
      background: linear-gradient(
        180deg,
        color-mix(in srgb, var(--uf-surface-alt) 92%, var(--uf-surface)),
        color-mix(in srgb, var(--uf-surface) 90%, var(--uf-surface-alt))
      );
      box-shadow: var(--uf-card-shadow);
    }

    .radio-step-head {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 12px;
      align-items: start;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--uf-border-subtle);
    }

    .radio-letter {
      width: 34px;
      height: 34px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      font-weight: 800;
      color: var(--uf-text-primary);
      background: color-mix(in srgb, var(--uf-accent) 28%, var(--uf-surface));
      border: 1px solid color-mix(in srgb, var(--uf-accent) 36%, var(--uf-border-subtle));
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--uf-accent) 12%, transparent);
    }

    .radio-step-title {
      margin: 0 0 4px;
      font-weight: 800;
      color: var(--uf-text-primary);
      font-size: 16px;
    }

    .radio-step-goal {
      margin: 0;
      color: color-mix(in srgb, var(--uf-text-secondary) 92%, transparent);
    }

    .radio-timebox {
      margin: 0;
      font-size: 13px;
      color: color-mix(in srgb, var(--uf-text-secondary) 90%, transparent);
      border: 1px solid var(--uf-border-subtle);
      border-radius: 999px;
      padding: 6px 10px;
      background: color-mix(in srgb, var(--uf-text-primary) 6%, var(--uf-surface));
      white-space: nowrap;
    }

    .radio-step-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }

    .radio-col {
      border: 1px solid var(--uf-border-subtle);
      border-radius: 10px;
      padding: 10px 12px;
      min-width: 0;
      background: color-mix(in srgb, var(--uf-text-primary) 4%, var(--uf-surface));
    }

    .radio-col-title {
      margin: 0 0 6px;
      font-size: 12px;
      letter-spacing: .03em;
      text-transform: uppercase;
      font-weight: 800;
      color: color-mix(in srgb, var(--uf-text-tertiary) 86%, transparent);
    }

    .radio-col ul {
      margin: 0;
      padding-left: 0;
      list-style: none;
    }

    .radio-col li {
      margin: 6px 0;
      padding-left: 13px;
      position: relative;
      overflow-wrap: anywhere;
      word-break: break-word;
      hyphens: auto;
      line-height: 1.45;
    }

    .radio-col li::before {
      content: '•';
      position: absolute;
      left: 0;
      top: 0;
      color: color-mix(in srgb, var(--uf-accent) 78%, var(--uf-text-primary));
    }

    .script-cues {
      list-style: none;
      counter-reset: cue;
      padding-left: 0;
      margin: 10px 0 4px;
    }

    .script-cues li {
      counter-increment: cue;
      position: relative;
      margin: 10px 0;
      padding: 10px 12px 10px 44px;
      border: 1px solid var(--uf-border-subtle);
      border-radius: 10px;
      background: color-mix(in srgb, var(--uf-text-primary) 4%, var(--uf-surface));
      line-height: 1.45;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .script-cues li::before {
      content: counter(cue);
      position: absolute;
      left: 12px;
      top: 9px;
      width: 20px;
      height: 20px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      font-size: 11px;
      font-weight: 800;
      color: var(--uf-text-primary);
      border: 1px solid color-mix(in srgb, var(--uf-accent) 34%, var(--uf-border-subtle));
      background: color-mix(in srgb, var(--uf-accent) 22%, var(--uf-surface));
    }

    .mini-checklist {
      list-style: none;
      padding-left: 0;
      margin: 8px 0 6px;
    }

    .mini-checklist li {
      position: relative;
      padding-left: 28px;
      margin: 10px 0;
      line-height: 1.45;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .mini-checklist li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0.2em;
      width: 14px;
      height: 14px;
      border-radius: 4px;
      border: 1px solid color-mix(in srgb, var(--uf-border-subtle) 72%, var(--uf-accent) 28%);
      background: color-mix(in srgb, var(--uf-text-primary) 6%, var(--uf-surface));
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--uf-surface) 92%, transparent);
    }

    @media (max-width: 1100px) {
      .radio-step-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .radio-flow {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .asset-signals {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 820px) {
      .radio-step-head {
        grid-template-columns: auto 1fr;
      }

      .radio-timebox {
        grid-column: 1 / -1;
        width: fit-content;
      }

      .radio-step-grid {
        grid-template-columns: 1fr;
      }

      .radio-flow {
        grid-template-columns: 1fr;
      }
    }
  `],
  template: `
      <fa-guide-shell
      title="Frontend System Design Interview Prep: The RADIO Framework"
      [minutes]="20"
      [tags]="['system design', 'interview prep', 'radio framework']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav"
      [readerPromise]="readerPromise || undefined">

      <section class="answer-asset" aria-label="Frontend system design interview answer asset">
        <h2>Use this if your interviewer asks: "How would you design X?"</h2>
        <p>
          This page is a frontend system design interview answer asset, not just a RADIO definition.
          Use it when you need a repeatable way to answer open-ended prompts about autocomplete,
          news feed, chat, dashboards, design systems, or any UI architecture question.
        </p>
        <div class="asset-signals">
          <div class="asset-signal">
            <strong>Copyable 45-minute answer structure</strong>
            <span>Start with the template below, then adapt the timebox to the prompt and interviewer.</span>
          </div>
          <div class="asset-signal">
            <strong>Works for autocomplete, news feed, chat, dashboards, and design systems</strong>
            <span>Keep one core flow as the thread while the product surface changes.</span>
          </div>
          <div class="asset-signal">
            <strong>Turn a broad prompt into a 45-minute frontend system design interview answer.</strong>
            <span>Use RADIO to clarify scope, sketch architecture, define data and interface contracts, and close with measurable trade-offs.</span>
          </div>
        </div>
      </section>

      <h2>If You Remember Only One Thing (60 seconds)</h2>
      <p>
        RADIO is a practical <strong>frontend system design interview prep framework</strong>, not just an acronym to
        memorize. Use the RADIO method when you need to move from requirements to architecture, data model, interface,
        and optimizations without rambling. In a 45-minute or 60-minute interview, Requirements defines scope,
        Architecture explains the system shape, Data model covers contracts and state, Interface maps user behavior,
        and Optimizations closes with performance, reliability, observability, security, and trade-offs.
      </p>

      <h2>RADIO framework snapshot</h2>
      <p>
        Use this RADIO framework frontend system design snapshot when you need the short version:
        each step has a purpose, a visible output, and a signal the interviewer can score.
      </p>
      <table>
        <thead>
          <tr>
            <th>RADIO step</th>
            <th>Purpose</th>
            <th>Typical output</th>
            <th>Interviewer signal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Requirements</strong></td>
            <td>Lock user, flow, constraints, non-goals, and success metrics.</td>
            <td>Scope box, NFR list, assumptions, and priority order.</td>
            <td>You prevent the answer from solving the wrong problem.</td>
          </tr>
          <tr>
            <td><strong>Architecture</strong></td>
            <td>Show the frontend system shape and delivery path.</td>
            <td>Client architecture, rendering choice, data flow, and failure path.</td>
            <td>You connect product needs to technical boundaries.</td>
          </tr>
          <tr>
            <td><strong>Data</strong></td>
            <td>Define truth, ownership, cache behavior, and consistency rules.</td>
            <td>Entities, state split, cache keys, invalidation, and stale-state rules.</td>
            <td>You understand where frontend complexity and race conditions live.</td>
          </tr>
          <tr>
            <td><strong>Interface</strong></td>
            <td>Turn the design into component, API, event, and accessibility contracts.</td>
            <td>Component tree, API/interface contract, state map, keyboard and error behavior.</td>
            <td>You can make architecture implementable for real users.</td>
          </tr>
          <tr>
            <td><strong>Optimizations</strong></td>
            <td>Prioritize the riskiest production constraints and measurable trade-offs.</td>
            <td>Performance budget, observability plan, security baseline, and trade-off backlog.</td>
            <td>You can defend production readiness instead of listing random improvements.</td>
          </tr>
        </tbody>
      </table>

      <h2>What each RADIO step proves to the interviewer</h2>
      <ul class="mini-checklist">
        <li><strong>Requirements:</strong> you can scope ambiguity and protect the core user flow.</li>
        <li><strong>Architecture:</strong> you can draw frontend boundaries before debating implementation details.</li>
        <li><strong>Data:</strong> you can separate server truth, client state, cache state, and stale UI risk.</li>
        <li><strong>Interface:</strong> you can define component responsibility, API behavior, accessibility, and user states.</li>
        <li><strong>Optimizations:</strong> you can prioritize performance, reliability, observability, security, and trade-offs.</li>
      </ul>

      <h2>45-minute interview flow</h2>
      <div class="radio-flow" aria-label="45-minute RADIO interview flow">
        <div class="radio-flow-step">
          <strong>Requirements</strong>
          <span>Clarify users, scope, constraints, and success metrics.</span>
        </div>
        <div class="radio-flow-step">
          <strong>Architecture</strong>
          <span>Sketch client/server boundaries, rendering, routing, and data flow.</span>
        </div>
        <div class="radio-flow-step">
          <strong>Data</strong>
          <span>Model API contracts, client state, cache keys, and invalidation.</span>
        </div>
        <div class="radio-flow-step">
          <strong>Interface</strong>
          <span>Define components, states, accessibility, events, and errors.</span>
        </div>
        <div class="radio-flow-step">
          <strong>Optimizations</strong>
          <span>Choose the highest-risk performance, reliability, and security trade-offs.</span>
        </div>
      </div>

      <h2>Frontend system design interview answer template</h2>
      <p>
        Use this copyable 45-minute answer structure when the prompt is broad and the interviewer expects
        a practical path from requirements to implementation trade-offs.
      </p>
      <pre class="answer-template"><code>Opening:
I will answer this with RADIO: Requirements, Architecture, Data, Interface, and Optimizations.
I will keep one core user flow as the thread and call out trade-offs as constraints change.

0:00-0:06 Requirements:
I will clarify the primary user, core flow, must-haves, non-goals, scale, latency, accessibility, and success metrics.

0:06-0:15 Architecture:
I will draw the browser/app shell, rendering strategy, state layer, API or BFF boundary, and failure paths.

0:15-0:20 Data:
I will define entities, server truth, client-only state, cache keys, invalidation, and stale-state behavior.

0:20-0:27 Interface:
I will define component ownership, APIs or events, loading/empty/error states, keyboard behavior, and announcements.

0:27-0:42 Optimizations:
I will pick the riskiest constraint and discuss performance budget, reliability, observability, security, and trade-offs.

0:42-0:45 Recap:
I would ship the simple path first, instrument the risky flow, and use metrics to choose the next iteration.</code></pre>

      <h2>How to answer a frontend system design interview in 45 minutes</h2>
      <ul class="mini-checklist">
        <li>Start by naming the core user flow and two non-goals so the answer has boundaries.</li>
        <li>Draw the client architecture before debating frameworks or low-level implementation details.</li>
        <li>Separate server data, client state, derived state, cache state, and transient UI state.</li>
        <li>Define the visible interface: component ownership, user states, keyboard flow, and error behavior.</li>
        <li>Close with measurable optimizations, observability, security, and the trade-off you would ship first.</li>
      </ul>

      <h2>Frontend system design checklist</h2>
      <p>
        Before you move on, confirm that your answer has scope, architecture, data contracts, user-visible
        interface behavior, and at least one measurable production trade-off.
      </p>

      <h2>Interface taxonomy</h2>
      <p>
        Interface is where many frontend system design answers stay too vague. Make the contract explicit:
        what crosses the network, what crosses component boundaries, what crosses realtime channels, and how
        errors become user-visible states.
      </p>
      <table>
        <thead>
          <tr>
            <th>Interface type</th>
            <th>What to define</th>
            <th>Why it matters</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Server-client API contracts</strong></td>
            <td>Request shape, response shape, pagination, auth, errors, retries, and rate limits.</td>
            <td>Prevents hand-wavy backend dependency and makes loading, stale, and failure states concrete.</td>
          </tr>
          <tr>
            <td><strong>Client-client events/callbacks</strong></td>
            <td>Cross-component events, callbacks, store actions, analytics events, and cancellation behavior.</td>
            <td>Keeps ownership clear when multiple surfaces react to one user intent.</td>
          </tr>
          <tr>
            <td><strong>Component props/events</strong></td>
            <td>Controlled vs uncontrolled props, emitted events, state ownership, validation, and disabled states.</td>
            <td>Turns architecture into reusable UI contracts that a team can implement.</td>
          </tr>
          <tr>
            <td><strong>Realtime event schema</strong></td>
            <td>Event name, payload, ordering, dedupe key, reconnect behavior, and optimistic rollback rules.</td>
            <td>Prevents realtime UI from drifting out of sync under retries, reconnects, or duplicate events.</td>
          </tr>
          <tr>
            <td><strong>Error taxonomy and UI state mapping</strong></td>
            <td>Validation, auth, rate limit, timeout, partial failure, stale data, empty result, and retry states.</td>
            <td>Shows that the interface works outside the happy path and remains understandable to users.</td>
          </tr>
        </tbody>
      </table>

      <h2>RADIO Cheat Sheet</h2>
      <div class="radio-steps">
        <article class="radio-step">
          <div class="radio-step-head">
            <span class="radio-letter">R</span>
            <div>
              <p class="radio-step-title">Requirements</p>
              <p class="radio-step-goal">Lock scope, constraints, and success criteria before proposing tech.</p>
            </div>
            <p class="radio-timebox"><strong>Timebox:</strong> 6 min (45m) / 8 min (60m)</p>
          </div>
          <div class="radio-step-grid">
            <section class="radio-col">
              <p class="radio-col-title">Key questions</p>
              <ul>
                <li>Who is the primary user and top 1-2 flows?</li>
                <li>What is must-have vs nice-to-have vs out-of-scope?</li>
                <li>What scale matters (DAU, peak QPS, regions)?</li>
                <li>Which NFRs matter most (latency, a11y, SEO, reliability)?</li>
                <li>What existing constraints do we inherit (stack, APIs, deadline)?</li>
              </ul>
            </section>
            <section class="radio-col">
              <p class="radio-col-title">Artifacts to produce</p>
              <ul>
                <li>Scope box (Must / Nice / Out)</li>
                <li>Functional + non-functional requirement list</li>
                <li>Assumptions/risk log</li>
                <li>Success metrics snapshot</li>
              </ul>
            </section>
            <section class="radio-col">
              <p class="radio-col-title">Common pitfalls</p>
              <ul>
                <li>Jumping to solution too early</li>
                <li>No explicit non-goals</li>
                <li>Ignoring NFRs like a11y/perf</li>
              </ul>
            </section>
          </div>
        </article>

        <article class="radio-step">
          <div class="radio-step-head">
            <span class="radio-letter">A</span>
            <div>
              <p class="radio-step-title">Architecture</p>
              <p class="radio-step-goal">Choose end-to-end flow and rendering strategy that fits constraints.</p>
            </div>
            <p class="radio-timebox"><strong>Timebox:</strong> 9 min (45m) / 12 min (60m)</p>
          </div>
          <div class="radio-step-grid">
            <section class="radio-col">
              <p class="radio-col-title">Key questions</p>
              <ul>
                <li>What is the request flow from user event to rendered UI?</li>
                <li>Route-by-route rendering strategy (SSR/CSR/SSG/edge)?</li>
                <li>Where is the client/server boundary (BFF or direct APIs)?</li>
                <li>How do we handle retries, timeouts, offline, partial failure?</li>
                <li>What breaks first at 10x traffic/features?</li>
              </ul>
            </section>
            <section class="radio-col">
              <p class="radio-col-title">Artifacts to produce</p>
              <ul>
                <li>High-level architecture diagram (browser/CDN/edge/BFF/services)</li>
                <li>Rendering strategy matrix by route/state</li>
                <li>Sequence diagram for critical flow</li>
                <li>API contract sketch + error model</li>
              </ul>
            </section>
            <section class="radio-col">
              <p class="radio-col-title">Common pitfalls</p>
              <ul>
                <li>One-size-fits-all rendering choice</li>
                <li>No failure-path design</li>
                <li>No stated trade-offs</li>
              </ul>
            </section>
          </div>
        </article>

        <article class="radio-step">
          <div class="radio-step-head">
            <span class="radio-letter">D</span>
            <div>
              <p class="radio-step-title">Data model</p>
              <p class="radio-step-goal">Define client/server data contracts and state consistency rules.</p>
            </div>
            <p class="radio-timebox"><strong>Timebox:</strong> 5 min (45m) / 6 min (60m)</p>
          </div>
          <div class="radio-step-grid">
            <section class="radio-col">
              <p class="radio-col-title">Key questions</p>
              <ul>
                <li>What entities exist and how do they relate?</li>
                <li>What is server truth vs client-derived state?</li>
                <li>What are cache keys, TTLs, and invalidation triggers?</li>
                <li>How are search/sort/filter encoded in URL/state?</li>
                <li>Which UI states must be first-class?</li>
              </ul>
            </section>
            <section class="radio-col">
              <p class="radio-col-title">Artifacts to produce</p>
              <ul>
                <li>Entity schema / TS interfaces sketch</li>
                <li>UI states matrix (idle/loading/success/empty/error/stale/partial)</li>
                <li>Caching strategy (HTTP + memory + SW if needed)</li>
                <li>URL-state synchronization rules</li>
              </ul>
            </section>
            <section class="radio-col">
              <p class="radio-col-title">Common pitfalls</p>
              <ul>
                <li>Hand-wavy cache invalidation</li>
                <li>Mixing domain and view state</li>
                <li>Missing empty/error/partial states</li>
              </ul>
            </section>
          </div>
        </article>

        <article class="radio-step">
          <div class="radio-step-head">
            <span class="radio-letter">I</span>
            <div>
              <p class="radio-step-title">Interface</p>
              <p class="radio-step-goal">Translate design into components, interactions, and accessibility behavior.</p>
            </div>
            <p class="radio-timebox"><strong>Timebox:</strong> 7 min (45m) / 9 min (60m)</p>
          </div>
          <div class="radio-step-grid">
            <section class="radio-col">
              <p class="radio-col-title">Key questions</p>
              <ul>
                <li>How are components split and who owns state?</li>
                <li>Where is data fetched/hydrated in the tree?</li>
                <li>What are keyboard, focus, and screen-reader behaviors?</li>
                <li>How do we prevent unnecessary re-renders?</li>
                <li>Which design system primitives are reused?</li>
              </ul>
            </section>
            <section class="radio-col">
              <p class="radio-col-title">Artifacts to produce</p>
              <ul>
                <li>Component tree with ownership annotations</li>
                <li>Interaction flow for happy + sad paths</li>
                <li>a11y behavior checklist (focus, roles, announcements)</li>
                <li>State transition map for key interaction</li>
              </ul>
            </section>
            <section class="radio-col">
              <p class="radio-col-title">Common pitfalls</p>
              <ul>
                <li>Overusing global state</li>
                <li>Ignoring keyboard/screen-reader flows</li>
                <li>No loading/skeleton/error UX plan</li>
              </ul>
            </section>
          </div>
        </article>

        <article class="radio-step">
          <div class="radio-step-head">
            <span class="radio-letter">O</span>
            <div>
              <p class="radio-step-title">Optimizations</p>
              <p class="radio-step-goal">Use the largest block for performance, observability, security, trade-offs, and deep dives.</p>
            </div>
            <p class="radio-timebox"><strong>Timebox:</strong> 15 min (45m) / 21 min (60m)</p>
          </div>
          <div class="radio-step-grid">
            <section class="radio-col">
              <p class="radio-col-title">Key questions</p>
              <ul>
                <li>What is the performance budget and target metrics?</li>
                <li>Which optimizations are highest impact first?</li>
                <li>What telemetry proves this works in production?</li>
                <li>What security basics are required (XSS/CSRF/auth/rate limits)?</li>
                <li>What trade-offs and follow-up iterations are acceptable?</li>
              </ul>
            </section>
            <section class="radio-col">
              <p class="radio-col-title">Artifacts to produce</p>
              <ul>
                <li>Perf budget table (LCP, INP, CLS, bundle KB, API latency)</li>
                <li>Optimization backlog (impact vs effort)</li>
                <li>Observability plan (RUM, logs, traces, alerts)</li>
                <li>Security baseline checklist</li>
              </ul>
            </section>
            <section class="radio-col">
              <p class="radio-col-title">Common pitfalls</p>
              <ul>
                <li>Optimization without measurement</li>
                <li>Skipping observability</li>
                <li>Treating security as backend-only</li>
              </ul>
            </section>
          </div>
        </article>
      </div>

      <h2>45-minute interview timeline</h2>
      <table>
        <thead>
          <tr>
            <th>Time range</th>
            <th>RADIO step</th>
            <th>Output artifact</th>
            <th>What to say out loud</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>0:00-0:06</td>
            <td><strong>R - Requirements</strong></td>
            <td>Scope box, must-have list, NFR priorities</td>
            <td>I will lock the core flow, non-goals, and success metrics before architecture.</td>
          </tr>
          <tr>
            <td>0:06-0:15</td>
            <td><strong>A - Architecture</strong></td>
            <td>Client architecture, rendering choice, critical request flow</td>
            <td>The browser, CDN, app shell, BFF/API, and state layer are the boxes I will draw first.</td>
          </tr>
          <tr>
            <td>0:15-0:20</td>
            <td><strong>D - Data model</strong></td>
            <td>Entities, server truth, client state, cache keys</td>
            <td>I will separate server-originated data from client-only UI state.</td>
          </tr>
          <tr>
            <td>0:20-0:27</td>
            <td><strong>I - Interface</strong></td>
            <td>Component ownership, API contract, interaction states</td>
            <td>Now I will define component responsibility, API shape, and accessibility behavior.</td>
          </tr>
          <tr>
            <td>0:27-0:42</td>
            <td><strong>O - Optimizations/deep dive</strong></td>
            <td>Perf budget, stale-state plan, observability, security trade-offs</td>
            <td>I will spend the most time on the riskiest frontend constraints and measurable trade-offs.</td>
          </tr>
          <tr>
            <td>0:42-0:45</td>
            <td><strong>Recap</strong></td>
            <td>Decision summary + next steps</td>
            <td>The final trade-off is what I would ship first and what I would validate next.</td>
          </tr>
        </tbody>
      </table>

      <h2>60-minute interview timeline</h2>
      <table>
        <thead>
          <tr>
            <th>Time range</th>
            <th>RADIO step</th>
            <th>Output artifact</th>
            <th>What to say out loud</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>0:00-0:08</td>
            <td><strong>R - Requirements</strong></td>
            <td>Scope box, user flows, NFRs, explicit non-goals</td>
            <td>I will use RADIO, but I will adapt depth based on what the interviewer cares about.</td>
          </tr>
          <tr>
            <td>0:08-0:20</td>
            <td><strong>A - Architecture</strong></td>
            <td>Primary architecture, one alternative, rendering matrix</td>
            <td>I will compare the simple path with the scalable path before choosing.</td>
          </tr>
          <tr>
            <td>0:20-0:26</td>
            <td><strong>D - Data model</strong></td>
            <td>Entity model, cache policy, URL/client state split</td>
            <td>These are the data contracts that prevent stale or inconsistent UI.</td>
          </tr>
          <tr>
            <td>0:26-0:35</td>
            <td><strong>I - Interface</strong></td>
            <td>Component tree, API/interface contract, a11y state map</td>
            <td>This is where I will define responsibility boundaries and the interaction contract.</td>
          </tr>
          <tr>
            <td>0:35-0:56</td>
            <td><strong>O - Optimizations/deep dive</strong></td>
            <td>Performance budget, resilience plan, telemetry, security, rollout risks</td>
            <td>I will go deep on the bottleneck most likely to fail the user experience.</td>
          </tr>
          <tr>
            <td>0:56-1:00</td>
            <td><strong>Recap</strong></td>
            <td>Risks, trade-offs, iteration plan</td>
            <td>Given more time, I would validate with load, accessibility, and real-user metrics.</td>
          </tr>
        </tbody>
      </table>

      <h2>Candidate script</h2>
      <ol class="script-cues">
        <li><strong>Opening:</strong> I will use RADIO to move from requirements to architecture, data, interface, and the highest-risk deep dive.</li>
        <li><strong>Requirements lock:</strong> Before drawing, I want to confirm the primary user, top flow, must-haves, non-goals, and success metrics.</li>
        <li><strong>Architecture transition:</strong> With scope fixed, I will draw the browser, app shell, state layer, API boundary, and rendering strategy.</li>
        <li><strong>Data model transition:</strong> Now I will separate server truth, client-only state, cache keys, invalidation, and stale-state behavior.</li>
        <li><strong>Interface/API transition:</strong> I will define component responsibility, public props/events or APIs, loading states, and accessibility behavior.</li>
        <li><strong>Optimization deep dive:</strong> I will choose the riskiest constraint and discuss measurable performance, reliability, observability, and security trade-offs.</li>
        <li><strong>Challenged assumption:</strong> If that constraint changes, I would revise the rendering/cache/API choice first, then re-check the UI states it affects.</li>
        <li><strong>Final recap:</strong> I would ship the simple path first, instrument the risky flow, and use real metrics to decide the next iteration.</li>
      </ol>

      <h2>Frontend system design interview checklist</h2>
      <p>
        After the RADIO pass, use the
        <a [routerLink]="['/', 'guides', 'system-design-blueprint', 'checklist']">frontend system design interview checklist</a>
        to catch final-review gaps before you stop.
      </p>
      <table>
        <thead>
          <tr>
            <th>Step</th>
            <th>Artifact</th>
            <th>Interviewer signal</th>
            <th>Common miss</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>R</strong></td>
            <td>Scope box, NFRs, success metrics, non-goals</td>
            <td>You avoid solving the wrong problem.</td>
            <td>Jumping into components before clarifying the core flow.</td>
          </tr>
          <tr>
            <td><strong>A</strong></td>
            <td>Client architecture, rendering matrix, request flow</td>
            <td>You can map product requirements to frontend architecture.</td>
            <td>Drawing backend infrastructure while ignoring client boundaries.</td>
          </tr>
          <tr>
            <td><strong>D</strong></td>
            <td>Entities, state ownership, cache keys, invalidation rules</td>
            <td>You understand server data, client state, and stale UI risk.</td>
            <td>Mixing domain data, view state, and derived state.</td>
          </tr>
          <tr>
            <td><strong>I</strong></td>
            <td>Component responsibility, API/interface contract, UI states, a11y behavior</td>
            <td>You can turn architecture into an implementable UI contract.</td>
            <td>Skipping keyboard, focus, loading, empty, and error states.</td>
          </tr>
          <tr>
            <td><strong>O</strong></td>
            <td>Perf budget, observability, security baseline, trade-off backlog</td>
            <td>You can defend production readiness with measurable priorities.</td>
            <td>Listing optimizations without measurement or user impact.</td>
          </tr>
        </tbody>
      </table>

      <h2>Example: Answer autocomplete with RADIO</h2>
      <p>
        This frontend system design interview example shows how to answer autocomplete with RADIO in a short,
        complete pass before the interviewer asks for deeper trade-offs.
      </p>
      <div class="worked-example">
        <section class="worked-example-step">
          <strong>R - Requirements</strong>
          Scope the prompt to search suggestions for the latest typed query. Set a perceived latency target
          around 150 ms after debounce, require keyboard navigation and screen-reader announcements, and make
          stale results, empty results, API errors, and mobile input behavior explicit.
        </section>
        <section class="worked-example-step">
          <strong>A - Architecture</strong>
          Use a controlled input, debounce layer, cancellable request flow, query result cache, and a clear API
          or BFF boundary. Render idle, loading, results, empty, error, and stale states from one state machine
          instead of scattering flags across components.
        </section>
        <section class="worked-example-step">
          <strong>D - Data</strong>
          Model <code>Suggestion&#123; id, label, type, metadata &#125;</code>, a query-keyed cache, request id or
          abort controller, selected suggestion state, and URL/input synchronization only if the product needs
          shareable search state.
        </section>
        <section class="worked-example-step">
          <strong>I - Interface</strong>
          Treat the input as a combobox and the results as a listbox. Define arrow-key navigation, enter/escape
          behavior, focus recovery after selection, loading copy, empty copy, and announced result counts.
        </section>
        <section class="worked-example-step">
          <strong>O - Optimizations</strong>
          Cancel outdated requests, guard latest-query-wins, cap result count, cache short-lived suggestions,
          track API p95 latency and zero-result rate, and fall back to recent searches if the network fails.
        </section>
      </div>

      <h2>Run RADIO on autocomplete, news feed, and chat</h2>
      <table>
        <thead>
          <tr>
            <th>Prompt</th>
            <th>R/A/D/I/O one-liners</th>
            <th>Practice route</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Autocomplete search</strong></td>
            <td>
              R: latest query wins under 150ms perceived latency. A: debounced input, cancellable requests, BFF/API boundary.
              D: <code>Suggestion&#123;id,label,type&#125;</code>, query-keyed cache, idle/loading/results/empty/error/stale states.
              I: combobox/listbox, keyboard navigation, focus recovery. O: stale response guards, zero-result telemetry, API latency alerts.
            </td>
            <td><a [routerLink]="['/', 'system-design', 'realtime-search-debounce-cache']">Real-time search design</a></td>
          </tr>
          <tr>
            <td><strong>News feed</strong></td>
            <td>
              R: users need fresh posts, infinite loading, and reliable interaction feedback. A: feed shell, paginated API, optimistic action path.
              D: posts, authors, cursors, reaction state, normalized cache. I: card ownership, composer, skeletons, retry states. O: virtualization,
              image lazy loading, prefetch, RUM for scroll jank and failed mutations.
            </td>
            <td><a [routerLink]="['/', 'system-design', 'news-feed-timeline']">News feed timeline</a></td>
          </tr>
          <tr>
            <td><strong>Chat input</strong></td>
            <td>
              R: users need low-latency composition, submission, and recovery from failed sends. A: input shell, streaming/message API, draft persistence.
              D: draft, message, attachment, pending/error states. I: textarea resizing, shortcuts, screen-reader announcements. O: offline retry,
              rate-limit handling, observability for send latency and dropped messages.
            </td>
            <td><a [routerLink]="['/', 'system-design', 'ai-chat-textarea-design']">AI chat text area</a></td>
          </tr>
        </tbody>
      </table>

      <h2>Common interviewer follow-ups</h2>
      <table>
        <thead>
          <tr>
            <th>Follow-up</th>
            <th>Answer pattern</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>What if scope doubles halfway through?</td>
            <td>Restate the new must-have, keep the original core flow stable, and explicitly move one lower-value feature to phase two.</td>
          </tr>
          <tr>
            <td>What if the API is slow or unreliable?</td>
            <td>Add timeout, retry, stale-cache fallback, clear error UI, and telemetry for latency/error rate before changing the whole architecture.</td>
          </tr>
          <tr>
            <td>What changes on mobile?</td>
            <td>Prioritize interaction latency, smaller payloads, touch targets, viewport-safe layouts, and reduced background work.</td>
          </tr>
          <tr>
            <td>How do you prove accessibility?</td>
            <td>Name roles, keyboard paths, focus transitions, announcements, and the manual or automated checks you would run.</td>
          </tr>
          <tr>
            <td>How do you prevent stale data?</td>
            <td>Define cache keys, invalidation triggers, latest-intent guards, optimistic rollback rules, and visible stale/error states.</td>
          </tr>
          <tr>
            <td>What is your performance budget?</td>
            <td>Pick user-facing metrics first: LCP/INP/CLS, interaction latency, API p95, long tasks, bundle KB, and memory pressure.</td>
          </tr>
          <tr>
            <td>What security belongs in frontend design?</td>
            <td>Cover auth boundary, CSRF/XSS risks, output escaping, safe URL handling, rate-limit UX, and never exposing secrets client-side.</td>
          </tr>
        </tbody>
      </table>

      <h2>What good vs weak answers sound like</h2>
      <table>
        <thead>
          <tr>
            <th>Step</th>
            <th>Weak answer</th>
            <th>Strong answer</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>R</strong></td>
            <td>I will build all the features and make it scalable.</td>
            <td>I will optimize the primary flow first, list must-haves/non-goals, and set latency, accessibility, and reliability targets.</td>
          </tr>
          <tr>
            <td><strong>A</strong></td>
            <td>I will use React and a backend API.</td>
            <td>I will draw the app shell, routing/rendering choice, state boundary, API/BFF boundary, and failure paths.</td>
          </tr>
          <tr>
            <td><strong>D</strong></td>
            <td>The backend stores the data and the frontend shows it.</td>
            <td>I will define entities, server truth, client-only state, derived state, cache keys, TTLs, and invalidation triggers.</td>
          </tr>
          <tr>
            <td><strong>I</strong></td>
            <td>I will make components and pass props.</td>
            <td>I will define component ownership, public APIs/events, loading/empty/error states, focus behavior, and announcements.</td>
          </tr>
          <tr>
            <td><strong>O</strong></td>
            <td>I will optimize performance and add monitoring.</td>
            <td>I will pick the riskiest bottleneck, set a budget, choose two high-impact optimizations, and instrument the flow.</td>
          </tr>
        </tbody>
      </table>

      <h2>RADIO Framework FAQ</h2>
      <h3>What is the RADIO framework in frontend system design?</h3>
      <p>
        RADIO is a frontend system design answer template that moves through Requirements,
        Architecture, Data, Interface, and Optimizations so the answer has scope, system shape,
        contracts, user behavior, and production trade-offs.
      </p>

      <h3>How do I use RADIO to answer a frontend system design interview question?</h3>
      <p>
        Start by clarifying the user flow and constraints, then sketch the frontend architecture, model server and
        client state, define component and API interfaces, and close with the highest-risk optimizations. Keep one core
        flow as the thread so every RADIO step supports the same answer.
      </p>

      <h3>What should I draw during a RADIO answer?</h3>
      <p>
        Draw a scope box, client architecture, request flow, data contract, component/interface ownership,
        UI state map, and optimization backlog. Each artifact should connect to the same core user flow.
      </p>

      <h3>How do I use RADIO for autocomplete, news feed, or chat?</h3>
      <p>
        Keep the RADIO steps stable while the prompt changes. For autocomplete, go deep on stale requests and
        combobox behavior; for news feed, pagination and cache consistency; for chat, realtime events, drafts,
        and recovery.
      </p>

      <h3>Is RADIO the best framework for frontend system design interviews?</h3>
      <p>
        RADIO is a strong default because it keeps frontend answers ordered from scope to architecture, data
        contracts, interface behavior, and optimization trade-offs. Adapt it when the interviewer asks to go deeper
        in one area.
      </p>

      <h2>Next</h2>
      <ul>
        <li><a [routerLink]="['/', 'system-design']">Frontend system design questions bank</a></li>
        <li><a [routerLink]="['/', 'system-design', 'infinite-scroll-list']">Practice infinite scroll frontend system design</a></li>
        <li><a [routerLink]="['/', 'system-design', 'notification-toast-system']">Practice notification system frontend design</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'radio-requirements']">Frontend system design requirements checklist</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'architecture']">A - Architecture deep dive</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'state-data']">D - Data model deep dive</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'ux']">I - Interface deep dive</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'performance']">Performance optimization guide</a></li>
      </ul>

      <h2>Self-check</h2>
      <table>
        <thead>
          <tr>
            <th>Check</th>
            <th>Answer</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Is every RADIO step actionable?</td>
            <td>Yes. Each step has explicit goals, questions, and timeboxed actions.</td>
          </tr>
          <tr>
            <td>Are artifacts included for each step?</td>
            <td>Yes. Every step has concrete interview artifacts to draw/write.</td>
          </tr>
          <tr>
            <td>Does it work for a frontend-heavy problem?</td>
            <td>Yes. It includes rendering strategy, UI states, a11y, caching, and perf budgets.</td>
          </tr>
          <tr>
            <td>Does it avoid vague advice?</td>
            <td>Yes. It uses script cues, templates, and decision-level trade-offs.</td>
          </tr>
          <tr>
            <td>Does it include both 45 and 60 minute timelines?</td>
            <td>Yes. Both timelines are included with outputs and speaking cues.</td>
          </tr>
        </tbody>
      </table>
    </fa-guide-shell>
  `,
})
export class SystemDesignRadioFrameworkArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
  @Input() readerPromise: string | null = null;
}
