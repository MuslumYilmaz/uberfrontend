import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type {
  CompanyInterviewProcess,
  InterviewProcessSource,
  InterviewProcessStage,
} from '../../company-previews/company-interview-processes';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The interview stages a company's official pages and public reports describe. Renders nothing without data. */
@Component({
  selector: 'app-company-interview-process',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './company-interview-process.component.html',
  styleUrl: './company-interview-process.component.css',
})
export class CompanyInterviewProcessComponent {
  @Input() slug = '';
  @Input() companyLabel = '';
  @Input() process: CompanyInterviewProcess | null = null;

  get headingId(): string {
    return `${this.slug || 'company'}-interview-process`;
  }

  heading(process: CompanyInterviewProcess): string {
    return process.title || `${this.companyLabel} frontend interview process`;
  }

  variantId(index: number): string {
    return `${this.headingId}-${index + 1}`;
  }

  formatMonth(value: string): string {
    const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(value);
    if (!match) return value;
    const month = MONTHS[Number(match[2]) - 1];
    return month ? `${month} ${match[1]}` : value;
  }

  /** How strong the evidence for a stage is: an official page, several reports, or a single account. */
  evidenceLabel(stage: InterviewProcessStage): string {
    const reports = stage.sources.filter((source) => source.kind === 'report');
    const official = stage.sources.length - reports.length;
    const years = reports.map((source) => source.date.slice(0, 4)).sort();
    const span = years.length ? (years[0] === years[years.length - 1] ? years[0] : `${years[0]}–${years[years.length - 1]}`) : '';

    if (official) {
      if (!reports.length) return 'Official page';
      return `Official page and ${reports.length === 1 ? 'one report' : `${reports.length} reports`}`;
    }
    return reports.length === 1 ? `One public report, ${span}` : `${reports.length} public reports, ${span}`;
  }

  /** Reports carry their month in the link text so several links from one site stay distinguishable. */
  sourceText(source: InterviewProcessSource): string {
    return source.kind === 'report' ? `${source.label}, ${this.formatMonth(source.date)}` : source.label;
  }

  rel(source: InterviewProcessSource): string {
    return source.kind === 'report' ? 'noopener noreferrer nofollow' : 'noopener noreferrer';
  }
}
