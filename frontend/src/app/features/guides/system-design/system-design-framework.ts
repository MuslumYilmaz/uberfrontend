import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, GuideShellComponent],
  template: `
    <fa-guide-shell
      title="A Reusable 5-Step Approach"
      [minutes]="10"
      [tags]="['system design','framework']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">

      <p>
        The scariest part of a system design interview is often the beginning. 
        You’re staring at a blank whiteboard (or screen), and the fear of freezing 
        or rambling is real. 
      </p>
      <p>
        The best way to beat that? Walk in with a <strong>repeatable framework</strong> — 
        a simple flow you can lean on no matter what question you’re asked. 
        Think of it as your <em>compass</em>: it won’t give you every answer, 
        but it will always point you in the right direction.
      </p>

      <h2>The 5 Steps at a Glance</h2>
      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Step</th>
            <th style="text-align:left;">Goal</th>
            <th style="text-align:left;">Example</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Clarify requirements</strong></td>
            <td>Confirm what problem you’re solving</td>
            <td>“Do we need offline support or SEO?”</td>
          </tr>
          <tr>
            <td><strong>2. Identify core components</strong></td>
            <td>Break down into logical pieces</td>
            <td>Video player, feed, upload flow, comments</td>
          </tr>
          <tr>
            <td><strong>3. Choose an architecture</strong></td>
            <td>Pick CSR, SSR, or hybrid (with reasoning)</td>
            <td>“SEO matters → SSR is the better fit”</td>
          </tr>
          <tr>
            <td><strong>4. Address cross-cutting concerns</strong></td>
            <td>Don’t forget performance, a11y, testing, i18n</td>
            <td>Lazy load video player, add ARIA roles</td>
          </tr>
          <tr>
            <td><strong>5. Summarize trade-offs & next steps</strong></td>
            <td>Close with priorities and future improvements</td>
            <td>“Start CSR → add SSR later if SEO is critical”</td>
          </tr>
        </tbody>
      </table>

      <h2>Step 1: Clarify requirements</h2>
      <p>
        Interviewers often give intentionally vague prompts like “Design a chat app.” 
        If you dive straight into solutions, you risk solving the wrong problem. 
        Start by asking clarifying questions to shrink the scope:
      </p>
      <ul>
        <li><strong>Who are the users?</strong> Consumers, admins, or both?</li>
        <li><strong>What’s the primary use case?</strong> Browsing, uploading, messaging?</li>
        <li><strong>What’s explicitly out of scope?</strong> Call these non-goals early.</li>
      </ul>
      <p>
        Example: If asked to design a chat app, you might ask whether it’s 
        only 1-to-1 messaging or if group chats, file sharing, and reactions are required. 
        These questions show that you think like a product owner, not just a coder.
      </p>

      <h2>Step 2: Identify core components</h2>
      <p>
        Big problems feel overwhelming until you break them into parts. 
        Interviewers want to see that you can decompose a messy idea 
        into clear building blocks — it shows you can manage complexity 
        instead of getting lost in it.
      </p>
      <ul>
        <li><strong>News feed:</strong> post composer, feed list, notifications.</li>
        <li><strong>Dashboard:</strong> charts, filters, export panel.</li>
        <li><strong>Chat app:</strong> input box, messages list, presence indicator.</li>
      </ul>
      <p>
        The key is to name these components out loud. 
        For example: “I see three main parts here: a composer, a list, and a notification system.” 
        This keeps the discussion organized and makes it easy for the interviewer to follow your thought process.
      </p>

      <h2>Step 3: Choose an architecture</h2>
      <p>
        Once you’ve mapped the core components, decide how the app should be delivered. 
        Interviewers want to see that you can <strong>adapt architecture to context</strong>, 
        not just name a pattern. State the option, the benefit, and the trade-off.
      </p>
      <ul>
        <li>
          <strong>CSR (Client-Side Rendering):</strong> Great for fast iteration and 
          simple deployments, but slower first paint and weaker SEO.
        </li>
        <li>
          <strong>SSR (Server-Side Rendering):</strong> Delivers faster initial load and 
          SEO benefits, but adds server complexity and cost.
        </li>
        <li>
          <strong>Hybrid (e.g. static + islands):</strong> Combines both — useful for 
          large apps where some parts need SEO and speed, others don’t.
        </li>
      </ul>
      <p>
        Example script: <em>“Since SEO is critical here, I’d start with SSR. 
        For features where fast iteration matters more, CSR could still be fine.”</em> 
        By tying the choice to the requirements you clarified earlier, 
        you show you’re making <strong>principled decisions</strong>, not just 
        picking tech by default.
      </p>

      <h2>Step 4: Address cross-cutting concerns</h2>
      <p>
        The difference between a junior and a senior answer often comes down to 
        cross-cutting concerns. These aren’t shiny features, but the 
        <strong>qualities that make software usable and resilient at scale</strong>.
      </p>
      <ul>
        <li>
          <strong>Performance:</strong> Code splitting, lazy loading, image compression, CDN usage.  
          Example: “We’ll lazy load the charting library so the dashboard loads fast.”
        </li>
        <li>
          <strong>Accessibility:</strong> ARIA labels, keyboard navigation, color contrast.  
          Example: “We’ll make sure the modal is focus-trapped so screen readers can use it.”
        </li>
        <li>
          <strong>Internationalization:</strong> RTL layouts, multiple languages, locale-aware dates.  
          Example: “Since this is global, we’ll support RTL for Arabic and Hebrew.”
        </li>
        <li>
          <strong>Testing & error handling:</strong> Unit tests, integration tests, graceful fallbacks.  
          Example: “If the API call fails, we’ll show cached data with a retry option.”
        </li>
      </ul>
      <p>
        Dropping in even <em>one or two</em> of these points during your answer 
        shows you’re thinking like a senior engineer who cares about real users, 
        not just happy-path code.
      </p>

      <h2>Step 5: Summarize trade-offs and next steps</h2>
      <p>
        Don’t just stop after listing features and architecture. 
        Strong answers <strong>close the loop</strong> by saying what you’d ship today 
        (v1) and what you’d improve tomorrow (scale). This shows you can 
        balance speed of delivery with long-term vision.
      </p>
      <ul>
        <li><strong>V1 focus:</strong> What’s the simplest design that gets the product working?</li>
        <li><strong>Future improvements:</strong> What would you add if traffic or complexity grows?</li>
        <li><strong>Trade-offs acknowledged:</strong> Why you chose the current option, and what you’d revisit later.</li>
      </ul>
      <blockquote>
        Example: “For v1, I’d launch with CSR to move quickly. 
        If SEO becomes critical, we can layer SSR later. 
        Long term, hybrid rendering might give us the best balance.”
      </blockquote>
      <p>
        Ending this way makes your answer feel complete and leaves the interviewer 
        with confidence that you think in <em>stages, not silos</em>.
      </p>
      
      <h2>Why this works</h2>
      <p>
        This 5-step approach gives you a reliable backbone for tackling 
        any front-end system design problem. Even if you don’t have the 
        “perfect” answer, following this structure shows 
        <strong>clarity, organization, and senior-level thinking</strong>.
      </p>
      <p>
        Remember: interviewers aren’t grading your drawing skills. 
        They’re watching how you <em>reason under pressure</em>, 
        handle trade-offs, and keep the discussion grounded. 
        With this framework, you’ll never feel lost at the whiteboard — 
        you’ll always know the next move.
      </p>
    </fa-guide-shell>
  `,
})
export class SystemDesignFrameworkArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
}
