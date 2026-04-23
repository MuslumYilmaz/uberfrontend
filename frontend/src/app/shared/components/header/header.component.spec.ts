import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { AppSidebarDrawerService } from '../../../core/services/app-sidebar-drawer.service';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let analytics: jasmine.SpyObj<AnalyticsService>;

  async function createComponent(options?: { isLoggedIn?: boolean; isPro?: boolean }): Promise<ComponentFixture<HeaderComponent>> {
    const isLoggedIn = options?.isLoggedIn ?? true;
    const isPro = options?.isPro ?? false;
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
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
                  username: 'header_user',
                  email: 'header@example.com',
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

  it('shows the mobile profile button for signed-in users', async () => {
    const fixture = await createComponent({ isLoggedIn: true });
    const profileLink = fixture.nativeElement.querySelector('[data-testid="header-mobile-profile-button"]') as HTMLAnchorElement;

    expect(profileLink).toBeTruthy();
    expect(profileLink.getAttribute('href') || '').toContain('/profile');
  });

  it('hides upgrade actions for premium users', async () => {
    const fixture = await createComponent({ isLoggedIn: true, isPro: true });
    const premiumUpsellCta = fixture.nativeElement.querySelector('.fah-cta') as HTMLAnchorElement | null;

    expect(premiumUpsellCta).toBeNull();
  });

  it('opens a compact study launcher with four primary actions and tracks the open event', async () => {
    const fixture = await createComponent({ isLoggedIn: true });
    const button = fixture.nativeElement.querySelector('.fah-navlink') as HTMLButtonElement;

    expect(button.textContent || '').toContain('Interview Prep');
    button.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="header-study-continue"]')).toBeTruthy();
    const questionLibrary = fixture.nativeElement.querySelector('[data-testid="header-study-question_library"]') as HTMLAnchorElement;
    const studyPlans = fixture.nativeElement.querySelector('[data-testid="header-study-study_plans"]') as HTMLAnchorElement;
    const practiceTypes = fixture.nativeElement.querySelector('[data-testid="header-study-practice_types"]') as HTMLAnchorElement;
    const rows = Array.from(fixture.nativeElement.querySelectorAll('.study-row--primary')) as HTMLElement[];

    expect(rows.length).toBe(4);
    expect(rows.filter((row) => (row.textContent || '').includes('Question Library')).length).toBe(1);
    expect(questionLibrary).toBeTruthy();
    expect(questionLibrary.textContent || '').toContain('Question Library');
    expect(studyPlans.textContent || '').toContain('Study Plans');
    expect(practiceTypes.textContent || '').toContain('Practice Types');
    expect(questionLibrary.getAttribute('href') || '').toContain('/coding?reset=1');
    expect(studyPlans.getAttribute('href') || '').toContain('/tracks');
    expect(practiceTypes.getAttribute('href') || '').toContain('/coding?view=formats&category=ui&reset=1');
    expect(analytics.track).toHaveBeenCalledWith('header_study_opened', jasmine.any(Object));
    expect(analytics.track).toHaveBeenCalledWith(
      'header_top_nav_clicked',
      jasmine.objectContaining({ surface: 'app', area: 'primary', destination: 'study' }),
    );
  });

  it('renders a labeled mobile study trigger instead of an icon-only button', async () => {
    const fixture = await createComponent({ isLoggedIn: false });
    const studyButton = fixture.nativeElement.querySelector('[data-testid="header-mobile-study-button"]') as HTMLButtonElement;

    expect(studyButton.textContent || '').toContain('Interview Prep');
    expect(studyButton.getAttribute('aria-label') || '').toContain('interview prep');
  });
});
