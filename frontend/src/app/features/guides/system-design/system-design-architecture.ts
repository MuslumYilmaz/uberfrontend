import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, GuideShellComponent],
  template: `
    <fa-guide-shell
      title="Rendering & App Architecture"
      [minutes]="14"
      [tags]="['system design','architecture','rendering']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">

      <p>
        In front-end system design, one of the most important decisions you’ll make
        is how the app is delivered and structured. Rendering strategy and architecture
        affect performance, SEO, developer experience, and even business outcomes.
        Interviewers want to see if you can weigh these trade-offs thoughtfully.
      </p>

      <h2>Rendering strategies</h2>
      <p>The big four strategies you should know are:</p>

      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Approach</th>
            <th style="text-align:left;">Pros</th>
            <th style="text-align:left;">Cons</th>
            <th style="text-align:left;">Best for</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>CSR</strong> (Client-Side Rendering)</td>
            <td>Fast iteration, simple deployment, rich interactivity</td>
            <td>Slower first paint, weaker SEO</td>
            <td>Internal tools, dashboards, authenticated apps</td>
          </tr>
          <tr>
            <td><strong>SSR</strong> (Server-Side Rendering)</td>
            <td>Better SEO, faster initial load</td>
            <td>Heavier server load, more caching/infra complexity</td>
            <td>E-commerce, blogs, landing pages</td>
          </tr>
          <tr>
            <td><strong>SSG</strong> (Static Site Generation)</td>
            <td>Blazing fast, cheap hosting/CDN, highly cacheable</td>
            <td>Build-time bottlenecks, limited dynamic content at request time</td>
            <td>Docs, marketing sites, blogs with infrequent updates</td>
          </tr>
          <tr>
            <td><strong>Islands / Hybrid</strong></td>
            <td>Static shell + selective hydration; strong SEO + interactivity</td>
            <td>More complex build and hydration logic</td>
            <td>News sites, portals with mixed static & interactive regions</td>
          </tr>
        </tbody>
      </table>

      <h2>App architecture patterns</h2>
      <p>Rendering is one part of the puzzle. You should also consider how the app is structured:</p>
      <ul>
        <li>
          <strong>Monolith SPA:</strong> Simple to build and deploy; can become heavy
          and harder to scale without clear module boundaries and code-splitting.
        </li>
        <li>
          <strong>Microfrontends:</strong> Independent teams own slices of the UI
          (by route or widget). Enables parallel delivery at org scale, but adds
          coordination, performance overhead, and shared-design consistency challenges.
        </li>
        <li>
          <strong>Multi-page app (MPA):</strong> Page-per-function with full reloads.
          Easier SEO and page-level caching/CDN, but less seamless navigation and more duplication.
        </li>
      </ul>

      <h2>How to reason in interviews</h2>
      <p>
        Interviewers don’t want you to just drop acronyms like CSR or SSR. 
        They want to hear <strong>how you adapt the choice to the problem</strong>. 
        Show that you can weigh options, trade-offs, and context.
      </p>
      <ul>
        <li><em>“If SEO and first paint matter most → SSR or SSG makes sense.”</em></li>
        <li><em>“If it’s an internal dashboard with auth → CSR is faster to ship and good enough.”</em></li>
        <li><em>“If multiple teams need autonomy → microfrontends allow parallel work.”</em></li>
        <li><em>“If content is mostly static with a few dynamic widgets → islands/hybrid keeps things efficient.”</em></li>
      </ul>
      <p>
        A safe, high-signal phrasing is: 
        <em>“Given the need for <strong>X</strong>, I’d lean toward <strong>Y</strong> 
        because it optimizes for <strong>Z</strong>.”</em>
      </p>

      <h3>Mini checklist</h3>
      <ul>
        <li>Who’s the user? (public vs internal)</li>
        <li>Is SEO/first paint important?</li>
        <li>How often will this content change?</li>
        <li>Do multiple teams own different parts of the app?</li>
      </ul>

      <h2>Checklist before committing</h2>
      <ol>
        <li>Who are the users (public vs internal, device mix, network quality)?</li>
        <li>Is SEO or first paint critical, or is auth-gated speed after login the priority?</li>
        <li>How fast do we need to iterate and deploy (team size, release cadence)?</li>
        <li>Will multiple teams work on this app (ownership, boundaries, shared platform)?</li>
        <li>Edge cases: i18n/RTL, accessibility levels, offline needs, analytics/experiments.</li>
      </ol>

      <h2>Takeaway</h2>
      <p>
        Rendering and architecture choices are never one-size-fits-all. 
        What matters in interviews is not picking the “right” acronym, 
        but showing that you can <strong>weigh trade-offs</strong> 
        and <strong>tie decisions back to real requirements</strong>.
      </p>
      <p>
        If you consistently frame your reasoning this way, you won’t just 
        answer the question — you’ll demonstrate that you think like a 
        senior engineer who can guide a team through real-world complexity.
      </p>
    </fa-guide-shell>
  `,
})
export class SystemDesignArchitectureArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
}
