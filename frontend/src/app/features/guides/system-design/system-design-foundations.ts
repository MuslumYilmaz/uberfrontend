import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, GuideShellComponent],
  template: `
    <fa-guide-shell
      title="Foundations & Constraints"
      [minutes]="14"
      [tags]="['system design','foundations','constraints']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">
    <h1>Scope, Constraints, and Trade-offs</h1>
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

    <h2>1. Clarify the scope</h2>
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

    <h2>2. Identify constraints</h2>
    <p>
      Every real system has limits—ignoring them leads to designs that look good 
      on a whiteboard but fall apart in practice. Great candidates surface constraints early 
      and use them to shape their design. Common ones to ask about include:
    </p>
    <ul>
      <li><strong>Scale:</strong> Are we serving a classroom of 100, a startup with 10k, or millions of users worldwide?</li>
      <li><strong>Performance:</strong> Do we need sub-100ms interactions, or is a few seconds acceptable?</li>
      <li><strong>Devices & networks:</strong> Will most users be on fast desktops, or low-end Android phones on 3G?</li>
      <li><strong>Business context:</strong> Is SEO a must? Do we need accessibility compliance (WCAG/ADA)?</li>
    </ul>
    <p>
      For example: if you’re designing an image-heavy site for a global audience, 
      constraints like unreliable networks and mobile usage might push you toward 
      aggressive image compression, CDNs, and lazy loading from day one.
    </p>

    <h2>3. Make explicit trade-offs</h2>
    <p>
      Every architectural choice comes with downsides. Interviewers don’t expect you 
      to find a “perfect” solution — they want to see that you can recognize trade-offs, 
      say them out loud, and connect them to the problem at hand.
    </p>
    <ul>
      <li>
        <strong>CSR vs SSR:</strong> CSR (client-side rendering) is easier to build and deploy, 
        but SSR (server-side rendering) gives faster first paint and better SEO. 
        The “right” answer depends on whether fast initial load or simplicity matters more.
      </li>
      <li>
        <strong>Global vs local state:</strong> Global state ensures consistency across the app 
        (great for auth or user settings), but adds complexity and performance overhead 
        compared to local component state.
      </li>
      <li>
        <strong>Offline-first:</strong> Designing for offline use creates a great experience 
        for travelers and mobile users, but adds complexity in caching and conflict resolution 
        when syncing back online.
      </li>
    </ul>
    <p>
      The key is to <em>say the trade-off out loud</em> and tie it to context. 
      For example: “For v1, I’d start with CSR to move quickly. 
      If SEO or first paint becomes a priority, we can layer SSR later.” 
      That shows you understand not just the options, but the 
      <strong>timeline and context where each option makes sense</strong>.
    </p>

    <h2>Putting it together</h2>
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
      Getting these three right instantly makes the rest of your design 
      more credible. It signals that you can think like a senior engineer 
      who values clarity, context, and pragmatic choices.
    </p>
    </fa-guide-shell>
  `,
})
export class SystemDesignFoundationsArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
}
