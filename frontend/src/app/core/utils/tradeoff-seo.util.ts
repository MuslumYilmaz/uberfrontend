import { publicEditorialAuthorSchema } from '../content/public-editorial-facts';
import { TradeoffBattleListItem } from '../models/tradeoff-battle.model';
import { SeoMeta } from '../services/seo.service';
import {
  isContentAccessibleForFree,
  robotsForContentAccess,
} from './content-access-policy.util';
import { seoContentDateModified } from './seo-content-date.util';

/** Never allow an unresolved detail route to advertise an indexable tradeoff page. */
export const TRADEOFF_DETAIL_FALLBACK_SEO: SeoMeta = {
  title: 'Tradeoff battle unavailable',
  description: 'This tradeoff battle is currently unavailable.',
  robots: 'noindex,follow',
};

export function tradeoffTechLabel(tech: string): string {
  switch (tech) {
    case 'javascript':
      return 'JavaScript';
    case 'react':
      return 'React';
    case 'angular':
      return 'Angular';
    case 'vue':
      return 'Vue';
    case 'html':
      return 'HTML';
    case 'css':
      return 'CSS';
    case 'system-design':
      return 'System design';
    default:
      return 'Frontend';
  }
}

export function buildTradeoffSeoMeta(
  meta: TradeoffBattleListItem,
  buildCanonicalUrl: (value: string) => string,
): SeoMeta {
  const techLabel = tradeoffTechLabel(meta.tech);
  const canonicalPath = `/tradeoffs/${meta.id}`;
  const canonicalUrl = buildCanonicalUrl(canonicalPath);
  const dateModified = seoContentDateModified(canonicalUrl);
  const tradeoffHubUrl = buildCanonicalUrl('/tradeoffs');
  const imageUrl = buildCanonicalUrl('/assets/images/frontend-atlas-logo.png');
  const accessibleForFree = isContentAccessibleForFree(meta.access);
  const description =
    `Practice this ${techLabel.toLowerCase()} tradeoff interview question. ${meta.summary} Learn how to compare the options and defend a balanced answer clearly.`;
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'FrontendAtlas',
        item: buildCanonicalUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Tradeoff Battles',
        item: tradeoffHubUrl,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: meta.title,
        item: canonicalUrl,
      },
    ],
  };
  const learningResource = {
    '@type': 'LearningResource',
    '@id': canonicalUrl,
    name: meta.title,
    headline: meta.title,
    description,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    inLanguage: 'en',
    learningResourceType: 'Tradeoff battle',
    educationalUse: 'Interview practice',
    timeRequired: `PT${meta.estimatedMinutes}M`,
    isAccessibleForFree: accessibleForFree,
    keywords: meta.tags.join(', '),
    ...(dateModified ? { dateModified } : {}),
    author: publicEditorialAuthorSchema(),
    publisher: {
      '@type': 'Organization',
      name: 'FrontendAtlas',
      logo: {
        '@type': 'ImageObject',
        url: imageUrl,
      },
    },
    isPartOf: {
      '@type': 'CollectionPage',
      '@id': tradeoffHubUrl,
      url: tradeoffHubUrl,
      name: 'Frontend Tradeoff Interview Questions and Architecture Decisions',
    },
    about: [
      { '@type': 'Thing', name: `${techLabel} tradeoff interview question` },
      { '@type': 'Thing', name: 'Frontend architecture tradeoffs' },
    ],
  };

  return {
    title: `${meta.title} - ${techLabel} Tradeoff Question`,
    description,
    canonical: canonicalPath,
    robots: robotsForContentAccess(meta.access),
    keywords: [
      ...meta.tags,
      'frontend tradeoff interview questions',
      `${techLabel.toLowerCase()} tradeoff question`,
      `${techLabel.toLowerCase()} architecture interview`,
    ],
    ogType: 'article',
    jsonLd: [breadcrumb, learningResource],
  };
}
