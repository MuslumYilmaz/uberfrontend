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
    styles: [`
    :host { display: block; }

    .gh-cta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: var(--uf-space-3);
      padding: 14px 16px;
      border: 1px solid var(--uf-border-subtle);
      border-radius: var(--uf-radius-12);
      background: color-mix(in srgb, var(--uf-text-primary) 4%, var(--uf-surface));
    }

    .gh-cta__text {
      flex: 1 1 260px;
      min-width: 0;
      display: grid;
      gap: var(--uf-space-1);
    }

    .gh-cta__title {
      margin: 0;
      font-size: 13px;
      font-weight: 700;
      color: var(--uf-text-primary);
    }

    .gh-cta__copy {
      margin: 0;
      font-size: 13px;
      line-height: 1.5;
      color: var(--uf-text-secondary);
    }

    .gh-cta__action {
      flex: 0 0 auto;
      white-space: nowrap;
    }
  `]
})
export class GithubStarCtaComponent {
  readonly repoUrl = GITHUB_REPO_URL;
}
