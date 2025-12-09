import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-privacy',
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="doc" aria-labelledby="doc-title">
      <header class="doc-header">
        <div class="doc-meta">
          <span class="pill">Legal</span>
          <span class="pill pill-green">Privacy</span>
        </div>
        <h1 id="doc-title">Privacy Notice</h1>
        <p class="muted">Effective Date: {{ effectiveDate }}</p>
      </header>

      <!-- Intro -->
      <p class="lede">
        This Privacy Notice explains how <strong>{{ companyName }}</strong> (“we”, “us”, or “our”)
        collects, uses, and safeguards personal information when you access our website, apps,
        and related services (collectively, the “Service”). Our platform provides coding practice
        challenges, interview preparation materials, and educational tools for frontend engineers.
      </p>

      <!-- Table of contents -->
      <nav class="toc" aria-label="Table of contents">
        <h2 class="toc-title">Contents</h2>
        <ol>
          <li><a [routerLink]="[]" fragment="scope">Scope & Controller</a></li>
          <li><a [routerLink]="[]" fragment="information-we-collect">Information We Collect</a></li>
          <li><a [routerLink]="[]" fragment="how-we-use">How We Use Information</a></li>
          <li><a [routerLink]="[]" fragment="sharing">How We Share Information</a></li>
          <li><a [routerLink]="[]" fragment="cookies">Cookies & Similar Technologies</a></li>
          <li><a [routerLink]="[]" fragment="legal-bases">Legal Bases (EEA/UK)</a></li>
          <li><a [routerLink]="[]" fragment="your-rights">Your Rights & Choices</a></li>
          <li><a [routerLink]="[]" fragment="security">Security</a></li>
          <li><a [routerLink]="[]" fragment="retention">Data Retention</a></li>
          <li><a [routerLink]="[]" fragment="transfers">International Transfers</a></li>
          <li><a [routerLink]="[]" fragment="children">Children’s Privacy</a></li>
          <li><a [routerLink]="[]" fragment="changes">Changes to This Notice</a></li>
          <li><a [routerLink]="[]" fragment="contact">How to Contact Us</a></li>
          <li><a [routerLink]="[]" fragment="region-notices">Region-Specific Notices</a></li>
        </ol>
      </nav>

      <!-- Scope & Controller -->
      <section id="scope">
        <h2>1) Scope & Controller</h2>
        <p>
          This Notice applies to the Service that links to it. The data controller is
          <strong>{{ companyName }}</strong>. If you access third-party sites or integrations via our Service,
          their privacy policies govern those properties.
        </p>
      </section>

      <!-- Information We Collect -->
      <section id="information-we-collect">
        <h2>2) Information We Collect</h2>

        <h3>2.1 Information You Provide</h3>
        <ul>
          <li><strong>Account data</strong> — name, email address, password.</li>
          <li><strong>Profile data</strong> — optional bio, avatar, preferred technologies, links to portfolio/socials.</li>
          <li><strong>Communications</strong> — messages you send to support or feedback you submit.</li>
          <li><strong>Billing</strong> — subscription details; payment card data is handled by our payment processors and not stored by us.</li>
          <li><strong>Marketing preferences</strong> — newsletter opt-ins and related choices.</li>
        </ul>

        <h3>2.2 Information from Other Sources</h3>
        <p>
          If you sign in with or link a third-party account (e.g., a social login), we may receive
          limited information such as your name, email, and avatar as permitted by that service.
        </p>

        <h3>2.3 Automatically Collected Information</h3>
        <ul>
          <li><strong>Device & tech data</strong> — browser, OS, screen size, device identifiers, IP address, language.</li>
          <li><strong>Usage data</strong> — pages viewed, features used, time on page, referrers, error logs.</li>
          <li><strong>Approximate location</strong> — derived from IP (city/region level) for fraud prevention, localization, and analytics.</li>
          <li><strong>Cookies & similar</strong> — see <a href="#cookies">Cookies & Similar Technologies</a>.</li>
        </ul>
      </section>

      <!-- How We Use -->
      <section id="how-we-use">
        <h2>3) How We Use Information</h2>
        <ul>
          <li><strong>Service delivery</strong> — operate, maintain, and support the Service; personalize content and remember preferences.</li>
          <li><strong>Account & communications</strong> — send transactional emails (e.g., account, security, feature updates) and respond to requests.</li>
          <li><strong>Analytics & improvement</strong> — understand usage, debug issues, enhance performance and features.</li>
          <li><strong>Security & fraud</strong> — detect, investigate, and prevent abuse, attacks, or violations of our terms.</li>
          <li><strong>Marketing</strong> — send newsletters or promotions if you opt in; you can unsubscribe at any time.</li>
          <li><strong>Legal compliance</strong> — comply with applicable laws and enforce our agreements.</li>
        </ul>
      </section>

      <!-- Sharing -->
      <section id="sharing">
        <h2>4) How We Share Information</h2>
        <p>We do <strong>not</strong> sell your personal information. We share limited data only as described below:</p>
        <ul>
          <li><strong>Service providers</strong> — vendors that host infrastructure, provide analytics, email delivery, customer support, and payment processing (bound by confidentiality and data-protection terms).</li>
          <li><strong>Legal & safety</strong> — when required by law or to protect our rights, users, or the public.</li>
          <li><strong>Business transfers</strong> — in mergers, acquisitions, or reorganizations, data may be transferred as part of the transaction.</li>
          <li><strong>With your direction</strong> — when you explicitly request or consent to sharing.</li>
        </ul>
      </section>

      <!-- Cookies -->
      <section id="cookies">
        <h2>5) Cookies & Similar Technologies</h2>
        <p>
          We use cookies, local storage, and similar technologies to keep you signed in, remember settings,
          measure performance, and improve features. You can manage cookies through your browser settings;
          restricting them may impact some functionality. See our <a [routerLink]="['/legal/cookies']">Cookie Policy</a> for details.
        </p>
      </section>

      <!-- Legal Bases -->
      <section id="legal-bases">
        <h2>6) Legal Bases (EEA/UK)</h2>
        <p>Where the GDPR/UK GDPR applies, we process personal data under these legal bases:</p>
        <ul>
          <li><strong>Contract</strong> — to provide the Service you request.</li>
          <li><strong>Legitimate interests</strong> — to secure, improve, and operate the Service in ways that do not override your rights.</li>
          <li><strong>Consent</strong> — for certain marketing or optional cookies; you can withdraw consent at any time.</li>
          <li><strong>Legal obligation</strong> — to comply with applicable laws.</li>
        </ul>
      </section>

      <!-- Your Rights -->
      <section id="your-rights">
        <h2>7) Your Rights & Choices</h2>
        <ul>
          <li><strong>Access & update</strong> — view or update profile data in your account settings.</li>
          <li><strong>Marketing opt-out</strong> — unsubscribe via links in our emails.</li>
          <li><strong>Account deletion</strong> — request deletion by contacting us at <a href="mailto:{{ contactEmail }}">{{ contactEmail }}</a>.</li>
          <li><strong>Cookies</strong> — manage via your browser; see our Cookie Policy for instructions.</li>
        </ul>
        <p class="note">
          Depending on your location, you may have additional rights (e.g., data portability, objection, restriction,
          or the right to lodge a complaint with a supervisory authority). See <a href="#region-notices">Region-Specific Notices</a>.
        </p>
      </section>

      <!-- Security -->
      <section id="security">
        <h2>8) Security</h2>
        <p>
          We implement industry-standard safeguards (encryption in transit, access controls, logging). No system is 100% secure,
          and we cannot guarantee absolute security, but we continuously work to protect your information.
        </p>
      </section>

      <!-- Retention -->
      <section id="retention">
        <h2>9) Data Retention</h2>
        <p>
          We retain personal information only as long as necessary to provide the Service, comply with legal obligations,
          resolve disputes, and enforce agreements. When no longer needed, we delete or de-identify the data.
        </p>
      </section>

      <!-- Transfers -->
      <section id="transfers">
        <h2>10) International Transfers</h2>
        <p>
          Our infrastructure and service providers may be located in countries outside your own.
          Where required, we rely on appropriate safeguards (e.g., Standard Contractual Clauses) to protect personal data.
        </p>
      </section>

      <!-- Children -->
      <section id="children">
        <h2>11) Children’s Privacy</h2>
        <p>
          The Service is not intended for children under 16. We do not knowingly collect personal information from children.
          If you believe a child has provided us information, contact us to request deletion.
        </p>
      </section>

      <!-- Changes -->
      <section id="changes">
        <h2>12) Changes to This Notice</h2>
        <p>
          We may update this Privacy Notice periodically. If we make material changes, we will update the “Effective Date”
          and may provide additional notice. Your continued use of the Service after the changes become effective means
          you accept the updated Notice.
        </p>
      </section>

      <!-- Contact -->
      <section id="contact">
        <h2>13) How to Contact Us</h2>
        <p>
          For questions, privacy requests, or complaints, contact our team:
          <br />Email: <a href="mailto:{{ contactEmail }}">{{ contactEmail }}</a>
          <br />Subject line: “Privacy Enquiry”
        </p>
      </section>

      <!-- Regional -->
      <section id="region-notices">
        <h2>14) Region-Specific Notices</h2>

        <h3>California (CCPA/CPRA)</h3>
        <ul>
          <li><strong>Categories collected</strong> — identifiers (e.g., email), internet activity (usage analytics), commercial information (subscription tier).</li>
          <li><strong>Sources</strong> — you, your device/browser, and (if used) sign-in providers.</li>
          <li><strong>Purposes</strong> — service delivery, security, analytics, and with consent, marketing.</li>
          <li><strong>Disclosures</strong> — to service providers under written contracts; we do not “sell” personal information.</li>
          <li><strong>Rights</strong> — access, deletion, correction, opt-out of certain sharing, and right to non-discrimination. You can exercise rights by emailing
            <a href="mailto:{{ contactEmail }}">{{ contactEmail }}</a>.</li>
        </ul>

        <h3>Türkiye (KVKK/PDPL)</h3>
        <ul>
          <li>We process personal data for explicit, legitimate purposes and retain only as necessary.</li>
          <li>You may request access, correction, deletion, or objection to certain processing by contacting
            <a href="mailto:{{ contactEmail }}">{{ contactEmail }}</a>.</li>
          <li>Where we rely on consent (e.g., marketing), you may withdraw consent at any time.</li>
        </ul>

        <h3>EEA/UK</h3>
        <ul>
          <li>You may have rights to access, rectify, erase, restrict, or object to processing, and to data portability.</li>
          <li>You can lodge a complaint with your local supervisory authority (e.g., ICO in the UK, or your country’s DPA in the EEA).</li>
        </ul>
      </section>

      <footer class="doc-footer">
        <p>
          Looking for something else? See our
          <a [routerLink]="['/legal/terms']">Terms of Service</a> and
          <a [routerLink]="['/legal/cookies']">Cookie Policy</a>.
        </p>
        <p class="tiny">© 2025 {{ companyName }}. All rights reserved.</p>
      </footer>
    </article>
  `,
  styles: [`
    :host { display: block; background: radial-gradient(circle at 16% 20%, color-mix(in srgb, var(--uf-accent) 10%, transparent), transparent 38%), var(--uf-bg); }
    /* Layout */
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
      letter-spacing: 0.2px;
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
    .pill-green {
      background: color-mix(in srgb, var(--uf-accent) 18%, var(--uf-surface));
      border-color: color-mix(in srgb, var(--uf-accent) 40%, var(--uf-border-subtle));
      color: var(--uf-text-primary);
    }
    .muted { color: color-mix(in srgb, var(--uf-text-tertiary) 75%, transparent); margin: 0 0 16px; font-size: 13px; }

    .lede {
      color: color-mix(in srgb, var(--uf-text-secondary) 85%, transparent);
      margin: 0 0 16px;
    }

    /* TOC */
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
      margin: 0; padding-left: 18px;
      display: grid; gap: 6px;
      counter-reset: item;
    }
    .toc a {
      color: var(--uf-accent); text-decoration: none; border-bottom: 1px dashed color-mix(in srgb, var(--uf-accent) 50%, transparent);
    }
    .toc a:hover { color: var(--uf-accent-strong); border-color: color-mix(in srgb, var(--uf-accent-strong) 65%, transparent); }

    /* Headings */
    h2 {
      font-size: 18px;
      margin: 24px 0 8px;
      font-weight: 800;
      letter-spacing: .2px;
      color: var(--uf-text-primary);
    }
    h3 {
      font-size: 16px;
      margin: 16px 0 8px;
      font-weight: 700;
      color: color-mix(in srgb, var(--uf-text-secondary) 90%, transparent);
    }

    /* Content */
    p { margin: 0 0 10px; color: color-mix(in srgb, var(--uf-text-secondary) 85%, transparent); }
    ul { margin: 0 0 10px; padding-left: 18px; color: color-mix(in srgb, var(--uf-text-secondary) 85%, transparent); }
    li { margin: 4px 0; }
    .note {
      background: color-mix(in srgb, var(--uf-text-primary) 4%, var(--uf-surface));
      border: 1px solid var(--uf-border-subtle);
      border-radius: 10px;
      padding: 10px 12px;
      color: color-mix(in srgb, var(--uf-text-secondary) 85%, transparent);
    }

    /* Footer */
    .doc-footer {
      margin-top: 24px;
      border-top: 1px solid var(--uf-border-subtle);
      padding-top: 12px;
      color: color-mix(in srgb, var(--uf-text-tertiary) 80%, transparent);
    }
    .doc-footer a {
      color: var(--uf-accent); text-decoration: none; border-bottom: 1px dashed color-mix(in srgb, var(--uf-accent) 50%, transparent);
    }
    .doc-footer a:hover { color: var(--uf-accent-strong); border-color: color-mix(in srgb, var(--uf-accent-strong) 65%, transparent); }
    .tiny { font-size: 12px; color: color-mix(in srgb, var(--uf-text-tertiary) 80%, transparent); margin-top: 6px; }
  `]
})
export class PrivacyComponent {
  readonly companyName = 'FrontendAtlas';
  /** Prefer a fixed, explicit date for compliance/versioning. */
  readonly effectiveDate = 'October 6, 2025';
  readonly contactEmail = 'legal@frontendatlas.com';
}
