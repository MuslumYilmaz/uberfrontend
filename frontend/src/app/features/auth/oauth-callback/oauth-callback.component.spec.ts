import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { throwError } from 'rxjs';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { OAuthCallbackComponent } from './oauth-callback.component';

describe('OAuthCallbackComponent', () => {
  let fixture: ComponentFixture<OAuthCallbackComponent>;
  let router: Router;
  let authServiceStub: {
    consumeOAuthMode: jasmine.Spy;
    consumeOAuthRedirect: jasmine.Spy;
    completeOAuthCallback: jasmine.Spy;
  };

  beforeEach(async () => {
    authServiceStub = {
      consumeOAuthMode: jasmine.createSpy('consumeOAuthMode').and.returnValue('login'),
      consumeOAuthRedirect: jasmine.createSpy('consumeOAuthRedirect').and.returnValue('/dashboard'),
      completeOAuthCallback: jasmine.createSpy('completeOAuthCallback').and.returnValue(
        throwError(() => ({
          status: 401,
          error: {
            code: 'AUTH_SESSION_BOOTSTRAP_FAILED',
            error: 'We could not finish authentication. Please try again.',
          },
        })),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [OAuthCallbackComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceStub },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {},
              queryParamMap: convertToParamMap({}),
            },
          },
        },
        {
          provide: AnalyticsService,
          useValue: jasmine.createSpyObj('AnalyticsService', ['track']),
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);

    fixture = TestBed.createComponent(OAuthCallbackComponent);
    fixture.detectChanges();
  });

  it('shows a user-friendly callback error and offers a sign-in CTA', () => {
    const text = fixture.nativeElement.textContent || '';
    expect(text).toContain('We could not finish authentication. Please try again.');

    const button = fixture.nativeElement.querySelector('[data-testid="oauth-callback-login"]');
    expect(button).toBeTruthy();
  });

  it('redirects back to login with the intended destination when CTA is clicked', () => {
    const button = fixture.nativeElement.querySelector('[data-testid="oauth-callback-login"]') as HTMLButtonElement;
    button.click();

    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { redirectTo: '/dashboard' },
    });
  });
});
