import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { AnalyticsService } from '../../core/services/analytics.service';
import { QuestionService } from '../../core/services/question.service';
import { SeoService } from '../../core/services/seo.service';
import { InterviewQuestionsLandingComponent } from './interview-questions-landing.component';

const JAVASCRIPT_SHORT_ANSWER_QUESTIONS = [
  'What are callbacks in JavaScript?',
  'What is the difference between == and ===?',
  'What is hoisting in JavaScript?',
  'How do closures work in JavaScript?',
  'What is the difference between arrow functions and regular functions?',
  'How does this work in JavaScript?',
  'What is the difference between var, let, and const?',
  'What is the difference between null, undefined, and undeclared?',
  'What is the JavaScript event loop?',
  'What are microtasks and macrotasks?',
  'What is the purpose of Promises?',
  'How is async/await different from Promises?',
  'What is the difference between Promise.all, allSettled, race, and any?',
  'How do you handle async race conditions?',
  'How do you debug async JavaScript issues?',
  'What is the difference between map, filter, and reduce?',
  'How do you remove duplicates from an array?',
  'How do you implement debounce?',
  'How do you implement throttle?',
  'What is the difference between shallow and deep cloning?',
  'Why does Array.sort() sometimes sort numbers incorrectly?',
  'Why is immutability important in JavaScript interviews?',
  'How do you prevent XSS in JavaScript?',
  'What is prototypal inheritance in JavaScript?',
  'What is type coercion in JavaScript?',
];

const ANGULAR_SHORT_ANSWER_QUESTIONS = [
  'What is Angular?',
  'What is the difference between Angular and AngularJS?',
  'What are components in Angular?',
  'What is metadata in an Angular component?',
  'What are directives in Angular?',
  'What is the difference between structural and attribute directives?',
  'What are pipes in Angular?',
  'What is data binding in Angular?',
  'What is the difference between interpolation and property binding?',
  'What are @Input() and @Output()?',
  'What is the difference between constructor and ngOnInit()?',
  'What are Angular lifecycle hooks?',
  'What is dependency injection in Angular?',
  'What are services in Angular?',
  'What is hierarchical dependency injection?',
  'What is change detection in Angular?',
  'What is OnPush change detection?',
  'What is Zone.js used for in Angular?',
  'What are Observables and RxJS in Angular?',
  'How does HttpClient request cancellation work?',
  'What is the difference between template-driven and reactive forms?',
  'What is lazy loading in Angular?',
  'What are standalone components?',
  'What is NgRx and when should you use it?',
  'How do you prevent memory leaks in Angular?',
];

const ANGULAR_TESTING_QUESTIONS = [
  'When should you use TestBed instead of a plain unit test?',
  'How do you test Angular component inputs and outputs?',
  'What do fakeAsync() and tick() do in Angular tests?',
  'How does HttpTestingController test HttpClient code?',
  'What are Angular component harnesses?',
  'How do you test Angular guards and resolvers?',
  'How do you test Observable UI rendered with async pipe?',
  'What makes Angular tests brittle?',
];

const ANGULAR_SECURITY_QUESTIONS = [
  'How does Angular protect templates from XSS?',
  'What is the security difference between interpolation and [innerHTML]?',
  'What is DomSanitizer used for?',
  'Why is bypassSecurityTrustHtml dangerous?',
  'How should Angular handle user-controlled URLs?',
  'How do you render CMS or rich text safely in Angular?',
  'How do CSP and backend validation support Angular security?',
  'Why can direct DOM access create Angular security bugs?',
];

const ANGULAR_CLASSIC_QUESTIONS = [
  'What is the difference between guards and resolvers?',
  'What is the difference between CanMatch and CanActivate?',
  'What happens if a resolver Observable never completes?',
  'What is the difference between AOT and JIT in Angular?',
  'How does Angular template compilation help catch bugs?',
  'How should you approach Angular performance profiling?',
  'What can go wrong during NgModule to standalone migration?',
  'What is the difference between lazy loading and preloading?',
];

const REACT_SHORT_ANSWER_QUESTIONS = [
  'What is React?',
  'What are React components?',
  'What is JSX?',
  'What are props in React?',
  'What is state in React?',
  'What is one-way data flow in React?',
  'Why are keys important in React lists?',
  'What is the difference between controlled and uncontrolled inputs?',
  'What does lifting state up mean?',
  'What are React hooks?',
  'What are the Rules of Hooks?',
  'What is useState used for?',
  'What is useEffect used for?',
  'How does effect cleanup work?',
  'What are stale closures in React?',
  'What is the difference between useRef and useState?',
  'What is the difference between useMemo and useCallback?',
  'How can Context cause performance issues?',
  'What causes a React component to re-render?',
  'What is state batching in React?',
  'Why is derived state risky?',
  'What problem do error boundaries solve?',
  'What are React portals?',
  'What is the difference between render props and HOCs?',
  'Why does StrictMode run some effects twice in development?',
];

const REACT_RENDERING_INTERNALS_QUESTIONS = [
  'What is the Virtual DOM in React?',
  'What is the difference between render phase and commit phase?',
  'What is reconciliation in React?',
  'What assumptions does React diffing use?',
  'What is Fiber in React?',
  'How do keys preserve or reset state?',
  'How do fragments affect reconciliation?',
  'What is the difference between useLayoutEffect and useEffect?',
];

const REACT_REACT19_SERVER_QUESTIONS = [
  'What are React 19 Actions?',
  'What is useActionState used for?',
  'What is useOptimistic used for?',
  'What is useFormStatus used for?',
  'What is use() with Suspense at a high level?',
  'What is the difference between Server Components and Client Components?',
  'How do Next.js App Router boundaries affect data ownership?',
  'How do streaming, Suspense, and hydration mismatches fit together?',
];

const REACT_TESTING_QUESTIONS = [
  'How should React Testing Library tests be written?',
  'What is the difference between Jest and Vitest for React tests?',
  'What does act() do in React tests?',
  'How do you test async loading and error UI?',
  'How do mocked API tests with MSW-style boundaries work?',
  'How do you test hooks through components?',
  'How does StrictMode affect effect tests?',
  'What makes React tests brittle?',
];

const HTML_CSS_SHORT_ANSWER_QUESTIONS = [
  'What is semantic HTML?',
  'What is the DOM?',
  'How should labels work in HTML forms?',
  'What is accessibility in HTML and CSS?',
  'How should alt text work for images?',
  'When should you use a button instead of a link?',
  'How does native form validation work?',
  'What metadata belongs in the head?',
  'What is the CSS box model?',
  'How does the CSS cascade work?',
  'What is CSS specificity?',
  'When should you use Flexbox?',
  'When should you use CSS Grid?',
  'How does CSS positioning work?',
  'How does z-index work?',
  'What are media queries used for?',
  'How do responsive images work?',
  'What are CSS custom properties?',
  'What are pseudo-classes and pseudo-elements?',
  'How do you debug CSS overflow?',
  'What causes layout shift?',
  'How should focus states be styled?',
  'What is the difference between block, inline, and inline-block?',
  'How do rem, em, px, and percent differ?',
  'How do you make an HTML and CSS component responsive?',
];

