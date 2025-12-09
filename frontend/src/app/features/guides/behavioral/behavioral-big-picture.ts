import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
    standalone: true,
    selector: 'app-behavioral-big-picture-article',
    imports: [CommonModule, RouterModule, GuideShellComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <fa-guide-shell
      title="The Big Picture: Why Behavioral Rounds Matter in Tech"
      [minutes]="8"
      [tags]="['behavioral','hiring','signals']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">

      <p>
        Behavioral interviews exist to predict <strong>how you will work on this team</strong>.
        They sit alongside coding and system design to complete the picture: can you collaborate,
        communicate decisions, handle pressure, and learn quickly? Once you see this purpose, these
        rounds become much less intimidating.
      </p>

      <h2>Where behavioral fits in the funnel</h2>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mt-2">
        <div class="p-3 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="text-sm opacity-80">1</div>
          <div class="font-semibold">Screen</div>
          <p class="text-sm opacity-90">Resume + recruiter chat. Checks basics and motivation.</p>
        </div>
        <div class="p-3 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="text-sm opacity-80">2</div>
          <div class="font-semibold">Coding</div>
          <p class="text-sm opacity-90">Can you write readable code and solve problems under time?</p>
        </div>
        <div class="p-3 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="text-sm opacity-80">3</div>
          <div class="font-semibold">System/UX</div>
          <p class="text-sm opacity-90">Can you design, make trade‑offs, and reason at a higher level?</p>
        </div>
        <div class="p-3 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="text-sm opacity-80">4</div>
          <div class="font-semibold">Behavioral</div>
          <p class="text-sm opacity-90">How you collaborate, own outcomes, and grow with feedback.</p>
        </div>
      </div>

      <h2>What companies actually optimize for</h2>
      <table class="table-auto border border-neutral-700 mt-3 w-full">
        <thead>
          <tr>
            <th class="px-2 py-1 text-left">Company goal</th>
            <th class="px-2 py-1 text-left">Behavioral signal</th>
            <th class="px-2 py-1 text-left">What to demonstrate</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Shipping predictably</td>
            <td>Ownership & risk thinking</td>
            <td>Surfacing blockers early, breaking work down, feature flags.</td>
          </tr>
          <tr>
            <td>Healthy collaboration</td>
            <td>Communication & empathy</td>
            <td>Aligning with design/PM, giving & receiving feedback well.</td>
          </tr>
          <tr>
            <td>Maintaining quality</td>
            <td>Judgment</td>
            <td>Trade‑offs (perf vs UX), testing strategy, a11y as a default.</td>
          </tr>
          <tr>
            <td>Growing the team</td>
            <td>Leadership potential</td>
            <td>Mentoring juniors, setting bars, improving processes.</td>
          </tr>
        </tbody>
      </table>

      <h2>Front‑end specifics that often come up</h2>
      <ul>
        <li><strong>Design partnership:</strong> negotiating scope or polish under a deadline.</li>
        <li><strong>Perf incidents:</strong> bundle size spikes, long tasks, Core Web Vitals regressions.</li>
        <li><strong>Accessibility:</strong> fixing critical issues and setting up checks in CI.</li>
        <li><strong>Ambiguity:</strong> shaping a messy requirement into a crisp MVP plan.</li>
      </ul>

      <h2>Signals interviewers look for</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="font-semibold">Clear, concise stories</div>
          <p class="text-sm opacity-90">60–90 seconds per answer with just enough context.</p>
        </div>
        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="font-semibold">Trade‑offs & alternatives</div>
          <p class="text-sm opacity-90">Name at least two options and why one won for v1.</p>
        </div>
        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="font-semibold">Impact</div>
          <p class="text-sm opacity-90">Quantify outcomes: % faster, tickets down, revenue up.</p>
        </div>
        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="font-semibold">Team orientation</div>
          <p class="text-sm opacity-90">You unblock others, document decisions, and share credit.</p>
        </div>
      </div>

    <h2>A lightweight structure to follow</h2>
    <p>
    Think of this as your storytelling compass. Instead of rambling through a 10‑minute tale,
    you hit the beats that help interviewers quickly see how you think, act, and grow. Here’s how:
    </p>
    <div class="space-y-4 mt-3">
    <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
    <div class="font-semibold">1. Start with the result headline</div>
    <p class="text-sm opacity-90">Lead with impact: <em>“We cut LCP by 28% in three weeks”</em>. Interviewers lean in when they hear a clear win up front. It frames the rest of your story as worth listening to.</p>
    </div>
    <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
    <div class="font-semibold">2. Give one‑line context</div>
    <p class="text-sm opacity-90">Set the stage in a single sentence: the product, the users, and the constraint. <em>“This was for a retail dashboard used by 1,200 daily store managers, and we were one sprint away from launch.”</em> That’s all they need to get the picture.</p>
    </div>
    <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
    <div class="font-semibold">3. Walk through key actions + a trade‑off</div>
    <p class="text-sm opacity-90">Pick the 3 most important moves you made—decisions, code changes, or collaborations. Then add one trade‑off you faced and why you chose the option you did. This shows judgment, not just execution.</p>
    </div>
    <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
    <div class="font-semibold">4. Close with change and learning</div>
    <p class="text-sm opacity-90">Wrap it up with the outcome and your reflection. <em>“Not only did the dashboard load 28% faster, but design adopted our perf checklist for all new features. Next time, I’d involve QA earlier to avoid regressions.”</em> Now you’ve shown impact, growth, and forward thinking in under two minutes.</p>
    </div>
    </div>

      <h2>The mindset shift</h2>
      <blockquote>
        You are not trying to sound impressive—you are teaching the interviewer <em>how you make good decisions</em>.
      </blockquote>

      <hr />
      <p class="mt-4">
        Next: <a routerLink="/guides/behavioral/evaluation-areas">What You’re Evaluated On</a>
        · or jump to <a routerLink="/guides/behavioral/prep">How to Prepare</a>.
      </p>
    </fa-guide-shell>
  `,
})
export class BehavioralBigPictureArticle {
    @Input() prev: any[] | null = null;
    @Input() next: any[] | null = null;
    @Input() leftNav: any;
}
