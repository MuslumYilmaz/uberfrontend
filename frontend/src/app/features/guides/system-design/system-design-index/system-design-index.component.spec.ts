import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { OfflineService } from '../../../../core/services/offline';
import { SeoService } from '../../../../core/services/seo.service';
import { SYSTEM } from '../../../../shared/guides/guide.registry';
import { SystemDesignIndexComponent } from './system-design-index.component';

describe('SystemDesignIndexComponent', () => {
  let fixture: ComponentFixture<SystemDesignIndexComponent>;
  let seo: jasmine.SpyObj<SeoService>;

  beforeEach(async () => {
    seo = jasmine.createSpyObj<SeoService>('SeoService', ['updateTags', 'buildCanonicalUrl']);
    seo.buildCanonicalUrl.and.callFake((value: string) => {
      const raw = String(value || '').trim();
      if (!raw) return 'https://frontendatlas.com/';
      if (/^https?:\/\//i.test(raw)) return raw;
      return raw.startsWith('/')
        ? `https://frontendatlas.com${raw}`
        : `https://frontendatlas.com/${raw}`;
    });

    await TestBed.configureTestingModule({
      imports: [SystemDesignIndexComponent, RouterTestingModule],
      providers: [
        { provide: SeoService, useValue: seo },
        { provide: OfflineService, useValue: { isOnline: () => true } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SystemDesignIndexComponent);
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

  it('renders the system design blueprint as a strategic hub', () => {
    const pageText = text();

    expect(pageText).toContain('Frontend System Design Interview Blueprint');
    expect(pageText).toContain('What frontend system design interviews actually test');
    expect(pageText).toContain('Frontend vs backend system design');
    expect(pageText).toContain('Use RADIO in a 45-minute interview');
    expect(pageText).toContain('Most asked frontend system design prompts');
    expect(pageText).toContain('Recommended study order');
    expect(pageText).toContain('Frontend system design blueprint FAQ');
    expect(pageText).toContain('Browser experience, rendering strategy, client state');
    expect(pageText).toContain('RADIO framework');
    expect(hasLink('/machine-coding')).toBeTrue();
    expect(hasLink('/tracks/foundations-30d/preview')).toBeTrue();
  });

  it('links each RADIO step to the existing deep-dive guide route', () => {
    expect(hasLink('/guides/system-design-blueprint/radio-framework')).toBeTrue();
    expect(hasLink('/guides/system-design-blueprint/radio-requirements')).toBeTrue();
    expect(hasLink('/guides/system-design-blueprint/architecture')).toBeTrue();
    expect(hasLink('/guides/system-design-blueprint/state-data')).toBeTrue();
    expect(hasLink('/guides/system-design-blueprint/ux')).toBeTrue();
    expect(hasLink('/guides/system-design-blueprint/performance')).toBeTrue();
  });

  it('renders featured frontend system design prompts with existing practice links', () => {
    const host = fixture.nativeElement as HTMLElement;
    const pageText = text();
    const promptCards = host.querySelectorAll('.prompt-card');

    expect(promptCards.length).toBe(8);
    expect(pageText).toContain('Infinite Scroll List System Design');
    expect(pageText).toContain('Notification Toast System');
    expect(pageText).toContain('Real-time Search with Debounce & Caching');
    expect(pageText).toContain('AI Chat Text Area');
    expect(pageText).toContain('Component-driven Design System Architecture');
    expect(hasLink('/system-design/infinite-scroll-list')).toBeTrue();
    expect(hasLink('/system-design/notification-toast-system')).toBeTrue();
    expect(hasLink('/system-design/realtime-search-debounce-cache')).toBeTrue();
    expect(hasLink('/system-design/ai-chat-textarea-design')).toBeTrue();
    expect(hasLink('/system-design/component-design-system-architecture')).toBeTrue();
  });

  it('keeps guide chapter cards sourced from the system blueprint registry', () => {
    const host = fixture.nativeElement as HTMLElement;
    const chapterCards = host.querySelectorAll('[data-testid="system-blueprint-chapters"] .chapter-card');

    expect(chapterCards.length).toBe(SYSTEM.length);
    expect(text()).toContain('Front-End System Design: What It Really Tests');
    expect(text()).toContain('Frontend System Design Interview Framework: RADIO Answer Template');
    expect(text()).toContain('One-Page Checklist for Interviews');
    expect(hasLink('/guides/system-design-blueprint/intro')).toBeTrue();
    expect(hasLink('/guides/system-design-blueprint/checklist')).toBeTrue();
  });

  it('publishes CollectionPage, chapter and prompt ItemLists, breadcrumb, and FAQPage schema', () => {
    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
    const breadcrumbs = graph.find((entry: any) => entry?.['@type'] === 'BreadcrumbList');
    const itemLists = graph.filter((entry: any) => entry?.['@type'] === 'ItemList');
    const faq = graph.find((entry: any) => entry?.['@type'] === 'FAQPage');

    expect(payload.title).toBe('Frontend System Design Interview Blueprint');
    expect(payload.description).toContain('RADIO framework');
    expect(payload.canonical).toBe('/guides/system-design-blueprint');
    expect(payload.keywords).toContain('frontend system design interview blueprint');
    expect(payload.keywords).toContain('frontend system design checklist');
    expect(collection).toBeTruthy();
    expect(collection?.about?.some((entry: any) => entry?.name === 'frontend system design examples')).toBeTrue();
    expect(breadcrumbs).toBeTruthy();
    expect(itemLists.length).toBe(2);
    expect(itemLists.some((entry: any) => entry?.name === 'Frontend system design blueprint chapters')).toBeTrue();
    expect(itemLists.some((entry: any) => entry?.name === 'Most asked frontend system design prompts')).toBeTrue();
    expect(faq?.mainEntity?.length).toBe(5);
    expect(faq?.mainEntity?.[0]?.name).toBe('What is a frontend system design interview blueprint?');
  });
});
