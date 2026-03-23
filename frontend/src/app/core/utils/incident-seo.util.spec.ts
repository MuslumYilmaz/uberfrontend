import { buildIncidentSeoMeta, incidentTechLabel, INCIDENT_DETAIL_FALLBACK_SEO } from './incident-seo.util';

describe('incident-seo.util', () => {
  const buildCanonicalUrl = (value: string) => `https://frontendatlas.com${value}`;

  it('builds unique incident detail seo metadata', () => {
    const seo = buildIncidentSeoMeta({
      meta: {
        id: 'search-typing-lag',
        title: 'Search box typing lag under product-card load',
        tech: 'react',
        difficulty: 'easy',
        summary: 'Typing gets laggy after the third character.',
        signals: ['Typing gets slower'],
        estimatedMinutes: 12,
        tags: ['react', 'performance'],
        updatedAt: '2026-03-19',
        access: 'free',
      },
      context: {
        symptom: 'Typing lags.',
        userImpact: 'Users quit.',
        environment: 'React page',
        evidence: [],
      },
      stages: [
        {
          id: 'root-cause',
          type: 'single-select',
          title: 'Stage 1',
          prompt: 'Pick root cause',
          options: [{ id: 'correct', label: 'Correct cause', points: 25, feedback: 'Correct diagnosis.' }],
        },
      ],
      debrief: {
        scoreBands: [{ min: 0, max: 100, label: 'Passed', summary: 'Solid run.' }],
        idealRunbook: ['Profile first'],
        teachingBlocks: [{ type: 'text', text: 'Debrief text.' }],
      },
      relatedPractice: [],
    }, buildCanonicalUrl);

    expect(seo.title).toBe('Search box typing lag under product-card load - React Debug Scenario');
    expect(seo.description).toContain('Practice this react debugging interview question.');
    expect(seo.canonical).toBe('/incidents/search-typing-lag');

    const graph = Array.isArray(seo.jsonLd) ? seo.jsonLd : [];
    const breadcrumb = graph.find((entry: any) => entry?.['@type'] === 'BreadcrumbList');
    const resource = graph.find((entry: any) => entry?.['@type'] === 'LearningResource');

    expect(breadcrumb).toBeTruthy();
    expect(resource?.url).toBe('https://frontendatlas.com/incidents/search-typing-lag');
    expect(resource?.headline).toBe('Search box typing lag under product-card load');
    expect(resource?.isAccessibleForFree).toBeTrue();
  });

  it('exposes stable fallback metadata and tech labels', () => {
    expect(INCIDENT_DETAIL_FALLBACK_SEO.title).toBe('Frontend Debug Scenario for Interview Practice');
    expect(incidentTechLabel('vue')).toBe('Vue');
    expect(incidentTechLabel('unknown-tech')).toBe('Frontend');
  });
});
