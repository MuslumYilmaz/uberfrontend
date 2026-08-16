import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ResetPasswordComponent } from './reset-password.component';

describe('ResetPasswordComponent', () => {
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let component: ResetPasswordComponent;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/auth/reset-password#token=fragment-token');
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['confirmPasswordReset']);
    auth.confirmPasswordReset.and.returnValue(of({ ok: true }));

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('captures the fragment token and scrubs it before submitting', () => {
    expect(window.location.hash).toBe('');
    expect(window.location.href).not.toContain('fragment-token');
    component.form.setValue({ password: 'new-secret-456', confirmPassword: 'new-secret-456' });

    component.submit();
    fixture.detectChanges();

    expect(auth.confirmPasswordReset).toHaveBeenCalledWith('fragment-token', 'new-secret-456');
    expect(sessionStorage.getItem('fa:password-reset-token')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="reset-password-success"]')).toBeTruthy();
  });

  it('uses new-password autocomplete for both password fields', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input[type="password"]');
    expect(inputs.length).toBe(2);
    expect(Array.from(inputs).every((input: any) => input.autocomplete === 'new-password')).toBeTrue();
  });
});
