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
        These Terms of Service ("Terms") govern your access to and use of the UberFrontend website,
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
          You must be at least 16 years old to use our Service. By using UberFrontend, you represent that
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
          intellectual property on the Service, are owned or licensed by UberFrontend. You may not
          reproduce, distribute, or create derivative works without our prior written consent.
        </p>
      </section>

      <section id="user-content">
        <h2>5. User Content</h2>
        <p>
          You retain ownership of any code or content you submit to the Service, such as solutions,
          feedback, or comments. However, by submitting content, you grant UberFrontend a worldwide,
          royalty-free license to display, use, and improve the platform using your contributions.
        </p>
      </section>

      <section id="intellectual-property">
        <h2>6. Intellectual Property</h2>
        <p>
          “UberFrontend” and its associated trademarks, logos, and visual elements are the property of
          UberFrontend. Unauthorized use of any of these marks without prior written consent is strictly
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
          To the maximum extent permitted by law, UberFrontend and its affiliates shall not be liable for
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
          <a href="mailto:legal&#64;uberfrontend.com">legal&#64;uberfrontend.com</a><br>
          Subject line: “Terms of Service Inquiry”
        </p>
      </section>

      <footer class="doc-footer">
        <p>
          See also our
          <a [routerLink]="['/legal/privacy']">Privacy Notice</a> and
          <a [routerLink]="['/legal/cookies']">Cookie Policy</a>.
        </p>
        <p class="tiny">© {{ year }} UberFrontend. All rights reserved.</p>
      </footer>
    </article>
  `,
  styles: [`
    :host { display: block; background: radial-gradient(circle at 12% 18%, rgba(59,130,246,0.08), transparent 40%), #050a12; }
    .doc {
      max-width: 920px;
      margin: 24px auto 48px;
      padding: 18px 16px 20px;
      color: #e6e9ef;
      font-size: 15px;
      line-height: 1.65;
      background: linear-gradient(145deg, rgba(16, 24, 40, 0.95), rgba(9, 12, 23, 0.95));
      border: 1px solid #1f2634;
      border-radius: 18px;
      box-shadow: 0 16px 60px rgba(0,0,0,0.45);
    }
    .doc-header h1 {
      font-size: clamp(22px, 3.4vw, 30px);
      margin: 0 0 4px;
      font-weight: 800;
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
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.35);
      background: rgba(148, 163, 184, 0.18);
      color: #e6e9ef;
      font-size: 11px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .pill-blue {
      background: rgba(59, 130, 246, 0.16);
      border-color: rgba(59, 130, 246, 0.45);
      color: #bfdbfe;
    }
    .muted { color: #9aa3ad; margin: 0 0 18px; font-size: 13px; }
    .lede { color: #cfd6df; margin-bottom: 14px; }
    .toc {
      background: #0b111b;
      border: 1px solid #242b38;
      border-radius: 12px;
      padding: 12px 14px;
      margin: 12px 0 18px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
    }
    .toc-title {
      font-size: 14px;
      margin: 0 0 8px;
      color: #cfd6df;
      font-weight: 700;
    }
    .toc ol {
      margin: 0;
      padding-left: 18px;
      display: grid;
      gap: 6px;
    }
    .toc a {
      color: #9cc3ff;
      text-decoration: none;
      border-bottom: 1px dashed #2a3142;
    }
    .toc a:hover { color: #c7ddff; border-color: #3a4559; }
    h2 {
      font-size: 18px;
      margin: 20px 0 8px;
      font-weight: 800;
    }
    p { margin: 0 0 10px; color: #cfd6df; }
    ul { margin: 0 0 10px; padding-left: 18px; }
    li { margin: 4px 0; }
    html { scroll-behavior: smooth; }
    section[id] { scroll-margin-top: 80px; }
    .doc-footer {
      margin-top: 24px;
      border-top: 1px solid #1f2634;
      padding-top: 12px;
      color: #aab3bf;
      display: grid;
      gap: 6px;
    }
    .doc-footer a {
      color: #9cc3ff;
      text-decoration: none;
      border-bottom: 1px dashed #2a3142;
    }
    .doc-footer a:hover { color: #c7ddff; border-color: #3a4559; }
    .tiny { font-size: 12px; color: #95a2b4; margin-top: 6px; }
  `]
})
export class TermsComponent {
  readonly today = new Date().toISOString().slice(0, 10);
  readonly year = new Date().getFullYear();
}
