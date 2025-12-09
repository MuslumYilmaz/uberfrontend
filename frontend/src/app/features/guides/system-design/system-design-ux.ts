import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, GuideShellComponent],
  template: `
    <fa-guide-shell
      title="Accessibility, i18n & Offline First"
      [minutes]="10"
      [tags]="['a11y','i18n','offline-first']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">

      <p>
        Most candidates can draw boxes for rendering or caching. 
        What separates strong answers is remembering the 
        <strong>cross-cutting concerns</strong> that make products work 
        for <em>all users, in all contexts</em>.
      </p>

      <h2>Accessibility (a11y)</h2>
      <p>
        Accessibility isn’t just a “nice to have.” In interviews, 
        mentioning it shows you think like a senior engineer who 
        considers <em>all users</em>.
      </p>
      <ul>
        <li><strong>Keyboard navigation:</strong> every action should be doable without a mouse.</li>
        <li><strong>Screen readers:</strong> use semantic HTML, proper ARIA labels.</li>
        <li><strong>Color contrast:</strong> text should be legible in all themes and lighting.</li>
        <li><strong>Focus states:</strong> make sure focus order is logical and visible.</li>
      </ul>
      <blockquote>
        <em>Interview script:</em>  
        “For accessibility, I’d ensure semantic HTML and ARIA, proper focus states, 
        and test flows with just a keyboard — so the app works for everyone.”
      </blockquote>

      <h2>Internationalization (i18n)</h2>
      <p>
        Global apps must adapt to different languages, regions, and cultures. 
        In interviews, bring up i18n early to stand out.
      </p>
      <ul>
        <li><strong>Text expansion:</strong> German strings may be 30–40% longer than English.</li>
        <li><strong>RTL layouts:</strong> Arabic/Hebrew require mirrored layouts.</li>
        <li><strong>Date/time formats:</strong> DD/MM vs MM/DD; 24h vs 12h clocks.</li>
        <li><strong>Number/currency:</strong> separators and currency symbols vary widely.</li>
      </ul>
      <blockquote>
        <em>Interview script:</em>  
        “I’d design components to handle text expansion, RTL, and locale-based 
        date/number formatting so they work worldwide from day one.”
      </blockquote>

      <h2>Offline-first</h2>
      <p>
        Many users experience poor or intermittent connectivity. 
        Offline-first thinking makes apps resilient.
      </p>
      <ul>
        <li><strong>Cache assets:</strong> use a Service Worker to store shell + key data.</li>
        <li><strong>Queue writes:</strong> save mutations locally, replay when back online.</li>
        <li><strong>Conflict resolution:</strong> last-write-wins or show diffs for manual merge.</li>
        <li><strong>Fallback UX:</strong> show “You’re offline” banners and graceful degradation.</li>
      </ul>
      <blockquote>
        <em>Interview script:</em>  
        “For offline, I’d cache the shell, queue writes, and reconcile conflicts 
        on sync — giving users a smooth experience even with bad networks.”
      </blockquote>

      <h2>Takeaway</h2>
      <p>
        Cross-cutting concerns like accessibility, i18n, and offline-first 
        rarely appear in the job description — but <strong>they always come up 
        in great interview answers</strong>. Mentioning them naturally shows 
        you think beyond code, and design systems that work for everyone, everywhere.
      </p>
    </fa-guide-shell>
  `,
})
export class SystemDesignCrossCuttingArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
}
