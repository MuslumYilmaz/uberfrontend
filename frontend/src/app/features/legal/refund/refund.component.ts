import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
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
        <p class="muted">Effective date: {{ effectiveDate }}</p>
      </header>

      <p class="lede">
        FrontendAtlas provides access to digital educational content and software services.
        This policy explains refunds, cancellations, and your consumer rights where applicable.
      </p>

      <section>
        <h2>1. Nature of the service (digital goods)</h2>
        <p>FrontendAtlas delivers non-tangible digital services, including:</p>
        <ul>
          <li>Interactive coding challenges</li>
          <li>Interview preparation content</li>
          <li>Premium learning tools and features</li>
        </ul>
        <p>Access to paid content is typically granted immediately after successful payment.</p>
      </section>

      <section>
        <h2>2. Consumer right to cancel (14 days) and digital-content exception</h2>
        <p>
          If you are a <strong>consumer</strong>, you may have a statutory right to cancel within
          <strong>14 days</strong> (the period typically starts the day after completion of the transaction),
          unless a legal exception applies.
        </p>
        <p>
          Because FrontendAtlas is digital content/service delivered immediately, the statutory cancellation right
          may not apply (or may be lost) once you have started to access, download, stream, or otherwise consume
          the digital content/service, where permitted by law.
        </p>
      </section>

      <section>
        <h2>3. First-purchase refund (14 days, no usage test)</h2>
        <p>
          Your <strong>first Premium purchase</strong> on any plan (monthly, quarterly, annual, or lifetime) can be
          refunded in full if you ask within <strong>14 days</strong> of the order. You do not need to give a reason,
          and how much of the library you used does not matter.
        </p>
        <ul>
          <li>Ask by email within 14 days of the order date (Section 5).</li>
          <li>One first-purchase refund per person and per account; duplicate accounts are not eligible.</li>
          <li>Premium access ends when the refund is issued.</li>
          <li>Later purchases and renewals follow Section 4; the 14-day first-purchase refund does not apply to them.</li>
        </ul>
        <p class="muted small">
          This policy does not limit mandatory consumer rights for services that are not as described, faulty,
          or not fit for purpose. We may decline a refund where we find fraud, refund abuse, or a policy violation.
        </p>
      </section>

      <section>
        <h2>4. Subscriptions &amp; automatic renewals</h2>
        <ul>
          <li>Subscriptions renew automatically unless canceled.</li>
          <li>Lemon Squeezy, our payment provider, emails a renewal reminder seven days before the renewal date.</li>
          <li>You can cancel anytime in your account settings; access continues until the period ends.</li>
          <li>
            To avoid being charged for the next period, cancel before your renewal date
            (recommended: at least <strong>48 hours</strong> before renewal).
          </li>
          <li>Renewal charges are generally non-refundable.</li>
          <li>No refunds are provided for unused time in a subscription period.</li>
        </ul>
      </section>

      <section>
        <h2>5. How to request a refund</h2>
        <p>
          Refund requests:
          <a href="mailto:support@frontendatlas.com"><strong>support&#64;frontendatlas.com</strong></a>
        </p>
        <p>Please include:</p>
        <ul>
          <li>The email associated with your account</li>
          <li>Transaction / order ID (from your receipt)</li>
          <li>Reason for the request</li>
        </ul>
        <p>We aim to review requests within 3–5 business days.</p>
      </section>

      <section>
        <h2>6. Refund processing</h2>
        <ul>
          <li>Approved refunds are issued to the original payment method.</li>
          <li>Processing times vary by payment method (typically 5–10 business days).</li>
          <li>We are not responsible for delays caused by banks or payment networks.</li>
        </ul>
      </section>

      <section>
        <h2>7. Chargebacks and disputes</h2>
        <p>
          If something went wrong, contact support first so we can resolve it quickly. Unresolved chargebacks may
          result in account access being limited while the dispute is investigated.
        </p>
      </section>

      <footer class="doc-footer">
        <p class="tiny">© FrontendAtlas. All rights reserved.</p>
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
  // Don’t use a “moving” legal date.
  readonly effectiveDate = '2026-10-15';
}
