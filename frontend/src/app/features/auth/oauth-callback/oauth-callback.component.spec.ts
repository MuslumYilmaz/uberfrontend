import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { OAuthCallbackComponent } from './oauth-callback.component';

describe('OAuthCallbackComponent', () => {
  let fixture: ComponentFixture<OAuthCallbackComponent>;
  let router: Router;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let authServiceStub: {
    consumeOAuthContext: jasmine.Spy;
    completeOAuthCallback: jasmine.Spy;
  };

  beforeEach(async () => {
    authServiceStub = {
      consumeOAuthContext: jasmine.createSpy('consumeOAuthContext').and.returnValue({
        mode: 'login',
        provider: 'google',
        redirectTo: '/dashboard',
        source: 'direct',
      }),
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
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);

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
          useValue: analytics,
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);

  });

  function createComponent(): void {
    fixture = TestBed.createComponent(OAuthCallbackComponent);
    fixture.detectChanges();
  }

  it('shows a user-friendly callback error and offers a sign-in CTA', () => {
    createComponent();
    const text = fixture.nativeElement.textContent || '';
    expect(text).toContain('We could not finish authentication. Please try again.');

    const button = fixture.nativeElement.querySelector('[data-testid="oauth-callback-login"]');
    expect(button).toBeTruthy();
  });

  it('redirects back to login with the intended destination when CTA is clicked', () => {
    createComponent();
    const button = fixture.nativeElement.querySelector('[data-testid="oauth-callback-login"]') as HTMLButtonElement;
    button.click();

    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { redirectTo: '/dashboard', src: 'direct' },
    });
  });

  it('tracks an OAuth sign-up with the atomically consumed provider and source', () => {
    authServiceStub.consumeOAuthContext.and.returnValue({
      mode: 'signup',
      provider: 'github',
      redirectTo: '/javascript/coding/two-sum',
      source: 'coding_submit',
    });
    authServiceStub.completeOAuthCallback.and.returnValue(of({}));

    createComponent();

    expect(analytics.track).toHaveBeenCalledWith('sign_up', jasmine.objectContaining({
      method: 'github',
      provider: 'github',
      auth_mode: 'signup',
      src: 'coding_submit',
    }));
    expect(router.navigateByUrl).toHaveBeenCalledWith('/javascript/coding/two-sum');
  });

  it('tracks OAuth callback errors with an allowlisted reason and no raw error detail', () => {
    createComponent();

    expect(analytics.track).toHaveBeenCalledWith('auth_submit_failed', jasmine.objectContaining({
      provider: 'google',
      failure_reason: 'unknown',
    }));
    const params = analytics.track.calls.allArgs().find(([name]) => name === 'auth_submit_failed')?.[1] as any;
    expect(params?.error).toBeUndefined();
    expect(params?.email).toBeUndefined();
  });
});
