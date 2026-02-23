import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BugReportService } from '../../../core/services/bug-report.service';
import { BugReportDialogComponent } from './bug-report-dialog.component';

describe('BugReportDialogComponent', () => {
  let fixture: ComponentFixture<BugReportDialogComponent>;
  let bugReport: {
    visible: ReturnType<typeof signal<boolean>>;
    submitting: ReturnType<typeof signal<boolean>>;
    submitOk: ReturnType<typeof signal<boolean>>;
    note: ReturnType<typeof signal<string>>;
    error: ReturnType<typeof signal<string | null>>;
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
    const error = signal<string | null>(null);
    const cooldownSeconds = signal(0);
    bugReport = {
      visible,
      submitting,
      submitOk,
      note,
      error,
      cooldownSeconds,
      canSubmit: computed(() => note().trim().length >= 8 && !submitting() && cooldownSeconds() === 0),
      minNoteChars: 8,
      maxNoteChars: 2000,
      close: jasmine.createSpy('close'),
      submit: jasmine.createSpy('submit').and.resolveTo(),
    };

    await TestBed.configureTestingModule({
      imports: [BugReportDialogComponent, NoopAnimationsModule],
      providers: [{ provide: BugReportService, useValue: bugReport }],
    }).compileComponents();

    fixture = TestBed.createComponent(BugReportDialogComponent);
    fixture.detectChanges();
  });

  it('disables submit button when note is empty and enables when note has content', () => {
    const getSendBtn = () => {
      const buttons = Array.from(document.body.querySelectorAll('.bug-btn--primary')) as HTMLButtonElement[];
      return buttons.length ? buttons[buttons.length - 1] : null;
    };

    expect(getSendBtn()).toBeTruthy();
    expect(getSendBtn()!.disabled).toBeTrue();

    bugReport.note.set('Bug details');
    fixture.detectChanges();

    expect(getSendBtn()!.disabled).toBeFalse();
  });
});
