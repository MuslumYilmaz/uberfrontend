import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { SignupComponent } from './signup.component';

describe('SignupComponent analytics', () => {
  let fixture: ComponentFixture<SignupComponent>;
  let component: SignupComponent;
  let auth: jasmine.SpyObj<AuthService>;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let router: Router;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['signup', 'oauthStart']);
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

  it('emits standard sign_up without sending form PII', () => {
    auth.signup.and.returnValue(of({} as any));
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
});
