import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { SystemDesignCrossCuttingArticle } from './system-design-ux';

describe('SystemDesignCrossCuttingArticle', () => {
  let fixture: ComponentFixture<SystemDesignCrossCuttingArticle>;

  beforeEach(async () => {
    const analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    analytics.track.and.stub();

    await TestBed.configureTestingModule({
      imports: [SystemDesignCrossCuttingArticle, RouterTestingModule],
      providers: [{ provide: AnalyticsService, useValue: analytics }],
    }).compileComponents();

    fixture = TestBed.createComponent(SystemDesignCrossCuttingArticle);
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

  it('renders component API, keyboard/focus/ARIA, prompt decisions, and FAQ sections', () => {
    const pageText = text();

    expect(pageText).toContain('I - Interface Deep Dive for Frontend System Design Interviews');
    expect(pageText).toContain('Component API and event contracts');
    expect(pageText).toContain('frontend component API design interview');
    expect(pageText).toContain('Component props');
    expect(pageText).toContain('Callbacks/events');
    expect(pageText).toContain('Store actions');
    expect(pageText).toContain('Server events');
    expect(pageText).toContain('Error contracts');
    expect(pageText).toContain('Keyboard, focus, and ARIA contract');
    expect(pageText).toContain('keyboard navigation frontend interview');
    expect(pageText).toContain('ARIA live regions frontend interview');
    expect(pageText).toContain('Combobox/listbox');
    expect(pageText).toContain('Dialog/modal');
    expect(pageText).toContain('Toast/live feedback');
    expect(pageText).toContain('Data grid/list');
    expect(pageText).toContain('Prompt-specific interface decisions');
    expect(pageText).toContain('frontend state to UI mapping');
    expect(pageText).toContain('Real-time Search');
    expect(pageText).toContain('News Feed');
    expect(pageText).toContain('Dashboard Widgets');
    expect(pageText).toContain('AI Chat');
    expect(pageText).toContain('Notification Toast');
    expect(pageText).toContain('Design System Architecture');
    expect(pageText).toContain('Interface FAQ');
    expect(pageText).toContain('What is frontend interface design in system design interviews?');
    expect(pageText).toContain('What should a frontend component API include?');
    expect(pageText).toContain('How do I explain keyboard and focus behavior?');
    expect(pageText).toContain('How should I map UI states in a frontend system design interview?');
    expect(pageText).toContain('How is Interface different from Data or Optimizations?');
  });

  it('preserves existing interface outputs, matrices, scripts, timebox, and drill sections', () => {
    const pageText = text();

    expect(pageText).toContain('What Interface Must Produce');
    expect(pageText).toContain('Inputs from Requirements, Architecture, and Data Model');
    expect(pageText).toContain('UI Surface Decomposition');
    expect(pageText).toContain('Interaction Model and User Flows');
    expect(pageText).toContain('State-to-UI Mapping Matrix');
    expect(pageText).toContain('Accessibility Contract (Non-Negotiable)');
    expect(pageText).toContain('Responsive and Adaptive Behavior');
    expect(pageText).toContain('Error, Empty, and Degraded UX Patterns');
    expect(pageText).toContain('Performance at Interface Layer');
    expect(pageText).toContain('Security and Trust Touchpoints in UI');
    expect(pageText).toContain('Observability for Interface Quality');
    expect(pageText).toContain('What to Say Out Loud (Interface Script Cues)');
    expect(pageText).toContain('Interface Timebox for Interviews');
    expect(pageText).toContain('Quick Drill: Typeahead Interface in 7 Minutes');
    expect(pageText).toContain('Before You Move to Optimizations');
  });

  it('keeps the guide shell as the only h1 and avoids a duplicate article h1', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('h1').length).toBe(1);
    expect(host.querySelector('.content h1')).toBeNull();
  });

  it('links to existing deep dives and representative system design prompts', () => {
    expect(hasLink('/guides/system-design-blueprint/performance')).toBeTrue();
    expect(hasLink('/guides/system-design-blueprint/state-data')).toBeTrue();
    expect(hasLink('/guides/system-design-blueprint/architecture')).toBeTrue();
    expect(hasLink('/system-design/realtime-search-debounce-cache')).toBeTrue();
    expect(hasLink('/system-design/news-feed-timeline')).toBeTrue();
    expect(hasLink('/system-design/dashboard-widgets-draggable-resizable')).toBeTrue();
    expect(hasLink('/system-design/ai-chat-textarea-design')).toBeTrue();
    expect(hasLink('/system-design/notification-toast-system')).toBeTrue();
    expect(hasLink('/system-design/component-design-system-architecture')).toBeTrue();
  });
});
