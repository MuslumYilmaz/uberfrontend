import { seoDescriptionForQuestion, seoTitleForQuestion, sanitizeSerpText } from './trivia-seo.util';

describe('trivia-seo.util', () => {
  it('generates deterministic title without template prefix spam', () => {
    const title = seoTitleForQuestion({
      technology: 'react',
      title: 'Why does React sometimes show stale state in closures?',
    } as any);

    expect(title).toBe('Why does React sometimes show stale state in closures?');
    expect(title.toLowerCase()).not.toContain('interview question:');
    expect(title.length).toBeLessThanOrEqual(54);
  });

  it('normalizes editorial wrappers without truncating the sentence', () => {
    const text = 'Keep the complete concept and its final technical term. '.repeat(4).trim();
    expect(sanitizeSerpText(`<strong>${text}</strong>`)).toBe(text);
  });

  it('generates deterministic description from framework + content', () => {
    const fallback = seoDescriptionForQuestion(
      { title: 'Question title without override', technology: 'vue' } as any,
      '',
      'vue'
    );
    expect(fallback).toBe(
      'Practice Question title without override with a quick interview answer, examples, common mistakes, and production-focused follow-ups.'
    );
    expect(fallback.toLowerCase()).not.toContain('question focus:');
    expect(fallback.toLowerCase()).not.toContain('documentation');
    expect(fallback.length).toBeLessThanOrEqual(155);
  });

  it('generates behavior-question descriptions with quick answer and real example intent', () => {
    const fallback = seoDescriptionForQuestion(
      {
        id: 'angular-httpclient-unsubscribe-cancel-request',
        title: 'Does Angular HttpClient unsubscribe cancel requests?',
        technology: 'angular',
      } as any,
      '',
      'angular'
    );

    expect(fallback).toBe(
      'Understand Angular HttpClient unsubscribe cancel requests: quick answer, real example, common mistake, and senior interview follow-up.'
    );
    expect(fallback.toLowerCase()).not.toContain('official docs');
    expect(fallback.toLowerCase()).not.toContain('documentation');
  });

  it('generates comparison descriptions with vs and production pitfall intent', () => {
    const fallback = seoDescriptionForQuestion(
      {
        id: 'react-usememo-vs-usecallback',
        title: 'useMemo vs useCallback in React: what is the difference?',
        technology: 'react',
      } as any,
      '',
      'react'
    );

    expect(fallback).toBe(
      'useMemo vs useCallback in React: quick interview answer, examples, common mistakes, and production pitfalls.'
    );
    expect(fallback.toLowerCase()).not.toContain('api docs');
    expect(fallback.toLowerCase()).not.toContain('docs wording');
  });

  it('derives unique titles from question slug when needed', () => {
    const first = seoTitleForQuestion({
      id: 'vue-v-if-component-creation-destruction',
      title: '',
      technology: 'vue',
    } as any);
    const second = seoTitleForQuestion({
      id: 'vue-v-show-vs-v-if-dom-lifecycle',
      title: '',
      technology: 'vue',
    } as any);

    expect(first).not.toEqual(second);
    expect(first).toContain('Vue');
    expect(second).toContain('Vue');
    expect(first).toBe('Vue V If Component Creation Destruction');
    expect(second).toBe('V Show Vs V If DOM Lifecycle in Vue: Interview Answer');
  });

  it('keeps complete authored metadata beyond the soft snippet lengths', () => {
    const title = 'Angular directives in production: structural vs attribute, * syntax, and when TemplateRef matters';
    const description = 'Explain Angular directives through the real follow-ups: structural vs attribute behavior, * microsyntax desugaring, preserved state, and when TemplateRef/ViewContainerRef belongs in the answer.';
    const question = {
      id: 'angular-directives',
      technology: 'angular',
      title: 'What are Angular directives?',
      seo: { title, description },
    } as any;

    expect(title.length).toBeGreaterThan(54);
    expect(description.length).toBeGreaterThan(155);
    expect(seoTitleForQuestion(question)).toBe(title);
    expect(seoDescriptionForQuestion(question, '', 'angular')).toBe(description);
  });

  it('preserves the final word of an authored comparison title', () => {
    const question = {
      id: 'css-margin-vs-padding',
      technology: 'css',
      title: 'What is the difference between margin and padding in CSS?',
      seo: {
        title: 'Margin vs Padding in CSS: Key Differences with Examples',
        description: 'Compare outside and inside spacing with real examples.',
      },
    } as any;

    expect(seoTitleForQuestion(question)).toBe(question.seo.title);
  });

  it('retargets long comparisons without dropping the last option or cutting the framework', () => {
    const question = {
      id: 'rxjs-subject-vs-behaviorsubject-vs-replaysubject-vs-asyncsubject',
      technology: 'angular',
      title: 'Subject vs BehaviorSubject vs ReplaySubject vs AsyncSubject in Angular: when do you use which?',
      seo: {
        title: 'Subject vs BehaviorSubject vs ReplaySubject vs AsyncSubject: late subscribers and state rules',
        description: 'Choose the right RxJS Subject variant by asking what late subscribers should receive.',
      },
    } as any;

    expect(seoTitleForQuestion(question)).toBe(
      'Subject vs BehaviorSubject vs ReplaySubject vs AsyncSubject in Angular',
    );
    expect(seoDescriptionForQuestion(question, '', 'angular')).toBe(
      'Subject vs BehaviorSubject vs ReplaySubject vs AsyncSubject in Angular: quick interview answer, examples, common mistakes, and production pitfalls.',
    );
  });

  it('preserves complete behavior questions and the concept used in their descriptions', () => {
    const question = {
      id: 'react-fragments-dom-and-reconciliation',
      technology: 'react',
      title: 'How do fragments affect the rendered DOM and reconciliation?',
      seo: {
        title: 'What do React fragments do and when should you use them?',
        description: 'React fragments group children without adding extra DOM nodes.',
      },
    } as any;

    expect(seoTitleForQuestion(question)).toBe(question.title);
    expect(seoDescriptionForQuestion(question, '', 'react')).toBe(
      'Understand fragments affect the rendered DOM and reconciliation: quick answer, real example, common mistake, and senior interview follow-up.',
    );
  });

  it('keeps literal HTML tag names in authored titles and descriptions', () => {
    const question = {
      id: 'html-a-tag',
      technology: 'html',
      title: 'What is the HTML a tag?',
      seo: {
        title: 'HTML <a> tag: navigation semantics, accessibility, and common pitfalls',
        description: 'Learn when to use <a> for real navigation, how href/rel affect accessibility and SEO, and which common pitfalls break browser behavior.',
      },
    } as any;

    expect(seoTitleForQuestion(question)).toBe(question.seo.title);
    expect(seoDescriptionForQuestion(question, '', 'html')).toBe(question.seo.description);
  });

  it('does not truncate a long fallback concept to make room for the optional suffix', () => {
    const question = {
      id: 'long-comparison',
      technology: 'javascript',
      title: 'Immutable data structures across deeply nested application state and concurrent asynchronous workflows',
    } as any;

    expect(seoTitleForQuestion(question)).toBe(`JavaScript ${question.title}`);
    expect(seoDescriptionForQuestion(question, '', 'javascript')).toBe(
      `Practice ${question.title} with a quick interview answer, examples, common mistakes, and production-focused follow-ups.`,
    );
  });

  it('preserves the React stale closures search landing metadata', () => {
    const expectedTitle = 'React Stale Closures: 6 PRs, Which Fix Is Right?';
    const expectedDescription =
      'Review six React pull requests: four stale closures, one intentional snapshot, and one async race. Predict the failure and reveal the minimal safe diff.';
    const title = seoTitleForQuestion({
      id: 'react-stale-state-closures',
      title: 'Why does React sometimes show stale state in closures? How do you fix it?',
      technology: 'react',
      seo: {
        title: expectedTitle,
        description: expectedDescription,
      },
    } as any);

    const description = seoDescriptionForQuestion(
      {
        id: 'react-stale-state-closures',
        title: 'Why does React sometimes show stale state in closures? How do you fix it?',
        technology: 'react',
        seo: {
          title: expectedTitle,
          description: expectedDescription,
        },
      } as any,
      'fallback description',
      'react'
    );

    expect(title).toBe(expectedTitle);
    expect(description).toBe(expectedDescription);
    expect(title.length).toBeLessThanOrEqual(54);
    expect(description.length).toBeLessThanOrEqual(155);
  });

  it('preserves the JavaScript async race title experiment without changing its description', () => {
    const expectedTitle = 'JavaScript Async Race Conditions: Fix Stale UI';
    const expectedDescription =
      'Fix the stale UI bug where older async work overwrites newer results; compare AbortController, request-id guards, and takeLatest ownership.';
    const question = {
      id: 'js-async-race-conditions',
      title: 'Async Race Conditions and Stale UI Updates',
      technology: 'javascript',
      seo: {
        title: expectedTitle,
        description: expectedDescription,
      },
    } as any;

    const title = seoTitleForQuestion(question);
    const description = seoDescriptionForQuestion(question, 'fallback description', 'javascript');

    expect(title).toBe(expectedTitle);
    expect(description).toBe(expectedDescription);
    expect(title.length).toBeLessThanOrEqual(54);
    expect(description.length).toBeLessThanOrEqual(155);
  });

  it('preserves the exact JavaScript event-loop visualizer SEO contract', () => {
    const expectedH1 = 'JavaScript Event Loop Visualizer: Learn by Predicting';
    const expectedTitle = 'JavaScript Event Loop Visualizer: Predict Output Order';
    const expectedDescription =
      'Predict the output, then step through JavaScript’s call stack, microtasks, timers, and render opportunity in a 75-second browser event-loop challenge.';
    const question = {
      id: 'js-event-loop',
      title: expectedH1,
      technology: 'javascript',
      seo: {
        h1: expectedH1,
        title: expectedTitle,
        description: expectedDescription,
      },
    } as any;

    const title = seoTitleForQuestion(question);
    const description = seoDescriptionForQuestion(question, 'fallback description', 'javascript');

    expect(question.seo.h1).toBe(expectedH1);
    expect(title).toBe(expectedTitle);
    expect(description).toBe(expectedDescription);
    expect(title.length).toBeLessThanOrEqual(54);
    expect(description.length).toBeLessThanOrEqual(155);
  });

  it('preserves React render-nothing SEO title when description carries interview intent', () => {
    const question = {
      id: 'react-render-nothing-return-value',
      title: 'Can a React component return undefined?',
      technology: 'react',
      seo: {
        title: 'React Return null vs undefined: React 18+ Explained',
        description:
          'Compare null and undefined returns in React 18+, see what changed since React 17, and catch accidental missing returns with TypeScript and lint rules.',
      },
    } as any;

    const title = seoTitleForQuestion(question);
    const description = seoDescriptionForQuestion(question, 'fallback description', 'react');

    expect(title).toBe('React Return null vs undefined: React 18+ Explained');
    expect(title.length).toBeLessThanOrEqual(54);
    expect(description).toBe(
      'Compare null and undefined returns in React 18+, see what changed since React 17, and catch accidental missing returns with TypeScript and lint rules.',
    );
    expect(description.length).toBeLessThanOrEqual(155);
  });

  it('preserves Vue destructuring long-tail interview SEO override', () => {
    const question = {
      id: 'vue-destructuring-breaks-reactivity-torefs-toref',
      title: 'Why does destructuring break reactivity in Vue? Explain toRefs, toRef, and how to safely extract reactive state',
      technology: 'vue',
      seo: {
        title: 'Why Vue Destructuring Breaks Reactivity',
        description:
          'Vue interview answer: fix stale reactive state with toRefs(), toRef(), prop getters, and composable-safe patterns.',
      },
    } as any;

    const title = seoTitleForQuestion(question);
    const description = seoDescriptionForQuestion(question, 'fallback description', 'vue');

    expect(title).toBe('Why Vue Destructuring Breaks Reactivity');
    expect(title.length).toBeLessThanOrEqual(54);
    expect(description).toBe(
      'Vue interview answer: fix stale reactive state with toRefs(), toRef(), prop getters, and composable-safe patterns.'
    );
    expect(description.length).toBeLessThanOrEqual(155);
  });

  it('preserves the Angular HttpClient cancellation lab SEO contract', () => {
    const question = {
      id: 'angular-http-what-actually-cancels-request',
      title: 'Does Angular HttpClient unsubscribe cancel requests?',
      technology: 'angular',
      seo: {
        title: 'Does Angular HttpClient Unsubscribe Cancel Requests?',
        description:
          'Test when unsubscribe cancels Angular HTTP requests, why server work may continue, and how six runnable tests expose stale UI bugs.',
      },
    } as any;

    const title = seoTitleForQuestion(question);
    const description = seoDescriptionForQuestion(question, 'fallback description', 'angular');

    expect(title).toBe('Does Angular HttpClient Unsubscribe Cancel Requests?');
    expect(title.length).toBeLessThanOrEqual(54);
    expect(description).toBe(
      'Test when unsubscribe cancels Angular HTTP requests, why server work may continue, and how six runnable tests expose stale UI bugs.'
    );
    expect(description.length).toBeLessThanOrEqual(155);
  });

  it('preserves the Angular template-driven vs reactive forms pilot metadata', () => {
    const expectedTitle = 'Template-Driven vs Reactive Forms: Angular Interview';
    const expectedDescription =
      'Angular interview answer comparing template-driven and reactive forms by state, validation, dynamic controls, testing, and when ngModel stops scaling.';
    const question = {
      id: 'angular-template-driven-vs-reactive-forms-which-scales',
      title: 'Template-Driven vs Reactive Forms in Angular: Which One Scales and Why?',
      technology: 'angular',
      seo: {
        title: expectedTitle,
        description: expectedDescription,
      },
    } as any;

    const title = seoTitleForQuestion(question);
    const description = seoDescriptionForQuestion(question, 'fallback description', 'angular');

    expect(title).toBe(expectedTitle);
    expect(description).toBe(expectedDescription);
    expect(title.length).toBeLessThanOrEqual(54);
    expect(description.length).toBeLessThanOrEqual(155);
  });

  it('preserves the CSS sticky debugging lab SEO contract', () => {
    const question = {
      id: 'css-position-sticky-not-working',
      title: 'Why is CSS position: sticky not working?',
      technology: 'css',
      seo: {
        title: 'CSS Sticky Not Working? 5 Causes and Fixes',
        description:
          'Diagnose CSS position: sticky failures with five broken layouts. Inspect overflow, insets, container height, flex/grid stretch, then test the fix.',
      },
    } as any;

    const title = seoTitleForQuestion(question);
    const description = seoDescriptionForQuestion(question, 'fallback description', 'css');

    expect(title).toBe('CSS Sticky Not Working? 5 Causes and Fixes');
    expect(title.length).toBeLessThanOrEqual(54);
    expect(description).toBe(
      'Diagnose CSS position: sticky failures with five broken layouts. Inspect overflow, insets, container height, flex/grid stretch, then test the fix.'
    );
    expect(description.length).toBeLessThanOrEqual(155);
  });

  it('preserves interview-first React StrictMode useEffect SEO override', () => {
    const question = {
      id: 'react-strictmode-double-invoke-effects',
      title: 'Why does useEffect run twice in React StrictMode?',
      technology: 'react',
      seo: {
        title: 'Why StrictMode Re-runs useEffect: What Interviewers Expect',
        description:
          'Practice a natural React StrictMode answer: why effects re-run in dev, why event handlers stay single, and how cleanup prevents duplicate fetches.',
      },
    } as any;

    const title = seoTitleForQuestion(question);
    const description = seoDescriptionForQuestion(question, 'fallback description', 'react');

    expect(title).toBe('Why StrictMode Re-runs useEffect: What Interviewers Expect');
    expect(description).toBe(
      'Practice a natural React StrictMode answer: why effects re-run in dev, why event handlers stay single, and how cleanup prevents duplicate fetches.'
    );
  });

  it('normalizes broad difference metadata into comparison interview intent', () => {
    const title = seoTitleForQuestion({
      id: 'react-usememo-vs-usecallback',
      title: 'useMemo vs useCallback in React: what is the difference?',
      technology: 'react',
      seo: {
        title: 'useMemo vs useCallback in React: what is the difference?',
        description: 'Learn the difference between useMemo and useCallback in React.',
      },
    } as any);

    const description = seoDescriptionForQuestion(
      {
        id: 'react-usememo-vs-usecallback',
        title: 'useMemo vs useCallback in React: what is the difference?',
        technology: 'react',
        seo: {
          title: 'useMemo vs useCallback in React: what is the difference?',
          description: 'Learn the difference between useMemo and useCallback in React.',
        },
      } as any,
      'fallback description',
      'react'
    );

    expect(title).toBe('useMemo vs useCallback in React: Interview Answer');
    expect(title).not.toContain('the difference');
    expect(title.length).toBeLessThanOrEqual(54);
    expect(description).toBe(
      'useMemo vs useCallback in React: quick interview answer, examples, common mistakes, and production pitfalls.'
    );
    expect(description.length).toBeLessThanOrEqual(155);
  });

  it('regenerates docs-intent explicit seo metadata', () => {
    const question = {
      id: 'react-useeffect-cleanup',
      title: 'Does React useEffect cleanup cancel stale updates?',
      technology: 'react',
      seo: {
        title: 'React useEffect official docs wording',
        description:
          'Official documentation and API docs wording for React useEffect cleanup behavior.',
      },
    } as any;

    const title = seoTitleForQuestion(question);
    const description = seoDescriptionForQuestion(question, 'fallback description', 'react');
    const combined = `${title} ${description}`.toLowerCase();

    expect(title).toBe('Does React useEffect cleanup cancel stale updates?');
    expect(description).toBe(
      'Understand React useEffect cleanup cancel stale updates: quick answer, real example, common mistake, and senior interview follow-up.'
    );
    expect(combined).not.toContain('official docs');
    expect(combined).not.toContain('documentation');
    expect(combined).not.toContain('api docs');
    expect(combined).not.toContain('docs wording');
  });
});
