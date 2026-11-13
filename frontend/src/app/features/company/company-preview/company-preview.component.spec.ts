import { seoContentDateModified } from '../../../core/utils/seo-content-date.util';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Data, Router, RouterLink, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import type { CompanyPlanAnswers } from '../../../core/models/company-plan.model';
import { CompanyPreviewResolved } from '../../../core/models/company-public.model';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { BillingCheckoutService } from '../../../core/services/billing-checkout.service';
import { QuestionService } from '../../../core/services/question.service';
import { SeoService } from '../../../core/services/seo.service';
import type { CompanyPreviewQuestion } from '../../../core/models/company-public.model';
import { countWord } from './company-evidence';
import { COMPANY_SET_COUNTS, PREMIUM_QUESTION_COUNT } from '../company-plan/company-plan-sets';
import type { CompanyPlanData } from '../company-plan/company-plan.engine';
import { companySetLine } from '../company-plan/company-plan.format';
import { CompanyPlanService } from '../company-plan/company-plan.service';
import { CompanyPreviewComponent } from './company-preview.component';
import { FreeUnlockService } from './free-unlock.service';
import { OPENAI_COPY, OPENAI_PRACTICE_PROMPTS, OPENAI_PREVIEW_DESCRIPTION, OPENAI_PREVIEW_TITLE, OPENAI_RESOURCE_LINKS } from './openai-preview-content';
import { GOOGLE_COPY, GOOGLE_PREVIEW_DESCRIPTION, GOOGLE_PREVIEW_TITLE, GOOGLE_RESOURCE_LINKS } from './google-preview-content';
import { NETFLIX_COPY, NETFLIX_PREVIEW_DESCRIPTION, NETFLIX_PREVIEW_TITLE, NETFLIX_RESOURCE_LINKS, NETFLIX_SOURCES, NETFLIX_SOURCE_BOUNDARY } from './netflix-preview-content';
import type { AuthoredCompanyPreview } from '../../../shared/company-previews/authored-company-preview.model';
import { AUTHORED_COMPANY_PREVIEWS, AUTHORED_COMPANY_PREVIEWS_TOKEN } from '../../../shared/company-previews/authored-company-previews';
import { buildAuthoredCompanyPreviewFixture } from '../../../shared/company-previews/authored-company-preview.spec-fixture';
import { COMPANY_EDITORIAL_NOTES, type CompanyEditorialNotesRegistry } from '../../../shared/company-previews/company-editorial-notes';
import { buildCompanyEditorialNotesFixture } from '../../../shared/company-previews/company-editorial-notes.spec-fixture';
import { COMPANY_INTERVIEW_PROCESSES, type CompanyInterviewProcess } from '../../../shared/company-previews/company-interview-processes';
import { summariseQuestionList } from '../../../shared/company-previews/company-question-list';