const HTML_CSS_SEMANTICS_QUESTIONS = [
  'How do landmarks improve a page?',
  'How should headings be structured?',
  'When should you add ARIA?',
  'How should form errors be exposed?',
  'How do tables stay accessible?',
  'How should a dialog be implemented?',
  'How do anchors and buttons affect keyboard behavior?',
  'How do you test HTML accessibility quickly?',
];

const HTML_CSS_LAYOUT_QUESTIONS = [
  'How do Flexbox and Grid differ?',
  'How do cascade layers change CSS conflicts?',
  'How do you avoid specificity wars?',
  'How does position sticky fail?',
  'How do stacking contexts affect overlays?',
  'How should CSS custom properties be scoped?',
  'How do you choose breakpoints?',
  'How do you keep CSS maintainable at scale?',
];

const HTML_CSS_CODE_SCENARIOS = [
  'Why is this input hard to use with assistive technology?',
  'Why can this image link have a poor accessible name?',
  'Why does this flex item overflow?',
  'Why does this grid create horizontal scroll?',
  'Why does this modal appear behind the header?',
  'Why is this button not keyboard friendly?',
  'Why can this hero image cause layout shift?',
  'Why does this required field still need server validation?',
];

const HTML_CSS_BROWSER_DEBUG_QUESTIONS = [
  'How does the browser turn HTML and CSS into pixels?',
  'What is a reflow or layout recalculation?',
  'How do you debug an element that is not clickable?',
  'How do you debug missing styles?',
  'How do you debug invisible content?',
  'How do fonts affect layout?',
  'How do you debug mobile viewport issues?',
  'How do you debug focus order?',
];

