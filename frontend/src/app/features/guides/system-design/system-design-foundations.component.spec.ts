import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { SystemDesignFoundationsArticle } from './system-design-foundations';

describe('SystemDesignFoundationsArticle', () => {
  let fixture: ComponentFixture<SystemDesignFoundationsArticle>;

  beforeEach(async () => {
    const analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    analytics.track.and.stub();

    await TestBed.configureTestingModule({
      imports: [SystemDesignFoundationsArticle, RouterTestingModule],
      providers: [{ provide: AnalyticsService, useValue: analytics }],
    }).compileComponents();

    fixture = TestBed.createComponent(SystemDesignFoundationsArticle);
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

  it('renders executable requirements, constraints, tradeoff, prompt, and FAQ sections', () => {
    const pageText = text();

    expect(pageText).toContain('Scope, Constraints, and Trade-offs');
    expect(pageText).toContain('What to lock before architecture');
    expect(pageText).toContain('First 5-8 minutes script');
    expect(pageText).toContain('first 5 minutes system design interview requirements');
    expect(pageText).toContain('Frontend constraints checklist');
    expect(pageText).toContain('frontend system design requirements checklist');
    expect(pageText).toContain('functional requirements');
    expect(pageText).toContain('non-functional requirements');
    expect(pageText).toContain('performance constraints');
    expect(pageText).toContain('accessibility requirements');
    expect(pageText).toContain('offline support');
    expect(pageText).toContain('trade-off framing');
    expect(pageText).toContain('Trade-off matrix');
    expect(pageText).toContain('Prompt examples');
    expect(pageText).toContain('Common mistakes before architecture');
    expect(pageText).toContain('What requirements should I clarify in a frontend system design interview?');
    expect(pageText).toContain('How long should requirements clarification take?');
    expect(pageText).toContain('What frontend constraints matter most before architecture?');
    expect(pageText).toContain('How do I explain trade-offs in a frontend system design interview?');
    expect(pageText).toContain('What mistakes should I avoid before drawing architecture?');
  });

  it('keeps the guide shell as the only h1 and avoids a duplicate article h1', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('h1').length).toBe(1);
    expect(host.querySelector('.content h1')).toBeNull();
  });

  it('links to existing RADIO deep dives and representative system design prompts', () => {
    expect(hasLink('/guides/system-design-blueprint/radio-requirements')).toBeTrue();
    expect(hasLink('/guides/system-design-blueprint/architecture')).toBeTrue();
    expect(hasLink('/system-design/realtime-search-debounce-cache')).toBeTrue();
    expect(hasLink('/system-design/news-feed-timeline')).toBeTrue();
    expect(hasLink('/system-design/notification-toast-system')).toBeTrue();
  });
});
