import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { VerifyEmailComponent } from './verify-email.component';

describe('VerifyEmailComponent', () => {
  let fixture: ComponentFixture<VerifyEmailComponent>;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    sessionStorage.clear();
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['ensureMe', 'confirmEmailVerification']);
    auth.ensureMe.and.returnValue(of({ _id: 'user-1' } as any));
    auth.confirmEmailVerification.and.returnValue(of({
      ok: true,
      user: { _id: 'user-1', emailVerified: true } as any,
    }));

    await TestBed.configureTestingModule({
      imports: [VerifyEmailComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).compileComponents();
  });

  afterEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, document.title, '/');
  });

  it('captures the fragment token, scrubs it immediately, and confirms for the signed-in user', () => {
    window.history.replaceState({}, document.title, '/verify-email#token=secret-token');
    fixture = TestBed.createComponent(VerifyEmailComponent);
    fixture.detectChanges();

    expect(window.location.hash).toBe('');
    expect(auth.confirmEmailVerification).toHaveBeenCalledWith('secret-token');
    expect(sessionStorage.getItem('fa:email-verification-token')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="verify-email-success"]')).toBeTruthy();
  });

  it('does not call the API when the link has no token', () => {
    window.history.replaceState({}, document.title, '/verify-email');
    fixture = TestBed.createComponent(VerifyEmailComponent);
    fixture.detectChanges();

    expect(auth.confirmEmailVerification).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[data-testid="verify-email-error"]')?.textContent || '')
      .toContain('missing');
  });

  it('keeps the token and returns to login when replacement-session finalization needs authentication', () => {
    sessionStorage.setItem('fa:email-verification-token', 'retry-token');
    auth.confirmEmailVerification.and.returnValue(throwError(() => ({
      status: 401,
      error: { code: 'AUTH_INVALID', error: 'Invalid or expired token' },
    })));
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(VerifyEmailComponent);
    fixture.detectChanges();

    expect(sessionStorage.getItem('fa:email-verification-token')).toBe('retry-token');
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { redirectTo: '/verify-email' },
    });
  });

  it('keeps a leased finalization token retryable instead of treating it as invalid', () => {
    sessionStorage.setItem('fa:email-verification-token', 'leased-token');
    auth.confirmEmailVerification.and.returnValue(throwError(() => ({
      status: 409,
      error: {
        code: 'EMAIL_VERIFICATION_PENDING',
        error: 'Email change session finalization is already in progress.',
      },
    })));

    fixture = TestBed.createComponent(VerifyEmailComponent);
    fixture.detectChanges();

    expect(sessionStorage.getItem('fa:email-verification-token')).toBe('leased-token');
    expect(fixture.componentInstance.canRetry()).toBeTrue();
  });
});
