import { seoDescriptionForQuestion, seoTitleForQuestion, sanitizeSerpText } from './trivia-seo.util';

describe('trivia-seo.util', () => {
  it('uses seo title override when present', () => {
    const title = seoTitleForQuestion({
      title: 'Original question title',
      seo: { title: 'Custom SERP title for CTR' },
    } as any);

    expect(title).toBe('Custom SERP title for CTR');
  });

  it('falls back to deterministic interview framing when override is absent', () => {
    const title = seoTitleForQuestion({
      title: 'Why does React sometimes show stale state in closures?',
    } as any);

    expect(title).toContain('Intervie');
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
      { title: 'Question title without override' } as any,
      '',
      'vue'
    );
    expect(fallback).toContain('Question title without override');
    expect(fallback.length).toBeLessThanOrEqual(156);
  });
});
