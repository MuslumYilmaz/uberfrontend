import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ForgotPasswordComponent } from './forgot-password.component';

describe('ForgotPasswordComponent', () => {
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let component: ForgotPasswordComponent;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['requestPasswordReset']);
    auth.requestPasswordReset.and.returnValue(of({ ok: true }));

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('submits a normalized email and shows only the generic accepted message', () => {
    component.form.controls.email.setValue('  person@example.com  ');
    component.submit();
    fixture.detectChanges();

    expect(auth.requestPasswordReset).toHaveBeenCalledWith('person@example.com');
    expect(fixture.nativeElement.querySelector('[data-testid="forgot-password-success"]')?.textContent)
      .toContain('If an account matches');
  });

  it('uses email autocomplete and an associated label', () => {
    const input = fixture.nativeElement.querySelector('#forgot-password-email') as HTMLInputElement;
    const label = fixture.nativeElement.querySelector('label[for="forgot-password-email"]');
    expect(input.autocomplete).toBe('email');
    expect(label).toBeTruthy();
  });
});
