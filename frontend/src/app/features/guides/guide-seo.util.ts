import { SeoMeta, SeoService } from '../../core/services/seo.service';
import { GuideEntry } from '../../shared/guides/guide.registry';

const DESCRIPTION_MAX_LEN = 158;

function normalizeText(input: string): string {
  return String(input || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clamp(input: string, maxLen: number): string {
  const text = normalizeText(input);
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return `${text.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`;
}

function fallbackGuideDescription(sectionTitle: string, title: string): string {
  return clamp(
    `${sectionTitle}: ${title}. Clear explanation, practical trade-offs, and interview-ready guidance for frontend engineers.`,
    DESCRIPTION_MAX_LEN
  );
}

export function buildGuideDetailSeo(
  seo: SeoService,
  sectionTitle: string,
  sectionPath: string,
  entry: GuideEntry
): SeoMeta {
  const canonical = seo.buildCanonicalUrl(`/guides/${sectionPath}/${entry.slug}`);
  const title = clamp(entry.title, 74) || 'Frontend guide';
  const description = clamp(entry.summary || '', DESCRIPTION_MAX_LEN)
    || fallbackGuideDescription(sectionTitle, title);

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'FrontendAtlas',
        item: seo.buildCanonicalUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Guides',
        item: seo.buildCanonicalUrl('/guides'),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: sectionTitle,
        item: seo.buildCanonicalUrl(`/guides/${sectionPath}`),
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: title,
        item: canonical,
      },
    ],
  };

  const article = {
    '@type': 'TechArticle',
    '@id': canonical,
    headline: title,
    description,
    mainEntityOfPage: canonical,
    inLanguage: 'en',
    isAccessibleForFree: true,
    author: {
      '@type': 'Organization',
      name: 'FrontendAtlas Team',
    },
  };

  return {
    title,
    description,
    canonical,
    ogType: 'article',
    jsonLd: [breadcrumb, article],
  };
}
