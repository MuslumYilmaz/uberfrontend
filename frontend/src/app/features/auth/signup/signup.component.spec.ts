import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { SignupComponent } from './signup.component';

describe('SignupComponent', () => {
  let fixture: ComponentFixture<SignupComponent>;
  let component: SignupComponent;
  let auth: jasmine.SpyObj<AuthService>;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let router: Router;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['signup', 'oauthStart', 'requestEmailVerification']);
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    await TestBed.configureTestingModule({
      imports: [SignupComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: AnalyticsService, useValue: analytics },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({
                redirectTo: '/javascript/coding/two-sum',
                src: 'coding_submit',
              }),
            },
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows one passive legal disclosure that covers OAuth and email signup', () => {
    const host = fixture.nativeElement as HTMLElement;
    const disclosure = host.querySelector('[data-testid="signup-legal-disclosure"]') as HTMLElement | null;
    const terms = host.querySelector('[data-testid="signup-terms-link"]') as HTMLAnchorElement | null;
    const privacy = host.querySelector('[data-testid="signup-privacy-link"]') as HTMLAnchorElement | null;
    const googleButton = host.querySelector('[data-testid="signup-google"]') as HTMLButtonElement | null;
    const disclosureText = (disclosure?.textContent || '').replace(/\s+/g, ' ').trim();

    expect(disclosureText).toContain('Google, GitHub, or email');
    expect(disclosureText).toContain('agree to the Terms of Service');
    expect(disclosureText).toContain('acknowledge the Privacy Notice');
    expect(terms?.getAttribute('href')).toBe('/legal/terms');
    expect(privacy?.getAttribute('href')).toBe('/legal/privacy');
    expect(terms?.getAttribute('target')).toBe('_blank');
    expect(privacy?.getAttribute('target')).toBe('_blank');
    expect(terms?.getAttribute('rel')).toContain('noopener');
    expect(privacy?.getAttribute('rel')).toContain('noopener');
    expect(Boolean(
      disclosure
      && googleButton
      && (disclosure.compareDocumentPosition(googleButton) & Node.DOCUMENT_POSITION_FOLLOWING),
    )).toBeTrue();
    expect(host.querySelector('input[type="checkbox"]')).toBeNull();
  });

  it('keeps the exact password requirement visible and referenced before and after validation', () => {
    const host = fixture.nativeElement as HTMLElement;
    const passwordInput = host.querySelector('[data-testid="signup-password"]') as HTMLInputElement;
    const requirement = host.querySelector('[data-testid="signup-password-requirements"]') as HTMLElement;

    expect(requirement.textContent?.trim()).toBe(
      'Use at least 8 characters, including a letter and a number.',
    );
    expect(passwordInput.getAttribute('aria-describedby')).toBe('signup-password-requirements');

    component.passwordCtrl?.setValue('abcdefgh');
    component.passwordCtrl?.markAsTouched();
    fixture.detectChanges();

    const letterOnlyError = host.querySelector('[data-testid="signup-password-error"]') as HTMLElement;
    expect(component.passwordCtrl?.invalid).toBeTrue();
    expect(letterOnlyError.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Password does not meet the requirement above.',
    );
    expect(passwordInput.getAttribute('aria-describedby')).toBe(
      'signup-password-requirements signup-password-error',
    );

    component.passwordCtrl?.setValue('12345678');
    fixture.detectChanges();
    expect(component.passwordCtrl?.invalid).toBeTrue();

    component.passwordCtrl?.setValue('secret123');
    fixture.detectChanges();
    expect(component.passwordCtrl?.valid).toBeTrue();
    expect(host.querySelector('[data-testid="signup-password-error"]')).toBeNull();
    expect(passwordInput.getAttribute('aria-describedby')).toBe('signup-password-requirements');
    expect(host.querySelector('[data-testid="signup-password-requirements"]')).toBeTruthy();
  });

  it('emits standard sign_up without sending form PII', () => {
    auth.signup.and.returnValue(of({
      user: {} as any,
      accountCreated: true,
      verificationEmailRequired: false,
    }));
    component.form.setValue({
      email: 'person@example.com',
      username: 'person',
      passwords: { password: 'secret123', confirmPassword: 'secret123' },
    });

    component.submit();

    expect(analytics.track).toHaveBeenCalledWith('sign_up', jasmine.objectContaining({
      method: 'password',
      auth_mode: 'signup',
      src: 'coding_submit',
    }));
    const trackedParams = analytics.track.calls.allArgs().map(([, params]) => params as any);
    expect(trackedParams.some((params) => params?.email || params?.username || params?.password)).toBeFalse();
  });

  it('passes source to OAuth and maps identity conflicts to the allowlist', () => {
    component.continueWithGoogle();
    expect(auth.oauthStart).toHaveBeenCalledWith(
      'google',
      'signup',
      '/javascript/coding/two-sum',
      'coding_submit',
    );

    auth.signup.and.returnValue(throwError(() => ({
      status: 409,
      error: { fields: { email: true } },
    })));
    component.form.setValue({
      email: 'person@example.com',
      username: 'person',
      passwords: { password: 'secret123', confirmPassword: 'secret123' },
    });
    component.submit();

    expect(analytics.track).toHaveBeenCalledWith('auth_submit_failed', jasmine.objectContaining({
      failure_reason: 'identity_conflict',
      src: 'coding_submit',
    }));
  });

  it('keeps the created account and offers email retry without resubmitting signup', () => {
    auth.signup.and.returnValue(of({
      user: {} as any,
      accountCreated: true,
      verificationEmailRequired: true,
    }));
    auth.requestEmailVerification.and.returnValue(throwError(() => ({
      status: 503,
      error: { code: 'EMAIL_DELIVERY_FAILED', error: 'Verification email could not be sent.' },
    })));
    component.form.setValue({
      email: 'person@example.com',
      username: 'person',
      passwords: { password: 'secret123', confirmPassword: 'secret123' },
    });

    component.submit();
    fixture.detectChanges();

    expect(component.accountCreated).toBeTrue();
    expect(auth.signup).toHaveBeenCalledTimes(1);
    expect(auth.requestEmailVerification).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('[data-testid="signup-verification-retry"]')).toBeTruthy();

    auth.requestEmailVerification.and.returnValue(of({
      ok: true,
      purpose: 'verify_email',
      expiresAt: new Date().toISOString(),
    }));
    component.retryVerification();

    expect(auth.signup).toHaveBeenCalledTimes(1);
    expect(auth.requestEmailVerification).toHaveBeenCalledTimes(2);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/javascript/coding/two-sum');
  });
});
