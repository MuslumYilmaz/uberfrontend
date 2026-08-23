import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { QuestionService } from '../../../core/services/question.service';
import { CompanyDetailComponent } from './company-detail.component';

describe('CompanyDetailComponent', () => {
  let fixture: ComponentFixture<CompanyDetailComponent>;
  let routeParamMap: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  beforeEach(async () => {
    routeParamMap = new BehaviorSubject(convertToParamMap({ slug: 'google' }));

    await TestBed.configureTestingModule({
      imports: [CompanyDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: routeParamMap,
          },
        },
        {
          provide: QuestionService,
          useValue: {
            loadAllQuestionSummaries: jasmine
              .createSpy('loadAllQuestionSummaries')
              .and.callFake((kind: string) => of(kind === 'coding'
                ? [{ id: 'tagged-prompt', companies: ['google'] }]
                : [] as any)),
            loadSystemDesign: jasmine
              .createSpy('loadSystemDesign')
              .and.returnValue(of([] as any)),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CompanyDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('presents the premium company route as an editorial grouping without unsupported provenance', () => {
    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent || '';

    expect(host.querySelector('h1')?.textContent?.trim()).toBe('Google Frontend Practice Group');
    expect(host.querySelector('[data-testid="company-practice-disclaimer"]')?.textContent?.trim()).toBe(
      'Editorial practice groupings, not verified official interview questions or endorsements.',
    );
    expect(text).toContain('1 editorial practice prompt');
    expect(text).toContain('The grouping is editorial organization');
    expect(text).not.toContain('known questions');
    expect(text).not.toContain('candidate reports');
    expect(text).not.toContain('How Google Evaluates');
  });

  it('uses shared OpenAI and ByteDance brand casing in the reachable detail view', () => {
    routeParamMap.next(convertToParamMap({ slug: 'openai' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe(
      'OpenAI Frontend Practice Group',
    );

    routeParamMap.next(convertToParamMap({ slug: 'bytedance' }));
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent || '';
    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe(
      'ByteDance Frontend Practice Group',
    );
    expect(text).not.toContain('Openai');
    expect(text).not.toContain('Bytedance');
  });
});
