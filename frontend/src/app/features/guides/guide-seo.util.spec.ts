import { buildGuideDetailSeo } from './guide-seo.util';

describe('guide-seo.util', () => {
  const seoMock = {
    buildCanonicalUrl: (value: string) => `https://frontendatlas.com${value}`,
  } as any;

  it('builds slug-specific guide metadata with breadcrumb and article schema', () => {
    const meta = buildGuideDetailSeo(
      seoMock,
      'System Design Blueprint',
      'system-design-blueprint',
      {
        slug: 'architecture',
        title: 'Frontend Architecture',
        summary: 'Compare CSR, SSR, and islands with frontend interview trade-offs.',
      } as any
    );

    expect(meta.title).toContain('Frontend Architecture');
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/system-design-blueprint/architecture');
    expect(meta.ogType).toBe('article');

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    expect(graph.some((node: any) => node?.['@type'] === 'BreadcrumbList')).toBeTrue();
    expect(graph.some((node: any) => node?.['@type'] === 'TechArticle')).toBeTrue();
  });

  it('falls back to deterministic description when summary is missing', () => {
    const meta = buildGuideDetailSeo(
      seoMock,
      'Behavioral Blueprint',
      'behavioral',
      {
        slug: 'storytelling',
        title: 'STAR Storytelling',
      } as any
    );

    expect(meta.description).toContain('Behavioral Blueprint');
    expect(meta.description || '').toMatch(/frontend interview preparation/i);
    expect(meta.description || '').toMatch(/interview roadmap/i);
    expect(meta.description?.length || 0).toBeLessThanOrEqual(158);
  });

  it('normalizes non-interview summaries to keep interview intent explicit', () => {
    const meta = buildGuideDetailSeo(
      seoMock,
      'System Design Blueprint',
      'system-design-blueprint',
      {
        slug: 'state-data',
        title: 'State and Data',
        summary: 'Patterns for state management and caching in modern apps.',
      } as any
    );

    expect(meta.description || '').toMatch(/frontend interview preparation/i);
    expect(meta.description || '').toMatch(/interview roadmap/i);
    expect(meta.description?.length || 0).toBeLessThanOrEqual(158);
  });
});
