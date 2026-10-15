import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { CompanyOfficialGuide } from '../../company-previews/company-official-guides';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A table of preparation pages a company publishes itself. Renders nothing when the company has none. */
@Component({
  selector: 'app-company-official-guides',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './company-official-guides.component.html',
  styleUrl: './company-official-guides.component.css',
})
export class CompanyOfficialGuidesComponent {
  @Input() slug = '';
  @Input() companyLabel = '';
  @Input() guides: readonly CompanyOfficialGuide[] = [];

  get headingId(): string {
    return `${this.slug || 'company'}-official-guides`;
  }

  formatChecked(day: string): string {
    const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(day);
    if (!match) return day;
    const month = MONTHS[Number(match[2]) - 1];
    return month ? `${month} ${match[1]}` : day;
  }
}
