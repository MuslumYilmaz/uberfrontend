import { SeoMeta, SeoService } from '../../core/services/seo.service';
import { GuideAuthor, GuideEntry } from '../../shared/guides/guide.registry';

const DESCRIPTION_MAX_LEN = 158;
const TITLE_MAX_LEN = 74;
const INTERVIEW_INTENT_RX = /\b(interview|prep|preparation|roadmap|hiring|onsite|screen)\b/i;
const DEFAULT_GUIDE_PUBLISHED_AT = '2025-01-01T00:00:00.000Z';
const DEFAULT_GUIDE_AUTHOR: GuideAuthor = {
  type: 'Organization',
  name: 'FrontendAtlas Team',
};

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

function normalizeIsoDate(input: string | undefined): string {
  const raw = String(input || '').trim();
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
}

function normalizeKeywords(input: string[] | undefined): string[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const out = input
    .map((item) => normalizeText(item))
    .filter(Boolean);
  return out.length ? out : undefined;
}

function buildKeywordList(primaryKeyword: string | undefined, keywords: string[] | undefined): string[] | undefined {
  const seed = [];
  const normalizedPrimary = normalizeText(primaryKeyword || '');
  if (normalizedPrimary) seed.push(normalizedPrimary);
  if (Array.isArray(keywords)) seed.push(...keywords);
  return normalizeKeywords(seed);
}

function buildAuthorSchema(author: GuideAuthor | undefined): Record<string, any> {
  const type = author?.type === 'Person' ? 'Person' : DEFAULT_GUIDE_AUTHOR.type;
  const name = normalizeText(author?.name || DEFAULT_GUIDE_AUTHOR.name);
  return {
    '@type': type,
    name,
  };
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
  const title = clamp(entry.seo?.title || entry.title, TITLE_MAX_LEN) || 'Frontend guide';
  const rawDescription = entry.seo?.description || entry.summary || '';
  const description = ensureInterviewIntent(
    clamp(rawDescription, DESCRIPTION_MAX_LEN)
      || fallbackGuideDescription(sectionTitle, title),
    sectionTitle,
    title
  );
  const keywords = buildKeywordList(entry.seo?.primaryKeyword, entry.seo?.keywords);
  const imageUrl = seo.buildCanonicalUrl('/assets/images/frontend-atlas-logo.png');
  const datePublished = normalizeIsoDate(entry.seo?.publishedAt) || DEFAULT_GUIDE_PUBLISHED_AT;
  const requestedDateModified = normalizeIsoDate(entry.seo?.updatedAt) || datePublished;
  const dateModified = requestedDateModified < datePublished ? datePublished : requestedDateModified;
  const author = buildAuthorSchema(entry.seo?.author);

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
    keywords: keywords?.join(', '),
    datePublished,
    dateModified,
    mainEntityOfPage: canonical,
    inLanguage: 'en',
    isAccessibleForFree: true,
    author,
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
    keywords,
    canonical,
    ogType: 'article',
    jsonLd: [breadcrumb, article],
  };
}
