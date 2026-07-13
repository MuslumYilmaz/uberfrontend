import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { QuestionService } from '../../../core/services/question.service';
import { SeoService } from '../../../core/services/seo.service';
import { CompanyPreviewComponent } from './company-preview.component';

describe('CompanyPreviewComponent', () => {
  let fixture: ComponentFixture<CompanyPreviewComponent>;
  let questionService: jasmine.SpyObj<QuestionService>;
  let seo: jasmine.SpyObj<SeoService>;

  async function createComponent(slug: string): Promise<ComponentFixture<CompanyPreviewComponent>> {
    TestBed.resetTestingModule();

    questionService = jasmine.createSpyObj<QuestionService>('QuestionService', [
      'loadAllQuestionSummaries',
      'loadSystemDesign',
    ]);
    questionService.loadAllQuestionSummaries.and.returnValue(of([] as any));
    questionService.loadSystemDesign.and.returnValue(of([] as any));

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
            snapshot: {
              paramMap: convertToParamMap({ slug }),
            },
          },
        },
        { provide: QuestionService, useValue: questionService },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CompanyPreviewComponent);
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
    expect(collection?.dateModified).toBe('2026-07-11T00:00:00.000Z');
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
    expect(text).toContain('Bunlar leaked veya confirmed OpenAI questions değildir; role-relevant representative practice prompts’tur.');
    expect(text).toContain('Unlock the full OpenAI practice set');

    expect(text).not.toContain('Openai');
    expect(text).not.toContain('Chat UI with Streaming Response');
    expect(text).not.toContain('AI Chat Text Area (ChatGPT-Style)');
    expect(text).not.toContain('AI UX Resilience and Control Patterns');
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
    expect(collection?.dateModified).toBe('2026-07-13T00:00:00.000Z');
    expect(collection?.isAccessibleForFree).toBeTrue();
    expect(collection?.mainEntity?.['@id']).toBe(
      'https://frontendatlas.com/companies/google/preview#practice-prompts',
    );
    expect(collection?.mentions?.length).toBe(8);

    expect(itemList?.['@id']).toBe(
      'https://frontendatlas.com/companies/google/preview#practice-prompts',
    );
    expect(itemList?.itemListElement?.length).toBe(7);
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
});
