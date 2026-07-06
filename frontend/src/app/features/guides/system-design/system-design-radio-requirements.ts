import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, GuideShellComponent],
  template: `
    <fa-guide-shell
      title="Frontend System Design Requirements Checklist"
      [minutes]="16"
      [tags]="['system design', 'radio framework', 'requirements checklist']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav"
      [readerPromise]="readerPromise || undefined">

      <h2>If You Remember One Thing</h2>
      <p>
        Use this <strong>frontend system design requirements checklist</strong> as the <strong>RADIO Requirements</strong>
        step. In the first 5-8 minute checkpoint, ask design-changing clarifying questions, lock scope, define functional and
        non-functional requirements, choose success metrics, and hand off to architecture with a defensible answer.
      </p>

      <h2>Why Requirements Decide the Interview</h2>
      <p>
        Interviewers are not scoring how fast you draw boxes. They are scoring whether you can choose the right problem before
        proposing a solution. In the <strong>RADIO framework</strong>, Requirements is the control point for everything else.
      </p>
      <ul>
        <li><strong>Clarity:</strong> You define what success means before coding details.</li>
        <li><strong>Prioritization:</strong> You separate must-haves from nice-to-haves.</li>
        <li><strong>Risk management:</strong> You surface unknowns and assumptions early.</li>
        <li><strong>Trade-off quality:</strong> Later architecture decisions become explicit and explainable.</li>
      </ul>

      <h2>What the Requirements step must produce</h2>
      <p>
        The R step is done when you have visible outputs the interviewer can agree with.
        Do not leave Requirements with only a list of questions; leave with artifacts that
        make the architecture step easier to judge. Treat this as your frontend system design
        requirements checklist before drawing boxes.
      </p>
      <table>
        <thead>
          <tr>
            <th>Output</th>
            <th>What it captures</th>
            <th>Architecture handoff</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Primary user flow</td>
            <td>User, top task, start state, and success state.</td>
            <td>"I will design around this end-to-end flow first."</td>
          </tr>
          <tr>
            <td>Scope box</td>
            <td>Must-have, nice-to-have, and out-of-scope work.</td>
            <td>"I will keep v1 deep and park non-goals."</td>
          </tr>
          <tr>
            <td>Top constraints</td>
            <td>Performance, accessibility, offline, realtime, security, i18n, and platform limits.</td>
            <td>"These constraints drive rendering, data, and interface choices."</td>
          </tr>
          <tr>
            <td>Success metrics</td>
            <td>Two or three measurable targets for speed, reliability, or task completion.</td>
            <td>"I will optimize against these metrics, not vague adjectives."</td>
          </tr>
          <tr>
            <td>Assumptions and risk log</td>
            <td>Unknowns, risk if wrong, and the fastest validation question.</td>
            <td>"If an assumption changes, I will revisit the affected boundary."</td>
          </tr>
        </tbody>
      </table>

      <h2>Functional vs non-functional requirements in frontend system design</h2>
      <p>
        Strong requirements exploration separates what the product must do from the constraints that
        decide how the frontend should be built.
      </p>
      <table>
        <thead>
          <tr>
            <th>Requirement type</th>
            <th>Frontend examples</th>
            <th>Design impact</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Functional requirements</td>
            <td>Search suggestions, filter results, drag widgets, submit forms, show notifications.</td>
            <td>Defines components, user states, flows, and API operations.</td>
          </tr>
          <tr>
            <td>Non-functional requirements</td>
            <td>Latency target, accessibility baseline, offline support, security, localization, observability.</td>
            <td>Changes rendering, caching, data freshness, error handling, and rollout strategy.</td>
          </tr>
        </tbody>
      </table>

      <h2>The 90-Second Opening Script</h2>
      <p>Use this script verbatim when the prompt starts:</p>
      <ol>
        <li>"I will spend a few minutes clarifying requirements and non-goals, then propose architecture."</li>
        <li>"I want to confirm primary user flow, expected scale, and key constraints first."</li>
        <li>"I will define a Must/Nice/Out scope box so we protect depth under time."</li>
        <li>"I will call out assumptions and measurable success criteria before moving forward."</li>
      </ol>

      <h2>Requirements Question Bank (Frontend-Focused)</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Ask this out loud</th>
            <th>Why it matters</th>
            <th>Artifact to produce</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>User and goal</td>
            <td>Who is the primary user, and what is the top task?</td>
            <td>Prevents feature drift.</td>
            <td>One-line user goal statement</td>
          </tr>
          <tr>
            <td>Scope boundaries</td>
            <td>What is in scope for v1, and what is explicitly out?</td>
            <td>Keeps answer deep, not broad.</td>
            <td>Must / Nice / Out table</td>
          </tr>
          <tr>
            <td>Scale and traffic</td>
            <td>Expected DAU, peak concurrent users, and traffic spikes?</td>
            <td>Shapes caching, rendering, and failure strategy.</td>
            <td>Scale assumptions list</td>
          </tr>
          <tr>
            <td>Performance and UX</td>
            <td>Any latency targets for first paint and interaction?</td>
            <td>Turns "fast" into measurable targets.</td>
            <td>Perf target list (p95/p99)</td>
          </tr>
          <tr>
            <td>a11y and global needs</td>
            <td>Keyboard, screen reader, i18n, RTL requirements?</td>
            <td>Distinguishes senior frontend answers.</td>
            <td>a11y/i18n acceptance checklist</td>
          </tr>
          <tr>
            <td>Reliability and security</td>
            <td>Offline expectations, auth model, abuse/rate-limit concerns?</td>
            <td>Covers real production constraints.</td>
            <td>Failure + security baseline notes</td>
          </tr>
          <tr>
            <td>Platform constraints</td>
            <td>Existing stack, API limits, launch deadline, team size?</td>
            <td>Keeps design grounded in delivery reality.</td>
            <td>Constraint ledger</td>
          </tr>
        </tbody>
      </table>

      <h2>Good vs weak clarifying questions</h2>
      <p>
        The best frontend system design clarifying questions change the design. Avoid questions that
        sound busy but do not affect scope, constraints, state, data, interface, or trade-offs.
      </p>
      <table>
        <thead>
          <tr>
            <th>Weak question</th>
            <th>Stronger question</th>
            <th>Why it is better</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Should it be fast?</td>
            <td>What p95 latency should the core interaction hit on a mid-tier mobile device?</td>
            <td>Turns a vague quality into a performance target.</td>
          </tr>
          <tr>
            <td>Do we need accessibility?</td>
            <td>Which keyboard and screen-reader flows must work in v1?</td>
            <td>Creates an acceptance checklist for the Interface step.</td>
          </tr>
          <tr>
            <td>How many users?</td>
            <td>What are DAU, peak concurrent usage, and burst patterns for the core flow?</td>
            <td>Shapes cache, realtime, and failure strategy.</td>
          </tr>
          <tr>
            <td>Should it work offline?</td>
            <td>Which actions need offline read, offline write, retry, or conflict resolution?</td>
            <td>Separates simple cache fallback from sync-heavy architecture.</td>
          </tr>
        </tbody>
      </table>

      <h2>Scope Box Template (Must / Nice / Out)</h2>
      <p>Use this immediately after clarifying questions.</p>
      <table>
        <thead>
          <tr>
            <th>Must-have (v1)</th>
            <th>Nice-to-have (if time)</th>
            <th>Out-of-scope (explicitly parked)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Core interaction works end-to-end</td>
            <td>Personalization and ranking</td>
            <td>Advanced analytics dashboard</td>
          </tr>
          <tr>
            <td>Loading/empty/error states</td>
            <td>Offline sync polish</td>
            <td>Multi-region active-active rollout</td>
          </tr>
          <tr>
            <td>Basic a11y support</td>
            <td>Animation refinement</td>
            <td>ML-driven recommendations</td>
          </tr>
        </tbody>
      </table>

      <h2>Assumptions and Risk Log</h2>
      <p>
        If the interviewer does not provide data, do not guess silently. State assumptions and attach a risk plan.
      </p>
      <table>
        <thead>
          <tr>
            <th>Assumption</th>
            <th>Risk if wrong</th>
            <th>How to validate quickly</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Peak traffic is 5x normal load</td>
            <td>Cache strategy underestimates burst behavior</td>
            <td>Ask for peak/event traffic pattern</td>
          </tr>
          <tr>
            <td>SEO matters for entry pages only</td>
            <td>Wrong rendering model choice</td>
            <td>Confirm crawl/index requirements by route</td>
          </tr>
          <tr>
            <td>Auth uses short-lived tokens</td>
            <td>Session refresh failures in long-lived tabs</td>
            <td>Confirm token refresh and expiration policy</td>
          </tr>
        </tbody>
      </table>

      <h2>Frontend Signals You Should Always Cover</h2>
      <ul>
        <li><strong>Rendering needs:</strong> Which routes need SSR, which can stay CSR, and why.</li>
        <li><strong>State coverage:</strong> idle, loading, success, empty, error, stale, partial.</li>
        <li><strong>Performance constraints:</strong> p95 interaction latency, bundle limits, and network assumptions.</li>
        <li><strong>Accessibility baseline:</strong> keyboard flow, focus management, and screen-reader announcements.</li>
        <li><strong>Observability expectations:</strong> what metrics/logs prove correctness in production.</li>
      </ul>

      <h2>Success Metrics You Can Commit To</h2>
      <table>
        <thead>
          <tr>
            <th>Signal</th>
            <th>Candidate target</th>
            <th>How to measure</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>User interaction responsiveness</td>
            <td>p95 interaction under 150ms</td>
            <td>RUM event timings</td>
          </tr>
          <tr>
            <td>Initial content speed</td>
            <td>LCP under 2.5s on mid-tier device</td>
            <td>Web Vitals dashboard</td>
          </tr>
          <tr>
            <td>Reliability</td>
            <td>Error rate under 1% for core flow</td>
            <td>Client logs and alert thresholds</td>
          </tr>
          <tr>
            <td>Task completion</td>
            <td>Conversion or completion uplift target</td>
            <td>Product analytics funnel</td>
          </tr>
        </tbody>
      </table>

      <h2>Edge Cases and Failure States Checklist</h2>
      <ul>
        <li>What should the user see on first load while data is pending?</li>
        <li>What if response is successful but empty?</li>
        <li>What if network fails, times out, or partially succeeds?</li>
        <li>What if data is stale while a refresh is in-flight?</li>
        <li>What if permissions differ by role or environment?</li>
      </ul>

      <h2>Common Mistakes (and Better Moves)</h2>
      <table>
        <thead>
          <tr>
            <th>Mistake</th>
            <th>Better move</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Jumping to architecture in minute one</td>
            <td>Open with scope, constraints, and metrics first</td>
          </tr>
          <tr>
            <td>Using vague words like "fast" and "scalable"</td>
            <td>Attach numbers and observable targets</td>
          </tr>
          <tr>
            <td>Ignoring non-goals</td>
            <td>State what is explicitly out for v1</td>
          </tr>
          <tr>
            <td>Skipping failure states</td>
            <td>Name empty/error/stale/partial states before architecture</td>
          </tr>
          <tr>
            <td>No assumptions called out</td>
            <td>Create a short assumptions + risk log</td>
          </tr>
        </tbody>
      </table>

      <h2>Prompt-specific requirements questions</h2>
      <p>
        Use these examples when the interviewer gives a common frontend system design prompt.
        Each row names the requirements questions that should change architecture.
      </p>
      <table>
        <thead>
          <tr>
            <th>Prompt</th>
            <th>Requirements questions that matter</th>
            <th>Likely design impact</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><a [routerLink]="['/', 'system-design', 'realtime-search-debounce-cache']">Autocomplete / realtime search</a></td>
            <td>Freshness target, stale response behavior, debounce budget, keyboard UX, empty/error states.</td>
            <td>Request cancellation, cache keys, combobox contract, and stale-result protection.</td>
          </tr>
          <tr>
            <td><a [routerLink]="['/', 'system-design', 'news-feed-timeline']">News feed</a></td>
            <td>Ranking ownership, pagination style, media volume, realtime updates, offline read behavior.</td>
            <td>Cursor model, cache invalidation, virtualization, prefetching, and freshness policy.</td>
          </tr>
          <tr>
            <td><a [routerLink]="['/', 'system-design', 'dashboard-widgets-draggable-resizable']">Dashboard widgets</a></td>
            <td>Widget count, layout persistence, permissions, refresh rate, drag/resize constraints.</td>
            <td>State ownership, persistence boundary, layout engine choice, and widget isolation.</td>
          </tr>
          <tr>
            <td><a [routerLink]="['/', 'system-design', 'notification-toast-system']">Toast notification system design</a></td>
            <td>Priority, queue limits, stacking, timers, user actions, aria-live announcement rules.</td>
            <td>Global ownership, event API, dedupe policy, and accessibility behavior.</td>
          </tr>
          <tr>
            <td><a [routerLink]="['/', 'system-design', 'ai-chat-textarea-design']">Chat / AI chat input</a></td>
            <td>Streaming, reconnect behavior, message ordering, draft persistence, moderation states.</td>
            <td>Realtime protocol, optimistic UI, retry model, and input-state recovery.</td>
          </tr>
        </tbody>
      </table>

      <h2>Worked Example: Typeahead Search (5-Min Requirements Pass)</h2>
      <h3>Minute 0:00-1:00</h3>
      <p>
        Confirm user and goal: users find relevant suggestions quickly while typing. Primary flow is query input to click/enter result.
      </p>

      <h3>Minute 1:00-2:00</h3>
      <p>
        Lock scope: suggestions, keyboard navigation, loading/error/empty states. Out-of-scope: personalization and ranking ML.
      </p>

      <h3>Minute 2:00-3:30</h3>
      <p>
        Confirm constraints: p95 suggestion response target, peak events, mobile network assumptions, and accessibility baseline.
      </p>

      <h3>Minute 3:30-5:00</h3>
      <p>
        Declare assumptions and success metrics, then summarize: "I have scope, constraints, and measurable targets; next I will propose architecture."
      </p>

      <h2>Requirements Timebox: 45 vs 60 Minute Interviews</h2>
      <table>
        <thead>
          <tr>
            <th>Interview length</th>
            <th>Requirements budget</th>
            <th>Expected output</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>45 minutes</td>
            <td>6-8 minutes</td>
            <td>Scope box + top constraints + 2-3 metrics + risk log</td>
          </tr>
          <tr>
            <td>60 minutes</td>
            <td>8-10 minutes</td>
            <td>Everything above plus clearer edge-state and trade-off framing</td>
          </tr>
        </tbody>
      </table>

      <h2>Before You Move to Architecture</h2>
      <ul>
        <li>Problem statement is one sentence and user-focused.</li>
        <li>Must / Nice / Out is explicit.</li>
        <li>Critical constraints are confirmed or clearly assumed.</li>
        <li>At least two measurable success metrics are defined.</li>
        <li>Failure states are named and prioritized.</li>
        <li>You have a short assumptions + risk log to reference later.</li>
      </ul>

      <h2>Requirements FAQ</h2>
      <h3>What is a frontend system design requirements checklist?</h3>
      <p>
        A frontend system design requirements checklist is the RADIO step where you clarify the user flow, scope,
        constraints, functional requirements, non-functional requirements, success metrics,
        and risks before drawing architecture.
      </p>

      <h3>What clarifying questions should I ask first?</h3>
      <p>
        Start with the primary user, core task, v1 scope, out-of-scope work, scale assumptions,
        freshness needs, accessibility baseline, latency target, and failure states that would
        change the design.
      </p>

      <h3>What is the difference between functional and non-functional requirements?</h3>
      <p>
        Functional requirements describe what the UI must do, such as search, filter, drag,
        submit, or notify. Non-functional requirements describe quality constraints such as
        latency, accessibility, reliability, security, offline behavior, and observability.
      </p>

      <h3>How long should Requirements take in a frontend system design interview?</h3>
      <p>
        In a 45-minute frontend system design interview, spend roughly the first 5-8 minutes
        on Requirements. Use more time only when the prompt is ambiguous or the interviewer
        signals that constraints are the main challenge.
      </p>

      <h3>What should I produce before moving to architecture?</h3>
      <p>
        Produce a one-line user flow, a Must/Nice/Out scope box, top constraints, two or three
        success metrics, an assumptions and risk log, and a clear handoff statement into architecture.
      </p>

      <h2>Next</h2>
      <ul>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'radio-framework']">45-minute RADIO interview framework</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'architecture']">A - Architecture deep dive</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'state-data']">D - Data model deep dive</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'ux']">I - Interface deep dive</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'performance']">Performance optimization guide</a></li>
      </ul>
    </fa-guide-shell>
  `,
})
export class SystemDesignRadioRequirementsArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
  @Input() readerPromise: string | null = null;
}
