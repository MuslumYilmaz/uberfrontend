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

  it('sanitizes html and clamps long strings without ellipsis padding', () => {
    const sanitized = sanitizeSerpText(
      '<strong>Hello</strong> world '.repeat(20),
      40
    );

    expect(sanitized).not.toContain('<strong>');
    expect(sanitized.length).toBeLessThanOrEqual(40);
    expect(sanitized.endsWith('…')).toBeFalse();
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
    expect(first).toContain('Interview Answer');
    expect(second).toContain('Interview Answer');
    expect(first.length).toBeLessThanOrEqual(54);
    expect(second.length).toBeLessThanOrEqual(54);
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
        title: 'Can React Return undefined? React 18 vs null',
        description:
          'React 18+ permits undefined component returns. Practice when it renders nothing, why null is clearer, how React 17 differed, and lint catches return bugs.',
      },
    } as any;

    const title = seoTitleForQuestion(question);
    const description = seoDescriptionForQuestion(question, 'fallback description', 'react');

    expect(title).toBe('Can React Return undefined? React 18 vs null');
    expect(title.length).toBeLessThanOrEqual(54);
    expect(description).toBe(
      'React 18+ permits undefined component returns. Practice when it renders nothing, why null is clearer, how React 17 differed, and lint catches return bugs.',
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
        title: 'Angular HttpClient Unsubscribe: 6 Tests & DevTools',
        description:
          'Run six tests for unsubscribe, switchMap, AsyncPipe, mergeMap, and shareReplay. Prove RxJS teardown, browser abort, and stale-UI protection.',
      },
    } as any;

    const title = seoTitleForQuestion(question);
    const description = seoDescriptionForQuestion(question, 'fallback description', 'angular');

    expect(title).toBe('Angular HttpClient Unsubscribe: 6 Tests & DevTools');
    expect(title.length).toBeLessThanOrEqual(54);
    expect(description).toBe(
      'Run six tests for unsubscribe, switchMap, AsyncPipe, mergeMap, and shareReplay. Prove RxJS teardown, browser abort, and stale-UI protection.'
    );
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
