import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-terms',
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="doc" aria-labelledby="doc-title">
      <header class="doc-header">
        <div class="doc-meta">
          <span class="pill">Legal</span>
          <span class="pill pill-blue">User agreement</span>
        </div>
        <h1 id="doc-title">Terms of Service</h1>
        <p class="muted">Last updated: {{ today }}</p>
      </header>

      <p class="lede">
        These Terms of Service ("Terms") govern your access to and use of the FrontendAtlas website,
        platform, and related services (“Service”). By using our Service, you agree to comply with these
        Terms and our <a [routerLink]="['/legal/privacy']">Privacy Notice</a>.
      </p>

      <!-- Table of contents -->
      <nav class="toc" aria-label="Table of contents">
        <h2 class="toc-title">Contents</h2>
        <ol>
          <li><a [routerLink]="[]" fragment="acceptance">Acceptance of Terms</a></li>
          <li><a [routerLink]="[]" fragment="eligibility">Eligibility</a></li>
          <li><a [routerLink]="[]" fragment="use-of-service">Use of the Service</a></li>
          <li><a [routerLink]="[]" fragment="content-ownership">Content Ownership</a></li>
          <li><a [routerLink]="[]" fragment="user-content">User Content</a></li>
          <li><a [routerLink]="[]" fragment="intellectual-property">Intellectual Property</a></li>
          <li><a [routerLink]="[]" fragment="disclaimers">Disclaimers</a></li>
          <li><a [routerLink]="[]" fragment="limitation-of-liability">Limitation of Liability</a></li>
          <li><a [routerLink]="[]" fragment="termination">Termination</a></li>
          <li><a [routerLink]="[]" fragment="changes">Changes to These Terms</a></li>
          <li><a [routerLink]="[]" fragment="contact">Contact Us</a></li>
        </ol>
      </nav>

      <!-- Sections -->
      <section id="acceptance">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using the Service, you confirm that you have read, understood, and agree to be
          bound by these Terms, as well as any additional terms that may apply. If you do not agree, you
          must not use the Service.
        </p>
      </section>

      <section id="eligibility">
        <h2>2. Eligibility</h2>
        <p>
          You must be at least 16 years old to use our Service. By using FrontendAtlas, you represent that
          you have the legal capacity to enter into binding contracts under applicable law.
        </p>
      </section>

      <section id="use-of-service">
        <h2>3. Use of the Service</h2>
        <p>
          You agree to use the Service only for lawful purposes and in compliance with these Terms.
          You agree not to:
        </p>
        <ul>
          <li>Interfere with or disrupt the security, integrity, or performance of the Service;</li>
          <li>Attempt to gain unauthorized access to any portion of the platform or its systems;</li>
          <li>Upload malicious code, spam, or use the Service to distribute malware or phishing links;</li>
          <li>Reverse-engineer or copy our products or content without written permission.</li>
        </ul>
      </section>

      <section id="content-ownership">
        <h2>4. Content Ownership</h2>
        <p>
          All materials, including text, code examples, challenges, visuals, design elements, and other
          intellectual property on the Service, are owned or licensed by FrontendAtlas. You may not
          reproduce, distribute, or create derivative works without our prior written consent.
        </p>
      </section>

      <section id="user-content">
        <h2>5. User Content</h2>
        <p>
          You retain ownership of any code or content you submit to the Service, such as solutions,
          feedback, or comments. However, by submitting content, you grant FrontendAtlas a worldwide,
          royalty-free license to display, use, and improve the platform using your contributions.
        </p>
      </section>

      <section id="intellectual-property">
        <h2>6. Intellectual Property</h2>
        <p>
          “FrontendAtlas” and its associated trademarks, logos, and visual elements are the property of
          FrontendAtlas. Unauthorized use of any of these marks without prior written consent is strictly
          prohibited.
        </p>
      </section>

      <section id="disclaimers">
        <h2>7. Disclaimers</h2>
        <p>
          The Service is provided on an “as is” and “as available” basis without any warranties, express or
          implied. We make no guarantees that the Service will be uninterrupted, error-free, or secure.
          Your use of the Service is at your sole risk.
        </p>
      </section>

      <section id="limitation-of-liability">
        <h2>8. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, FrontendAtlas and its affiliates shall not be liable for
          any indirect, incidental, or consequential damages, loss of data, or loss of profits arising from
          your use or inability to use the Service.
        </p>
      </section>

      <section id="termination">
        <h2>9. Termination</h2>
        <p>
          We may suspend or terminate your access to the Service at any time, without notice, if we
          reasonably believe you have violated these Terms. Upon termination, your right to use the
          Service ceases immediately.
        </p>
      </section>

      <section id="changes">
        <h2>10. Changes to These Terms</h2>
        <p>
          We reserve the right to modify or update these Terms at any time. When we make changes, we will
          revise the “Last updated” date and post the revised version here. Continued use of the Service
          after such updates constitutes your acceptance of the new Terms.
        </p>
      </section>

      <section id="contact">
        <h2>11. Contact Us</h2>
        <p>
          If you have any questions regarding these Terms, please contact us at:
        </p>
        <p>
          Email:
          <a href="mailto:legal&#64;frontendatlas.com">legal&#64;frontendatlas.com</a><br>
          Subject line: “Terms of Service Inquiry”
        </p>
      </section>

      <footer class="doc-footer">
        <p>
          See also our
          <a [routerLink]="['/legal/privacy']">Privacy Notice</a> and
          <a [routerLink]="['/legal/cookies']">Cookie Policy</a>.
        </p>
        <p class="tiny">© {{ year }} FrontendAtlas. All rights reserved.</p>
      </footer>
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
export class TermsComponent {
  readonly today = new Date().toISOString().slice(0, 10);
  readonly year = new Date().getFullYear();
}
