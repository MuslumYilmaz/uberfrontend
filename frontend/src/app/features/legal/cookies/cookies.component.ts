import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-cookies',
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="doc" aria-labelledby="doc-title">
      <header class="doc-header">
        <div class="doc-meta">
          <span class="pill">Legal</span>
          <span class="pill pill-blue">Cookies</span>
        </div>
        <h1 id="doc-title">Cookie Policy</h1>
        <p class="muted">Last updated: {{ today }}</p>
      </header>

      <!-- Intro -->
      <p class="lede">
        This Cookie Policy explains how <strong>FrontendAtlas</strong> (“we”, “us”, or “our”) uses cookies
        and similar technologies to recognize you when you visit our website and use our services.
        It describes what these technologies are, why we use them, and the choices you have to control them.
      </p>

      <!-- Table of contents -->
      <nav class="toc" aria-label="Table of contents">
        <h2 class="toc-title">Contents</h2>
        <ol>
          <li><a [routerLink]="[]" fragment="what-are-cookies">What Are Cookies?</a></li>
          <li><a [routerLink]="[]" fragment="types-of-cookies">Types of Cookies We Use</a></li>
          <li><a [routerLink]="[]" fragment="why-we-use">Why We Use Cookies</a></li>
          <li><a [routerLink]="[]" fragment="third-party-cookies">Third-Party Cookies</a></li>
          <li><a [routerLink]="[]" fragment="managing-cookies">Managing Cookies</a></li>
          <li><a [routerLink]="[]" fragment="updates">Updates to This Policy</a></li>
          <li><a [routerLink]="[]" fragment="contact">Contact Us</a></li>
        </ol>
      </nav>

      <!-- Sections -->
      <section id="what-are-cookies">
        <h2>1. What Are Cookies?</h2>
        <p>
          Cookies are small text files that are downloaded to your device when you visit a website.
          They are widely used to make websites work or to improve their efficiency, as well as to
          provide reporting information and personalized experiences.
        </p>
        <p>
          Cookies set by the website owner are called “first-party cookies.” Cookies set by parties
          other than the website owner are called “third-party cookies.” Third-party cookies enable
          third-party features or functionality to be provided on or through the website (such as
          analytics, advertising, and social media integrations).
        </p>
      </section>

      <section id="types-of-cookies">
        <h2>2. Types of Cookies We Use</h2>

        <h3>2.1 Essential Cookies</h3>
        <p>
          These cookies are strictly necessary for the website to function properly. They allow you to
          log in, use essential features, and navigate pages securely. Without them, certain parts of
          the website would not operate as intended.
        </p>

        <h3>2.2 Performance and Analytics Cookies</h3>
        <p>
          We use analytics cookies to understand how users interact with our website. They help us
          measure traffic sources, identify popular pages, and improve usability. For example, we may
          use Google Analytics to gather anonymized usage statistics.
        </p>

        <h3>2.3 Functional Cookies</h3>
        <p>
          Functional cookies remember your preferences and settings — such as language choice, theme,
          or saved login state — to make your experience more personalized.
        </p>

        <h3>2.4 Advertising and Targeting Cookies</h3>
        <p>
          We may use advertising cookies to deliver more relevant ads to you, both on our website and
          across other platforms. These cookies track browsing habits to infer interests. You can opt
          out through your browser or third-party ad settings.
        </p>
      </section>

      <section id="why-we-use">
        <h2>3. Why We Use Cookies</h2>
        <ul>
          <li>To ensure the site and app function correctly.</li>
          <li>To analyze traffic and performance to improve functionality.</li>
          <li>To store your preferences for a customized experience.</li>
          <li>To provide secure login sessions and maintain your authentication state.</li>
          <li>To show relevant content and advertisements, when applicable.</li>
        </ul>
      </section>

      <section id="third-party-cookies">
        <h2>4. Third-Party Cookies</h2>
        <p>
          Some cookies on our site come from trusted third-party providers. These may include analytics
          platforms, content delivery networks, and advertising networks. Each third-party provider is
          responsible for its own privacy and cookie practices.
        </p>
        <p>
          Examples include:
        </p>
        <ul>
          <li><strong>Google Analytics</strong> – for understanding site traffic and usage.</li>
          <li><strong>Stripe</strong> – for secure payment processing.</li>
          <li><strong>YouTube / Vimeo</strong> – for embedded media playback.</li>
        </ul>
      </section>

      <section id="managing-cookies">
        <h2>5. Managing Cookies</h2>
        <p>
          You have the right to decide whether to accept or reject cookies. Most browsers automatically
          accept cookies, but you can modify your settings to decline or delete them. Please note that
          disabling essential cookies may impact core site functionality.
        </p>
        <p>
          Instructions for popular browsers:
        </p>
        <ul>
          <li><strong>Chrome:</strong> <a href="https://support.google.com/chrome/answer/95647" target="_blank">Manage cookies in Chrome</a></li>
          <li><strong>Firefox:</strong> <a href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" target="_blank">Manage cookies in Firefox</a></li>
          <li><strong>Safari:</strong> <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank">Manage cookies in Safari</a></li>
          <li><strong>Edge:</strong> <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank">Manage cookies in Edge</a></li>
        </ul>
      </section>

      <section id="updates">
        <h2>6. Updates to This Policy</h2>
        <p>
          We may update this Cookie Policy from time to time to reflect operational, legal, or regulatory
          changes. When we do, we will revise the “Last updated” date above and, where appropriate, notify
          you by email or a notice on our website.
        </p>
      </section>

      <section id="contact">
        <h2>7. Contact Us</h2>
        <p>
          If you have questions or concerns about our use of cookies or this policy, contact us at:
        </p>
        <p>
          Email:
          <a href="mailto:legal&#64;frontendatlas.com">legal&#64;frontendatlas.com</a><br>
          Subject line: “Cookie Policy Inquiry”
        </p>
      </section>

      <footer class="doc-footer">
        <p>
          See also our
          <a [routerLink]="['/legal/privacy']">Privacy Notice</a> and
          <a [routerLink]="['/legal/terms']">Terms of Service</a>.
        </p>
        <p class="tiny">© {{ year }} FrontendAtlas. All rights reserved.</p>
      </footer>
    </article>
  `,
  styles: [`
    :host { display: block; background: radial-gradient(circle at 14% 18%, color-mix(in srgb, var(--uf-accent) 10%, transparent), transparent 38%), var(--uf-bg); }
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
    h3 {
      font-size: 16px;
      margin: 16px 0 8px;
      font-weight: 700;
      color: color-mix(in srgb, var(--uf-text-secondary) 90%, transparent);
    }
    p { margin: 0 0 10px; color: color-mix(in srgb, var(--uf-text-secondary) 85%, transparent); }
    ul { margin: 0 0 10px; padding-left: 18px; color: color-mix(in srgb, var(--uf-text-secondary) 85%, transparent); }
    li { margin: 4px 0; }
    a[target="_blank"] { color: var(--uf-accent); }
    a[target="_blank"]:hover { color: var(--uf-accent-strong); }
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
export class CookiesComponent {
  readonly today = new Date().toISOString().slice(0, 10);
  readonly year = new Date().getFullYear();
}
