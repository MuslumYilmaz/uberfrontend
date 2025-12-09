import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, GuideShellComponent],
  template: `
    <fa-guide-shell
      title="What Interviewers Really Look For"
      [minutes]="7"
      [tags]="['system design','signals','trade-offs']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">

      <p>
        At the end of the day, system design interviews aren’t about 
        drawing the fanciest diagram or naming every buzzword. 
        They’re about the <strong>signals you send</strong> — 
        how you think, what you prioritize, and whether you can 
        make sensible trade-offs like a senior engineer. 
        That’s what interviewers are really listening for.
      </p>

      <h2>1. Clarity of thought</h2>
      <p>
        The strongest candidates don’t rush into boxes and arrows. 
        They slow down, ask smart questions, and show that they 
        understand the problem before solving it.
      </p>
      <ul>
        <li><strong>Clarify scope:</strong> shrink vague prompts into concrete goals before designing.</li>
        <li><strong>Think out loud:</strong> walk step by step so the interviewer can follow your reasoning.</li>
        <li><strong>Check assumptions:</strong> confirm context (scale, devices, users) before going deep.</li>
      </ul>
      <blockquote>
        <em>Strong signal:</em>  
        “Before I dive in — are users mostly mobile or desktop?  
        That changes how I’d approach performance.”
      </blockquote>

      <h2>2. Prioritization</h2>
      <p>
        Great engineers know you can’t build everything at once. 
        In interviews, showing that you can <strong>separate essentials from extras</strong> 
        proves you can deliver value quickly without over-engineering.
      </p>
      <ul>
        <li><strong>Must-haves vs nice-to-haves:</strong> call out what ships in v1 and what can wait.</li>
        <li><strong>Ship fast, then iterate:</strong> focus on a sensible first version instead of boiling the ocean.</li>
        <li><strong>Future awareness:</strong> acknowledge improvements you’d add later when scale or adoption demands it.</li>
      </ul>
      <blockquote>
        <em>Strong signal:</em>  
        “For v1, I’d skip offline sync. If adoption grows in regions with bad connectivity, 
        we can add it later.”
      </blockquote>

      <h2>3. Trade-off reasoning</h2>
      <p>
        Every architecture choice comes with trade-offs. 
        Strong candidates don’t act like their solution is flawless — 
        they show they can <strong>weigh pros and cons</strong> 
        and explain why one option fits the current context best.
      </p>
      <ul>
        <li><strong>Acknowledge trade-offs:</strong> make it clear that no solution is perfect.</li>
        <li><strong>Explain your “why”:</strong> tie your choice to the problem’s constraints (SEO, scale, speed).</li>
        <li><strong>Show awareness of alternatives:</strong> mention what you’d do differently if priorities shifted.</li>
      </ul>
      <blockquote>
        <em>Strong signal:</em>  
        “CSR is simpler to deploy, but if SEO becomes critical we’d need SSR.  
        I’d start with CSR for speed.”
      </blockquote>

      <h2>4. User awareness</h2>
      <p>
        System design isn’t just about architecture diagrams — 
        it’s about how the app <strong>feels for real people</strong>. 
        Interviewers want to see if you think beyond code and 
        factor in the actual user experience.
      </p>
      <ul>
        <li><strong>Empathy for users:</strong> consider how design choices affect people on slow devices or networks.</li>
        <li><strong>Accessibility & inclusivity:</strong> bring up a11y needs and global constraints like localization.</li>
        <li><strong>Edge cases:</strong> don’t forget errors, empty states, retries, and recovery flows.</li>
      </ul>
      <blockquote>
        <em>Strong signal:</em>  
        “On 3G, image-heavy pages will crawl.  
        I’d add responsive image sizes and caching to keep it usable.”
      </blockquote>

      <h2>5. Communication & collaboration</h2>
      <p>
        Even the best design ideas fall flat if you can’t communicate them. 
        Interviewers want to see if you can <strong>explain your thinking clearly, 
        work collaboratively, and guide a discussion</strong> — the same skills you’d 
        use with teammates on the job.
      </p>
      <ul>
        <li><strong>Clarity over jargon:</strong> explain concepts in plain language so anyone can follow.</li>
        <li><strong>Treat it as teamwork:</strong> involve the interviewer like a collaborator, not an examiner.</li>
        <li><strong>Guide with structure:</strong> outline your approach up front instead of rambling through ideas.</li>
      </ul>
      <blockquote>
        <em>Strong signal:</em>  
        “Here’s how I’ll structure my answer: scope → constraints → architecture → trade-offs.”
      </blockquote>

      <h2>Takeaway</h2>
      <p>
        Great candidates don’t win interviews by drawing perfect diagrams — 
        they win by <strong>showing how they think</strong>.  
        If you demonstrate clarity, smart prioritization, honest trade-off reasoning, 
        empathy for users, and clear communication, you’ll signal that you can 
        <em>lead real-world projects</em>, not just answer interview questions.
      </p>
      <p>
        Remember: interviewers aren’t looking for a “right answer.” 
        They’re looking for someone who can bring order to messy problems, 
        guide a team, and make thoughtful choices under pressure. 
        That’s what makes you stand out.
      </p>
    </fa-guide-shell>
  `,
})
export class SystemDesignSignalsArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
}
