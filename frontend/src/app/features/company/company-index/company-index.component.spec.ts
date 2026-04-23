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
});
