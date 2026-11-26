import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../core/services/seo.service';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';
import { ONPUSH_READINESS_REPORT } from '../research-reports';
import { buildResearchReportSeo } from '../research-seo';

@Component({
  selector: 'app-onpush-readiness-report',
  imports: [GuideShellComponent, RouterLink],
  templateUrl: './onpush-readiness-report.component.html',
  styleUrl: './onpush-readiness-report.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnpushReadinessReportComponent implements OnInit {
  private readonly seo = inject(SeoService);

  readonly title = ONPUSH_READINESS_REPORT.title;
  readonly lead = ONPUSH_READINESS_REPORT.lead;
  readonly minutes = ONPUSH_READINESS_REPORT.minutes;
  readonly tags = ['Research', 'Angular 22', 'OnPush'];

  ngOnInit(): void {
    this.seo.updateTags(buildResearchReportSeo(this.seo, ONPUSH_READINESS_REPORT));
  }
}
