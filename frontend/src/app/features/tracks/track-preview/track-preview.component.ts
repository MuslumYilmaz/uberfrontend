import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { combineLatest, Observable, of } from 'rxjs';
import { distinctUntilChanged, map, shareReplay, startWith, tap } from 'rxjs/operators';
import { AccessLevel, Difficulty } from '../../../core/models/question.model';
import { Tech } from '../../../core/models/user.model';
import { QuestionService } from '../../../core/services/question.service';
import { SeoService } from '../../../core/services/seo.service';
import { TRACK_LOOKUP, TrackConfig, TrackQuestionRef, deriveTrackMetrics } from '../track.data';
import { FaCardComponent } from '../../../shared/ui/card/fa-card.component';

type PreviewQuestion = {
  id: string;
  title: string;
  kind: 'coding' | 'trivia' | 'system-design';
  tech?: Tech;
  difficulty: Difficulty;
  access: AccessLevel;
};

type PreviewLink = {
  label: string;
  route: any[];
  path: string;
  queryParams?: Record<string, string | number | boolean>;
};

type PreviewMetric = {
  value: string;
  label: string;
};

type PreviewPlanDay = {
  label: string;
  title: string;
  detail: string;
  time: string;
  topic: string;
  refs: TrackQuestionRef[];
};

type PreviewComparison = {
  title: string;
  bullets: string[];
  route: any[];
  ctaLabel: string;
};

type PreviewModule = {
  label: string;
  title: string;
  detail: string;
};

type PreviewNarrative = {
  audience: string;
  purpose: string;
  heroTitle?: string;
  heroKicker?: string;
  heroMetrics?: PreviewMetric[];
  seoTitle: string;
  seoDescription: string;
  scheduleTitle: string;
  scheduleIntro: string;
  scheduleItems: Array<{ label: string; title: string; detail: string }>;
  planDays?: PreviewPlanDay[];
  modulePreviews?: PreviewModule[];
  distribution?: PreviewMetric[];
  comparison?: PreviewComparison[];
  sequence: string[];
  supportLinks: PreviewLink[];
  faq: Array<{ question: string; answer: string }>;
  primaryCta: PreviewLink;
  secondaryCta?: PreviewLink;
};

