import { buildSystemDesignGuideRoute, pickSystemDesignGuideSlug } from './system-design-guide-link.util';

describe('system-design-guide-link.util', () => {
  it('prefers explicit guide slug when provided', () => {
    const slug = pickSystemDesignGuideSlug({
      title: 'Any',
      guideSlug: 'state-data',
      tags: ['performance'],
    });

    expect(slug).toBe('state-data');
  });

  it('extracts slug from full guide path metadata', () => {
    const slug = pickSystemDesignGuideSlug({
      guidePath: '/guides/system-design-blueprint/performance',
    });

    expect(slug).toBe('performance');
  });

  it('maps performance-heavy questions to performance guide', () => {
    const slug = pickSystemDesignGuideSlug({
      title: 'Live chart with high-frequency updates',
      tags: ['real-time', 'charts', 'performance', 'virtualization'],
    });

    expect(slug).toBe('performance');
  });

  it('maps architecture questions to architecture guide', () => {
    const slug = pickSystemDesignGuideSlug({
      title: 'Component-driven design system architecture',
      tags: ['design-system', 'components', 'frontend-architecture'],
    });

    expect(slug).toBe('architecture');
  });

  it('falls back to framework guide when no strong signal exists', () => {
    const slug = pickSystemDesignGuideSlug({
      title: 'General design prompt',
      tags: ['misc'],
    });

    expect(slug).toBe('framework');
  });

  it('builds absolute guide route for routerLink arrays', () => {
    const route = buildSystemDesignGuideRoute({
      tags: ['ux', 'accessibility'],
    });

    expect(route).toEqual(['/', 'guides', 'system-design-blueprint', 'ux']);
  });
});
