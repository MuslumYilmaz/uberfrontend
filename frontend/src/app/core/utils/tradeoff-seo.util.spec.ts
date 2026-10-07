import { seoContentDateModified } from './seo-content-date.util';
import {
  buildTradeoffSeoMeta,
  tradeoffTechLabel,
  TRADEOFF_DETAIL_FALLBACK_SEO,
} from './tradeoff-seo.util';

describe('tradeoff-seo.util', () => {
  const buildCanonicalUrl = (value: string) => `https://frontendatlas.com${value}`;

  it('builds unique tradeoff detail metadata from resolved scenario data', () => {
    const seo = buildTradeoffSeoMeta({
      id: 'context-vs-zustand-vs-redux',
      title: 'Context vs Zustand vs Redux for a growing React dashboard',
      tech: 'react',
      difficulty: 'intermediate',
      summary: 'Choose state ownership from update frequency and product complexity.',
      tags: ['react', 'state management'],
      access: 'free',
      estimatedMinutes: 14,
      updatedAt: '2026-10-01',
    }, buildCanonicalUrl);

    expect(seo.title).toBe(
      'Context vs Zustand vs Redux for a growing React dashboard - React Tradeoff Question',
    );
    expect(seo.description).toContain('Practice this react tradeoff interview question.');
    expect(seo.canonical).toBe('/tradeoffs/context-vs-zustand-vs-redux');

    const graph = Array.isArray(seo.jsonLd) ? seo.jsonLd : [];
    const breadcrumb = graph.find((entry: any) => entry?.['@type'] === 'BreadcrumbList');
    const resource = graph.find((entry: any) => entry?.['@type'] === 'LearningResource');
    expect(resource?.author).toEqual({ '@type': 'Organization', name: 'FrontendAtlas Editorial' });
    expect(resource?.dateModified).toBe(seoContentDateModified(resource.url));
    expect(breadcrumb).toBeTruthy();
    expect(resource?.url).toBe('https://frontendatlas.com/tradeoffs/context-vs-zustand-vs-redux');
    expect(resource?.headline).toBe('Context vs Zustand vs Redux for a growing React dashboard');
    expect(resource?.isAccessibleForFree).toBeTrue();
  });

  it('keeps unresolved tradeoff metadata out of the index', () => {
    expect(TRADEOFF_DETAIL_FALLBACK_SEO.robots).toBe('noindex,follow');
    expect(tradeoffTechLabel('system-design')).toBe('System design');
    expect(tradeoffTechLabel('unknown-tech')).toBe('Frontend');
  });
});
