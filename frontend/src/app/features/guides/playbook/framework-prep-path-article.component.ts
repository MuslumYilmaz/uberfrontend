import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FaqSectionComponent } from '../../../shared/faq-section/faq-section.component';
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

type FaqItem = {
  id: string;
  q: string;
  a: string;
};
type FaqGroup = {
  id: string;
  title: string;
  items: FaqItem[];
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
    title: 'JavaScript Interview Prep Playbook: Async, Closures, and State Transitions',
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
  imports: [CommonModule, RouterModule, GuideShellComponent, FaqSectionComponent],
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
      <p *ngIf="!isJavascriptPath">
        This <a [routerLink]="['/guides/framework-prep']">{{ config.pathLabel }}</a> is built for interview preparation,
        not generic docs reading. Start with the quick path below, then use the full sequence to close weak spots
        before final interview rounds.
      </p>

      <ng-container *ngIf="isJavascriptPath; else defaultFrameworkContent">
        <div class="jp-layout">
          <section class="jp-section jp-section--1">
        <h2>Section 1 — Introduction</h2>
        <p>
          If you’ve been bouncing between “JavaScript interview questions” lists and random advice, prep can feel noisy.
          In practice, most frontend interviews are more predictable than they look; they test the same core skills in different forms.
        </p>
        <p>
          A useful mental model is a 3-layer framework: <strong>Topics</strong> (conceptual understanding),
          <strong>Trivia</strong> (fast explanation), and <strong>Coding prompts</strong> (implementation quality).
          The goal is not just knowing concepts, but showing you can reason, communicate, and build under constraints.
        </p>
        <p>
          For example, if an interviewer asks why a <code>setTimeout</code> log appears after an <code>await</code>,
          they are really checking whether your event-loop model is accurate, not whether you memorized a definition.
        </p>
        <p>
          This guide maps common JavaScript interview topics to the JavaScript coding challenges that appear in real
          frontend interview loops, so you can train with intent instead of guessing.
        </p>
        <ul>
          <li>How to use the 3-layer framework (Topics → Trivia → Coding prompts)</li>
          <li>Which JavaScript interview topics appear most often in real prompts</li>
          <li>How to give crisp explanations without hand-waving</li>
          <li>How to implement robust solutions and handle edge cases and trade-offs</li>
        </ul>
        <p>
          If you keep thinking, “I know JS, but interviews still feel inconsistent,” this page is designed to reset your prep.
        </p>
          </section>

          <section class="jp-section jp-section--2">
        <h2>Section 2 — Most asked JavaScript interview topics (and what they really test)</h2>
        <p>
          Most JavaScript rounds reuse the same foundations with different wording. The strongest way to prepare is to
          map <strong>JavaScript interview topics</strong> to the exact reasoning and implementation behaviors expected
          in real <strong>frontend interview</strong> loops, instead of memorizing disconnected answers. If you can predict runtime
          behavior, explain it clearly, and implement it under edge cases, most JavaScript interview questions stop feeling random.
        </p>

        <h3>1) Execution model: event loop, tasks vs microtasks, async/await</h3>
        <p><strong>What they’re testing:</strong> Whether you can mentally simulate scheduling and explain output order under asynchronous flow.</p>
        <p><strong>Common prompts:</strong></p>
        <ul>
          <li>Predict log order with <code>setTimeout</code>, <code>Promise.then</code>, and <code>async/await</code></li>
          <li>Explain why <code>await</code> yields and when execution resumes</li>
          <li>Describe microtasks vs macrotasks with a concrete timeline</li>
        </ul>
        <p><strong>Quick mental model:</strong> A call stack executes now, microtasks flush before the next macrotask, and rendering/IO waits for stack + microtasks to clear. If you narrate queue transitions step by step, your answer becomes predictable and senior-level.</p>
        <p><strong>Common pitfalls:</strong></p>
        <ul>
          <li>Saying “async means later” without explaining queue priority</li>
          <li>Mixing up <code>await</code> pause behavior with full thread blocking</li>
        </ul>
        <p>
          <strong>Practice links:</strong>
          <a [routerLink]="['/javascript/trivia/js-event-loop']">Event loop trivia</a>
          and
          <a [routerLink]="['/javascript/coding/js-take-latest']">Take latest coding drill</a>.
        </p>

        <h3>2) Scope, closures, hoisting (including TDZ)</h3>
        <p><strong>What they’re testing:</strong> Whether you understand how bindings are resolved over time, not just syntax differences.</p>
        <p><strong>Common prompts:</strong></p>
        <ul>
          <li>Closure behavior inside loops</li>
          <li><code>var</code> vs <code>let/const</code> and TDZ failure cases</li>
          <li>Practical closure use for encapsulation or callbacks</li>
        </ul>
        <p><strong>Quick mental model:</strong> A closure keeps references to lexical environments, not snapshots of values. Hoisting creates bindings early, but initialization timing defines what is actually readable.</p>
        <p><strong>Common pitfalls:</strong></p>
        <ul>
          <li>Explaining closures as “memory of old values” without reference semantics</li>
          <li>Treating TDZ as hoisting absence instead of pre-initialization access rules</li>
        </ul>
        <p>
          <strong>Practice links:</strong>
          <a [routerLink]="['/javascript/trivia/js-closures']">Closures trivia</a>
          and
          <a [routerLink]="['/javascript/coding/js-timer-manager']">Timer manager coding drill</a>.
        </p>

        <h3>3) this binding + call/apply/bind + arrow functions</h3>
        <p><strong>What they’re testing:</strong> Whether you can reason about invocation context in real event/callback code.</p>
        <p><strong>Common prompts:</strong></p>
        <ul>
          <li>Determine <code>this</code> in object methods vs detached function calls</li>
          <li>Compare arrow function lexical binding against normal function binding</li>
          <li>Implement or explain a minimal <code>bind</code> behavior</li>
        </ul>
        <p><strong>Quick mental model:</strong> Resolve <code>this</code> from call-site rules first (default, implicit, explicit, constructor), then remember arrows inherit lexical <code>this</code>.</p>
        <p><strong>Common pitfalls:</strong></p>
        <ul>
          <li>Mixing method definition style and handler expectation</li>
          <li>Using arrow functions where dynamic <code>this</code> is required</li>
        </ul>
        <p>
          <strong>Practice links:</strong>
          <a [routerLink]="['/javascript/trivia/js-this-keyword']">this keyword trivia</a>
          and
          <a [routerLink]="['/javascript/coding/js-implement-bind']">Implement bind coding drill</a>.
        </p>

        <h3>4) Prototypes + prototypal inheritance (and what class abstracts)</h3>
        <p><strong>What they’re testing:</strong> Your object model depth beyond class-like surface syntax.</p>
        <p><strong>Common prompts:</strong></p>
        <ul>
          <li>Prototype chain property resolution</li>
          <li>How <code>class</code> maps conceptually to prototype behavior</li>
          <li>Method sharing vs instance property placement</li>
        </ul>
        <p><strong>Quick mental model:</strong> Property access walks own properties first, then climbs prototype links. Methods on prototypes reduce duplication and clarify inheritance intent.</p>
        <p><strong>Common pitfalls:</strong></p>
        <ul>
          <li>Treating classes as a separate runtime model from prototypes</li>
          <li>Putting shared behavior on each instance unnecessarily</li>
        </ul>
        <p>
          <strong>Practice links:</strong>
          <a [routerLink]="['/javascript/trivia/js-prototypal-inheritance']">Prototypal inheritance trivia</a>
          and
          <a [routerLink]="['/javascript/coding/js-implement-instanceof']">Implement instanceof coding drill</a>.
        </p>

        <h3>5) Types, equality, and coercion</h3>
        <p><strong>What they’re testing:</strong> Runtime predictability and precision in edge-case reasoning.</p>
        <p><strong>Common prompts:</strong></p>
        <ul>
          <li><code>==</code> vs <code>===</code> behavior comparisons</li>
          <li>Truthy/falsy edge cases in branching logic</li>
          <li><code>typeof null</code>, <code>NaN</code>, and conversion corner cases</li>
        </ul>
        <p><strong>Quick mental model:</strong> Prefer strict equality and explicit conversions. When coercion appears, state the conversion steps out loud before predicting result.</p>
        <p><strong>Common pitfalls:</strong></p>
        <ul>
          <li>Memorizing odd examples without conversion reasoning</li>
          <li>Relying on implicit coercion in business-critical branches</li>
        </ul>
        <p>
          <strong>Practice links:</strong>
          <a [routerLink]="['/javascript/trivia/js-equality-vs-strict-equality']">Equality trivia</a>,
          <a [routerLink]="['/javascript/trivia/js-null-undefined-undeclared']">null/undefined trivia</a>,
          and
          <a [routerLink]="['/javascript/coding/js-safe-json-parse']">Safe JSON parse coding drill</a>.
        </p>

        <h3>6) Functional patterns: higher-order functions, currying, immutability</h3>
        <p><strong>What they’re testing:</strong> Whether you can transform data predictably and limit side effects.</p>
        <p><strong>Common prompts:</strong></p>
        <ul>
          <li>Implement simple currying or composition helpers</li>
          <li>Explain pure vs impure function behavior</li>
          <li>Show immutable update patterns for nested state</li>
        </ul>
        <p><strong>Quick mental model:</strong> Functions should be composable units: input in, output out, predictable behavior. Immutability makes state transitions traceable and safer to reason about.</p>
        <p><strong>Common pitfalls:</strong></p>
        <ul>
          <li>Mutating inputs in helper functions unintentionally</li>
          <li>Using functional vocabulary without tying it to UI state updates</li>
        </ul>
        <p>
          <strong>Practice links:</strong>
          <a [routerLink]="['/javascript/trivia/js-currying']">Currying trivia</a>
          and
          <a [routerLink]="['/javascript/coding/js-curry-function']">Curry function coding drill</a>.
        </p>

        <h3>7) Data manipulation patterns + small polyfills</h3>
        <p><strong>What they’re testing:</strong> Practical coding rigor, edge-case handling, and clarification habits before implementation.</p>
        <p><strong>Common prompts:</strong></p>
        <ul>
          <li>Implement or reason through map/filter/reduce-like behavior</li>
          <li>Flatten nested arrays under constraints</li>
          <li>Deep clone trade-offs (cycles, special objects, performance)</li>
        </ul>
        <p><strong>Quick mental model:</strong> Clarify input shape, output contract, and constraints before writing code. Most bugs come from hidden assumptions, not loop syntax.</p>
        <p><strong>Common pitfalls:</strong></p>
        <ul>
          <li>Starting implementation without asking type/constraint questions</li>
          <li>Ignoring pathological cases like cycles or sparse arrays</li>
        </ul>
        <p>
          <strong>Practice links:</strong>
          <a [routerLink]="['/javascript/trivia/js-map-filter-reduce']">Map/filter/reduce trivia</a>,
          <a [routerLink]="['/javascript/coding/js-array-prototype-map']">Array.map coding drill</a>,
          and
          <a [routerLink]="['/javascript/coding/js-array-prototype-reduce']">Array.reduce coding drill</a>.
        </p>

        <h3>8) DOM + events: bubbling/capturing, delegation, target/currentTarget</h3>
        <p><strong>What they’re testing:</strong> Browser-native event reasoning and scalable interaction handling.</p>
        <p><strong>Common prompts:</strong></p>
        <ul>
          <li>Build event delegation for dynamic lists</li>
          <li>Explain bubbling vs capturing with concrete event flow</li>
          <li>Differentiate <code>event.target</code> and <code>event.currentTarget</code></li>
        </ul>
        <p><strong>Quick mental model:</strong> Events travel along a path; delegation attaches logic high enough to cover dynamic children while preserving intent checks.</p>
        <p><strong>Common pitfalls:</strong></p>
        <ul>
          <li>Attaching listeners per item instead of delegating</li>
          <li>Confusing target node with handler attachment node</li>
        </ul>
        <p>
          <strong>Practice links:</strong>
          <a [routerLink]="['/javascript/trivia/js-event-delegation']">Event delegation trivia</a>
          and
          <a [routerLink]="['/javascript/coding/js-delegated-events-2']">Delegated events coding drill</a>.
        </p>

        <h3>9) Performance patterns: debounce/throttle, memoization, caching</h3>
        <p><strong>What they’re testing:</strong> Engineering judgment around responsiveness, stability, and resource usage.</p>
        <p><strong>Common prompts:</strong></p>
        <ul>
          <li>Implement debounce and throttle variants</li>
          <li>Choose between them for typing, scrolling, or resize flows</li>
          <li>Explain a small memoization/caching strategy</li>
        </ul>
        <p><strong>Quick mental model:</strong> Start from cost source (CPU, layout, network), then select a control pattern that protects UX without hiding freshness requirements.</p>
        <p><strong>Common pitfalls:</strong></p>
        <ul>
          <li>Using debounce/throttle by habit without a problem statement</li>
          <li>Applying memoization where cache invalidation is undefined</li>
        </ul>
        <p>
          <strong>Practice links:</strong>
          <a [routerLink]="['/javascript/trivia/debounce-vs-throttle-search-input']">Debounce vs throttle trivia</a>,
          <a [routerLink]="['/javascript/coding/js-debounce']">Debounce coding drill</a>,
          and
          <a [routerLink]="['/javascript/coding/js-throttle']">Throttle coding drill</a>.
        </p>

        <h3>Frequency snapshot</h3>
        <table>
          <thead>
            <tr>
              <th>Frequency</th>
              <th>Topics</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>High</td>
              <td>Execution model, scope/closures/hoisting, this binding, data manipulation, debounce/throttle</td>
            </tr>
            <tr>
              <td>Medium</td>
              <td>Types/coercion, prototypes/inheritance, functional patterns</td>
            </tr>
            <tr>
              <td>Role-dependent</td>
              <td>DOM events and delegation (especially frequent in frontend-focused loops)</td>
            </tr>
          </tbody>
        </table>
          </section>

          <section class="jp-section jp-section--3">
        <h2>Section 3 — JavaScript trivia question types (what top-tier interviews probe)</h2>
        <p>
          In top-tier loops, trivia is a fast signal check: can you explain runtime behavior clearly under pressure?
          These are not definition quizzes; they test whether your mental model is production-grade and whether you can
          communicate it without hand-waving.
        </p>
        <table>
          <thead>
            <tr>
              <th>Cluster</th>
              <th>What interviewers are probing</th>
              <th>Strong answer signal</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Event loop + async</td>
              <td>Execution order reasoning</td>
              <td>You narrate queues, not vibes</td>
            </tr>
            <tr>
              <td>Closures + scope + TDZ</td>
              <td>Binding model accuracy</td>
              <td>You explain references over time</td>
            </tr>
            <tr>
              <td>this + bind/apply/call</td>
              <td>Invocation-context clarity</td>
              <td>You resolve by call-site rules</td>
            </tr>
            <tr>
              <td>Promise composition</td>
              <td>Async failure semantics</td>
              <td>You distinguish all/allSettled/race/any</td>
            </tr>
            <tr>
              <td>DOM events + delegation</td>
              <td>Browser-level fluency</td>
              <td>You can explain target/currentTarget trade-offs</td>
            </tr>
          </tbody>
        </table>
        <p><strong>Universal 60-second answer frame</strong></p>
        <ol>
          <li>Name the runtime rule in one sentence.</li>
          <li>Give one concrete snippet behavior.</li>
          <li>Call out one common pitfall.</li>
          <li>Close with one production trade-off.</li>
        </ol>

        <h3>A) Event loop, microtasks/macrotasks, and async/await</h3>
        <p>
          This cluster tests whether you can predict execution order and debug timing bugs when async work overlaps.
        </p>
        <details class="trivia-cluster" open>
          <summary>Open quick sheet</summary>
          <div class="cluster-grid">
            <div class="cluster-col">
              <p><strong>Common trivia questions</strong></p>
              <ul>
                <li>Why does <code>Promise.then</code> run before <code>setTimeout(..., 0)</code>?</li>
                <li>What does <code>await</code> yield to?</li>
                <li>Walk through output order for a mixed Promise + timer snippet.</li>
              </ul>
            </div>
            <div class="cluster-col">
              <p><strong>60-second answer skeleton</strong></p>
              <ul>
                <li>Run sync stack first.</li>
                <li>Drain microtasks fully after current task.</li>
                <li>Then proceed to next macrotask/timer/event task.</li>
              </ul>
            </div>
            <div class="cluster-col">
              <p><strong>Common traps</strong></p>
              <ul>
                <li>Calling Promises macrotasks.</li>
                <li>Explaining order as “later” instead of queue mechanics.</li>
              </ul>
            </div>
          </div>
        </details>

        <h3>B) Closures, lexical scope, hoisting, and TDZ</h3>
        <p>
          Interviewers use this to check whether you can explain stale-state and callback bugs accurately.
        </p>
        <details class="trivia-cluster">
          <summary>Open quick sheet</summary>
          <div class="cluster-grid">
            <div class="cluster-col">
              <p><strong>Common trivia questions</strong></p>
              <ul>
                <li>What exactly does a closure capture?</li>
                <li><code>var</code> vs <code>let</code>/<code>const</code> in loops and callbacks?</li>
                <li>What is TDZ and when does it throw?</li>
              </ul>
            </div>
            <div class="cluster-col">
              <p><strong>60-second answer skeleton</strong></p>
              <ul>
                <li>Closures keep access to lexical bindings, not copied snapshots.</li>
                <li>Hoisting handles declarations before runtime, but initialization timing differs.</li>
                <li>TDZ is pre-initialization access for block-scoped bindings.</li>
              </ul>
            </div>
            <div class="cluster-col">
              <p><strong>Common traps</strong></p>
              <ul>
                <li>“Closure copies value” explanation.</li>
                <li>Mixing up hoisting with immediate readability/callability.</li>
              </ul>
            </div>
          </div>
        </details>

        <h3>C) this binding, arrow functions, and call/apply/bind</h3>
        <p>
          This cluster reveals if you understand invocation context in real handler/callback code paths.
        </p>
        <details class="trivia-cluster">
          <summary>Open quick sheet</summary>
          <div class="cluster-grid">
            <div class="cluster-col">
              <p><strong>Common trivia questions</strong></p>
              <ul>
                <li>What is <code>this</code> here and why?</li>
                <li>How do arrow functions change <code>this</code> behavior?</li>
                <li>Difference between <code>call</code>, <code>apply</code>, and <code>bind</code>?</li>
              </ul>
            </div>
            <div class="cluster-col">
              <p><strong>60-second answer skeleton</strong></p>
              <ul>
                <li><code>this</code> comes from call-site rules (except arrows).</li>
                <li>Arrow functions capture lexical <code>this</code>.</li>
                <li><code>bind</code> returns a bound function; <code>call/apply</code> invoke immediately.</li>
              </ul>
            </div>
            <div class="cluster-col">
              <p><strong>Common traps</strong></p>
              <ul>
                <li>Saying arrows have their own <code>this</code>.</li>
                <li>Saying <code>bind</code> executes the function immediately.</li>
              </ul>
            </div>
          </div>
        </details>

        <h3>D) Promise composition and concurrency helpers</h3>
        <p>
          This checks async composition correctness: sequencing, parallelism, and error semantics.
        </p>
        <details class="trivia-cluster">
          <summary>Open quick sheet</summary>
          <div class="cluster-grid">
            <div class="cluster-col">
              <p><strong>Common trivia questions</strong></p>
              <ul>
                <li><code>Promise.all</code> vs <code>allSettled</code>?</li>
                <li><code>race</code> vs <code>any</code>?</li>
                <li>How do errors propagate through chained <code>.then</code> calls?</li>
              </ul>
            </div>
            <div class="cluster-col">
              <p><strong>60-second answer skeleton</strong></p>
              <ul>
                <li>Chain returns new Promises; thrown errors become rejections.</li>
                <li><code>all</code> fails fast; <code>allSettled</code> reports every outcome.</li>
                <li><code>race</code> settles first; <code>any</code> fulfills first or rejects if all reject.</li>
              </ul>
            </div>
            <div class="cluster-col">
              <p><strong>Common traps</strong></p>
              <ul>
                <li>Treating <code>allSettled</code> as always better than <code>all</code>.</li>
                <li>Forgetting thrown errors inside <code>.then</code> reject downstream.</li>
              </ul>
            </div>
          </div>
        </details>

        <h3>E) Prototypes and class reality</h3>
        <p>
          Interviewers probe whether you understand object behavior beyond class syntax.
        </p>
        <details class="trivia-cluster">
          <summary>Open quick sheet</summary>
          <div class="cluster-grid">
            <div class="cluster-col">
              <p><strong>Common trivia questions</strong></p>
              <ul>
                <li>How does prototype-chain lookup work?</li>
                <li>What does <code>new</code> do?</li>
                <li>Own vs inherited properties?</li>
              </ul>
            </div>
            <div class="cluster-col">
              <p><strong>60-second answer skeleton</strong></p>
              <ul>
                <li>Lookup walks own props, then prototype chain.</li>
                <li><code>class</code> is syntax sugar over constructor/prototype mechanics.</li>
              </ul>
            </div>
            <div class="cluster-col">
              <p><strong>Common traps</strong></p>
              <ul>
                <li>Explaining prototypes as classical inheritance.</li>
                <li>Confusing <code>prototype</code> with <code>__proto__</code>.</li>
              </ul>
            </div>
          </div>
        </details>

        <h3>F) Types, equality, and coercion</h3>
        <p>
          This is a quick filter for runtime predictability and defensive coding habits.
        </p>
        <details class="trivia-cluster">
          <summary>Open quick sheet</summary>
          <div class="cluster-grid">
            <div class="cluster-col">
              <p><strong>Common trivia questions</strong></p>
              <ul>
                <li><code>==</code> vs <code>===</code> and coercion behavior?</li>
                <li><code>null</code> vs <code>undefined</code>?</li>
                <li>What is odd about <code>typeof null</code> and <code>NaN</code>?</li>
              </ul>
            </div>
            <div class="cluster-col">
              <p><strong>60-second answer skeleton</strong></p>
              <ul>
                <li>Default to strict equality.</li>
                <li>Use explicit conversion at boundaries.</li>
                <li>Know key historical oddities and move on.</li>
              </ul>
            </div>
            <div class="cluster-col">
              <p><strong>Common traps</strong></p>
              <ul>
                <li>Memorizing quirks without conversion reasoning.</li>
                <li>Relying on implicit coercion in critical logic.</li>
              </ul>
            </div>
          </div>
        </details>

        <h3>G) DOM events: bubbling/capturing and delegation</h3>
        <p>
          Frontend-specific rounds use this to evaluate scalable event handling decisions.
        </p>
        <details class="trivia-cluster">
          <summary>Open quick sheet</summary>
          <div class="cluster-grid">
            <div class="cluster-col">
              <p><strong>Common trivia questions</strong></p>
              <ul>
                <li>Difference between bubbling and capturing?</li>
                <li><code>event.target</code> vs <code>event.currentTarget</code>?</li>
                <li>When is delegation the better pattern?</li>
              </ul>
            </div>
            <div class="cluster-col">
              <p><strong>60-second answer skeleton</strong></p>
              <ul>
                <li>Events propagate in phases across the DOM path.</li>
                <li>Delegation handles dynamic children with one parent listener.</li>
                <li>Use target checks to route behavior safely.</li>
              </ul>
            </div>
            <div class="cluster-col">
              <p><strong>Common traps</strong></p>
              <ul>
                <li>Mixing up target and currentTarget.</li>
                <li>Attaching a listener per list item by default.</li>
              </ul>
            </div>
          </div>
        </details>

        <h3>H) Debounce vs throttle and UX/perf trade-offs</h3>
        <p>
          This topic tests engineering judgment, not just utility implementation.
        </p>
        <details class="trivia-cluster">
          <summary>Open quick sheet</summary>
          <div class="cluster-grid">
            <div class="cluster-col">
              <p><strong>Common trivia questions</strong></p>
              <ul>
                <li>Debounce vs throttle differences?</li>
                <li>Which one for search input, scroll, resize?</li>
                <li>What UX trade-off does each introduce?</li>
              </ul>
            </div>
            <div class="cluster-col">
              <p><strong>60-second answer skeleton</strong></p>
              <ul>
                <li>Debounce waits for quiet time.</li>
                <li>Throttle limits execution frequency.</li>
                <li>Choose based on intent: final value vs periodic updates.</li>
              </ul>
            </div>
            <div class="cluster-col">
              <p><strong>Common traps</strong></p>
              <ul>
                <li>Reversing definitions.</li>
                <li>Ignoring UX impact (lag vs overload).</li>
              </ul>
            </div>
          </div>
        </details>
          </section>

          <section class="jp-section jp-section--4">
        <h2>Section 4 — JavaScript coding prompt patterns (what you will actually implement)</h2>
        <p>
          In implementation rounds, interviewers usually reuse the same utility-style prompt families with different
          wording. The signal is not syntax speed; it is API clarity, async correctness, and edge-case discipline while
          you code under time pressure.
        </p>

        <h3>1) Debounce / Throttle</h3>
        <p><strong>Prompt template</strong></p>
        <ul>
          <li>Implement <code>debounce(fn, wait)</code> or <code>throttle(fn, wait)</code> and explain when to use each.</li>
        </ul>
        <p><strong>What they’re testing</strong></p>
        <ul>
          <li>Timing semantics, API design, and event-load control.</li>
        </ul>
        <p><strong>What good looks like</strong></p>
        <ul>
          <li>Correct behavior under rapid calls, plus preserved <code>this</code> and arguments.</li>
        </ul>
        <p><strong>Common pitfalls</strong></p>
        <ul>
          <li>Mixing debounce and throttle semantics, or leaking timers.</li>
        </ul>

        <h3>2) Promise utilities and async concurrency</h3>
        <p><strong>Prompt template</strong></p>
        <ul>
          <li>Implement a simplified <code>Promise.all</code> or a concurrency-limited async mapper.</li>
        </ul>
        <p><strong>What they’re testing</strong></p>
        <ul>
          <li>Ordering guarantees, rejection behavior, and bounded in-flight work.</li>
        </ul>
        <p><strong>What good looks like</strong></p>
        <ul>
          <li>Result order matches input order and failure semantics are explicit.</li>
        </ul>
        <p><strong>Common pitfalls</strong></p>
        <ul>
          <li>Returning completion order or calling sequential execution “concurrency control.”</li>
        </ul>

        <h3>3) Array/Object helpers (map/filter/reduce, flatten)</h3>
        <p><strong>Prompt template</strong></p>
        <ul>
          <li>Implement <code>map</code>/<code>filter</code>/<code>reduce</code> behavior or flatten nested arrays.</li>
        </ul>
        <p><strong>What they’re testing</strong></p>
        <ul>
          <li>Contract fidelity, complexity awareness, and edge-case handling.</li>
        </ul>
        <p><strong>What good looks like</strong></p>
        <ul>
          <li>Clarified scope first, then clean implementation with predictable callback behavior.</li>
        </ul>
        <p><strong>Common pitfalls</strong></p>
        <ul>
          <li>Off-by-one bugs, sparse-array misses, and hidden O(n²) loops.</li>
        </ul>

        <h3>4) Deep clone / Deep equal</h3>
        <p><strong>Prompt template</strong></p>
        <ul>
          <li>Implement <code>cloneDeep</code> or <code>deepEqual(a, b)</code> with stated constraints.</li>
        </ul>
        <p><strong>What they’re testing</strong></p>
        <ul>
          <li>Clarifying questions, recursive reasoning, and trade-off communication.</li>
        </ul>
        <p><strong>What good looks like</strong></p>
        <ul>
          <li>Explicit type support, cycle strategy, and correctness/performance boundaries.</li>
        </ul>
        <p><strong>Common pitfalls</strong></p>
        <ul>
          <li>Using JSON clone as universal answer or failing on cycles.</li>
        </ul>

        <h3>5) classnames() style normalization utility</h3>
        <p><strong>Prompt template</strong></p>
        <ul>
          <li>Build a helper that merges strings/arrays/objects into one class string.</li>
        </ul>
        <p><strong>What they’re testing</strong></p>
        <ul>
          <li>Input normalization and defensive API design.</li>
        </ul>
        <p><strong>What good looks like</strong></p>
        <ul>
          <li>Handles mixed shapes safely and returns stable formatting.</li>
        </ul>
        <p><strong>Common pitfalls</strong></p>
        <ul>
          <li>Breaking nested arrays or over-engineering before defining minimal contract.</li>
        </ul>

        <h3>6) Event Emitter / Observer mini API</h3>
        <p><strong>Prompt template</strong></p>
        <ul>
          <li>Implement <code>on</code>, <code>off</code>, <code>emit</code>, optionally <code>once</code>.</li>
        </ul>
        <p><strong>What they’re testing</strong></p>
        <ul>
          <li>Listener lifecycle handling and mutation safety while emitting.</li>
        </ul>
        <p><strong>What good looks like</strong></p>
        <ul>
          <li>Reliable unsubscribe flow and leak-aware listener management.</li>
        </ul>
        <p><strong>Common pitfalls</strong></p>
        <ul>
          <li>Mutating the listener collection during iteration.</li>
        </ul>

        <h3>7) DOM traversal and query-style helpers</h3>
        <p><strong>Prompt template</strong></p>
        <ul>
          <li>Implement simplified DOM traversal utilities (class/tag matching, nested scans).</li>
        </ul>
        <p><strong>What they’re testing</strong></p>
        <ul>
          <li>Tree traversal correctness and predictable output behavior.</li>
        </ul>
        <p><strong>What good looks like</strong></p>
        <ul>
          <li>Clear DFS/BFS approach with consistent result ordering.</li>
        </ul>
        <p><strong>Common pitfalls</strong></p>
        <ul>
          <li>Skipping deep descendants or returning unstable result shapes.</li>
        </ul>

        <h3>8) Async UI safety prompts (latest-wins, submit guards)</h3>
        <p><strong>Prompt template</strong></p>
        <ul>
          <li>Prevent stale async updates and duplicate in-flight actions in interactive UI flows.</li>
        </ul>
        <p><strong>What they’re testing</strong></p>
        <ul>
          <li>Race-condition control and explicit state transitions under user pressure.</li>
        </ul>
        <p><strong>What good looks like</strong></p>
        <ul>
          <li>Older responses cannot overwrite newer intent; duplicate actions are guarded.</li>
        </ul>
        <p><strong>Common pitfalls</strong></p>
        <ul>
          <li>Assuming request and response order always match.</li>
        </ul>

        <h3>Frequency snapshot</h3>
        <table>
          <thead>
            <tr>
              <th>Frequency</th>
              <th>Patterns</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>High</td>
              <td>Debounce/throttle, Promise composition, array helpers, flatten, deep clone/equal</td>
            </tr>
            <tr>
              <td>Medium</td>
              <td>Event emitter, classnames normalization, DOM traversal utilities</td>
            </tr>
            <tr>
              <td>Senior-leaning</td>
              <td>Async UI race control with explicit state transition guards</td>
            </tr>
          </tbody>
        </table>
          </section>

          <section class="jp-section jp-section--5">
        <h2>Section 5 — Senior-level signals: what interviewers are really evaluating</h2>
        <p>
          Many candidates treat coding rounds as “correct output = pass,” but interview scoring is usually process-heavy.
          In a <strong>senior frontend interview</strong>, interviewers evaluate how you reduce ambiguity, structure decisions, and
          communicate trade-offs under pressure. Strong <strong>JavaScript interview preparation</strong> means rehearsing that process,
          not only memorizing answers to <strong>JavaScript interview questions</strong>.
        </p>

        <h3>Signal 1) Clarify before coding</h3>
        <p><strong>What they’re evaluating</strong></p>
        <ul>
          <li>Your ability to remove ambiguity before implementation cost grows.</li>
        </ul>
        <p><strong>What good looks like</strong></p>
        <ul>
          <li>You ask 2–4 focused questions: input shape, failure behavior, ordering guarantees, and constraints.</li>
          <li>You restate scope in one sentence and confirm before writing code.</li>
        </ul>
        <p><strong>Red flags</strong></p>
        <ul>
          <li>Starting code immediately and discovering requirements mid-solution.</li>
          <li>Asking many questions without converging to a plan.</li>
        </ul>

        <h3>Signal 2) Choose the simplest correct approach first</h3>
        <p><strong>What they’re evaluating</strong></p>
        <ul>
          <li>Delivery discipline: can you ship a correct baseline quickly, then iterate?</li>
        </ul>
        <p><strong>What good looks like</strong></p>
        <ul>
          <li>“Minimal version first, edge cases second” is explicit in your flow.</li>
          <li>API remains small, predictable, and easy to validate.</li>
        </ul>
        <p><strong>Red flags</strong></p>
        <ul>
          <li>Designing a mini framework for a scoped prompt.</li>
          <li>Premature abstraction before correctness is established.</li>
        </ul>

        <h3>Signal 3) Edge-case discipline</h3>
        <p><strong>What they’re evaluating</strong></p>
        <ul>
          <li>Reliability mindset under imperfect inputs and async failure paths.</li>
        </ul>
        <p><strong>What good looks like</strong></p>
        <ul>
          <li>You proactively call out empty inputs, repeated calls, rejection/cancellation, and cleanup.</li>
          <li>You add a small set of meaningful edge checks, not a random list.</li>
        </ul>
        <p><strong>Red flags</strong></p>
        <ul>
          <li>Happy-path-only implementation.</li>
          <li>Ignoring failures in obviously async prompts.</li>
        </ul>

        <h3>Signal 4) Trade-off reasoning (correctness vs performance vs maintainability)</h3>
        <p><strong>What they’re evaluating</strong></p>
        <ul>
          <li>Engineering judgment expected in a <strong>frontend engineering interview</strong>.</li>
        </ul>
        <p><strong>What good looks like</strong></p>
        <ul>
          <li>You justify choices concretely (“keeps order stable in O(n)”, “simpler API lowers bug surface”).</li>
          <li>You mention one alternative and why you did not choose it.</li>
        </ul>
        <p><strong>Red flags</strong></p>
        <ul>
          <li>Vague defense (“this is better”) without measurable criteria.</li>
          <li>Complexity discussion only after interviewer prompts for it.</li>
        </ul>

        <h3>Signal 5) Readable, testable code under time pressure</h3>
        <p><strong>What they’re evaluating</strong></p>
        <ul>
          <li>Whether your default coding style is production-safe without long refactor cycles.</li>
        </ul>
        <p><strong>What good looks like</strong></p>
        <ul>
          <li>Clear naming, small functions, straightforward control flow.</li>
          <li>Quick sanity validation with tiny examples before final explanation.</li>
        </ul>
        <p><strong>Red flags</strong></p>
        <ul>
          <li>Working code that is hard to reason about.</li>
          <li>No validation mindset (“it should work”) before handoff.</li>
        </ul>

        <h3>Signal 6) Communicate while coding</h3>
        <p><strong>What they’re evaluating</strong></p>
        <ul>
          <li>Collaboration quality and alignment speed, especially at senior levels.</li>
        </ul>
        <p><strong>What good looks like</strong></p>
        <ul>
          <li>Short intent narration: what you’re doing and why now.</li>
          <li>You can pause, verify with an example, and correct course transparently.</li>
        </ul>
        <p><strong>Red flags</strong></p>
        <ul>
          <li>Silent coding for long stretches.</li>
          <li>Over-talking without shipping incremental progress.</li>
        </ul>

        <h3>What excellent sounds like (reusable script)</h3>
        <ul>
          <li>Clarify scope with 2–4 high-signal questions.</li>
          <li>Restate requirements and propose a minimal approach.</li>
          <li>Implement baseline correctness first.</li>
          <li>Add targeted edge cases and cleanup behavior.</li>
          <li>Explain complexity and one alternative trade-off.</li>
          <li>Run a quick validation example out loud.</li>
        </ul>

        <p>
          Next, Section 6 shows how to turn this rubric into a repeatable prep loop with FrontendAtlas using coding
          drills, trivia drills, and guided practice.
        </p>
          </section>

          <section class="jp-section jp-section--6">
        <h2>Section 6 — How to prepare with FrontendAtlas (a practical plan)</h2>
        <p>
          Treat prep as training, not content consumption: diagnose, drill, review, and repeat. This is the fastest
          way to improve <strong>JavaScript interview preparation</strong> quality and stay consistent under time pressure.
          Most <strong>JavaScript interview questions</strong> stop feeling random when you use the same daily loop.
        </p>

        <h3>The core daily loop</h3>
        <ul>
          <li><strong>Warm-up (5–10 min):</strong> run one trivia cluster and answer out loud in 60 seconds.</li>
          <li><strong>Main drill (25–60 min):</strong> solve one coding prompt pattern end-to-end.</li>
          <li><strong>Review (10–15 min):</strong> write what broke, why it broke, and what signal you missed.</li>
          <li><strong>Recap (2 min):</strong> one line for today’s gain and one line for tomorrow’s focus.</li>
        </ul>

        <h3>7-day crash plan (interview is close)</h3>
        <p><strong>45 min/day</strong></p>
        <ul>
          <li>Day 1–2: event loop, async/await, and Promise behavior + one small async drill.</li>
          <li>Day 3: closures, hoisting, TDZ + one closure-heavy mini prompt.</li>
          <li>Day 4: this rules + arrow vs function + one binding drill.</li>
          <li>Day 5: debounce vs throttle + trade-off explanation practice.</li>
          <li>Day 6: Promise utilities + small concurrency mapping prompt.</li>
          <li>Day 7: mixed mock (trivia sprint + coding prompt + short review).</li>
        </ul>
        <p><strong>90 min/day</strong></p>
        <ul>
          <li>Keep the same day plan, then add one extra coding drill every other day.</li>
          <li>Add 10 minutes of “explain your solution” replay after each implementation.</li>
        </ul>
        <p><strong>Checkpoint:</strong> you can explain async ordering clearly, solve at least two utility patterns, and
        discuss trade-offs without prompting.</p>

        <h3>14-day plan (consistency + blind-spot closure)</h3>
        <p><strong>Week 1:</strong> async model, closures/scope, this binding, array/object helpers, debounce/throttle, Promise utilities.</p>
        <p><strong>Week 2:</strong> async concurrency limits, event emitter pattern, deep clone/equal scope, DOM delegation basics.</p>
        <p><strong>45 min/day</strong></p>
        <ul>
          <li>10 min trivia, 25 min coding drill, 10 min review and recap.</li>
        </ul>
        <p><strong>90 min/day</strong></p>
        <ul>
          <li>15 min trivia (two clusters), 60 min coding, 15 min edge-case and complexity review.</li>
        </ul>
        <p><strong>Checkpoint:</strong> your default answer flow is clarify → minimal implementation → edge cases → trade-offs → validation.</p>

        <h3>30-day plan (senior readiness)</h3>
        <p><strong>Weeks 1–2:</strong> rotate core topics and repeat high-frequency prompt families until execution is automatic.</p>
        <p><strong>Weeks 3–4:</strong> run time-boxed mocks, narrate decisions while coding, and review your mistake log every 3–4 days.</p>
        <p>
          Target outcome: readable code under pressure, stable edge-case handling, and calm trade-off explanation in a
          real <strong>frontend interview</strong>.
        </p>

        <h3>Decision tree: if you’re weak at X, do Y</h3>
        <ul>
          <li>
            <strong>Async flow weak:</strong> prioritize event loop + Promise error propagation, then run
            <a [routerLink]="['/coding']" [queryParams]="{ tech: 'javascript', kind: 'trivia', topic: 'async' }">async trivia drills</a>
            and
            <a [routerLink]="['/coding']" [queryParams]="{ tech: 'javascript', kind: 'coding', topic: 'async' }">async coding drills</a>.
          </li>
          <li>
            <strong>Closures/scope weak:</strong> review lexical environment and TDZ, then do closure output explanations and one function-factory coding drill.
          </li>
          <li>
            <strong>DOM/delegation weak:</strong> revisit bubbling/capturing and run one delegated-events implementation with dynamic children.
          </li>
          <li>
            <strong>“Easy” array/object prompts still fail:</strong> slow down on contract reading and run one helper implementation with explicit edge-case notes.
          </li>
        </ul>
        <p>
          This sequence also raises hit-rate on common <strong>frontend interview questions</strong> because it trains explanation and implementation together.
        </p>

        <h3>Last week before interview (fast ROI routine)</h3>
        <ul>
          <li>One daily trivia sprint (10–15 min).</li>
          <li>One daily coding pattern (30–45 min).</li>
          <li>One daily review note with three pitfalls you will not repeat tomorrow.</li>
        </ul>
        <p>
          Next, Section 7 gives a compact cheat sheet you can scan right before interview rounds.
        </p>
          </section>

          <section class="jp-section jp-section--7">
        <h2>Section 7 — Last-week cheat sheet</h2>
        <p>
          In the final week, optimize fluency and error rate instead of adding new scope. This review stack targets
          recurring <strong>JavaScript interview questions</strong> in a time-boxed way.
        </p>

        <h3>80/20 review stack (start here)</h3>
        <ul>
          <li>Event loop ordering: microtasks vs macrotasks with async/await.</li>
          <li>Closures in loops + hoisting + TDZ.</li>
          <li>this binding rules + arrow behavior.</li>
          <li>Promise chaining, rejection flow, and all vs allSettled.</li>
          <li>Debounce vs throttle with one clean implementation.</li>
          <li>One utility prompt you can execute under pressure.</li>
        </ul>
        <p>
          This coverage usually hits both fast <strong>JavaScript trivia questions</strong> and implementation rounds.
        </p>

        <h3>Nightly 45-minute routine (repeat 5–6 nights)</h3>
        <ul>
          <li><strong>10 min trivia sprint:</strong> definition, one example, one pitfall, one trade-off.</li>
          <li><strong>25 min coding sprint:</strong> one prompt, minimal version first, then edge cases.</li>
          <li><strong>10 min review:</strong> log one bug, why it happened, and tomorrow’s prevention rule.</li>
        </ul>

        <h3>Output prediction drill (fast confidence boost)</h3>
        <ul>
          <li>Run 3–5 tiny snippets daily: Promise + setTimeout mix, await in loops, closure-in-loop output, method vs callback this.</li>
          <li>Predict before running, then explain queue/order reasoning out loud.</li>
        </ul>

        <h3>Common red flags (down-level signals)</h3>
        <ul>
          <li>Coding before clarifying requirements.</li>
          <li>Hand-wavy reasoning (“async means later”).</li>
          <li>No edge-case handling: empty input, failures, cleanup.</li>
          <li>Losing this/arguments in utility code.</li>
          <li>No validation examples before handoff.</li>
          <li>Overengineering small prompts.</li>
        </ul>

        <h3>20-second “excellent sounds like” script</h3>
        <p>
          “I’ll clarify requirements first, implement the minimal correct version, add edge cases, explain trade-offs,
          and validate quickly with examples.”
        </p>

        <h3>Optional 2-hour emergency plan</h3>
        <ul>
          <li>30 min: event loop + microtasks explanation and 3 output snippets.</li>
          <li>30 min: closures + this rules with 3 targeted snippets.</li>
          <li>60 min: one full prompt from requirements to validation.</li>
        </ul>
        <p>
          Use this as final calibration before a live <strong>frontend interview</strong>, especially when balancing speed and correctness in
          <strong>JavaScript coding challenges</strong>.
        </p>

        <p>
          Next, Section 8 answers quick FAQs you can use to decide what to prioritize in the final days.
        </p>
          </section>

          <section class="jp-section jp-section--8">
        <h2>Section 8 — FAQ</h2>
        <app-faq-section
          eyebrow="FAQ"
          [groups]="javascriptFaqGroups"
          initialOpenId="faq-leetcode-js"
        ></app-faq-section>
        <p>
          This guide is built to remove randomness from practice by giving you a repeatable way to diagnose weak spots,
          drill with intent, and review mistakes. If you follow the plan consistently for 7, 14, or 30 days, you
          should see clearer explanations, cleaner implementations, and fewer repeated errors. Use the prep sequence as
          your default operating system, then adapt time-boxes based on your interview date.
        </p>
          </section>
        </div>
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

  readonly javascriptFaqGroups: FaqGroup[] = [
    {
      id: 'faq-group-strategy',
      title: 'Prep strategy',
      items: [
        {
          id: 'faq-leetcode-js',
          q: 'Do I need LeetCode to pass JavaScript-heavy frontend loops?',
          a: 'Not always. Many loops prioritize <strong>JavaScript interview questions</strong> that look like real frontend work: async behavior, utility implementations, and runtime reasoning under edge cases. LeetCode can still help with general problem decomposition, but it should not replace fundamentals and implementation fluency. <strong>Practical rule:</strong> for frontend-heavy targets, start with JS mental models and utility-style drills, then add DS&A only if your target process explicitly requires it.',
        },
        {
          id: 'faq-topics-trivia-coding',
          q: 'What is the practical difference between topics, trivia, and coding prompts?',
          a: 'They test the same knowledge at different depths. Topics check whether your mental model is correct, trivia checks whether you can explain it quickly, and coding checks whether you can apply it under constraints. If your interview performance feels inconsistent, you are usually strong in one layer and weak in another. A balanced week should include all three layers so explanation and implementation improve together.',
        },
        {
          id: 'faq-practice-efficient',
          q: 'How do I practice efficiently without wasting time?',
          a: 'Use a fixed loop: explain one concept out loud, implement one small pattern, add two edge cases, then write a short review note. Time-box each step so practice stays focused and repeatable. You improve faster by running the same loop daily than by switching formats every day. <strong>Practical rule:</strong> stop each session with a single “tomorrow focus” sentence and start from it next day.',
        },
      ],
    },
    {
      id: 'faq-group-interview-signals',
      title: 'Interview signals',
      items: [
        {
          id: 'faq-know-js-struggle',
          q: 'I know JavaScript but still struggle in interviews. Why?',
          a: 'Interview performance depends on execution quality under pressure, not only raw knowledge. You are asked to predict behavior, explain clearly, implement with edge-case coverage, and validate quickly in one pass. That compressed workflow is a specific skill and it needs rehearsal. <strong>Practical rule:</strong> after every drill, write one mistake and one prevention rule before moving to the next prompt.',
        },
        {
          id: 'faq-senior-priorities',
          q: 'What should I prioritize for a senior frontend interview?',
          a: 'You are scored on process and judgment as much as output in a <strong>senior frontend interview</strong>. Prioritize requirement clarification, minimal-correct-first implementation, failure and cleanup handling, and explicit trade-off discussion. Readability and validation discipline matter because they signal production readiness. <strong>Practical rule:</strong> narrate one design decision every few minutes and tie it to correctness, complexity, or maintainability.',
        },
        {
          id: 'faq-dom-vs-frameworks',
          q: 'Are DOM questions still asked, or is it all frameworks now?',
          a: 'DOM and browser behavior remain core in most <strong>frontend interview</strong> processes. Event propagation, delegation, rendering timing, and async UI interactions still appear because frameworks do not remove underlying platform behavior. Framework knowledge helps you move faster, but browser fundamentals are what keep your answers reliable when edge cases appear. Treat DOM reasoning as core prep, not optional review.',
        },
      ],
    },
    {
      id: 'faq-group-using-platform',
      title: 'Using FrontendAtlas',
      items: [
        {
          id: 'faq-frontendatlas-fit',
          q: 'How should I use FrontendAtlas in this process?',
          a: 'Use it as a structured drill environment: identify weak clusters, run focused trivia and coding drills, and revisit the same cluster until mistakes stop repeating. The goal is not maximum volume; the goal is stable execution quality. Keep your sequence simple: diagnose, drill, review, and repeat. That is the fastest path to consistent <strong>JavaScript interview preparation</strong> results.',
        },
        {
          id: 'faq-how-long-ready',
          q: 'How long does it usually take to feel interview-ready?',
          a: 'It depends on your baseline and target bar, but consistency beats marathon sessions. Seven days can patch major gaps, fourteen days can stabilize common patterns, and thirty days usually builds senior-level fluency for recurring prompts. <strong>Practical rule:</strong> keep a steady daily cadence (even shorter sessions) rather than infrequent long bursts.',
        },
      ],
    },
  ];
}
