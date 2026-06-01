import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { BugReportService } from '../../../core/services/bug-report.service';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { QuestionService } from '../../../core/services/question.service';
import { SeoService } from '../../../core/services/seo.service';
import { SystemDesignDetailComponent } from './system-design-detail.component';

describe('SystemDesignDetailComponent', () => {
  let bugReport: jasmine.SpyObj<BugReportService>;

  beforeEach(async () => {
    bugReport = jasmine.createSpyObj<BugReportService>('BugReportService', ['open']);

    await TestBed.configureTestingModule({
      imports: [SystemDesignDetailComponent, RouterTestingModule],
      providers: [
        {
          provide: QuestionService,
          useValue: { loadSystemDesign: () => { }, loadSystemDesignQuestion: () => { }, clearCache: () => { } },
        },
        { provide: SeoService, useValue: { updateTags: () => { }, buildCanonicalUrl: (v: string) => v } },
        { provide: AuthService, useValue: { user: () => null, isLoggedIn: () => false } },
        { provide: OnboardingService, useValue: { getProfile: () => null } },
        { provide: AnalyticsService, useValue: { track: () => { } } },
        { provide: BugReportService, useValue: bugReport },
      ],
    }).compileComponents();
  });

  it('opens bug report flow from system design detail action', () => {
    const fixture = TestBed.createComponent(SystemDesignDetailComponent);
    const component = fixture.componentInstance;

    component.q.set({
      id: 'sd-1',
      title: 'Design URL Shortener',
      description: 'Shortener design question.',
      tags: [],
      access: 'free',
    });

    component.reportIssue();

    expect(bugReport.open).toHaveBeenCalledWith(jasmine.objectContaining({
      source: 'system_design_detail',
      tech: 'system-design',
      questionId: 'sd-1',
      questionTitle: 'Design URL Shortener',
    }));
  });

  it('opens bug report flow from system design locked action', () => {
    const fixture = TestBed.createComponent(SystemDesignDetailComponent);
    const component = fixture.componentInstance;

    component.q.set({
      id: 'sd-1',
      title: 'Design URL Shortener',
      description: 'Shortener design question.',
      tags: [],
      access: 'premium',
    });

    component.reportAccessIssue();

    expect(bugReport.open).toHaveBeenCalledWith(jasmine.objectContaining({
      source: 'system_design_locked',
      tech: 'system-design',
      questionId: 'sd-1',
      questionTitle: 'Design URL Shortener',
    }));
  });

  it('surfaces RADIO plus the matched blueprint guide without duplicate guide links', () => {
    const fixture = TestBed.createComponent(SystemDesignDetailComponent);
    const component = fixture.componentInstance;

    component.q.set({
      id: 'sd-performance',
      title: 'Design a live chart',
      description: 'Handle high-frequency updates without blocking the UI.',
      tags: ['performance', 'real-time', 'virtualization'],
      access: 'free',
    });

    expect(component.recommendedBlueprintGuide().slug).toBe('performance');

    const slugs = component.guideLinks().map((link) => link.slug);
    expect(slugs[0]).toBe('radio-framework');
    expect(slugs[1]).toBe('performance');
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(component.supportingGuideLinks().some((link) => link.slug === 'radio-framework')).toBeFalse();
  });

  it('uses cluster keyword anchor text for the recommended performance guide', () => {
    const fixture = TestBed.createComponent(SystemDesignDetailComponent);
    const component = fixture.componentInstance;

    component.q.set({
      id: 'live-chart-high-frequency-updates',
      title: 'Live Chart Rendering',
      description: 'Handle high-frequency updates without blocking the UI.',
      tags: ['charts', 'real-time', 'performance'],
      access: 'free',
    });

    expect(component.recommendedBlueprintGuide().slug).toBe('performance');
    expect(component.recommendedBlueprintGuide().title).toBe('live chart performance system design');
    expect(component.guideLinks().find((link) => link.slug === 'performance')?.title)
      .toBe('live chart performance system design');
  });

  it('uses explicit RADIO requirements metadata for the recommended blueprint guide', () => {
    const fixture = TestBed.createComponent(SystemDesignDetailComponent);
    const component = fixture.componentInstance;

    component.q.set({
      id: 'sd-requirements',
      title: 'Clarify scope for a frontend system',
      description: 'Focus the interview scope before architecture.',
      tags: ['scope'],
      guideSlug: 'radio-requirements',
      access: 'free',
    });

    expect(component.recommendedBlueprintGuide().slug).toBe('radio-requirements');
    expect(component.guideLinks().map((link) => link.slug)).toContain('radio-requirements');
  });
});
