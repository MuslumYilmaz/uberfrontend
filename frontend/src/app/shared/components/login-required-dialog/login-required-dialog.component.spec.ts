import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequiredDialogComponent } from './login-required-dialog.component';

describe('LoginRequiredDialogComponent', () => {
  let fixture: ComponentFixture<LoginRequiredDialogComponent>;
  let component: LoginRequiredDialogComponent;
  let router: Router;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['oauthStart']);
    await TestBed.configureTestingModule({
      imports: [LoginRequiredDialogComponent],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analytics },
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(LoginRequiredDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('context', 'coding_submit');
    fixture.componentRef.setInput('redirectTo', '/javascript/coding/two-sum');
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
  });

  afterEach(() => document.querySelectorAll('.p-dialog-mask').forEach((node) => node.remove()));

  it('tracks one prompt view and routes the primary action to sign up', () => {
    component.choose('sign_up');

    expect(analytics.track.calls.allArgs().filter(([name]) => name === 'auth_prompt')).toHaveSize(1);
    expect(analytics.track).toHaveBeenCalledWith('auth_prompt_action', jasmine.objectContaining({
      prompt_context: 'coding_submit',
      auth_action: 'sign_up',
    }));
    expect(router.navigate).toHaveBeenCalledWith(['/auth/signup'], {
      queryParams: {
        redirectTo: '/javascript/coding/two-sum',
        src: 'coding_submit',
      },
    });
  });

  it('routes the secondary action to sign in with the same context', () => {
    component.choose('login');

    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: {
        redirectTo: '/javascript/coding/two-sum',
        src: 'coding_submit',
      },
    });
  });

  it('offers direct provider and email actions only when the v2 input is enabled', () => {
    fixture.componentRef.setInput('directAuthActions', true);
    fixture.componentRef.setInput('context', 'pricing_checkout');
    fixture.componentRef.setInput('redirectTo', '/pricing');
    fixture.componentRef.setInput('offerVersion', 'interview_sprint_v2');
    fixture.componentRef.setInput('checkoutSurface', 'overlay');
    fixture.detectChanges();

    expect(document.querySelector('[data-testid="login-required-google"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="login-required-github"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="login-required-email-signup"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="login-required-email-login"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="login-required-signup"]')).toBeFalsy();
  });

  it('keeps the two-button prompt, with no plan or purchase lines, outside the pricing account step', () => {
    for (const testId of ['login-required-kicker', 'login-required-reason', 'login-required-assurance']) {
      expect(document.querySelector(`[data-testid="${testId}"]`)).withContext(testId).toBeNull();
    }
    expect(document.querySelector('.auth-prompt__icon')).toBeTruthy();
    expect(document.querySelector('[data-testid="login-required-login"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="login-required-signup"]')).toBeTruthy();
  });

  it('lays out the pricing account step: plan and price above the title, three ways in, a sign-in link, the reason and the terms', () => {
    fixture.componentRef.setInput('directAuthActions', true);
    fixture.componentRef.setInput('context', 'pricing_checkout');
    fixture.componentRef.setInput('redirectTo', '/pricing');
    fixture.componentRef.setInput('title', 'One step before checkout');
    fixture.componentRef.setInput('accountStep', {
      kicker: 'Step 1 of 2 · Quarterly · $49 USD today',
      reason: 'Why an account first: your Premium access, saved plan and solved tasks attach to it.',
      assurance: '14-day refund on your first purchase, no usage test. Secure checkout by Lemon Squeezy. Taxes included.',
    });
    fixture.detectChanges();

    const text = (testId: string) => (document.querySelector(`[data-testid="${testId}"]`)?.textContent || '').replace(/\s+/g, ' ').trim();
    expect(text('login-required-kicker')).toBe('Step 1 of 2 · Quarterly · $49 USD today');
    const kicker = document.querySelector('[data-testid="login-required-kicker"]') as HTMLElement;
    const title = document.querySelector('[data-testid="login-required-title"]') as HTMLElement;
    expect(kicker.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.querySelector('.auth-prompt__icon')).toBeNull();

    const actions = document.querySelector('[data-testid="login-required-direct-actions"]') as HTMLElement;
    expect(Array.from(actions.querySelectorAll('button[faButton]')).map((button) => button.getAttribute('data-testid'))).toEqual([
      'login-required-google',
      'login-required-github',
      'login-required-email-signup',
    ]);
    // Signing in with an existing account reads as a link and keeps its route and analytics.
    const signIn = document.querySelector('[data-testid="login-required-email-login"]') as HTMLButtonElement;
    expect(signIn.hasAttribute('faButton')).toBeFalse();
    expect((signIn.closest('p')?.textContent || '').replace(/\s+/g, ' ').trim()).toBe('Already have an account? Sign in');
    expect(text('login-required-reason')).toBe('Why an account first: your Premium access, saved plan and solved tasks attach to it.');
    expect(text('login-required-assurance')).toContain('14-day refund on your first purchase, no usage test.');
    expect(actions.textContent || '').toContain('By continuing, you agree to the Terms');

    signIn.click();
    expect(analytics.track).toHaveBeenCalledWith('auth_prompt_action', jasmine.objectContaining({
      prompt_context: 'pricing_checkout',
      auth_action: 'login',
    }));
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { redirectTo: '/pricing', src: 'pricing_checkout' },
    });
  });

  it('starts OAuth directly while preserving the checkout return and analytics context', () => {
    fixture.componentRef.setInput('directAuthActions', true);
    fixture.componentRef.setInput('context', 'pricing_checkout');
    fixture.componentRef.setInput('redirectTo', '/pricing');
    fixture.componentRef.setInput('offerVersion', 'interview_sprint_v2');
    fixture.componentRef.setInput('checkoutSurface', 'overlay');
    fixture.detectChanges();

    component.chooseOAuth('github');

    expect(auth.oauthStart).toHaveBeenCalledWith('github', 'signup', '/pricing', 'pricing_checkout');
    expect(analytics.track).toHaveBeenCalledWith('auth_prompt_action', jasmine.objectContaining({
      prompt_context: 'pricing_checkout',
      auth_action: 'github',
      offer_version: 'interview_sprint_v2',
      checkout_surface: 'overlay',
    }));
  });
});
