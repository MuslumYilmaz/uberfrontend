import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, GuideShellComponent],
  template: `
    <fa-guide-shell
      title="O - Optimizations Deep Dive for Frontend System Design Interviews"
      [minutes]="18"
      [tags]="['system design', 'optimizations', 'web vitals', 'radio framework']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">

      <h2>If You Remember One Thing</h2>
      <p>
        In a <strong>system design interview</strong>, optimization is not a random checklist.
        In the <strong>RADIO framework</strong>, O means choosing the top bottlenecks, picking the
        highest-leverage fixes, and proving impact with metrics. That is the difference between
        generic advice and senior <strong>frontend system design</strong> reasoning.
      </p>

      <h2>What Optimizations Must Produce</h2>
      <table>
        <thead>
          <tr>
            <th>Artifact</th>
            <th>Minimum interview output</th>
            <th>Why interviewer cares</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Performance budget card</td>
            <td>Core metrics targets and SLO ranges</td>
            <td>Shows optimization is measurable</td>
          </tr>
          <tr>
            <td>Bottleneck map</td>
            <td>Top slow path by network/CPU/render/data</td>
            <td>Shows diagnosis before solution</td>
          </tr>
          <tr>
            <td>Top-2 priority plan</td>
            <td>Impact, effort, and risk ranking</td>
            <td>Shows practical prioritization</td>
          </tr>
          <tr>
            <td>Regression guardrails</td>
            <td>Trade-off and rollback notes</td>
            <td>Shows production maturity</td>
          </tr>
          <tr>
            <td>Validation dashboard sketch</td>
            <td>Metrics and alert thresholds</td>
            <td>Shows closed-loop optimization mindset</td>
          </tr>
        </tbody>
      </table>

      <h2>Inputs from R, A, D, and I (Why O is Last)</h2>
      <p>
        Strong <strong>system design interview preparation</strong> treats optimizations as consequence,
        not guesswork. You optimize what earlier steps decided is important.
      </p>
      <table>
        <thead>
          <tr>
            <th>Input step</th>
            <th>Optimization implication</th>
            <th>What to say out loud</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Requirements</td>
            <td>Define user-critical path and latency budget</td>
            <td>"I will optimize the primary task path before secondary flows."</td>
          </tr>
          <tr>
            <td>Architecture</td>
            <td>Tune rendering split, edge/CDN strategy, and request path</td>
            <td>"I am optimizing route strategy rather than forcing one global mode."</td>
          </tr>
          <tr>
            <td>Data model</td>
            <td>Adjust key design, TTLs, invalidation, and payload size</td>
            <td>"I will reduce over-fetching and tighten cache invalidation semantics."</td>
          </tr>
          <tr>
            <td>Interface</td>
            <td>Improve interaction latency, skeleton quality, and degraded UX</td>
            <td>"I am optimizing perceived speed and interaction smoothness, not only load charts."</td>
          </tr>
        </tbody>
      </table>

      <h2>Performance Budget and SLOs</h2>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Candidate target</th>
            <th>Why it matters</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>LCP</td>
            <td>Under 2.5s on mid-tier mobile</td>
            <td>Measures first meaningful content speed</td>
          </tr>
          <tr>
            <td>INP</td>
            <td>Under 200ms p75</td>
            <td>Captures responsiveness under real interaction</td>
          </tr>
          <tr>
            <td>CLS</td>
            <td>Under 0.1</td>
            <td>Protects visual stability</td>
          </tr>
          <tr>
            <td>Interaction p95 (core flow)</td>
            <td>Under 150ms event-to-paint</td>
            <td>Directly reflects task usability</td>
          </tr>
          <tr>
            <td>Error budget</td>
            <td>Client-visible error rate under 1%</td>
            <td>Prevents speed work from harming reliability</td>
          </tr>
        </tbody>
      </table>

      <h2>Bottleneck Identification Framework</h2>
      <ol>
        <li>Trace one primary user journey end-to-end.</li>
        <li>Break latency into: DNS/TLS, TTFB, payload transfer, JS parse/execute, render, async data joins.</li>
        <li>Mark which stage dominates p95, not average.</li>
        <li>Pick bottlenecks with high user impact and clear ownership.</li>
      </ol>
      <p>
        Script cue: "I will baseline where time is spent first, then optimize the slowest stage with highest user impact."
      </p>

      <h2>Optimization Levers by Layer</h2>
      <table>
        <thead>
          <tr>
            <th>Layer</th>
            <th>Levers</th>
            <th>Expected win</th>
            <th>Risk to manage</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Network and delivery</td>
            <td>Compression, CDN caching, HTTP/3, early hints</td>
            <td>Lower transfer and edge latency</td>
            <td>Cache staleness and invalidation complexity</td>
          </tr>
          <tr>
            <td>Rendering path</td>
            <td>SSR/streaming for entry, CSR for high interaction</td>
            <td>Faster first paint and usable shell</td>
            <td>Hydration mismatch and server cost</td>
          </tr>
          <tr>
            <td>JavaScript runtime</td>
            <td>Code split, tree shake, defer non-critical bundles</td>
            <td>Better INP and startup responsiveness</td>
            <td>Chunk over-fragmentation</td>
          </tr>
          <tr>
            <td>Data layer</td>
            <td>Request dedupe, batching, SWR, payload trimming</td>
            <td>Fewer round trips and lower backend load</td>
            <td>Incorrect cache invalidation</td>
          </tr>
          <tr>
            <td>Interface layer</td>
            <td>Virtualization, skeleton policy, optimistic UI</td>
            <td>Lower interaction latency and smoother perceived speed</td>
            <td>A11y regressions or inconsistent state transitions</td>
          </tr>
        </tbody>
      </table>

      <h2>Top-2 Prioritization Matrix (Impact x Effort x Risk)</h2>
      <table>
        <thead>
          <tr>
            <th>Candidate optimization</th>
            <th>Impact</th>
            <th>Effort</th>
            <th>Risk</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Route-level code splitting + defer non-critical widgets</td>
            <td>High</td>
            <td>Medium</td>
            <td>Low-Medium</td>
            <td>1</td>
          </tr>
          <tr>
            <td>BFF response shaping + request dedupe for hot endpoints</td>
            <td>High</td>
            <td>Medium</td>
            <td>Medium</td>
            <td>2</td>
          </tr>
          <tr>
            <td>Global microfrontend refactor</td>
            <td>Medium</td>
            <td>Very High</td>
            <td>High</td>
            <td>Later</td>
          </tr>
        </tbody>
      </table>

      <h2>Trade-offs and Regression Risks</h2>
      <table>
        <thead>
          <tr>
            <th>Optimization move</th>
            <th>Likely win</th>
            <th>Regression risk</th>
            <th>Mitigation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Aggressive caching</td>
            <td>Fast reads and lower origin load</td>
            <td>Serving stale or wrong data</td>
            <td>Clear tags, TTL, and invalidation tests</td>
          </tr>
          <tr>
            <td>Heavy SSR usage</td>
            <td>Improved first content speed</td>
            <td>Higher server cost and queue pressure</td>
            <td>Cache hot routes and throttle dynamic SSR scope</td>
          </tr>
          <tr>
            <td>Extreme code splitting</td>
            <td>Smaller initial bundle</td>
            <td>Too many network waterfalls</td>
            <td>Bundle strategy by route and prefetch policy</td>
          </tr>
          <tr>
            <td>Optimistic UI everywhere</td>
            <td>Instant-feeling interactions</td>
            <td>Rollback confusion and trust loss</td>
            <td>Use only where conflict model is explicit</td>
          </tr>
        </tbody>
      </table>

      <h2>Reliability and Resilience Optimizations</h2>
      <ul>
        <li>Gracefully degrade to stale data when dependencies are slow.</li>
        <li>Prefer partial rendering over whole-screen failure for non-critical modules.</li>
        <li>Use bounded retries with jitter to avoid traffic amplification.</li>
        <li>Set timeout budgets per dependency based on user impact.</li>
        <li>Protect upstream systems with client-side dedupe and server-side rate controls.</li>
      </ul>

      <h2>Accessibility and UX Safeguards</h2>
      <ul>
        <li>Never trade keyboard/focus reliability for animation smoothness.</li>
        <li>Skeletons and placeholders must announce progress for assistive tech.</li>
        <li>Keep motion subtle and respect reduced-motion preferences.</li>
        <li>Avoid lazy-loading critical controls needed for first task completion.</li>
      </ul>

      <h2>Security and Privacy Considerations</h2>
      <ul>
        <li>Do not cache sensitive responses in shared layers without strict controls.</li>
        <li>Avoid exposing privileged fields in aggressively cached list payloads.</li>
        <li>Balance performance logging depth with data minimization rules.</li>
        <li>Treat third-party scripts as performance and security risk together.</li>
      </ul>

      <h2>Observability and Validation Plan</h2>
      <table>
        <thead>
          <tr>
            <th>Signal</th>
            <th>Before/after metric</th>
            <th>Success threshold</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Load performance</td>
            <td>LCP distribution by route and device class</td>
            <td>At least 20% improvement on target route</td>
          </tr>
          <tr>
            <td>Interaction quality</td>
            <td>INP and event-to-paint p95</td>
            <td>Meet budget for two releases in a row</td>
          </tr>
          <tr>
            <td>Reliability</td>
            <td>Error and partial-state frequency</td>
            <td>No error budget regression</td>
          </tr>
          <tr>
            <td>User outcome</td>
            <td>Task completion and abandonment rate</td>
            <td>Positive or neutral conversion impact</td>
          </tr>
        </tbody>
      </table>

      <h2>Rollout Strategy</h2>
      <ol>
        <li>Ship behind feature flag for internal and low-risk cohorts.</li>
        <li>Run canary rollout with route-level monitoring.</li>
        <li>Compare key metrics to control group for at least one traffic cycle.</li>
        <li>Define rollback triggers before launch and automate if possible.</li>
      </ol>

      <h2>What to Say Out Loud (Optimization Script Cues)</h2>
      <ol>
        <li>"I will optimize the top bottleneck on the primary user path first."</li>
        <li>"I am setting measurable budgets before naming optimization tactics."</li>
        <li>"I will prioritize two changes with highest impact and lowest delivery risk."</li>
        <li>"Trade-off here: better LCP versus higher server cost and cache complexity."</li>
        <li>"I am optimizing p95 behavior, not only average metrics."</li>
        <li>"I will keep stale and partial behavior explicit so reliability does not regress."</li>
        <li>"I am validating wins with A/B or canary metrics, not intuition."</li>
        <li>"Accessibility guardrails stay non-negotiable while improving speed."</li>
        <li>"I will define rollback triggers before rollout to reduce blast radius."</li>
        <li>"With these optimizations, I can summarize risk, impact, and next iteration."</li>
      </ol>

      <h2>Optimization Timebox for Interviews</h2>
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
            <td>Define budgets and dominant bottleneck</td>
            <td>Budget + bottleneck card</td>
          </tr>
          <tr>
            <td>2:00-4:00</td>
            <td>List candidate levers by layer</td>
            <td>Optimization matrix</td>
          </tr>
          <tr>
            <td>4:00-6:00</td>
            <td>Pick top two with trade-offs</td>
            <td>Priority ranking</td>
          </tr>
          <tr>
            <td>6:00-8:00</td>
            <td>Validation and rollback plan</td>
            <td>Measurement and rollout notes</td>
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
            <td>Budget, bottleneck, and route-level focus</td>
            <td>Optimization brief</td>
          </tr>
          <tr>
            <td>3:00-6:00</td>
            <td>Layered optimization choices with trade-offs</td>
            <td>Levers matrix</td>
          </tr>
          <tr>
            <td>6:00-9:00</td>
            <td>Top two priorities plus resilience safeguards</td>
            <td>Action plan</td>
          </tr>
          <tr>
            <td>9:00-12:00</td>
            <td>Observability, canary, and rollback strategy</td>
            <td>Validation and rollout checklist</td>
          </tr>
        </tbody>
      </table>

      <h2>Quick Drill: Optimize Typeahead in 7 Minutes</h2>
      <table>
        <thead>
          <tr>
            <th>Minute</th>
            <th>What to produce</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>0-1</td>
            <td>Set budget: p95 suggestion response and interaction target</td>
          </tr>
          <tr>
            <td>1-2</td>
            <td>Find bottleneck: network round trip or client render path</td>
          </tr>
          <tr>
            <td>2-3</td>
            <td>Candidate levers: debounce, dedupe, cache, prefetch</td>
          </tr>
          <tr>
            <td>3-4</td>
            <td>Pick top 1: request dedupe + short TTL cache</td>
          </tr>
          <tr>
            <td>4-5</td>
            <td>Pick top 2: list virtualization and minimal row rendering</td>
          </tr>
          <tr>
            <td>5-6</td>
            <td>Define trade-offs: stale risk and complexity increase</td>
          </tr>
          <tr>
            <td>6-7</td>
            <td>Validation: latency, zero-result quality, error budget, rollback trigger</td>
          </tr>
        </tbody>
      </table>

      <h2>Before You Wrap Up the Interview</h2>
      <ul>
        <li>You linked optimizations to explicit bottlenecks, not preferences.</li>
        <li>You set measurable budgets and success thresholds.</li>
        <li>You prioritized top two optimizations with impact/effort/risk.</li>
        <li>You called out trade-offs and regression safeguards.</li>
        <li>You included reliability, accessibility, and security guardrails.</li>
        <li>You described rollout and rollback, not just ideal-state changes.</li>
      </ul>

      <h2>Next</h2>
      <ul>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'radio-framework']">Back to RADIO cheat sheet</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'radio-requirements']">R - Requirements deep dive</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'architecture']">A - Architecture deep dive</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'state-data']">D - Data model deep dive</a></li>
        <li><a [routerLink]="['/', 'guides', 'system-design-blueprint', 'ux']">I - Interface deep dive</a></li>
      </ul>
    </fa-guide-shell>
  `,
})
export class SystemDesignPerformanceArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
}
