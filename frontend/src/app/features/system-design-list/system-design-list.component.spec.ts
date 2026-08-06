import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of } from 'rxjs';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthService } from '../../core/services/auth.service';
import { QuestionService } from '../../core/services/question.service';
import { SeoService } from '../../core/services/seo.service';
import { SystemDesignListComponent } from './system-design-list.component';

describe('SystemDesignListComponent', () => {
  const resolvedItems = [
    {
      id: 'infinite-scroll-list',
      title: 'Infinite Scroll List System Design',
      description: 'Design a paginated list with virtualized rendering and resilient loading states.',
      tags: ['infinite-scroll', 'virtualization', 'performance', 'ux'],
      type: 'system-design',
      access: 'free',
      difficulty: 'intermediate',
      companies: ['google'],
    },
    {
      id: 'notification-toast-system',
      title: 'Design a Toast Notification System',
      description: 'Design a global toast API with stacking, timers, and accessible announcements.',
      tags: ['toast', 'notifications', 'global-state', 'timers'],
      type: 'system-design',
      access: 'free',
      difficulty: 'intermediate',
      companies: ['google'],
      discovery: {
        teaser: 'A timer race must remove one toast once while announcements stay quiet after rerenders.',
        guideLabel: 'Trace toast cleanup',
      },
      contentSchemaVersion: 2,
      practice: {
        targetLevel: 'junior',
        timeboxMinutes: 10,
        candidatePrompt: 'Design a toast system that bounds visible messages and cleans up every timer.',
        constraints: ['At most three visible toasts.', 'Announcements must not repeat.'],
        expectedDecisions: ['Command boundary', 'Lifecycle ownership', 'Announcement policy'],
        prerequisites: ['Component state', 'Accessible status messages'],
        coreSkills: ['Global state', 'Timer lifecycle', 'Accessibility'],
        guidedMock: true,
      },
    },
    {
      id: 'ai-chat-textarea-design',
      title: 'AI Chat Textarea Design',
      description: 'Design an AI chat composer with streaming responses, cancellation, and resilient UX.',
      tags: ['ai', 'state-management', 'real-time', 'streams', 'ux'],
      type: 'system-design',
      access: 'free',
      difficulty: 'intermediate',
      companies: ['openai'],
      discovery: {
        teaser: 'An old stream event must never replace the active reply while IME input remains intact.',
        guideLabel: 'Trace stream identity',
      },
      contentSchemaVersion: 2,
      practice: {
        targetLevel: 'mid',
        timeboxMinutes: 15,
        candidatePrompt: 'Design an AI chat composer with safe sends and stale stream protection.',
        constraints: ['IME composition must remain safe.', 'Only one logical send can commit.'],
        expectedDecisions: ['Send command', 'Stream identity', 'Retry behavior'],
        prerequisites: ['Async state', 'Input events'],
        coreSkills: ['IME safety', 'Streaming state', 'Race handling', 'Recovery'],
        guidedMock: true,
      },
    },
    {
      id: 'image-upload-preview',
      title: 'Image Upload & Preview Component',
      description: 'Design image selection, preview, upload progress, retry, and accessible errors.',
      tags: ['upload', 'forms', 'validation', 'ux'],
      type: 'system-design',
      access: 'premium',
      difficulty: 'intermediate',
      companies: [],
    },
  ];

  async function createComponent(
    items: unknown[] = resolvedItems,
    queryParams: Record<string, string | string[]> = {},
  ) {
    const questionService = jasmine.createSpyObj<QuestionService>('QuestionService', ['loadSystemDesign']);
    questionService.loadSystemDesign.and.returnValue(of([]));

    const seo = jasmine.createSpyObj<SeoService>('SeoService', ['updateTags', 'buildCanonicalUrl']);
    seo.buildCanonicalUrl.and.callFake((value: string) => {
      const path = String(value || '').startsWith('/') ? value : `/${value}`;
      return `https://frontendatlas.com${path}`;
    });

    const routeData = {
      seo: {
        title: 'Frontend System Design Interview Questions',
        description: 'Practice frontend system design scenarios focused on UI architecture.',
        robots: 'index,follow',
      },
      systemDesignList: {
        source: 'system-design',
        items,
      },
    };
    const queryParamMap$ = new BehaviorSubject(convertToParamMap(queryParams));
    const analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);

    await TestBed.configureTestingModule({
      imports: [
        SystemDesignListComponent,
        RouterTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: of(routeData),
            queryParamMap: queryParamMap$.asObservable(),
            snapshot: {
              data: routeData,
              queryParamMap: queryParamMap$.value,
            },
            parent: { snapshot: { data: {} } },
          },
        },
        { provide: QuestionService, useValue: questionService },
        { provide: AuthService, useValue: { user: signal(null) } },
        { provide: SeoService, useValue: seo },
        { provide: AnalyticsService, useValue: analytics },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SystemDesignListComponent);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    return { fixture, questionService, seo, analytics, queryParamMap$, router };
  }

  function text(fixture: ComponentFixture<SystemDesignListComponent>): string {
    return fixture.nativeElement.textContent || '';
  }

  function bankText(fixture: ComponentFixture<SystemDesignListComponent>): string {
    const bank = fixture.nativeElement.querySelector('[data-testid="system-design-bank"]') as HTMLElement | null;
    return bank?.textContent || '';
  }

  it('renders resolved system design items without waiting for a client fetch', async () => {
    const { fixture, questionService } = await createComponent();

    expect(questionService.loadSystemDesign).not.toHaveBeenCalled();
    expect(text(fixture)).toContain('Infinite Scroll List System Design');
    expect(text(fixture)).toContain('Design a Toast Notification System');
    expect(text(fixture)).toContain('AI Chat Textarea Design');
    expect(fixture.nativeElement.querySelector('[data-testid="system-design-list-loading"]')).toBeNull();
  });

  it('shows level, first-pass time, access, format, and at most three core skills', async () => {
    const { fixture } = await createComponent();
    const host = fixture.nativeElement as HTMLElement;
    const premiumCard = host.querySelector('[data-testid="system-design-prompt-card-ai-chat-textarea-design"]') as HTMLElement | null;

    expect(premiumCard).not.toBeNull();
    expect(premiumCard?.textContent || '').toContain('AI product workflows');
    expect(premiumCard?.textContent || '').toContain('Mid');
    expect(premiumCard?.textContent || '').toContain('15 min first pass');
    expect(premiumCard?.textContent || '').toContain('Free');
    expect(premiumCard?.textContent || '').toContain('IME safety');
    expect(premiumCard?.textContent || '').toContain('Streaming state');
    expect(premiumCard?.textContent || '').toContain('Race handling');
    expect(premiumCard?.textContent || '').not.toContain('Recovery');
    expect(premiumCard?.textContent || '').not.toContain('#real-time');
  });

  it('keeps search and tag filtering client-side after hydration', async () => {
    const { fixture } = await createComponent();
    const component = fixture.componentInstance;

    component.onSearchChanged('toast');
    await new Promise((resolve) => setTimeout(resolve, 275));
    fixture.detectChanges();

    expect(bankText(fixture)).toContain('Design a Toast Notification System');
    expect(bankText(fixture)).not.toContain('Infinite Scroll List System Design');
    expect(bankText(fixture)).not.toContain('AI Chat Textarea Design');

    component.onSearchChanged('');
    await new Promise((resolve) => setTimeout(resolve, 275));
    component.onTagsChanged(['real-time']);
    fixture.detectChanges();

    expect(bankText(fixture)).toContain('AI Chat Textarea Design');
    expect(bankText(fixture)).not.toContain('Design a Toast Notification System');
    expect(bankText(fixture)).not.toContain('Infinite Scroll List System Design');
  });

  it('uses discovery copy, searches both teaser and original description, and names the guide link with the question', async () => {
    const { fixture } = await createComponent();
    const component = fixture.componentInstance;
    const host = fixture.nativeElement as HTMLElement;
    const toastCard = host.querySelector('[data-testid="system-design-prompt-card-notification-toast-system"]') as HTMLElement;

    expect(toastCard.textContent || '').toContain('A timer race must remove one toast once');
    expect(toastCard.textContent || '').not.toContain('Design a global toast API with stacking');
    const guide = Array.from(toastCard.querySelectorAll('a')).find((link) =>
      link.textContent?.includes('Trace toast cleanup')) as HTMLAnchorElement | undefined;
    expect(guide?.getAttribute('aria-label')).toContain('Design a Toast Notification System');

    component.onSearchChanged('accessible announcements');
    await new Promise((resolve) => setTimeout(resolve, 275));
    fixture.detectChanges();
    expect(bankText(fixture)).toContain('Design a Toast Notification System');
  });

  it('shows premium value copy while locked prompts still link to detail previews', async () => {
    const { fixture } = await createComponent();
    const host = fixture.nativeElement as HTMLElement;
    const premiumCard = host.querySelector('[data-testid="system-design-prompt-card-image-upload-preview"]') as HTMLElement | null;
    const detailLink = host.querySelector('[data-testid="system-design-card-link-image-upload-preview"]') as HTMLAnchorElement | null;

    expect(text(fixture)).toContain('Locked prompts still show the interview shape before upgrade');
    expect(text(fixture)).toContain('Full RADIO breakdowns for premium prompts');
    expect(premiumCard?.classList.contains('is-locked')).toBeTrue();
    expect(premiumCard?.textContent || '').toContain('View prompt preview');
    expect(detailLink).not.toBeNull();
    expect(detailLink?.textContent || '').toContain('Image Upload & Preview Component');
  });

  it('uses keyword-focused performance guide anchors for cluster prompts', async () => {
    const { fixture } = await createComponent([
      {
        id: 'realtime-search-debounce-cache',
        title: 'Real-time Search with Debounce & Caching',
        description: 'Design typeahead with debounce, caching, and stale response handling.',
        tags: ['search', 'debounce', 'caching'],
        type: 'system-design',
        access: 'free',
        difficulty: 'intermediate',
        companies: [],
      },
      {
        id: 'infinite-scroll-list',
        title: 'Infinite Scroll List System Design',
        description: 'Design a paginated list with virtualized rendering.',
        tags: ['infinite-scroll', 'virtualization', 'performance'],
        type: 'system-design',
        access: 'free',
        difficulty: 'intermediate',
        companies: [],
      },
      {
        id: 'notification-toast-system',
        title: 'Design a Toast Notification System',
        description: 'Design a global toast API with stacking, timers, and accessible announcements.',
        tags: ['toast', 'notifications', 'global-state', 'timers'],
        type: 'system-design',
        access: 'free',
        difficulty: 'intermediate',
        companies: [],
      },
      {
        id: 'dashboard-widgets-draggable-resizable',
        title: 'Dashboard with Draggable & Resizable Widgets',
        description: 'Design a widget dashboard that keeps drag and resize smooth.',
        tags: ['dashboard', 'drag-drop', 'performance'],
        type: 'system-design',
        access: 'free',
        difficulty: 'hard',
        companies: [],
      },
      {
        id: 'live-chart-high-frequency-updates',
        title: 'Live Chart Rendering',
        description: 'Design a chart that renders high-frequency streaming updates.',
        tags: ['charts', 'real-time', 'performance'],
        type: 'system-design',
        access: 'free',
        difficulty: 'hard',
        companies: [],
      },
      {
        id: 'multi-step-form-autosave',
        title: 'Multi-step Form with Autosave',
        description: 'Design validation and autosave without input latency.',
        tags: ['forms', 'autosave', 'validation'],
        type: 'system-design',
        access: 'free',
        difficulty: 'intermediate',
        companies: [],
      },
    ]);

    const links = Array.from(
      fixture.nativeElement.querySelectorAll('.sd-prompt-card__guide'),
    ) as HTMLAnchorElement[];
    const labels = links.map((link) => link.textContent?.replace(/\s+/g, ' ').trim());

    expect(labels).toContain('typeahead performance system design');
    expect(labels).toContain('infinite scroll virtualization performance');
    expect(labels).toContain('toast timer cleanup tradeoffs');
    expect(labels).toContain('dashboard performance system design');
    expect(labels).toContain('live chart performance system design');
    expect(labels).toContain('Performance and interaction latency');
    expect(links.every((link) => link.getAttribute('href') === '/guides/system-design-blueprint/performance')).toBeTrue();
  });

  it('renders learner-facing focus sections and priority practice links', async () => {
    const { fixture } = await createComponent();
    const host = fixture.nativeElement as HTMLElement;
    const pageText = text(fixture);

    expect(pageText).toContain('Build from a junior UI boundary to a senior architecture case');
    expect(pageText).toContain('Connect system design to the rest of frontend interview prep');
    expect(pageText).toContain('Core frontend system design patterns');
    expect(pageText).toContain('Frontend system design interview rubric');
    expect(pageText).toContain('Common mistakes');
    expect(pageText).toContain('Frontend system design interview questions FAQ');
    expect(pageText).toContain('Infinite lists');
    expect(pageText).toContain('Notification systems');
    expect(pageText).toContain('Streaming chat');

    const mostAskedSection = host.querySelector('[data-testid="system-design-most-asked-section"]');
    expect(mostAskedSection?.querySelectorAll('a').length).toBe(3);
    expect(mostAskedSection?.textContent || '').toContain('AI Chat Textarea Design');
    expect(
      mostAskedSection?.querySelector('a[href="/system-design/ai-chat-textarea-design"]')
        ?.getAttribute('data-access'),
    ).toBe('free');
    expect(host.querySelector('[data-testid="system-design-related-focus-section"] a[href="/machine-coding"]')).toBeTruthy();
    expect(host.querySelector('[data-testid="system-design-related-focus-section"] a[href="/tracks/foundations-30d/preview"]')).toBeTruthy();
  });

  it('places the start path above the filters and question bank', async () => {
    const { fixture } = await createComponent();
    const host = fixture.nativeElement as HTMLElement;
    const start = host.querySelector('[data-testid="system-design-start-section"]');
    const filter = host.querySelector('.sd-filter-bar');
    const bank = host.querySelector('[data-testid="system-design-bank"]');
    const related = host.querySelector('[data-testid="system-design-related-focus-section"]');

    expect(start?.nextElementSibling).toBe(filter);
    expect(filter?.nextElementSibling).toBe(bank);
    expect(bank?.nextElementSibling).toBe(related);
    expect(text(fixture)).toContain('free full solutions');
    expect(text(fixture)).not.toContain('Most asked frontend system design questions');
  });

  it('orders the start path Toast, RADIO, AI Chat, then the senior dashboard', async () => {
    const { fixture } = await createComponent();
    const startSection = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="system-design-start-section"]',
    );
    const hrefs = Array.from(startSection?.querySelectorAll('a') ?? [])
      .map((link) => link.getAttribute('href'));

    expect(hrefs).toEqual([
      '/system-design/notification-toast-system',
      '/guides/system-design-blueprint/radio-framework',
      '/system-design/ai-chat-textarea-design',
      '/system-design/dashboard-widgets-draggable-resizable',
      '#system-design-bank',
    ]);
  });

  it('uses legacy difficulty fallbacks and stable beginner-first source ordering', async () => {
    const { fixture } = await createComponent([
      {
        id: 'senior-first',
        title: 'Senior first in source',
        description: 'Senior prompt',
        tags: ['architecture'],
        type: 'system-design',
        access: 'free',
        difficulty: 'hard',
      },
      {
        id: 'mid-first',
        title: 'Mid first in source',
        description: 'Mid prompt',
        tags: ['state'],
        type: 'system-design',
        access: 'free',
        difficulty: 'intermediate',
      },
      {
        id: 'junior',
        title: 'Junior prompt',
        description: 'Junior prompt description',
        tags: ['components'],
        type: 'system-design',
        access: 'free',
        difficulty: 'easy',
      },
      {
        id: 'mid-second',
        title: 'Mid second in source',
        description: 'Second mid prompt',
        tags: ['events'],
        type: 'system-design',
        access: 'free',
        difficulty: 'intermediate',
      },
    ]);

    const cards = Array.from(
      fixture.nativeElement.querySelectorAll('.sd-prompt-card'),
    ) as HTMLElement[];
    expect(cards.map((card) => card.getAttribute('data-testid'))).toEqual([
      'system-design-prompt-card-junior',
      'system-design-prompt-card-mid-first',
      'system-design-prompt-card-mid-second',
      'system-design-prompt-card-senior-first',
    ]);
    expect(cards[0]?.textContent || '').toContain('Junior');
    expect(cards[0]?.textContent || '').toContain('10 min first pass');
    expect(cards[1]?.textContent || '').toContain('Mid');
    expect(cards[1]?.textContent || '').toContain('15 min first pass');
    expect(cards[3]?.textContent || '').toContain('Senior');
    expect(cards[3]?.textContent || '').toContain('20 min first pass');
  });

  it('restores valid URL dimensions, ignores unknown values, and treats selected tags as OR', async () => {
    const { fixture } = await createComponent(resolvedItems, {
      level: 'mid',
      access: 'free',
      format: 'ai-product',
      tag: ['real-time', 'unknown-tag'],
    });
    const component = fixture.componentInstance;

    expect(component.selectedLevel).toBe('mid');
    expect(component.selectedAccess).toBe('free');
    expect(component.selectedFormat).toBe('ai-product');
    expect(component.selectedTags).toEqual(['real-time']);
    expect(bankText(fixture)).toContain('AI Chat Textarea Design');
    expect(bankText(fixture)).not.toContain('Design a Toast Notification System');

    component.onLevelChanged(null);
    component.onFormatChanged(null);
    component.onTagsChanged(['real-time', 'virtualization']);
    fixture.detectChanges();

    expect(bankText(fixture)).toContain('AI Chat Textarea Design');
    expect(bankText(fixture)).toContain('Infinite Scroll List System Design');
    expect(bankText(fixture)).not.toContain('Design a Toast Notification System');
  });

  it('ignores unknown level, access, format, and tag query values', async () => {
    const { fixture } = await createComponent(resolvedItems, {
      level: 'staff',
      access: 'enterprise',
      format: 'backend',
      tag: ['not-in-bank'],
    });
    const component = fixture.componentInstance;

    expect(component.selectedLevel).toBeNull();
    expect(component.selectedAccess).toBeNull();
    expect(component.selectedFormat).toBeNull();
    expect(component.selectedTags).toEqual([]);
    expect(fixture.nativeElement.querySelectorAll('.sd-prompt-card').length).toBe(4);
  });

  it('debounces search URL updates and emits filter analytics without the search text', async () => {
    const { fixture, router, analytics } = await createComponent();
    const component = fixture.componentInstance;

    component.onSearchChanged('toast private text');
    expect(router.navigate).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 275));
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith([], jasmine.objectContaining({
      queryParams: jasmine.objectContaining({ q: 'toast private text' }),
      queryParamsHandling: 'merge',
      replaceUrl: true,
    }));
    expect(analytics.track).toHaveBeenCalledWith(
      'system_design_filter_changed',
      jasmine.objectContaining({ has_search: true, tag_count: 0 }),
    );
    const analyticsPayload = analytics.track.calls.mostRecent().args[1];
    expect(JSON.stringify(analyticsPayload)).not.toContain('toast private text');
  });

  it('cancels a pending debounced search when filters are cleared', async () => {
    const { fixture, router } = await createComponent();
    const component = fixture.componentInstance;

    component.onSearchChanged('toast');
    expect(component.hasActiveFilters()).toBeTrue();
    component.clearFilters();
    await new Promise((resolve) => setTimeout(resolve, 275));
    fixture.detectChanges();

    expect(component.searchTerm).toBe('');
    expect(component.hasActiveFilters()).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelectorAll('.sd-prompt-card').length).toBe(4);
  });

  it('preserves a pending search when another filter changes before the debounce', async () => {
    const { fixture, router } = await createComponent();
    const component = fixture.componentInstance;

    component.onSearchChanged('toast');
    component.onLevelChanged('junior');
    await new Promise((resolve) => setTimeout(resolve, 275));
    fixture.detectChanges();

    expect(component.searchTerm).toBe('toast');
    expect(component.selectedLevel).toBe('junior');
    expect(router.navigate).toHaveBeenCalledWith([], jasmine.objectContaining({
      queryParams: jasmine.objectContaining({ q: 'toast', level: 'junior' }),
      replaceUrl: true,
    }));
    expect(fixture.nativeElement.querySelectorAll('.sd-prompt-card').length).toBe(1);
    expect(bankText(fixture)).toContain('Design a Toast Notification System');
  });

  it('reacts to back-forward query restoration without emitting a new analytics event', async () => {
    const { fixture, analytics, queryParamMap$ } = await createComponent();

    queryParamMap$.next(convertToParamMap({ level: 'junior' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedLevel).toBe('junior');
    expect(bankText(fixture)).toContain('Design a Toast Notification System');
    expect(bankText(fixture)).not.toContain('AI Chat Textarea Design');
    expect(analytics.track).not.toHaveBeenCalled();
  });

  it('publishes ItemList and FAQ schema for the system design hub', async () => {
    const { seo } = await createComponent(resolvedItems, { level: 'junior' });

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const schema = Array.isArray(payload.jsonLd) ? payload.jsonLd : [payload.jsonLd];
    const itemList = schema.find((entry: any) => entry?.['@type'] === 'ItemList');
    const faq = schema.find((entry: any) => entry?.['@type'] === 'FAQPage');

    expect(itemList).toBeTruthy();
    expect(payload.canonical).toBe('https://frontendatlas.com/system-design');
    expect(itemList?.itemListElement?.[0]?.name).toBe('Design a Toast Notification System');
    expect(itemList?.itemListElement?.length).toBe(4);
    expect(faq).toBeTruthy();
    expect(faq?.mainEntity?.length).toBe(5);
    expect(faq?.mainEntity?.[0]?.name).toBe('What is a frontend system design interview?');
  });

  it('keeps the base canonical and FAQ schema when the bank resolves empty', async () => {
    const { seo } = await createComponent([], { q: 'toast' });

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const schema = Array.isArray(payload.jsonLd) ? payload.jsonLd : [payload.jsonLd];
    expect(payload.canonical).toBe('https://frontendatlas.com/system-design');
    expect(schema.some((entry: any) => entry?.['@type'] === 'FAQPage')).toBeTrue();
    expect(schema.some((entry: any) => entry?.['@type'] === 'ItemList')).toBeFalse();
  });
});
