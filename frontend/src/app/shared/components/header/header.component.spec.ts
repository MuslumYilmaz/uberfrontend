import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { AppSidebarDrawerService } from '../../../core/services/app-sidebar-drawer.service';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let authUiState: WritableSignal<'pending' | 'authenticated' | 'signed_out'>;

  async function createComponent(options?: {
    isLoggedIn?: boolean;
    isPro?: boolean;
    role?: 'user' | 'admin';
    authUiState?: 'pending' | 'authenticated' | 'signed_out';
  }): Promise<ComponentFixture<HeaderComponent>> {
    const isLoggedIn = options?.isLoggedIn ?? true;
    const isPro = options?.isPro ?? false;
    const role = options?.role ?? 'user';
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
        provideRouter([]),
        { provide: AnalyticsService, useValue: analytics },
        {
          provide: AuthService,
          useValue: {
            user,
            isLoggedIn: signal(isLoggedIn),
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

  it('removes the top-level interview hub link and mobile pricing quicklink', async () => {
    const fixture = await createComponent({ isLoggedIn: false });

    expect(fixture.nativeElement.querySelector('[data-testid="header-interview-hub"]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="header-mobile-pricing-button"]')).toBeFalsy();
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

  it('opens a compact study launcher with guide-first primary actions', async () => {
    const fixture = await createComponent({ isLoggedIn: true });
    const button = fixture.nativeElement.querySelector('.fah-navlink') as HTMLButtonElement;

    expect(button.textContent || '').toContain('Interview Prep');
    button.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="header-study-continue"]')).toBeTruthy();
    const guide = fixture.nativeElement.querySelector('[data-testid="header-study-interview_blueprint"]') as HTMLAnchorElement;
    const frameworkPrep = fixture.nativeElement.querySelector('[data-testid="header-study-framework_prep"]') as HTMLAnchorElement;
    const essential = fixture.nativeElement.querySelector('[data-testid="header-study-essential_60"]') as HTMLAnchorElement;
    const questionLibrary = fixture.nativeElement.querySelector('[data-testid="header-study-question_library"]') as HTMLAnchorElement;
    const studyPlans = fixture.nativeElement.querySelector('[data-testid="header-study-study_plans"]') as HTMLAnchorElement;
    const rows = Array.from(fixture.nativeElement.querySelectorAll('.study-row--primary')) as HTMLElement[];
    const titles = rows.map((row) => row.querySelector('.row-title')?.textContent?.replace(/\s+/g, ' ').trim());

    expect(rows.length).toBe(6);
    expect(titles[0]).toContain('Continue where I left off');
    expect(titles[1]).toContain('Frontend interview preparation guide');
    expect(titles[2]).toContain('Framework prep paths');
    expect(titles[3]).toContain('FrontendAtlas Essential 60');
    expect(titles[4]).toContain('Question Library');
    expect(rows.filter((row) => (row.textContent || '').includes('Question Library')).length).toBe(1);
    expect(guide).toBeTruthy();
    expect(guide.classList.contains('study-row--featured')).toBeTrue();
    expect(guide.textContent || '').toContain('Frontend interview preparation guide');
    expect(guide.textContent || '').not.toContain('Start here');
    expect(frameworkPrep).toBeTruthy();
    expect(frameworkPrep.textContent || '').toContain('Framework prep paths');
    expect(essential).toBeTruthy();
    expect(essential.classList.contains('study-row--featured')).toBeFalse();
    expect(essential.textContent || '').toContain('FrontendAtlas Essential 60');
    expect(questionLibrary).toBeTruthy();
    expect(questionLibrary.textContent || '').toContain('Question Library');
    expect(studyPlans.textContent || '').toContain('Study Plans');
    expect(fixture.nativeElement.querySelector('[data-testid="header-study-practice_types"]')).toBeFalsy();
    expect(guide.getAttribute('href') || '').toContain('/guides/interview-blueprint/intro');
    expect(frameworkPrep.getAttribute('href') || '').toContain('/guides/framework-prep');
    expect(essential.getAttribute('href') || '').toContain('/interview-questions/essential');
    expect(questionLibrary.getAttribute('href') || '').toContain('/coding');
    expect(studyPlans.getAttribute('href') || '').toContain('/tracks');
    expect(analytics.track).toHaveBeenCalledWith('header_study_opened', jasmine.any(Object));
    expect(analytics.track).toHaveBeenCalledWith(
      'header_top_nav_clicked',
      jasmine.objectContaining({ surface: 'app', area: 'primary', destination: 'study' }),
    );
  });

  it('opens a named prep dialog, focuses search, and restores trigger focus on Escape', async () => {
    const fixture = await createComponent({ isLoggedIn: false });
    const trigger = fixture.nativeElement.querySelector(
      '[data-testid="header-mobile-study-button"]',
    ) as HTMLButtonElement;

    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    const input = fixture.nativeElement.querySelector('input[aria-label="Search interview prep"]') as HTMLInputElement;
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(dialog.getAttribute('aria-label')).toBe('Interview prep');
    expect(document.activeElement).toBe(input);

    const down = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
    input.dispatchEvent(down);
    expect(down.defaultPrevented).toBeTrue();
    expect(fixture.componentInstance.activeIndex()).toBe(0);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
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

    const continueAction = fixture.nativeElement.querySelector('[data-testid="header-study-continue"]') as HTMLAnchorElement;
    expect(continueAction.getAttribute('href') || '').toContain('/guides/interview-blueprint/intro');

    (fixture.nativeElement.querySelector('[data-testid="header-study-interview_blueprint"]') as HTMLAnchorElement).click();
    expect(analytics.track).toHaveBeenCalledWith(
      'header_study_primary_cta_clicked',
      jasmine.objectContaining({ action: 'interview_blueprint', route: '/guides/interview-blueprint/intro' }),
    );

    (fixture.nativeElement.querySelector('[data-testid="header-study-question_library"]') as HTMLAnchorElement).click();
    expect(analytics.track).toHaveBeenCalledWith(
      'header_study_browse_full_library_clicked',
      jasmine.objectContaining({ destination: 'question_library', route: '/coding' }),
    );
  });

  it('renders a labeled mobile study trigger instead of an icon-only button', async () => {
    const fixture = await createComponent({ isLoggedIn: false });
    const studyButton = fixture.nativeElement.querySelector('[data-testid="header-mobile-study-button"]') as HTMLButtonElement;

    expect(studyButton.textContent || '').toContain('Interview Prep');
    expect(studyButton.getAttribute('aria-label') || '').toContain('interview prep');
  });
});
