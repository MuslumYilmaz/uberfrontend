import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../core/services/seo.service';
import { FaCardComponent } from '../../../shared/ui/card/fa-card.component';
import { RESEARCH_REPORTS } from '../research-reports';
import { RESEARCH_HUB_DESCRIPTION, RESEARCH_HUB_TITLE, buildResearchHubSeo } from '../research-seo';

@Component({
  selector: 'app-research-hub',
  imports: [RouterLink, FaCardComponent],
  templateUrl: './research-hub.component.html',
  styleUrl: './research-hub.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchHubComponent implements OnInit {
  private readonly seo = inject(SeoService);

  readonly title = RESEARCH_HUB_TITLE;
  readonly description = RESEARCH_HUB_DESCRIPTION;
  readonly reports = RESEARCH_REPORTS;

  ngOnInit(): void {
    this.seo.updateTags(buildResearchHubSeo(this.seo));
  }
}
