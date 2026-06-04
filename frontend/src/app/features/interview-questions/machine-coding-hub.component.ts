import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import { SHOWCASE_STATS } from '../../generated/content-metadata';

type HubLink = {
  label: string;
  description: string;
  route: any[];
  queryParams?: Record<string, string | number | boolean>;
  path: string;
};

type HubStat = {
  value: string;
  label: string;
};

type FeaturedQuestion = {
  rank: number;
  title: string;
  route: any[];
  path: string;
  tier: string;
  difficulty: string;
  tags: string[];
  signal: string;
  requirement: string;
};

type RubricItem = {
  area: string;
  signal: string;
  checks: string[];
};

type TimeboxItem = {
  window: string;
  title: string;
  detail: string;
};

type WorkedExamplePanel = {
  title: string;
  items: string[];
};

type WorkedExample = {
  title: string;
  route: any[];
  path: string;
  intro: string;
  panels: WorkedExamplePanel[];
};

type FaqItem = {
  question: string;
  answer: string;
};

@Component({
  standalone: true,
  selector: 'app-machine-coding-hub',
  imports: [CommonModule, RouterModule],
  templateUrl: './machine-coding-hub.component.html',
  styleUrls: ['./machine-coding-hub.component.css'],
})
export class MachineCodingHubComponent implements OnInit {
  private readonly seo = inject(SeoService);

  readonly stats: HubStat[] = [
    { value: String(SHOWCASE_STATS.totalQuestions), label: 'practice questions' },
    { value: '3', label: 'guided plans' },
    { value: 'May 2026', label: 'updated' },
    { value: 'Live', label: 'editor + checks' },
  ];

