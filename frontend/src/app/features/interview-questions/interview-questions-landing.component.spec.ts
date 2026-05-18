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
            title: 'React Interview Questions and Answers',
            techs: ['react'],
          },
          interviewQuestionsList: {
            techs: ['react'],
            coding: [
              { id: 'react-counter', title: 'React Counter', type: 'coding', technology: 'react', difficulty: 'easy', access: 'free', tags: [], importance: 5, companies: [], description: 'Build a counter.', tech: 'react' },
              { id: 'react-tabs', title: 'React Tabs', type: 'coding', technology: 'react', difficulty: 'easy', access: 'free', tags: [], importance: 4, companies: [], description: 'Build tabs.', tech: 'react' },
              { id: 'react-modal', title: 'React Modal', type: 'coding', technology: 'react', difficulty: 'intermediate', access: 'free', tags: [], importance: 3, companies: [], description: 'Build a modal.', tech: 'react' },
              { id: 'react-grid', title: 'React Grid', type: 'coding', technology: 'react', difficulty: 'hard', access: 'free', tags: [], importance: 2, companies: [], description: 'Build a grid.', tech: 'react' },
              { id: 'react-transfer-list', title: 'React Transfer List', type: 'coding', technology: 'react', difficulty: 'intermediate', access: 'free', tags: [], importance: 2, companies: [], description: 'Build a transfer list.', tech: 'react' },
              { id: 'react-search', title: 'React Search', type: 'coding', technology: 'react', difficulty: 'intermediate', access: 'free', tags: [], importance: 1, companies: [], description: 'Build search.', tech: 'react' },
              { id: 'react-form', title: 'React Form', type: 'coding', technology: 'react', difficulty: 'easy', access: 'free', tags: [], importance: 1, companies: [], description: 'Build a form.', tech: 'react' },
            ],
            trivia: [
              { id: 'react-useeffect-purpose', title: 'useEffect in React', type: 'trivia', technology: 'react', difficulty: 'easy', access: 'free', tags: [], importance: 5, companies: [], description: 'Explain useEffect.', tech: 'react' },
              { id: 'react-context', title: 'React Context', type: 'trivia', technology: 'react', difficulty: 'easy', access: 'free', tags: [], importance: 4, companies: [], description: 'Explain context.', tech: 'react' },
              { id: 'react-memo', title: 'React memo', type: 'trivia', technology: 'react', difficulty: 'intermediate', access: 'free', tags: [], importance: 3, companies: [], description: 'Explain memo.', tech: 'react' },
              { id: 'react-suspense', title: 'React Suspense', type: 'trivia', technology: 'react', difficulty: 'hard', access: 'free', tags: [], importance: 2, companies: [], description: 'Explain suspense.', tech: 'react' },
              { id: 'react-stale-closure', title: 'React stale closure', type: 'trivia', technology: 'react', difficulty: 'intermediate', access: 'free', tags: [], importance: 2, companies: [], description: 'Explain stale closures.', tech: 'react' },
              { id: 'react-keys', title: 'React keys', type: 'trivia', technology: 'react', difficulty: 'easy', access: 'free', tags: [], importance: 1, companies: [], description: 'Explain keys.', tech: 'react' },
              { id: 'react-refs', title: 'React refs', type: 'trivia', technology: 'react', difficulty: 'easy', access: 'free', tags: [], importance: 1, companies: [], description: 'Explain refs.', tech: 'react' },
            ],
          },
          seo: {
            title: 'React Interview Questions and Answers',
            description: 'React interview questions and answers with coding prompts, concept questions, follow-ups, and common mistakes.',
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

  it('renders the prep roadmap instead of route cards and limits each preview list to six items', async () => {
    const fixture = TestBed.createComponent(InterviewQuestionsLandingComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.loading).toBeFalse();
    expect(fixture.nativeElement.textContent || '').toContain('React Interview Questions and Answers');
    expect(fixture.nativeElement.textContent || '').toContain('answers hub with coding prompts, concept questions, follow-ups, and common mistakes');
    expect(fixture.nativeElement.querySelectorAll('.iq-route-card').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('[data-testid^="prep-roadmap-item-"]').length).toBe(5);
    expect(fixture.componentInstance.previewRows('coding').length).toBe(6);
    expect(fixture.componentInstance.previewRows('trivia').length).toBe(6);
    expect(fixture.nativeElement.textContent || '').toContain('View full coding list');
    expect(fixture.nativeElement.textContent || '').toContain('View full concepts list');
    expect(fixture.nativeElement.textContent || '').toContain('Frontend interview preparation guide');
    expect(fixture.nativeElement.textContent || '').toContain('FrontendAtlas Essential 60');
    expect(fixture.nativeElement.textContent || '').toContain('React coding + concept questions');
    expect(fixture.nativeElement.textContent || '').toContain('React interview preparation path');
    expect(fixture.nativeElement.textContent || '').toContain('Common questions before you start');
    expect(fixture.nativeElement.textContent || '').toContain('How do React interview questions differ from React interview preparation?');
    expect(fixture.nativeElement.textContent || '').not.toContain('Angular interview topic map');
    expect(fixture.nativeElement.textContent || '').not.toContain('HTML interview topic map');
    expect(fixture.nativeElement.querySelector('.iq-section--angular-coverage')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--html-coverage')).toBeNull();
  });

  it('renders React-only coverage for topic gaps, mistakes, libraries, and schema mentions', async () => {
    const fixture = TestBed.createComponent(InterviewQuestionsLandingComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent || '';

    expect(text).toContain('React interview topic map');
    expect(text).toContain('Props, state, and one-way data flow');
    expect(text).toContain('Hooks and useEffect implementation');
    expect(text).toContain('Context API and state management');
    expect(text).toContain('Forms and controlled inputs');
    expect(text).toContain('Class vs functional components and lifecycle');
    expect(text).toContain('Performance optimization');
    expect(text).toContain('Debugging React applications');
    expect(text).toContain('Testing React components');
    expect(text).toContain('Common mistakes in React interviews');
    expect(text).toContain('Common React libraries interviewers may expect');
    expect(text).toContain('TanStack Query');
    expect(text).toContain('Testing Library');
    expect(text).not.toContain('Angular interview topic map');
    expect(text).not.toContain('HTML interview topic map');

    expect(fixture.nativeElement.querySelector('.iq-section--react-coverage')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-coverage')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--html-coverage')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-why-props-immutable"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-useeffect-purpose"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-context-performance-issues"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-controlled-vs-uncontrolled"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-functional-vs-class-components"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-prevent-unnecessary-rerenders"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/coding/react-debug-double-render"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/guides/framework-prep/react-prep-path"]')).toBeTruthy();

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');

    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React Hooks and useEffect implementation')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React Context API and state management')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React component lifecycle')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('Common React interview mistakes')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('React performance optimization')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('Testing React components')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('Common React libraries')
    )).toBeTrue();
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
    expect(collection?.name).toBe('React Interview Questions and Answers');
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React interview questions and answers')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').toLowerCase().includes('common interview mistakes')
    )).toBeTrue();
    expect(collection?.url || '').toContain('/react/interview-questions');
    expect(collection?.mainEntity?.['@type']).toBe('ItemList');
    expect(Array.isArray(collection?.mainEntity?.itemListElement)).toBeTrue();
    expect(breadcrumb).toBeTruthy();
  });

  it('uses javascript-only preview lists on the master hub', async () => {
    routeStub.snapshot.data.interviewQuestions = {
      keyword: 'frontend interview questions',
      title: 'Frontend Interview Questions and Answers',
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
      title: 'Angular Interview Questions and Answers',
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
    expect(fifthItem.getAttribute('href') || '').toContain('/coding?view=formats&category=system');
  });

  it('uses HTML and CSS wording and format-category links on the combined hub', async () => {
    routeStub.snapshot.data.interviewQuestions = {
      keyword: 'html and css interview questions',
      title: 'HTML and CSS Interview Questions and Answers',
      techs: ['html', 'css'],
    };
    routeStub.snapshot.data.interviewQuestionsList = {
      techs: ['html', 'css'],
      coding: [
        { id: 'html-accessible-form', title: 'Accessible Form', type: 'coding', technology: 'html', difficulty: 'easy', access: 'free', tags: [], importance: 5, companies: [], description: 'Build a semantic form.', tech: 'html' },
        { id: 'css-card-layout', title: 'CSS Card Layout', type: 'coding', technology: 'css', difficulty: 'intermediate', access: 'free', tags: [], importance: 4, companies: [], description: 'Build a responsive card layout.', tech: 'css' },
      ],
      trivia: [
        { id: 'html-labels', title: 'HTML labels', type: 'trivia', technology: 'html', difficulty: 'easy', access: 'free', tags: [], importance: 5, companies: [], description: 'Explain labels.', tech: 'html' },
        { id: 'css-specificity', title: 'CSS specificity', type: 'trivia', technology: 'css', difficulty: 'easy', access: 'free', tags: [], importance: 5, companies: [], description: 'Explain specificity.', tech: 'css' },
      ],
    };
    routeStub.snapshot.url = [{ path: 'html-css' }, { path: 'interview-questions' }];
    routeStub.snapshot.pathFromRoot = [{ url: [] }, { url: [{ path: 'html-css' }, { path: 'interview-questions' }] }];

    const fixture = TestBed.createComponent(InterviewQuestionsLandingComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent || '';
    const codingViewAll = fixture.nativeElement.querySelector('.iq-inline-link') as HTMLAnchorElement;
    const thirdItem = fixture.nativeElement.querySelector('[data-testid="prep-roadmap-item-3"]') as HTMLAnchorElement;

    expect(text).toContain('HTML and CSS Interview Questions and Answers');
    expect(text).toContain('Most crucial HTML and CSS coding interview questions');
    expect(text).toContain('Most crucial HTML and CSS concept questions for interviews');
    expect(text).toContain('What HTML and CSS interview rounds test');
    expect(text).toContain('Should I study HTML and CSS interview questions together?');
    expect(text).toContain('HTML and CSS coding + concept questions');
    expect(text).not.toContain('Most crucial HTML coding interview questions');
    expect(codingViewAll.getAttribute('href') || '').toContain('/coding?view=formats&category=html-css&kind=coding&reset=1');
    expect(thirdItem.getAttribute('href') || '').toContain('/coding?view=formats&category=html-css&reset=1');
  });

  it('uses Vue.js wording on the Vue hub while preserving Vue JS query intent', async () => {
    routeStub.snapshot.data.interviewQuestions = {
      keyword: 'vue js interview questions',
      title: 'Vue.js Interview Questions and Answers',
      techs: ['vue'],
    };
    routeStub.snapshot.data.interviewQuestionsList = {
      techs: ['vue'],
      coding: [
        { id: 'vue-tabs', title: 'Vue Tabs', type: 'coding', technology: 'vue', difficulty: 'easy', access: 'free', tags: [], importance: 5, companies: [], description: 'Build tabs.', tech: 'vue' },
      ],
      trivia: [
        { id: 'vue-reactivity-system', title: 'Vue reactivity system', type: 'trivia', technology: 'vue', difficulty: 'easy', access: 'free', tags: [], importance: 5, companies: [], description: 'Explain reactivity.', tech: 'vue' },
      ],
    };
    routeStub.snapshot.url = [{ path: 'vue' }, { path: 'interview-questions' }];
    routeStub.snapshot.pathFromRoot = [{ url: [] }, { url: [{ path: 'vue' }, { path: 'interview-questions' }] }];

    const fixture = TestBed.createComponent(InterviewQuestionsLandingComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent || '';

    expect(text).toContain('Vue.js Interview Questions and Answers');
    expect(text).toContain('Vue.js interview questions and Vue JS answers hub');
    expect(text).toContain('What Vue.js interview rounds test');
    expect(text).toContain('Are Vue.js and Vue JS interview questions the same target?');
  });

  it('renders HTML-only coverage for accessibility testing, HTML5, resources, mistakes, and schema mentions', async () => {
    routeStub.snapshot.data.interviewQuestions = {
      keyword: 'html interview questions',
      title: 'HTML Interview Questions and Answers',
      techs: ['html'],
    };
    routeStub.snapshot.data.seo = {
      title: 'HTML Interview Questions and Answers',
      description: 'Practice HTML interview questions and answers with concept questions, follow-ups, common mistakes, HTML5 basics, accessibility testing, forms, semantics, and metadata.',
    };
    routeStub.snapshot.data.interviewQuestionsList = {
      techs: ['html'],
      coding: [
        { id: 'html-basic-structure', title: 'Warm-Up: Basic Structure', type: 'coding', technology: 'html', difficulty: 'easy', access: 'free', tags: [], importance: 5, companies: [], description: 'Create a valid HTML page skeleton.', tech: 'html' },
        { id: 'html-semantic-layout', title: 'Semantic Page Layout', type: 'coding', technology: 'html', difficulty: 'easy', access: 'free', tags: [], importance: 4, companies: [], description: 'Build a semantic page layout.', tech: 'html' },
      ],
      trivia: [
        { id: 'html-dom', title: 'What is the DOM?', type: 'trivia', technology: 'html', difficulty: 'easy', access: 'free', tags: [], importance: 5, companies: [], description: 'Explain the DOM.', tech: 'html' },
        { id: 'html-semantic-elements', title: 'What are semantic HTML elements?', type: 'trivia', technology: 'html', difficulty: 'easy', access: 'free', tags: [], importance: 5, companies: [], description: 'Explain semantic elements.', tech: 'html' },
      ],
    };
    routeStub.snapshot.url = [{ path: 'html' }, { path: 'interview-questions' }];
    routeStub.snapshot.pathFromRoot = [{ url: [] }, { url: [{ path: 'html' }, { path: 'interview-questions' }] }];

    const fixture = TestBed.createComponent(InterviewQuestionsLandingComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent || '';

    expect(text).toContain('HTML Interview Questions and Answers');
    expect(text).toContain('HTML interview topic map');
    expect(text).toContain('HTML role in web development');
    expect(text).toContain('HTML vs HTML5 in interviews');
    expect(text).toContain('Accessibility testing workflow');
    expect(text).toContain('Common HTML coding mistakes');
    expect(text).toContain('HTML best practices for interviews');
    expect(text).toContain('Modern HTML topics interviewers may ask about');
    expect(text).toContain('Best resources for learning HTML');
    expect(text).toContain('Behavioral prep for HTML interviews');
    expect(text).toContain('What is the difference between HTML and HTML5?');
    expect(text).toContain('How do I test my HTML code for accessibility?');
    expect(text).toContain('What are the best resources for learning HTML?');
    expect(text).toContain('How do behavioral questions show up in HTML interviews?');
    expect(text).not.toContain('Angular interview topic map');
    expect(text).not.toContain('React interview topic map');

    expect(fixture.nativeElement.querySelector('a[href="/html/coding/html-basic-structure"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/coding/html-contact-form-labeled"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/trivia/web-accessibility-make-page-accessible"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="https://developer.mozilla.org/en-US/docs/Web/HTML/Reference"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="https://html.spec.whatwg.org/multipage/introduction.html"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="https://www.w3.org/WAI/tutorials/forms/labels/"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="https://developer.chrome.com/docs/devtools/accessibility/reference?hl=en"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="https://validator.w3.org/docs/users.html"]')).toBeTruthy();

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');

    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('HTML accessibility testing')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('HTML5 basics')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('Common HTML mistakes')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('HTML learning resources')
    )).toBeTrue();
    expect(fixture.nativeElement.querySelector('.iq-section--react-coverage')).toBeNull();
  });

  it('does not render HTML-only coverage on CSS hubs', async () => {
    routeStub.snapshot.data.interviewQuestions = {
      keyword: 'css interview questions',
      title: 'CSS Interview Questions and Answers',
      techs: ['css'],
    };
    routeStub.snapshot.data.interviewQuestionsList = {
      techs: ['css'],
      coding: [
        { id: 'css-card-layout', title: 'CSS Card Layout', type: 'coding', technology: 'css', difficulty: 'intermediate', access: 'free', tags: [], importance: 4, companies: [], description: 'Build a card layout.', tech: 'css' },
      ],
      trivia: [
        { id: 'css-specificity', title: 'CSS specificity', type: 'trivia', technology: 'css', difficulty: 'easy', access: 'free', tags: [], importance: 5, companies: [], description: 'Explain specificity.', tech: 'css' },
      ],
    };
    routeStub.snapshot.url = [{ path: 'css' }, { path: 'interview-questions' }];
    routeStub.snapshot.pathFromRoot = [{ url: [] }, { url: [{ path: 'css' }, { path: 'interview-questions' }] }];

    const fixture = TestBed.createComponent(InterviewQuestionsLandingComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent || '';

    expect(text).toContain('CSS Interview Questions and Answers');
    expect(text).not.toContain('HTML interview topic map');
    expect(text).not.toContain('React interview topic map');
    expect(text).not.toContain('Best resources for learning HTML');
    expect(fixture.nativeElement.querySelector('.iq-section--html-coverage')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-coverage')).toBeNull();
  });

  it('renders Angular-only coverage for topic gaps, mistakes, modern topics, and schema mentions', async () => {
    routeStub.snapshot.data.interviewQuestions = {
      keyword: 'angular interview questions',
      title: 'Angular Interview Questions and Answers',
      techs: ['angular'],
    };
    routeStub.snapshot.data.interviewQuestionsList = {
      techs: ['angular'],
      coding: [
        { id: 'angular-debounced-search-rxjs', title: 'Angular Debounced Search', type: 'coding', technology: 'angular', difficulty: 'intermediate', access: 'free', tags: [], importance: 5, companies: [], description: 'Build debounced search.', tech: 'angular' },
      ],
      trivia: [
        { id: 'angular-change-detection-strategies', title: 'Angular Change Detection', type: 'trivia', technology: 'angular', difficulty: 'intermediate', access: 'free', tags: [], importance: 5, companies: [], description: 'Explain change detection.', tech: 'angular' },
      ],
    };
    routeStub.snapshot.url = [{ path: 'angular' }, { path: 'interview-questions' }];
    routeStub.snapshot.pathFromRoot = [{ url: [] }, { url: [{ path: 'angular' }, { path: 'interview-questions' }] }];

    const fixture = TestBed.createComponent(InterviewQuestionsLandingComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent || '';

    expect(text).toContain('Angular interview topic map');
    expect(text).toContain('RxJS and HttpClient cancellation');
    expect(text).toContain('Dependency injection and services');
    expect(text).toContain('Forms and validation');
    expect(text).toContain('Testing Angular applications');
    expect(text).toContain('Performance optimization');
    expect(text).toContain('State management and NgRx');
    expect(text).toContain('Common mistakes in Angular interviews');
    expect(text).toContain('Using mergeMap when latest search should win');
    expect(text).toContain('Modern Angular topics interviewers may ask about');
    expect(text).toContain('Signal Forms');
    expect(text).not.toContain('HTML interview topic map');
    expect(text).not.toContain('React interview topic map');

    expect(fixture.nativeElement.querySelector('a[href="/angular/trivia/angular-http-what-actually-cancels-request"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/angular/trivia/angular-dependency-injection"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/angular/trivia/angular-template-driven-vs-reactive-forms-which-scales"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/angular/trivia/angular-performance-optimization"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/angular/trivia/ngrx-store-vs-component-state-angular-when-to-use"]')).toBeTruthy();

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');

    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular dependency injection')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('Modern Angular interview topics')
    )).toBeTrue();
    expect(fixture.nativeElement.querySelector('.iq-section--html-coverage')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-coverage')).toBeNull();
  });
});
