import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

type RouteLink = {
  label: string;
  route: any[];
  queryParams?: Record<string, string>;
  note: string;
};

type SequenceStep = {
  title: string;
  link: any[];
  note: string;
};

type DrillMapping = {
  type: 'Coding drill' | 'Trivia drill';
  name: string;
  route?: any[];
  queryParams?: Record<string, string>;
  fallback?: string;
};

type HighSignalPattern = {
  name: string;
  what: string;
  why: string;
  example: string;
  drill: DrillMapping;
};

type WorkedExample = {
  topic: string;
  scenario: string;
  wrongApproach: string;
  wrongCode: string;
  correctedApproach: string;
  correctedCode: string;
  interviewerLens: string[];
};

type TeachingSection = {
  heading: string;
  points: string[];
};

type FrameworkPrepConfig = {
  pathLabel: string;
  title: string;
  subtitle: string;
  minutes: number;
  tags: string[];
  outcomes: string[];
  mistakes: string[];
  sequence: SequenceStep[];
  practice: RouteLink[];
  quickStart: RouteLink[];
  teachingSections?: TeachingSection[];
  highSignalPatterns?: HighSignalPattern[];
  workedExample?: WorkedExample;
  readinessChecklist?: string[];
  nextActions?: DrillMapping[];
};

const BLUEPRINT_BASE: SequenceStep[] = [
  {
    title: 'Coding Interviews framework',
    link: ['/', 'guides', 'interview-blueprint', 'coding-interviews'],
    note: 'Use this to structure prompt clarifications, scope, and delivery under time pressure.',
  },
  {
    title: 'JavaScript Interviews patterns',
    link: ['/', 'guides', 'interview-blueprint', 'javascript-interviews'],
    note: 'Build pattern fluency for async, state updates, closures, and event-driven behavior.',
  },
  {
    title: 'UI Interviews execution',
    link: ['/', 'guides', 'interview-blueprint', 'ui-interviews'],
    note: 'Convert requirements into accessible UI with keyboard support and clear interaction states.',
  },
  {
    title: 'System Design answer framework',
    link: ['/', 'guides', 'interview-blueprint', 'system-design'],
    note: 'Cover trade-offs, constraints, and architecture choices in an interview-friendly order.',
  },
];

