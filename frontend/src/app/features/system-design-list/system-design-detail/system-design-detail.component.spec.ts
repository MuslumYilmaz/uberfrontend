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
});
