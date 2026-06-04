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

  it('targets frontend interview preparation guide intent on the playbook intro page', () => {
    const intro = PLAYBOOK.find((entry) => entry.slug === 'intro');
    expect(intro).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'Interview Blueprint',
      'interview-blueprint',
      intro!
    );

    expect(meta.title).toBe('Frontend Interview Preparation Guide (2026): Rounds, Roadmap, Questions');
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/interview-blueprint/intro');
    expect(meta.description).toBe(
      'Prepare for frontend interviews with a 2026 guide to rounds, coding and UI questions, system design, behavioral prep, and a 30-day roadmap.',
    );
    expect(meta.keywords).toContain('frontend interview preparation guide');
    expect(meta.keywords).toContain('frontend interview prep guide');
    expect(meta.keywords).toContain('frontend interview roadmap');
    expect(meta.keywords).toContain('frontend interview questions');
    expect(meta.keywords).toContain('30 day frontend interview roadmap');

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const breadcrumb = graph.find((node: any) => node?.['@type'] === 'BreadcrumbList');
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(breadcrumb).toBeTruthy();
    expect(article?.headline).toBe('Frontend Interview Preparation Guide (2026): Rounds, Roadmap, Questions');
    expect(article?.dateModified).toBe('2026-06-03T00:00:00.000Z');
    expect(article?.author).toEqual({
      '@type': 'Organization',
      name: 'FrontendAtlas Team',
    });
    expect(faqPage?.name).toBe('Frontend interview preparation guide FAQ');
    expect(faqPage?.mainEntity?.length).toBe(6);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'How should I prepare for a frontend interview in 2026?',
      'What rounds are common in frontend interviews?',
      'Do frontend interviews include algorithms?',
      'How long does frontend interview preparation take?',
      'What should senior frontend engineers practice?',
      'What is the best way to practice frontend interview questions?',
    ]);
  });

  it('targets frontend coding interview questions intent with FAQ and ItemList schema', () => {
    const coding = PLAYBOOK.find((entry) => entry.slug === 'coding-interviews');
    expect(coding).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'Interview Blueprint',
      'interview-blueprint',
      coding!
    );

    expect(meta.title).toBe('Frontend Coding Interview Questions and Prep Guide (2026)');
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/interview-blueprint/coding-interviews');
    expect(meta.description).toBe(
      'Prepare for frontend coding interviews with UI coding interview questions, JavaScript utilities, a 60-minute strategy, rubric, and practice links.',
    );
    expect(meta.keywords).toContain('frontend coding interview questions');
    expect(meta.keywords).toContain('frontend coding interview prep');
    expect(meta.keywords).toContain('frontend machine coding questions');
    expect(meta.keywords).toContain('frontend UI coding interview questions');
    expect(meta.keywords).toContain('React UI coding interview questions');
    expect(meta.keywords).toContain('JavaScript coding interview questions');

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const breadcrumb = graph.find((node: any) => node?.['@type'] === 'BreadcrumbList');
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const itemList = graph.find((node: any) => node?.['@type'] === 'ItemList');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(breadcrumb).toBeTruthy();
    expect(article?.headline).toBe('Frontend Coding Interview Questions and Prep Guide (2026)');
    expect(article?.dateModified).toBe('2026-06-03T00:00:00.000Z');
    expect(article?.author).toEqual({
      '@type': 'Organization',
      name: 'FrontendAtlas Team',
    });
    expect(itemList?.name).toBe('25 frontend coding interview questions to practice');
    expect(itemList?.itemListElement?.length).toBe(25);
    expect(itemList?.itemListElement?.[0]?.name).toBe('Build accessible autocomplete with debounce and keyboard selection');
    expect(itemList?.itemListElement?.[0]?.url).toBe('https://frontendatlas.com/guides/interview-blueprint/coding-interviews#question-1');
    expect(itemList?.itemListElement?.[24]?.name).toBe('Design a shopping cart or transfer list with derived totals and selection');
    expect(faqPage?.name).toBe('Frontend coding interview questions and prep guide FAQ');
    expect(faqPage?.mainEntity?.length).toBe(6);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'What questions are asked in frontend coding interviews?',
      'How do I prepare for a frontend coding interview?',
      'Is a frontend coding interview the same as LeetCode?',
      'Should I use React or vanilla JavaScript in frontend coding interviews?',
      'How are frontend UI coding interviews evaluated?',
      'What should I do in the first 10 minutes of a 60-minute coding interview?',
    ]);
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

    expect(meta.title).toBe('Frontend System Design Interview Prep: The RADIO Framework');
    expect(meta.title?.length || 0).toBeLessThanOrEqual(74);
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/system-design-blueprint/radio-framework');
    expect(meta.description).toBe(
      'Use RADIO to structure frontend system design interview prep: requirements, architecture, data model, interfaces, performance trade-offs, and closing scripts.',
    );
    expect(meta.description).toMatch(/frontend system design interview prep/i);
    expect(meta.description).toMatch(/requirements/i);
    expect(meta.description).toMatch(/data model/i);
    expect(meta.description).toMatch(/trade-offs/i);
    expect(meta.keywords).toContain('RADIO framework frontend system design');
    expect(meta.keywords).toContain('frontend system design interview answer template');
    expect(meta.keywords).toContain('RADIO answer template');
    expect(meta.keywords).toContain('RADIO framework for frontend system design interviews');
    expect(meta.keywords).toContain('frontend system design interview checklist');
    expect(meta.keywords).toContain('frontend system design 45 minute framework');
    expect(meta.keywords).toContain('how to answer frontend system design interview');
    expect(meta.keywords).toContain('requirements architecture data interface optimizations');
    expect(meta.keywords).toContain('what is the RADIO framework in frontend system design');
    expect(meta.keywords).toContain('how to use RADIO framework for frontend system design interview');
    expect(meta.keywords).toContain('frontend system design answer template 45 minutes');
    expect(meta.keywords).toContain('what should I draw during a frontend system design interview');
    expect(meta.keywords).toContain('RADIO framework autocomplete frontend system design');
    expect(meta.keywords).toContain('RADIO framework news feed frontend system design');
    expect(meta.keywords).toContain('RADIO framework chat frontend system design');
    expect(meta.keywords).toContain('frontend system design interface API taxonomy');
    expect(meta.keywords).not.toContain('frontend system design interview questions');

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(article?.dateModified).toBe('2026-06-02T00:00:00.000Z');
    expect(article?.keywords).toContain('RADIO framework frontend system design');
    expect(article?.keywords).toContain('frontend system design interview answer template');
    expect(article?.keywords).toContain('frontend system design interface API taxonomy');
    expect(faqPage?.name).toBe('RADIO framework frontend system design interview FAQ');
    expect(faqPage?.mainEntity?.length).toBe(5);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'What is the RADIO framework in frontend system design?',
      'How do I use RADIO to answer a frontend system design interview question?',
      'What should I draw during a RADIO answer?',
      'How do I use RADIO for autocomplete, news feed, or chat?',
      'Is RADIO the best framework for frontend system design interviews?',
    ]);
  });

  it('targets Requirements checklist intent on the RADIO requirements page', () => {
    const requirements = SYSTEM.find((entry) => entry.slug === 'radio-requirements');
    expect(requirements).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'System Design Blueprint',
      'system-design-blueprint',
      requirements!
    );

    expect(meta.title).toBe('Frontend System Design Requirements Checklist');
    expect(meta.title?.length || 0).toBeLessThanOrEqual(74);
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/system-design-blueprint/radio-requirements');
    expect(meta.description).toBe(
      'Ask better frontend system design interview clarifying questions, lock scope, define requirements, success metrics, and hand off to architecture.',
    );
    expect(meta.description?.length || 0).toBeLessThanOrEqual(158);
    expect(meta.keywords).toContain('frontend system design requirements checklist');
    expect(meta.keywords).toContain('frontend system design clarifying questions');
    expect(meta.keywords).toContain('RADIO requirements frontend system design');
    expect(meta.keywords).toContain('first 5 minutes frontend system design interview');
    expect(meta.keywords).toContain('functional and non-functional requirements frontend system design');
    expect(meta.keywords).toContain('requirements questions frontend system design interview');
    expect(meta.keywords).not.toContain('requirements deep dive for frontend system design interviews');
    expect(meta.keywords).toContain('what clarifying questions should I ask in frontend system design');
    expect(meta.keywords).toContain('frontend system design requirements before architecture');
    expect(meta.keywords).toContain('frontend system design scope box');
    expect(meta.keywords).toContain('frontend system design success metrics');
    expect(meta.keywords).toContain('frontend system design assumptions and risk log');
    expect(meta.keywords).toContain('frontend system design architecture handoff');
    expect(meta.keywords).toContain('requirements checklist autocomplete frontend system design');
    expect(meta.keywords).toContain('requirements questions news feed frontend system design');
    expect(meta.keywords).toContain('requirements checklist dashboard frontend system design');

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const breadcrumb = graph.find((node: any) => node?.['@type'] === 'BreadcrumbList');
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(breadcrumb).toBeTruthy();
    expect(article?.dateModified).toBe('2026-06-02T00:00:00.000Z');
    expect(article?.keywords).toContain('frontend system design requirements checklist');
    expect(article?.keywords).toContain('functional and non-functional requirements frontend system design');
    expect(article?.keywords).toContain('frontend system design architecture handoff');
    expect(article?.keywords).toContain('requirements checklist dashboard frontend system design');
    expect(article?.keywords).toContain('requirements checklist autocomplete frontend system design');
    expect(faqPage?.name).toBe('Frontend system design requirements checklist FAQ');
    expect(faqPage?.mainEntity?.length).toBe(5);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'What is a frontend system design requirements checklist?',
      'What clarifying questions should I ask first?',
      'What is the difference between functional and non-functional requirements?',
      'How long should Requirements take in a frontend system design interview?',
      'What should I produce before moving to architecture?',
    ]);
  });

  it('targets frontend architecture intent on the system design architecture page', () => {
    const architecture = SYSTEM.find((entry) => entry.slug === 'architecture');
    expect(architecture).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'System Design Blueprint',
      'system-design-blueprint',
      architecture!
    );

    expect(meta.title).toBe('Frontend System Design Architecture Guide');
    expect(meta.title?.length || 0).toBeLessThanOrEqual(74);
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/system-design-blueprint/architecture');
    expect(meta.description).toBe(
      'Design frontend system architecture with client-side boundaries, rendering strategy, data flow, caching, BFF trade-offs, and interview-ready diagrams.',
    );
    expect(meta.description?.length || 0).toBeLessThanOrEqual(158);
    expect(meta.keywords).toContain('frontend system design architecture guide');
    expect(meta.keywords).toContain('frontend architecture interview guide');
    expect(meta.keywords).toContain('frontend rendering strategy system design');
    expect(meta.keywords).toContain('frontend client side architecture interview');
    expect(meta.keywords).toContain('CSR vs SSR frontend system design');
    expect(meta.keywords).toContain('frontend architecture diagram interview');
    expect(meta.keywords).toContain('frontend system design BFF');
    expect(meta.keywords).toContain('route by route rendering strategy');
    expect(meta.keywords).toContain('frontend system design tradeoffs');
    expect(meta.keywords).toContain('what is frontend system design architecture');
    expect(meta.keywords).toContain('what should I draw in a frontend architecture interview');
    expect(meta.keywords).toContain('how to choose CSR SSR SSG edge rendering');
    expect(meta.keywords).toContain('when to use BFF in frontend system design');
    expect(meta.keywords).toContain('frontend system design client side boundaries');
    expect(meta.keywords).toContain('frontend system design data flow caching');
    expect(meta.keywords).toContain('frontend architecture interview rendering strategy');
    expect(meta.keywords).toContain('frontend system design architecture diagram');
    expect(meta.keywords).toContain('autocomplete frontend architecture interview');
    expect(meta.keywords).toContain('news feed frontend architecture system design');
    expect(meta.keywords).toContain('dashboard widgets frontend architecture');
    expect(meta.keywords).toContain('AI chat frontend architecture system design');
    expect(meta.keywords).toContain('design system architecture frontend interview');
    expect(meta.keywords).not.toContain('frontend system design interview questions');

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const breadcrumb = graph.find((node: any) => node?.['@type'] === 'BreadcrumbList');
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(breadcrumb).toBeTruthy();
    expect(article?.dateModified).toBe('2026-06-02T00:00:00.000Z');
    expect(article?.keywords).toContain('frontend system design architecture guide');
    expect(article?.keywords).toContain('frontend architecture diagram interview');
    expect(article?.keywords).toContain('frontend system design BFF');
    expect(article?.keywords).toContain('autocomplete frontend architecture interview');
    expect(article?.keywords).toContain('design system architecture frontend interview');
    expect(faqPage?.name).toBe('Frontend system design architecture FAQ');
    expect(faqPage?.mainEntity?.length).toBe(5);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'What is frontend system design architecture?',
      'How do I choose CSR, SSR, SSG, or edge rendering?',
      'What should I draw in a frontend architecture interview?',
      'When should I use a BFF in frontend system design?',
      'How is frontend architecture different from data model or interface design?',
    ]);
  });

  it('targets frontend state and data model intent on the system design data page', () => {
    const stateData = SYSTEM.find((entry) => entry.slug === 'state-data');
    expect(stateData).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'System Design Blueprint',
      'system-design-blueprint',
      stateData!
    );

    expect(meta.title).toBe('Frontend State and Data Model System Design Guide');
    expect(meta.title?.length || 0).toBeLessThanOrEqual(74);
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/system-design-blueprint/state-data');
    expect(meta.description).toBe(
      'Design frontend state and data models for interviews with server/client state, API contracts, cache keys, invalidation, optimistic updates, and UI states.',
    );
    expect(meta.description?.length || 0).toBeLessThanOrEqual(158);
    expect(meta.keywords).toContain('frontend state and data model system design');
    expect(meta.keywords).toContain('frontend system design state management');
    expect(meta.keywords).toContain('frontend data model interview');
    expect(meta.keywords).toContain('frontend API contracts interview');
    expect(meta.keywords).toContain('frontend cache invalidation interview');
    expect(meta.keywords).toContain('server state vs client state frontend');
    expect(meta.keywords).toContain('frontend optimistic updates interview');
    expect(meta.keywords).toContain('frontend URL state query params');
    expect(meta.keywords).toContain('frontend normalized cache interview');
    expect(meta.keywords).toContain('frontend system design data flow');
    expect(meta.keywords).toContain('frontend system design cache keys');
    expect(meta.keywords).toContain('what is a frontend state and data model in system design');
    expect(meta.keywords).toContain('how to separate server state client state and URL state');
    expect(meta.keywords).toContain('what should frontend API contracts include');
    expect(meta.keywords).toContain('how to explain cache invalidation in frontend interview');
    expect(meta.keywords).toContain('when should I use optimistic updates');
    expect(meta.keywords).toContain('frontend UI states idle loading error stale partial');
    expect(meta.keywords).toContain('frontend query keys TTL invalidation interview');
    expect(meta.keywords).toContain('real time search frontend data model');
    expect(meta.keywords).toContain('news feed normalized cache frontend system design');
    expect(meta.keywords).toContain('dashboard widgets state ownership frontend');
    expect(meta.keywords).toContain('AI chat streaming state frontend system design');
    expect(meta.keywords).not.toContain('frontend system design interview questions');

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const breadcrumb = graph.find((node: any) => node?.['@type'] === 'BreadcrumbList');
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(breadcrumb).toBeTruthy();
    expect(article?.dateModified).toBe('2026-06-02T00:00:00.000Z');
    expect(article?.keywords).toContain('frontend state and data model system design');
    expect(article?.keywords).toContain('frontend API contracts interview');
    expect(article?.keywords).toContain('frontend system design cache keys');
    expect(article?.keywords).toContain('real time search frontend data model');
    expect(article?.keywords).toContain('AI chat streaming state frontend system design');
    expect(faqPage?.name).toBe('Frontend state and data model system design FAQ');
    expect(faqPage?.mainEntity?.length).toBe(5);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'What is a frontend state and data model in system design?',
      'How do I separate server state, client state, and URL state?',
      'What should frontend API contracts include?',
      'How should I explain cache invalidation in a frontend interview?',
      'When should I use optimistic updates?',
    ]);
  });

  it('targets frontend interface design intent on the system design UX page', () => {
    const ux = SYSTEM.find((entry) => entry.slug === 'ux');
    expect(ux).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'System Design Blueprint',
      'system-design-blueprint',
      ux!
    );

    expect(meta.title).toBe('Frontend Interface Design System Design Guide');
    expect(meta.title?.length || 0).toBeLessThanOrEqual(74);
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/system-design-blueprint/ux');
    expect(meta.description).toBe(
      'Design frontend interface contracts for interviews with component boundaries, component APIs, UI states, keyboard focus, accessibility, and degraded UX.',
    );
    expect(meta.description?.length || 0).toBeLessThanOrEqual(158);
    expect(meta.keywords).toContain('frontend interface design system design');
    expect(meta.keywords).toContain('frontend system design interface guide');
    expect(meta.keywords).toContain('frontend component API design interview');
    expect(meta.keywords).toContain('frontend accessibility system design');
    expect(meta.keywords).toContain('frontend UI states interview');
    expect(meta.keywords).toContain('frontend interaction flow interview');
    expect(meta.keywords).toContain('keyboard navigation frontend interview');
    expect(meta.keywords).toContain('ARIA live regions frontend interview');
    expect(meta.keywords).toContain('frontend state to UI mapping');
    expect(meta.keywords).toContain('frontend degraded UX interview');
    expect(meta.keywords).toContain('frontend responsive interface design');
    expect(meta.keywords).toContain('what is frontend interface design in system design interviews');
    expect(meta.keywords).toContain('what should a frontend component API include');
    expect(meta.keywords).toContain('how to explain keyboard and focus behavior in frontend interview');
    expect(meta.keywords).toContain('how to map UI states in frontend system design');
    expect(meta.keywords).toContain('frontend component props events callbacks interview');
    expect(meta.keywords).toContain('frontend accessibility contract system design');
    expect(meta.keywords).toContain('combobox keyboard navigation frontend interview');
    expect(meta.keywords).toContain('frontend interface design autocomplete system design');
    expect(meta.keywords).toContain('notification toast ARIA live region system design');
    expect(meta.keywords).toContain('dashboard widgets keyboard drag resize frontend system design');
    expect(meta.keywords).not.toContain('frontend system design interview questions');

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const breadcrumb = graph.find((node: any) => node?.['@type'] === 'BreadcrumbList');
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(breadcrumb).toBeTruthy();
    expect(article?.dateModified).toBe('2026-06-02T00:00:00.000Z');
    expect(article?.keywords).toContain('frontend interface design system design');
    expect(article?.keywords).toContain('frontend component API design interview');
    expect(article?.keywords).toContain('keyboard navigation frontend interview');
    expect(article?.keywords).toContain('frontend degraded UX interview');
    expect(article?.keywords).toContain('frontend component props events callbacks interview');
    expect(article?.keywords).toContain('notification toast ARIA live region system design');
    expect(article?.keywords).toContain('dashboard widgets keyboard drag resize frontend system design');
    expect(faqPage?.name).toBe('Frontend interface design system design FAQ');
    expect(faqPage?.mainEntity?.length).toBe(5);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'What is frontend interface design in system design interviews?',
      'What should a frontend component API include?',
      'How do I explain keyboard and focus behavior?',
      'How should I map UI states in a frontend system design interview?',
      'How is Interface different from Data or Optimizations?',
    ]);
  });

  it('targets frontend system design performance optimization intent', () => {
    const performance = SYSTEM.find((entry) => entry.slug === 'performance');
    expect(performance).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'System Design Blueprint',
      'system-design-blueprint',
      performance!
    );

    expect(meta.title).toBe('Frontend System Design Performance Optimization Guide');
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/system-design-blueprint/performance');
    expect(meta.description).toBe(
      'Discuss frontend system design performance in interviews with Core Web Vitals, budgets, bottleneck diagnosis, trade-offs, rollout, and validation.',
    );
    expect(meta.description?.length || 0).toBeLessThanOrEqual(158);
    expect(meta.keywords).toContain('frontend system design performance optimization');
    expect(meta.keywords).toContain('frontend performance budget interview');
    expect(meta.keywords).toContain('Core Web Vitals interview');
    expect(meta.keywords).toContain('INP frontend interview');
    expect(meta.keywords).toContain('frontend performance metrics interview');
    expect(meta.keywords).toContain('frontend performance SLO interview');
    expect(meta.keywords).toContain('frontend bottleneck diagnosis interview');
    expect(meta.keywords).toContain('typeahead performance system design');
    expect(meta.keywords).toContain('infinite scroll virtualization system design');
    expect(meta.keywords).toContain('dashboard performance system design');
    expect(meta.keywords).toContain('live chart performance system design');
    expect(meta.keywords).toContain('form interaction latency frontend interview');
    expect(meta.keywords?.length || 0).toBeLessThanOrEqual(22);

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(article?.dateModified).toBe('2026-06-02T00:00:00.000Z');
    expect(article?.keywords).toContain('frontend system design performance optimization');
    expect(article?.keywords).toContain('frontend performance budget interview');
    expect(article?.keywords).toContain('Core Web Vitals interview');
    expect(article?.keywords).toContain('typeahead performance system design');
    expect(faqPage?.name).toBe('Frontend system design performance optimization FAQ');
    expect(faqPage?.mainEntity?.length).toBe(6);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'How should I discuss performance in a frontend system design interview?',
      'What is a frontend performance budget in a system design interview?',
      'Which Core Web Vitals should I mention in a frontend interview?',
      'How do I diagnose frontend performance bottlenecks in a system design interview?',
      'Is INP better than FID for frontend interview answers?',
      'What trade-offs should I call out for frontend performance optimization?',
    ]);
  });

  it('targets frontend system design interview rubric intent on the evaluation page', () => {
    const evaluation = SYSTEM.find((entry) => entry.slug === 'evaluation');
    expect(evaluation).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'System Design Blueprint',
      'system-design-blueprint',
      evaluation!
    );

    expect(meta.title).toBe('Frontend System Design Interview Rubric and Scorecard');
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/system-design-blueprint/evaluation');
    expect(meta.description).toBe(
      'Use a frontend system design interview rubric to score requirements, architecture, state, interfaces, performance, trade-offs, and communication.',
    );
    expect(meta.description?.length || 0).toBeLessThanOrEqual(158);
    expect(meta.keywords).toContain('frontend system design interview rubric');
    expect(meta.keywords).toContain('frontend system design interview scorecard');
    expect(meta.keywords).toContain('frontend system design evaluation criteria');
    expect(meta.keywords).toContain('what interviewers look for frontend system design');
    expect(meta.keywords).toContain('frontend system design interview signals');
    expect(meta.keywords).toContain('senior frontend system design interview rubric');
    expect(meta.keywords).toContain('frontend architecture interview rubric');
    expect(meta.keywords).toContain('frontend system design strong hire signals');
    expect(meta.keywords).toContain('frontend system design weak signals');
    expect(meta.keywords).toContain('frontend system design communication signals');
    expect(meta.keywords).toContain('frontend state management interview rubric');
    expect(meta.keywords).toContain('frontend performance accessibility interview rubric');
    expect(meta.keywords).toContain('autocomplete frontend system design rubric');
    expect(meta.keywords).toContain('infinite scroll system design evaluation');
    expect(meta.keywords).toContain('dashboard frontend system design scorecard');
    expect(meta.keywords).toContain('design system architecture interview rubric');

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(article?.dateModified).toBe('2026-06-02T00:00:00.000Z');
    expect(article?.keywords).toContain('frontend system design interview rubric');
    expect(article?.keywords).toContain('frontend system design interview scorecard');
    expect(faqPage?.name).toBe('Frontend system design interview rubric FAQ');
    expect(faqPage?.mainEntity?.length).toBe(5);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'How are frontend system design interviews scored?',
      'What is a strong hire signal in frontend system design?',
      'How do I use a frontend system design scorecard after a mock interview?',
      'What do senior frontend system design answers include?',
      'What are red flags in frontend system design interviews?',
    ]);
  });

  it('targets frontend system design interview pitfalls intent on the pitfalls page', () => {
    const pitfalls = SYSTEM.find((entry) => entry.slug === 'pitfalls');
    expect(pitfalls).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'System Design Blueprint',
      'system-design-blueprint',
      pitfalls!
    );

    expect(meta.title).toBe('Frontend System Design Interview Pitfalls and Red Flags');
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/system-design-blueprint/pitfalls');
    expect(meta.description).toBe(
      'Avoid frontend system design interview pitfalls with red flags, repair scripts, and fixes for architecture, state, APIs, performance, and accessibility.',
    );
    expect(meta.description?.length || 0).toBeLessThanOrEqual(158);
    expect(meta.keywords).toContain('frontend system design interview pitfalls');
    expect(meta.keywords).toContain('frontend system design mistakes');
    expect(meta.keywords).toContain('frontend system design red flags');
    expect(meta.keywords).toContain('frontend system design anti patterns');
    expect(meta.keywords).toContain('frontend system design interview mistakes');
    expect(meta.keywords).toContain('frontend system design common mistakes');
    expect(meta.keywords).toContain('frontend architecture interview mistakes');
    expect(meta.keywords).toContain('frontend performance interview mistakes');
    expect(meta.keywords).toContain('frontend accessibility system design mistakes');
    expect(meta.keywords).toContain('frontend state management interview mistakes');
    expect(meta.keywords).toContain('frontend system design interviewer hints');
    expect(meta.keywords).toContain('frontend system design loading error empty states');

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(article?.dateModified).toBe('2026-06-02T00:00:00.000Z');
    expect(article?.keywords).toContain('frontend system design interview pitfalls');
    expect(article?.keywords).toContain('frontend system design red flags');
    expect(faqPage?.name).toBe('Frontend system design interview pitfalls FAQ');
    expect(faqPage?.mainEntity?.length).toBe(5);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'What are the biggest frontend system design interview pitfalls?',
      'How do I recover if my frontend system design answer gets messy?',
      'Why are backend-only answers a red flag in frontend system design?',
      'What frontend performance mistakes should I avoid in system design interviews?',
      'How do pitfalls differ from a frontend system design checklist?',
    ]);
  });

  it('targets frontend system design interview checklist intent on the checklist page', () => {
    const checklist = SYSTEM.find((entry) => entry.slug === 'checklist');
    expect(checklist).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'System Design Blueprint',
      'system-design-blueprint',
      checklist!
    );

    expect(meta.title).toBe('Frontend System Design Interview Checklist: Final Review');
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/system-design-blueprint/checklist');
    expect(meta.description).toBe(
      'Use a frontend system design interview checklist to review requirements, rendering, state, APIs, accessibility, performance, trade-offs, and closing scripts.',
    );
    expect(meta.description?.length || 0).toBeLessThanOrEqual(158);
    expect(checklist!.seo?.keywords?.length).toBe(14);
    expect(checklist!.seo?.keywords).not.toContain('frontend system design interview checklist');
    expect(meta.keywords).toContain('frontend system design interview checklist');
    expect(meta.keywords).toContain('frontend system design checklist');
    expect(meta.keywords).toContain('frontend system design final review');
    expect(meta.keywords).toContain('frontend system design cheatsheet');
    expect(meta.keywords).toContain('frontend system design interview prep checklist');
    expect(meta.keywords).toContain('frontend architecture interview checklist');
    expect(meta.keywords).toContain('frontend system design final pass');
    expect(meta.keywords).toContain('frontend system design review checklist');
    expect(meta.keywords).toContain('frontend system design last minute checklist');
    expect(meta.keywords).toContain('frontend system design closing script');
    expect(meta.keywords).toContain('senior frontend system design checklist');
    expect(meta.keywords).toContain('frontend state and API checklist');
    expect(meta.keywords).toContain('frontend UI states checklist');
    expect(meta.keywords).toContain('frontend accessibility performance checklist');
    expect(meta.keywords).toContain('frontend system design tradeoffs checklist');

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(article?.dateModified).toBe('2026-06-02T00:00:00.000Z');
    expect(article?.keywords).toContain('frontend system design interview checklist');
    expect(article?.keywords).toContain('frontend system design final review');
    expect(faqPage?.name).toBe('Frontend system design interview checklist FAQ');
    expect(faqPage?.mainEntity?.length).toBe(6);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'What should a frontend system design interview checklist include?',
      'When should I use a frontend system design final review checklist?',
      'How is this checklist different from a rubric?',
      'What frontend-specific checks are easy to miss?',
      'How do I close a frontend system design interview answer?',
      'Is this checklist a replacement for a full frontend system design guide?',
    ]);
  });

  it('targets 5-step answer method intent on the framework quick-start page', () => {
    const framework = SYSTEM.find((entry) => entry.slug === 'framework');
    expect(framework).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'System Design Blueprint',
      'system-design-blueprint',
      framework!
    );

    expect(meta.title).toBe('Frontend System Design 5-Step Answer Method');
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/system-design-blueprint/framework');
    expect(meta.description).toBe(
      'Use a 5-step frontend system design interview flow to clarify requirements, map components, define data contracts, choose architecture, and close trade-offs.',
    );
    expect(meta.keywords).toContain('frontend system design 5 step method');
    expect(meta.keywords).toContain('frontend system design answer flow');
    expect(meta.keywords).toContain('frontend system design interview structure');
    expect(meta.keywords).toContain('how to structure frontend system design interview');
    expect(meta.keywords).toContain('frontend system design interview framework');
    expect(meta.keywords).toContain('frontend system design answer method');
    expect(meta.keywords).toContain('45 minute frontend system design interview');

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const breadcrumb = graph.find((node: any) => node?.['@type'] === 'BreadcrumbList');
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(breadcrumb).toBeTruthy();
    expect(article?.dateModified).toBe('2026-05-28T00:00:00.000Z');
    expect(article?.keywords).toContain('frontend system design 5 step method');
    expect(faqPage?.name).toBe('Frontend system design 5-step answer method FAQ');
    expect(faqPage?.mainEntity?.length).toBe(5);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'What is a frontend system design answer method?',
      'How should I structure a frontend system design interview answer?',
      'How much time should each step take?',
      'What is the difference between this 5-step method and RADIO?',
      'What should I say at the end of a frontend system design answer?',
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
    expect(article?.dateModified).toBe('2026-06-02T00:00:00.000Z');
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
