import { SeoMeta, SeoService } from '../../core/services/seo.service';
import { seoContentDateModified } from '../../core/utils/seo-content-date.util';
import { RESEARCH_REPORTS, ResearchReport } from './research-reports';

export const RESEARCH_HUB_ROUTE = '/research';
export const RESEARCH_HUB_TITLE = 'Research';
export const RESEARCH_HUB_SEO_TITLE = 'Research: data studies of real frontend code';
export const RESEARCH_HUB_DESCRIPTION =
  'Data studies of real-world frontend code. Each report publishes its method, its data and the tool behind it, so every number can be checked.';

const LOGO_PATH = '/assets/images/frontend-atlas-logo.png';

function authorSchema(report: ResearchReport): Record<string, string> {
  return { '@type': 'Person', name: report.author.name, url: report.author.url };
}

function isoDay(day: string): string {
  return `${day}T00:00:00.000Z`;
}

export function buildResearchReportSeo(
  seo: Pick<SeoService, 'buildCanonicalUrl'>,
  report: ResearchReport,
  dates?: Readonly<Record<string, string>>,
): SeoMeta {
  const canonical = seo.buildCanonicalUrl(report.route);
  const dateModified = seoContentDateModified(canonical, dates);
  const image = seo.buildCanonicalUrl(LOGO_PATH);
  const article = {
    '@type': 'Article',
    '@id': `${canonical}#article`,
    headline: report.title,
    description: report.description,
    url: canonical,
    mainEntityOfPage: canonical,
    inLanguage: 'en',
    image: [image],
    datePublished: isoDay(report.publishedAt),
    ...(dateModified ? { dateModified } : {}),
    author: authorSchema(report),
    publisher: { '@type': 'Organization', name: 'FrontendAtlas', logo: { '@type': 'ImageObject', url: image } },
    isAccessibleForFree: true,
    isBasedOn: report.sourceUrl,
    keywords: report.keywords.join(', '),
  };
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'FrontendAtlas', item: seo.buildCanonicalUrl('/') },
      { '@type': 'ListItem', position: 2, name: RESEARCH_HUB_TITLE, item: seo.buildCanonicalUrl(RESEARCH_HUB_ROUTE) },
      { '@type': 'ListItem', position: 3, name: report.title, item: canonical },
    ],
  };
  return {
    title: report.title,
    description: report.description,
    canonical,
    ogType: 'article',
    keywords: [...report.keywords],
    jsonLd: [article, breadcrumb],
  };
}

export function buildResearchHubSeo(
  seo: Pick<SeoService, 'buildCanonicalUrl'>,
  reports: readonly ResearchReport[] = RESEARCH_REPORTS,
): SeoMeta {
  const canonical = seo.buildCanonicalUrl(RESEARCH_HUB_ROUTE);
  const collection = {
    '@type': 'CollectionPage',
    '@id': `${canonical}#collection`,
    name: RESEARCH_HUB_TITLE,
    description: RESEARCH_HUB_DESCRIPTION,
    url: canonical,
    inLanguage: 'en',
    hasPart: reports.map((report) => ({
      '@type': 'Article',
      headline: report.title,
      url: seo.buildCanonicalUrl(report.route),
      datePublished: isoDay(report.publishedAt),
      author: authorSchema(report),
    })),
  };
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'FrontendAtlas', item: seo.buildCanonicalUrl('/') },
      { '@type': 'ListItem', position: 2, name: RESEARCH_HUB_TITLE, item: canonical },
    ],
  };
  return {
    title: RESEARCH_HUB_SEO_TITLE,
    description: RESEARCH_HUB_DESCRIPTION,
    canonical,
    jsonLd: [collection, breadcrumb],
  };
}
