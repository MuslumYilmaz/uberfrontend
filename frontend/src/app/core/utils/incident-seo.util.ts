import { SeoMeta } from '../services/seo.service';
import { IncidentScenario } from '../models/incident.model';

export const INCIDENT_DETAIL_FALLBACK_SEO: SeoMeta = {
  title: 'Frontend Debug Scenario for Interview Practice',
  description:
    'Practice a frontend debugging interview question with a guided debug scenario covering the root cause, debug order, fix, and regression guard.',
};

export function incidentTechLabel(tech: string): string {
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
    default:
      return 'Frontend';
  }
}

export function buildIncidentSeoMeta(
  scenario: IncidentScenario,
  buildCanonicalUrl: (value: string) => string,
): SeoMeta {
  const meta = scenario.meta;
  const techLabel = incidentTechLabel(meta.tech);
  const canonicalPath = `/incidents/${meta.id}`;
  const canonicalUrl = buildCanonicalUrl(canonicalPath);
  const incidentsHubUrl = buildCanonicalUrl('/incidents');
  const imageUrl = buildCanonicalUrl('/assets/images/frontend-atlas-logo.png');
  const detailDescription = `Practice this ${techLabel.toLowerCase()} debugging interview question. ${meta.summary} Work through the root cause, the first debug steps, the best fix, and the regression guard.`;
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
        name: 'Debug Scenarios',
        item: incidentsHubUrl,
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
    description: detailDescription,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    inLanguage: 'en',
    learningResourceType: 'Debug scenario',
    educationalUse: 'Interview practice',
    timeRequired: `PT${meta.estimatedMinutes}M`,
    isAccessibleForFree: meta.access !== 'premium',
    keywords: meta.tags.join(', '),
    dateModified: `${meta.updatedAt}T00:00:00Z`,
    author: { '@type': 'Organization', name: 'FrontendAtlas' },
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
      '@id': incidentsHubUrl,
      url: incidentsHubUrl,
      name: 'Frontend Debugging Interview Questions and Debug Scenarios',
    },
    about: [
      { '@type': 'Thing', name: `${techLabel} debugging interview question` },
      { '@type': 'Thing', name: 'Frontend debug scenario' },
    ],
  };

  return {
    title: `${meta.title} - ${techLabel} Debug Scenario`,
    description: detailDescription,
    canonical: canonicalPath,
    keywords: [
      ...meta.tags,
      'frontend debug scenario',
      'frontend debugging interview questions',
      `${techLabel.toLowerCase()} debugging interview question`,
      `${techLabel.toLowerCase()} debug scenario`,
    ],
    ogType: 'article',
    jsonLd: [breadcrumb, learningResource],
  };
}
