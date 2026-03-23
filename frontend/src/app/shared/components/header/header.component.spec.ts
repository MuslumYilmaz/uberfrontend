import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AppSidebarDrawerService } from '../../../core/services/app-sidebar-drawer.service';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  async function createComponent(options?: { isLoggedIn?: boolean; isPro?: boolean }): Promise<ComponentFixture<HeaderComponent>> {
    const isLoggedIn = options?.isLoggedIn ?? true;
    const isPro = options?.isPro ?? false;
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
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

  it('shows pricing instead of the mobile profile button for guests', async () => {
    const fixture = await createComponent({ isLoggedIn: false });

    expect(fixture.nativeElement.querySelector('[data-testid="header-mobile-pricing-button"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="header-mobile-profile-button"]')).toBeFalsy();
  });

  it('shows the mobile profile button for signed-in users', async () => {
    const fixture = await createComponent({ isLoggedIn: true });
    const profileLink = fixture.nativeElement.querySelector('[data-testid="header-mobile-profile-button"]') as HTMLAnchorElement;

    expect(fixture.nativeElement.querySelector('[data-testid="header-mobile-pricing-button"]')).toBeFalsy();
    expect(profileLink).toBeTruthy();
    expect(profileLink.getAttribute('href') || '').toContain('/profile');
  });

  it('hides pricing actions for premium users', async () => {
    const fixture = await createComponent({ isLoggedIn: true, isPro: true });

    expect(fixture.nativeElement.textContent || '').not.toContain('Pricing');
    expect(fixture.nativeElement.textContent || '').not.toContain('Upgrade');
    expect(fixture.nativeElement.textContent || '').not.toContain('Get full access');
  });
});
