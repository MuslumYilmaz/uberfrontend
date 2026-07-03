import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SystemDesignRadioFrameworkArticle } from './system-design-radio-framework';

describe('SystemDesignRadioFrameworkArticle', () => {
  let fixture: ComponentFixture<SystemDesignRadioFrameworkArticle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SystemDesignRadioFrameworkArticle],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SystemDesignRadioFrameworkArticle);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('renders the RADIO answer template as a frontend system design interview asset', () => {
    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent || '';

    expect(text).toContain('RADIO Framework: Frontend System Design Interview Template');
    expect(text).toContain('A practical RADIO template for frontend system design interviews');
    expect(text).not.toContain('RADIO Framework for Frontend System Design: R/A/D/I/O');
    expect(text).toContain('RADIO = Requirements, Architecture, Data, Interface, Optimizations');
    expect(text).toContain('RADIO is a frontend system design interview framework');
    expect(text).toContain('Use it when the prompt is broad, like "design autocomplete", "design a news feed", or "design chat".');
    expect(text).toContain('The goal is not to memorize an acronym.');
    expect(text).toContain('scope, architecture, data contracts, UI behavior, and measurable trade-offs.');
    expect(text).toContain('You\'ll get');
    expect(text).not.toContain('Template includes');
    expect(text).toContain('The meaning of RADIO');
    expect(text).toContain('A 45-minute answer script');
    expect(text).toContain('Diagram checklist');
    expect(text).toContain('Autocomplete, news feed, and chat examples');
    expect(text).toContain('Common follow-up patterns');
    expect(text).not.toContain('not a definition');
    expect(text).toContain('Quick answer');
    expect(text).toContain('RADIO helps you structure a frontend system design interview answer in five passes');
    expect(text).toContain('clarify scope, users, constraints, and success metrics');
    expect(text).toContain('sketch the client-side structure and data flow');
    expect(text).toContain('define core entities, API contracts, cache shape, and state ownership');
    expect(text).toContain('describe UI boundaries, component responsibilities, loading, error, and accessibility states');
    expect(text).toContain('When not to overuse RADIO');
    expect(text).toContain('Do not treat RADIO as a script you recite word-for-word.');
    expect(text).toContain('RADIO definition table: what to say and draw');
    expect(text).toContain('What to say');
    expect(text).toContain('What to draw');
    expect(text).toContain('Copyable 45-minute answer script');
    expect(text).toContain('Works for autocomplete, news feed, chat, dashboards, and design systems');
    expect(text).toContain('Turn a broad prompt into a complete frontend system design interview answer.');
    expect(text).toContain('Use RADIO to clarify scope, sketch architecture, define data and interface contracts, and close with measurable trade-offs.');
    expect(text).toContain('What RADIO means');
    expect(text).toContain('What each RADIO step proves to the interviewer');
    expect(text).toContain('You prevent the answer from solving the wrong problem.');
    expect(text).toContain('You can make architecture implementable for real users.');
    expect(text).toContain('How to answer a frontend system design interview in 45 minutes');
    expect(text).toContain('Frontend system design checklist');
    expect(text).toContain('Interface taxonomy');
    expect(text).toContain('Server-client API contracts');
    expect(text).toContain('Client-client events/callbacks');
    expect(text).toContain('Component props/events');
    expect(text).toContain('Realtime event schema');
    expect(text).toContain('Error taxonomy and UI state mapping');
    expect(text).toContain('Example: Answer autocomplete with RADIO');
    expect(text).toContain('frontend system design interview example');
    expect(text).toContain('Run RADIO on common frontend system design prompts');
    expect(text).toContain('Autocomplete');
    expect(text).toContain('latency target, keyboard support, empty/error states, ranking expectations');
    expect(text).toContain('Query');
    expect(text).toContain('HighlightMatch');
    expect(text).toContain('News Feed');
    expect(text).toContain('feed freshness, infinite scroll, posting/reaction flows, latency and accessibility goals');
    expect(text).toContain('PendingMutation');
    expect(text).toContain('Chat');
    expect(text).toContain('message delivery expectations, read state, retries, offline behavior, notification constraints');
    expect(text).toContain('LocalDraft');
    expect(text).toContain('45-minute interview flow');
    expect(text).toContain('What does RADIO stand for in frontend system design?');
    expect(text).toContain('How do I use RADIO to answer a frontend system design interview question?');
    expect(text).toContain('What should I draw during a RADIO answer?');
    expect(text).toContain('How do I use RADIO for autocomplete, news feed, or chat?');
    expect(text).toContain('Is RADIO the best framework for frontend system design interviews?');

    expect(text).toContain('Requirements');
    expect(text).toContain('Architecture');
    expect(text).toContain('Data');
    expect(text).toContain('Interface');
    expect(text).toContain('Optimizations');
    expect(host.querySelector('[aria-label="RADIO definition table"] table')).toBeTruthy();
    expect(host.querySelector('a[href="#frontend-system-design-interview-answer-template"]')).toBeTruthy();
    expect(host.querySelector('a[href="#45-minute-interview-timeline"]')).toBeTruthy();
    expect(host.querySelector('a[href="#radio-requirements"]')).toBeTruthy();
    expect(host.querySelector('a[href="#run-radio-on-autocomplete-news-feed-and-chat"]')).toBeTruthy();
    expect(host.querySelector('a[href="#common-follow-up-patterns"]')).toBeTruthy();
    expect(host.querySelector('#radio-requirements')).toBeTruthy();
    expect(host.querySelector('#radio-architecture')).toBeTruthy();
    expect(host.querySelector('#radio-data')).toBeTruthy();
    expect(host.querySelector('#radio-interface')).toBeTruthy();
    expect(host.querySelector('#radio-optimizations')).toBeTruthy();
    expect(host.querySelectorAll('.radio-flow-step').length).toBe(5);
    expect(host.querySelectorAll('.worked-example-step').length).toBe(8);
    expect(host.querySelectorAll('h1').length).toBe(1);
    expect(host.querySelector('.answer-template code')?.textContent || '').toContain('0:27-0:42 Optimizations');
    const answerScript = host.querySelector('.answer-asset .answer-template');
    const definitionTable = host.querySelector('[aria-label="RADIO definition table"]');
    expect(answerScript?.compareDocumentPosition(definitionTable as Node) || 0)
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(host.querySelector('a[href="/system-design/realtime-search-debounce-cache"]')).toBeTruthy();
    expect(host.querySelector('a[href="/system-design/news-feed-timeline"]')).toBeTruthy();
    expect(host.querySelector('a[href="/system-design/ai-chat-textarea-design"]')).toBeTruthy();
    expect(host.querySelector('a[href="/guides/system-design-blueprint/radio-requirements"]')).toBeTruthy();
  });
});
