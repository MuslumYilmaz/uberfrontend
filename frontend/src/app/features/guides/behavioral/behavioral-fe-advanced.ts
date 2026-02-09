import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  selector: 'app-behavioral-fe-advanced-article',
  imports: [CommonModule, RouterModule, GuideShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fa-guide-shell
      title="Frontend Behavioral Interview Scenarios: How to Answer Technical Prompts"
      [minutes]="15"
      [tags]="['behavioral','frontend','scenarios']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">

      <p>
        These behavioral questions target real-world decisions frontend developers make: trade-offs in design, performance, accessibility, and collaboration. Your goal is to show both judgment and technical empathy—how you balance UX, engineering constraints, and team alignment.
      </p>

      <h2>1. Design trade-offs</h2>
      <p><em>“Tell me about a time you had to choose between user experience and implementation complexity.”</em></p>
      <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700 mt-2">
        <p class="text-sm opacity-90"><strong>Signal:</strong> Product thinking. Can you make pragmatic decisions, not just ideal ones?</p>
        <p class="text-sm opacity-90"><strong>Sample answer:</strong> “On a checkout page, design proposed inline editing for every line item. Technically, this required a custom form component per row with state sync issues. I pushed back and suggested grouping edits behind an 'Edit' button per section. This reduced complexity by 60%, still met user needs, and shipped faster. Design agreed after seeing the prototype.”</p>
        <p class="text-sm opacity-90"><strong>Answer tip:</strong> Show how you aligned with UX goals but proposed simpler or more scalable options.</p>
      </div>

      <h2>2. Accessibility</h2>
      <p><em>“Describe a time you advocated for accessibility.”</em></p>
      <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700 mt-2">
        <p class="text-sm opacity-90"><strong>Signal:</strong> Ownership + inclusion. Do you catch what others miss?</p>
        <p class="text-sm opacity-90"><strong>Sample answer:</strong> “We had a modal component used widely. I noticed it didn’t trap focus or have screen reader labels. I logged it as tech debt, then created a fix with proper ARIA roles and keyboard traps. We released it as a patch and it improved accessibility scores across the app.”</p>
        <p class="text-sm opacity-90"><strong>Answer tip:</strong> Mention tools you used (like axe, Lighthouse), and how you made a shared improvement—not just a one-off fix.</p>
      </div>

      <h2>3. Performance</h2>
      <p><em>“Tell me about a time you improved frontend performance.”</em></p>
      <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700 mt-2">
        <p class="text-sm opacity-90"><strong>Signal:</strong> Initiative + impact. Do you notice slow experiences and fix them proactively?</p>
        <p class="text-sm opacity-90"><strong>Sample answer:</strong> “Our dashboard took 7s to load. I profiled it in Chrome DevTools and found a large chart library being imported even when not visible. I introduced route-level code splitting and lazy loading for the chart module. Load time dropped to 2.4s. I documented the pattern so other teams could follow.”</p>
        <p class="text-sm opacity-90"><strong>Answer tip:</strong> Show how you diagnosed the issue, prioritized the fix, and made it repeatable for others.</p>
      </div>

      <h2>4. Cross-functional collaboration</h2>
      <p><em>“Give an example of working with design or backend to resolve a tricky issue.”</em></p>
      <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700 mt-2">
        <p class="text-sm opacity-90"><strong>Signal:</strong> Communication + flexibility. Can you speak both product and technical language?</p>
        <p class="text-sm opacity-90"><strong>Sample answer:</strong> “A designer wanted full bleed images in a content grid. Backend returned fixed-size thumbnails. Instead of going back and forth, I proposed a shared spec for image sizes with the backend team and updated the component to be responsive. This saved time for everyone and improved consistency.”</p>
        <p class="text-sm opacity-90"><strong>Answer tip:</strong> Show how you built a bridge, not a wall—translating needs across functions to ship better work.</p>
      </div>

      <h2>Pro tip</h2>
      <blockquote>
        Interviewers love when you <em>speak like a peer</em>. Show that you’ve navigated real product decisions—not just taken tickets.
      </blockquote>
    </fa-guide-shell>
  `,
})
export class BehavioralFeAdvancedArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
}
