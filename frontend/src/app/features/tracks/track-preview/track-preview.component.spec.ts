import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of } from 'rxjs';
import { QuestionService } from '../../../core/services/question.service';
import { SeoService } from '../../../core/services/seo.service';
import { TrackPreviewComponent } from './track-preview.component';

describe('TrackPreviewComponent', () => {
  let questionService: jasmine.SpyObj<QuestionService>;
  let seo: jasmine.SpyObj<SeoService>;

  async function createRoutedComponent(slug: string): Promise<{
    fixture: ComponentFixture<TrackPreviewComponent>;
    setSlug: (nextSlug: string) => Promise<void>;
  }> {
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

    const paramMap$ = new BehaviorSubject(convertToParamMap({ slug }));

    await TestBed.configureTestingModule({
      imports: [TrackPreviewComponent, RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ slug }),
            },
            paramMap: paramMap$.asObservable(),
          },
        },
        { provide: QuestionService, useValue: questionService },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TrackPreviewComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return {
      fixture,
      setSlug: async (nextSlug: string) => {
        paramMap$.next(convertToParamMap({ slug: nextSlug }));
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
      },
    };
  }

  async function createComponent(slug: string): Promise<ComponentFixture<TrackPreviewComponent>> {
    const routed = await createRoutedComponent(slug);
    return routed.fixture;
  }

  function findLink(host: HTMLElement, label: string): HTMLAnchorElement | undefined {
    return Array.from(host.querySelectorAll<HTMLAnchorElement>('a'))
      .find((anchor) => (anchor.textContent || '').trim() === label);
  }

  it('renders the 7-day decision hero with Start Day 1 as the primary CTA', async () => {
    const fixture = await createComponent('crash-7d');
    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent || '';
    const h1 = host.querySelector('h1');
    const primary = findLink(host, 'Start Day 1');
    const library = findLink(host, 'Open Question Library');

    expect(h1?.textContent?.trim()).toBe('Crash Track: 7-Day Frontend Interview Prep Plan');
    expect(text).toContain('30');
    expect(text).toContain('questions');
    expect(text).toContain('2');
    expect(text).toContain('system design prompts');
    expect(text).toContain('45 min/day');
    expect(text).toContain('Day 1');
    expect(text).toContain('ready');
    expect(text).toContain('May 2026');
    expect(primary?.getAttribute('href')).toBe('/javascript/coding/js-debounce');
    expect(library?.getAttribute('href')).toBe('/coding');
  });

  it('renders seven task-preview day cards with free and premium signals', async () => {
    const fixture = await createComponent('crash-7d');
    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent || '';

    expect(host.querySelectorAll('.day-card').length).toBe(7);
    expect(text).toContain('JavaScript timing and utilities');
    expect(text).toContain('Final review and company targeting');
    expect(text).toContain('Debounce Function');
    expect(text).toContain('Throttle Function');
    expect(text).toContain('Real-time Search with Debounce & Caching');
    expect(text).toContain('Infinite Scroll List System Design');
    expect(text).toContain('Free now');
    expect(text).toContain('Premium in full plan');
  });

  it('orders sample questions around real free starter prompts before premium samples', async () => {
    const fixture = await createComponent('crash-7d');
    const host = fixture.nativeElement as HTMLElement;
    const samples = Array.from(host.querySelectorAll<HTMLElement>('.sample-list li'));
    const sampleText = samples.map((item) => item.textContent || '').join(' ');
    const freeBadges = host.querySelectorAll('.sample-list .access-badge--free');

    expect(freeBadges.length).toBeGreaterThanOrEqual(3);
    expect(sampleText).toContain('Debounce Function');
    expect(sampleText).toContain('Flexbox: Responsive Navbar');
    expect(sampleText).toContain('Microtasks vs Macrotasks in JavaScript');
    expect(sampleText.indexOf('Debounce Function')).toBeLessThan(sampleText.indexOf('Throttle Function'));
    expect(sampleText).toContain('Premium in full plan');
  });

  it('renders the comparison block and expanded crash-track FAQ', async () => {
    const fixture = await createComponent('crash-7d');
    const text = fixture.nativeElement.textContent || '';

    expect(text).toContain('Choose 7-day if');
    expect(text).toContain('Choose 30-day if');
    expect(text).toContain('Is 7 days enough for frontend interview preparation?');
    expect(text).toContain('What happens on Day 1?');
    expect(text).toContain('Does this include React?');
    expect(text).toContain('Does this include system design?');
    expect(text).toContain('What if my interview is tomorrow?');
    expect(text).toContain('What is premium?');
  });

  it('renders the 30-day decision hero with Start Day 1 as the primary CTA', async () => {
    const fixture = await createComponent('foundations-30d');
    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent || '';
    const h1 = host.querySelector('h1');
    const primary = findLink(host, 'Start Day 1');
    const library = findLink(host, 'Open Question Library');

    expect(h1?.textContent?.trim()).toBe('Foundations Track: 30-Day Frontend Interview Preparation Roadmap');
    expect(text).toContain('113');
    expect(text).toContain('questions');
    expect(text).toContain('5');
    expect(text).toContain('system design prompts');
    expect(text).toContain('30-45 min/day');
    expect(text).toContain('Day 1');
    expect(text).toContain('ready');
    expect(text).toContain('May 2026');
    expect(primary?.getAttribute('href')).toBe('/javascript/coding/js-number-clamp');
    expect(library?.getAttribute('href')).toBe('/coding');
  });

  it('updates the preview title when navigating between preview slugs in the reused component', async () => {
    const routed = await createRoutedComponent('crash-7d');
    let host = routed.fixture.nativeElement as HTMLElement;

    expect(host.querySelector('h1')?.textContent?.trim()).toBe('Crash Track: 7-Day Frontend Interview Prep Plan');

    await routed.setSlug('foundations-30d');
    host = routed.fixture.nativeElement as HTMLElement;
    const primary = findLink(host, 'Start Day 1');
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;

    expect(host.querySelector('h1')?.textContent?.trim()).toBe('Foundations Track: 30-Day Frontend Interview Preparation Roadmap');
    expect(primary?.getAttribute('href')).toBe('/javascript/coding/js-number-clamp');
    expect(payload.title).toBe('30-Day Frontend Interview Preparation Roadmap');
  });

  it('renders the first seven days of the 30-day roadmap as linked task previews', async () => {
    const fixture = await createComponent('foundations-30d');
    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent || '';

    expect(host.querySelectorAll('.day-card').length).toBe(7);
    expect(text).toContain('30-day frontend interview preparation day-by-day preview');
    expect(text).toContain('frontend interview preparation roadmap');
    expect(text).toContain('JavaScript fundamentals warm-up');
    expect(text).toContain('Clamp');
    expect(text).toContain('Reverse a String');
    expect(text).toContain('Count Vowels');
    expect(text).toContain('Remove Duplicates');
    expect(text).toContain('Angular component patterns');
    expect(text).toContain('Angular Accordion / FAQ Component');
    expect(text).toContain('Free now');
    expect(text).toContain('Premium in full plan');
  });

  it('renders 30-day distribution, module previews, comparison cards, and expanded FAQ', async () => {
    const fixture = await createComponent('foundations-30d');
    const text = fixture.nativeElement.textContent || '';

    expect(text).toContain('51');
    expect(text).toContain('JavaScript');
    expect(text).toContain('27');
    expect(text).toContain('framework coding');
    expect(text).toContain('30');
    expect(text).toContain('HTML/CSS');
    expect(text).toContain('39');
    expect(text).toContain('concept questions');
    expect(text).toContain('5');
    expect(text).toContain('system design');
    expect(text).toContain('Framework starter completion');
    expect(text).toContain('HTML/CSS implementation basics');
    expect(text).toContain('Final review and company targeting');
    expect(text).toContain('Choose 30-day if');
    expect(text).toContain('Choose 7-day if');
    expect(text).toContain('Choose JS mastery if');
    expect(text).toContain('Is 30 days enough?');
    expect(text).toContain('How many questions per day?');
    expect(text).toContain('Is React required?');
    expect(text).toContain('Are Angular and Vue included?');
    expect(text).toContain('When does system design start?');
    expect(text).toContain('What does premium unlock?');
  });

  it('orders 30-day sample questions around real public starter prompts', async () => {
    const fixture = await createComponent('foundations-30d');
    const host = fixture.nativeElement as HTMLElement;
    const sampleText = Array.from(host.querySelectorAll<HTMLElement>('.sample-list li'))
      .map((item) => item.textContent || '')
      .join(' ');
    const freeBadges = host.querySelectorAll('.sample-list .access-badge--free');

    expect(freeBadges.length).toBeGreaterThanOrEqual(3);
    expect(sampleText).toContain('Clamp');
    expect(sampleText).toContain('Count Vowels');
    expect(sampleText).toContain('Sum of Numbers in an Array');
    expect(sampleText).toContain('React Counter (Guarded Decrement)');
    expect(sampleText).toContain('Premium in full plan');
  });

  it('publishes CollectionPage, ItemList, BreadcrumbList, and expanded FAQPage schema for crash preview', async () => {
    await createComponent('crash-7d');

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
    const breadcrumb = graph.find((entry: any) => entry?.['@type'] === 'BreadcrumbList');
    const faq = graph.find((entry: any) => entry?.['@type'] === 'FAQPage');

    expect(payload.title).toBe('7-Day Frontend Interview Prep Plan');
    expect(payload.description).toContain('7-day frontend interview prep plan');
    expect(collection).toBeTruthy();
    expect(collection?.mainEntity?.['@type']).toBe('ItemList');
    expect(collection?.mainEntity?.itemListElement?.length).toBe(30);
    expect(collection?.about?.some((entry: any) => entry?.name === 'frontend interview preparation roadmap')).toBeTrue();
    expect(breadcrumb).toBeTruthy();
    expect(faq?.mainEntity?.length).toBeGreaterThanOrEqual(6);
    expect(faq?.mainEntity?.some((entry: any) => entry?.name === 'What happens on Day 1?')).toBeTrue();
  });

  it('publishes CollectionPage, ItemList, BreadcrumbList, and expanded FAQPage schema for 30-day preview', async () => {
    await createComponent('foundations-30d');

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
    const breadcrumb = graph.find((entry: any) => entry?.['@type'] === 'BreadcrumbList');
    const faq = graph.find((entry: any) => entry?.['@type'] === 'FAQPage');

    expect(payload.title).toBe('30-Day Frontend Interview Preparation Roadmap');
    expect(payload.description).toContain('30-day frontend interview preparation roadmap');
    expect(collection).toBeTruthy();
    expect(collection?.mainEntity?.['@type']).toBe('ItemList');
    expect(collection?.mainEntity?.itemListElement?.length).toBe(113);
    expect(breadcrumb?.itemListElement?.[2]?.name).toBe('30-Day Frontend Interview Preparation Roadmap');
    expect(faq?.mainEntity?.length).toBeGreaterThanOrEqual(6);
    expect(faq?.mainEntity?.some((entry: any) => entry?.name === 'Is 30 days enough?')).toBeTrue();
  });
});
