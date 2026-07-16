import {
  buildSystemDesignGuideRoute,
  evaluationGuideAnchorForQuestion,
  performanceGuideAnchorForQuestion,
  pitfallsGuideAnchorForQuestion,
  pickSystemDesignGuideSlug,
} from './system-design-guide-link.util';

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

  it('accepts explicit RADIO framework guide metadata', () => {
    const slug = pickSystemDesignGuideSlug({
      guideSlug: 'radio-framework',
      tags: ['performance'],
    });

    expect(slug).toBe('radio-framework');
  });

  it('accepts explicit RADIO requirements guide metadata', () => {
    const slug = pickSystemDesignGuideSlug({
      guidePath: '/guides/system-design-blueprint/radio-requirements',
    });

    expect(slug).toBe('radio-requirements');
  });

  it('maps performance-heavy questions to performance guide', () => {
    const slug = pickSystemDesignGuideSlug({
      title: 'Live chart with high-frequency updates',
      tags: ['real-time', 'charts', 'performance', 'virtualization'],
    });

    expect(slug).toBe('performance');
  });

  it('provides keyword-focused performance guide anchors for cluster prompts', () => {
    expect(performanceGuideAnchorForQuestion({ id: 'realtime-search-debounce-cache' }))
      .toBe('typeahead performance system design');
    expect(performanceGuideAnchorForQuestion({ id: 'infinite-scroll-list' }))
      .toBe('infinite scroll virtualization performance');
    expect(performanceGuideAnchorForQuestion({ id: 'dashboard-widgets-draggable-resizable' }))
      .toBe('dashboard performance system design');
    expect(performanceGuideAnchorForQuestion({ id: 'live-chart-high-frequency-updates' }))
      .toBe('live chart performance system design');
    expect(performanceGuideAnchorForQuestion({ id: 'multi-step-form-autosave' }))
      .toBe('Performance and interaction latency');
    expect(performanceGuideAnchorForQuestion({ id: 'notification-toast-system' }))
      .toBe('toast timer cleanup tradeoffs');
  });

  it('provides keyword-focused evaluation guide anchors for cluster prompts', () => {
    expect(evaluationGuideAnchorForQuestion({ id: 'realtime-search-debounce-cache' }))
      .toBe('autocomplete frontend system design rubric');
    expect(evaluationGuideAnchorForQuestion({ id: 'infinite-scroll-list' }))
      .toBe('infinite scroll system design evaluation');
    expect(evaluationGuideAnchorForQuestion({ id: 'dashboard-widgets-draggable-resizable' }))
      .toBe('dashboard frontend system design scorecard');
    expect(evaluationGuideAnchorForQuestion({ id: 'live-chart-high-frequency-updates' }))
      .toBe('live chart system design interview evaluation');
    expect(evaluationGuideAnchorForQuestion({ id: 'multi-step-form-autosave' }))
      .toBe('Evaluation rubric');
    expect(evaluationGuideAnchorForQuestion({ id: 'component-design-system-architecture' }))
      .toBe('design system architecture interview rubric');
    expect(evaluationGuideAnchorForQuestion({ id: 'notification-toast-system' }))
      .toBe('toast notification system interview rubric');
  });

  it('provides keyword-focused pitfalls guide anchors for cluster prompts', () => {
    expect(pitfallsGuideAnchorForQuestion({ id: 'realtime-search-debounce-cache' }))
      .toBe('typeahead system design mistakes');
    expect(pitfallsGuideAnchorForQuestion({ id: 'infinite-scroll-list' }))
      .toBe('infinite scroll frontend system design mistakes');
    expect(pitfallsGuideAnchorForQuestion({ id: 'dashboard-widgets-draggable-resizable' }))
      .toBe('dashboard frontend system design pitfalls');
    expect(pitfallsGuideAnchorForQuestion({ id: 'live-chart-high-frequency-updates' }))
      .toBe('live chart system design pitfalls');
    expect(pitfallsGuideAnchorForQuestion({ id: 'multi-step-form-autosave' }))
      .toBe('Common autosave failure modes');
    expect(pitfallsGuideAnchorForQuestion({ id: 'component-design-system-architecture' }))
      .toBe('design system architecture interview mistakes');
    expect(pitfallsGuideAnchorForQuestion({ id: 'notification-toast-system' }))
      .toBe('toast notification system design pitfalls');
  });

  it('maps architecture questions to architecture guide', () => {
    const slug = pickSystemDesignGuideSlug({
      title: 'Component-driven design system architecture',
      tags: ['design-system', 'components', 'frontend-architecture'],
    });

    expect(slug).toBe('architecture');
  });

  it('maps RADIO-specific questions to the RADIO framework guide', () => {
    const slug = pickSystemDesignGuideSlug({
      title: 'Use the RADIO approach for frontend system design',
      tags: ['radio'],
    });

    expect(slug).toBe('radio-framework');
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
