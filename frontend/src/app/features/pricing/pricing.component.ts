// src/app/features/pricing/pricing.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-pricing',
  imports: [CommonModule, RouterModule],
  styleUrls: ['./pricing.component.css'],
  template: `
    <section class="pr-wrap">
      <header class="pr-hero">
        <h1>Save time, ace interviews, and land high-paying roles</h1>
        <p class="muted">Get full access to premium content, updates and future additions.</p>
      </header>

      <div class="pr-grid">
        <article class="pr-card">
          <h3 class="title">Monthly</h3>
          <div class="price">₺800<span>/month</span></div>
          <ul class="features">
            <li>All premium interview content</li>
            <li>Updates while subscription is active</li>
          </ul>
          <button disabled class="btn">Buy now</button>
        </article>

        <article class="pr-card">
          <h3 class="title">Quarterly</h3>
          <div class="price">₺600<span>/month</span></div>
          <ul class="features">
            <li>All premium interview content</li>
            <li>Access to private community (coming soon)</li>
          </ul>
          <button disabled class="btn">Buy now</button>
        </article>

        <article class="pr-card pr-rec">
          <div class="rec-badge">RECOMMENDED</div>
          <h3 class="title">Annual</h3>
          <div class="price">₺200<span>/month</span></div>
          <ul class="features">
            <li>All premium interview content</li>
            <li>Updates while subscription is active</li>
          </ul>
          <button disabled class="btn">Buy now</button>
        </article>

        <article class="pr-card">
          <h3 class="title">Lifetime</h3>
          <div class="price">₺3,600<span>paid once</span></div>
          <ul class="features">
            <li>Full access forever</li>
            <li>Future updates included</li>
          </ul>
          <button disabled class="btn">Buy now</button>
        </article>
      </div>

      <p class="tiny muted">Payments/fulfillment are disabled in this build — plans are placeholders.</p>
    </section>
  `
})
export class PricingComponent { }
