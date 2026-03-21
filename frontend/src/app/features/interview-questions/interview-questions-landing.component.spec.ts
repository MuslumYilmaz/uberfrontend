import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { InterviewQuestionsLandingComponent } from './interview-questions-landing.component';
import { PracticeRegistryService } from '../../core/services/practice-registry.service';
import { QuestionService } from '../../core/services/question.service';
import { SeoService } from '../../core/services/seo.service';

describe('InterviewQuestionsLandingComponent', () => {
  let seo: jasmine.SpyObj<SeoService>;
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

    routeStub = {
      snapshot: {
        data: {
          interviewQuestions: {
            keyword: 'react interview questions',
            title: 'React Interview Questions',
            techs: ['react'],
            featuredLinks: [
              {
                label: 'React hooks deep dive',
                route: ['/react/trivia/react-hooks-rules'],
                path: '/react/trivia/react-hooks-rules',
              },
            ],
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
        {
          provide: PracticeRegistryService,
          useValue: {
            primaryHubEntries: signal([
              { key: 'question-library', label: 'Question library', icon: 'pi pi-database', route: '/coding', family: 'question' },
              { key: 'incidents', label: 'Debug scenarios', icon: 'pi pi-bolt', route: '/incidents', family: 'incident' },
              {
                key: 'system-design',
                label: 'System design',
                icon: 'pi pi-sitemap',
                route: '/coding',
                query: { view: 'formats', category: 'system' },
                family: 'question',
              },
              { key: 'tradeoff-battles', label: 'Tradeoff battles', icon: 'pi pi-directions-alt', route: '/tradeoffs', family: 'tradeoff-battle' },
            ]),
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
    const featuredLink = fixture.nativeElement.querySelector('a[href="/react/trivia/react-hooks-rules"]') as HTMLAnchorElement | null;
    const incidentsLink = fixture.nativeElement.querySelector('a[href="/incidents"]') as HTMLAnchorElement | null;
    expect(codingLink).toBeTruthy();
    expect(triviaLink).toBeTruthy();
    expect(featuredLink).toBeTruthy();
    expect(incidentsLink).toBeTruthy();

    const mustKnowStat = fixture.nativeElement.textContent || '';
    expect(mustKnowStat).toContain('Must know');

    const priorityChip = fixture.nativeElement.querySelector('.iq-item__chip--priority[data-priority="must_know"]') as HTMLElement | null;
    expect(priorityChip?.textContent || '').toContain('Must know');

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

  it('uses javascript-only crucial lists on master hub', async () => {
    routeStub.snapshot.data.interviewQuestions = {
      keyword: 'frontend interview questions',
      title: 'Frontend Interview Questions for Quick Prep',
      techs: ['javascript', 'react', 'angular', 'vue', 'html', 'css'],
      isMasterHub: true,
    };
    routeStub.snapshot.data.interviewQuestionsList = {
      techs: ['javascript', 'react', 'angular', 'vue', 'html', 'css'],
      coding: [
        {
          id: 'js-array-flatten',
          title: 'Flatten nested arrays',
          type: 'coding',
          technology: 'javascript',
          difficulty: 'easy',
          access: 'free',
          tags: [],
          importance: 5,
          companies: [],
          description: 'Flatten nested arrays without libraries.',
          tech: 'javascript',
        },
        {
          id: 'react-context-selector',
          title: 'Context selector optimization',
          type: 'coding',
          technology: 'react',
          difficulty: 'hard',
          access: 'free',
          tags: [],
          importance: 5,
          companies: [],
          description: 'Optimize context updates in React.',
          tech: 'react',
        },
      ],
      trivia: [
        {
          id: 'js-event-loop',
          title: 'Event loop ordering',
          type: 'trivia',
          technology: 'javascript',
          difficulty: 'easy',
          access: 'free',
          tags: [],
          importance: 5,
          companies: [],
          description: 'Explain microtask vs macrotask order.',
          tech: 'javascript',
        },
        {
          id: 'react-usememo',
          title: 'useMemo trade-offs',
          type: 'trivia',
          technology: 'react',
          difficulty: 'intermediate',
          access: 'free',
          tags: [],
          importance: 5,
          companies: [],
          description: 'Explain useMemo trade-offs.',
          tech: 'react',
        },
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
  });
});
