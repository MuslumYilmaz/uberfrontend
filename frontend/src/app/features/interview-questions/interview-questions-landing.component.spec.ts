import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { InterviewQuestionsLandingComponent } from './interview-questions-landing.component';
import { QuestionService } from '../../core/services/question.service';
import { SeoService } from '../../core/services/seo.service';

describe('InterviewQuestionsLandingComponent', () => {
  let seo: jasmine.SpyObj<SeoService>;

  beforeEach(async () => {
    seo = jasmine.createSpyObj<SeoService>('SeoService', ['updateTags', 'buildCanonicalUrl']);
    seo.buildCanonicalUrl.and.callFake((value: string) => {
      const raw = String(value || '').trim();
      if (!raw) return 'https://frontendatlas.com/';
      if (/^https?:\/\//i.test(raw)) return raw;
      return raw.startsWith('/')
        ? `https://frontendatlas.com${raw}`
        : `https://frontendatlas.com/${raw}`;
    });

    const routeStub = {
      snapshot: {
        data: {
          interviewQuestions: {
            keyword: 'react interview questions',
            title: 'React Interview Questions',
            techs: ['react'],
          },
          interviewQuestionsList: {
            techs: ['react'],
            coding: [
              {
                id: 'react-counter',
                title: 'React Counter (Guarded Decrement)',
                type: 'coding',
                technology: 'react',
                difficulty: 'easy',
                access: 'free',
                tags: [],
                importance: 5,
                companies: [],
                description: 'Build a counter component with guarded decrement.',
                tech: 'react',
              },
            ],
            trivia: [
              {
                id: 'react-useeffect-purpose',
                title: 'useEffect in React',
                type: 'trivia',
                technology: 'react',
                difficulty: 'easy',
                access: 'free',
                tags: [],
                importance: 4,
                companies: [],
                description: 'Explain when and why to use useEffect.',
                tech: 'react',
              },
            ],
          },
          seo: {
            title: 'React Interview Questions',
            description: 'React interview questions and practice prompts.',
          },
        },
        url: [{ path: 'react' }, { path: 'interview-questions' }],
        pathFromRoot: [
          { url: [] },
          { url: [{ path: 'react' }, { path: 'interview-questions' }] },
        ],
      },
    } as unknown as Partial<ActivatedRoute>;

    await TestBed.configureTestingModule({
      imports: [InterviewQuestionsLandingComponent, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: routeStub },
        { provide: SeoService, useValue: seo },
        {
          provide: QuestionService,
          useValue: {
            loadQuestionSummaries: () => of([]),
          },
        },
      ],
    }).compileComponents();
  });

  it('renders resolved coding and trivia links as crawlable anchors', async () => {
    const fixture = TestBed.createComponent(InterviewQuestionsLandingComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.loading).toBeFalse();

    const codingLink = fixture.nativeElement.querySelector('a[href="/react/coding/react-counter"]') as HTMLAnchorElement | null;
    const triviaLink = fixture.nativeElement.querySelector('a[href="/react/trivia/react-useeffect-purpose"]') as HTMLAnchorElement | null;
    expect(codingLink).toBeTruthy();
    expect(triviaLink).toBeTruthy();

    const loadingState = fixture.nativeElement.querySelector('.iq-loading');
    expect(loadingState).toBeNull();
  });

  it('publishes CollectionPage schema through seo tags', async () => {
    const fixture = TestBed.createComponent(InterviewQuestionsLandingComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
    const breadcrumb = graph.find((entry: any) => entry?.['@type'] === 'BreadcrumbList');

    expect(collection).toBeTruthy();
    expect(collection?.url || '').toContain('/react/interview-questions');
    expect(collection?.mainEntity?.['@type']).toBe('ItemList');
    expect(Array.isArray(collection?.mainEntity?.itemListElement)).toBeTrue();
    expect(breadcrumb).toBeTruthy();
  });
});
