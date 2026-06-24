import { buildGuideDetailSeo } from './guide-seo.util';
import { BEHAVIORAL, PLAYBOOK, SYSTEM } from '../../shared/guides/guide.registry';

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
    expect(article?.dateModified).toBe('2026-06-04T00:00:00.000Z');
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

  it('targets frontend behavioral interview questions intent with FAQ and question ItemList schema', () => {
    const intro = BEHAVIORAL.find((entry) => entry.slug === 'intro');
    expect(intro).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'Behavioral Blueprint',
      'behavioral',
      intro!
    );

    expect(meta.title).toBe('Frontend Behavioral Interview Questions: 12 STAR Answers');
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/behavioral/intro');
    expect(meta.description).toBe(
      'Practice 12 frontend behavioral interview questions with STAR(R) answer outlines, weak-vs-strong examples, scoring signals, and frontend scenarios.'
    );
    expect(meta.keywords).toEqual([
      'frontend behavioral interview questions',
      'frontend behavioral interview guide',
      'behavioral interview answers for software engineers',
      'STAR stories for frontend engineers',
      'frontend interview behavioral questions',
      'frontend behavioral interview examples',
      'frontend developer behavioral interview questions and answers',
      'software engineer behavioral interview stories',
      'frontend STAR interview answers',
      'frontend performance behavioral interview answer',
      'frontend accessibility behavioral interview answer',
      'frontend production incident behavioral interview answer',
      'frontend conflict with design interview answer',
      'frontend API conflict behavioral interview answer',
      'ambiguous requirements frontend interview answer',
    ]);

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const breadcrumb = graph.find((node: any) => node?.['@type'] === 'BreadcrumbList');
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const itemList = graph.find((node: any) => node?.['@type'] === 'ItemList');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(breadcrumb).toBeTruthy();
    expect(article?.headline).toBe('Frontend Behavioral Interview Questions: 12 STAR Answers');
    expect(article?.description).toBe(
      'Practice 12 frontend behavioral interview questions with STAR(R) answer outlines, weak-vs-strong examples, scoring signals, and frontend scenarios.'
    );
    expect(article?.dateModified).toBe('2026-06-18T00:00:00.000Z');
    expect(article?.author).toEqual({
      '@type': 'Organization',
      name: 'FrontendAtlas Team',
    });
    expect(itemList?.name).toBe('Frontend behavioral interview questions to practice');
    expect(itemList?.itemListElement?.length).toBe(12);
    expect(itemList?.itemListElement?.map((entry: any) => entry?.name)).toEqual([
      'Tell me about a time you improved frontend performance.',
      'Tell me about a time you disagreed with design or product on a frontend decision.',
      'Tell me about a production incident or rollback you handled.',
      'Tell me about a conflict with a back-end team or API contract.',
      'Tell me about a project with ambiguous requirements.',
      'Tell me about an accessibility trade-off you influenced.',
      'Tell me about a time you balanced quality and a tight deadline.',
      'Tell me about mentoring or leveling up another frontend engineer.',
      'Tell me about receiving difficult technical feedback and what changed.',
      'Tell me about a technical decision you changed your mind on.',
      'Tell me about improving a review, testing, or release process.',
      'Tell me about coordinating a frontend launch across design, product, QA, and back-end.',
    ]);
    expect(itemList?.itemListElement?.[0]?.url).toBe(
      'https://frontendatlas.com/guides/behavioral/intro#frontend-behavioral-interview-questions-to-practice'
    );
    expect(faqPage?.name).toBe('Frontend behavioral interview questions FAQ');
    expect(faqPage?.mainEntity?.length).toBe(7);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'What frontend behavioral interview questions should I practice?',
      'How do frontend engineers prepare for behavioral interviews?',
      'What STAR stories should frontend engineers prepare?',
      'How long should a behavioral answer be?',
      'What do frontend behavioral interviews evaluate?',
      'How do I make a frontend behavioral answer stronger?',
      'Which frontend examples work best for behavioral interviews?',
    ]);
  });

  it('targets frontend behavioral interview process intent with FAQ and stage ItemList schema', () => {
    const bigPicture = BEHAVIORAL.find((entry) => entry.slug === 'big-picture');
    expect(bigPicture).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'Behavioral Blueprint',
      'behavioral',
      bigPicture!
    );

    expect(meta.title).toBe('Frontend Behavioral Interview Process: What Interviewers Score');
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/behavioral/big-picture');
    expect(meta.description).toBe(
      'See where behavioral rounds fit in frontend interviews, what hiring managers score onsite, and which stories reduce debrief risk.'
    );
    expect(meta.keywords).toEqual([
      'frontend behavioral interview process',
      'frontend behavioral interview round',
      'frontend behavioral onsite interview',
      'frontend hiring manager interview',
      'behavioral interview screening and onsite',
      'frontend interview hiring signals',
      'software engineer behavioral interview process',
      'frontend behavioral interview scorecard',
      'what do frontend behavioral interviewers look for',
      'behavioral interview debrief signals',
      'senior frontend engineer behavioral interview',
      'frontend interview ownership examples',
      'frontend production incident behavioral interview',
    ]);

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const breadcrumb = graph.find((node: any) => node?.['@type'] === 'BreadcrumbList');
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const itemList = graph.find((node: any) => node?.['@type'] === 'ItemList');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(breadcrumb).toBeTruthy();
    expect(article?.headline).toBe('Frontend Behavioral Interview Process: What Interviewers Score');
    expect(article?.description).toBe(
      'See where behavioral rounds fit in frontend interviews, what hiring managers score onsite, and which stories reduce debrief risk.'
    );
    expect(article?.dateModified).toBe('2026-06-18T00:00:00.000Z');
    expect(article?.author).toEqual({
      '@type': 'Organization',
      name: 'FrontendAtlas Team',
    });
    expect(itemList?.name).toBe('Frontend behavioral interview process stages');
    expect(itemList?.itemListElement?.length).toBe(5);
    expect(itemList?.itemListElement?.map((entry: any) => entry?.name)).toEqual([
      'Recruiter screen',
      'Hiring manager screen',
      'Onsite behavioral round',
      'Cross-functional round',
      'Debrief and hiring committee',
    ]);
    expect(itemList?.itemListElement?.[0]?.url).toBe(
      'https://frontendatlas.com/guides/behavioral/big-picture#frontend-behavioral-interview-stage-map'
    );
    expect(faqPage?.name).toBe('Frontend behavioral interview process FAQ');
    expect(faqPage?.mainEntity?.length).toBe(8);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'Where do behavioral interviews fit in a frontend hiring process?',
      'What do frontend behavioral interviewers look for?',
      'What happens in a frontend behavioral onsite interview?',
      'Can you fail a software engineer interview because of behavioral?',
      'How do behavioral signals affect onsite debrief decisions?',
      'What behavioral signals matter for senior frontend engineers?',
      'What frontend stories should I prepare for each round?',
      'How is this different from frontend behavioral interview questions practice?',
    ]);
  });

  it('targets frontend behavioral interview scorecard intent with FAQ and signal ItemList schema', () => {
    const scorecard = BEHAVIORAL.find((entry) => entry.slug === 'evaluation-areas');
    expect(scorecard).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'Behavioral Blueprint',
      'behavioral',
      scorecard!
    );

    expect(meta.title).toBe('Frontend Behavioral Interview Scorecard: 6 Signals');
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/behavioral/evaluation-areas');
    expect(meta.description).toBe(
      'See the 6 signals frontend interviewers score, weak-vs-strong evidence, seniority expectations, and stories that reduce debrief risk.'
    );
    expect(meta.keywords).toEqual([
      'frontend behavioral interview scorecard',
      'behavioral interview scorecard',
      'behavioral interview scorecard for software engineers',
      'behavioral evaluation areas',
      'behavioral interview competencies',
      'what do behavioral interviewers evaluate',
      'behavioral interview scoring rubric',
      'frontend behavioral interview rubric',
      'behavioral interview evaluation criteria',
      'software engineer behavioral interview rubric',
      'ownership behavioral interview signal',
      'senior frontend behavioral interview signals',
      'weak vs strong behavioral interview signals',
      'frontend performance behavioral interview story',
      'accessibility behavioral interview example',
      'production incident behavioral interview example',
      'API contract conflict behavioral interview',
      'design disagreement behavioral interview frontend',
    ]);

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const breadcrumb = graph.find((node: any) => node?.['@type'] === 'BreadcrumbList');
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const itemList = graph.find((node: any) => node?.['@type'] === 'ItemList');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(breadcrumb).toBeTruthy();
    expect(article?.headline).toBe('Frontend Behavioral Interview Scorecard: 6 Signals');
    expect(article?.description).toBe(
      'See the 6 signals frontend interviewers score, weak-vs-strong evidence, seniority expectations, and stories that reduce debrief risk.'
    );
    expect(article?.dateModified).toBe('2026-06-18T00:00:00.000Z');
    expect(article?.author).toEqual({
      '@type': 'Organization',
      name: 'FrontendAtlas Team',
    });
    expect(itemList?.name).toBe('Frontend behavioral interview scorecard signals');
    expect(itemList?.itemListElement?.length).toBe(6);
    expect(itemList?.itemListElement?.map((entry: any) => entry?.name)).toEqual([
      'Communication',
      'Collaboration',
      'Ownership',
      'Judgment',
      'Growth',
      'Leadership and seniority',
    ]);
    expect(itemList?.itemListElement?.[0]?.url).toBe(
      'https://frontendatlas.com/guides/behavioral/evaluation-areas#frontend-behavioral-interview-scorecard-signals'
    );
    expect(faqPage?.name).toBe('Frontend behavioral interview scorecard FAQ');
    expect(faqPage?.mainEntity?.length).toBe(6);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'What do behavioral interviewers evaluate?',
      'How are behavioral interviews scored?',
      'What is a strong ownership signal in a behavioral interview?',
      'How do senior frontend engineers show behavioral signals?',
      'Which frontend stories map well to behavioral interview scorecards?',
      'How do I use a frontend behavioral interview scorecard to prepare?',
    ]);
  });

  it('targets frontend behavioral interview prep plan intent with FAQ and 7-day ItemList schema', () => {
    const prep = BEHAVIORAL.find((entry) => entry.slug === 'prep');
    expect(prep).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'Behavioral Blueprint',
      'behavioral',
      prep!
    );

    expect(meta.title).toBe('Frontend Behavioral Interview Prep Plan: 7 Days');
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/behavioral/prep');
    expect(meta.description).toBe(
      'Build a frontend behavioral interview prep plan with STAR(R) stories, a 7-day routine, weak-vs-strong notes, seniority signals, and final questions.'
    );
    expect(meta.keywords).toEqual([
      'frontend behavioral interview prep plan',
      'frontend behavioral interview preparation',
      'STAR stories for frontend engineers',
      'frontend behavioral story bank',
      'software engineer behavioral interview prep',
      'software engineer behavioral interview prep plan',
      'behavioral interview practice plan',
      'frontend performance behavioral interview story',
      'accessibility behavioral interview example',
      'API contract conflict behavioral interview',
      'production incident behavioral interview example',
      'design disagreement behavioral interview frontend',
      'frontend behavioral interview final questions',
      'frontend behavioral interview mock practice',
      'senior frontend behavioral interview preparation',
    ]);

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const breadcrumb = graph.find((node: any) => node?.['@type'] === 'BreadcrumbList');
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const itemList = graph.find((node: any) => node?.['@type'] === 'ItemList');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(breadcrumb).toBeTruthy();
    expect(article?.headline).toBe('Frontend Behavioral Interview Prep Plan: 7 Days');
    expect(article?.description).toBe(
      'Build a frontend behavioral interview prep plan with STAR(R) stories, a 7-day routine, weak-vs-strong notes, seniority signals, and final questions.'
    );
    expect(article?.dateModified).toBe('2026-06-19T00:00:00.000Z');
    expect(article?.author).toEqual({
      '@type': 'Organization',
      name: 'FrontendAtlas Team',
    });
    expect(itemList?.name).toBe('7-day frontend behavioral interview prep plan');
    expect(itemList?.itemListElement?.length).toBe(7);
    expect(itemList?.itemListElement?.map((entry: any) => entry?.name)).toEqual([
      'Day 1: Collect frontend stories',
      'Day 2: Map stories to signals',
      'Day 3: Write STAR(R) notes',
      'Day 4: Quantify impact and trade-offs',
      'Day 5: Practice follow-up questions',
      'Day 6: Prepare final questions',
      'Day 7: Run a night-before tune-up',
    ]);
    expect(itemList?.itemListElement?.[0]?.url).toBe(
      'https://frontendatlas.com/guides/behavioral/prep#7-day-frontend-behavioral-interview-prep-plan'
    );
    expect(faqPage?.name).toBe('Frontend behavioral interview prep plan FAQ');
    expect(faqPage?.mainEntity?.length).toBe(7);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'How should frontend engineers prepare for behavioral interviews?',
      'How many behavioral stories should I prepare?',
      'What frontend stories work best for behavioral interviews?',
      'What does STAR(R) mean in behavioral interview prep?',
      'How do I avoid sounding rehearsed in a behavioral interview?',
      'How should senior frontend engineers prepare differently?',
      'What should I review the night before a behavioral interview?',
    ]);
  });

  it('targets frontend interview fundamentals quiz intent with FAQ and diagnostic ItemList schema', () => {
    const quiz = PLAYBOOK.find((entry) => entry.slug === 'quiz');
    expect(quiz).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'Interview Blueprint',
      'interview-blueprint',
      quiz!
    );

    expect(meta.title).toBe('Frontend Interview Fundamentals Quiz: 15-Minute Diagnostic');
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/interview-blueprint/quiz');
    expect(meta.description).toBe(
      'Take a 15-minute frontend interview fundamentals quiz covering browser rendering, CSS layout, JavaScript async, HTTP caching, score bands, and practice links.',
    );
    expect(meta.keywords).toEqual([
      'frontend interview fundamentals quiz',
      'frontend interview quiz',
      'frontend fundamentals check',
      'frontend technical interview fundamentals',
      'browser css javascript http quiz',
      'frontend interview practice quiz',
      '15 minute frontend interview quiz',
      'frontend fundamentals diagnostic',
      'frontend interview readiness quiz',
      'frontend technical interview self assessment',
      'frontend interview score bands',
      'browser rendering interview questions',
      'browser rendering pipeline interview questions',
      'css layout interview questions quiz',
      'javascript async interview quiz',
      'http caching frontend interview questions',
    ]);

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const breadcrumb = graph.find((node: any) => node?.['@type'] === 'BreadcrumbList');
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const itemList = graph.find((node: any) => node?.['@type'] === 'ItemList');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(breadcrumb).toBeTruthy();
    expect(article?.headline).toBe('Frontend Interview Fundamentals Quiz: 15-Minute Diagnostic');
    expect(article?.description).toBe(
      'Take a 15-minute frontend interview fundamentals quiz covering browser rendering, CSS layout, JavaScript async, HTTP caching, score bands, and practice links.',
    );
    expect(article?.dateModified).toBe('2026-06-12T00:00:00.000Z');
    expect(article?.author).toEqual({
      '@type': 'Organization',
      name: 'FrontendAtlas Team',
    });
    expect(itemList?.name).toBe('Frontend interview fundamentals diagnostic practice map');
    expect(itemList?.itemListElement?.length).toBe(12);
    expect(itemList?.itemListElement?.[0]?.name).toBe('Event loop output');
    expect(itemList?.itemListElement?.[0]?.url).toBe('https://frontendatlas.com/javascript/trivia/js-event-loop');
    expect(itemList?.itemListElement?.[5]?.url).toBe('https://frontendatlas.com/javascript/trivia/http-caching-basics');
    expect(itemList?.itemListElement?.[6]?.url).toBe('https://frontendatlas.com/css/trivia/css-box-model');
    expect(itemList?.itemListElement?.[10]?.url).toBe('https://frontendatlas.com/html/trivia/html-parsing-rendering');
    expect(itemList?.itemListElement?.[11]?.url).toBe('https://frontendatlas.com/coding');
    expect(faqPage?.name).toBe('Frontend interview fundamentals quiz FAQ');
    expect(faqPage?.mainEntity?.length).toBe(6);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'What is a frontend interview fundamentals quiz?',
      'How do I use this as a 15-minute frontend fundamentals diagnostic?',
      'Which browser rendering interview questions should I know?',
      'Which CSS layout interview questions matter most?',
      'What JavaScript async topics appear in frontend interview quizzes?',
      'What HTTP caching topics should frontend engineers know?',
    ]);
  });

  it('targets frontend resume for interviews intent with FAQ and bullet rewrite ItemList schema', () => {
    const resume = PLAYBOOK.find((entry) => entry.slug === 'resume');
    expect(resume).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'Interview Blueprint',
      'interview-blueprint',
      resume!
    );

    expect(meta.title).toBe('Frontend Developer Resume: ATS Keywords & Bullet Examples (2026)');
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/interview-blueprint/resume');
    expect(meta.description).toBe(
      'Build a frontend developer resume that gets interviews with ATS keywords, bullet examples, a 30-second skim test, role examples, and rejection triggers.',
    );
    expect(meta.keywords).toEqual([
      'frontend resume for interviews',
      'frontend developer resume',
      'front end developer resume examples',
      'front-end developer resume',
      'frontend resume examples',
      'frontend engineer resume',
      'frontend resume that gets interviews',
      'frontend interview resume',
      'frontend developer resume ATS keywords',
      'front end developer resume keywords',
      'frontend resume skills',
      'frontend resume bullet points',
      'front end developer resume bullet examples',
      'senior frontend developer resume',
      'junior frontend developer resume',
      'react developer resume',
    ]);

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const breadcrumb = graph.find((node: any) => node?.['@type'] === 'BreadcrumbList');
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const itemList = graph.find((node: any) => node?.['@type'] === 'ItemList');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(breadcrumb).toBeTruthy();
    expect(article?.headline).toBe('Frontend Developer Resume: ATS Keywords & Bullet Examples (2026)');
    expect(article?.description).toBe(
      'Build a frontend developer resume that gets interviews with ATS keywords, bullet examples, a 30-second skim test, role examples, and rejection triggers.',
    );
    expect(article?.dateModified).toBe('2026-06-12T00:00:00.000Z');
    expect(article?.author).toEqual({
      '@type': 'Organization',
      name: 'FrontendAtlas Team',
    });
    expect(itemList?.name).toBe('Frontend resume bullet rewrite topics');
    expect(itemList?.itemListElement?.length).toBe(12);
    expect(itemList?.itemListElement?.[0]?.name).toBe('Performance bullet rewrite');
    expect(itemList?.itemListElement?.[0]?.url).toBe('https://frontendatlas.com/guides/interview-blueprint/resume#rewrite-performance');
    expect(itemList?.itemListElement?.[2]?.name).toBe('Design system bullet rewrite');
    expect(itemList?.itemListElement?.[5]?.name).toBe('API integration bullet rewrite');
    expect(itemList?.itemListElement?.[8]?.name).toBe('Search autocomplete bullet rewrite');
    expect(itemList?.itemListElement?.[11]?.url).toBe('https://frontendatlas.com/guides/interview-blueprint/resume#rewrite-team-enablement');
    expect(faqPage?.name).toBe('Frontend resume for interviews FAQ');
    expect(faqPage?.mainEntity?.length).toBe(6);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'How do I write a frontend developer resume that gets interviews?',
      'What front end developer resume examples should I study?',
      'Which frontend developer resume ATS keywords should I include?',
      'What makes frontend resume bullet points stronger?',
      'How should a junior frontend developer resume differ from a senior frontend developer resume?',
      'Should I write a React developer resume or a general frontend engineer resume?',
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
      'Prepare for frontend coding interviews with UI coding questions, JS utilities, most-asked machine coding prompts, live practice links, rubric, and strategy.',
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
    expect(article?.dateModified).toBe('2026-06-06T00:00:00.000Z');
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

  it('targets frontend system design framework intent with FAQ and practice ItemList schema', () => {
    const systemDesign = PLAYBOOK.find((entry) => entry.slug === 'system-design');
    expect(systemDesign).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'Interview Blueprint',
      'interview-blueprint',
      systemDesign!
    );

    expect(meta.title).toBe('Frontend System Design Interview Framework | 45-Minute Template');
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/interview-blueprint/system-design');
    expect(meta.description).toBe(
      'Answer frontend system design interviews with a 45-minute framework, autocomplete worked example, API/state contracts, rubric, and practice prompts.',
    );
    expect(meta.keywords?.[0]).toBe('frontend system design interview framework');
    expect(meta.keywords).toEqual([
      'frontend system design interview framework',
      'frontend system design interviews',
      'frontend system design interview questions',
      'frontend system design answer template',
      '45 minute frontend system design interview',
      'frontend architecture interview',
      'autocomplete frontend system design',
      'design autocomplete frontend system design',
      'frontend system design interview rubric',
      'frontend vs backend system design interview',
      'client side system design interview',
      'senior frontend system design interview',
    ]);

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const breadcrumb = graph.find((node: any) => node?.['@type'] === 'BreadcrumbList');
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const itemList = graph.find((node: any) => node?.['@type'] === 'ItemList');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(breadcrumb).toBeTruthy();
    expect(article?.headline).toBe('Frontend System Design Interview Framework | 45-Minute Template');
    expect(article?.dateModified).toBe('2026-06-10T00:00:00.000Z');
    expect(article?.author).toEqual({
      '@type': 'Organization',
      name: 'FrontendAtlas Team',
    });
    expect(itemList?.name).toBe('Frontend system design practice map');
    expect(itemList?.itemListElement?.length).toBe(10);
    expect(itemList?.itemListElement?.[0]?.name).toBe('Realtime search autocomplete');
    expect(itemList?.itemListElement?.[0]?.url).toBe('https://frontendatlas.com/system-design/realtime-search-debounce-cache');
    expect(itemList?.itemListElement?.[9]?.name).toBe('45-minute answer script');
    expect(itemList?.itemListElement?.[9]?.url).toBe('https://frontendatlas.com/guides/system-design-blueprint/radio-framework');
    expect(faqPage?.name).toBe('Frontend system design interview framework FAQ');
    expect(faqPage?.mainEntity?.length).toBe(6);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'What is a frontend system design interview framework?',
      'How do I answer a frontend system design interview in 45 minutes?',
      'What is the difference between frontend system design and backend system design?',
      'How do I design autocomplete in a frontend system design interview?',
      'What frontend system design trade-offs should senior engineers mention?',
      'What should I practice for a frontend architecture interview?',
    ]);
  });

  it('targets JavaScript coding interview questions intent with practice-map FAQ and ItemList schema', () => {
    const jsGuide = PLAYBOOK.find((entry) => entry.slug === 'javascript-interviews');
    expect(jsGuide).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'Interview Blueprint',
      'interview-blueprint',
      jsGuide!
    );

    expect(meta.title).toBe('JavaScript Coding Interview Questions: Frontend Practice');
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/interview-blueprint/javascript-interviews');
    expect(meta.description).toBe(
      'Practice frontend JavaScript coding interview questions with debounce, throttle, Promise.all, event loop, closures, DOM delegation, EventEmitter, and drills.',
    );
    expect(meta.title?.length || 0).toBeLessThanOrEqual(74);
    expect(meta.description?.length || 0).toBeLessThanOrEqual(158);
    expect(meta.keywords?.[0]).toBe('javascript coding interview questions');
    expect(meta.keywords).toContain('javascript coding interview questions');
    expect(meta.keywords).toContain('frontend javascript interview questions');
    expect(meta.keywords).toContain('javascript interview practice');
    expect(meta.keywords).toContain('javascript interview patterns');
    expect(meta.keywords).toContain('javascript utility function interview questions');
    expect(meta.keywords).toContain('most asked javascript coding interview questions');
    expect(meta.keywords).toContain('javascript event loop interview questions');
    expect(meta.keywords).toContain('implement promise all javascript interview question');
    expect(meta.keywords).toContain('javascript debounce interview question');
    expect(meta.keywords).toContain('event delegation javascript interview question');

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const breadcrumb = graph.find((node: any) => node?.['@type'] === 'BreadcrumbList');
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const itemList = graph.find((node: any) => node?.['@type'] === 'ItemList');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(breadcrumb).toBeTruthy();
    expect(article?.headline).toBe('JavaScript Coding Interview Questions: Frontend Practice');
    expect(article?.dateModified).toBe('2026-06-05T00:00:00.000Z');
    expect(article?.author).toEqual({
      '@type': 'Organization',
      name: 'FrontendAtlas Team',
    });
    expect(itemList?.name).toBe('25 JavaScript coding interview questions to practice');
    expect(itemList?.itemListElement?.length).toBe(25);
    expect(itemList?.itemListElement?.[0]?.name).toBe('Implement debounce with trailing, leading, and cancel behavior');
    expect(itemList?.itemListElement?.[0]?.url).toBe('https://frontendatlas.com/javascript/coding/js-debounce');
    expect(itemList?.itemListElement?.[24]?.name).toBe('Build an LRU cache with bounded memory');
    expect(faqPage?.name).toBe('JavaScript coding interview questions practice map FAQ');
    expect(faqPage?.mainEntity?.length).toBe(5);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'What are the most asked JavaScript coding interview questions?',
      'How should I practice JavaScript utility function interview questions?',
      'Which JavaScript promise interview questions should I practice?',
      'How do I prepare for JavaScript event loop output questions?',
      'Is this different from JavaScript interview questions and answers?',
    ]);
  });

  it('targets DSA for frontend interviews intent with practice-map FAQ and ItemList schema', () => {
    const dsaGuide = PLAYBOOK.find((entry) => entry.slug === 'dsa-for-fe');
    expect(dsaGuide).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'Interview Blueprint',
      'interview-blueprint',
      dsaGuide!
    );

    expect(meta.title).toBe('DSA for Frontend Interviews: Questions & JS Drills');
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/interview-blueprint/dsa-for-fe');
    expect(meta.description).toBe(
      'Practice DSA for frontend interviews with algorithm interview questions, arrays, hash maps, stacks, queues, LRU cache, Big-O, and JavaScript drills.',
    );
    expect(meta.title?.length || 0).toBeLessThanOrEqual(74);
    expect(meta.description?.length || 0).toBeLessThanOrEqual(158);
    expect(meta.keywords?.[0]).toBe('dsa for frontend interviews');
    expect(meta.keywords).toContain('frontend dsa interview prep');
    expect(meta.keywords).toContain('frontend algorithm interview questions');
    expect(meta.keywords).toContain('javascript data structures interview');
    expect(meta.keywords).toContain('frontend data structures and algorithms');
    expect(meta.keywords).toContain('frontend coding interview dsa');
    expect(meta.keywords).toContain('do frontend interviews ask algorithms');
    expect(meta.keywords).toContain('javascript dsa practice');
    expect(meta.keywords).toContain('frontend dsa study plan');
    expect(meta.keywords).toContain('groupby javascript interview question');
    expect(meta.keywords).toContain('array shift o(n) interview');

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const breadcrumb = graph.find((node: any) => node?.['@type'] === 'BreadcrumbList');
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const itemList = graph.find((node: any) => node?.['@type'] === 'ItemList');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(breadcrumb).toBeTruthy();
    expect(article?.headline).toBe('DSA for Frontend Interviews: Questions & JS Drills');
    expect(article?.dateModified).toBe('2026-06-06T00:00:00.000Z');
    expect(article?.author).toEqual({
      '@type': 'Organization',
      name: 'FrontendAtlas Team',
    });
    expect(itemList?.name).toBe('20 frontend DSA questions to practice');
    expect(itemList?.itemListElement?.length).toBe(20);
    expect(itemList?.itemListElement?.[0]?.name).toBe('Implement Array.prototype.reduce');
    expect(itemList?.itemListElement?.[0]?.url).toBe('https://frontendatlas.com/javascript/coding/js-array-prototype-reduce');
    expect(itemList?.itemListElement?.[3]?.url).toBe('https://frontendatlas.com/javascript/coding/js-group-by');
    expect(itemList?.itemListElement?.[9]?.url).toBe('https://frontendatlas.com/guides/interview-blueprint/dsa-for-fe#question-10');
    expect(itemList?.itemListElement?.[19]?.name).toBe('Explain the Big-O trade-off for a large filtered list');
    expect(faqPage?.name).toBe('DSA for frontend interviews FAQ');
    expect(faqPage?.mainEntity?.length).toBe(5);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'Is DSA required for frontend interviews?',
      'Do frontend interviews ask algorithm questions?',
      'What DSA should frontend engineers prioritize?',
      'How should I practice JavaScript DSA for frontend interviews?',
      'How much LeetCode should I do for frontend interviews?',
    ]);
  });

  it('targets frontend UI interview questions intent with component-practice FAQ and ItemList schema', () => {
    const uiGuide = PLAYBOOK.find((entry) => entry.slug === 'ui-interviews');
    expect(uiGuide).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'Interview Blueprint',
      'interview-blueprint',
      uiGuide!
    );

    expect(meta.title).toBe('Frontend UI Interview Questions: Component Coding Practice');
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/interview-blueprint/ui-interviews');
    expect(meta.description).toBe(
      'Practice frontend UI interview questions with modal, autocomplete, tabs, data tables, model answers, senior rubrics, accessibility, and keyboard support.',
    );
    expect(meta.title?.length || 0).toBeLessThanOrEqual(74);
    expect(meta.description?.length || 0).toBeLessThanOrEqual(158);
    expect(meta.keywords?.[0]).toBe('frontend ui interview questions');
    expect(meta.keywords?.length || 0).toBeLessThanOrEqual(15);
    expect(meta.keywords).toContain('frontend ui interview questions');
    expect(meta.keywords).toContain('frontend ui coding interview');
    expect(meta.keywords).toContain('frontend component interview questions');
    expect(meta.keywords).toContain('accessible component interview');
    expect(meta.keywords).toContain('react ui coding interview');
    expect(meta.keywords).toContain('keyboard accessibility interview questions frontend');
    expect(meta.keywords).toContain('focus trap modal interview question');
    expect(meta.keywords).toContain('aria tabs interview question');
    expect(meta.keywords).toContain('ui interview scoring rubric');

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const breadcrumb = graph.find((node: any) => node?.['@type'] === 'BreadcrumbList');
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const itemList = graph.find((node: any) => node?.['@type'] === 'ItemList');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(breadcrumb).toBeTruthy();
    expect(article?.headline).toBe('Frontend UI Interview Questions: Component Coding Practice');
    expect(article?.dateModified).toBe('2026-06-21T00:00:00.000Z');
    expect(article?.author).toEqual({
      '@type': 'Organization',
      name: 'FrontendAtlas Team',
    });
    expect(itemList?.name).toBe('12 frontend UI interview questions and component prompts to practice');
    expect(itemList?.itemListElement?.length).toBe(12);
    expect(itemList?.itemListElement?.[0]?.name).toBe('Modal / Confirm Dialog');
    expect(itemList?.itemListElement?.[0]?.url).toBe('https://frontendatlas.com/html/coding/html-dialog-confirm-a11y');
    expect(itemList?.itemListElement?.[1]?.url).toBe('https://frontendatlas.com/react/coding/react-autocomplete-search-starter');
    expect(itemList?.itemListElement?.[5]?.url).toBe('https://frontendatlas.com/react/coding/react-pagination-table');
    expect(itemList?.itemListElement?.[11]?.name).toBe('Progress Bar');
    expect(faqPage?.name).toBe('Frontend UI interview questions FAQ');
    expect(faqPage?.mainEntity?.length).toBe(6);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'What are the most common frontend UI interview questions?',
      'How do I practice frontend UI coding interview questions?',
      'Which React UI component questions should I practice?',
      'How do interviewers score accessibility and keyboard support?',
      'Is this different from frontend machine coding interviews?',
      'What should a senior answer include in a UI interview?',
    ]);
  });

  it('targets component API design interview intent with FAQ and ItemList schema', () => {
    const apiGuide = PLAYBOOK.find((entry) => entry.slug === 'api-design');
    expect(apiGuide).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'Interview Blueprint',
      'interview-blueprint',
      apiGuide!
    );

    expect(meta.title).toBe('Component API Design for Frontend Interviews');
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/interview-blueprint/api-design');
    expect(meta.description).toBe(
      'Practice component API design for frontend interviews with React props, events, slots, controlled state, compound components, accessibility, and UI drills.',
    );
    expect(meta.title?.length || 0).toBeLessThanOrEqual(74);
    expect(meta.description?.length || 0).toBeLessThanOrEqual(158);
    expect(meta.keywords).toEqual([
      'component api design',
      'frontend component api design',
      'react component api design',
      'reusable component api design',
      'component api design for frontend interviews',
      'component api design interview',
      'frontend component api interview practice',
      'controlled vs uncontrolled component api',
      'state ownership component api',
      'compound components interview',
      'props vs slots component api',
      'component event payload design',
      'accessibility as component api',
      'react component props typescript',
      'typescript component api design',
      'radix aschild component api',
      'modal component api design',
      'tabs component api design',
      'autocomplete component api design',
      'data table component api design',
    ]);

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const breadcrumb = graph.find((node: any) => node?.['@type'] === 'BreadcrumbList');
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const itemList = graph.find((node: any) => node?.['@type'] === 'ItemList');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(breadcrumb).toBeTruthy();
    expect(article?.headline).toBe('Component API Design for Frontend Interviews');
    expect(article?.dateModified).toBe('2026-06-23T00:00:00.000Z');
    expect(article?.author).toEqual({
      '@type': 'Organization',
      name: 'FrontendAtlas Team',
    });
    expect(itemList?.name).toBe('10 component API design interview prompts to practice');
    expect(itemList?.itemListElement?.length).toBe(10);
    expect(itemList?.itemListElement?.[0]?.name).toBe('Modal / Confirm Dialog API');
    expect(itemList?.itemListElement?.[0]?.url).toBe('https://frontendatlas.com/html/coding/html-dialog-confirm-a11y');
    expect(itemList?.itemListElement?.[1]?.url).toBe('https://frontendatlas.com/react/coding/react-tabs-switcher');
    expect(itemList?.itemListElement?.[3]?.url).toBe('https://frontendatlas.com/react/coding/react-autocomplete-search-starter');
    expect(itemList?.itemListElement?.[5]?.url).toBe('https://frontendatlas.com/react/coding/react-pagination-table');
    expect(itemList?.itemListElement?.[9]?.name).toBe('Progress Bar API');
    expect(faqPage?.name).toBe('Component API design for frontend interviews FAQ');
    expect(faqPage?.mainEntity?.length).toBe(9);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'What is component API design?',
      'How do I practice component API design for frontend interviews?',
      'What is the controlled vs uncontrolled component API pattern?',
      'When should I use compound components or slots?',
      'How should component APIs expose events and accessibility?',
      'How should TypeScript shape a component API?',
      'Which real library patterns help in component API interviews?',
      'How is this component API design guide reviewed?',
      'How do I choose between prop-heavy, composed, and controlled component APIs?',
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

    expect(meta.title).toBe('Frontend System Design Interview Answer Template: 45-Minute RADIO');
    expect(meta.title?.length || 0).toBeLessThanOrEqual(74);
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/system-design-blueprint/radio-framework');
    expect(meta.description).toBe(
      'Copy a 45-minute frontend system design RADIO answer script: requirements, architecture, data, interface, optimizations, timeline, examples.',
    );
    expect(meta.description).toMatch(/answer script/i);
    expect(meta.description).toMatch(/frontend system design RADIO/i);
    expect(meta.description).toMatch(/requirements/i);
    expect(meta.description).toMatch(/interface/i);
    expect(meta.description).toMatch(/45-minute/i);
    expect(meta.keywords?.[0]).toBe('frontend system design interview answer template');
    expect(meta.keywords).toContain('RADIO framework frontend system design');
    expect(meta.keywords).toContain('frontend system design interview answer template');
    expect(meta.keywords).toContain('45 minute frontend system design interview framework');
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
    const itemList = graph.find((node: any) => node?.['@type'] === 'ItemList');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(article?.headline).toBe('Frontend System Design Interview Answer Template: 45-Minute RADIO');
    expect(article?.description).toBe(
      'Copy a 45-minute frontend system design RADIO answer script: requirements, architecture, data, interface, optimizations, timeline, examples.'
    );
    expect(article?.dateModified).toBe('2026-06-19T00:00:00.000Z');
    expect(article?.keywords).toContain('frontend system design interview answer template');
    expect(article?.keywords).toContain('RADIO framework frontend system design');
    expect(article?.keywords).toContain('frontend system design interface API taxonomy');
    expect(itemList?.name).toBe('Frontend system design answer template sections');
    expect(itemList?.itemListElement?.length).toBe(5);
    expect(itemList?.itemListElement?.map((entry: any) => entry?.name)).toEqual([
      'Opening script',
      '45-minute timeline',
      'Requirements checklist',
      'Interface and API checklist',
      'Autocomplete, news feed, and chat examples',
    ]);
    expect(itemList?.itemListElement?.[0]?.description).toContain('Copy the first minute');
    expect(itemList?.itemListElement?.[0]?.url).toBe(
      'https://frontendatlas.com/guides/system-design-blueprint/radio-framework#frontend-system-design-interview-answer-template'
    );
    expect(itemList?.itemListElement?.map((entry: any) => entry?.url)).toEqual([
      'https://frontendatlas.com/guides/system-design-blueprint/radio-framework#frontend-system-design-interview-answer-template',
      'https://frontendatlas.com/guides/system-design-blueprint/radio-framework#45-minute-interview-timeline',
      'https://frontendatlas.com/guides/system-design-blueprint/radio-framework#radio-requirements',
      'https://frontendatlas.com/guides/system-design-blueprint/radio-framework#radio-interface',
      'https://frontendatlas.com/guides/system-design-blueprint/radio-framework#run-radio-on-autocomplete-news-feed-and-chat',
    ]);
    expect(faqPage?.name).toBe('Frontend system design answer template FAQ');
    expect(faqPage?.mainEntity?.length).toBe(5);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'How do I use RADIO to answer a frontend system design interview question?',
      'What should I draw during a RADIO answer?',
      'How do I use RADIO for autocomplete, news feed, or chat?',
      'What is the RADIO framework in frontend system design?',
      'Is RADIO the best framework for frontend system design interviews?',
    ]);
    expect(faqPage?.mainEntity?.[3]?.acceptedAnswer?.text).toBe(
      'RADIO stands for Requirements, Architecture, Data, Interface, and Optimizations. It is a frontend system design interview framework for turning broad UI architecture prompts into a structured 45-minute answer with diagrams, contracts, and trade-offs.',
    );
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

  it('targets JavaScript interview preparation intent with study-plan FAQ and ItemList schema', () => {
    const jsPrep = PLAYBOOK.find((entry) => entry.slug === 'javascript-prep-path');
    expect(jsPrep).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'Framework Prep',
      'framework-prep',
      jsPrep!
    );

    expect(meta.title).toBe('JavaScript Interview Preparation Path: 7/14/30-Day Study Plan');
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/framework-prep/javascript-prep-path');
    expect(meta.description).toBe(
      'JavaScript interview preparation for frontend engineers: follow a 7/14/30-day study plan for async, closures, event loop, promises, and utility drills.',
    );
    expect(meta.title?.length || 0).toBeLessThanOrEqual(74);
    expect(meta.description?.length || 0).toBeLessThanOrEqual(158);
    expect(meta.keywords?.[0]).toBe('javascript interview preparation');
    expect(meta.keywords).toContain('javascript interview prep path');
    expect(meta.keywords).toContain('javascript interview study plan');
    expect(meta.keywords).toContain('javascript interview preparation path');
    expect(meta.keywords).toContain('javascript interview preparation roadmap');
    expect(meta.keywords).toContain('javascript coding interview preparation');
    expect(meta.keywords).toContain('frontend javascript interview prep');
    expect(meta.keywords).toContain('frontend javascript interview preparation');
    expect(meta.keywords).toContain('frontend javascript coding interview preparation');
    expect(meta.keywords).toContain('javascript interview practice');
    expect(meta.keywords).toContain('javascript event loop interview prep');
    expect(meta.keywords).toContain('javascript event loop output questions practice');
    expect(meta.keywords).toContain('microtasks macrotasks interview prep');
    expect(meta.keywords).toContain('promise all interview practice javascript');
    expect(meta.keywords).toContain('javascript promise combinators interview prep');
    expect(meta.keywords).toContain('take latest javascript interview practice');
    expect(meta.keywords).toContain('javascript closures interview prep');
    expect(meta.keywords).toContain('this keyword javascript interview prep');
    expect(meta.keywords).toContain('hoisting tdz javascript interview prep');
    expect(meta.keywords).toContain('javascript async interview preparation');
    expect(meta.keywords).toContain('javascript utility function interview practice');
    expect(meta.keywords).toContain('javascript throttle interview prep');
    expect(meta.keywords).toContain('javascript reduce polyfill interview practice');
    expect(meta.keywords).toContain('javascript deep clone interview prep');
    expect(meta.keywords).not.toContain('javascript interview questions and answers');

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const itemList = graph.find((node: any) => node?.['@type'] === 'ItemList');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(article?.headline).toBe('JavaScript Interview Preparation Path: 7/14/30-Day Study Plan');
    expect(article?.dateModified).toBe('2026-06-13T00:00:00.000Z');
    expect(article?.author).toEqual({
      '@type': 'Organization',
      name: 'FrontendAtlas Team',
    });
    expect(article?.keywords).toContain('javascript coding interview preparation');
    expect(itemList?.name).toBe('12 JavaScript interview prep patterns to practice');
    expect(itemList?.itemListElement?.length).toBe(12);
    expect(itemList?.itemListElement?.[0]?.name).toBe('Event loop output');
    expect(itemList?.itemListElement?.[0]?.url).toBe('https://frontendatlas.com/javascript/trivia/js-event-loop');
    expect(itemList?.itemListElement?.[3]?.url).toBe('https://frontendatlas.com/javascript/coding/js-promise-all');
    expect(itemList?.itemListElement?.[9]?.url).toBe('https://frontendatlas.com/javascript/coding/js-event-emitter-mini');
    expect(itemList?.itemListElement?.[10]?.url).toBe('https://frontendatlas.com/javascript/coding/js-delegated-events-2');
    expect(itemList?.itemListElement?.[11]?.name).toBe('takeLatest / concurrency');
    expect(faqPage?.name).toBe('JavaScript interview preparation FAQ');
    expect(faqPage?.mainEntity?.length).toBe(6);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'How do I prepare for a JavaScript interview?',
      'What is the best JavaScript interview study plan for frontend engineers?',
      'How should I practice JavaScript event loop and output questions?',
      'How do I practice JavaScript utility function interview questions?',
      'Do I need LeetCode for JavaScript-heavy frontend interviews?',
      'How long does JavaScript interview preparation usually take?',
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
    expect(meta.description).toBe(
      'React interview preparation path for frontend engineers: hooks, effects, state, rendering, coding drills, testing, performance, and a 7/14/30-day plan.',
    );
    expect(meta.description).toContain('hooks');
    expect(meta.description).toContain('effects');
    expect(meta.description).toContain('testing');
    expect(meta.description?.length || 0).toBeLessThanOrEqual(158);
    expect(meta.keywords?.[0]).toBe('how to prepare for react interview');
    expect(meta.keywords).toContain('how to prepare for react interview');
    expect(meta.keywords).toContain('react interview preparation');
    expect(meta.keywords).toContain('react interview study plan');
    expect(meta.keywords).toContain('react interview prep path');
    expect(meta.keywords).toContain('react interview roadmap');
    expect(meta.keywords).toContain('react interview preparation for frontend engineers');
    expect(meta.keywords).toContain('react hooks interview prep');
    expect(meta.keywords).toContain('react coding interview preparation');
    expect(meta.keywords).toContain('react coding interview questions');
    expect(meta.keywords).toContain('react hooks and effects interview');
    expect(meta.keywords).toContain('react useeffect interview questions');
    expect(meta.keywords).toContain('react useeffect cleanup interview');
    expect(meta.keywords).toContain('react useeffect dependencies interview');
    expect(meta.keywords).toContain('react stale closure interview');
    expect(meta.keywords).toContain('react hooks pitfalls interview');
    expect(meta.keywords).toContain('react custom hooks interview preparation');
    expect(meta.keywords).toContain('react rendering interview questions');
    expect(meta.keywords).toContain('react reconciliation interview prep');
    expect(meta.keywords).toContain('react keys interview question');
    expect(meta.keywords).toContain('react state management interview questions');
    expect(meta.keywords).toContain('react context performance interview');
    expect(meta.keywords).toContain('react memoization interview questions');
    expect(meta.keywords).toContain('usememo usecallback react interview');
    expect(meta.keywords).toContain('react performance optimization interview');
    expect(meta.keywords).toContain('react component coding interview');
    expect(meta.keywords).toContain('react machine coding interview questions');
    expect(meta.keywords).toContain('react ui coding interview');
    expect(meta.keywords).toContain('react debounced search interview');
    expect(meta.keywords).toContain('react autocomplete interview question');
    expect(meta.keywords).toContain('react contact form interview question');
    expect(meta.keywords).toContain('react transfer list interview question');
    expect(meta.keywords).toContain('react tabs interview question');
    expect(meta.keywords).toContain('senior react interview preparation');
    expect(meta.keywords).toContain('junior react interview preparation');
    expect(meta.keywords).toContain('mid level react interview prep');
    expect(meta.keywords).toContain('do i need leetcode for react interviews');
    expect(meta.keywords).toContain('what to study first for react interview');
    expect(meta.keywords).toContain('how long to prepare for react interview');
    expect(meta.keywords).toContain('react interview topics for frontend developers');

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const itemList = graph.find((node: any) => node?.['@type'] === 'ItemList');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(article?.headline).toBe('How to Prepare for a React Interview: 7/14/30-Day Plan');
    expect(article?.dateModified).toBe('2026-06-13T00:00:00.000Z');
    expect(article?.author).toEqual({
      '@type': 'Organization',
      name: 'FrontendAtlas Team',
    });
    expect(article?.keywords).toContain('react interview preparation 7 days');
    expect(article?.keywords).toContain('react interview preparation 14 days');
    expect(article?.keywords).toContain('react interview preparation 30 days');
    expect(itemList?.name).toBe('12 React interview prep patterns to practice');
    expect(itemList?.itemListElement?.length).toBe(12);
    expect(itemList?.itemListElement?.[0]?.name).toBe('useEffect cleanup + dependencies');
    expect(itemList?.itemListElement?.[0]?.url).toBe('https://frontendatlas.com/react/trivia/react-useeffect-purpose');
    expect(itemList?.itemListElement?.[1]?.url).toBe('https://frontendatlas.com/react/trivia/react-stale-state-closures');
    expect(itemList?.itemListElement?.[4]?.url).toBe('https://frontendatlas.com/react/trivia/react-context-performance-issues');
    expect(itemList?.itemListElement?.[5]?.url).toBe('https://frontendatlas.com/react/coding/react-debounced-search');
    expect(itemList?.itemListElement?.[6]?.url).toBe('https://frontendatlas.com/react/coding/react-autocomplete-search-starter');
    expect(itemList?.itemListElement?.[9]?.url).toBe('https://frontendatlas.com/react/coding/react-tabs-switcher');
    expect(itemList?.itemListElement?.[11]?.name).toBe('Multi-step Signup');
    expect(faqPage?.name).toBe('React interview preparation FAQ');
    expect(faqPage?.mainEntity?.length).toBe(15);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'How do I prepare for a React interview?',
      'What should I study first for a React interview?',
      'How long does it take to prepare for a React interview?',
      'How should I practice React coding interview questions?',
      'How do I prepare for a senior React interview?',
      'Do I need LeetCode for React interviews?',
      'What is the practical difference between topics, trivia, and coding prompts?',
      'How long does it realistically take to get interview-ready?',
      'Which React hooks and effects questions should I practice?',
      'What React rendering and performance topics matter most?',
      'When should I use useMemo, useCallback, or React.memo?',
      'Context vs lifting state vs external store: how should I reason in interviews?',
      'Controlled vs uncontrolled forms: what mental model should I use?',
      'Do I need to know class components in 2026?',
      'How much browser/DOM knowledge is expected for React roles?',
    ]);
  });

  it('targets Angular preparation intent with study-plan FAQ and ItemList schema', () => {
    const angularPrep = PLAYBOOK.find((entry) => entry.slug === 'angular-prep-path');
    expect(angularPrep).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'Framework Prep',
      'framework-prep',
      angularPrep!
    );

    expect(meta.title).toBe('Angular Interview Preparation Path: 7/14/30-Day Plan');
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/framework-prep/angular-prep-path');
    expect(meta.description).toBe(
      'Angular interview preparation path for frontend engineers: RxJS, change detection, signals, DI, forms, testing, coding drills, and a 7/14/30-day plan.',
    );
    expect(meta.keywords?.[0]).toBe('angular interview preparation');
    expect(meta.keywords).toContain('angular interview prep path');
    expect(meta.keywords).toContain('angular interview study plan');
    expect(meta.keywords).toContain('how to prepare for angular interview');
    expect(meta.keywords).toContain('angular coding interview preparation');
    expect(meta.keywords).toContain('frontend angular interview prep');
    expect(meta.keywords).toContain('angular rxjs interview questions');
    expect(meta.keywords).toContain('angular change detection interview');
    expect(meta.keywords).toContain('angular onpush interview questions');
    expect(meta.keywords).toContain('angular signals interview questions');
    expect(meta.keywords).toContain('angular dependency injection interview');
    expect(meta.keywords).toContain('angular reactive forms interview');
    expect(meta.keywords).toContain('angular testing interview questions');
    expect(meta.keywords).toContain('senior angular interview preparation');
    expect(meta.keywords).toContain('angular interview preparation 7 days');
    expect(meta.keywords).toContain('angular interview preparation 14 days');
    expect(meta.keywords).toContain('angular interview preparation 30 days');
    expect(meta.keywords).toContain('angular interview roadmap');
    expect(meta.keywords).toContain('switchmap vs mergemap angular interview');
    expect(meta.keywords).toContain('angular http cancellation interview');
    expect(meta.keywords).toContain('angular stale response interview');
    expect(meta.keywords).toContain('angular async pipe interview questions');
    expect(meta.keywords).toContain('angular observables interview questions');
    expect(meta.keywords).toContain('angular onpush change detection interview');
    expect(meta.keywords).toContain('markforcheck vs detectchanges interview');
    expect(meta.keywords).toContain('angular zonejs interview questions');
    expect(meta.keywords).toContain('angular controlvalueaccessor interview');
    expect(meta.keywords).toContain('angular zoneless interview questions');
    expect(meta.keywords).toContain('signals vs rxjs angular interview');
    expect(meta.keywords).toContain('angular standalone components interview');
    expect(meta.keywords).toContain('angular ssr hydration interview');
    expect(meta.keywords).toContain('angular incremental hydration interview');
    expect(meta.keywords).toContain('modern angular interview questions');
    expect(meta.keywords).toContain('angular hierarchical dependency injection interview');
    expect(meta.keywords).toContain('angular frontend coding interview');
    expect(meta.keywords).toContain('angular debounced search interview');
    expect(meta.keywords).toContain('angular autocomplete interview question');
    expect(meta.keywords).toContain('angular data table interview question');
    expect(meta.keywords).not.toContain('angular interview questions and answers');

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const itemList = graph.find((node: any) => node?.['@type'] === 'ItemList');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(article?.headline).toBe('Angular Interview Preparation Path: 7/14/30-Day Plan');
    expect(article?.dateModified).toBe('2026-06-13T00:00:00.000Z');
    expect(article?.author).toEqual({
      '@type': 'Organization',
      name: 'FrontendAtlas Team',
    });
    expect(article?.keywords).toContain('angular interview preparation');
    expect(article?.keywords).toContain('angular coding interview questions');
    expect(itemList?.name).toBe('12 Angular interview prep patterns to practice');
    expect(itemList?.itemListElement?.length).toBe(12);
    expect(itemList?.itemListElement?.[0]?.name).toBe('Change Detection triggers');
    expect(itemList?.itemListElement?.[0]?.url).toBe('https://frontendatlas.com/angular/trivia/angular-change-detection-strategies');
    expect(itemList?.itemListElement?.[1]?.url).toBe('https://frontendatlas.com/angular/trivia/angular-onpush-change-detection-debugging-real-bug');
    expect(itemList?.itemListElement?.[2]?.url).toBe('https://frontendatlas.com/angular/trivia/angular-observables-rxjs');
    expect(itemList?.itemListElement?.[3]?.url).toBe('https://frontendatlas.com/angular/trivia/rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use');
    expect(itemList?.itemListElement?.[5]?.url).toBe('https://frontendatlas.com/angular/trivia/angular-dependency-injection');
    expect(itemList?.itemListElement?.[7]?.url).toBe('https://frontendatlas.com/angular/trivia/angular-controlvalueaccessor-vs-custom-two-way-binding');
    expect(itemList?.itemListElement?.[9]?.url).toBe('https://frontendatlas.com/angular/coding/angular-debounced-search');
    expect(itemList?.itemListElement?.[10]?.url).toBe('https://frontendatlas.com/angular/coding/angular-autocomplete-search-starter');
    expect(itemList?.itemListElement?.[11]?.name).toBe('Data Table / Pagination');
    expect(faqPage?.name).toBe('Angular interview preparation FAQ');
    expect(faqPage?.mainEntity?.length).toBe(8);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'How do I prepare for an Angular interview?',
      'What is the best Angular interview study plan for frontend engineers?',
      'Which Angular RxJS interview questions should I practice?',
      'How do I prepare for Angular change detection and OnPush questions?',
      'Which Angular signals and modern Angular topics matter in interviews?',
      'How should I practice Angular coding interview questions?',
      'How do I prepare for a senior Angular interview?',
      'Do I need LeetCode for Angular interviews?',
    ]);
  });

  it('targets Vue preparation intent with study-plan FAQ and ItemList schema', () => {
    const vuePrep = PLAYBOOK.find((entry) => entry.slug === 'vue-prep-path');
    expect(vuePrep).toBeDefined();

    const meta = buildGuideDetailSeo(
      seoMock,
      'Framework Prep',
      'framework-prep',
      vuePrep!
    );

    expect(meta.title).toBe('Vue Interview Preparation Path: 7/14/30-Day Study Plan');
    expect(meta.canonical).toBe('https://frontendatlas.com/guides/framework-prep/vue-prep-path');
    expect(meta.description).toBe(
      'Vue interview preparation path for frontend engineers: reactivity, Composition API, Pinia, Router, nextTick, coding drills, and a 7/14/30-day plan.',
    );
    expect(meta.description?.length || 0).toBeLessThanOrEqual(158);
    expect(meta.keywords?.[0]).toBe('vue interview preparation');
    expect(meta.keywords).toContain('vue interview prep path');
    expect(meta.keywords).toContain('vue interview study plan');
    expect(meta.keywords).toContain('how to prepare for vue interview');
    expect(meta.keywords).toContain('vue coding interview preparation');
    expect(meta.keywords).toContain('frontend vue interview prep');
    expect(meta.keywords).toContain('vue interview preparation for frontend engineers');
    expect(meta.keywords).toContain('vue interview roadmap');
    expect(meta.keywords).toContain('vue interview preparation 7 days');
    expect(meta.keywords).toContain('vue interview preparation 14 days');
    expect(meta.keywords).toContain('vue interview preparation 30 days');
    expect(meta.keywords).toContain('vue reactivity interview questions');
    expect(meta.keywords).toContain('vue ref vs reactive interview');
    expect(meta.keywords).toContain('ref vs reactive vue interview question');
    expect(meta.keywords).toContain('computed vs watch vue interview');
    expect(meta.keywords).toContain('watch vs watcheffect vue interview');
    expect(meta.keywords).toContain('vue nexttick interview question');
    expect(meta.keywords).toContain('vue reactivity destructuring trap');
    expect(meta.keywords).toContain('vue shallowref interview question');
    expect(meta.keywords).toContain('vue composition api interview');
    expect(meta.keywords).toContain('vue options api vs composition api interview');
    expect(meta.keywords).toContain('vue composables interview questions');
    expect(meta.keywords).toContain('vue pinia interview questions');
    expect(meta.keywords).toContain('pinia vs vuex interview');
    expect(meta.keywords).toContain('vue state management interview');
    expect(meta.keywords).toContain('vue router guard interview');
    expect(meta.keywords).toContain('vue router navigation guard interview');
    expect(meta.keywords).toContain('vue lazy routes interview');
    expect(meta.keywords).toContain('vue storeToRefs interview');
    expect(meta.keywords).toContain('vue slots interview question');
    expect(meta.keywords).toContain('vue scoped slots interview');
    expect(meta.keywords).toContain('vue emits props interview');
    expect(meta.keywords).toContain('vue component communication interview');
    expect(meta.keywords).toContain('vue component API interview');
    expect(meta.keywords).toContain('vue v-for keys interview');
    expect(meta.keywords).toContain('vue virtual dom interview');
    expect(meta.keywords).toContain('vue performance interview questions');
    expect(meta.keywords).toContain('vue testing interview questions');
    expect(meta.keywords).toContain('nuxt vue interview questions');
    expect(meta.keywords).toContain('vue ssr interview questions');
    expect(meta.keywords).toContain('vue migration vuex to pinia interview');
    expect(meta.keywords).toContain('vue coding interview questions');
    expect(meta.keywords).toContain('vue debounced search interview');
    expect(meta.keywords).toContain('vue tabs interview question');
    expect(meta.keywords).toContain('vue data table interview question');
    expect(meta.keywords).toContain('vue shopping cart interview question');
    expect(meta.keywords).toContain('vue todo list interview question');
    expect(meta.keywords).toContain('vue pagination table interview');
    expect(meta.keywords).not.toContain('vue interview questions and answers');

    const graph = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const itemList = graph.find((node: any) => node?.['@type'] === 'ItemList');
    const faqPage = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(article?.headline).toBe('Vue Interview Preparation Path: 7/14/30-Day Study Plan');
    expect(article?.dateModified).toBe('2026-06-13T00:00:00.000Z');
    expect(article?.author).toEqual({
      '@type': 'Organization',
      name: 'FrontendAtlas Team',
    });
    expect(article?.keywords).toContain('vue interview preparation');
    expect(article?.keywords).toContain('vue coding interview questions');
    expect(itemList?.name).toBe('12 Vue interview prep patterns to practice');
    expect(itemList?.itemListElement?.length).toBe(12);
    expect(itemList?.itemListElement?.[0]?.name).toBe('Reactivity system');
    expect(itemList?.itemListElement?.[0]?.url).toBe('https://frontendatlas.com/vue/trivia/vue-reactivity-system');
    expect(itemList?.itemListElement?.[1]?.url).toBe('https://frontendatlas.com/vue/trivia/vue-ref-vs-reactive-difference-traps');
    expect(itemList?.itemListElement?.[2]?.url).toBe('https://frontendatlas.com/vue/trivia/vue-computed-vs-watchers');
    expect(itemList?.itemListElement?.[3]?.url).toBe('https://frontendatlas.com/vue/trivia/vue-nexttick-dom-update-queue');
    expect(itemList?.itemListElement?.[5]?.url).toBe('https://frontendatlas.com/vue/trivia/vue-router-navigation');
    expect(itemList?.itemListElement?.[7]?.url).toBe('https://frontendatlas.com/vue/trivia/vue-v-for-keys-why-not-index');
    expect(itemList?.itemListElement?.[8]?.url).toBe('https://frontendatlas.com/vue/coding/vue-debounced-search');
    expect(itemList?.itemListElement?.[9]?.url).toBe('https://frontendatlas.com/vue/coding/vue-tabs-switcher');
    expect(itemList?.itemListElement?.[10]?.url).toBe('https://frontendatlas.com/vue/coding/vue-pagination-table');
    expect(itemList?.itemListElement?.[11]?.name).toBe('Shopping Cart / store state');
    expect(faqPage?.name).toBe('Vue interview preparation FAQ');
    expect(faqPage?.mainEntity?.length).toBe(8);
    expect(faqPage?.mainEntity?.map((entry: any) => entry?.name)).toEqual([
      'How do I prepare for a Vue interview?',
      'What is the best Vue interview study plan for frontend engineers?',
      'Which Vue reactivity interview questions should I practice?',
      'How should I explain ref vs reactive in Vue interviews?',
      'How do I practice Vue coding interview questions?',
      'Do I need Nuxt for Vue interviews?',
      'How do I prepare for a senior Vue interview?',
      'Do I need LeetCode for Vue interviews?',
    ]);
  });
});
