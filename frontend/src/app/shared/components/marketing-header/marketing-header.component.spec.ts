import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { MarketingHeaderComponent } from './marketing-header.component';

describe('MarketingHeaderComponent', () => {
  let analytics: jasmine.SpyObj<AnalyticsService>;

  async function createComponent(options?: { isLoggedIn?: boolean; isPro?: boolean }): Promise<ComponentFixture<MarketingHeaderComponent>> {
    const isLoggedIn = options?.isLoggedIn ?? false;
    const isPro = options?.isPro ?? false;
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);

    await TestBed.configureTestingModule({
      imports: [MarketingHeaderComponent],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analytics },
        {
          provide: AuthService,
          useValue: {
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

  it('shows the three primary discovery routes in the agreed order for guests', async () => {
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
      '/interview-questions/essential',
      '/coding?reset=1',
      '/tracks',
    ]);
    expect(utilityLabels).toEqual(['Pricing', 'Log in']);
    expect((fixture.nativeElement.querySelector('[data-testid="marketing-header-cta"]') as HTMLAnchorElement).textContent || '')
      .toContain('Start free');
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
    expect(cta.textContent || '').toContain('Open dashboard');
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

  it('treats all coding views as Question Library while keeping Essential 60 isolated', async () => {
    const fixture = await createComponent({ isLoggedIn: false });
    const component = fixture.componentInstance;
    const [essential60, questionLibrary] = component.primaryLinks;

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

  it('demotes the top-right CTA on the showcase landing route', async () => {
    const fixture = await createComponent({ isLoggedIn: false });
    const component = fixture.componentInstance;
    const cta = fixture.nativeElement.querySelector('[data-testid="marketing-header-cta"]') as HTMLAnchorElement;

    component.currentUrl.set('/');
    fixture.detectChanges();
    expect(cta.classList.contains('famh-cta--muted')).toBeTrue();

    component.currentUrl.set('/pricing');
    fixture.detectChanges();
    expect(cta.classList.contains('famh-cta--muted')).toBeFalse();
  });
});
