import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { FrameworkPrepPathArticle } from './framework-prep-path-article.component';

describe('FrameworkPrepPathArticle', () => {
  let fixture: ComponentFixture<FrameworkPrepPathArticle> | undefined;
  let activeSlug = 'react-prep-path';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrameworkPrepPathArticle],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              get paramMap() {
                return convertToParamMap({ slug: activeSlug });
              },
            },
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
    fixture = undefined;
  });

  function render(slug = 'react-prep-path'): HTMLElement {
    fixture?.destroy();
    fixture = undefined;
    activeSlug = slug;
    fixture = TestBed.createComponent(FrameworkPrepPathArticle);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function hrefs(host: HTMLElement): string[] {
    return Array.from(host.querySelectorAll<HTMLAnchorElement>('a[href]'))
      .map((link) => link.getAttribute('href') || '');
  }

  it('renders React preparation intent, checklist links, plan choices, and prep FAQ copy', () => {
    const host = render('react-prep-path');
    const text = host.textContent || '';
    const compactText = text.replace(/\s+/g, ' ').trim();
    const normalizedText = text.toLowerCase();
    const linkTargets = hrefs(host);
    const proof = host.querySelector('[data-testid="react-prep-proof"]') as HTMLElement | null;
    const patternCards = host.querySelectorAll('[data-testid="react-prep-pattern-cards"] .rp-pattern-card');

    expect(text).toContain('How to Prepare for a React Interview: 7/14/30-Day Plan');
    expect(text).toContain('How to prepare for a React interview');
    expect(text).toContain('Use this checklist before choosing a timeline.');
    expect(normalizedText).toContain('react interview preparation');
    expect(normalizedText).toContain('react interview study plan');
    expect(normalizedText).toContain('react coding interview preparation');
    expect(normalizedText).toContain('frontend engineers');
    expect(proof?.textContent || '').toContain('500+');
    expect(proof?.textContent || '').toContain('practice questions');
    expect(proof?.textContent || '').toContain('React');
    expect(proof?.textContent || '').toContain('coding drills');
    expect(proof?.textContent || '').toContain('Live');
    expect(proof?.textContent || '').toContain('editor + checks');
    expect(proof?.textContent || '').toContain('Hooks + UI');
    expect(proof?.textContent || '').toContain('patterns');
    expect(linkTargets.some((href) => href.includes('/coding?tech=react&kind=coding'))).toBeTrue();
    expect(linkTargets.some((href) => href.includes('/coding?tech=react&kind=trivia'))).toBeTrue();
    expect(linkTargets).toContain('/react/interview-questions');

    expect(text).toContain('Most asked React interview prep patterns');
    expect(compactText).toContain('Use this as a React interview study plan checkpoint before coding/trivia drills.');
    expect(patternCards.length).toBe(12);
    expect(text).toContain('Prep goal');
    expect(text).toContain('Pitfall/test focus');
    expect(text).toContain('useEffect cleanup + dependencies');
    expect(text).toContain('Missing dependencies');
    expect(text).toContain('stale closure callbacks');
    expect(text).toContain('Stale closures + state snapshots');
    expect(text).toContain('Keys + list identity');
    expect(text).toContain('React rendering interview questions');
    expect(text).toContain('Keys interview question variants');
    expect(text).toContain('React StrictMode: why useEffect runs twice in dev');
    expect(text).toContain('Why event handlers are not double-invoked by the render check');
    expect(text).toContain('cleanup prevents duplicate listeners, fetches, and subscriptions');
    expect(text).toContain('Memoization trade-offs');
    expect(text).toContain('Context performance');
    expect(text).toContain('Debounced Search');
    expect(text).toContain('React coding interview preparation drill');
    expect(text).toContain('Autocomplete');
    expect(text).toContain('React component coding interview drill');
    expect(text).toContain('Contact Form');
    expect(text).toContain('React UI coding interview drill');
    expect(text).toContain('Transfer List');
    expect(text).toContain('Tabs');
    expect(text).toContain('Dynamic Table');
    expect(text).toContain('Multi-step Signup');
    expect(linkTargets).toContain('/react/trivia/react-useeffect-purpose');
    expect(linkTargets).toContain('/react/trivia/react-stale-state-closures');
    expect(linkTargets).toContain('/react/trivia/react-keys-in-lists');
    expect(linkTargets).toContain('/react/trivia/react-usememo-vs-usecallback');
    expect(linkTargets).toContain('/react/trivia/react-context-performance-issues');
    expect(linkTargets).toContain('/react/trivia/react-strictmode-double-invoke-effects');
    expect(linkTargets).toContain('/react/coding/react-debounced-search');
    expect(linkTargets).toContain('/react/coding/react-autocomplete-search-starter');
    expect(linkTargets).toContain('/react/coding/react-contact-form-starter');
    expect(linkTargets).toContain('/react/coding/react-transfer-list');
    expect(linkTargets).toContain('/react/coding/react-tabs-switcher');
    expect(linkTargets).toContain('/react/coding/react-dynamic-table');
    expect(linkTargets).toContain('/react/coding/react-multi-step-signup');

    expect(text).toContain('React worked examples to rehearse before mocks');
    expect(text).toContain('useEffect + stale response');
    expect(text).toContain('StrictMode useEffect running twice');
    expect(text).toContain('Why useEffect runs twice in React StrictMode');
    expect(text).toContain('StrictMode event handlers are not double-invoked by the render check');
    expect(text).toContain('useEffect cleanup in StrictMode');
    expect(text).toContain('Dependency contract');
    expect(text).toContain('Cleanup');
    expect(text).toContain('Ignore/cancel policy');
    expect(text).toContain('query state');
    expect(text).toContain('timer cleanup');
    expect(text).toContain('stale response guard');
    expect(text).toContain('loading/error/empty states');
    expect(text).toContain('validation timing');
    expect(text).toContain('disabled submit');
    expect(text).toContain('async submit recovery');
    expect(text).toContain('Stable IDs');
    expect(text).toContain('reorder/delete edge cases');
    expect(text).toContain('Derived selection');

    expect(text).toContain('Junior / Mid / Senior React interview expectations');
    expect(text).toContain('Junior React interviews');
    expect(text).toContain('Mid-level React interviews');
    expect(text).toContain('Senior React interviews');
    expect(text).toContain('React interview study plan: 7, 14, or 30 days');
    expect(text).toContain('React coding interview preparation drill');
    expect(text).toContain('senior React interview preparation');
    expect(text).toContain('Senior-level signals in React interviews');
    expect(text).toContain('7 days: refresh high-risk gaps');
    expect(text).toContain('14 days: make the loop repeatable');
    expect(text).toContain('30 days: build mock-ready depth');
    expect(text).toContain('How do I prepare for a React interview?');
    expect(text).toContain('What should I study first for a React interview?');
    expect(text).toContain('How long does it take to prepare for a React interview?');
    expect(text).toContain('How should I practice React coding interview questions?');
    expect(text).toContain('How do I prepare for a senior React interview?');
    expect(text).toContain('Do I need LeetCode for React interviews?');
    expect(text).toContain('Which React hooks and effects questions should I practice?');
    expect(text).toContain('What React rendering and performance topics matter most?');

    expect(host.querySelector('a[href="/react/interview-questions"]')).toBeTruthy();
    expect(host.querySelector('a[href="/coding?tech=react&kind=trivia"]')).toBeTruthy();
    expect(host.querySelector('a[href="/coding?tech=react&kind=coding"]')).toBeTruthy();
  });

  it('keeps React-only proof and pattern sections out of other prep paths', () => {
    for (const slug of ['javascript-prep-path', 'angular-prep-path', 'vue-prep-path']) {
      const host = render(slug);
      const text = host.textContent || '';

      expect(host.querySelector('[data-testid="react-prep-proof"]')).toBeNull();
      expect(host.querySelector('[data-testid="react-prep-pattern-map"]')).toBeNull();
      expect(text).not.toContain('Most asked React interview prep patterns');
      expect(text).not.toContain('Junior / Mid / Senior React interview expectations');
    }
  });

  it('renders Angular preparation proof, pattern cards, worked examples, expectations, plans, and FAQ copy', () => {
    const host = render('angular-prep-path');
    const text = host.textContent || '';
    const compactText = text.replace(/\s+/g, ' ').trim();
    const normalizedText = text.toLowerCase();
    const linkTargets = hrefs(host);
    const proof = host.querySelector('[data-testid="angular-prep-proof"]') as HTMLElement | null;
    const patternCards = host.querySelectorAll('[data-testid="angular-prep-pattern-cards"] .ap-pattern-card');

    expect(text).toContain('Angular Interview Preparation Path: 7/14/30-Day Study Plan');
    expect(normalizedText).toContain('angular interview preparation');
    expect(normalizedText).toContain('angular interview study plan');
    expect(normalizedText).toContain('angular coding interview preparation');
    expect(normalizedText).toContain('frontend engineers');
    expect(normalizedText).toContain('angular interview roadmap');
    expect(proof?.textContent || '').toContain('500+');
    expect(proof?.textContent || '').toContain('practice questions');
    expect(proof?.textContent || '').toContain('Angular');
    expect(proof?.textContent || '').toContain('coding drills');
    expect(proof?.textContent || '').toContain('Live');
    expect(proof?.textContent || '').toContain('editor + checks');
    expect(proof?.textContent || '').toContain('RxJS + change detection');
    expect(proof?.textContent || '').toContain('patterns');
    expect(linkTargets.some((href) => href.includes('/coding?tech=angular&kind=coding'))).toBeTrue();
    expect(linkTargets.some((href) => href.includes('/coding?tech=angular&kind=trivia'))).toBeTrue();
    expect(linkTargets).toContain('/angular/interview-questions');

    expect(text).toContain('Most asked Angular interview prep patterns');
    expect(compactText).toContain('Use this as an Angular interview study plan checkpoint before coding/trivia drills.');
    expect(compactText).toContain('Use this as an Angular interview roadmap checkpoint before coding/trivia drills.');
    expect(patternCards.length).toBe(12);
    expect(text).toContain('Prep goal');
    expect(text).toContain('Pitfall/test focus');
    expect(text).toContain('Change Detection triggers');
    expect(text).toContain('OnPush debugging');
    expect(text).toContain('Angular OnPush change detection interview');
    expect(text).toContain('RxJS Observables');
    expect(text).toContain('Angular RxJS interview questions');
    expect(text).toContain('switchMap / mergeMap / exhaustMap / concatMap');
    expect(text).toContain('switchMap vs mergeMap');
    expect(text).toContain('HTTP cancellation / stale responses');
    expect(text).toContain('Angular HTTP cancellation interview');
    expect(text).toContain('Dependency Injection hierarchy');
    expect(text).toContain('Routing guards / lazy loading');
    expect(text).toContain('ControlValueAccessor / forms');
    expect(text).toContain('Performance optimization');
    expect(text).toContain('modern Angular interview questions');
    expect(text).toContain('signals vs RxJS angular interview');
    expect(text).toContain('Debounced Search');
    expect(text).toContain('Angular coding interview preparation drill');
    expect(text).toContain('Autocomplete');
    expect(text).toContain('Data Table / Pagination');
    expect(linkTargets).toContain('/angular/trivia/angular-change-detection-strategies');
    expect(linkTargets).toContain('/angular/trivia/angular-onpush-change-detection-debugging-real-bug');
    expect(linkTargets).toContain('/angular/trivia/angular-observables-rxjs');
    expect(linkTargets).toContain('/angular/trivia/rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use');
    expect(linkTargets).toContain('/angular/trivia/angular-http-what-actually-cancels-request');
    expect(linkTargets).toContain('/angular/trivia/angular-dependency-injection');
    expect(linkTargets).toContain('/angular/trivia/angular-routing');
    expect(linkTargets).toContain('/angular/trivia/angular-controlvalueaccessor-vs-custom-two-way-binding');
    expect(linkTargets).toContain('/angular/trivia/angular-performance-optimization');
    expect(linkTargets).toContain('/angular/coding/angular-debounced-search');
    expect(linkTargets).toContain('/angular/coding/angular-autocomplete-search-starter');
    expect(linkTargets).toContain('/angular/coding/angular-pagination-table');

    expect(text).toContain('Angular worked examples to rehearse before mocks');
    expect(text).toContain('RxJS stale response');
    expect(text).toContain('input stream');
    expect(text).toContain('switchMap cancellation');
    expect(text).toContain('loading, results, error, empty state');
    expect(text).toContain('OnPush view bug');
    expect(text).toContain('Trigger path');
    expect(text).toContain('Immutable update');
    expect(text).toContain('AsyncPipe');
    expect(text).toContain('markForCheck vs detectChanges');
    expect(text).toContain('Reactive Form / CVA');
    expect(text).toContain('touched/dirty contract');
    expect(text).toContain('disabled state');
    expect(text).toContain('value propagation');
    expect(text).toContain('DI boundary');
    expect(text).toContain('root vs feature vs component provider placement');
    expect(text).toContain('lazy boundaries');
    expect(text).toContain('Test override');

    expect(text).toContain('Junior / Mid / Senior Angular interview expectations');
    expect(text).toContain('Junior Angular interviews');
    expect(text).toContain('Mid-level Angular interviews');
    expect(text).toContain('Senior Angular interviews');
    expect(text).toContain('signals/zoneless trade-offs');
    expect(text).toContain('migration reasoning');
    expect(text).toContain('Week objective: stabilize the highest-risk Angular gaps quickly');
    expect(text).toContain('Two-week objective: turn isolated knowledge into consistent delivery');
    expect(text).toContain('Weeks 1–2: broad pass across high-frequency Angular clusters');
    expect(text).toContain('Senior-level signals in Angular interviews');
    expect(text).toContain('How do I prepare for an Angular interview?');
    expect(text).toContain('What is the best Angular interview study plan for frontend engineers?');
    expect(text).toContain('Which Angular RxJS interview questions should I practice?');
    expect(text).toContain('How do I prepare for Angular change detection and OnPush questions?');
    expect(text).toContain('Which Angular signals and modern Angular topics matter in interviews?');
    expect(text).toContain('How should I practice Angular coding interview questions?');
    expect(text).toContain('How do I prepare for a senior Angular interview?');
    expect(text).toContain('Do I need LeetCode for Angular interviews?');
  });

  it('keeps Angular-only proof and pattern sections out of other prep paths', () => {
    for (const slug of ['javascript-prep-path', 'react-prep-path', 'vue-prep-path']) {
      const host = render(slug);
      const text = host.textContent || '';

      expect(host.querySelector('[data-testid="angular-prep-proof"]')).toBeNull();
      expect(host.querySelector('[data-testid="angular-prep-pattern-map"]')).toBeNull();
      expect(text).not.toContain('Most asked Angular interview prep patterns');
      expect(text).not.toContain('Junior / Mid / Senior Angular interview expectations');
    }
  });

  it('renders Vue preparation proof, pattern cards, worked examples, expectations, plans, and FAQ copy', () => {
    const host = render('vue-prep-path');
    const text = host.textContent || '';
    const compactText = text.replace(/\s+/g, ' ').trim();
    const normalizedText = text.toLowerCase();
    const linkTargets = hrefs(host);
    const proof = host.querySelector('[data-testid="vue-prep-proof"]') as HTMLElement | null;
    const patternCards = host.querySelectorAll('[data-testid="vue-prep-pattern-cards"] .vp-pattern-card');

    expect(text).toContain('Vue Interview Preparation Path: 7/14/30-Day Study Plan');
    expect(normalizedText).toContain('vue interview preparation path');
    expect(normalizedText).toContain('vue interview study plan');
    expect(normalizedText).toContain('vue coding interview preparation');
    expect(normalizedText).toContain('frontend engineers');
    expect(proof?.textContent || '').toContain('500+');
    expect(proof?.textContent || '').toContain('practice questions');
    expect(proof?.textContent || '').toContain('Vue');
    expect(proof?.textContent || '').toContain('coding drills');
    expect(proof?.textContent || '').toContain('Live');
    expect(proof?.textContent || '').toContain('editor + checks');
    expect(proof?.textContent || '').toContain('Reactivity + component');
    expect(proof?.textContent || '').toContain('patterns');
    expect(linkTargets.some((href) => href.includes('/coding?tech=vue&kind=coding'))).toBeTrue();
    expect(linkTargets.some((href) => href.includes('/coding?tech=vue&kind=trivia'))).toBeTrue();
    expect(linkTargets).toContain('/vue/interview-questions');

    expect(text).toContain('Most asked Vue interview prep patterns');
    expect(compactText).toContain('Use this as a Vue interview study plan checkpoint before coding/trivia drills.');
    expect(patternCards.length).toBe(12);
    expect(text).toContain('Prep goal');
    expect(text).toContain('Pitfall/test focus');
    expect(text).toContain('Reactivity system');
    expect(text).toContain('Vue reactivity interview questions');
    expect(text).toContain('ref vs reactive');
    expect(text).toContain('Vue ref vs reactive interview');
    expect(text).toContain('computed vs watch/watchEffect');
    expect(text).toContain('Cleanup, flush timing');
    expect(text).toContain('nextTick / DOM update queue');
    expect(text).toContain('Vue nextTick interview question');
    expect(text).toContain('Slots and scoped slots');
    expect(text).toContain('Vue props emits interview');
    expect(text).toContain('Vue scoped slots interview');
    expect(text).toContain('Router guards / navigation');
    expect(text).toContain('Vue router navigation guard interview');
    expect(text).toContain('Pinia / Vuex / shared state');
    expect(text).toContain('Pinia vs Vuex interview');
    expect(text).toContain('Vue storeToRefs interview traps');
    expect(text).toContain('v-for keys / virtual DOM identity');
    expect(text).toContain('Debounced Search');
    expect(text).toContain('Vue coding interview preparation drill');
    expect(text).toContain('Tabs');
    expect(text).toContain('Data Table / Pagination');
    expect(text).toContain('Vue data table interview question');
    expect(text).toContain('Shopping Cart / store state');
    expect(text).toContain('Vue shopping cart interview question');
    expect(linkTargets).toContain('/vue/trivia/vue-reactivity-system');
    expect(linkTargets).toContain('/vue/trivia/vue-ref-vs-reactive-difference-traps');
    expect(linkTargets).toContain('/vue/trivia/vue-computed-vs-watchers');
    expect(linkTargets).toContain('/vue/trivia/vue-nexttick-dom-update-queue');
    expect(linkTargets).toContain('/vue/trivia/vue-router-navigation');
    expect(linkTargets).toContain('/vue/trivia/vue-v-for-keys-why-not-index');
    expect(linkTargets).toContain('/vue/coding/vue-debounced-search');
    expect(linkTargets).toContain('/vue/coding/vue-tabs-switcher');
    expect(linkTargets).toContain('/vue/coding/vue-pagination-table');
    expect(linkTargets).toContain('/vue/coding/vue-shopping-cart');

    expect(text).toContain('Vue worked examples to rehearse before mocks');
    expect(text).toContain('ref vs reactive state trap');
    expect(text).toContain('Proxy tracking');
    expect(text).toContain('destructuring can disconnect reads');
    expect(text).toContain('toRefs or storeToRefs');
    expect(text).toContain('computed vs watch/watchEffect cleanup');
    expect(text).toContain('Derived state');
    expect(text).toContain('Side effects');
    expect(text).toContain('Cleanup');
    expect(text).toContain('Timing policy');
    expect(text).toContain('nextTick DOM timing');
    expect(text).toContain('Batched updates');
    expect(text).toContain('DOM-dependent action');
    expect(text).toContain('Overuse policy');
    expect(text).toContain('Pinia boundary');
    expect(text).toContain('Ownership boundary');
    expect(text).toContain('Store model');
    expect(text).toContain('Vuex as a legacy pattern');

    expect(text).toContain('Junior / Mid / Senior Vue interview expectations');
    expect(text).toContain('Junior Vue interviews');
    expect(text).toContain('Mid-level Vue interviews');
    expect(text).toContain('Senior Vue interviews');
    expect(text).toContain('SSR/Nuxt trade-offs');
    expect(text).toContain('migration reasoning');
    expect(text).toContain('Senior-level signals in Vue interviews');
    expect(text).toContain('Week objective: stabilize high-risk Vue signals quickly');
    expect(text).toContain('Two-week objective: turn isolated knowledge into consistent delivery');
    expect(text).toContain('Weeks 1–2: broad pass across high-frequency Vue clusters');
    expect(text).toContain('How do I prepare for a Vue interview?');
    expect(text).toContain('What is the best Vue interview study plan for frontend engineers?');
    expect(text).toContain('Which Vue reactivity interview questions should I practice?');
    expect(text).toContain('How should I explain ref vs reactive in Vue interviews?');
    expect(text).toContain('How do I practice Vue coding interview questions?');
    expect(text).toContain('Do I need Nuxt for Vue interviews?');
    expect(text).toContain('How do I prepare for a senior Vue interview?');
    expect(text).toContain('Do I need LeetCode for Vue interviews?');
  });

  it('keeps Vue-only proof and pattern sections out of other prep paths', () => {
    for (const slug of ['javascript-prep-path', 'react-prep-path', 'angular-prep-path']) {
      const host = render(slug);
      const text = host.textContent || '';

      expect(host.querySelector('[data-testid="vue-prep-proof"]')).toBeNull();
      expect(host.querySelector('[data-testid="vue-prep-pattern-map"]')).toBeNull();
      expect(text).not.toContain('Most asked Vue interview prep patterns');
      expect(text).not.toContain('Junior / Mid / Senior Vue interview expectations');
    }
  });

  it('renders JavaScript preparation proof, pattern cards, round flow, plans, and FAQ copy', () => {
    const host = render('javascript-prep-path');
    const text = host.textContent || '';
    const compactText = text.replace(/\s+/g, ' ').trim();
    const normalizedText = text.toLowerCase();
    const linkTargets = hrefs(host);
    const patternCards = host.querySelectorAll('[data-testid="js-prep-pattern-cards"] .jp-pattern-card');
    const proof = host.querySelector('[data-testid="js-prep-proof"]') as HTMLElement | null;

    expect(text).toContain('JavaScript Interview Preparation Path: 7/14/30-Day Study Plan');
    expect(normalizedText).toContain('javascript interview preparation');
    expect(normalizedText).toContain('frontend javascript interview prep');
    expect(normalizedText).toContain('javascript interview study plan');
    expect(proof?.textContent || '').toContain('500+');
    expect(proof?.textContent || '').toContain('practice questions');
    expect(proof?.textContent || '').toContain('JavaScript');
    expect(proof?.textContent || '').toContain('mastery track');
    expect(proof?.textContent || '').toContain('Live');
    expect(proof?.textContent || '').toContain('editor + checks');
    expect(proof?.textContent || '').toContain('Trivia + coding');
    expect(proof?.textContent || '').toContain('drills');
    expect(linkTargets).toContain('/guides/framework-prep/javascript-prep-path/mastery');
    expect(linkTargets.some((href) => href.includes('/coding?tech=javascript&kind=coding'))).toBeTrue();
    expect(linkTargets.some((href) => href.includes('/coding?tech=javascript&kind=trivia'))).toBeTrue();

    expect(text).toContain('Most asked JavaScript interview prep patterns');
    expect(compactText).toContain('Use this as a JavaScript interview study plan checkpoint before coding/trivia drills.');
    expect(patternCards.length).toBe(12);
    expect(text).toContain('Prep goal');
    expect(text).toContain('Follow-up/test focus');
    expect(text).toContain('Event loop output');
    expect(text).toContain('Closures + TDZ');
    expect(text).toContain('this / bind / call-site');
    expect(text).toContain('Promise.all + combinators');
    expect(text).toContain('Debounce');
    expect(text).toContain('Throttle');
    expect(text).toContain('EventEmitter');
    expect(text).toContain('DOM event delegation');
    expect(text).toContain('takeLatest / concurrency');
    expect(linkTargets).toContain('/javascript/trivia/js-event-loop');
    expect(linkTargets).toContain('/javascript/coding/js-debounce');
    expect(linkTargets).toContain('/javascript/coding/js-throttle');
    expect(linkTargets).toContain('/javascript/coding/js-promise-all');
    expect(linkTargets).toContain('/javascript/coding/js-event-emitter-mini');
    expect(linkTargets).toContain('/javascript/coding/js-delegated-events-2');
    expect(linkTargets).toContain('/javascript/coding/js-take-latest');

    expect(text).toContain('Actual JavaScript interview round flow');
    expect(text).toContain('Output tracing');
    expect(text).toContain('Utility implementation');
    expect(text).toContain('Async/edge-case follow-up');
    expect(text).toContain('Testing/validation');
    expect(text).toContain('Trade-off explanation');
    expect(text).toContain('7-day crash plan');
    expect(text).toContain('14-day plan');
    expect(text).toContain('30-day plan');
    expect(text).toContain('Direct drill sequence');
    expect(text).toContain('How do I prepare for a JavaScript interview?');
    expect(text).toContain('What is the best JavaScript interview study plan for frontend engineers?');
    expect(text).toContain('How should I practice JavaScript event loop and output questions?');
    expect(text).toContain('How do I practice JavaScript utility function interview questions?');
    expect(text).toContain('Do I need LeetCode for JavaScript-heavy frontend interviews?');
    expect(text).toContain('How long does JavaScript interview preparation usually take?');
  });
});
