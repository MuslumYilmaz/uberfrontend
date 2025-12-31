import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-refund',
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="doc" aria-labelledby="doc-title">
      <header class="doc-header">
        <div class="doc-meta">
          <span class="pill">Legal</span>
          <span class="pill pill-blue">Billing</span>
        </div>
        <h1 id="doc-title">Refund Policy</h1>
        <p class="muted">Effective date: {{ today }}</p>
      </header>

      <p class="lede">
        FrontendAtlas provides access to digital educational content and software services. By purchasing a
        plan, you acknowledge and agree to the terms outlined below.
      </p>

      <section>
        <h2>1. Nature of the Service (Digital Goods)</h2>
        <p>FrontendAtlas delivers non-tangible, irrevocable digital services, including but not limited to:</p>
        <ul>
          <li>Interactive coding challenges</li>
          <li>Interview preparation content</li>
          <li>Premium learning tools and features</li>
        </ul>
        <p>Access to paid content is granted immediately after successful payment.</p>
      </section>

      <section>
        <h2>2. Refund Eligibility</h2>
        <p>A refund may be granted if all of the following conditions are met:</p>
        <ul>
          <li>The refund request is submitted within 14 calendar days of the initial purchase; and</li>
          <li>The account shows limited usage (no substantial consumption of premium content or features).</li>
        </ul>
        <p>Approval is at FrontendAtlas’s sole discretion.</p>
      </section>

      <section>
        <h2>3. Non-Refundable Situations</h2>
        <p>Refunds are not provided in the following cases:</p>
        <ul>
          <li>Subscription renewals</li>
          <li>Partial or full consumption of premium content</li>
          <li>Failure to cancel a subscription before the renewal date</li>
          <li>Change of mind after purchase</li>
          <li>Inactivity or lack of use after purchase</li>
          <li>Technical issues caused by unsupported browsers, devices, or user environments</li>
          <li>Violations of our Terms of Service or Acceptable Use Policy</li>
        </ul>
      </section>

      <section>
        <h2>4. Subscriptions &amp; Automatic Renewals</h2>
        <ul>
          <li>Subscriptions renew automatically unless canceled before the renewal date.</li>
          <li>You may cancel your subscription at any time via your account settings.</li>
          <li>Once a renewal charge has been processed, it is non-refundable.</li>
        </ul>
      </section>

      <section>
        <h2>5. Refund Requests &amp; Disputes</h2>
        <p>To request a refund, contact: <strong>support&#64;frontendatlas.com</strong></p>
        <p>Please include:</p>
        <ul>
          <li>The email associated with your account</li>
          <li>Transaction or order ID</li>
          <li>Reason for the request</li>
        </ul>
        <p>We aim to review requests within 3–5 business days.</p>
        <p class="muted small">Important: Initiating a chargeback without contacting support may result in account suspension.</p>
      </section>

      <section>
        <h2>6. Refund Processing</h2>
        <ul>
          <li>Approved refunds are issued to the original payment method.</li>
          <li>Processing times vary by payment provider (typically 5–10 business days).</li>
          <li>FrontendAtlas is not responsible for delays caused by banks or payment networks.</li>
        </ul>
      </section>

      <section>
        <h2>7. Payment Providers</h2>
        <p>Payments are processed by third-party providers such as Paddle and Stripe.</p>
        <p>Refunds are handled in accordance with both this policy and the applicable provider’s terms.</p>
      </section>

      <section>
        <h2>8. Policy Modifications</h2>
        <p>We reserve the right to modify this Refund Policy at any time. Updates take effect immediately upon publication.</p>
      </section>

      <footer class="doc-footer">
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
    .muted.small { font-size: 12px; margin-top: 6px; }
    .lede { color: color-mix(in srgb, var(--uf-text-secondary) 85%, transparent); margin-bottom: 16px; }
    h2 {
      font-size: 18px;
      margin: 24px 0 8px;
      font-weight: 700;
      color: var(--uf-text-primary);
      letter-spacing: -0.01em;
    }
    p { margin: 0 0 10px; color: color-mix(in srgb, var(--uf-text-secondary) 90%, transparent); }
    ul { margin: 0 0 12px 18px; color: color-mix(in srgb, var(--uf-text-secondary) 90%, transparent); }
    li + li { margin-top: 6px; }
    .doc-footer { margin-top: 20px; }
    .tiny { margin: 0; font-size: 12px; color: color-mix(in srgb, var(--uf-text-tertiary) 80%, transparent); }
    a { color: var(--uf-accent); }
  `]
})
export class RefundComponent {
  readonly today = new Date().toISOString().slice(0, 10);
  readonly year = new Date().getFullYear();
}
