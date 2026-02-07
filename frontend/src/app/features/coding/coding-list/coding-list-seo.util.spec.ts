import { buildCodingListSeoMeta, hasIndexingSensitiveQueryParams } from './coding-list-seo.util';

describe('coding-list-seo.util', () => {
  const baseSeo = {
    title: 'Coding Questions',
    description: 'Practice coding questions',
    robots: 'index,follow',
    canonical: '/coding',
  };

  it('keeps clean /coding indexable when there are no query params', () => {
    const seo = buildCodingListSeoMeta(baseSeo, []);
    expect(seo.canonical).toBe('/coding');
    expect(seo.robots).toBe('index,follow');
  });

  it('marks filter/search query variants as noindex', () => {
    const seo = buildCodingListSeoMeta(baseSeo, ['q']);
    expect(seo.canonical).toBe('/coding');
    expect(seo.robots).toBe('noindex,follow');
    expect(hasIndexingSensitiveQueryParams(['q'])).toBeTrue();
  });

  it('marks unknown query variants as noindex to avoid duplicate indexing', () => {
    const seo = buildCodingListSeoMeta(baseSeo, ['utm_source']);
    expect(seo.canonical).toBe('/coding');
    expect(seo.robots).toBe('noindex,follow');
    expect(hasIndexingSensitiveQueryParams(['utm_source'])).toBeTrue();
  });
});
