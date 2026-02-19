import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { BugReportService } from '../../../core/services/bug-report.service';

@Component({
  selector: 'app-bug-report-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    FormsModule,
    InputTextareaModule,
    ButtonModule,
  ],
  templateUrl: './bug-report-dialog.component.html',
  styleUrls: ['./bug-report-dialog.component.css'],
})
export class BugReportDialogComponent {
  constructor(public bugReport: BugReportService) { }

  onVisibleChange(nextVisible: boolean): void {
    if (nextVisible) return;
    this.bugReport.close();
  }

  onNoteChange(value: string): void {
    this.bugReport.note.set(value ?? '');
  }

  async submit(): Promise<void> {
    await this.bugReport.submit(this.bugReport.note());
  }
}
