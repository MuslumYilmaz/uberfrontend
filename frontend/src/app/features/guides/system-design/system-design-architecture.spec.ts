import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { SystemDesignArchitectureArticle } from './system-design-architecture';

describe('SystemDesignArchitectureArticle', () => {
  let fixture: ComponentFixture<SystemDesignArchitectureArticle>;

  beforeEach(async () => {
    const analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    analytics.track.and.stub();

    await TestBed.configureTestingModule({
      imports: [SystemDesignArchitectureArticle, RouterTestingModule],
      providers: [{ provide: AnalyticsService, useValue: analytics }],
    }).compileComponents();

    fixture = TestBed.createComponent(SystemDesignArchitectureArticle);
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

  it('renders the new architecture sections, prompt decisions, and FAQ', () => {
    const pageText = text();

    expect(pageText).toContain('A - Architecture Deep Dive for Frontend System Design Interviews');
    expect(pageText).toContain('Client-side architecture layers');
    expect(pageText).toContain('frontend client side architecture interview');
    expect(pageText).toContain('frontend rendering strategy system design');
    expect(pageText).toContain('Server-state cache');
    expect(pageText).toContain('What to draw in the architecture diagram');
    expect(pageText).toContain('interview-ready frontend architecture diagram');
    expect(pageText).toContain('Route / rendering boundary');
    expect(pageText).toContain('API / BFF boundary');
    expect(pageText).toContain('When BFF and edge belong in the answer');
    expect(pageText).toContain('frontend system design BFF');
    expect(pageText).toContain('Prompt-specific architecture decisions');
    expect(pageText).toContain('Autocomplete / realtime search');
    expect(pageText).toContain('News feed');
    expect(pageText).toContain('Dashboard widgets');
    expect(pageText).toContain('Portal-based toast architecture');
    expect(pageText).toContain('AI chat');
    expect(pageText).toContain('Design system architecture');
    expect(pageText).toContain('Architecture FAQ');
    expect(pageText).toContain('What is frontend system design architecture?');
    expect(pageText).toContain('How do I choose CSR, SSR, SSG, or edge rendering?');
    expect(pageText).toContain('What should I draw in a frontend architecture interview?');
    expect(pageText).toContain('When should I use a BFF in frontend system design?');
    expect(pageText).toContain('How is frontend architecture different from data model or interface design?');
  });

  it('preserves existing architecture outputs, matrices, scripts, timebox, and drill sections', () => {
    const pageText = text();

    expect(pageText).toContain('Scope Guard: What This Page Covers');
    expect(pageText).toContain('What Architecture Must Produce');
    expect(pageText).toContain('Inputs You Must Pull from Requirements');
    expect(pageText).toContain('Architecture Options Matrix');
    expect(pageText).toContain('Baseline Reference Architecture');
    expect(pageText).toContain('Route-by-route rendering strategy');
    expect(pageText).toContain('Data Flow, State Boundaries, and Caching');
    expect(pageText).toContain('Failure Modes and Resilience Design');
    expect(pageText).toContain('Performance and Cost Trade-offs');
    expect(pageText).toContain('Security and Trust Boundaries');
    expect(pageText).toContain('Observability Plan');
    expect(pageText).toContain('What to Say Out Loud (Architecture Script Cues)');
    expect(pageText).toContain('Architecture Timebox for Interviews');
    expect(pageText).toContain('Quick Drill: Typeahead Search Architecture in 7 Minutes');
    expect(pageText).toContain('Before You Move to Data Model');
  });

  it('keeps the guide shell as the only h1 and avoids a duplicate article h1', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('h1').length).toBe(1);
    expect(host.querySelector('.content h1')).toBeNull();
  });

  it('links to existing deep dives and representative system design prompts', () => {
    expect(hasLink('/guides/system-design-blueprint/state-data')).toBeTrue();
    expect(hasLink('/guides/system-design-blueprint/ux')).toBeTrue();
    expect(hasLink('/guides/system-design-blueprint/performance')).toBeTrue();
    expect(hasLink('/system-design/realtime-search-debounce-cache')).toBeTrue();
    expect(hasLink('/system-design/news-feed-timeline')).toBeTrue();
    expect(hasLink('/system-design/dashboard-widgets-draggable-resizable')).toBeTrue();
    expect(hasLink('/system-design/notification-toast-system')).toBeTrue();
    expect(hasLink('/system-design/ai-chat-textarea-design')).toBeTrue();
    expect(hasLink('/system-design/component-design-system-architecture')).toBeTrue();
  });
});
