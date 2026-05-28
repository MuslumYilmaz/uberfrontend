import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { SystemDesignFrameworkArticle } from './system-design-framework';

describe('SystemDesignFrameworkArticle', () => {
  let fixture: ComponentFixture<SystemDesignFrameworkArticle>;

  beforeEach(async () => {
    const analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    analytics.track.and.stub();

    await TestBed.configureTestingModule({
      imports: [SystemDesignFrameworkArticle, RouterTestingModule],
      providers: [{ provide: AnalyticsService, useValue: analytics }],
    }).compileComponents();

    fixture = TestBed.createComponent(SystemDesignFrameworkArticle);
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

  it('renders the 5-step answer flow, timebox, artifacts, worked example, and FAQ', () => {
    const pageText = text();

    expect(pageText).toContain('Frontend System Design 5-Step Answer Method');
    expect(pageText).toContain('The 5-step frontend system design answer flow');
    expect(pageText).toContain('how to answer frontend system design interview prompts');
    expect(pageText).toContain('Use the method in a 45-minute interview');
    expect(pageText).toContain('frontend system design 45 minute answer flow');
    expect(pageText).toContain('frontend system design interview timebox');
    expect(pageText).toContain('What to produce at each step');
    expect(pageText).toContain('Define state, data, and API contracts');
    expect(pageText).toContain('frontend system design component map');
    expect(pageText).toContain('data-contract-heavy frontend system design interview');
    expect(pageText).toContain('State ownership table');
    expect(pageText).toContain('Worked mini example: Real-time Search');
    expect(pageText).toContain('frontend system design worked example');
    expect(pageText).toContain('How this differs from RADIO');
    expect(pageText).toContain('close frontend system design interview answer loops');
    expect(pageText).toContain('What is a frontend system design answer method?');
    expect(pageText).toContain('How should I structure a frontend system design interview answer?');
    expect(pageText).toContain('How much time should each step take?');
    expect(pageText).toContain('What is the difference between this 5-step method and RADIO?');
    expect(pageText).toContain('What should I say at the end of a frontend system design answer?');
  });

  it('keeps the guide shell as the only h1 and avoids a duplicate article h1', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('h1').length).toBe(1);
    expect(host.querySelector('.content h1')).toBeNull();
  });

  it('links to foundations, RADIO, and the representative Real-time Search prompt', () => {
    expect(hasLink('/guides/system-design-blueprint/foundations')).toBeTrue();
    expect(hasLink('/guides/system-design-blueprint/radio-framework')).toBeTrue();
    expect(hasLink('/system-design/realtime-search-debounce-cache')).toBeTrue();
  });
});
