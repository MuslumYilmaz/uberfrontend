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

    expect(text).toContain('Frontend System Design Interview Framework: RADIO Answer Template');
    expect(text).toContain('frontend system design interview framework');
    expect(text).toContain('Use this if your interviewer asks: "How would you design X?"');
    expect(text).toContain('Copyable 45-minute answer structure');
    expect(text).toContain('Works for autocomplete, news feed, chat, dashboards, and design systems');
    expect(text).toContain('RADIO framework snapshot');
    expect(text).toContain('RADIO framework frontend system design snapshot');
    expect(text).toContain('What each RADIO step proves to the interviewer');
    expect(text).toContain('You prevent the answer from solving the wrong problem.');
    expect(text).toContain('You can make architecture implementable for real users.');
    expect(text).toContain('Frontend system design interview answer template');
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
    expect(text).toContain('45-minute interview flow');
    expect(text).toContain('What is the RADIO framework in frontend system design?');
    expect(text).toContain('How do I use RADIO to answer a frontend system design interview question?');
    expect(text).toContain('What should I draw during a RADIO answer?');
    expect(text).toContain('How do I use RADIO for autocomplete, news feed, or chat?');
    expect(text).toContain('Is RADIO the best framework for frontend system design interviews?');

    expect(text).toContain('Requirements');
    expect(text).toContain('Architecture');
    expect(text).toContain('Data');
    expect(text).toContain('Interface');
    expect(text).toContain('Optimizations');
    expect(host.querySelectorAll('.radio-flow-step').length).toBe(5);
    expect(host.querySelectorAll('.worked-example-step').length).toBe(5);
    expect(host.querySelector('.answer-template code')?.textContent || '').toContain('0:27-0:42 Optimizations');
    expect(host.querySelector('a[href="/system-design/realtime-search-debounce-cache"]')).toBeTruthy();
    expect(host.querySelector('a[href="/system-design/news-feed-timeline"]')).toBeTruthy();
    expect(host.querySelector('a[href="/system-design/ai-chat-textarea-design"]')).toBeTruthy();
    expect(host.querySelector('a[href="/guides/system-design-blueprint/radio-requirements"]')).toBeTruthy();
  });
});
