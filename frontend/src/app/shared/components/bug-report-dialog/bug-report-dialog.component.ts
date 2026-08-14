import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { BugReportService } from '../../../core/services/bug-report.service';
import {
  TurnstileChallengeComponent,
  TurnstileChallengeState,
} from '../turnstile-challenge/turnstile-challenge.component';

@Component({
  selector: 'app-bug-report-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    FormsModule,
    InputTextareaModule,
    ButtonModule,
    TurnstileChallengeComponent,
  ],
  templateUrl: './bug-report-dialog.component.html',
  styleUrls: ['./bug-report-dialog.component.css'],
})
export class BugReportDialogComponent {
  @ViewChild('turnstileChallenge')
  private turnstileChallenge?: TurnstileChallengeComponent;

  readonly supportEmail = 'support@frontendatlas.com';
  challengeState: TurnstileChallengeState = 'idle';
  challengeMessage: string | null = null;
  challengeSupportFallback = false;

  constructor(public bugReport: BugReportService) { }

  onVisibleChange(nextVisible: boolean): void {
    if (nextVisible) return;
    this.bugReport.close();
  }

  onNoteChange(value: string): void {
    this.bugReport.note.set(value ?? '');
  }

  onWebsiteChange(value: string): void {
    this.bugReport.website.set(value ?? '');
  }

  onTokenChange(token: string): void {
    this.bugReport.verificationToken.set(token ?? '');
    if (token) {
      this.challengeMessage = null;
      this.challengeSupportFallback = false;
    }
  }

  onChallengeStateChange(state: TurnstileChallengeState): void {
    this.challengeState = state;

    if (state === 'expired') {
      this.challengeMessage = 'The verification check expired. Please complete it again.';
      this.challengeSupportFallback = true;
      return;
    }

    if (state === 'error') {
      this.challengeMessage = 'The verification check could not load. Please email support if it does not recover.';
      this.challengeSupportFallback = true;
      return;
    }

    if (state === 'idle' || state === 'loading' || state === 'ready' || state === 'verified') {
      this.challengeMessage = null;
      this.challengeSupportFallback = false;
    }
  }

  async submit(): Promise<void> {
    if (this.bugReport.submitting()) return;

    try {
      await this.bugReport.submit(this.bugReport.note());
    } finally {
      this.turnstileChallenge?.reset();
    }
  }
}