describe('CompanyPreviewComponent', () => {
  let fixture: ComponentFixture<CompanyPreviewComponent>;
  let questionService: jasmine.SpyObj<QuestionService>;
  let seo: jasmine.SpyObj<SeoService>;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let routeData: BehaviorSubject<Data>;
  const MEMBER = { _id: 'member', role: 'user', accessTier: 'premium' };
  const user = signal<unknown>(null);
  const memberWithPlan = (companyPlan: CompanyPlanAnswers) => ({ ...MEMBER, companyPlan: { ...companyPlan, passedRounds: [], markedDone: [] } });
  const planData = { schemaVersion: 1 } as unknown as CompanyPlanData;
  let plans: { loadData: jasmine.Spy; buildPlan: jasmine.Spy };
  let freeUnlocks: jasmine.SpyObj<FreeUnlockService>;

  /**
   * Every guide now lists its reported questions. A guide without the list still renders the earlier layout (prompt
   * cards, catalog samples, the account gate), so the specs of that layout take a guide's list away for one test.
   */
  const restoreLists: (() => void)[] = [];
  function withoutList(...slugs: string[]): void {
    const processes = COMPANY_INTERVIEW_PROCESSES as Record<string, CompanyInterviewProcess>;
    for (const slug of slugs) {
      const process = processes[slug];
      if (!process?.questions) continue;
      const rest: { -readonly [K in keyof CompanyInterviewProcess]?: CompanyInterviewProcess[K] } = { ...process };
      delete rest.questions;
      delete rest.behaviouralQuestions;
      processes[slug] = rest as CompanyInterviewProcess;
      restoreLists.push(() => { processes[slug] = process; });
    }
  }
  afterEach(() => restoreLists.splice(0).forEach((restore) => restore()));

  /** The plan code arrives through a dynamic import, after the render that asked for it. */
  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  beforeEach(() => {
    user.set(null);
    freeUnlocks = jasmine.createSpyObj<FreeUnlockService>('FreeUnlockService', ['claim', 'rememberIntent', 'takeIntent']);
    freeUnlocks.takeIntent.and.returnValue(null);
    plans = {
      loadData: jasmine.createSpy('loadData').and.returnValue(of(planData)),
      buildPlan: jasmine.createSpy('buildPlan').and.returnValue({ tasks: [{ solved: true }, { solved: false }, { solved: false }, { solved: false }] }),
    };
  });

  async function createComponent(
    slug: string,
    resolved?: CompanyPreviewResolved,
    authored: Record<string, AuthoredCompanyPreview> = AUTHORED_COMPANY_PREVIEWS,
    notes: CompanyEditorialNotesRegistry = {},
    options: { firstRenderOnly?: boolean } = {},
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
      counts: { all: 0, coding: 0, trivia: 0, system: 0, debug: 0 },
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
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);

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
        { provide: AnalyticsService, useValue: analytics },
        { provide: AuthService, useValue: { user } },
        { provide: CompanyPlanService, useValue: plans },
        { provide: AUTHORED_COMPANY_PREVIEWS_TOKEN, useValue: authored },
        { provide: BillingCheckoutService, useValue: { getCheckoutConfig: () => Promise.resolve(null) } },
        { provide: FreeUnlockService, useValue: freeUnlocks },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CompanyPreviewComponent);
    fixture.componentInstance.editorialNotesRegistry = notes;
    fixture.detectChanges();
    // What hydration compares with the prerendered page.
    if (options.firstRenderOnly) return fixture;
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  describe('the inline guides (OpenAI, Google, Netflix) with a reported-question list', () => {
    const INLINE = [
      { slug: 'openai', title: OPENAI_PREVIEW_TITLE, description: OPENAI_PREVIEW_DESCRIPTION, h1: 'OpenAI Frontend Interview Questions', cta: 'Unlock the full OpenAI practice set', copy: OPENAI_COPY.subtitle, links: OPENAI_RESOURCE_LINKS.map((link) => link.path) },
      { slug: 'google', title: GOOGLE_PREVIEW_TITLE, description: GOOGLE_PREVIEW_DESCRIPTION, h1: 'Google Frontend Interview Questions', cta: 'Unlock the full Google practice set', copy: GOOGLE_COPY.caveat, links: GOOGLE_RESOURCE_LINKS.map((link) => link.path) },
      { slug: 'netflix', title: NETFLIX_PREVIEW_TITLE, description: NETFLIX_PREVIEW_DESCRIPTION, h1: 'Netflix Frontend Interview Questions', cta: 'Continue with the full Netflix practice set', copy: NETFLIX_COPY.subtitle, links: NETFLIX_RESOURCE_LINKS.map((link) => link.path) },
    ] as const;
    const host = (): HTMLElement => fixture.nativeElement;
    const total = (slug: string) => COMPANY_INTERVIEW_PROCESSES[slug].questions!.length;

    it('publishes a title and description with the count filled, and no ItemList beside the locked list', async () => {
      for (const guide of INLINE) {
        await createComponent(guide.slug);
        const payload = seo.updateTags.calls.mostRecent().args[0] as any;
        const graph = payload.jsonLd as any[];
        const collection = graph.find((node) => node?.['@type'] === 'CollectionPage');
        expect(payload.title).withContext(guide.slug).toBe(guide.title.replace('{#questions}', String(total(guide.slug))));
        expect(payload.description).withContext(guide.slug).toBe(guide.description.replace('{#questions}', String(total(guide.slug))));
        expect(payload.title + payload.description).withContext(guide.slug).not.toContain('{');
        expect(payload.canonical).withContext(guide.slug).toBe(`/companies/${guide.slug}/preview`);
        expect(payload.robots).withContext(guide.slug).toBe('index,follow');
        expect(collection.dateModified).withContext(guide.slug).toBe(seoContentDateModified(collection.url));
        expect(collection.isAccessibleForFree).withContext(guide.slug).toBeFalse();
        expect(collection.hasPart).withContext(guide.slug).toEqual([{ '@type': 'WebPageElement', isAccessibleForFree: false, cssSelector: '.premium-locked' }]);
        expect(collection.mainEntity).withContext(guide.slug).toBeUndefined();
        expect(graph.some((node) => node?.['@type'] === 'ItemList')).withContext(guide.slug).toBeFalse();
        expect(graph.find((node) => node?.['@type'] === 'BreadcrumbList')?.itemListElement?.[2]?.name).withContext(guide.slug).toBe(guide.h1);
      }
      expect(questionService.loadAllQuestionSummaries).not.toHaveBeenCalled();
    });

    it('renders the question list in place of the prompt cards, with the copy, trust note and closing call of each guide', async () => {
      for (const guide of INLINE) {
        await createComponent(guide.slug);
        const text = host().textContent ?? '';
        expect(host().querySelector('h1')?.textContent?.trim()).withContext(guide.slug).toBe(guide.h1);
        expect(host().querySelectorAll('.company-prompt, .openai-prompt').length).withContext(guide.slug).toBe(0);
        const rows = host().querySelectorAll('[data-testid="company-question-row"]');
        expect(rows.length).withContext(guide.slug).toBe(total(guide.slug));
        // The first row is open, with its answer guide; the others name their topic over a locked question.
        expect(rows[0].querySelector('.cq-row__question.premium-locked')).withContext(guide.slug).toBeNull();
        expect(rows[1].querySelector('[data-testid="company-question-topic"]')?.textContent?.trim()).withContext(guide.slug)
          .toBe(COMPANY_INTERVIEW_PROCESSES[guide.slug].questions![1].topic);
        expect(text).withContext(guide.slug).toContain(guide.copy);
        expect(text).withContext(guide.slug).toContain(guide.cta);
        expect(text).withContext(guide.slug).toContain(`${total(guide.slug)} reported questions`);
        expect(text).withContext(guide.slug).not.toContain('{');
        expect(text).withContext(guide.slug).not.toContain('representative prompts');
        expect(host().querySelector('[data-testid="company-practice-disclaimer"]')).withContext(guide.slug).not.toBeNull();
        // The sources close the page, behind one toggle; no source is linked above them.
        expect(host().querySelector('[data-testid="company-guide-sources"]')).withContext(guide.slug).not.toBeNull();
      }
      expect(host().textContent).not.toContain('Openai');
    });

    it('keeps the free practice links of each guide on the page', async () => {
      for (const guide of INLINE) {
        await createComponent(guide.slug);
        const hrefs = Array.from(host().querySelectorAll<HTMLAnchorElement>('a')).map((anchor) => anchor.getAttribute('href'));
        for (const path of guide.links) expect(hrefs).withContext(guide.slug).toContain(path);
      }
    });

    it('gives the open OpenAI row an answer guide from its prompt intent and rubric, without empty parts', async () => {
      await createComponent('openai');
      const first = host().querySelector('[data-testid="company-question-row"]') as HTMLElement;
      const prompt = OPENAI_PRACTICE_PROMPTS.find((item) => item.id === COMPANY_INTERVIEW_PROCESSES['openai'].questions![0].answerGuide)!;
      const reported = COMPANY_INTERVIEW_PROCESSES['openai'].questions![0];
      expect(first.querySelector('.cq-row__title')?.textContent?.trim()).toBe(reported.topic);
      expect(first.querySelector('[data-testid="company-question-reported"]')?.textContent?.trim()).toBe(reported.question);
      expect(first.querySelector('[data-testid="company-question-guide-title"]')?.textContent?.trim()).toBe(`Answer guide: ${prompt.title}`);
      expect(first.textContent).toContain(prompt.intent);
      expect(first.textContent).not.toContain('What this measures');
      expect(first.textContent).not.toContain('Common miss');
    });

    it('lists the Netflix sources first in the closing list, then those of the table and the questions, once each', async () => {
      await createComponent('netflix');
      const list = host().querySelector('[data-testid="company-guide-sources"]') as HTMLElement;
      const labels = Array.from(list.querySelectorAll('.guide-sources__list li')).map((item) => item.textContent ?? '');
      NETFLIX_SOURCES.forEach((source, index) => expect(labels[index]).withContext(source.url).toContain(source.label));
      expect(list.textContent).toContain(NETFLIX_SOURCE_BOUNDARY.title);
      const urls = Array.from(list.querySelectorAll('.guide-sources__list li a')).map((anchor) => anchor.getAttribute('href'));
      expect(new Set(urls).size).toBe(urls.length);
    });
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
      // The sample section follows the prep steps; the generic free/Premium boxes between them are gone.
      const samples = host.querySelector('.sample-card') as HTMLElement;
      expect(host.querySelector('.proof-grid')).toBeNull();
      expect(order[2].compareDocumentPosition(samples) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(host.querySelector('#acme-reports-describe')?.textContent?.trim()).toBe(acme.reportsDescribe?.title);
      expect(host.querySelector('[data-testid="company-reports-describe"] a[href="#acme-interview-process"]')).not.toBeNull();
      expect(host.querySelector('[data-testid="company-reports-describe"] a[href="/react/coding/react-counter"]')).not.toBeNull();
      const steps = Array.from(host.querySelectorAll('[data-testid="company-prep-steps"] ol > li'));
      expect(steps.map((step) => step.querySelector('strong')?.textContent?.trim())).toEqual(['Free now', 'Premium']);
      // The Premium step keeps its words under the blur but no link to the Premium page.
      expect(steps[1].querySelector('a')).toBeNull();
      expect(steps[1].querySelector('.company-resource-link')?.textContent?.trim()).toBeTruthy();
      expect(host.querySelectorAll('[data-testid="company-editorial-faqs"] article h3').length).toBe(2);
      expect(host.querySelector('[data-testid="company-preview-counts"]')).not.toBeNull();
      expect(text).not.toContain('known questions');
    });

    it('renders round spotlights between the reports section and the prep steps when the notes define them', async () => {
      const notes = buildCompanyEditorialNotesFixture({
        roundSpotlights: [
          {
            id: 'coderpad-screen',
            kicker: 'Round decoder',
            title: 'Acme CoderPad screen: what it is and what was asked',
            lede: ['A 60-minute screen on CoderPad with one engineer.'],
            facts: [{ label: 'Length and tool', value: '60 minutes on CoderPad.' }],
            practiceLink: { label: 'Rehearse the screen', path: '/react/coding/react-counter' },
            processLink: { label: 'See the screen row', fragment: 'acme-interview-process' },
          },
        ],
      });
      const fixture = await createComponent('acme', undefined, AUTHORED_COMPANY_PREVIEWS, { acme: notes });
      const host: HTMLElement = fixture.nativeElement;
      const spotlight = host.querySelector('[data-testid="company-round-spotlight"]') as HTMLElement;
      expect(spotlight).not.toBeNull();
      expect(spotlight.querySelector('#acme-round-coderpad-screen')?.textContent?.trim()).toBe('Acme CoderPad screen: what it is and what was asked');
      expect(spotlight.querySelector('a[href="#acme-interview-process"]')?.textContent?.trim()).toBe('See the screen row');
      expect(spotlight.querySelector('a[href="/react/coding/react-counter"]')?.textContent?.trim()).toBe('Rehearse the screen');
      expect(spotlight.querySelectorAll('a').length).toBe(2);
      const reports = host.querySelector('[data-testid="company-reports-describe"]') as HTMLElement;
      const prep = host.querySelector('[data-testid="company-prep-steps"]') as HTMLElement;
      expect(reports.compareDocumentPosition(spotlight) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(spotlight.compareDocumentPosition(prep) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
      // The fixture's prep steps include a Premium task, whose name a visitor reads only under a blur.
      expect(collection?.isAccessibleForFree).toBeFalse();
      expect(collection?.hasPart?.[0]?.cssSelector).toBe('.premium-locked');
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

  it('sends its task links with the way back, so a locked task page can return to the guide', async () => {
    const authored = buildAuthoredCompanyPreviewFixture();
    const fixture = await createComponent(authored.slug, undefined, { [authored.slug]: authored });
    const component = fixture.componentInstance;
    expect(component.returnState).toEqual({
      returnToUrl: `/companies/${authored.slug}/preview`,
      returnLabel: `Back to the ${component.label} guide`,
    });
    const promptLinks = fixture.debugElement.queryAll(By.directive(RouterLink))
      .filter((link) => (link.nativeElement as HTMLElement).closest('.company-prompt__link-row'));
    expect(promptLinks.length).toBeGreaterThan(0);
    for (const link of promptLinks) expect(link.injector.get(RouterLink).state).toEqual(component.returnState);
    // The state travels in the navigation, never in the address.
    expect(promptLinks.every((link) => !(link.nativeElement as HTMLAnchorElement).getAttribute('href')?.includes('?'))).toBeTrue();
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
    const appleTable = (apple.nativeElement as HTMLElement).querySelector('[data-testid="company-official-guides"]');
    expect(appleTable?.textContent).toContain('Official preparation pages from Apple');

    const tesla = await createComponent('tesla');
    expect((tesla.nativeElement as HTMLElement).querySelector('[data-testid="company-official-guides"]')).toBeNull();

    const google = await createComponent('google');
    expect((google.nativeElement as HTMLElement).querySelector('#google-official-guides')?.textContent).toContain('Official preparation pages from Google');
  });

  it('lists sourced items in a public reports block and marks sourced samples, only when reports exist', async () => {
    withoutList('microsoft', 'bytedance');
    const reportUrl = 'https://www.teamblind.com/post/bytedance-new-grad-frontend-engineer-interview-breakdown-vqyvjs1l';
    const reported = {
      id: 'js-build-tree-from-flat-list', kind: 'coding' as const, tech: 'javascript' as const, title: 'Build a Tree from a Flat List of Nodes', access: 'free' as const,
      route: '/javascript/coding/js-build-tree-from-flat-list',
      sources: [{ label: 'Blind: ByteDance new grad frontend engineer interview breakdown, January 2023', url: reportUrl, publisher: 'Blind', date: '2023-01' }],
    };
    const fixture = await createComponent('bytedance', {
      slug: 'bytedance', mode: 'catalog', counts: { all: 2, coding: 2, trivia: 0, system: 0, debug: 0 },
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
    withoutList('apple');
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
    withoutList('microsoft', 'bytedance');
    await createComponent('microsoft', {
      slug: 'microsoft', mode: 'catalog',
      counts: { all: 2, coding: 1, trivia: 1, system: 0, debug: 0 },
      samples: [
        { id: 'free-prompt', title: 'Free prompt', kind: 'coding', tech: 'react', difficulty: 'easy', access: 'free' },
        { id: 'premium-prompt', title: 'Premium prompt', kind: 'trivia', tech: 'javascript', difficulty: 'hard', access: 'premium' },
      ],
    });
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('[data-testid="company-preview-counts"]')?.textContent?.trim()).toBe('Coding 1 · Concepts 1');
    expect(host.querySelector('[data-testid="company-preview-question-free-prompt"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="company-preview-question-premium-prompt"]')).not.toBeNull();
    expect(host.querySelector('.sample-list a')).toBeNull();
    expect(questionService.loadAllQuestionSummaries).not.toHaveBeenCalled();

    routeData.next({ companyPreview: {
      slug: 'bytedance', mode: 'catalog',
      counts: { all: 1, coding: 1, trivia: 0, system: 0, debug: 0 },
      samples: [{ id: 'feed', title: 'Feed', kind: 'coding', tech: 'react', difficulty: 'easy', access: 'free' }],
    } });
    fixture.detectChanges();

    expect(host.querySelector('h1')?.textContent).toContain('ByteDance');
    expect(host.querySelector('[data-testid="company-preview-question-free-prompt"]')).toBeNull();
    expect(host.querySelector('[data-testid="company-preview-question-feed"]')).not.toBeNull();
    expect(seo.updateTags.calls.mostRecent().args[0]?.canonical).toBe('/companies/bytedance/preview');

    routeData.next({ companyPreview: {
      slug: 'netflix', mode: 'editorial',
      counts: { all: 0, coding: 0, trivia: 0, system: 0, debug: 0 }, samples: [],
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
      const spotlight = host.querySelector('[data-testid="company-round-spotlight"]') as HTMLElement;
      expect(spotlight).not.toBeNull();
      expect(spotlight.querySelector('#acme-round-pairing-hour')?.textContent?.trim()).toBe('Acme pairing hour: what it is and what was asked');
      expect(spotlight.querySelectorAll('dl.company-round-facts dt').length).toBe(1);
      expect(spotlight.querySelector('a[href="#acme-tree-filter"]')?.textContent?.trim()).toBe('Rehearse the pairing hour');
      expect(spotlight.querySelector('a[href="#acme-interview-process-1-stage-pairing-hour"]')).not.toBeNull();
      const lenses = host.querySelector('#acme-role-lenses') as HTMLElement;
      expect(spotlight.compareDocumentPosition(lenses) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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

    it('fills the count tokens from the page evidence, in the text and in the metadata', async () => {
      const tokened: AuthoredCompanyPreview = {
        ...acme,
        description: 'Prepare with {#prompts} practice prompts from {reports} public account.',
        hero: { ...acme.hero, subtitle: 'Prepare with {prompts} practice prompts shaped by {reports} public account and {official} official page.', chips: ['{#prompts} practice prompts'] },
        sourceBoundary: { ...acme.sourceBoundary, paragraphs: ['{reports} self-reported account informs this guide; {sources} sources in all.'] },
      };
      await createComponent('acme', undefined, { acme: tokened });
      const host: HTMLElement = fixture.nativeElement;
      expect(host.querySelector('.preview-subtitle')?.textContent?.trim()).toBe('Prepare with two practice prompts shaped by one public account and one official page.');
      expect(host.querySelector('.preview-chip')?.textContent?.trim()).toBe('2 practice prompts');
      expect(host.textContent).toContain('One self-reported account informs this guide; two sources in all.');
      expect(host.textContent).not.toContain('{');
      const payload = seo.updateTags.calls.mostRecent().args[0] as any;
      expect(payload.description).toBe('Prepare with 2 practice prompts from one public account.');
    });

    it('lists the sources the process table cites after the guide sources, and counts them all in the gates', async () => {
      withoutList('shopee');
      await createComponent('shopee');
      const host: HTMLElement = fixture.nativeElement;
      const rows = Array.from(host.querySelectorAll('.company-source-list article'));
      const guideRows = AUTHORED_COMPANY_PREVIEWS['shopee'].sources.items.length;
      expect(rows.length).toBeGreaterThan(guideRows);
      expect(rows[guideRows].querySelector('p')?.textContent).toMatch(/read for the process table, where it describes the /);
      // The cited-only sources wait behind one closed line with their count; the guide's own notes stay open.
      const more = host.querySelector('[data-testid="company-sources-more"]') as HTMLDetailsElement;
      expect(more.open).toBeFalse();
      expect(more.querySelector('summary')?.textContent?.trim()).toBe(`Show the ${rows.length - guideRows} sources cited only on the process table`);
      expect(more.querySelectorAll('article').length).toBe(rows.length - guideRows);
      expect(host.querySelectorAll('.company-faq-item').length).toBeGreaterThan(0);
      expect((host.querySelector('.company-faq-item') as HTMLDetailsElement).open).toBeFalse();
      expect(new Set(rows.map((row) => row.querySelector('a')?.getAttribute('href'))).size).toBe(rows.length);
      expect(host.querySelector('.preview-subtitle')?.textContent).not.toContain('{');
      const reports = rows.filter((row) => row.querySelector('a')?.getAttribute('rel')?.includes('nofollow')).length;
      const word = countWord(reports);
      expect(host.textContent).toContain(`${word.charAt(0).toUpperCase()}${word.slice(1)} public accounts sit behind this guide`);
    });

    it('keeps the source notes in the page but closed, and puts the round decoders after the prompts', async () => {
      await createComponent('acme', undefined, registry);
      const host: HTMLElement = fixture.nativeElement;
      const details = host.querySelector('.company-process-note details') as HTMLDetailsElement;
      expect(details).not.toBeNull();
      expect(details.open).toBeFalse();
      expect(details.querySelector('summary')?.textContent).toContain('Show the source notes');
      expect(details.textContent).toContain(acme.sourceBoundary.paragraphs[0]);
      expect(host.querySelector('#acme-published-context')?.closest('details')).toBeNull();

      // The fixture has no process table; the prompts come first, then the decoder, then the study notes.
      const prompts = host.querySelector('#acme-practice-prompts')?.closest('section') as HTMLElement;
      const spotlight = host.querySelector('[data-testid="company-round-spotlight"]') as HTMLElement;
      const study = host.querySelector('#acme-study-first')?.closest('section') as HTMLElement;
      expect(prompts.compareDocumentPosition(spotlight) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(spotlight.compareDocumentPosition(study) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
      withoutList('apple');
      await createComponent('apple', undefined, registry);
      const host: HTMLElement = fixture.nativeElement;
      expect(host.querySelector('[data-testid="authored-company-preview"]')).toBeNull();
      expect(host.querySelector('[data-testid="company-preview-counts"]')).not.toBeNull();
      expect(host.textContent || '').toContain('Sample FrontendAtlas practice prompts');
    });
  });

  describe('the way into a plan', () => {
    const planHref = (slug: string) => `/companies?company=${slug}`;
    const weekLinks = (host: HTMLElement) =>
      Array.from(host.querySelectorAll<HTMLAnchorElement>('.company-plan-link a')).map((link) => link.getAttribute('href'));

    it('opens the plan form from a card above the guide and from under each week plan', async () => {
      for (const [slug, week] of [['elevenlabs', 'elevenlabs-prep-plan'], ['google', 'google-prep-plan'], ['netflix', 'netflix-prep-plan'], ['openai', 'openai-prep-sequence']]) {
        await createComponent(slug);
        const host: HTMLElement = fixture.nativeElement;
        const card = host.querySelector('[data-testid="company-plan-entry"]') as HTMLElement;
        const link = card.querySelector('a') as HTMLAnchorElement;
        expect(link.getAttribute('href')).withContext(slug).toBe(planHref(slug));
        expect(link.textContent).withContext(slug).toContain(`Build my ${fixture.componentInstance.label} plan`);
        expect(card.compareDocumentPosition(host.querySelector('h1')!) & Node.DOCUMENT_POSITION_FOLLOWING).withContext(slug).toBeTruthy();
        expect(host.querySelector(`#${week}`)?.closest('section')?.querySelector('.company-plan-link a')?.getAttribute('href'))
          .withContext(slug).toBe(planHref(slug));
        expect(weekLinks(host)).withContext(slug).toEqual([planHref(slug)]);
      }
    });

    it('writes a catalog guide with a hyphen into its links the way the authored guides do', async () => {
      await createComponent('booking-com');
      const sources = Array.from(fixture.nativeElement.querySelectorAll('.cta-stack a') as NodeListOf<HTMLAnchorElement>)
        .map((link) => new URL(link.href).searchParams.get('src'));
      expect(sources).toEqual(['company_preview_booking_com', 'company_preview_booking_com']);
    });

    it('keeps the card on a guide without a week plan, and shows neither where no plan data exists', async () => {
      await createComponent('apple');
      let host: HTMLElement = fixture.nativeElement;
      expect(host.querySelector('[data-testid="company-plan-entry"] a')?.getAttribute('href')).toBe(planHref('apple'));
      expect(weekLinks(host)).toEqual([]);

      await createComponent('acme', undefined, { acme: buildAuthoredCompanyPreviewFixture() });
      host = fixture.nativeElement;
      expect(host.querySelector('[data-testid="authored-company-preview"]')).not.toBeNull();
      expect(host.querySelector('[data-testid="company-plan-entry"]')).toBeNull();
      expect(weekLinks(host)).toEqual([]);
    });

    it('counts a followed link by where it sits and where it goes, but not a jump within the page', async () => {
      withoutList('crowdstrike');
      // CrowdStrike keeps the layout without a question list until batch 3: its sources sit in their own section.
      await createComponent('crowdstrike');
      const host: HTMLElement = fixture.nativeElement;
      spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
      const follow = (selector: string): HTMLAnchorElement => {
        const link = host.querySelector<HTMLAnchorElement>(selector);
        if (!link) throw new Error(`Missing ${selector}`);
        // Keeps the test page where it is; the click still bubbles to the guide.
        link.addEventListener('click', (event) => event.preventDefault());
        link.click();
        return link;
      };

      follow('[data-testid="company-plan-entry"] a');
      follow('.company-plan-link a');
      follow('.company-guide-cta a');
      const source = follow('.company-source-list a');
      follow('.company-round-links a[href^="#"]');

      expect(analytics.track.calls.allArgs()).toEqual([
        ['company_guide_link_clicked', { surface: 'plan_card', target_path: '/companies' }],
        ['company_guide_link_clicked', { surface: 'plan_link', target_path: '/companies' }],
        ['company_guide_link_clicked', { surface: 'closing_cta', target_path: '/pricing' }],
        ['company_guide_link_clicked', { surface: 'sources', target_path: new URL(source.href).origin }],
      ]);
    });

    const card = () => {
      const entry = fixture.nativeElement.querySelector('[data-testid="company-plan-entry"]') as HTMLElement;
      return {
        title: entry.querySelector('.company-plan-entry__title')?.textContent,
        line: entry.querySelector('.company-plan-entry__line')?.textContent,
        button: entry.querySelector('a')?.textContent?.trim(),
        href: entry.querySelector('a')?.getAttribute('href'),
      };
    };

    it('leads a Premium member back to a plan that covers the company, with what is solved once the plan code arrives', async () => {
      const answers: CompanyPlanAnswers = { companies: [{ slug: 'elevenlabs' }], when: 'this-week', level: 'mid' };
      user.set(memberWithPlan(answers));
      await createComponent('elevenlabs');
      await settle();

      expect(card()).toEqual({
        title: 'Continue your ElevenLabs plan',
        line: 'This week · Mid-level · 1 of 4 solved',
        button: 'Open my plan →',
        href: '/companies/plan',
      });
      expect(plans.loadData).toHaveBeenCalledTimes(1);
      expect(plans.buildPlan).toHaveBeenCalledWith(planData, answers);
    });

    it('names every company of the plan, and leaves out the count when the plan data cannot load', async () => {
      user.set(memberWithPlan({ companies: [{ slug: 'agoda' }, { slug: 'booking-com' }], when: 'later', level: 'staff' }));
      plans.loadData.and.returnValue(of(null));
      await createComponent('booking-com');
      await settle();

      expect(card().title).toBe('Continue your Agoda and Booking.com plan');
      expect(card().line).toBe('Later or no date · Staff');
    });

    it('tells a Premium member whose plan is elsewhere that a plan here opens at once, without loading plan code', async () => {
      user.set(memberWithPlan({ companies: [{ slug: 'amazon' }], when: 'later', level: 'senior' }));
      await createComponent('elevenlabs');
      await settle();

      expect(card()).toEqual({
        title: 'Interviewing at ElevenLabs?',
        line: 'Pick your interview date and level. With Premium, your plan opens right away.',
        button: 'Build my ElevenLabs plan →',
        href: planHref('elevenlabs'),
      });
      expect(plans.loadData).not.toHaveBeenCalled();
    });

    it('loads no plan code for a visitor or a free account, whatever plan the account holds', async () => {
      user.set({ ...memberWithPlan({ companies: [{ slug: 'elevenlabs' }], when: 'later', level: 'senior' }), accessTier: 'free' });
      await createComponent('elevenlabs');
      await settle();

      expect(card().title).toBe('Interviewing at ElevenLabs?');
      expect(card().line).toBe('Pick your interview date and level, then see the rounds candidates reported and try the first tasks for free.');
      expect(plans.loadData).not.toHaveBeenCalled();
    });

    it('draws the first render as every visitor sees it, so hydration finds the prerendered guide', async () => {
      user.set(memberWithPlan({ companies: [{ slug: 'elevenlabs' }], when: 'this-week', level: 'mid' }));
      await createComponent('elevenlabs', undefined, AUTHORED_COMPANY_PREVIEWS, {}, { firstRenderOnly: true });
      const host: HTMLElement = fixture.nativeElement;
      expect(host.querySelector('.company-plan-entry__title')?.textContent).toBe('Interviewing at ElevenLabs?');
      expect(host.querySelector('.company-preview--member')).toBeNull();
      expect(plans.loadData).not.toHaveBeenCalled();

      await fixture.whenStable();
      fixture.detectChanges();
      expect(host.querySelector('.company-plan-entry__title')?.textContent).toBe('Continue your ElevenLabs plan');
      expect(host.querySelector('.company-preview--member')).not.toBeNull();
    });
  });

  describe('the prompts a visitor reads before Premium', () => {
    const prompts = (host: HTMLElement) => Array.from(host.querySelectorAll<HTMLElement>('.company-prompt, .openai-prompt'));
    // ServiceNow's prompts, cut or padded, on its guide without the question list, stand in for each prompt count.
    const withPrompts = (count: number) => {
      const servicenow = AUTHORED_COMPANY_PREVIEWS['servicenow'];
      const items = servicenow.prompts.items;
      return {
        ...AUTHORED_COMPANY_PREVIEWS,
        servicenow: {
          ...servicenow,
          prompts: { ...servicenow.prompts, items: Array.from({ length: count }, (_, index) => ({ ...items[index % items.length], id: `prompt-${index}` })) },
        },
      };
    };
    const gate = () => {
      const card = fixture.nativeElement.querySelector('[data-testid="company-prompt-gate"]') as HTMLElement | null;
      return card && {
        title: card.querySelector('.company-prompt-gate__title')?.textContent,
        line: card.querySelector('.company-prompt-gate__line')?.textContent,
        button: card.querySelector('a')?.textContent?.trim(),
        href: card.querySelector('a')?.getAttribute('href'),
      };
    };

    it('opens the first three prompts and keeps the details of the rest under a blur, with their title and opening still readable', async () => {
      withoutList('servicenow');
      await createComponent('servicenow');
      const host: HTMLElement = fixture.nativeElement;
      const cards = prompts(host);
      expect(cards.length).toBeGreaterThan(3);
      cards.forEach((card, index) => {
        const details = card.querySelector('.company-prompt__details') as HTMLElement;
        const locked = index >= 3;
        expect(card.classList.contains('company-prompt--locked')).withContext(`prompt ${index + 1}`).toBe(locked);
        expect(details.classList.contains('company-prompt__locked')).withContext(`prompt ${index + 1}`).toBe(locked);
        expect(details.getAttribute('aria-hidden')).withContext(`prompt ${index + 1}`).toBe(locked ? 'true' : null);
        expect(details.hasAttribute('inert')).withContext(`prompt ${index + 1}`).toBe(locked);
        expect(card.querySelector('h3')?.textContent?.trim()).withContext(`prompt ${index + 1}`).toBeTruthy();
        expect(card.querySelector('.company-prompt__statement')?.textContent?.trim()).withContext(`prompt ${index + 1}`).toBeTruthy();
      });
      // The locked details stay in the page, so search engines read what the structured data marks as Premium.
      expect(cards[3].querySelector('.company-prompt__details')?.textContent).toContain('Strong answer should cover');
    });

    it('keeps a free practice link readable under a locked prompt, and blurs only the name of a Premium one', async () => {
      withoutList('crowdstrike');
      await createComponent('crowdstrike');
      const cards = prompts(fixture.nativeElement);
      const link = (index: number) => cards[index].querySelector('.company-resource-link--inline') as HTMLElement;
      // Prompts 4 and 5 lead to free pages, prompt 1 to a Premium page.
      expect(link(3).classList).not.toContain('company-link--locked');
      expect(link(3).hasAttribute('inert')).toBeFalse();
      expect(link(3).closest('.company-prompt__details')).toBeNull();
      expect(link(3).textContent?.trim()).toBe('Study DOM XSS sinks and safe APIs (free)');
      expect(link(0).classList).toContain('company-link--premium');
      expect(link(0).hasAttribute('inert')).toBeFalse();
      expect(link(0).querySelector('.company-link__label')?.textContent).toBe('Premium task for this prompt');
      expect(link(0).querySelector('.premium-locked')?.hasAttribute('data-nosnippet')).toBeTrue();
      // Outside the gate, a locked prompt's free statement is never clipped.
      expect(cards[3].querySelector('.company-prompt__statement')?.classList).not.toContain('company-prompt__statement--locked');
    });

    it('names the locked prompts in a card right after the third one, leading into the plan', async () => {
      withoutList('servicenow');
      await createComponent('servicenow', undefined, withPrompts(5));
      const host: HTMLElement = fixture.nativeElement;
      const cards = prompts(host);
      const card = host.querySelector('[data-testid="company-prompt-gate"]') as HTMLElement;
      expect(cards.length).toBe(5);
      expect(cards[2].nextElementSibling).toBe(card);
      expect(gate()).toEqual({
        title: 'The answer guides for prompts 4 and 5 are in Premium',
        line: 'Premium opens their answer guides and the full ServiceNow practice set. Your plan shows what opens for your date, and the price.',
        button: 'Build my ServiceNow plan →',
        href: '/companies?company=servicenow',
      });
    });

    it('words the card for one, two or more locked prompts', async () => {
      withoutList('servicenow');
      await createComponent('servicenow', undefined, withPrompts(7));
      expect(gate()?.title).toBe('The answer guides for prompts 4 to 7 are in Premium');
      await createComponent('servicenow', undefined, withPrompts(4));
      expect(prompts(fixture.nativeElement).length).toBe(4);
      expect(gate()?.title).toBe('The answer guide for prompt 4 is in Premium');
      await createComponent('servicenow', undefined, withPrompts(5));
      expect(gate()?.title).toBe('The answer guides for prompts 4 and 5 are in Premium');
    });

    it('tells search engines which part of each guide with locked prompts needs Premium', async () => {
      for (const slug of ['elevenlabs', 'google', 'netflix', 'openai']) {
        await createComponent(slug);
        const graph = (seo.updateTags.calls.mostRecent().args[0] as any).jsonLd as any[];
        const collection = graph.find((node) => node?.['@type'] === 'CollectionPage');
        expect(collection.isAccessibleForFree).withContext(slug).toBeFalse();
        expect(collection.hasPart).withContext(slug).toEqual([{ '@type': 'WebPageElement', isAccessibleForFree: false, cssSelector: '.premium-locked' }]);
        expect(fixture.nativeElement.querySelectorAll('.premium-locked').length).withContext(slug).toBeGreaterThan(0);
      }
    });

    it('counts a click on the card as its own surface', async () => {
      withoutList('servicenow', 'airbnb');
      await createComponent('servicenow');
      spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
      const link = fixture.nativeElement.querySelector('[data-testid="company-prompt-gate"] a') as HTMLAnchorElement;
      link.addEventListener('click', (event) => event.preventDefault());
      link.click();
      expect(analytics.track).toHaveBeenCalledOnceWith('company_guide_link_clicked', { surface: 'prompt_gate', target_path: '/companies' });
    });
  });

  describe('the names of Premium questions', () => {
    const AIRBNB: CompanyPreviewResolved = {
      slug: 'airbnb', mode: 'catalog', counts: { all: 3, coding: 1, trivia: 2, system: 0, debug: 0 },
      samples: [
        { id: 'js-closures', title: 'Explain Closures in JavaScript', kind: 'trivia', tech: 'javascript', difficulty: 'intermediate', access: 'free' },
        { id: 'react-chips-input-autocomplete', title: 'Invite Chips Input (Tags + Autocomplete)', kind: 'coding', tech: 'react', difficulty: 'intermediate', access: 'premium' },
      ],
      reports: [{
        id: 'react-chips-input-autocomplete', kind: 'coding', tech: 'react', title: 'Invite Chips Input (Tags + Autocomplete)', access: 'premium',
        route: '/react/coding/react-chips-input-autocomplete',
        sources: [{ label: 'Blind: Airbnb frontend loop, 2025', url: 'https://www.teamblind.com/post/airbnb-frontend', publisher: 'Blind', date: '2025-03' }],
      }],
    };
    const host = () => fixture.nativeElement as HTMLElement;
    const row = (id: string) => host().querySelector(`[data-testid="company-preview-question-${id}"]`) as HTMLElement;
    const lockedSteps = () => Array.from(host().querySelectorAll('[data-testid="company-prep-steps"] li > div'))
      .map((step) => [step.querySelector('.company-resource-link')?.textContent?.trim(), step.classList.contains('company-locked'), step.hasAttribute('inert')]);

    it('keeps a visitor from reading Premium names in a catalog guide, with free ones, chips and the process open', async () => {
      withoutList('airbnb');
      await createComponent('airbnb', AIRBNB, AUTHORED_COMPANY_PREVIEWS, COMPANY_EDITORIAL_NOTES);

      const paidTitle = row('react-chips-input-autocomplete').querySelector('.fa-question-row__title') as HTMLElement;
      expect(paidTitle.classList).toContain('fa-question-row__concealed');
      expect(paidTitle.hasAttribute('data-nosnippet')).toBeTrue();
      expect(row('react-chips-input-autocomplete').textContent).toContain('Premium');
      expect(row('js-closures').querySelector('.fa-question-row__concealed')).toBeNull();

      expect(lockedSteps()).toContain(['React autocomplete search', false, false]);
      expect(lockedSteps()).toContain(['React tic-tac-toe', true, true]);
      // A blurred step carries no link: the Premium page's address is not in the row.
      expect(host().querySelector('[data-testid="company-prep-steps"] li > div.company-locked a')).toBeNull();
      expect(host().querySelector('[data-testid="company-prep-steps"] li > div:not(.company-locked) a')).not.toBeNull();

      const report = host().querySelector('[data-testid="company-report-react-chips-input-autocomplete"] .reports-item__title') as HTMLElement;
      expect(report.classList).toContain('company-link--locked');
      expect(report.hasAttribute('inert')).toBeTrue();

      // The real Airbnb table: the UI coding row links a Premium page, the technical screen a free one.
      const process = host().querySelector('app-company-interview-process') as HTMLElement;
      expect(process.querySelectorAll('.interview-process__locked').length).toBe(1);
      expect(process.textContent).toContain('React autocomplete search');

      const gate = host().querySelector('[data-testid="company-sample-gate"]') as HTMLElement;
      expect(gate.querySelector('.company-prompt-gate__title')?.textContent).toBe('The locked questions open with Premium');
      expect(gate.querySelector('.company-prompt-gate__line')?.textContent).toBe(`Premium opens them, and all ${PREMIUM_QUESTION_COUNT} Premium questions in the library.`);
      expect(gate.querySelector('a')?.getAttribute('href')).toBe('/companies?company=airbnb');

      const graph = (seo.updateTags.calls.mostRecent().args[0] as any).jsonLd as any[];
      const collection = graph.find((node) => node?.['@type'] === 'CollectionPage');
      expect(collection.isAccessibleForFree).toBeFalse();
      expect(collection.hasPart?.[0]?.cssSelector).toBe('.premium-locked');
    });

    it('shows a member every name in a catalog guide, with no card asking to unlock them', async () => {
      user.set(MEMBER);
      await createComponent('airbnb', AIRBNB, AUTHORED_COMPANY_PREVIEWS, COMPANY_EDITORIAL_NOTES);
      expect(host().querySelectorAll('.fa-question-row__concealed, .company-locked, .company-link--locked, .interview-process__locked').length).toBe(0);
      expect(host().querySelectorAll('[inert]').length).toBe(0);
      expect(host().querySelector('[data-testid="company-sample-gate"]')).toBeNull();
    });

    it('renders catalog notes whose bullets carry no link, and labels only the blurred links as Premium tasks', async () => {
      withoutList('airbnb');
      // Notes may end with a bullet that has no link at all, as Walmart's did before its question list; the page must
      // not break on it.
      const notes: CompanyEditorialNotesRegistry = {
        ...COMPANY_EDITORIAL_NOTES,
        airbnb: {
          ...COMPANY_EDITORIAL_NOTES['airbnb'],
          reportsDescribe: {
            kicker: 'What public interview reports describe',
            title: 'Two loop shapes',
            paragraphs: ['The loop depends on the team.'],
            bullets: [
              { text: 'Mid-level loops open with a technical screen.', link: { label: 'See the stages', fragment: 'airbnb-interview-process-1' } },
              { text: 'Senior onsites mix coding rounds and a design round.' },
            ],
          },
        },
      };
      await createComponent('airbnb', AIRBNB, AUTHORED_COMPANY_PREVIEWS, notes);
      const describe = host().querySelector('[data-testid="company-reports-describe"]') as HTMLElement;
      expect(describe.textContent).toContain('Senior onsites mix coding rounds');
      const locked = Array.from(host().querySelectorAll('.company-link--locked'));
      expect(locked.length).toBeGreaterThan(0);
      for (const link of locked) {
        if (link.classList.contains('reports-item__title')) continue; // the report list carries its own Premium chip
        expect(link.nextElementSibling?.classList).withContext(link.textContent ?? '').toContain('company-link__tag');
      }
      expect(host().querySelectorAll('.company-link__tag').length).toBe(locked.filter((link) => !link.classList.contains('reports-item__title')).length);
    });

    it('locks a Premium practice link under an open prompt, and words the closing call without naming a Premium task', async () => {
      withoutList('servicenow');
      await createComponent('servicenow');
      const first = host().querySelector('.company-prompt') as HTMLElement;
      const link = first.querySelector('.company-resource-link--inline') as HTMLElement;
      // A readable, clickable label; the page's name stays in the DOM under the lock, out of snippets.
      expect(link.classList).toContain('company-link--premium');
      expect(link.hasAttribute('inert')).toBeFalse();
      expect(link.querySelector('.company-link__label')?.textContent).toBe('Premium task for this prompt');
      expect(link.querySelector('.premium-locked')?.hasAttribute('data-nosnippet')).toBeTrue();
      expect(first.querySelector('.company-link__tag')).toBeNull();
      expect(host().querySelector('.company-guide-cta p:not(.preview-kicker)')?.textContent?.trim())
        .toBe(`Premium opens prompt 4 with its answer guide, every question in the ServiceNow set and all ${PREMIUM_QUESTION_COUNT} Premium questions in the library.`);
    });

    it('counts locked samples as exercises, so a widget in three frameworks is one', async () => {
      await createComponent('airbnb', AIRBNB, AUTHORED_COMPANY_PREVIEWS, COMPANY_EDITORIAL_NOTES);
      const sample = (id: string, access: 'free' | 'premium') => ({ id, access, kind: 'coding' }) as unknown as CompanyPreviewQuestion;
      expect(fixture.componentInstance.premiumCount([
        sample('react-star-rating', 'premium'), sample('angular-star-rating', 'premium'), sample('vue-star-rating', 'premium'),
        sample('js-closures', 'premium'), sample('js-event-loop', 'free'),
      ])).toBe(2);
    });

    it('counts a click on the sample card as its own surface', async () => {
      withoutList('airbnb');
      await createComponent('airbnb', AIRBNB, AUTHORED_COMPANY_PREVIEWS, COMPANY_EDITORIAL_NOTES);
      spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
      const link = host().querySelector('[data-testid="company-sample-gate"] a') as HTMLAnchorElement;
      link.addEventListener('click', (event) => event.preventDefault());
      link.click();
      expect(analytics.track).toHaveBeenCalledOnceWith('company_guide_link_clicked', { surface: 'sample_gate', target_path: '/companies' });
    });
  });

  describe('a Premium member reading a guide', () => {
    const shown = (selector: string) =>
      Array.from(fixture.nativeElement.querySelectorAll(selector) as NodeListOf<HTMLElement>).map((element) => getComputedStyle(element).display !== 'none');

    it('hides the lock chip and the call to unlock on every kind of guide, which a visitor still sees', async () => {
      // Apple stands for a catalog guide with sample cards, the layout of a guide without a reported-question list.
      withoutList('apple');
      const guides: [string, string[]][] = [
        ['elevenlabs', ['.preview-chip--locked-set', '.company-guide-cta']],
        ['google', ['.preview-chip--lock', '.company-guide-cta']],
        ['netflix', ['.preview-chip--lock', '.company-guide-cta']],
        ['openai', ['.preview-chip--lock', '.openai-cta']],
        ['apple', ['.preview-chip--lock', '.sample-summary--access', '.cta-stack']],
      ];
      for (const [slug, selectors] of guides) {
        user.set(null);
        await createComponent(slug);
        for (const selector of selectors) expect(shown(selector)).withContext(`${slug}, visitor: ${selector}`).toEqual([true]);
        user.set(MEMBER);
        fixture.detectChanges();
        for (const selector of selectors) expect(shown(selector)).withContext(`${slug}, member: ${selector}`).toEqual([false]);
      }
    });

    it('offers a member the full company set where the call to unlock was, on every kind of guide', async () => {
      for (const slug of ['elevenlabs', 'google', 'openai', 'apple']) {
        user.set(null);
        await createComponent(slug);
        const host: HTMLElement = fixture.nativeElement;
        expect(host.querySelector('[data-testid="company-set-entry"]')).withContext(`${slug}, visitor`).toBeNull();

        user.set(MEMBER);
        fixture.detectChanges();
        const entry = host.querySelector('[data-testid="company-set-entry"]') as HTMLElement;
        const label = fixture.componentInstance.label;
        const line = entry.querySelector('.company-set-entry__line')?.textContent;
        expect(line).withContext(slug).toMatch(new RegExp(`^The full ${label} set: \\d+ questions \\(`));
        expect(line).withContext(slug).toBe(companySetLine([{ name: label, counts: COMPANY_SET_COUNTS[slug] }]));
        const link = entry.querySelector('a') as HTMLAnchorElement;
        expect(link.getAttribute('href')).withContext(slug).toBe(`/companies/${slug}/all`);
        expect(link.textContent?.trim()).withContext(slug).toBe(`Open the ${label} set →`);
        expect(entry.compareDocumentPosition(host.querySelector('[data-testid="company-related-guides"]')!) & Node.DOCUMENT_POSITION_FOLLOWING)
          .withContext(slug).toBeTruthy();
      }
    });

    it('counts a member following the full set as its own surface', async () => {
      await createComponent('elevenlabs');
      user.set(MEMBER);
      fixture.detectChanges();
      spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
      const link = fixture.nativeElement.querySelector('[data-testid="company-set-entry"] a') as HTMLAnchorElement;
      link.addEventListener('click', (event) => event.preventDefault());
      link.click();

      expect(analytics.track).toHaveBeenCalledOnceWith('company_guide_link_clicked', { surface: 'full_set', target_path: '/companies/elevenlabs/all' });
    });

    it('opens every prompt to a member, with no card asking to unlock them', async () => {
      user.set(MEMBER);
      await createComponent('elevenlabs');
      const host: HTMLElement = fixture.nativeElement;
      expect(host.querySelectorAll('.company-prompt--locked').length).toBe(0);
      expect(host.querySelectorAll('[inert], [aria-hidden="true"].company-prompt__details').length).toBe(0);
      expect(host.querySelector('[data-testid="company-prompt-gate"]')).toBeNull();
    });

    it('marks the lock chip of every authored guide, so none shows it to a member', () => {
      for (const [slug, preview] of Object.entries(AUTHORED_COMPANY_PREVIEWS)) {
        expect(preview.hero.chips).withContext(slug).toContain('Full practice set requires Premium');
      }
    });

    it('shows a member every catalog sample without saying which ones are locked', async () => {
      withoutList('microsoft');
      await createComponent('microsoft', {
        slug: 'microsoft', mode: 'catalog',
        counts: { all: 2, coding: 1, trivia: 1, system: 0, debug: 0 },
        samples: [
          { id: 'open-item', title: 'Render a list', kind: 'coding', tech: 'react', difficulty: 'easy', access: 'free' },
          { id: 'paid-item', title: 'Debounce a search box', kind: 'trivia', tech: 'javascript', difficulty: 'hard', access: 'premium' },
        ],
      });
      const row = (id: string) => {
        const element = fixture.nativeElement.querySelector(`[data-testid="company-preview-question-${id}"]`) as HTMLElement;
        return {
          chips: Array.from(element.querySelectorAll('.fa-question-row__meta-label')).map((chip) => chip.textContent),
          description: element.querySelector('.fa-question-row__description')?.textContent?.trim(),
        };
      };
      expect(row('open-item').chips).toContain('Free now');
      expect(row('paid-item')).toEqual(jasmine.objectContaining({ description: 'Previewed here; the full practice set requires Premium.' }));
      expect(row('paid-item').chips).toContain('Premium');

      user.set(MEMBER);
      fixture.detectChanges();
      expect(row('open-item').chips).not.toContain('Free now');
      expect(row('paid-item').chips).not.toContain('Premium');
      expect(row('paid-item').description).toBe('Included with your Premium access.');
      expect(row('open-item').description).toBe('Available from the public Question Library.');
    });
  });

  describe('the account gate on a gated guide', () => {
    const FREE_ACCOUNT = { _id: 'free-user', role: 'user', accessTier: 'free' };
    const host = () => fixture.nativeElement as HTMLElement;
    const prompts = () => Array.from(host().querySelectorAll('.company-prompt')) as HTMLElement[];
    const gateCard = (testId: string) => host().querySelector(`[data-testid="${testId}"]`) as HTMLElement | null;
    const lockedParts = () => host().querySelectorAll('.premium-locked').length;

    it('shows a visitor the structure and a lead-in, and keeps the rest in the page for search engines', async () => {
      withoutList('meta');
      await createComponent('meta');
      expect(fixture.componentInstance.tier()).toBe('guest');
      expect(fixture.componentInstance.detailLocked()).toBeTrue();

      // The first prompt is open in full; the second shows its title only.
      const cards = prompts();
      expect(cards.length).toBeGreaterThan(2);
      expect(cards[0].querySelector('.company-prompt__statement .premium-locked')).toBeNull();
      expect(cards[0].querySelector('.company-prompt__details')?.classList).not.toContain('company-prompt__locked');
      expect(cards[1].querySelector('.company-prompt__statement .premium-locked')?.hasAttribute('data-nosnippet')).toBeTrue();
      expect(cards[1].querySelector('.company-prompt__details')?.classList).toContain('company-prompt__locked');
      expect(cards[1].querySelector('h3')?.textContent?.trim()).toBeTruthy();

      // The process table reads in full, with the evidence counts; the links behind them wait for an account.
      const process = host().querySelector('app-company-interview-process') as HTMLElement;
      expect(process.querySelector('.premium-locked')).toBeNull();
      expect(process.querySelector('.interview-process__sources')).toBeNull();
      expect(process.querySelectorAll('.interview-process__strength').length).toBeGreaterThan(0);
      expect(process.querySelector('.interview-process__tag')?.textContent).toBe('Free account');

      // Both gates lead to a free account and back to this guide.
      for (const testId of ['company-process-gate', 'company-prompt-gate']) {
        const card = gateCard(testId) as HTMLElement;
        expect(card.classList).toContain('company-account-gate');
        expect(card.querySelector('a')?.getAttribute('href')).toMatch(/^\/auth\/signup\?redirectTo=/);
        expect(card.querySelector('.company-prompt-gate__secondary')?.getAttribute('href')).toMatch(/^\/auth\/login\?redirectTo=/);
      }
      expect(gateCard('company-process-gate')?.querySelector('.company-prompt-gate__title')?.textContent).toBe('The sources behind each round open with a free account');
      expect(gateCard('company-process-gate')?.querySelector('.company-prompt-gate__line')?.textContent)
        .toMatch(/^\d+ public reports( and \d+ official pages?)?, linked on the rounds they describe and in the sources list\. Premium adds the answer guides and the practice\.$/);
      expect(gateCard('company-prompt-gate')?.querySelector('.company-prompt-gate__title')?.textContent).toMatch(/^Prompts 2 to \d+ open with a free account$/);
      expect(gateCard('company-sources-gate')?.querySelector('.company-prompt-gate__title')?.textContent).toBe('The sources open with a free account');
      expect(host().querySelector('.company-source-list')?.classList).toContain('premium-locked');

      // Both gates count the same evidence: the guide's sources plus the ones the table cites, once by URL.
      const sourceRows = host().querySelectorAll('.company-source-list article').length;
      const reports = Array.from(host().querySelectorAll('.company-source-list article a')).filter((link) => link.getAttribute('rel')?.includes('nofollow')).length;
      expect(gateCard('company-sources-gate')?.querySelector('.company-prompt-gate__line')?.textContent)
        .toBe(`${reports} public reports and ${sourceRows - reports} official pages, each with a note on what it can and cannot establish.`);
      expect(gateCard('company-process-gate')?.querySelector('.company-prompt-gate__line')?.textContent).toMatch(new RegExp(`^${reports} public reports and ${sourceRows - reports} official pages`));

      // The prompt cards follow the table's rule: the report is named, its link waits for the account; only the
      // locked statement is clipped.
      expect(host().querySelectorAll('[data-testid="company-prompt-reported-round"]').length).toBeGreaterThan(0);
      expect(host().querySelectorAll('[data-testid="company-prompt-reported-round"] a').length).toBe(0);
      expect(host().querySelector('[data-testid="company-prompt-reported-round"] .company-link__tag')?.textContent).toBe('Free account');
      expect(cards[0].querySelector('.company-prompt__statement')?.classList).not.toContain('company-prompt__statement--locked');
      expect(cards[1].querySelector('.company-prompt__statement')?.classList).toContain('company-prompt__statement--locked');

      const graph = (seo.updateTags.calls.mostRecent().args[0] as any).jsonLd as any[];
      const collection = graph.find((node) => node?.['@type'] === 'CollectionPage');
      expect(collection.isAccessibleForFree).toBeFalse();
      expect(collection.hasPart?.[0]?.cssSelector).toBe('.premium-locked');
    });

    it('opens what each round asks, the sources and every prompt statement for a free account, and keeps the answer guides for Premium', async () => {
      withoutList('meta');
      user.set(FREE_ACCOUNT);
      await createComponent('meta');
      expect(fixture.componentInstance.tier()).toBe('account');
      expect(fixture.componentInstance.detailLocked()).toBeFalse();
      expect(gateCard('company-process-gate')).toBeNull();
      expect(gateCard('company-sources-gate')).toBeNull();
      // The evidence opens: no row keeps the "Free account" tag in place of its links. (The Premium tag of the
      // round's timed rehearsal stays.)
      expect(Array.from(host().querySelectorAll('.interview-process__tag')).map((tag) => tag.textContent)).not.toContain('Free account');
      expect(host().querySelectorAll('.interview-process__sources a').length).toBeGreaterThan(0);
      expect(host().querySelector('.company-source-list')?.classList).not.toContain('premium-locked');
      expect(host().querySelectorAll('[data-testid="company-prompt-reported-round"] a').length).toBeGreaterThan(0);

      const cards = prompts();
      expect(cards.every((card) => card.querySelector('.company-prompt__statement .premium-locked') === null)).toBeTrue();
      expect(cards[0].querySelector('.company-prompt__details')?.classList).not.toContain('company-prompt__locked');
      expect(cards[1].querySelector('.company-prompt__details')?.classList).toContain('company-prompt__locked');
      expect(gateCard('company-prompt-gate')?.querySelector('.company-prompt-gate__title')?.textContent).toMatch(/^The answer guides for prompts 2 to \d+ are in Premium$/);
      expect(gateCard('company-prompt-gate')?.classList).not.toContain('company-account-gate');
      // A free account reads Premium task names; only the task pages stay behind Premium.
      expect(host().querySelectorAll('.company-link--locked, .interview-process__locked').length).toBe(0);
    });

    it('puts a story drill under each behavioural decoder that the gate opens one question of, for a visitor', async () => {
      withoutList('meta', 'apple');
      const drill = (round: string) => host().querySelector(`[aria-labelledby="${round}"] app-behavioral-drill`) as HTMLElement | null;
      const pickable = (element: HTMLElement) => Array.from(element.querySelectorAll('.drill__questions input')).filter((input) => !(input as HTMLInputElement).disabled).length;

      // Outside the gate every question is open and no card asks for an account: Amazon, and Google and Netflix, whose
      // question lists replaced their gate.
      for (const [slug, round] of [['amazon', 'amazon-round-leadership-principles'], ['google', 'google-round-googleyness'], ['netflix', 'netflix-round-culture']]) {
        await createComponent(slug);
        const open = drill(round) as HTMLElement;
        expect(pickable(open)).withContext(slug).toBe(open.querySelectorAll('.drill__questions input').length);
        expect(open.querySelector('.premium-locked')).withContext(slug).toBeNull();
        expect(gateCard('company-drill-gate')).withContext(slug).toBeNull();
        expect(host().querySelectorAll('[data-testid="company-round-fact-tag"]').length).withContext(slug).toBe(0);
      }

      // Meta's decoder is authored, Apple's comes from its editorial notes.
      for (const [slug, round] of [['meta', 'meta-round-behavioural'], ['apple', 'apple-round-team-conversations']]) {
        await createComponent(slug, undefined, AUTHORED_COMPANY_PREVIEWS, COMPANY_EDITORIAL_NOTES);
        const section = drill(round) as HTMLElement;
        const total = section.querySelectorAll('.drill__questions input').length;
        expect(pickable(section)).withContext(slug).toBe(1);
        expect(section.querySelectorAll('.drill__questions .premium-locked').length).withContext(slug).toBe(total - 1);
        // The account card sits under the questions, inside the drill, and comes back to this guide.
        const card = section.querySelector('[data-testid="company-drill-gate"]') as HTMLElement;
        expect(card.querySelector('.company-prompt-gate__title')?.textContent).withContext(slug).toBe(`The other ${total - 1} questions open with a free account`);
        expect(card.querySelector('a')?.getAttribute('href')).withContext(slug).toMatch(/^\/auth\/signup\?redirectTo=/);
        // The decoder's blurred facts say what opens them, as the drill's questions do.
        const decoder = host().querySelector(`[aria-labelledby="${round}"]`) as HTMLElement;
        const facts = decoder.querySelectorAll('.company-round-facts dd').length;
        expect(decoder.querySelectorAll('[data-testid="company-round-fact-tag"]').length).withContext(slug).toBe(facts - 1);
      }

      user.set(FREE_ACCOUNT);
      await createComponent('meta');
      const open = drill('meta-round-behavioural') as HTMLElement;
      expect(pickable(open)).toBe(9);
      expect(open.querySelector('.premium-locked')).toBeNull();
      expect(gateCard('company-drill-gate')).toBeNull();
      expect(host().querySelectorAll('[data-testid="company-round-fact-tag"]').length).toBe(0);
    });

    it('opens everything for a member and leaves a guide outside the gate as it was', async () => {
      withoutList('meta', 'servicenow');
      user.set(MEMBER);
      await createComponent('meta');
      expect(fixture.componentInstance.tier()).toBe('member');
      expect(lockedParts()).toBe(0);
      expect(gateCard('company-process-gate')).toBeNull();
      expect(gateCard('company-prompt-gate')).toBeNull();

      user.set(null);
      await createComponent('servicenow');
      expect(fixture.componentInstance.gated()).toBeFalse();
      expect(fixture.componentInstance.openPrompts()).toBe(3);
      expect(gateCard('company-process-gate')).toBeNull();
      expect(host().querySelectorAll('.interview-process__sources a').length).toBeGreaterThan(0);
      expect(prompts()[1].querySelector('.company-prompt__statement .premium-locked')).toBeNull();
    });
  });

  describe('a guide with a reported-question list', () => {
    const FREE = { _id: 'free-user', role: 'user', accessTier: 'free' };
    const host = (): HTMLElement => fixture.nativeElement;
    const summary = summariseQuestionList(COMPANY_INTERVIEW_PROCESSES['elevenlabs'])!;
    const graph = () => (seo.updateTags.calls.mostRecent().args[0] as any).jsonLd as any[];
    const readable = (el: Element | null) => Boolean(el) && !el!.closest('.premium-locked');

    it('shows a catalog guide\'s question list in place of its editorial sample, and says what its counts are', async () => {
      const sample = (id: string, title: string) => ({ id, title, kind: 'trivia' as const, tech: 'javascript' as const, difficulty: 'intermediate' as const, access: 'free' as const });
      await createComponent('walmart', {
        slug: 'walmart', mode: 'catalog', counts: { all: 2, coding: 0, trivia: 2, system: 0, debug: 0 },
        samples: [sample('js-closures', 'Explain closures'), sample('js-unrelated-sample', 'An unrelated sample')],
      }, AUTHORED_COMPANY_PREVIEWS, COMPANY_EDITORIAL_NOTES);
      expect(host().querySelector('[data-testid="company-question-list"]')).not.toBeNull();
      expect(host().querySelector('[aria-label="Sample editorial practice prompts"]')).toBeNull();
      expect(host().querySelector('[data-testid^="company-preview-question-"]')).toBeNull();
      const chips = Array.from(host().querySelectorAll('.preview-chip')).map((chip) => chip.textContent?.trim());
      expect(chips).toContain(`${COMPANY_INTERVIEW_PROCESSES['walmart'].questions!.length} reported questions`);
      expect(host().querySelector('[data-testid="company-preview-counts"]')?.textContent?.trim()).toBe('FrontendAtlas practice set: Concepts 2');
    });

    it('replaces the prompt cards with the list, keeps the first question open and locks the rest in the page', async () => {
      await createComponent('elevenlabs');
      expect(host().querySelectorAll('.company-prompt').length).toBe(0);
      const rows = Array.from(host().querySelectorAll<HTMLElement>('[data-testid="company-question-row"]'));
      expect(rows.length).toBe(summary.total);
      expect(rows[0].querySelector('.premium-locked.cq-row__question')).toBeNull();
      expect(readable(rows[0].querySelector('.cq-row__title'))).toBeTrue();
      // Every other question stays in the HTML for search, under the lock and out of snippets.
      const locked = rows.slice(1).map((row) => row.querySelector('.cq-row__question'));
      expect(locked.every((el) => el?.classList.contains('premium-locked') && el.hasAttribute('data-nosnippet') && (el.textContent ?? '').trim().length > 0)).toBeTrue();
    });

    it('tells search engines the locked rows are Premium and lists no question it hides', async () => {
      await createComponent('elevenlabs');
      const collection = graph().find((node) => node?.['@type'] === 'CollectionPage');
      expect(collection.isAccessibleForFree).toBeFalse();
      expect(collection.hasPart).toEqual([{ '@type': 'WebPageElement', isAccessibleForFree: false, cssSelector: '.premium-locked' }]);
      expect(collection.mainEntity).toBeUndefined();
      expect(graph().some((node) => node?.['@type'] === 'ItemList')).toBeFalse();
    });

    it('says who reported each round instead of linking, counts its questions and moves every source link to the end, behind an account', async () => {
      await createComponent('elevenlabs');
      const table = host().querySelector('[data-testid="company-interview-process"]') as HTMLElement;
      expect(table.querySelectorAll('a[href^="http"]').length).toBe(0);
      expect(table.querySelectorAll('[data-testid="company-interview-process-reporter"]').length).toBeGreaterThan(0);
      const counts = Array.from(table.querySelectorAll('[data-testid="company-interview-process-question-count"]')).map((el) => el.textContent?.replace(/\s+/g, ' ').trim());
      expect(counts).toEqual(summary.rounds.map((round) => `${round.count} reported ${round.count === 1 ? 'question' : 'questions'}`));
      expect(host().querySelector('[aria-labelledby="elevenlabs-source-notes"]')).toBeNull();
      const sources = host().querySelector('[data-testid="company-guide-sources"]') as HTMLElement;
      // The list is the last thing on the page, after the other guides.
      expect(host().querySelector('[data-testid="company-related-guides"]')!.compareDocumentPosition(sources) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(sources.querySelector('details')?.hasAttribute('open')).toBeFalse();
      expect(sources.querySelectorAll('a[href^="http"]').length).toBe(0);
      expect(sources.querySelector('[data-testid="company-guide-sources-gate"]')).not.toBeNull();
    });

    it('locks the prep sections but not the trust note, and shows each plan day by title only', async () => {
      await createComponent('elevenlabs');
      const study = host().querySelector('#elevenlabs-study-first')!.closest('section') as HTMLElement;
      expect(study.querySelector('.company-prep-body.premium-locked[data-nosnippet]')).not.toBeNull();
      expect(readable(study.querySelector('.company-guide-note--trust'))).toBeTrue();
      const days = Array.from(host().querySelectorAll('[data-testid="company-prep-plan-days"] li'));
      expect(days.length).toBe(7);
      expect(days.every((day) => readable(day.querySelector('.company-prep-sequence__title')))).toBeTrue();
      expect(days.every((day) => day.querySelector('.company-prep-sequence__body')?.classList.contains('premium-locked'))).toBeTrue();
    });

    it('renders the visitor view on the first render, as hydration finds it', async () => {
      user.set(MEMBER);
      await createComponent('elevenlabs', undefined, AUTHORED_COMPANY_PREVIEWS, {}, { firstRenderOnly: true });
      expect(host().querySelectorAll('.cq-row--locked').length).toBe(summary.total - 1);
      expect(host().querySelectorAll('[data-testid="company-guide-sources"] a[href^="http"]').length).toBe(0);
    });

    it('opens the answer outline, the plan and the source links for a free account, but not the locked questions', async () => {
      user.set(FREE);
      await createComponent('elevenlabs');
      expect(host().querySelector('[data-testid="company-question-outline-gate"]')).toBeNull();
      expect(host().querySelectorAll('.cq-row--locked').length).toBe(summary.total - 1);
      expect(host().querySelector('.company-prep-sequence__body.premium-locked')).toBeNull();
      expect(host().querySelector('.company-prep-body.premium-locked')).not.toBeNull();
      const links = host().querySelectorAll('[data-testid="company-guide-sources"] a[href^="http"]');
      expect(links.length).toBe(fixture.componentInstance.guideSourceRows.length);
    });

    it('keeps a visitor\'s choice of free unlock for after they sign up', async () => {
      await createComponent('elevenlabs');
      const row = summary.rows.find((entry) => entry.unlockable)!;
      const element = host().querySelector(`#elevenlabs-question-${row.id}`) as HTMLElement;
      (element.querySelector('.cq-row__locked') as HTMLButtonElement).click();
      fixture.detectChanges();
      const link = element.querySelector('[data-testid="company-question-choice"] a') as HTMLAnchorElement;
      link.addEventListener('click', (event) => event.preventDefault());
      link.click();
      expect(freeUnlocks.rememberIntent).toHaveBeenCalledOnceWith('elevenlabs', row.id);
      expect(freeUnlocks.claim).not.toHaveBeenCalled();
    });

    it('opens the question a visitor chose once they are back with an account, and lands on it', async () => {
      const row = summary.rows.find((entry) => entry.unlockable)!;
      const unlock = { company: 'elevenlabs', questionId: row.id, practiceId: null, unlockedAt: '2026-11-13T10:00:00.000Z' };
      freeUnlocks.takeIntent.and.returnValue(row.id);
      freeUnlocks.claim.and.callFake(() => {
        user.update((current: any) => ({ ...current, freeUnlock: unlock }));
        return of({ status: 'opened' as const, unlock });
      });
      user.set(FREE);
      await createComponent('elevenlabs');
      await settle();
      expect(freeUnlocks.claim).toHaveBeenCalledOnceWith('elevenlabs', row.id);
      expect(host().querySelector(`#elevenlabs-question-${row.id}`)?.classList).not.toContain('cq-row--locked');
      expect(analytics.track).toHaveBeenCalledWith('company_question_unlocked', { company: 'elevenlabs', question_id: row.id, via: 'after_signup' });
    });

    it('drops a remembered choice for a member, who has every question already', async () => {
      freeUnlocks.takeIntent.and.returnValue('any-question');
      user.set(MEMBER);
      await createComponent('elevenlabs');
      expect(freeUnlocks.takeIntent).toHaveBeenCalledWith('elevenlabs');
      expect(freeUnlocks.claim).not.toHaveBeenCalled();
    });

    it('opens every question and drops the offer for a member', async () => {
      user.set(MEMBER);
      await createComponent('elevenlabs');
      expect(host().querySelectorAll('.premium-locked').length).toBe(0);
      expect(host().querySelector('[data-testid="company-question-offer"]')).toBeNull();
      expect(host().querySelector('[data-testid="company-question-allowance"]')).toBeNull();
    });
  });
});
