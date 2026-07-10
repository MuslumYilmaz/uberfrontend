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
  let seo: jasmine.SpyObj<SeoService>;
  let authUser: any;

  beforeEach(async () => {
    bugReport = jasmine.createSpyObj<BugReportService>('BugReportService', ['open']);
    seo = jasmine.createSpyObj<SeoService>('SeoService', ['updateTags', 'buildCanonicalUrl']);
    seo.buildCanonicalUrl.and.callFake((value: string) => value);
    authUser = null;

    await TestBed.configureTestingModule({
      imports: [SystemDesignDetailComponent, RouterTestingModule],
      providers: [
        {
          provide: QuestionService,
          useValue: { loadSystemDesign: () => { }, loadSystemDesignQuestion: () => { }, clearCache: () => { } },
        },
        { provide: SeoService, useValue: seo },
        { provide: AuthService, useValue: { user: () => authUser, isLoggedIn: () => !!authUser } },
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

  it('uses SEO override metadata without changing the visible question title', () => {
    const fixture = TestBed.createComponent(SystemDesignDetailComponent);
    const component = fixture.componentInstance;

    (component as any).applyResolvedQuestion({
      id: 'dashboard-widgets-draggable-resizable',
      title: 'Drag-and-Drop Dashboard Frontend System Design',
      description: 'Long visible challenge description.',
      tags: ['dashboard'],
      access: 'free',
      seo: {
        title: 'Drag-and-Drop Dashboard Frontend System Design: Grid Layout, Resize, Collision and Persistence',
        description: 'Practice draggable dashboard frontend system design with a grid data model, pointer interactions, collision snapping, rAF rendering, persistence migrations, responsive behavior, and accessibility.',
      },
    });

    expect(component.title()).toBe('Drag-and-Drop Dashboard Frontend System Design');
    expect(seo.updateTags).toHaveBeenCalledWith(jasmine.objectContaining({
      title: 'Drag-and-Drop Dashboard Frontend System Design: Grid Layout, Resize, Collision and Persistence',
      description: 'Practice draggable dashboard frontend system design with a grid data model, pointer interactions, collision snapping, rAF rendering, persistence migrations, responsive behavior, and accessibility.',
      canonical: '/system-design/dashboard-widgets-draggable-resizable',
      robots: undefined,
    }));
  });

  it('marks premium system design content noindex without FAQ answer schema', () => {
    const fixture = TestBed.createComponent(SystemDesignDetailComponent);
    const component = fixture.componentInstance;
    authUser = { accessTier: 'premium' };

    (component as any).applyResolvedQuestion({
      id: 'endless-short-video-feed',
      title: 'Design an Endless Short-Video Feed',
      description: 'Premium system design prompt teaser.',
      tags: ['feeds'],
      access: 'premium',
      radio: [
        {
          key: 'R',
          title: 'Requirements',
          blocks: [{ type: 'text', text: 'Full paid requirements analysis should not appear in schema.' }],
        },
      ],
    });

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const article = graph.find((entry: any) => entry?.['@type'] === 'Article');
    const learningResource = graph.find((entry: any) => entry?.['@type'] === 'LearningResource');
    const typeNames = graph.map((entry: any) => entry?.['@type']);

    expect(payload.robots).toBe('noindex,follow');
    expect(payload.canonical).toBe('/system-design/endless-short-video-feed');
    expect(article?.isAccessibleForFree).toBeFalse();
    expect(learningResource?.isAccessibleForFree).toBeFalse();
    expect(typeNames).not.toContain('FAQPage');
    expect(component.locked()).toBeFalse();
  });

  it('renders system design link blocks as real internal anchors', () => {
    const fixture = TestBed.createComponent(SystemDesignDetailComponent);
    const component = fixture.componentInstance;

    component.q.set({
      id: 'dashboard-widgets-draggable-resizable',
      title: 'Drag-and-Drop Dashboard Frontend System Design',
      description: 'Dashboard layout question.',
      tags: ['dashboard'],
      access: 'free',
      radio: [
        {
          key: 'R',
          title: 'Interview framing and requirements',
          blocks: [
            {
              type: 'links',
              title: 'Contextual practice links',
              items: [
                {
                  label: 'Frontend system design question bank',
                  href: '/system-design',
                  description: 'Use this prompt alongside other frontend architecture scenarios.',
                },
                {
                  label: 'Machine coding hub',
                  href: '/machine-coding',
                },
              ],
            },
          ],
        },
      ],
    });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const links = Array.from(host.querySelectorAll('.sd-link-item')) as HTMLAnchorElement[];
    const hrefs = links.map((link) => link.getAttribute('href'));

    expect(hrefs).toContain('/system-design');
    expect(hrefs).toContain('/machine-coding');
    expect(host.textContent || '').toContain('Use this prompt alongside other frontend architecture scenarios.');
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
    expect(slugs).toContain('evaluation');
    expect(slugs).toContain('pitfalls');
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
    expect(component.guideLinks().find((link) => link.slug === 'evaluation')?.title)
      .toBe('live chart system design interview evaluation');
    expect(component.guideLinks().find((link) => link.slug === 'pitfalls')?.title)
      .toBe('live chart system design pitfalls');
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

  it('marks only the generic prep bridge CTA as nosnippet', () => {
    const fixture = TestBed.createComponent(SystemDesignDetailComponent);
    const component = fixture.componentInstance;

    component.q.set({
      id: 'notification-toast-system',
      title: 'Design a Toast Notification System',
      description: 'Frontend system design interview example for global toasts.',
      tags: ['toast'],
      access: 'free',
      radio: [
        {
          key: 'R',
          title: 'Requirements exploration',
          blocks: [{ type: 'text', text: 'Main toast notification system content.' }],
        },
      ],
    });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const mainText = host.querySelector('.sd-text') as HTMLElement | null;
    const prepBridge = host.querySelector('[data-testid="system-design-prep-entry"]') as HTMLElement | null;

    expect(mainText).not.toBeNull();
    expect(prepBridge).not.toBeNull();
    expect(mainText!.hasAttribute('data-nosnippet')).toBeFalse();
    expect(prepBridge!.hasAttribute('data-nosnippet')).toBeTrue();
  });
});
