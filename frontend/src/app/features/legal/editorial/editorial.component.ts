import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-editorial-policy',
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="doc" aria-labelledby="doc-title">
      <header class="doc-header">
        <div class="doc-meta">
          <span class="pill">Policy</span>
          <span class="pill pill-blue">Editorial</span>
        </div>
        <h1 id="doc-title">Editorial Policy</h1>
        <p class="muted">Last updated: {{ lastUpdated }}</p>
      </header>

      <p class="lede">
        FrontendAtlas is built for interview preparation and real-world frontend practice. This policy
        explains how we create, review, and maintain learning content so readers can trust what they see.
      </p>

      <nav class="toc" aria-label="Table of contents">
        <h2 class="toc-title">Contents</h2>
        <ol>
          <li><a [routerLink]="[]" fragment="scope">Scope</a></li>
          <li><a [routerLink]="[]" fragment="sources">Sources &amp; research</a></li>
          <li><a [routerLink]="[]" fragment="workflow">Creation workflow</a></li>
          <li><a [routerLink]="[]" fragment="review">Review &amp; updates</a></li>
          <li><a [routerLink]="[]" fragment="corrections">Corrections</a></li>
          <li><a [routerLink]="[]" fragment="ownership">Authorship &amp; accountability</a></li>
          <li><a [routerLink]="[]" fragment="contact">Contact</a></li>
        </ol>
      </nav>

      <section id="scope">
        <h2>1. Scope</h2>
        <p>
          This policy applies to all question prompts, explanations, guides, and premium previews on
          FrontendAtlas. Our focus is on frontend engineering: HTML, CSS, JavaScript, frameworks, and
          frontend system design.
        </p>
      </section>

      <section id="sources">
        <h2>2. Sources &amp; research</h2>
        <p>
          We use a mix of official documentation, specifications, and field experience to author content.
          Where a topic is evolving, we aim to describe stable, widely-accepted practices rather than
          short-lived trends.
        </p>
        <ul>
          <li>Primary sources: official docs (MDN, framework docs), specs, and browser standards.</li>
          <li>Secondary sources: community references when primary sources are insufficient.</li>
          <li>We avoid copy/paste from third-party content; explanations are original and context-specific.</li>
        </ul>
      </section>

      <section id="workflow">
        <h2>3. Creation workflow</h2>
        <p>Each item follows a consistent authoring flow designed for clarity and interview relevance:</p>
        <ul>
          <li>Define the learning objective and expected interview signal.</li>
          <li>Draft the prompt and a reference answer/solution outline.</li>
          <li>Validate with real usage scenarios and common pitfalls.</li>
          <li>Ensure consistency across similar topics and frameworks.</li>
        </ul>
      </section>

      <section id="review">
        <h2>4. Review &amp; updates</h2>
        <p>
          We periodically review content for accuracy, clarity, and relevance. When we make meaningful
          changes, we update the page metadata and publish the new "Last updated" date.
        </p>
        <ul>
          <li>High-impact topics (core JS, HTML, CSS) are reviewed more frequently.</li>
          <li>Framework-specific content is updated when APIs or best practices shift.</li>
          <li>Premium previews are curated to prevent solution leakage while still teaching effectively.</li>
        </ul>
      </section>

      <section id="corrections">
        <h2>5. Corrections</h2>
        <p>
          If you spot an issue, let us know. We prioritize corrections that affect accuracy,
          safety, or learner outcomes.
        </p>
        <ul>
          <li>Report errors with a short description and the page URL.</li>
          <li>We acknowledge critical issues and aim to correct them promptly.</li>
          <li>Minor wording improvements are bundled into regular content updates.</li>
        </ul>
      </section>

      <section id="ownership">
        <h2>6. Authorship &amp; accountability</h2>
        <p>
          Content is produced and maintained by the <strong>FrontendAtlas Team</strong>. We own the
          editorial decisions, and we use internal review to keep the material consistent and reliable.
        </p>
      </section>

      <section id="contact" class="doc-footer">
        <h2>7. Contact</h2>
        <p>
          Questions or corrections? Email us at
          <a href="mailto:support@frontendatlas.com">support&#64;frontendatlas.com</a>.
        </p>
        <p class="tiny">
          For legal questions, see our
          <a [routerLink]="['/legal/terms']">Terms</a> and
          <a [routerLink]="['/legal/privacy']">Privacy Notice</a>.
        </p>
      </section>
    </article>
  `,
  styles: [`
    :host { display: block; background: radial-gradient(circle at 12% 18%, color-mix(in srgb, var(--uf-accent) 10%, transparent), transparent 38%), var(--uf-bg); }
    .doc {
      max-width: 920px;
      margin: 32px auto 48px;
      padding: 24px 20px 24px;
      color: var(--uf-text-primary);
      font-size: 15px;
      line-height: 1.65;
      background: linear-gradient(145deg, color-mix(in srgb, var(--uf-surface-alt) 92%, var(--uf-surface)), color-mix(in srgb, var(--uf-surface) 88%, var(--uf-surface-alt)));
      border: 1px solid var(--uf-border-subtle);
      border-radius: var(--uf-card-radius);
      box-shadow: var(--uf-card-shadow-strong);
    }
    .doc-header h1 {
      font-size: clamp(22px, 3.4vw, 30px);
      margin: 0 0 4px;
      font-weight: 800;
      color: var(--uf-text-primary);
    }
    .doc-meta {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      padding: 6px 12px;
      border-radius: var(--uf-radius-pill);
      border: 1px solid var(--uf-border-subtle);
      background: color-mix(in srgb, var(--uf-text-primary) 6%, var(--uf-surface));
      color: color-mix(in srgb, var(--uf-text-secondary) 85%, transparent);
      font-size: 11px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      font-weight: 700;
    }
    .pill-blue {
      background: color-mix(in srgb, var(--uf-accent) 18%, var(--uf-surface));
      border-color: color-mix(in srgb, var(--uf-accent) 40%, var(--uf-border-subtle));
      color: var(--uf-text-primary);
    }
    .muted { color: color-mix(in srgb, var(--uf-text-tertiary) 75%, transparent); margin: 0 0 16px; font-size: 13px; }
    .lede { color: color-mix(in srgb, var(--uf-text-secondary) 85%, transparent); margin-bottom: 16px; }
    .toc {
      background: var(--uf-surface);
      border: 1px solid var(--uf-border-subtle);
      border-radius: var(--uf-radius-12);
      padding: 12px 14px;
      margin: 16px 0 20px;
      box-shadow: var(--uf-card-shadow);
    }
    .toc-title {
      font-size: 14px;
      margin: 0 0 8px;
      color: color-mix(in srgb, var(--uf-text-secondary) 85%, transparent);
      font-weight: 700;
    }
    .toc ol {
      margin: 0;
      padding-left: 18px;
      display: grid;
      gap: 6px;
    }
    .toc a {
      color: var(--uf-accent);
      text-decoration: none;
      border-bottom: 1px dashed color-mix(in srgb, var(--uf-accent) 50%, transparent);
    }
    .toc a:hover { color: var(--uf-accent-strong); border-color: color-mix(in srgb, var(--uf-accent-strong) 65%, transparent); }
    h2 {
      font-size: 18px;
      margin: 24px 0 8px;
      font-weight: 800;
      color: var(--uf-text-primary);
    }
    p { margin: 0 0 10px; color: color-mix(in srgb, var(--uf-text-secondary) 85%, transparent); }
    ul { margin: 0 0 10px; padding-left: 18px; color: color-mix(in srgb, var(--uf-text-secondary) 85%, transparent); }
    li { margin: 4px 0; }
    html { scroll-behavior: smooth; }
    section[id] { scroll-margin-top: 80px; }
    .doc-footer {
      margin-top: 24px;
      border-top: 1px solid var(--uf-border-subtle);
      padding-top: 12px;
      color: color-mix(in srgb, var(--uf-text-tertiary) 80%, transparent);
    }
    .doc-footer a {
      color: var(--uf-accent);
      text-decoration: none;
      border-bottom: 1px dashed color-mix(in srgb, var(--uf-accent) 50%, transparent);
    }
    .doc-footer a:hover { color: var(--uf-accent-strong); border-color: color-mix(in srgb, var(--uf-accent-strong) 65%, transparent); }
    .tiny { font-size: 12px; color: color-mix(in srgb, var(--uf-text-tertiary) 80%, transparent); margin-top: 6px; }
  `]
})
export class EditorialPolicyComponent {
  readonly lastUpdated = '2026-01-30';
}
