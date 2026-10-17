import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_FOOTER_GROUPS, SITE_FOOTER_LEGAL_LINKS, SiteFooterLink } from '../../../core/content/site-footer';
import { AnalyticsService } from '../../../core/services/analytics.service';

/**
 * Site-wide footer rendered by the app shell on public pages. It is static
 * content from `core/content/site-footer.json`: identical on the server and in
 * the browser, so hydration never has to reconcile it. The fixed practice bar
 * (`app-footer`) on trivia and system-design detail pages stays as it is; this
 * component only adds bottom padding there so the bar does not cover its last row.
 */
@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooterComponent {
  @Input() withPracticeBar = false;
  /** Rendered inside a page's own scroll panel (trivia detail) rather than after <main>. */
  @Input() embedded = false;

  readonly groups = SITE_FOOTER_GROUPS;
  readonly legal = SITE_FOOTER_LEGAL_LINKS;

  private readonly analytics = inject(AnalyticsService, { optional: true });

  trackClick(link: SiteFooterLink, group: string): void {
    this.analytics?.track('footer_link_clicked', {
      group,
      label: link.label,
      destination: link.route || link.href || '',
    });
  }
}
