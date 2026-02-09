import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  selector: 'app-behavioral-evaluation-areas-article',
  imports: [CommonModule, RouterModule, GuideShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fa-guide-shell
      title="Behavioral Interview Scoring Rubric: What Interviewers Evaluate"
      [minutes]="12"
      [tags]="['behavioral','signals','evaluation']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">

      <p>
        Every behavioral interview is secretly scored. Interviewers aren’t just listening to your
        stories; they’re mapping what you say onto a set of <strong>core signals</strong>. Knowing these
        areas means you can speak their language and make it easy for them to check the boxes in your favor.
      </p>

      <h2>The five evaluation pillars</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="font-semibold">Communication & Clarity</div>
          <p class="text-sm opacity-90">Do you explain ideas in a way that teammates can follow? Great communication isn’t about big words—it’s about making complex things sound simple. Example: explaining a perf regression fix to a PM without drowning them in bundle analysis jargon.</p>
        </div>
        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="font-semibold">Collaboration</div>
          <p class="text-sm opacity-90">How do you show up with peers, PMs, and designers? Good answers highlight both give and take: pushing back when it matters, but also adapting for team velocity. Interviewers want to see you can disagree without being disagreeable.</p>
        </div>
        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="font-semibold">Ownership</div>
          <p class="text-sm opacity-90">Do you drive problems through to the finish line? Ownership is about spotting risks early, coordinating across functions, and refusing to let issues die in limbo. A high‑signal story: catching a late‑stage a11y blocker and rallying the team to fix it before launch.</p>
        </div>
        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="font-semibold">Growth Mindset</div>
          <p class="text-sm opacity-90">Can you take feedback, learn from mistakes, and get better fast? Growth isn’t just “I read docs.” It’s: “After that outage, I rewrote our error handling, added alerts, and taught the team how to debug similar issues.” Reflection plus action is what interviewers score.</p>
        </div>
        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700 md:col-span-2">
          <div class="font-semibold">Leadership Potential</div>
          <p class="text-sm opacity-90">You don’t need a manager title to show leadership. It’s about multiplying others: mentoring juniors, setting higher quality bars, introducing processes that save the team hours. A sharp example: pairing with a junior on a tricky PR and then turning the learnings into a team‑wide checklist.</p>
        </div>
      </div>

      <h2>How to use this knowledge</h2>
      <ul class="list-disc list-inside mt-2 space-y-2">
        <li><strong>Map your stories:</strong> Tag each one with at least two pillars so you can flex it as needed.</li>
        <li><strong>Listen for hints:</strong> If an interviewer asks about conflict, they’re testing collaboration and communication.</li>
        <li><strong>Balance your set:</strong> Don’t bring five ownership stories—cover the spectrum.</li>
      </ul>

      <h2>Insider tip</h2>
      <blockquote>
        The highest scores go to candidates who make the interviewer’s job easy.
        Spell out the signal as you answer: <em>“This shows how I took ownership when…”</em>
      </blockquote>
    </fa-guide-shell>
  `,
})
export class BehavioralEvaluationAreasArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
}