const CRASH_7D_FALLBACKS: Record<string, Omit<PreviewQuestion, 'kind' | 'tech'>> = {
  'js-number-clamp': {
    id: 'js-number-clamp',
    title: 'Clamp',
    difficulty: 'easy',
    access: 'free',
  },
  'js-reverse-string': {
    id: 'js-reverse-string',
    title: 'Reverse a String',
    difficulty: 'easy',
    access: 'premium',
  },
  'js-count-vowels': {
    id: 'js-count-vowels',
    title: 'Count Vowels',
    difficulty: 'easy',
    access: 'free',
  },
  'js-unique-array': {
    id: 'js-unique-array',
    title: 'Remove Duplicates',
    difficulty: 'easy',
    access: 'premium',
  },
  'js-max-char': {
    id: 'js-max-char',
    title: 'Find Maximum Occurring Character',
    difficulty: 'easy',
    access: 'premium',
  },
  'js-sum-numbers': {
    id: 'js-sum-numbers',
    title: 'Sum of Numbers in an Array',
    difficulty: 'easy',
    access: 'free',
  },
  'js-compact': {
    id: 'js-compact',
    title: 'Falsy Bouncer',
    difficulty: 'easy',
    access: 'free',
  },
  'js-array-foreach': {
    id: 'js-array-foreach',
    title: 'Implement arrayForEach (no prototype mutation)',
    difficulty: 'intermediate',
    access: 'free',
  },
  'js-array-sort': {
    id: 'js-array-sort',
    title: 'Sort Numbers with Array.prototype.sort',
    difficulty: 'easy',
    access: 'premium',
  },
  'js-array-prototype-map': {
    id: 'js-array-prototype-map',
    title: 'Implement Array.prototype.map',
    difficulty: 'intermediate',
    access: 'premium',
  },
  'js-array-prototype-filter': {
    id: 'js-array-prototype-filter',
    title: 'Implement Array.prototype.filter',
    difficulty: 'intermediate',
    access: 'premium',
  },
  'js-create-counter': {
    id: 'js-create-counter',
    title: 'Create a Counter Function',
    difficulty: 'easy',
    access: 'free',
  },
  'js-flatten-once': {
    id: 'js-flatten-once',
    title: 'Flatten One Level',
    difficulty: 'easy',
    access: 'free',
  },
  'js-group-by': {
    id: 'js-group-by',
    title: 'Group By',
    difficulty: 'intermediate',
    access: 'premium',
  },
  'js-capitalize-words': {
    id: 'js-capitalize-words',
    title: 'Capitalize Words',
    difficulty: 'easy',
    access: 'free',
  },
  'js-arrays-equal': {
    id: 'js-arrays-equal',
    title: 'Check if Two Arrays Are Equal',
    difficulty: 'easy',
    access: 'free',
  },
  'js-flatten-depth': {
    id: 'js-flatten-depth',
    title: 'Flatten with Depth',
    difficulty: 'intermediate',
    access: 'premium',
  },
  'js-debounce': {
    id: 'js-debounce',
    title: 'Debounce Function',
    difficulty: 'intermediate',
    access: 'free',
  },
  'js-throttle': {
    id: 'js-throttle',
    title: 'Throttle Function',
    difficulty: 'intermediate',
    access: 'premium',
  },
  'js-promise-all': {
    id: 'js-promise-all',
    title: 'Implement Promise.all',
    difficulty: 'intermediate',
    access: 'premium',
  },
  'js-add-two-promises': {
    id: 'js-add-two-promises',
    title: 'Add Two Promises',
    difficulty: 'intermediate',
    access: 'premium',
  },
  'js-memoize-function': {
    id: 'js-memoize-function',
    title: 'Memoization',
    difficulty: 'intermediate',
    access: 'premium',
  },
  'js-deep-equal': {
    id: 'js-deep-equal',
    title: 'Deep Equal',
    difficulty: 'hard',
    access: 'premium',
  },
  'react-debounced-search': {
    id: 'react-debounced-search',
    title: 'React Debounced Search with Fake API',
    difficulty: 'intermediate',
    access: 'premium',
  },
  'react-counter': {
    id: 'react-counter',
    title: 'React Counter (Guarded Decrement)',
    difficulty: 'easy',
    access: 'free',
  },
  'react-todo-list': {
    id: 'react-todo-list',
    title: 'Todo List (Component with Local State)',
    difficulty: 'easy',
    access: 'free',
  },
  'react-tabs-switcher': {
    id: 'react-tabs-switcher',
    title: 'React Tabs / Multi-View Switcher',
    difficulty: 'intermediate',
    access: 'premium',
  },
  'react-contact-form-starter': {
    id: 'react-contact-form-starter',
    title: 'Contact Form (Component + HTTP)',
    difficulty: 'intermediate',
    access: 'premium',
  },
  'react-accordion-faq': {
    id: 'react-accordion-faq',
    title: 'React Accordion / FAQ Component',
    difficulty: 'intermediate',
    access: 'premium',
  },
  'react-pagination-table': {
    id: 'react-pagination-table',
    title: 'React Paginated Data Table',
    difficulty: 'intermediate',
    access: 'premium',
  },
  'angular-counter-starter': {
    id: 'angular-counter-starter',
    title: 'Counter (Standalone Component)',
    difficulty: 'easy',
    access: 'free',
  },
  'angular-todo-list-starter': {
    id: 'angular-todo-list-starter',
    title: 'Todo List (Standalone Component with @for)',
    difficulty: 'easy',
    access: 'free',
  },
  'angular-tabs-switcher': {
    id: 'angular-tabs-switcher',
    title: 'Angular Tabs / Multi-View Switcher',
    difficulty: 'easy',
    access: 'premium',
  },
  'angular-contact-form-starter': {
    id: 'angular-contact-form-starter',
    title: 'Contact Form (Standalone Component + HTTP)',
    difficulty: 'intermediate',
    access: 'premium',
  },
  'angular-faq-accordion': {
    id: 'angular-faq-accordion',
    title: 'Angular Accordion / FAQ Component',
    difficulty: 'intermediate',
    access: 'premium',
  },
  'css-flexbox-navbar': {
    id: 'css-flexbox-navbar',
    title: 'Flexbox: Responsive Navbar',
    difficulty: 'intermediate',
    access: 'free',
  },
  'realtime-search-debounce-cache': {
    id: 'realtime-search-debounce-cache',
    title: 'Real-time Search with Debounce & Caching',
    difficulty: 'intermediate',
    access: 'premium',
  },
  'notification-toast-system': {
    id: 'notification-toast-system',
    title: 'Design a Toast Notification System',
    difficulty: 'intermediate',
    access: 'free',
  },
  'multi-step-form-autosave': {
    id: 'multi-step-form-autosave',
    title: 'Multi-step Form with Autosave',
    difficulty: 'intermediate',
    access: 'premium',
  },
  'component-design-system-architecture': {
    id: 'component-design-system-architecture',
    title: 'Component-driven Design System Architecture',
    difficulty: 'hard',
    access: 'premium',
  },
  'js-microtasks-vs-macrotasks': {
    id: 'js-microtasks-vs-macrotasks',
    title: 'Microtasks vs Macrotasks in JavaScript (Event Loop Priority)',
    difficulty: 'hard',
    access: 'free',
  },
  'js-promise-combinators-all-allsettled-race-any': {
    id: 'js-promise-combinators-all-allsettled-race-any',
    title: 'Promise.all vs allSettled vs race vs any (JavaScript Promise Combinators)',
    difficulty: 'intermediate',
    access: 'free',
  },
  'js-async-race-conditions': {
    id: 'js-async-race-conditions',
    title: 'Async Race Conditions and Stale UI Updates',
    difficulty: 'intermediate',
    access: 'free',
  },
  'js-call-apply-bind': {
    id: 'js-call-apply-bind',
    title: 'What is the difference between call(), apply(), and bind() in JavaScript?',
    difficulty: 'intermediate',
    access: 'free',
  },
  'js-mutability-vs-immutability': {
    id: 'js-mutability-vs-immutability',
    title: 'Mutability vs Immutability in JavaScript (State, References, and Side Effects)',
    difficulty: 'intermediate',
    access: 'free',
  },
  'js-array-prototype-reduce': {
    id: 'js-array-prototype-reduce',
    title: 'Implement Array.prototype.reduce',
    difficulty: 'intermediate',
    access: 'premium',
  },
  'js-implement-bind': {
    id: 'js-implement-bind',
    title: 'Implement Function.prototype.bind',
    difficulty: 'hard',
    access: 'free',
  },
  'js-event-emitter-mini': {
    id: 'js-event-emitter-mini',
    title: 'Event Emitter (Mini Implementation)',
    difficulty: 'intermediate',
    access: 'premium',
  },
  'js-timer-manager': {
    id: 'js-timer-manager',
    title: 'Custom setTimeout/clearTimeout Timer Manager',
    difficulty: 'intermediate',
    access: 'premium',
  },
  'js-var-let-const-hoisting': {
    id: 'js-var-let-const-hoisting',
    title: 'Explain the difference in hoisting between `var`, `let`, and `const`',
    difficulty: 'intermediate',
    access: 'free',
  },
  'js-prototype-vs-proto': {
    id: 'js-prototype-vs-proto',
    title: 'prototype vs __proto__ in JavaScript (Prototype Chain, new, and Object.getPrototypeOf)',
    difficulty: 'intermediate',
    access: 'free',
  },
  'react-debug-double-render': {
    id: 'react-debug-double-render',
    title: 'Debug: Component Renders Twice on Every Update',
    difficulty: 'intermediate',
    access: 'premium',
  },
  'js-event-loop': {
    id: 'js-event-loop',
    title: 'Explain the JavaScript Event Loop',
    difficulty: 'hard',
    access: 'free',
  },
  'js-promises-async-await': {
    id: 'js-promises-async-await',
    title: 'Promises and async/await',
    difficulty: 'intermediate',
    access: 'free',
  },
  'js-closures': {
    id: 'js-closures',
    title: 'Explain Closures in JavaScript',
    difficulty: 'intermediate',
    access: 'free',
  },
  'js-this-keyword': {
    id: 'js-this-keyword',
    title: 'Explain the `this` keyword in JavaScript',
    difficulty: 'intermediate',
    access: 'free',
  },
  'js-hoisting-tdz': {
    id: 'js-hoisting-tdz',
    title: 'Explain Hoisting and the Temporal Dead Zone (TDZ)',
    difficulty: 'intermediate',
    access: 'free',
  },
  'js-event-delegation': {
    id: 'js-event-delegation',
    title: 'Explain Event Delegation in JavaScript',
    difficulty: 'intermediate',
    access: 'free',
  },
  'js-event-bubbling-capturing': {
    id: 'js-event-bubbling-capturing',
    title: 'What is event bubbling and capturing in JavaScript?',
    difficulty: 'intermediate',
    access: 'free',
  },
  'infinite-scroll-list': {
    id: 'infinite-scroll-list',
    title: 'Infinite Scroll List System Design',
    difficulty: 'intermediate',
    access: 'free',
  },
};