  readonly featuredQuestions: FeaturedQuestion[] = [
    {
      rank: 1,
      title: 'React Debounced Search with Fake API',
      route: ['/', 'react', 'coding', 'react-debounced-search'],
      path: '/react/coding/react-debounced-search',
      tier: 'Must know',
      difficulty: 'Intermediate',
      tags: ['async UI', 'debounce', 'stale responses'],
      signal: 'Controlled input, request timing, loading states, and stale-response handling.',
      requirement: 'Debounce input, call the fake API, show loading/error states, and prevent stale results.',
    },
    {
      rank: 2,
      title: 'Contact Form (Component + HTTP)',
      route: ['/', 'react', 'coding', 'react-contact-form-starter'],
      path: '/react/coding/react-contact-form-starter',
      tier: 'Must know',
      difficulty: 'Intermediate',
      tags: ['forms', 'HTTP', 'validation'],
      signal: 'Validation, submit state, API feedback, and clean form ownership.',
      requirement: 'Collect contact details, validate required fields, submit over HTTP, and surface API feedback.',
    },
    {
      rank: 3,
      title: 'Autocomplete Search Bar (Hooks)',
      route: ['/', 'react', 'coding', 'react-autocomplete-search-starter'],
      path: '/react/coding/react-autocomplete-search-starter',
      tier: 'Must know',
      difficulty: 'Intermediate',
      tags: ['autocomplete', 'keyboard', 'a11y'],
      signal: 'Keyboard behavior, async suggestions, focus state, and accessible listbox UX.',
      requirement: 'Fetch suggestions, debounce typing, support keyboard selection, and recover from empty/error states.',
    },
    {
      rank: 4,
      title: 'Multi-step Signup Form',
      route: ['/', 'react', 'coding', 'react-multi-step-signup'],
      path: '/react/coding/react-multi-step-signup',
      tier: 'Must know',
      difficulty: 'Intermediate',
      tags: ['forms', 'wizard', 'recovery'],
      signal: 'Step ownership, validation flow, partial progress, and navigation state.',
      requirement: 'Persist step data, validate before advancing, support back navigation, and show completion state.',
    },
    {
      rank: 5,
      title: 'React Nested Checkbox Tree',
      route: ['/', 'react', 'coding', 'react-nested-checkboxes'],
      path: '/react/coding/react-nested-checkboxes',
      tier: 'Must know',
      difficulty: 'Intermediate',
      tags: ['tree state', 'indeterminate', 'events'],
      signal: 'Parent-child sync, recursive updates, and indeterminate state correctness.',
      requirement: 'Sync parent, child, and indeterminate states across a recursive nested checkbox tree.',
    },
    {
      rank: 6,
      title: 'React Paginated Data Table',
      route: ['/', 'react', 'coding', 'react-pagination-table'],
      path: '/react/coding/react-pagination-table',
      tier: 'Must know',
      difficulty: 'Intermediate',
      tags: ['tables', 'pagination', 'empty states'],
      signal: 'Derived data, page controls, empty results, and stable list rendering.',
      requirement: 'Paginate rows, handle empty pages, keep controls stable, and explain client vs server paging.',
    },
    {
      rank: 7,
      title: 'React Shopping Cart Mini',
      route: ['/', 'react', 'coding', 'react-shopping-cart'],
      path: '/react/coding/react-shopping-cart',
      tier: 'High leverage',
      difficulty: 'Intermediate',
      tags: ['cart state', 'derived totals', 'immutability'],
      signal: 'Collection updates, totals, item quantity logic, and immutable state changes.',
      requirement: 'Add/remove items, update quantities, derive totals, and prevent invalid cart states.',
    },
    {
      rank: 8,
      title: 'React Nested Comments',
      route: ['/', 'react', 'coding', 'react-nested-comments'],
      path: '/react/coding/react-nested-comments',
      tier: 'High leverage',
      difficulty: 'Intermediate',
      tags: ['recursive UI', 'replies', 'local state'],
      signal: 'Tree rendering, one active reply input, recursive data, and edit state boundaries.',
      requirement: 'Render nested replies, add comments at the right level, and keep edit/reply state scoped.',
    },
    {
      rank: 9,
      title: 'Invite Chips Input',
      route: ['/', 'react', 'coding', 'react-chips-input-autocomplete'],
      path: '/react/coding/react-chips-input-autocomplete',
      tier: 'High leverage',
      difficulty: 'Intermediate',
      tags: ['chips input', 'autocomplete', 'keyboard'],
      signal: 'Dense event handling, token state, keyboard removal, and accessible suggestions.',
      requirement: 'Create chips from suggestions, reject duplicates, support Backspace removal, and preserve focus.',
    },
    {
      rank: 10,
      title: 'Todo List',
      route: ['/', 'react', 'coding', 'react-todo-list'],
      path: '/react/coding/react-todo-list',
      tier: 'High leverage',
      difficulty: 'Easy',
      tags: ['lists', 'local state', 'CRUD'],
      signal: 'Basic local state, list updates, filtering, editing, and simple edge cases.',
      requirement: 'Add, edit, complete, filter, and delete todos without mutating list state.',
    },
    {
      rank: 11,
      title: 'React Filterable User List',
      route: ['/', 'react', 'coding', 'react-filterable-user-list'],
      path: '/react/coding/react-filterable-user-list',
      tier: 'High leverage',
      difficulty: 'Intermediate',
      tags: ['filtering', 'search', 'empty states'],
      signal: 'Search state, derived collections, empty results, and input responsiveness.',
      requirement: 'Filter users by query and facets, show empty states, and keep derived data predictable.',
    },
    {
      rank: 12,
      title: 'React Transfer List',
      route: ['/', 'react', 'coding', 'react-transfer-list'],
      path: '/react/coding/react-transfer-list',
      tier: 'High leverage',
      difficulty: 'Intermediate',
      tags: ['selection', 'bulk actions', 'lists'],
      signal: 'Selection state, disabled actions, bulk moves, and list ownership boundaries.',
      requirement: 'Move selected items between lists, support bulk actions, and disable invalid controls.',
    },
    {
      rank: 13,
      title: 'React Accordion / FAQ Component',
      route: ['/', 'react', 'coding', 'react-accordion-faq'],
      path: '/react/coding/react-accordion-faq',
      tier: 'High leverage',
      difficulty: 'Intermediate',
      tags: ['disclosure', 'a11y', 'state'],
      signal: 'Disclosure state, keyboard expectations, semantic buttons, and ARIA basics.',
      requirement: 'Open one or many panels, use semantic controls, and keep disabled/keyboard states clear.',
    },
    {
      rank: 14,
      title: 'React Tabs / Multi-View Switcher',
      route: ['/', 'react', 'coding', 'react-tabs-switcher'],
      path: '/react/coding/react-tabs-switcher',
      tier: 'High leverage',
      difficulty: 'Intermediate',
      tags: ['tabs', 'keyboard', 'component API'],
      signal: 'State transitions, keyboard navigation, active panels, and component boundaries.',
      requirement: 'Switch views, preserve active tab state, support arrow keys, and connect tab panels correctly.',
    },
    {
      rank: 15,
      title: 'React Theme Toggle',
      route: ['/', 'react', 'coding', 'react-theme-toggle'],
      path: '/react/coding/react-theme-toggle',
      tier: 'High leverage',
      difficulty: 'Intermediate',
      tags: ['persistence', 'theme', 'preferences'],
      signal: 'Local storage, OS preference defaults, visual state, and side-effect cleanup.',
      requirement: 'Respect system preference, persist user choice, update the document theme, and avoid flicker.',
    },
    {
      rank: 16,
      title: 'React Progress Bar',
      route: ['/', 'react', 'coding', 'react-progress-bar-thresholds'],
      path: '/react/coding/react-progress-bar-thresholds',
      tier: 'High leverage',
      difficulty: 'Easy',
      tags: ['props', 'visual state', 'constraints'],
      signal: 'Prop constraints, value clamping, threshold colors, and predictable rendering.',
      requirement: 'Clamp progress values, render threshold states, label progress accessibly, and avoid layout shift.',
    },
  ];

