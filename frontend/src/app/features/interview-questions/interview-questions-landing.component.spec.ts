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

const VUE_SHORT_ANSWER_QUESTIONS = [
  'What is Vue.js?',
  'What is the difference between Vue 2 and Vue 3?',
  'How does Vue reactivity work?',
  'What is the difference between ref and reactive?',
  'What are computed properties in Vue?',
  'What happens when methods are called in Vue templates?',
  'When should you use watch in Vue?',
  'What is watchEffect in Vue?',
  'What does nextTick do in Vue?',
  'What are Vue lifecycle hooks?',
  'What are components in Vue?',
  'How should props work in Vue?',
  'Why should emits be declared in Vue?',
  'What are slots in Vue?',
  'When should you use provide and inject?',
  'What does v-model expand to?',
  'What is the difference between v-if and v-show?',
  'Why are keys important in v-for lists?',
  'What are Vue directives?',
  'What is the Composition API?',
  'What are composables in Vue?',
  'What is Vue Router used for?',
  'When should you use Pinia or Vuex?',
  'How does Vue virtual DOM diffing work?',
  'How do you improve Vue performance?',
];

const VUE_REACTIVITY_RENDERING_QUESTIONS = [
  'How does Vue know which component to update?',
  'Why can destructuring break Vue reactivity?',
  'Why should computed values avoid side effects?',
  'Why does nextTick matter for DOM reads?',
  'How does v-if affect component lifecycle?',
  'How do keys affect state preservation?',
  'What does Vue virtual DOM diffing optimize?',
  'How are Vue DOM updates batched?',
];

const VUE_COMPONENT_CONTRACT_QUESTIONS = [
  'Why should child components avoid mutating props?',
  'What is the difference between native and component events?',
  'How do scoped slots change component design?',
  'What is the hidden cost of provide/inject?',
  'How should v-model be designed on custom components?',
  'Why do single-file components help maintainability?',
  'What should a Vue component public API include?',
  'How do component boundaries affect scalability?',
];

const VUE_SCENARIO_QUESTIONS = [
  'Why does this destructured value stop updating?',
  'Why can this watcher loop forever?',
  'Why can this list keep the wrong input value?',
  'Why is this prop mutation fragile?',
  'Why does this focus call miss the input?',
  'Why does this form reset when toggled?',
  'Why is this computed property unsafe?',
  'Why can this search show stale results?',
];

const VUE_MODERN_QUESTIONS = [
  'How does Composition API differ from Options API?',
  'What does script setup improve?',
  'What makes a good Vue composable?',
  'Why is Pinia the modern default over Vuex?',
  'What changed with Vue Router 4 style guards?',
  'What is Teleport used for in Vue?',
  'What is Suspense used for in Vue?',
  'How do SSR and Nuxt affect Vue interviews?',
];

