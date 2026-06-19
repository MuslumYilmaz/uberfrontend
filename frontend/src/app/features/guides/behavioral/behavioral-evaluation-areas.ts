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
      title="Frontend Behavioral Interview Scorecard: 6 Signals"
      [minutes]="14"
      [tags]="['behavioral','scorecard','signals']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav"
      [readerPromise]="readerPromise || undefined">

      <p>
        Behavioral interviews are scored against repeatable signals, not just whether the story sounds polished.
        Interviewers listen for evidence of <strong>communication, collaboration, ownership, judgment, growth,
        and leadership</strong>, then use those notes in debrief to decide whether your examples reduce or increase
        hiring risk.
      </p>
      <p>
        The six scorecard signals are communication, collaboration, ownership, judgment, growth, and leadership/seniority.
      </p>

      <h2>What do behavioral interviewers evaluate?</h2>
      <p>
        A strong behavioral answer gives the interviewer quotable evidence: what changed, what you owned, who you
        aligned, which trade-off mattered, and what improved afterward. For frontend roles, the strongest evidence
        usually comes from user-visible work: performance regressions, accessibility blockers, API contract conflicts,
        ambiguous product scope, production rollbacks, and review or release process improvements.
      </p>
      <p>
        Use this frontend behavioral interview scorecard before practicing <a routerLink="/guides/behavioral/intro">frontend behavioral interview questions</a>.
        It helps you choose stories that map to the signals hiring teams actually compare.
      </p>

      <h2>Frontend behavioral interview scorecard signals</h2>
      <table class="table-auto border border-neutral-700 mt-3 w-full">
        <thead>
          <tr>
            <th class="px-2 py-1 text-left">Signal</th>
            <th class="px-2 py-1 text-left">What interviewers listen for</th>
            <th class="px-2 py-1 text-left">Weak evidence</th>
            <th class="px-2 py-1 text-left">Strong evidence</th>
            <th class="px-2 py-1 text-left">Frontend example</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Communication</td>
            <td>Can teammates follow your context, decision, and trade-off quickly?</td>
            <td>Long setup, jargon, unclear role, or no explicit decision.</td>
            <td>Short context, named options, crisp rationale, and audience-aware explanation.</td>
            <td>Explaining a bundle regression to PM and design without drowning them in tooling details.</td>
          </tr>
          <tr>
            <td>Collaboration</td>
            <td>Can you disagree, align, and preserve trust across functions?</td>
            <td>Partners are framed as blockers or conflict is avoided until late.</td>
            <td>You surface constraints, invite input, document the decision, and keep momentum.</td>
            <td>Resolving a design disagreement by tying the decision to accessibility and user impact.</td>
          </tr>
          <tr>
            <td>Ownership</td>
            <td>Do you drive risk and follow-through beyond the narrow task?</td>
            <td>You only completed assigned tickets or waited for someone else to own the gap.</td>
            <td>You found the risk, named the owner, coordinated the fix, and measured the outcome.</td>
            <td>Catching an API fallback gap before launch and aligning backend, QA, and support.</td>
          </tr>
          <tr>
            <td>Judgment</td>
            <td>Can you make practical trade-offs under time, quality, and user constraints?</td>
            <td>You chose the fastest path without naming user or reliability impact.</td>
            <td>You explain alternatives, risk controls, and what stayed non-negotiable.</td>
            <td>Shipping behind a feature flag while preserving accessibility and rollback coverage.</td>
          </tr>
          <tr>
            <td>Growth</td>
            <td>Do mistakes and feedback change future behavior?</td>
            <td>You learned a lesson but changed no habit, guardrail, or system.</td>
            <td>You name the miss, own your part, and show the prevention step that followed.</td>
            <td>After a production rollback, adding monitoring, release checks, and a clearer incident template.</td>
          </tr>
          <tr>
            <td>Leadership / seniority</td>
            <td>Do you create leverage for people beyond your own task list?</td>
            <td>You helped once but the team remained dependent on you.</td>
            <td>You improved a process, mentored others, or created a reusable decision pattern.</td>
            <td>Turning a hard PR review into a team checklist for forms, loading states, and errors.</td>
          </tr>
        </tbody>
      </table>

      <h2>Weak vs strong behavioral interview signals</h2>
      <p>
        Weak evidence describes intent or effort. Strong evidence makes the interviewer&apos;s scorecard easy to fill in:
        the decision you made, the people you aligned, the user or business risk you reduced, the metric that moved,
        and the system you changed so the issue was less likely to repeat.
      </p>

      <h2>Seniority signals for frontend engineers</h2>
      <table class="table-auto border border-neutral-700 mt-3 w-full">
        <thead>
          <tr>
            <th class="px-2 py-1 text-left">Level</th>
            <th class="px-2 py-1 text-left">What strong evidence sounds like</th>
            <th class="px-2 py-1 text-left">Frontend proof point</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Junior</td>
            <td>Clear task ownership, asks for context early, communicates blockers, and learns from review.</td>
            <td>Fixing a component bug, explaining the trade-off, and adding the missing regression test.</td>
          </tr>
          <tr>
            <td>Mid</td>
            <td>Owns a feature or project slice across design, backend, QA, and release details.</td>
            <td>Driving a checkout UI change through API alignment, empty states, analytics, and rollout.</td>
          </tr>
          <tr>
            <td>Senior</td>
            <td>Manages cross-functional risk, mentors others, and improves how the team ships.</td>
            <td>Recovering from a performance regression and adding bundle budgets, dashboards, and review habits.</td>
          </tr>
          <tr>
            <td>Staff</td>
            <td>Creates org-level leverage, repeatable systems, broad alignment, and clearer technical direction.</td>
            <td>Standardizing accessibility gates or release guardrails across multiple product teams.</td>
          </tr>
        </tbody>
      </table>

      <h2>Prompt-to-signal mapping</h2>
      <table class="table-auto border border-neutral-700 mt-3 w-full">
        <thead>
          <tr>
            <th class="px-2 py-1 text-left">Prompt type</th>
            <th class="px-2 py-1 text-left">Primary signals</th>
            <th class="px-2 py-1 text-left">What to prove</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Conflict or disagreement</td>
            <td>Collaboration, communication, judgment</td>
            <td>You made constraints visible, disagreed respectfully, and found a decision the team could execute.</td>
          </tr>
          <tr>
            <td>Incident or rollback</td>
            <td>Ownership, growth, risk thinking</td>
            <td>You reduced blast radius, communicated clearly, and changed monitoring, tests, or release process.</td>
          </tr>
          <tr>
            <td>Ambiguity</td>
            <td>Ownership, seniority, communication</td>
            <td>You turned vague scope into milestones, risks, success criteria, and a thin first release.</td>
          </tr>
          <tr>
            <td>Feedback or failure</td>
            <td>Growth, self-awareness, judgment</td>
            <td>You accepted the feedback, changed behavior, and can point to better outcomes afterward.</td>
          </tr>
          <tr>
            <td>Mentoring or process improvement</td>
            <td>Leadership, leverage, collaboration</td>
            <td>You helped others make better decisions without becoming the bottleneck.</td>
          </tr>
        </tbody>
      </table>

      <h2>Frontend stories that score well</h2>
      <ul>
        <li><strong>Frontend performance behavioral interview story:</strong> shows ownership, judgment, communication, and prevention if you quantify the impact and follow-up guardrail.</li>
        <li><strong>Accessibility behavioral interview example:</strong> shows user judgment, collaboration with design, and willingness to hold a quality bar.</li>
        <li><strong>Design disagreement behavioral interview frontend example:</strong> shows collaboration when you connect preference debates to usability, constraints, and evidence.</li>
        <li><strong>API contract conflict behavioral interview example:</strong> shows cross-functional communication, release planning, and risk ownership.</li>
        <li><strong>Production incident behavioral interview example:</strong> shows incident ownership, calm communication, growth, and better release controls.</li>
        <li><strong>Mentoring or review process:</strong> shows leadership by turning one-off feedback into reusable team practice.</li>
      </ul>

      <h2>How to use this frontend behavioral interview scorecard</h2>
      <ol>
        <li><strong>Pick six stories:</strong> choose examples that cover the signals instead of repeating the same ownership story.</li>
        <li><strong>Tag each story:</strong> mark the two strongest signals and one possible follow-up risk.</li>
        <li><strong>Upgrade weak evidence:</strong> add the trade-off, stakeholder path, metric, or prevention step that makes the signal clear.</li>
        <li><strong>Practice debrief language:</strong> close with one sentence the interviewer can repeat: result, signal, and lesson.</li>
      </ol>

      <h2>Where to go next</h2>
      <p>
        Start with the <a routerLink="/guides/behavioral/big-picture">frontend behavioral interview process</a>,
        use this scorecard to select stories, then build a
        <a routerLink="/guides/behavioral/prep">behavioral interview prep plan</a>,
        shape <a routerLink="/guides/behavioral/stories">STAR stories</a>, and practice
        <a routerLink="/guides/behavioral/fe-advanced">frontend behavioral interview scenarios</a>.
      </p>

      <blockquote>
        The highest scores go to candidates who make the interviewer&apos;s debrief note easy to write:
        clear signal, concrete action, measurable result, and changed behavior.
      </blockquote>
    </fa-guide-shell>
  `,
})
export class BehavioralEvaluationAreasArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
  @Input() readerPromise: string | null = null;
}