const CRASH_7D_SAMPLE_IDS = [
  'js-debounce',
  'css-flexbox-navbar',
  'js-microtasks-vs-macrotasks',
  'js-implement-bind',
  'js-throttle',
  'js-promise-all',
  'react-debounced-search',
  'realtime-search-debounce-cache',
];

const FOUNDATIONS_30D_SAMPLE_IDS = [
  'js-number-clamp',
  'js-count-vowels',
  'js-sum-numbers',
  'react-counter',
  'js-reverse-string',
  'js-unique-array',
  'react-tabs-switcher',
  'notification-toast-system',
];

const TRACK_PREVIEW_CONTENT: Record<string, PreviewNarrative> = {
  'crash-7d': {
    audience: 'Built for short timelines when you need one high-yield week instead of a long curriculum.',
    purpose: 'This Crash Track 7-day frontend interview prep plan compresses the highest-signal JavaScript, UI, and frontend system design drills into a repeatable sprint.',
    heroTitle: 'Crash Track: 7-Day Frontend Interview Prep Plan',
    heroKicker: 'Start today',
    heroMetrics: [
      { value: '30', label: 'questions' },
      { value: '2', label: 'system design prompts' },
      { value: '45 min/day', label: 'daily pace' },
      { value: 'Day 1', label: 'ready' },
      { value: 'May 2026', label: 'updated' },
    ],
    seoTitle: '7-Day Frontend Interview Prep Plan',
    seoDescription:
      'Preview a 7-day frontend interview prep plan for short deadlines: JavaScript concepts, UI coding, system design review, sample questions, and premium track unlocks.',
    scheduleTitle: '7-day frontend interview prep day-by-day plan',
    scheduleIntro:
      'Use this frontend interview crash plan when the interview is close and you need each day to connect coding, concepts, UI implementation, and system design review.',
    scheduleItems: [
      {
        label: 'Day 1',
        title: 'JavaScript timing and utilities',
        detail: 'Review debounce, throttle, Promise.all, and async output questions so JavaScript concept gaps show up before UI work.',
      },
      {
        label: 'Day 2',
        title: 'UI state and data flow',
        detail: 'Practice debounced search, pagination, loading states, and stale-response handling in a timed UI coding loop.',
      },
      {
        label: 'Day 3',
        title: 'Framework implementation pass',
        detail: 'Translate the same UI patterns into React, Angular, or Vue so rendering and state decisions are explainable.',
      },
      {
        label: 'Day 4',
        title: 'Browser, performance, and accessibility review',
        detail: 'Tighten DOM behavior, keyboard states, responsive constraints, and performance tradeoffs around the prompts you missed.',
      },
      {
        label: 'Day 5',
        title: 'Frontend system design warm-up',
        detail: 'Practice real-time search and infinite scroll prompts with a short requirements, state, API, and performance structure.',
      },
      {
        label: 'Day 6',
        title: 'Mixed mock interview',
        detail: 'Run one coding prompt, one concept explanation, and one system-design outline without switching to new resources.',
      },
      {
        label: 'Day 7',
        title: 'Final review and company targeting',
        detail: 'Review repeated misses, write tradeoff notes, then move into Company Prep for the teams you are targeting.',
      },
    ],
    planDays: [
      {
        label: 'Day 1',
        title: 'JavaScript timing and utilities',
        detail: 'Start with timing helpers and Promise behavior so async gaps are visible before UI work.',
        time: '45 min',
        topic: 'Async utilities',
        refs: [
          { id: 'js-debounce', tech: 'javascript', kind: 'coding' },
          { id: 'js-throttle', tech: 'javascript', kind: 'coding' },
          { id: 'js-promise-all', tech: 'javascript', kind: 'coding' },
          { id: 'js-add-two-promises', tech: 'javascript', kind: 'coding' },
        ],
      },
      {
        label: 'Day 2',
        title: 'Utility implementation and equality',
        detail: 'Drill the small utilities that reveal API design, edge cases, and data-shape reasoning.',
        time: '45 min',
        topic: 'JS utilities',
        refs: [
          { id: 'js-memoize-function', tech: 'javascript', kind: 'coding' },
          { id: 'js-deep-equal', tech: 'javascript', kind: 'coding' },
          { id: 'js-array-prototype-reduce', tech: 'javascript', kind: 'coding' },
          { id: 'js-implement-bind', tech: 'javascript', kind: 'coding' },
        ],
      },
      {
        label: 'Day 3',
        title: 'UI implementation pass',
        detail: 'Move into realistic UI prompts where loading, empty, error, and render-state decisions matter.',
        time: '45 min',
        topic: 'UI coding',
        refs: [
          { id: 'react-debounced-search', tech: 'react', kind: 'coding' },
          { id: 'react-pagination-table', tech: 'react', kind: 'coding' },
          { id: 'css-flexbox-navbar', tech: 'css', kind: 'coding' },
          { id: 'react-debug-double-render', tech: 'react', kind: 'coding' },
        ],
      },
      {
        label: 'Day 4',
        title: 'Async concepts and browser timing',
        detail: 'Explain what happens before you code: task queues, stale responses, Promise APIs, and event-loop timing.',
        time: '45 min',
        topic: 'Concept checks',
        refs: [
          { id: 'js-microtasks-vs-macrotasks', tech: 'javascript', kind: 'trivia' },
          { id: 'js-promise-combinators-all-allsettled-race-any', tech: 'javascript', kind: 'trivia' },
          { id: 'js-async-race-conditions', tech: 'javascript', kind: 'trivia' },
          { id: 'js-event-loop', tech: 'javascript', kind: 'trivia' },
          { id: 'js-promises-async-await', tech: 'javascript', kind: 'trivia' },
        ],
      },
      {
        label: 'Day 5',
        title: 'Frontend system design warm-up',
        detail: 'Practice requirements, state, API, cache, performance, and accessibility tradeoffs for common FE systems.',
        time: '45 min',
        topic: 'System design',
        refs: [
          { id: 'realtime-search-debounce-cache', kind: 'system-design' },
          { id: 'infinite-scroll-list', kind: 'system-design' },
          { id: 'js-event-delegation', tech: 'javascript', kind: 'trivia' },
          { id: 'js-event-bubbling-capturing', tech: 'javascript', kind: 'trivia' },
        ],
      },
      {
        label: 'Day 6',
        title: 'Mixed mock interview',
        detail: 'Run a mixed set without switching resources so implementation and explanation quality are both tested.',
        time: '45 min',
        topic: 'Mock loop',
        refs: [
          { id: 'js-call-apply-bind', tech: 'javascript', kind: 'trivia' },
          { id: 'js-mutability-vs-immutability', tech: 'javascript', kind: 'trivia' },
          { id: 'js-event-emitter-mini', tech: 'javascript', kind: 'coding' },
          { id: 'js-timer-manager', tech: 'javascript', kind: 'coding' },
        ],
      },
      {
        label: 'Day 7',
        title: 'Final review and company targeting',
        detail: 'Close with repeated JavaScript explanation themes, then move into company-specific final prep.',
        time: '45 min',
        topic: 'Final review',
        refs: [
          { id: 'js-var-let-const-hoisting', tech: 'javascript', kind: 'trivia' },
          { id: 'js-prototype-vs-proto', tech: 'javascript', kind: 'trivia' },
          { id: 'js-closures', tech: 'javascript', kind: 'trivia' },
          { id: 'js-this-keyword', tech: 'javascript', kind: 'trivia' },
          { id: 'js-hoisting-tdz', tech: 'javascript', kind: 'trivia' },
        ],
      },
    ],
    comparison: [
      {
        title: 'Choose 7-day if',
        bullets: [
          'Your interview is close and you need a focused sprint.',
          'You want high-yield JavaScript, UI coding, and two frontend system design prompts.',
          'You can spend about 45 minutes per day for one week.',
        ],
        route: ['/tracks', 'crash-7d', 'preview'],
        ctaLabel: 'Stay on 7-day plan',
      },
      {
        title: 'Choose 30-day if',
        bullets: [
          'Fundamentals need rebuilding before you interview.',
          'Framework coverage matters more than speed.',
          'Your timeline is not urgent and you want a broader runway.',
        ],
        route: ['/tracks', 'foundations-30d', 'preview'],
        ctaLabel: 'Compare 30-day plan',
      },
    ],
    sequence: [
      'Start Day 1 with a public timing helper before moving into premium full-plan prompts.',
      'Run this 7-day plan in order so implementation drills, concept checks, and system design prompts reinforce each other.',
      'Finish with Company Prep once your timing and explanation quality are stable.',
    ],
    supportLinks: [
      { label: 'JavaScript interview questions', route: ['/javascript/interview-questions'], path: '/javascript/interview-questions' },
      { label: 'Question Library', route: ['/coding'], path: '/coding' },
      { label: 'Company Prep', route: ['/companies'], path: '/companies' },
    ],
    faq: [
      {
        question: 'Who should use the 7-day crash track?',
        answer: 'Use it when interviews are close and you need one focused week of high-yield frontend preparation.',
      },
      {
        question: 'Is 7 days enough for frontend interview preparation?',
        answer: 'Seven days is enough for a focused crash sprint when you already have frontend experience and need to prioritize the highest-signal JavaScript, UI coding, and system design prompts.',
      },
      {
        question: 'What happens on Day 1?',
        answer: 'Day 1 starts with Debounce Function, then moves into throttle and Promise utilities so async timing issues show up before UI implementation work.',
      },
      {
        question: 'Does this include React?',
        answer: 'Yes. The preview includes React UI tasks such as debounced search, paginated tables, and debugging render behavior, while the full plan can be extended through framework-specific practice.',
      },
      {
        question: 'Does this include system design?',
        answer: 'Yes. The 7-day plan includes two frontend system design prompts: real-time search with debounce and caching, and infinite scroll list design.',
      },
      {
        question: 'What if my interview is tomorrow?',
        answer: 'Start with Day 1, then skim the free concept checks and system design outline so you can explain timing, stale requests, and frontend tradeoffs clearly.',
      },
      {
        question: 'What is premium?',
        answer: 'The public preview shows the plan shape and free starter prompts. Premium unlocks the full guided route and the premium prompts in the 30-question sprint.',
      },
    ],
    primaryCta: { label: 'Start Day 1', route: ['/javascript', 'coding', 'js-debounce'], path: '/javascript/coding/js-debounce' },
    secondaryCta: { label: 'Open Question Library', route: ['/coding'], path: '/coding' },
  },
  'foundations-30d': {
    audience: 'Built for candidates who want a full-month sequence across fundamentals, frameworks, and architecture communication.',
    purpose: 'This Foundations Track 30-day frontend interview preparation roadmap gives you a week-by-week roadmap for JavaScript fundamentals and browser basics, UI coding, framework Q&A, system design, mock rounds and company prep.',
    heroTitle: 'Foundations Track: 30-Day Frontend Interview Preparation Roadmap',
    heroKicker: '30-day roadmap',
    seoTitle: '30-Day Frontend Interview Preparation Roadmap',
    seoDescription:
      'Preview a 30-day frontend interview preparation roadmap with weekly JavaScript, UI coding, framework Q&A, system design, company prep, and sample questions.',
    scheduleTitle: '30-day frontend interview preparation day-by-day preview',
    scheduleIntro:
      'Start with seven concrete daily task sets, then use the remaining module preview to see how JavaScript, framework coding, HTML/CSS, concepts, and system design build over the month.',
    scheduleItems: [
      {
        label: 'Week 1',
        title: 'JavaScript fundamentals and browser basics',
        detail: 'Stabilize arrays, objects, closures, event loop timing, DOM behavior, HTML semantics, and CSS layout fundamentals.',
      },
      {
        label: 'Week 2',
        title: 'UI coding and framework drills',
        detail: 'Build forms, lists, filters, state transitions, and data-fetching flows in the framework used by your target roles.',
      },
      {
        label: 'Week 3',
        title: 'System design and tradeoff practice',
        detail: 'Add frontend system design prompts for infinite scroll, dashboards, realtime search, notifications, and performance budgets.',
      },
      {
        label: 'Week 4',
        title: 'Mock rounds and company prep',
        detail: 'Run mixed sessions, review weak areas, and use Company Prep to match the pacing and prompt style of your target teams.',
      },
    ],
    planDays: [
      {
        label: 'Day 1',
        title: 'JavaScript fundamentals warm-up',
        detail: 'Start with small implementation prompts that expose syntax, return values, loops, arrays, and edge cases.',
        time: '30-45 min',
        topic: 'Foundation JS',
        refs: [
          { id: 'js-number-clamp', tech: 'javascript', kind: 'coding' },
          { id: 'js-reverse-string', tech: 'javascript', kind: 'coding' },
          { id: 'js-count-vowels', tech: 'javascript', kind: 'coding' },
          { id: 'js-unique-array', tech: 'javascript', kind: 'coding' },
        ],
      },
      {
        label: 'Day 2',
        title: 'Arrays and iteration',
        detail: 'Build confidence with character counting, summing, compacting, and manual iteration before array-method polyfills.',
        time: '30-45 min',
        topic: 'Arrays',
        refs: [
          { id: 'js-max-char', tech: 'javascript', kind: 'coding' },
          { id: 'js-sum-numbers', tech: 'javascript', kind: 'coding' },
          { id: 'js-compact', tech: 'javascript', kind: 'coding' },
          { id: 'js-array-foreach', tech: 'javascript', kind: 'coding' },
        ],
      },
      {
        label: 'Day 3',
        title: 'Array method implementation',
        detail: 'Practice sort, map, filter, and reduce so callback control flow and accumulator reasoning are explainable.',
        time: '30-45 min',
        topic: 'Array APIs',
        refs: [
          { id: 'js-array-sort', tech: 'javascript', kind: 'coding' },
          { id: 'js-array-prototype-map', tech: 'javascript', kind: 'coding' },
          { id: 'js-array-prototype-filter', tech: 'javascript', kind: 'coding' },
          { id: 'js-array-prototype-reduce', tech: 'javascript', kind: 'coding' },
        ],
      },
      {
        label: 'Day 4',
        title: 'Counters, flattening, grouping',
        detail: 'Move from warm-ups into closures, data reshaping, and utility design with clearer edge-case handling.',
        time: '30-45 min',
        topic: 'Utility patterns',
        refs: [
          { id: 'js-create-counter', tech: 'javascript', kind: 'coding' },
          { id: 'js-flatten-once', tech: 'javascript', kind: 'coding' },
          { id: 'js-group-by', tech: 'javascript', kind: 'coding' },
          { id: 'js-capitalize-words', tech: 'javascript', kind: 'coding' },
        ],
      },
      {
        label: 'Day 5',
        title: 'JS review plus React starter',
        detail: 'Close the first JavaScript block, then switch into small React components with state and list rendering.',
        time: '30-45 min',
        topic: 'JS + React',
        refs: [
          { id: 'js-arrays-equal', tech: 'javascript', kind: 'coding' },
          { id: 'js-flatten-depth', tech: 'javascript', kind: 'coding' },
          { id: 'react-counter', tech: 'react', kind: 'coding' },
          { id: 'react-todo-list', tech: 'react', kind: 'coding' },
        ],
      },
      {
        label: 'Day 6',
        title: 'React components plus Angular starter',
        detail: 'Practice tabs, forms, and accordion UI flows before starting Angular standalone component basics.',
        time: '30-45 min',
        topic: 'Framework coding',
        refs: [
          { id: 'react-tabs-switcher', tech: 'react', kind: 'coding' },
          { id: 'react-contact-form-starter', tech: 'react', kind: 'coding' },
          { id: 'react-accordion-faq', tech: 'react', kind: 'coding' },
          { id: 'angular-counter-starter', tech: 'angular', kind: 'coding' },
        ],
      },
      {
        label: 'Day 7',
        title: 'Angular component patterns',
        detail: 'Use Angular task variants to reinforce state, templates, forms, and accordion interaction patterns.',
        time: '30-45 min',
        topic: 'Angular coding',
        refs: [
          { id: 'angular-todo-list-starter', tech: 'angular', kind: 'coding' },
          { id: 'angular-tabs-switcher', tech: 'angular', kind: 'coding' },
          { id: 'angular-contact-form-starter', tech: 'angular', kind: 'coding' },
          { id: 'angular-faq-accordion', tech: 'angular', kind: 'coding' },
        ],
      },
    ],
    modulePreviews: [
      {
        label: 'Days 8-9',
        title: 'Framework starter completion',
        detail: 'Finish Vue starter variants and compare the same component patterns across React, Angular, and Vue.',
      },
      {
        label: 'Days 10-13',
        title: 'HTML/CSS implementation basics',
        detail: 'Move through semantic HTML, labeled forms, metadata, selectors, box model, positioning, Flexbox, Grid, and responsive constraints.',
      },
      {
        label: 'Days 14-15',
        title: 'Frontend system design warm-up',
        detail: 'Practice toast notifications, autosave forms, design systems, realtime search, and infinite scroll architecture prompts.',
      },
      {
        label: 'Days 16-21',
        title: 'JavaScript and web fundamentals',
        detail: 'Review event loop, closures, this, hoisting, storage, DOM, semantic HTML, CSS layout, specificity, media queries, and units.',
      },
      {
        label: 'Days 22-27',
        title: 'Async JS and framework variants',
        detail: 'Add debounce, throttle, Promise utilities, race conditions, and React/Angular/Vue search, table, theme, and transfer-list drills.',
      },
      {
        label: 'Days 28-30',
        title: 'Final review and company targeting',
        detail: 'Re-run misses, write tradeoff notes, then use Company Prep to match the teams and interview loops you are targeting.',
      },
    ],
    comparison: [
      {
        title: 'Choose 30-day if',
        bullets: [
          'You need fundamentals, framework coding, concepts, and system design in one month.',
          'You can spend 30-45 minutes per day without rushing the basics.',
          'You want broader coverage before narrowing into company prep.',
        ],
        route: ['/tracks', 'foundations-30d', 'preview'],
        ctaLabel: 'Stay on 30-day roadmap',
      },
      {
        title: 'Choose 7-day if',
        bullets: [
          'Your interview is close and you need a high-yield sprint.',
          'You already know the fundamentals and need focused JS/UI/system design review.',
          'You prefer fewer prompts and a tighter daily scope.',
        ],
        route: ['/tracks', 'crash-7d', 'preview'],
        ctaLabel: 'Compare 7-day plan',
      },
      {
        title: 'Choose JS mastery if',
        bullets: [
          'JavaScript depth is the main gap.',
          'You want checkpoint-gated modules instead of a date-based plan.',
          'You care more about 0-to-100 mastery than broad frontend coverage.',
        ],
        route: ['/guides', 'framework-prep', 'javascript-prep-path', 'mastery'],
        ctaLabel: 'Open JS mastery',
      },
    ],
    sequence: [
      'Start Day 1 with a public JavaScript fundamentals prompt before moving into the full month sequence.',
      'Work through the roadmap in order so fundamentals, framework drills, and architecture prompts build on each other.',
      'Add Company Prep in the final week to rehearse target-specific patterns without losing structure.',
    ],
    supportLinks: [
      { label: 'Question Library', route: ['/coding'], path: '/coding' },
      { label: 'Framework Prep Guide', route: ['/guides/framework-prep'], path: '/guides/framework-prep' },
      { label: 'Company Prep', route: ['/companies'], path: '/companies' },
    ],
    faq: [
      {
        question: 'Is 30 days enough?',
        answer: 'Thirty days is enough for a structured foundations pass if you already have frontend exposure and can practice consistently for 30-45 minutes per day.',
      },
      {
        question: 'How many questions per day?',
        answer: 'The first week uses four linked prompts per day. Later modules mix coding, concept checks, and system design prompts so the daily load stays realistic.',
      },
      {
        question: 'Is React required?',
        answer: 'No. React appears in the framework block, but the roadmap also includes Angular and Vue variants so you can bias practice toward your target stack.',
      },
      {
        question: 'Are Angular and Vue included?',
        answer: 'Yes. The roadmap includes Angular starter tasks, Vue starter tasks, and later Angular/Vue variants for search, tables, theme toggles, and transfer lists.',
      },
      {
        question: 'When does system design start?',
        answer: 'System design starts after the first implementation foundation block, with frontend prompts such as toast notifications, autosave forms, design systems, realtime search, and infinite scroll.',
      },
      {
        question: 'What does premium unlock?',
        answer: 'The public preview shows the roadmap shape and free starter prompts. Premium unlocks the full guided route and the premium prompts across the month.',
      },
    ],
    primaryCta: { label: 'Start Day 1', route: ['/javascript', 'coding', 'js-number-clamp'], path: '/javascript/coding/js-number-clamp' },
    secondaryCta: { label: 'Open Question Library', route: ['/coding'], path: '/coding' },
  },
};

