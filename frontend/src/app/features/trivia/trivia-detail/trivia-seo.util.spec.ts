import { seoDescriptionForQuestion, seoTitleForQuestion, sanitizeSerpText } from './trivia-seo.util';

describe('trivia-seo.util', () => {
  it('generates deterministic title without template prefix spam', () => {
    const title = seoTitleForQuestion({
      technology: 'react',
      title: 'Why does React sometimes show stale state in closures?',
    } as any);

    expect(title).toContain('React');
    expect(title.toLowerCase()).not.toContain('interview question:');
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
  });

  it('prefers question-level seo metadata when provided', () => {
    const title = seoTitleForQuestion({
      id: 'react-stale-state-closures',
      title: 'Why does React sometimes show stale state in closures? How do you fix it?',
      technology: 'react',
      seo: {
        title: 'React stale closures: why state gets stale',
        description:
          'Learn why closures capture stale React state in effects, timers, and handlers, then fix it with functional updates, refs, and dependency-safe patterns.',
      },
    } as any);

    const description = seoDescriptionForQuestion(
      {
        id: 'react-stale-state-closures',
        title: 'Why does React sometimes show stale state in closures? How do you fix it?',
        technology: 'react',
        seo: {
          title: 'React stale closures: why state gets stale',
          description:
            'Learn why closures capture stale React state in effects, timers, and handlers, then fix it with functional updates, refs, and dependency-safe patterns.',
        },
      } as any,
      'fallback description',
      'react'
    );

    expect(title).toBe('React stale closures: why state gets stale');
    expect(description).toContain('dependency-safe patterns');
    expect(description.toLowerCase()).not.toContain('question focus:');
    expect(description.toLowerCase()).not.toContain('frontend interview prep routine');
  });
});
