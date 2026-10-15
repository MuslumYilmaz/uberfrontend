import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { AppSidebarDrawerService } from '../../../core/services/app-sidebar-drawer.service';
import { PREP_MENU_ROUTES, PREP_MENU_SECTIONS } from '../../../core/content/prep-menu';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let authUiState: WritableSignal<'pending' | 'authenticated' | 'signed_out'>;
  let loggedIn: WritableSignal<boolean>;

  async function createComponent(options?: {
    isLoggedIn?: boolean;
    isPro?: boolean;
    role?: 'user' | 'admin';
    authUiState?: 'pending' | 'authenticated' | 'signed_out';
  }): Promise<ComponentFixture<HeaderComponent>> {
    const isLoggedIn = options?.isLoggedIn ?? true;
    const isPro = options?.isPro ?? false;
    const role = options?.role ?? 'user';
    loggedIn = signal(isLoggedIn);
    authUiState = signal(options?.authUiState ?? (isLoggedIn ? 'authenticated' : 'signed_out'));
    const user = signal(
      isLoggedIn
        ? {
          _id: 'user_1',
          username: 'header_user',
          email: 'header@example.com',
          role,
          accessTier: isPro ? 'premium' : 'free',
        }
        : null,
    );
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: AnalyticsService, useValue: analytics },
        {
          provide: AuthService,
          useValue: {
            user,
            isLoggedIn: loggedIn,
            authUiState,
            logout: jasmine.createSpy('logout').and.returnValue(of(void 0)),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    return fixture;
  }

  const prepPanel = (fixture: ComponentFixture<HeaderComponent>) =>
    fixture.nativeElement.querySelector('nav#prepare-mega') as HTMLElement;
  const query = <T extends Element>(fixture: ComponentFixture<HeaderComponent>, testId: string) =>
    fixture.nativeElement.querySelector(`[data-testid="${testId}"]`) as T;

  it('toggles the profile menu open and closed from the avatar button', async () => {
    const fixture = await createComponent({ isLoggedIn: true });
    const button = fixture.nativeElement.querySelector('[data-testid="header-profile-button"]') as HTMLButtonElement;

    button.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="header-profile-menu"]')).toBeTruthy();

    button.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="header-profile-menu"]')).toBeFalsy();
  });

  it('uses the shared sidebar drawer state for the mobile hamburger', async () => {
    const fixture = await createComponent({ isLoggedIn: true });
    const drawer = TestBed.inject(AppSidebarDrawerService);
    const button = fixture.nativeElement.querySelector('[data-testid="header-mobile-menu-button"]') as HTMLButtonElement;

    expect(drawer.isOpen()).toBeFalse();

    button.click();
    fixture.detectChanges();
    expect(drawer.isOpen()).toBeTrue();

    button.click();
    fixture.detectChanges();
    expect(drawer.isOpen()).toBeFalse();
  });

  it('keeps a crawlable public question hub through pending, guest, and authenticated states', async () => {
    const fixture = await createComponent({ isLoggedIn: false, authUiState: 'pending' });

    for (const state of ['pending', 'signed_out', 'authenticated'] as const) {
      authUiState.set(state);
      fixture.detectChanges();
      const link = fixture.nativeElement.querySelector('[data-testid="header-interview-hub"]') as HTMLAnchorElement;
      expect(link).withContext(state).toBeTruthy();
      expect(link.getAttribute('href')).toBe('/interview-questions');
      expect(link.textContent).toContain('Interview Questions');
    }
    expect(fixture.nativeElement.querySelector('[data-testid="header-mobile-pricing-button"]')).toBeFalsy();
  });

  it('marks the direct question hub link current only on the hub and preserves primary click analytics', async () => {
    const fixture = await createComponent({ isLoggedIn: false });
    const router = TestBed.inject(Router);
    const link = fixture.nativeElement.querySelector('[data-testid="header-interview-hub"]') as HTMLAnchorElement;

    link.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/interview-questions');
    expect(link.getAttribute('aria-current')).toBe('page');
    expect(link.classList.contains('fah-navlink--active')).toBeTrue();
    expect(analytics.track).toHaveBeenCalledWith(
      'header_top_nav_clicked',
      jasmine.objectContaining({ surface: 'app', area: 'primary', destination: '/interview-questions', auth_state: 'guest' }),
    );

    for (const path of ['/interview-questions/essential', '/coding?tech=react', '/react/interview-questions']) {
      await router.navigateByUrl(path);
      fixture.detectChanges();
      expect(link.hasAttribute('aria-current')).withContext(path).toBeFalse();
      expect(link.classList.contains('fah-navlink--active')).withContext(path).toBeFalse();
    }
    await router.navigateByUrl('/interview-questions?src=nav#topics');
    fixture.detectChanges();
    expect(link.getAttribute('aria-current')).toBe('page');
  });

  it('navigates from the mobile prep menu to the question hub, tracks the action, and closes the menu', async () => {
    const fixture = await createComponent({ isLoggedIn: false });
    const router = TestBed.inject(Router);
    const trigger = query<HTMLButtonElement>(fixture, 'header-mobile-study-button');

    trigger.click();
    fixture.detectChanges();
    query<HTMLButtonElement>(fixture, 'header-study-tab-practice').click();
    fixture.detectChanges();
    const link = query<HTMLAnchorElement>(fixture, 'header-study-interview_questions');
    expect(link.getAttribute('href')).toBe('/interview-questions');
    expect(link.closest('[role="tabpanel"]')?.hasAttribute('hidden')).toBeFalse();
    link.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/interview-questions');
    expect(fixture.componentInstance.megaOpen()).toBeFalse();
    expect(prepPanel(fixture).hasAttribute('hidden')).toBeTrue();
    expect(analytics.track).toHaveBeenCalledWith(
      'header_study_primary_cta_clicked',
      jasmine.objectContaining({ action: 'interview_questions', route: '/interview-questions', section: 'practice', surface: 'app' }),
    );
  });
  it('preserves keyboard focus in the open prep menu when authentication resolves', async () => {
    const fixture = await createComponent({ isLoggedIn: false, authUiState: 'pending' });
    query<HTMLButtonElement>(fixture, 'header-mobile-study-button').click();
    fixture.detectChanges();
    await fixture.whenStable();
    query<HTMLButtonElement>(fixture, 'header-study-tab-practice').click();
    fixture.detectChanges();

    const link = query<HTMLAnchorElement>(fixture, 'header-study-interview_questions');
    link.focus();
    loggedIn.set(true);
    authUiState.set('authenticated');
    fixture.detectChanges();

    expect(fixture.componentInstance.megaOpen()).toBeTrue();
    expect(document.activeElement).toBe(link);
    expect(link.getAttribute('href')).toBe('/interview-questions');
    expect(query<HTMLAnchorElement>(fixture, 'header-study-continue').getAttribute('href')).toBe('/dashboard');
  });
  it('uses the brand as the dashboard home link and removes the duplicate dashboard button', async () => {
    const fixture = await createComponent({ isLoggedIn: true });
    const brandLink = fixture.nativeElement.querySelector('[data-testid="header-brand"]') as HTMLAnchorElement;
    const desktopLinks = Array.from(fixture.nativeElement.querySelectorAll('.fah-desktop-actions a')) as HTMLAnchorElement[];

    expect(brandLink.getAttribute('href') || '').toContain('/dashboard');
    expect(desktopLinks.some((link) => (link.textContent || '').trim() === 'Dashboard')).toBeFalse();
  });

  it('keeps the brand on the public landing page until authentication resolves', async () => {
    const fixture = await createComponent({ isLoggedIn: false, authUiState: 'pending' });
    const brandLink = fixture.nativeElement.querySelector('[data-testid="header-brand"]') as HTMLAnchorElement;

    expect(brandLink.getAttribute('href')).toBe('/');

    authUiState.set('signed_out');
    fixture.detectChanges();
    expect(brandLink.getAttribute('href')).toBe('/');
  });

  it('shows the mobile profile button for signed-in users', async () => {
    const fixture = await createComponent({ isLoggedIn: true });
    const profileLink = fixture.nativeElement.querySelector('[data-testid="header-mobile-profile-button"]') as HTMLAnchorElement;

    expect(profileLink).toBeTruthy();
    expect(profileLink.getAttribute('href') || '').toContain('/profile');
  });

  it('renders only neutral auth placeholders while the session is pending', async () => {
    const fixture = await createComponent({ isLoggedIn: true, authUiState: 'pending' });

    const desktopPending = fixture.nativeElement.querySelector('[data-testid="header-auth-pending"]') as HTMLElement;
    const mobilePending = fixture.nativeElement.querySelector('[data-testid="header-mobile-auth-pending"]') as HTMLElement;
    const desktopActions = fixture.nativeElement.querySelector('.fah-desktop-actions') as HTMLElement;
    const mobileActions = fixture.nativeElement.querySelector('.fah-mobile-actions') as HTMLElement;

    expect(desktopPending).toBeTruthy();
    expect(desktopPending.getAttribute('aria-hidden')).toBe('true');
    expect(mobilePending).toBeTruthy();
    expect(mobilePending.getAttribute('aria-hidden')).toBe('true');
    expect(desktopActions.getAttribute('aria-busy')).toBe('true');
    expect(mobileActions.getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.querySelector('[data-testid="header-profile-button"]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="header-mobile-profile-button"]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('.fah-cta')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="header-menu-login"]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="header-menu-signup"]')).toBeFalsy();
  });

  it('reactively replaces pending placeholders with authenticated actions', async () => {
    const fixture = await createComponent({ isLoggedIn: true, authUiState: 'pending' });

    authUiState.set('authenticated');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="header-auth-pending"]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="header-mobile-auth-pending"]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="header-profile-button"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="header-mobile-profile-button"]')).toBeTruthy();
    expect((fixture.nativeElement.querySelector('.fah-cta')?.textContent || '')).toContain('Upgrade');
  });

  it('routes guest header CTA to the prep guide instead of pricing', async () => {
    const fixture = await createComponent({ isLoggedIn: false });
    const guestCta = fixture.nativeElement.querySelector('.fah-cta') as HTMLAnchorElement;

    expect(guestCta.textContent || '').toContain('Start prep');
    expect(guestCta.getAttribute('href') || '').toContain('/guides/interview-blueprint/intro');
  });

  it('keeps the logged-in free header CTA on pricing', async () => {
    const fixture = await createComponent({ isLoggedIn: true, isPro: false });
    const freeCta = fixture.nativeElement.querySelector('.fah-cta') as HTMLAnchorElement;

    expect(freeCta.textContent || '').toContain('Upgrade');
    expect(freeCta.getAttribute('href') || '').toContain('/pricing');
  });

  it('shows subscription management for premium users', async () => {
    const fixture = await createComponent({ isLoggedIn: true, isPro: true });
    const premiumCta = fixture.nativeElement.querySelector('.fah-cta') as HTMLAnchorElement;

    expect(premiumCta.textContent || '').toContain('Manage subscription');
    expect(premiumCta.getAttribute('href') || '').toContain('/profile');
  });

  it('shows user administration to admins', async () => {
    const fixture = await createComponent({ role: 'admin' });
    (fixture.nativeElement.querySelector('[data-testid="header-profile-button"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('[data-testid="header-menu-admin-users"]') as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link.getAttribute('href') || '').toContain('/admin/users');
  });

  it('does not expose admin navigation to a normal user', async () => {
    const fixture = await createComponent({ role: 'user' });
    (fixture.nativeElement.querySelector('[data-testid="header-profile-button"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="header-menu-admin-users"]')).toBeFalsy();
    const adminLinks = Array
      .from(fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>)
      .filter((link) => (link.getAttribute('href') || '').startsWith('/admin'));
    expect(adminLinks).toEqual([]);
  });

  it('renders every prep menu route in the initial DOM while the panel is closed', async () => {
    const fixture = await createComponent({ isLoggedIn: false, authUiState: 'pending' });
    const panel = prepPanel(fixture);
    const hrefs = Array.from(panel.querySelectorAll('a[href]')).map((link) => link.getAttribute('href'));

    expect(fixture.componentInstance.megaOpen()).toBeFalse();
    expect(panel.hasAttribute('hidden')).toBeTrue();
    expect(panel.getAttribute('aria-label')).toBe('Interview prep');
    expect(hrefs.sort()).toEqual([...PREP_MENU_ROUTES].sort());
    expect(query(fixture, 'header-study-continue')).toBeNull();
    expect(query<HTMLAnchorElement>(fixture, 'header-interview-hub').getAttribute('href')).toBe('/interview-questions');
  });

  it('opens a guide-first prep menu with sections, cards and technology chips', async () => {
    const fixture = await createComponent({ isLoggedIn: true });
    const button = fixture.nativeElement.querySelector('.fah-navlink') as HTMLButtonElement;

    expect(button.textContent || '').toContain('Interview Prep');
    button.click();
    fixture.detectChanges();

    const tabs = Array.from(prepPanel(fixture).querySelectorAll('[role="tab"]')) as HTMLButtonElement[];
    expect(tabs.map((tab) => (tab.textContent || '').trim())).toEqual(PREP_MENU_SECTIONS.map((section) => section.label));
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(query(fixture, 'header-study-continue')).toBeTruthy();

    const startCards = Array.from(
      prepPanel(fixture).querySelectorAll('#prepare-mega-start .pm-link'),
    ) as HTMLAnchorElement[];
    expect(startCards.map((link) => (link.textContent || '').trim())).toEqual([
      'Frontend interview preparation guide',
      '30-day interview roadmap',
      'Essential 60',
      'System design blueprint',
    ]);
    expect(startCards[0].getAttribute('href')).toBe('/guides/interview-blueprint/intro');

    const expectedHrefs: Record<string, string> = {
      'header-study-interview_questions': '/interview-questions',
      'header-study-framework_prep': '/guides/framework-prep',
      'header-study-essential_60': '/interview-questions/essential',
      'header-study-question_library': '/coding',
      'header-study-study_plans': '/tracks',
      'header-study-chip-react': '/react/interview-questions',
      'header-study-chip-css': '/css/interview-questions',
    };
    for (const [testId, href] of Object.entries(expectedHrefs)) {
      expect(query<HTMLAnchorElement>(fixture, testId).getAttribute('href')).withContext(testId).toBe(href);
    }
    expect(query(fixture, 'header-study-practice_types')).toBeFalsy();
    expect(prepPanel(fixture).querySelector('a[href="/html-css/interview-questions"], a[href="/guides"]')).toBeNull();
    expect(analytics.track).toHaveBeenCalledWith('header_study_opened', jasmine.any(Object));
    expect(analytics.track).toHaveBeenCalledWith(
      'header_top_nav_clicked',
      jasmine.objectContaining({ surface: 'app', area: 'primary', destination: 'study' }),
    );
  });

  it('keeps the Interview Prep trigger active on every prep menu destination', async () => {
    const fixture = await createComponent({ isLoggedIn: false });
    const router = TestBed.inject(Router);
    const button = fixture.nativeElement.querySelector('.fah-navlink') as HTMLButtonElement;

    for (const path of ['/machine-coding', '/tools/cv', '/focus-areas', '/tracks/foundations-30d/preview']) {
      await router.navigateByUrl(path);
      fixture.detectChanges();
      expect(button.classList.contains('fah-navlink--active')).withContext(path).toBeTrue();
    }
    await router.navigateByUrl('/pricing');
    fixture.detectChanges();
    expect(button.classList.contains('fah-navlink--active')).toBeFalse();
  });

  it('walks the active section with arrow keys and opens the highlighted card with Enter', async () => {
    const fixture = await createComponent({ isLoggedIn: false });
    const router = TestBed.inject(Router);
    (fixture.nativeElement.querySelector('.fah-navlink') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input[aria-label="Search interview prep"]') as HTMLInputElement;
    const press = (key: string) => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      fixture.detectChanges();
    };

    press('ArrowDown');
    expect(fixture.nativeElement.querySelector('[data-testid="header-study-continue"].active')).toBeTruthy();
    press('ArrowDown');
    expect(prepPanel(fixture).querySelector('.pm-card--highlight .pm-link')?.getAttribute('data-testid'))
      .toBe('header-study-interview_blueprint');

    press('Enter');
    await fixture.whenStable();
    expect(router.url).toBe('/guides/interview-blueprint/intro');
    expect(fixture.componentInstance.megaOpen()).toBeFalse();
    expect(analytics.track).toHaveBeenCalledWith(
      'header_study_primary_cta_clicked',
      jasmine.objectContaining({ action: 'interview_blueprint', section: 'start', surface: 'app' }),
    );
  });
  it('opens the named prep menu, focuses search, and restores trigger focus on Escape', async () => {
    const fixture = await createComponent({ isLoggedIn: false });
    const trigger = query<HTMLButtonElement>(fixture, 'header-mobile-study-button');

    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const panel = prepPanel(fixture);
    const input = fixture.nativeElement.querySelector('input[aria-label="Search interview prep"]') as HTMLInputElement;
    expect(trigger.hasAttribute('aria-haspopup')).toBeFalse();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe('prepare-mega');
    expect(panel.getAttribute('aria-label')).toBe('Interview prep');
    expect(panel.hasAttribute('hidden')).toBeFalse();
    expect(document.activeElement).toBe(input);

    const down = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
    input.dispatchEvent(down);
    expect(down.defaultPrevented).toBeTrue();
    expect(fixture.componentInstance.activeIndex()).toBe(0);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(panel.hasAttribute('hidden')).toBeTrue();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });
  it('focuses prep search for slash and Ctrl/Meta+K shortcuts', async () => {
    const fixture = await createComponent({ isLoggedIn: false });
    const trigger = fixture.nativeElement.querySelector('.fah-navlink') as HTMLButtonElement;

    const openWithShortcut = async (event: KeyboardEvent) => {
      document.dispatchEvent(event);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(event.defaultPrevented).toBeTrue();
      expect(document.activeElement).toBe(
        fixture.nativeElement.querySelector('input[aria-label="Search interview prep"]'),
      );

      document.activeElement?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      );
      fixture.detectChanges();
      expect([trigger, fixture.nativeElement.querySelector('[data-testid="header-mobile-study-button"]')])
        .toContain(document.activeElement as HTMLButtonElement);
    };

    await openWithShortcut(new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true }));
    await openWithShortcut(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true }));
    await openWithShortcut(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true, cancelable: true }));
  });

  it('tracks the guide as the primary start action and keeps Question Library as the full-library action', async () => {
    const fixture = await createComponent({ isLoggedIn: false });
    const button = fixture.nativeElement.querySelector('.fah-navlink') as HTMLButtonElement;

    button.click();
    fixture.detectChanges();

    const continueAction = query<HTMLAnchorElement>(fixture, 'header-study-continue');
    expect(continueAction.getAttribute('href') || '').toContain('/guides/interview-blueprint/intro');

    query<HTMLAnchorElement>(fixture, 'header-study-interview_blueprint').click();
    expect(analytics.track).toHaveBeenCalledWith(
      'header_study_primary_cta_clicked',
      jasmine.objectContaining({ action: 'interview_blueprint', route: '/guides/interview-blueprint/intro', section: 'start' }),
    );

    query<HTMLAnchorElement>(fixture, 'header-study-question_library').click();
    expect(analytics.track).toHaveBeenCalledWith(
      'header_study_browse_full_library_clicked',
      jasmine.objectContaining({ destination: 'question_library', route: '/coding', section: 'practice' }),
    );

    query<HTMLAnchorElement>(fixture, 'header-study-chip-css').click();
    expect(analytics.track).toHaveBeenCalledWith(
      'header_study_primary_cta_clicked',
      jasmine.objectContaining({ action: 'interview_questions', chip: 'css', route: '/css/interview-questions' }),
    );
  });
  it('renders a labeled mobile study trigger instead of an icon-only button', async () => {
    const fixture = await createComponent({ isLoggedIn: false });
    const studyButton = fixture.nativeElement.querySelector('[data-testid="header-mobile-study-button"]') as HTMLButtonElement;

    expect(studyButton.textContent || '').toContain('Interview Prep');
    expect(studyButton.getAttribute('aria-label') || '').toContain('interview prep');
  });
});
