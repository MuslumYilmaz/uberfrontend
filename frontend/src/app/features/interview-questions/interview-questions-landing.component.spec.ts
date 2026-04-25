import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { AnalyticsService } from '../../core/services/analytics.service';
import { QuestionService } from '../../core/services/question.service';
import { SeoService } from '../../core/services/seo.service';
import { InterviewQuestionsLandingComponent } from './interview-questions-landing.component';

describe('InterviewQuestionsLandingComponent', () => {
  let seo: jasmine.SpyObj<SeoService>;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let routeStub: any;

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

    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);

    routeStub = {
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
              { id: 'react-counter', title: 'React Counter', type: 'coding', technology: 'react', difficulty: 'easy', access: 'free', tags: [], importance: 5, companies: [], description: 'Build a counter.', tech: 'react' },
              { id: 'react-tabs', title: 'React Tabs', type: 'coding', technology: 'react', difficulty: 'easy', access: 'free', tags: [], importance: 4, companies: [], description: 'Build tabs.', tech: 'react' },
              { id: 'react-modal', title: 'React Modal', type: 'coding', technology: 'react', difficulty: 'intermediate', access: 'free', tags: [], importance: 3, companies: [], description: 'Build a modal.', tech: 'react' },
              { id: 'react-grid', title: 'React Grid', type: 'coding', technology: 'react', difficulty: 'hard', access: 'free', tags: [], importance: 2, companies: [], description: 'Build a grid.', tech: 'react' },
            ],
            trivia: [
              { id: 'react-useeffect-purpose', title: 'useEffect in React', type: 'trivia', technology: 'react', difficulty: 'easy', access: 'free', tags: [], importance: 5, companies: [], description: 'Explain useEffect.', tech: 'react' },
              { id: 'react-context', title: 'React Context', type: 'trivia', technology: 'react', difficulty: 'easy', access: 'free', tags: [], importance: 4, companies: [], description: 'Explain context.', tech: 'react' },
              { id: 'react-memo', title: 'React memo', type: 'trivia', technology: 'react', difficulty: 'intermediate', access: 'free', tags: [], importance: 3, companies: [], description: 'Explain memo.', tech: 'react' },
              { id: 'react-suspense', title: 'React Suspense', type: 'trivia', technology: 'react', difficulty: 'hard', access: 'free', tags: [], importance: 2, companies: [], description: 'Explain suspense.', tech: 'react' },
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
        { provide: AnalyticsService, useValue: analytics },
        {
          provide: QuestionService,
          useValue: {
            loadQuestionSummaries: () => of([]),
          },
        },
      ],
    }).compileComponents();
  });

  it('renders the prep roadmap instead of route cards and limits each preview list to three items', async () => {
    const fixture = TestBed.createComponent(InterviewQuestionsLandingComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.loading).toBeFalse();
    expect(fixture.nativeElement.querySelectorAll('.iq-route-card').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('[data-testid^="prep-roadmap-item-"]').length).toBe(5);
    expect(fixture.componentInstance.previewRows('coding').length).toBe(3);
    expect(fixture.componentInstance.previewRows('trivia').length).toBe(3);
    expect(fixture.nativeElement.textContent || '').toContain('View full coding list');
    expect(fixture.nativeElement.textContent || '').toContain('View full concepts list');
    expect(fixture.nativeElement.textContent || '').toContain('Frontend interview preparation guide');
    expect(fixture.nativeElement.textContent || '').toContain('FrontendAtlas Essential 60');
    expect(fixture.nativeElement.textContent || '').toContain('React coding + concept questions');
    expect(fixture.nativeElement.textContent || '').toContain('React interview prep path');
  });

  it('tracks roadmap selection from the interview hub decision surface', async () => {
    const fixture = TestBed.createComponent(InterviewQuestionsLandingComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const firstRoadmapItem = fixture.nativeElement.querySelector('[data-testid="prep-roadmap-item-1"]') as HTMLAnchorElement;
    firstRoadmapItem.click();

    expect(analytics.track).toHaveBeenCalledWith(
      'interview_hub_route_selected',
      jasmine.objectContaining({
        route_key: 'roadmap_1',
        roadmap_step: 1,
        roadmap_title: 'Frontend interview preparation guide',
        is_master_hub: false,
      }),
    );
  });

  it('tracks explicit view-all clicks from preview sections', async () => {
    const fixture = TestBed.createComponent(InterviewQuestionsLandingComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const viewAll = fixture.nativeElement.querySelector('.iq-inline-link') as HTMLAnchorElement;
    viewAll.click();

    expect(analytics.track).toHaveBeenCalledWith(
      'interview_hub_view_all_clicked',
      jasmine.objectContaining({
        kind: 'coding',
      }),
    );
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

  it('uses javascript-only preview lists on the master hub', async () => {
    routeStub.snapshot.data.interviewQuestions = {
      keyword: 'frontend interview questions',
      title: 'Frontend Interview Questions for Quick Prep',
      techs: ['javascript', 'react', 'angular', 'vue', 'html', 'css'],
      isMasterHub: true,
    };
    routeStub.snapshot.data.interviewQuestionsList = {
      techs: ['javascript', 'react', 'angular', 'vue', 'html', 'css'],
      coding: [
        { id: 'js-array-flatten', title: 'Flatten nested arrays', type: 'coding', technology: 'javascript', difficulty: 'easy', access: 'free', tags: [], importance: 5, companies: [], description: 'Flatten arrays.', tech: 'javascript' },
        { id: 'react-context-selector', title: 'Context selector optimization', type: 'coding', technology: 'react', difficulty: 'hard', access: 'free', tags: [], importance: 5, companies: [], description: 'Optimize context.', tech: 'react' },
      ],
      trivia: [
        { id: 'js-event-loop', title: 'Event loop ordering', type: 'trivia', technology: 'javascript', difficulty: 'easy', access: 'free', tags: [], importance: 5, companies: [], description: 'Explain microtasks.', tech: 'javascript' },
        { id: 'react-usememo', title: 'useMemo trade-offs', type: 'trivia', technology: 'react', difficulty: 'intermediate', access: 'free', tags: [], importance: 5, companies: [], description: 'Explain useMemo.', tech: 'react' },
      ],
    };
    routeStub.snapshot.url = [{ path: 'interview-questions' }];
    routeStub.snapshot.pathFromRoot = [{ url: [] }, { url: [{ path: 'interview-questions' }] }];

    const fixture = TestBed.createComponent(InterviewQuestionsLandingComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const jsCoding = fixture.nativeElement.querySelector('a[href="/javascript/coding/js-array-flatten"]');
    const reactCoding = fixture.nativeElement.querySelector('a[href="/react/coding/react-context-selector"]');
    const jsTrivia = fixture.nativeElement.querySelector('a[href="/javascript/trivia/js-event-loop"]');
    const reactTrivia = fixture.nativeElement.querySelector('a[href="/react/trivia/react-usememo"]');

    expect(jsCoding).toBeTruthy();
    expect(jsTrivia).toBeTruthy();
    expect(reactCoding).toBeNull();
    expect(reactTrivia).toBeNull();
    expect(fixture.nativeElement.textContent || '').toContain('Frontend interview preparation guide');
    expect(fixture.nativeElement.textContent || '').toContain('FrontendAtlas Essential 60');
    expect(fixture.nativeElement.textContent || '').toContain('Question Library');
    expect(fixture.nativeElement.textContent || '').toContain('Framework interview hubs');
    expect(fixture.nativeElement.querySelector('[data-testid="prep-roadmap-item-3"]')?.getAttribute('href') || '').toContain('/coding?reset=1');
    expect(fixture.nativeElement.querySelector('[data-testid="prep-roadmap-item-4"]')?.getAttribute('href') || '').toContain('/react/interview-questions');
  });

  it('uses framework-specific roadmap copy and prep path on Angular hubs', async () => {
    routeStub.snapshot.data.interviewQuestions = {
      keyword: 'angular interview questions',
      title: 'Angular Interview Questions for Frontend Interviews',
      techs: ['angular'],
    };
    routeStub.snapshot.data.interviewQuestionsList = {
      techs: ['angular'],
      coding: [
        { id: 'angular-counter-starter', title: 'Angular Counter', type: 'coding', technology: 'angular', difficulty: 'easy', access: 'free', tags: [], importance: 5, companies: [], description: 'Build a counter.', tech: 'angular' },
      ],
      trivia: [
        { id: 'angular-http-what-actually-cancels-request', title: 'Angular HttpClient Cancellation', type: 'trivia', technology: 'angular', difficulty: 'intermediate', access: 'free', tags: [], importance: 5, companies: [], description: 'Explain cancellation.', tech: 'angular' },
      ],
    };
    routeStub.snapshot.url = [{ path: 'angular' }, { path: 'interview-questions' }];
    routeStub.snapshot.pathFromRoot = [{ url: [] }, { url: [{ path: 'angular' }, { path: 'interview-questions' }] }];

    const fixture = TestBed.createComponent(InterviewQuestionsLandingComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent || '';
    const firstItem = fixture.nativeElement.querySelector('[data-testid="prep-roadmap-item-1"]') as HTMLAnchorElement;
    const secondItem = fixture.nativeElement.querySelector('[data-testid="prep-roadmap-item-2"]') as HTMLAnchorElement;
    const thirdItem = fixture.nativeElement.querySelector('[data-testid="prep-roadmap-item-3"]') as HTMLAnchorElement;
    const fourthItem = fixture.nativeElement.querySelector('[data-testid="prep-roadmap-item-4"]') as HTMLAnchorElement;
    const fifthItem = fixture.nativeElement.querySelector('[data-testid="prep-roadmap-item-5"]') as HTMLAnchorElement;

    expect(text).toContain('Frontend interview preparation guide');
    expect(text).toContain('Angular coding + concept questions');
    expect(text).toContain('Angular interview prep path');
    expect(firstItem.getAttribute('href') || '').toContain('/guides/interview-blueprint/intro');
    expect(secondItem.getAttribute('href') || '').toContain('/interview-questions/essential');
    expect(thirdItem.getAttribute('href') || '').toContain('/coding?tech=angular&reset=1');
    expect(fourthItem.getAttribute('href') || '').toContain('/guides/framework-prep/angular-prep-path');
    expect(fifthItem.textContent || '').toContain('Final-round coverage');
    expect(fifthItem.getAttribute('href') || '').toContain('/system-design');
  });
});
