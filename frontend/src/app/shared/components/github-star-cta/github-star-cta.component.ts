import { Component } from '@angular/core';
import { GITHUB_REPO_URL } from '../../../core/config/project-links';
import { FaButtonComponent } from '../../ui/button/fa-button.component';

/**
 * Compact end-of-page block that points readers at the public repository.
 * Pages place it after their own navigation blocks; the host is a plain
 * block so each page keeps its own spacing rhythm.
 */
@Component({
    selector: 'app-github-star-cta',
    imports: [FaButtonComponent],
    template: `
    <section class="gh-cta" data-nosnippet aria-label="FrontendAtlas on GitHub">
      <div class="gh-cta__text">
        <p class="gh-cta__title">Built in public</p>
        <p class="gh-cta__copy">
          The code behind FrontendAtlas lives on GitHub. A star helps other frontend engineers find it.
        </p>
      </div>
      <a
        faButton
        variant="neutral"
        size="sm"
        icon="pi pi-github"
        class="gh-cta__action"
        [href]="repoUrl"
        target="_blank"
        rel="noopener noreferrer"
        data-testid="github-star-cta"
      >Star on GitHub</a>
    </section>
  `,
    styleUrl: './github-star-cta.component.css'
})
export class GithubStarCtaComponent {
  readonly repoUrl = GITHUB_REPO_URL;
}
