import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  selector: 'app-behavioral-intro-article',
  imports: [CommonModule, RouterModule, GuideShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fa-guide-shell
      title="Behavioral Interviews: What Great Answers Look Like"
      [minutes]="12"
      [tags]="['behavioral','communication','leadership']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">

      <p>
        Behavioral rounds measure <strong>how you work with others</strong>, not just what you can code.
        Interviewers are listening for clear thinking, ownership, collaboration, and growth. This intro
        explains the signals they score and how to prepare stories that make those signals obvious.
      </p>

      <h2>What behavioral interviews really test</h2>
      <ul>
        <li><strong>Communication & clarity:</strong> explaining decisions, trade-offs, and impact succinctly.</li>
        <li><strong>Collaboration:</strong> partnering with designers, PMs, QA, and back-end; aligning stakeholders.</li>
        <li><strong>Ownership:</strong> driving problems to done, reducing risk, and raising flags early.</li>
        <li><strong>Growth mindset:</strong> seeking feedback, learning fast, improving the system—not just the code.</li>
        <li><strong>Leadership potential:</strong> mentoring, multiplying others, setting quality bars.</li>
        <li><strong>Integrity & judgment:</strong> principled calls under ambiguity and pressure.</li>
      </ul>

      <h2>What great answers look like (the 4 S’s)</h2>
      <ol>
        <li><strong>Specific:</strong> real event, real constraints, real numbers.</li>
        <li><strong>Structured:</strong> use <em>STAR</em> — Situation → Task → Action → Result.</li>
        <li><strong>Situational awareness:</strong> name the trade-offs you considered and why you chose one.</li>
        <li><strong>Self-reflection:</strong> what you learned and how you changed your approach afterward.</li>
      </ol>

      <h2>Build a high-signal story bank</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ul>
          <li>Performance win (Core Web Vitals, bundle cuts)</li>
          <li>Accessibility push (WCAG fixes, audits)</li>
          <li>Design trade-off (UX vs. latency)</li>
          <li>Incident/rollback & root cause</li>
        </ul>
        <ul>
          <li>Disagreement and alignment with a peer</li>
          <li>Cross-team delivery under a deadline</li>
          <li>Mentoring/junior growth moment</li>
          <li>Ambiguous project you shaped</li>
        </ul>
      </div>
      <p class="mt-4"><strong>Quantify impact:</strong> users affected, % faster, errors reduced, dollars saved, support tickets down, etc.</p>

      <h2>Reusable answer template</h2>
      <table class="table-auto border border-neutral-700 mt-4 w-full">
        <thead>
          <tr>
            <th class="px-2 py-1 text-left">Step</th>
            <th class="px-2 py-1 text-left">What to cover</th>
            <th class="px-2 py-1 text-left">Tips</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>S → Situation</strong></td>
            <td>Context in one sentence (product, users, constraint).</td>
            <td>Anchor the story quickly; avoid long setup.</td>
          </tr>
          <tr>
            <td><strong>T → Task</strong></td>
            <td>Your responsibility and the success metric.</td>
            <td>Clarify scope: what were you expected to deliver?</td>
          </tr>
          <tr>
            <td><strong>A → Action</strong></td>
            <td>3–5 key actions (decisions, trade-offs, collaboration).</td>
            <td>Highlight reasoning and teamwork, not just coding.</td>
          </tr>
          <tr>
            <td><strong>R → Result</strong></td>
            <td>Outcome with numbers + what changed next.</td>
            <td>Quantify: % faster, errors reduced, dollars saved.</td>
          </tr>
          <tr>
            <td><strong>R² → Reflection</strong></td>
            <td>One thing you’d repeat; one you’d do differently.</td>
            <td>Shows growth mindset and self-awareness.</td>
          </tr>
        </tbody>
      </table>

      <h2>The front-end angle</h2>
      <ul>
        <li><strong>Cross-functional by default:</strong> show shared language with design/PM/back-end.</li>
        <li><strong>User impact:</strong> connect code decisions to UX, accessibility, and business metrics.</li>
        <li><strong>Quality at speed:</strong> feature flags, telemetry, a11y checks, and incremental delivery.</li>
      </ul>

      <h2>Common pitfalls (and fixes)</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <div class="p-3 rounded-lg bg-neutral-800 border border-neutral-700">
          <strong>Rambling.</strong>
          <p class="text-sm">Fix: cap each STAR section to 1–2 sentences; keep a clock in mind.</p>
        </div>
        <div class="p-3 rounded-lg bg-neutral-800 border border-neutral-700">
          <strong>Generic claims.</strong>
          <p class="text-sm">Fix: replace adjectives with numbers and artifacts (dashboards, PRs, docs).</p>
        </div>
        <div class="p-3 rounded-lg bg-neutral-800 border border-neutral-700">
          <strong>All “I”, no team.</strong>
          <p class="text-sm">Fix: show how you coordinated and unblocked others.</p>
        </div>
        <div class="p-3 rounded-lg bg-neutral-800 border border-neutral-700">
          <strong>No trade-offs.</strong>
          <p class="text-sm">Fix: state at least two options and why one won.</p>
        </div>
      </div>

      <h2>20-minute tune-up before any interview</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <div class="flex items-start gap-3 p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="h-7 w-7 rounded-full bg-neutral-700 text-center leading-7 font-semibold">1</div>
          <div>
            <div class="font-semibold">Skim the JD</div>
            <p class="text-sm opacity-90">Highlight <strong>3 competencies</strong> likely to be tested.</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="h-7 w-7 rounded-full bg-neutral-700 text-center leading-7 font-semibold">2</div>
          <div>
            <div class="font-semibold">Map stories 1:1</div>
            <p class="text-sm opacity-90">Pick <strong>4 stories</strong> from your bank that cover those competencies.</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="h-7 w-7 rounded-full bg-neutral-700 text-center leading-7 font-semibold">3</div>
          <div>
            <div class="font-semibold">One-line STAR</div>
            <p class="text-sm opacity-90">Draft a <strong>single sentence</strong> STAR for each and say them out loud once.</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="h-7 w-7 rounded-full bg-neutral-700 text-center leading-7 font-semibold">4</div>
          <div>
            <div class="font-semibold">Smart questions</div>
            <p class="text-sm opacity-90">Prepare <strong>2 questions</strong> about practices (delivery, testing, a11y, metrics).</p>
          </div>
        </div>
      </div>

      <h2>Rubric cheat-sheet (what they score)</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="font-semibold">Clarity</div>
          <p class="text-sm opacity-90">Crisp STAR, no jargon dump; 60–90s per story.</p>
        </div>
        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="font-semibold">Impact</div>
          <p class="text-sm opacity-90">Numbers & outcomes: % faster, errors down, users helped.</p>
        </div>
        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="font-semibold">Judgment</div>
          <p class="text-sm opacity-90">Explicit trade-offs, risk thinking, why this over that.</p>
        </div>
        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="font-semibold">Collaboration</div>
          <p class="text-sm opacity-90">Stakeholder alignment, unblocking others, shared wins.</p>
        </div>
        <div class="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="font-semibold">Growth</div>
          <p class="text-sm opacity-90">Reflection: one thing you’d repeat, one you’d change.</p>
        </div>
      </div>
    </fa-guide-shell>
  `,
})
export class BehavioralIntroArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
}