const VUE_TESTING_SECURITY_PERFORMANCE_QUESTIONS = [
  'How should Vue component behavior be tested?',
  'How do Vitest and Vue Test Utils fit together?',
  'How do you test async Vue updates?',
  'How do you test Vue emitted events?',
  'Why is v-html a security risk?',
  'How should rich text be rendered safely in Vue?',
  'How do you profile Vue performance?',
  'How do Vue components leak memory?',
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

const HTML_SHORT_ANSWER_QUESTIONS = [
  'What is HTML?',
  'What is the DOM?',
  'What is the difference between tags and elements?',
  'What does a valid HTML document structure include?',
  'What belongs in the head and body?',
  'What are semantic HTML elements?',
  'What is the difference between div and span?',
  'What is the difference between block and inline elements?',
  'How should anchors work in HTML?',
  'What does the href attribute do?',
  'How should image alt text work?',
  'How do HTML forms work?',
  'Why are labels better than placeholders?',
  'How does native form validation work?',
  'How should lists and navigation be marked up?',
  'How do accessible tables work?',
  'What metadata should an HTML page include?',
  'What are data attributes used for?',
  'When should you use an iframe?',
  'How do srcset and sizes work for images?',
  'How does browser HTML parsing affect the DOM?',
  'When should ARIA roles be used?',
  'What is Shadow DOM?',
  'How should native dialog behavior work?',
  'What is the difference between HTML, HTML5, and XHTML?',
];

const HTML_SEMANTICS_QUESTIONS = [
  'How do landmarks improve document structure?',
  'How should heading structure work?',
  'When should you use section and article?',
  'Why are generic div and span elements not enough?',
  'Why does the html lang attribute matter?',
  'How should list markup be used?',
  'How do data attributes fit into semantic markup?',
  'What makes an HTML document easy to scan?',
];

const HTML_FORMS_QUESTIONS = [
  'How should a label connect to a form control?',
  'Why is placeholder text not a label?',
  'How do input types improve forms?',
  'How do validation attributes work?',
  'How should form errors be exposed?',
  'How should radio buttons and checkboxes be grouped?',
  'What is the default method for an HTML form?',
  'Why should form actions use real buttons?',
];

const HTML_ACCESSIBILITY_QUESTIONS = [
  'When should you add ARIA?',
  'What is an accessible name?',
  'How should alt text work for linked images?',
  'How do you make data tables accessible?',
  'What makes an HTML dialog accessible?',
  'How should keyboard navigation be checked?',
  'How should iframes be exposed accessibly?',
  'How do you test HTML accessibility quickly?',
];

const HTML_METADATA_QUESTIONS = [
  'What belongs in the head for SEO and browser behavior?',
  'How should the title tag be used?',
  'What do meta tags do?',
  'Why does the viewport meta tag matter?',
  'How does HTML parsing affect invalid markup?',
  'How do script loading attributes affect parsing?',
  'How should responsive image markup be chosen?',
  'How should iframes be loaded and constrained?',
];

const HTML_MODERN_SCENARIO_QUESTIONS = [
  'How does native dialog compare with a custom modal?',
  'What are details, summary, and popover useful for?',
  'How do template and slot support component markup?',
  'Why can invalid nesting change the page structure?',
  'Why is this input hard to use: <input placeholder="Email">?',
  'Why is this image link weak: <a><img alt="arrow"></a>?',
  'Why is a table without headers hard to understand?',
  'Why is a clickable div a fragile button?',
];

const CSS_SHORT_ANSWER_QUESTIONS = [
  'What is CSS?',
  'How does the CSS cascade work?',
  'What is CSS specificity?',
  'What is inheritance in CSS?',
  'What is the CSS box model?',
  'What is the difference between margin and padding?',
  'How does display affect layout?',
  'When should you use Flexbox?',
  'When should you use CSS Grid?',
  'How does CSS positioning work?',
  'What is a stacking context?',
  'How does z-index work?',
  'How do rem, em, px, and percent differ?',
  'What are media queries used for?',
  'What are container queries?',
  'What does responsive design mean in CSS?',
  'What are CSS custom properties?',
  'What are pseudo-classes and pseudo-elements?',
  'What is BEM in CSS?',
  'How do you debug CSS overflow?',
  'How do min-width and max-width affect responsive layout?',
  'How do transforms and transitions differ?',
  'How should CSS animations be used safely?',
  'How do you improve CSS performance?',
  'How do you debug a CSS layout bug?',
];

const CSS_CASCADE_QUESTIONS = [
  'What order does the cascade use to choose a declaration?',
  'How is CSS specificity calculated?',
  'How do cascade layers help large stylesheets?',
  'How are inheritance and initial values different?',
  'How do :is(), :where(), and :has() affect selectors?',
  'When should !important be used?',
  'Why are IDs risky in CSS selectors?',
  'How do you avoid brittle selector strategy?',
];

const CSS_BOX_MODEL_QUESTIONS = [
  'What is the difference between content-box and border-box?',
  'Why does padding change an element size?',
  'When do vertical margins collapse?',
  'Why can width: 100% still overflow?',
  'Why do flex and grid children refuse to shrink?',
  'When should overflow be hidden, auto, or visible?',
  'How should component sizing be constrained?',
  'How do scrollbars affect layout?',
];

const CSS_LAYOUT_QUESTIONS = [
  'How does Flexbox alignment work?',
  'How do CSS Grid tracks work?',
  'How do you build a wrapping nav with CSS?',
  'What determines an absolutely positioned element containing block?',
  'Why does position: sticky fail?',
  'How should overlays handle stacking contexts?',
  'How does auto-fit with minmax() help responsive grids?',
  'When is float still relevant?',
];

const CSS_RESPONSIVE_QUESTIONS = [
  'What does mobile-first CSS mean?',
  'How do container queries differ from media queries?',
  'How does clamp() help fluid CSS?',
  'How should responsive cards be designed?',
  'How should navigation adapt at small widths?',
  'How do you handle long words, URLs, and untrusted text?',
  'How should reduced motion be handled in CSS?',
  'How do CSS variables support themes?',
];

const CSS_DEBUGGING_PERFORMANCE_QUESTIONS = [
  'How do you debug missing CSS styles?',
  'How do you debug a specificity conflict?',
  'How do you debug a z-index problem?',
  'How do you debug horizontal scroll?',
  'What causes layout thrashing?',
  'When does hardware acceleration help CSS?',
  'What makes CSS maintainable?',
  'What are common CSS debugging mistakes?',
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
    expect(fixture.nativeElement.querySelector('.iq-vue-toc')).toBeNull();
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
    expect(fixture.nativeElement.querySelector('.iq-section--vue-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--vue-scenarios')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--vue-modern')).toBeNull();
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
    expect(fixture.nativeElement.querySelector('.iq-css-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--css-short-answers')).toBeNull();
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
    expect(text).not.toContain('Beginner Vue.js questions');
    expect(text).not.toContain('Vue 3 and Composition API');
    expect(text).not.toContain('Router, Pinia, and Vuex');
    expect(text).not.toContain('CSS specificity and cascade questions');
    expect(text).not.toContain('Flexbox and CSS Grid interview questions');

    expect(fixture.nativeElement.querySelector('.iq-js-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-angular-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-react-toc')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-vue-toc')).toBeNull();
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
    expect(fixture.nativeElement.querySelector('.iq-section--vue-clusters')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--vue-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--vue-audience')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--vue-scenarios')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--vue-modern')).toBeNull();
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
    expect(text).not.toContain('Beginner Vue.js questions');
    expect(text).not.toContain('Vue 3 and Composition API');
    expect(text).not.toContain('Router, Pinia, and Vuex');
    expect(text).not.toContain('CSS specificity and cascade questions');
    expect(text).not.toContain('Flexbox and CSS Grid interview questions');

    expect(fixture.nativeElement.querySelector('.iq-js-toc')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-angular-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-react-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-vue-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-html-css-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-css-toc')).toBeNull();
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
    expect(fixture.nativeElement.querySelector('.iq-section--vue-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--vue-scenarios')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--vue-modern')).toBeNull();
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

  it('scrolls Vue TOC buttons to page sections without routing to the app root', async () => {
    routeStub.snapshot.data.interviewQuestions = {
      keyword: 'vue js interview questions',
      title: 'Vue.js Interview Questions and Answers',
      techs: ['vue'],
    };
    routeStub.snapshot.data.interviewQuestionsList = {
      techs: ['vue'],
      coding: [],
      trivia: [],
    };
    routeStub.snapshot.url = [{ path: 'vue' }, { path: 'interview-questions' }];
    routeStub.snapshot.pathFromRoot = [{ url: [] }, { url: [{ path: 'vue' }, { path: 'interview-questions' }] }];

    const fixture = TestBed.createComponent(InterviewQuestionsLandingComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const scenariosHeading = fixture.nativeElement.querySelector('#iq-vue-scenarios-title') as HTMLElement;
    const scrollIntoView = jasmine.createSpy('scrollIntoView');
    (scenariosHeading as any).scrollIntoView = scrollIntoView;
    const replaceState = spyOn(window.history, 'replaceState').and.stub();

    const tocButton = fixture.nativeElement.querySelector(
      'button[data-target="iq-vue-scenarios-title"]',
    ) as HTMLButtonElement;
    tocButton.click();

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(replaceState).toHaveBeenCalledWith(
      null,
      '',
      `${window.location.pathname}${window.location.search}#iq-vue-scenarios-title`,
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
    expect(text).not.toContain('Beginner Vue.js questions');
    expect(text).not.toContain('Vue 3 and Composition API');
    expect(text).not.toContain('Router, Pinia, and Vuex');
    expect(text).not.toContain('CSS specificity and cascade questions');
    expect(text).not.toContain('Flexbox and CSS Grid interview questions');
    expect(fixture.nativeElement.querySelector('.iq-html-css-toc')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-css-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-vue-toc')).toBeNull();
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
    expect(fixture.nativeElement.querySelector('.iq-section--css-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--vue-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--vue-scenarios')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--vue-modern')).toBeNull();
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

  it('renders Vue-only answer-first coverage, scenarios, modern topics, and schema mentions', async () => {
    routeStub.snapshot.data.interviewQuestions = {
      keyword: 'vue js interview questions',
      title: 'Vue.js Interview Questions and Answers',
      techs: ['vue'],
    };
    routeStub.snapshot.data.seo = {
      title: 'Vue.js Interview Questions and Answers',
      description: 'Vue.js interview questions and answers, beginner to advanced, for experienced developers with Vue 3, Composition API, ref vs reactive, computed vs watch, Vue Router, Pinia, Vuex, testing, security, performance, and scenario questions.',
    };
    routeStub.snapshot.data.interviewQuestionsList = {
      techs: ['vue'],
      coding: [
        { id: 'vue-tabs', title: 'Vue Tabs', type: 'coding', technology: 'vue', difficulty: 'easy', access: 'free', tags: [], importance: 5, companies: [], description: 'Build tabs.', tech: 'vue' },
        { id: 'vue-debounced-search', title: 'Vue Debounced Search', type: 'coding', technology: 'vue', difficulty: 'intermediate', access: 'free', tags: [], importance: 5, companies: [], description: 'Build debounced search.', tech: 'vue' },
      ],
      trivia: [
        { id: 'vue-reactivity-system', title: 'Vue reactivity system', type: 'trivia', technology: 'vue', difficulty: 'easy', access: 'free', tags: [], importance: 5, companies: [], description: 'Explain reactivity.', tech: 'vue' },
        { id: 'vue-composition-api', title: 'Vue Composition API', type: 'trivia', technology: 'vue', difficulty: 'intermediate', access: 'free', tags: [], importance: 5, companies: [], description: 'Explain Composition API.', tech: 'vue' },
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
    expect(text).toContain('Vue.js interview questions and Vue JS answers for Vue 3 rounds');
    expect(text).toContain('Reviewed May 20, 2026');
    expect(text).toContain('FrontendAtlas Editor');
    expect(text).toContain('65 visible Vue.js questions across reactivity, Composition API, component contracts, Router, Pinia/Vuex, scenarios, modern Vue, testing, security, and performance');
    expect(text).toContain('On this page');
    expect(text).toContain('Popular Vue.js interview question clusters');
    expect(text).toContain('Beginner Vue.js questions');
    expect(text).toContain('Experienced Vue.js questions');
    expect(text).toContain('Vue 3 and Composition API');
    expect(text).toContain('Reactivity: ref, reactive, computed, watch');
    expect(text).toContain('Router, Pinia, and Vuex');
    expect(text).toContain('Testing, security, and performance');
    expect(text).toContain('Top Vue.js interview questions and short answers, beginner to advanced');
    expect(text).toContain('Vue.js interview questions for beginners and experienced developers');
    expect(text).toContain('Vue.js interview questions for beginners');
    expect(text).toContain('Vue.js interview questions for experienced developers');
    expect(text).toContain('Vue reactivity and rendering interview questions');
    expect(text).toContain('Vue component contract interview questions');
    expect(text).toContain('Vue scenario and code interview questions');
    expect(text).toContain('Modern Vue 3 interview questions');
    expect(text).toContain('Vue testing, security, and performance interview questions');
    for (const question of VUE_SHORT_ANSWER_QUESTIONS) {
      expect(text).toContain(question);
    }
    for (const question of VUE_REACTIVITY_RENDERING_QUESTIONS) {
      expect(text).toContain(question);
    }
    for (const question of VUE_COMPONENT_CONTRACT_QUESTIONS) {
      expect(text).toContain(question);
    }
    for (const question of VUE_SCENARIO_QUESTIONS) {
      expect(text).toContain(question);
    }
    for (const question of VUE_MODERN_QUESTIONS) {
      expect(text).toContain(question);
    }
    for (const question of VUE_TESTING_SECURITY_PERFORMANCE_QUESTIONS) {
      expect(text).toContain(question);
    }
    expect(text.indexOf('Top Vue.js interview questions and short answers, beginner to advanced')).toBeLessThan(
      text.indexOf('Vue reactivity and rendering interview questions')
    );
    expect(text.indexOf('Vue testing, security, and performance interview questions')).toBeLessThan(
      text.indexOf('Most crucial Vue coding interview questions')
    );
    expect(text.indexOf('Modern Vue 3 interview questions')).toBeLessThan(
      text.indexOf('Most crucial Vue coding interview questions')
    );
    expect(text).toContain('What Vue.js interview rounds test');
    expect(text).toContain('Most crucial Vue coding interview questions');
    expect(text).toContain('Most crucial Vue concept questions for interviews');
    expect(text).toContain('Are these Vue.js interview questions for beginners and experienced developers?');
    expect(text).toContain('Does this page cover Vue 3 and Composition API interview questions?');
    expect(text).toContain('Does this page include Vue reactivity interview questions like ref vs reactive and computed vs watch?');
    expect(text).toContain('Does this page include Vue scenario and code interview questions?');
    expect(text).toContain('Does this page include Vue testing, security, and performance interview questions?');
    expect(text).toContain('Where should I practice Vue.js coding interview questions?');
    expect(text).not.toContain('Popular React interview question clusters');
    expect(text).not.toContain('Top React interview questions and short answers, beginner to advanced');
    expect(text).not.toContain('React interview questions for beginners and experienced developers');
    expect(text).not.toContain('React rendering internals interview questions');
    expect(text).not.toContain('React 19 and server-first React interview questions');
    expect(text).not.toContain('React testing interview questions with Testing Library, act, and mocked APIs');
    expect(text).not.toContain('React scenario and code interview questions');
    expect(text).not.toContain('Modern React interview questions');
    expect(text).not.toContain('Popular Angular interview question clusters');
    expect(text).not.toContain('Top Angular interview questions and short answers, beginner to advanced');
    expect(text).not.toContain('Angular scenario and code interview questions');
    expect(text).not.toContain('Top JavaScript interview questions and short answers, beginner to advanced');
    expect(text).not.toContain('Output-based JavaScript interview questions');
    expect(text).not.toContain('Popular HTML and CSS interview question clusters');
    expect(text).not.toContain('Top HTML and CSS interview questions and short answers, beginner to advanced');
    expect(text).not.toContain('HTML and CSS code scenario interview questions');
    expect(text).not.toContain('CSS specificity and cascade questions');
    expect(text).not.toContain('Flexbox and CSS Grid interview questions');
    expect(fixture.nativeElement.querySelector('.iq-js-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-angular-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-react-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-vue-toc')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-html-css-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-css-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-vue-clusters-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-vue-short-answers-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-vue-audience-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-vue-reactivity-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-vue-components-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-vue-scenarios-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-vue-modern-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-vue-testing-security-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-vue-coding-preview-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-vue-concept-preview-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--vue-clusters')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-cluster-card').length).toBe(6);
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-vue-short-answers-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-vue-audience-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-vue-reactivity-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-vue-modern-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-vue-components-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-vue-testing-security-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--vue-short-answers')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-section--vue-short-answers .iq-short-answer').length).toBe(25);
    expect(fixture.nativeElement.querySelector('.iq-section--vue-audience')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-section--vue-audience .iq-audience-card').length).toBe(2);
    expect(fixture.nativeElement.querySelector('.iq-section--vue-reactivity')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-section--vue-reactivity .iq-focused-card').length).toBe(8);
    expect(fixture.nativeElement.querySelector('.iq-section--vue-components')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-section--vue-components .iq-focused-card').length).toBe(8);
    expect(fixture.nativeElement.querySelector('.iq-section--vue-scenarios')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-section--vue-scenarios .iq-scenario-card').length).toBe(8);
    expect(fixture.nativeElement.querySelector('.iq-section--vue-modern')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-section--vue-modern .iq-modern-card').length).toBe(8);
    expect(fixture.nativeElement.querySelector('.iq-section--vue-testing-security')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-section--vue-testing-security .iq-focused-card').length).toBe(8);
    expect(
      fixture.nativeElement.querySelectorAll(
        '.iq-section--vue-short-answers .iq-short-answer, .iq-section--vue-reactivity .iq-focused-card, .iq-section--vue-components .iq-focused-card, .iq-section--vue-scenarios .iq-scenario-card, .iq-section--vue-modern .iq-modern-card, .iq-section--vue-testing-security .iq-focused-card'
      ).length
    ).toBe(65);
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
    expect(fixture.nativeElement.querySelector('a[href="/vue/trivia/vue-reactivity-system"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/vue/trivia/vue-ref-vs-reactive-difference-traps"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/vue/trivia/vue-computed-vs-watchers"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/vue/trivia/vue-watch-vs-watcheffect-differences-infinite-loops"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/vue/trivia/vue-nexttick-dom-update-queue"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/vue/trivia/vue-lifecycle-hooks"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/vue/trivia/vue-composition-api"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/vue/trivia/vue-composition-api-vs-mixins"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/vue/trivia/vue-child-mutates-prop-directly"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/vue/trivia/vue-v-for-keys-why-not-index"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/vue/trivia/vue-v-show-vs-v-if-dom-lifecycle"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/vue/trivia/vue-router-navigation"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/vue/trivia/vuex-state-management"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/vue/trivia/vue-slots-default-named-scoped-slot-props"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/vue/trivia/vue-provide-inject-vs-prop-drilling-tradeoffs"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/vue/coding/vue-debounced-search"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/guides/framework-prep/vue-prep-path"]')).toBeTruthy();

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
    const faqPage = graph.find((entry: any) => entry?.['@type'] === 'FAQPage');

    expect(collection?.dateModified).toBe('2026-05-20T00:00:00.000Z');
    expect(collection?.reviewedBy?.name).toBe('FrontendAtlas Editor');
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Vue.js interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Vue.js interview questions and answers')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Vue JS interview questions for beginners')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Vue 3 interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Vue Composition API interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Vue reactivity interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Vue ref vs reactive interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Vue computed vs watch interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Vue Router interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Pinia interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Vuex interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Vue testing interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Vue security interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Vue performance interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Vue interview questions for experienced developers')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Vue scenario interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Vue coding interview questions')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('Vue scenario and code questions')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('Vue XSS and v-html security')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('Vue SSR, Nuxt, and hydration')
    )).toBeTrue();
    expect(faqPage).toBeTruthy();
    expect(faqPage?.name).toBe('Top Vue.js interview questions and short answers, beginner to advanced');
    expect(Array.isArray(faqPage?.mainEntity)).toBeTrue();
    expect(faqPage?.mainEntity.length).toBe(25);
    expect(faqPage?.mainEntity.map((entry: any) => entry?.name)).toEqual(VUE_SHORT_ANSWER_QUESTIONS);
    const vueEntry = faqPage?.mainEntity.find((entry: any) =>
      entry?.name === 'What is Vue.js?'
    );
    expect(String(vueEntry?.acceptedAnswer?.text || '')).toContain('progressive JavaScript framework');
  });

  it('renders HTML-only answer-first coverage and schema mentions', async () => {
    routeStub.snapshot.data.interviewQuestions = {
      keyword: 'html interview questions',
      title: 'HTML Interview Questions and Answers',
      techs: ['html'],
    };
    routeStub.snapshot.data.seo = {
      title: 'HTML Interview Questions and Answers',
      description: 'HTML interview questions and answers, beginner to advanced, with semantic HTML, forms, accessibility, ARIA, metadata, HTML5, DOM, tables, images, srcset, iframes, Shadow DOM, and markup scenarios.',
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
    expect(text).toContain('Reviewed May 21, 2026');
    expect(text).toContain('65 visible HTML questions across semantics, forms, accessibility, metadata, DOM, native browser behavior, modern HTML, and markup scenarios');
    expect(text).toContain('Popular HTML interview question clusters');
    expect(text).toContain('Top HTML interview questions and short answers, beginner to advanced');
    expect(text).toContain('HTML interview questions for beginners and experienced frontend developers');
    expect(text).toContain('HTML interview questions for beginners');
    expect(text).toContain('HTML interview questions for experienced developers');
    expect(text).toContain('Semantic HTML questions');
    expect(text).toContain('HTML forms and validation questions');
    expect(text).toContain('HTML accessibility and ARIA questions');
    expect(text).toContain('HTML metadata and browser behavior');
    expect(text).toContain('Modern HTML and markup scenarios');
    expect(text).toContain('HTML semantics and document structure interview questions');
    expect(text).toContain('HTML forms, validation, and input accessibility interview questions');
    expect(text).toContain('HTML accessibility and ARIA interview questions');
    expect(text).toContain('HTML metadata, SEO, and browser parsing interview questions');
    expect(text).toContain('Modern HTML and markup scenario interview questions');
    expect(text).toContain('HTML interview topic map');
    expect(text).toContain('Common HTML coding mistakes');
    expect(text).toContain('Best resources for learning HTML');
    expect(text).toContain('Are these HTML interview questions for beginners and experienced developers?');
    expect(text).toContain('Does this page cover semantic HTML, forms, and accessibility?');
    expect(text).toContain('Does this page include HTML metadata, DOM, and browser parsing questions?');
    expect(text).toContain('Does this page cover modern HTML topics like dialog, srcset, iframes, and Shadow DOM?');
    expect(text).toContain('Where should I practice HTML coding interview questions?');
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
    expect(text).not.toContain('Beginner Vue.js questions');
    expect(text).not.toContain('Vue 3 and Composition API');
    expect(text).not.toContain('Router, Pinia, and Vuex');
    expect(text).not.toContain('CSS specificity and cascade questions');
    expect(text).not.toContain('Flexbox and CSS Grid interview questions');

    expect(fixture.nativeElement.querySelector('.iq-js-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-angular-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-react-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-vue-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-html-css-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-css-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-html-toc')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-html-short-answers-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-html-semantics-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-html-forms-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-html-accessibility-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-html-metadata-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-html-modern-scenarios-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-html-coding-preview-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-html-concept-preview-title"]')).toBeTruthy();
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
    expect(fixture.nativeElement.querySelector('.iq-section--vue-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--vue-scenarios')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--vue-modern')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-clusters')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-audience')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-testing')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-security')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-classic')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-scenarios')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--angular-modern')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--css-clusters')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--css-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--html-clusters')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--html-short-answers')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--html-audience')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--html-semantics')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--html-forms')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--html-accessibility')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--html-metadata')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--html-modern-scenarios')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-cluster-card').length).toBe(7);
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-html-short-answers-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-html-audience-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-html-semantics-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-html-forms-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-html-accessibility-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-html-metadata-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-html-modern-scenarios-title"]')).toBeTruthy();

    for (const question of HTML_SHORT_ANSWER_QUESTIONS) {
      expect(text).toContain(question);
    }
    for (const question of HTML_SEMANTICS_QUESTIONS) {
      expect(text).toContain(question);
    }
    for (const question of HTML_FORMS_QUESTIONS) {
      expect(text).toContain(question);
    }
    for (const question of HTML_ACCESSIBILITY_QUESTIONS) {
      expect(text).toContain(question);
    }
    for (const question of HTML_METADATA_QUESTIONS) {
      expect(text).toContain(question);
    }
    for (const question of HTML_MODERN_SCENARIO_QUESTIONS) {
      expect(text).toContain(question);
    }

    expect(fixture.nativeElement.querySelectorAll('.iq-section--html-short-answers .iq-short-answer').length).toBe(25);
    expect(fixture.nativeElement.querySelectorAll('.iq-section--html-audience .iq-audience-card').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('.iq-section--html-semantics .iq-focused-card').length).toBe(8);
    expect(fixture.nativeElement.querySelectorAll('.iq-section--html-forms .iq-focused-card').length).toBe(8);
    expect(fixture.nativeElement.querySelectorAll('.iq-section--html-accessibility .iq-focused-card').length).toBe(8);
    expect(fixture.nativeElement.querySelectorAll('.iq-section--html-metadata .iq-focused-card').length).toBe(8);
    expect(fixture.nativeElement.querySelectorAll('.iq-section--html-modern-scenarios .iq-focused-card').length).toBe(8);
    expect(
      fixture.nativeElement.querySelectorAll(
        '.iq-section--html-short-answers .iq-short-answer, .iq-section--html-semantics .iq-focused-card, .iq-section--html-forms .iq-focused-card, .iq-section--html-accessibility .iq-focused-card, .iq-section--html-metadata .iq-focused-card, .iq-section--html-modern-scenarios .iq-focused-card'
      ).length
    ).toBe(65);

    const shortAnswersSection = fixture.nativeElement.querySelector('.iq-section--html-short-answers') as HTMLElement;
    const codingPreviewTitle = fixture.nativeElement.querySelector('#iq-html-coding-preview-title') as HTMLElement;
    expect(shortAnswersSection.compareDocumentPosition(codingPreviewTitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(fixture.nativeElement.querySelector('a[href="/html/coding/html-basic-structure"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/coding/html-contact-form-labeled"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/coding/html-forms-validation-required"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/coding/html-semantic-layout"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/coding/html-tables-accessibility"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/coding/html-dialog-confirm-a11y"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/trivia/html-dom"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/trivia/html-semantic-elements"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/trivia/html-div-vs-span"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/trivia/html-block-inline-elements"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/trivia/html-a-tag"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/trivia/html-href-attribute"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/trivia/html-img-alt-attribute"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/trivia/html-input-placeholder"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/trivia/html-meta-tag"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/trivia/html-title-tag"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/trivia/html-iframe-tag"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/trivia/html-img-srcset"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/trivia/html-parsing-rendering"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/trivia/html-aria-roles"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/trivia/html-shadow-dom"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/html/trivia/web-accessibility-make-page-accessible"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="https://developer.mozilla.org/en-US/docs/Web/HTML/Reference"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="https://html.spec.whatwg.org/multipage/introduction.html"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="https://www.w3.org/WAI/tutorials/forms/labels/"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="https://developer.chrome.com/docs/devtools/accessibility/reference?hl=en"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="https://validator.w3.org/docs/users.html"]')).toBeTruthy();

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
    const faqPage = graph.find((entry: any) => entry?.['@type'] === 'FAQPage');

    expect(collection?.dateModified).toBe('2026-05-21T00:00:00.000Z');
    expect(collection?.reviewedBy?.name).toBe('FrontendAtlas Editor');
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('HTML interview questions and answers')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('HTML interview questions for beginners')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('HTML interview questions for experienced developers')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('semantic HTML interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('HTML forms interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('HTML accessibility interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('ARIA interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('HTML metadata interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('HTML5 interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('DOM interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('HTML table accessibility questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('HTML image alt and srcset questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('HTML iframe interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('Shadow DOM interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('HTML markup scenario questions')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('HTML DOM and document structure')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('HTML native dialog behavior')
    )).toBeTrue();
    expect(faqPage).toBeTruthy();
    expect(faqPage?.name).toBe('Top HTML interview questions and short answers, beginner to advanced');
    expect(Array.isArray(faqPage?.mainEntity)).toBeTrue();
    expect(faqPage?.mainEntity.length).toBe(25);
    expect(faqPage?.mainEntity.map((entry: any) => entry?.name)).toEqual(HTML_SHORT_ANSWER_QUESTIONS);
    const htmlEntry = faqPage?.mainEntity.find((entry: any) =>
      entry?.name === 'What is HTML?'
    );
    expect(String(htmlEntry?.acceptedAnswer?.text || '')).toContain('markup language browsers parse');
    expect(fixture.nativeElement.querySelector('.iq-section--react-coverage')).toBeNull();
  });

  it('renders CSS-only answer-first coverage and schema mentions', async () => {
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
    expect(text).toContain('Reviewed May 20, 2026');
    expect(text).toContain('65 visible CSS questions across cascade, specificity, box model, layout, responsive design, debugging, performance, and maintainable CSS');
    expect(text).toContain('Popular CSS interview question clusters');
    expect(text).toContain('Top CSS interview questions and short answers, beginner to advanced');
    expect(text).toContain('CSS interview questions for beginners and experienced frontend developers');
    expect(text).toContain('CSS interview questions for beginners');
    expect(text).toContain('CSS interview questions for experienced developers');
    expect(text).toContain('CSS specificity and cascade questions');
    expect(text).toContain('CSS box model and overflow questions');
    expect(text).toContain('Flexbox and CSS Grid interview questions');
    expect(text).toContain('Responsive CSS and media query questions');
    expect(text).toContain('CSS debugging and performance questions');
    expect(text).toContain('CSS cascade and specificity interview questions');
    expect(text).toContain('CSS box model, sizing, and overflow interview questions');
    expect(text).toContain('CSS Flexbox, Grid, and positioning interview questions');
    expect(text).toContain('Responsive CSS and media queries interview questions');
    expect(text).toContain('CSS debugging, performance, and maintainability interview questions');
    expect(text).toContain('Are these CSS interview questions for beginners and experienced developers?');
    expect(text).toContain('Does this page cover CSS specificity and cascade interview questions?');
    expect(text).toContain('Does this page include Flexbox and CSS Grid interview questions?');
    expect(text).toContain('Does this page include responsive CSS and media query questions?');
    expect(text).toContain('Does this page cover CSS debugging and performance questions?');
    expect(text).toContain('Where should I practice CSS coding interview questions?');
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
    expect(text).not.toContain('Beginner Vue.js questions');
    expect(text).not.toContain('Vue 3 and Composition API');
    expect(text).not.toContain('Router, Pinia, and Vuex');
    expect(fixture.nativeElement.querySelector('.iq-js-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-angular-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-react-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-vue-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-html-css-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-css-toc')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-css-short-answers-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-css-cascade-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-css-box-model-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-css-layout-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-css-responsive-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-css-debugging-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-css-coding-preview-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[data-target="iq-css-concept-preview-title"]')).toBeTruthy();
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
    expect(fixture.nativeElement.querySelector('.iq-section--vue-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--vue-scenarios')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--vue-modern')).toBeNull();
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
    expect(fixture.nativeElement.querySelector('.iq-section--css-clusters')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.iq-cluster-card').length).toBe(7);
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-css-short-answers-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-css-audience-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-css-cascade-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-css-box-model-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-css-layout-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-css-responsive-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-cluster-card[data-target="iq-css-debugging-title"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--css-short-answers')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--css-audience')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--css-cascade')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--css-box-model')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--css-layout')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--css-responsive')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-section--css-debugging')).toBeTruthy();

    for (const question of CSS_SHORT_ANSWER_QUESTIONS) {
      expect(text).toContain(question);
    }
    for (const question of CSS_CASCADE_QUESTIONS) {
      expect(text).toContain(question);
    }
    for (const question of CSS_BOX_MODEL_QUESTIONS) {
      expect(text).toContain(question);
    }
    for (const question of CSS_LAYOUT_QUESTIONS) {
      expect(text).toContain(question);
    }
    for (const question of CSS_RESPONSIVE_QUESTIONS) {
      expect(text).toContain(question);
    }
    for (const question of CSS_DEBUGGING_PERFORMANCE_QUESTIONS) {
      expect(text).toContain(question);
    }

    expect(fixture.nativeElement.querySelectorAll('.iq-section--css-short-answers .iq-short-answer').length).toBe(25);
    expect(fixture.nativeElement.querySelectorAll('.iq-section--css-audience .iq-audience-card').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('.iq-section--css-cascade .iq-focused-card').length).toBe(8);
    expect(fixture.nativeElement.querySelectorAll('.iq-section--css-box-model .iq-focused-card').length).toBe(8);
    expect(fixture.nativeElement.querySelectorAll('.iq-section--css-layout .iq-focused-card').length).toBe(8);
    expect(fixture.nativeElement.querySelectorAll('.iq-section--css-responsive .iq-focused-card').length).toBe(8);
    expect(fixture.nativeElement.querySelectorAll('.iq-section--css-debugging .iq-focused-card').length).toBe(8);
    expect(
      fixture.nativeElement.querySelectorAll(
        '.iq-section--css-short-answers .iq-short-answer, .iq-section--css-cascade .iq-focused-card, .iq-section--css-box-model .iq-focused-card, .iq-section--css-layout .iq-focused-card, .iq-section--css-responsive .iq-focused-card, .iq-section--css-debugging .iq-focused-card'
      ).length
    ).toBe(65);

    expect(fixture.nativeElement.querySelector('a[href="/css/trivia/css-definition"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/trivia/css-cascade-order"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/trivia/css-specificity-hierarchy"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/trivia/css-box-model"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/trivia/css-margin-vs-padding"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/trivia/css-display-flex"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/trivia/css-grid-vs-flexbox"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/trivia/css-position-relative-absolute-fixed"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/trivia/css-z-index"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/trivia/css-media-queries"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/trivia/css-make-element-responsive"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/trivia/css-units-em-rem-percent-px"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/trivia/css-pseudo-classes-elements"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/trivia/css-custom-properties"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/trivia/css-hardware-acceleration"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/coding/css-flexbox-navbar"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/coding/css-grid-card-gallery"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/coding/css-fluid-clamp"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/css/coding/css-theme-variables-dark-mode"]')).toBeTruthy();

    const codingTitle = fixture.nativeElement.querySelector('#iq-css-coding-preview-title');
    const conceptTitle = fixture.nativeElement.querySelector('#iq-css-concept-preview-title');
    const shortAnswerSection = fixture.nativeElement.querySelector('.iq-section--css-short-answers');
    expect(codingTitle).toBeTruthy();
    expect(conceptTitle).toBeTruthy();
    expect(shortAnswerSection.compareDocumentPosition(codingTitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
    const faqPage = graph.find((entry: any) => entry?.['@type'] === 'FAQPage');

    expect(collection?.dateModified).toBe('2026-05-20T00:00:00.000Z');
    expect(collection?.reviewedBy?.name).toBe('FrontendAtlas Editor');
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('CSS interview questions and answers')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('CSS interview questions for beginners')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('CSS interview questions for experienced developers')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('CSS selectors interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('CSS specificity interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('CSS cascade interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('CSS box model interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('CSS Flexbox interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('CSS Grid interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('CSS Flexbox vs Grid interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('CSS positioning interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('CSS z-index interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('CSS media queries interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('responsive CSS interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('CSS layout interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('CSS debugging interview questions')
    )).toBeTrue();
    expect((collection?.about || []).some((entry: any) =>
      String(entry?.name || '').includes('CSS performance interview questions')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('CSS responsive layout debugging')
    )).toBeTrue();
    expect((collection?.mentions || []).some((entry: any) =>
      String(entry?.name || '').includes('CSS performance and hardware acceleration')
    )).toBeTrue();
    expect(faqPage?.['@id']).toContain('#css-short-answers');
    expect(faqPage?.mainEntity.length).toBe(25);
    expect(faqPage?.mainEntity.map((entry: any) => entry?.name)).toEqual(CSS_SHORT_ANSWER_QUESTIONS);
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
    expect(text).not.toContain('Beginner Vue.js questions');
    expect(text).not.toContain('Vue 3 and Composition API');
    expect(text).not.toContain('Router, Pinia, and Vuex');
    expect(text).not.toContain('CSS specificity and cascade questions');
    expect(text).not.toContain('Flexbox and CSS Grid interview questions');

    expect(fixture.nativeElement.querySelector('.iq-js-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-angular-toc')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iq-react-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-vue-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-html-css-toc')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-css-toc')).toBeNull();
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
    expect(fixture.nativeElement.querySelector('.iq-section--vue-short-answers')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--vue-scenarios')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iq-section--vue-modern')).toBeNull();
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
