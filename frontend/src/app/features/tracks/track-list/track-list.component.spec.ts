import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TrackListComponent } from './track-list.component';
import { SeoService } from '../../../core/services/seo.service';
import { SHOWCASE_STATS } from '../../../generated/content-metadata';

describe('TrackListComponent', () => {
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
      imports: [TrackListComponent, RouterTestingModule],
      providers: [{ provide: SeoService, useValue: seo }],
    }).compileComponents();
  });

  it('renders crawlable focus links near the hero', async () => {
    const fixture = TestBed.createComponent(TrackListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const native = fixture.nativeElement as HTMLElement;
    const jsHub = native.querySelector('a[href="/javascript/interview-questions"]');
    const reactHub = native.querySelector('a[href="/react/interview-questions"]');
    const angularHub = native.querySelector('a[href="/angular/interview-questions"]');
    const vueHub = native.querySelector('a[href="/vue/interview-questions"]');
    const htmlHub = native.querySelector('a[href="/html/interview-questions"]');
    const cssHub = native.querySelector('a[href="/css/interview-questions"]');
    const htmlCssHub = native.querySelector('a[href="/html-css/interview-questions"]');
    const systemHub = native.querySelector('a[href="/system-design"]');
    const machineHub = native.querySelector('a[href="/machine-coding"]');
    const companyHub = native.querySelector('a[href="/companies"]');
    const focusHub = native.querySelector('a[href="/focus-areas"]');

    expect(jsHub).toBeTruthy();
    expect(reactHub).toBeTruthy();
    expect(angularHub).toBeTruthy();
    expect(vueHub).toBeTruthy();
    expect(htmlHub).toBeTruthy();
    expect(cssHub).toBeTruthy();
    expect(htmlCssHub).toBeTruthy();
    expect(systemHub).toBeTruthy();
    expect(machineHub).toBeTruthy();
    expect(companyHub).toBeTruthy();
    expect(focusHub).toBeTruthy();
  });

  it('keeps Question Library in platform sequence ordering', () => {
    const fixture = TestBed.createComponent(TrackListComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const hubStep = component.platformSteps.find((entry) => entry.route[0] === '/coding');

    expect(hubStep).toBeTruthy();
    expect(hubStep?.title).toContain('Question Library');
  });

  it('renders the hero decision cards in 7-day, 30-day, and mastery order', async () => {
    const fixture = TestBed.createComponent(TrackListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const native = fixture.nativeElement as HTMLElement;
    const cards = Array.from(native.querySelectorAll<HTMLElement>('[data-testid="tracks-hero-plan-card"]'));
    const text = native.textContent || '';

    expect(cards.length).toBe(3);
    expect(cards.map((card) => card.getAttribute('data-plan-slug'))).toEqual([
      'crash-7d',
      'foundations-30d',
      'javascript-prep-path',
    ]);
    expect(cards[0].textContent).toContain('0/30');
    expect(cards[0].textContent).toContain('Day 1');
    expect(cards[0].textContent).toContain('2');
    expect(cards[0].textContent).toContain('45 min');
    expect(cards[1].textContent).toContain('0/113');
    expect(cards[1].textContent).toContain('5');
    expect(cards[1].textContent).toContain('30-45 min');
    expect(cards[2].textContent).toContain('0/46');
    expect(cards[2].textContent).toContain('6');
    expect(text).toContain('3 guided plans to start today');
    expect(text).not.toContain('FAANG Track');
    expect(text).not.toContain('Senior Engineer Track');
  });

  it('renders trust metrics and the 30-day Day 1-3 preview', async () => {
    const fixture = TestBed.createComponent(TrackListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const native = fixture.nativeElement as HTMLElement;
    const text = native.textContent || '';
    const foundations = native.querySelector<HTMLElement>('[data-plan-slug="foundations-30d"]');

    expect(text).toContain(String(SHOWCASE_STATS.totalQuestions));
    expect(text).toContain('Practice questions');
    expect(text).toContain('11');
    expect(text).toContain('Company prep sources');
    expect(text).toContain('143');
    expect(text).toContain('Guided-plan questions');
    expect(text).toContain('7');
    expect(text).toContain('System-design prompts');
    expect(text).toContain('May 2026');
    expect(foundations?.textContent).toContain('Day 1');
    expect(foundations?.textContent).toContain('Diagnose JavaScript and target stack');
    expect(foundations?.textContent).toContain('Day 2');
    expect(foundations?.textContent).toContain('UI state and async flow');
    expect(foundations?.textContent).toContain('Day 3');
    expect(foundations?.textContent).toContain('Framework and system-design setup');
  });

  it('renders study-plan roadmap, mistakes, FAQ, and focus links', async () => {
    const fixture = TestBed.createComponent(TrackListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const native = fixture.nativeElement as HTMLElement;
    const text = native.textContent || '';

    expect(text).toContain('Frontend Interview Study Plan and 30-Day Roadmap');
    expect(text).toContain('7-day frontend interview prep');
    expect(text).toContain('30-day frontend interview preparation');
    expect(text).toContain('What to practice each week');
    expect(text).toContain('Common study-plan mistakes');
    expect(text).toContain('What is a frontend interview study plan?');
    expect(text).toContain('CSS animation performance');
    expect(native.querySelector('a[href="/javascript/interview-questions"]')).toBeTruthy();
    expect(native.querySelector('a[href="/react/interview-questions"]')).toBeTruthy();
    expect(native.querySelector('a[href="/angular/interview-questions"]')).toBeTruthy();
    expect(native.querySelector('a[href="/vue/interview-questions"]')).toBeTruthy();
    expect(native.querySelector('a[href="/html/interview-questions"]')).toBeTruthy();
    expect(native.querySelector('a[href="/css/interview-questions"]')).toBeTruthy();
    expect(native.querySelector('a[href="/html-css/interview-questions"]')).toBeTruthy();
  });

  it('publishes tracks CollectionPage schema with breadcrumb', () => {
    const fixture = TestBed.createComponent(TrackListComponent);
    fixture.detectChanges();

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
    const breadcrumb = graph.find((entry: any) => entry?.['@type'] === 'BreadcrumbList');
    const faq = graph.find((entry: any) => entry?.['@type'] === 'FAQPage');

    expect(payload.title).toBe('Frontend Interview Study Plan and 30-Day Roadmap');
    expect(payload.description).toContain('7 or 30 days');
    expect(collection).toBeTruthy();
    expect(collection?.url).toContain('/tracks');
    expect(collection?.mainEntity?.['@type']).toBe('ItemList');
    expect(collection?.mainEntity?.itemListElement?.[0]?.name).toBe('Crash Track (7 days)');
    expect(collection?.mainEntity?.itemListElement?.[1]?.name).toBe('Foundations Track (30 days)');
    expect(collection?.mainEntity?.itemListElement?.[2]?.name).toBe('JavaScript Mastery Crash Track');
    expect(Array.isArray(collection?.mentions)).toBeTrue();
    expect(collection?.about?.some((entry: any) => entry?.name === 'frontend interview study plan')).toBeTrue();
    expect(collection?.about?.some((entry: any) => entry?.name === 'Frontend interview guided plans')).toBeTrue();
    expect(faq?.mainEntity?.some((entry: any) => entry?.name === 'What is a frontend interview study plan?')).toBeTrue();
    expect(breadcrumb).toBeTruthy();
  });
});
