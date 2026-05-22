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
    expect(text).toContain('Frontend system design interview answer template');
    expect(text).toContain('How to answer a frontend system design interview in 45 minutes');
    expect(text).toContain('Frontend system design checklist');
    expect(text).toContain('Example: Answer autocomplete with RADIO');
    expect(text).toContain('frontend system design interview example');
    expect(text).toContain('45-minute interview flow');
    expect(text).toContain('What is the RADIO framework for frontend system design interviews?');
    expect(text).toContain('How do I use RADIO to answer a frontend system design interview question?');
    expect(text).toContain('What should I cover in Requirements, Architecture, Data, Interface, and Optimizations?');
    expect(text).toContain('How does RADIO work in a 45-minute system design interview?');
    expect(text).toContain('Is RADIO only for frontend system design?');

    expect(text).toContain('Requirements');
    expect(text).toContain('Architecture');
    expect(text).toContain('Data');
    expect(text).toContain('Interface');
    expect(text).toContain('Optimizations');
    expect(host.querySelectorAll('.radio-flow-step').length).toBe(5);
    expect(host.querySelectorAll('.worked-example-step').length).toBe(5);
    expect(host.querySelector('.answer-template code')?.textContent || '').toContain('0:27-0:42 Optimizations');
  });
});
