import { seoDescriptionForQuestion, seoTitleForQuestion, sanitizeSerpText } from './trivia-seo.util';

describe('trivia-seo.util', () => {
  it('uses seo title override when present', () => {
    const title = seoTitleForQuestion({
      title: 'Original question title',
      seo: { title: 'Custom SERP title for CTR' },
    } as any);

    expect(title).toBe('Custom SERP title for CTR');
  });

  it('falls back to framework-first deterministic title when override is absent', () => {
    const title = seoTitleForQuestion({
      technology: 'react',
      title: 'Why does React sometimes show stale state in closures?',
    } as any);

    expect(title).toContain('React');
    expect(title).toContain('Interview');
  });

  it('sanitizes html and clamps long strings', () => {
    const sanitized = sanitizeSerpText(
      '<strong>Hello</strong> world '.repeat(20),
      40
    );

    expect(sanitized).not.toContain('<strong>');
    expect(sanitized.length).toBeLessThanOrEqual(40);
    expect(sanitized.endsWith('…')).toBeTrue();
  });

  it('uses override description and keeps fallback deterministic', () => {
    const override = seoDescriptionForQuestion(
      {
        title: 'Question title',
        seo: { description: 'Custom SERP description.' },
      } as any,
      'Base plain description.',
      'react'
    );
    expect(override).toBe('Custom SERP description.');

    const fallback = seoDescriptionForQuestion(
      { title: 'Question title without override', technology: 'vue' } as any,
      '',
      'vue'
    );
    expect(fallback).toContain('Vue explanation');
    expect(fallback.length).toBeLessThanOrEqual(156);
  });

  it('derives unique fallback titles from question slug when needed', () => {
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
});
