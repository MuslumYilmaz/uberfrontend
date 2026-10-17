import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  SITE_FOOTER_GROUPS,
  SITE_FOOTER_LEGAL_LINKS,
  embedsSiteFooter,
  hasPracticeBar,
  shellRendersSiteFooter,
  showsSiteFooter,
} from '../../../core/content/site-footer';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { SiteFooterComponent } from './site-footer.component';

describe('SiteFooterComponent', () => {
  let analytics: jasmine.SpyObj<AnalyticsService>;

  const allLinks = () => [...SITE_FOOTER_GROUPS.flatMap((group) => group.links), ...SITE_FOOTER_LEGAL_LINKS];

  beforeEach(async () => {
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    await TestBed.configureTestingModule({
      imports: [SiteFooterComponent],
      providers: [provideRouter([]), { provide: AnalyticsService, useValue: analytics }],
    }).compileComponents();
  });

  function render(withPracticeBar = false) {
    const fixture = TestBed.createComponent(SiteFooterComponent);
    fixture.componentInstance.withPracticeBar = withPracticeBar;
    fixture.detectChanges();
    return fixture;
  }

  it('renders every configured link as a followable anchor in the initial markup', () => {
    const element = render().nativeElement as HTMLElement;
    const anchors = Array.from(element.querySelectorAll('a')) as HTMLAnchorElement[];
    const expected = allLinks();

    expect(anchors.length).toBe(expected.length);
    for (const link of expected) {
      const anchor = anchors.find((candidate) => candidate.textContent?.trim() === link.label);
      expect(anchor).withContext(link.label).toBeTruthy();
      expect(anchor!.getAttribute('href')).withContext(link.label).toBe(link.route ?? link.href ?? '');
      expect(anchor!.getAttribute('rel') || '').withContext(link.label).not.toMatch(/nofollow|sponsored|ugc/);
    }

    const github = anchors.find((anchor) => anchor.textContent?.trim() === 'GitHub')!;
    expect(github.getAttribute('target')).toBe('_blank');
    expect(github.getAttribute('rel')).toContain('noopener');

    const footer = element.querySelector('footer')!;
    expect(footer.getAttribute('data-testid')).toBe('site-footer');
    expect(footer.hasAttribute('data-nosnippet')).toBeTrue();
    expect(element.querySelectorAll('h1, h2, h3, h4').length).withContext('footer must not add headings to the page outline').toBe(0);
  });

  it('keeps the link set small, clean and off the alias and CSS-hub routes', () => {
    const routes = allLinks().map((link) => link.route).filter((route): route is string => Boolean(route));
    expect(routes.length).toBeLessThanOrEqual(24);
    expect(new Set(routes).size).toBe(routes.length);
    expect(routes).not.toContain('/guides');
    expect(routes).not.toContain('/html-css/interview-questions');
    expect(routes.every((route) => /^\/[a-z0-9/-]*$/.test(route))).withContext('no query strings or fragments').toBeTrue();
    expect(routes).toContain('/pricing');
    expect(routes).toContain('/changelog');
    expect(routes).toContain('/legal');
  });

  it('reserves space for the fixed practice bar only when asked', () => {
    expect((render(false).nativeElement as HTMLElement).querySelector('footer')!.classList.contains('site-footer--with-bar')).toBeFalse();
    expect((render(true).nativeElement as HTMLElement).querySelector('footer')!.classList.contains('site-footer--with-bar')).toBeTrue();
  });

  it('marks the embedded variant used inside a page scroll panel', () => {
    const fixture = TestBed.createComponent(SiteFooterComponent);
    fixture.componentInstance.embedded = true;
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('footer')!.classList.contains('site-footer--embedded')).toBeTrue();
  });

  it('tracks link clicks with the group and destination', () => {
    const element = render().nativeElement as HTMLElement;
    const pricing = Array.from(element.querySelectorAll('a')).find((anchor) => anchor.textContent?.trim() === 'Pricing') as HTMLAnchorElement;
    pricing.addEventListener('click', (event) => event.preventDefault(), { once: true });
    pricing.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(analytics.track).toHaveBeenCalledWith('footer_link_clicked', {
      group: 'frontendatlas',
      label: 'Pricing',
      destination: '/pricing',
    });
  });
});

describe('site footer visibility', () => {
  it('shows the footer on public pages', () => {
    for (const url of [
      '/', '/showcase', '/pricing', '/changelog?src=footer', '/coding', '/coding?kind=trivia', '/interview-questions',
      '/javascript/trivia/js-event-loop', '/system-design', '/system-design/news-feed', '/incidents/leaky-timer',
      '/tradeoffs/context-vs-redux', '/guides/framework-prep/react-prep-path', '/guides/behavioral', '/companies/google',
      '/tracks/foundations-30d/preview', '/focus-areas', '/tools/cv', '/legal/terms', '/404',
    ]) {
      expect(showsSiteFooter(url)).withContext(url).toBeTrue();
    }
  });

  it('hides the footer on workspace and private routes', () => {
    for (const url of [
      '/auth/login', '/auth/signup?src=x', '/dashboard', '/profile', '/admin', '/admin/users', '/billing/success',
      '/onboarding/quick-start', '/verify-email', '/interview', '/interview/session-1', '/interview/session-1/results',
      '/coding/js-throttle', '/javascript/coding/js-throttle', '/react/coding/react-counter?src=pricing_product_proof',
      '/javascript/debug/js-leaky-timer', '/machine-coding/kanban-board',
    ]) {
      expect(showsSiteFooter(url)).withContext(url).toBeFalse();
    }
  });

  it('lets trivia detail embed the footer in its scroll panel instead of the shell', () => {
    for (const url of ['/javascript/trivia/js-event-loop', '/css/trivia/css-specificity#answer', '/react/trivia/react-keys?src=x']) {
      expect(showsSiteFooter(url)).withContext(url).toBeTrue();
      expect(embedsSiteFooter(url)).withContext(url).toBeTrue();
      expect(shellRendersSiteFooter(url)).withContext(url).toBeFalse();
    }
    for (const url of ['/', '/pricing', '/system-design/news-feed', '/guides/behavioral/prep', '/coding?kind=trivia']) {
      expect(embedsSiteFooter(url)).withContext(url).toBeFalse();
      expect(shellRendersSiteFooter(url)).withContext(url).toBeTrue();
    }
    expect(shellRendersSiteFooter('/javascript/coding/js-throttle')).toBeFalse();
    expect(embedsSiteFooter('/javascript/coding/js-throttle')).toBeFalse();
  });

  it('flags the routes that scroll under the fixed practice bar', () => {
    expect(hasPracticeBar('/system-design/news-feed')).toBeTrue();
    expect(hasPracticeBar('/system-design/news-feed?src=x')).toBeTrue();
    expect(hasPracticeBar('/system-design')).toBeFalse();
    expect(hasPracticeBar('/javascript/trivia/js-event-loop')).toBeFalse();
    expect(hasPracticeBar('/coding?kind=trivia')).toBeFalse();
    expect(hasPracticeBar('/guides/behavioral/prep')).toBeFalse();
  });
});
