import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AchievementAward } from '../../../core/models/gamification.model';
import { AchievementNotificationService } from '../../../core/services/achievement-notification.service';
import { AchievementToastComponent } from './achievement-toast.component';

describe('AchievementToastComponent', () => {
  let fixture: ComponentFixture<AchievementToastComponent>;
  let current: ReturnType<typeof signal<AchievementAward | null>>;
  let notifications: jasmine.SpyObj<AchievementNotificationService>;

  beforeEach(async () => {
    current = signal<AchievementAward | null>({
      id: 'question-builder',
      title: 'Problem Solver',
      reason: 'Solve 10 current-catalog questions.',
      icon: 'code',
      theme: 'cyan',
      current: 10,
      target: 10,
      progress: 1,
      earnedAt: '2026-03-20T10:00:00.000Z',
    });
    notifications = jasmine.createSpyObj<AchievementNotificationService>(
      'AchievementNotificationService',
      ['dismissCurrent'],
      { current },
    );

    await TestBed.configureTestingModule({
      imports: [AchievementToastComponent, RouterTestingModule],
      providers: [
        { provide: AchievementNotificationService, useValue: notifications },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AchievementToastComponent);
    fixture.detectChanges();
  });

  it('renders a non-blocking badge earned toast with route and dismiss controls', () => {
    const page: HTMLElement = fixture.nativeElement;
    const toast = page.querySelector('[data-testid="achievement-toast"]') as HTMLElement | null;
    const action = page.querySelector('.achievement-toast__action') as HTMLAnchorElement | null;
    const close = page.querySelector('.achievement-toast__close') as HTMLButtonElement | null;

    expect(toast).toBeTruthy();
    expect(toast?.getAttribute('role')).toBe('status');
    expect(toast?.getAttribute('aria-live')).toBe('polite');
    expect(toast?.getAttribute('data-theme')).toBe('cyan');
    expect(toast?.getAttribute('data-badge-id')).toBe('question-builder');
    expect(toast?.textContent || '').toContain('Badge earned');
    expect(toast?.textContent || '').toContain('Problem Solver');
    expect(toast?.textContent || '').toContain('Solve 10 current-catalog questions.');
    expect(action?.getAttribute('href') || '').toContain('/profile');
    expect(action?.getAttribute('href') || '').toContain('tab=activity');
    expect(close?.getAttribute('aria-label')).toBe('Dismiss badge notification');

    close?.click();
    expect(notifications.dismissCurrent).toHaveBeenCalled();
  });
});
