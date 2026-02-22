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
type PrepIntro = {
  paragraphs: string[];
  bullets: string[];
};
type TopicCluster = {
  title: string;
  why: string;
  prompts: string[];
  good: string;
};
type TopicFrequencyRow = {
  frequency: string;
  topics: string;
};
type TopicsSection = {
  title: string;
  intro: string;
  clusters: TopicCluster[];
  frequencyRows: TopicFrequencyRow[];
  closing: string;
  practiceLinks?: {
    trivia: RouteLink;
    coding: RouteLink;
  };
};
type TriviaCluster = {
  title: string;
  why: string;
  questions: string[];
  answerSkeleton: string[];
  traps: string[];
  practice: string;
  drills?: RouteLink[];
};
type TriviaSection = {
  title: string;
  intro: string;
  clusters: TriviaCluster[];
  practiceIntro: string;
  practiceSteps: string[];
  closing: string;
  practiceLinks?: {
    trivia: RouteLink;
    coding: RouteLink;
  };
};
type CodingPromptPattern = {
  title: string;
  promptTemplate: string;
  testing: string;
  good: string;
  pitfalls: string[];
  variation?: string;
  drills?: RouteLink[];
};
type CodingPatternsSection = {
  title: string;
  intro: string;
  patterns: CodingPromptPattern[];
  rubricTitle: string;
  rubricIntro: string;
  rubricItems: string[];
  flowTitle: string;
  flowIntro: string;
  flowSteps: string[];
  closing: string;
  practiceLinks?: {
    trivia?: RouteLink;
    coding: RouteLink;
  };
};
type SeniorSignal = {
  title: string;
  evaluating: string;
  good: string[];
  redFlags: string[];
};
type SeniorSignalsSection = {
  title: string;
  intro: string;
  signals: SeniorSignal[];
  scriptTitle: string;
  scriptSteps: string[];
  closing: string;
  practiceLinks?: {
    trivia?: RouteLink;
    coding?: RouteLink;
  };
};
type PracticeMapEntry = {
  label: string;
  route: any[];
  queryParams?: Record<string, string>;
  routeUrl: string;
  evidence: string;
  note: string;
};
type DailyRoutine = {
  warmup: string;
  main: string;
  review: string;
};
type TimeboxedPlan = {
  intro: string;
  emphasis: string[];
  routine45: DailyRoutine;
  routine90: DailyRoutine;
  checkpoints: string[];
};
type DecisionLeaf = {
  weakSpot: string;
  actions: string[];
  practice: PracticeMapEntry[];
};
type PracticalPlanSection = {
  title: string;
  opener: string[];
  practiceMap: PracticeMapEntry[];
  plan7: TimeboxedPlan;
  plan14: TimeboxedPlan;
  plan30: TimeboxedPlan;
  decisionIntro: string;
  decisionLeaves: DecisionLeaf[];
  lastWeekRoutine: string[];
  closing: string;
  evidenceIndex?: PracticeMapEntry[];
};
type RepoPracticeRef = {
  id: string;
  title: string;
  filePath: string;
  route: any[];
  routeUrl: string;
};
type CheatSheetCluster = {
  title: string;
  review: string;
  microDrills: string[];
  refs: RepoPracticeRef[];
};
type CheatSheetPrediction = {
  prompt: string;
  ref: RepoPracticeRef;
};
type CheatSheetRedFlag = {
  flag: string;
  refs: RepoPracticeRef[];
};
type CheatSheetEmergencyBlock = {
  duration: string;
  action: string;
  refs: RepoPracticeRef[];
};
type CheatSheetSection = {
  title: string;
  opener: string[];
  clusters: CheatSheetCluster[];
  nightlyIntro: string;
  nightlyRoutine: {
    trivia: string;
    coding: string;
    review: string;
  };
  mistakeTemplate: string[];
  nightlyRefs: RepoPracticeRef[];
  predictionIntro: string;
  predictions: CheatSheetPrediction[];
  redFlags: CheatSheetRedFlag[];
  emergencyIntro: string;
  emergencyBlocks: CheatSheetEmergencyBlock[];
  closing: string;
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
  intro?: PrepIntro;
  topicsSection?: TopicsSection;
  triviaSection?: TriviaSection;
  codingPatternsSection?: CodingPatternsSection;
  seniorSignalsSection?: SeniorSignalsSection;
  practicalPlanSection?: PracticalPlanSection;
  cheatSheetSection?: CheatSheetSection;
  faqGroups?: FaqGroup[];
  faqInitialOpenId?: string;
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
    title: 'JavaScript Prep Path: Async, Closures, State',
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
        label: 'JavaScript coding challenges',
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
    title: 'React Prep Path: State, Effects, Performance',
    subtitle:
      'Prepare for React interview rounds with a clear sequence covering component design, rendering behavior, and state management decisions.',
    minutes: 9,
    tags: ['react', 'interview-prep', 'hooks', 'state', 'performance'],
    outcomes: [
      'Design React components that are testable, accessible, and easy to reason about.',
      'Diagnose rerender issues, stale state, and effect-related bugs quickly.',
      'Communicate performance and state trade-offs in practical interview language.',
    ],
    intro: {
      paragraphs: [
        'If React prep feels scattered between hook tips, random clips, and mock prompts, that is normal. Most loops still test the same handful of signals; they just repackage them.',
        'Use one 3-layer loop to keep prep grounded: Topics, Trivia, and Coding prompts. It helps you separate real understanding from “I’ve seen this before” familiarity.',
        'When interviewers ask why useEffect runs twice or why callbacks read stale values, they’re not testing memorized hook rules. They’re checking whether your render/commit/update model is stable under pressure.',
        'This page maps high-frequency React topics to coding patterns that actually appear in rounds, so you can practice on purpose instead of guessing what might show up.',
      ],
      bullets: [
        'How to use the 3-layer framework: Topics → Trivia → Coding prompts',
        'Which React concepts appear most often across real prompts and follow-ups',
        'How to explain React behavior clearly in under a minute without hand-waving',
        'How to implement robust solutions that handle edge cases and trade-offs',
        'How to reset your prep if you keep thinking “I know React, but interviews still feel inconsistent”',
      ],
    },
    topicsSection: {
      title: 'Most asked React interview topics (and what they really test)',
      intro:
        'Most React rounds reuse the same clusters. Wording changes, but scoring is consistent: rerender prediction, hook reasoning, and edge-case-safe UI logic.',
      clusters: [
        {
          title: 'Rendering & reconciliation (including keys)',
          why: 'It checks whether you can reason about what re-renders, why it re-renders, and how React decides what to update.',
          prompts: [
            'Explain reconciliation/diffing at a high level',
            'Why keys matter, and why using index-as-key can be risky',
            'What causes a component to re-render? (and how to prevent unnecessary renders)',
          ],
          good:
            'You can describe render → reconcile → commit and explain how keys preserve identity so React can apply updates predictably.',
        },
        {
          title: 'State updates & batching (React 18+)',
          why: 'Modern React behavior depends on update semantics and batching, which affects both correctness and performance.',
          prompts: [
            'Why doesn’t state update immediately?',
            'Multiple updates in one event: why setState(x + 1) twice does not always do what you think',
            'What batching is and when it applies',
          ],
          good:
            'You explain state updates as queued and applied during render, and you understand when React batches updates and what that implies for observable state.',
        },
        {
          title: 'Hooks fundamentals + Rules of Hooks',
          why: 'Hooks are the default React model; breaking the rules creates subtle, hard-to-debug problems.',
          prompts: [
            'The Rules of Hooks (where/when you can call hooks)',
            'Why hooks must be called in consistent order',
            'When to extract a custom hook',
          ],
          good:
            'You can justify the rules (stable call order is what makes hooks work), and you describe custom hooks as reusable stateful logic—not magic.',
        },
        {
          title: 'useEffect mental model (deps, cleanup, timing)',
          why: 'This is where most real-world bugs live: stale closures, missing dependencies, repeated effects, and incorrect cleanup.',
          prompts: [
            'What the dependency array actually means',
            'Cleanup functions (subscriptions, timers, event listeners)',
            'useEffect vs useLayoutEffect (timing differences)',
          ],
          good:
            'You treat effects as synchronization with external systems, explain dependency-driven reruns, and treat cleanup as part of correctness—not optional polish.',
        },
        {
          title: 'Strict Mode behavior (double-invocation / re-running effects in dev)',
          why: 'People get surprised by “why did my effect run twice?” and then ship hacks instead of fixing the underlying side-effect issue.',
          prompts: [
            'Why React may double-render / re-run effects in development',
            'How Strict Mode helps find side effects',
            'What kinds of bugs this pattern surfaces',
          ],
          good:
            'You understand it’s a dev-time safety check meant to reveal unsafe side effects, and you don’t “fix” it with random flags unless there’s a clear, scoped reason.',
        },
        {
          title: 'Stale closures & state in callbacks',
          why: 'Classic React pitfall: handlers and effects reading old state/props.',
          prompts: [
            'Why is my callback seeing stale state?',
            'When to use functional updates (setState(prev => ...))',
            'When refs help (and when they’re a code smell)',
          ],
          good:
            'You can explain closure capture vs updated state, and you can apply functional updates or ref patterns intentionally (with a reason), not as superstition.',
        },
        {
          title: 'Performance & memoization (React.memo, useMemo, useCallback)',
          why: 'It tests judgment: do you optimize when it matters, and do you understand the cost/benefit trade-off?',
          prompts: [
            'When memoization helps vs hurts',
            'Referential equality + why useCallback exists',
            'Avoiding re-renders in component trees',
          ],
          good:
            'You explain memoization as work avoided and acknowledge overhead; you optimize based on measurements/symptoms, not reflexively wrapping everything in memo.',
        },
        {
          title: 'Context & state management trade-offs',
          why: 'It checks whether you can share state without accidentally creating broad re-render storms or mixing responsibilities.',
          prompts: [
            'When to use Context vs lifting state vs external store',
            'Context pitfalls: overuse, performance, layering',
            'Structuring shared state boundaries',
          ],
          good:
            'You talk about scope, update frequency, and separation of concerns—and you can articulate why “Context replaces Redux” is an oversimplification.',
        },
        {
          title: 'Forms & controlled vs uncontrolled components',
          why: 'Forms are real work; controlled inputs reveal your grasp of state, events, and performance under interaction.',
          prompts: [
            'Controlled vs uncontrolled inputs',
            'Validation strategy and UX trade-offs',
            'Handling large forms without lag',
          ],
          good:
            'You can build a predictable controlled form, and you can explain when uncontrolled + refs is a pragmatic choice (not a workaround).',
        },
      ],
      frequencyRows: [
        {
          frequency: 'High',
          topics:
            'Hooks + Rules of Hooks; useEffect deps/cleanup; rendering/reconciliation/keys; state updates + batching',
        },
        {
          frequency: 'Medium',
          topics: 'Performance memoization; context pitfalls; stale-closure patterns',
        },
        {
          frequency: 'Role-dependent',
          topics:
            'Forms depth (varies a lot by product); SSR/hydration/concurrency (more common in senior/product-focused loops)',
        },
      ],
      closing:
        'Next we convert these clusters into fast trivia probes. Once those answers are clean, coding rounds feel less like surprise attacks and more like applying one known model under constraints.',
      practiceLinks: {
        trivia: {
          label: 'React interview questions',
          route: ['/coding'],
          queryParams: { tech: 'react', kind: 'trivia' },
          note: '',
        },
        coding: {
          label: 'React coding challenges',
          route: ['/coding'],
          queryParams: { tech: 'react', kind: 'coding' },
          note: '',
        },
      },
    },
    triviaSection: {
      title: 'React trivia question types',
      intro:
        'Treat React trivia as mini debugging out loud, not a fact quiz. The check is whether you can predict behavior quickly and explain trade-offs before writing code.',
      practiceLinks: {
        trivia: {
          label: 'React trivia questions',
          route: ['/coding'],
          queryParams: { tech: 'react', kind: 'trivia' },
          note: '',
        },
        coding: {
          label: 'React coding challenges',
          route: ['/coding'],
          queryParams: { tech: 'react', kind: 'coding' },
          note: '',
        },
      },
      clusters: [
        {
          title: 'A) useEffect mental model (deps, cleanup, timing)',
          why: 'Effects are where real-world bugs hide: stale values, runaway rerenders, missing cleanup, and race-prone data fetching.',
          questions: [
            'What does the dependency array mean?',
            'When does cleanup run, and with which values?',
            'Why does an effect run again even if I did not change anything?',
            'useEffect vs useLayoutEffect: what is the difference and why does it matter?',
          ],
          answerSkeleton: [
            'Effects run after commit to synchronize with systems outside React (network, timers, subscriptions, DOM APIs).',
            'When dependencies change, React runs cleanup with old values and then setup with new values.',
            'The dependency array declares which reactive values the effect reads; missing deps often cause stale values or incorrect syncing.',
          ],
          traps: [
            'Treating effects as lifecycle replacements instead of synchronization.',
            'Forgetting cleanup (leaks, duplicated listeners/subscriptions, double timers).',
            'Removing dependencies to silence reruns instead of fixing the dependency model.',
          ],
          practice:
            'Take one effect bug (stale closure, missing cleanup, or infinite loop) and explain the fix using sync → deps → cleanup.',
        },
        {
          title: 'B) Strict Mode behavior (double-invocation in development)',
          why: 'This checks whether you understand dev-time safety checks and purity expectations.',
          questions: [
            'Why does my component or effect run twice in development?',
            'Will it happen in production?',
            'What kinds of bugs is Strict Mode trying to reveal?',
          ],
          answerSkeleton: [
            'Strict Mode intentionally re-invokes certain logic in development to surface bugs from impure rendering or unsafe side effects.',
            'This is development-only behavior; avoid masking it and fix side effects so they are idempotent with correct cleanup.',
          ],
          traps: [
            'Adding run-once flags instead of fixing the side effect or cleanup flow.',
            'Confusing development checks with production behavior and debugging the wrong problem.',
          ],
          practice:
            'Write a tiny subscribe/unsubscribe effect and verify it remains correct even when setup/cleanup happens more than once.',
        },
        {
          title: 'C) State updates, batching, and “why is state not updated immediately?”',
          why: 'This reveals whether you understand React update semantics when multiple updates happen in one event.',
          questions: [
            'Why does setState not update immediately?',
            'Why do multiple setState(count + 1) calls not always increment twice?',
            'When should you use functional updates (setCount(c => c + 1))?',
          ],
          answerSkeleton: [
            'State updates are queued; each render sees a snapshot of state and props.',
            'When next state depends on previous state, use functional updates to avoid stale snapshots.',
            'Batching combines updates for efficiency; your logic should be correct regardless of batching details.',
          ],
          traps: [
            'Treating state as a mutable variable that updates instantly.',
            'Logging right after setState and assuming it reflects the next render.',
          ],
          practice:
            'Do three mini prompts where functional updates are required (counters, toggles, and queued action patterns).',
        },
        {
          title: 'D) Rendering & reconciliation (re-renders and keys)',
          why: 'Identity and reconciliation are frequent causes of state jumping between list items and unstable UI behavior.',
          questions: [
            'What causes a component to re-render?',
            'Why are keys important in lists?',
            'Why is index as key risky?',
          ],
          answerSkeleton: [
            'A component re-renders when its props, state, or context change; React builds a new tree and reconciles against the previous one.',
            'Keys preserve element identity across renders; incorrect keys can cause wrong reuse and state leakage between items.',
          ],
          traps: [
            'Assuming index as key is always safe (it breaks with reorder/insert/delete).',
            'Blaming React when the root cause is identity/key choice.',
          ],
          practice:
            'Build a reorderable list and show what breaks with index keys versus stable IDs.',
        },
        {
          title: 'E) Stale closures in callbacks and effects',
          why: 'This is one of the most common production bugs and quickly separates memorized answers from real understanding.',
          questions: [
            'What is a stale closure?',
            'Why does a callback sometimes read old state?',
            'When do refs help, and when do they become a smell?',
          ],
          answerSkeleton: [
            'Functions capture values from the render where they were created; stale behavior appears when updated values are expected without resyncing.',
            'Fix based on context: correct dependencies for effects, functional updates for transitions, or ref bridges for external callbacks.',
          ],
          traps: [
            'Randomly adding or removing dependencies without understanding synchronization behavior.',
            'Using refs everywhere to bypass state modeling.',
          ],
          practice:
            'Fix three stale-closure cases: inside setInterval, Promise callbacks, and event handlers.',
        },
        {
          title: 'F) Memoization & referential equality (React.memo, useMemo, useCallback)',
          why: 'Interviewers test optimization judgment: when memoization helps, when it adds noise, and why.',
          questions: [
            'When does useMemo help versus hurt?',
            'Why does useCallback exist?',
            'What does React.memo actually do?',
          ],
          answerSkeleton: [
            'Memoization avoids repeated work but adds overhead and depends on stable references.',
            'React.memo skips re-render when props are referentially equal; useMemo/useCallback help stabilize expensive values and callbacks when needed.',
            'Use memoization for meaningful saved work, not as a default wrapper.',
          ],
          traps: [
            'Wrapping everything in useMemo/useCallback by reflex.',
            'Assuming memoization universally prevents all re-renders.',
          ],
          practice:
            'Take one component tree and mark where memoization helps, where it is noise, and which symptom would justify it.',
        },
        {
          title: 'G) Context usage and pitfalls',
          why: 'Context is easy to overuse and can trigger broad re-renders or tangled architecture if boundaries are unclear.',
          questions: [
            'When should you use Context versus lifting state?',
            'Why can Context cause unnecessary re-renders?',
            'How would you reduce Context re-render churn?',
          ],
          answerSkeleton: [
            'Context works best for shared dependencies like theme, auth, or locale, but scope and update frequency are key.',
            'Keep providers focused, split high-churn state away from broad providers, and layer contexts by responsibility.',
          ],
          traps: [
            'Treating Context as a full replacement for all state management.',
            'Using one mega-context for everything.',
          ],
          practice:
            'Refactor a mega provider into 2–3 focused providers and explain each boundary decision.',
        },
      ],
      practiceIntro:
        'Use one repeatable loop so trivia answers become directly useful in implementation rounds:',
      practiceSteps: [
        '20 seconds: core rule',
        '20 seconds: one concrete example',
        '10 seconds: one common trap',
        '10 seconds: one trade-off',
      ],
      closing:
        'Next we map these probes to UI-building prompts. That is where React prep becomes repeatable: one mental model, applied under implementation pressure.',
    },
    codingPatternsSection: {
      title: 'React coding prompt patterns (UI-building tasks you’ll actually implement)',
      intro:
        'Coding rounds look like small UI tasks, but the score comes from state modeling, async correctness, and clean component boundaries under follow-up constraints.',
      practiceLinks: {
        coding: {
          label: 'React coding challenges',
          route: ['/coding'],
          queryParams: { tech: 'react', kind: 'coding' },
          note: '',
        },
        trivia: {
          label: 'React trivia questions',
          route: ['/coding'],
          queryParams: { tech: 'react', kind: 'trivia' },
          note: '',
        },
      },
      patterns: [
        {
          title: '1) Typeahead / Autocomplete (debounced input + async fetch)',
          promptTemplate:
            'Build an autocomplete input that fetches suggestions. Add debouncing and handle loading, error, and empty states.',
          testing:
            'State transitions, async correctness, race-condition handling, and UX clarity.',
          good:
            'Clear separation between input value and fetched results; debounced fetch; latest-request-wins behavior; explicit loading/empty/error UI.',
          pitfalls: [
            'No stale-request protection, so results jump or revert.',
            'Request per keystroke with no debounce/throttle.',
            'One tangled state object mixing input, network, and UI flags.',
          ],
        },
        {
          title: '2) Data table (sorting + filtering + pagination)',
          promptTemplate:
            'Build a table with sortable columns, filtering, and pagination.',
          testing:
            'Derived state, interaction correctness, performance instincts, and coordinated UI behavior.',
          good:
            'Source data remains immutable; sorted/filtered data is derived; pagination resets logically after filter changes; empty states and reset behavior are predictable.',
          pitfalls: [
            'Mutating the source array while sorting/filtering.',
            'Recomputing everything on every keystroke without a plan.',
            'Pagination breaks after filtering because page state is not coordinated.',
          ],
        },
        {
          title: '3) Forms (controlled inputs + validation + submit states)',
          promptTemplate:
            'Build a signup form with validation and clear error messaging.',
          testing:
            'Controlled input discipline, validation strategy, and submit-state UX.',
          good:
            'Validation rules are explicit; errors appear at the right time; pending submit state disables duplicate actions; success and failure paths are deterministic.',
          pitfalls: [
            'Validation logic tangled directly into render flow.',
            'Error state that never resets or resets at the wrong time.',
            'Submit spamming because pending state is not handled.',
          ],
        },
        {
          title: '4) Modal / Dialog (open/close + ESC + focus basics)',
          promptTemplate:
            'Build a reusable modal with open/close, ESC-to-close, and outside click behavior.',
          testing:
            'Component API design, event handling correctness, and accessibility fundamentals.',
          good:
            'Simple isOpen/onClose API; ESC behavior is reliable; overlay click behavior is intentional; cleanup is complete; focus returns to trigger as a bonus.',
          pitfalls: [
            'Event bubbling closes the modal unexpectedly.',
            'Background scroll remains enabled or gets stuck disabled.',
            'Document-level listeners without cleanup.',
          ],
        },
        {
          title: '5) Tabs / Accordion (composition + keyboard behavior)',
          promptTemplate:
            'Build tabs or an accordion, then add keyboard navigation if requested.',
          testing:
            'State modeling, component boundaries, and clean interaction rule implementation.',
          good:
            'Controlled or uncontrolled mode is intentional; active state is unambiguous; panel rendering is predictable; keyboard support is added without structural rewrites.',
          pitfalls: [
            'Overcomplicated state for a simple widget.',
            'Identity and key issues when panels are dynamic.',
            'Active state split across multiple sources.',
          ],
        },
        {
          title: '6) Progress / Timer UI (start/stop/reset + cleanup)',
          promptTemplate:
            'Build a progress bar that simulates async progress and supports start, stop, and reset.',
          testing:
            'Timer correctness, state transitions, cleanup discipline, and rapid-interaction edge cases.',
          good:
            'Clear state machine (idle → running → complete); timer cleanup is reliable; repeated start/stop is stable; reset behavior is deterministic.',
          pitfalls: [
            'Timer leaks where intervals continue running.',
            'Race-prone behavior when users spam controls.',
            'Progress updates continue after unmount.',
          ],
        },
        {
          title: '7) Infinite scroll / Feed / Job-board list (paged loading)',
          promptTemplate:
            'Build a feed or job list that loads more items via pagination or infinite scroll.',
          testing:
            'Async pagination control, in-flight guards, list stability, and performance judgment.',
          good:
            'Single in-flight request; deduped page handling; explicit end-of-results state; stable list updates; avoids unnecessary full-list rerenders.',
          pitfalls: [
            'Multiple simultaneous fetches creating duplicate pages.',
            'No guard for already-loading states.',
            'No strategy for long-list rendering cost.',
          ],
        },
        {
          title: '8) Transfer list (dual list move items + select-all)',
          promptTemplate:
            'Build a dual list where selected items move between sides, including select-all behavior.',
          testing:
            'State normalization with IDs/sets, selection correctness, and repeatable operations.',
          good:
            'Normalized state shape; selection remains correct after moves; repeated operations remain idempotent and predictable.',
          pitfalls: [
            'Selection tied to indices, which breaks after reorder or move.',
            'State shape becomes hard to reason about after a few interactions.',
            'Bugs appear after repeated move/select cycles.',
          ],
        },
        {
          title: '9) Small app prompts (Todo / Tic-tac-toe / Carousel)',
          promptTemplate:
            'Build a small app and evolve it with one or two follow-up constraints.',
          testing:
            'Core state and event handling, componentization, and ability to evolve an initial solution safely.',
          good:
            'Minimal working baseline ships quickly; state remains coherent; new constraints are integrated without architectural collapse.',
          pitfalls: [
            'Premature abstraction before baseline behavior works.',
            'Tangled state that makes every follow-up expensive.',
            'Ignoring boundaries and identity edge cases.',
          ],
        },
      ],
      rubricTitle: 'A short rubric interviewers implicitly use',
      rubricIntro:
        'Use this checklist while implementing prompts so React coding challenges stay interview-aligned:',
      rubricItems: [
        'Correctness: does it satisfy the stated requirements?',
        'State model clarity: can you explain state shape and transitions clearly?',
        'Edge cases: loading/empty/error, rapid interaction, cleanup, out-of-order async.',
        'Component boundaries: is the split easy to extend and test?',
        'Trade-offs: can you justify controlled/uncontrolled, memoization, and context decisions?',
      ],
      flowTitle: '5-step flow to run every time',
      flowIntro:
        'This sequence keeps implementation calm when prompt constraints shift mid-round:',
      flowSteps: [
        'Clarify requirements with 2–4 focused questions (data shape, UX rules, constraints, and scope).',
        'Define state shape and explicit UI states (loading/empty/error + transitions).',
        'Build the minimal correct version quickly.',
        'Harden with edge cases (cleanup, race guards, reset behavior, keyboard support if requested).',
        'Explain trade-offs and what you would improve with more time (performance, accessibility, API design, testability).',
      ],
      closing:
        'Next we cover senior-level signals: the difference between code that merely works and code a team would trust in production.',
    },
    seniorSignalsSection: {
      title: 'Senior-level signals in React interviews',
      intro:
        'At senior level, correctness is table stakes. The real score is decision quality: how you remove ambiguity, pick boundaries, handle edge cases, and communicate trade-offs while building.',
      practiceLinks: {
        coding: {
          label: 'React coding challenges',
          route: ['/coding'],
          queryParams: { tech: 'react', kind: 'coding' },
          note: '',
        },
        trivia: {
          label: 'React trivia questions',
          route: ['/coding'],
          queryParams: { tech: 'react', kind: 'trivia' },
          note: '',
        },
      },
      signals: [
        {
          title: 'Signal 1: Clarify requirements early (reduce ambiguity)',
          evaluating: 'Can you prevent scope drift and avoid building the wrong thing?',
          good: [
            'Ask 2–4 targeted questions before coding (keyboard/a11y expectations, controlled vs uncontrolled, loading/error/empty states, stale-response handling).',
            'Restate requirements in one sentence and confirm alignment quickly.',
          ],
          redFlags: [
            'Jumping into code and discovering requirements mid-implementation.',
            'Asking too many questions without converging to a concrete plan.',
          ],
        },
        {
          title: 'Signal 2: Model UI state cleanly (state-machine thinking)',
          evaluating: 'Can you build UIs that stay stable under real conditions?',
          good: [
            'Separate server state (loading/error/data) from UI interaction state (open/closed, selected item, query).',
            'Name transitions explicitly (idle → loading → success/error).',
            'Keep derived state derived instead of mutating source data.',
          ],
          redFlags: [
            'State soup: one large mutable object with unpredictable interactions.',
            'Sorting/filtering that mutates source lists and creates follow-up bugs.',
          ],
        },
        {
          title: 'Signal 3: Treat effects as synchronization (with cleanup)',
          evaluating: 'Do you avoid high-frequency React bugs like stale closures and leaking side effects?',
          good: [
            'Explain useEffect as synchronization with external systems, not lifecycle replacement.',
            'Cleanup is intentional for timers, listeners, and subscriptions.',
            'For fetch flows, mention stale responses and ignore/cancel strategy to prevent flicker.',
          ],
          redFlags: [
            'Disabling dependency lint rules instead of fixing effect design.',
            'Effects with obvious side effects but no cleanup plan.',
            'Patching Strict Mode surprises with arbitrary run-once flags.',
          ],
        },
        {
          title: 'Signal 4: Optimize with judgment (not superstition)',
          evaluating: 'Can you improve performance without reducing maintainability?',
          good: [
            'Frame memoization as work avoided and call out overhead/trade-offs.',
            'Use React.memo, useMemo, and useCallback only when there is a clear hotspot or boundary reason.',
            'Reason about cost with concrete context (large rerendering list, unstable callback props, expensive derivation).',
          ],
          redFlags: [
            'Wrapping everything in useCallback/useMemo by default.',
            'Assuming referential-equality tricks always improve runtime performance.',
          ],
        },
        {
          title: 'Signal 5: Validate and test your thinking (reliability mindset)',
          evaluating: 'Do you prove correctness under likely failure and edge paths?',
          good: [
            'Run short sanity checks aloud (empty query defaults, fetch failure state, stale response ignored).',
            'Mention targeted tests: cleanup behavior, async races, keyboard paths, controlled input validation.',
          ],
          redFlags: [
            'No validation step (“it should work”).',
            'Ignoring edge cases and relying on interviewer to reveal failures.',
          ],
        },
        {
          title: 'Signal 6: Keep code readable under pressure (production hygiene)',
          evaluating: 'Can teammates maintain and extend what you produce in interview constraints?',
          good: [
            'Use clear naming, small functions, and straightforward control flow.',
            'Prefer simple boundaries over clever hacks.',
            'Keep state close to where it is owned and consumed.',
          ],
          redFlags: [
            'Spaghetti rendering logic with deep nested conditionals.',
            'Overengineering a mini-framework for a short prompt.',
          ],
        },
        {
          title: 'Signal 7: Communicate like a teammate (not a code printer)',
          evaluating: 'Can you collaborate, align quickly, and lead the conversation while shipping?',
          good: [
            'Narrate intent briefly (“I’m modeling state this way to avoid derived-state bugs”).',
            'Call out async guards and cleanup purpose while implementing.',
            'State uncertainty clearly and verify with a small example when needed.',
          ],
          redFlags: [
            'Long silent coding stretches with no alignment checks.',
            'Over-talking without concrete implementation progress.',
          ],
        },
      ],
      scriptTitle: 'The “excellent candidate” script (reusable checklist)',
      scriptSteps: [
        'Clarify with 2–4 focused questions: constraints, UX rules, states, cancellation/races, and keyboard/a11y expectations.',
        'Propose state shape and minimal implementation plan in one short pass.',
        'Implement the minimal correct behavior first.',
        'Harden with async race guards, cleanup, reset behavior, and relevant accessibility basics.',
        'Explain trade-offs (performance, API design, testability, and next improvements).',
        'Validate with 2–3 concrete scenarios out loud.',
      ],
      closing:
        'Next we turn this rubric into a practical routine: 7/14/30-day plans plus a weak-spot decision tree.',
    },
    practicalPlanSection: {
      title: 'How to prepare for React interviews with FrontendAtlas (a practical plan)',
      opener: [
        'Run one repeatable loop every day: Topics → Trivia → UI Coding.',
        'Topics build the model, trivia sharpens explanation speed, and coding verifies whether your model survives real constraints.',
        'Keep the week simple: short warmup, one focused drill, one review note. Consistency beats random volume.',
      ],
      practiceMap: [
        {
          label: 'React trivia drill lane',
          route: ['/coding'],
          queryParams: { tech: 'react', kind: 'trivia' },
          routeUrl: '/coding?tech=react&kind=trivia',
          note:
            'Use filtered list mode to run short concept reps, then open any item into the trivia detail screen.',
          evidence:
            'frontend/src/app/app.routes.ts (routes: /coding and /:tech/trivia/:id); frontend/src/app/features/coding/coding-list/coding-list.component.ts (CodingListComponent query param seeding + linkTo); frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.ts (TriviaDetailComponent).',
        },
        {
          label: 'React UI coding workspace',
          route: ['/coding'],
          queryParams: { tech: 'react', kind: 'coding' },
          routeUrl: '/coding?tech=react&kind=coding',
          note:
            'Use this for component prompts, then open a detail page for editor + preview workflow.',
          evidence:
            'frontend/src/app/app.routes.ts (route /:tech/coding/:id); frontend/src/app/features/coding/coding-detail/coding-detail.component.ts (CodingDetailComponent); frontend/src/app/features/coding/coding-detail/coding-framework-panel/coding-framework-panel.component.html (Monaco editor + preview iframe).',
        },
        {
          label: 'Reference path and blueprint pages',
          route: ['/guides', 'framework-prep', 'react-prep-path'],
          routeUrl: '/guides/framework-prep/react-prep-path',
          note:
            'Use framework path + interview blueprint pages for sequence, scope, and trade-off language before drills.',
          evidence:
            'frontend/src/app/app.routes.ts (guides routes); frontend/src/app/features/guides/framework-prep/framework-prep-index.component.ts (FrameworkPrepIndexComponent); frontend/src/app/features/guides/playbook/playbook-index/playbook-index.component.ts (PlaybookIndexComponent).',
        },
        {
          label: 'Structured tracks (list-level planning)',
          route: ['/tracks'],
          routeUrl: '/tracks',
          note:
            'Use the list page to choose a timeline/goal structure; deep track routes remain premium-gated.',
          evidence:
            'frontend/src/app/app.routes.ts (tracks route + :slug canActivate premiumGuard); frontend/src/app/features/tracks/track-list/track-list.component.ts (TrackListComponent).',
        },
        {
          label: 'Company-set discovery (list-level preview)',
          route: ['/companies'],
          routeUrl: '/companies',
          note:
            'Use company list pages to inspect coverage and counts before targeted premium sets.',
          evidence:
            'frontend/src/app/app.routes.ts (companies route + :slug canActivate premiumGuard); frontend/src/app/features/company/company-index/company-index.component.ts (CompanyIndexComponent).',
        },
      ],
      plan7: {
        intro:
          'Week objective: stabilize the failure modes that derail React rounds first—effects, stale closures, list identity, and submit-state bugs.',
        emphasis: [
          'Days 1–2: useEffect dependencies, cleanup, and stale updates.',
          'Days 3–4: rerenders, keys, and state update semantics.',
          'Days 5–6: forms and submit-state handling.',
          'Day 7: one timed mixed session (trivia + coding + review).',
        ],
        routine45: {
          warmup:
            '10 min: run one focused trivia block on /coding?tech=react&kind=trivia&q=effect.',
          main:
            '25 min: run one UI drill from /coding?tech=react&kind=coding&q=debounced.',
          review:
            '10 min: log one bug + one prevention rule, then compare your reasoning with /guides/framework-prep/react-prep-path.',
        },
        routine90: {
          warmup:
            '15 min: run two trivia clusters on /coding?tech=react&kind=trivia&q=key and /coding?tech=react&kind=trivia&q=closure.',
          main:
            '60 min: solve two coding prompts on /coding?tech=react&kind=coding.',
          review:
            '15 min: replay the solution verbally using /guides/interview-blueprint/ui-interviews as your communication frame.',
        },
        checkpoints: [
          'You can explain dependency arrays and cleanup without hand-waving.',
          'You can implement one debounced async UI flow with stale-response guard.',
          'You can explain why key choice affects state stability in dynamic lists.',
        ],
      },
      plan14: {
        intro:
          'Two-week objective: turn patchy knowledge into repeatable execution, not just more solved questions.',
        emphasis: [
          'Week 1: effects, closures, rerenders/keys, and forms reliability.',
          'Week 2: performance judgment, context boundaries, and interview narration quality.',
        ],
        routine45: {
          warmup:
            '10 min: targeted trivia on /coding?tech=react&kind=trivia&q=memo or /coding?tech=react&kind=trivia&q=context.',
          main:
            '25 min: one focused coding prompt on /coding?tech=react&kind=coding&q=form.',
          review:
            '10 min: capture trade-offs and compare with /guides/interview-blueprint/coding-interviews.',
        },
        routine90: {
          warmup:
            '15 min: trivia sprint + one mini output prediction from /coding?tech=react&kind=trivia.',
          main:
            '60 min: one primary drill and one follow-up variant from /coding?tech=react&kind=coding.',
          review:
            '15 min: run a short retro against /guides/framework-prep/react-prep-path and /guides/interview-blueprint/javascript-interviews.',
        },
        checkpoints: [
          'You have a repeatable clarify → build → harden flow.',
          'You can debug stale closure and effect loops quickly.',
          'You can justify when memoization helps and when it adds noise.',
        ],
      },
      plan30: {
        intro:
          'Month objective: senior-ready execution under pressure with cleaner trade-offs and fewer repeated mistakes.',
        emphasis: [
          'Weeks 1–2: breadth pass across high-frequency React prompt families.',
          'Weeks 3–4: timed reps, stronger communication, and deeper edge-case discipline.',
          'Keep one running mistake log and revisit it every 3–4 sessions.',
        ],
        routine45: {
          warmup:
            '10 min: focused trivia on weakest cluster via /coding?tech=react&kind=trivia&q=<weak-topic>.',
          main:
            '25 min: one timed coding drill from /coding?tech=react&kind=coding plus one follow-up constraint.',
          review:
            '10 min: map gaps to next-day plan using /tracks and /focus-areas.',
        },
        routine90: {
          warmup:
            '15 min: two trivia passes (one concept, one trade-off) from /coding?tech=react&kind=trivia.',
          main:
            '60 min: one full drill with hardening phase from /coding?tech=react&kind=coding, then replay explanation.',
          review:
            '15 min: align next week’s focus with /companies and /tracks list coverage.',
        },
        checkpoints: [
          'You can maintain readable code and reasoning in timed sessions.',
          'You handle async race/cancellation and cleanup without patchwork.',
          'Your answers include explicit trade-offs and validation scenarios.',
        ],
      },
      decisionIntro:
        'Use this decision tree whenever a weak spot repeats for more than two sessions.',
      decisionLeaves: [
        {
          weakSpot: 'If useEffect dependencies and cleanup are weak',
          actions: [
            'Start with one effect-focused trivia sprint, then immediately do one async UI drill.',
            'Force yourself to explain cleanup timing before coding.',
          ],
          practice: [
            {
              label: 'Effect-focused trivia lane',
              route: ['/coding'],
              queryParams: { tech: 'react', kind: 'trivia', q: 'effect' },
              routeUrl: '/coding?tech=react&kind=trivia&q=effect',
              note: 'Use short explanation reps before implementation.',
              evidence:
                'frontend/src/app/features/coding/coding-list/coding-list.component.ts (CodingListComponent query + kind/tech filters); frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.ts (TriviaDetailComponent).',
            },
            {
              label: 'Async UI follow-up drill',
              route: ['/coding'],
              queryParams: { tech: 'react', kind: 'coding', q: 'debounced' },
              routeUrl: '/coding?tech=react&kind=coding&q=debounced',
              note: 'Apply stale-response and cleanup guards in code.',
              evidence:
                'frontend/src/app/features/coding/coding-detail/coding-framework-panel/coding-framework-panel.component.html (editor + preview); frontend/src/app/features/coding/coding-detail/coding-detail.component.ts (CodingDetailComponent).',
            },
          ],
        },
        {
          weakSpot: 'If rerenders and keys are weak',
          actions: [
            'Run one keys/reconciliation trivia pass, then one dynamic-list coding prompt.',
            'During review, describe identity changes explicitly.',
          ],
          practice: [
            {
              label: 'Keys and rerender trivia',
              route: ['/coding'],
              queryParams: { tech: 'react', kind: 'trivia', q: 'key' },
              routeUrl: '/coding?tech=react&kind=trivia&q=key',
              note: 'Reinforce mental model first.',
              evidence:
                'frontend/src/app/features/coding/coding-list/coding-list.component.ts (CodingListComponent query filters and trivia selection).',
            },
            {
              label: 'Dynamic list coding drill',
              route: ['/coding'],
              queryParams: { tech: 'react', kind: 'coding', q: 'list' },
              routeUrl: '/coding?tech=react&kind=coding&q=list',
              note: 'Test identity and reorder behavior.',
              evidence:
                'frontend/src/app/app.routes.ts (/:tech/coding/:id); frontend/src/app/features/coding/coding-detail/coding-detail.component.ts (CodingDetailComponent workspace).',
            },
          ],
        },
        {
          weakSpot: 'If forms are weak',
          actions: [
            'Start from focus-area routing, then switch to React form coding prompts.',
            'Use touched/submit/pending states in your review note every session.',
          ],
          practice: [
            {
              label: 'Forms focus-area jump',
              route: ['/focus-areas'],
              routeUrl: '/focus-areas (then /coding?topic=forms&reset=1)',
              note: 'Use topic-based routing into filtered question list.',
              evidence:
                'frontend/src/app/features/tracks/focus-areas/focus-areas.component.html ([queryParams] topic links); frontend/src/app/features/tracks/focus-areas/focus-areas.component.ts (FocusAreasComponent stats build).',
            },
            {
              label: 'React form coding drills',
              route: ['/coding'],
              queryParams: { tech: 'react', kind: 'coding', q: 'form' },
              routeUrl: '/coding?tech=react&kind=coding&q=form',
              note: 'Practice validation and submit-state control.',
              evidence:
                'frontend/src/app/features/coding/coding-list/coding-list.component.ts (CodingListComponent search + filter handling).',
            },
          ],
        },
        {
          weakSpot: 'If memoization and performance judgment are weak',
          actions: [
            'Run one memoization trivia block, then one list-heavy coding prompt.',
            'State one explicit “why optimize here?” sentence during review.',
          ],
          practice: [
            {
              label: 'Memoization concept drill',
              route: ['/coding'],
              queryParams: { tech: 'react', kind: 'trivia', q: 'memo' },
              routeUrl: '/coding?tech=react&kind=trivia&q=memo',
              note: 'Rehearse cost/benefit language before coding.',
              evidence:
                'frontend/src/app/features/coding/coding-list/coding-list.component.ts (CodingListComponent query + trivia filtering).',
            },
            {
              label: 'Trade-off framing reference',
              route: ['/guides', 'interview-blueprint', 'ui-interviews'],
              routeUrl: '/guides/interview-blueprint/ui-interviews',
              note: 'Use this to sharpen explanation quality after drills.',
              evidence:
                'frontend/src/app/shared/guides/guide.registry.ts (ui-interviews slug); frontend/src/app/app.routes.ts (/guides/interview-blueprint/:slug).',
            },
          ],
        },
      ],
      lastWeekRoutine: [
        'Run one daily trivia sprint on /coding?tech=react&kind=trivia.',
        'Run one daily timed coding drill on /coding?tech=react&kind=coding.',
        'End each session with one bug log entry and one prevention rule, then cross-check sequence on /guides/framework-prep/react-prep-path.',
      ],
      closing:
        'Section 7 compresses this into a final-week checklist you can run quickly.',
    },
    cheatSheetSection: {
      title: 'Last-week cheat sheet (highest ROI review)',
      opener: [
        'Final week is not for new scope. It is for reducing avoidable errors and tightening execution.',
        'Treat it as a stability sprint: repeat high-frequency prompts until your explanation and implementation choices are predictable.',
        'Run fast trivia recall first, then coding reps, then one short review note to lock the lesson.',
      ],
      clusters: [
        {
          title: 'Effects + cleanup correctness',
          review:
            'Review dependency intent, cleanup timing, and safe synchronization with external systems.',
          microDrills: [
            '60-second explanation: what triggers rerun, and when cleanup runs.',
            'Patch one effect bug by fixing dependencies instead of suppressing lint.',
            'State one stale-response guard before writing async code.',
          ],
          refs: [
            {
              id: 'react-useeffect-purpose',
              title: 'useEffect() in React: syncing with the outside world (timing, dependencies, cleanup)',
              filePath: 'frontend/src/assets/questions/react/trivia.json',
              route: ['/react', 'trivia', 'react-useeffect-purpose'],
              routeUrl: '/react/trivia/react-useeffect-purpose',
            },
            {
              id: 'react-useeffect-vs-uselayouteffect',
              title: 'What’s the difference between useEffect and useLayoutEffect? When does it matter?',
              filePath: 'frontend/src/assets/questions/react/trivia.json',
              route: ['/react', 'trivia', 'react-useeffect-vs-uselayouteffect'],
              routeUrl: '/react/trivia/react-useeffect-vs-uselayouteffect',
            },
            {
              id: 'react-debounced-search',
              title: 'React Debounced Search with Fake API',
              filePath: 'frontend/src/assets/questions/react/coding.json',
              route: ['/react', 'coding', 'react-debounced-search'],
              routeUrl: '/react/coding/react-debounced-search',
            },
          ],
        },
        {
          title: 'Stale closures + async races',
          review:
            'Review closure capture, latest-wins behavior, and predictable async UI state updates.',
          microDrills: [
            'Explain stale closure cause in one real callback scenario.',
            'Implement one latest-wins guard on a search-like flow.',
            'List one cancellation/ignore strategy before coding.',
          ],
          refs: [
            {
              id: 'react-stale-state-closures',
              title: 'Why does React sometimes show stale state in closures? How do you fix it?',
              filePath: 'frontend/src/assets/questions/react/trivia.json',
              route: ['/react', 'trivia', 'react-stale-state-closures'],
              routeUrl: '/react/trivia/react-stale-state-closures',
            },
            {
              id: 'react-autocomplete-search-starter',
              title: 'Autocomplete Search Bar (Hooks)',
              filePath: 'frontend/src/assets/questions/react/coding.json',
              route: ['/react', 'coding', 'react-autocomplete-search-starter'],
              routeUrl: '/react/coding/react-autocomplete-search-starter',
            },
            {
              id: 'react-chat-streaming-ui',
              title: 'Chat UI with Streaming Response',
              filePath: 'frontend/src/assets/questions/react/coding.json',
              route: ['/react', 'coding', 'react-chat-streaming-ui'],
              routeUrl: '/react/coding/react-chat-streaming-ui',
            },
          ],
        },
        {
          title: 'Rerenders, keys, and identity',
          review:
            'Review component rerender triggers, key identity, and list-state stability under reorder/update.',
          microDrills: [
            'Give a 60-second keys explanation with one bad-key bug example.',
            'Predict which components rerender when one list item changes.',
            'Run one list manipulation variant and verify stable behavior.',
          ],
          refs: [
            {
              id: 'react-keys-in-lists',
              title: 'What is the significance of keys in lists in React?',
              filePath: 'frontend/src/assets/questions/react/trivia.json',
              route: ['/react', 'trivia', 'react-keys-in-lists'],
              routeUrl: '/react/trivia/react-keys-in-lists',
            },
            {
              id: 'react-component-rerendering',
              title: 'When does React re-render a component, and when does it actually update the DOM?',
              filePath: 'frontend/src/assets/questions/react/trivia.json',
              route: ['/react', 'trivia', 'react-component-rerendering'],
              routeUrl: '/react/trivia/react-component-rerendering',
            },
            {
              id: 'react-transfer-list',
              title: 'React Transfer List (Select + Move Between Two Lists)',
              filePath: 'frontend/src/assets/questions/react/coding.json',
              route: ['/react', 'coding', 'react-transfer-list'],
              routeUrl: '/react/coding/react-transfer-list',
            },
          ],
        },
        {
          title: 'Forms and submit-state reliability',
          review:
            'Review controlled input patterns, validation timing, and pending-submit behavior.',
          microDrills: [
            'Explain controlled vs uncontrolled with one trade-off.',
            'Implement pending-state guard to prevent duplicate submits.',
            'Validate one error-reset edge case after correction.',
          ],
          refs: [
            {
              id: 'react-controlled-vs-uncontrolled',
              title: 'What is the difference between controlled and uncontrolled components?',
              filePath: 'frontend/src/assets/questions/react/trivia.json',
              route: ['/react', 'trivia', 'react-controlled-vs-uncontrolled'],
              routeUrl: '/react/trivia/react-controlled-vs-uncontrolled',
            },
            {
              id: 'react-contact-form-starter',
              title: 'Contact Form (Component + HTTP)',
              filePath: 'frontend/src/assets/questions/react/coding.json',
              route: ['/react', 'coding', 'react-contact-form-starter'],
              routeUrl: '/react/coding/react-contact-form-starter',
            },
            {
              id: 'react-multi-step-signup',
              title: 'Multi-step Signup Form',
              filePath: 'frontend/src/assets/questions/react/coding.json',
              route: ['/react', 'coding', 'react-multi-step-signup'],
              routeUrl: '/react/coding/react-multi-step-signup',
            },
          ],
        },
        {
          title: 'Memoization + context performance judgment',
          review:
            'Review when memoization helps, when it adds noise, and how context boundaries affect rerender cost.',
          microDrills: [
            'State one valid reason to add memoization and one reason not to.',
            'Explain useMemo vs useCallback in 60 seconds.',
            'Refactor one broad context idea into smaller responsibility boundaries.',
          ],
          refs: [
            {
              id: 'react-usememo-vs-usecallback',
              title: 'What is the difference between useMemo() and useCallback()?',
              filePath: 'frontend/src/assets/questions/react/trivia.json',
              route: ['/react', 'trivia', 'react-usememo-vs-usecallback'],
              routeUrl: '/react/trivia/react-usememo-vs-usecallback',
            },
            {
              id: 'react-context-performance-issues',
              title: 'Why does Context cause performance issues? How do you fix them?',
              filePath: 'frontend/src/assets/questions/react/trivia.json',
              route: ['/react', 'trivia', 'react-context-performance-issues'],
              routeUrl: '/react/trivia/react-context-performance-issues',
            },
            {
              id: 'react-filterable-user-list',
              title: 'React Filterable / Searchable User List',
              filePath: 'frontend/src/assets/questions/react/coding.json',
              route: ['/react', 'coding', 'react-filterable-user-list'],
              routeUrl: '/react/coding/react-filterable-user-list',
            },
          ],
        },
        {
          title: 'State transitions and deterministic UI behavior',
          review:
            'Review explicit UI states and deterministic transitions under rapid user interaction.',
          microDrills: [
            'Define state transitions before coding (idle/running/success/error if relevant).',
            'Add one guard for invalid repeated action.',
            'Run one reset-flow scenario and verify deterministic output.',
          ],
          refs: [
            {
              id: 'react-progress-bar-thresholds',
              title: 'React Progress Bar (0–100 with Threshold Colors)',
              filePath: 'frontend/src/assets/questions/react/coding.json',
              route: ['/react', 'coding', 'react-progress-bar-thresholds'],
              routeUrl: '/react/coding/react-progress-bar-thresholds',
            },
            {
              id: 'react-tabs-switcher',
              title: 'React Tabs / Multi-View Switcher',
              filePath: 'frontend/src/assets/questions/react/coding.json',
              route: ['/react', 'coding', 'react-tabs-switcher'],
              routeUrl: '/react/coding/react-tabs-switcher',
            },
            {
              id: 'react-dynamic-table',
              title: 'React Dynamic Table (Rows × Columns)',
              filePath: 'frontend/src/assets/questions/react/coding.json',
              route: ['/react', 'coding', 'react-dynamic-table'],
              routeUrl: '/react/coding/react-dynamic-table',
            },
          ],
        },
      ],
      nightlyIntro:
        'Run this loop for 5–6 nights. Keep the timer strict and write one concrete takeaway per night.',
      nightlyRoutine: {
        trivia:
          '10 min trivia sprint: one effect question + one keys/perf question from the React trivia set.',
        coding:
          '25 min coding sprint: one React UI prompt, minimal solution first, then one edge-case hardening pass.',
        review:
          '10 min review: fill the mistake log template and set tomorrow’s first drill.',
      },
      mistakeTemplate: [
        'Bug I hit:',
        'Root cause (model gap, state shape, async race, or boundary issue):',
        'Fix I used:',
        'Prevention rule for next session:',
      ],
      nightlyRefs: [
        {
          id: 'react-useeffect-purpose',
          title: 'useEffect() in React: syncing with the outside world (timing, dependencies, cleanup)',
          filePath: 'frontend/src/assets/questions/react/trivia.json',
          route: ['/react', 'trivia', 'react-useeffect-purpose'],
          routeUrl: '/react/trivia/react-useeffect-purpose',
        },
        {
          id: 'react-debounced-search',
          title: 'React Debounced Search with Fake API',
          filePath: 'frontend/src/assets/questions/react/coding.json',
          route: ['/react', 'coding', 'react-debounced-search'],
          routeUrl: '/react/coding/react-debounced-search',
        },
      ],
      predictionIntro:
        'Use existing prompts as prediction drills before coding. Say expected behavior first, then verify.',
      predictions: [
        {
          prompt:
            'Predict when effect setup and cleanup run as dependencies change, then verify with one small scenario.',
          ref: {
            id: 'react-useeffect-purpose',
            title: 'useEffect() in React: syncing with the outside world (timing, dependencies, cleanup)',
            filePath: 'frontend/src/assets/questions/react/trivia.json',
            route: ['/react', 'trivia', 'react-useeffect-purpose'],
            routeUrl: '/react/trivia/react-useeffect-purpose',
          },
        },
        {
          prompt:
            'Predict which value a delayed callback will read after rapid state updates, then explain stale-closure fix.',
          ref: {
            id: 'react-stale-state-closures',
            title: 'Why does React sometimes show stale state in closures? How do you fix it?',
            filePath: 'frontend/src/assets/questions/react/trivia.json',
            route: ['/react', 'trivia', 'react-stale-state-closures'],
            routeUrl: '/react/trivia/react-stale-state-closures',
          },
        },
        {
          prompt:
            'Predict list behavior when item order changes and keys are unstable, then verify identity bugs.',
          ref: {
            id: 'react-keys-in-lists',
            title: 'What is the significance of keys in lists in React?',
            filePath: 'frontend/src/assets/questions/react/trivia.json',
            route: ['/react', 'trivia', 'react-keys-in-lists'],
            routeUrl: '/react/trivia/react-keys-in-lists',
          },
        },
      ],
      redFlags: [
        {
          flag: 'Missing cleanup or dependency correctness in effects.',
          refs: [
            {
              id: 'react-useeffect-purpose',
              title: 'useEffect() in React: syncing with the outside world (timing, dependencies, cleanup)',
              filePath: 'frontend/src/assets/questions/react/trivia.json',
              route: ['/react', 'trivia', 'react-useeffect-purpose'],
              routeUrl: '/react/trivia/react-useeffect-purpose',
            },
            {
              id: 'react-debounced-search',
              title: 'React Debounced Search with Fake API',
              filePath: 'frontend/src/assets/questions/react/coding.json',
              route: ['/react', 'coding', 'react-debounced-search'],
              routeUrl: '/react/coding/react-debounced-search',
            },
          ],
        },
        {
          flag: 'Stale closure bugs under delayed async callbacks.',
          refs: [
            {
              id: 'react-stale-state-closures',
              title: 'Why does React sometimes show stale state in closures? How do you fix it?',
              filePath: 'frontend/src/assets/questions/react/trivia.json',
              route: ['/react', 'trivia', 'react-stale-state-closures'],
              routeUrl: '/react/trivia/react-stale-state-closures',
            },
            {
              id: 'react-autocomplete-search-starter',
              title: 'Autocomplete Search Bar (Hooks)',
              filePath: 'frontend/src/assets/questions/react/coding.json',
              route: ['/react', 'coding', 'react-autocomplete-search-starter'],
              routeUrl: '/react/coding/react-autocomplete-search-starter',
            },
          ],
        },
        {
          flag: 'Index-key and list-identity issues causing unstable UI state.',
          refs: [
            {
              id: 'react-keys-in-lists',
              title: 'What is the significance of keys in lists in React?',
              filePath: 'frontend/src/assets/questions/react/trivia.json',
              route: ['/react', 'trivia', 'react-keys-in-lists'],
              routeUrl: '/react/trivia/react-keys-in-lists',
            },
            {
              id: 'react-transfer-list',
              title: 'React Transfer List (Select + Move Between Two Lists)',
              filePath: 'frontend/src/assets/questions/react/coding.json',
              route: ['/react', 'coding', 'react-transfer-list'],
              routeUrl: '/react/coding/react-transfer-list',
            },
          ],
        },
        {
          flag: 'Form submit-state bugs (duplicate submit, stale error state).',
          refs: [
            {
              id: 'react-controlled-vs-uncontrolled',
              title: 'What is the difference between controlled and uncontrolled components?',
              filePath: 'frontend/src/assets/questions/react/trivia.json',
              route: ['/react', 'trivia', 'react-controlled-vs-uncontrolled'],
              routeUrl: '/react/trivia/react-controlled-vs-uncontrolled',
            },
            {
              id: 'react-contact-form-starter',
              title: 'Contact Form (Component + HTTP)',
              filePath: 'frontend/src/assets/questions/react/coding.json',
              route: ['/react', 'coding', 'react-contact-form-starter'],
              routeUrl: '/react/coding/react-contact-form-starter',
            },
          ],
        },
        {
          flag: 'Memoization applied by habit instead of measured need.',
          refs: [
            {
              id: 'react-usememo-vs-usecallback',
              title: 'What is the difference between useMemo() and useCallback()?',
              filePath: 'frontend/src/assets/questions/react/trivia.json',
              route: ['/react', 'trivia', 'react-usememo-vs-usecallback'],
              routeUrl: '/react/trivia/react-usememo-vs-usecallback',
            },
            {
              id: 'react-filterable-user-list',
              title: 'React Filterable / Searchable User List',
              filePath: 'frontend/src/assets/questions/react/coding.json',
              route: ['/react', 'coding', 'react-filterable-user-list'],
              routeUrl: '/react/coding/react-filterable-user-list',
            },
          ],
        },
      ],
      emergencyIntro:
        'If you only have 2 hours, run these blocks in order and skip everything else.',
      emergencyBlocks: [
        {
          duration: '35 min',
          action:
            'Effects + stale closure recap: explain model and resolve one stale callback scenario.',
          refs: [
            {
              id: 'react-useeffect-purpose',
              title: 'useEffect() in React: syncing with the outside world (timing, dependencies, cleanup)',
              filePath: 'frontend/src/assets/questions/react/trivia.json',
              route: ['/react', 'trivia', 'react-useeffect-purpose'],
              routeUrl: '/react/trivia/react-useeffect-purpose',
            },
            {
              id: 'react-stale-state-closures',
              title: 'Why does React sometimes show stale state in closures? How do you fix it?',
              filePath: 'frontend/src/assets/questions/react/trivia.json',
              route: ['/react', 'trivia', 'react-stale-state-closures'],
              routeUrl: '/react/trivia/react-stale-state-closures',
            },
          ],
        },
        {
          duration: '50 min',
          action:
            'One async UI implementation end-to-end with stale-response guard and cleanup.',
          refs: [
            {
              id: 'react-debounced-search',
              title: 'React Debounced Search with Fake API',
              filePath: 'frontend/src/assets/questions/react/coding.json',
              route: ['/react', 'coding', 'react-debounced-search'],
              routeUrl: '/react/coding/react-debounced-search',
            },
          ],
        },
        {
          duration: '35 min',
          action:
            'Fast reliability pass on forms and list identity behavior.',
          refs: [
            {
              id: 'react-contact-form-starter',
              title: 'Contact Form (Component + HTTP)',
              filePath: 'frontend/src/assets/questions/react/coding.json',
              route: ['/react', 'coding', 'react-contact-form-starter'],
              routeUrl: '/react/coding/react-contact-form-starter',
            },
            {
              id: 'react-keys-in-lists',
              title: 'What is the significance of keys in lists in React?',
              filePath: 'frontend/src/assets/questions/react/trivia.json',
              route: ['/react', 'trivia', 'react-keys-in-lists'],
              routeUrl: '/react/trivia/react-keys-in-lists',
            },
          ],
        },
      ],
      closing:
        'Next, Section 8 answers the practical FAQs that usually decide what to prioritize when interview time is tight.',
    },
    faqInitialOpenId: 'react-faq-leetcode',
    faqGroups: [
      {
        id: 'react-faq-strategy',
        title: 'Prep strategy',
        items: [
          {
            id: 'react-faq-leetcode',
            q: 'Do I need LeetCode for React interviews?',
            a: 'Not always. Many React loops prioritize UI correctness, async safety, and explanation quality over algorithm depth, even when prompts look short. If your target loop is frontend-heavy, you will usually gain more from effects/state/component drills first. <strong>Practical rule:</strong> spend most of your time on UI-linked prompt families, then add DS&A only if the process explicitly requires it. <strong>Where to practice in FrontendAtlas:</strong> <code>/react/coding/react-debounced-search</code>, <code>/react/coding/react-transfer-list</code>, <code>/react/trivia/react-useeffect-purpose</code>.',
          },
          {
            id: 'react-faq-topics-trivia-coding',
            q: 'What is the practical difference between topics, trivia, and coding prompts?',
            a: 'Topics build the model, trivia checks explanation speed, and coding checks execution under constraints. If one layer is weak, your interview output feels inconsistent even when you “know” the concept. The best pattern is to run the same concept through all three layers in one session. <strong>Where to practice in FrontendAtlas:</strong> <code>/guides/framework-prep/react-prep-path</code>, <code>/coding?tech=react&kind=trivia</code>, <code>/coding?tech=react&kind=coding</code>.',
          },
          {
            id: 'react-faq-timeline',
            q: 'How long does it realistically take to get interview-ready?',
            a: 'It depends on baseline, but consistency beats volume for React interview preparation. A focused 7-day pass can stabilize high-risk gaps, 14 days usually makes the loop repeatable, and 30 days can make execution resilient under time pressure. Treat this as planning logic, not a guarantee: if one weakness keeps repeating, extend that block first. <strong>Where to practice in FrontendAtlas:</strong> follow the Section 6/7 workflows on <code>/guides/framework-prep/react-prep-path</code> and run drills via <code>/coding?tech=react&kind=trivia</code> and <code>/coding?tech=react&kind=coding</code>.',
          },
        ],
      },
      {
        id: 'react-faq-core',
        title: 'Core React mechanics',
        items: [
          {
            id: 'react-faq-useeffect-stale',
            q: 'Why does my useEffect run too often or with stale values?',
            a: 'Usually this comes from dependency mismatch, effects doing render work, or async callbacks reading old values. Treat effects as synchronization with external systems and make cleanup explicit. If responses can return out of order, add a stale-response guard. <strong>Practical rule:</strong> before coding, say what triggers setup, what triggers cleanup, and what happens to old in-flight work. <strong>Where to practice in FrontendAtlas:</strong> <code>/react/trivia/react-useeffect-purpose</code>, <code>/react/trivia/react-stale-state-closures</code>, <code>/react/coding/react-debounced-search</code>.',
          },
          {
            id: 'react-faq-rerender-keys',
            q: 'Why do components re-render, and how do keys affect identity?',
            a: 'Components rerender when props, state, or consumed context change, but DOM work still depends on reconciliation. Keys define identity across renders; unstable keys can move state to the wrong row and create confusing bugs. That is why list prompts are high-signal in senior loops. <strong>Practical rule:</strong> if order can change, use stable IDs and test reorder/insert/delete explicitly. <strong>Where to practice in FrontendAtlas:</strong> <code>/react/trivia/react-keys-in-lists</code>, <code>/react/trivia/react-component-rerendering</code>, <code>/react/coding/react-transfer-list</code>.',
          },
          {
            id: 'react-faq-memoization',
            q: 'When should I use useMemo, useCallback, or React.memo?',
            a: 'Use memoization when it removes meaningful work, not by default. If there is no measurable rerender pain, it can add complexity with little gain. Interviewers care more about your reasoning than blanket usage. <strong>Practical rule:</strong> optimize only after you can point to a specific expensive path or unstable prop boundary. <strong>Where to practice in FrontendAtlas:</strong> <code>/react/trivia/react-usememo-vs-usecallback</code>, <code>/react/trivia/react-prevent-unnecessary-rerenders</code>, <code>/react/coding/react-filterable-user-list</code>.',
          },
          {
            id: 'react-faq-context-state',
            q: 'Context vs lifting state vs external store: how should I reason in interviews?',
            a: 'Start with ownership and update frequency, then pick the smallest boundary that keeps data flow clear. Lifted state works for local sharing, context fits cross-tree dependencies, and external stores help when update pressure and scope justify it. You are usually scored on boundary decisions, not tool loyalty. <strong>Where to practice in FrontendAtlas:</strong> <code>/react/trivia/react-context-performance-issues</code> and <code>/react/trivia/react-lifting-state-up</code>.',
          },
          {
            id: 'react-faq-forms',
            q: 'Controlled vs uncontrolled forms: what mental model should I use?',
            a: 'Controlled forms keep validation and UI behavior predictable because state is explicit. Uncontrolled inputs can still be pragmatic in narrow cases, but interview prompts usually expect clear error timing and submit-state handling. Choose based on validation complexity and interaction flow. <strong>Practical rule:</strong> if you need live validation and submit guards, start controlled. <strong>Where to practice in FrontendAtlas:</strong> <code>/react/trivia/react-controlled-vs-uncontrolled</code>, <code>/react/coding/react-contact-form-starter</code>, <code>/react/coding/react-multi-step-signup</code>.',
          },
        ],
      },
      {
        id: 'react-faq-scope',
        title: 'Interview scope and expectations',
        items: [
          {
            id: 'react-faq-class-components',
            q: 'Do I need to know class components in 2026?',
            a: 'Know enough to read and reason about class-based code, but expect most prompts to be hook-based. In practice, interviewers care more about state/effect correctness and component boundaries than lifecycle trivia. A quick class-vs-function comparison is still useful when translating older patterns. <strong>Where to practice in FrontendAtlas:</strong> <code>/react/trivia/react-functional-vs-class-components</code>.',
          },
          {
            id: 'react-faq-dom-browser',
            q: 'How much browser/DOM knowledge is expected for React roles?',
            a: 'Usually more than candidates expect, because React still runs on browser rules. Event propagation, delegation, render timing, and async UI behavior appear in many loops. You do not need every DOM API memorized, but you should predict interaction behavior and side effects clearly. <strong>Practical rule:</strong> pair one React drill with one browser-model trivia pass daily so framework and platform reasoning stay connected. <strong>Where to practice in FrontendAtlas:</strong> <code>/react/trivia/react-why-event-delegation</code>, <code>/react/coding/react-accordion-faq</code>, and broader DOM coverage via <code>/coding?tech=html&kind=trivia</code>.',
          },
        ],
      },
    ],
    mistakes: [
      'Overusing effects for derived state instead of declarative data flow.',
      'Ignoring dependency arrays and event ordering in async handlers.',
      'Skipping accessibility and keyboard behavior while building UI quickly.',
    ],
    sequence: BLUEPRINT_BASE,
    practice: [
      {
        label: 'React coding challenges',
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
    title: 'Angular Prep Path: RxJS, Architecture, Tests',
    subtitle:
      'A practical Angular prep path for RxJS decisions, architecture boundaries, and testable component design.',
    minutes: 9,
    tags: ['angular', 'interview-prep', 'rxjs', 'testing', 'architecture'],
    intro: {
      paragraphs: [
        'If you can ship Angular features at work but interviews still feel unstable, that is usually a compression issue, not a fundamentals issue.',
        'This path runs one 3-layer loop: Topics, Trivia, and Coding prompts. Topics set the model, trivia tests explanation speed, coding tests whether the model still holds when constraints shift.',
        'Example: autocomplete with mergeMap can show stale results when slower responses arrive late. switchMap is often a better fit because older requests are dropped from active flow.',
        'Target outcome: interview behavior that feels like production debugging—calm, explicit, and testable.',
      ],
      bullets: [
        'Use one repeatable answer structure: Topics → Trivia → Coding prompts',
        'Explain Angular behavior with cause-and-effect, not memorized definitions',
        'Prevent stale UI and request races with practical RxJS choices',
        'Frame trade-offs in terms interviewers care about: correctness, maintainability, and speed',
      ],
    },
    topicsSection: {
      title: 'Most asked Angular interview topics (and what they really test)',
      intro:
        'You do not need a giant checklist. You need a compact map of clusters that repeat and a clear reason each one matters in production code.',
      practiceLinks: {
        trivia: {
          label: 'Angular trivia questions',
          route: ['/coding'],
          queryParams: { tech: 'angular', kind: 'trivia' },
          note: 'Use these to sharpen concise explanations and follow-up handling.',
        },
        coding: {
          label: 'Angular coding challenges',
          route: ['/coding'],
          queryParams: { tech: 'angular', kind: 'coding' },
          note: 'Use these to apply architecture and async reasoning in practical prompts.',
        },
      },
      clusters: [
        {
          title: 'Change detection, rendering triggers, and zone behavior',
          why:
            'This is where “it works locally but the screen does not update correctly” bugs usually come from.',
          prompts: [
            'Explain Default vs OnPush and what actually triggers checks.',
            'When to use markForCheck() vs detectChanges() and why.',
            'AsyncPipe behavior: mark-for-check + auto-unsubscribe.',
            'NgZone.runOutsideAngular() and zone-pollution mitigation.',
            'What zoneless mode changes in update-notification patterns.',
          ],
          good:
            'You can name the exact trigger path, avoid random detectChanges patches, and choose an update strategy that stays predictable as the app grows.',
        },
        {
          title: 'RxJS semantics and stream architecture',
          why:
            'Bad stream design creates stale UI, duplicate requests, and hard-to-reproduce bugs under real user input.',
          prompts: [
            'Cold vs hot Observables, Subjects, and multicasting in practical terms.',
            'Operator choice: switchMap vs mergeMap vs concatMap vs exhaustMap.',
            'shareReplay caching trade-offs (lifetime, errors, refCount).',
            'Unsubscribe patterns with AsyncPipe and takeUntilDestroyed().',
            'Error handling and retry placement in the pipeline.',
          ],
          good:
            'You choose operators based on UX behavior, explain cancellation clearly, and keep streams composable instead of stacking nested subscriptions.',
        },
        {
          title: 'Dependency Injection and provider configuration',
          why:
            'Provider scope mistakes create intermittent bugs that are painful to debug later.',
          prompts: [
            'Hierarchical injectors and resolution rules.',
            'Provider recipes: useClass, useValue, useFactory, useExisting.',
            'InjectionToken usage for configuration and contracts.',
            'Multi providers, especially HTTP interceptors.',
            'Provider scope: root vs feature vs component and lazy boundaries.',
          ],
          good:
            'You can state instance lifetime and override boundaries up front, and you use tokens/providers with a clear runtime reason.',
        },
        {
          title: 'Routing architecture: guards, resolvers, lazy loading, preloading',
          why:
            'Routing questions quickly reveal whether you think in user flows or just in API names.',
          prompts: [
            'Implement guards (CanActivate, CanMatch) for auth, roles, and feature flags.',
            'Use resolvers for pre-activation data prefetch and explain trade-offs.',
            'Lazy loading patterns and fixing broken loadChildren configuration.',
            'Preloading strategies such as PreloadAllModules.',
            'Router event instrumentation and teardown without leaks.',
          ],
          good:
            'You separate auth from data prefetch, keep navigation responsive, and explain lazy loading as a user-experience decision.',
        },
        {
          title: 'Forms engineering: Reactive Forms, validation, async validators, custom controls',
          why:
            'Forms expose real engineering quality: state shape, validation timing, and reusable control behavior.',
          prompts: [
            'Reactive Forms structure with FormBuilder.',
            'FormArray for dynamic controls and list-rendering pitfalls.',
            'Custom validators and async validators with updateValueAndValidity().',
            'ControlValueAccessor for reusable controls.',
            'Validator registration via tokens such as NG_ASYNC_VALIDATORS.',
          ],
          good:
            'You treat forms as architecture, keep validation deterministic, and build CVAs that behave like first-class controls.',
        },
        {
          title: 'Performance optimization and rendering strategies',
          why:
            'This checks whether you can find the real bottleneck instead of cargo-culting optimizations.',
          prompts: [
            'trackBy/track usage to reduce DOM churn.',
            'Pure vs impure pipe trade-offs and real penalties.',
            'Skipping subtrees with OnPush + immutability.',
            'Zone-pollution diagnosis and moving work outside Angular.',
            'Performance tuning with before/after proof.',
          ],
          good:
            'You start with evidence, pick one high-impact fix, and explain the before/after impact clearly.',
        },
        {
          title: 'State management decisions and NgRx patterns',
          why:
            'This exposes whether your state model scales cleanly or collapses into hard-to-reason side effects.',
          prompts: [
            'When a service store is enough vs when NgRx is justified.',
            'Actions, reducers, selectors, and effects responsibilities.',
            'Entity adapter usage for normalized CRUD collections.',
            'Effect cancellation strategy through operator choice.',
            'State immutability and change-detection synergy.',
          ],
          good:
            'You can justify why state belongs where it does, and your async side effects stay predictable under load.',
        },
        {
          title: 'Testing and maintainability',
          why:
            'Teams want confidence you can ship safely and debug quickly when behavior changes.',
          prompts: [
            'TestBed setup patterns and when pure logic should skip TestBed.',
            'HTTP mocking with HttpTestingController (expect/flush).',
            'Router testing utilities and modern patterns.',
            'Component harnesses for user-style interaction.',
            'Testing async streams together with change detection behavior.',
          ],
          good:
            'You write behavior-driven tests that stay stable, and you can explain why a test belongs at unit or integration level.',
        },
      ],
      frequencyRows: [
        { frequency: 'High', topics: 'Change detection, rendering triggers, and zone behavior' },
        { frequency: 'High', topics: 'RxJS semantics and stream architecture' },
        { frequency: 'High', topics: 'Dependency Injection and provider configuration' },
        { frequency: 'High', topics: 'Routing architecture (guards, resolvers, lazy loading, preloading)' },
        { frequency: 'High', topics: 'Forms engineering (Reactive Forms, CVA, validators)' },
        { frequency: 'High', topics: 'Performance optimization and rendering strategies' },
        { frequency: 'High', topics: 'State management decisions and NgRx patterns' },
        { frequency: 'High', topics: 'Testing and maintainability' },
      ],
      closing:
        'If you can handle these clusters, most Angular rounds stop feeling random. Section 3 turns them into short, high-signal answers you can deliver without rambling.',
    },
    triviaSection: {
      title: 'Angular trivia question types (fast probes)',
      intro:
        'These are short model checks, not memorization checks. Think: what will happen, why it happens, and how you would fix it in 60–90 seconds.',
      practiceLinks: {
        trivia: {
          label: 'Angular trivia questions',
          route: ['/coding'],
          queryParams: { tech: 'angular', kind: 'trivia' },
          note: 'Fast explanation reps for interviewer follow-ups.',
        },
        coding: {
          label: 'Angular coding challenges',
          route: ['/coding'],
          queryParams: { tech: 'angular', kind: 'coding' },
          note: 'Implementation transfer after each trivia cluster.',
        },
      },
      clusters: [
        {
          title: 'Change detection, rendering triggers, and zone behavior',
          why:
            'Because “why did the UI not update?” and “why is this rerendering constantly?” are costly Angular production bugs.',
          questions: [
            'Why does OnPush sometimes not update when you mutate an object?',
            'When would you use markForCheck() vs detectChanges()?',
            'What does AsyncPipe do besides subscribing in the template?',
            'What is NgZone.runOutsideAngular() used for?',
            'What does zoneless mode imply for update notification?',
            'How do you reduce unnecessary change-detection work without feature regressions?',
            'Why does mutating an @Input() in a child not always rerender with OnPush?',
          ],
          answerSkeleton: [
            'OnPush checks on specific triggers: input reference changes, events, manual marking, and async emissions.',
            'Mutating keeps the same object reference, so no input-reference trigger fires.',
            'Prefer immutable updates; otherwise use markForCheck() for next cycle or detectChanges() for immediate subtree checks.',
            'AsyncPipe subscribes, pushes latest values, marks for check on emissions, and auto-unsubscribes.',
            'runOutsideAngular() avoids CD from high-frequency async noise; re-enter with NgZone.run() when UI update is required.',
            'Zoneless mode shifts toward explicit reactive notifications instead of zone-driven triggers.',
          ],
          traps: [
            'Confusing detectChanges() (immediate) with markForCheck() (scheduled).',
            'Treating AsyncPipe as automatic caching instead of stream/lifetime management.',
            'Running UI-changing logic outside zone and forgetting to re-trigger updates.',
            'Sprinkling detectChanges() everywhere instead of fixing data flow.',
            'Premature optimization that makes debugging harder.',
          ],
          practice:
            'Break one OnPush component by mutating state, then fix it with immutable updates, markForCheck, and AsyncPipe. Explain trade-offs out loud.',
          drills: [
            { label: 'OnPush real bug breakdown', route: ['/', 'angular', 'trivia', 'angular-onpush-change-detection-debugging-real-bug'], note: 'trivia' },
            { label: 'Change detection strategies', route: ['/', 'angular', 'trivia', 'angular-change-detection-strategies'], note: 'trivia' },
            { label: 'Zone.js and change detection', route: ['/', 'angular', 'trivia', 'angular-zonejs-change-detection'], note: 'trivia' },
          ],
        },
        {
          title: 'RxJS semantics and stream architecture',
          why:
            'Angular apps are async-heavy, so interviewers need to see cancellation safety, leak prevention, and predictable stream behavior.',
          questions: [
            'Cold vs hot Observables: what changes in UI behavior?',
            'When do you use switchMap vs mergeMap vs concatMap vs exhaustMap?',
            'What are the common shareReplay footguns?',
            'How do you stop RxJS memory leaks in components?',
            'What happens to an in-flight HttpClient request when you unsubscribe?',
            'How do you place error handling so one failure does not kill the whole UI?',
            'Why is nested subscribe() a smell?',
          ],
          answerSkeleton: [
            'Cold Observables rerun producers per subscription; hot Observables share producers/events.',
            'Operator choice controls cancellation and concurrency semantics.',
            'switchMap cancels previous work; mergeMap runs in parallel; concatMap queues; exhaustMap ignores while busy.',
            'shareReplay can be correct for sharing and replay, but lifetime and invalidation must be explicit.',
            'Prefer AsyncPipe or takeUntilDestroyed() for lifecycle-safe teardown.',
            'Unsubscribing HttpClient cancels in-flight requests, which matters for navigation and typeahead.',
          ],
          traps: [
            'Using mergeMap for typeahead and causing stale result races.',
            'Applying shareReplay(1) everywhere without lifetime planning.',
            'Catching errors in the wrong layer and masking failures.',
            'Nested subscribe chains that destroy cancellation clarity.',
            'Forgetting teardown in long-lived subscriptions.',
          ],
          practice:
            'Implement one search flow with switchMap, mergeMap, and concatMap variants, then compare stale-result behavior and user experience.',
          drills: [
            { label: 'Operator choice in Angular', route: ['/', 'angular', 'trivia', 'rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use'], note: 'trivia' },
            { label: 'shareReplay pitfalls', route: ['/', 'angular', 'trivia', 'rxjs-sharereplay-angular-how-it-breaks-your-app'], note: 'trivia' },
            { label: 'Unsubscribe patterns', route: ['/', 'angular', 'trivia', 'angular-prevent-memory-leaks-unsubscribe-patterns'], note: 'trivia' },
            { label: 'Debounced search drill', route: ['/', 'angular', 'coding', 'angular-debounced-search'], note: 'coding' },
          ],
        },
        {
          title: 'Dependency Injection and provider configuration',
          why:
            'Large Angular systems depend on DI boundaries; tiny provider mistakes can create “works here, breaks there” failures.',
          questions: [
            'Explain hierarchical injectors and scope in practical terms.',
            'What is an InjectionToken and when do you need it?',
            'How do useClass, useValue, useFactory, and useExisting differ?',
            'What is a multi provider and why does it matter for interceptors?',
            'How do you safely override dependencies in a feature boundary?',
            'What is injection context and why can inject() throw?',
          ],
          answerSkeleton: [
            'Angular resolves dependencies by walking injector hierarchy; scope controls lifetime and sharing.',
            'Lazy boundaries can create distinct instances based on provider placement.',
            'InjectionToken is required for config/interfaces without runtime type metadata.',
            'Provider recipe defines creation semantics (constant, factory, alias, class).',
            'Multi providers aggregate chain values, such as HTTP interceptors.',
            'inject() must run inside an Angular injection context.',
          ],
          traps: [
            'Trying to inject interfaces directly.',
            'Forgetting multi: true and replacing interceptor chains accidentally.',
            'Using mutable singleton config where scoped instances are needed.',
            'Overriding providers at root when feature scope is intended.',
            'Calling inject() from random module-level code.',
          ],
          practice:
            'Build a tiny config token plus feature override. Then break and fix an interceptor chain by toggling multi: true.',
          drills: [
            { label: 'Dependency injection fundamentals', route: ['/', 'angular', 'trivia', 'angular-dependency-injection'], note: 'trivia' },
            { label: 'Hierarchical DI bug example', route: ['/', 'angular', 'trivia', 'angular-hierarchical-dependency-injection-real-bug'], note: 'trivia' },
            { label: 'forRoot / forChild boundaries', route: ['/', 'angular', 'trivia', 'angular-forroot-forchild'], note: 'trivia' },
          ],
        },
        {
          title: 'Routing architecture: guards, resolvers, lazy loading, preloading',
          why:
            'Routing reveals whether you can structure production apps with access control, prefetch timing, and bundle strategy.',
          questions: [
            'What is the difference between guards and resolvers?',
            'When should you use CanMatch vs CanActivate?',
            'What does lazy loading buy you and when?',
            'What is preloading and how should strategy vary by network conditions?',
            'How do router events support analytics and observability safely?',
            'What lazy route configuration mistakes appear most often?',
          ],
          answerSkeleton: [
            'Guards decide if navigation may proceed; resolvers fetch data before route activation.',
            'CanMatch controls whether a route matches at all; CanActivate blocks activation after match.',
            'Lazy loading reduces initial bundle by loading feature code on demand.',
            'Preloading warms lazy chunks in the background to reduce first-navigation delay.',
            'Router events can power page-view metrics when subscriptions are lifecycle-safe.',
            'Choose resolver-wait vs component-skeleton UX intentionally based on user flow.',
          ],
          traps: [
            'Using resolvers for access control instead of guards.',
            'Preloading everything without strategy on slow connections.',
            'Mixing standalone and module routing syntax incorrectly.',
            'Eager-importing features to hide lazy route config bugs.',
            'Leaking router-event subscriptions.',
          ],
          practice:
            'Compare resolver-wait navigation against in-component skeleton loading for the same route and explain UX and complexity trade-offs.',
          drills: [
            { label: 'Angular routing fundamentals', route: ['/', 'angular', 'trivia', 'angular-routing'], note: 'trivia' },
            { label: 'Lazy loading interview patterns', route: ['/', 'angular', 'trivia', 'angular-lazy-loading'], note: 'trivia' },
            { label: 'forRoot / forChild routing boundaries', route: ['/', 'angular', 'trivia', 'angular-forroot-forchild'], note: 'trivia' },
          ],
        },
        {
          title: 'Forms engineering: Reactive Forms, validation, async validators, custom controls',
          why:
            'Enterprise Angular is form-heavy, so interviewers check correctness, scalability, and reusable-control discipline.',
          questions: [
            'Why do complex apps prefer Reactive Forms?',
            'How do async validators behave and what commonly goes wrong?',
            'What problem does ControlValueAccessor solve?',
            'FormArray vs FormGroup: when does each fit best?',
            'What does setValue vs patchValue communicate?',
            'How do you prevent validation storms and flicker?',
          ],
          answerSkeleton: [
            'Reactive Forms are model-driven, explicit, and easier to test for dynamic workflows.',
            'Async validators return Observable/Promise and move status to PENDING until completion.',
            'ControlValueAccessor lets custom inputs behave like native form controls.',
            'FormGroup maps keyed structures; FormArray maps dynamic sequences.',
            'setValue requires full shape; patchValue applies partial updates intentionally.',
            'Use debounce, distinctUntilChanged, and switchMap on valueChanges for API-backed checks.',
          ],
          traps: [
            'Treating template-driven as always wrong instead of context-driven choice.',
            'Async validators that spam backend with no debounce/cancellation.',
            'CVA implementations that ignore touched/disabled state.',
            'Forgetting multi: true when registering validator providers.',
            'Silent patchValue shape mismatches with no transform/validation.',
          ],
          practice:
            'Implement one reusable CVA input and one async uniqueness validator, then verify fast typing does not cause stale validation flicker.',
          drills: [
            { label: 'Reactive vs template-driven forms', route: ['/', 'angular', 'trivia', 'angular-template-driven-vs-reactive-forms-which-scales'], note: 'trivia' },
            { label: 'ControlValueAccessor deep dive', route: ['/', 'angular', 'trivia', 'angular-controlvalueaccessor-vs-custom-two-way-binding'], note: 'trivia' },
            { label: 'Contact Form + HTTP drill', route: ['/', 'angular', 'coding', 'angular-contact-form-starter'], note: 'coding' },
            { label: 'Multi-step Reactive Form drill', route: ['/', 'angular', 'coding', 'angular-multi-step-form-starter'], note: 'coding' },
          ],
        },
        {
          title: 'Performance optimization and rendering strategies',
          why:
            'Teams want proof you can reduce UI jank and DOM churn with measured fixes, not cargo-cult optimization.',
          questions: [
            'Why does trackBy matter and what makes a good trackBy function?',
            'Pure vs impure pipes: when does each hurt or help?',
            'Where do you investigate first when an Angular view feels janky?',
            'How do you reduce work in large lists without harming UX?',
            'What is zone pollution and how do you mitigate it?',
            'Why does immutability keep coming up with OnPush performance?',
          ],
          answerSkeleton: [
            'trackBy preserves DOM nodes by stable identity and reduces unnecessary re-creation.',
            'Impure pipes rerun frequently; pure pipes with immutable inputs are safer by default.',
            'Start from profiling CD and template evaluation before changing architecture.',
            'Use pagination/virtualization and move expensive logic out of templates.',
            'Run noisy async sources outside zone and re-enter only for required UI updates.',
            'Immutability improves reference-based change detection and limits rerender cascades.',
          ],
          traps: [
            'Using index as trackBy in reorderable lists.',
            'Using impure pipes to mask mutation issues.',
            'Blaming change detection when template work is the actual bottleneck.',
            'Sprinkling detectChanges() as a performance strategy.',
            'Micro-optimizing without before/after measurements.',
          ],
          practice:
            'Take a slow list, add stable trackBy, move heavy template logic to pure transforms, and compare before/after behavior.',
          drills: [
            { label: 'Angular performance optimization', route: ['/', 'angular', 'trivia', 'angular-performance-optimization'], note: 'trivia' },
            { label: 'trackBy correctness and cost', route: ['/', 'angular', 'trivia', 'angular-ngfor-trackby'], note: 'trivia' },
            { label: 'Paginated table drill', route: ['/', 'angular', 'coding', 'angular-pagination-table'], note: 'coding' },
          ],
        },
        {
          title: 'State management decisions and NgRx patterns',
          why:
            'State questions show whether you can scale complexity without subscription spaghetti and stale update chaos.',
          questions: [
            'When is a service-based store enough vs when is NgRx justified?',
            'Why must reducers stay pure?',
            'How do you choose effect mapping operators for cancellation behavior?',
            'How do you prevent stale responses from updating state?',
            'Why are selectors pure and what does memoization buy?',
            'How do you avoid turning NgRx into ceremony-heavy architecture?',
          ],
          answerSkeleton: [
            'Use service-level state for small/local scopes; use NgRx for large cross-feature event complexity.',
            'Reducers are pure so updates remain deterministic and replayable.',
            'Effects handle side effects, and operator choice defines cancellation/concurrency rules.',
            'Prevent stale updates with explicit cancellation and action-scoped identity.',
            'Selectors should stay pure so memoization can eliminate recomputation noise.',
            'Draw boundaries early: local UI state vs shared domain state.',
          ],
          traps: [
            'Adopting NgRx for trivial local state.',
            'Placing side effects inside reducers.',
            'Using mergeMap everywhere and creating duplicate in-flight calls.',
            'Breaking selector memoization with unstable object creation.',
            'Building one giant god-state object with weak boundaries.',
          ],
          practice:
            'Pick one feature, split local vs global state explicitly, then explain effect operator choices for cancellation and replay behavior.',
          drills: [
            { label: 'Component vs service boundaries', route: ['/', 'angular', 'trivia', 'angular-component-vs-service-responsibilities'], note: 'trivia' },
            { label: 'Observables in Angular architecture', route: ['/', 'angular', 'trivia', 'angular-observables-rxjs'], note: 'trivia' },
            { label: 'Shopping cart state drill', route: ['/', 'angular', 'coding', 'angular-shopping-cart-mini'], note: 'coding' },
          ],
        },
        {
          title: 'Testing and maintainability (unit/integration, HTTP, router)',
          why:
            'Teams hire engineers who can ship safely, isolate dependencies, and validate async UI without flaky test suites.',
          questions: [
            'When should you use TestBed vs plain unit tests?',
            'How do you mock HTTP requests in Angular tests?',
            'How do you test interceptors and routing behavior safely?',
            'How do you test async-pipe-driven components without brittle timing?',
            'What makes a test behavior-focused instead of DOM-fragile?',
          ],
          answerSkeleton: [
            'Use plain unit tests for pure logic and TestBed when DI/templates/lifecycle matter.',
            'Mock HTTP with HttpTestingController and assert request/flush behavior explicitly.',
            'Keep routing tests focused on navigation outcomes, not implementation internals.',
            'Drive async UI with controlled emissions and stabilization, not detectChanges spam.',
            'Prefer behavior assertions so markup refactors do not create false failures.',
          ],
          traps: [
            'Allowing tests to hit real network dependencies.',
            'Overusing detectChanges() to force green tests.',
            'Coupling tests tightly to DOM structure.',
            'Mocking the wrong layer and skipping request-level behavior checks.',
            'Creating tests that hide scheduling and teardown bugs.',
          ],
          practice:
            'Run one async-heavy coding prompt, then write a short behavior-focused test checklist before implementation to force maintainability thinking.',
          drills: [
            { label: 'Angular coding drills (filter: coding)', route: ['/coding'], queryParams: { tech: 'angular', kind: 'coding' }, note: 'list' },
            { label: 'Angular trivia drills (filter: trivia)', route: ['/coding'], queryParams: { tech: 'angular', kind: 'trivia' }, note: 'list' },
            { label: 'Debounced search async behavior drill', route: ['/', 'angular', 'coding', 'angular-debounced-search'], note: 'coding' },
          ],
        },
      ],
      practiceIntro:
        'Use this exact loop: explain one cluster in 60 seconds, run one implementation that stresses it, and then write one bug-prevention rule in your own words.',
      practiceSteps: [
        '20 seconds: state the core runtime rule clearly.',
        '20 seconds: give one concrete Angular scenario.',
        '10 seconds: name one common trap.',
        '10 seconds: mention one production trade-off.',
        'Then immediately solve one coding prompt that exercises the same cluster.',
      ],
      closing:
        'When these answers become automatic, coding prompts feel calmer because you are applying one model repeatedly. Section 4 maps that model to recurring Angular build tasks.',
    },
    codingPatternsSection: {
      title: 'Angular coding prompt patterns (what you actually build)',
      intro:
        'This is the work-sample side: shipping-oriented UI tasks under constraints where templates, RxJS, DI, routing, and forms have to work together.',
      practiceLinks: {
        coding: {
          label: 'Angular coding challenges',
          route: ['/coding'],
          queryParams: { tech: 'angular', kind: 'coding' },
          note: '',
        },
        trivia: {
          label: 'Angular trivia questions',
          route: ['/coding'],
          queryParams: { tech: 'angular', kind: 'trivia' },
          note: '',
        },
      },
      patterns: [
        {
          title: '1) Data table with filtering, sorting, and pagination',
          promptTemplate:
            'Implement an Angular data table from a mockup, load JSON data, add filtering/sorting/pagination, and include basic unit tests.',
          testing:
            'Component composition, template correctness, reactive derived state, performance hygiene (stable identity), and testability.',
          good:
            'Clear state model (filter/sort/page inputs), derived rows via Observable + AsyncPipe, stable row identity, and behavior-focused tests for filter/sort/page.',
          pitfalls: [
            'Mutating arrays in place, causing fragile OnPush/performance behavior later.',
            'No stable row identity, leading to avoidable DOM churn.',
            'Doing heavy filtering in template with impure pipes.',
          ],
          variation:
            'easy: local JSON + client filtering / medium: reactive filter form + debounced search + cached results / hard: server pagination + cancellation + shared caching.',
          drills: [
            { label: 'Angular paginated data table', route: ['/', 'angular', 'coding', 'angular-pagination-table'], note: 'coding' },
            { label: 'Angular dynamic table', route: ['/', 'angular', 'coding', 'angular-dynamic-table-starter'], note: 'coding' },
            { label: 'Angular filterable user list', route: ['/', 'angular', 'coding', 'angular-filterable-user-list'], note: 'coding' },
            { label: 'trackBy pitfalls in ngFor', route: ['/', 'angular', 'trivia', 'angular-ngfor-trackby'], note: 'trivia' },
          ],
        },
        {
          title: '2) “Fix this broken Angular app” debugging exercise',
          promptTemplate:
            'Open a broken Angular app with 3–5 issues. Fix each and explain symptom → root cause → solution.',
          testing:
            'Unfamiliar-code debugging speed, Angular internals reasoning (CD/DI/router/forms), and explanation quality.',
          good:
            'Each bug is isolated and documented with concise root-cause notes, and fixes avoid scope regressions or random detectChanges band-aids.',
          pitfalls: [
            'Local patching (detectChanges everywhere) instead of architecture-level fixes.',
            'Disabling tests/types instead of resolving root causes.',
            'Fixing one bug while breaking DI scope or lazy routing config.',
          ],
          variation:
            'easy: template and typing issues / medium: lazy route misconfig or missing provider registration / hard: zone pollution + OnPush update failures.',
          drills: [
            { label: 'OnPush debugging in production-like bug', route: ['/', 'angular', 'trivia', 'angular-onpush-change-detection-debugging-real-bug'], note: 'trivia' },
            { label: 'Hierarchical DI real bug', route: ['/', 'angular', 'trivia', 'angular-hierarchical-dependency-injection-real-bug'], note: 'trivia' },
            { label: 'Angular coding drills (full set)', route: ['/coding'], queryParams: { tech: 'angular', kind: 'coding' }, note: 'list' },
          ],
        },
        {
          title: '3) RxJS typeahead search with cancellation + caching',
          promptTemplate:
            'Build search with debounce, cancellation of old requests, loading/error states, and no duplicate refetch on re-subscribe.',
          testing:
            'Operator choice, cancellation semantics, duplicate-request prevention, subscription lifecycle management, and safe caching.',
          good:
            'Single valueChanges stream with debounce + switchMap, clean loading/error modeling, no nested subscriptions, and intentional cache lifetime.',
          pitfalls: [
            'Using mergeMap and introducing race-driven stale UI.',
            'Applying shareReplay blindly with no invalidation/lifetime plan.',
            'Manual subscriptions that leak or duplicate requests.',
          ],
          variation:
            'easy: debounce + switchMap / medium: cache latest result / hard: per-query Map cache + invalidation + tests.',
          drills: [
            { label: 'Angular debounced search', route: ['/', 'angular', 'coding', 'angular-debounced-search'], note: 'coding' },
            { label: 'Angular autocomplete search bar', route: ['/', 'angular', 'coding', 'angular-autocomplete-search-starter'], note: 'coding' },
            { label: 'switchMap vs mergeMap vs others', route: ['/', 'angular', 'trivia', 'rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use'], note: 'trivia' },
            { label: 'shareReplay pitfalls', route: ['/', 'angular', 'trivia', 'rxjs-sharereplay-angular-how-it-breaks-your-app'], note: 'trivia' },
            { label: 'What cancels Angular HTTP requests', route: ['/', 'angular', 'trivia', 'angular-http-what-actually-cancels-request'], note: 'trivia' },
          ],
        },
        {
          title: '4) Auth gating via route guards + HTTP interceptors',
          promptTemplate:
            'Protect routes, redirect unauthenticated users, attach token headers, and keep error-handling flow consistent.',
          testing:
            'Guard correctness, navigation flow, interceptor chain setup, DI boundaries, and routing/HTTP testability.',
          good:
            'Guards return UrlTree for redirects, interceptor chain remains intact, and flow is testable with routing + HTTP mocks.',
          pitfalls: [
            'Missing multi: true and unintentionally replacing interceptor chain.',
            'Guard logic that blocks without proper redirect behavior.',
            'Mixing UI-side effects into interceptors.',
          ],
          variation:
            'easy: CanActivate + token header / medium: refresh flow + single retry / hard: role-based trees + authorized preloading strategy.',
          drills: [
            { label: 'Angular routing fundamentals', route: ['/', 'angular', 'trivia', 'angular-routing'], note: 'trivia' },
            { label: 'Angular lazy loading', route: ['/', 'angular', 'trivia', 'angular-lazy-loading'], note: 'trivia' },
            { label: 'Angular dependency injection', route: ['/', 'angular', 'trivia', 'angular-dependency-injection'], note: 'trivia' },
            { label: 'Hierarchical DI bug case', route: ['/', 'angular', 'trivia', 'angular-hierarchical-dependency-injection-real-bug'], note: 'trivia' },
          ],
        },
        {
          title: '5) Custom form control (ControlValueAccessor) + async validation',
          promptTemplate:
            'Build a reusable search-select control with CVA, disabled support, async option loading, and uniqueness validation.',
          testing:
            'CVA protocol correctness, validator lifecycle, async cancellation behavior, and true forms integration.',
          good:
            'Correct writeValue/registerOnChange/registerOnTouched/disabled wiring; debounced async checks with cancellation; form state remains trustworthy.',
          pitfalls: [
            'Ignoring touched/disabled state and breaking parent-form behavior.',
            'Async validators that spam backend and flicker state.',
            'Value-propagation loops that cause inconsistent form updates.',
          ],
          variation:
            'easy: simple masked CVA input / medium: debounced search-select / hard: CVA + async validator token registration + tests.',
          drills: [
            { label: 'ControlValueAccessor vs custom two-way', route: ['/', 'angular', 'trivia', 'angular-controlvalueaccessor-vs-custom-two-way-binding'], note: 'trivia' },
            { label: 'Reactive vs template-driven forms', route: ['/', 'angular', 'trivia', 'angular-template-driven-vs-reactive-forms-which-scales'], note: 'trivia' },
            { label: 'Contact form + HTTP', route: ['/', 'angular', 'coding', 'angular-contact-form-starter'], note: 'coding' },
            { label: 'Multi-step signup form', route: ['/', 'angular', 'coding', 'angular-multi-step-form-starter'], note: 'coding' },
            { label: 'Invite chips input (autocomplete)', route: ['/', 'angular', 'coding', 'angular-chips-input-autocomplete'], note: 'coding' },
          ],
        },
        {
          title: '6) Lazy-loaded feature + resolver + preloading strategy',
          promptTemplate:
            'Add a lazy feature area, preload required data with a resolver, and define a preloading strategy for faster first navigation.',
          testing:
            'Correct lazy-route configuration, resolver semantics and UX trade-offs, and practical preload strategy decisions.',
          good:
            'Lazy setup works reliably, resolver only blocks for truly required data, and preloading strategy matches likely user paths.',
          pitfalls: [
            'Broken loadChildren configuration or mixed routing syntax.',
            'Resolver doing too much and freezing navigation UX.',
            'Preloading everything blindly on constrained networks.',
          ],
          variation:
            'easy: lazy module only / medium: resolver + loading UX strategy / hard: custom behavior-based preloading strategy.',
          drills: [
            { label: 'Angular lazy loading', route: ['/', 'angular', 'trivia', 'angular-lazy-loading'], note: 'trivia' },
            { label: 'Angular routing', route: ['/', 'angular', 'trivia', 'angular-routing'], note: 'trivia' },
            { label: 'forRoot / forChild boundaries', route: ['/', 'angular', 'trivia', 'angular-forroot-forchild'], note: 'trivia' },
          ],
        },
        {
          title: '7) NgRx feature slice with effects + Entity adapter',
          promptTemplate:
            'Load entities from API, store normalized data, expose derived selectors, and handle side effects with explicit operator strategy.',
          testing:
            'Reducer/selector/effect wiring, immutability discipline, normalized entity thinking, and cancellation/concurrency decisions.',
          good:
            'State boundaries are clear, entity state is normalized, selectors preserve memoization, and effect operators are chosen intentionally by flow semantics.',
          pitfalls: [
            'Denormalized nested state that makes updates fragile.',
            'Wrong flattening operators causing duplicate or ignored requests.',
            'Side effects inside reducers or unstable selector outputs.',
          ],
          variation:
            'easy: load list + render / medium: CRUD + optimistic updates / hard: cache + route-driven pagination + effect tests.',
          drills: [
            { label: 'Observables and RxJS in Angular', route: ['/', 'angular', 'trivia', 'angular-observables-rxjs'], note: 'trivia' },
            { label: 'Component vs service boundaries', route: ['/', 'angular', 'trivia', 'angular-component-vs-service-responsibilities'], note: 'trivia' },
            { label: 'Shopping cart state drill', route: ['/', 'angular', 'coding', 'angular-shopping-cart-mini'], note: 'coding' },
            { label: 'Transfer list state drill', route: ['/', 'angular', 'coding', 'angular-transfer-list'], note: 'coding' },
          ],
        },
        {
          title: '8) Tests for async + routing + HTTP-heavy components',
          promptTemplate:
            'Write tests for a component that uses HttpClient, async pipe, and navigation behavior under user actions.',
          testing:
            'HTTP mocking discipline, router-testing reliability, and understanding async + change-detection timing in tests.',
          good:
            'Tests assert request/flush behavior, verify AsyncPipe-driven rendering, simulate navigation cleanly, and avoid implementation-coupled assertions.',
          pitfalls: [
            'Brute-force fixture.detectChanges() usage to hide scheduling issues.',
            'Mocking the wrong layer and skipping request-level behavior.',
            'Brittle router timing assumptions.',
          ],
          variation:
            'easy: service + HttpTestingController / medium: component + async pipe / hard: router + guards/resolvers + interaction harness.',
          drills: [
            { label: 'Contact form + HTTP behavior', route: ['/', 'angular', 'coding', 'angular-contact-form-starter'], note: 'coding' },
            { label: 'Debounced search async behavior', route: ['/', 'angular', 'coding', 'angular-debounced-search'], note: 'coding' },
            { label: 'Angular routing fundamentals', route: ['/', 'angular', 'trivia', 'angular-routing'], note: 'trivia' },
            { label: 'HTTP cancellation semantics', route: ['/', 'angular', 'trivia', 'angular-http-what-actually-cancels-request'], note: 'trivia' },
          ],
        },
      ],
      rubricTitle: 'Short rubric: how interviewers score these',
      rubricIntro:
        'Use this as a quick self-check while building Angular prompt solutions:',
      rubricItems: [
        'Correctness: requirements are met and async timing does not produce stale UI.',
        'State design: clear inputs and derived state, minimal hidden mutation.',
        'Angular fluency: templates + AsyncPipe, DI boundaries, and router/forms APIs used intentionally.',
        'Performance hygiene: stable identity, low template computation, and controlled CD triggers.',
        'Testability: behavior-first seams with realistic HTTP/router/async checks.',
        'Communication: decisions and trade-offs explained without rambling.',
      ],
      flowTitle: 'Repeatable interview flow (reuse every time)',
      flowIntro:
        'Use this sequence to stay stable when prompt requirements keep shifting:',
      flowSteps: [
        'Clarify requirements and constraints (data source, UX, and testing expectations).',
        'Define state model: core state variables and derived state stream(s).',
        'Implement happy path first (template + component logic).',
        'Harden edge cases: loading/error/empty, cancellation, stale results, and disabled states.',
        'Explain trade-offs: OnPush/trackBy, cache lifetime, and where state should live (component/service/store).',
        'Validate with focused tests: HTTP flush behavior, router transitions, and form/control integration.',
      ],
      closing:
        'This flow works because it reduces guesswork: clear decisions first, then implementation, then hardening.',
    },
    seniorSignalsSection: {
      title: 'Senior-level signals in Angular interviews (what interviewers really evaluate)',
      intro:
        'At senior level, output alone is not enough. You are scored on how you remove ambiguity, choose boundaries, and keep behavior reliable when requirements change.',
      practiceLinks: {
        coding: {
          label: 'Angular coding challenges',
          route: ['/coding'],
          queryParams: { tech: 'angular', kind: 'coding' },
          note: '',
        },
        trivia: {
          label: 'Angular trivia questions',
          route: ['/coding'],
          queryParams: { tech: 'angular', kind: 'trivia' },
          note: '',
        },
      },
      signals: [
        {
          title: 'Signal 1: You clarify constraints before coding',
          evaluating:
            'Can you reduce ambiguity quickly and prevent expensive rewrites mid-solution?',
          good: [
            'You ask focused questions on data shape, loading/error UX, route behavior, and test expectations.',
            'You restate scope in one sentence, then commit to a minimal-first implementation plan.',
          ],
          redFlags: [
            'Coding immediately and discovering requirements late.',
            'Long requirement discussions with no concrete implementation direction.',
          ],
        },
        {
          title: 'Signal 2: You choose a change-detection strategy intentionally',
          evaluating:
            'Do you understand update triggers and performance trade-offs instead of patching symptoms?',
          good: [
            'You can explain when OnPush is safe, where immutable updates are required, and when markForCheck() is better than detectChanges().',
            'You model update triggers explicitly (input reference changes, events, async emissions) and keep template work predictable.',
          ],
          redFlags: [
            'Sprinkling detectChanges() as a default fix.',
            'Using OnPush without adapting state-update patterns and then blaming Angular for stale views.',
          ],
        },
        {
          title: 'Signal 3: You design RxJS flows with lifecycle discipline',
          evaluating:
            'Can you prevent stale UI, duplicate requests, and subscription leaks under real interaction load?',
          good: [
            'You choose mapping operators by behavior (cancel, queue, parallel, ignore-while-busy) and explain why.',
            'You use AsyncPipe or takeUntilDestroyed() for teardown and keep side effects out of nested subscribe chains.',
          ],
          redFlags: [
            'mergeMap-by-default causing race-driven stale UI.',
            'Manual subscriptions with no teardown strategy.',
          ],
        },
        {
          title: 'Signal 4: You control DI scope and provider boundaries',
          evaluating:
            'Can you predict service lifetime, override behavior, and interceptor chaining correctly?',
          good: [
            'You place providers intentionally (root vs feature vs component) and explain lazy-boundary implications.',
            'You use InjectionToken for configuration, and keep interceptor registration safe with multi providers.',
          ],
          redFlags: [
            'Accidentally replacing interceptor chains by misconfigured providers.',
            'Overriding dependencies at overly broad scope and creating cross-feature side effects.',
          ],
        },
        {
          title: 'Signal 5: You keep router flow reliable and user-centered',
          evaluating:
            'Can you design navigation behavior that is both correct and predictable for users?',
          good: [
            'You separate authorization (guards) from prefetching concerns (resolvers) and justify that split.',
            'You explain lazy-loading and preloading decisions using likely navigation paths, not generic rules.',
          ],
          redFlags: [
            'Using resolvers for access control.',
            'Blocking navigation without clear fallback/redirect behavior.',
          ],
        },
        {
          title: 'Signal 6: You treat forms as architecture, not template glue',
          evaluating:
            'Can you build scalable, testable forms with reusable controls and stable validation behavior?',
          good: [
            'You model forms with clear structure (FormGroup/FormArray), keep validation explicit, and prevent async validation storms.',
            'Your CVA implementations correctly handle writeValue, change/touched callbacks, and disabled state propagation.',
          ],
          redFlags: [
            'Validation logic scattered across template conditionals.',
            'Custom controls that look correct visually but break parent-form state semantics.',
          ],
        },
        {
          title: 'Signal 7: You justify state-management level and NgRx trade-offs',
          evaluating:
            'Do you pick the smallest state model that remains predictable as complexity grows?',
          good: [
            'You separate local UI state from shared domain state and justify when a service store is enough vs when NgRx is worth the overhead.',
            'You keep reducers pure, selectors memoization-friendly, and effects operator choices aligned with cancellation needs.',
          ],
          redFlags: [
            'NgRx for trivial local state or one giant global state without boundaries.',
            'Effect/reducer responsibilities mixed, causing hidden side effects and hard-to-debug flows.',
          ],
        },
      ],
      scriptTitle: 'Excellent candidate checklist (reusable script)',
      scriptSteps: [
        'Clarify requirements and constraints in 2–4 precise questions.',
        'Propose a minimal architecture: component boundaries, state location, and route/data flow.',
        'Implement happy path first with explicit change-detection and stream strategy.',
        'Harden edge cases: loading/error/empty, cancellation, cleanup, disabled states.',
        'Explain trade-offs: OnPush vs default, service store vs NgRx, resolver vs in-component loading.',
        'Validate behavior with focused checks (HTTP request flow, router transition, form state semantics).',
      ],
      closing:
        'Apply this rubric consistently and your answers sound like production decisions, not isolated snippets.',
    },
    practicalPlanSection: {
      title: 'How to prepare for Angular interviews with FrontendAtlas (a practical plan)',
      opener: [
        'Run prep with one repeatable loop: Topics → Trivia → Coding prompts.',
        'Topics build the model (CD, RxJS, DI, routing, forms, state boundaries); trivia sharpens explanation speed.',
        'Coding prompts pressure-test the same model under interview constraints. End each session with one bug-prevention rule.',
      ],
      practiceMap: [
        {
          label: 'Angular trivia drill lane',
          route: ['/coding'],
          queryParams: { tech: 'angular', kind: 'trivia' },
          routeUrl: '/coding?tech=angular&kind=trivia',
          note:
            'Run short explanation reps, then open a detail page for structured answer practice.',
          evidence:
            'frontend/src/app/app.routes.ts (routes: /coding and /:tech/trivia/:id); frontend/src/app/features/coding/coding-list/coding-list.component.ts (CodingListComponent query-parameter filtering); frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.ts (TriviaDetailComponent).',
        },
        {
          label: 'Angular coding drill lane',
          route: ['/coding'],
          queryParams: { tech: 'angular', kind: 'coding' },
          routeUrl: '/coding?tech=angular&kind=coding',
          note:
            'Solve one implementation prompt, then open detail for editor + preview execution.',
          evidence:
            'frontend/src/app/app.routes.ts (route /:tech/coding/:id); frontend/src/app/features/coding/coding-detail/coding-detail.component.ts (CodingDetailComponent); frontend/src/app/features/coding/coding-detail/coding-framework-panel/coding-framework-panel.ts (CodingFrameworkPanelComponent editor/preview shell).',
        },
        {
          label: 'Angular framework path reference',
          route: ['/guides', 'framework-prep', 'angular-prep-path'],
          routeUrl: '/guides/framework-prep/angular-prep-path',
          note:
            'Use this page as your sequence and language baseline before timed drills.',
          evidence:
            'frontend/src/app/app.routes.ts (route /guides/framework-prep/:slug); frontend/src/app/features/guides/framework-prep/framework-prep-index.component.ts (FrameworkPrepIndexComponent); frontend/src/app/features/guides/playbook/framework-prep-path-article.component.ts (FrameworkPrepPathArticleComponent).',
        },
        {
          label: 'Interview blueprint references',
          route: ['/guides', 'interview-blueprint'],
          routeUrl: '/guides/interview-blueprint',
          note:
            'Use coding/ui/system blueprint pages to tighten explanation quality and interview flow.',
          evidence:
            'frontend/src/app/app.routes.ts (routes /guides/interview-blueprint and /guides/interview-blueprint/:slug); frontend/src/app/features/guides/playbook/playbook-index/playbook-index.component.ts (PlaybookIndexComponent); frontend/src/app/shared/guides/guide.registry.ts (guide slugs + metadata).',
        },
        {
          label: 'Tracks list for structured sequencing',
          route: ['/tracks'],
          routeUrl: '/tracks',
          note:
            'Use list-level track summaries to pick a prep structure before deep drill sessions.',
          evidence:
            'frontend/src/app/app.routes.ts (route /tracks and guarded /tracks/:slug); frontend/src/app/features/tracks/track-list/track-list.component.ts (TrackListComponent).',
        },
        {
          label: 'Company list for targeted practice planning',
          route: ['/companies'],
          routeUrl: '/companies',
          note:
            'Use company counts and previews to plan where to shift focused practice later.',
          evidence:
            'frontend/src/app/app.routes.ts (route /companies and guarded /companies/:slug); frontend/src/app/features/company/company-index/company-index.component.ts (CompanyIndexComponent).',
        },
      ],
      plan7: {
        intro:
          'Week objective: stabilize the highest-risk Angular gaps quickly—change detection, async flow correctness, and forms reliability.',
        emphasis: [
          'Days 1–2: change detection triggers, OnPush updates, and AsyncPipe behavior.',
          'Days 3–4: RxJS operator choice and cancellation behavior under rapid input.',
          'Days 5–6: forms validation flow, disabled states, and submit guards.',
          'Day 7: one mixed timed rep (trivia + coding + review note).',
        ],
        routine45: {
          warmup:
            '10 min: one focused trivia block on /coding?tech=angular&kind=trivia&q=change.',
          main:
            '25 min: one coding drill from /coding?tech=angular&kind=coding&q=search or /coding?tech=angular&kind=coding&q=form.',
          review:
            '10 min: log one failure pattern, then compare your sequence with /guides/framework-prep/angular-prep-path.',
        },
        routine90: {
          warmup:
            '15 min: run two trivia passes on /coding?tech=angular&kind=trivia&q=rxjs and /coding?tech=angular&kind=trivia&q=form.',
          main:
            '60 min: solve two coding drills from /coding?tech=angular&kind=coding, with one hardening pass per drill.',
          review:
            '15 min: replay decisions against /guides/interview-blueprint/coding-interviews.',
        },
        checkpoints: [
          'You can explain OnPush update triggers and when to use markForCheck() clearly.',
          'You can pick a flattening operator based on cancellation/concurrency requirements.',
          'You can describe one complete form flow with pending, error, and success states.',
        ],
      },
      plan14: {
        intro:
          'Two-week objective: turn isolated knowledge into consistent delivery across explanation and implementation.',
        emphasis: [
          'Week 1: deepen change detection, RxJS behavior, DI boundaries, and routing decisions.',
          'Week 2: reinforce forms, state architecture trade-offs, performance checks, and testability language.',
        ],
        routine45: {
          warmup:
            '10 min: targeted trivia query on /coding?tech=angular&kind=trivia&q=dependency or /coding?tech=angular&kind=trivia&q=routing.',
          main:
            '25 min: one focused implementation drill from /coding?tech=angular&kind=coding&q=list or /coding?tech=angular&kind=coding&q=cart.',
          review:
            '10 min: map one weak area to next-day plan using /tracks and /focus-areas.',
        },
        routine90: {
          warmup:
            '15 min: run two trivia clusters from /coding?tech=angular&kind=trivia (one model question + one trade-off question).',
          main:
            '60 min: one primary coding prompt and one variant from /coding?tech=angular&kind=coding.',
          review:
            '15 min: connect today’s misses to /guides/interview-blueprint and /guides/framework-prep/angular-prep-path.',
        },
        checkpoints: [
          'You can run clarify → model → implement → harden without skipping steps.',
          'You can justify DI scope and routing decisions with concrete trade-offs.',
          'You can identify whether a bug is stream logic, state model, or template/render trigger.',
        ],
      },
      plan30: {
        intro:
          'Month objective: senior-level consistency under time pressure with predictable architecture decisions and fewer repeated mistakes.',
        emphasis: [
          'Weeks 1–2: broad pass across high-frequency Angular clusters (CD, RxJS, DI, routing, forms).',
          'Weeks 3–4: timed reps with explicit edge-case hardening and communication quality.',
          'Keep one running mistake log and revisit it every 3–4 sessions.',
        ],
        routine45: {
          warmup:
            '10 min: weakest-cluster trivia on /coding?tech=angular&kind=trivia&q=<weak-topic>.',
          main:
            '25 min: one timed coding drill from /coding?tech=angular&kind=coding with one additional requirement after first pass.',
          review:
            '10 min: pick next focus using /companies or /tracks list-level signals.',
        },
        routine90: {
          warmup:
            '15 min: two short trivia passes and one output-prediction exercise on /coding?tech=angular&kind=trivia.',
          main:
            '60 min: one full prompt cycle from /coding?tech=angular&kind=coding including hardening + retest.',
          review:
            '15 min: compare your answer framing against /guides/interview-blueprint/coding-interviews and /guides/interview-blueprint/ui-interviews.',
        },
        checkpoints: [
          'You can keep code readable while handling async edge cases and cleanup.',
          'You can defend state-management level (component/service/store) with concrete constraints.',
          'You can explain performance and testing trade-offs without generic filler.',
        ],
      },
      decisionIntro:
        'Use this decision tree when the same weakness repeats in practice.',
      decisionLeaves: [
        {
          weakSpot: 'If change detection behavior is weak',
          actions: [
            'Start with one OnPush-focused trivia rep before coding.',
            'State update trigger rules out loud before implementing any fix.',
          ],
          practice: [
            {
              label: 'Change-detection trivia filter',
              route: ['/coding'],
              queryParams: { tech: 'angular', kind: 'trivia', q: 'change detection' },
              routeUrl: '/coding?tech=angular&kind=trivia&q=change+detection',
              note: 'Target trigger/OnPush reasoning first.',
              evidence:
                'frontend/src/app/features/coding/coding-list/coding-list.component.ts (query filtering); frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.ts (detail explanation view).',
            },
            {
              label: 'OnPush coding reinforcement',
              route: ['/coding'],
              queryParams: { tech: 'angular', kind: 'coding', q: 'search' },
              routeUrl: '/coding?tech=angular&kind=coding&q=search',
              note: 'Apply update-trigger discipline in implementation.',
              evidence:
                'frontend/src/app/features/coding/coding-detail/coding-detail.component.ts (coding detail workflow); frontend/src/app/features/coding/coding-detail/coding-framework-panel/coding-framework-panel.ts (preview and execution loop).',
            },
          ],
        },
        {
          weakSpot: 'If RxJS cancellation and operator choice are weak',
          actions: [
            'Run one operator-selection trivia block, then one typeahead-style coding drill.',
            'During review, explicitly justify why your chosen operator matches the UX requirement.',
          ],
          practice: [
            {
              label: 'RxJS operator trivia filter',
              route: ['/coding'],
              queryParams: { tech: 'angular', kind: 'trivia', q: 'rxjs' },
              routeUrl: '/coding?tech=angular&kind=trivia&q=rxjs',
              note: 'Reinforce cancellation/concurrency semantics.',
              evidence:
                'frontend/src/app/features/coding/coding-list/coding-list.component.ts (search + kind/tech filters); frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.ts (trivia detail rendering).',
            },
            {
              label: 'Async flow coding drill',
              route: ['/coding'],
              queryParams: { tech: 'angular', kind: 'coding', q: 'debounced' },
              routeUrl: '/coding?tech=angular&kind=coding&q=debounced',
              note: 'Practice stale-response guard and lifecycle cleanup.',
              evidence:
                'frontend/src/app/features/coding/coding-detail/coding-detail.component.ts (coding prompt route handling); frontend/src/app/features/coding/coding-detail/coding-framework-panel/coding-framework-panel.ts (implementation panel).',
            },
          ],
        },
        {
          weakSpot: 'If Dependency Injection scope/providers are weak',
          actions: [
            'Review provider scope and token patterns before coding.',
            'After each DI-related answer, state instance lifetime and override boundary explicitly.',
          ],
          practice: [
            {
              label: 'DI-focused trivia filter',
              route: ['/coding'],
              queryParams: { tech: 'angular', kind: 'trivia', q: 'dependency injection' },
              routeUrl: '/coding?tech=angular&kind=trivia&q=dependency+injection',
              note: 'Rehearse injector resolution and provider recipe trade-offs.',
              evidence:
                'frontend/src/app/features/coding/coding-list/coding-list.component.ts (keyword filter); frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.ts (concept drill details).',
            },
            {
              label: 'Angular framework path section reference',
              route: ['/guides', 'framework-prep', 'angular-prep-path'],
              routeUrl: '/guides/framework-prep/angular-prep-path',
              note: 'Use Sections 2–5 as architecture-review context before drills.',
              evidence:
                'frontend/src/app/features/guides/playbook/framework-prep-path-article.component.ts (Angular section content); frontend/src/app/app.routes.ts (framework-prep route).',
            },
          ],
        },
        {
          weakSpot: 'If routing flow (guards/resolvers/lazy loading) is weak',
          actions: [
            'Train guard-vs-resolver reasoning separately from coding details.',
            'Tie every routing decision to user navigation behavior and fallback path.',
          ],
          practice: [
            {
              label: 'Routing trivia filter',
              route: ['/coding'],
              queryParams: { tech: 'angular', kind: 'trivia', q: 'routing' },
              routeUrl: '/coding?tech=angular&kind=trivia&q=routing',
              note: 'Drill route matching, guard behavior, and lazy-loading vocabulary.',
              evidence:
                'frontend/src/app/features/coding/coding-list/coding-list.component.ts (trivia filter lane); frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.ts (answer detail).',
            },
            {
              label: 'Routing communication baseline',
              route: ['/guides', 'interview-blueprint', 'coding-interviews'],
              routeUrl: '/guides/interview-blueprint/coding-interviews',
              note: 'Use this page to tighten requirement clarification and flow explanation.',
              evidence:
                'frontend/src/app/shared/guides/guide.registry.ts (coding-interviews entry); frontend/src/app/app.routes.ts (/guides/interview-blueprint/:slug).',
            },
          ],
        },
        {
          weakSpot: 'If forms architecture and validation flow are weak',
          actions: [
            'Start with one form-trivia explanation, then switch directly to one form coding prompt.',
            'Always describe touched/pending/error state transitions before implementing.',
          ],
          practice: [
            {
              label: 'Forms trivia filter',
              route: ['/coding'],
              queryParams: { tech: 'angular', kind: 'trivia', q: 'form' },
              routeUrl: '/coding?tech=angular&kind=trivia&q=form',
              note: 'Reinforce Reactive Forms, CVA, and validator lifecycle language.',
              evidence:
                'frontend/src/app/features/coding/coding-list/coding-list.component.ts (searchable trivia list); frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.ts (trivia detail).',
            },
            {
              label: 'Forms coding filter',
              route: ['/coding'],
              queryParams: { tech: 'angular', kind: 'coding', q: 'form' },
              routeUrl: '/coding?tech=angular&kind=coding&q=form',
              note: 'Practice validation timing, pending submit state, and control integration.',
              evidence:
                'frontend/src/app/features/coding/coding-detail/coding-detail.component.ts (coding detail state); frontend/src/app/features/coding/coding-detail/coding-framework-panel/coding-framework-panel.ts (interactive coding workflow).',
            },
          ],
        },
        {
          weakSpot: 'If NgRx/state-level trade-offs are weak',
          actions: [
            'Explain local vs shared state boundary decisions before touching code.',
            'For async state updates, always name the cancellation/concurrency rule in one sentence.',
          ],
          practice: [
            {
              label: 'State-management trivia filter',
              route: ['/coding'],
              queryParams: { tech: 'angular', kind: 'trivia', q: 'ngrx' },
              routeUrl: '/coding?tech=angular&kind=trivia&q=ngrx',
              note: 'Train reducer/effect/selector responsibility boundaries.',
              evidence:
                'frontend/src/app/features/coding/coding-list/coding-list.component.ts (query filter support); frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.ts (detail page).',
            },
            {
              label: 'State-oriented coding filter',
              route: ['/coding'],
              queryParams: { tech: 'angular', kind: 'coding', q: 'cart' },
              routeUrl: '/coding?tech=angular&kind=coding&q=cart',
              note: 'Use list/state prompts to practice predictable state transitions.',
              evidence:
                'frontend/src/app/features/coding/coding-detail/coding-detail.component.ts (coding route handling); frontend/src/app/features/coding/coding-detail/coding-framework-panel/coding-framework-panel.ts (execution panel).',
            },
          ],
        },
        {
          weakSpot: 'If performance and testing confidence are weak',
          actions: [
            'Pair one performance-trivia prompt with one testability discussion every session.',
            'During review, state one measurable check and one behavior-focused test case.',
          ],
          practice: [
            {
              label: 'Performance-focused trivia filter',
              route: ['/coding'],
              queryParams: { tech: 'angular', kind: 'trivia', q: 'performance' },
              routeUrl: '/coding?tech=angular&kind=trivia&q=performance',
              note: 'Focus on CD churn, trackBy identity, and practical optimization language.',
              evidence:
                'frontend/src/app/features/coding/coding-list/coding-list.component.ts (filter + search); frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.ts (detail explanations).',
            },
            {
              label: 'Testing-focused trivia filter',
              route: ['/coding'],
              queryParams: { tech: 'angular', kind: 'trivia', q: 'test' },
              routeUrl: '/coding?tech=angular&kind=trivia&q=test',
              note: 'Rehearse HttpTestingController/router-testing reasoning and async test stability.',
              evidence:
                'frontend/src/app/features/coding/coding-list/coding-list.component.ts (keyword filtering); frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.ts (practice details).',
            },
          ],
        },
      ],
      lastWeekRoutine: [
        'Run one daily trivia sprint from /coding?tech=angular&kind=trivia.',
        'Run one daily timed coding drill from /coding?tech=angular&kind=coding.',
        'End each session with one “symptom → root cause → prevention” note, then compare with /guides/framework-prep/angular-prep-path.',
        'Every 2–3 days, rebalance priorities using /tracks and /companies list pages.',
      ],
      closing:
        'Section 7 compresses this into a last-week checklist you can run before interviews.',
      evidenceIndex: [
        {
          label: 'Framework-filtered coding/trivia list',
          route: ['/coding'],
          queryParams: { tech: 'angular', kind: 'coding' },
          routeUrl: '/coding?tech=angular&kind=coding (or kind=trivia)',
          note: '',
          evidence:
            'frontend/src/app/app.routes.ts (route /coding); frontend/src/app/features/coding/coding-list/coding-list.component.ts (tech/kind/search query filtering).',
        },
        {
          label: 'Angular coding detail workspace',
          route: ['/', 'angular', 'coding', 'angular-debounced-search'],
          routeUrl: '/angular/coding/angular-debounced-search',
          note: '',
          evidence:
            'frontend/src/app/app.routes.ts (route /:tech/coding/:id); frontend/src/app/features/coding/coding-detail/coding-detail.component.ts (CodingDetailComponent); frontend/src/app/features/coding/coding-detail/coding-framework-panel/coding-framework-panel.ts (editor + preview panel).',
        },
        {
          label: 'Angular trivia detail page',
          route: ['/', 'angular', 'trivia', 'angular-onpush-change-detection-debugging-real-bug'],
          routeUrl: '/angular/trivia/angular-onpush-change-detection-debugging-real-bug',
          note: '',
          evidence:
            'frontend/src/app/app.routes.ts (route /:tech/trivia/:id); frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.ts (TriviaDetailComponent).',
        },
        {
          label: 'Framework prep guide host',
          route: ['/guides', 'framework-prep', 'angular-prep-path'],
          routeUrl: '/guides/framework-prep/angular-prep-path',
          note: '',
          evidence:
            'frontend/src/app/app.routes.ts (route /guides/framework-prep/:slug); frontend/src/app/features/guides/playbook/playbook-host.component.ts (PlaybookHostComponent); frontend/src/app/features/guides/playbook/framework-prep-path-article.component.ts (FrameworkPrepPathArticleComponent).',
        },
        {
          label: 'Interview blueprint index/detail',
          route: ['/guides', 'interview-blueprint'],
          routeUrl: '/guides/interview-blueprint',
          note: '',
          evidence:
            'frontend/src/app/app.routes.ts (routes /guides/interview-blueprint and /guides/interview-blueprint/:slug); frontend/src/app/features/guides/playbook/playbook-index/playbook-index.component.ts (PlaybookIndexComponent); frontend/src/app/shared/guides/guide.registry.ts (guide entries).',
        },
        {
          label: 'Tracks and companies list pages',
          route: ['/tracks'],
          routeUrl: '/tracks and /companies',
          note: '',
          evidence:
            'frontend/src/app/app.routes.ts (routes /tracks, /companies); frontend/src/app/features/tracks/track-list/track-list.component.ts (TrackListComponent); frontend/src/app/features/company/company-index/company-index.component.ts (CompanyIndexComponent).',
        },
      ],
    },
    cheatSheetSection: {
      title: 'Last-week cheat sheet (highest ROI review)',
      opener: [
        'Final week should reduce repeated mistakes, not add new scope.',
        'Use a stability sprint: short reps, predictable routine, explicit review notes.',
        'Run trivia for explanation speed and coding drills for implementation reliability in the same daily loop.',
      ],
      clusters: [
        {
          title: 'Change detection and OnPush reliability',
          review:
            'Review trigger rules, immutable update expectations, and practical fixes when views do not update as expected.',
          microDrills: [
            'Explain OnPush trigger paths in 60 seconds (input reference, events, async emissions, manual mark).',
            'Diagnose one “view did not update” symptom and name the root cause before proposing a fix.',
            'State one case where markForCheck() is safer than detectChanges() in shared components.',
          ],
          refs: [
            {
              id: 'angular-change-detection-strategies',
              title: 'What are change detection strategies in Angular, and how do they work?',
              filePath: 'frontend/src/assets/questions/angular/trivia.json',
              route: ['/', 'angular', 'trivia', 'angular-change-detection-strategies'],
              routeUrl: '/angular/trivia/angular-change-detection-strategies',
            },
            {
              id: 'angular-onpush-change-detection-debugging-real-bug',
              title: 'Explain OnPush Change Detection in Angular Like You’re Debugging a Real Production Bug',
              filePath: 'frontend/src/assets/questions/angular/trivia.json',
              route: ['/', 'angular', 'trivia', 'angular-onpush-change-detection-debugging-real-bug'],
              routeUrl: '/angular/trivia/angular-onpush-change-detection-debugging-real-bug',
            },
            {
              id: 'angular-zonejs-change-detection',
              title: 'How does Angular’s Zone.js help in change detection?',
              filePath: 'frontend/src/assets/questions/angular/trivia.json',
              route: ['/', 'angular', 'trivia', 'angular-zonejs-change-detection'],
              routeUrl: '/angular/trivia/angular-zonejs-change-detection',
            },
            {
              id: 'angular-filterable-user-list',
              title: 'Angular Filterable / Searchable User List',
              filePath: 'frontend/src/assets/questions/angular/coding.json',
              route: ['/', 'angular', 'coding', 'angular-filterable-user-list'],
              routeUrl: '/angular/coding/angular-filterable-user-list',
            },
          ],
        },
        {
          title: 'RxJS cancellation, concurrency, and request control',
          review:
            'Review operator selection, teardown behavior, and stale-response handling in interactive UIs.',
          microDrills: [
            'Given one scenario, choose switchMap/mergeMap/concatMap/exhaustMap and justify in one sentence.',
            'Describe what actually cancels an HttpClient request and when that matters for UX.',
            'Patch one stale-result bug by changing operator strategy and stream boundaries.',
          ],
          refs: [
            {
              id: 'rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use',
              title: 'switchMap vs mergeMap vs exhaustMap vs concatMap: When Would You Use Each in Angular?',
              filePath: 'frontend/src/assets/questions/angular/trivia.json',
              route: ['/', 'angular', 'trivia', 'rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use'],
              routeUrl: '/angular/trivia/rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use',
            },
            {
              id: 'angular-prevent-memory-leaks-unsubscribe-patterns',
              title: 'How Do You Prevent Memory Leaks in Angular? All Real-World Unsubscribe Patterns Explained',
              filePath: 'frontend/src/assets/questions/angular/trivia.json',
              route: ['/', 'angular', 'trivia', 'angular-prevent-memory-leaks-unsubscribe-patterns'],
              routeUrl: '/angular/trivia/angular-prevent-memory-leaks-unsubscribe-patterns',
            },
            {
              id: 'angular-http-what-actually-cancels-request',
              title: 'What Actually Cancels an HTTP Request in Angular?',
              filePath: 'frontend/src/assets/questions/angular/trivia.json',
              route: ['/', 'angular', 'trivia', 'angular-http-what-actually-cancels-request'],
              routeUrl: '/angular/trivia/angular-http-what-actually-cancels-request',
            },
            {
              id: 'angular-debounced-search',
              title: 'Angular Debounced Search with Fake API (RxJS)',
              filePath: 'frontend/src/assets/questions/angular/coding.json',
              route: ['/', 'angular', 'coding', 'angular-debounced-search'],
              routeUrl: '/angular/coding/angular-debounced-search',
            },
          ],
        },
        {
          title: 'Forms architecture, CVA, and validation flow',
          review:
            'Review form-model structure, CVA contract behavior, and async validation lifecycle under typing pressure.',
          microDrills: [
            'Explain when Reactive Forms should be preferred and one case where template-driven is acceptable.',
            'List CVA responsibilities in order: writeValue, change callback, touched callback, disabled state.',
            'Name one anti-pattern that causes validation storms and how to prevent it.',
          ],
          refs: [
            {
              id: 'angular-template-driven-vs-reactive-forms-which-scales',
              title: 'Template-Driven vs Reactive Forms in Angular: Which One Scales and Why?',
              filePath: 'frontend/src/assets/questions/angular/trivia.json',
              route: ['/', 'angular', 'trivia', 'angular-template-driven-vs-reactive-forms-which-scales'],
              routeUrl: '/angular/trivia/angular-template-driven-vs-reactive-forms-which-scales',
            },
            {
              id: 'angular-controlvalueaccessor-vs-custom-two-way-binding',
              title: 'What Is ControlValueAccessor in Angular and Why Is It Better Than Custom Two-Way Binding?',
              filePath: 'frontend/src/assets/questions/angular/trivia.json',
              route: ['/', 'angular', 'trivia', 'angular-controlvalueaccessor-vs-custom-two-way-binding'],
              routeUrl: '/angular/trivia/angular-controlvalueaccessor-vs-custom-two-way-binding',
            },
            {
              id: 'angular-contact-form-starter',
              title: 'Contact Form (Standalone Component + HTTP)',
              filePath: 'frontend/src/assets/questions/angular/coding.json',
              route: ['/', 'angular', 'coding', 'angular-contact-form-starter'],
              routeUrl: '/angular/coding/angular-contact-form-starter',
            },
            {
              id: 'angular-multi-step-form-starter',
              title: 'Multi-step Signup Form (Reactive Forms)',
              filePath: 'frontend/src/assets/questions/angular/coding.json',
              route: ['/', 'angular', 'coding', 'angular-multi-step-form-starter'],
              routeUrl: '/angular/coding/angular-multi-step-form-starter',
            },
            {
              id: 'angular-chips-input-autocomplete',
              title: 'Invite Chips Input (Tags + Autocomplete)',
              filePath: 'frontend/src/assets/questions/angular/coding.json',
              route: ['/', 'angular', 'coding', 'angular-chips-input-autocomplete'],
              routeUrl: '/angular/coding/angular-chips-input-autocomplete',
            },
          ],
        },
        {
          title: 'Dependency injection boundaries and architecture decisions',
          review:
            'Review injector hierarchy, provider recipes, and service/component responsibility boundaries.',
          microDrills: [
            'Explain root vs feature vs component provider scope with one concrete bug example.',
            'Given a config object requirement, justify InjectionToken usage and provider recipe.',
            'Describe one case where service extraction improves testability and one case where it adds noise.',
          ],
          refs: [
            {
              id: 'angular-dependency-injection',
              title: 'What is dependency injection in Angular?',
              filePath: 'frontend/src/assets/questions/angular/trivia.json',
              route: ['/', 'angular', 'trivia', 'angular-dependency-injection'],
              routeUrl: '/angular/trivia/angular-dependency-injection',
            },
            {
              id: 'angular-hierarchical-dependency-injection-real-bug',
              title: 'Explain Hierarchical Dependency Injection in Angular With a Real Bug Example',
              filePath: 'frontend/src/assets/questions/angular/trivia.json',
              route: ['/', 'angular', 'trivia', 'angular-hierarchical-dependency-injection-real-bug'],
              routeUrl: '/angular/trivia/angular-hierarchical-dependency-injection-real-bug',
            },
            {
              id: 'angular-component-vs-service-responsibilities',
              title: 'What responsibilities belong inside an Angular component vs a service?',
              filePath: 'frontend/src/assets/questions/angular/trivia.json',
              route: ['/', 'angular', 'trivia', 'angular-component-vs-service-responsibilities'],
              routeUrl: '/angular/trivia/angular-component-vs-service-responsibilities',
            },
            {
              id: 'angular-shopping-cart-mini',
              title: 'Shopping Cart Mini (Standalone Component)',
              filePath: 'frontend/src/assets/questions/angular/coding.json',
              route: ['/', 'angular', 'coding', 'angular-shopping-cart-mini'],
              routeUrl: '/angular/coding/angular-shopping-cart-mini',
            },
          ],
        },
        {
          title: 'Routing flow and lazy-loading trade-offs',
          review:
            'Review guard/resolver responsibilities, lazy loading behavior, and module-boundary implications.',
          microDrills: [
            'Explain CanMatch vs CanActivate with one route-tree example.',
            'Describe one case where resolver improves UX and one where in-component loading is better.',
            'State one lazy-loading misconfiguration symptom and how you would validate it quickly.',
          ],
          refs: [
            {
              id: 'angular-routing',
              title: 'What is Angular routing and how do you define routes?',
              filePath: 'frontend/src/assets/questions/angular/trivia.json',
              route: ['/', 'angular', 'trivia', 'angular-routing'],
              routeUrl: '/angular/trivia/angular-routing',
            },
            {
              id: 'angular-lazy-loading',
              title: 'What is lazy loading in Angular?',
              filePath: 'frontend/src/assets/questions/angular/trivia.json',
              route: ['/', 'angular', 'trivia', 'angular-lazy-loading'],
              routeUrl: '/angular/trivia/angular-lazy-loading',
            },
            {
              id: 'angular-forroot-forchild',
              title: 'What are Angular modules’ forRoot() and forChild() methods used for?',
              filePath: 'frontend/src/assets/questions/angular/trivia.json',
              route: ['/', 'angular', 'trivia', 'angular-forroot-forchild'],
              routeUrl: '/angular/trivia/angular-forroot-forchild',
            },
            {
              id: 'angular-transfer-list',
              title: 'Angular Transfer List (Select + Move Between Two Lists)',
              filePath: 'frontend/src/assets/questions/angular/coding.json',
              route: ['/', 'angular', 'coding', 'angular-transfer-list'],
              routeUrl: '/angular/coding/angular-transfer-list',
            },
          ],
        },
        {
          title: 'State transitions, interaction reliability, and pressure-proof delivery',
          review:
            'Review deterministic state transitions and interaction guards in prompt-style components.',
          microDrills: [
            'Define state transitions before coding (idle, running, success/error, reset).',
            'Identify one repeated-action bug and add an explicit guard.',
            'Run one scenario where rapid interaction order would otherwise break correctness.',
          ],
          refs: [
            {
              id: 'angular-observables-rxjs',
              title: 'Observables in Angular: what they are, why RxJS matters, and how to use them correctly (async pipe, cancellation, operators)',
              filePath: 'frontend/src/assets/questions/angular/trivia.json',
              route: ['/', 'angular', 'trivia', 'angular-observables-rxjs'],
              routeUrl: '/angular/trivia/angular-observables-rxjs',
            },
            {
              id: 'angular-autocomplete-search-starter',
              title: 'Autocomplete Search Bar (Standalone Component)',
              filePath: 'frontend/src/assets/questions/angular/coding.json',
              route: ['/', 'angular', 'coding', 'angular-autocomplete-search-starter'],
              routeUrl: '/angular/coding/angular-autocomplete-search-starter',
            },
            {
              id: 'angular-chessboard-click-highlight',
              title: 'Angular Chessboard Click/Highlight (N×N Board)',
              filePath: 'frontend/src/assets/questions/angular/coding.json',
              route: ['/', 'angular', 'coding', 'angular-chessboard-click-highlight'],
              routeUrl: '/angular/coding/angular-chessboard-click-highlight',
            },
            {
              id: 'angular-snake-game',
              title: 'Angular Snake Game (Grid + Food + Collision)',
              filePath: 'frontend/src/assets/questions/angular/coding.json',
              route: ['/', 'angular', 'coding', 'angular-snake-game'],
              routeUrl: '/angular/coding/angular-snake-game',
            },
          ],
        },
      ],
      nightlyIntro:
        'Repeat this 45-minute block for 5–6 nights and keep one visible mistake log.',
      nightlyRoutine: {
        trivia:
          'Run one change-detection/RxJS concept rep from /coding?tech=angular&kind=trivia, then explain one trade-off aloud before moving on.',
        coding:
          'Run one implementation prompt from /coding?tech=angular&kind=coding and ship the minimal version first, then harden one edge case.',
        review:
          'Write one line each for symptom, root cause, and prevention rule; next day starts from yesterday’s prevention rule.',
      },
      mistakeTemplate: [
        'Symptom I saw:',
        'Root cause category (CD trigger, stream logic, DI scope, forms state, routing flow):',
        'Fix I used:',
        'Prevention rule for next drill:',
      ],
      nightlyRefs: [
        {
          id: 'angular-change-detection-strategies',
          title: 'What are change detection strategies in Angular, and how do they work?',
          filePath: 'frontend/src/assets/questions/angular/trivia.json',
          route: ['/', 'angular', 'trivia', 'angular-change-detection-strategies'],
          routeUrl: '/angular/trivia/angular-change-detection-strategies',
        },
        {
          id: 'angular-debounced-search',
          title: 'Angular Debounced Search with Fake API (RxJS)',
          filePath: 'frontend/src/assets/questions/angular/coding.json',
          route: ['/', 'angular', 'coding', 'angular-debounced-search'],
          routeUrl: '/angular/coding/angular-debounced-search',
        },
      ],
      predictionIntro:
        'For output prediction drills, state expected behavior before running code, then verify against the prompt.',
      predictions: [
        {
          prompt:
            'Predict whether UI updates after mutating nested object state under OnPush and explain the exact trigger path.',
          ref: {
            id: 'angular-onpush-change-detection-debugging-real-bug',
            title: 'Explain OnPush Change Detection in Angular Like You’re Debugging a Real Production Bug',
            filePath: 'frontend/src/assets/questions/angular/trivia.json',
            route: ['/', 'angular', 'trivia', 'angular-onpush-change-detection-debugging-real-bug'],
            routeUrl: '/angular/trivia/angular-onpush-change-detection-debugging-real-bug',
          },
        },
        {
          prompt:
            'Predict which network response wins under rapid typing for switchMap vs mergeMap in the same search flow.',
          ref: {
            id: 'rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use',
            title: 'switchMap vs mergeMap vs exhaustMap vs concatMap: When Would You Use Each in Angular?',
            filePath: 'frontend/src/assets/questions/angular/trivia.json',
            route: ['/', 'angular', 'trivia', 'rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use'],
            routeUrl: '/angular/trivia/rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use',
          },
        },
        {
          prompt:
            'Predict what gets canceled (or not) when a component is destroyed during an in-flight HttpClient call.',
          ref: {
            id: 'angular-http-what-actually-cancels-request',
            title: 'What Actually Cancels an HTTP Request in Angular?',
            filePath: 'frontend/src/assets/questions/angular/trivia.json',
            route: ['/', 'angular', 'trivia', 'angular-http-what-actually-cancels-request'],
            routeUrl: '/angular/trivia/angular-http-what-actually-cancels-request',
          },
        },
      ],
      redFlags: [
        {
          flag: 'Patching UI-update bugs with detectChanges() without fixing trigger or state flow.',
          refs: [
            {
              id: 'angular-change-detection-strategies',
              title: 'What are change detection strategies in Angular, and how do they work?',
              filePath: 'frontend/src/assets/questions/angular/trivia.json',
              route: ['/', 'angular', 'trivia', 'angular-change-detection-strategies'],
              routeUrl: '/angular/trivia/angular-change-detection-strategies',
            },
            {
              id: 'angular-onpush-change-detection-debugging-real-bug',
              title: 'Explain OnPush Change Detection in Angular Like You’re Debugging a Real Production Bug',
              filePath: 'frontend/src/assets/questions/angular/trivia.json',
              route: ['/', 'angular', 'trivia', 'angular-onpush-change-detection-debugging-real-bug'],
              routeUrl: '/angular/trivia/angular-onpush-change-detection-debugging-real-bug',
            },
          ],
        },
        {
          flag: 'Operator-by-habit decisions that cause stale or duplicated async UI behavior.',
          refs: [
            {
              id: 'rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use',
              title: 'switchMap vs mergeMap vs exhaustMap vs concatMap: When Would You Use Each in Angular?',
              filePath: 'frontend/src/assets/questions/angular/trivia.json',
              route: ['/', 'angular', 'trivia', 'rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use'],
              routeUrl: '/angular/trivia/rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use',
            },
            {
              id: 'angular-debounced-search',
              title: 'Angular Debounced Search with Fake API (RxJS)',
              filePath: 'frontend/src/assets/questions/angular/coding.json',
              route: ['/', 'angular', 'coding', 'angular-debounced-search'],
              routeUrl: '/angular/coding/angular-debounced-search',
            },
          ],
        },
        {
          flag: 'Forms that look correct but break touched/disabled/pending semantics.',
          refs: [
            {
              id: 'angular-controlvalueaccessor-vs-custom-two-way-binding',
              title: 'What Is ControlValueAccessor in Angular and Why Is It Better Than Custom Two-Way Binding?',
              filePath: 'frontend/src/assets/questions/angular/trivia.json',
              route: ['/', 'angular', 'trivia', 'angular-controlvalueaccessor-vs-custom-two-way-binding'],
              routeUrl: '/angular/trivia/angular-controlvalueaccessor-vs-custom-two-way-binding',
            },
            {
              id: 'angular-contact-form-starter',
              title: 'Contact Form (Standalone Component + HTTP)',
              filePath: 'frontend/src/assets/questions/angular/coding.json',
              route: ['/', 'angular', 'coding', 'angular-contact-form-starter'],
              routeUrl: '/angular/coding/angular-contact-form-starter',
            },
          ],
        },
        {
          flag: 'Routing and DI explanations that ignore scope/lifetime boundaries.',
          refs: [
            {
              id: 'angular-routing',
              title: 'What is Angular routing and how do you define routes?',
              filePath: 'frontend/src/assets/questions/angular/trivia.json',
              route: ['/', 'angular', 'trivia', 'angular-routing'],
              routeUrl: '/angular/trivia/angular-routing',
            },
            {
              id: 'angular-hierarchical-dependency-injection-real-bug',
              title: 'Explain Hierarchical Dependency Injection in Angular With a Real Bug Example',
              filePath: 'frontend/src/assets/questions/angular/trivia.json',
              route: ['/', 'angular', 'trivia', 'angular-hierarchical-dependency-injection-real-bug'],
              routeUrl: '/angular/trivia/angular-hierarchical-dependency-injection-real-bug',
            },
          ],
        },
      ],
      emergencyIntro:
        'If you only have two hours before a live loop, run this compressed sequence.',
      emergencyBlocks: [
        {
          duration: '35 minutes',
          action:
            'Change detection triage: explain triggers, then debug one OnPush-style symptom with explicit fix rationale.',
          refs: [
            {
              id: 'angular-change-detection-strategies',
              title: 'What are change detection strategies in Angular, and how do they work?',
              filePath: 'frontend/src/assets/questions/angular/trivia.json',
              route: ['/', 'angular', 'trivia', 'angular-change-detection-strategies'],
              routeUrl: '/angular/trivia/angular-change-detection-strategies',
            },
            {
              id: 'angular-onpush-change-detection-debugging-real-bug',
              title: 'Explain OnPush Change Detection in Angular Like You’re Debugging a Real Production Bug',
              filePath: 'frontend/src/assets/questions/angular/trivia.json',
              route: ['/', 'angular', 'trivia', 'angular-onpush-change-detection-debugging-real-bug'],
              routeUrl: '/angular/trivia/angular-onpush-change-detection-debugging-real-bug',
            },
          ],
        },
        {
          duration: '40 minutes',
          action:
            'RxJS correctness pass: operator selection + cancellation semantics, then one implementation rep.',
          refs: [
            {
              id: 'rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use',
              title: 'switchMap vs mergeMap vs exhaustMap vs concatMap: When Would You Use Each in Angular?',
              filePath: 'frontend/src/assets/questions/angular/trivia.json',
              route: ['/', 'angular', 'trivia', 'rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use'],
              routeUrl: '/angular/trivia/rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use',
            },
            {
              id: 'angular-debounced-search',
              title: 'Angular Debounced Search with Fake API (RxJS)',
              filePath: 'frontend/src/assets/questions/angular/coding.json',
              route: ['/', 'angular', 'coding', 'angular-debounced-search'],
              routeUrl: '/angular/coding/angular-debounced-search',
            },
          ],
        },
        {
          duration: '45 minutes',
          action:
            'Forms reliability pass: CVA/validation explanation plus one end-to-end form implementation review.',
          refs: [
            {
              id: 'angular-controlvalueaccessor-vs-custom-two-way-binding',
              title: 'What Is ControlValueAccessor in Angular and Why Is It Better Than Custom Two-Way Binding?',
              filePath: 'frontend/src/assets/questions/angular/trivia.json',
              route: ['/', 'angular', 'trivia', 'angular-controlvalueaccessor-vs-custom-two-way-binding'],
              routeUrl: '/angular/trivia/angular-controlvalueaccessor-vs-custom-two-way-binding',
            },
            {
              id: 'angular-multi-step-form-starter',
              title: 'Multi-step Signup Form (Reactive Forms)',
              filePath: 'frontend/src/assets/questions/angular/coding.json',
              route: ['/', 'angular', 'coding', 'angular-multi-step-form-starter'],
              routeUrl: '/angular/coding/angular-multi-step-form-starter',
            },
          ],
        },
      ],
      closing:
        'Next, Section 8 answers common edge-case questions so you can prioritize the right drills with limited time.',
    },
    faqInitialOpenId: 'angular-faq-leetcode',
    faqGroups: [
      {
        id: 'angular-faq-strategy',
        title: 'Prep strategy',
        items: [
          {
            id: 'angular-faq-leetcode',
            q: 'Do I need LeetCode to pass Angular interviews?',
            a: 'Not always. In Angular-heavy loops, teams usually score UI state correctness, async flow, and architecture trade-offs before deep algorithms. If your target process has a DS&A stage, treat it as a separate block instead of replacing framework reps. <strong>Practical rule:</strong> keep most weekly time on framework + browser execution, then add algorithms only where the process requires it.',
          },
          {
            id: 'angular-faq-layers',
            q: 'What is the practical difference between topics, trivia, and coding prompts?',
            a: 'Topics measure model depth, trivia measures explanation speed, and coding measures implementation reliability. If one layer is weak, interview output feels inconsistent even when you know the concept. The fastest gains come from running the same concept through all three layers in one session. <strong>Where to practice in FrontendAtlas:</strong> <code>/guides/framework-prep/angular-prep-path</code>, <code>/coding?tech=angular&kind=trivia</code>, <code>/coding?tech=angular&kind=coding</code>.',
          },
          {
            id: 'angular-faq-timeline',
            q: 'How long does it realistically take to become interview-ready?',
            a: 'Use readiness milestones, not calendar promises. Seven days can close obvious gaps, fourteen days usually stabilizes flow, and thirty days can improve pressure handling if review quality stays high. If the same bug category keeps repeating, extend that block before adding new topics. <strong>Practical rule:</strong> do not increase volume until your mistake log stops repeating the same root cause.',
          },
        ],
      },
      {
        id: 'angular-faq-core',
        title: 'Core Angular mechanics',
        items: [
          {
            id: 'angular-faq-onpush',
            q: 'Why does an OnPush component sometimes not update?',
            a: 'Usually because state changed by mutation while the reference stayed stable, or because the update trigger was assumed incorrectly. In Angular interview questions, this often appears as a “works in dev, breaks in real flow” probe. Explain trigger paths first, then choose immutable updates, <code>markForCheck()</code>, or explicit stream emissions. <strong>Practical rule:</strong> before patching, state exactly which trigger should cause the next check. <strong>Where to practice in FrontendAtlas:</strong> <code>/angular/trivia/angular-change-detection-strategies</code>, <code>/angular/trivia/angular-onpush-change-detection-debugging-real-bug</code>, <code>/angular/coding/angular-filterable-user-list</code>.',
          },
          {
            id: 'angular-faq-rxjs',
            q: 'How should I choose between switchMap, mergeMap, concatMap, and exhaustMap?',
            a: 'Choose by behavior contract, not habit: cancellation, parallelism, queueing, or ignore-while-busy semantics. Interviewers mostly check whether your operator choice matches UX behavior under fast interaction. Good answers also include teardown and stale-response handling. <strong>Where to practice in FrontendAtlas:</strong> <code>/angular/trivia/rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use</code>, <code>/angular/trivia/angular-http-what-actually-cancels-request</code>, <code>/angular/coding/angular-debounced-search</code>.',
          },
          {
            id: 'angular-faq-di',
            q: 'What DI scope/provider mistakes down-level candidates most often?',
            a: 'A common miss is describing DI at a high level without stating lifetime and boundary impact. Another is provider config that accidentally widens scope or breaks override behavior. Strong answers tie provider choices directly to runtime behavior across lazy and feature boundaries. <strong>Practical rule:</strong> always answer “where is this provided, who shares it, and when is it created?” in one pass. <strong>Where to practice in FrontendAtlas:</strong> <code>/angular/trivia/angular-dependency-injection</code>, <code>/angular/trivia/angular-hierarchical-dependency-injection-real-bug</code>, <code>/angular/trivia/angular-component-vs-service-responsibilities</code>.',
          },
          {
            id: 'angular-faq-routing',
            q: 'How deep should routing knowledge be for Angular roles?',
            a: 'You should clearly separate access control, data prefetch, and bundle-loading concerns. In a frontend interview, routing answers are scored on flow predictability and user experience, not API recall. Guard vs resolver responsibility, lazy boundaries, and fallback behavior should be explicit. <strong>Where to practice in FrontendAtlas:</strong> <code>/angular/trivia/angular-routing</code>, <code>/angular/trivia/angular-lazy-loading</code>, <code>/angular/trivia/angular-forroot-forchild</code>.',
          },
          {
            id: 'angular-faq-forms',
            q: 'Reactive forms vs template-driven forms: what answer is strongest?',
            a: 'A strong answer is context-based: maintainability, validation complexity, and testability. Reactive forms usually scale better for dynamic controls and richer validation flow, but template-driven can still be fine for simple state. Interview quality improves when you also cover CVA integration and async validator lifecycle. <strong>Practical rule:</strong> if validation rules and state transitions are non-trivial, start reactive. <strong>Where to practice in FrontendAtlas:</strong> <code>/angular/trivia/angular-template-driven-vs-reactive-forms-which-scales</code>, <code>/angular/trivia/angular-controlvalueaccessor-vs-custom-two-way-binding</code>, <code>/angular/coding/angular-contact-form-starter</code>, <code>/angular/coding/angular-multi-step-form-starter</code>.',
          },
        ],
      },
      {
        id: 'angular-faq-scope',
        title: 'Scope and expectations',
        items: [
          {
            id: 'angular-faq-testing',
            q: 'How much testing depth is expected?',
            a: 'Enough to show you can design verifiable behavior, not just produce passing screenshots. Explain what to test for async flow, state transitions, and integration boundaries, then tie that to likely failure modes. Strong candidates connect testing strategy directly to architecture decisions. <strong>Practical rule:</strong> for each implementation answer, name one behavior test and one edge-case test before closing.',
          },
          {
            id: 'angular-faq-senior',
            q: 'What changes in expectations for a senior-level round?',
            a: 'In a senior Angular interview, decision clarity matters as much as final output. You are expected to reduce ambiguity, choose scope intentionally, and defend trade-offs across performance, readability, and risk. The difference is not bigger code; it is cleaner boundaries and more reliable reasoning under changing constraints. Keep answers concise, but make architecture assumptions explicit.',
          },
        ],
      },
      {
        id: 'angular-faq-evidence',
        title: 'Evidence index',
        items: [
          {
            id: 'angular-faq-evidence-compact',
            q: 'Compact evidence index for FAQ drill references',
            a: '<ul><li><strong>Change detection + OnPush:</strong> <code>angular-change-detection-strategies</code>, <code>angular-onpush-change-detection-debugging-real-bug</code> — file: <code>frontend/src/assets/questions/angular/trivia.json</code> — routes: <code>/angular/trivia/angular-change-detection-strategies</code>, <code>/angular/trivia/angular-onpush-change-detection-debugging-real-bug</code></li><li><strong>RxJS cancellation:</strong> <code>rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use</code>, <code>angular-http-what-actually-cancels-request</code>, <code>angular-debounced-search</code> — files: <code>frontend/src/assets/questions/angular/trivia.json</code>, <code>frontend/src/assets/questions/angular/coding.json</code> — routes: <code>/angular/trivia/rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use</code>, <code>/angular/trivia/angular-http-what-actually-cancels-request</code>, <code>/angular/coding/angular-debounced-search</code></li><li><strong>DI + architecture boundaries:</strong> <code>angular-dependency-injection</code>, <code>angular-hierarchical-dependency-injection-real-bug</code>, <code>angular-component-vs-service-responsibilities</code> — file: <code>frontend/src/assets/questions/angular/trivia.json</code> — routes: <code>/angular/trivia/angular-dependency-injection</code>, <code>/angular/trivia/angular-hierarchical-dependency-injection-real-bug</code>, <code>/angular/trivia/angular-component-vs-service-responsibilities</code></li><li><strong>Forms + CVA:</strong> <code>angular-template-driven-vs-reactive-forms-which-scales</code>, <code>angular-controlvalueaccessor-vs-custom-two-way-binding</code>, <code>angular-contact-form-starter</code>, <code>angular-multi-step-form-starter</code> — files: <code>frontend/src/assets/questions/angular/trivia.json</code>, <code>frontend/src/assets/questions/angular/coding.json</code> — routes: <code>/angular/trivia/angular-template-driven-vs-reactive-forms-which-scales</code>, <code>/angular/trivia/angular-controlvalueaccessor-vs-custom-two-way-binding</code>, <code>/angular/coding/angular-contact-form-starter</code>, <code>/angular/coding/angular-multi-step-form-starter</code></li></ul>',
          },
        ],
      },
    ],
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
        label: 'Angular coding challenges',
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
    title: 'Vue Prep Path: Reactivity, Rendering, State',
    subtitle:
      'Prep for Vue interviews with a practical sequence that covers reactivity pitfalls, rendering timing, and component communication decisions you will be asked to justify.',
    minutes: 9,
    tags: ['vue', 'interview-prep', 'reactivity', 'rendering', 'patterns'],
    intro: {
      paragraphs: [
        'If Vue prep feels split across framework details, trivia bursts, and “build this in 30 minutes” prompts, you are not alone. This guide is for engineers who already ship Vue and want a cleaner interview rhythm.',
        'The common failure mode is fragmented recall: you remember isolated topics, then one follow-up crosses boundaries (reactivity → render timing → async behavior), and the answer gets messy. The fix is one stable 3-layer loop: Topics, Trivia, and Coding prompts.',
        'Topics give you the model. Trivia checks whether you can explain that model quickly. Coding prompts verify whether your model still holds when UI constraints and edge cases show up.',
        'A concrete example: Vue batches DOM updates, so changing reactive state does not mean the element is ready right away. In flows like “enter edit mode, then focus input,” `await nextTick()` is the point where DOM-dependent logic becomes safe.',
        'That is the tone of this path: fewer memorized phrases, more runtime reasoning you can defend under pressure.',
      ],
      bullets: [
        'Explain key Vue mechanics with concise, interview-ready mental models',
        'Predict follow-up questions and answer them without rambling',
        'Implement realistic UI prompts with clear state and edge-case handling',
        'Debug “why is this not updating?” problems faster and with less guesswork',
      ],
    },
    topicsSection: {
      title: 'Most asked Vue interview topics (and what they really test)',
      intro:
        'Most candidates lose points for one reason: they prepare facts, while interviews score models. Use this map to find weak clusters first, then drill the prompt shapes that keep repeating.',
      practiceLinks: {
        trivia: {
          label: 'Vue trivia questions',
          route: ['/coding'],
          queryParams: { tech: 'vue', kind: 'trivia' },
          note: 'Use these to sharpen fast explanations and follow-up handling.',
        },
        coding: {
          label: 'Vue coding challenges',
          route: ['/coding'],
          queryParams: { tech: 'vue', kind: 'coding' },
          note: 'Use these to apply the same mental model in implementation rounds.',
        },
      },
      clusters: [
        {
          title: 'Reactivity fundamentals (Vue 3)',
          why:
            'This is the quickest way to see whether you truly understand refs, proxies, and tracking boundaries—or are just debugging by trial and error.',
          prompts: [
            'Explain ref vs reactive and when to choose each.',
            'Fix a bug where adding a property does not trigger an update.',
            'Use shallowRef for external or large immutable data.',
            'Describe proxy vs raw objects and what Vue tracks.',
          ],
          good:
            'You can say exactly what Vue tracks, when rerenders happen, and where shallow/deep assumptions break.',
        },
        {
          title: 'Computed vs watchers',
          why:
            'This reveals whether you separate derived state from side effects and can control timing/cleanup with intent.',
          prompts: [
            'Compare computed vs watch vs watchEffect with a real scenario.',
            'Show when watchEffect is a better fit than watch.',
            'Explain watcher flush timing and why it matters.',
            'Use cleanup in watchers to cancel async work on re-run.',
          ],
          good:
            'You pick the right tool for the job and explain timing and cleanup without vague language.',
        },
        {
          title: 'Rendering and update timing',
          why:
            'Vue batches updates, and timing bugs expose whether you understand when DOM is actually committed.',
          prompts: [
            'Explain what nextTick() does and why DOM updates are batched.',
            'Diagnose why template change is not reflected immediately.',
            'Compare lifecycle hook order with watcher execution.',
            'Fix timing issues with nextTick or flush strategy.',
          ],
          good:
            'You can describe the update pipeline in plain terms and choose the right fix without cargo-culting nextTick.',
        },
        {
          title: 'Component communication',
          why:
            'Real apps are component networks, so this checks whether your data flow stays understandable as the tree grows.',
          prompts: [
            'Use props and custom emits for parent-child communication.',
            'Implement scoped slots for flexible rendering.',
            'Use provide/inject for context-like sharing.',
            'Extract shared behavior into composables.',
          ],
          good:
            'You keep ownership clear by default and can justify when slots or provide/inject are worth the complexity.',
        },
        {
          title: 'SFC and Composition API patterns',
          why:
            'This checks whether you can write modern Vue 3 code that teams can actually maintain.',
          prompts: [
            'Refactor Options API code into <script setup>.',
            'Use defineProps/defineEmits with strong typing.',
            'Write and integrate a reusable composable.',
            'Explain ref exposure between <script setup> and template.',
          ],
          good:
            'You can structure Composition API code cleanly and explain trade-offs without hiding behind syntax.',
        },
        {
          title: 'Vue Router (navigation)',
          why:
            'Routing is architecture in disguise, so this checks auth flow, route boundaries, and navigation behavior under real constraints.',
          prompts: [
            'Protect routes with guards and meta checks.',
            'Lazy-load route components with dynamic import().',
            'Set up nested routes or named views.',
            'Redirect or cancel navigation based on auth state.',
          ],
          good:
            'You can explain guard flow clearly and connect routing decisions to UX and load behavior.',
        },
        {
          title: 'State management (Pinia)',
          why:
            'This tests state-boundary judgment: what stays local, what becomes shared, and why.',
          prompts: [
            'Create a Pinia store with defineStore for shared state.',
            'Explain when state should move to store vs stay local.',
            'Compare Pinia and Vuex at practical level.',
            'Use Pinia with Composition API and type-friendly patterns.',
          ],
          good:
            'You justify store boundaries with ownership and lifetime, not habit.',
        },
        {
          title: 'Performance and optimization',
          why:
            'This separates “works on my machine” from “stays fast in production.”',
          prompts: [
            'Explain why stable unique keys matter in v-for diffing.',
            'Use v-once or v-memo to skip static subtrees.',
            'Lazy-load components/routes to reduce initial bundle.',
            'Virtualize large lists or use shallowRef for big immutable data.',
          ],
          good:
            'You identify the actual bottleneck first (render churn, list identity, bundle size) and apply targeted fixes.',
        },
        {
          title: 'Testing (component level)',
          why:
            'This verifies whether you can prove behavior, not just produce passing snapshots.',
          prompts: [
            'Mount component and simulate interaction with Vue Test Utils/Vitest.',
            'Assert emitted events, props handling, and slot rendering.',
            'Explain unit vs component vs E2E test boundaries.',
            'Explain how to test reactive composables.',
          ],
          good:
            'You test observable outcomes and choose depth based on risk, not test framework defaults.',
        },
      ],
      frequencyRows: [
        {
          frequency: 'High',
          topics:
            'Reactivity fundamentals, computed vs watchers, component communication, SFC/composition patterns, Vue Router, state management (Pinia)',
        },
        {
          frequency: 'Medium',
          topics: 'Rendering and update timing, performance optimization, testing (component)',
        },
        {
          frequency: 'Low',
          topics: '—',
        },
      ],
      closing:
        'In Section 3, we turn this map into 60-second answer patterns you can use when follow-ups come fast.',
    },
    triviaSection: {
      title: 'Vue trivia question types (fast probes)',
      intro:
        'Think of these as quick model checks, not syntax quizzes. They usually show up right after you explain a fix or propose an approach.',
      practiceLinks: {
        trivia: {
          label: 'Vue trivia questions',
          route: ['/coding'],
          queryParams: { tech: 'vue', kind: 'trivia' },
          note: 'Use these for short explanation reps.',
        },
        coding: {
          label: 'Vue coding challenges',
          route: ['/coding'],
          queryParams: { tech: 'vue', kind: 'coding' },
          note: 'Use these to apply each trivia model in implementation.',
        },
      },
      clusters: [
        {
          title: 'Reactivity fundamentals',
          why:
            'Reactivity is Vue’s core; weak model clarity here causes superstition-driven debugging everywhere else.',
          questions: [
            'What is the difference between ref() and reactive()?',
            'What is shallowRef, and when would you use it?',
            'Given a large immutable state object, when should you use shallowRef?',
            'Why did adding a new property not trigger a view update?',
            'How does Vue 3 proxy the original object?',
            'How does shallowRef change update behavior for nested mutations?',
            'Why is comparing raw objects with proxies risky in reactive logic?',
          ],
          answerSkeleton: [
            'ref() is a reactive wrapper, great for primitives; reactive() creates a deep Proxy for objects.',
            'Templates unwrap refs automatically, but JavaScript code still needs .value.',
            'shallowRef tracks only top-level replacement, not deep nested mutation.',
            'Vue tracks through proxy get/set, not by mutating raw object assumptions.',
            'For missing-key update issues, initialize expected shape up front.',
          ],
          traps: [
            'Forgetting .value in JavaScript while relying on template unwrapping.',
            'Using reactive() for primitives.',
            'Assuming reactive() returns the raw original object.',
            'Assuming shallowRef tracks deep nested changes.',
            'Mixing proxy and raw objects in equality-dependent logic.',
          ],
          practice:
            'Build one tiny component that switches between ref, reactive, and shallowRef, then predict which mutations trigger rerender.',
          drills: [
            { label: 'Vue reactivity fundamentals', route: ['/', 'vue', 'trivia', 'vue-reactivity-system'], note: 'trivia' },
            { label: 'ref vs reactive', route: ['/', 'vue', 'trivia', 'vue-ref-vs-reactive-difference-traps'], note: 'trivia' },
            { label: 'Large immutable object handling', route: ['/', 'vue', 'coding', 'vue-debounced-search'], note: 'coding' },
          ],
        },
        {
          title: 'Computed vs watchers',
          why:
            'Interviewers use this to test whether you can separate derived state from side effects, and whether you handle timing/cleanup correctly.',
          questions: [
            'When should you use computed vs watch vs watchEffect?',
            'When is watchEffect better than watch, and when is it not?',
            'What is watcher flush timing and why does it matter?',
            'How do you write a watcher that reacts synchronously?',
            'How do you clean up long-running effects started in watch/watchEffect?',
          ],
          answerSkeleton: [
            'Use computed for derived values and caching.',
            'Use watch for explicit sources and side effects like async work.',
            'Use watchEffect for automatic dependency collection when explicit source wiring is noisy.',
            'Default watcher timing is not post-DOM; choose flush mode intentionally.',
            'Always add cleanup for async/timer/subscription side effects.',
          ],
          traps: [
            'Using watch where computed is the cleaner model.',
            'Assuming DOM is already updated in default watcher callbacks.',
            'Expecting old/new values in watchEffect automatically.',
            'Forgetting cleanup and creating duplicated effects.',
          ],
          practice:
            'Implement one feature with computed + watch + watchEffect versions, then explain why only one is the right fit.',
          drills: [
            { label: 'computed vs watch', route: ['/', 'vue', 'trivia', 'vue-computed-vs-watchers'], note: 'trivia' },
            { label: 'watch vs watchEffect', route: ['/', 'vue', 'trivia', 'vue-watch-vs-watcheffect-differences-infinite-loops'], note: 'trivia' },
            { label: 'Async side-effect drill', route: ['/', 'vue', 'coding', 'vue-autocomplete-search'], note: 'coding' },
          ],
        },
        {
          title: 'Rendering and lifecycle timing',
          why:
            'Batched updates make timing bugs common; this checks whether you can reason about render and DOM commit points.',
          questions: [
            'What does nextTick() do, and when is it required?',
            'What happens under the hood when you await nextTick()?',
            'What is the update-order relationship between hooks and watcher callbacks?',
            'When would you prefer onUpdated over nextTick(), or vice versa?',
          ],
          answerSkeleton: [
            'Reactive state changes schedule batched updates, they do not patch DOM instantly.',
            'nextTick() waits until Vue flushes pending DOM updates.',
            'Use it for DOM reads/focus/measure after state-driven render.',
            'onUpdated is hook-based post-update lifecycle; nextTick is an explicit await point in logic.',
          ],
          traps: [
            'Reading DOM immediately after assignment and trusting stale values.',
            'Assuming child update order without verifying component tree flow.',
            'Mixing lifecycle and watcher timing models inconsistently.',
          ],
          practice:
            'Implement “show input then focus it” twice: once with nextTick(), once via watcher timing configuration.',
          drills: [
            { label: 'nextTick timing', route: ['/', 'vue', 'trivia', 'vue-nexttick-dom-update-queue'], note: 'trivia' },
            { label: 'Lifecycle hook order', route: ['/', 'vue', 'trivia', 'vue-lifecycle-hooks'], note: 'trivia' },
            { label: 'Focus-after-render UI drill', route: ['/', 'vue', 'coding', 'vue-debounced-search'], note: 'coding' },
          ],
        },
        {
          title: 'Component communication (props, emits, slots, provide/inject, composables)',
          why:
            'This reveals how you design maintainable data flow in real component networks.',
          questions: [
            'How do props and emits work together?',
            'How do you implement custom v-model with prop + emit conventions?',
            'What are slots and scoped slots used for?',
            'When is provide/inject appropriate?',
            'What is a composable and how is it consumed safely?',
          ],
          answerSkeleton: [
            'Props go down, emits go up; keep ownership boundaries explicit.',
            'Custom v-model follows modelValue + update:modelValue convention.',
            'Slots let parent provide markup; scoped slots let child expose slot props.',
            'provide/inject is useful for deep context, not default state management.',
            'Composables package reusable stateful logic under setup().',
          ],
          traps: [
            'Assuming emitted events bubble through arbitrary ancestor chains.',
            'Confusing slot direction and ownership responsibilities.',
            'Overusing provide/inject for routine state flow.',
            'Skipping emits declaration and losing API clarity.',
          ],
          practice:
            'Build one child input with custom v-model and one slot-powered table row renderer, then explain boundary choices.',
          drills: [
            { label: 'Props flow and mutation traps', route: ['/', 'vue', 'trivia', 'vue-child-mutates-prop-directly'], note: 'trivia' },
            { label: 'Slots and scoped slots', route: ['/', 'vue', 'trivia', 'vue-slots-default-named-scoped-slot-props'], note: 'trivia' },
            { label: 'Provide/inject usage', route: ['/', 'vue', 'trivia', 'vue-provide-inject-vs-prop-drilling-tradeoffs'], note: 'trivia' },
            { label: 'Reusable communication drill', route: ['/', 'vue', 'coding', 'vue-transfer-list'], note: 'coding' },
          ],
        },
        {
          title: 'SFC and <script setup> patterns',
          why:
            'Vue 3 teams expect idiomatic <script setup> and composable usage, not legacy-only syntax comfort.',
          questions: [
            'Why is <script setup> recommended in Vue 3 codebases?',
            'How do defineProps and defineEmits work?',
            'How do you strongly type props and emits?',
            'How do you structure reusable components and composables?',
            'What architectural patterns keep component libraries maintainable?',
          ],
          answerSkeleton: [
            '<script setup> compiles to setup() and exposes top-level bindings directly to template.',
            'defineProps/defineEmits are compiler macros with strong type inference support.',
            'Reuse favors focused components + slot extension points + composables for behavior.',
            'Library design should prefer stable conventions over prop-soup abstractions.',
          ],
          traps: [
            'Treating <script setup> as only cosmetic syntax.',
            'Forgetting emit declarations for component contracts.',
            'Over-abstracting too early and creating brittle APIs.',
          ],
          practice:
            'Refactor one Options-style component to <script setup> with typed props/emits and extract one composable.',
          drills: [
            { label: 'SFC structure patterns', route: ['/', 'vue', 'trivia', 'vue-sfc-vs-global-components'], note: 'trivia' },
            { label: 'Composition API patterns', route: ['/', 'vue', 'trivia', 'vue-composition-api'], note: 'trivia' },
            { label: 'Refactor drill', route: ['/', 'vue', 'coding', 'vue-tabs-switcher'], note: 'coding' },
          ],
        },
        {
          title: 'Vue Router fast probes',
          why:
            'Routing combines architecture, UX, and performance, so guard/lazy patterns are high-signal interview checks.',
          questions: [
            'What guard types exist and when do you use them?',
            'How do you handle async auth checks in global guards?',
            'How do you protect routes with redirect safety?',
            'How do you lazy-load route components and chunk them intentionally?',
            'How do dynamic params update in reused components?',
          ],
          answerSkeleton: [
            'Guards control navigation decisions at global, per-route, and in-component scopes.',
            'Use return-based guard flow in Vue Router 4, not legacy next()-only habits.',
            'Lazy-load routes with dynamic import() to reduce initial bundle.',
            'Dynamic params often update existing component instance, so react to param changes explicitly.',
          ],
          traps: [
            'Creating infinite redirect loops in auth guard logic.',
            'Static-importing route components while expecting code-splitting.',
            'Assuming param changes always remount component.',
          ],
          practice:
            'Implement auth guard + dynamic /user/:id route, then navigate across IDs and explain update/remount behavior.',
          drills: [
            { label: 'Vue Router basics', route: ['/', 'vue', 'trivia', 'vue-router-navigation'], note: 'trivia' },
            { label: 'Route architecture trade-offs', route: ['/', 'vue', 'trivia', 'vue-architecture-decisions-scalability'], note: 'trivia' },
            { label: 'Routing-flavored coding drill', route: ['/', 'vue', 'coding', 'vue-todo-list'], note: 'coding' },
          ],
        },
        {
          title: 'State management (Pinia / Vuex) probes',
          why:
            'Stores are where architecture discipline shows up fast, especially around boundary decisions and long-lived state.',
          questions: [
            'How does Pinia differ from Vuex in practical day-to-day usage?',
            'When should state stay local vs move into Pinia?',
            'How do you define and consume a Pinia store safely?',
            'How do you migrate a Vuex module toward Pinia patterns?',
            'How do you test stores in isolation?',
          ],
          answerSkeleton: [
            'Pinia is the modern default for Vue 3 with simpler API and stronger TS ergonomics.',
            'Keep state local unless shared lifetime or cross-route ownership justifies store.',
            'Use defineStore + clear action boundaries; avoid global-state dumping.',
            'Testing should validate store behavior independently of component internals.',
          ],
          traps: [
            'Moving trivial local state into global store for convenience.',
            'Carrying Vuex-era ceremony into Pinia and increasing noise.',
            'Forgetting plugin setup and blaming missing store context.',
          ],
          practice:
            'Implement the same small feature with local state and with Pinia-style store boundary reasoning, then justify your choice.',
          drills: [
            { label: 'Store fundamentals (Vuex baseline)', route: ['/', 'vue', 'trivia', 'vuex-state-management'], note: 'trivia' },
            { label: 'Local vs global state boundaries', route: ['/', 'vue', 'trivia', 'vue-architecture-decisions-scalability'], note: 'trivia' },
            { label: 'State-oriented coding drill', route: ['/', 'vue', 'coding', 'vue-shopping-cart'], note: 'coding' },
          ],
        },
        {
          title: 'Performance and testing fast probes',
          why:
            'Senior readiness depends on shipping behavior that stays fast and testable as the component tree grows.',
          questions: [
            'Why are stable keys critical in v-for lists?',
            'How do unstable props trigger avoidable child updates?',
            'How do v-once/v-memo and lazy loading help practical performance?',
            'What should component tests assert first (DOM/events/props)?',
            'How do you test composables without template-level coupling?',
          ],
          answerSkeleton: [
            'Stable keys preserve identity and prevent DOM reuse bugs in dynamic lists.',
            'Keep props stable and avoid fresh object literals each render where possible.',
            'Use code-splitting and memo/static directives intentionally, not reflexively.',
            'Tests should assert observable behavior (DOM + events), then deeper integration only when risk requires.',
          ],
          traps: [
            'Using index as key in reorderable lists.',
            'Static imports that defeat lazy-loading intent.',
            'Snapshot-only tests that fail noisily on harmless markup shifts.',
            'Testing internals over user-observable behavior.',
          ],
          practice:
            'Break a large list with bad keys and unstable props, then fix it and add a small test set for emits + DOM updates.',
          drills: [
            { label: 'v-for key behavior', route: ['/', 'vue', 'trivia', 'vue-v-for-keys-why-not-index'], note: 'trivia' },
            { label: 'Vue rendering and diffing', route: ['/', 'vue', 'trivia', 'vue-virtual-dom-diffing'], note: 'trivia' },
            { label: 'List and interaction drill', route: ['/', 'vue', 'coding', 'vue-filterable-user-list'], note: 'coding' },
          ],
        },
      ],
      practiceIntro:
        'Run this same loop for every cluster: one 60-second answer, one matching coding drill, one trap you commit not to repeat.',
      practiceSteps: [
        '20 seconds: state the core model in plain language.',
        '20 seconds: give one practical scenario where it breaks.',
        '10 seconds: name one common trap.',
        '10 seconds: name one trade-off or production implication.',
        'Then solve one coding prompt that stresses the same behavior.',
      ],
      closing:
        'Section 4 turns these probe patterns into build prompts, so implementation rounds feel familiar instead of random.',
    },
    codingPatternsSection: {
      title: 'Vue coding prompt patterns (what you actually build)',
      intro:
        'Vue coding rounds are small app slices with state, events, async behavior, and edge cases. These patterns give you a repeatable playbook when prompts start shifting.',
      practiceLinks: {
        coding: {
          label: 'Vue coding challenges',
          route: ['/coding'],
          queryParams: { tech: 'vue', kind: 'coding' },
          note: '',
        },
        trivia: {
          label: 'Vue trivia questions',
          route: ['/coding'],
          queryParams: { tech: 'vue', kind: 'trivia' },
          note: '',
        },
      },
      patterns: [
        {
          title: '1) Custom input with two-way binding (v-model)',
          promptTemplate:
            'Given a base input component, implement support for v-model so parents can use <BaseInput v-model="text" /> and keep both sides in sync.',
          testing:
            'Component API design, modelValue/update:modelValue contract understanding, and clean reactive wiring.',
          good:
            'props.modelValue drives value, input events emit update:modelValue, and empty/clear behavior is handled intentionally.',
          pitfalls: [
            'Emitting wrong event names instead of update:modelValue.',
            'Skipping emits declaration and losing API clarity.',
            'Using internal v-model without explicit sync to modelValue.',
            'Mixing template ref unwrapping with missing .value usage in script.',
          ],
          variation:
            'easy: basic text sync / medium: validation and maxLength / hard: multiple v-model bindings and modifiers.',
          drills: [
            { label: 'v-model syntax expansion', route: ['/', 'vue', 'trivia', 'vue-v-model-syntax-sugar-expansion'], note: 'trivia' },
            { label: 'emits declaration and event contracts', route: ['/', 'vue', 'trivia', 'vue-why-declare-emits-type-safety-maintenance'], note: 'trivia' },
            { label: 'Contact form starter', route: ['/', 'vue', 'coding', 'vue-contact-form-starter'], note: 'coding' },
          ],
        },
        {
          title: '2) To-do list (add/delete items with reactivity)',
          promptTemplate:
            'Build a todo list with add/delete actions, list rendering via v-for + :key, and input clearing after item creation.',
          testing:
            'Reactive collection handling, event wiring, key identity discipline, and baseline UI transitions.',
          good:
            'Task state is reactive, each item has stable unique ID keys, empty-input rules are explicit, and input reset behavior is deterministic.',
          pitfalls: [
            'Using array index as :key and causing identity reuse bugs.',
            'Forgetting to clear input after submit.',
            'Mutating non-reactive values and expecting rerender.',
            'Injecting raw HTML for task text instead of standard safe text rendering.',
          ],
          variation:
            'easy: add/remove only / medium: persistence with local storage or mock API / hard: edit + active/completed filters.',
          drills: [
            { label: 'Todo list coding drill', route: ['/', 'vue', 'coding', 'vue-todo-list'], note: 'coding' },
            { label: 'v-for key correctness', route: ['/', 'vue', 'trivia', 'vue-v-for-keys-why-not-index'], note: 'trivia' },
          ],
        },
        {
          title: '3) Tabs component with dynamic panels (slots/scoped slots)',
          promptTemplate:
            'Implement a Tabs component where active state is managed internally, titles come from props, and panel rendering is customized with slots.',
          testing:
            'Component composition, conditional rendering, slot/scoped-slot understanding, and clean event surface design.',
          good:
            'State model stays minimal (activeIndex plus derived active data), slot APIs remain clear, and tab changes emit stable events.',
          pitfalls: [
            'Missing keys in tab lists.',
            'Incorrect scoped-slot contract wiring.',
            'Forgetting to emit active-tab change events.',
            'Overengineering with dynamic component switching when simple branching is enough.',
          ],
          variation:
            'easy: fixed slots / medium: prop-driven titles + slot content / hard: keyboard navigation with ARIA semantics.',
          drills: [
            { label: 'Tabs switcher coding drill', route: ['/', 'vue', 'coding', 'vue-tabs-switcher'], note: 'coding' },
            { label: 'Slots and scoped slots', route: ['/', 'vue', 'trivia', 'vue-slots-default-named-scoped-slot-props'], note: 'trivia' },
          ],
        },
        {
          title: '4) Form with validation plus API submission',
          promptTemplate:
            'Build a contact-style form with required and email rules, async submit flow, loading/error states, and controlled post-submit behavior.',
          testing:
            'Reactive form state design, validation strategy (computed vs watch), async handling, and UX-state clarity.',
          good:
            'Validation logic is centralized, submission uses @submit.prevent with explicit loading/error states, and success/failure outcomes are easy to reason about.',
          pitfalls: [
            'Missing @submit.prevent and triggering browser default submit.',
            'Ignoring rejected promises and hiding failure states.',
            'Scattering validation checks across handlers.',
            'Using watchers for pure derived validation that belongs in computed.',
          ],
          variation:
            'easy: basic submit feedback / medium: inline validation errors and disabled submit / hard: field-level async validation plus store action integration.',
          drills: [
            { label: 'Contact form starter', route: ['/', 'vue', 'coding', 'vue-contact-form-starter'], note: 'coding' },
            { label: 'Multi-step form drill', route: ['/', 'vue', 'coding', 'vue-multi-step-form'], note: 'coding' },
            { label: 'computed vs watchers', route: ['/', 'vue', 'trivia', 'vue-computed-vs-watchers'], note: 'trivia' },
          ],
        },
        {
          title: '5) Protected route flow (Vue Router guard)',
          promptTemplate:
            'Protect a dashboard route so unauthenticated users are redirected to login, and explain both synchronous and asynchronous auth-check behavior.',
          testing:
            'Router guard mechanics, redirect correctness, async navigation control, and architecture-level flow reasoning.',
          good:
            'Guard returns clear redirect decisions, login-loop cases are handled, and async auth checks are awaited intentionally.',
          pitfalls: [
            'Infinite redirect loops caused by missing route exemptions.',
            'Async auth checks not awaited, leading to flaky navigation outcomes.',
            'Mixing old next()-style and return-based guard patterns inconsistently.',
          ],
          variation:
            'easy: sync boolean guard / medium: async guard decision / hard: per-route guard composition with route-meta policy.',
          drills: [
            { label: 'Vue Router navigation', route: ['/', 'vue', 'trivia', 'vue-router-navigation'], note: 'trivia' },
            { label: 'Architecture trade-off framing', route: ['/', 'vue', 'trivia', 'vue-architecture-decisions-scalability'], note: 'trivia' },
            { label: 'Router-focused trivia list', route: ['/coding'], queryParams: { tech: 'vue', kind: 'trivia', q: 'router guard' }, note: 'list' },
          ],
        },
        {
          title: '6) Global state with store boundaries (Pinia/Vuex style)',
          promptTemplate:
            'Create shared store state (for example cart or counter), wire add/remove actions, and consume it across components without over-globalizing local UI state.',
          testing:
            'State-boundary judgment, cross-component reactivity, and predictable store action design.',
          good:
            'Store shape is explicit, mutations/actions are intentional, derived values are exposed cleanly, and local-only state remains local.',
          pitfalls: [
            'Dumping all state into global store.',
            'Carrying mutation ceremony patterns when simpler store actions suffice.',
            'Using store APIs inconsistently across components.',
          ],
          variation:
            'easy: shared counter store / medium: cart with quantities and totals / hard: async store actions with error states.',
          drills: [
            { label: 'Store fundamentals', route: ['/', 'vue', 'trivia', 'vuex-state-management'], note: 'trivia' },
            { label: 'Shopping cart coding drill', route: ['/', 'vue', 'coding', 'vue-shopping-cart'], note: 'coding' },
            { label: 'Transfer-list state drill', route: ['/', 'vue', 'coding', 'vue-transfer-list'], note: 'coding' },
          ],
        },
        {
          title: '7) Data-fetching list component (API integration)',
          promptTemplate:
            'Fetch data on mount, render with v-for + keys, and handle loading/error/empty states with predictable UI transitions.',
          testing:
            'Async lifecycle flow, reactive assignment correctness, list identity, and recovery-path handling.',
          good:
            'State clearly separates loading/error/items, fetch updates reactive containers correctly, and UI transitions remain stable across retry and empty paths.',
          pitfalls: [
            'Skipping async error paths and leaving silent failures.',
            'Assigning response data to non-reactive variables.',
            'Missing keys in list rendering.',
            'Ignoring unmount-during-fetch implications in longer flows.',
          ],
          variation:
            'easy: fetch on mount / medium: filter + pagination / hard: route-param-driven detail loading with retry strategy.',
          drills: [
            { label: 'Filterable user list', route: ['/', 'vue', 'coding', 'vue-filterable-user-list'], note: 'coding' },
            { label: 'Paginated table', route: ['/', 'vue', 'coding', 'vue-pagination-table'], note: 'coding' },
            { label: 'Debounced search', route: ['/', 'vue', 'coding', 'vue-debounced-search'], note: 'coding' },
          ],
        },
        {
          title: '8) Pattern hygiene: keys and prop stability to prevent rerenders',
          promptTemplate:
            'Given a parent list and child rows, remove identity glitches and unnecessary updates by stabilizing keys and prop shapes.',
          testing:
            'Identity modeling with keys, practical rerender reasoning, and targeted optimization discipline.',
          good:
            'Stable unique IDs are used for keys, child props are kept narrow/stable, and optimizations are tied to measured symptoms.',
          pitfalls: [
            'Index keys in reorderable lists causing row state jumps.',
            'Passing fresh object literals to every child on each rerender.',
            'Applying optimizations without identifying real hotspots first.',
          ],
          variation:
            'easy: key fixes / medium: prop-shape stabilization / hard: selective memoization strategy.',
          drills: [
            { label: 'v-for key behavior', route: ['/', 'vue', 'trivia', 'vue-v-for-keys-why-not-index'], note: 'trivia' },
            { label: 'Virtual DOM diffing model', route: ['/', 'vue', 'trivia', 'vue-virtual-dom-diffing'], note: 'trivia' },
            { label: 'Dynamic table drill', route: ['/', 'vue', 'coding', 'vue-dynamic-table'], note: 'coding' },
          ],
        },
      ],
      rubricTitle: 'Quick rubric and repeatable interview flow',
      rubricIntro:
        'Use this as a live scoring checklist while you practice:',
      rubricItems: [
        'Correctness: UI behavior works and edge cases do not break state flow.',
        'State model clarity: data shape and transitions are easy to explain.',
        'Vue idioms: ref/reactive, computed/watch, slots/emits, and router/store usage stay idiomatic.',
        'UX polish: loading/disabled/error states are explicit and sensible.',
        'Trade-offs: decisions are justified briefly with one alternative when useful.',
      ],
      flowTitle: 'Flow you can reuse every time',
      flowIntro:
        'Use this sequence on every prompt to stay structured when requirements change mid-round:',
      flowSteps: [
        'Clarify inputs/outputs, constraints, and UX expectations.',
        'Write minimal state, derived state, and event list before coding.',
        'Implement happy path quickly (render plus core interaction).',
        'Handle edge cases: empty/error states, duplicate IDs, and async timing.',
        'Explain trade-offs: computed vs watch, local state vs store, slots vs props.',
        'Validate with concrete scenarios and mention what you would test next.',
      ],
      closing:
        'Once this becomes muscle memory, most “new” prompts feel like variations of the same underlying pattern.',
    },
    seniorSignalsSection: {
      title: 'Senior-level signals in Vue interviews (what interviewers really evaluate)',
      intro:
        'In a senior Vue interview, shipping the happy path is table stakes. This rubric focuses on decisions that separate stable engineering from fragile demos when time and requirements are tight.',
      practiceLinks: {
        coding: {
          label: 'Vue coding challenges',
          route: ['/coding'],
          queryParams: { tech: 'vue', kind: 'coding' },
          note: '',
        },
        trivia: {
          label: 'Vue trivia questions',
          route: ['/coding'],
          queryParams: { tech: 'vue', kind: 'trivia' },
          note: '',
        },
      },
      signals: [
        {
          title: 'Signal 1: You clarify scope and state transitions before coding',
          evaluating:
            'Can you remove ambiguity quickly and prevent late rewrites?',
          good: [
            'You ask focused questions about data shape, loading/error UX, and event outcomes before opening implementation details.',
            'You restate the flow as explicit states and transitions, then ship minimal behavior first.',
          ],
          redFlags: [
            'Coding immediately and discovering requirements mid-way.',
            'Long requirement discussion with no concrete implementation plan.',
          ],
        },
        {
          title: 'Signal 2: You apply Vue reactivity correctly (ref/reactive/shallowRef)',
          evaluating:
            'Do you understand what Vue is tracking and why updates fire or fail?',
          good: [
            'You choose ref vs reactive intentionally, and use shallowRef only when top-level replacement is part of the design.',
            'You explain proxy behavior and avoid mixing raw objects and proxies in logic that depends on identity.',
          ],
          redFlags: [
            'Treating reactivity as magic and patching symptoms with random rewrites.',
            'Nested mutation bugs caused by incorrect shallow/deep tracking assumptions.',
          ],
        },
        {
          title: 'Signal 3: You show computed/watch judgment instead of API memorization',
          evaluating:
            'Can you separate derived state from side effects and choose timing deliberately?',
          good: [
            'You use computed for pure derivation and watch/watchEffect for side effects with clear cleanup behavior.',
            'You justify watcher flush mode based on whether logic needs pre-update or post-update DOM context.',
          ],
          redFlags: [
            'Using watch for everything, including pure derivations.',
            'Side effects with no cleanup, causing duplicated async work and stale updates.',
          ],
        },
        {
          title: 'Signal 4: You handle update timing and nextTick with intent',
          evaluating:
            'Can you reason about render scheduling rather than guessing DOM timing?',
          good: [
            'You explain that state mutation schedules updates, then use nextTick only when DOM-dependent logic truly requires committed DOM.',
            'You distinguish lifecycle hooks from surgical async timing points and pick one based on required behavior.',
          ],
          redFlags: [
            'Reading DOM immediately after state writes and trusting stale output.',
            'Adding nextTick everywhere instead of fixing the render/event model.',
          ],
        },
        {
          title: 'Signal 5: You keep component boundaries and composables clean',
          evaluating:
            'Do you design reusable components without turning APIs into prop/event soup?',
          good: [
            'You keep ownership clear: props down, emits up, slots for structured customization, composables for shared behavior.',
            'You explain why provide/inject is a context tool, not a default replacement for explicit component contracts.',
          ],
          redFlags: [
            'Overusing provide/inject for everyday state flow.',
            'Extracting composables too early without stable boundaries.',
          ],
        },
        {
          title: 'Signal 6: You design router flow that stays correct under async auth',
          evaluating:
            'Can you implement navigation rules that are reliable and user-safe?',
          good: [
            'You use guard returns consistently, prevent redirect loops, and describe async auth checks without racing navigation.',
            'You connect routing choices to UX and bundle behavior, including lazy route loading trade-offs.',
          ],
          redFlags: [
            'Mixing guard styles inconsistently and producing flaky redirects.',
            'Guard logic that breaks on repeated navigations or login transitions.',
          ],
        },
        {
          title: 'Signal 7: You choose state-management and perf strategy with evidence',
          evaluating:
            'Can you pick local state vs store boundaries and optimize where it matters?',
          good: [
            'You keep local UI state local, move long-lived shared ownership into store only when justified, and explain that boundary clearly.',
            'You fix measurable hotspots first: stable keys, prop-shape discipline, and targeted list/render optimizations.',
          ],
          redFlags: [
            'Globalizing trivial local state and increasing complexity without benefit.',
            'Applying optimization directives without identifying real bottlenecks.',
          ],
        },
      ],
      scriptTitle: 'Excellent candidate checklist (reusable script)',
      scriptSteps: [
        'Clarify requirements in 2–4 focused questions (data, UX, edge cases).',
        'Propose state shape and component boundaries before coding.',
        'Implement happy path quickly with idiomatic Vue patterns.',
        'Harden edge cases: loading/error/empty, stale async results, cleanup, key stability.',
        'Explain trade-offs: computed vs watch, local state vs store, slot API vs prop expansion.',
        'Validate with concrete scenarios and one concise test strategy note.',
      ],
      closing:
        'Section 6 turns these signals into a time-boxed plan you can run weekly.',
    },
    practicalPlanSection: {
      title: 'How to prepare for Vue interviews with FrontendAtlas (a practical plan)',
      opener: [
        'Use one repeatable loop: Topics → Trivia → Coding prompts.',
        'Topics sharpen runtime models; trivia sharpens explanation speed.',
        'Coding prompts pressure-test both under interview constraints, then you close with one concrete mistake review.',
        'Treat coding as a fixed lane in your schedule, not optional overtime.',
      ],
      practiceMap: [
        {
          label: 'Vue trivia drill lane',
          route: ['/coding'],
          queryParams: { tech: 'vue', kind: 'trivia' },
          routeUrl: '/coding?tech=vue&kind=trivia',
          note:
            'Use filtered trivia list for 60-second explanation reps, then open detail pages for deeper review.',
          evidence:
            'frontend/src/app/app.routes.ts (routes /coding and /:tech/trivia/:id); frontend/src/app/features/coding/coding-list/coding-list.component.ts (CodingListComponent query filtering); frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.ts (TriviaDetailComponent).',
        },
        {
          label: 'Vue coding drill lane',
          route: ['/coding'],
          queryParams: { tech: 'vue', kind: 'coding' },
          routeUrl: '/coding?tech=vue&kind=coding',
          note:
            'Run implementation prompts from list view, then solve in detail workspace.',
          evidence:
            'frontend/src/app/app.routes.ts (route /:tech/coding/:id); frontend/src/app/features/coding/coding-detail/coding-detail.component.ts (CodingDetailComponent); frontend/src/app/features/coding/coding-detail/coding-framework-panel/coding-framework-panel.ts (CodingFrameworkPanelComponent editor/preview shell).',
        },
        {
          label: 'Vue framework prep path',
          route: ['/guides', 'framework-prep', 'vue-prep-path'],
          routeUrl: '/guides/framework-prep/vue-prep-path',
          note:
            'Use this page as your sequence baseline before each timed block.',
          evidence:
            'frontend/src/app/app.routes.ts (route /guides/framework-prep/:slug); frontend/src/app/features/guides/playbook/playbook-host.component.ts (PlaybookHostComponent); frontend/src/app/features/guides/playbook/framework-prep-path-article.component.ts (FrameworkPrepPathArticleComponent).',
        },
        {
          label: 'Framework prep index',
          route: ['/guides', 'framework-prep'],
          routeUrl: '/guides/framework-prep',
          note:
            'Compare Vue path with React/Angular path structure for transfer learning.',
          evidence:
            'frontend/src/app/app.routes.ts (route /guides/framework-prep); frontend/src/app/features/guides/framework-prep/framework-prep-index.component.ts (FrameworkPrepIndexComponent).',
        },
        {
          label: 'Interview blueprint hub',
          route: ['/guides', 'interview-blueprint'],
          routeUrl: '/guides/interview-blueprint',
          note:
            'Use blueprint pages to sharpen clarification flow and trade-off communication.',
          evidence:
            'frontend/src/app/app.routes.ts (routes /guides/interview-blueprint and /guides/interview-blueprint/:slug); frontend/src/app/features/guides/playbook/playbook-index/playbook-index.component.ts (PlaybookIndexComponent); frontend/src/app/shared/guides/guide.registry.ts (blueprint entries).',
        },
        {
          label: 'Focus areas map',
          route: ['/focus-areas'],
          routeUrl: '/focus-areas',
          note:
            'Select weakest topic clusters and route back to filtered question practice.',
          evidence:
            'frontend/src/app/app.routes.ts (route /focus-areas); frontend/src/app/features/tracks/focus-areas/focus-areas.component.ts (FocusAreasComponent).',
        },
      ],
      plan7: {
        intro:
          'Week objective: stabilize high-risk Vue signals quickly—reactivity correctness, computed/watch judgment, and update timing.',
        emphasis: [
          'Days 1–2: reactivity fundamentals and ref/reactive/shallowRef behavior.',
          'Days 3–4: computed vs watch/watchEffect choices and cleanup rules.',
          'Days 5–6: nextTick timing, component boundaries, and slot/event contracts.',
          'Day 7: one mixed timed rep (trivia + coding + short review).',
        ],
        routine45: {
          warmup:
            '10 min: targeted trivia pass on /coding?tech=vue&kind=trivia&q=reactivity or q=watch.',
          main:
            '25 min: one coding drill from /coding?tech=vue&kind=coding&q=todo or q=tabs.',
          review:
            '10 min: document one bug pattern and compare with /guides/framework-prep/vue-prep-path sequence.',
        },
        routine90: {
          warmup:
            '15 min: two trivia clusters on /coding?tech=vue&kind=trivia (one model question + one trade-off question).',
          main:
            '60 min: two coding drills from /coding?tech=vue&kind=coding, each with one hardening pass.',
          review:
            '15 min: map misses to next-day cluster using /focus-areas and /guides/interview-blueprint.',
        },
        checkpoints: [
          'You can explain ref/reactive/shallowRef decisions with one concrete UI example.',
          'You can justify computed vs watch choices in one sentence.',
          'You can handle nextTick-dependent DOM interactions without guesswork.',
        ],
      },
      plan14: {
        intro:
          'Two-week objective: turn isolated knowledge into consistent delivery across explanation and implementation.',
        emphasis: [
          'Week 1: reinforce reactivity, watcher judgment, and timing/lifecycle behavior.',
          'Week 2: deepen SFC/composable boundaries, router flow, store decisions, and performance hygiene.',
        ],
        routine45: {
          warmup:
            '10 min: one trivia lane filter on /coding?tech=vue&kind=trivia&q=router or q=composition.',
          main:
            '25 min: one implementation from /coding?tech=vue&kind=coding&q=form or q=search.',
          review:
            '10 min: align one weak area with next-day drill using /guides/framework-prep/vue-prep-path and /tracks.',
        },
        routine90: {
          warmup:
            '15 min: two trivia passes from /coding?tech=vue&kind=trivia (model + pitfall pair).',
          main:
            '60 min: one primary coding drill plus one constrained variant from /coding?tech=vue&kind=coding.',
          review:
            '15 min: compare decisions with /guides/interview-blueprint/coding-interviews and /guides/interview-blueprint/ui-interviews.',
        },
        checkpoints: [
          'You can run clarify → state model → implement → harden without skipping steps.',
          'You can articulate component boundary and store boundary decisions clearly.',
          'You can identify if a bug is reactivity model, timing, or architecture flow.',
        ],
      },
      plan30: {
        intro:
          'Month objective: senior-level consistency under pressure with fewer repeated mistakes and stronger trade-off explanations.',
        emphasis: [
          'Weeks 1–2: broad pass across high-frequency Vue clusters (reactivity, watch/computed, timing, communication, router, state).',
          'Weeks 3–4: timed simulations with explicit edge-case hardening and explanation-quality checks.',
          'Keep a single mistake log and revisit it every 3–4 sessions.',
        ],
        routine45: {
          warmup:
            '10 min: weakest-cluster trivia on /coding?tech=vue&kind=trivia&q=<weak-topic>.',
          main:
            '25 min: one timed coding drill on /coding?tech=vue&kind=coding with one extra requirement added after first pass.',
          review:
            '10 min: rebalance next day using /focus-areas or /companies list-level signals.',
        },
        routine90: {
          warmup:
            '15 min: two short trivia passes plus one behavior-prediction prompt from /coding?tech=vue&kind=trivia.',
          main:
            '60 min: one full coding cycle on /coding?tech=vue&kind=coding including hardening and re-validation.',
          review:
            '15 min: compare narrative quality against /guides/interview-blueprint and /guides/framework-prep/vue-prep-path.',
        },
        checkpoints: [
          'You keep implementations readable while handling async and edge-case behavior.',
          'You justify local-vs-store state and communication boundaries with constraints.',
          'You can explain performance/testing implications without generic filler.',
        ],
      },
      decisionIntro:
        'Use this decision tree whenever the same weakness repeats more than twice in a week.',
      decisionLeaves: [
        {
          weakSpot: 'If reactivity correctness is weak',
          actions: [
            'Start each session with one reactivity model explanation before opening code.',
            'State whether each value belongs in ref, reactive, or shallowRef before implementation.',
          ],
          practice: [
            {
              label: 'Reactivity trivia filter',
              route: ['/coding'],
              queryParams: { tech: 'vue', kind: 'trivia', q: 'reactivity' },
              routeUrl: '/coding?tech=vue&kind=trivia&q=reactivity',
              note: 'Drill model clarity and caveat awareness first.',
              evidence:
                'frontend/src/app/features/coding/coding-list/coding-list.component.ts (query filtering); frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.ts (trivia detail).',
            },
            {
              label: 'Reactive list coding drill',
              route: ['/', 'vue', 'coding', 'vue-todo-list'],
              routeUrl: '/vue/coding/vue-todo-list',
              note: 'Apply ref/reactive decisions in a stateful UI flow.',
              evidence:
                'frontend/src/app/app.routes.ts (route /:tech/coding/:id); frontend/src/app/features/coding/coding-detail/coding-detail.component.ts (CodingDetailComponent).',
            },
          ],
        },
        {
          weakSpot: 'If computed/watch judgment is weak',
          actions: [
            'For each prompt, classify logic as derived state or side effect before coding.',
            'During review, mark one place where a watcher should be replaced by computed (or vice versa).',
          ],
          practice: [
            {
              label: 'Watcher/computed trivia filter',
              route: ['/coding'],
              queryParams: { tech: 'vue', kind: 'trivia', q: 'watch' },
              routeUrl: '/coding?tech=vue&kind=trivia&q=watch',
              note: 'Rehearse source tracking, flush mode, and cleanup language.',
              evidence:
                'frontend/src/app/features/coding/coding-list/coding-list.component.ts (filter/search handling); frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.ts (detail view).',
            },
            {
              label: 'Async search coding drill',
              route: ['/', 'vue', 'coding', 'vue-debounced-search'],
              routeUrl: '/vue/coding/vue-debounced-search',
              note: 'Exercise side-effect control and stale-result prevention.',
              evidence:
                'frontend/src/app/features/coding/coding-detail/coding-detail.component.ts (coding detail route); frontend/src/app/features/coding/coding-detail/coding-framework-panel/coding-framework-panel.ts (editor/preview).',
            },
          ],
        },
        {
          weakSpot: 'If update timing and nextTick handling are weak',
          actions: [
            'Predict DOM timing before using nextTick, then verify behavior in one small UI interaction.',
            'Document one rule for when watcher flush mode solves timing more cleanly than nextTick.',
          ],
          practice: [
            {
              label: 'nextTick trivia detail',
              route: ['/', 'vue', 'trivia', 'vue-nexttick-dom-update-queue'],
              routeUrl: '/vue/trivia/vue-nexttick-dom-update-queue',
              note: 'Lock render-commit timing model first.',
              evidence:
                'frontend/src/app/app.routes.ts (route /:tech/trivia/:id); frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.ts (TriviaDetailComponent).',
            },
            {
              label: 'Tabs timing drill',
              route: ['/', 'vue', 'coding', 'vue-tabs-switcher'],
              routeUrl: '/vue/coding/vue-tabs-switcher',
              note: 'Practice state-to-DOM timing in visible interaction flow.',
              evidence:
                'frontend/src/app/features/coding/coding-detail/coding-detail.component.ts (detail workflow); frontend/src/app/features/coding/coding-detail/coding-framework-panel/coding-framework-panel.ts (preview panel).',
            },
          ],
        },
        {
          weakSpot: 'If SFC and script-setup/composable structure is weak',
          actions: [
            'Before coding, define what belongs in component state vs composable behavior.',
            'Use one refactor pass per session to improve prop/event API clarity.',
          ],
          practice: [
            {
              label: 'Composition and SFC trivia filter',
              route: ['/coding'],
              queryParams: { tech: 'vue', kind: 'trivia', q: 'composition' },
              routeUrl: '/coding?tech=vue&kind=trivia&q=composition',
              note: 'Drill script-setup and composable boundary language.',
              evidence:
                'frontend/src/app/features/coding/coding-list/coding-list.component.ts (query filters); frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.ts (answer details).',
            },
            {
              label: 'Framework prep path reference',
              route: ['/guides', 'framework-prep', 'vue-prep-path'],
              routeUrl: '/guides/framework-prep/vue-prep-path',
              note: 'Use Sections 2–5 as architecture notes before each coding rep.',
              evidence:
                'frontend/src/app/features/guides/playbook/framework-prep-path-article.component.ts (Vue sections); frontend/src/app/app.routes.ts (framework-prep route).',
            },
          ],
        },
        {
          weakSpot: 'If router flow is weak',
          actions: [
            'Train guard/redirect behavior separately from coding details first.',
            'Always tie route decisions to user flow and fallback behavior.',
          ],
          practice: [
            {
              label: 'Router trivia filter',
              route: ['/coding'],
              queryParams: { tech: 'vue', kind: 'trivia', q: 'router' },
              routeUrl: '/coding?tech=vue&kind=trivia&q=router',
              note: 'Rehearse guard flow, dynamic params, and lazy-route vocabulary.',
              evidence:
                'frontend/src/app/features/coding/coding-list/coding-list.component.ts (keyword filtering); frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.ts (detail route).',
            },
            {
              label: 'Router reference baseline',
              route: ['/guides', 'interview-blueprint', 'coding-interviews'],
              routeUrl: '/guides/interview-blueprint/coding-interviews',
              note: 'Tighten clarify/flow communication before implementation drills.',
              evidence:
                'frontend/src/app/shared/guides/guide.registry.ts (coding-interviews entry); frontend/src/app/app.routes.ts (/guides/interview-blueprint/:slug).',
            },
          ],
        },
        {
          weakSpot: 'If state-management choices are weak',
          actions: [
            'For every prompt, decide local vs shared state boundary before building actions.',
            'Name one reason for and one reason against moving state into store.',
          ],
          practice: [
            {
              label: 'Store/state trivia detail',
              route: ['/', 'vue', 'trivia', 'vuex-state-management'],
              routeUrl: '/vue/trivia/vuex-state-management',
              note: 'Reinforce store responsibilities and boundary decisions.',
              evidence:
                'frontend/src/app/app.routes.ts (route /:tech/trivia/:id); frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.ts (detail component).',
            },
            {
              label: 'State-oriented coding drill',
              route: ['/', 'vue', 'coding', 'vue-shopping-cart'],
              routeUrl: '/vue/coding/vue-shopping-cart',
              note: 'Practice shared state updates with predictable UI feedback.',
              evidence:
                'frontend/src/app/features/coding/coding-detail/coding-detail.component.ts (coding detail); frontend/src/app/features/coding/coding-detail/coding-framework-panel/coding-framework-panel.ts (interactive panel).',
            },
          ],
        },
        {
          weakSpot: 'If performance/testing confidence is weak',
          actions: [
            'Use one performance-focused trivia prompt plus one behavior-checklist review after coding.',
            'Track one measurable symptom per drill (rerender noise, key stability, or list update cost).',
          ],
          practice: [
            {
              label: 'Performance trivia details',
              route: ['/', 'vue', 'trivia', 'vue-v-for-keys-why-not-index'],
              routeUrl: '/vue/trivia/vue-v-for-keys-why-not-index',
              note: 'Start with identity and rerender cost basics.',
              evidence:
                'frontend/src/app/app.routes.ts (trivia detail route); frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.ts (question detail rendering).',
            },
            {
              label: 'List-performance coding drill',
              route: ['/', 'vue', 'coding', 'vue-filterable-user-list'],
              routeUrl: '/vue/coding/vue-filterable-user-list',
              note: 'Apply key stability and behavior-focused validation on a dynamic list.',
              evidence:
                'frontend/src/app/features/coding/coding-detail/coding-detail.component.ts (detail component); frontend/src/app/features/coding/coding-detail/coding-framework-panel/coding-framework-panel.ts (coding shell).',
            },
          ],
        },
      ],
      lastWeekRoutine: [
        'Run one daily trivia sprint on /coding?tech=vue&kind=trivia with a single focus keyword.',
        'Run one daily timed coding rep on /coding?tech=vue&kind=coding, then review your state model and edge-case handling.',
        'End each session with one “symptom → root cause → prevention” note and compare against /guides/framework-prep/vue-prep-path.',
        'Every 2–3 days, re-prioritize using /focus-areas and /tracks to avoid drilling only comfort topics.',
      ],
      closing:
        'Section 7 compresses this into a screenshot-friendly cheat sheet for the final week.',
      evidenceIndex: [
        {
          label: 'Framework-filtered question list',
          route: ['/coding'],
          queryParams: { tech: 'vue', kind: 'coding' },
          routeUrl: '/coding?tech=vue&kind=coding (or kind=trivia)',
          note: '',
          evidence:
            'frontend/src/app/app.routes.ts (route /coding); frontend/src/app/features/coding/coding-list/coding-list.component.ts (tech/kind/search query filtering).',
        },
        {
          label: 'Vue coding detail workspace',
          route: ['/', 'vue', 'coding', 'vue-debounced-search'],
          routeUrl: '/vue/coding/vue-debounced-search',
          note: '',
          evidence:
            'frontend/src/app/app.routes.ts (route /:tech/coding/:id); frontend/src/app/features/coding/coding-detail/coding-detail.component.ts (CodingDetailComponent); frontend/src/app/features/coding/coding-detail/coding-framework-panel/coding-framework-panel.ts (editor + preview shell).',
        },
        {
          label: 'Vue trivia detail page',
          route: ['/', 'vue', 'trivia', 'vue-reactivity-system'],
          routeUrl: '/vue/trivia/vue-reactivity-system',
          note: '',
          evidence:
            'frontend/src/app/app.routes.ts (route /:tech/trivia/:id); frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.ts (TriviaDetailComponent).',
        },
        {
          label: 'Framework prep guides',
          route: ['/guides', 'framework-prep'],
          routeUrl: '/guides/framework-prep/vue-prep-path',
          note: '',
          evidence:
            'frontend/src/app/app.routes.ts (routes /guides/framework-prep and /guides/framework-prep/:slug); frontend/src/app/features/guides/framework-prep/framework-prep-index.component.ts (FrameworkPrepIndexComponent); frontend/src/app/features/guides/playbook/playbook-host.component.ts (PlaybookHostComponent).',
        },
        {
          label: 'Interview blueprint guides',
          route: ['/guides', 'interview-blueprint'],
          routeUrl: '/guides/interview-blueprint',
          note: '',
          evidence:
            'frontend/src/app/app.routes.ts (blueprint routes); frontend/src/app/features/guides/playbook/playbook-index/playbook-index.component.ts (PlaybookIndexComponent); frontend/src/app/shared/guides/guide.registry.ts (guide definitions).',
        },
        {
          label: 'Focus and planning pages',
          route: ['/focus-areas'],
          routeUrl: '/focus-areas, /tracks, /companies',
          note: '',
          evidence:
            'frontend/src/app/app.routes.ts (routes /focus-areas, /tracks, /companies); frontend/src/app/features/tracks/focus-areas/focus-areas.component.ts (FocusAreasComponent); frontend/src/app/features/tracks/track-list/track-list.component.ts (TrackListComponent); frontend/src/app/features/company/company-index/company-index.component.ts (CompanyIndexComponent).',
        },
      ],
    },
    cheatSheetSection: {
      title: 'Last-week cheat sheet (highest ROI review)',
      opener: [
        'In the final week, stop expanding scope and remove repeated errors.',
        'Use this loop for high-frequency Vue prompts so your explanation and implementation quality stays stable.',
        'Run fast trivia recall first, then switch to coding reps under time pressure.',
      ],
      clusters: [
        {
          title: 'Reactivity core and ref/reactive traps',
          review:
            'Review what Vue tracks, when updates fire, and where shallow/deep assumptions cause bugs.',
          microDrills: [
            'Explain ref vs reactive in 60 seconds with one concrete bug example.',
            'State when shallowRef is valid before writing code.',
            'Predict one nested-mutation behavior and verify.',
          ],
          refs: [
            {
              id: 'vue-reactivity-system',
              title: 'What is the Vue reactivity system and how does it work internally?',
              filePath: 'frontend/src/assets/questions/vue/trivia.json',
              route: ['/', 'vue', 'trivia', 'vue-reactivity-system'],
              routeUrl: '/vue/trivia/vue-reactivity-system',
            },
            {
              id: 'vue-ref-vs-reactive-difference-traps',
              title: 'ref vs reactive in Vue: what’s the real difference, when should you use each, and what are the common reactivity traps?',
              filePath: 'frontend/src/assets/questions/vue/trivia.json',
              route: ['/', 'vue', 'trivia', 'vue-ref-vs-reactive-difference-traps'],
              routeUrl: '/vue/trivia/vue-ref-vs-reactive-difference-traps',
            },
            {
              id: 'vue-todo-list',
              title: 'Todo List (Refs + List Rendering)',
              filePath: 'frontend/src/assets/questions/vue/coding.json',
              route: ['/', 'vue', 'coding', 'vue-todo-list'],
              routeUrl: '/vue/coding/vue-todo-list',
            },
          ],
        },
        {
          title: 'Computed vs watch/watchEffect judgment',
          review:
            'Review derived-state vs side-effect boundaries and cleanup decisions under async flow.',
          microDrills: [
            'Classify one prompt as computed-first or watch-first before coding.',
            'Explain one watchEffect pitfall and how to avoid loops.',
            'State one cleanup strategy for stale async results.',
          ],
          refs: [
            {
              id: 'vue-computed-vs-watchers',
              title: 'Computed vs watch in Vue: derived state (cached) vs side effects (imperative)',
              filePath: 'frontend/src/assets/questions/vue/trivia.json',
              route: ['/', 'vue', 'trivia', 'vue-computed-vs-watchers'],
              routeUrl: '/vue/trivia/vue-computed-vs-watchers',
            },
            {
              id: 'vue-watch-vs-watcheffect-differences-infinite-loops',
              title: 'watch vs watchEffect in Vue: what’s the difference, when does each run, and how can you accidentally create infinite loops?',
              filePath: 'frontend/src/assets/questions/vue/trivia.json',
              route: ['/', 'vue', 'trivia', 'vue-watch-vs-watcheffect-differences-infinite-loops'],
              routeUrl: '/vue/trivia/vue-watch-vs-watcheffect-differences-infinite-loops',
            },
            {
              id: 'vue-debounced-search',
              title: 'Vue Debounced Search with Fake API',
              filePath: 'frontend/src/assets/questions/vue/coding.json',
              route: ['/', 'vue', 'coding', 'vue-debounced-search'],
              routeUrl: '/vue/coding/vue-debounced-search',
            },
          ],
        },
        {
          title: 'Update timing, lifecycle, and DOM commit points',
          review:
            'Review when nextTick is required and how lifecycle timing affects DOM-safe operations.',
          microDrills: [
            'Predict DOM value before/after nextTick in one state change flow.',
            'Explain where lifecycle hooks run relative to update commits.',
            'Implement one focus-after-render interaction.',
          ],
          refs: [
            {
              id: 'vue-nexttick-dom-update-queue',
              title: 'What does nextTick() do in Vue, and why are DOM measurements wrong immediately after a state change?',
              filePath: 'frontend/src/assets/questions/vue/trivia.json',
              route: ['/', 'vue', 'trivia', 'vue-nexttick-dom-update-queue'],
              routeUrl: '/vue/trivia/vue-nexttick-dom-update-queue',
            },
            {
              id: 'vue-lifecycle-hooks',
              title: 'What are lifecycle hooks in Vue and when are they used?',
              filePath: 'frontend/src/assets/questions/vue/trivia.json',
              route: ['/', 'vue', 'trivia', 'vue-lifecycle-hooks'],
              routeUrl: '/vue/trivia/vue-lifecycle-hooks',
            },
            {
              id: 'vue-tabs-switcher',
              title: 'Vue Tabs / Multi-View Switcher',
              filePath: 'frontend/src/assets/questions/vue/coding.json',
              route: ['/', 'vue', 'coding', 'vue-tabs-switcher'],
              routeUrl: '/vue/coding/vue-tabs-switcher',
            },
          ],
        },
        {
          title: 'Component communication and boundary hygiene',
          review:
            'Review props/emits contracts, slot usage, and avoiding mutation-driven coupling.',
          microDrills: [
            'Explain props-down/emits-up with one anti-pattern example.',
            'Describe when scoped slots are better than prop expansion.',
            'Patch one prop-mutation bug by moving ownership up.',
          ],
          refs: [
            {
              id: 'vue-child-mutates-prop-directly',
              title: 'What breaks if a child mutates a prop directly?',
              filePath: 'frontend/src/assets/questions/vue/trivia.json',
              route: ['/', 'vue', 'trivia', 'vue-child-mutates-prop-directly'],
              routeUrl: '/vue/trivia/vue-child-mutates-prop-directly',
            },
            {
              id: 'vue-slots-default-named-scoped-slot-props',
              title: 'Explain Slots in Vue: default vs named vs scoped slots — and how slot props enable child-to-parent data flow',
              filePath: 'frontend/src/assets/questions/vue/trivia.json',
              route: ['/', 'vue', 'trivia', 'vue-slots-default-named-scoped-slot-props'],
              routeUrl: '/vue/trivia/vue-slots-default-named-scoped-slot-props',
            },
            {
              id: 'vue-transfer-list',
              title: 'Transfer List (Move Selected Items Between Two Lists)',
              filePath: 'frontend/src/assets/questions/vue/coding.json',
              route: ['/', 'vue', 'coding', 'vue-transfer-list'],
              routeUrl: '/vue/coding/vue-transfer-list',
            },
          ],
        },
        {
          title: 'Router flow and navigation decisions',
          review:
            'Review route navigation mechanics, guard reasoning, and route-architecture trade-offs.',
          microDrills: [
            'Explain one guard path including redirect and loop prevention.',
            'Describe one dynamic-param update scenario and expected component behavior.',
            'State one lazy-route benefit and one caveat.',
          ],
          refs: [
            {
              id: 'vue-router-navigation',
              title: 'What is the Vue Router and how is it used for navigation?',
              filePath: 'frontend/src/assets/questions/vue/trivia.json',
              route: ['/', 'vue', 'trivia', 'vue-router-navigation'],
              routeUrl: '/vue/trivia/vue-router-navigation',
            },
            {
              id: 'vue-architecture-decisions-scalability',
              title: 'What architectural decisions are made when creating a Vue project, and how do they affect scalability?',
              filePath: 'frontend/src/assets/questions/vue/trivia.json',
              route: ['/', 'vue', 'trivia', 'vue-architecture-decisions-scalability'],
              routeUrl: '/vue/trivia/vue-architecture-decisions-scalability',
            },
          ],
        },
        {
          title: 'Store boundaries and shared-state discipline',
          review:
            'Review what should stay local vs shared, and how to keep state updates predictable.',
          microDrills: [
            'Decide local vs global ownership for one prompt before coding.',
            'Explain one store action flow and resulting UI update path.',
            'Name one cost of over-globalizing trivial state.',
          ],
          refs: [
            {
              id: 'vuex-state-management',
              title: 'What is the purpose of Vuex, and how does it help manage state in large applications?',
              filePath: 'frontend/src/assets/questions/vue/trivia.json',
              route: ['/', 'vue', 'trivia', 'vuex-state-management'],
              routeUrl: '/vue/trivia/vuex-state-management',
            },
            {
              id: 'vue-shopping-cart',
              title: 'Vue Shopping Cart Mini',
              filePath: 'frontend/src/assets/questions/vue/coding.json',
              route: ['/', 'vue', 'coding', 'vue-shopping-cart'],
              routeUrl: '/vue/coding/vue-shopping-cart',
            },
          ],
        },
        {
          title: 'Performance and list-identity reliability',
          review:
            'Review key stability, diffing behavior, and practical rerender-cost discipline.',
          microDrills: [
            'Explain why index keys fail in reorder scenarios.',
            'Predict one bad-key UI bug before running the example.',
            'Apply one list optimization and validate behavior still matches requirements.',
          ],
          refs: [
            {
              id: 'vue-v-for-keys-why-not-index',
              title: 'Why are keys critical in v-for? What exactly breaks when you use array index as a key?',
              filePath: 'frontend/src/assets/questions/vue/trivia.json',
              route: ['/', 'vue', 'trivia', 'vue-v-for-keys-why-not-index'],
              routeUrl: '/vue/trivia/vue-v-for-keys-why-not-index',
            },
            {
              id: 'vue-virtual-dom-diffing',
              title: 'How does Vue’s virtual DOM and diffing algorithm optimize updates?',
              filePath: 'frontend/src/assets/questions/vue/trivia.json',
              route: ['/', 'vue', 'trivia', 'vue-virtual-dom-diffing'],
              routeUrl: '/vue/trivia/vue-virtual-dom-diffing',
            },
            {
              id: 'vue-filterable-user-list',
              title: 'Vue Filterable / Searchable User List',
              filePath: 'frontend/src/assets/questions/vue/coding.json',
              route: ['/', 'vue', 'coding', 'vue-filterable-user-list'],
              routeUrl: '/vue/coding/vue-filterable-user-list',
            },
          ],
        },
      ],
      nightlyIntro:
        'Run this 45-minute loop for 5–6 nights with strict timing and one written takeaway.',
      nightlyRoutine: {
        trivia:
          '10 min: one reactivity/timing prompt plus one architecture/perf prompt from the Vue trivia lane.',
        coding:
          '25 min: one UI prompt, minimal version first, then one hardening pass for edge cases.',
        review:
          '10 min: fill the mistake log and set tomorrow’s first drill before stopping.',
      },
      mistakeTemplate: [
        'Bug I hit:',
        'Root cause (model gap, timing issue, state boundary, or identity bug):',
        'Fix I used:',
        'Prevention rule for tomorrow:',
      ],
      nightlyRefs: [
        {
          id: 'vue-reactivity-system',
          title: 'What is the Vue reactivity system and how does it work internally?',
          filePath: 'frontend/src/assets/questions/vue/trivia.json',
          route: ['/', 'vue', 'trivia', 'vue-reactivity-system'],
          routeUrl: '/vue/trivia/vue-reactivity-system',
        },
        {
          id: 'vue-debounced-search',
          title: 'Vue Debounced Search with Fake API',
          filePath: 'frontend/src/assets/questions/vue/coding.json',
          route: ['/', 'vue', 'coding', 'vue-debounced-search'],
          routeUrl: '/vue/coding/vue-debounced-search',
        },
      ],
      predictionIntro:
        'Use these predict-behavior prompts before coding; say expected behavior first, then verify.',
      predictions: [
        {
          prompt:
            'Predict which updates fire when using ref vs reactive in one nested-state scenario.',
          ref: {
            id: 'vue-ref-vs-reactive-difference-traps',
            title: 'ref vs reactive in Vue: what’s the real difference, when should you use each, and what are the common reactivity traps?',
            filePath: 'frontend/src/assets/questions/vue/trivia.json',
            route: ['/', 'vue', 'trivia', 'vue-ref-vs-reactive-difference-traps'],
            routeUrl: '/vue/trivia/vue-ref-vs-reactive-difference-traps',
          },
        },
        {
          prompt:
            'Predict when DOM is actually safe to read after a state write, then verify with nextTick timing.',
          ref: {
            id: 'vue-nexttick-dom-update-queue',
            title: 'What does nextTick() do in Vue, and why are DOM measurements wrong immediately after a state change?',
            filePath: 'frontend/src/assets/questions/vue/trivia.json',
            route: ['/', 'vue', 'trivia', 'vue-nexttick-dom-update-queue'],
            routeUrl: '/vue/trivia/vue-nexttick-dom-update-queue',
          },
        },
        {
          prompt:
            'Predict whether watch or watchEffect will rerun first in a side-effect flow and explain loop risk.',
          ref: {
            id: 'vue-watch-vs-watcheffect-differences-infinite-loops',
            title: 'watch vs watchEffect in Vue: what’s the difference, when does each run, and how can you accidentally create infinite loops?',
            filePath: 'frontend/src/assets/questions/vue/trivia.json',
            route: ['/', 'vue', 'trivia', 'vue-watch-vs-watcheffect-differences-infinite-loops'],
            routeUrl: '/vue/trivia/vue-watch-vs-watcheffect-differences-infinite-loops',
          },
        },
      ],
      redFlags: [
        {
          flag: 'Mutating props directly instead of preserving ownership boundaries.',
          refs: [
            {
              id: 'vue-child-mutates-prop-directly',
              title: 'What breaks if a child mutates a prop directly?',
              filePath: 'frontend/src/assets/questions/vue/trivia.json',
              route: ['/', 'vue', 'trivia', 'vue-child-mutates-prop-directly'],
              routeUrl: '/vue/trivia/vue-child-mutates-prop-directly',
            },
            {
              id: 'vue-transfer-list',
              title: 'Transfer List (Move Selected Items Between Two Lists)',
              filePath: 'frontend/src/assets/questions/vue/coding.json',
              route: ['/', 'vue', 'coding', 'vue-transfer-list'],
              routeUrl: '/vue/coding/vue-transfer-list',
            },
          ],
        },
        {
          flag: 'Using watch for derived values that should be computed.',
          refs: [
            {
              id: 'vue-computed-vs-watchers',
              title: 'Computed vs watch in Vue: derived state (cached) vs side effects (imperative)',
              filePath: 'frontend/src/assets/questions/vue/trivia.json',
              route: ['/', 'vue', 'trivia', 'vue-computed-vs-watchers'],
              routeUrl: '/vue/trivia/vue-computed-vs-watchers',
            },
            {
              id: 'vue-contact-form-starter',
              title: 'Contact Form (Single File Component + Fetch)',
              filePath: 'frontend/src/assets/questions/vue/coding.json',
              route: ['/', 'vue', 'coding', 'vue-contact-form-starter'],
              routeUrl: '/vue/coding/vue-contact-form-starter',
            },
          ],
        },
        {
          flag: 'Timing bugs from reading DOM before update flush.',
          refs: [
            {
              id: 'vue-nexttick-dom-update-queue',
              title: 'What does nextTick() do in Vue, and why are DOM measurements wrong immediately after a state change?',
              filePath: 'frontend/src/assets/questions/vue/trivia.json',
              route: ['/', 'vue', 'trivia', 'vue-nexttick-dom-update-queue'],
              routeUrl: '/vue/trivia/vue-nexttick-dom-update-queue',
            },
            {
              id: 'vue-tabs-switcher',
              title: 'Vue Tabs / Multi-View Switcher',
              filePath: 'frontend/src/assets/questions/vue/coding.json',
              route: ['/', 'vue', 'coding', 'vue-tabs-switcher'],
              routeUrl: '/vue/coding/vue-tabs-switcher',
            },
          ],
        },
        {
          flag: 'List identity bugs from unstable keys in dynamic data.',
          refs: [
            {
              id: 'vue-v-for-keys-why-not-index',
              title: 'Why are keys critical in v-for? What exactly breaks when you use array index as a key?',
              filePath: 'frontend/src/assets/questions/vue/trivia.json',
              route: ['/', 'vue', 'trivia', 'vue-v-for-keys-why-not-index'],
              routeUrl: '/vue/trivia/vue-v-for-keys-why-not-index',
            },
            {
              id: 'vue-filterable-user-list',
              title: 'Vue Filterable / Searchable User List',
              filePath: 'frontend/src/assets/questions/vue/coding.json',
              route: ['/', 'vue', 'coding', 'vue-filterable-user-list'],
              routeUrl: '/vue/coding/vue-filterable-user-list',
            },
          ],
        },
      ],
      emergencyIntro:
        'If you only have 2 hours, run these three blocks in order.',
      emergencyBlocks: [
        {
          duration: '35 min',
          action:
            'Reactivity and watcher model recap with one concrete timing prediction.',
          refs: [
            {
              id: 'vue-ref-vs-reactive-difference-traps',
              title: 'ref vs reactive in Vue: what’s the real difference, when should you use each, and what are the common reactivity traps?',
              filePath: 'frontend/src/assets/questions/vue/trivia.json',
              route: ['/', 'vue', 'trivia', 'vue-ref-vs-reactive-difference-traps'],
              routeUrl: '/vue/trivia/vue-ref-vs-reactive-difference-traps',
            },
            {
              id: 'vue-watch-vs-watcheffect-differences-infinite-loops',
              title: 'watch vs watchEffect in Vue: what’s the difference, when does each run, and how can you accidentally create infinite loops?',
              filePath: 'frontend/src/assets/questions/vue/trivia.json',
              route: ['/', 'vue', 'trivia', 'vue-watch-vs-watcheffect-differences-infinite-loops'],
              routeUrl: '/vue/trivia/vue-watch-vs-watcheffect-differences-infinite-loops',
            },
          ],
        },
        {
          duration: '50 min',
          action:
            'One async UI implementation end-to-end with stale-result and loading/error hardening.',
          refs: [
            {
              id: 'vue-debounced-search',
              title: 'Vue Debounced Search with Fake API',
              filePath: 'frontend/src/assets/questions/vue/coding.json',
              route: ['/', 'vue', 'coding', 'vue-debounced-search'],
              routeUrl: '/vue/coding/vue-debounced-search',
            },
          ],
        },
        {
          duration: '35 min',
          action:
            'Fast reliability pass on key stability and prop/event boundaries.',
          refs: [
            {
              id: 'vue-v-for-keys-why-not-index',
              title: 'Why are keys critical in v-for? What exactly breaks when you use array index as a key?',
              filePath: 'frontend/src/assets/questions/vue/trivia.json',
              route: ['/', 'vue', 'trivia', 'vue-v-for-keys-why-not-index'],
              routeUrl: '/vue/trivia/vue-v-for-keys-why-not-index',
            },
            {
              id: 'vue-child-mutates-prop-directly',
              title: 'What breaks if a child mutates a prop directly?',
              filePath: 'frontend/src/assets/questions/vue/trivia.json',
              route: ['/', 'vue', 'trivia', 'vue-child-mutates-prop-directly'],
              routeUrl: '/vue/trivia/vue-child-mutates-prop-directly',
            },
          ],
        },
      ],
      closing:
        'Section 8 answers the practical questions that usually decide what to keep and what to skip in the final stretch.',
    },
    faqInitialOpenId: 'vue-faq-composition-options',
    faqGroups: [
      {
        id: 'vue-faq-core',
        title: 'Core Vue mechanics',
        items: [
          {
            id: 'vue-faq-composition-options',
            q: 'Composition API vs Options API: what should I say in interviews?',
            a: 'A strong answer is not “one is good, one is bad”; it is about boundaries and maintainability. Composition API usually gives cleaner reuse and dependency grouping as features grow, while Options API is still valid for smaller stable components. In Vue interview preparation, a high-signal answer is knowing when repeated logic or tangled lifecycle/state concerns justify refactoring to Composition API. <strong>Where to practice in FrontendAtlas:</strong> <code>/vue/trivia/vue-composition-api-vs-mixins</code>, <code>/vue/trivia/vue-composition-api</code>, <code>/vue/trivia/vue-sfc-vs-global-components</code>.',
          },
          {
            id: 'vue-faq-ref-reactive',
            q: 'How do I decide between ref and reactive without guessing?',
            a: 'Many Vue interview questions here are update-prediction checks, not API recall checks. Use <code>ref</code> for explicit value wrappers or primitives, and <code>reactive</code> when object-shaped state should be tracked deeply. <strong>Practical rule:</strong> if you cannot explain what triggers the next update, stop and restate the state shape first. <strong>Where to practice in FrontendAtlas:</strong> <code>/vue/trivia/vue-ref-vs-reactive-difference-traps</code>, <code>/vue/trivia/vue-reactivity-system</code>, <code>/vue/coding/vue-todo-list</code>.',
          },
          {
            id: 'vue-faq-computed-watch',
            q: 'Computed vs watch vs watchEffect: what is the interview-safe framing?',
            a: 'Treat computed as derived state and watch/watchEffect as side-effect tools, then explain timing and cleanup explicitly. Weak answers usually mix those responsibilities and patch symptoms with extra watchers. <strong>Practical rule:</strong> if output is purely derived from reactive inputs, start with computed and move to watch only when a side effect is required. <strong>Where to practice in FrontendAtlas:</strong> <code>/vue/trivia/vue-computed-vs-watchers</code>, <code>/vue/trivia/vue-watch-vs-watcheffect-differences-infinite-loops</code>, <code>/vue/coding/vue-debounced-search</code>.',
          },
          {
            id: 'vue-faq-nexttick',
            q: 'When should I use nextTick, and when is it overkill?',
            a: 'Use <code>nextTick</code> when you must read or act on DOM after Vue flushes pending updates; avoid using it as a default patch for unclear state flow. Strong answers explain render scheduling first, then justify nextTick as a narrow tool. <strong>Practical rule:</strong> if the task is DOM-dependent (measure/focus/scroll after state change), nextTick is valid; otherwise fix the reactive flow itself. <strong>Where to practice in FrontendAtlas:</strong> <code>/vue/trivia/vue-nexttick-dom-update-queue</code>, <code>/vue/trivia/vue-lifecycle-hooks</code>, <code>/vue/coding/vue-tabs-switcher</code>.',
          },
        ],
      },
      {
        id: 'vue-faq-architecture',
        title: 'Architecture and execution',
        items: [
          {
            id: 'vue-faq-state-management',
            q: 'Pinia vs local component state (and Vuex as legacy): how should I answer?',
            a: 'Anchor your answer on ownership and lifetime, not tool popularity. Keep local UI concerns local, and move state into a store only when ownership is shared across screens or distant components. Vuex still matters conceptually in legacy systems, but your reasoning should stay boundary-first. <strong>Practical rule:</strong> if state has one owner and short lifetime, do not globalize it early. <strong>Where to practice in FrontendAtlas:</strong> <code>/vue/trivia/vuex-state-management</code>, <code>/vue/trivia/vue-architecture-decisions-scalability</code>, <code>/vue/coding/vue-shopping-cart</code>.',
          },
          {
            id: 'vue-faq-router-guards',
            q: 'How deep does router guard knowledge need to be?',
            a: 'For a frontend interview, explain guard intent, redirect safety, and async decision timing clearly. You do not need exotic router internals, but you do need to avoid loop-prone logic and ambiguous outcomes. <strong>Practical rule:</strong> every guard answer should state allowed path, denied path, and fallback destination in one pass. <strong>Where to practice in FrontendAtlas:</strong> <code>/vue/trivia/vue-router-navigation</code> and filtered drills at <code>/coding?tech=vue&amp;kind=trivia&amp;q=router</code>.',
          },
          {
            id: 'vue-faq-nuxt',
            q: 'Do I need Nuxt knowledge for Vue interviews?',
            a: 'Nuxt can matter for SSR-focused roles, but many loops still evaluate core Vue rendering, reactivity, and component architecture first. In this codebase, Nuxt-specific guides or question sets are not found in codebase, so prep here should stay focused on core Vue signals. If your target role is explicitly SSR-heavy, add a separate Nuxt block after your core flow is stable.',
          },
          {
            id: 'vue-faq-senior',
            q: 'What differentiates a strong answer in a senior Vue interview?',
            a: 'The key difference is decision quality under constraints, not just final output. Strong candidates clarify assumptions, define state transitions early, and explain trade-offs around timing, store boundaries, and component APIs without rambling. <strong>Practical rule:</strong> state one reason for your chosen approach and one rejected alternative before moving on.',
          },
          {
            id: 'vue-faq-next-steps',
            q: 'What should I do next after reading this FAQ?',
            a: 'Use Section 6 as your weekly execution plan and Section 7 as your final-week compression loop. Keep sessions short and repeatable: one concept drill, one implementation drill, one written prevention rule. Follow that sequence consistently and your explanations/implementation flow gets much more predictable.',
          },
        ],
      },
      {
        id: 'vue-faq-evidence',
        title: 'Evidence index',
        items: [
          {
            id: 'vue-faq-evidence-compact',
            q: 'Compact evidence index for FAQ drill references',
            a: '<ul><li><strong>Composition + SFC patterns:</strong> <code>vue-composition-api-vs-mixins</code>, <code>vue-composition-api</code>, <code>vue-sfc-vs-global-components</code> — file: <code>frontend/src/assets/questions/vue/trivia.json</code> — routes: <code>/vue/trivia/vue-composition-api-vs-mixins</code>, <code>/vue/trivia/vue-composition-api</code>, <code>/vue/trivia/vue-sfc-vs-global-components</code></li><li><strong>Reactivity + watchers:</strong> <code>vue-ref-vs-reactive-difference-traps</code>, <code>vue-reactivity-system</code>, <code>vue-computed-vs-watchers</code>, <code>vue-watch-vs-watcheffect-differences-infinite-loops</code> — file: <code>frontend/src/assets/questions/vue/trivia.json</code> — routes: <code>/vue/trivia/vue-ref-vs-reactive-difference-traps</code>, <code>/vue/trivia/vue-reactivity-system</code>, <code>/vue/trivia/vue-computed-vs-watchers</code>, <code>/vue/trivia/vue-watch-vs-watcheffect-differences-infinite-loops</code></li><li><strong>Timing + lifecycle:</strong> <code>vue-nexttick-dom-update-queue</code>, <code>vue-lifecycle-hooks</code> — file: <code>frontend/src/assets/questions/vue/trivia.json</code> — routes: <code>/vue/trivia/vue-nexttick-dom-update-queue</code>, <code>/vue/trivia/vue-lifecycle-hooks</code></li><li><strong>Router + state boundaries:</strong> <code>vue-router-navigation</code>, <code>vuex-state-management</code>, <code>vue-architecture-decisions-scalability</code> — file: <code>frontend/src/assets/questions/vue/trivia.json</code> — routes: <code>/vue/trivia/vue-router-navigation</code>, <code>/vue/trivia/vuex-state-management</code>, <code>/vue/trivia/vue-architecture-decisions-scalability</code></li><li><strong>Coding drills:</strong> <code>vue-todo-list</code>, <code>vue-debounced-search</code>, <code>vue-tabs-switcher</code>, <code>vue-shopping-cart</code> — file: <code>frontend/src/assets/questions/vue/coding.json</code> — routes: <code>/vue/coding/vue-todo-list</code>, <code>/vue/coding/vue-debounced-search</code>, <code>/vue/coding/vue-tabs-switcher</code>, <code>/vue/coding/vue-shopping-cart</code></li></ul>',
          },
        ],
      },
    ],
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
        label: 'Vue coding challenges',
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
        <section class="jp-mastery-callout">
          <h2>JavaScript 0 to 100 mastery track</h2>
          <p>
            Prefer a structured drill board over long-form reading? Use the mastery crash track for module checkpoints,
            mixed trivia + coding flow, and progress tracking.
          </p>
          <a [routerLink]="['/guides/framework-prep/javascript-prep-path/mastery']">
            Open JavaScript mastery crash track
          </a>
        </section>

        <div class="jp-layout">
          <section class="jp-section jp-section--1">
        <h2>Section 1 — Introduction</h2>
        <p>
          If your prep feels like jumping between random “JavaScript interview questions” lists, you’re not the problem.
          Most frontend interviews are actually pretty consistent; teams just package the same signals in different prompt shapes.
        </p>
        <p>
          The fastest way to remove that noise is a 3-layer model:
          <strong>Topics</strong> (mental model), <strong>Trivia</strong> (fast explanation), and
          <strong>Coding prompts</strong> (implementation quality under constraints).
          Interviewers usually score all three, even when the prompt looks “small.”
        </p>
        <p>
          Real example: you build search, type fast, and older responses overwrite newer intent. That bug is not
          “just async being weird”; it’s a missing state-transition rule. The same thing appears in interviews when
          they ask why a <code>setTimeout</code> log appears after an <code>await</code>.
        </p>
        <p>
          This guide maps common JavaScript interview topics to the JavaScript coding challenges you actually see in
          loops, so your prep becomes a repeatable system instead of guesswork.
        </p>
        <ul>
          <li>How to use the 3-layer framework (Topics → Trivia → Coding prompts)</li>
          <li>Which JavaScript interview topics show up repeatedly in real rounds</li>
          <li>How to answer quickly without sounding scripted</li>
          <li>How to build robust solutions that survive edge cases and follow-ups</li>
        </ul>
        <p>
          If you keep thinking, “I know JS, but interviews still feel inconsistent,” this page is your reset.
        </p>
          </section>

          <section class="jp-section jp-section--2">
        <h2>Section 2 — Most asked JavaScript interview topics (and what they really test)</h2>
        <p>
          Most rounds recycle the same foundations with new wording. The win is to map
          <strong>JavaScript interview topics</strong> to the exact behavior interviewers score in a real
          <strong>frontend interview</strong>: runtime prediction, clear explanation, and reliable implementation under edge cases.
          Once you train that mapping, JavaScript interview questions feel far less random.
        </p>

        <article class="jp-topic">
        <h3>1) Execution model: event loop, tasks vs microtasks, async/await</h3>
        <p><strong>What they’re testing:</strong> Whether you can mentally simulate scheduling and explain output order under asynchronous flow.</p>
        <p><strong>Common prompts:</strong></p>
        <ul>
          <li>Predict log order with <code>setTimeout</code>, <code>Promise.then</code>, and <code>async/await</code></li>
          <li>Explain why <code>await</code> yields and when execution resumes</li>
          <li>Describe microtasks vs macrotasks with a concrete timeline</li>
        </ul>
        <p><strong>Quick mental model:</strong> Think in timeline form: run stack now, drain microtasks, then move to next macrotask. If you can narrate those transitions out loud, execution-order prompts become mechanical instead of stressful.</p>
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

        </article>

        <article class="jp-topic">
        <h3>2) Scope, closures, hoisting (including TDZ)</h3>
        <p><strong>What they’re testing:</strong> Whether you understand how bindings are resolved over time, not just syntax differences.</p>
        <p><strong>Common prompts:</strong></p>
        <ul>
          <li>Closure behavior inside loops</li>
          <li><code>var</code> vs <code>let/const</code> and TDZ failure cases</li>
          <li>Practical closure use for encapsulation or callbacks</li>
        </ul>
        <p><strong>Quick mental model:</strong> Closures hold references to lexical bindings, not frozen copies. Hoisting creates bindings early, but initialization timing decides what you can read safely at runtime.</p>
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

        </article>

        <article class="jp-topic">
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

        </article>

        <article class="jp-topic">
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

        </article>

        <article class="jp-topic">
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

        </article>

        <article class="jp-topic">
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

        </article>

        <article class="jp-topic">
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

        </article>

        <article class="jp-topic">
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

        </article>

        <article class="jp-topic">
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

        </article>

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
          Trivia rounds are short pressure tests, not definition contests. Interviewers use them to check whether your
          runtime model is stable enough to debug real code, and whether you can explain that model without rambling.
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
          In coding rounds, prompt wording changes but the pattern family usually doesn’t. Interviewers are not grading
          typing speed; they are watching API clarity, async safety, and edge-case discipline while requirements shift.
          If you’ve ever had “it worked, then one follow-up broke everything,” this section is for that moment.
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
          Correct output is table stakes; senior signal comes from process quality. In a
          <strong>senior frontend interview</strong>, you’re scored on how you reduce ambiguity, structure decisions, and discuss
          trade-offs while coding. Strong <strong>JavaScript interview preparation</strong> means rehearsing that behavior, not just
          memorizing answers to <strong>JavaScript interview questions</strong>.
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
          <li>“Let me clarify scope first with a few constraints.”</li>
          <li>“I’ll build the smallest correct version, then harden it.”</li>
          <li>“I’m adding edge-case guards now: empty input, failures, cleanup.”</li>
          <li>“This approach is O(n); alternative X is possible but adds complexity Y.”</li>
          <li>“Quick validation: given A, expect B; given failure C, expect D.”</li>
        </ul>

        <p>
          Next, Section 6 shows how to turn this rubric into a repeatable prep loop with FrontendAtlas using coding
          drills, trivia drills, and guided practice.
        </p>
          </section>

          <section class="jp-section jp-section--6">
        <h2>Section 6 — How to prepare with FrontendAtlas (a practical plan)</h2>
        <p>
          Treat prep like a training block, not a reading list: diagnose, drill, review, repeat. That structure is the
          fastest way to improve <strong>JavaScript interview preparation</strong> quality and stay stable under pressure.
          Most <strong>JavaScript interview questions</strong> feel manageable once your daily loop is consistent.
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
          Final week goal: fewer mistakes, faster recovery, cleaner explanations. Do not add brand-new scope here.
          This stack is tuned for recurring <strong>JavaScript interview questions</strong> under time pressure.
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
          This playbook is built to remove randomness from prep: diagnose weak spots, drill intentionally, and review
          mistakes with a tight feedback loop. If you run the plan consistently for 7, 14, or 30 days, explanations get
          cleaner, implementations get safer, and repeated errors drop. Keep the sequence fixed, then adjust only time
          boxes as your interview date gets closer.
        </p>
          </section>
        </div>
      </ng-container>

      <ng-template #defaultFrameworkContent>
        <div class="fp-content">
        <ng-container *ngIf="config.intro as intro">
          <h2>{{ introSectionHeading() }}</h2>
          <p *ngFor="let paragraph of intro.paragraphs">{{ paragraph }}</p>
          <ul class="fp-list fp-list--intro">
            <li *ngFor="let bullet of intro.bullets">{{ bullet }}</li>
          </ul>
        </ng-container>

        <ng-container *ngIf="config.topicsSection as topicsSection">
          <h2>{{ topicsSectionHeading() }}</h2>
          <p>{{ topicsSection.intro }}</p>
          <p *ngIf="topicsSection.practiceLinks as practiceLinks">
            For targeted practice, use
            <a [routerLink]="practiceLinks.trivia.route" [queryParams]="practiceLinks.trivia.queryParams || null">
              {{ practiceLinks.trivia.label }}
            </a>
            for fast explanation drills and
            <a [routerLink]="practiceLinks.coding.route" [queryParams]="practiceLinks.coding.queryParams || null">
              {{ practiceLinks.coding.label }}
            </a>
            for implementation rounds.
          </p>

          <div *ngFor="let cluster of topicsSection.clusters" class="fp-card fp-card--cluster">
            <h3>{{ cluster.title }}</h3>
            <p><strong>Why it’s asked:</strong> {{ cluster.why }}</p>
            <p><strong>Typical prompts:</strong></p>
            <ul>
              <li *ngFor="let prompt of cluster.prompts">{{ prompt }}</li>
            </ul>
            <p><strong>What good looks like:</strong> {{ cluster.good }}</p>
          </div>

          <h3>Frequency snapshot</h3>
          <div class="fp-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Frequency</th>
                  <th>Topics</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of topicsSection.frequencyRows">
                  <td>{{ row.frequency }}</td>
                  <td>{{ row.topics }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>{{ topicsSection.closing }}</p>
        </ng-container>

        <ng-container *ngIf="config.triviaSection as triviaSection">
          <h2>{{ triviaSectionHeading() }}</h2>
          <p>{{ triviaSection.intro }}</p>
          <p *ngIf="triviaSection.practiceLinks as practiceLinks">
            Use
            <a [routerLink]="practiceLinks.trivia.route" [queryParams]="practiceLinks.trivia.queryParams || null">
              {{ practiceLinks.trivia.label }}
            </a>
            to sharpen explanation speed, then reinforce with
            <a [routerLink]="practiceLinks.coding.route" [queryParams]="practiceLinks.coding.queryParams || null">
              {{ practiceLinks.coding.label }}
            </a>
            for implementation transfer.
          </p>

          <div *ngFor="let cluster of triviaSection.clusters" class="fp-card fp-card--cluster">
            <h3>{{ cluster.title }}</h3>
            <p><strong>Why they ask it:</strong> {{ cluster.why }}</p>
            <p><strong>Common trivia questions:</strong></p>
            <ul>
              <li *ngFor="let question of cluster.questions">{{ question }}</li>
            </ul>
            <p><strong>60-second answer skeleton:</strong></p>
            <ul>
              <li *ngFor="let answer of cluster.answerSkeleton">{{ answer }}</li>
            </ul>
            <p><strong>Common traps:</strong></p>
            <ul>
              <li *ngFor="let trap of cluster.traps">{{ trap }}</li>
            </ul>
            <p><strong>How to practice:</strong> {{ cluster.practice }}</p>
            <ul *ngIf="cluster.drills?.length" class="fp-list fp-list--compact fp-ref-list">
              <li *ngFor="let drill of cluster.drills" class="fp-ref-item">
                <a
                  class="fp-ref-link"
                  [routerLink]="drill.route"
                  [queryParams]="drill.queryParams || null"
                >
                  {{ drill.label }}
                </a>
                <span class="fp-ref-id" *ngIf="drill.note">{{ drill.note }}</span>
              </li>
            </ul>
          </div>

          <h3>How to practice this section efficiently</h3>
          <p>{{ triviaSection.practiceIntro }}</p>
          <ul class="fp-list fp-list--boxed">
            <li *ngFor="let step of triviaSection.practiceSteps">{{ step }}</li>
          </ul>
          <p>{{ triviaSection.closing }}</p>
        </ng-container>

        <ng-container *ngIf="config.codingPatternsSection as codingPatternsSection">
          <h2>{{ codingPatternsSectionHeading() }}</h2>
          <p>{{ codingPatternsSection.intro }}</p>
          <p *ngIf="codingPatternsSection.practiceLinks as practiceLinks">
            Use
            <a [routerLink]="practiceLinks.coding.route" [queryParams]="practiceLinks.coding.queryParams || null">
              {{ practiceLinks.coding.label }}
            </a>
            for implementation reps
            <ng-container *ngIf="practiceLinks.trivia as triviaLink">
              and
              <a [routerLink]="triviaLink.route" [queryParams]="triviaLink.queryParams || null">
                {{ triviaLink.label }}
              </a>
              for concept-speed reinforcement
            </ng-container>.
          </p>

          <div *ngFor="let pattern of codingPatternsSection.patterns" class="fp-card fp-card--cluster">
            <h3>{{ pattern.title }}</h3>
            <p><strong>Prompt template:</strong> {{ pattern.promptTemplate }}</p>
            <p><strong>What they’re testing:</strong> {{ pattern.testing }}</p>
            <p><strong>What good looks like:</strong> {{ pattern.good }}</p>
            <p><strong>Common pitfalls:</strong></p>
            <ul>
              <li *ngFor="let pitfall of pattern.pitfalls">{{ pitfall }}</li>
            </ul>
            <p *ngIf="pattern.variation"><strong>Variation (easy / medium / hard):</strong> {{ pattern.variation }}</p>
            <ul *ngIf="pattern.drills?.length" class="fp-list fp-list--compact fp-ref-list">
              <li *ngFor="let drill of pattern.drills" class="fp-ref-item">
                <a
                  class="fp-ref-link"
                  [routerLink]="drill.route"
                  [queryParams]="drill.queryParams || null"
                >
                  {{ drill.label }}
                </a>
                <span class="fp-ref-id" *ngIf="drill.note">{{ drill.note }}</span>
              </li>
            </ul>
          </div>

          <h3>{{ codingPatternsSection.rubricTitle }}</h3>
          <p>{{ codingPatternsSection.rubricIntro }}</p>
          <ul class="fp-list fp-list--boxed">
            <li *ngFor="let item of codingPatternsSection.rubricItems">{{ item }}</li>
          </ul>

          <h3>{{ codingPatternsSection.flowTitle }}</h3>
          <p>{{ codingPatternsSection.flowIntro }}</p>
          <ol>
            <li *ngFor="let step of codingPatternsSection.flowSteps">{{ step }}</li>
          </ol>
          <p>{{ codingPatternsSection.closing }}</p>
        </ng-container>

        <ng-container *ngIf="config.seniorSignalsSection as seniorSignalsSection">
          <h2>{{ seniorSignalsSectionHeading() }}</h2>
          <p>{{ seniorSignalsSection.intro }}</p>
          <p *ngIf="seniorSignalsSection.practiceLinks as practiceLinks">
            Calibrate with
            <a
              *ngIf="practiceLinks.coding as codingLink"
              [routerLink]="codingLink.route"
              [queryParams]="codingLink.queryParams || null"
            >
              {{ codingLink.label }}
            </a>
            <ng-container *ngIf="practiceLinks.trivia as triviaLink">
              and
              <a [routerLink]="triviaLink.route" [queryParams]="triviaLink.queryParams || null">
                {{ triviaLink.label }}
              </a>
            </ng-container>
            to pressure-test this rubric in realistic loops.
          </p>

          <div *ngFor="let signal of seniorSignalsSection.signals" class="fp-card fp-card--cluster">
            <h3>{{ signal.title }}</h3>
            <p><strong>What they’re evaluating:</strong> {{ signal.evaluating }}</p>
            <p><strong>What good looks like:</strong></p>
            <ul>
              <li *ngFor="let good of signal.good">{{ good }}</li>
            </ul>
            <p><strong>Red flags:</strong></p>
            <ul>
              <li *ngFor="let redFlag of signal.redFlags">{{ redFlag }}</li>
            </ul>
          </div>

          <h3>{{ seniorSignalsSection.scriptTitle }}</h3>
          <ol>
            <li *ngFor="let step of seniorSignalsSection.scriptSteps">{{ step }}</li>
          </ol>
          <p>{{ seniorSignalsSection.closing }}</p>
        </ng-container>

        <ng-container *ngIf="config.practicalPlanSection as practicalPlanSection">
          <h2>{{ practicalPlanSectionHeading() }}</h2>
          <p *ngFor="let paragraph of practicalPlanSection.opener">{{ paragraph }}</p>

          <h3>Where to practice in FrontendAtlas</h3>
          <ul class="fp-list fp-list--boxed">
            <li *ngFor="let entry of practicalPlanSection.practiceMap">
              <a [routerLink]="entry.route" [queryParams]="entry.queryParams || null">{{ entry.label }}</a>
              — {{ entry.note }}
            </li>
          </ul>

          <h3>7-day plan</h3>
          <p>{{ practicalPlanSection.plan7.intro }}</p>
          <ul class="fp-list fp-list--boxed">
            <li *ngFor="let emphasis of practicalPlanSection.plan7.emphasis">{{ emphasis }}</li>
          </ul>
          <p><strong>45 min/day (warmup → main drill → review)</strong></p>
          <ul class="fp-list fp-list--compact">
            <li><strong>Warmup:</strong> {{ practicalPlanSection.plan7.routine45.warmup }}</li>
            <li><strong>Main drill:</strong> {{ practicalPlanSection.plan7.routine45.main }}</li>
            <li><strong>Review:</strong> {{ practicalPlanSection.plan7.routine45.review }}</li>
          </ul>
          <p><strong>90 min/day (warmup → main drill → review)</strong></p>
          <ul class="fp-list fp-list--compact">
            <li><strong>Warmup:</strong> {{ practicalPlanSection.plan7.routine90.warmup }}</li>
            <li><strong>Main drill:</strong> {{ practicalPlanSection.plan7.routine90.main }}</li>
            <li><strong>Review:</strong> {{ practicalPlanSection.plan7.routine90.review }}</li>
          </ul>
          <p><strong>Checkpoint</strong></p>
          <ul class="fp-list fp-list--boxed">
            <li *ngFor="let item of practicalPlanSection.plan7.checkpoints">{{ item }}</li>
          </ul>

          <h3>14-day plan</h3>
          <p>{{ practicalPlanSection.plan14.intro }}</p>
          <ul class="fp-list fp-list--boxed">
            <li *ngFor="let emphasis of practicalPlanSection.plan14.emphasis">{{ emphasis }}</li>
          </ul>
          <p><strong>45 min/day (warmup → main drill → review)</strong></p>
          <ul class="fp-list fp-list--compact">
            <li><strong>Warmup:</strong> {{ practicalPlanSection.plan14.routine45.warmup }}</li>
            <li><strong>Main drill:</strong> {{ practicalPlanSection.plan14.routine45.main }}</li>
            <li><strong>Review:</strong> {{ practicalPlanSection.plan14.routine45.review }}</li>
          </ul>
          <p><strong>90 min/day (warmup → main drill → review)</strong></p>
          <ul class="fp-list fp-list--compact">
            <li><strong>Warmup:</strong> {{ practicalPlanSection.plan14.routine90.warmup }}</li>
            <li><strong>Main drill:</strong> {{ practicalPlanSection.plan14.routine90.main }}</li>
            <li><strong>Review:</strong> {{ practicalPlanSection.plan14.routine90.review }}</li>
          </ul>
          <p><strong>Checkpoint</strong></p>
          <ul class="fp-list fp-list--boxed">
            <li *ngFor="let item of practicalPlanSection.plan14.checkpoints">{{ item }}</li>
          </ul>

          <h3>30-day plan</h3>
          <p>{{ practicalPlanSection.plan30.intro }}</p>
          <ul class="fp-list fp-list--boxed">
            <li *ngFor="let emphasis of practicalPlanSection.plan30.emphasis">{{ emphasis }}</li>
          </ul>
          <p><strong>45 min/day (warmup → main drill → review)</strong></p>
          <ul class="fp-list fp-list--compact">
            <li><strong>Warmup:</strong> {{ practicalPlanSection.plan30.routine45.warmup }}</li>
            <li><strong>Main drill:</strong> {{ practicalPlanSection.plan30.routine45.main }}</li>
            <li><strong>Review:</strong> {{ practicalPlanSection.plan30.routine45.review }}</li>
          </ul>
          <p><strong>90 min/day (warmup → main drill → review)</strong></p>
          <ul class="fp-list fp-list--compact">
            <li><strong>Warmup:</strong> {{ practicalPlanSection.plan30.routine90.warmup }}</li>
            <li><strong>Main drill:</strong> {{ practicalPlanSection.plan30.routine90.main }}</li>
            <li><strong>Review:</strong> {{ practicalPlanSection.plan30.routine90.review }}</li>
          </ul>
          <p><strong>Checkpoint</strong></p>
          <ul class="fp-list fp-list--boxed">
            <li *ngFor="let item of practicalPlanSection.plan30.checkpoints">{{ item }}</li>
          </ul>

          <h3>Decision tree</h3>
          <p>{{ practicalPlanSection.decisionIntro }}</p>
          <div *ngFor="let leaf of practicalPlanSection.decisionLeaves" class="fp-card fp-card--decision">
            <h4>{{ leaf.weakSpot }}</h4>
            <ul class="fp-list fp-list--compact">
              <li *ngFor="let action of leaf.actions">{{ action }}</li>
            </ul>
            <ul class="fp-list fp-list--boxed">
              <li *ngFor="let entry of leaf.practice">
                <a [routerLink]="entry.route" [queryParams]="entry.queryParams || null">{{ entry.label }}</a>
                — {{ entry.note }}
              </li>
            </ul>
          </div>

          <h3>Last-week routine</h3>
          <ul class="fp-list fp-list--boxed">
            <li *ngFor="let step of practicalPlanSection.lastWeekRoutine">{{ step }}</li>
          </ul>

          <p>{{ practicalPlanSection.closing }}</p>
        </ng-container>

        <ng-container *ngIf="config.cheatSheetSection as cheatSheetSection">
          <h2>{{ cheatSheetSectionHeading() }}</h2>
          <p *ngFor="let paragraph of cheatSheetSection.opener">{{ paragraph }}</p>

          <h3>80/20 stack</h3>
          <div *ngFor="let cluster of cheatSheetSection.clusters" class="fp-card fp-card--cluster">
            <h4>{{ cluster.title }}</h4>
            <p><strong>What to review:</strong> {{ cluster.review }}</p>
            <p><strong>Micro-drills:</strong></p>
            <ul>
              <li *ngFor="let drill of cluster.microDrills">{{ drill }}</li>
            </ul>
            <p><strong>Practice items:</strong></p>
            <ul class="fp-list fp-list--boxed fp-ref-list">
              <li *ngFor="let ref of cluster.refs" class="fp-ref-item">
                <a class="fp-ref-link" [routerLink]="ref.route">{{ ref.title }}</a>
                <code class="fp-ref-id">{{ ref.id }}</code>
              </li>
            </ul>
          </div>

          <h3>45-minute nightly routine</h3>
          <p>{{ cheatSheetSection.nightlyIntro }}</p>
          <ul class="fp-list fp-list--boxed">
            <li><strong>10 min trivia sprint:</strong> {{ cheatSheetSection.nightlyRoutine.trivia }}</li>
            <li><strong>25 min coding sprint:</strong> {{ cheatSheetSection.nightlyRoutine.coding }}</li>
            <li><strong>10 min review loop:</strong> {{ cheatSheetSection.nightlyRoutine.review }}</li>
          </ul>
          <p><strong>Mistake log template</strong></p>
          <ul class="fp-list fp-list--compact">
            <li *ngFor="let row of cheatSheetSection.mistakeTemplate">{{ row }}</li>
          </ul>
          <p><strong>Starter set for nightly loop:</strong></p>
          <ul class="fp-list fp-list--boxed fp-ref-list">
            <li *ngFor="let ref of cheatSheetSection.nightlyRefs" class="fp-ref-item">
              <a class="fp-ref-link" [routerLink]="ref.route">{{ ref.title }}</a>
              <code class="fp-ref-id">{{ ref.id }}</code>
            </li>
          </ul>

          <h3>Output prediction drill</h3>
          <p>{{ cheatSheetSection.predictionIntro }}</p>
          <ul class="fp-list fp-list--boxed">
            <li *ngFor="let item of cheatSheetSection.predictions">
              <div class="fp-ref-prompt">{{ item.prompt }}</div>
              <a class="fp-ref-link" [routerLink]="item.ref.route">{{ item.ref.title }}</a>
              <code class="fp-ref-id">{{ item.ref.id }}</code>
            </li>
          </ul>

          <h3>Red flags</h3>
          <ul class="fp-list fp-list--boxed">
            <li *ngFor="let redFlag of cheatSheetSection.redFlags">
              <strong>{{ redFlag.flag }}</strong>
              <ul class="fp-list fp-list--compact">
                <li *ngFor="let ref of redFlag.refs" class="fp-ref-item">
                  <a class="fp-ref-link" [routerLink]="ref.route">{{ ref.title }}</a>
                  <code class="fp-ref-id">{{ ref.id }}</code>
                </li>
              </ul>
            </li>
          </ul>

          <h3>2-hour emergency plan</h3>
          <p>{{ cheatSheetSection.emergencyIntro }}</p>
          <ul class="fp-list fp-list--boxed">
            <li *ngFor="let block of cheatSheetSection.emergencyBlocks">
              <strong>{{ block.duration }}:</strong> {{ block.action }}
              <ul class="fp-list fp-list--compact">
                <li *ngFor="let ref of block.refs" class="fp-ref-item">
                  <a class="fp-ref-link" [routerLink]="ref.route">{{ ref.title }}</a>
                  <code class="fp-ref-id">{{ ref.id }}</code>
                </li>
              </ul>
            </li>
          </ul>

          <p>{{ cheatSheetSection.closing }}</p>
        </ng-container>

        <ng-container *ngIf="displayFaqGroups.length">
          <h2>{{ faqSectionHeading() }}</h2>
          <app-faq-section
            eyebrow="FAQ"
            [groups]="displayFaqGroups"
            [initialOpenId]="resolvedFaqInitialOpenId()"
          ></app-faq-section>
          <p>
            This section is designed as the final calibration pass: answer what still feels fuzzy,
            then return to the practical plan and cheat sheet to close those gaps with focused drills.
          </p>
        </ng-container>
        </div>

        <ng-container *ngIf="showLegacyDefaultSections">
          <h2>{{ defaultSectionHeading(0, 'Recommended quick path') }}</h2>
          <ol>
            <li *ngFor="let step of config.quickStart">
              <a [routerLink]="step.route" [queryParams]="step.queryParams || null">{{ step.label }}</a>
              — {{ step.note }}
            </li>
          </ol>

          <h2>{{ defaultSectionHeading(1, 'What you should be able to do after this path') }}</h2>
          <ul>
            <li *ngFor="let outcome of config.outcomes">{{ outcome }}</li>
          </ul>

          <h2>{{ defaultSectionHeading(2, 'Common mistakes to avoid') }}</h2>
          <ul>
            <li *ngFor="let mistake of config.mistakes">{{ mistake }}</li>
          </ul>

          <h2>{{ defaultSectionHeading(3, 'Suggested preparation sequence') }}</h2>
          <ol>
            <li *ngFor="let step of config.sequence">
              <a [routerLink]="step.link">{{ step.title }}</a>
              — {{ step.note }}
            </li>
          </ol>

          <h2>{{ defaultSectionHeading(4, 'Practice drills to apply this path') }}</h2>
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
        </ng-container>
      </ng-template>
    </fa-guide-shell>
  `,
  styles: [`
    :host ::ng-deep fa-guide-shell .main {
      max-width: 840px;
      min-width: 0;
    }

    :host ::ng-deep fa-guide-shell .content .fp-content {
      display: grid;
      gap: 8px;
      max-width: 100%;
      min-width: 0;
    }

    :host ::ng-deep fa-guide-shell .content .fp-content a {
      color: var(--uf-accent);
      text-decoration-color: color-mix(in srgb, var(--uf-accent) 78%, transparent);
      text-underline-offset: 2px;
      text-decoration-thickness: 1.3px;
      font-weight: 600;
    }

    :host ::ng-deep fa-guide-shell .content .fp-content a:hover {
      color: var(--uf-accent-strong);
      text-decoration-color: color-mix(in srgb, var(--uf-accent) 92%, transparent);
    }

    :host ::ng-deep fa-guide-shell .content .fp-card {
      position: relative;
      border: 1px solid rgba(255, 255, 255, .10);
      border-radius: 12px;
      padding: 12px 14px 12px 16px;
      background: #10141b;
      margin: 6px 0;
      box-shadow: none;
      max-width: 100%;
      min-width: 0;
      overflow: hidden;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    :host ::ng-deep fa-guide-shell .content .fp-card::before {
      content: '';
      position: absolute;
      left: 0;
      top: 10px;
      bottom: 10px;
      width: 3px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--uf-accent) 58%, var(--uf-border-subtle));
    }

    :host ::ng-deep fa-guide-shell .content .fp-card > h3,
    :host ::ng-deep fa-guide-shell .content .fp-card > h4 {
      margin-top: 0;
      margin-bottom: 6px;
    }

    :host ::ng-deep fa-guide-shell .content .fp-card p,
    :host ::ng-deep fa-guide-shell .content .fp-card ul,
    :host ::ng-deep fa-guide-shell .content .fp-card ol {
      margin: 6px 0;
    }

    :host ::ng-deep fa-guide-shell .content .fp-card p > strong:first-child {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 800;
      letter-spacing: .02em;
      border: 1px solid color-mix(in srgb, var(--uf-accent) 34%, rgba(255, 255, 255, .14));
      border-radius: 999px;
      padding: 4px 11px;
      color: color-mix(in srgb, var(--uf-text-secondary) 95%, transparent);
      background: linear-gradient(
        140deg,
        color-mix(in srgb, var(--uf-accent) 14%, #141a22),
        #141a22
      );
      box-shadow:
        inset 0 0 0 1px color-mix(in srgb, var(--uf-accent) 10%, transparent),
        0 1px 6px rgba(0, 0, 0, 0.22);
      margin-right: 8px;
    }

    :host ::ng-deep fa-guide-shell .content .fp-card p > strong:first-child::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: var(--uf-accent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--uf-accent) 24%, transparent);
    }

    :host ::ng-deep fa-guide-shell .content .fp-list {
      margin: 10px 0;
    }

    :host ::ng-deep fa-guide-shell .content .fp-list--boxed {
      list-style: none;
      margin: 8px 0 10px;
      border: 1px solid rgba(255, 255, 255, .10);
      border-radius: 10px;
      background: #10141b;
      padding: 10px 12px;
      max-width: 100%;
      min-width: 0;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    :host ::ng-deep fa-guide-shell .content .fp-list--boxed > li {
      position: relative;
      padding: 6px 0 6px 16px;
      margin: 0;
      min-width: 0;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    :host ::ng-deep fa-guide-shell .content .fp-list--boxed > li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 14px;
      width: 8px;
      height: 8px;
      border-radius: 999px;
      border: 2px solid color-mix(in srgb, var(--uf-accent) 72%, #4ade80 28%);
      background: transparent;
    }

    :host ::ng-deep fa-guide-shell .content .fp-list--compact {
      margin: 6px 0 10px;
      border-left: 2px solid color-mix(in srgb, var(--uf-accent) 40%, var(--uf-border-subtle));
      background: #10141b;
      border-radius: 0 10px 10px 0;
      padding: 8px 12px 8px 22px;
      max-width: 100%;
      min-width: 0;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    :host ::ng-deep fa-guide-shell .content .fp-list--compact > li {
      margin: 6px 0;
    }

    :host ::ng-deep fa-guide-shell .content .fp-ref-list > li::before {
      display: none;
    }

    :host ::ng-deep fa-guide-shell .content .fp-ref-item {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      border: 1px solid rgba(255, 255, 255, .10);
      border-radius: 10px;
      background: #141a22;
      padding: 8px 10px !important;
      margin: 6px 0 !important;
    }

    :host ::ng-deep fa-guide-shell .content .fp-ref-link {
      font-weight: 600;
      text-decoration: none;
    }

    :host ::ng-deep fa-guide-shell .content .fp-ref-link:hover {
      text-decoration: underline;
    }

    :host ::ng-deep fa-guide-shell .content .fp-ref-id {
      padding: 3px 8px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, .12);
      background: #0f141d;
      color: color-mix(in srgb, var(--uf-text-secondary) 92%, transparent);
    }

    :host ::ng-deep fa-guide-shell .content .fp-ref-prompt {
      margin-bottom: 8px;
      color: color-mix(in srgb, var(--uf-text-secondary) 92%, transparent);
    }

    :host ::ng-deep fa-guide-shell .content .fp-table-wrap {
      margin: 8px 0 10px;
      border: 1px solid rgba(255, 255, 255, .12);
      border-radius: 10px;
      overflow: auto;
      background: #10141b;
      max-width: 100%;
      min-width: 0;
    }

    :host ::ng-deep fa-guide-shell .content .fp-table-wrap table {
      width: 100%;
      min-width: 560px;
      border-collapse: collapse;
      margin: 0;
      table-layout: fixed;
    }

    :host ::ng-deep fa-guide-shell .content .fp-table-wrap th,
    :host ::ng-deep fa-guide-shell .content .fp-table-wrap td {
      text-align: left;
      vertical-align: top;
      padding: 10px 12px;
      border-bottom: 1px solid rgba(255, 255, 255, .10);
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    :host ::ng-deep fa-guide-shell .content .fp-table-wrap th {
      color: #f3f5f7;
      font-weight: 700;
      background: #141a22;
    }

    :host ::ng-deep fa-guide-shell .content .fp-table-wrap tr:last-child td {
      border-bottom: none;
    }

    :host ::ng-deep fa-guide-shell .content .jp-mastery-callout {
      margin: 8px 0 14px;
      border-radius: 14px;
      border: 1px solid color-mix(in srgb, var(--uf-accent) 42%, var(--uf-border-subtle));
      background: color-mix(in srgb, var(--uf-accent) 16%, #121922);
      padding: 13px 14px;
      display: grid;
      gap: 8px;
    }

    :host ::ng-deep fa-guide-shell .content .jp-mastery-callout > h2,
    :host ::ng-deep fa-guide-shell .content .jp-mastery-callout > p {
      margin: 0;
    }

    :host ::ng-deep fa-guide-shell .content .jp-mastery-callout > a {
      width: fit-content;
      text-decoration: none;
      border-radius: 999px;
      border: 1px solid color-mix(in srgb, var(--uf-accent) 54%, var(--uf-border-subtle));
      background: color-mix(in srgb, var(--uf-accent) 22%, #121922);
      color: var(--uf-text-primary);
      font-size: 12px;
      font-weight: 700;
      padding: 7px 11px;
    }

    :host ::ng-deep fa-guide-shell .content .jp-mastery-callout > a:hover {
      background: color-mix(in srgb, var(--uf-accent) 30%, #121922);
    }

    :host ::ng-deep fa-guide-shell .content .jp-layout {
      gap: 14px;
    }

    :host ::ng-deep fa-guide-shell .content .jp-topic {
      margin: 12px 0;
      padding: 10px 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      background: #10141b;
      overflow-wrap: anywhere;
    }

    :host ::ng-deep fa-guide-shell .content .jp-topic > h3 {
      margin-top: 0;
      margin-bottom: 10px;
      padding: 8px 10px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-left: 3px solid color-mix(in srgb, var(--uf-accent) 36%, var(--uf-border-subtle));
      border-radius: 10px;
      background: color-mix(in srgb, var(--uf-text-primary) 4%, var(--uf-surface));
    }

    :host ::ng-deep fa-guide-shell .content .jp-topic > p,
    :host ::ng-deep fa-guide-shell .content .jp-topic > ul {
      margin: 8px 0;
    }

    :host ::ng-deep fa-guide-shell .content .jp-topic > ul {
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      background: #141a22;
      padding: 8px 12px 8px 24px;
      list-style-position: outside;
    }

    :host ::ng-deep fa-guide-shell .content .jp-topic > p > strong:first-child {
      white-space: nowrap;
    }

    :host ::ng-deep fa-guide-shell .content .jp-section--6 > h3,
    :host ::ng-deep fa-guide-shell .content .jp-section--7 > h3 {
      padding-left: 30px;
    }

    :host ::ng-deep fa-guide-shell .content .jp-section--6 > h3::before,
    :host ::ng-deep fa-guide-shell .content .jp-section--7 > h3::before {
      left: 12px;
    }

    :host ::ng-deep fa-guide-shell .content .jp-section--6 > ul,
    :host ::ng-deep fa-guide-shell .content .jp-section--7 > ul {
      list-style-position: outside;
      padding-left: 28px;
    }

    :host ::ng-deep fa-guide-shell .content .jp-section--6 > p,
    :host ::ng-deep fa-guide-shell .content .jp-section--7 > p {
      overflow-wrap: anywhere;
    }

    @media (max-width: 900px) {
      :host ::ng-deep fa-guide-shell .main {
        max-width: 100%;
      }

      :host ::ng-deep fa-guide-shell .content .fp-card {
        padding: 11px 12px 11px 14px;
      }

      :host ::ng-deep fa-guide-shell .content .fp-list--boxed,
      :host ::ng-deep fa-guide-shell .content .fp-list--compact {
        padding-right: 10px;
      }

      :host ::ng-deep fa-guide-shell .content .fp-list--boxed > li {
        padding-left: 14px;
      }

      :host ::ng-deep fa-guide-shell .content .jp-topic {
        padding: 9px 10px;
      }

      :host ::ng-deep fa-guide-shell .content .jp-topic > h3 {
        padding: 7px 9px;
      }

      :host ::ng-deep fa-guide-shell .content .jp-section--6 > h3,
      :host ::ng-deep fa-guide-shell .content .jp-section--7 > h3 {
        padding-left: 26px;
      }

      :host ::ng-deep fa-guide-shell .content .jp-section--6 > h3::before,
      :host ::ng-deep fa-guide-shell .content .jp-section--7 > h3::before {
        left: 10px;
      }
    }
  `],
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
  readonly displayFaqGroups: FaqGroup[] = (this.config.faqGroups ?? []).filter(
    (group) => !/evidence index/i.test(group.title) && !/evidence/i.test(group.id),
  );
  readonly hasDefaultIntro = Boolean(this.config.intro);
  readonly hasDefaultTopicsSection = Boolean(this.config.topicsSection);
  readonly hasDefaultTriviaSection = Boolean(this.config.triviaSection);
  readonly hasDefaultCodingPatternsSection = Boolean(this.config.codingPatternsSection);
  readonly hasDefaultSeniorSignalsSection = Boolean(this.config.seniorSignalsSection);
  readonly hasDefaultPracticalPlanSection = Boolean(this.config.practicalPlanSection);
  readonly hasDefaultCheatSheetSection = Boolean(this.config.cheatSheetSection);
  readonly hasDefaultFaqSection = Boolean(this.displayFaqGroups.length);
  readonly showLegacyDefaultSections = !this.hasDefaultFaqSection;
  readonly introSectionNumber = this.hasDefaultIntro ? 1 : null;
  readonly topicsSectionNumber = this.hasDefaultTopicsSection
    ? (this.hasDefaultIntro ? 2 : 1)
    : null;
  readonly triviaSectionNumber = this.hasDefaultTriviaSection
    ? 1 + (this.hasDefaultIntro ? 1 : 0) + (this.hasDefaultTopicsSection ? 1 : 0)
    : null;
  readonly codingPatternsSectionNumber = this.hasDefaultCodingPatternsSection
    ? 1
        + (this.hasDefaultIntro ? 1 : 0)
        + (this.hasDefaultTopicsSection ? 1 : 0)
        + (this.hasDefaultTriviaSection ? 1 : 0)
    : null;
  readonly seniorSignalsSectionNumber = this.hasDefaultSeniorSignalsSection
    ? 1
        + (this.hasDefaultIntro ? 1 : 0)
        + (this.hasDefaultTopicsSection ? 1 : 0)
        + (this.hasDefaultTriviaSection ? 1 : 0)
        + (this.hasDefaultCodingPatternsSection ? 1 : 0)
    : null;
  readonly practicalPlanSectionNumber = this.hasDefaultPracticalPlanSection
    ? 1
        + (this.hasDefaultIntro ? 1 : 0)
        + (this.hasDefaultTopicsSection ? 1 : 0)
        + (this.hasDefaultTriviaSection ? 1 : 0)
        + (this.hasDefaultCodingPatternsSection ? 1 : 0)
        + (this.hasDefaultSeniorSignalsSection ? 1 : 0)
    : null;
  readonly cheatSheetSectionNumber = this.hasDefaultCheatSheetSection
    ? 1
        + (this.hasDefaultIntro ? 1 : 0)
        + (this.hasDefaultTopicsSection ? 1 : 0)
        + (this.hasDefaultTriviaSection ? 1 : 0)
        + (this.hasDefaultCodingPatternsSection ? 1 : 0)
        + (this.hasDefaultSeniorSignalsSection ? 1 : 0)
        + (this.hasDefaultPracticalPlanSection ? 1 : 0)
    : null;
  readonly faqSectionNumber = this.hasDefaultFaqSection
    ? 1
        + (this.hasDefaultIntro ? 1 : 0)
        + (this.hasDefaultTopicsSection ? 1 : 0)
        + (this.hasDefaultTriviaSection ? 1 : 0)
        + (this.hasDefaultCodingPatternsSection ? 1 : 0)
        + (this.hasDefaultSeniorSignalsSection ? 1 : 0)
        + (this.hasDefaultPracticalPlanSection ? 1 : 0)
        + (this.hasDefaultCheatSheetSection ? 1 : 0)
    : null;
  readonly firstDefaultCoreSectionNumber =
    this.hasDefaultIntro
    || this.hasDefaultTopicsSection
    || this.hasDefaultTriviaSection
    || this.hasDefaultCodingPatternsSection
    || this.hasDefaultSeniorSignalsSection
    || this.hasDefaultPracticalPlanSection
    || this.hasDefaultCheatSheetSection
    || this.hasDefaultFaqSection
    ? 1
        + (this.hasDefaultIntro ? 1 : 0)
        + (this.hasDefaultTopicsSection ? 1 : 0)
        + (this.hasDefaultTriviaSection ? 1 : 0)
        + (this.hasDefaultCodingPatternsSection ? 1 : 0)
        + (this.hasDefaultSeniorSignalsSection ? 1 : 0)
        + (this.hasDefaultPracticalPlanSection ? 1 : 0)
        + (this.hasDefaultCheatSheetSection ? 1 : 0)
        + (this.hasDefaultFaqSection ? 1 : 0)
    : null;

  introSectionHeading(): string {
    if (!this.introSectionNumber) return 'Introduction';
    return `Section ${this.introSectionNumber} — Introduction`;
  }

  topicsSectionHeading(): string {
    const label = this.config.topicsSection?.title || 'Most asked interview topics';
    if (!this.topicsSectionNumber) return label;
    return `Section ${this.topicsSectionNumber} — ${label}`;
  }

  triviaSectionHeading(): string {
    const label = this.config.triviaSection?.title || 'Interview trivia question types';
    if (!this.triviaSectionNumber) return label;
    return `Section ${this.triviaSectionNumber} — ${label}`;
  }

  codingPatternsSectionHeading(): string {
    const label = this.config.codingPatternsSection?.title || 'Coding prompt patterns';
    if (!this.codingPatternsSectionNumber) return label;
    return `Section ${this.codingPatternsSectionNumber} — ${label}`;
  }

  seniorSignalsSectionHeading(): string {
    const label = this.config.seniorSignalsSection?.title || 'Senior-level interview signals';
    if (!this.seniorSignalsSectionNumber) return label;
    return `Section ${this.seniorSignalsSectionNumber} — ${label}`;
  }

  practicalPlanSectionHeading(): string {
    const label = this.config.practicalPlanSection?.title || 'Practical preparation plan';
    if (!this.practicalPlanSectionNumber) return label;
    return `Section ${this.practicalPlanSectionNumber} — ${label}`;
  }

  cheatSheetSectionHeading(): string {
    const label = this.config.cheatSheetSection?.title || 'Last-week cheat sheet';
    if (!this.cheatSheetSectionNumber) return label;
    return `Section ${this.cheatSheetSectionNumber} — ${label}`;
  }

  faqSectionHeading(): string {
    const label = 'FAQ';
    if (!this.faqSectionNumber) return label;
    return `Section ${this.faqSectionNumber} — ${label}`;
  }

  resolvedFaqInitialOpenId(): string {
    const initialId = this.config.faqInitialOpenId;
    if (initialId && this.displayFaqGroups.some((group) => group.items.some((item) => item.id === initialId))) {
      return initialId;
    }
    const firstGroup = this.displayFaqGroups[0];
    const firstItem = firstGroup?.items[0];
    return firstItem ? firstItem.id : '';
  }

  defaultSectionHeading(offset: number, label: string): string {
    if (!this.firstDefaultCoreSectionNumber) return label;
    return `Section ${this.firstDefaultCoreSectionNumber + offset} — ${label}`;
  }

  readonly javascriptFaqGroups: FaqGroup[] = [
    {
      id: 'faq-group-strategy',
      title: 'Prep strategy',
      items: [
        {
          id: 'faq-leetcode-js',
          q: 'Do I need LeetCode to pass JavaScript-heavy frontend loops?',
          a: 'Not always. In frontend-heavy loops, interviewers usually care more about async behavior, state transitions, and bug reasoning than pure algorithm depth. LeetCode is still useful when your target process includes a DS&A round, but it should not replace JavaScript fundamentals. <strong>Practical rule:</strong> start with JS model + implementation drills, then add DS&A only where the process explicitly requires it.',
        },
        {
          id: 'faq-topics-trivia-coding',
          q: 'What is the practical difference between topics, trivia, and coding prompts?',
          a: 'They test the same concept in three different ways. Topics verify the model, trivia verifies explanation speed, and coding verifies execution under constraints. If interviews feel inconsistent, you are usually strong in one layer and weak in another. The fix is simple: run the same concept through all three layers in one session.',
        },
        {
          id: 'faq-practice-efficient',
          q: 'How do I practice efficiently without wasting time?',
          a: 'Use a fixed loop: explain one concept out loud, implement one small pattern, add two edge cases, then write a short review note. Time-box each step so your session stays tight. You improve faster from steady repetition than from constantly changing formats. <strong>Practical rule:</strong> end every session with one “tomorrow focus” sentence and start there the next day.',
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
          a: 'Interview performance is mostly about execution under pressure, not just knowledge. You have to predict behavior, explain clearly, implement, and validate in one pass. That compressed workflow is a skill on its own, and it needs reps. <strong>Practical rule:</strong> after each drill, write one mistake and one prevention rule before moving on.',
        },
        {
          id: 'faq-senior-priorities',
          q: 'What should I prioritize for a senior frontend interview?',
          a: 'In a <strong>senior frontend interview</strong>, process and judgment carry as much weight as output. Focus on clarification, minimal-correct-first implementation, cleanup/failure handling, and clear trade-off calls. Readable code plus quick validation signals production readiness. <strong>Practical rule:</strong> narrate one design decision every few minutes and tie it to correctness, complexity, or maintainability.',
        },
        {
          id: 'faq-dom-vs-frameworks',
          q: 'Are DOM questions still asked, or is it all frameworks now?',
          a: 'DOM and browser behavior are still core in most <strong>frontend interview</strong> loops. Event propagation, delegation, render timing, and async UI interactions keep showing up because frameworks sit on top of these rules. Framework fluency helps, but browser fundamentals keep your answers stable when edge cases appear. Treat DOM reasoning as core prep, not optional review.',
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
          a: 'Use it as a structured drill loop: identify weak clusters, run focused trivia and coding reps, and revisit the same cluster until mistakes stop repeating. The goal is not maximum volume; it is stable execution quality. Keep the sequence simple: diagnose, drill, review, repeat. That is the fastest path to consistent <strong>JavaScript interview preparation</strong> progress.',
        },
        {
          id: 'faq-how-long-ready',
          q: 'How long does it usually take to feel interview-ready?',
          a: 'It depends on your baseline and target bar, but consistency beats marathon sessions. Seven days can patch obvious gaps, fourteen days usually stabilizes common patterns, and thirty days often builds stronger interview fluency. <strong>Practical rule:</strong> prefer a steady daily cadence, even if sessions are short.',
        },
      ],
    },
  ];
}