  readonly evaluationRubric: RubricItem[] = [
    {
      area: 'State ownership',
      signal: 'The solution keeps source-of-truth state small, derived data derived, and updates predictable.',
      checks: ['Controlled inputs', 'Immutable updates', 'No duplicated derived state'],
    },
    {
      area: 'Component boundaries',
      signal: 'The UI is split into clear pieces without over-abstracting the first working version.',
      checks: ['Readable props', 'Local vs shared state', 'Simple public contracts'],
    },
    {
      area: 'Async behavior',
      signal: 'Loading, error, empty, cancellation, and stale responses are handled intentionally.',
      checks: ['Race protection', 'Debounce/takeLatest', 'Retry or recovery path'],
    },
    {
      area: 'Edge cases',
      signal: 'The candidate tests the states interviewers use to break shallow implementations.',
      checks: ['Empty data', 'Duplicate actions', 'Boundary values'],
    },
    {
      area: 'Accessibility',
      signal: 'Interactive UI works with keyboard, focus, labels, announcements, and semantic controls.',
      checks: ['Keyboard path', 'Visible focus', 'ARIA only where needed'],
    },
    {
      area: 'Testing and explanation',
      signal: 'The final answer proves behavior and explains tradeoffs without hiding behind code volume.',
      checks: ['Manual checks', 'Unit-level scenarios', 'Tradeoff narration'],
    },
  ];

  readonly timeboxPlan: TimeboxItem[] = [
    {
      window: '0-10 min',
      title: 'Clarify scope',
      detail: 'Confirm required states, data shape, interactions, accessibility expectations, and stretch goals before coding.',
    },
    {
      window: '10-30 min',
      title: 'Ship baseline UI',
      detail: 'Render the smallest correct version with clear state ownership and working primary interactions.',
    },
    {
      window: '30-45 min',
      title: 'Add edge cases and a11y',
      detail: 'Cover empty, loading, error, keyboard, focus, mobile, and repeated-action behavior.',
    },
    {
      window: '45-55 min',
      title: 'Verify behavior',
      detail: 'Run available checks or manual scenarios, then fix the highest-risk failures first.',
    },
    {
      window: '55-60 min',
      title: 'Explain tradeoffs',
      detail: 'Summarize state choices, async policy, performance limits, and what you would improve next.',
    },
  ];

