import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent analytics', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let auth: jasmine.SpyObj<AuthService>;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let router: Router;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'oauthStart']);
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
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
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('names the company plan the person came from, and stays quiet for any other way in', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[data-testid="login-plan-note"]')).toBeNull();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: AnalyticsService, useValue: analytics },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ redirectTo: '/companies/preview?companies=agoda&when=tomorrow&level=junior' }),
            },
          },
        },
      ],
    });
    const planFixture = TestBed.createComponent(LoginComponent);
    planFixture.detectChanges();
    const note = (planFixture.nativeElement as HTMLElement).querySelector('[data-testid="login-plan-note"]');
    expect(note?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Your Agoda plan will be saved to your account.');
  });

  it('preserves source through password login and emits the standard login event', () => {
    auth.login.and.returnValue(of({} as any));
    component.form.setValue({ email: 'person@example.com', password: 'secret123' });

    component.submit();

    expect(analytics.track).toHaveBeenCalledWith('auth_page_viewed', jasmine.objectContaining({
      auth_mode: 'login',
      src: 'coding_submit',
    }));
    expect(analytics.track).toHaveBeenCalledWith('auth_submit_started', jasmine.objectContaining({
      provider: 'password',
      src: 'coding_submit',
    }));
    expect(analytics.track).toHaveBeenCalledWith('login', jasmine.objectContaining({
      method: 'password',
      src: 'coding_submit',
    }));
    expect(router.navigateByUrl).toHaveBeenCalledWith('/javascript/coding/two-sum');

    const trackedParams = analytics.track.calls.allArgs().map(([, params]) => params as any);
    expect(trackedParams.some((params) => params?.email || params?.password)).toBeFalse();
  });

  it('passes analytics source into OAuth and allowlists password failures', () => {
    component.continueWithGithub();
    expect(auth.oauthStart).toHaveBeenCalledWith(
      'github',
      'login',
      '/javascript/coding/two-sum',
      'coding_submit',
    );

    auth.login.and.returnValue(throwError(() => ({ status: 401, error: { error: 'Invalid credentials' } })));
    component.form.setValue({ email: 'person@example.com', password: 'wrong-password' });
    component.submit();

    expect(analytics.track).toHaveBeenCalledWith('auth_submit_failed', jasmine.objectContaining({
      failure_reason: 'invalid_credentials',
      src: 'coding_submit',
    }));
  });
});
