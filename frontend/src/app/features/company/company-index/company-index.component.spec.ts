import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { QuestionService } from '../../../core/services/question.service';
import { SeoService } from '../../../core/services/seo.service';
import { CompanyIndexComponent } from './company-index.component';

describe('CompanyIndexComponent', () => {
  let fixture: ComponentFixture<CompanyIndexComponent>;
  let questionService: jasmine.SpyObj<QuestionService>;
  let seo: jasmine.SpyObj<SeoService>;

  beforeEach(async () => {
    questionService = jasmine.createSpyObj<QuestionService>('QuestionService', [
      'loadAllQuestionSummaries',
      'loadSystemDesign',
    ]);
    questionService.loadAllQuestionSummaries.and.callFake((kind: string) => {
      if (kind === 'coding') {
        return of([
          { id: 'google-coding', title: 'Google UI prompt', companies: ['google'] },
          { id: 'amazon-coding', title: 'Amazon list prompt', companies: ['amazon'] },
        ] as any);
      }
      return of([
        { id: 'google-concept', title: 'Google concept prompt', companies: ['google'] },
      ] as any);
    });
    questionService.loadSystemDesign.and.returnValue(of([
      { id: 'google-system', title: 'Google system prompt', companies: ['google'] },
    ] as any));

    seo = jasmine.createSpyObj<SeoService>('SeoService', ['updateTags', 'buildCanonicalUrl']);
    seo.buildCanonicalUrl.and.callFake((path: string) => `https://frontendatlas.com${path}`);

    await TestBed.configureTestingModule({
      imports: [CompanyIndexComponent],
      providers: [
        provideRouter([]),
        { provide: QuestionService, useValue: questionService },
        { provide: SeoService, useValue: seo },
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
  });

  it('exposes a clean crawlable OpenAI preview anchor in the SSR shell', () => {
    const host: HTMLElement = fixture.nativeElement;
    const openAiPreview = host.querySelector<HTMLAnchorElement>('a[href="/companies/openai/preview"]');

    expect(openAiPreview).toBeTruthy();
    expect(openAiPreview?.textContent).toContain('OpenAI interview preview');
  });

  it('exposes a clean descriptive Google guide anchor in the SSR shell', () => {
    const host: HTMLElement = fixture.nativeElement;
    const googleGuide = host.querySelector<HTMLAnchorElement>('a[href="/companies/google/preview"]');

    expect(googleGuide).toBeTruthy();
    expect(googleGuide?.textContent?.trim()).toBe('Google frontend interview questions');
    expect(googleGuide?.getAttribute('href')).not.toContain('?');
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
    expect(collection?.disambiguatingDescription).toBe(
      'Editorial practice groupings, not verified official interview questions or endorsements.',
    );
    expect(collection?.mainEntity?.description).toBe(
      'Editorial practice groupings, not verified official interview questions or endorsements.',
    );
  });
});
