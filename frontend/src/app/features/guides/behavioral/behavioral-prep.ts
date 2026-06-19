import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  selector: 'app-behavioral-prep-article',
  imports: [CommonModule, RouterModule, GuideShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fa-guide-shell
      title="Frontend Behavioral Interview Prep Plan: 7 Days, Stories, and STAR(R)"
      [minutes]="18"
      [tags]="['behavioral','prep','stories']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav"
      [readerPromise]="readerPromise || undefined">

      <p>
        Behavioral prep works best when it feels like engineering prep: collect evidence, map it to the
        scorecard, practice the failure modes, and tighten the output. For frontend engineers, the strongest
        stories usually come from visible product risk: performance, accessibility, API contracts, incidents,
        design trade-offs, ambiguous scope, and review or release process improvements.
      </p>

      <h2>Quick answer: how to prepare</h2>
      <p>
        Build a frontend behavioral interview prep plan around seven days of lightweight practice. First collect
        real stories, then map each one to the <a routerLink="/guides/behavioral/evaluation-areas">frontend behavioral interview scorecard</a>.
        Treat it like a software engineer behavioral interview prep plan with a frontend lens: convert the strongest
        examples into STAR(R) notes, quantify impact, practice follow-up questions, prepare final questions for the
        team, and use the night before for a short tune-up instead of a rewrite.
      </p>

      <h2>7-day frontend behavioral interview prep plan</h2>
      <table class="table-auto border border-neutral-700 mt-3 w-full">
        <thead>
          <tr>
            <th class="px-2 py-1 text-left">Day</th>
            <th class="px-2 py-1 text-left">Focus</th>
            <th class="px-2 py-1 text-left">Output</th>
            <th class="px-2 py-1 text-left">Frontend angle</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Collect stories</td>
            <td>List 10 raw moments before polishing them.</td>
            <td>Pull from launches, regressions, incidents, accessibility, API alignment, and mentoring.</td>
          </tr>
          <tr>
            <td>2</td>
            <td>Map signals</td>
            <td>Tag each story with two primary signals and one follow-up risk.</td>
            <td>Use ownership, communication, collaboration, judgment, growth, and leadership/seniority.</td>
          </tr>
          <tr>
            <td>3</td>
            <td>Write STAR(R)</td>
            <td>Create short notes for Situation, Task, Action, Result, and Reflection.</td>
            <td>Keep the action section specific to your frontend decisions and trade-offs.</td>
          </tr>
          <tr>
            <td>4</td>
            <td>Quantify impact</td>
            <td>Add numbers, scope, user impact, or risk reduction to each strong story.</td>
            <td>Use LCP, conversion, incident duration, defect rate, review time, or accessibility coverage.</td>
          </tr>
          <tr>
            <td>5</td>
            <td>Practice follow-ups</td>
            <td>Answer the uncomfortable second question for each story.</td>
            <td>Prepare for "what would you do differently?" and "what was your exact role?"</td>
          </tr>
          <tr>
            <td>6</td>
            <td>Prepare final questions</td>
            <td>Write 3 questions that reveal team quality and role expectations.</td>
            <td>Ask about release risk, design-engineering trade-offs, accessibility, and success metrics.</td>
          </tr>
          <tr>
            <td>7</td>
            <td>Night-before tune-up</td>
            <td>Pick four stories, say them once, and stop editing.</td>
            <td>Bring concise notes, not a memorized script.</td>
          </tr>
        </tbody>
      </table>

      <h2>Build a frontend story bank</h2>
      <p>
        A frontend behavioral story bank is not a list of achievements. It is a reusable set of examples that can
        become STAR stories for frontend engineers across different prompts without sounding rehearsed. Aim for
        7 to 10 stories, then choose the strongest 4 or 5 for the role.
      </p>
      <table class="table-auto border border-neutral-700 mt-3 w-full">
        <thead>
          <tr>
            <th class="px-2 py-1 text-left">Story type</th>
            <th class="px-2 py-1 text-left">Signals it can prove</th>
            <th class="px-2 py-1 text-left">What to capture</th>
            <th class="px-2 py-1 text-left">Follow-up risk</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Performance regression</td>
            <td>Ownership, judgment, communication</td>
            <td>Metric before/after, diagnosis path, rollout, and prevention.</td>
            <td>Can you explain the trade-off without hiding behind tooling?</td>
          </tr>
          <tr>
            <td>Accessibility blocker</td>
            <td>Judgment, collaboration, user focus</td>
            <td>User impact, standard, design constraint, and implementation path.</td>
            <td>Did you partner or just veto the design?</td>
          </tr>
          <tr>
            <td>API contract conflict</td>
            <td>Communication, ownership, release planning</td>
            <td>Schema issue, loading/error states, fallback, and backend alignment.</td>
            <td>Did you clarify the contract early enough?</td>
          </tr>
          <tr>
            <td>Design or product disagreement</td>
            <td>Collaboration, judgment, influence</td>
            <td>Options, evidence, decision owner, and user-facing outcome.</td>
            <td>Can you show respect for product goals?</td>
          </tr>
          <tr>
            <td>Production rollback</td>
            <td>Ownership, growth, risk thinking</td>
            <td>Blast radius, communication, rollback path, and new guardrail.</td>
            <td>Did the same class of issue become less likely?</td>
          </tr>
          <tr>
            <td>Ambiguous scope</td>
            <td>Seniority, communication, ownership</td>
            <td>Unknowns, thin first release, milestones, and success criteria.</td>
            <td>Did you make ambiguity smaller for the team?</td>
          </tr>
          <tr>
            <td>Mentoring or review process</td>
            <td>Leadership, growth, leverage</td>
            <td>Who improved, what changed, and how the team reused it.</td>
            <td>Did you create leverage or just help once?</td>
          </tr>
        </tbody>
      </table>

      <h2>Map prompts to stories</h2>
      <table class="table-auto border border-neutral-700 mt-3 w-full">
        <thead>
          <tr>
            <th class="px-2 py-1 text-left">Prompt</th>
            <th class="px-2 py-1 text-left">Best story type</th>
            <th class="px-2 py-1 text-left">Signal to make obvious</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tell me about a conflict.</td>
            <td>Design disagreement or API contract conflict</td>
            <td>You disagreed clearly, preserved trust, and got to an executable decision.</td>
          </tr>
          <tr>
            <td>Tell me about a failure.</td>
            <td>Production rollback or missed regression</td>
            <td>You owned the miss, reduced damage, and changed the system afterward.</td>
          </tr>
          <tr>
            <td>Tell me about ambiguity.</td>
            <td>Ambiguous PM/design scope</td>
            <td>You turned unknowns into a scoped release and measurable result.</td>
          </tr>
          <tr>
            <td>Tell me about leadership.</td>
            <td>Mentoring or review process</td>
            <td>You helped others make better decisions without becoming the bottleneck.</td>
          </tr>
          <tr>
            <td>Tell me about feedback.</td>
            <td>Review feedback or missed quality bar</td>
            <td>You changed behavior, not just wording.</td>
          </tr>
          <tr>
            <td>Tell me about a tight deadline.</td>
            <td>Feature flag, phased release, or launch risk story</td>
            <td>You protected the right quality bar while making delivery trade-offs explicit.</td>
          </tr>
        </tbody>
      </table>

      <h2>Write STAR(R) notes without scripting</h2>
      <p>
        STAR keeps the answer structured; the extra Reflection makes it stronger for engineering roles because it
        shows how your behavior changed. Write bullets, not paragraphs. The best prep note fits on one small card.
      </p>
      <ul>
        <li><strong>Situation:</strong> one sentence of context, team, product, and why it mattered.</li>
        <li><strong>Task:</strong> the decision or responsibility you personally owned.</li>
        <li><strong>Action:</strong> the specific steps, trade-offs, stakeholders, and engineering decisions.</li>
        <li><strong>Result:</strong> measurable outcome, risk reduction, launch impact, or team improvement.</li>
        <li><strong>Reflection:</strong> what changed in your process, checklist, monitoring, review habit, or judgment.</li>
      </ul>
      <p>
        For more answer shaping, use the <a routerLink="/guides/behavioral/stories">STAR stories guide</a>
        and then practice with <a routerLink="/guides/behavioral/intro">frontend behavioral interview questions</a>.
      </p>

      <h2>Weak vs strong prep notes</h2>
      <table class="table-auto border border-neutral-700 mt-3 w-full">
        <thead>
          <tr>
            <th class="px-2 py-1 text-left">Weak note</th>
            <th class="px-2 py-1 text-left">Interview-ready note</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              "The app was slow, so I optimized it and worked with design. The page got faster and everyone was happy."
            </td>
            <td>
              "Checkout LCP regressed to 6.4s after a reviews widget launch. I owned the investigation, compared bundle
              and render cost, split non-critical content behind lazy loading, aligned design on above-the-fold priority,
              and added a bundle budget. LCP returned under 2.8s and the release checklist caught the next regression."
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Practice follow-ups and mock loops</h2>
      <p>
        Practice is not memorization. Say each story out loud, then force a follow-up that tests ownership, judgment,
        or self-awareness. If you use AI or a mock interviewer, ask for interruptions rather than a polished rewrite.
      </p>
      <ul>
        <li><strong>Ownership check:</strong> "What was your exact role, and what did someone else own?"</li>
        <li><strong>Judgment check:</strong> "What options did you reject, and why?"</li>
        <li><strong>Collaboration check:</strong> "Who disagreed with you, and how did you align?"</li>
        <li><strong>Growth check:</strong> "What changed after this story?"</li>
        <li><strong>Seniority check:</strong> "Would this example be strong enough for the level you want?"</li>
      </ul>

      <h2>Seniority-specific prep</h2>
      <p>
        Senior frontend behavioral interview preparation needs broader proof than a clean task story. Prepare examples
        where you reduced cross-functional risk, changed a team habit, or created a repeatable quality bar.
      </p>
      <table class="table-auto border border-neutral-700 mt-3 w-full">
        <thead>
          <tr>
            <th class="px-2 py-1 text-left">Level</th>
            <th class="px-2 py-1 text-left">Story scope</th>
            <th class="px-2 py-1 text-left">Prep focus</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Junior</td>
            <td>Task-level ownership and clear learning.</td>
            <td>Explain context, ask for help well, and show review feedback changed your habits.</td>
          </tr>
          <tr>
            <td>Mid</td>
            <td>Feature-level ownership across frontend, design, backend, QA, and release.</td>
            <td>Show trade-offs, communication, and measurable delivery outcomes.</td>
          </tr>
          <tr>
            <td>Senior</td>
            <td>Project or team-level risk with cross-functional influence.</td>
            <td>Prepare examples around ambiguity, mentoring, incident prevention, and better systems.</td>
          </tr>
          <tr>
            <td>Staff</td>
            <td>Org-level leverage across multiple teams or standards.</td>
            <td>Show repeatable systems, alignment, and durable improvements beyond one launch.</td>
          </tr>
        </tbody>
      </table>

      <h2>Prepare final questions</h2>
      <p>
        Final questions are still part of the interview signal. Use them to show how you think about team quality,
        delivery, and the role you are entering.
      </p>
      <ul>
        <li>"What frontend quality bar is hardest for this team to maintain right now?"</li>
        <li>"How do product, design, and engineering decide when to trade polish for speed?"</li>
        <li>"What signals would tell you that the person in this role is succeeding after 90 days?"</li>
        <li>"How does the team learn from production regressions or accessibility issues?"</li>
      </ul>

      <h2>30-minute night-before tune-up</h2>
      <ol>
        <li>Skim the job description and highlight three likely signals.</li>
        <li>Pick four stories from your bank: one conflict, one failure, one ambiguity, one leadership or ownership story.</li>
        <li>Read only the STAR(R) bullets and say each answer once in 90 to 120 seconds.</li>
        <li>Check that each story has one metric, one trade-off, and one reflection.</li>
        <li>Review two final questions and stop editing.</li>
      </ol>

      <h2>Where to go next</h2>
      <p>
        Start with the <a routerLink="/guides/behavioral/big-picture">frontend behavioral interview process</a>,
        use the <a routerLink="/guides/behavioral/evaluation-areas">scorecard</a> to choose stories, polish
        <a routerLink="/guides/behavioral/stories">STAR stories</a>, practice
        <a routerLink="/guides/behavioral/fe-advanced">frontend behavioral scenarios</a>, and finish with the
        <a routerLink="/guides/behavioral/checklist">behavioral interview checklist</a>.
      </p>

      <h2>Frontend behavioral interview prep FAQ</h2>
      <dl>
        <dt>How should frontend engineers prepare for behavioral interviews?</dt>
        <dd>Collect frontend-specific stories, map them to scorecard signals, write STAR(R) bullets, quantify impact, practice follow-ups, and prepare final questions.</dd>
        <dt>How many behavioral stories should I prepare?</dt>
        <dd>Prepare 7 to 10 raw stories, then choose 4 or 5 strong examples that match the role and level.</dd>
        <dt>What does STAR(R) mean?</dt>
        <dd>STAR(R) means Situation, Task, Action, Result, and Reflection. The reflection shows what changed after the story.</dd>
      </dl>

      <blockquote>
        The goal is not a perfect script. The goal is a small story system you can adapt under pressure:
        clear context, concrete action, measurable result, and a lesson you actually used.
      </blockquote>
    </fa-guide-shell>
  `,
})
export class BehavioralPrepArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
  @Input() readerPromise: string | null = null;
}
