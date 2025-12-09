import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  selector: 'app-behavioral-tips-article',
  imports: [CommonModule, RouterModule, GuideShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fa-guide-shell
      title="Practical Tips & Anti-Patterns"
      [minutes]="12"
      [tags]="['behavioral','tips','anti-patterns']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">

      <p>
        Even great stories can flop if they’re delivered poorly. These tips and anti-patterns
        help you avoid common pitfalls and present your answers with confidence—whether
        you’re in person or on Zoom.
      </p>

      <h2>1. Avoid rambling</h2>
      <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700 mt-2">
        <p class="text-sm opacity-90"><strong>Tip:</strong> Anchor on STAR. Think in beats—Situation → Task → Action → Result → Reflection.</p>
        <p class="text-sm opacity-90"><strong>Mini example:</strong> Instead of a 5-minute backstory about the company, say: 
        “Checkout load times were 18s → I audited bundles and lazy-loaded assets → LCP dropped to 2.8s → Conversions rose 12% → I learned to measure first.”</p>
      </div>

      <h2>2. Stay specific</h2>
      <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700 mt-2">
        <p class="text-sm opacity-90"><strong>Tip:</strong> Replace vague claims with concrete numbers, timelines, or outcomes.</p>
        <p class="text-sm opacity-90"><strong>Anti-pattern:</strong> “We improved performance a lot.”</p>
        <p class="text-sm opacity-90"><strong>Better:</strong> “We cut load time from 7s to 2.4s in 3 weeks.”</p>
      </div>

      <h2>3. Quantify impact</h2>
      <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700 mt-2">
        <p class="text-sm opacity-90"><strong>Tip:</strong> Numbers make stories memorable. Use percentages, time saved, or adoption counts.</p>
        <p class="text-sm opacity-90"><strong>Mini example:</strong> “My testing framework reduced flaky test reruns by 40% and cut CI time by 12 minutes per build.”</p>
      </div>

      <h2>4. Handle Zoom dynamics</h2>
      <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700 mt-2">
        <p class="text-sm opacity-90"><strong>Tip:</strong> Look at the camera for key points, pause slightly longer (Zoom has delay), and check for understanding (“Does that make sense?”).</p>
        <p class="text-sm opacity-90"><strong>Anti-pattern:</strong> Talking nonstop without noticing frozen faces or muted mics.</p>
      </div>

      <h2>Pro tip</h2>
      <blockquote>
        Always frame answers like you’re writing bullet points in the interviewer’s notes.
        If they can capture your story in 2–3 lines, you nailed it.
      </blockquote>
    </fa-guide-shell>
  `,
})
export class BehavioralTipsArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
}
