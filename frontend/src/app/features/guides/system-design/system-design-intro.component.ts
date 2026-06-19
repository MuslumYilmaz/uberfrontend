import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, GuideShellComponent],
  template: `
    <fa-guide-shell
      title="Front-End System Design: What It Really Tests"
      [minutes]="8"
      [tags]="['system design','overview']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav"
      [readerPromise]="readerPromise || undefined">

      <p>
        Front-end system design interviews aren’t about trick questions or drawing 
        boxes for the sake of it. They’re meant to see how you <strong>handle complexity, 
        make trade-offs, and think like a senior engineer</strong>. The good news: 
        once you know the signals interviewers care about, these interviews become 
        much less intimidating. 
      </p>

      <p>
        In this guide, we’ll unpack why companies use system design interviews, 
        what makes the front-end version unique, and how you can approach them 
        with clarity and confidence. Think of it less as “getting the right answer” 
        and more as <em>teaching the interviewer how you reason through a real problem</em>.
      </p>
      <p>
        If you want a reusable interview script instead of broad advice, continue into the
        <a [routerLink]="['/guides/system-design-blueprint/foundations']">scope-and-trade-off foundations</a>
        and the <a [routerLink]="['/guides/system-design-blueprint/framework']">answer framework</a> after this intro.
        Those chapters turn the scoring signals here into a practical workflow.
      </p>

      <h2>What this intro covers</h2>
      <p>
        Use this page to calibrate what the round is really testing before you memorize
        diagrams or jump into prompt practice. By the end, you should know:
      </p>
      <ul>
        <li><strong>Interview purpose:</strong> why senior frontend loops include open-ended architecture rounds.</li>
        <li><strong>Frontend-vs-backend scope:</strong> where browser, state, API, and UX decisions matter more than distributed-systems depth.</li>
        <li><strong>Scoring signals:</strong> how interviewers evaluate requirements, architecture, data, interface, performance, and communication.</li>
        <li><strong>Next practice path:</strong> how to move from this overview into RADIO, deep dives, prompts, and the final checklist.</li>
      </ul>

      <h2>Why companies ask these questions</h2>
      <p>
        Front-end system design interviews exist because companies want to see 
        how you think beyond code snippets. They simulate the kind of decisions 
        senior engineers make every week. Here’s what’s being tested:
      </p>
      <ul>
        <li>
          <strong>Handling complexity:</strong> Can you take a vague problem—like 
          “design a dashboard with real-time updates”—and break it into logical 
          parts (layout, data fetching, live updates, error handling)?
        </li>
        <li>
          <strong>Making trade-offs:</strong> Do you understand the pros and cons 
          of different approaches? For example, choosing SSR for SEO and faster 
          first paint vs CSR for simpler deployment.
        </li>
        <li>
          <strong>User focus:</strong> Are you thinking about how the app feels for 
          real users? That means performance on slow devices, accessibility for 
          screen readers, or handling flaky networks gracefully.
        </li>
        <li>
          <strong>Communication:</strong> Can you explain your reasoning clearly, 
          so your teammates (or interviewers) know why you chose one path over another?
        </li>
      </ul>

      <h2>Frontend vs backend system design</h2>
      <p>
        Most system design guides focus on backend topics: databases, queues, load balancers,
        consistency, and infrastructure scale. Frontend system design still needs backend
        awareness, but the score is usually centered on how the product behaves in the browser.
      </p>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Area</th>
              <th>Frontend focus</th>
              <th>Backend focus</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Architecture boundary</td>
              <td>Routes, rendering strategy, component ownership, data-fetching layer, and client modules.</td>
              <td>Services, databases, queues, caches, gateways, and infrastructure ownership.</td>
            </tr>
            <tr>
              <td>Data model</td>
              <td>Client state, server cache, derived view models, optimistic updates, and invalidation.</td>
              <td>Database schema, consistency model, storage partitioning, replication, and retention.</td>
            </tr>
            <tr>
              <td>API focus</td>
              <td>REST/GraphQL/WebSocket contracts, pagination, error shape, auth edge cases, and retry behavior.</td>
              <td>Service-to-service APIs, protocols, ownership boundaries, rate limits, and compatibility.</td>
            </tr>
            <tr>
              <td>Performance</td>
              <td>Core Web Vitals, bundle size, hydration, virtualization, slow devices, and interaction latency.</td>
              <td>Throughput, queue pressure, database hot spots, replication lag, and regional availability.</td>
            </tr>
            <tr>
              <td>Failure modes</td>
              <td>Loading, empty, error, stale, offline, partial data, and broken interaction states.</td>
              <td>Outages, retries, data loss, overload, failover, and dependency failures.</td>
            </tr>
            <tr>
              <td>Evaluation</td>
              <td>User experience, accessibility, state clarity, frontend reliability, and tradeoff narration.</td>
              <td>Scale, durability, availability, consistency, cost, and operational complexity.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Scoring rubric: what interviewers score</h2>
      <p>
        In a system design interview, the “right answer” matters less than the signals
        you send about how you think. A strong answer usually scores across these axes:
      </p>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Scoring axis</th>
              <th>What good looks like</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Requirements clarity</td>
              <td>You confirm users, core flow, non-functional requirements, constraints, and out-of-scope work before designing.</td>
            </tr>
            <tr>
              <td>Frontend architecture</td>
              <td>You choose rendering, routing, module boundaries, and ownership based on product constraints instead of habit.</td>
            </tr>
            <tr>
              <td>State, data, and API contracts</td>
              <td>You separate local UI state, server cache, URL state, mutations, pagination, and realtime update paths.</td>
            </tr>
            <tr>
              <td>UX and accessibility</td>
              <td>You include keyboard paths, screen-reader feedback, responsive behavior, and loading/error/empty states.</td>
            </tr>
            <tr>
              <td>Performance and reliability</td>
              <td>You name the likely bottlenecks, set budgets, degrade gracefully, and describe observability or rollout checks.</td>
            </tr>
            <tr>
              <td>Communication and tradeoffs</td>
              <td>You prioritize v1, state what you defer, explain why, and keep the interviewer aligned as constraints change.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Common prompt families to recognize</h2>
      <p>
        You do not need to memorize every company-branded prompt. Learn the recurring
        families and map each one back to requirements, architecture, data, interface,
        and optimization decisions:
      </p>
      <ul>
        <li>
          <a [routerLink]="['/system-design/infinite-scroll-list']">Infinite Scroll</a>:
          pagination, virtualization, loading policy, and scroll performance.
        </li>
        <li>
          <a [routerLink]="['/system-design/realtime-search-debounce-cache']">Real-time Search</a>:
          request lifecycle, debouncing, stale responses, caching, and perceived speed.
        </li>
        <li>
          <a [routerLink]="['/system-design/news-feed-timeline']">News Feed</a>:
          feed hydration, media loading, cursor strategy, realtime updates, and ranking boundaries.
        </li>
        <li>
          <a [routerLink]="['/system-design/notification-toast-system']">Notification Toast</a>:
          global APIs, queues, timers, portals, and accessible announcements.
        </li>
        <li>
          <a [routerLink]="['/system-design/ai-chat-textarea-design']">AI Chat Text Area</a>:
          streaming, cancellation, persistence, API boundaries, and recovery states.
        </li>
        <li>
          <a [routerLink]="['/system-design/component-design-system-architecture']">Design System Architecture</a>:
          tokens, component APIs, theming, accessibility contracts, and versioning.
        </li>
      </ul>

      <h2>How to use this blueprint after the intro</h2>
      <p>
        Treat this intro as calibration. Once the scoring model is clear, move into
        the pieces that make your answer repeatable under time pressure.
      </p>
      <ol>
        <li>Start with <a [routerLink]="['/guides/system-design-blueprint/foundations']">scope, constraints, and trade-offs</a>.</li>
        <li>Learn the <a [routerLink]="['/guides/system-design-blueprint/radio-framework']">frontend system design answer template</a>.</li>
        <li>
          Deep dive the weakest RADIO step:
          <a [routerLink]="['/guides/system-design-blueprint/radio-requirements']">Requirements</a>,
          <a [routerLink]="['/guides/system-design-blueprint/architecture']">Architecture</a>,
          <a [routerLink]="['/guides/system-design-blueprint/state-data']">Data</a>,
          <a [routerLink]="['/guides/system-design-blueprint/ux']">Interface</a>, or
          <a [routerLink]="['/guides/system-design-blueprint/performance']">Optimizations</a>.
        </li>
        <li>Apply the framework to real <a [routerLink]="['/system-design']">frontend system design prompts</a>.</li>
        <li>Finish each practice round with the <a [routerLink]="['/guides/system-design-blueprint/checklist']">frontend system design interview checklist</a>.</li>
      </ol>

      <h2>The mindset shift</h2>
      <p>
        System design interviews aren’t about memorizing buzzwords or 
        rattling off every pattern you know. They’re about showing how you 
        <strong>reason like a senior engineer</strong>—balancing user needs, 
        team constraints, and technical trade-offs.
      </p>
      <p>
        Think of it less as a test and more as a conversation. Your goal is to
        walk the interviewer through what you clarify, how you structure the
        problem, why you make certain choices, and what you would revisit as
        constraints change.
      </p>

      <h2>FAQ</h2>
      <h3>What do frontend system design interviews test?</h3>
      <p>
        They test requirements clarity, frontend architecture, state and API contracts,
        UX and accessibility, performance and reliability, and tradeoff communication.
      </p>

      <h3>How is frontend system design different from backend system design?</h3>
      <p>
        Frontend design focuses on browser rendering, component boundaries, client
        state, API consumption, accessibility, and user-visible failure states. Backend
        design focuses more on services, storage, queues, replication, and infrastructure scale.
      </p>

      <h3>What do interviewers look for in frontend system design?</h3>
      <p>
        Interviewers look for structured scoping, product-aware architecture, clear
        data ownership, practical edge-case handling, and the ability to explain
        tradeoffs without overbuilding.
      </p>

      <h3>Do frontend engineers need backend depth for system design interviews?</h3>
      <p>
        You need enough backend context to discuss contracts, auth, pagination,
        caching, and failure behavior. You usually do not need deep capacity planning
        unless the interviewer explicitly asks for it.
      </p>

      <h3>Where should I practice after this frontend system design intro?</h3>
      <p>
        Move into the <a [routerLink]="['/guides/system-design-blueprint/radio-framework']">45-minute answer script</a>,
        then practice real prompts under <a [routerLink]="['/system-design']">frontend system design questions</a>.
      </p>
    </fa-guide-shell>
  `,
})
export class SystemDesignIntroArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
  @Input() readerPromise: string | null = null;
}