const HTML_CSS_RESPONSIVE_QUESTIONS = [
  'What does mobile-first CSS mean?',
  'How do container queries differ from media queries?',
  'How should a navigation bar adapt on small screens?',
  'How should cards adapt in a responsive grid?',
  'How do you handle long words and untrusted text?',
  'How do you keep touch targets usable?',
  'How do reduced motion preferences affect CSS?',
  'How do you test responsive HTML and CSS before shipping?',
];

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
    expect(fixture.nativeElement.textContent || '').toContain('Are these React interview questions for beginners and experienced developers?');
    expect(fixture.nativeElement.textContent || '').not.toContain('Angular interview topic map');
    expect(fixture.nativeElement.textContent || '').not.toContain('HTML interview topic map');
    expect(fixture.nativeElement.querySelector('.iq-js-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-angular-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-react-toc')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-editorial-signal')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--javascript-output')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--javascript-browser')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-clusters')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--react-short-answers')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--react-audience')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--react-rendering-internals')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--react-react19-server')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--react-testing')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--react-scenarios')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--react-modern')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-clusters')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-audience')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-testing')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-security')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-classic')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-scenarios')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-modern')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-coverage')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--html-coverage')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-html-css-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--html-css-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--html-css-code')).toBeNull();
  });

  it('renders React-only answer-first coverage, scenarios, modern topics, and schema mentions', async () => {
    const fixture = TestBed.createComponent(InterviewQuestionsLandingComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent || '';

    expect(text).toContain('React Interview Questions and Answers');
    expect(text).toContain('Reviewed May 20, 2026');
    expect(text).toContain('FrontendAtlas Editor');
    expect(text).toContain('65 visible React questions across answers, scenarios, modern React, rendering internals, React 19, server-first React, testing, state, and performance');
    expect(text).toContain('On this page');
    expect(text).toContain('Popular React interview question clusters');
    expect(text).toContain('Beginner');
    expect(text).toContain('Experienced');
    expect(text).toContain('Rendering internals');
    expect(text).toContain('React 19/server');
    expect(text).toContain('Testing');
    expect(text).toContain('Hooks');
    expect(text).toContain('State/forms');
    expect(text).toContain('Performance');
    expect(text).toContain('Top React interview questions and short answers, beginner to advanced');
    expect(text).toContain('Review React fundamentals, hooks, state ownership, rendering behavior, and modern APIs');
    expect(text).toContain('React interview questions for beginners and experienced developers');
    expect(text).toContain('For beginners');
    expect(text).toContain('For experienced developers');
    expect(text).toContain('React rendering internals interview questions');
    expect(text).toContain('React 19 and server-first React interview questions');
    expect(text).toContain('React testing interview questions with Testing Library, act, and mocked APIs');
    expect(text).toContain('React scenario and code interview questions');
    expect(text).toContain('Modern React interview questions');
    for (const question of REACT_SHORT_ANSWER_QUESTIONS) {
      expect(text).toContain(question);
    }
    for (const question of REACT_RENDERING_INTERNALS_QUESTIONS) {
      expect(text).toContain(question);
    }
    for (const question of REACT_REACT19_SERVER_QUESTIONS) {
      expect(text).toContain(question);
    }
    for (const question of REACT_TESTING_QUESTIONS) {
      expect(text).toContain(question);
    }
    expect(text.indexOf('Top React interview questions and short answers, beginner to advanced')).toBeLessThan(
      text.indexOf('React rendering internals interview questions')
    );
    expect(text.indexOf('React testing interview questions with Testing Library, act, and mocked APIs')).toBeLessThan(
      text.indexOf('React scenario and code interview questions')
    );
    expect(text.indexOf('Modern React interview questions')).toBeLessThan(
      text.indexOf('Most crucial React coding interview questions')
    );
    expect(text.indexOf('React rendering internals interview questions')).toBeLessThan(
      text.indexOf('Most crucial React coding interview questions')
    );
    expect(text).toContain('Why can this delayed counter lose updates?');
    expect(text).toContain('What is wrong with this polling effect?');
    expect(text).toContain('Why can an index key reset the wrong row state?');
    expect(text).toContain('Why can this Context provider rerender too much UI?');
    expect(text).toContain('Why is this derived state unnecessary?');
    expect(text).toContain('Why does this input switch from uncontrolled to controlled?');
    expect(text).toContain('Why does memoization not help this child?');
    expect(text).toContain('Why does this effect appear to run twice in development?');
    expect(text).toContain('What changed with React 18 automatic batching?');
    expect(text).toContain('What are Suspense boundaries used for?');
    expect(text).toContain('What are React Server Components at a high level?');
    expect(text).toContain('How do you debug a hydration mismatch?');
    expect(text).toContain('Are these React interview questions for beginners and experienced developers?');
    expect(text).toContain('Does this page cover React rendering internals?');
    expect(text).toContain('Does this page include React 19 and server-first React questions?');
    expect(text).toContain('Does this page include React testing interview questions?');
    expect(text).toContain('How should I prepare after reviewing these React interview questions?');
    expect(text).toContain('Learn how to prepare for a React interview');
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
    expect(text).not.toContain('Top JavaScript interview questions and short answers, beginner to advanced');
    expect(text).not.toContain('Top Angular interview questions and short answers, beginner to advanced');
    expect(text).not.toContain('Angular scenario and code interview questions');
    expect(text).not.toContain('Popular Angular interview question clusters');
    expect(text).not.toContain('Are these JavaScript interview questions for beginners or experienced developers?');
    expect(text).not.toContain('Do these include output-based JavaScript interview questions?');
    expect(text).not.toContain('Where should I practice JavaScript coding interview questions?');
    expect(text).not.toContain('Output-based JavaScript interview questions');
    expect(text).not.toContain('DOM, browser, and security questions');
    expect(text).not.toContain('JavaScript interview topic map');
    expect(text).not.toContain('Angular interview topic map');
    expect(text).not.toContain('HTML interview topic map');

    expect(fixture.nativeElement.querySelector('.iq-js-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-angular-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-react-toc')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-react-clusters-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-react-short-answers-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-react-audience-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-react-rendering-internals-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-react-react19-server-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-react-testing-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-react-scenarios-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-react-modern-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-react-coding-preview-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-react-concept-preview-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-react-coverage-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--javascript-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--javascript-output')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--javascript-browser')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-clusters')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-cluster-card').length).toBe(8);
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-react-short-answers-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-react-audience-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-react-rendering-internals-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-react-react19-server-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-react-testing-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-react-modern-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--react-short-answers')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-short-answer').length).toBe(25);
    expect(fixture.nativeElement.querySelector('.iq-section--react-audience')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-audience-card').length).toBe(2);
    expect(fixture.nativeElement.querySelector('.iq-section--react-rendering-internals')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-section--react-rendering-internals .iq-focused-card').length).toBe(8);
    expect(fixture.nativeElement.querySelector('.iq-section--react-react19-server')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-section--react-react19-server .iq-focused-card').length).toBe(8);
    expect(fixture.nativeElement.querySelector('.iq-section--react-testing')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-section--react-testing .iq-focused-card').length).toBe(8);
    expect(fixture.nativeElement.querySelector('.iq-section--react-scenarios')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-scenario-card').length).toBe(8);
    expect(fixture.nativeElement.querySelector('.iq-section--react-modern')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-modern-card').length).toBe(8);
    expect(
      fixture.nativeElement.querySelectorAll(
        '.iq-short-answer, .iq-scenario-card, .iq-modern-card, .iq-focused-card'
      ).length
    ).toBe(65);
    expect(fixture.nativeElement.querySelector('.iq-section--angular-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-clusters')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-audience')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-testing')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-security')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-classic')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-scenarios')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-modern')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--javascript-coverage')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-coverage')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-coverage')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--html-coverage')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-why-props-immutable"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-why-hooks-have-rules"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-usestate-purpose"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-useeffect-purpose"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-stale-state-closures"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-useref-vs-usestate"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-usememo-vs-usecallback"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-context-performance-issues"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-controlled-vs-uncontrolled"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-keys-in-lists"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-lifting-state-up"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-component-rerendering"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-why-batching-state-updates"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-derived-state-anti-pattern"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-error-boundaries-what-they-solve"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-portals"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-render-props-vs-hocs"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-virtual-dom"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-reconciliation"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-diffing-algorithm"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-fragments-dom-and-reconciliation"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-useeffect-vs-uselayouteffect"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-strictmode-purpose"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-strictmode-double-invoke-effects"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/coding/react-chat-streaming-ui"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-functional-vs-class-components"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/trivia/react-prevent-unnecessary-rerenders"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/react/coding/react-debug-double-render"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/guides/framework-prep/react-prep-path"]')).toBeTruthy();

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
    const faqPage = graph.find((entry: any) => entry?.['@type'] === 'FAQPage');

    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Beginner to advanced React interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React interview questions for experienced developers')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React hooks interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React useEffect interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React state interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React rendering interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React performance interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React Context interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React forms interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React StrictMode interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React Suspense interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React rendering internals interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React Virtual DOM interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React reconciliation interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React Fiber interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React 19 interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React Actions interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React useActionState interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React useOptimistic interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React Server Components interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Next.js App Router React interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React hydration interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React Testing Library interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('React testing interview questions')
    )).toBeTrue();
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
      String(entry?.name || '').includes('React scenario questions')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('React stale closures')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('React keys in lists')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('React controlled and uncontrolled inputs')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('React 18 automatic batching')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('React Server Components')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('React hydration mismatch debugging')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('React render phase and commit phase')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('React diffing algorithm')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('React form actions and useFormStatus')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('React use with Suspense')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('Next.js caching and data ownership')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('React streaming UI questions')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('Jest and Vitest React testing')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('React act async updates')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('MSW mocked API testing')
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
    expect(collection?.dateModified).toBe('2026-05-20T00:00:00.000Z');
    expect(collection?.reviewedBy?.name).toBe('FrontendAtlas Editor');
    expect(faqPage).toBeTruthy();
    expect(faqPage?.name).toBe('Top React interview questions and short answers, beginner to advanced');
    expect(Array.isArray(faqPage?.mainEntity)).toBeTrue();
    expect(faqPage?.mainEntity.length).toBe(25);
    expect(faqPage?.mainEntity.map((entry: any) => entry?.name)).toEqual(REACT_SHORT_ANSWER_QUESTIONS);
    const staleClosureEntry = faqPage?.mainEntity.find((entry: any) =>
      entry?.name === 'What are stale closures in React?'
    );
    expect(String(staleClosureEntry?.acceptedAnswer?.text || '')).toContain('older render');
  });

  it('renders JavaScript-only coverage for cloning, async debugging, best practices, resources, and schema mentions', async () => {
    routeStub.snapshot.data.interviewQuestions = {
      keyword: 'javascript interview questions',
      title: 'JavaScript Interview Questions and Answers',
      techs: ['javascript'],
    };
    routeStub.snapshot.data.seo = {
      title: 'JavaScript Interview Questions and Answers',
      description: 'Practice JavaScript interview questions and answers with coding prompts, concept questions, cloning, promises, async debugging, immutability, XSS prevention, common mistakes, and resources.',
    };
    routeStub.snapshot.data.interviewQuestionsList = {
      techs: ['javascript'],
      coding: [
        { id: 'js-shallow-clone', title: 'Shallow Clone', type: 'coding', technology: 'javascript', difficulty: 'easy', access: 'free', tags: [], importance: 5, companies: [], description: 'Clone top-level object properties.', tech: 'javascript' },
        { id: 'js-array-sort', title: 'Sort Numbers', type: 'coding', technology: 'javascript', difficulty: 'easy', access: 'free', tags: [], importance: 4, companies: [], description: 'Sort numbers with a comparator.', tech: 'javascript' },
      ],
      trivia: [
        { id: 'js-promises-async-await', title: 'Promises and async/await', type: 'trivia', technology: 'javascript', difficulty: 'easy', access: 'free', tags: [], importance: 5, companies: [], description: 'Explain promises.', tech: 'javascript' },
        { id: 'js-shallow-vs-deep-copy', title: 'Shallow vs Deep Copy', type: 'trivia', technology: 'javascript', difficulty: 'intermediate', access: 'free', tags: [], importance: 5, companies: [], description: 'Compare clone depth.', tech: 'javascript' },
      ],
    };
    routeStub.snapshot.url = [{ path: 'javascript' }, { path: 'interview-questions' }];
    routeStub.snapshot.pathFromRoot = [{ url: [] }, { url: [{ path: 'javascript' }, { path: 'interview-questions' }] }];

    const fixture = TestBed.createComponent(InterviewQuestionsLandingComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent || '';

    expect(text).toContain('JavaScript Interview Questions and Answers');
    expect(text).toContain('Reviewed May 19, 2026');
    expect(text).toContain('FrontendAtlas Editor');
    expect(text).toContain('25 answers, 8 output questions, and 8 browser/DOM/security questions');
    expect(text).toContain('On this page');
    expect(text).toContain('Top JavaScript interview questions and short answers, beginner to advanced');
    expect(text).toContain('Use these beginner, intermediate, and advanced answers for a fast review');
    expect(text).toContain('Output-based JavaScript interview questions');
    expect(text).toContain('DOM, browser, and security questions');
    for (const question of JAVASCRIPT_SHORT_ANSWER_QUESTIONS) {
      expect(text).toContain(question);
    }
    expect(text.indexOf('Top JavaScript interview questions and short answers, beginner to advanced')).toBeLessThan(
      text.indexOf('Most crucial JavaScript coding interview questions')
    );
    expect(text.indexOf('DOM, browser, and security questions')).toBeLessThan(
      text.indexOf('Most crucial JavaScript coding interview questions')
    );
    expect(text).toContain('JavaScript interview topic map');
    expect(text).toContain('What does typeof null return?');
    expect(text).toContain('What is the event loop output order?');
    expect(text).toContain('What happens when a method loses its receiver?');
    expect(text).toContain('What is event delegation?');
    expect(text).toContain('What is the difference between cookies, localStorage, and sessionStorage?');
    expect(text).toContain('Shallow vs deep cloning');
    expect(text).toContain('Promises and async operations');
    expect(text).toContain('Async race conditions and stale updates');
    expect(text).toContain('Immutability and state updates');
    expect(text).toContain('Sorting, comparators, and mutation');
    expect(text).toContain('DOM XSS prevention');
    expect(text).toContain('Common mistakes in JavaScript interviews');
    expect(text).toContain('JavaScript coding interview best practices');
    expect(text).toContain('How to debug async JavaScript issues');
    expect(text).toContain('Best resources for JavaScript interview preparation');
    expect(text).toContain('Are these JavaScript interview questions for beginners or experienced developers?');
    expect(text).toContain('Do these include output-based JavaScript interview questions?');
    expect(text).toContain('Where should I practice JavaScript coding interview questions?');
    expect(text).toContain('What are common mistakes in JavaScript interviews?');
    expect(text).toContain('What are the best resources for JavaScript interview preparation?');
    expect(text).not.toContain('React interview topic map');
    expect(text).not.toContain('Popular React interview question clusters');
    expect(text).not.toContain('Top React interview questions and short answers, beginner to advanced');
    expect(text).not.toContain('React interview questions for beginners and experienced developers');
    expect(text).not.toContain('React rendering internals interview questions');
    expect(text).not.toContain('React 19 and server-first React interview questions');
    expect(text).not.toContain('React testing interview questions with Testing Library, act, and mocked APIs');
    expect(text).not.toContain('React scenario and code interview questions');
    expect(text).not.toContain('Modern React interview questions');
    expect(text).not.toContain('Angular interview topic map');
    expect(text).not.toContain('Top Angular interview questions and short answers, beginner to advanced');
    expect(text).not.toContain('Angular scenario and code interview questions');
    expect(text).not.toContain('HTML interview topic map');
    expect(text).not.toContain('Popular HTML and CSS interview question clusters');
    expect(text).not.toContain('Top HTML and CSS interview questions and short answers, beginner to advanced');
    expect(text).not.toContain('HTML and CSS code scenario interview questions');

    expect(fixture.nativeElement.querySelector('.iq-js-toc')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-angular-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-react-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-html-css-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-editorial-signal')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-javascript-short-answers-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-javascript-output-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-javascript-browser-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-javascript-coding-preview-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-javascript-concept-preview-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-javascript-coverage-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--javascript-short-answers')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-short-answer').length).toBe(25);
    expect(fixture.nativeElement.querySelectorAll('.iq-short-answer__level').length).toBeGreaterThanOrEqual(25);
    expect(fixture.nativeElement.querySelector('.iq-section--javascript-output')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-output-card').length).toBe(8);
    expect(fixture.nativeElement.querySelector('.iq-section--javascript-browser')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-browser-card').length).toBe(8);
    expect(fixture.nativeElement.querySelector('.iq-section--javascript-coverage')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--react-clusters')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-audience')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-rendering-internals')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-react19-server')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-testing')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-scenarios')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-modern')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-clusters')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-audience')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-testing')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-security')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-classic')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-scenarios')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-modern')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-coverage')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-coverage')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--html-coverage')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--html-css-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--html-css-code')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/javascript/trivia/js-closures"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/javascript/trivia/js-callbacks"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/javascript/trivia/js-event-loop"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/javascript/trivia/js-promise-fundamental-understanding"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/javascript/trivia/js-async-race-conditions"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/javascript/trivia/js-xss-dom-sinks"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/javascript/trivia/js-map-filter-reduce"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/javascript/trivia/js-prototypal-inheritance"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/javascript/trivia/js-type-coercion"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/javascript/trivia/js-event-delegation"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/javascript/trivia/js-event-bubbling-capturing"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/javascript/trivia/js-cookie-sessionstorage-localstorage"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/javascript/coding/js-dom-find-node"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/javascript/debug/js-debug-lost-this-binding"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/javascript/coding/js-array-sort"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/guides/framework-prep/javascript-prep-path"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/javascript/trivia/js-shallow-vs-deep-copy"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/javascript/trivia/js-promises-async-await"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/javascript/trivia/js-async-race-conditions"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/javascript/trivia/js-mutability-vs-immutability"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/javascript/coding/js-array-sort"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/javascript/trivia/js-xss-dom-sinks"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/javascript/debug/js-debug-async-race"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="https://tc39.es/ecma262/multipage/"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html"]')).toBeTruthy();

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
    const faqPage = graph.find((entry: any) => entry?.['@type'] === 'FAQPage');

    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('JavaScript shallow copy versus deep copy')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('JavaScript async race conditions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('DOM XSS prevention in JavaScript')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Output-based JavaScript interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('JavaScript DOM events and event delegation')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Beginner to advanced JavaScript interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('JavaScript interview questions for beginners')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('JavaScript interview questions for experienced developers')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('JavaScript coding interview questions')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('Common JavaScript interview mistakes')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('JavaScript interview preparation resources')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('JavaScript event bubbling and capturing')
    )).toBeTrue();
    expect(collection?.dateModified).toBe('2026-05-19T00:00:00.000Z');
    expect(collection?.reviewedBy?.name).toBe('FrontendAtlas Editor');
    expect(faqPage).toBeTruthy();
    expect(faqPage?.name).toBe('Top JavaScript interview questions and short answers, beginner to advanced');
    expect(Array.isArray(faqPage?.mainEntity)).toBeTrue();
    expect(faqPage?.mainEntity.length).toBe(25);
    expect(faqPage?.mainEntity.map((entry: any) => entry?.name)).toEqual(JAVASCRIPT_SHORT_ANSWER_QUESTIONS);
    const hoistingEntry = faqPage?.mainEntity.find((entry: any) =>
      entry?.name === 'What is hoisting in JavaScript?'
    );
    expect(String(hoistingEntry?.acceptedAnswer?.text || '')).toContain('temporal dead zone');
  });

  it('scrolls JavaScript TOC buttons to page sections without routing to the app root', async () => {
    routeStub.snapshot.data.interviewQuestions = {
      keyword: 'javascript interview questions',
      title: 'JavaScript Interview Questions and Answers',
      techs: ['javascript'],
    };
    routeStub.snapshot.data.interviewQuestionsList = {
      techs: ['javascript'],
      coding: [],
      trivia: [],
    };
    routeStub.snapshot.url = [{ path: 'javascript' }, { path: 'interview-questions' }];
    routeStub.snapshot.pathFromRoot = [{ url: [] }, { url: [{ path: 'javascript' }, { path: 'interview-questions' }] }];

    const fixture = TestBed.createComponent(InterviewQuestionsLandingComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const outputHeading = fixture.nativeElement.querySelector('#iq-javascript-output-title') as HTMLElement;
    const scrollIntoView = jasmine.createSpy('scrollIntoView');
    (outputHeading as any).scrollIntoView = scrollIntoView;
    const replaceState = spyOn(window.history, 'replaceState').and.stub();

    const tocButton = fixture.nativeElement.querySelector(
      'button[data-target="iq-javascript-output-title"]',
    ) as HTMLButtonElement;
    tocButton.click();

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(replaceState).toHaveBeenCalledWith(
      null,
      '',
      `${window.location.pathname}${window.location.search}#iq-javascript-output-title`,
    );
  });

  it('scrolls Angular TOC buttons to page sections without routing to the app root', async () => {
    routeStub.snapshot.data.interviewQuestions = {
      keyword: 'angular interview questions',
      title: 'Angular Interview Questions and Answers',
      techs: ['angular'],
    };
    routeStub.snapshot.data.interviewQuestionsList = {
      techs: ['angular'],
      coding: [],
      trivia: [],
    };
    routeStub.snapshot.url = [{ path: 'angular' }, { path: 'interview-questions' }];
    routeStub.snapshot.pathFromRoot = [{ url: [] }, { url: [{ path: 'angular' }, { path: 'interview-questions' }] }];

    const fixture = TestBed.createComponent(InterviewQuestionsLandingComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const testingHeading = fixture.nativeElement.querySelector('#iq-angular-testing-title') as HTMLElement;
    const scrollIntoView = jasmine.createSpy('scrollIntoView');
    (testingHeading as any).scrollIntoView = scrollIntoView;
    const replaceState = spyOn(window.history, 'replaceState').and.stub();

    const tocButton = fixture.nativeElement.querySelector(
      'button[data-target="iq-angular-testing-title"]',
    ) as HTMLButtonElement;
    tocButton.click();

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(replaceState).toHaveBeenCalledWith(
      null,
      '',
      `${window.location.pathname}${window.location.search}#iq-angular-testing-title`,
    );
  });

  it('scrolls React TOC buttons to page sections without routing to the app root', async () => {
    const fixture = TestBed.createComponent(InterviewQuestionsLandingComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const scenariosHeading = fixture.nativeElement.querySelector('#iq-react-scenarios-title') as HTMLElement;
    const scrollIntoView = jasmine.createSpy('scrollIntoView');
    (scenariosHeading as any).scrollIntoView = scrollIntoView;
    const replaceState = spyOn(window.history, 'replaceState').and.stub();

    const tocButton = fixture.nativeElement.querySelector(
      'button[data-target="iq-react-scenarios-title"]',
    ) as HTMLButtonElement;
    tocButton.click();

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(replaceState).toHaveBeenCalledWith(
      null,
      '',
      `${window.location.pathname}${window.location.search}#iq-react-scenarios-title`,
    );
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

  it('renders HTML and CSS answer-first coverage while preserving format-category links', async () => {
    routeStub.snapshot.data.interviewQuestions = {
      keyword: 'html and css interview questions',
      title: 'HTML and CSS Interview Questions and Answers',
      techs: ['html', 'css'],
    };
    routeStub.snapshot.data.seo = {
      title: 'HTML and CSS Interview Questions and Answers',
      description: 'HTML and CSS interview questions and answers, beginner to advanced, with semantic HTML, forms, accessibility, Flexbox, Grid, cascade, specificity, responsive layout, and code scenarios.',
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
    expect(text).toContain('Reviewed May 20, 2026');
    expect(text).toContain('FrontendAtlas Editor');
    expect(text).toContain('65 visible HTML and CSS questions across semantics, forms, accessibility, layout, cascade, responsive UI, code scenarios, and browser debugging');
    expect(text).toContain('On this page');
    expect(text).toContain('Popular HTML and CSS interview question clusters');
    expect(text).toContain('Top HTML and CSS interview questions and short answers, beginner to advanced');
    expect(text).toContain('HTML and CSS interview questions for beginners and experienced frontend developers');
    expect(text).toContain('HTML semantics, forms, and accessibility interview questions');
    expect(text).toContain('CSS layout, cascade, and responsive interview questions');
    expect(text).toContain('HTML and CSS code scenario interview questions');
    expect(text).toContain('Browser rendering and UI debugging interview questions');
    expect(text).toContain('Responsive UI implementation interview questions');
    expect(text).toContain('Are these HTML and CSS interview questions for beginners and experienced developers?');
    expect(text).toContain('Does this page cover accessibility and forms?');
    expect(text).toContain('Does this page cover CSS layout, cascade, and responsive UI?');
    expect(text).toContain('Where should I practice HTML and CSS coding scenarios?');
    for (const question of HTML_CSS_SHORT_ANSWER_QUESTIONS) {
      expect(text).toContain(question);
    }
    for (const question of HTML_CSS_SEMANTICS_QUESTIONS) {
      expect(text).toContain(question);
    }
    for (const question of HTML_CSS_LAYOUT_QUESTIONS) {
      expect(text).toContain(question);
    }
    for (const question of HTML_CSS_CODE_SCENARIOS) {
      expect(text).toContain(question);
    }
    for (const question of HTML_CSS_BROWSER_DEBUG_QUESTIONS) {
      expect(text).toContain(question);
    }
    for (const question of HTML_CSS_RESPONSIVE_QUESTIONS) {
      expect(text).toContain(question);
    }
    expect(text.indexOf('Top HTML and CSS interview questions and short answers, beginner to advanced')).toBeLessThan(
      text.indexOf('Most crucial HTML and CSS coding interview questions')
    );
    expect(text.indexOf('Responsive UI implementation interview questions')).toBeLessThan(
      text.indexOf('Most crucial HTML and CSS coding interview questions')
    );
    expect(text).toContain('Most crucial HTML and CSS coding interview questions');
    expect(text).toContain('Most crucial HTML and CSS concept questions for interviews');
    expect(text).toContain('What HTML and CSS interview rounds test');
    expect(text).toContain('HTML and CSS coding + concept questions');
    expect(text).not.toContain('Most crucial HTML coding interview questions');
    expect(text).not.toContain('HTML interview topic map');
    expect(text).not.toContain('Top JavaScript interview questions and short answers, beginner to advanced');
    expect(text).not.toContain('Top Angular interview questions and short answers, beginner to advanced');
    expect(text).not.toContain('Top React interview questions and short answers, beginner to advanced');
    expect(fixture.nativeElement.querySelector('.iq-html-css-toc')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-html-css-short-answers-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-html-css-coding-preview-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--html-css-clusters')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--html-css-short-answers')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--html-css-audience')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--html-css-semantics')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--html-css-layout')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--html-css-code')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--html-css-browser')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--html-css-responsive')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-cluster-card').length).toBe(6);
    expect(fixture.nativeElement.querySelectorAll('.iq-short-answer').length).toBe(25);
    expect(fixture.nativeElement.querySelectorAll('.iq-audience-card').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('.iq-section--html-css-semantics .iq-focused-card').length).toBe(8);
    expect(fixture.nativeElement.querySelectorAll('.iq-section--html-css-layout .iq-focused-card').length).toBe(8);
    expect(fixture.nativeElement.querySelectorAll('.iq-section--html-css-code .iq-scenario-card').length).toBe(8);
    expect(fixture.nativeElement.querySelectorAll('.iq-section--html-css-browser .iq-focused-card').length).toBe(8);
    expect(fixture.nativeElement.querySelectorAll('.iq-section--html-css-responsive .iq-focused-card').length).toBe(8);
    expect(
      fixture.nativeElement.querySelectorAll(
        '.iq-section--html-css-short-answers .iq-short-answer, .iq-section--html-css-semantics .iq-focused-card, .iq-section--html-css-layout .iq-focused-card, .iq-section--html-css-code .iq-scenario-card, .iq-section--html-css-browser .iq-focused-card, .iq-section--html-css-responsive .iq-focused-card'
      ).length
    ).toBe(65);
    expect(fixture.nativeElement.querySelector('a[href="/html/trivia/html-semantic-elements"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/coding/html-contact-form-labeled"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/coding/html-links-and-images"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/coding/html-forms-validation-required"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/coding/html-head-seo-basics"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/coding/html-dialog-confirm-a11y"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/trivia/css-box-model"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/trivia/css-specificity-hierarchy"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/trivia/css-cascade-order"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/trivia/css-display-flex"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/trivia/css-grid-vs-flexbox"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/trivia/css-position-relative-absolute-fixed"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/trivia/css-z-index"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/trivia/css-media-queries"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/trivia/css-make-element-responsive"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/coding/css-flexbox-navbar"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/coding/css-grid-card-gallery"]')).toBeTruthy();
    expect(codingViewAll.getAttribute('href') || '').toContain('/coding?view=formats&category=html-css&kind=coding&reset=1');
    expect(thirdItem.getAttribute('href') || '').toContain('/coding?view=formats&category=html-css&reset=1');

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
    const faqPage = graph.find((entry: any) => entry?.['@type'] === 'FAQPage');

    expect(collection?.dateModified).toBe('2026-05-20T00:00:00.000Z');
    expect(collection?.reviewedBy?.name).toBe('FrontendAtlas Editor');
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('HTML CSS interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('HTML and CSS interview questions for beginners')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('HTML and CSS interview questions for experienced developers')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('semantic HTML interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('CSS layout interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Flexbox and Grid interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('CSS specificity and cascade interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('accessibility interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('responsive UI interview questions')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('HTML and CSS code scenarios')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('Browser rendering and UI debugging')
    )).toBeTrue();
    expect(Array.isArray(faqPage?.mainEntity)).toBeTrue();
    expect(faqPage?.mainEntity.length).toBe(25);
    expect(faqPage?.mainEntity.map((entry: any) => entry?.name)).toEqual(HTML_CSS_SHORT_ANSWER_QUESTIONS);
    const semanticEntry = faqPage?.mainEntity.find((entry: any) =>
      entry?.name === 'What is semantic HTML?'
    );
    expect(semanticEntry?.acceptedAnswer?.text).toContain('Semantic HTML uses elements that describe the meaning and structure of content');
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
    expect(text).not.toContain('Popular React interview question clusters');
    expect(text).not.toContain('Top React interview questions and short answers, beginner to advanced');
    expect(text).not.toContain('React interview questions for beginners and experienced developers');
    expect(text).not.toContain('React rendering internals interview questions');
    expect(text).not.toContain('React 19 and server-first React interview questions');
    expect(text).not.toContain('React testing interview questions with Testing Library, act, and mocked APIs');
    expect(text).not.toContain('React scenario and code interview questions');
    expect(text).not.toContain('Modern React interview questions');
    expect(text).not.toContain('Popular HTML and CSS interview question clusters');
    expect(text).not.toContain('Top HTML and CSS interview questions and short answers, beginner to advanced');
    expect(text).not.toContain('HTML and CSS code scenario interview questions');
    expect(fixture.nativeElement.querySelector('.iq-react-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-html-css-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--html-css-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--html-css-code')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-clusters')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-audience')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-rendering-internals')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-react19-server')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-testing')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-scenarios')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-modern')).toBeNull();
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
    expect(text).not.toContain('Top JavaScript interview questions and short answers, beginner to advanced');
    expect(text).not.toContain('Top Angular interview questions and short answers, beginner to advanced');
    expect(text).not.toContain('Angular scenario and code interview questions');
    expect(text).not.toContain('Are these JavaScript interview questions for beginners or experienced developers?');
    expect(text).not.toContain('Output-based JavaScript interview questions');
    expect(text).not.toContain('DOM, browser, and security questions');
    expect(text).not.toContain('Angular interview topic map');
    expect(text).not.toContain('React interview topic map');
    expect(text).not.toContain('Popular React interview question clusters');
    expect(text).not.toContain('Top React interview questions and short answers, beginner to advanced');
    expect(text).not.toContain('React interview questions for beginners and experienced developers');
    expect(text).not.toContain('React rendering internals interview questions');
    expect(text).not.toContain('React 19 and server-first React interview questions');
    expect(text).not.toContain('React testing interview questions with Testing Library, act, and mocked APIs');
    expect(text).not.toContain('React scenario and code interview questions');
    expect(text).not.toContain('Modern React interview questions');
    expect(text).not.toContain('Popular HTML and CSS interview question clusters');
    expect(text).not.toContain('Top HTML and CSS interview questions and short answers, beginner to advanced');
    expect(text).not.toContain('HTML and CSS code scenario interview questions');

    expect(fixture.nativeElement.querySelector('.iq-js-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-angular-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-react-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-html-css-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--javascript-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--javascript-output')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--javascript-browser')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--html-css-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--html-css-code')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-clusters')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-audience')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-rendering-internals')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-react19-server')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-testing')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-scenarios')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-modern')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-clusters')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-audience')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-testing')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-security')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-classic')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-scenarios')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-modern')).toBeNull();
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
    expect(text).not.toContain('Top JavaScript interview questions and short answers, beginner to advanced');
    expect(text).not.toContain('Top Angular interview questions and short answers, beginner to advanced');
    expect(text).not.toContain('Angular scenario and code interview questions');
    expect(text).not.toContain('Where should I practice JavaScript coding interview questions?');
    expect(text).not.toContain('Output-based JavaScript interview questions');
    expect(text).not.toContain('DOM, browser, and security questions');
    expect(text).not.toContain('HTML interview topic map');
    expect(text).not.toContain('React interview topic map');
    expect(text).not.toContain('Popular React interview question clusters');
    expect(text).not.toContain('Top React interview questions and short answers, beginner to advanced');
    expect(text).not.toContain('React interview questions for beginners and experienced developers');
    expect(text).not.toContain('React rendering internals interview questions');
    expect(text).not.toContain('React 19 and server-first React interview questions');
    expect(text).not.toContain('React testing interview questions with Testing Library, act, and mocked APIs');
    expect(text).not.toContain('React scenario and code interview questions');
    expect(text).not.toContain('Modern React interview questions');
    expect(text).not.toContain('Best resources for learning HTML');
    expect(text).not.toContain('Popular HTML and CSS interview question clusters');
    expect(text).not.toContain('Top HTML and CSS interview questions and short answers, beginner to advanced');
    expect(text).not.toContain('HTML and CSS code scenario interview questions');
    expect(fixture.nativeElement.querySelector('.iq-js-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-angular-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-react-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-html-css-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--javascript-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--javascript-output')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--javascript-browser')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--html-css-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--html-css-code')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-clusters')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-audience')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-rendering-internals')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-react19-server')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-testing')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-scenarios')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-modern')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-clusters')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-audience')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-testing')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-security')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-classic')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-scenarios')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-modern')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--html-coverage')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-coverage')).toBeNull();
  });

  it('renders Angular-only answer-first coverage, scenarios, modern topics, and schema mentions', async () => {
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

    expect(text).toContain('Angular Interview Questions and Answers');
    expect(text).toContain('Reviewed May 20, 2026');
    expect(text).toContain('FrontendAtlas Editor');
    expect(text).toContain('65 visible Angular questions across answers, scenarios, modern Angular, testing, security, routing, and performance');
    expect(text).toContain('On this page');
    expect(text).toContain('Popular Angular interview question clusters');
    expect(text).toContain('Beginner');
    expect(text).toContain('Experienced');
    expect(text).toContain('Routing/Performance');
    expect(text).toContain('Top Angular interview questions and short answers, beginner to advanced');
    expect(text).toContain('Use these beginner, intermediate, and advanced Angular answers for a fast review');
    expect(text).toContain('Angular interview questions for beginners and experienced developers');
    expect(text).toContain('For beginners');
    expect(text).toContain('For experienced developers');
    expect(text).toContain('Angular testing interview questions');
    expect(text).toContain('Angular security interview questions');
    expect(text).toContain('Angular routing, compiler, and performance interview questions');
    expect(text).toContain('Angular scenario and code interview questions');
    expect(text).toContain('Modern Angular interview questions');
    for (const question of ANGULAR_SHORT_ANSWER_QUESTIONS) {
      expect(text).toContain(question);
    }
    for (const question of ANGULAR_TESTING_QUESTIONS) {
      expect(text).toContain(question);
    }
    for (const question of ANGULAR_SECURITY_QUESTIONS) {
      expect(text).toContain(question);
    }
    for (const question of ANGULAR_CLASSIC_QUESTIONS) {
      expect(text).toContain(question);
    }
    expect(text.indexOf('Top Angular interview questions and short answers, beginner to advanced')).toBeLessThan(
      text.indexOf('Angular testing interview questions')
    );
    expect(text.indexOf('Angular routing, compiler, and performance interview questions')).toBeLessThan(
      text.indexOf('Angular scenario and code interview questions')
    );
    expect(text.indexOf('Modern Angular interview questions')).toBeLessThan(
      text.indexOf('Most crucial Angular coding interview questions')
    );
    expect(text.indexOf('Angular testing interview questions')).toBeLessThan(
      text.indexOf('Most crucial Angular coding interview questions')
    );
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
    expect(text).toContain('Are these Angular interview questions for beginners and experienced developers?');
    expect(text).toContain('Does this page include Angular testing interview questions?');
    expect(text).toContain('Does this page cover Angular security, guards, resolvers, and performance?');
    expect(text).toContain('Why does this OnPush child stay stale after a nested mutation?');
    expect(text).toContain('Why is switchMap safer than mergeMap for typeahead search?');
    expect(text).toContain('What changes in zoneless Angular change detection?');
    expect(text).toContain('How do SSR and hydration affect Angular performance?');
    expect(text).not.toContain('Top JavaScript interview questions and short answers, beginner to advanced');
    expect(text).not.toContain('Do these include output-based JavaScript interview questions?');
    expect(text).not.toContain('Output-based JavaScript interview questions');
    expect(text).not.toContain('DOM, browser, and security questions');
    expect(text).not.toContain('HTML interview topic map');
    expect(text).not.toContain('React interview topic map');
    expect(text).not.toContain('Popular React interview question clusters');
    expect(text).not.toContain('Top React interview questions and short answers, beginner to advanced');
    expect(text).not.toContain('React interview questions for beginners and experienced developers');
    expect(text).not.toContain('React rendering internals interview questions');
    expect(text).not.toContain('React 19 and server-first React interview questions');
    expect(text).not.toContain('React testing interview questions with Testing Library, act, and mocked APIs');
    expect(text).not.toContain('React scenario and code interview questions');
    expect(text).not.toContain('Modern React interview questions');
    expect(text).not.toContain('Popular HTML and CSS interview question clusters');
    expect(text).not.toContain('Top HTML and CSS interview questions and short answers, beginner to advanced');
    expect(text).not.toContain('HTML and CSS code scenario interview questions');

    expect(fixture.nativeElement.querySelector('.iq-js-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-angular-toc')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-react-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-html-css-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-angular-short-answers-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-angular-audience-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-angular-testing-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-angular-security-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-angular-classic-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-angular-scenarios-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-angular-modern-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-angular-coding-preview-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-angular-concept-preview-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-angular-coverage-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--javascript-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--javascript-output')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--javascript-browser')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-clusters')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-audience')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-rendering-internals')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-react19-server')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-testing')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-scenarios')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-modern')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--html-css-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--html-css-code')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-clusters')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-cluster-card').length).toBe(6);
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-angular-short-answers-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-angular-audience-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-angular-testing-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-angular-security-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-angular-modern-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-angular-classic-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-short-answers')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-short-answer').length).toBe(25);
    expect(fixture.nativeElement.querySelector('.iq-section--angular-audience')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-audience-card').length).toBe(2);
    expect(fixture.nativeElement.querySelector('.iq-section--angular-testing')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-section--angular-testing .iq-focused-card').length).toBe(8);
    expect(fixture.nativeElement.querySelector('.iq-section--angular-security')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-section--angular-security .iq-focused-card').length).toBe(8);
    expect(fixture.nativeElement.querySelector('.iq-section--angular-classic')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-section--angular-classic .iq-focused-card').length).toBe(8);
    expect(fixture.nativeElement.querySelector('.iq-section--angular-scenarios')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-scenario-card').length).toBe(8);
    expect(fixture.nativeElement.querySelector('.iq-section--angular-modern')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-modern-card').length).toBe(8);
    expect(
      fixture.nativeElement.querySelectorAll(
        '.iq-short-answer, .iq-scenario-card, .iq-modern-card, .iq-focused-card'
      ).length
    ).toBe(65);
    expect(fixture.nativeElement.querySelector('a[href="/angular/trivia/angular-http-what-actually-cancels-request"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/angular/trivia/angular-dependency-injection"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/angular/trivia/angular-observables-rxjs"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/angular/trivia/angular-change-detection-strategies"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/angular/trivia/angular-onpush-change-detection-debugging-real-bug"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/angular/trivia/angular-zonejs-change-detection"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/angular/trivia/angular-template-driven-vs-reactive-forms-which-scales"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/angular/trivia/angular-routing"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/angular/trivia/angular-template-compilation-and-binding"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/angular/trivia/angular-data-binding"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/angular/trivia/angular-interpolation-vs-property-binding"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/angular/trivia/angular-lazy-loading"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/angular/trivia/angular-appmodule-standalone-changes"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/angular/trivia/angular-ngmodules-vs-standalone"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/angular/trivia/angular-performance-optimization"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/angular/trivia/ngrx-store-vs-component-state-angular-when-to-use"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/angular/trivia/angular-prevent-memory-leaks-unsubscribe-patterns"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/guides/framework-prep/angular-prep-path"]')).toBeTruthy();

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
    const faqPage = graph.find((entry: any) => entry?.['@type'] === 'FAQPage');

    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular dependency injection')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Beginner to advanced Angular interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular interview questions and answers')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular interview questions for beginners')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular interview questions for experienced developers')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Senior Angular interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular RxJS interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular change detection interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular dependency injection interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular testing interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular TestBed interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('fakeAsync tick Angular interview')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('HttpTestingController interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular security interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular DomSanitizer interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular XSS prevention interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular signals interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular standalone components interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('zoneless Angular interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular guards and resolvers interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular AOT and JIT interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular compiler interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular performance profiling interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular performance optimization interview questions')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular standalone components and signals')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular forms and testing')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular TestBed and fakeAsync')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular HttpTestingController')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular DomSanitizer and sanitization')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular XSS prevention')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular route guards and resolvers')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('Angular AOT versus JIT')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('Modern Angular interview topics')
    )).toBeTrue();
    expect(collection?.dateModified).toBe('2026-05-20T00:00:00.000Z');
    expect(collection?.reviewedBy?.name).toBe('FrontendAtlas Editor');
    expect(faqPage).toBeTruthy();
    expect(faqPage?.name).toBe('Top Angular interview questions and short answers, beginner to advanced');
    expect(Array.isArray(faqPage?.mainEntity)).toBeTrue();
    expect(faqPage?.mainEntity.length).toBe(25);
    expect(faqPage?.mainEntity.map((entry: any) => entry?.name)).toEqual(ANGULAR_SHORT_ANSWER_QUESTIONS);
    const httpEntry = faqPage?.mainEntity.find((entry: any) =>
      entry?.name === 'How does HttpClient request cancellation work?'
    );
    expect(String(httpEntry?.acceptedAnswer?.text || '')).toContain('unsubscribed');
    expect(fixture.nativeElement.querySelector('.iq-section--html-coverage')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--react-coverage')).toBeNull();
  });
});
