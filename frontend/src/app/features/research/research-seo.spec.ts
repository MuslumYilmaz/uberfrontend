import { buildResearchHubSeo, buildResearchReportSeo } from './research-seo';
import { ONPUSH_READINESS_REPORT, RESEARCH_REPORTS } from './research-reports';

describe('research-seo', () => {
  const seoMock = { buildCanonicalUrl: (value: string) => `https://frontendatlas.com${value}` };
  const canonical = 'https://frontendatlas.com/research/angular-onpush-readiness';
  const nodes = (meta: { jsonLd?: unknown }) => (Array.isArray(meta.jsonLd) ? meta.jsonLd : []) as Array<Record<string, any>>;

  it('credits the report to its author as a Person, not to the editorial organisation', () => {
    const meta = buildResearchReportSeo(seoMock, ONPUSH_READINESS_REPORT, {});
    const article = nodes(meta).find((node) => node['@type'] === 'Article');

    expect(meta.canonical).toBe(canonical);
    expect(meta.ogType).toBe('article');
    expect(article?.['headline']).toBe(ONPUSH_READINESS_REPORT.title);
    expect(article?.['url']).toBe(canonical);
    expect(article?.['author']).toEqual({ '@type': 'Person', name: 'Müslim Yılmaz', url: 'https://github.com/MuslumYilmaz' });
    expect(article?.['datePublished']).toBe(`${ONPUSH_READINESS_REPORT.publishedAt}T00:00:00.000Z`);
    expect(article?.['isBasedOn']).toBe('https://github.com/MuslumYilmaz/onpush-census');
  });

  it('takes dateModified from the verified content dates and leaves it out when the route has none', () => {
    const dated = nodes(buildResearchReportSeo(seoMock, ONPUSH_READINESS_REPORT, { '/research/angular-onpush-readiness': '2026-12-01' }))
      .find((node) => node['@type'] === 'Article');
    const undated = nodes(buildResearchReportSeo(seoMock, ONPUSH_READINESS_REPORT, {}))
      .find((node) => node['@type'] === 'Article');

    expect(dated?.['dateModified']).toBe('2026-12-01T00:00:00.000Z');
    expect(undated && 'dateModified' in undated).toBeFalse();
  });

  it('places the report under the research hub in its breadcrumb', () => {
    const crumbs = nodes(buildResearchReportSeo(seoMock, ONPUSH_READINESS_REPORT, {}))
      .find((node) => node['@type'] === 'BreadcrumbList')?.['itemListElement'] as Array<Record<string, any>>;

    expect(crumbs.map((item) => item['position'])).toEqual([1, 2, 3]);
    expect(crumbs[1]['item']).toBe('https://frontendatlas.com/research');
    expect(crumbs[2]['item']).toBe(canonical);
  });

  it('lists every published report on the hub', () => {
    const meta = buildResearchHubSeo(seoMock);
    const collection = nodes(meta).find((node) => node['@type'] === 'CollectionPage');
    const parts = collection?.['hasPart'] as Array<Record<string, any>>;

    expect(meta.canonical).toBe('https://frontendatlas.com/research');
    expect(parts.map((part) => part['url'])).toEqual(RESEARCH_REPORTS.map((report) => `https://frontendatlas.com${report.route}`));
  });
});
