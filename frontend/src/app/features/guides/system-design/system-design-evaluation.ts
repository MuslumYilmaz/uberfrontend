import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, GuideShellComponent],
  template: `
    <fa-guide-shell
      title="Frontend System Design Interview Rubric and Scorecard"
      [minutes]="12"
      [tags]="['system design', 'rubric', 'scorecard', 'interview signals']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav"
      [readerPromise]="readerPromise || undefined">

      <h2>If You Remember One Thing</h2>
      <p>
        A <strong>frontend system design interview rubric</strong> scores evidence, not trivia.
        Interviewers want to see whether you can turn a vague prompt into scoped requirements,
        a browser-aware architecture, clear state and API boundaries, resilient interface
        behavior, measurable performance trade-offs, and a discussion they can follow.
      </p>
      <p>
        Use this scorecard while practicing: give yourself a 1-5 on each axis, write the
        missing evidence, then repeat the prompt with one clearer artifact or script cue.
        A strong hire signal is a decision that connects product constraints to browser
        behavior, names the trade-off, and explains how you would validate it.
      </p>

      <h2>Quick Scorecard</h2>
      <table>
        <thead>
          <tr>
            <th>Rubric axis</th>
            <th>What interviewers score</th>
            <th>Strong hire signal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Requirements clarity</td>
            <td>Users, core flow, constraints, non-goals, and success metrics</td>
            <td>You narrow scope before drawing and make assumptions explicit</td>
          </tr>
          <tr>
            <td>Architecture and rendering strategy</td>
            <td>Client shape, route split, SSR/CSR choices, ownership boundaries</td>
            <td>You choose rendering and composition based on product constraints</td>
          </tr>
          <tr>
            <td>State and data ownership</td>
            <td>Server state, client state, cache keys, freshness, pagination, sync</td>
            <td>You separate durable data from view state and explain invalidation</td>
          </tr>
          <tr>
            <td>Interface and API contracts</td>
            <td>Component responsibility, props/events, API shape, loading/error states</td>
            <td>You define contracts that keep UI behavior testable and accessible</td>
          </tr>
          <tr>
            <td>Performance, reliability, and accessibility</td>
            <td>Budgets, Core Web Vitals, failure modes, degraded UX, keyboard/focus behavior</td>
            <td>You protect slow devices, failure states, and assistive technology users</td>
          </tr>
          <tr>
            <td>Communication and trade-off judgment</td>
            <td>Structure, checkpoints, alternatives, risk, rollout, and validation</td>
            <td>You guide the interview like a technical design review</td>
          </tr>
        </tbody>
      </table>

      <h2>Rubric Details: Weak, Solid, Strong</h2>
      <table>
        <thead>
          <tr>
            <th>Axis</th>
            <th>Weak signal</th>
            <th>Solid signal</th>
            <th>Strong hire signal</th>
            <th>What to say out loud</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Requirements clarity</td>
            <td>Starts designing before clarifying users, devices, scale, or v1 scope</td>
            <td>Asks useful questions and states a workable v1</td>
            <td>Defines user-critical path, non-goals, constraints, success metrics, and risk assumptions</td>
            <td>"I will scope the primary flow first, then call out what I am deferring."</td>
          </tr>
          <tr>
            <td>Architecture and rendering strategy</td>
            <td>Draws generic boxes or chooses a framework without context</td>
            <td>Explains client modules, routes, data entry points, and rendering mode</td>
            <td>Compares CSR, SSR, islands, microfrontends, or BFF choices against SEO, latency, team ownership, and deployment risk</td>
            <td>"I am choosing this rendering path because the first route needs fast useful content, but later panels are highly interactive."</td>
          </tr>
          <tr>
            <td>State and data ownership</td>
            <td>Mixes server data, UI state, cache state, and form drafts into one store</td>
            <td>Separates local UI state from server cache and names key entities</td>
            <td>Defines cache keys, freshness, invalidation, optimistic updates, pagination, and conflict behavior</td>
            <td>"This belongs in server state because freshness and dedupe matter; this stays local because it only drives the component."</td>
          </tr>
          <tr>
            <td>Interface and API contracts</td>
            <td>Names components but does not define responsibilities or states</td>
            <td>Describes component boundaries, API responses, loading, empty, and error states</td>
            <td>Defines component contracts, data contracts, accessibility behavior, focus rules, and testable state transitions</td>
            <td>"The component contract should make loading, stale, error, and partial states explicit."</td>
          </tr>
          <tr>
            <td>Performance, reliability, and accessibility</td>
            <td>Adds lazy loading, caching, or memoization as random tactics</td>
            <td>Identifies likely bottlenecks and basic fallback behavior</td>
            <td>Sets budgets, measures p75 or p95 behavior, protects a11y, defines degraded UX, and includes rollback triggers</td>
            <td>"I will optimize the primary task path first and validate with route-level metrics, not averages."</td>
          </tr>
          <tr>
            <td>Communication and trade-off judgment</td>
            <td>Rambles, over-explains tools, or ignores interviewer hints</td>
            <td>Uses a clear structure and checks assumptions occasionally</td>
            <td>Leads with checkpoints, compares alternatives, explains why, and adapts depth when the interviewer redirects</td>
            <td>"I will pause here: does this scope match what you want me to optimize for?"</td>
          </tr>
        </tbody>
      </table>

      <h2>How This Maps to RADIO</h2>
      <p>
        RADIO gives you the artifacts. This <strong>frontend system design interview scorecard</strong>
        tells you whether those artifacts are strong enough to score.
      </p>
      <table>
        <thead>
          <tr>
            <th>RADIO step</th>
            <th>Rubric evidence</th>
            <th>Deep dive</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Requirements</td>
            <td>Scope box, users, constraints, success metrics, non-goals</td>
            <td><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'radio-requirements']">Requirements guide</a></td>
          </tr>
          <tr>
            <td>Architecture</td>
            <td>Rendering strategy, module boundaries, request path, ownership</td>
            <td><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'architecture']">Architecture guide</a></td>
          </tr>
          <tr>
            <td>Data</td>
            <td>Entity model, state ownership, cache keys, freshness and sync</td>
            <td><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'state-data']">State and data guide</a></td>
          </tr>
          <tr>
            <td>Interface</td>
            <td>Component contracts, API contracts, UI states, a11y and focus behavior</td>
            <td><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'ux']">Interface guide</a></td>
          </tr>
          <tr>
            <td>Optimizations</td>
            <td>Performance budgets, bottleneck diagnosis, rollout, validation, rollback</td>
            <td><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'performance']">Performance guide</a></td>
          </tr>
          <tr>
            <td>Final pass</td>
            <td>Red flags, missing trade-offs, and closing summary</td>
            <td><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'checklist']">Frontend system design final review</a></td>
          </tr>
        </tbody>
      </table>

      <h2>Mid-Level vs Senior Signals</h2>
      <table>
        <thead>
          <tr>
            <th>Area</th>
            <th>Mid-level signal</th>
            <th>Senior signal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Scope</td>
            <td>Clarifies the main feature and builds a reasonable v1</td>
            <td>Frames product trade-offs, non-goals, and risk before implementation detail</td>
          </tr>
          <tr>
            <td>Architecture</td>
            <td>Breaks the UI into modules and data flows</td>
            <td>Explains ownership boundaries, deployment constraints, rendering mode, and future change cost</td>
          </tr>
          <tr>
            <td>State</td>
            <td>Names local state, server data, and cache needs</td>
            <td>Defines invalidation, conflict behavior, offline/stale cases, and observability hooks</td>
          </tr>
          <tr>
            <td>Performance</td>
            <td>Mentions lazy loading, caching, virtualization, or memoization</td>
            <td>Diagnoses bottlenecks, sets budgets, prioritizes top fixes, and validates production impact</td>
          </tr>
          <tr>
            <td>Communication</td>
            <td>Explains choices clearly when asked</td>
            <td>Runs the interview as a collaborative design review with checkpoints and alternatives</td>
          </tr>
        </tbody>
      </table>

      <h2>Self-Review After a Mock Interview</h2>
      <ol>
        <li>Score each rubric axis from 1 to 5 immediately after the mock.</li>
        <li>For any axis under 4, write the missing evidence in one sentence.</li>
        <li>Pick one follow-up prompt that stresses the weakest axis.</li>
        <li>Repeat only the weakest section for 8-10 minutes before replaying the full answer.</li>
        <li>End with a 30-second summary: scope, architecture choice, biggest trade-off, and validation plan.</li>
      </ol>
      <table>
        <thead>
          <tr>
            <th>Score</th>
            <th>Meaning</th>
            <th>Next action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>No usable evidence for that axis</td>
            <td>Reread the matching RADIO guide and write a one-minute script</td>
          </tr>
          <tr>
            <td>2</td>
            <td>Some awareness, but vague or disconnected from the prompt</td>
            <td>Add concrete constraints, metrics, states, or trade-offs</td>
          </tr>
          <tr>
            <td>3</td>
            <td>Solid baseline, but not clearly senior</td>
            <td>Add alternatives, ownership, validation, or rollback thinking</td>
          </tr>
          <tr>
            <td>4</td>
            <td>Strong enough for most rounds</td>
            <td>Practice tighter communication and fewer detours</td>
          </tr>
          <tr>
            <td>5</td>
            <td>Clear strong-hire evidence</td>
            <td>Preserve the pattern and transfer it to another prompt</td>
          </tr>
        </tbody>
      </table>

      <h2>Common Red Flags</h2>
      <ul>
        <li><strong>Backend-only answer:</strong> spending the round on databases, queues, or sharding while the browser experience stays vague.</li>
        <li><strong>Jumping to diagrams:</strong> drawing components before users, scope, devices, and success metrics are clear.</li>
        <li><strong>Vague constraints:</strong> saying "it should be fast" without latency budgets, route priorities, or failure states.</li>
        <li><strong>No trade-offs:</strong> presenting SSR, caching, virtualization, or optimistic UI as pure upside.</li>
        <li><strong>Ignoring accessibility and performance:</strong> skipping keyboard flow, focus, announcements, slow devices, and Core Web Vitals.</li>
        <li><strong>Rambling without checkpoints:</strong> making it hard for the interviewer to redirect or confirm assumptions.</li>
      </ul>
      <p>
        If one of these shows up repeatedly, use the
        <a [routerLink]="['/', 'guides', 'system-design-blueprint', 'pitfalls']">frontend system design red flags</a>
        before another mock.
      </p>

      <h2>Worked Example: Score a Typeahead Answer</h2>
      <p>
        Scenario: the prompt is to design autocomplete for a product search box. A weak answer
        says "I will debounce and cache it." A stronger answer scopes the search journey,
        sets a suggestion latency budget, models query state and stale responses, defines
        loading and no-result UI, then explains the cache freshness trade-off.
      </p>
      <table>
        <thead>
          <tr>
            <th>Rubric axis</th>
            <th>Example score</th>
            <th>Missing evidence to add</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Requirements clarity</td>
            <td>4</td>
            <td>Confirm mobile keyboard behavior and minimum query length</td>
          </tr>
          <tr>
            <td>State and data ownership</td>
            <td>3</td>
            <td>Name cache key, TTL, stale response handling, and cancellation policy</td>
          </tr>
          <tr>
            <td>Performance and reliability</td>
            <td>3</td>
            <td>Add p95 suggestion latency, INP risk, retries, and degraded no-network behavior</td>
          </tr>
          <tr>
            <td>Communication</td>
            <td>4</td>
            <td>Pause after the architecture sketch and ask which constraint to deepen</td>
          </tr>
        </tbody>
      </table>

      <h2>Apply the Rubric to Practice Prompts</h2>
      <ul>
        <li><a [routerLink]="['/', 'system-design', 'realtime-search-debounce-cache']">Autocomplete frontend system design rubric</a>: score latency, caching, stale responses, and UI states.</li>
        <li><a [routerLink]="['/', 'system-design', 'infinite-scroll-list']">Infinite scroll system design evaluation</a>: score pagination, virtualization, accessibility, and recovery.</li>
        <li><a [routerLink]="['/', 'system-design', 'dashboard-widgets-draggable-resizable']">Dashboard frontend system design scorecard</a>: score layout ownership, drag performance, persistence, and constraints.</li>
        <li><a [routerLink]="['/', 'system-design', 'live-chart-high-frequency-updates']">Live chart system design interview evaluation</a>: score memory, rendering loop, overload behavior, and observability.</li>
        <li><a [routerLink]="['/', 'system-design', 'multi-step-form-autosave']">Multi-step form frontend system design rubric</a>: score validation, draft state, interaction latency, and recovery.</li>
        <li><a [routerLink]="['/', 'system-design', 'component-design-system-architecture']">Design system architecture interview rubric</a>: score API design, theming, accessibility, versioning, and bundle cost.</li>
      </ul>

      <h2>Closing Script</h2>
      <p>
        Use this when the interviewer asks you to summarize: "I scoped the primary user path,
        chose the frontend architecture around that path, separated state and API contracts,
        protected loading, error, accessibility, and performance behavior, and named the main
        trade-off. The next thing I would validate is whether the chosen bottleneck is real in
        production metrics."
      </p>
    </fa-guide-shell>
  `,
})
export class SystemDesignSignalsArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
  @Input() readerPromise: string | null = null;
}