  readonly workedExample: WorkedExample = {
    title: 'Autocomplete Search Bar (Hooks)',
    route: ['/', 'react', 'coding', 'react-autocomplete-search-starter'],
    path: '/react/coding/react-autocomplete-search-starter',
    intro:
      'Autocomplete is a compact React UI coding interview question because it combines async state, keyboard control, focus management, and accessible suggestions in one component.',
    panels: [
      {
        title: 'Requirements to clarify',
        items: [
          'Fetch suggestions from an async source as the user types.',
          'Debounce keystrokes and ignore stale responses.',
          'Support keyboard navigation, selection, loading, no-results, and error states.',
        ],
      },
      {
        title: 'State model',
        items: [
          'query, debouncedQuery, status, results, highlightedIndex, selectedItem.',
          'requestId or AbortController for takeLatest behavior.',
          'Optional cache for repeated queries when the API contract allows it.',
        ],
      },
      {
        title: 'Edge cases',
        items: [
          'Empty query clears suggestions and resets highlight state.',
          'Older slow responses cannot replace newer results.',
          'Escape, blur, and click selection behave predictably.',
        ],
      },
      {
        title: 'Stretch goals',
        items: [
          'Use combobox/listbox semantics only when the custom UI needs them.',
          'Add tests around stale responses and keyboard navigation.',
          'Explain when virtualization or server-side ranking becomes necessary.',
        ],
      },
    ],
  };

  readonly focusLinks: HubLink[] = [
    {
      label: 'JavaScript utility rounds',
      description: 'Debounce, throttle, Promise utilities, deep clone, currying, and async reasoning.',
      route: ['/coding'],
      queryParams: { view: 'formats', category: 'js-fn' },
      path: '/coding',
    },
    {
      label: 'React machine coding',
      description: 'Timed React UI prompts for hooks, state, lists, forms, and component boundaries.',
      route: ['/react/interview-questions'],
      path: '/react/interview-questions',
    },
    {
      label: 'Angular machine coding',
      description: 'Component, forms, RxJS, service, and template-state prompts for Angular interviews.',
      route: ['/angular/interview-questions'],
      path: '/angular/interview-questions',
    },
    {
      label: 'Vue machine coding',
      description: 'Composition API, reactivity, forms, events, and component communication practice.',
      route: ['/vue/interview-questions'],
      path: '/vue/interview-questions',
    },
    {
      label: 'HTML/CSS UI coding',
      description: 'Layout, semantics, responsive UI, accessibility, and visual-state implementation prompts.',
      route: ['/coding'],
      queryParams: { view: 'formats', category: 'html-css' },
      path: '/coding',
    },
    {
      label: 'System design follow-up',
      description: 'Move from working UI into architecture, state, caching, performance, and tradeoffs.',
      route: ['/system-design'],
      path: '/system-design',
    },
    {
      label: '30-day guided plan',
      description: 'Use the full prep sequence when you need daily practice instead of random prompt browsing.',
      route: ['/tracks', 'foundations-30d', 'preview'],
      path: '/tracks/foundations-30d/preview',
    },
    {
      label: 'Frontend coding interview questions and prep guide',
      description: 'Map UI coding, JavaScript utility, browser, framework, and debugging prompts before timed practice.',
      route: ['/guides', 'interview-blueprint', 'coding-interviews'],
      path: '/guides/interview-blueprint/coding-interviews',
    },
    {
      label: 'Frontend interview preparation guide',
      description: 'Review the full interview loop, question categories, scoring signals, and prep roadmap.',
      route: ['/guides', 'interview-blueprint', 'intro'],
      path: '/guides/interview-blueprint/intro',
    },
    {
      label: 'Company prep',
      description: 'Add company-specific round structure after your implementation baseline is stable.',
      route: ['/companies'],
      path: '/companies',
    },
  ];

  readonly faqItems: FaqItem[] = [
    {
      question: 'What is a frontend machine coding round?',
      answer:
        'A frontend machine coding round is a timed implementation interview where you build a working UI component, JavaScript utility, or small product slice, then explain state ownership, edge cases, accessibility, and tradeoffs.',
    },
    {
      question: 'What are the most common frontend machine coding questions?',
      answer:
        'Common frontend machine coding questions include autocomplete, debounced search, contact forms, multi-step forms, nested checkbox trees, paginated data tables, shopping carts, nested comments, chips inputs, transfer lists, accordions, tabs, theme toggles, and progress bars.',
    },
    {
      question: 'Should I practice React machine coding or vanilla JavaScript first?',
      answer:
        'Start with the format your target interviews use. React machine coding is common for UI rounds, but vanilla JavaScript still matters because debounce, throttle, promises, DOM events, and state timing show up inside React UI coding interview questions.',
    },
    {
      question: 'How are frontend UI coding interviews evaluated?',
      answer:
        'Frontend UI coding interviews are evaluated on visible correctness, component boundaries, state design, async behavior, empty/loading/error states, accessibility, tests or manual verification, and how clearly you explain tradeoffs.',
    },
    {
      question: 'How should I prepare for a 60-minute machine coding round?',
      answer:
        'Use a 60-minute machine coding strategy: clarify scope first, ship the smallest working UI, add edge cases and accessibility, verify behavior with checks, then summarize tradeoffs and production hardening.',
    },
  ];

