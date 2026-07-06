import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { SystemDesignRadioRequirementsArticle } from './system-design-radio-requirements';

describe('SystemDesignRadioRequirementsArticle', () => {
  let fixture: ComponentFixture<SystemDesignRadioRequirementsArticle>;

  beforeEach(async () => {
    const analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    analytics.track.and.stub();

    await TestBed.configureTestingModule({
      imports: [SystemDesignRadioRequirementsArticle, RouterTestingModule],
      providers: [{ provide: AnalyticsService, useValue: analytics }],
    }).compileComponents();

    fixture = TestBed.createComponent(SystemDesignRadioRequirementsArticle);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  function text(): string {
    return fixture.nativeElement.textContent || '';
  }

  function hasLink(href: string): boolean {
    return Boolean((fixture.nativeElement as HTMLElement).querySelector(`a[href="${href}"]`));
  }

  it('renders Requirements exploration outputs, clarifying questions, prompt examples, and FAQ', () => {
    const pageText = text();

    expect(pageText).toContain('Frontend System Design Requirements Checklist');
    expect(pageText).toContain('RADIO Requirements');
    expect(pageText).toContain('first 5-8 minute checkpoint');
    expect(pageText).toContain('ask design-changing clarifying questions');
    expect(pageText).toContain('What the Requirements step must produce');
    expect(pageText).toContain('frontend system design requirements checklist');
    expect(pageText).toContain('Primary user flow');
    expect(pageText).toContain('Architecture handoff');
    expect(pageText).toContain('Functional vs non-functional requirements in frontend system design');
    expect(pageText).toContain('Functional requirements');
    expect(pageText).toContain('Non-functional requirements');
    expect(pageText).toContain('Good vs weak clarifying questions');
    expect(pageText).toContain('Stronger question');
    expect(pageText).toContain('Prompt-specific requirements questions');
    expect(pageText).toContain('Autocomplete / realtime search');
    expect(pageText).toContain('Dashboard widgets');
    expect(pageText).toContain('Toast notification system design');
    expect(pageText).toContain('Requirements FAQ');
    expect(pageText).toContain('What is a frontend system design requirements checklist?');
    expect(pageText).toContain('What clarifying questions should I ask first?');
    expect(pageText).toContain('What is the difference between functional and non-functional requirements?');
    expect(pageText).toContain('How long should Requirements take in a frontend system design interview?');
    expect(pageText).toContain('What should I produce before moving to architecture?');
  });

  it('preserves existing requirements scripts, artifacts, example, and timebox sections', () => {
    const pageText = text();

    expect(pageText).toContain('The 90-Second Opening Script');
    expect(pageText).toContain('Requirements Question Bank (Frontend-Focused)');
    expect(pageText).toContain('Scope Box Template (Must / Nice / Out)');
    expect(pageText).toContain('Assumptions and Risk Log');
    expect(pageText).toContain('Frontend Signals You Should Always Cover');
    expect(pageText).toContain('Success Metrics You Can Commit To');
    expect(pageText).toContain('Edge Cases and Failure States Checklist');
    expect(pageText).toContain('Common Mistakes (and Better Moves)');
    expect(pageText).toContain('Worked Example: Typeahead Search (5-Min Requirements Pass)');
    expect(pageText).toContain('Requirements Timebox: 45 vs 60 Minute Interviews');
  });

  it('keeps the guide shell as the only h1 and avoids a duplicate article h1', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('h1').length).toBe(1);
    expect(host.querySelector('.content h1')).toBeNull();
  });

  it('links to existing guide deep dives and representative system design prompts', () => {
    expect(hasLink('/guides/system-design-blueprint/radio-framework')).toBeTrue();
    expect(hasLink('/guides/system-design-blueprint/architecture')).toBeTrue();
    expect(hasLink('/guides/system-design-blueprint/state-data')).toBeTrue();
    expect(hasLink('/guides/system-design-blueprint/ux')).toBeTrue();
    expect(hasLink('/guides/system-design-blueprint/performance')).toBeTrue();
    expect(hasLink('/system-design/realtime-search-debounce-cache')).toBeTrue();
    expect(hasLink('/system-design/news-feed-timeline')).toBeTrue();
    expect(hasLink('/system-design/dashboard-widgets-draggable-resizable')).toBeTrue();
    expect(hasLink('/system-design/notification-toast-system')).toBeTrue();
    expect(hasLink('/system-design/ai-chat-textarea-design')).toBeTrue();
  });
});
