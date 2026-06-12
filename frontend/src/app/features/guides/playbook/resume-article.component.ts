import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [GuideShellComponent, RouterModule],
  styles: [`
    :host {
      display: block;
    }

    a {
      color: var(--uf-link, #7cc2ff);
      text-decoration: none;
      border-bottom: 1px dotted transparent;
      transition: color .15s ease, border-color .15s ease;
    }

    a:hover {
      color: var(--uf-link-hover, #a9dbff);
      border-color: currentColor;
    }

    .freshness {
      display: inline-flex;
      flex-wrap: wrap;
      gap: .45rem;
      align-items: center;
      margin: .3rem 0 1rem;
      padding: .45rem .65rem;
      border: 1px solid rgba(255, 255, 255, .12);
      border-radius: 8px;
      color: var(--uf-text-muted, #aeb7c7);
      background: rgba(255, 255, 255, .04);
      font-size: .9rem;
    }

    .proof-band {
      margin: 1.25rem 0 1.8rem;
      padding: 1rem;
      border: 1px solid rgba(255, 255, 255, .12);
      border-radius: 8px;
      background: linear-gradient(180deg, rgba(124, 194, 255, .1), rgba(255, 255, 255, .03));
    }

    .proof-grid,
    .topic-grid,
    .section-grid,
    .ats-grid,
    .role-grid,
    .metric-grid,
    .trigger-grid,
    .loop-grid,
    .next-grid {
      display: grid;
      gap: .85rem;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    }

    .proof-grid {
      margin-bottom: .9rem;
    }

    .proof-stat,
    .topic-card,
    .section-card,
    .ats-card,
    .role-card,
    .metric-card,
    .trigger-card,
    .loop-card,
    .next-link {
      min-width: 0;
      padding: .9rem;
      border: 1px solid rgba(255, 255, 255, .1);
      border-radius: 8px;
      background: rgba(255, 255, 255, .04);
    }

    .proof-stat strong {
      display: block;
      color: var(--uf-text-primary, #f5f7fb);
      font-size: 1.15rem;
      line-height: 1.2;
    }

    .proof-stat span,
    .label {
      color: var(--uf-text-muted, #aeb7c7);
      font-size: .86rem;
    }

    .proof-actions {
      display: flex;
      flex-wrap: wrap;
      gap: .65rem;
    }

    .proof-cta {
      display: inline-flex;
      align-items: center;
      min-height: 2.25rem;
      padding: .45rem .75rem;
      border: 1px solid rgba(124, 194, 255, .35);
      border-radius: 8px;
      background: rgba(124, 194, 255, .08);
      font-weight: 600;
    }

    .proof-cta--primary {
      color: #071018;
      background: #9bd3ff;
      border-color: #9bd3ff;
    }

    h2 {
      margin-top: 2rem;
    }

    h3 {
      margin: 0 0 .45rem;
      font-size: 1rem;
      line-height: 1.35;
    }

    p {
      line-height: 1.7;
    }

    .check-list,
    .compact-list {
      margin: .35rem 0 0;
      padding-left: 1.1rem;
    }

    .check-list li,
    .compact-list li {
      margin: .35rem 0;
    }

    .rewrite-list {
      display: grid;
      gap: .85rem;
      margin: 1rem 0;
    }

    .rewrite-card {
      padding: .95rem;
      border: 1px solid rgba(255, 255, 255, .1);
      border-radius: 8px;
      background: rgba(255, 255, 255, .04);
    }

    .rewrite-card h3 {
      display: flex;
      flex-wrap: wrap;
      gap: .45rem;
      align-items: baseline;
    }

    .rewrite-card dl {
      display: grid;
      gap: .65rem;
      margin: .7rem 0 0;
    }

    .rewrite-card dt {
      color: var(--uf-text-muted, #aeb7c7);
      font-size: .82rem;
      font-weight: 700;
      letter-spacing: .02em;
      text-transform: uppercase;
    }

    .rewrite-card dd {
      margin: .15rem 0 0;
      line-height: 1.6;
    }

    .table-scroll {
      overflow-x: auto;
      margin: .8rem 0 1rem;
      border: 1px solid rgba(255, 255, 255, .1);
      border-radius: 8px;
    }

    table {
      width: 100%;
      min-width: 640px;
      border-collapse: collapse;
      background: rgba(255, 255, 255, .03);
    }

    th,
    td {
      padding: .7rem;
      border-top: 1px solid rgba(255, 255, 255, .08);
      text-align: left;
      vertical-align: top;
    }

    th {
      color: var(--uf-text-primary, #f5f7fb);
      background: rgba(255, 255, 255, .05);
    }
  `],
  template: `
  <fa-guide-shell
    title="Frontend Resume for Interviews: What Gets Calls and What Gets Rejected"
    subtitle="Build a frontend resume that gets interviews, survives the 30-second skim, maps to ATS keywords, and gives interviewers better stories to ask about."
    [minutes]="18"
    [tags]="['resume','career','frontend']"
    [prev]="prev"
    [next]="next"
    [leftNav]="leftNav"
    [readerPromise]="readerPromise || undefined"
  >
    <div class="freshness" data-testid="resume-guide-freshness">
      Last updated: June 2026 | Author: FrontendAtlas Team | Reviewed by FrontendAtlas
    </div>

    <p>
      This frontend resume for interviews is not a generic resume builder. It is a
      callback-focused playbook for building a frontend resume that gets interviews
      and showing the work frontend teams actually screen for:
      shipped UI, measurable product impact, performance, accessibility, testing,
      architecture, and collaboration.
    </p>
    <p>
      The goal is to make your frontend interview resume pass the first skim,
      match the role without keyword stuffing, and create interview follow-ups
      you can defend in coding, UI, system design, framework, and behavioral
      rounds. It also gives you front-end developer resume language without
      turning the page into a template download.
    </p>

    <div class="proof-band" data-testid="resume-guide-proof">
      <div class="proof-grid" aria-label="Frontend resume proof points">
        <div class="proof-stat">
          <strong>30 sec</strong>
          <span>skim test</span>
        </div>
        <div class="proof-stat">
          <strong>ATS</strong>
          <span>keyword map</span>
        </div>
        <div class="proof-stat">
          <strong>12</strong>
          <span>bullet rewrites</span>
        </div>
        <div class="proof-stat">
          <strong>3</strong>
          <span>role-level examples</span>
        </div>
      </div>
      <div class="proof-actions" aria-label="Frontend resume next actions">
        <a class="proof-cta proof-cta--primary" [routerLink]="['/guides','interview-blueprint','coding-interviews']">
          Map bullets to coding prep
        </a>
        <a class="proof-cta" [routerLink]="['/guides','interview-blueprint','system-design']">
          Build system design stories
        </a>
        <a class="proof-cta" [routerLink]="['/guides','interview-blueprint','quiz']">
          Check fundamentals
        </a>
      </div>
    </div>

    <h2 id="what-frontend-resume-screens-test">What frontend resume screens test</h2>
    <p>
      Resume screens are a fast proxy for risk. Recruiters look for role fit and
      keywords. Hiring managers look for scope, signal, and whether your bullets
      sound like work you can explain under pressure.
    </p>
    <div class="topic-grid">
      <div class="topic-card">
        <h3>Can you ship user-facing UI?</h3>
        <p>Name the product surface, user group, and outcome instead of only naming a component.</p>
      </div>
      <div class="topic-card">
        <h3>Can you improve quality?</h3>
        <p>Performance, accessibility, test coverage, incident reduction, and fewer regressions are strong signals.</p>
      </div>
      <div class="topic-card">
        <h3>Can you collaborate?</h3>
        <p>Frontend work crosses design, backend, product, QA, data, and support. Show the handoff.</p>
      </div>
      <div class="topic-card">
        <h3>Can you defend the story?</h3>
        <p>Every strong bullet should lead naturally into a technical or behavioral interview answer.</p>
      </div>
    </div>

    <h2 id="30-second-recruiter-skim-test">30-second recruiter skim test</h2>
    <p>
      Run this 30-second recruiter skim test before applying. If a stranger cannot
      identify your level, stack, strongest frontend impact, and fit for the role
      in half a minute, rewrite the top third of the resume.
    </p>
    <div class="section-grid" data-testid="resume-skim-test">
      <div class="section-card">
        <h3>Top third</h3>
        <p>Title, location or remote preference, GitHub or portfolio, and a 2-line summary with stack plus outcome.</p>
      </div>
      <div class="section-card">
        <h3>First role</h3>
        <p>The first bullet should show product scope, technical ownership, and one metric.</p>
      </div>
      <div class="section-card">
        <h3>Skills section</h3>
        <p>Group skills so React, TypeScript, testing, performance, accessibility, and API work are easy to scan.</p>
      </div>
      <div class="section-card">
        <h3>Interview hook</h3>
        <p>At least three bullets should invite deeper questions you are ready to answer.</p>
      </div>
    </div>

    <h2 id="frontend-resume-sections-that-get-interviews">Frontend resume sections that get interviews</h2>
    <div class="table-scroll" data-testid="resume-section-table">
      <table>
        <thead>
          <tr>
            <th>Section</th>
            <th>What to include</th>
            <th>What gets rejected</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Header</td>
            <td>Name, email, LinkedIn, GitHub, portfolio, role title.</td>
            <td>Full address, broken links, vague title, missing portfolio for project-heavy candidates.</td>
          </tr>
          <tr>
            <td>Summary</td>
            <td>2-3 lines: level, stack, product domain, strongest measurable frontend outcome.</td>
            <td>Generic "passionate developer" language with no stack or impact.</td>
          </tr>
          <tr>
            <td>Experience</td>
            <td>3-5 bullets per role using action, frontend surface, tech, measurable outcome.</td>
            <td>Task lists, internal acronyms, or bullets that cannot be discussed in an interview.</td>
          </tr>
          <tr>
            <td>Skills</td>
            <td>Grouped frontend resume ATS keywords backed by experience bullets.</td>
            <td>Long tool dumps with no proof in the work history.</td>
          </tr>
          <tr>
            <td>Projects</td>
            <td>For junior or switching candidates: shipped UI, live demo, GitHub, tests, constraints.</td>
            <td>Course clones with no decision-making, metrics, or code quality signal.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2 id="frontend-developer-resume-ats-keywords">Frontend developer resume ATS keywords</h2>
    <p>
      Use this frontend developer resume ATS keywords map to mirror the job
      description without stuffing. Treat front end developer resume keywords
      and frontend resume skills as evidence labels: every keyword you include
      should have proof in a project, bullet, or interview story.
    </p>
    <div class="ats-grid" data-testid="resume-ats-keyword-map">
      <div class="ats-card">
        <h3>Frameworks</h3>
        <p>React, Angular, Vue, Next.js.</p>
      </div>
      <div class="ats-card">
        <h3>Core</h3>
        <p>TypeScript, JavaScript, HTML, CSS.</p>
      </div>
      <div class="ats-card">
        <h3>Quality</h3>
        <p>Jest, Cypress, Playwright, accessibility, WCAG.</p>
      </div>
      <div class="ats-card">
        <h3>Performance</h3>
        <p>Core Web Vitals, LCP, bundle size, lazy loading.</p>
      </div>
      <div class="ats-card">
        <h3>Architecture</h3>
        <p>Design systems, component libraries, state management, API integration.</p>
      </div>
    </div>

    <h2 id="before-after-frontend-resume-bullet-rewrites">Before/after frontend resume bullet rewrites</h2>
    <p>
      Use these frontend resume bullet rewrites as patterns. The stronger version
      names the frontend surface, action, technical lever, and outcome, so the
      page reads like front end developer resume bullet examples instead of a
      list of responsibilities.
    </p>
    <div class="rewrite-list" data-testid="resume-bullet-rewrites">
      <div class="rewrite-card" id="rewrite-performance">
        <h3><span class="label">Performance</span> Core Web Vitals</h3>
        <dl>
          <div>
            <dt>Before</dt>
            <dd>Improved app performance.</dd>
          </div>
          <div>
            <dt>After</dt>
            <dd>Reduced LCP from 4.8s to 2.1s by splitting route bundles, deferring noncritical scripts, and measuring Core Web Vitals after release.</dd>
          </div>
        </dl>
      </div>
      <div class="rewrite-card" id="rewrite-accessibility">
        <h3><span class="label">Accessibility</span> WCAG and keyboard support</h3>
        <dl>
          <div>
            <dt>Before</dt>
            <dd>Worked on accessibility fixes.</dd>
          </div>
          <div>
            <dt>After</dt>
            <dd>Upgraded checkout keyboard navigation and form announcements to WCAG AA, reducing blocked support tickets from screen reader users.</dd>
          </div>
        </dl>
      </div>
      <div class="rewrite-card" id="rewrite-design-system">
        <h3><span class="label">Design system</span> Component reuse</h3>
        <dl>
          <div>
            <dt>Before</dt>
            <dd>Maintained shared UI components.</dd>
          </div>
          <div>
            <dt>After</dt>
            <dd>Shipped a Storybook-backed component library used by 5 product teams, cutting duplicate UI implementations by 45%.</dd>
          </div>
        </dl>
      </div>
      <div class="rewrite-card" id="rewrite-testing">
        <h3><span class="label">Testing</span> Regression coverage</h3>
        <dl>
          <div>
            <dt>Before</dt>
            <dd>Added tests for React components.</dd>
          </div>
          <div>
            <dt>After</dt>
            <dd>Added Jest and Playwright coverage for checkout, search, and auth flows, reducing escaped UI regressions by 32% over two releases.</dd>
          </div>
        </dl>
      </div>
      <div class="rewrite-card" id="rewrite-migration">
        <h3><span class="label">Migration</span> Legacy modernization</h3>
        <dl>
          <div>
            <dt>Before</dt>
            <dd>Migrated old JavaScript code.</dd>
          </div>
          <div>
            <dt>After</dt>
            <dd>Migrated a legacy dashboard from jQuery to React and TypeScript while preserving feature parity for 18k weekly active users.</dd>
          </div>
        </dl>
      </div>
      <div class="rewrite-card" id="rewrite-api-integration">
        <h3><span class="label">API integration</span> UI reliability</h3>
        <dl>
          <div>
            <dt>Before</dt>
            <dd>Integrated frontend with backend APIs.</dd>
          </div>
          <div>
            <dt>After</dt>
            <dd>Built typed REST and GraphQL client boundaries with retry, empty, and error states, lowering unresolved data-loading bugs by 28%.</dd>
          </div>
        </dl>
      </div>
      <div class="rewrite-card" id="rewrite-checkout">
        <h3><span class="label">Checkout</span> Conversion flow</h3>
        <dl>
          <div>
            <dt>Before</dt>
            <dd>Built checkout screens.</dd>
          </div>
          <div>
            <dt>After</dt>
            <dd>Rebuilt checkout step validation and payment error handling, increasing completion rate by 9% across mobile users.</dd>
          </div>
        </dl>
      </div>
      <div class="rewrite-card" id="rewrite-dashboard">
        <h3><span class="label">Dashboard</span> Data-heavy UI</h3>
        <dl>
          <div>
            <dt>Before</dt>
            <dd>Created dashboard pages.</dd>
          </div>
          <div>
            <dt>After</dt>
            <dd>Delivered a role-based analytics dashboard with virtualized tables and saved filters, reducing analyst lookup time by 35%.</dd>
          </div>
        </dl>
      </div>
      <div class="rewrite-card" id="rewrite-search-autocomplete">
        <h3><span class="label">Search/autocomplete</span> Async UX</h3>
        <dl>
          <div>
            <dt>Before</dt>
            <dd>Implemented search autocomplete.</dd>
          </div>
          <div>
            <dt>After</dt>
            <dd>Built debounced autocomplete with cached suggestions, keyboard navigation, and stale response guards, improving search-to-result speed by 22%.</dd>
          </div>
        </dl>
      </div>
      <div class="rewrite-card" id="rewrite-analytics">
        <h3><span class="label">Analytics</span> Product insight</h3>
        <dl>
          <div>
            <dt>Before</dt>
            <dd>Added analytics tracking.</dd>
          </div>
          <div>
            <dt>After</dt>
            <dd>Instrumented onboarding events and funnel dashboards, exposing a form abandonment issue that led to a 14% activation lift.</dd>
          </div>
        </dl>
      </div>
      <div class="rewrite-card" id="rewrite-incident-reduction">
        <h3><span class="label">Incident reduction</span> Reliability</h3>
        <dl>
          <div>
            <dt>Before</dt>
            <dd>Fixed production bugs.</dd>
          </div>
          <div>
            <dt>After</dt>
            <dd>Resolved race conditions in client state and added monitoring for failed mutations, reducing weekly UI incidents from 7 to 2.</dd>
          </div>
        </dl>
      </div>
      <div class="rewrite-card" id="rewrite-team-enablement">
        <h3><span class="label">Team enablement</span> Developer velocity</h3>
        <dl>
          <div>
            <dt>Before</dt>
            <dd>Helped other developers with frontend work.</dd>
          </div>
          <div>
            <dt>After</dt>
            <dd>Documented frontend patterns and mentored 6 engineers on component testing, cutting review churn for UI PRs by 30%.</dd>
          </div>
        </dl>
      </div>
    </div>

    <h2 id="junior-mid-level-and-senior-frontend-resume-examples">Junior, mid-level, and senior frontend resume examples</h2>
    <p>
      Use these front end developer resume examples to decide whether your
      entry level front end developer resume, junior frontend developer resume,
      mid-level frontend resume, frontend engineer resume, or senior frontend
      developer resume should lead with projects, shipped ownership, or
      cross-team technical leverage.
    </p>
    <div class="role-grid" data-testid="resume-role-examples">
      <div class="role-card">
        <h3>Junior frontend developer resume</h3>
        <p>Lead with projects, GitHub, internships, coursework, tests, accessibility decisions, and clear constraints.</p>
        <p><strong>Example:</strong> Built a React search app with debouncing, empty states, keyboard selection, and Playwright tests.</p>
      </div>
      <div class="role-card">
        <h3>Mid-level frontend developer resume</h3>
        <p>Lead with shipped features, ownership, measurable product impact, and collaboration with design and backend.</p>
        <p><strong>Example:</strong> Owned dashboard redesign from API contract to release, improving task completion by 18%.</p>
      </div>
      <div class="role-card">
        <h3>Senior frontend developer resume</h3>
        <p>Lead with architecture, design systems, cross-team leverage, mentoring, reliability, and technical trade-offs.</p>
        <p><strong>Example:</strong> Drove design system adoption across 4 teams and reduced duplicate component work by 50%.</p>
      </div>
    </div>
    <p>
      Stack-specific searches matter too. Treat a react developer resume, Angular
      developer resume, or Vue developer resume as a frontend resume variant:
      lead with the stack only when the job description and your strongest proof
      both support it.
    </p>

    <h2 id="frontend-impact-metrics-library">Frontend impact metrics library</h2>
    <p>
      Metrics make frontend impact credible. Use real numbers where possible,
      and keep estimates honest when a metric is directional.
    </p>
    <div class="metric-grid" data-testid="resume-metrics-library">
      <div class="metric-card">
        <h3>Performance</h3>
        <p>LCP, INP, CLS, bundle size, time to interactive, route load time.</p>
      </div>
      <div class="metric-card">
        <h3>Product</h3>
        <p>Conversion, activation, retention, task completion, bounce rate, support tickets.</p>
      </div>
      <div class="metric-card">
        <h3>Quality</h3>
        <p>Escaped regressions, test coverage, incident count, error rate, rollback rate.</p>
      </div>
      <div class="metric-card">
        <h3>Team leverage</h3>
        <p>Onboarding time, reusable components, review churn, duplicate CSS, release frequency.</p>
      </div>
    </div>

    <h2 id="common-rejection-triggers">Common rejection triggers</h2>
    <div class="trigger-grid" data-testid="resume-rejection-triggers">
      <div class="trigger-card">
        <h3>Task-only bullets</h3>
        <p>Replace "worked on" with the surface, action, constraint, and measurable result.</p>
      </div>
      <div class="trigger-card">
        <h3>Unproven keyword dumps</h3>
        <p>Every major keyword should appear again in a bullet, project, or interview story.</p>
      </div>
      <div class="trigger-card">
        <h3>No frontend-specific signal</h3>
        <p>Generic software bullets lose to performance, accessibility, UI state, API, and design system proof.</p>
      </div>
      <div class="trigger-card">
        <h3>Broken interview handoff</h3>
        <p>If you cannot explain a bullet in detail, rewrite it before it creates risk in the interview loop.</p>
      </div>
    </div>

    <h2 id="resume-to-interview-loop-map">Resume to interview loop map</h2>
    <p>
      A strong resume should point toward the rounds you want to pass. Use this
      map to decide which bullets deserve the top of the page.
    </p>
    <div class="loop-grid" data-testid="resume-interview-loop-map">
      <div class="loop-card">
        <h3>Coding interview</h3>
        <p>Testing, state updates, async UI, data transforms, and typed utilities.</p>
        <a [routerLink]="['/guides','interview-blueprint','coding-interviews']">Practice coding interviews</a>
      </div>
      <div class="loop-card">
        <h3>UI interview</h3>
        <p>Accessibility, keyboard support, responsive layout, empty/error/loading states.</p>
        <a [routerLink]="['/react','coding','react-autocomplete-search-starter']">Practice autocomplete UI</a>
      </div>
      <div class="loop-card">
        <h3>System design</h3>
        <p>Design systems, component boundaries, data fetching, cache policy, performance.</p>
        <a [routerLink]="['/guides','interview-blueprint','system-design']">Review system design framework</a>
      </div>
      <div class="loop-card">
        <h3>Behavioral</h3>
        <p>Ownership, trade-offs, conflict, incident handling, mentoring, and cross-team leverage.</p>
        <a [routerLink]="['/guides','system-design-blueprint','radio-framework']">Structure technical stories</a>
      </div>
      <div class="loop-card">
        <h3>Framework rounds</h3>
        <p>React, Angular, Vue, state management, rendering model, and performance decisions.</p>
        <a [routerLink]="['/system-design','component-design-system-architecture']">Review component architecture</a>
      </div>
      <div class="loop-card">
        <h3>Async product work</h3>
        <p>Search, realtime UI, cancellation, debounce, cache, and failure states.</p>
        <a [routerLink]="['/system-design','realtime-search-debounce-cache']">Review realtime search design</a>
      </div>
    </div>

    <h2 id="faq">FAQ</h2>
    <h3>How do I write a frontend developer resume that gets interviews?</h3>
    <p>
      Write a frontend developer resume that gets interviews by emphasizing
      shipped UI, measurable impact, frontend-specific quality, and stories you
      can explain in coding, UI, system design, and behavioral rounds.
    </p>

    <h3>What front end developer resume examples should I study?</h3>
    <p>
      Study front end developer resume examples that show the level, stack,
      product surface, technical lever, and measurable result in the first few
      bullets instead of listing generic tasks.
    </p>

    <h3>Which frontend developer resume ATS keywords should I include?</h3>
    <p>
      Include role-matched keywords such as React, Angular, Vue, Next.js,
      TypeScript, accessibility, WCAG, Core Web Vitals, testing, state management,
      and API integration when you can prove them.
    </p>

    <h3>What makes frontend resume bullet points stronger?</h3>
    <p>
      Strong frontend resume bullet points name the surface, technical lever,
      scope, and outcome instead of listing generic responsibilities.
    </p>

    <h3>How should a junior frontend developer resume differ from a senior frontend developer resume?</h3>
    <p>
      Junior resumes rely more on projects, GitHub, internships, and coursework.
      Senior resumes need architecture, cross-team leverage, mentoring, reliability,
      and technical decision-making.
    </p>

    <h3>Should I write a React developer resume or a general frontend engineer resume?</h3>
    <p>
      Use a React developer resume angle when the role is explicitly React-heavy.
      Use a broader frontend engineer resume when the job asks for architecture,
      cross-framework judgment, design systems, or platform ownership.
    </p>

    <h2 id="what-to-practice-after-your-resume-gets-callbacks">What to practice after your resume gets callbacks</h2>
    <div class="next-grid" data-testid="resume-next-links">
      <a class="next-link" [routerLink]="['/guides','interview-blueprint','coding-interviews']">
        <strong>Frontend coding interviews</strong>
        <span>Convert resume claims about implementation into timed coding practice.</span>
      </a>
      <a class="next-link" [routerLink]="['/guides','interview-blueprint','quiz']">
        <strong>Fundamentals diagnostic</strong>
        <span>Check browser, CSS, JavaScript, and HTTP answers before phone screens.</span>
      </a>
      <a class="next-link" [routerLink]="['/guides','interview-blueprint','system-design']">
        <strong>System design framework</strong>
        <span>Turn architecture bullets into structured frontend system design answers.</span>
      </a>
      <a class="next-link" [routerLink]="['/system-design','realtime-search-debounce-cache']">
        <strong>Realtime search design</strong>
        <span>Practice the async UI patterns behind autocomplete and search bullets.</span>
      </a>
    </div>
  </fa-guide-shell>
  `
})
export class ResumeArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
  @Input() readerPromise: string | null = null;
}
