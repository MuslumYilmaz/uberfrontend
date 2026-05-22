import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
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
      title: 'Notification Toast System',
      description: 'Design a global toast API with stacking, timers, and accessible announcements.',
      tags: ['toast', 'notifications', 'global-state', 'timers'],
      type: 'system-design',
      access: 'free',
      difficulty: 'intermediate',
      companies: ['google'],
    },
    {
      id: 'ai-chat-textarea-design',
      title: 'AI Chat Textarea Design',
      description: 'Design an AI chat composer with streaming responses, cancellation, and resilient UX.',
      tags: ['ai', 'state-management', 'real-time', 'streams', 'ux'],
      type: 'system-design',
      access: 'premium',
      difficulty: 'hard',
      companies: ['openai'],
    },
  ];

  async function createComponent(items = resolvedItems) {
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
            snapshot: { data: routeData },
            parent: { snapshot: { data: {} } },
          },
        },
        { provide: QuestionService, useValue: questionService },
        { provide: AuthService, useValue: { user: signal(null) } },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SystemDesignListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    return { fixture, questionService, seo };
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
    expect(text(fixture)).toContain('Notification Toast System');
    expect(text(fixture)).toContain('AI Chat Textarea Design');
    expect(fixture.nativeElement.querySelector('[data-testid="system-design-list-loading"]')).toBeNull();
  });

  it('shows format category, difficulty, access, and answer focus chips', async () => {
    const { fixture } = await createComponent();
    const host = fixture.nativeElement as HTMLElement;
    const premiumCard = host.querySelector('[data-testid="system-design-prompt-card-ai-chat-textarea-design"]') as HTMLElement | null;

    expect(premiumCard).not.toBeNull();
    expect(premiumCard?.textContent || '').toContain('AI product workflows');
    expect(premiumCard?.textContent || '').toContain('hard');
    expect(premiumCard?.textContent || '').toContain('Premium');
    expect(premiumCard?.textContent || '').toContain('State');
    expect(premiumCard?.textContent || '').toContain('Realtime');
    expect(premiumCard?.textContent || '').toContain('UX');
  });

  it('keeps search and tag filtering client-side after hydration', async () => {
    const { fixture } = await createComponent();
    const component = fixture.componentInstance;

    component.search$.next('toast');
    fixture.detectChanges();

    expect(bankText(fixture)).toContain('Notification Toast System');
    expect(bankText(fixture)).not.toContain('Infinite Scroll List System Design');
    expect(bankText(fixture)).not.toContain('AI Chat Textarea Design');

    component.search$.next('');
    component.tags$.next(['real-time']);
    fixture.detectChanges();

    expect(bankText(fixture)).toContain('AI Chat Textarea Design');
    expect(bankText(fixture)).not.toContain('Notification Toast System');
    expect(bankText(fixture)).not.toContain('Infinite Scroll List System Design');
  });

  it('shows premium value copy while locked prompts still link to detail previews', async () => {
    const { fixture } = await createComponent();
    const host = fixture.nativeElement as HTMLElement;
    const premiumCard = host.querySelector('[data-testid="system-design-prompt-card-ai-chat-textarea-design"]') as HTMLElement | null;
    const detailLink = host.querySelector('[data-testid="system-design-card-link-ai-chat-textarea-design"]') as HTMLAnchorElement | null;

    expect(text(fixture)).toContain('Locked prompts still show the interview shape before upgrade');
    expect(text(fixture)).toContain('Full RADIO breakdowns for premium prompts');
    expect(premiumCard?.classList.contains('is-locked')).toBeTrue();
    expect(premiumCard?.textContent || '').toContain('View prompt preview');
    expect(detailLink).not.toBeNull();
    expect(detailLink?.textContent || '').toContain('AI Chat Textarea Design');
  });

  it('renders keyword strategy sections and priority internal links', async () => {
    const { fixture } = await createComponent();
    const host = fixture.nativeElement as HTMLElement;
    const pageText = text(fixture);

    expect(pageText).toContain('Frontend system design interview preparation');
    expect(pageText).toContain('Most asked frontend system design questions');
    expect(pageText).toContain('Frontend system design interview rubric');
    expect(pageText).toContain('Common mistakes');
    expect(pageText).toContain('Frontend system design interview questions FAQ');
    expect(pageText).toContain('design infinite scroll frontend system design');
    expect(pageText).toContain('design notification system frontend');
    expect(pageText).toContain('staff frontend engineer system design interview');

    const mostAskedSection = host.querySelector('[data-testid="system-design-most-asked-section"]');
    expect(mostAskedSection?.querySelectorAll('a').length).toBe(8);
    expect(mostAskedSection?.textContent || '').toContain('Component-driven Design System Architecture');
  });

  it('publishes ItemList and FAQ schema for the system design hub', async () => {
    const { seo } = await createComponent();

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const schema = Array.isArray(payload.jsonLd) ? payload.jsonLd : [payload.jsonLd];
    const itemList = schema.find((entry: any) => entry?.['@type'] === 'ItemList');
    const faq = schema.find((entry: any) => entry?.['@type'] === 'FAQPage');

    expect(itemList).toBeTruthy();
    expect(itemList?.itemListElement?.[0]?.name).toBe('Infinite Scroll List System Design');
    expect(faq).toBeTruthy();
    expect(faq?.mainEntity?.length).toBe(5);
    expect(faq?.mainEntity?.[0]?.name).toBe('What is a frontend system design interview?');
  });
});
