import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { SystemDesignIntroArticle } from './system-design-intro.component';

describe('SystemDesignIntroArticle', () => {
  let fixture: ComponentFixture<SystemDesignIntroArticle>;

  beforeEach(async () => {
    const analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    analytics.track.and.stub();

    await TestBed.configureTestingModule({
      imports: [SystemDesignIntroArticle, RouterTestingModule],
      providers: [{ provide: AnalyticsService, useValue: analytics }],
    }).compileComponents();

    fixture = TestBed.createComponent(SystemDesignIntroArticle);
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

  it('renders the strengthened frontend system design intro sections', () => {
    const pageText = text();

    expect(pageText).toContain('Front-End System Design: What It Really Tests');
    expect(pageText).toContain('What this intro covers');
    expect(pageText).toContain('Frontend vs backend system design');
    expect(pageText).toContain('Scoring rubric: what interviewers score');
    expect(pageText).toContain('Common prompt families to recognize');
    expect(pageText).toContain('How to use this blueprint after the intro');
    expect(pageText).toContain('Architecture boundary');
    expect(pageText).toContain('Requirements clarity');
    expect(pageText).toContain('Performance and reliability');
  });

  it('routes readers to existing RADIO, checklist, and prompt practice pages', () => {
    expect(hasLink('/guides/system-design-blueprint/radio-framework')).toBeTrue();
    expect(hasLink('/guides/system-design-blueprint/checklist')).toBeTrue();
    expect(hasLink('/system-design/infinite-scroll-list')).toBeTrue();
    expect(hasLink('/system-design/realtime-search-debounce-cache')).toBeTrue();
    expect(hasLink('/system-design/component-design-system-architecture')).toBeTrue();
  });
});
