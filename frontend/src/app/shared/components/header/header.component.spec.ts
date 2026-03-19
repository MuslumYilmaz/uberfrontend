import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            user: jasmine.createSpy('user').and.returnValue({
              _id: 'user_1',
              username: 'header_user',
              email: 'header@example.com',
              role: 'user',
            }),
            isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(true),
            logout: jasmine.createSpy('logout').and.returnValue(of(void 0)),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
  });

  it('toggles the profile menu open and closed from the avatar button', () => {
    const button = fixture.nativeElement.querySelector('[data-testid="header-profile-button"]') as HTMLButtonElement;

    button.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="header-profile-menu"]')).toBeTruthy();

    button.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="header-profile-menu"]')).toBeFalsy();
  });
});
