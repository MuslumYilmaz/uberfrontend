import { seoContentDateModified } from '../../../core/utils/seo-content-date.util';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Data, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { CompanyPreviewResolved } from '../../../core/models/company-public.model';
import { QuestionService } from '../../../core/services/question.service';
import { SeoService } from '../../../core/services/seo.service';
import { CompanyPreviewComponent } from './company-preview.component';
import type { AuthoredCompanyPreview } from '../../../shared/company-previews/authored-company-preview.model';
import { AUTHORED_COMPANY_PREVIEWS, AUTHORED_COMPANY_PREVIEWS_TOKEN } from '../../../shared/company-previews/authored-company-previews';
import { buildAuthoredCompanyPreviewFixture } from '../../../shared/company-previews/authored-company-preview.spec-fixture';
import type { CompanyEditorialNotesRegistry } from '../../../shared/company-previews/company-editorial-notes';
import { buildCompanyEditorialNotesFixture } from '../../../shared/company-previews/company-editorial-notes.spec-fixture';

describe('CompanyPreviewComponent', () => {
  let fixture: ComponentFixture<CompanyPreviewComponent>;
  let questionService: jasmine.SpyObj<QuestionService>;
  let seo: jasmine.SpyObj<SeoService>;
  let routeData: BehaviorSubject<Data>;

  async function createComponent(
    slug: string,
    resolved?: CompanyPreviewResolved,
    authored: Record<string, AuthoredCompanyPreview> = AUTHORED_COMPANY_PREVIEWS,
    notes: CompanyEditorialNotesRegistry = {},
  ): Promise<ComponentFixture<CompanyPreviewComponent>> {
    TestBed.resetTestingModule();

    questionService = jasmine.createSpyObj<QuestionService>('QuestionService', [
      'loadAllQuestionSummaries',
      'loadSystemDesign',
      'loadCompanyReports',
    ]);
    questionService.loadAllQuestionSummaries.and.returnValue(of([] as any));
    questionService.loadSystemDesign.and.returnValue(of([] as any));
    questionService.loadCompanyReports.and.returnValue(of({ schemaVersion: 1, companies: {} } as any));
    routeData = new BehaviorSubject<Data>({ companyPreview: resolved ?? {
      slug,
      mode: ['google', 'netflix', 'openai'].includes(slug) || slug in authored ? 'editorial' : 'catalog',
      counts: { all: 0, coding: 0, trivia: 0, system: 0 },
      samples: [],
    } });

    seo = jasmine.createSpyObj<SeoService>('SeoService', ['updateTags', 'buildCanonicalUrl']);
    seo.buildCanonicalUrl.and.callFake((value: string) => {
      const raw = String(value || '').trim();
      if (!raw) return 'https://frontendatlas.com/';
      if (/^https?:\/\//i.test(raw)) return raw;
      return raw.startsWith('/')
        ? `https://frontendatlas.com${raw}`
        : `https://frontendatlas.com/${raw}`;
    });

    await TestBed.configureTestingModule({
      imports: [CompanyPreviewComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            data: routeData,
            snapshot: {
              paramMap: convertToParamMap({ slug }),
            },
          },
        },
        { provide: QuestionService, useValue: questionService },
        { provide: SeoService, useValue: seo },
        { provide: AUTHORED_COMPANY_PREVIEWS_TOKEN, useValue: authored },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CompanyPreviewComponent);
    fixture.componentInstance.editorialNotesRegistry = notes;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('publishes OpenAI-specific title, meta, canonical, robots, and schema', async () => {
    await createComponent('openai');

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
    const breadcrumb = graph.find((entry: any) => entry?.['@type'] === 'BreadcrumbList');

    expect(payload.title).toBe('OpenAI Frontend Interview: 5 Practice Questions + Prep Guide');
    expect(payload.description).toBe(
      'Practice for OpenAI frontend interviews with representative prompts on streaming chat UI, stale stream handling, optimistic React state, accessibility, and history design.',
    );
    expect(payload.canonical).toBe('/companies/openai/preview');
    expect(payload.robots).toBe('index,follow');
    expect(collection?.dateModified).toBe(seoContentDateModified(collection.url));
    expect(collection?.disambiguatingDescription).toBe(
      'Editorial practice groupings, not verified official interview questions or endorsements.',
    );
    expect(collection?.mainEntity?.description).toBe(
      'Editorial practice groupings, not verified official interview questions or endorsements.',
    );
    expect(collection?.mainEntity?.itemListElement?.length).toBe(5);
    expect(collection?.mainEntity?.itemListElement?.[0]?.name).toBe('Streaming chat composer');
    expect(breadcrumb?.itemListElement?.[2]?.name).toBe('OpenAI Frontend Interview Questions');
    expect(questionService.loadAllQuestionSummaries).not.toHaveBeenCalled();
    expect(questionService.loadSystemDesign).not.toHaveBeenCalled();
  });

  it('renders OpenAI public landing content without premium item title leakage', async () => {
    const fixture = await createComponent('openai');
    const host: HTMLElement = fixture.nativeElement;
    const text = host.textContent || '';

    expect(host.querySelector('h1')?.textContent?.trim()).toBe('OpenAI Frontend Interview Questions');
    expect(text).toContain('Streaming chat composer');
    expect(text).toContain('Stop/regenerate and stale stream handling');
    expect(text).toContain('React state + optimistic messages');
    expect(text).toContain('Accessibility/keyboard interaction');
    expect(text).toContain('Frontend system design/conversation history');
    expect(text).toContain('Strong answer should cover');
    expect(text).toContain('Walk through stale stream handling before you code');
    expect(text).toContain('Day 7');
    expect(text).toContain(
      'These are not leaked or confirmed OpenAI interview questions; they are representative, role-relevant practice prompts.',
    );
    expect(text).toContain('Unlock the full OpenAI practice set');
    expect(host.querySelector('[data-testid="company-practice-disclaimer"]')?.textContent?.trim()).toBe(
      'Editorial practice groupings, not verified official interview questions or endorsements.',
    );

    expect(text).not.toContain('Openai');
    expect(text).not.toContain('Chat UI with Streaming Response');
    expect(text).not.toContain('AI Chat Text Area (ChatGPT-Style)');
    expect(text).not.toContain('AI UX Resilience and Control Patterns');
  });

  it('uses the shared ByteDance brand casing in the generic preview and metadata', async () => {
    const fixture = await createComponent('bytedance');
    const host: HTMLElement = fixture.nativeElement;
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;

    expect(host.querySelector('h1')?.textContent?.trim()).toBe(
      'ByteDance Frontend Interview Questions Preview',
    );
    expect(host.querySelector('.preview-breadcrumb span:last-child')?.textContent?.trim()).toBe(
      'ByteDance frontend interview questions preview',
    );
    expect(payload.title).toBe('ByteDance Frontend Interview Questions Preview');
    expect(payload.description).toContain('editorial ByteDance practice grouping');
    expect(host.textContent || '').not.toContain('Bytedance');
  });

  describe('editorial notes on a catalog-driven preview', () => {
    const acme = buildCompanyEditorialNotesFixture();
    const registry: CompanyEditorialNotesRegistry = { acme };

    it('replaces the shared hero copy and metadata and renders the four sections in order', async () => {
      const fixture = await createComponent('acme', undefined, AUTHORED_COMPANY_PREVIEWS, registry);
      const host: HTMLElement = fixture.nativeElement;
      const text = host.textContent || '';
      const payload = seo.updateTags.calls.mostRecent().args[0] as any;

      expect(host.querySelectorAll('h1').length).toBe(1);
      expect(host.querySelector('h1')?.textContent?.trim()).toBe(acme.h1);
      expect(host.querySelector('.preview-kicker')?.textContent?.trim()).toBe(acme.hero?.kicker);
      expect(host.querySelector('.preview-subtitle')?.textContent?.trim()).toBe(acme.hero?.subtitle);
      expect(host.querySelector('.preview-breadcrumb span:last-child')?.textContent?.trim()).toBe(acme.h1);
      expect(text).not.toContain('Review a FrontendAtlas editorial practice grouping');
      expect(payload.title).toBe(acme.title);
      expect(payload.description).toBe(acme.description);
      expect(payload.canonical).toBe('/companies/acme/preview');
      expect(payload.robots).toBe('index,follow');

      const order = [
        'company-editorial-intro',
        'company-reports-describe',
        'company-prep-steps',
        'company-editorial-faqs',
      ].map((id) => host.querySelector(`[data-testid="${id}"]`) as HTMLElement);
      for (const section of order) expect(section).not.toBeNull();
      for (let index = 1; index < order.length; index += 1) {
        expect(order[index - 1].compareDocumentPosition(order[index]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      }
      const proof = host.querySelector('.proof-grid') as HTMLElement;
      expect(order[2].compareDocumentPosition(proof) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(host.querySelector('#acme-reports-describe')?.textContent?.trim()).toBe(acme.reportsDescribe?.title);
      expect(host.querySelector('[data-testid="company-reports-describe"] a[href="#acme-interview-process"]')).not.toBeNull();
      expect(host.querySelector('[data-testid="company-reports-describe"] a[href="/react/coding/react-counter"]')).not.toBeNull();
      const steps = Array.from(host.querySelectorAll('[data-testid="company-prep-steps"] ol > li'));
      expect(steps.map((step) => step.querySelector('strong')?.textContent?.trim())).toEqual(['Free now', 'Premium']);
      expect(steps[1].querySelector('a')?.getAttribute('href')).toBe('/react/coding/react-debounced-search');
      expect(host.querySelectorAll('[data-testid="company-editorial-faqs"] article h3').length).toBe(2);
      expect(host.querySelector('[data-testid="company-preview-counts"]')).not.toBeNull();
      expect(text).toContain('What you can do now for free');
      expect(text).not.toContain('known questions');
    });

    it('publishes a dated CollectionPage and BreadcrumbList without ItemList or FAQPage', async () => {
      await createComponent('acme', undefined, AUTHORED_COMPANY_PREVIEWS, registry);
      const payload = seo.updateTags.calls.mostRecent().args[0] as any;
      const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
      const types = graph.map((entry: any) => entry?.['@type']);
      const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
      const breadcrumb = graph.find((entry: any) => entry?.['@type'] === 'BreadcrumbList');
      const expectedDate = seoContentDateModified('https://frontendatlas.com/companies/acme/preview');

      expect(types).toEqual(['CollectionPage', 'BreadcrumbList']);
      expect(collection?.url).toBe('https://frontendatlas.com/companies/acme/preview');
      expect(collection?.name).toBe(acme.title);
      expect(collection?.headline).toBe(acme.h1);
      expect(collection?.isAccessibleForFree).toBeTrue();
      expect(collection?.about?.map((item: any) => item.name)).toEqual(['Acme frontend interview preparation']);
      expect(collection?.disambiguatingDescription).toContain('Editorial practice groupings');
      expect(collection?.dateModified).toBe(expectedDate || undefined);
      expect(breadcrumb?.itemListElement?.length).toBe(3);
      expect(breadcrumb?.itemListElement?.[2]?.name).toBe(acme.h1);
    });

    it('renders no empty sections for a thin entry and ignores entries for authored companies', async () => {
      const thin = buildCompanyEditorialNotesFixture({
        hero: undefined, intro: undefined, reportsDescribe: undefined, prepSteps: undefined, faqs: undefined, about: undefined,
      });
      const fixture = await createComponent('acme', undefined, AUTHORED_COMPANY_PREVIEWS, { acme: thin });
      const host: HTMLElement = fixture.nativeElement;
      expect(host.querySelector('h1')?.textContent?.trim()).toBe(thin.h1);
      expect(host.querySelector('.preview-kicker')?.textContent?.trim()).toBe('Public preview');
      expect(host.textContent).toContain('Review a FrontendAtlas editorial practice grouping');
      for (const id of ['company-editorial-intro', 'company-reports-describe', 'company-prep-steps', 'company-editorial-faqs']) {
        expect(host.querySelector(`[data-testid="${id}"]`)).withContext(id).toBeNull();
      }

      const authored = buildAuthoredCompanyPreviewFixture();
      const authoredFixture = await createComponent('acme', undefined, { acme: authored }, { acme });
      expect(authoredFixture.componentInstance.editorialNotes).toBeNull();
      expect((authoredFixture.nativeElement as HTMLElement).querySelector('[data-testid="company-reports-describe"]')).toBeNull();
    });
  });

  it('links the other company guides from every preview branch', async () => {
    const authored = buildAuthoredCompanyPreviewFixture();
    const cases: Array<[string, Record<string, AuthoredCompanyPreview> | undefined]> = [
      ['openai', undefined],
      ['google', undefined],
      ['netflix', undefined],
      ['microsoft', undefined],
      [authored.slug, { [authored.slug]: authored }],
    ];

    for (const [slug, registry] of cases) {
      const fixture = registry ? await createComponent(slug, undefined, registry) : await createComponent(slug);
      const host: HTMLElement = fixture.nativeElement;
      const section = host.querySelector('[data-testid="company-related-guides"]') as HTMLElement;
      const hrefs = Array.from(section.querySelectorAll<HTMLAnchorElement>('a'), (anchor) => anchor.getAttribute('href'));

      expect(section).withContext(slug).toBeTruthy();
      expect(hrefs.length).withContext(slug).toBeGreaterThanOrEqual(20);
      expect(new Set(hrefs).size).withContext(slug).toBe(hrefs.length);
      expect(hrefs).withContext(slug).not.toContain(`/companies/${slug}/preview`);
      expect(hrefs).withContext(slug).toContain('/companies/meta/preview');
      expect(hrefs).withContext(slug).toContain('/companies/stripe/preview');
      expect(hrefs.every((href) => !href?.includes('?'))).withContext(slug).toBeTrue();
      expect(section.textContent || '').withContext(slug).toContain('Booking.com frontend interview questions');
      expect(section.textContent || '').withContext(slug).not.toContain('Openai');
      expect(section.textContent || '').withContext(slug).not.toContain('Bytedance');
      expect(host.querySelectorAll('h1').length).withContext(slug).toBe(1);
    }
  });

  it('keeps contextual OpenAI links on free public practice pages', async () => {
    const fixture = await createComponent('openai');
    const host: HTMLElement = fixture.nativeElement;
    const hrefs = Array.from(host.querySelectorAll<HTMLAnchorElement>('a')).map((anchor) =>
      anchor.getAttribute('href'),
    );

    expect(hrefs).toContain('/javascript/trivia/ai-streaming-data-handling');
    expect(hrefs).toContain('/javascript/trivia/chat-conversation-state-management');
    expect(hrefs).toContain('/javascript/trivia/sse-vs-websocket-real-time');
    expect(hrefs).toContain('/javascript/trivia/ai-ux-integration-challenges');
    expect(hrefs).toContain('/javascript/coding/js-stream-to-text');
    expect(hrefs).toContain('/javascript/coding/js-take-latest');
  });

  it('publishes exact Google metadata and a linked seven-item schema graph synchronously', async () => {
    await createComponent('google');

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
    const itemList = graph.find((entry: any) => entry?.['@type'] === 'ItemList');
    const breadcrumb = graph.find((entry: any) => entry?.['@type'] === 'BreadcrumbList');

    expect(payload.title).toBe('Google Frontend Interview Questions: 7 Prompts + Prep Guide');
    expect(payload.description).toBe(
      'Prepare for a Google frontend interview with 7 representative questions covering DSA, JavaScript, browser APIs, UI coding, accessibility, and system design.',
    );
    expect(payload.canonical).toBe('/companies/google/preview');
    expect(payload.robots).toBe('index,follow');

    expect(collection?.url).toBe('https://frontendatlas.com/companies/google/preview');
    expect(collection?.name).toBe('Google Frontend Interview Questions: 7 Prompts + Prep Guide');
    expect(collection?.headline).toBe('Google Frontend Interview Questions');
    expect(collection?.inLanguage).toBe('en');
    expect(collection?.dateModified).toBe(seoContentDateModified(collection.url));
    expect(collection?.isAccessibleForFree).toBeTrue();
    expect(collection?.mainEntity?.['@id']).toBe(
      'https://frontendatlas.com/companies/google/preview#practice-prompts',
    );
    expect(collection?.disambiguatingDescription).toBe(
      'Editorial practice groupings, not verified official interview questions or endorsements.',
    );
    expect(collection?.mentions?.length).toBe(8);

    expect(itemList?.['@id']).toBe(
      'https://frontendatlas.com/companies/google/preview#practice-prompts',
    );
    expect(itemList?.itemListElement?.length).toBe(7);
    expect(itemList?.description).toBe(
      'Editorial practice groupings, not verified official interview questions or endorsements.',
    );
    expect(itemList?.itemListElement?.map((item: any) => item.name)).toEqual([
      'Traverse and transform a nested navigation tree',
      'Implement debounce with cancel and flush',
      'Build an accessible autocomplete',
      'Keep only the latest async result',
      'Handle delegated events in a dynamic list',
      'Reason about frontend performance, networking, and security',
      'Design search suggestions for a large interactive list',
    ]);
    expect(itemList?.itemListElement?.[0]?.url).toBe(
      'https://frontendatlas.com/companies/google/preview#nested-navigation-tree',
    );
    expect(itemList?.itemListElement?.[6]?.url).toBe(
      'https://frontendatlas.com/companies/google/preview#search-suggestions-large-list-design',
    );
    expect(breadcrumb?.itemListElement?.map((item: any) => item.name)).toEqual([
      'FrontendAtlas',
      'Company Frontend Interview Questions',
      'Google Frontend Interview Questions',
    ]);

    expect(questionService.loadAllQuestionSummaries).not.toHaveBeenCalled();
    expect(questionService.loadSystemDesign).not.toHaveBeenCalled();
  });

  it('renders the complete public Google guide before its premium CTA without catalog leakage', async () => {
    const fixture = await createComponent('google');
    const host: HTMLElement = fixture.nativeElement;
    const text = host.textContent || '';

    expect(host.querySelector('h1')?.textContent?.trim()).toBe('Google Frontend Interview Questions');
    expect(host.querySelector('.preview-breadcrumb span:last-child')?.textContent?.trim()).toBe(
      'Google Frontend Interview Questions',
    );
    expect(text).toContain('Public Google prep guide');
    expect(text).toContain('What to study first for a Google frontend interview');
    expect(text).toContain('Current process note — reviewed July 2026');
    expect(text).toContain('Seven Google frontend interview practice questions');
    expect(text).toContain('Walk through autocomplete request ordering before you code');
    expect(text).toContain('A 7-day Google frontend interview preparation plan');
    expect(text).toContain('Common Google frontend interview preparation questions');
    expect(text).toContain('Free public practice');
    expect(text).toContain('Day 7');
    expect(text).toContain('Deliverable:');
    expect(text).toContain(
      'These are representative FrontendAtlas practice prompts, not leaked or confirmed Google interview questions. Interview formats vary by role, level, team, location, and time.',
    );
    expect(text).toContain('Is Google frontend preparation React-only?');
    expect(text).toContain('Does the reported 2026 AI-assisted pilot apply to every frontend candidate?');

    const promptIds = [
      'nested-navigation-tree',
      'debounce-cancel-flush',
      'accessible-autocomplete',
      'take-latest-async-results',
      'dom-event-delegation',
      'frontend-performance-network-security',
      'search-suggestions-large-list-design',
    ];
    for (const id of promptIds) {
      expect(host.querySelector(`#${id}`)).withContext(`visible prompt #${id}`).not.toBeNull();
    }

    const freePractice = host.querySelector('#google-free-practice')?.closest('section');
    const premiumCta = host.querySelector('#google-premium-route')?.closest('section');
    expect(freePractice).not.toBeNull();
    expect(premiumCta).not.toBeNull();
    const ctaFollowsPublicPractice = freePractice && premiumCta
      ? Boolean(freePractice.compareDocumentPosition(premiumCta) & Node.DOCUMENT_POSITION_FOLLOWING)
      : false;
    expect(ctaFollowsPublicPractice).toBeTrue();

    expect(host.querySelector('fa-question-row')).toBeNull();
    expect(host.querySelector('code')).toBeNull();
    expect(text).not.toContain('known questions');
    expect(text).not.toContain('Curry Function');
    expect(text).not.toContain('Image Slider (Dots + Previous/Next)');
  });

  it('renders only validated contextual Google practice links in the public guide', async () => {
    const fixture = await createComponent('google');
    const host: HTMLElement = fixture.nativeElement;
    const hrefs = Array.from(host.querySelectorAll<HTMLAnchorElement>('a')).map((anchor) =>
      anchor.getAttribute('href'),
    );
    const resourcePaths = [
      '/javascript/coding/js-get-by-path-1',
      '/javascript/coding/js-debounce',
      '/react/coding/react-autocomplete-search-starter',
      '/javascript/coding/js-take-latest',
      '/javascript/trivia/js-event-delegation',
      '/javascript/trivia/web-performance-optimize-load-time',
      '/system-design/infinite-scroll-list',
      '/javascript/trivia/js-compare-two-objects',
    ];

    for (const path of resourcePaths) {
      expect(hrefs).withContext(`public resource ${path}`).toContain(path);
    }

    expect(host.textContent).toContain('optional framework-specific implementation drill');
    expect(hrefs).toContain('/companies');
    expect(hrefs).toContain('/pricing?src=company_preview_google');
  });

  it('publishes exact Netflix metadata and a linked six-item schema graph synchronously', async () => {
    await createComponent('netflix');

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
    const itemList = graph.find((entry: any) => entry?.['@type'] === 'ItemList');
    const breadcrumb = graph.find((entry: any) => entry?.['@type'] === 'BreadcrumbList');

    expect(payload.title).toBe('Netflix Frontend Interview Questions: 6 Prompts + Prep Guide');
    expect(payload.description).toBe(
      'Prepare for a Netflix frontend interview with 6 representative prompts on JavaScript, React, streaming UI, performance, accessibility, and system design.',
    );
    expect(payload.canonical).toBe('/companies/netflix/preview');
    expect(payload.robots).toBe('index,follow');

    expect(collection?.url).toBe('https://frontendatlas.com/companies/netflix/preview');
    expect(collection?.headline).toBe('Netflix Frontend Interview Questions');
    expect(collection?.dateModified).toBe(seoContentDateModified(collection.url));
    expect(collection?.isAccessibleForFree).toBeTrue();
    expect(collection?.mainEntity?.['@id']).toBe(
      'https://frontendatlas.com/companies/netflix/preview#practice-prompts',
    );
    expect(collection?.mentions?.length).toBe(8);
    expect(collection?.disambiguatingDescription).toContain(
      'not leaked or confirmed Netflix interview questions',
    );

    expect(itemList?.['@id']).toBe(
      'https://frontendatlas.com/companies/netflix/preview#practice-prompts',
    );
    expect(itemList?.numberOfItems).toBe(6);
    expect(itemList?.itemListElement?.map((item: any) => item.name)).toEqual([
      'Implement resilient title search',
      'Build an accessible Continue Watching row',
      'Stop personalized rows from re-rendering unnecessarily',
      'Reason about streaming delivery, caching, and failure states',
      'Design Continue Watching for regional and device scale',
      'Defend a consequential frontend decision',
    ]);
    expect(itemList?.itemListElement?.[0]?.url).toBe(
      'https://frontendatlas.com/companies/netflix/preview#resilient-title-search',
    );
    expect(itemList?.itemListElement?.[5]?.url).toBe(
      'https://frontendatlas.com/companies/netflix/preview#consequential-frontend-decision',
    );
    expect(breadcrumb?.itemListElement?.map((item: any) => item.name)).toEqual([
      'FrontendAtlas',
      'Company Frontend Interview Questions',
      'Netflix Frontend Interview Questions',
    ]);

    expect(questionService.loadAllQuestionSummaries).not.toHaveBeenCalled();
    expect(questionService.loadSystemDesign).not.toHaveBeenCalled();
  });

  it('renders the complete public Netflix guide before its premium CTA without catalog leakage', async () => {
    const fixture = await createComponent('netflix');
    const host: HTMLElement = fixture.nativeElement;
    const text = host.textContent || '';

    expect(host.querySelector('h1')?.textContent?.trim()).toBe('Netflix Frontend Interview Questions');
    expect(host.querySelector('.preview-breadcrumb span:last-child')?.textContent?.trim()).toBe(
      'Netflix Frontend Interview Questions',
    );
    expect(text).toContain('Prepare for product judgment, not Netflix trivia');
    expect(text).toContain('What Netflix publishes—and what you still need to confirm');
    expect(text).toContain('Three product contexts for practicing transferable frontend judgment');
    expect(text).toContain('Six Netflix frontend interview practice questions');
    expect(text).toContain('Scope Continue Watching before drawing architecture boxes');
    expect(text).toContain('A 7-day Netflix frontend interview preparation plan');
    expect(text).toContain('Common Netflix frontend interview preparation questions');
    expect(text).toContain('Sources and evidence limits');
    expect(text).toContain('Day 7');
    expect(text).toContain('Deliverable:');
    expect(text).toContain(
      'These are representative FrontendAtlas practice prompts, not leaked or confirmed Netflix interview questions. Interview formats vary by role and team, so use recruiter-provided material as the source of truth.',
    );
    expect(text).toContain('Are these real Netflix interview questions?');

    const promptIds = [
      'resilient-title-search',
      'accessible-continue-watching-row',
      'personalized-row-rendering',
      'streaming-caching-failure-states',
      'continue-watching-system-design',
      'consequential-frontend-decision',
    ];
    for (const id of promptIds) {
      expect(host.querySelector(`#${id}`)).withContext(`visible prompt #${id}`).not.toBeNull();
    }

    const freePractice = host.querySelector('#netflix-free-practice')?.closest('section');
    const sourceNotes = host.querySelector('#netflix-source-notes')?.closest('section');
    const premiumCta = host.querySelector('#netflix-premium-route')?.closest('section');
    expect(freePractice).not.toBeNull();
    expect(sourceNotes).not.toBeNull();
    expect(premiumCta).not.toBeNull();
    expect(
      sourceNotes && premiumCta
        ? Boolean(sourceNotes.compareDocumentPosition(premiumCta) & Node.DOCUMENT_POSITION_FOLLOWING)
        : false,
    ).toBeTrue();

    expect(host.querySelector('fa-question-row')).toBeNull();
    expect(host.querySelector('code')).toBeNull();
    expect(text).not.toContain('known questions');
    expect(text).not.toContain('Curry Function');
    expect(text).not.toContain('Toast Notification System');
    expect(host.querySelector('a[href*="/react/coding/react-counter"]')).toBeNull();
  });

  it('links the Netflix guide only to its selected public resources and labelled official context', async () => {
    const fixture = await createComponent('netflix');
    const host: HTMLElement = fixture.nativeElement;
    const hrefs = Array.from(host.querySelectorAll<HTMLAnchorElement>('a')).map((anchor) =>
      anchor.getAttribute('href'),
    );
    const resourcePaths = [
      '/javascript/coding/js-debounce',
      '/javascript/coding/js-take-latest',
      '/react/trivia/react-rerender-decision-and-render',
      '/javascript/trivia/content-delivery-caching-strategies-streaming',
      '/system-design/infinite-scroll-list',
      '/system-design/dashboard-widgets-draggable-resizable',
      '/guides/system-design-blueprint/performance',
      '/guides/behavioral/stories',
    ];

    for (const path of resourcePaths) {
      expect(hrefs).withContext(`public resource ${path}`).toContain(path);
    }

    expect(hrefs).not.toContain('/system-design/netflix-scale-expansion');
    expect(hrefs).toContain('https://jobs.netflix.com/careers/engineering');
    expect(hrefs).toContain('https://jobs.netflix.com/culture');
    expect(hrefs).toContain('https://jobs.netflix.com/careers/new-grads');
    expect(hrefs).toContain('/companies');
    expect(hrefs).toContain('/pricing?src=company_preview_netflix');
  });

  it('renders the official preparation pages table only for companies that publish one', async () => {
    const microsoft = await createComponent('microsoft');
    const microsoftHost: HTMLElement = microsoft.nativeElement;
    const table = microsoftHost.querySelector('[data-testid="company-official-guides"]');
    expect(table).not.toBeNull();
    expect(table?.textContent).toContain('Official preparation pages from Microsoft');
    const links = Array.from(table?.querySelectorAll('tbody a') ?? []) as HTMLAnchorElement[];
    expect(links.map((link) => link.getAttribute('href'))).toContain('https://careers.microsoft.com/v2/global/en/hiring-tips');
    expect(links.every((link) => link.getAttribute('rel') === 'noopener noreferrer')).toBeTrue();
    const ctaIndex = microsoftHost.innerHTML.indexOf('cta-stack');
    expect(microsoftHost.innerHTML.indexOf('company-official-guides')).toBeLessThan(ctaIndex);

    const apple = await createComponent('apple');
    expect((apple.nativeElement as HTMLElement).querySelector('[data-testid="company-official-guides"]')).toBeNull();

    const google = await createComponent('google');
    expect((google.nativeElement as HTMLElement).querySelector('#google-official-guides')?.textContent).toContain('Official preparation pages from Google');
  });

  it('lists sourced items in a public reports block and marks sourced samples, only when reports exist', async () => {
    const reportUrl = 'https://www.teamblind.com/post/bytedance-new-grad-frontend-engineer-interview-breakdown-vqyvjs1l';
    const reported = {
      id: 'js-build-tree-from-flat-list', kind: 'coding' as const, tech: 'javascript' as const, title: 'Build a Tree from a Flat List of Nodes', access: 'free' as const,
      route: '/javascript/coding/js-build-tree-from-flat-list',
      sources: [{ label: 'Blind: ByteDance new grad frontend engineer interview breakdown, January 2023', url: reportUrl, publisher: 'Blind', date: '2023-01' }],
    };
    const fixture = await createComponent('bytedance', {
      slug: 'bytedance', mode: 'catalog', counts: { all: 2, coding: 2, trivia: 0, system: 0 },
      samples: [
        { id: 'js-build-tree-from-flat-list', title: 'Build a Tree from a Flat List of Nodes', kind: 'coding', tech: 'javascript', difficulty: 'intermediate', access: 'free' },
        { id: 'js-lodash-get', title: 'Implement lodash.get', kind: 'coding', tech: 'javascript', difficulty: 'intermediate', access: 'premium' },
      ],
      reports: [reported],
    });
    const host: HTMLElement = fixture.nativeElement;
    const block = host.querySelector('[data-testid="company-public-reports"]');
    expect(block).not.toBeNull();
    expect(block?.textContent).toContain('Practice items with public ByteDance interview accounts');
    const titleLink = block?.querySelector('a.reports-item__title') as HTMLAnchorElement | null;
    expect(titleLink?.getAttribute('href')).toBe('/javascript/coding/js-build-tree-from-flat-list');
    const reportLink = block?.querySelector(`a[href="${reportUrl}"]`);
    expect(reportLink?.getAttribute('rel')).toBe('noopener noreferrer nofollow');
    expect(host.innerHTML.indexOf('company-public-reports')).toBeLessThan(host.innerHTML.indexOf('company-official-guides'));
    const treeRow = host.querySelector('[data-testid="company-preview-question-js-build-tree-from-flat-list"]');
    const getRow = host.querySelector('[data-testid="company-preview-question-js-lodash-get"]');
    expect(treeRow?.textContent).toContain('Public report');
    expect(getRow?.textContent).not.toContain('Public report');

    const plain = await createComponent('microsoft');
    expect((plain.nativeElement as HTMLElement).querySelector('[data-testid="company-public-reports"]')).toBeNull();
  });

  it('frames generic company previews as editorial practice groupings', async () => {
    const fixture = await createComponent('apple');
    const host: HTMLElement = fixture.nativeElement;
    const text = host.textContent || '';
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;

    expect(host.querySelector('[data-testid="company-practice-disclaimer"]')?.textContent?.trim()).toBe(
      'Editorial practice groupings, not verified official interview questions or endorsements.',
    );
    expect(text).toContain('editorial practice prompts');
    expect(text).toContain('Sample FrontendAtlas practice prompts');
    expect(text).not.toContain('known questions');
    expect(payload.description).toContain('FrontendAtlas editorial Apple practice grouping');
    expect(payload.description).toContain('does not claim official question provenance or endorsement');
  });

  it('renders resolved samples immediately and replaces metadata and samples when the company slug changes', async () => {
    await createComponent('microsoft', {
      slug: 'microsoft', mode: 'catalog',
      counts: { all: 2, coding: 1, trivia: 1, system: 0 },
      samples: [
        { id: 'free-prompt', title: 'Free prompt', kind: 'coding', tech: 'react', difficulty: 'easy', access: 'free' },
        { id: 'premium-prompt', title: 'Premium prompt', kind: 'trivia', tech: 'javascript', difficulty: 'hard', access: 'premium' },
      ],
    });
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('[data-testid="company-preview-counts"]')?.textContent).toContain('Coding 1 · Concepts 1 · System 0');
    expect(host.querySelector('[data-testid="company-preview-question-free-prompt"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="company-preview-question-premium-prompt"]')).not.toBeNull();
    expect(host.querySelector('.sample-list a')).toBeNull();
    expect(questionService.loadAllQuestionSummaries).not.toHaveBeenCalled();

    routeData.next({ companyPreview: {
      slug: 'bytedance', mode: 'catalog',
      counts: { all: 1, coding: 1, trivia: 0, system: 0 },
      samples: [{ id: 'feed', title: 'Feed', kind: 'coding', tech: 'react', difficulty: 'easy', access: 'free' }],
    } });
    fixture.detectChanges();

    expect(host.querySelector('h1')?.textContent).toContain('ByteDance');
    expect(host.querySelector('[data-testid="company-preview-question-free-prompt"]')).toBeNull();
    expect(host.querySelector('[data-testid="company-preview-question-feed"]')).not.toBeNull();
    expect(seo.updateTags.calls.mostRecent().args[0]?.canonical).toBe('/companies/bytedance/preview');

    routeData.next({ companyPreview: {
      slug: 'netflix', mode: 'editorial',
      counts: { all: 0, coding: 0, trivia: 0, system: 0 }, samples: [],
    } });
    fixture.detectChanges();
    expect(host.querySelector('h1')?.textContent).toBe('Netflix Frontend Interview Questions');
    expect(host.querySelector('fa-question-row')).toBeNull();
    expect(seo.updateTags.calls.mostRecent().args[0]?.canonical).toBe('/companies/netflix/preview');
  });

  describe('registry-driven authored guides', () => {
    const acme = buildAuthoredCompanyPreviewFixture();
    const registry = { acme };

    it('renders the authored guide with prompts, reported-round links, labelled sources and its premium CTA', async () => {
      await createComponent('acme', undefined, registry);
      const host: HTMLElement = fixture.nativeElement;
      const text = host.textContent || '';

      expect(host.querySelector('[data-testid="authored-company-preview"]')).not.toBeNull();
      expect(host.querySelector('h1')?.textContent?.trim()).toBe('Acme Frontend Interview Questions');
      expect(host.querySelector('.preview-breadcrumb')?.textContent).toContain('Acme Frontend Interview Questions');
      expect(text).toContain(acme.trustNote);
      expect(text).toContain('Prepare for product judgment, not Acme trivia');
      expect(host.querySelector('#acme-study-first')).not.toBeNull();
      expect(host.querySelector('#acme-role-lenses')).not.toBeNull();
      expect(host.querySelector('#acme-walkthrough')).not.toBeNull();
      expect(host.querySelectorAll('article.company-prompt').length).toBe(2);
      expect(host.querySelector('article#acme-tree-filter h3')?.textContent?.trim()).toBe('Filter a tree and render it indented');

      const reported = host.querySelector('[data-testid="company-prompt-reported-round"] a') as HTMLAnchorElement;
      expect(reported.getAttribute('href')).toBe('https://reports.example.com/acme-senior-frontend');
      expect(reported.getAttribute('rel')).toBe('noopener noreferrer nofollow');
      expect(host.querySelectorAll('[data-testid="company-prompt-reported-round"]').length).toBe(1);

      const sourceLinks = Array.from(host.querySelectorAll('.company-source-list a')) as HTMLAnchorElement[];
      expect(sourceLinks.map((link) => link.getAttribute('rel'))).toEqual(['noopener noreferrer nofollow', 'noopener noreferrer']);

      const cta = host.querySelector('.company-guide-cta a') as HTMLAnchorElement;
      expect(cta.textContent?.trim()).toBe('Unlock the full Acme practice set');
      expect(cta.getAttribute('href')).toContain('src=company_preview_acme');

      expect(host.querySelector('[data-testid="company-preview-counts"]')).toBeNull();
      expect(text).not.toContain('Sample FrontendAtlas practice prompts');
      expect(text).not.toContain('known questions');
      expect(questionService.loadAllQuestionSummaries).not.toHaveBeenCalled();
    });

    it('publishes CollectionPage, ItemList and BreadcrumbList metadata for the authored guide', async () => {
      await createComponent('acme', undefined, registry);
      const payload = seo.updateTags.calls.mostRecent().args[0] as any;
      const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
      const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
      const itemList = graph.find((entry: any) => entry?.['@type'] === 'ItemList');
      const breadcrumb = graph.find((entry: any) => entry?.['@type'] === 'BreadcrumbList');

      expect(payload.title).toBe(acme.title);
      expect(payload.description).toBe(acme.description);
      expect(payload.canonical).toBe('/companies/acme/preview');
      expect(payload.robots).toBe('index,follow');
      expect(collection?.url).toBe('https://frontendatlas.com/companies/acme/preview');
      expect(collection?.headline).toBe(acme.h1);
      expect(collection?.disambiguatingDescription).toBe(acme.trustNote);
      expect(collection?.isAccessibleForFree).toBeTrue();
      expect(collection?.about?.map((item: any) => item.name)).toEqual(['Acme frontend interview preparation', 'Streaming UI']);
      expect(collection?.mentions?.length).toBe(2);
      expect(collection?.mainEntity?.['@id']).toBe('https://frontendatlas.com/companies/acme/preview#practice-prompts');
      expect(itemList?.['@id']).toBe('https://frontendatlas.com/companies/acme/preview#practice-prompts');
      expect(itemList?.numberOfItems).toBe(2);
      expect(itemList?.itemListElement?.[0]?.url).toBe('https://frontendatlas.com/companies/acme/preview#acme-tree-filter');
      expect(breadcrumb?.itemListElement?.[2]?.name).toBe(acme.h1);
    });

    it('keeps the catalog preview for slugs outside the registry', async () => {
      await createComponent('apple', undefined, registry);
      const host: HTMLElement = fixture.nativeElement;
      expect(host.querySelector('[data-testid="authored-company-preview"]')).toBeNull();
      expect(host.querySelector('[data-testid="company-preview-counts"]')).not.toBeNull();
      expect(host.textContent || '').toContain('Sample FrontendAtlas practice prompts');
    });
  });
});
