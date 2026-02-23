import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, GuideShellComponent],
  styles: [`
    :host ::ng-deep .content .radio-steps {
      display: grid;
      gap: 14px;
      margin: 8px 0 4px;
      width: 100%;
      max-width: none;
    }

    :host ::ng-deep .content .radio-step {
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

    :host ::ng-deep .content .radio-step-head {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 12px;
      align-items: start;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--uf-border-subtle);
    }

    :host ::ng-deep .content .radio-letter {
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

    :host ::ng-deep .content .radio-step-title {
      margin: 0 0 4px;
      font-weight: 800;
      color: var(--uf-text-primary);
      font-size: 16px;
    }

    :host ::ng-deep .content .radio-step-goal {
      margin: 0;
      color: color-mix(in srgb, var(--uf-text-secondary) 92%, transparent);
    }

    :host ::ng-deep .content .radio-timebox {
      margin: 0;
      font-size: 13px;
      color: color-mix(in srgb, var(--uf-text-secondary) 90%, transparent);
      border: 1px solid var(--uf-border-subtle);
      border-radius: 999px;
      padding: 6px 10px;
      background: color-mix(in srgb, var(--uf-text-primary) 6%, var(--uf-surface));
      white-space: nowrap;
    }

    :host ::ng-deep .content .radio-step-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }

    :host ::ng-deep .content .radio-col {
      border: 1px solid var(--uf-border-subtle);
      border-radius: 10px;
      padding: 10px 12px;
      min-width: 0;
      background: color-mix(in srgb, var(--uf-text-primary) 4%, var(--uf-surface));
    }

    :host ::ng-deep .content .radio-col-title {
      margin: 0 0 6px;
      font-size: 12px;
      letter-spacing: .03em;
      text-transform: uppercase;
      font-weight: 800;
      color: color-mix(in srgb, var(--uf-text-tertiary) 86%, transparent);
    }

    :host ::ng-deep .content .radio-col ul {
      margin: 0;
      padding-left: 0;
      list-style: none;
    }

    :host ::ng-deep .content .radio-col li {
      margin: 6px 0;
      padding-left: 13px;
      position: relative;
      overflow-wrap: anywhere;
      word-break: break-word;
      hyphens: auto;
      line-height: 1.45;
    }

    :host ::ng-deep .content .radio-col li::before {
      content: '•';
      position: absolute;
      left: 0;
      top: 0;
      color: color-mix(in srgb, var(--uf-accent) 78%, var(--uf-text-primary));
    }

    :host ::ng-deep .content .script-cues {
      list-style: none;
      counter-reset: cue;
      padding-left: 0;
      margin: 10px 0 4px;
    }

    :host ::ng-deep .content .script-cues li {
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

    :host ::ng-deep .content .script-cues li::before {
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

    :host ::ng-deep .content .mini-checklist {
      list-style: none;
      padding-left: 0;
      margin: 8px 0 6px;
    }

    :host ::ng-deep .content .mini-checklist li {
      position: relative;
      padding-left: 28px;
      margin: 10px 0;
      line-height: 1.45;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    :host ::ng-deep .content .mini-checklist li::before {
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
      :host ::ng-deep .content .radio-step-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 820px) {
      :host ::ng-deep .content .radio-step-head {
        grid-template-columns: auto 1fr;
      }

      :host ::ng-deep .content .radio-timebox {
        grid-column: 1 / -1;
        width: fit-content;
      }

      :host ::ng-deep .content .radio-step-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  template: `
    <fa-guide-shell
      title="RADIO Framework Cheat Sheet + Interview Timeline for Frontend System Design"
      [minutes]="20"
      [tags]="['system design', 'radio framework', 'frontend system design']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">

      <h2>Suggested SEO Snippets</h2>
      <ul>
        <li><strong>Meta title:</strong> RADIO Framework for Frontend System Design Interviews</li>
        <li><strong>Meta description:</strong> Use the RADIO framework to ace frontend system design interviews with reusable artifacts, timelines, and scripts for focused preparation.</li>
      </ul>

      <h2>If You Remember Only One Thing (60 seconds)</h2>
      <p>
        In a <strong>system design interview</strong>, do not wing architecture. Run the <strong>RADIO framework</strong> in order:
        Requirements, Architecture, Data model, Interface, Optimizations.
        For each step, produce one concrete artifact and say one explicit trade-off.
        That keeps your answer structured, frontend-specific, and easy for interviewers to evaluate.
        Use this as your default for <strong>system design interview preparation</strong> in any <strong>frontend system design</strong> round.
      </p>

      <h2>RADIO Cheat Sheet</h2>
      <div class="radio-steps">
        <article class="radio-step">
          <div class="radio-step-head">
            <span class="radio-letter">R</span>
            <div>
              <p class="radio-step-title">Requirements</p>
              <p class="radio-step-goal">Lock scope, constraints, and success criteria before proposing tech.</p>
            </div>
            <p class="radio-timebox"><strong>Timebox:</strong> 6-8 min (45m) / 8-10 min (60m)</p>
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
            <p class="radio-timebox"><strong>Timebox:</strong> 10-12 min (45m) / 14-16 min (60m)</p>
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
            <p class="radio-timebox"><strong>Timebox:</strong> 7-8 min (45m) / 9-10 min (60m)</p>
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
            <p class="radio-timebox"><strong>Timebox:</strong> 8-10 min (45m) / 10-12 min (60m)</p>
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
              <p class="radio-step-goal">Show production readiness: performance, observability, security, trade-offs.</p>
            </div>
            <p class="radio-timebox"><strong>Timebox:</strong> 5-7 min (45m) / 7-9 min (60m)</p>
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

      <h2>Interview Timeline</h2>

      <h3>45-Minute Interview</h3>
      <table>
        <thead>
          <tr>
            <th>Time range</th>
            <th>What to do</th>
            <th>Output artifact</th>
            <th>What to say out loud</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>0:00-0:03</td>
            <td>Clarify prompt, user, and scope boundaries</td>
            <td>Scope box draft</td>
            <td>I will optimize for one core flow first, then extend.</td>
          </tr>
          <tr>
            <td>0:03-0:09</td>
            <td>Requirements deep dive</td>
            <td>Functional/NFR checklist</td>
            <td>Let me confirm latency, accessibility, and SEO constraints.</td>
          </tr>
          <tr>
            <td>0:09-0:20</td>
            <td>Architecture proposal</td>
            <td>System diagram + rendering matrix</td>
            <td>I am choosing SSR for entry + CSR for interaction speed.</td>
          </tr>
          <tr>
            <td>0:20-0:28</td>
            <td>Data model and state design</td>
            <td>Entities + UI states matrix + cache policy</td>
            <td>Server owns truth; client cache is query-keyed with TTL.</td>
          </tr>
          <tr>
            <td>0:28-0:36</td>
            <td>Interface and interaction plan</td>
            <td>Component tree + flow</td>
            <td>Here is state ownership and keyboard/focus behavior.</td>
          </tr>
          <tr>
            <td>0:36-0:42</td>
            <td>Optimizations and hardening</td>
            <td>Perf budget + observability + security checklist</td>
            <td>I will prioritize optimizations by impact and measurable gain.</td>
          </tr>
          <tr>
            <td>0:42-0:45</td>
            <td>Wrap-up and trade-offs</td>
            <td>Decision summary + next steps</td>
            <td>Trade-off: simpler now, scalable path identified for phase two.</td>
          </tr>
        </tbody>
      </table>

      <h3>60-Minute Interview</h3>
      <table>
        <thead>
          <tr>
            <th>Time range</th>
            <th>What to do</th>
            <th>Output artifact</th>
            <th>What to say out loud</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>0:00-0:05</td>
            <td>Clarify goals, constraints, and success metrics</td>
            <td>Scope box + metrics</td>
            <td>I will use RADIO so we stay structured and complete.</td>
          </tr>
          <tr>
            <td>0:05-0:14</td>
            <td>Requirements and edge cases</td>
            <td>Requirement map + non-goals</td>
            <td>I am explicitly parking non-core features to protect depth.</td>
          </tr>
          <tr>
            <td>0:14-0:30</td>
            <td>Architecture with alternatives</td>
            <td>Primary architecture + one alternative</td>
            <td>Option A is faster to ship; Option B scales better long-term.</td>
          </tr>
          <tr>
            <td>0:30-0:40</td>
            <td>Data contracts and caching strategy</td>
            <td>Entity diagram + state matrix + cache plan</td>
            <td>These invalidation rules prevent stale UI in critical flows.</td>
          </tr>
          <tr>
            <td>0:40-0:50</td>
            <td>Interface, a11y, and rendering details</td>
            <td>Component ownership + interaction map</td>
            <td>This keeps re-renders localized and keyboard UX reliable.</td>
          </tr>
          <tr>
            <td>0:50-0:57</td>
            <td>Perf, observability, and security</td>
            <td>Perf budget + telemetry + security baseline</td>
            <td>I am tracking user-perceived speed, not just backend latency.</td>
          </tr>
          <tr>
            <td>0:57-1:00</td>
            <td>Final recap</td>
            <td>Risks, trade-offs, iteration plan</td>
            <td>Given more time, I would validate with load + accessibility audits.</td>
          </tr>
        </tbody>
      </table>

      <h2>What to Say Out Loud (Reusable Script Cues)</h2>
      <ol class="script-cues">
        <li>I will use the RADIO framework so we cover scope to production hardening in order.</li>
        <li>Before architecture, I want to lock must-haves, non-goals, and constraints.</li>
        <li>I am optimizing for the primary user flow first, then we can extend.</li>
        <li>For rendering, I will mix SSR for first paint and CSR for high-frequency interactions.</li>
        <li>I will separate server truth from client-derived UI state to avoid sync bugs.</li>
        <li>Let me define cache keys and invalidation now, so stale data behavior is explicit.</li>
        <li>I am calling out accessibility behavior early: focus, keyboard navigation, and announcements.</li>
        <li>Trade-off here: simpler implementation now vs higher complexity for future scale.</li>
        <li>I will prioritize optimizations by impact and measurable improvement against a perf budget.</li>
        <li>To wrap up: I have covered risks, observability, and what I would do in iteration two.</li>
      </ol>

      <h2>Mini Checklists</h2>

      <h3>Before You Start</h3>
      <ul class="mini-checklist">
        <li>Confirm the primary user and top task.</li>
        <li>Write must-have vs nice-to-have vs out-of-scope.</li>
        <li>Ask for scale, traffic pattern, and latency expectations.</li>
        <li>Set frontend performance targets (for example, p95 interaction latency).</li>
        <li>Confirm accessibility baseline (keyboard + screen reader behavior).</li>
        <li>Identify critical failure states (loading, empty, error, partial).</li>
        <li>State security basics to include (auth boundary, XSS/CSRF protections).</li>
        <li>Decide which artifacts you will draw in each RADIO step.</li>
      </ul>

      <h3>Before You Finish</h3>
      <ul class="mini-checklist">
        <li>Every RADIO step has one concrete artifact.</li>
        <li>Critical UI states are fully covered (loading/empty/error/stale/partial).</li>
        <li>Caching and invalidation rules are explicit.</li>
        <li>Performance budget and top two optimizations are stated.</li>
        <li>Accessibility behavior is described, not assumed.</li>
        <li>Observability includes key metrics and alert direction.</li>
        <li>Security basics are acknowledged in frontend context.</li>
        <li>Final trade-off + next iteration plan is clearly summarized.</li>
      </ul>

      <h2>Quick Drill: Run RADIO on a Typeahead Search in 7 Minutes</h2>
      <table>
        <thead>
          <tr>
            <th>Step</th>
            <th>Time</th>
            <th>Tiny template (what a good answer sounds like)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>R</strong></td>
            <td>1 min</td>
            <td>Goal: users find items in less than 150ms perceived response. In scope: suggestions + keyboard nav. Out of scope: personalized ranking.</td>
          </tr>
          <tr>
            <td><strong>A</strong></td>
            <td>1.5 min</td>
            <td>Input debounced at 150ms, cancel stale requests, fetch via BFF, SSR shell + CSR widget for fast interaction.</td>
          </tr>
          <tr>
            <td><strong>D</strong></td>
            <td>1.5 min</td>
            <td>Entity: <code>Suggestion&#123;id,label,type&#125;</code>. Cache by normalized query with short TTL; states: idle/loading/results/empty/error.</td>
          </tr>
          <tr>
            <td><strong>I</strong></td>
            <td>1.5 min</td>
            <td>Use combobox/listbox pattern, arrow keys + Enter, clear focus handling, highlight matched substrings.</td>
          </tr>
          <tr>
            <td><strong>O</strong></td>
            <td>1.5 min</td>
            <td>Perf budget: keystroke-to-suggestion p95 less than 150ms. Track latency/error/zero-result rate; add virtualization for long lists.</td>
          </tr>
        </tbody>
      </table>

      <h2>Next</h2>
      <ul>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'radio-requirements']">R - Requirements deep dive</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'architecture']">A - Architecture deep dive</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'state-data']">D - Data model deep dive</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'ux']">I - Interface deep dive</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'performance']">O - Optimizations deep dive</a></li>
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
}
