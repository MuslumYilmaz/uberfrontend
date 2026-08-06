import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { LoginRequiredDialogComponent } from './login-required-dialog.component';

describe('LoginRequiredDialogComponent', () => {
  let fixture: ComponentFixture<LoginRequiredDialogComponent>;
  let component: LoginRequiredDialogComponent;
  let router: Router;
  let analytics: jasmine.SpyObj<AnalyticsService>;

  beforeEach(async () => {
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    await TestBed.configureTestingModule({
      imports: [LoginRequiredDialogComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analytics },
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

    expect(analytics.track.calls.allArgs().filter(([name]) => name === 'auth_prompt_shown')).toHaveSize(1);
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
});
