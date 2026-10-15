import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AppUiStylesService } from '../../../core/services/app-ui-styles.service';
import { AuthService } from '../../../core/services/auth.service';
import { PREP_MENU_ROUTES } from '../../../core/content/prep-menu';
import { MarketingHeaderComponent } from './marketing-header.component';

describe('MarketingHeaderComponent', () => {
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let appUiStyles: jasmine.SpyObj<AppUiStylesService>;
  let authUiState: WritableSignal<'pending' | 'authenticated' | 'signed_out'>;

  async function createComponent(options?: {
    isLoggedIn?: boolean;
    isPro?: boolean;
    authUiState?: 'pending' | 'authenticated' | 'signed_out';
  }): Promise<ComponentFixture<MarketingHeaderComponent>> {
    const isLoggedIn = options?.isLoggedIn ?? false;
    const isPro = options?.isPro ?? false;
    authUiState = signal(options?.authUiState ?? (isLoggedIn ? 'authenticated' : 'signed_out'));
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    appUiStyles = jasmine.createSpyObj<AppUiStylesService>('AppUiStylesService', ['ensureCoreLoaded']);

    await TestBed.configureTestingModule({
      imports: [MarketingHeaderComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: AnalyticsService, useValue: analytics },
        { provide: AppUiStylesService, useValue: appUiStyles },
        {
          provide: AuthService,
          useValue: {
            authUiState,
            user: jasmine.createSpy('user').and.returnValue(
              isLoggedIn
                ? {
                    _id: 'user_1',
                    username: 'marketing_user',
                    email: 'marketing@example.com',
                    role: 'user',
                    accessTier: isPro ? 'premium' : 'free',
                  }
                : null,
            ),
            isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(isLoggedIn),
            logout: jasmine.createSpy('logout').and.returnValue(of(void 0)),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(MarketingHeaderComponent);
    fixture.detectChanges();
    return fixture;
  }

  const menuPanel = (fixture: ComponentFixture<MarketingHeaderComponent>) =>
    fixture.nativeElement.querySelector('nav#marketing-prep-menu') as HTMLElement;

  it('shows a compact top bar and keeps every former top-bar destination in the closed prep menu', async () => {
    const fixture = await createComponent({ isLoggedIn: false });
    const host = fixture.nativeElement as HTMLElement;
    const trigger = host.querySelector('[data-testid="marketing-header-menu-trigger"]') as HTMLButtonElement;
    const primaryLinks = Array.from(
      host.querySelectorAll('[data-testid="marketing-header-primary-link"]'),
    ) as HTMLAnchorElement[];
    const utilityLabels = Array.from(host.querySelectorAll('[data-testid="marketing-header-utility-link"]'))
      .map((link) => (link.textContent || '').trim());
    const panel = menuPanel(fixture);
    const menuHrefs = Array.from(panel.querySelectorAll('a[href]')).map((link) => link.getAttribute('href'));

    expect((trigger.textContent || '').trim()).toContain('Interview Prep');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBe('marketing-prep-menu');
    expect(primaryLinks.map((link) => (link.textContent || '').trim())).toEqual(['Interview Questions']);
    expect(primaryLinks.map((link) => link.getAttribute('href'))).toEqual(['/interview-questions']);
    expect(utilityLabels).toEqual(['Pricing', 'Log in']);
    expect((host.querySelector('[data-testid="marketing-header-cta"]') as HTMLAnchorElement).textContent || '')
      .toContain('Create free account');
    expect((host.querySelector('[data-testid="marketing-header-cta"]') as HTMLAnchorElement).getAttribute('href'))
      .toContain('/auth/signup');

    expect(panel.hasAttribute('hidden')).toBeTrue();
    expect(menuHrefs.sort()).toEqual([...PREP_MENU_ROUTES].sort());
    for (const route of ['/guides/interview-blueprint/intro', '/interview-questions/essential', '/coding', '/tracks']) {
      expect(menuHrefs).withContext(route).toContain(route);
    }
    expect(host.querySelector('[data-testid="marketing-header-mobile-menu"]')).toBeNull();
  });

  it('opens the prep menu from either trigger, tracks it, and closes on Escape with focus restored', async () => {
    const fixture = await createComponent({ isLoggedIn: false });
    const host = fixture.nativeElement as HTMLElement;
    const trigger = host.querySelector('[data-testid="marketing-header-menu-trigger"]') as HTMLButtonElement;

    trigger.focus();
    trigger.click();
    fixture.detectChanges();

    expect(menuPanel(fixture).hasAttribute('hidden')).toBeFalse();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.classList.contains('famh-link--active')).toBeTrue();
    expect(analytics.track).toHaveBeenCalledWith(
      'header_study_opened',
      jasmine.objectContaining({ trigger: 'button', surface: 'marketing' }),
    );
    expect(analytics.track).toHaveBeenCalledWith(
      'header_top_nav_clicked',
      jasmine.objectContaining({ surface: 'marketing', area: 'primary', destination: 'study' }),
    );

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(menuPanel(fixture).hasAttribute('hidden')).toBeTrue();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    // The test browser is narrower than 1180px, so focus return is checked on the visible mobile button.
    const mobileButton = host.querySelector('[data-testid="marketing-header-mobile-menu-button"]') as HTMLButtonElement;
    mobileButton.focus();
    mobileButton.click();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(menuPanel(fixture).hasAttribute('hidden')).toBeTrue();
    expect(document.activeElement).toBe(mobileButton);
  });

  it('loads the icon stylesheet only once the visitor shows intent to open the menu', async () => {
    const fixture = await createComponent({ isLoggedIn: false });
    const host = fixture.nativeElement as HTMLElement;
    const trigger = host.querySelector('[data-testid="marketing-header-menu-trigger"]') as HTMLButtonElement;

    expect(appUiStyles.ensureCoreLoaded).not.toHaveBeenCalled();
    trigger.dispatchEvent(new PointerEvent('pointerenter'));
    expect(appUiStyles.ensureCoreLoaded).toHaveBeenCalledTimes(1);

    (host.querySelector('[data-testid="marketing-header-mobile-menu-button"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(appUiStyles.ensureCoreLoaded).toHaveBeenCalledTimes(2);
  });

  it('tracks prep menu clicks with their section and closes the menu', async () => {
    const fixture = await createComponent({ isLoggedIn: false });
    const host = fixture.nativeElement as HTMLElement;

    (host.querySelector('[data-testid="marketing-header-menu-trigger"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (host.querySelector('[data-testid="marketing-header-menu-interview_blueprint"]') as HTMLAnchorElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.menuOpen()).toBeFalse();
    expect(analytics.track).toHaveBeenCalledWith(
      'header_top_nav_clicked',
      jasmine.objectContaining({
        surface: 'marketing',
        area: 'prep_menu',
        destination: '/guides/interview-blueprint/intro',
        section: 'start',
        item: 'interview_blueprint',
        auth_state: 'guest',
      }),
    );
  });
  it('switches utility actions for logged-in users', async () => {
    const fixture = await createComponent({ isLoggedIn: true });
    const utilityLinks = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="marketing-header-utility-link"]'),
    ) as HTMLAnchorElement[];
    const utilityLabels = utilityLinks.map((link) => (link.textContent || '').trim());
    const cta = fixture.nativeElement.querySelector('[data-testid="marketing-header-cta"]') as HTMLAnchorElement;

    expect(utilityLabels).toEqual(['Dashboard', 'Profile']);
    expect(utilityLabels).not.toContain('Pricing');
    expect(cta.textContent || '').toContain('View pricing');
    expect(cta.getAttribute('href')).toBe('/pricing');
  });

  it('routes the brand by resolved authentication state and tracks the matching destination', async () => {
    const fixture = await createComponent({ authUiState: 'pending' });
    const brand = fixture.nativeElement.querySelector('[data-testid="marketing-header-brand"]') as HTMLAnchorElement;

    expect(brand.getAttribute('href')).toBe('/');

    authUiState.set('authenticated');
    fixture.detectChanges();
    expect(brand.getAttribute('href')).toBe('/dashboard');

    brand.click();
    expect(analytics.track).toHaveBeenCalledWith(
      'header_brand_clicked',
      jasmine.objectContaining({ surface: 'marketing', destination: '/dashboard' }),
    );
  });

  it('keeps the dashboard action for active Premium users', async () => {
    const fixture = await createComponent({ isLoggedIn: true, isPro: true });
    const cta = fixture.nativeElement.querySelector('[data-testid="marketing-header-cta"]') as HTMLAnchorElement;

    expect(cta.textContent || '').toContain('Open dashboard');
    expect(cta.getAttribute('href')).toBe('/dashboard');
  });

  it('keeps desktop auth actions neutral while pending and reacts to authentication', async () => {
    const fixture = await createComponent({ authUiState: 'pending' });
    const host = fixture.nativeElement as HTMLElement;
    const actions = host.querySelector('.famh-actions') as HTMLElement;

    expect(host.querySelector('[data-testid="marketing-header-auth-pending"]')).toBeTruthy();
    expect(host.querySelector('[data-testid="marketing-header-utility-link"]')).toBeNull();
    expect(host.querySelector('[data-testid="marketing-header-cta"]')).toBeNull();
    expect(actions.getAttribute('aria-busy')).toBe('true');

    authUiState.set('authenticated');
    fixture.detectChanges();

    const utilityLabels = Array.from(
      host.querySelectorAll('[data-testid="marketing-header-utility-link"]'),
    ).map((link) => (link.textContent || '').trim());
    expect(host.querySelector('[data-testid="marketing-header-auth-pending"]')).toBeNull();
    expect(utilityLabels).toEqual(['Dashboard', 'Profile']);
    expect((host.querySelector('[data-testid="marketing-header-cta"]')?.textContent || '').trim()).toBe('View pricing');
    expect(actions.hasAttribute('aria-busy')).toBeFalse();
  });

  it('opens the same prep menu from the mobile button with the question hub and account actions', async () => {
    const fixture = await createComponent({ isLoggedIn: false });
    const button = fixture.nativeElement.querySelector('[data-testid="marketing-header-mobile-menu-button"]') as HTMLButtonElement;

    button.click();
    fixture.detectChanges();

    const mobilePrimaryLabels = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="marketing-header-mobile-link"]'),
    ).map((link) => ((link as HTMLElement).textContent || '').trim());
    const mobileUtilityLabels = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="marketing-header-mobile-utility-link"]'),
    ).map((link) => ((link as HTMLElement).textContent || '').trim());
    const mobileMenu = fixture.nativeElement.querySelector('[data-testid="marketing-header-mobile-menu"]') as HTMLElement;

    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(menuPanel(fixture).hasAttribute('hidden')).toBeFalse();
    expect(mobileMenu).toBeTruthy();
    expect(menuPanel(fixture).contains(mobileMenu)).toBeTrue();
    expect(mobilePrimaryLabels).toEqual(['Interview Questions']);
    expect(mobileUtilityLabels).toEqual(['Pricing', 'Log in']);
    expect(menuPanel(fixture).querySelectorAll('[role="tab"]').length).toBeGreaterThan(1);
    expect(analytics.track).toHaveBeenCalledWith(
      'header_top_nav_clicked',
      jasmine.objectContaining({ surface: 'marketing', area: 'mobile_menu', destination: 'menu' }),
    );
    expect(analytics.track).toHaveBeenCalledWith(
      'header_study_opened',
      jasmine.objectContaining({ trigger: 'mobile_menu', surface: 'marketing' }),
    );
  });
  it('keeps mobile account actions neutral while pending and reacts to signed-out state', async () => {
    const fixture = await createComponent({ authUiState: 'pending' });
    const host = fixture.nativeElement as HTMLElement;
    const button = host.querySelector('[data-testid="marketing-header-mobile-menu-button"]') as HTMLButtonElement;

    button.click();
    fixture.detectChanges();

    const mobileAuth = host.querySelector('.famh-mobile-auth') as HTMLElement;
    expect(host.querySelector('[data-testid="marketing-header-mobile-auth-pending"]')).toBeTruthy();
    expect(host.querySelector('[data-testid="marketing-header-mobile-utility-link"]')).toBeNull();
    expect(host.querySelector('[data-testid="marketing-header-mobile-cta"]')).toBeNull();
    expect(mobileAuth.getAttribute('aria-busy')).toBe('true');

    authUiState.set('signed_out');
    fixture.detectChanges();

    expect(host.querySelector('[data-testid="marketing-header-mobile-auth-pending"]')).toBeNull();
    expect(Array.from(host.querySelectorAll('[data-testid="marketing-header-mobile-utility-link"]'))
      .map((link) => (link.textContent || '').trim())).toEqual(['Pricing', 'Log in']);
    expect((host.querySelector('[data-testid="marketing-header-mobile-cta"]')?.textContent || '').trim()).toBe('Create free account');
    expect(mobileAuth.hasAttribute('aria-busy')).toBeFalse();
  });

  it('keeps the question hub, Essential 60, and coding active states separate', async () => {
    const fixture = await createComponent({ isLoggedIn: false });
    const component = fixture.componentInstance;
    const [interviewQuestions] = component.primaryLinks;
    const currentMenuLinks = () => {
      fixture.detectChanges();
      return Array.from(menuPanel(fixture).querySelectorAll('a[aria-current="page"]'))
        .map((link) => link.getAttribute('href'));
    };

    component.currentUrl.set('/interview-questions?src=nav#topics');
    expect(component.isPrimaryLinkActive(interviewQuestions)).toBeTrue();
    expect(component.isMenuTriggerActive()).toBeFalse();
    expect(currentMenuLinks()).toEqual(['/interview-questions']);

    component.currentUrl.set('/interview-questions/essential');
    expect(component.isPrimaryLinkActive(interviewQuestions)).toBeFalse();
    expect(component.isMenuTriggerActive()).toBeTrue();
    expect(currentMenuLinks()).toEqual(['/interview-questions/essential']);

    component.currentUrl.set('/coding?view=formats&category=system');
    expect(component.isPrimaryLinkActive(interviewQuestions)).toBeFalse();
    expect(component.isMenuTriggerActive()).toBeTrue();
    expect(currentMenuLinks()).toEqual(['/coding']);

    component.currentUrl.set('/');
    expect(component.isMenuTriggerActive()).toBeFalse();
    expect(currentMenuLinks()).toEqual([]);
  });
  it('keeps the public question hub available before auth resolves and after both auth outcomes', async () => {
    const fixture = await createComponent({ authUiState: 'pending' });
    for (const state of ['pending', 'signed_out', 'authenticated'] as const) {
      authUiState.set(state);
      fixture.detectChanges();
      const link = fixture.nativeElement.querySelector('.famh-nav a[href="/interview-questions"]') as HTMLAnchorElement;
      expect(link).withContext(state).toBeTruthy();
      expect(link.textContent).toContain('Interview Questions');
    }
  });

  it('navigates from the mobile question hub, tracks it, and closes even on the current page', async () => {
    const fixture = await createComponent({ isLoggedIn: false });
    const router = TestBed.inject(Router);
    const component = fixture.componentInstance;

    for (let visit = 0; visit < 2; visit += 1) {
      component.toggleMobileMenu();
      fixture.detectChanges();
      const link = fixture.nativeElement.querySelector('.famh-mobile-panel a[href="/interview-questions"]') as HTMLAnchorElement;
      link.click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(router.url).toBe('/interview-questions');
      expect(component.menuOpen()).toBeFalse();
      expect(fixture.nativeElement.querySelector('[data-testid="marketing-header-mobile-menu"]')).toBeNull();
    }
    expect(analytics.track).toHaveBeenCalledWith(
      'header_top_nav_clicked',
      jasmine.objectContaining({ surface: 'marketing', area: 'mobile_menu', destination: '/interview-questions', auth_state: 'guest' }),
    );
  });

  it('keeps the conversion CTA visually primary on the showcase landing route', async () => {
    const fixture = await createComponent({ isLoggedIn: false });
    const component = fixture.componentInstance;
    const cta = fixture.nativeElement.querySelector('[data-testid="marketing-header-cta"]') as HTMLAnchorElement;

    component.currentUrl.set('/');
    fixture.detectChanges();
    expect(cta.classList.contains('famh-cta--muted')).toBeFalse();

    component.currentUrl.set('/pricing');
    fixture.detectChanges();
    expect(cta.classList.contains('famh-cta--muted')).toBeFalse();
  });
});
