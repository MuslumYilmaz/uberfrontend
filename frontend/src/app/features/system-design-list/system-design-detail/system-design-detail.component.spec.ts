import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
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
  let questionService: jasmine.SpyObj<QuestionService>;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let authUser: any;

  beforeEach(async () => {
    bugReport = jasmine.createSpyObj<BugReportService>('BugReportService', ['open']);
    seo = jasmine.createSpyObj<SeoService>('SeoService', ['updateTags', 'buildCanonicalUrl']);
    questionService = jasmine.createSpyObj<QuestionService>(
      'QuestionService',
      ['loadSystemDesign', 'loadSystemDesignQuestion', 'clearCache'],
    );
    questionService.loadSystemDesign.and.returnValue(of([]));
    questionService.loadSystemDesignQuestion.and.returnValue(of(null));
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    seo.buildCanonicalUrl.and.callFake((value: string) => value);
    authUser = null;

    await TestBed.configureTestingModule({
      imports: [SystemDesignDetailComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [
        { provide: QuestionService, useValue: questionService },
        { provide: SeoService, useValue: seo },
        { provide: AuthService, useValue: { user: () => authUser, isLoggedIn: () => !!authUser } },
        { provide: OnboardingService, useValue: { getProfile: () => null } },
        { provide: AnalyticsService, useValue: analytics },
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

  it('keeps the infinite-scroll metadata contract and publishes truthful structured-data dates', () => {
    const fixture = TestBed.createComponent(SystemDesignDetailComponent);
    const component = fixture.componentInstance;
    const description = 'Design an infinite-scroll list with paginated loading, error recovery, and virtualization strategy so scrolling stays fast while DOM size remains bounded.';

    (component as any).applyResolvedQuestion({
      id: 'infinite-scroll-list',
      title: 'Infinite Scroll List System Design',
      description,
      tags: ['infinite-scroll', 'pagination', 'virtualization'],
      access: 'free',
      difficulty: 'hard',
      publishedAt: '2025-11-22',
      updatedAt: '2026-07-27',
      radio: [
        {
          key: 'R',
          title: 'Requirements and a 60-second answer',
          blocks: [{ type: 'text', text: 'Start with requirements visible on the page.' }],
        },
      ],
    });

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const article = graph.find((entry: any) => entry?.['@type'] === 'Article');
    const learningResource = graph.find((entry: any) => entry?.['@type'] === 'LearningResource');
    const typeNames = graph.map((entry: any) => entry?.['@type']);

    expect(component.title()).toBe('Infinite Scroll List System Design');
    expect(payload).toEqual(jasmine.objectContaining({
      title: 'Infinite Scroll List System Design',
      description,
      canonical: '/system-design/infinite-scroll-list',
      robots: undefined,
    }));
    expect(article?.datePublished).toBe('2025-11-22T00:00:00.000Z');
    expect(article?.dateModified).toBe('2026-07-27T00:00:00.000Z');
    expect(article?.isAccessibleForFree).toBeTrue();
    expect(learningResource?.isAccessibleForFree).toBeTrue();
    expect(learningResource?.educationalLevel).toBe('senior');
    expect(learningResource?.timeRequired).toBe('PT20M');
    expect(typeNames).toContain('BreadcrumbList');
    expect(typeNames).toContain('Article');
    expect(typeNames).toContain('LearningResource');
    expect(typeNames).not.toContain('FAQPage');
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
    expect(article?.author).toEqual({ '@type': 'Organization', name: 'FrontendAtlas Editorial' });
    expect(learningResource?.isAccessibleForFree).toBeFalse();
    expect(learningResource?.author).toEqual({ '@type': 'Organization', name: 'FrontendAtlas Editorial' });
    expect(typeNames).not.toContain('FAQPage');
    expect(component.locked()).toBeFalse();
  });

  it('renders heading blocks semantically and separates internal from safe external links', () => {
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
              type: 'heading',
              text: 'Choose a pagination strategy',
            },
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
                {
                  label: 'MDN Intersection Observer',
                  href: 'https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API',
                  description: 'Review the browser API used for the loading sentinel.',
                },
              ],
            },
          ],
        },
      ],
    });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const heading = host.querySelector('h3.sd-h3') as HTMLHeadingElement | null;
    const links = Array.from(host.querySelectorAll('.sd-link-item')) as HTMLAnchorElement[];
    const internalLink = links.find((link) => link.textContent?.includes('Frontend system design question bank'));
    const externalLink = links.find((link) => link.textContent?.includes('MDN Intersection Observer'));

    expect(heading?.textContent?.trim()).toBe('Choose a pagination strategy');
    expect(internalLink?.getAttribute('href')).toBe('/system-design');
    expect(internalLink?.hasAttribute('target')).toBeFalse();
    expect(externalLink?.getAttribute('href')).toBe('https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API');
    expect(externalLink?.getAttribute('target')).toBe('_blank');
    expect(externalLink?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(host.textContent || '').toContain('Use this prompt alongside other frontend architecture scenarios.');
  });

  it('renders read-only code and tables as semantic SSR-friendly content', () => {
    const fixture = TestBed.createComponent(SystemDesignDetailComponent);
    const component = fixture.componentInstance;

    component.q.set({
      id: 'offline-email-client',
      title: 'Gmail-Style Offline Email Client Frontend System Design',
      description: 'Offline mailbox design.',
      tags: ['email'],
      access: 'free',
      contentLoadState: 'ready',
      radio: [
        {
          key: 'D',
          title: 'Data',
          blocks: [
            {
              type: 'code',
              language: 'typescript',
              code: 'interface MailboxSnapshot { syncCursor: string }',
            },
            {
              type: 'table',
              title: 'Mailbox states',
              columns: ['State', 'Invariant'],
              rows: [['Cached', 'Never presented as fresh']],
            },
          ],
        },
      ],
    });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const code = host.querySelector('pre.sd-code code');
    const caption = host.querySelector('.sd-table caption');
    const headers = Array.from(host.querySelectorAll('.sd-table th'));
    const tableScroller = host.querySelector('.sd-table-scroll');

    expect(code?.textContent).toContain('MailboxSnapshot');
    expect(host.querySelector('app-monaco-editor')).toBeNull();
    expect(caption?.textContent?.trim()).toBe('Mailbox states');
    expect(headers.map((header) => header.getAttribute('scope'))).toEqual(['col', 'col']);
    expect(tableScroller?.getAttribute('tabindex')).toBe('0');
    expect(tableScroller?.getAttribute('aria-label')).toBe('Mailbox states table');
  });

  it('renders the evaluation spine and keeps the three decision hints closed for V2 prompts', () => {
    const fixture = TestBed.createComponent(SystemDesignDetailComponent);
    const component = fixture.componentInstance;
    component.q.set({
      id: 'notification-toast-system',
      title: 'Design a Toast Notification System',
      description: 'Design global toast behavior.',
      tags: ['toast'],
      access: 'free',
      contentSchemaVersion: 2,
      practice: {
        targetLevel: 'junior',
        timeboxMinutes: 10,
        candidatePrompt: 'Design a global toast system with a single cleanup path.',
        constraints: ['Only three are visible.', 'Speech does not repeat.'],
        expectedDecisions: ['Choose the owner.', 'Resolve timer races.', 'Separate announcements.'],
        prerequisites: ['Component state', 'ARIA live regions'],
        coreSkills: ['State ownership', 'Accessibility'],
        evaluationSpine: {
          mustCover: ['One owner orders records.', 'Dismiss and timeout share cleanup.'],
          strongSignals: ['Actions persist.', 'Announcement identity stays separate.'],
          expertStretch: 'Route scope and pause behavior.',
          redFlag: 'Every component owns a timer.',
        },
      },
      radio: [{ key: 'R', title: 'Requirements', blocks: [] }],
    });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const hint = host.querySelector('.sd-decision-hint') as HTMLDetailsElement | null;
    expect(host.textContent || '').toContain('Must cover');
    expect(host.textContent || '').toContain('Stretch if time');
    expect(host.textContent || '').toContain('Every component owns a timer.');
    expect(hint).not.toBeNull();
    expect(hint?.open).toBeFalse();
    expect(host.querySelector('.sd-try-first__decisions')).toBeNull();
  });

  it('normalizes divider runs and only strips a matching source step number without mutating content', () => {
    const fixture = TestBed.createComponent(SystemDesignDetailComponent);
    const component = fixture.componentInstance;
    const sourceBlocks: any[] = [
      { type: 'divider' },
      {
        type: 'steps',
        title: 'Answer path',
        steps: [
          { title: '1. Frame the race', text: 'Start with one event.' },
          { title: '3) Keep the mismatch', text: 'This prefix carries source meaning.' },
        ],
      },
      { type: 'divider' },
      { type: 'divider' },
      {
        type: 'columns',
        columns: [{ blocks: [{ type: 'divider' }, { type: 'text', text: 'Nested content.' }, { type: 'divider' }] }],
      },
      { type: 'divider' },
    ];
    component.q.set({
      id: 'renderer-normalization',
      title: 'Renderer normalization',
      description: 'Test display normalization.',
      tags: [],
      access: 'free',
      radio: [{ key: 'R', title: 'Requirements', blocks: sourceBlocks }],
    });
    fixture.detectChanges();

    const normalized = component.sections()[0].blocks;
    expect(normalized.map((block) => block.type)).toEqual(['steps', 'divider', 'columns']);
    expect((normalized[0] as any).steps.map((step: any) => step.title))
      .toEqual(['Frame the race', '3) Keep the mismatch']);
    expect((normalized[2] as any).columns[0].blocks.map((block: any) => block.type)).toEqual(['text']);
    expect((sourceBlocks[1] as any).steps[0].title).toBe('1. Frame the race');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.sd-steps ol > li')).toHaveSize(2);
  });

  it('keeps one canonical H1 when the mobile overview is open', () => {
    const fixture = TestBed.createComponent(SystemDesignDetailComponent);
    const component = fixture.componentInstance;

    component.q.set({
      id: 'offline-email-client',
      title: 'Gmail-Style Offline Email Client Frontend System Design',
      description: 'Offline mailbox design.',
      tags: ['email'],
      access: 'free',
      contentLoadState: 'ready',
      radio: [{ key: 'R', title: 'Requirements', blocks: [] }],
    });
    component.mobileOverviewOpen.set(true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('h1')).toHaveSize(1);
    expect(host.querySelector('h1')?.textContent?.trim())
      .toBe('Gmail-Style Offline Email Client Frontend System Design');
    expect(host.querySelector('#sd-mobile-overview-panel h1')).toBeNull();
  });

  it('disables smooth section scrolling when reduced motion is requested', () => {
    const fixture = TestBed.createComponent(SystemDesignDetailComponent);
    const component = fixture.componentInstance;
    spyOn(window, 'matchMedia').and.returnValue({
      matches: true,
    } as MediaQueryList);

    expect((component as any).preferredScrollBehavior()).toBe('auto');
  });

  it('surfaces an atomic content error and replaces it after a successful retry', () => {
    const fixture = TestBed.createComponent(SystemDesignDetailComponent);
    const component = fixture.componentInstance;
    const indexEntry = {
      id: 'offline-email-client',
      title: 'Gmail-Style Offline Email Client Frontend System Design',
      description: 'Catalog description.',
      tags: ['email'],
      type: 'system-design' as const,
      access: 'free' as const,
      difficulty: 'hard' as const,
      contentLoadState: 'error' as const,
    };
    component.all = [indexEntry];
    component.q.set(indexEntry);
    questionService.loadSystemDesignQuestion.and.returnValue(of({
      id: indexEntry.id,
      title: indexEntry.title,
      description: indexEntry.description,
      tags: indexEntry.tags,
      seo: { title: 'Offline email SEO title' },
      radio: [
        {
          key: 'R',
          title: 'Requirements',
          blocks: [{ type: 'text', text: 'Complete answer loaded.' }],
        },
      ],
      contentLoadState: 'ready',
    }));

    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-testid="sd-content-error"]'))
      .not.toBeNull();

    component.openSectionKeys.set(new Set(['R']));
    component.retrySystemDesignContent();
    fixture.detectChanges();

    expect(questionService.loadSystemDesignQuestion)
      .toHaveBeenCalledWith(indexEntry.id, { transferState: false });
    expect(component.contentLoadState()).toBe('ready');
    expect(component.sections().map((section) => section.key)).toEqual(['R']);
    expect(component.isSectionOpen('R')).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Complete answer loaded.');
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-testid="sd-content-error"]'))
      .toBeNull();
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

  it('keeps reference content in the DOM while native RADIO disclosures start closed and open independently', () => {
    const fixture = TestBed.createComponent(SystemDesignDetailComponent);
    const component = fixture.componentInstance;
    component.q.set({
      id: 'notification-toast-system',
      title: 'Design a Toast Notification System',
      description: 'Design global toast behavior.',
      tags: ['toast'],
      access: 'free',
      radio: [
        { key: 'R', title: 'Requirements', blocks: [{ type: 'text', text: 'Requirements answer.' }] },
        { key: 'A', title: 'Architecture', blocks: [{ type: 'text', text: 'Architecture answer.' }] },
      ],
    });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const details = Array.from(host.querySelectorAll('details.sd-section')) as HTMLDetailsElement[];
    expect(details.map((item) => item.open)).toEqual([false, false]);
    expect(host.textContent).toContain('Requirements answer.');
    expect(host.textContent).toContain('Architecture answer.');

    component.onSectionToggle('R', { currentTarget: { open: true } } as unknown as Event);
    component.onSectionToggle('A', { currentTarget: { open: true } } as unknown as Event);
    fixture.detectChanges();
    expect(details.map((item) => item.open)).toEqual([true, true]);
  });

  it('opens only Requirements through #answer and closes it when that history state is left', () => {
    const fixture = TestBed.createComponent(SystemDesignDetailComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    component.q.set({
      id: 'notification-toast-system',
      title: 'Design a Toast Notification System',
      description: 'Design global toast behavior.',
      tags: ['toast'],
      access: 'free',
      radio: [
        { key: 'R', title: 'Requirements', blocks: [] },
        { key: 'A', title: 'Architecture', blocks: [] },
      ],
    });
    component.openSectionKeys.set(new Set(['A']));

    component.openReferenceAnswer();

    expect([...component.openSectionKeys()]).toEqual(['R']);
    expect(router.navigate).toHaveBeenCalledWith([], jasmine.objectContaining({
      fragment: 'answer',
      queryParamsHandling: 'preserve',
    }));
    expect(analytics.track).toHaveBeenCalledWith(
      'system_design_reference_opened',
      jasmine.objectContaining({ question_id: 'notification-toast-system' }),
    );

    (component as any).applyFragment(null);
    expect(component.isSectionOpen('R')).toBeFalse();
  });

  it('opens recognized section fragments and ignores unknown fragments', () => {
    const fixture = TestBed.createComponent(SystemDesignDetailComponent);
    const component = fixture.componentInstance;
    component.q.set({
      id: 'ai-chat-textarea-design',
      title: 'Design an AI Chat Composer',
      description: 'Design a safe chat composer.',
      tags: ['ai'],
      access: 'free',
      radio: [
        { key: 'R', title: 'Requirements', blocks: [] },
        { key: 'D', title: 'Data', blocks: [] },
      ],
    });

    (component as any).applyFragment('sec-D');
    expect(component.isSectionOpen('D')).toBeTrue();
    const before = [...component.openSectionKeys()];
    (component as any).applyFragment('sec-unknown');
    expect([...component.openSectionKeys()]).toEqual(before);
  });

  it('does not put premium RADIO answers or diagrams in the locked DOM', () => {
    const fixture = TestBed.createComponent(SystemDesignDetailComponent);
    const component = fixture.componentInstance;
    component.q.set({
      id: 'ai-ux-considerations',
      title: 'AI Proposal Review and Action Controls',
      description: 'Premium prompt preview.',
      tags: ['ai'],
      access: 'premium',
      contentSchemaVersion: 2,
      practice: {
        targetLevel: 'mid',
        timeboxMinutes: 15,
        candidatePrompt: 'Design a public proposal review prompt.',
        constraints: ['Approval is explicit.', 'Cancel is not rollback.'],
        expectedDecisions: ['Separate proposal.', 'Bind approval.', 'Recover outcomes.'],
        prerequisites: ['Versioned state', 'Async feedback'],
        coreSkills: ['Authority', 'Recovery'],
        guidedMock: true,
        evaluationSpine: {
          mustCover: ['Paid must-cover answer one.', 'Paid must-cover answer two.'],
          strongSignals: ['Paid strong signal one.', 'Paid strong signal two.'],
          expertStretch: 'Paid stretch answer.',
          redFlag: 'Paid red flag answer.',
        },
      },
      radio: [{
        key: 'R',
        title: 'Requirements',
        blocks: [
          { type: 'text', text: 'Paid reference answer.' },
          {
            type: 'image',
            src: 'questions/system-design/ai-ux-considerations/proposal.svg',
            alt: 'Proposal flow',
          },
        ],
      }],
    });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(component.locked()).toBeTrue();
    expect(host.querySelector('.sd-section')).toBeNull();
    expect(host.querySelector('.sd-figure')).toBeNull();
    expect(host.querySelector('[data-testid="sd-locked-prompt-preview"]')).not.toBeNull();
    expect(host.textContent || '').toContain('Design a public proposal review prompt.');
    expect(host.textContent || '').toContain('Cancel is not rollback.');
    expect(host.textContent || '').not.toContain('Paid must-cover answer one.');
    expect(host.textContent || '').not.toContain('Practice this exact case');
    expect(host.textContent || '').not.toContain('Start reference answer');
    expect(host.textContent).not.toContain('Paid reference answer.');
  });

  it('shows the exact-case CTA only when practice metadata enables guided mock', () => {
    const fixture = TestBed.createComponent(SystemDesignDetailComponent);
    const component = fixture.componentInstance;
    component.q.set({
      id: 'notification-toast-system',
      title: 'Design a Toast Notification System',
      description: 'Design global toast behavior.',
      tags: ['toast'],
      access: 'free',
      contentSchemaVersion: 2,
      practice: {
        targetLevel: 'junior',
        timeboxMinutes: 10,
        candidatePrompt: 'Design a global toast system with explicit lifecycle behavior.',
        constraints: ['Limit visible toasts.', 'Keep announcements accessible.'],
        expectedDecisions: ['Queue ownership', 'Timer lifecycle', 'Announcement policy'],
        prerequisites: ['DOM events', 'Accessible status messages'],
        coreSkills: ['State machines', 'Accessibility'],
        guidedMock: true,
      },
      radio: [{ key: 'R', title: 'Requirements', blocks: [] }],
    });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const guided = Array.from(host.querySelectorAll('a')).find((link) =>
      link.textContent?.includes('Practice this exact case')
    ) as HTMLAnchorElement | undefined;
    expect(guided).toBeDefined();
    expect(guided?.getAttribute('href')).toContain('sourceQuestionId=notification-toast-system');

    component.q.update((question) => question ? {
      ...question,
      practice: { ...question.practice!, guidedMock: false },
    } : question);
    fixture.detectChanges();
    expect(host.textContent).not.toContain('Practice this exact case');
  });
});