  readonly sequence = [
    {
      step: '1',
      title: 'Pick the round format',
      detail: 'Start with UI coding if the interview asks for widgets, or JavaScript utilities if the round is function-first.',
    },
    {
      step: '2',
      title: 'Build the smallest correct UI',
      detail: 'Render the required states first, then add edge cases, keyboard behavior, and failure handling.',
    },
    {
      step: '3',
      title: 'Run checks and explain tradeoffs',
      detail: 'Use tests or preview behavior to verify the solution, then explain state ownership and performance decisions.',
    },
    {
      step: '4',
      title: 'Move into a guided plan',
      detail: 'When misses repeat, stop browsing and use the 7-day or 30-day plan to rebuild the weak area.',
    },
  ];

  ngOnInit(): void {
    const canonicalPath = '/machine-coding';
    const canonicalUrl = this.seo.buildCanonicalUrl(canonicalPath);
    const featuredItemList = {
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#featured-machine-coding-questions`,
      url: canonicalUrl,
      name: 'Most asked frontend machine coding questions',
      numberOfItems: this.featuredQuestions.length,
      itemListElement: this.featuredQuestions.map((question, index) => {
        const url = this.seo.buildCanonicalUrl(question.path);
        return {
          '@type': 'ListItem',
          position: index + 1,
          name: question.title,
          url,
          item: {
            '@type': 'WebPage',
            name: question.title,
            url,
          },
        };
      }),
    };
    const faqPage = {
      '@type': 'FAQPage',
      '@id': `${canonicalUrl}#faq`,
      url: canonicalUrl,
      name: 'Frontend machine coding interview FAQ',
      mainEntity: this.faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };

    this.seo.updateTags({
      title: 'Frontend Machine Coding Interview Questions',
      description:
        'Practice frontend machine coding and UI coding interview questions with React, Angular, Vue, async widgets, forms, tables, rubric, and guided study plans.',
      canonical: canonicalPath,
      keywords: [
        'frontend machine coding questions',
        'frontend UI coding interview questions',
        'React machine coding interview questions',
        'frontend coding interview practice',
        'machine coding round frontend',
        'UI coding interview questions',
        'frontend machine coding round questions',
        'React UI coding interview questions',
        'frontend coding interview practice with tests',
        'UI component coding interview questions',
      ],
      jsonLd: [
        {
          '@type': 'CollectionPage',
          '@id': canonicalUrl,
          url: canonicalUrl,
          name: 'Frontend Machine Coding Interview Questions',
          description:
            'Frontend machine coding questions hub with React UI prompts, requirements signals, rubric, strategy, checks, and direct practice links.',
          inLanguage: 'en',
          about: [
            { '@type': 'Thing', name: 'frontend machine coding questions' },
            { '@type': 'Thing', name: 'frontend UI coding interview questions' },
            { '@type': 'Thing', name: 'React machine coding interview questions' },
            { '@type': 'Thing', name: 'frontend coding interview practice' },
            { '@type': 'Thing', name: 'UI component coding interview questions' },
          ],
          mentions: [
            ...this.featuredQuestions.map((question) => ({
              '@type': 'WebPage',
              name: question.title,
              url: this.seo.buildCanonicalUrl(question.path),
            })),
            ...this.focusLinks.map((link) => ({
              '@type': 'WebPage',
              name: link.label,
              url: this.seo.buildCanonicalUrl(link.path),
            })),
          ],
        },
        {
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
              name: 'Frontend Machine Coding Interview Questions',
              item: canonicalUrl,
            },
          ],
        },
        featuredItemList,
        faqPage,
      ],
    });
  }
}