@Component({
  standalone: true,
  selector: 'app-track-preview',
  imports: [CommonModule, RouterModule, FaCardComponent],
  templateUrl: './track-preview.component.html',
  styleUrls: ['./track-preview.component.css'],
})
export class TrackPreviewComponent implements OnInit {
  track: TrackConfig | null = null;
  narrative: PreviewNarrative | null = null;
  previewQuestionFallbacks: PreviewQuestion[] = [];
  previewQuestions$: Observable<PreviewQuestion[]> = of([]);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private questionService: QuestionService,
    private seo: SeoService,
    private destroyRef: DestroyRef,
  ) { }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => (params.get('slug') || '').toLowerCase()),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((slug) => this.loadTrack(slug));
  }

  private loadTrack(slug: string): void {
    const track = TRACK_LOOKUP.get(slug) ?? null;
    if (!track) {
      this.track = null;
      this.narrative = null;
      this.previewQuestionFallbacks = [];
      this.previewQuestions$ = of([]);
      this.router.navigateByUrl('/404').catch(() => void 0);
      return;
    }

    this.track = track;
    this.narrative = this.resolveNarrative(track);
    this.previewQuestionFallbacks = this.buildPreviewQuestionFallbacks(track);
    this.publishSeo(track, this.previewQuestionFallbacks);

    this.previewQuestions$ = combineLatest([
      this.questionService.loadAllQuestionSummaries('coding', { transferState: false }),
      this.questionService.loadAllQuestionSummaries('trivia', { transferState: false }),
      this.questionService.loadSystemDesign({ transferState: false }),
    ]).pipe(
      map(([coding, trivia, system]) => {
        const questions = this.buildPreviewQuestions(track, coding, trivia, system);
        return questions.length ? questions : this.previewQuestionFallbacks;
      }),
      startWith(this.previewQuestionFallbacks),
      tap((questions) => this.publishSeo(track, questions)),
      shareReplay(1),
    );
  }

  freeCount(items: PreviewQuestion[]): number {
    return items.filter((item) => item.access === 'free').length;
  }

  premiumCount(items: PreviewQuestion[]): number {
    return items.filter((item) => item.access === 'premium').length;
  }

  displayKind(kind: PreviewQuestion['kind']): string {
    if (kind === 'system-design') return 'System design';
    return kind === 'coding' ? 'Coding' : 'Concept question';
  }

  questionRoute(item: PreviewQuestion): any[] {
    if (item.kind === 'system-design') return ['/system-design', item.id];
    const tech = item.tech || 'javascript';
    return ['/', tech, item.kind === 'trivia' ? 'trivia' : 'coding', item.id];
  }

  linkQueryParams(link: PreviewLink | null | undefined, trackSlug: string): Record<string, string | number | boolean> | null {
    if (!link?.queryParams) return null;
    return {
      ...link.queryParams,
      src: `track_preview_${trackSlug}`,
    };
  }

  displayTitle(track: TrackConfig): string {
    return this.narrative?.heroTitle || track.title;
  }

  heroKicker(): string {
    return this.narrative?.heroKicker || 'Public study plan';
  }

  heroMetrics(track: TrackConfig): PreviewMetric[] {
    if (track.slug === 'foundations-30d') {
      const metrics = deriveTrackMetrics(track);
      return [
        { value: String(metrics.uniquePrompts), label: 'unique prompts' },
        { value: String(metrics.systemDesign), label: 'system design prompts' },
        { value: '30-45 min/day', label: 'daily pace' },
        { value: 'Day 1', label: 'ready' },
        { value: 'July 2026', label: 'updated' },
      ];
    }
    return this.narrative?.heroMetrics || [
      { value: track.durationLabel, label: 'Timeline' },
      { value: String(track.featured.length), label: 'curated questions' },
      { value: String(this.systemDesignCount(track)), label: 'system design prompts' },
    ];
  }

  hasPlanDays(): boolean {
    return !!this.narrative?.planDays?.length;
  }

  planDays(): PreviewPlanDay[] {
    return this.narrative?.planDays || [];
  }

  comparisonItems(): PreviewComparison[] {
    return this.narrative?.comparison || [];
  }

  modulePreviews(): PreviewModule[] {
    return this.narrative?.modulePreviews || [];
  }

  distributionMetrics(): PreviewMetric[] {
    if (this.track?.slug === 'foundations-30d') {
      const metrics = deriveTrackMetrics(this.track);
      return [
        { value: String(metrics.javascript), label: 'JavaScript' },
        { value: String(metrics.frameworkCoding), label: 'framework coding' },
        { value: String(metrics.htmlCss), label: 'HTML/CSS' },
        { value: String(metrics.conceptQuestions), label: 'concept questions' },
        { value: String(metrics.systemDesign), label: 'system design' },
      ];
    }
    return this.narrative?.distribution || [];
  }

  categoriesOverlap(): boolean {
    return !!this.track && deriveTrackMetrics(this.track).categoriesOverlap;
  }

  dayTasks(day: PreviewPlanDay, questions: PreviewQuestion[]): PreviewQuestion[] {
    return day.refs
      .map((ref) => this.findQuestion(ref, questions) || this.fallbackQuestion(ref))
      .filter((item): item is PreviewQuestion => !!item);
  }

  sampleQuestions(questions: PreviewQuestion[]): PreviewQuestion[] {
    if (this.track?.slug === 'crash-7d') {
      const ordered = CRASH_7D_SAMPLE_IDS
        .map((id) => questions.find((item) => item.id === id) || this.fallbackQuestion({ id, kind: this.fallbackKind(id) }))
        .filter((item): item is PreviewQuestion => !!item);
      if (ordered.length) return ordered;
    }

    if (this.track?.slug === 'foundations-30d') {
      const ordered = FOUNDATIONS_30D_SAMPLE_IDS
        .map((id) => questions.find((item) => item.id === id))
        .filter((item): item is PreviewQuestion => !!item);
      if (ordered.length) return ordered;
    }

    return [...questions]
      .sort((a, b) => Number(a.access === 'premium') - Number(b.access === 'premium'))
      .slice(0, 8);
  }

  private buildPreviewQuestions(
    track: TrackConfig,
    coding: Array<any>,
    trivia: Array<any>,
    system: Array<any>,
  ): PreviewQuestion[] {
    const out: PreviewQuestion[] = [];
    const seen = new Set<string>();

    for (const ref of track.featured) {
      const question = this.resolveQuestion(ref, coding, trivia, system);
      if (!question) continue;
      const key = `${question.kind}:${question.tech || 'none'}:${question.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(question);
    }

    return out;
  }

  private buildPreviewQuestionFallbacks(track: TrackConfig): PreviewQuestion[] {
    return track.featured.map((ref) => this.fallbackQuestion(ref)).filter((item): item is PreviewQuestion => !!item);
  }

  private resolveQuestion(
    ref: TrackQuestionRef,
    coding: Array<any>,
    trivia: Array<any>,
    system: Array<any>,
  ): PreviewQuestion | null {
    if (ref.kind === 'system-design') {
      const sys = system.find((q) => q?.id === ref.id);
      const fallback = this.fallbackQuestion(ref);
      return {
        id: ref.id,
        title: String(sys?.title || fallback?.title || this.humanize(ref.id)),
        kind: 'system-design',
        difficulty: this.normalizeDifficulty(sys?.difficulty || fallback?.difficulty),
        access: this.normalizeAccess(sys?.access || fallback?.access),
      };
    }

    const bucket = ref.kind === 'coding' ? coding : trivia;
    const exact = ref.tech
      ? bucket.find((q) => q?.id === ref.id && q?.tech === ref.tech)
      : null;
    const fallback = bucket.find((q) => q?.id === ref.id);
    const hit = exact || fallback;
    const staticFallback = this.fallbackQuestion(ref);

    return {
      id: ref.id,
      title: String(hit?.title || staticFallback?.title || this.humanize(ref.id)),
      kind: ref.kind,
      tech: (hit?.tech || ref.tech) as Tech | undefined,
      difficulty: this.normalizeDifficulty(hit?.difficulty || staticFallback?.difficulty),
      access: this.normalizeAccess(hit?.access || staticFallback?.access),
    };
  }

  private findQuestion(ref: TrackQuestionRef, questions: PreviewQuestion[]): PreviewQuestion | null {
    const exact = questions.find((item) =>
      item.id === ref.id &&
      item.kind === ref.kind &&
      (!ref.tech || item.tech === ref.tech),
    );
    return exact || questions.find((item) => item.id === ref.id) || null;
  }

  private fallbackQuestion(ref: TrackQuestionRef): PreviewQuestion | null {
    const fallback = CRASH_7D_FALLBACKS[ref.id];
    if (!fallback) {
      return {
        id: ref.id,
        title: this.humanize(ref.id),
        kind: ref.kind,
        tech: ref.tech,
        difficulty: 'intermediate',
        access: 'premium',
      };
    }

    return {
      ...fallback,
      kind: ref.kind,
      tech: ref.tech,
    };
  }

  private fallbackKind(id: string): TrackQuestionRef['kind'] {
    if (id === 'realtime-search-debounce-cache' || id === 'infinite-scroll-list') return 'system-design';
    if (id.startsWith('js-') && !['js-debounce', 'js-throttle', 'js-promise-all', 'js-add-two-promises', 'js-memoize-function', 'js-deep-equal', 'js-array-prototype-reduce', 'js-implement-bind', 'js-event-emitter-mini', 'js-timer-manager'].includes(id)) {
      return 'trivia';
    }
    return 'coding';
  }

  private systemDesignCount(track: TrackConfig): number {
    return track.featured.filter((ref) => ref.kind === 'system-design').length;
  }

  private normalizeDifficulty(value: unknown): Difficulty {
    const raw = String(value || '').toLowerCase();
    if (raw === 'easy' || raw === 'hard' || raw === 'intermediate') return raw;
    return 'intermediate';
  }

  private normalizeAccess(value: unknown): AccessLevel {
    return String(value || '').toLowerCase() === 'free' ? 'free' : 'premium';
  }

  private resolveNarrative(track: TrackConfig): PreviewNarrative {
    return TRACK_PREVIEW_CONTENT[track.slug] || {
      audience: 'Built for candidates who want a structured route instead of random frontend interview practice.',
      purpose: 'This preview shows how the study plan connects coding drills, concept questions, and system design prompts in one sequence.',
      seoTitle: `${track.title} Study Plan Preview`,
      seoDescription: `${track.title} study plan preview for frontend interviews with sample questions, sequence guidance, and premium unlock details.`,
      scheduleTitle: 'Frontend interview study plan sequence',
      scheduleIntro: 'Use this preview to understand the study-plan order before opening the full track.',
      scheduleItems: [
        {
          label: 'Step 1',
          title: 'Diagnose weak areas',
          detail: 'Start from the Question Library and identify the prompts that repeat as misses.',
        },
        {
          label: 'Step 2',
          title: 'Run the track in order',
          detail: 'Keep coding, concept, and system design practice connected instead of browsing randomly.',
        },
        {
          label: 'Step 3',
          title: 'Move into final prep',
          detail: 'Use guides and Company Prep after the plan to sharpen the rounds you care about.',
        },
      ],
      sequence: [
        'Start from the Question Library to identify your weak areas.',
        'Run the study plan in order so implementation and explanation practice stay connected.',
        'Use guides and Company Prep after the plan to sharpen the final rounds you care about.',
      ],
      supportLinks: [
        { label: 'Question Library', route: ['/coding'], path: '/coding' },
        { label: 'Framework Prep Guide', route: ['/guides/framework-prep'], path: '/guides/framework-prep' },
        { label: 'Company Prep', route: ['/companies'], path: '/companies' },
      ],
      faq: [
        {
          question: 'What is the role of a study-plan preview?',
          answer: 'It lets you evaluate the plan scope, sequence, and sample questions before you unlock the full route.',
        },
      ],
      primaryCta: { label: 'Open Question Library', route: ['/coding'], path: '/coding' },
    };
  }

  private publishSeo(track: TrackConfig, questions: PreviewQuestion[]): void {
    const canonicalPath = `/tracks/${track.slug}/preview`;
    const canonicalUrl = this.seo.buildCanonicalUrl(canonicalPath);
    const narrative = this.narrative || this.resolveNarrative(track);
    const description = narrative.seoDescription;
    const collectionPage: Record<string, any> = {
      '@type': 'CollectionPage',
      '@id': canonicalUrl,
      url: canonicalUrl,
      name: narrative.seoTitle,
      description,
      inLanguage: 'en',
      about: [
        { '@type': 'Thing', name: 'Frontend interview study plan' },
        { '@type': 'Thing', name: 'frontend interview preparation roadmap' },
        { '@type': 'Thing', name: track.title },
      ],
      mentions: narrative.supportLinks.map((link) => ({
        '@type': 'WebPage',
        name: link.label,
        url: this.seo.buildCanonicalUrl(link.path),
      })),
    };

    if (questions.length) {
      collectionPage['mainEntity'] = {
        '@type': 'ItemList',
        itemListElement: questions.map((question, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: question.title,
          url: this.seo.buildCanonicalUrl(this.questionPath(question)),
        })),
      };
    }

    const breadcrumb = {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'FrontendAtlas',
          item: this.seo.buildCanonicalUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Frontend Interview Study Plans and Tracks',
          item: this.seo.buildCanonicalUrl('/tracks'),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: narrative.seoTitle,
          item: canonicalUrl,
        },
      ],
    };

    const faqPage = {
      '@type': 'FAQPage',
      mainEntity: narrative.faq.map((entry) => ({
        '@type': 'Question',
        name: entry.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: entry.answer,
        },
      })),
    };

    this.seo.updateTags({
      title: narrative.seoTitle,
      description,
      canonical: canonicalPath,
      jsonLd: [collectionPage, breadcrumb, faqPage],
    });
  }

  private questionPath(item: PreviewQuestion): string {
    if (item.kind === 'system-design') return `/system-design/${item.id}`;
    const tech = item.tech || 'javascript';
    return `/${tech}/${item.kind === 'trivia' ? 'trivia' : 'coding'}/${item.id}`;
  }

  private humanize(id: string): string {
    return id
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  }
}
