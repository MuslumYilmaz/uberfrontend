import { seoDescriptionForQuestion, seoTitleForQuestion, sanitizeSerpText } from './trivia-seo.util';

describe('trivia-seo.util', () => {
  it('generates deterministic title without template prefix spam', () => {
    const title = seoTitleForQuestion({
      technology: 'react',
      title: 'Why does React sometimes show stale state in closures?',
    } as any);

    expect(title).toContain('React');
    expect(title).toContain('Interview Answer');
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
    expect(fallback).toContain('Vue interview answer');
    expect(fallback.toLowerCase()).toContain('frontend interview prep');
    expect(fallback.toLowerCase()).not.toContain('question focus:');
    expect(fallback.length).toBeLessThanOrEqual(155);
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

  it('preserves question-level seo title and description when interview intent is explicit', () => {
    const title = seoTitleForQuestion({
      id: 'react-stale-state-closures',
      title: 'Why does React sometimes show stale state in closures? How do you fix it?',
      technology: 'react',
      seo: {
        title: 'React stale closures interview answer',
        description:
          'Practice a React interview answer for stale closures with follow-up fixes and dependency-safe patterns.',
      },
    } as any);

    const description = seoDescriptionForQuestion(
      {
        id: 'react-stale-state-closures',
        title: 'Why does React sometimes show stale state in closures? How do you fix it?',
        technology: 'react',
        seo: {
          title: 'React stale closures interview answer',
          description:
            'Practice a React interview answer for stale closures with follow-up fixes and dependency-safe patterns.',
        },
      } as any,
      'fallback description',
      'react'
    );

    expect(title).toBe('React stale closures interview answer');
    expect(description).toContain('dependency-safe patterns');
    expect(description.toLowerCase()).not.toContain('question focus:');
    expect(description.toLowerCase()).not.toContain('frontend interview prep routine');
  });

  it('preserves answer-first Angular HttpClient cancellation SEO override', () => {
    const question = {
      id: 'angular-http-what-actually-cancels-request',
      title: 'What Actually Cancels an HTTP Request in Angular?',
      technology: 'angular',
      seo: {
        title: 'Angular HttpClient Cancellation: Unsubscribe Abort Interview Answer',
        description:
          'Yes: unsubscribing from an Angular HttpClient Observable aborts an in-progress request. Practice switchMap, AsyncPipe, takeUntilDestroyed, and stale-response traps.',
      },
    } as any;

    const title = seoTitleForQuestion(question);
    const description = seoDescriptionForQuestion(question, 'fallback description', 'angular');

    expect(title).toBe(
      'Angular HttpClient Cancellation: Unsubscribe Abort Interview Answer'
    );
    expect(description).toBe(
      'Yes: unsubscribing from an Angular HttpClient Observable aborts an in-progress request. Practice switchMap, AsyncPipe, takeUntilDestroyed, and stale-response traps.'
    );
  });

  it('normalizes docs-style explicit seo metadata into interview answer intent', () => {
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

    expect(title).toContain(': Interview Answer');
    expect(title).toContain('useMemo vs useCallback');
    expect(title).not.toContain('the difference');
    expect(title.length).toBeLessThanOrEqual(54);
    expect(description).toContain('Practice a React interview answer');
    expect(description).toContain('common mistake');
    expect(description).toContain('follow-up');
    expect(description.length).toBeLessThanOrEqual(155);
  });
});