const PREP_CONFIG: Record<string, FrameworkPrepConfig> = {
  'javascript-prep-path': {
    pathLabel: 'JavaScript prep path',
    title: 'JavaScript Interview Preparation Path: Async, Closures, and State Transitions',
    subtitle:
      'This is interview prep, not generic docs review. Build async control, stale-state awareness, state transition discipline, and cleanup habits that show up repeatedly in frontend interviews.',
    minutes: 9,
    tags: ['javascript', 'interview-prep', 'async', 'state', 'patterns'],
    outcomes: [
      'Explain async flow, event-loop ordering, closures, and stale state using real UI examples instead of theory-only answers.',
      'Implement latest-wins request handling, double-submit prevention, and cancellation/cleanup with predictable behavior.',
      'Model prompt behavior with explicit state transitions so invalid actions and race conditions are handled deliberately.',
      'Translate bugs into trade-off discussions interviewers care about: correctness, UX stability, and maintainability.',
      'Pick the right drill type quickly (coding vs trivia) based on what signal is currently weakest.',
    ],
    mistakes: [
      'Jumping to code before writing state transitions and edge cases (for example, coding submit flows without defining idle/loading/success/error).',
      'Treating async calls as sequential by default (for example, assuming the second request always resolves second).',
      'Using memorized snippets without interviewer-level reasoning about race conditions, stale closures, and cleanup.',
      'Explaining event loop terms without connecting them to concrete UI behavior or user-visible bugs.',
    ],
    sequence: BLUEPRINT_BASE,
    practice: [
      {
        label: 'JavaScript coding questions',
        route: ['/coding'],
        queryParams: { tech: 'javascript', kind: 'coding' },
        note: 'Practice implementation-heavy prompts with interview-style constraints.',
      },
      {
        label: 'JavaScript trivia questions',
        route: ['/coding'],
        queryParams: { tech: 'javascript', kind: 'trivia' },
        note: 'Reinforce explanation quality and quick-answer confidence.',
      },
      {
        label: 'Focus areas for JavaScript prep',
        route: ['/focus-areas'],
        note: 'Pick a weak area and run a targeted mini-sprint.',
      },
    ],
    quickStart: [
      {
        label: 'Step 1: Coding interview framework',
        route: ['/', 'guides', 'interview-blueprint', 'coding-interviews'],
        note: 'Lock interview structure first so every coding answer follows the same high-signal flow.',
      },
      {
        label: 'Step 2: JavaScript interview patterns',
        route: ['/', 'guides', 'interview-blueprint', 'javascript-interviews'],
        note: 'Build confidence on closures, async flow, stale state, and event-driven updates.',
      },
      {
        label: 'Step 3: JavaScript coding drills',
        route: ['/coding'],
        queryParams: { tech: 'javascript', kind: 'coding' },
        note: 'Apply the framework on implementation prompts under interview constraints.',
      },
      {
        label: 'Step 4: JavaScript trivia drills',
        route: ['/coding'],
        queryParams: { tech: 'javascript', kind: 'trivia' },
        note: 'Sharpen concise explanations for follow-up interviewer questions.',
      },
      {
        label: 'Step 5: Return to Interview Blueprint',
        route: ['/', 'guides', 'interview-blueprint'],
        note: 'Choose the next weakest signal area (UI, system design, or behavioral).',
      },
    ],
    teachingSections: [
      {
        heading: 'How interviewers evaluate JavaScript answers',
        points: [
          'They score both implementation correctness and reasoning quality. A working answer with weak trade-off explanation still looks mid-level.',
          'They watch for edge-case discipline: fast input changes, double clicks, delayed responses, retries, and cleanup behavior.',
          'They care about your debugging model: can you explain why a bug happens, not only patch it?',
        ],
      },
      {
        heading: 'Async control under pressure',
        points: [
          'Most JS rounds are hidden async rounds. Even “simple UI” prompts expose race conditions once requests overlap.',
          'Use latest-wins tokens or cancellation and always define what happens when an older response arrives late.',
          'If your async behavior is deterministic, your answer sounds senior immediately.',
        ],
      },
      {
        heading: 'State transitions and edge-case handling',
        points: [
          'Write a tiny state map before coding: idle -> loading -> success/error. This prevents accidental invalid transitions.',
          'Guard actions that should be blocked while loading (double-submit, repeated destructive clicks).',
          'Interviewers prefer simple explicit transitions over hidden booleans spread across handlers.',
        ],
      },
      {
        heading: 'Closures, stale state, and cleanup',
        points: [
          'Stale closures appear when delayed callbacks read outdated values from earlier renders/events.',
          'Cleanup is part of correctness, not polish: clear timers, remove listeners, abort in-flight requests when scope changes.',
          'When you can explain closure bugs with one concrete scenario, interviewer confidence rises quickly.',
        ],
      },
    ],
    highSignalPatterns: [
      {
        name: 'Latest-wins async search',
        what: 'Only the newest request may update UI state.',
        why: 'Interviewers use this to test race-condition control and user-intent alignment.',
        example: 'Typing "rea" then "react" should never show stale "rea" results if that response arrives later.',
        drill: {
          type: 'Coding drill',
          name: 'Debounced Search (Latest Wins)',
          route: ['/coding'],
          queryParams: { tech: 'javascript', kind: 'coding', topic: 'async' },
        },
      },
      {
        name: 'Double-submit prevention',
        what: 'Block or ignore repeated submits while an action is in flight.',
        why: 'Interviewers check state discipline and whether you prevent duplicate side effects.',
        example: 'Checkout submit clicked twice should create one order, not two.',
        drill: {
          type: 'Coding drill',
          name: 'Safe Submit / In-Flight Guard',
          fallback: '(link: TBD)',
        },
      },
      {
        name: 'Stale closure protection',
        what: 'Ensure delayed callbacks use current intent/state, not captured old values.',
        why: 'This distinguishes candidates who understand closure timing in real UIs.',
        example: 'A delayed handler should not apply an old filter after user changed input.',
        drill: {
          type: 'Trivia drill',
          name: 'Stale State Closures',
          route: ['/react/trivia/react-stale-state-closures'],
        },
      },
      {
        name: 'Explicit state transitions',
        what: 'Define legal state flow and guard invalid transitions.',
        why: 'Interviewers want predictable behavior under pressure, not implicit state mutation.',
        example: 'Prevent success -> loading without a new user action.',
        drill: {
          type: 'Coding drill',
          name: 'Async UI State Machine',
          fallback: '(link: TBD)',
        },
      },
      {
        name: 'Cancellation and cleanup',
        what: 'Abort irrelevant work and clean up timers/listeners.',
        why: 'Shows production readiness and avoids memory leaks or ghost updates.',
        example: 'Component teardown should not trigger late setState/render operations.',
        drill: {
          type: 'Coding drill',
          name: 'Timer + Request Cleanup',
          fallback: '(link: TBD)',
        },
      },
      {
        name: 'Event loop ordering reasoning',
        what: 'Reason correctly about microtask/macrotask sequencing.',
        why: 'Tests deep JS model applied to behavior, not memorized definitions.',
        example: 'Promise callback runs before setTimeout(0) continuation.',
        drill: {
          type: 'Trivia drill',
          name: 'Promise vs setTimeout Ordering',
          fallback: '(link: TBD)',
        },
      },
      {
        name: 'Optimistic update + rollback',
        what: 'Apply immediate UI feedback with safe rollback on failure.',
        why: 'Interviewers test trade-off judgment between speed and correctness.',
        example: 'Like button increments instantly and rolls back if API fails.',
        drill: {
          type: 'Coding drill',
          name: 'Optimistic Toggle Recovery',
          fallback: '(link: TBD)',
        },
      },
      {
        name: 'Idempotent handlers',
        what: 'Repeated invocation should not corrupt state or duplicate outcomes.',
        why: 'Signals robust API/UI integration thinking.',
        example: 'Retrying save draft updates once and preserves version integrity.',
        drill: {
          type: 'Trivia drill',
          name: 'Idempotency in Frontend Actions',
          fallback: '(link: TBD)',
        },
      },
      {
        name: 'Derived state discipline',
        what: 'Compute derived values from source state instead of mutating parallel copies.',
        why: 'Interviewers look for maintainability and lower bug surface.',
        example: 'Filtered list derives from items + query, not separately edited arrays.',
        drill: {
          type: 'Coding drill',
          name: 'Derived List State',
          fallback: '(link: TBD)',
        },
      },
      {
        name: 'Boundary-safe normalization',
        what: 'Normalize and validate input before logic branches.',
        why: 'Shows edge-case discipline and consistency under real data.',
        example: 'Trim + lowercase query before caching and comparison.',
        drill: {
          type: 'Trivia drill',
          name: 'Input Normalization Edge Cases',
          fallback: '(link: TBD)',
        },
      },
    ],
    workedExample: {
      topic: 'Stale closure in event handlers',
      scenario:
        'You are implementing typeahead search. User input changes quickly, network is variable, and UI must always reflect latest intent.',
      wrongApproach:
        'Store query globally and schedule delayed fetches without cancellation or latest-wins guard.',
      wrongCode: `let query = '';
let timerId = null;

function onInput(value) {
  query = value;
  timerId = setTimeout(() => {
    fetch('/api/search?q=' + query)
      .then((r) => r.json())
      .then(renderResults);
  }, 300);
}`,
      correctedApproach:
        'Cancel previous timer, normalize input, and gate result application with a sequence token so stale responses are ignored.',
      correctedCode: `let seq = 0;
let timerId = null;

function onInput(value) {
  clearTimeout(timerId);
  const mySeq = ++seq;
  const normalized = value.trim().toLowerCase();

  timerId = setTimeout(async () => {
    const res = await fetch('/api/search?q=' + encodeURIComponent(normalized));
    const data = await res.json();
    if (mySeq !== seq) return;
    renderResults(data);
  }, 300);
}`,
      interviewerLens: [
        'You identified stale closure and race risk before being prompted.',
        'You used deterministic guards instead of hoping request order stays consistent.',
        'You tied implementation to user intent: latest input wins.',
        'You explained trade-offs (debounce delay vs responsiveness) clearly.',
      ],
    },
    readinessChecklist: [
      'I can describe stale closure bugs using a concrete UI scenario.',
      'I can write state transitions before coding (idle/loading/success/error).',
      'I can implement latest-wins request behavior without external libraries.',
      'I can prevent duplicate submits while preserving UX clarity.',
      'I can explain microtask vs macrotask ordering with a real example.',
      'I can add cleanup for timers, listeners, and in-flight requests.',
      'I can discuss optimistic update rollback conditions confidently.',
      'I can name at least two edge cases for each prompt before implementation.',
    ],
    nextActions: [
      {
        type: 'Coding drill',
        name: 'Debounced Search (Latest Wins)',
        route: ['/coding'],
        queryParams: { tech: 'javascript', kind: 'coding', topic: 'async' },
      },
      {
        type: 'Coding drill',
        name: 'Safe Submit / In-Flight Guard',
        fallback: '(link: TBD)',
      },
      {
        type: 'Trivia drill',
        name: 'Stale State Closures',
        route: ['/react/trivia/react-stale-state-closures'],
      },
      {
        type: 'Trivia drill',
        name: 'Promise vs setTimeout Ordering',
        fallback: '(link: TBD)',
      },
      {
        type: 'Coding drill',
        name: 'Async UI State Machine',
        fallback: '(link: TBD)',
      },
      {
        type: 'Coding drill',
        name: 'Timer + Request Cleanup',
        fallback: '(link: TBD)',
      },
      {
        type: 'Coding drill',
        name: 'Optimistic Toggle Recovery',
        fallback: '(link: TBD)',
      },
    ],
  },
  'react-prep-path': {
    pathLabel: 'React prep path',
    title: 'React Interview Preparation Path: Components, State, and Performance',
    subtitle:
      'Prepare for React interview rounds with a clear sequence covering component design, rendering behavior, and state management decisions.',
    minutes: 9,
    tags: ['react', 'interview-prep', 'hooks', 'state', 'performance'],
    outcomes: [
      'Design React components that are testable, accessible, and easy to reason about.',
      'Diagnose rerender issues, stale state, and effect-related bugs quickly.',
      'Communicate performance and state trade-offs in practical interview language.',
    ],
    mistakes: [
      'Overusing effects for derived state instead of declarative data flow.',
      'Ignoring dependency arrays and event ordering in async handlers.',
      'Skipping accessibility and keyboard behavior while building UI quickly.',
    ],
    sequence: BLUEPRINT_BASE,
    practice: [
      {
        label: 'React coding questions',
        route: ['/coding'],
        queryParams: { tech: 'react', kind: 'coding' },
        note: 'Work through component and state-heavy coding prompts.',
      },
      {
        label: 'React trivia questions',
        route: ['/coding'],
        queryParams: { tech: 'react', kind: 'trivia' },
        note: 'Sharpen conceptual answers for strict mode, hooks, and rendering behavior.',
      },
      {
        label: 'Frontend tracks with React coverage',
        route: ['/tracks'],
        note: 'Follow a structured sequence instead of random practice jumps.',
      },
    ],
    quickStart: [
      {
        label: 'Start from Coding interview framework',
        route: ['/', 'guides', 'interview-blueprint', 'coding-interviews'],
        note: 'Use a consistent approach before diving into framework-specific prompts.',
      },
      {
        label: 'Continue with React coding drills',
        route: ['/coding'],
        queryParams: { tech: 'react', kind: 'coding' },
        note: 'Apply component, state, and rerender decisions in timed prompt flows.',
      },
      {
        label: 'Then React trivia drills',
        route: ['/coding'],
        queryParams: { tech: 'react', kind: 'trivia' },
        note: 'Practice concise explanations for hooks, effects, and rendering behavior.',
      },
    ],
  },
  'angular-prep-path': {
    pathLabel: 'Angular prep path',
    title: 'Angular Interview Preparation Path: RxJS, Architecture, and Testing',
    subtitle:
      'Build an Angular interview roadmap focused on reactive patterns, application architecture, and maintainable component APIs.',
    minutes: 9,
    tags: ['angular', 'interview-prep', 'rxjs', 'testing', 'architecture'],
    outcomes: [
      'Handle observable lifecycles and state streams without memory leaks.',
      'Design Angular components and modules with clear separation of concerns.',
      'Answer testing, change detection, and performance questions with concrete examples.',
    ],
    mistakes: [
      'Subscribing everywhere instead of composing observables intentionally.',
      'Mixing presentation logic and side effects in large components.',
      'Skipping testability and cleanup strategy in coding explanations.',
    ],
    sequence: BLUEPRINT_BASE,
    practice: [
      {
        label: 'Angular coding questions',
        route: ['/coding'],
        queryParams: { tech: 'angular', kind: 'coding' },
        note: 'Practice interview prompts around forms, state flow, and component architecture.',
      },
      {
        label: 'Angular trivia questions',
        route: ['/coding'],
        queryParams: { tech: 'angular', kind: 'trivia' },
        note: 'Rehearse concise explanations for lifecycle, DI, and change detection.',
      },
      {
        label: 'Company question sets',
        route: ['/companies'],
        note: 'Move from generic prep to company-specific interview expectations.',
      },
    ],
    quickStart: [
      {
        label: 'Start from Coding interview framework',
        route: ['/', 'guides', 'interview-blueprint', 'coding-interviews'],
        note: 'Set a repeatable answer structure before framework-specific depth.',
      },
      {
        label: 'Continue with Angular coding drills',
        route: ['/coding'],
        queryParams: { tech: 'angular', kind: 'coding' },
        note: 'Practice forms, DI, and state-flow prompt execution.',
      },
      {
        label: 'Then Angular trivia drills',
        route: ['/coding'],
        queryParams: { tech: 'angular', kind: 'trivia' },
        note: 'Reinforce lifecycle, change detection, and testing explanations.',
      },
    ],
  },
  'vue-prep-path': {
    pathLabel: 'Vue prep path',
    title: 'Vue Interview Preparation Path: Reactivity, Rendering, and Patterns',
    subtitle:
      'Prepare for Vue interview questions with a focused sequence across reactivity pitfalls, rendering behavior, and component communication patterns.',
    minutes: 9,
    tags: ['vue', 'interview-prep', 'reactivity', 'rendering', 'patterns'],
    outcomes: [
      'Explain Vue reactivity and rendering updates with confidence.',
      'Avoid common state mutation mistakes in component communication.',
      'Implement Vue interview prompts using predictable, testable patterns.',
    ],
    mistakes: [
      'Mutating props directly instead of preserving one-way data flow.',
      'Using unstable keys in list rendering and causing state bugs.',
      'Skipping lifecycle and watcher cleanup details in explanations.',
    ],
    sequence: BLUEPRINT_BASE,
    practice: [
      {
        label: 'Vue coding questions',
        route: ['/coding'],
        queryParams: { tech: 'vue', kind: 'coding' },
        note: 'Practice component interactions and reactive state updates.',
      },
      {
        label: 'Vue trivia questions',
        route: ['/coding'],
        queryParams: { tech: 'vue', kind: 'trivia' },
        note: 'Build quick-answer confidence for common Vue interview traps.',
      },
      {
        label: 'System design prep path',
        route: ['/', 'guides', 'system-design-blueprint'],
        note: 'Extend framework knowledge into architecture-level interview answers.',
      },
    ],
    quickStart: [
      {
        label: 'Start from Coding interview framework',
        route: ['/', 'guides', 'interview-blueprint', 'coding-interviews'],
        note: 'Establish a stable interview flow before reactive edge cases.',
      },
      {
        label: 'Continue with Vue coding drills',
        route: ['/coding'],
        queryParams: { tech: 'vue', kind: 'coding' },
        note: 'Apply reactive patterns and component communication in prompt workflows.',
      },
      {
        label: 'Then Vue trivia drills',
        route: ['/coding'],
        queryParams: { tech: 'vue', kind: 'trivia' },
        note: 'Practice fast, accurate explanations for common Vue pitfalls.',
      },
    ],
  },
  'html-prep-path': {
    pathLabel: 'HTML prep path',
    title: 'HTML Interview Preparation Path: Semantics, Forms, and Accessibility',
    subtitle:
      'Use this HTML prep path to improve semantic structure, accessibility reasoning, and common form behavior answers used in frontend interviews.',
    minutes: 8,
    tags: ['html', 'interview-prep', 'semantics', 'forms', 'accessibility'],
    outcomes: [
      'Write semantic HTML structures interviewers expect in coding rounds.',
      'Explain form behavior, validation, and accessibility implications clearly.',
      'Catch markup mistakes that often reduce implementation quality scores.',
    ],
    mistakes: [
      'Using div wrappers where semantic elements improve structure and meaning.',
      'Ignoring label associations, keyboard flow, and ARIA only when needed.',
      'Treating accessibility as optional polish instead of base correctness.',
    ],
    sequence: BLUEPRINT_BASE,
    practice: [
      {
        label: 'HTML coding questions',
        route: ['/coding'],
        queryParams: { tech: 'html', kind: 'coding' },
        note: 'Practice document structure, form interactions, and semantic choices.',
      },
      {
        label: 'HTML trivia questions',
        route: ['/coding'],
        queryParams: { tech: 'html', kind: 'trivia' },
        note: 'Strengthen concise answers for browser behaviors and element semantics.',
      },
      {
        label: 'Behavioral interview blueprint',
        route: ['/', 'guides', 'behavioral'],
        note: 'Pair technical clarity with high-signal communication examples.',
      },
    ],
    quickStart: [
      {
        label: 'Start from Coding interview framework',
        route: ['/', 'guides', 'interview-blueprint', 'coding-interviews'],
        note: 'Use a consistent approach before markup and form specifics.',
      },
      {
        label: 'Continue with HTML coding drills',
        route: ['/coding'],
        queryParams: { tech: 'html', kind: 'coding' },
        note: 'Practice semantic structure and forms in realistic prompt contexts.',
      },
      {
        label: 'Then HTML trivia drills',
        route: ['/coding'],
        queryParams: { tech: 'html', kind: 'trivia' },
        note: 'Sharpen concise answers around element behavior and accessibility.',
      },
    ],
  },
  'css-prep-path': {
    pathLabel: 'CSS prep path',
    title: 'CSS Interview Preparation Path: Layout, Specificity, and Responsiveness',
    subtitle:
      'Build a CSS interview roadmap focused on layout systems, specificity debugging, and responsive UI decisions that ship under time limits.',
    minutes: 8,
    tags: ['css', 'interview-prep', 'layout', 'specificity', 'responsive-design'],
    outcomes: [
      'Solve layout prompts with flexbox/grid and explain trade-offs quickly.',
      'Debug cascade and specificity issues without trial-and-error guessing.',
      'Produce responsive, accessible UI behavior in coding interview timeboxes.',
    ],
    mistakes: [
      'Stacking overrides instead of fixing selector strategy and source order.',
      'Ignoring intrinsic sizing and overflow behavior in component layouts.',
      'Prioritizing pixel perfection over maintainability and structure.',
    ],
    sequence: BLUEPRINT_BASE,
    practice: [
      {
        label: 'CSS coding questions',
        route: ['/coding'],
        queryParams: { tech: 'css', kind: 'coding' },
        note: 'Practice layout-focused prompts with interview constraints.',
      },
      {
        label: 'CSS trivia questions',
        route: ['/coding'],
        queryParams: { tech: 'css', kind: 'trivia' },
        note: 'Improve quick-answer confidence for selector and rendering behavior.',
      },
      {
        label: 'Frontend interview tracks',
        route: ['/tracks'],
        note: 'Use guided sequencing when you need predictable progress.',
      },
    ],
    quickStart: [
      {
        label: 'Start from Coding interview framework',
        route: ['/', 'guides', 'interview-blueprint', 'coding-interviews'],
        note: 'Set interview flow before layout-specific details.',
      },
      {
        label: 'Continue with CSS coding drills',
        route: ['/coding'],
        queryParams: { tech: 'css', kind: 'coding' },
        note: 'Practice layout and responsiveness prompts with clear trade-off explanations.',
      },
      {
        label: 'Then CSS trivia drills',
        route: ['/coding'],
        queryParams: { tech: 'css', kind: 'trivia' },
        note: 'Reinforce specificity, cascade, and rendering behavior answers.',
      },
    ],
  },
};

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, GuideShellComponent],
  template: `
    <fa-guide-shell
      [title]="config.title"
      [subtitle]="config.subtitle"
      [minutes]="config.minutes"
      [tags]="config.tags"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav"
    >
      <p>
        This <a [routerLink]="['/guides/framework-prep']">{{ config.pathLabel }}</a> is built for interview preparation,
        not generic docs reading. Start with the quick path below, then use the full sequence to close weak spots
        before final interview rounds.
      </p>

      <ng-container *ngIf="isJavascriptPath; else defaultFrameworkContent">
        <h2>Recommended quick path</h2>
        <ol>
          <li *ngFor="let step of config.quickStart">
            <a [routerLink]="step.route" [queryParams]="step.queryParams || null">{{ step.label }}</a>
            — {{ step.note }}
          </li>
        </ol>

        <h2>What you’ll be able to do after this path</h2>
        <ul>
          <li *ngFor="let outcome of config.outcomes">{{ outcome }}</li>
        </ul>

        <h2>Common mistakes to avoid</h2>
        <ul>
          <li *ngFor="let mistake of config.mistakes">{{ mistake }}</li>
        </ul>

        <ng-container *ngFor="let section of config.teachingSections">
          <h2>{{ section.heading }}</h2>
          <ul>
            <li *ngFor="let point of section.points">{{ point }}</li>
          </ul>
        </ng-container>

        <h2>High-signal JavaScript patterns that actually show up</h2>
        <ul>
          <li *ngFor="let pattern of config.highSignalPatterns">
            <strong>{{ pattern.name }}</strong> —
            <strong>What it is:</strong> {{ pattern.what }}
            <strong>Why interviewers care:</strong> {{ pattern.why }}
            <strong>Real-world example:</strong> {{ pattern.example }}
            <strong>Drill mapping:</strong>
            <ng-container *ngIf="pattern.drill.route; else patternDrillTbd">
              {{ pattern.drill.type }} —
              <a [routerLink]="pattern.drill.route" [queryParams]="pattern.drill.queryParams || null">{{ pattern.drill.name }}</a>
            </ng-container>
            <ng-template #patternDrillTbd>
              {{ pattern.drill.type }} — {{ pattern.drill.name }} {{ pattern.drill.fallback || '(link: TBD)' }}
            </ng-template>
          </li>
        </ul>

        <h2>One worked example: {{ config.workedExample?.topic }}</h2>
        <p><strong>Scenario:</strong> {{ config.workedExample?.scenario }}</p>

        <h3>Wrong approach</h3>
        <p>{{ config.workedExample?.wrongApproach }}</p>
        <pre><code>{{ config.workedExample?.wrongCode }}</code></pre>

        <h3>Corrected approach</h3>
        <p>{{ config.workedExample?.correctedApproach }}</p>
        <pre><code>{{ config.workedExample?.correctedCode }}</code></pre>

        <h3>Interviewer lens</h3>
        <ul>
          <li *ngFor="let lens of config.workedExample?.interviewerLens">{{ lens }}</li>
        </ul>

        <h2>Readiness checklist</h2>
        <ul>
          <li *ngFor="let item of config.readinessChecklist">{{ item }}</li>
        </ul>

        <h2>Next actions / drill mapping</h2>
        <ul>
          <li *ngFor="let action of config.nextActions">
            <strong>{{ action.type }}</strong> —
            <ng-container *ngIf="action.route; else nextActionTbd">
              <a [routerLink]="action.route" [queryParams]="action.queryParams || null">{{ action.name }}</a>
            </ng-container>
            <ng-template #nextActionTbd>
              {{ action.name }} {{ action.fallback || '(link: TBD)' }}
            </ng-template>
          </li>
        </ul>

        <p>
          When you finish the <strong>{{ config.pathLabel }}</strong>, return to the full
          <a [routerLink]="['/','guides','interview-blueprint']">Interview Blueprint hub</a>
          and pick the next weakest area. If you want targeted repetitions, continue with
          <a [routerLink]="['/tracks']">interview tracks</a> and then drill
          <a [routerLink]="['/companies']">company question sets</a>.
        </p>
      </ng-container>

      <ng-template #defaultFrameworkContent>
        <h2>Recommended quick path</h2>
        <ol>
          <li *ngFor="let step of config.quickStart">
            <a [routerLink]="step.route" [queryParams]="step.queryParams || null">{{ step.label }}</a>
            — {{ step.note }}
          </li>
        </ol>

        <h2>What you should be able to do after this path</h2>
        <ul>
          <li *ngFor="let outcome of config.outcomes">{{ outcome }}</li>
        </ul>

        <h2>Common mistakes to avoid</h2>
        <ul>
          <li *ngFor="let mistake of config.mistakes">{{ mistake }}</li>
        </ul>

        <h2>Suggested preparation sequence</h2>
        <ol>
          <li *ngFor="let step of config.sequence">
            <a [routerLink]="step.link">{{ step.title }}</a>
            — {{ step.note }}
          </li>
        </ol>

        <h2>Practice drills to apply this path</h2>
        <ul>
          <li *ngFor="let link of config.practice">
            <a [routerLink]="link.route" [queryParams]="link.queryParams || null">{{ link.label }}</a>
            — {{ link.note }}
          </li>
        </ul>

        <p>
          When you finish the <strong>{{ config.pathLabel }}</strong>, return to the full
          <a [routerLink]="['/','guides','interview-blueprint']">Interview Blueprint hub</a>
          and pick the next weakest area. If you want more targeted drills, jump to
          <a [routerLink]="['/tracks']">interview tracks</a> or
          <a [routerLink]="['/companies']">company question sets</a>.
        </p>
      </ng-template>
    </fa-guide-shell>
  `,
})
export class FrameworkPrepPathArticle {
  @Input() prev?: any[] | null;
  @Input() next?: any[] | null;
  @Input() leftNav?: {
    title?: string;
    sections: Array<{ title: string; items: Array<{ title: string; link: any[]; active?: boolean }> }>;
  };

  private readonly route = inject(ActivatedRoute);
  private readonly slug = this.route.snapshot.paramMap.get('slug') || '';
  readonly isJavascriptPath = this.slug === 'javascript-prep-path';

  readonly config: FrameworkPrepConfig = (() => {
    return PREP_CONFIG[this.slug] ?? PREP_CONFIG['javascript-prep-path'];
  })();
}
