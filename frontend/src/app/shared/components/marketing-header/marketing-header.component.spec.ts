import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { MarketingHeaderComponent } from './marketing-header.component';

describe('MarketingHeaderComponent', () => {
  let analytics: jasmine.SpyObj<AnalyticsService>;
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

    await TestBed.configureTestingModule({
      imports: [MarketingHeaderComponent],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analytics },
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

  it('shows prep-first primary discovery routes in the agreed order for guests', async () => {
    const fixture = await createComponent({ isLoggedIn: false });
    const primaryLinks = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="marketing-header-primary-link"]'),
    ) as HTMLAnchorElement[];
    const labels = primaryLinks.map((link) => (link.textContent || '').trim());
    const utilityLinks = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="marketing-header-utility-link"]'),
    ) as HTMLAnchorElement[];
    const utilityLabels = utilityLinks.map((link) => (link.textContent || '').trim());

    expect(labels).toEqual([
      'Prep Guide',
      'Essential 60',
      'Question Library',
      'Study Plans',
    ]);
    expect(labels).not.toContain('Guides');
    expect(labels).not.toContain('Framework Prep');
    expect(labels).not.toContain('Interview Questions');
    expect(labels).not.toContain('Companies');
    expect(labels).not.toContain('Behavioral');
    expect(labels).not.toContain('System Design');
    expect(primaryLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/guides/interview-blueprint/intro',
      '/interview-questions/essential',
      '/coding',
      '/tracks',
    ]);
    expect(utilityLabels).toEqual(['Pricing', 'Log in']);
    expect((fixture.nativeElement.querySelector('[data-testid="marketing-header-cta"]') as HTMLAnchorElement).textContent || '')
      .toContain('Create free account');
    expect((fixture.nativeElement.querySelector('[data-testid="marketing-header-cta"]') as HTMLAnchorElement).getAttribute('href'))
      .toContain('/auth/signup');
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

  it('opens a mobile menu that preserves the same discovery IA', async () => {
    const fixture = await createComponent({ isLoggedIn: false });
    const button = fixture.nativeElement.querySelector('[data-testid="marketing-header-mobile-menu-button"]') as HTMLButtonElement;

    button.click();
    fixture.detectChanges();

    const mobilePrimaryLinks = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="marketing-header-mobile-link"]'),
    ) as HTMLAnchorElement[];
    const mobilePrimaryLabels = mobilePrimaryLinks.map((link) => (link.textContent || '').trim());
    const mobileUtilityLinks = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="marketing-header-mobile-utility-link"]'),
    ) as HTMLAnchorElement[];
    const mobileUtilityLabels = mobileUtilityLinks.map((link) => (link.textContent || '').trim());

    expect(fixture.nativeElement.querySelector('[data-testid="marketing-header-mobile-menu"]')).toBeTruthy();
    expect(mobilePrimaryLabels).toEqual([
      'Prep Guide',
      'Essential 60',
      'Question Library',
      'Study Plans',
    ]);
    expect(mobilePrimaryLabels).not.toContain('System Design');
    expect(mobileUtilityLabels).toEqual(['Pricing', 'Log in']);
    expect(analytics.track).toHaveBeenCalledWith(
      'header_top_nav_clicked',
      jasmine.objectContaining({ surface: 'marketing', area: 'mobile_menu', destination: 'menu' }),
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

  it('treats all coding views as Question Library while keeping Essential 60 isolated', async () => {
    const fixture = await createComponent({ isLoggedIn: false });
    const component = fixture.componentInstance;
    const [, essential60, questionLibrary] = component.primaryLinks;

    component.currentUrl.set('/interview-questions/essential');
    expect(component.isPrimaryLinkActive(essential60)).toBeTrue();
    expect(component.isPrimaryLinkActive(questionLibrary)).toBeFalse();

    component.currentUrl.set('/coding?view=formats&category=system');
    expect(component.isPrimaryLinkActive(questionLibrary)).toBeTrue();
    expect(component.isPrimaryLinkActive(essential60)).toBeFalse();

    component.currentUrl.set('/coding?tech=react');
    expect(component.isPrimaryLinkActive(questionLibrary)).toBeTrue();
    expect(component.isPrimaryLinkActive(essential60)).toBeFalse();
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
