import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, GuideShellComponent],
  template: `
    <uf-guide-shell
      title="Traps and Anti-Patterns to Avoid"
      [minutes]="9"
      [tags]="['system design','mistakes','anti-patterns']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">

      <p>
        In high-pressure interviews, it’s easy to fall into habits 
        that hurt your performance. The good news: most of these 
        <strong>traps are avoidable</strong> if you know what to watch out for.
      </p>

      <h2>1. Jumping straight into boxes</h2>
      <p>
        Many candidates rush to draw diagrams before clarifying scope.  
        This looks rushed and scattered.
      </p>
      <ul>
        <li><strong>Trap:</strong> jumping into architecture without context.</li>
        <li><strong>Better:</strong> spend 1–2 minutes clarifying users, scale, and goals first.</li>
      </ul>
      <blockquote>
        <em>Red flag:</em> “So… I’ll just start with a React app and a Node server…” (before clarifying anything).
      </blockquote>

      <h2>2. Listing buzzwords instead of reasoning</h2>
      <p>
        Dropping terms like “microfrontends,” “CDN,” or “GraphQL” 
        without tying them to the problem signals shallow thinking.
      </p>
      <ul>
        <li><strong>Trap:</strong> reciting patterns as if that’s enough.</li>
        <li><strong>Better:</strong> say why you’d pick one <em>for this scenario</em>.</li>
      </ul>
      <blockquote>
        <em>Red flag:</em> “We’ll definitely need microfrontends.”  
        <em>Better:</em> “If multiple teams need to ship independently, microfrontends could help.”
      </blockquote>

      <h2>3. Over-engineering v1</h2>
      <p>
        Trying to design for a billion users on day one is a common trap.  
        Interviewers want pragmatism, not fantasy scaling.
      </p>
      <ul>
        <li><strong>Trap:</strong> designing with CDNs, sharding, and microservices for a toy app.</li>
        <li><strong>Better:</strong> start simple, then explain what you’d add if scale demands it.</li>
      </ul>
      <blockquote>
        <em>Red flag:</em> “We’ll shard across three regions for availability…”  
        <em>Better:</em> “For v1, a single region is fine. At scale, I’d replicate globally.”
      </blockquote>

      <h2>4. Ignoring cross-cutting concerns</h2>
      <p>
        Forgetting accessibility, i18n, or offline-first makes you look junior.  
        These are small mentions that pay big dividends in interviews.
      </p>
      <ul>
        <li><strong>Trap:</strong> designing only for the “happy path.”</li>
        <li><strong>Better:</strong> call out a11y, i18n, or offline gracefully, even if briefly.</li>
      </ul>
      <blockquote>
        <em>Red flag:</em> never mentioning accessibility.  
        <em>Better:</em> “I’d ensure this flow is keyboard-accessible and handles RTL layouts.”
      </blockquote>

      <h2>5. Rambling without structure</h2>
      <p>
        A messy, unstructured answer makes it hard for interviewers to follow.  
        Even good ideas get lost if the delivery is chaotic.
      </p>
      <ul>
        <li><strong>Trap:</strong> brain-dumping every idea as it comes to mind.</li>
        <li><strong>Better:</strong> outline your flow: scope → constraints → architecture → trade-offs.</li>
      </ul>
      <blockquote>
        <em>Red flag:</em> “Uh… we could do CSR, or SSR, or… maybe GraphQL?”  
        <em>Better:</em> “Here’s how I’ll structure my answer: first scope, then constraints, then architecture.”
      </blockquote>

      <h2>Takeaway</h2>
      <p>
        Most candidates lose points not because they lack knowledge, 
        but because they fall into avoidable traps under pressure.  
        If you avoid rushing, skip the buzzwords, design for v1, 
        remember cross-cutting concerns, and stay structured, 
        you’ll stand out as a thoughtful, senior-level engineer.
      </p>
    </uf-guide-shell>
  `,
})
export class SystemDesignTrapsArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
}
