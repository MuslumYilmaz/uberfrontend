import { SeoMeta, SeoService } from '../../core/services/seo.service';
import { GuideEntry } from '../../shared/guides/guide.registry';

const DESCRIPTION_MAX_LEN = 158;
const INTERVIEW_INTENT_RX = /\b(interview|prep|preparation|roadmap|hiring|onsite|screen)\b/i;

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
    `${sectionTitle}: ${title}. Frontend interview preparation guide with a practical interview roadmap, trade-offs, and interview-ready explanations.`,
    DESCRIPTION_MAX_LEN
  );
}

function ensureInterviewIntent(
  description: string,
  sectionTitle: string,
  title: string
): string {
  const normalized = clamp(description, DESCRIPTION_MAX_LEN);
  if (normalized && INTERVIEW_INTENT_RX.test(normalized)) return normalized;
  return clamp(
    `${sectionTitle}: ${title}. Frontend interview preparation guide with interview roadmap context, practical examples, and common mistakes to avoid.`,
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
  const title = clamp(entry.seo?.title || entry.title, 74) || 'Frontend guide';
  const rawDescription = entry.seo?.description || entry.summary || '';
  const description = ensureInterviewIntent(
    clamp(rawDescription, DESCRIPTION_MAX_LEN)
      || fallbackGuideDescription(sectionTitle, title),
    sectionTitle,
    title
  );
  const imageUrl = seo.buildCanonicalUrl('/assets/images/frontend-atlas-logo.png');
  const datePublished = '2025-01-01T00:00:00.000Z';

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
    url: canonical,
    image: [imageUrl],
    datePublished,
    dateModified: datePublished,
    mainEntityOfPage: canonical,
    inLanguage: 'en',
    isAccessibleForFree: true,
    author: {
      '@type': 'Organization',
      name: 'FrontendAtlas Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'FrontendAtlas',
      logo: {
        '@type': 'ImageObject',
        url: imageUrl,
      },
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
