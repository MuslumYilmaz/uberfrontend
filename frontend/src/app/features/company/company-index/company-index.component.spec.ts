import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Data, convertToParamMap, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { SeoService } from '../../../core/services/seo.service';
import { CompanyPlanService } from '../company-plan/company-plan.service';
import { CompanyIndexComponent } from './company-index.component';
import { AUTHORED_COMPANY_PREVIEWS_TOKEN } from '../../../shared/company-previews/authored-company-previews';
import { buildAuthoredCompanyPreviewFixture } from '../../../shared/company-previews/authored-company-preview.spec-fixture';

describe('CompanyIndexComponent', () => {
  let fixture: ComponentFixture<CompanyIndexComponent>;
  let routeData: BehaviorSubject<Data>;
  let seo: jasmine.SpyObj<SeoService>;
  // The plan form reads `?company=` from the snapshot.
  const route = () => ({ data: routeData, snapshot: { queryParamMap: convertToParamMap({}) } });

  beforeEach(async () => {
    routeData = new BehaviorSubject<Data>({ companyIndex: { companies: [
      { slug: 'amazon', label: 'Amazon', count: 1 },
      { slug: 'bytedance', label: 'ByteDance', count: 1 },
      { slug: 'google', label: 'Google', count: 3 },
      { slug: 'openai', label: 'OpenAI', count: 1 },
    ] } });

    seo = jasmine.createSpyObj<SeoService>('SeoService', ['updateTags', 'buildCanonicalUrl']);
    seo.buildCanonicalUrl.and.callFake((path: string) => `https://frontendatlas.com${path}`);

    await TestBed.configureTestingModule({
      imports: [CompanyIndexComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: route() },
        { provide: SeoService, useValue: seo },
        {
          provide: CompanyPlanService,
          useValue: { loadData: () => of(null), saved: signal(null), draft: signal(null), answers: signal(null), draftConflict: signal(false), track: () => undefined },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CompanyIndexComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders local company logo marks on the company list', () => {
    const host: HTMLElement = fixture.nativeElement;
    const googleLogo = host.querySelector('[data-testid="company-logo-mark-google"] img') as HTMLImageElement | null;
    const amazonLogo = host.querySelector('[data-testid="company-logo-mark-amazon"] img') as HTMLImageElement | null;

    expect(googleLogo?.getAttribute('src')).toBe('/assets/images/company-logos/google.svg');
    expect(amazonLogo?.getAttribute('src')).toBe('/assets/images/company-logos/amazon.svg');
  });

  it('keeps company logo marks decorative because the card title names the company', () => {
    const host: HTMLElement = fixture.nativeElement;
    const googleMark = host.querySelector('[data-testid="company-logo-mark-google"]') as HTMLElement | null;

    expect(googleMark?.getAttribute('aria-hidden')).toBe('true');
    expect(googleMark?.hasAttribute('aria-label')).toBeFalse();
    expect(host.querySelector('.company-card__title')?.textContent).toContain('Amazon');
  });

  it('links company prep back to clean baseline and format hubs', () => {
    const host: HTMLElement = fixture.nativeElement;

    expect(host.querySelector('a[href="/javascript/interview-questions"]')).toBeTruthy();
    expect(host.querySelector('a[href="/react/interview-questions"]')).toBeTruthy();
    expect(host.querySelector('a[href="/machine-coding"]')).toBeTruthy();
    expect(host.querySelector('a[href="/system-design"]')).toBeTruthy();
    expect(host.querySelector('a[href="/tracks/foundations-30d/preview"]')).toBeTruthy();
    expect(host.querySelector('a[href*="companies_role_contract"]')).toBeNull();
  });

  it('finishes with an empty state and public alternatives when resolved catalog data is unavailable', () => {
    routeData.next({ companyIndex: { companies: [] } });
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;

    expect(host.querySelector('[data-testid="company-index-empty"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="company-index-loading"]')).toBeNull();
    expect(host.querySelector('a.company-card')).toBeNull();
    expect(host.querySelector('a[href="/coding"]')).not.toBeNull();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const collection = payload.jsonLd.find((entry: any) => entry['@type'] === 'CollectionPage');
    expect(collection.mainEntity).toBeUndefined();
  });

  it('opens with the plan form, then the directory, and keeps the guidance after the list', () => {
    const host: HTMLElement = fixture.nativeElement;
    const form = host.querySelector('app-company-plan-form') as HTMLElement;
    const directory = host.querySelector('[data-testid="company-index-directory"]') as HTMLElement;
    const list = host.querySelector('[data-testid="company-index-list"]') as HTMLElement;
    const guidance = host.querySelector('[data-testid="company-index-guidance"]') as HTMLElement;
    const comesBefore = (left: HTMLElement, right: HTMLElement) =>
      Boolean(left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING);

    expect(form).toBeTruthy();
    expect(directory).toBeTruthy();
    expect(list).toBeTruthy();
    expect(guidance).toBeTruthy();
    expect(form.nextElementSibling).toBe(directory);
    expect(comesBefore(list, guidance)).toBeTrue();
  });

  it('keeps the one page heading the SEO contract expects, inside the form', () => {
    const host: HTMLElement = fixture.nativeElement;
    const headings = host.querySelectorAll('h1');
    expect(headings.length).toBe(1);
    expect(headings[0].textContent?.trim()).toBe('Company Frontend Interview Questions');
    expect(headings[0].closest('app-company-plan-form')).toBeTruthy();
  });

  it('names each company guide by its signature round and keeps the crawlable count', () => {
    const host: HTMLElement = fixture.nativeElement;
    const google = host.querySelector<HTMLAnchorElement>('a.company-card[href="/companies/google/preview"]');
    expect(google?.querySelector('.company-card__signature')?.textContent?.trim()).toBe('Hiring committee');
    expect(google?.querySelector('.company-card__meta')?.textContent?.trim()).toBe('3 editorial practice prompts');
    expect(host.querySelector('.company-directory__head')?.textContent).toContain('4 company guides');
  });

  it('uses shared user-facing brand labels for OpenAI and ByteDance cards and schema', () => {
    const host: HTMLElement = fixture.nativeElement;
    const openAiCard = host.querySelector<HTMLAnchorElement>('a.company-card[href="/companies/openai/preview"]');
    const byteDanceCard = host.querySelector<HTMLAnchorElement>('a.company-card[href="/companies/bytedance/preview"]');
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
    const schemaNames = collection?.mainEntity?.itemListElement?.map((item: any) => item.name) ?? [];

    expect(openAiCard?.querySelector('.company-card__title')?.textContent?.trim()).toBe('OpenAI');
    expect(byteDanceCard?.querySelector('.company-card__title')?.textContent?.trim()).toBe('ByteDance');
    expect(host.textContent || '').not.toContain('Openai');
    expect(host.textContent || '').not.toContain('Bytedance');
    expect(schemaNames).toContain('OpenAI');
    expect(schemaNames).toContain('ByteDance');
  });

  it('exposes a clean crawlable OpenAI preview anchor in the SSR shell', () => {
    const host: HTMLElement = fixture.nativeElement;
    const openAiPreview = host.querySelector<HTMLAnchorElement>(
      '[data-testid="company-index-guidance"] a[href="/companies/openai/preview"]',
    );

    expect(openAiPreview).toBeTruthy();
    expect(openAiPreview?.textContent).toContain('OpenAI interview preview');
  });

  it('exposes a clean descriptive Google guide anchor in the SSR shell', () => {
    const host: HTMLElement = fixture.nativeElement;
    const googleGuide = host.querySelector<HTMLAnchorElement>(
      '[data-testid="company-index-guidance"] a[href="/companies/google/preview"]',
    );

    expect(googleGuide).toBeTruthy();
    expect(googleGuide?.textContent?.trim()).toBe('Google frontend interview questions');
    expect(googleGuide?.getAttribute('href')).not.toContain('?');
  });

  it('exposes a clean descriptive Netflix guide anchor in the SSR shell', () => {
    const host: HTMLElement = fixture.nativeElement;
    const netflixGuide = host.querySelector<HTMLAnchorElement>(
      '[data-testid="company-index-guidance"] a[href="/companies/netflix/preview"]',
    );

    expect(netflixGuide).toBeTruthy();
    expect(netflixGuide?.textContent?.trim()).toBe('Netflix frontend interview questions');
    expect(netflixGuide?.getAttribute('href')).not.toContain('?');
  });

  it('labels company cards and schema as editorial groupings without provenance claims', () => {
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('[data-testid="company-practice-disclaimer"]')?.textContent?.trim()).toBe(
      'Editorial practice groupings, not verified official interview questions or endorsements.',
    );
    expect(host.textContent || '').toContain('editorial practice prompts');
    expect(host.textContent || '').not.toContain('known questions');

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
    expect(payload.description).toBe(
      'Practice company-style frontend coding, concept, and system design questions. Explore editorial prep sets, not verified employer question banks.',
    );
    expect(collection?.description).toBe(payload.description);
    expect(collection?.disambiguatingDescription).toBe(
      'Editorial practice groupings, not verified official interview questions or endorsements.',
    );
    expect(collection?.mainEntity?.description).toBe(
      'Editorial practice groupings, not verified official interview questions or endorsements.',
    );
  });

  it('lists registry-driven authored guides after the hand-written ones with clean crawlable anchors', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CompanyIndexComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: route() },
        { provide: SeoService, useValue: seo },
        { provide: AUTHORED_COMPANY_PREVIEWS_TOKEN, useValue: { acme: buildAuthoredCompanyPreviewFixture() } },
      ],
    }).compileComponents();
    const local = TestBed.createComponent(CompanyIndexComponent);
    local.detectChanges();
    await local.whenStable();
    local.detectChanges();
    const host: HTMLElement = local.nativeElement;
    const anchor = host.querySelector<HTMLAnchorElement>('[data-testid="company-index-authored-acme"]');
    expect(anchor?.getAttribute('href')).toBe('/companies/acme/preview');
    expect(anchor?.textContent?.trim()).toBe('Acme frontend interview questions');
    const guidance = host.querySelector('[data-testid="company-index-guidance"]') as HTMLElement;
    const hrefs = Array.from(guidance.querySelectorAll('a')).map((link) => link.getAttribute('href'));
    expect(hrefs.indexOf('/companies/acme/preview')).toBeGreaterThan(hrefs.indexOf('/companies/netflix/preview'));
  });
});
