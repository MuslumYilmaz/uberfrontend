import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { SystemDesignStateArticle } from './system-design-state';

describe('SystemDesignStateArticle', () => {
  let fixture: ComponentFixture<SystemDesignStateArticle>;

  beforeEach(async () => {
    const analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    analytics.track.and.stub();

    await TestBed.configureTestingModule({
      imports: [SystemDesignStateArticle, RouterTestingModule],
      providers: [{ provide: AnalyticsService, useValue: analytics }],
    }).compileComponents();

    fixture = TestBed.createComponent(SystemDesignStateArticle);
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

  it('renders state/data ownership, API contracts, prompt decisions, and FAQ sections', () => {
    const pageText = text();

    expect(pageText).toContain('D - Data Model Deep Dive for Frontend System Design Interviews');
    expect(pageText).toContain('API data contracts for frontend system design');
    expect(pageText).toContain('frontend API contracts interview');
    expect(pageText).toContain('REST resource endpoints');
    expect(pageText).toContain('GraphQL query shape');
    expect(pageText).toContain('WebSocket / SSE stream');
    expect(pageText).toContain('BFF-shaped response');
    expect(pageText).toContain('Server state vs client state vs URL state');
    expect(pageText).toContain('frontend system design state management');
    expect(pageText).toContain('server state vs client state frontend');
    expect(pageText).toContain('Derived state');
    expect(pageText).toContain('Prompt-specific state and data decisions');
    expect(pageText).toContain('frontend system design data flow');
    expect(pageText).toContain('Real-time Search');
    expect(pageText).toContain('News Feed');
    expect(pageText).toContain('Dashboard Widgets');
    expect(pageText).toContain('AI Chat');
    expect(pageText).toContain('Design System Architecture');
    expect(pageText).toContain('Data Model FAQ');
    expect(pageText).toContain('What is a frontend state and data model in system design?');
    expect(pageText).toContain('How do I separate server state, client state, and URL state?');
    expect(pageText).toContain('What should frontend API contracts include?');
    expect(pageText).toContain('How should I explain cache invalidation in a frontend interview?');
    expect(pageText).toContain('When should I use optimistic updates?');
  });

  it('preserves existing data-model outputs, matrices, scripts, timebox, and drill sections', () => {
    const pageText = text();

    expect(pageText).toContain('What Data Model Must Produce');
    expect(pageText).toContain('Inputs You Must Carry from Requirements and Architecture');
    expect(pageText).toContain('Entity Model and API Contracts');
    expect(pageText).toContain('State Ownership Model');
    expect(pageText).toContain('UI States Matrix (Critical for Frontend)');
    expect(pageText).toContain('Query Keys, Caching TTLs, and Invalidation');
    expect(pageText).toContain('Pagination, Sorting, Filtering, and URL Sync');
    expect(pageText).toContain('Mutation Flows and Optimistic Updates');
    expect(pageText).toContain('Consistency and Sync Strategy');
    expect(pageText).toContain('Failure Modes and Recovery');
    expect(pageText).toContain('Security and Privacy Boundaries');
    expect(pageText).toContain('Observability and Data Quality Signals');
    expect(pageText).toContain('What to Say Out Loud (Data Model Script Cues)');
    expect(pageText).toContain('Data Model Timebox for Interviews');
    expect(pageText).toContain('Quick Drill: Typeahead Data Model in 7 Minutes');
    expect(pageText).toContain('Before You Move to Interface');
  });

  it('keeps the guide shell as the only h1 and avoids a duplicate article h1', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('h1').length).toBe(1);
    expect(host.querySelector('.content h1')).toBeNull();
  });

  it('links to existing deep dives and representative system design prompts', () => {
    expect(hasLink('/guides/system-design-blueprint/ux')).toBeTrue();
    expect(hasLink('/guides/system-design-blueprint/performance')).toBeTrue();
    expect(hasLink('/system-design/realtime-search-debounce-cache')).toBeTrue();
    expect(hasLink('/system-design/news-feed-timeline')).toBeTrue();
    expect(hasLink('/system-design/dashboard-widgets-draggable-resizable')).toBeTrue();
    expect(hasLink('/system-design/ai-chat-textarea-design')).toBeTrue();
    expect(hasLink('/system-design/component-design-system-architecture')).toBeTrue();
  });
});
