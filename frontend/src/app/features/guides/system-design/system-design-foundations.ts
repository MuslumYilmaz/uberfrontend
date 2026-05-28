import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, GuideShellComponent],
  template: `
    <fa-guide-shell
      title="Scope, Constraints, and Trade-offs"
      [minutes]="14"
      [tags]="['system design','foundations','constraints']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav"
      [readerPromise]="readerPromise || undefined">
    <p>
      The easiest way to stumble in a system design interview is to start drawing 
      boxes and arrows without first asking what you’re actually building. 
      Strong candidates slow down and begin with context: 
      <strong>What’s in scope? What limits do we face? Where will we make trade-offs?</strong> 
    </p>
    <p>
      Getting this part right sets the tone for the entire interview. 
      It shows you think like a senior engineer who values clarity over speed, 
      and it prevents you from over-engineering features that were never required.
    </p>

    <h2>What to lock before architecture</h2>
    <p>
      Before the architecture diagram, lock the minimum context that will change the
      design. You do not need a full product spec; you need enough to avoid solving
      the wrong problem.
    </p>
    <ol>
      <li><strong>Users:</strong> Who uses the experience, and are there admin, creator, or viewer roles?</li>
      <li><strong>Core flow:</strong> What is the single happy path that must work in v1?</li>
      <li><strong>Scope:</strong> Which features are included now, and which are explicitly out of scope?</li>
      <li><strong>Constraints:</strong> Which device, network, scale, accessibility, security, and business limits matter?</li>
      <li><strong>Success metrics:</strong> Which product and technical outcomes prove the design works?</li>
    </ol>

    <h2>First 5-8 minutes script</h2>
    <p>
      The opening minutes should sound structured, not hesitant. Use a short script
      to create room for requirements without spending the whole interview there.
      Think of this as the first 5 minutes system design interview requirements pass:
      enough to expose scope, risk, and trade-off framing before architecture.
    </p>
    <ul>
      <li><strong>Restate the prompt:</strong> “I’ll design the frontend experience for X, then call out the API contracts I need.”</li>
      <li><strong>Anchor the user flow:</strong> “Is the primary flow search, browse, create, or monitor?”</li>
      <li><strong>Separate must-haves:</strong> “For v1, which features are required, and which can be stretch goals?”</li>
      <li><strong>Ask frontend constraints:</strong> “Do we care about SEO, offline use, realtime updates, accessibility, mobile performance, or localization?”</li>
      <li><strong>Confirm success:</strong> “Should I optimize for first load, interaction speed, reliability, developer velocity, or all of them?”</li>
      <li><strong>Close the loop:</strong> “I’ll assume X and Y for now, and I’ll revisit them if they change the architecture.”</li>
    </ul>

    <h2>Clarify the scope</h2>
    <p>
      Interview prompts are almost always vague on purpose—things like 
      “Design an image gallery” or “Build a chat system.” 
      If you jump straight into drawing, you’ll likely design the wrong thing. 
      The first move is to narrow the scope into something concrete by asking:
    </p>
    <ul>
      <li><strong>Who are the users?</strong> Consumers, admins, or both?</li>
      <li><strong>What’s the core feature set?</strong> The must-haves for v1.</li>
      <li><strong>What’s out of scope?</strong> Call it out so you don’t waste time on extras.</li>
    </ul>
    <p>
      For example: if asked to design a chat app, clarify whether it’s 
      1-to-1 only or if it needs group chats, file sharing, and reactions. 
      By setting boundaries early, you make the problem manageable and 
      show the interviewer you’re thinking like a product owner, not just a coder.
    </p>

    <h2>Frontend constraints checklist</h2>
    <p>
      Every real system has limits—ignoring them leads to designs that look good 
      on a whiteboard but fall apart in practice. Great candidates surface constraints early 
      and use them to shape their design. Treat this as a frontend system design
      requirements checklist that separates functional requirements from non-functional
      requirements before you choose rendering, state, or transport patterns.
    </p>
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Constraint</th>
            <th>Questions to ask</th>
            <th>Design impact</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Product goal</td>
            <td>Is the goal conversion, collaboration, monitoring, content discovery, or creation?</td>
            <td>Changes the primary route, state model, and what you optimize first.</td>
          </tr>
          <tr>
            <td>Users and roles</td>
            <td>Are there viewers, editors, admins, anonymous users, or paid users?</td>
            <td>Changes auth boundaries, permissions, navigation, and empty states.</td>
          </tr>
          <tr>
            <td>Scale</td>
            <td>How many users, records, comments, widgets, or notifications are visible at once?</td>
            <td>Changes pagination, virtualization, batching, cache keys, and rendering strategy.</td>
          </tr>
          <tr>
            <td>Devices and network</td>
            <td>Do we support low-end mobile, slow networks, or desktop-only usage?</td>
            <td>Changes performance constraints, bundle budget, image strategy, prefetching, and graceful loading.</td>
          </tr>
          <tr>
            <td>Data freshness</td>
            <td>Can data be stale for seconds or minutes, or must it be realtime?</td>
            <td>Changes polling, WebSocket/SSE, invalidation, optimistic updates, and stale UI.</td>
          </tr>
          <tr>
            <td>Offline and recovery</td>
            <td>Should the app work offline, queue writes, or only recover from transient failures?</td>
            <td>Changes offline support, storage, conflict resolution, retry policy, and sync feedback.</td>
          </tr>
          <tr>
            <td>Accessibility and security</td>
            <td>Do we need WCAG support, keyboard flows, announcements, XSS protection, or permission boundaries?</td>
            <td>Changes accessibility requirements, component contracts, focus management, sanitization, and API assumptions.</td>
          </tr>
          <tr>
            <td>Observability and success</td>
            <td>Which events, errors, performance metrics, and rollout signals should be tracked?</td>
            <td>Changes instrumentation, budgets, alerting, and how you validate the design.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      For example: if you’re designing an image-heavy site for a global audience, 
      constraints like unreliable networks and mobile usage might push you toward 
      aggressive image compression, CDNs, and lazy loading from day one.
    </p>

    <h2>Trade-off matrix</h2>
    <p>
      Every architectural choice comes with downsides. Interviewers don’t expect you 
      to find a “perfect” solution — they want to see that you can recognize trade-offs, 
      say them out loud, and connect them to the problem at hand.
    </p>
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Decision</th>
            <th>Choose this when</th>
            <th>Choose the alternative when</th>
            <th>Phrase to say</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>CSR vs SSR</td>
            <td>CSR fits authenticated tools, faster iteration, and lower server complexity.</td>
            <td>SSR fits SEO, faster first paint, link previews, or content-heavy pages.</td>
            <td>“I’ll start with CSR unless SEO or first paint is a hard requirement.”</td>
          </tr>
          <tr>
            <td>REST vs GraphQL</td>
            <td>REST fits simple resources, stable contracts, and easier caching.</td>
            <td>GraphQL fits many view-specific shapes, nested data, and client-driven composition.</td>
            <td>“The API shape should follow the view model and caching needs.”</td>
          </tr>
          <tr>
            <td>Local vs global state</td>
            <td>Local state fits isolated UI behavior and one-owner data.</td>
            <td>Global state fits cross-route ownership, shared auth/user settings, or synchronized panels.</td>
            <td>“I’ll keep state local until ownership crosses component or route boundaries.”</td>
          </tr>
          <tr>
            <td>Optimistic vs pessimistic updates</td>
            <td>Optimistic updates fit reversible actions where perceived speed matters.</td>
            <td>Pessimistic updates fit payments, destructive actions, or high-conflict data.</td>
            <td>“I’ll optimize the interaction only where rollback is safe and understandable.”</td>
          </tr>
          <tr>
            <td>Polling vs WebSocket/SSE</td>
            <td>Polling fits low-frequency updates and simpler infrastructure.</td>
            <td>WebSocket/SSE fits realtime collaboration, live comments, notifications, or streams.</td>
            <td>“I’ll match the transport to the freshness requirement instead of defaulting to realtime.”</td>
          </tr>
          <tr>
            <td>Offline now vs later</td>
            <td>Defer offline when the product can show clear recovery and retry states.</td>
            <td>Build offline early when mobile, travel, field usage, or draft persistence is core.</td>
            <td>“I’ll separate transient failure recovery from full offline-first complexity.”</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      The key is to <em>say the trade-off out loud</em> and tie it to context.
      For example: “For v1, I’d start with CSR to move quickly.
      If SEO or first paint becomes a priority, we can layer SSR later.”
      That shows you understand not just the options, but the
      <strong>timeline and context where each option makes sense</strong>.
    </p>

    <h2>Prompt examples</h2>
    <p>
      The same foundations change shape depending on the prompt. Practice asking
      sharper questions before you open the architecture section.
    </p>
    <ul>
      <li>
        <a [routerLink]="['/', 'system-design', 'realtime-search-debounce-cache']">Real-time Search</a>:
        clarify latency target, stale response behavior, cache lifetime, keyboard UX, and empty/error states.
      </li>
      <li>
        <a [routerLink]="['/', 'system-design', 'news-feed-timeline']">News Feed</a>:
        clarify feed ranking, cursor pagination, media loading, realtime updates, moderation, and offline read behavior.
      </li>
      <li>
        <a [routerLink]="['/', 'system-design', 'notification-toast-system']">Notification Toast</a>:
        clarify global API ownership, stacking, timers, announcement behavior, and queue limits.
      </li>
    </ul>

    <h2>Common mistakes before architecture</h2>
    <ul>
      <li><strong>Drawing too early:</strong> architecture before scope usually solves a different problem.</li>
      <li><strong>Missing non-functional requirements:</strong> performance, accessibility, realtime, offline, and security often change the design.</li>
      <li><strong>Over-scoping v1:</strong> senior answers separate required behavior from future expansion.</li>
      <li><strong>Naming options without trade-offs:</strong> “SSR” or “WebSocket” is not enough unless you explain why it fits.</li>
      <li><strong>Ignoring interviewer priority:</strong> if they hint at performance or reliability, move that constraint forward.</li>
    </ul>

    <h2>Next step</h2>
    <p>
      Before you ever draw a box or arrow, lock in the foundations. 
      Strong candidates pause to set the stage instead of rushing ahead. 
      Your mental checklist should be:
    </p>
    <ol>
      <li><strong>Scope:</strong> What’s in, what’s out, and who the users are.</li>
      <li><strong>Constraints:</strong> The limits you must respect — scale, performance, devices, business needs.</li>
      <li><strong>Trade-offs:</strong> The options you’ve weighed and why you chose one over the others.</li>
    </ol>
    <p>
      Then go deeper on the
      <a [routerLink]="['/', 'guides', 'system-design-blueprint', 'radio-requirements']">RADIO requirements step</a>
      and move into
      <a [routerLink]="['/', 'guides', 'system-design-blueprint', 'architecture']">architecture decisions</a>.
      Getting these three right makes the rest of your design more credible.
    </p>

    <h2>FAQ</h2>
    <h3>What requirements should I clarify in a frontend system design interview?</h3>
    <p>
      Clarify users, core flow, included and excluded features, device and network assumptions,
      data freshness, accessibility, security, performance budgets, and success metrics.
    </p>

    <h3>How long should requirements clarification take?</h3>
    <p>
      In a 45-minute frontend system design interview, spend roughly the first 5-8 minutes
      on scope, constraints, and trade-offs before moving into architecture.
    </p>

    <h3>What frontend constraints matter most before architecture?</h3>
    <p>
      The constraints that usually change architecture are SEO, realtime freshness,
      mobile performance, low-connectivity behavior, accessibility, auth boundaries,
      data volume, and observability requirements.
    </p>

    <h3>How do I explain trade-offs in a frontend system design interview?</h3>
    <p>
      Name the decision, connect it to the requirement, state what you gain, state what
      you give up, and explain when you would revisit the choice.
    </p>

    <h3>What mistakes should I avoid before drawing architecture?</h3>
    <p>
      Avoid drawing before scope is clear, skipping non-functional requirements, making
      every feature v1, naming tools without trade-offs, and ignoring interviewer priorities.
    </p>
    </fa-guide-shell>
  `,
})
export class SystemDesignFoundationsArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
  @Input() readerPromise: string | null = null;
}
