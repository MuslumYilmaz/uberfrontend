import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BugReportService } from '../../../core/services/bug-report.service';
import {
  TurnstileChallengeComponent,
  TurnstileChallengeState,
} from '../turnstile-challenge/turnstile-challenge.component';
import { BugReportDialogComponent } from './bug-report-dialog.component';

@Component({
  selector: 'app-turnstile-challenge',
  standalone: true,
  imports: [CommonModule],
  template: '',
})
class TurnstileChallengeStubComponent {
  @Input({ required: true }) action!: 'contact' | 'bug_report';
  @Input() active = false;
  @Output() tokenChange = new EventEmitter<string>();
  @Output() stateChange = new EventEmitter<TurnstileChallengeState>();

  reset = jasmine.createSpy('reset');
}

describe('BugReportDialogComponent', () => {
  let fixture: ComponentFixture<BugReportDialogComponent>;
  let challenge: TurnstileChallengeStubComponent;
  let bugReport: {
    visible: ReturnType<typeof signal<boolean>>;
    submitting: ReturnType<typeof signal<boolean>>;
    submitOk: ReturnType<typeof signal<boolean>>;
    note: ReturnType<typeof signal<string>>;
    verificationToken: ReturnType<typeof signal<string>>;
    website: ReturnType<typeof signal<string>>;
    error: ReturnType<typeof signal<string | null>>;
    supportFallbackVisible: ReturnType<typeof signal<boolean>>;
    cooldownSeconds: ReturnType<typeof signal<number>>;
    canSubmit: ReturnType<typeof computed>;
    minNoteChars: number;
    maxNoteChars: number;
    close: jasmine.Spy;
    submit: jasmine.Spy;
  };

  beforeEach(async () => {
    const visible = signal(true);
    const submitting = signal(false);
    const submitOk = signal(false);
    const note = signal('');
    const verificationToken = signal('');
    const website = signal('');
    const error = signal<string | null>(null);
    const supportFallbackVisible = signal(false);
    const cooldownSeconds = signal(0);
    bugReport = {
      visible,
      submitting,
      submitOk,
      note,
      verificationToken,
      website,
      error,
      supportFallbackVisible,
      cooldownSeconds,
      canSubmit: computed(() => (
        note().trim().length >= 8
        && verificationToken().length > 0
        && !submitting()
        && cooldownSeconds() === 0
      )),
      minNoteChars: 8,
      maxNoteChars: 2000,
      close: jasmine.createSpy('close'),
      submit: jasmine.createSpy('submit').and.resolveTo(),
    };

    await TestBed.configureTestingModule({
      imports: [BugReportDialogComponent, NoopAnimationsModule],
      providers: [{ provide: BugReportService, useValue: bugReport }],
    })
      .overrideComponent(BugReportDialogComponent, {
        remove: { imports: [TurnstileChallengeComponent] },
        add: { imports: [TurnstileChallengeStubComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(BugReportDialogComponent);
    fixture.detectChanges();
    challenge = fixture.debugElement.query(By.directive(TurnstileChallengeStubComponent)).componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('requires a valid note and a fresh Turnstile token before enabling submit', () => {
    const getSendButton = () => {
      const buttons = Array.from(document.body.querySelectorAll('.bug-btn--primary')) as HTMLButtonElement[];
      return buttons.length ? buttons[buttons.length - 1] : null;
    };

    expect(challenge.action).toBe('bug_report');
    expect(challenge.active).toBeTrue();
    expect(getSendButton()).toBeTruthy();
    expect(getSendButton()!.disabled).toBeTrue();

    bugReport.note.set('Bug details');
    fixture.detectChanges();
    expect(getSendButton()!.disabled).toBeTrue();

    challenge.tokenChange.emit('fresh-token');
    fixture.detectChanges();

    expect(bugReport.verificationToken()).toBe('fresh-token');
    expect(getSendButton()!.disabled).toBeFalse();
  });

  it('resets the challenge after a backend attempt', async () => {
    bugReport.note.set('The dashboard controls overlap.');
    challenge.tokenChange.emit('fresh-token');
    fixture.detectChanges();

    await fixture.componentInstance.submit();

    expect(bugReport.submit).toHaveBeenCalledOnceWith('The dashboard controls overlap.');
    expect(challenge.reset).toHaveBeenCalledTimes(1);
  });

  it('blocks reentrant submits while a request is in flight', async () => {
    bugReport.submitting.set(true);

    await fixture.componentInstance.submit();

    expect(bugReport.submit).not.toHaveBeenCalled();
    expect(challenge.reset).not.toHaveBeenCalled();
  });

  it('shows an accessible email fallback when verification expires or fails', () => {
    challenge.tokenChange.emit('soon-to-expire');
    challenge.tokenChange.emit('');
    challenge.stateChange.emit('expired');
    fixture.detectChanges();

    const alert = document.body.querySelector('.bug-verification-error');
    const link = document.body.querySelector(
      '.bug-support-fallback a[href="mailto:support@frontendatlas.com"]'
    );

    expect(bugReport.verificationToken()).toBe('');
    expect(alert?.getAttribute('role')).toBe('alert');
    expect(alert?.textContent).toContain('expired');
    expect(link).toBeTruthy();
  });

  it('shows the email fallback for a backend protection outage', () => {
    bugReport.supportFallbackVisible.set(true);
    fixture.detectChanges();

    const link = document.body.querySelector(
      '.bug-support-fallback a[href="mailto:support@frontendatlas.com"]'
    );
    expect(link).toBeTruthy();
  });

  it('keeps the honeypot outside keyboard and accessibility navigation', () => {
    const honeypot = document.body.querySelector('.bug-honeypot') as HTMLInputElement | null;

    expect(honeypot).toBeTruthy();
    expect(honeypot!.getAttribute('aria-hidden')).toBe('true');
    expect(honeypot!.tabIndex).toBe(-1);
    expect(honeypot!.autocomplete).toBe('off');

    honeypot!.value = 'bot.example';
    honeypot!.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(bugReport.website()).toBe('bot.example');
  });
});
