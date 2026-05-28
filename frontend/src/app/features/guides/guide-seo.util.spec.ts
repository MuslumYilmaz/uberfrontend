import { buildGuideDetailSeo } from './guide-seo.util';
import { PLAYBOOK, SYSTEM } from '../../shared/guides/guide.registry';

describe('guide-seo.util', () => {
  const seoMock = {
    buildCanonicalUrl: (value: string) => `https://frontendatlas.com${value}`,
  } as any;

  it('builds slug-specific guide metadata with breadcrumb and article schema', () => {
    const meta = buildGuideDetailSeo(
      seoMock,
      'System Design Blueprint',
      'system-design-blueprint',
      {
        slug: 'architecture',
        title: 'Frontend Architecture',
        summary: 'Compare CSR, SSR, and islands with frontend interview trade-offs.',
      } as any
    );

    expect(meta.title).toContain('Frontend Architecture');
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/system-design-blueprint/architecture');
    expect(meta.ogType).toBe('article');

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    expect(graph.some((node: any) => node?.['@type'] === 'BreadcrumbList')).toBeTrue();
    expect(graph.some((node: any) => node?.['@type'] === 'TechArticle')).toBeTrue();
  });

  it('falls back to deterministic description when summary is missing', () => {
    const meta = buildGuideDetailSeo(
      seoMock,
      'Behavioral Blueprint',
      'behavioral',
      {
        slug: 'storytelling',
        title: 'STAR Storytelling',
      } as any
    );

    expect(meta.description).toContain('Behavioral Blueprint');
    expect(meta.description || '').toMatch(/frontend interview preparation/i);
    expect(meta.description || '').toMatch(/interview roadmap/i);
    expect(meta.description?.length || 0).toBeLessThanOrEqual(158);
  });

  it('normalizes non-interview summaries to keep interview intent explicit', () => {
    const meta = buildGuideDetailSeo(
      seoMock,
      'System Design Blueprint',
      'system-design-blueprint',
      {
        slug: 'state-data',
        title: 'State and Data',
        summary: 'Patterns for state management and caching in modern apps.',
      } as any
    );

    expect(meta.description || '').toMatch(/frontend interview preparation/i);
    expect(meta.description || '').toMatch(/interview roadmap/i);
    expect(meta.description?.length || 0).toBeLessThanOrEqual(158);
  });

  it('uses richer guide article metadata when provided', () => {
    const meta = buildGuideDetailSeo(
      seoMock,
      'Interview Blueprint',
      'interview-blueprint',
      {
        slug: 'api-design',
        title: 'Component API Design',
        summary: 'Learn how to design better component APIs.',
        seo: {
          title: 'Component API Design for Frontend Interviews',
          description: 'Learn how to design reusable component APIs with interview-ready trade-offs.',
          keywords: ['component api design', 'frontend interviews'],
          publishedAt: '2025-02-10',
          updatedAt: '2025-03-15',
          author: {
            type: 'Person',
            name: 'M. Yilmaz',
          },
        },
      } as any
    );

    expect(meta.keywords).toEqual(['component api design', 'frontend interviews']);

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    expect(article).toBeTruthy();
    expect(article.author).toEqual({
      '@type': 'Person',
      name: 'M. Yilmaz',
    });
    expect(article.datePublished).toBe('2025-02-10T00:00:00.000Z');
    expect(article.dateModified).toBe('2025-03-15T00:00:00.000Z');
  });

  it('targets frontend system design interview intent on the RADIO framework page', () => {
    const radio = SYSTEM.find((entry) => entry.slug === 'radio-framework');
    expect(radio).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'System Design Blueprint',
      'system-design-blueprint',
      radio!
    );

    expect(meta.title).toBe('Frontend System Design Interview Framework: RADIO Answer Template');
    expect(meta.title?.length || 0).toBeLessThanOrEqual(74);
    expect(meta.description).toContain('Use RADIO');
    expect(meta.description).toMatch(/frontend system design interviews/i);
    expect(meta.description).toMatch(/45 or 60 minutes/i);
    expect(meta.description).toMatch(/requirements/i);
    expect(meta.description).toMatch(/architecture/i);
    expect(meta.description).toMatch(/data/i);
    expect(meta.description).toMatch(/interface/i);
    expect(meta.description).toMatch(/optimizations/i);
    expect(meta.description).toMatch(/checklist/i);
    expect(meta.description).toMatch(/examples/i);
    expect(meta.keywords).toContain('frontend system design interview framework');
    expect(meta.keywords).toContain('frontend system design interview answer template');
    expect(meta.keywords).toContain('RADIO framework for frontend system design interviews');
    expect(meta.keywords).toContain('radio approach system design');
    expect(meta.keywords).toContain('how to answer frontend system design interview');
    expect(meta.keywords).toContain('frontend system design interview checklist');
    expect(meta.keywords).toContain('frontend system design interview example');
    expect(meta.keywords).toContain('frontend system design 45 minute framework');
    expect(meta.keywords).toContain('requirements architecture data interface optimizations');

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(article?.dateModified).toBe('2026-05-22T00:00:00.000Z');
    expect(article?.keywords).toContain('frontend system design interview answer template');
    expect(faqPage?.name).toBe('RADIO framework frontend system design interview FAQ');
    expect(faqPage?.mainEntity?.length).toBe(5);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'What is the RADIO framework for frontend system design interviews?',
      'How do I use RADIO to answer a frontend system design interview question?',
      'What should I cover in Requirements, Architecture, Data, Interface, and Optimizations?',
      'How does RADIO work in a 45-minute system design interview?',
      'Is RADIO only for frontend system design?',
    ]);
  });

  it('targets overview intent and FAQ schema on the frontend system design intro page', () => {
    const intro = SYSTEM.find((entry) => entry.slug === 'intro');
    expect(intro).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'System Design Blueprint',
      'system-design-blueprint',
      intro!
    );

    expect(meta.title).toBe('Front-End System Design Interview: What It Really Tests');
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/system-design-blueprint/intro');
    expect(meta.description).toBe(
      'Learn what frontend system design interviews test, how frontend scope differs from backend design, what interviewers score, and where to practice next.',
    );
    expect(meta.keywords).toContain('what frontend system design interviews test');
    expect(meta.keywords).toContain('frontend system design interview overview');
    expect(meta.keywords).toContain('frontend vs backend system design');
    expect(meta.keywords).toContain('frontend system design interview signals');
    expect(meta.keywords).toContain('what interviewers look for frontend system design');
    expect(meta.keywords).toContain('frontend system design for senior frontend engineers');

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const breadcrumb = graph.find((node: any) => node?.['@type'] === 'BreadcrumbList');
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(breadcrumb).toBeTruthy();
    expect(article?.dateModified).toBe('2026-05-28T00:00:00.000Z');
    expect(article?.keywords).toContain('what frontend system design interviews test');
    expect(faqPage?.name).toBe('Frontend system design interview overview FAQ');
    expect(faqPage?.mainEntity?.length).toBe(5);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'What do frontend system design interviews test?',
      'How is frontend system design different from backend system design?',
      'What do interviewers look for in frontend system design?',
      'Do frontend engineers need backend depth for system design interviews?',
      'Where should I practice after this frontend system design intro?',
    ]);
  });

  it('targets requirements, constraints, and tradeoff intent on the foundations page', () => {
    const foundations = SYSTEM.find((entry) => entry.slug === 'foundations');
    expect(foundations).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'System Design Blueprint',
      'system-design-blueprint',
      foundations!
    );

    expect(meta.title).toBe('Frontend System Design Interview Foundations: Scope and Trade-offs');
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/system-design-blueprint/foundations');
    expect(meta.description).toBe(
      'Clarify frontend system design interview requirements, constraints, scope questions, and trade-offs in the first 5-8 minutes before architecture.',
    );
    expect(meta.keywords).toContain('frontend system design requirements and tradeoffs');
    expect(meta.keywords).toContain('frontend system design constraints');
    expect(meta.keywords).toContain('frontend system design scope questions');
    expect(meta.keywords).toContain('system design clarification questions frontend');
    expect(meta.keywords).toContain('frontend system design tradeoffs');
    expect(meta.keywords).toContain('requirements clarification frontend system design');
    expect(meta.keywords).toContain('frontend system design interview foundations');
    expect(meta.keywords).toContain('frontend system design requirements checklist');

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const breadcrumb = graph.find((node: any) => node?.['@type'] === 'BreadcrumbList');
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(breadcrumb).toBeTruthy();
    expect(article?.dateModified).toBe('2026-05-28T00:00:00.000Z');
    expect(article?.keywords).toContain('frontend system design requirements and tradeoffs');
    expect(faqPage?.name).toBe('Frontend system design requirements and tradeoffs FAQ');
    expect(faqPage?.mainEntity?.length).toBe(5);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'What requirements should I clarify in a frontend system design interview?',
      'How long should requirements clarification take?',
      'What frontend constraints matter most before architecture?',
      'How do I explain trade-offs in a frontend system design interview?',
      'What mistakes should I avoid before drawing architecture?',
    ]);
  });

  it('targets React preparation long-tail queries on the React prep path', () => {
    const reactPrep = PLAYBOOK.find((entry) => entry.slug === 'react-prep-path');
    expect(reactPrep).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'Framework Prep',
      'framework-prep',
      reactPrep!
    );

    expect(meta.title).toBe('How to Prepare for a React Interview: 7/14/30-Day Plan');
    expect(meta.description).toContain('React interview preparation');
    expect(meta.description).toContain('study plan');
    expect(meta.description).toContain('hooks');
    expect(meta.description).toContain('testing');
    expect(meta.keywords).toContain('how to prepare for react interview');
    expect(meta.keywords).toContain('react coding interview preparation');
    expect(meta.keywords).toContain('senior react interview preparation');

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(article?.dateModified).toBe('2026-05-20T00:00:00.000Z');
    expect(article?.keywords).toContain('react interview preparation 7 days');
    expect(faqPage?.name).toBe('React interview preparation FAQ');
    expect(faqPage?.mainEntity?.length).toBe(5);
    expect(faqPage?.mainEntity?.[0]?.name).toBe('How do I prepare for a React interview?');
  });
});
