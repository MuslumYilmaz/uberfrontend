import { PRICING_COUNTS } from '../src/app/generated/pricing-counts';
import { expect, test } from './fixtures';

const V2_CHECKOUT_CONFIG = {
  configuredProvider: 'lemonsqueezy',
  provider: 'lemonsqueezy',
  mode: 'live',
  enabled: true,
  plans: { monthly: true, quarterly: true, annual: true, lifetime: true },
  planDetails: {
    monthly: { amountCents: 1200, currency: 'USD', interval: 'month', intervalCount: 1, taxInclusive: true },
    quarterly: { amountCents: 2900, currency: 'USD', interval: 'month', intervalCount: 3, taxInclusive: true },
    annual: { amountCents: 7900, currency: 'USD', interval: 'year', intervalCount: 1, taxInclusive: true },
    lifetime: { amountCents: 19900, currency: 'USD', interval: 'one_time', intervalCount: null, taxInclusive: true },
  },
  offerVersion: 'interview_sprint_v2',
  checkoutSurface: 'overlay',
};

test('pricing offer v2 preserves plan hierarchy and responsive reflow', async ({ page }) => {
  await page.route(/\/api\/billing\/checkout\/config(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(V2_CHECKOUT_CONFIG),
    });
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/pricing');

  const primaryCards = page.locator('.pr-grid .pr-card');
  const monthly = page.locator('.pr-card--monthly');
  const quarterly = page.locator('.pr-card--quarterly');
  const annual = page.locator('.pr-card--annual');
  await expect(primaryCards).toHaveCount(3);
  // A situation label above every card and one highlighted plan, with no badge.
  await expect(page.locator('.rec-badge')).toHaveCount(0);
  await expect(page.locator('.pr-plan--rec .pr-card--quarterly')).toHaveCount(1);
  await expect(page.getByTestId('pricing-plan-label-quarterly')).toHaveText('The sweet spot for a hiring round');
  await expect(page.getByTestId('pricing-plan-label-monthly')).toHaveText('Interview in 1–2 weeks');
  await expect(page.getByTestId('pricing-lifetime-secondary')).toBeVisible();
  await expect(page.getByTestId('pricing-lifetime-secondary')).toContainText('$199 once, never renews, future questions included.');
  await expect(page.getByTestId('pricing-assurance')).toContainText('Taxes included');
  await expect(page.getByTestId('pricing-assurance')).toContainText('First purchase: full refund within 14 days, no usage test.');
  await expect(page.getByTestId('pricing-assurance')).toContainText('No sale prices, no countdowns.');
  await expect(page.getByTestId('pricing-assurance').getByRole('link', { name: /full refund within 14 days/i })).toHaveAttribute('href', '/legal/refund');
  await expect(page.locator('input[name*="coupon"], input[name*="promo"]')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(/money-back guarantee|where available|expanding/i);
  // Full-page presentation: the charge with its monthly equivalent, one billing sentence, one filled CTA, no sidebar.
  await expect(quarterly.locator('.price')).toContainText('$29');
  await expect(quarterly.locator('.price')).toContainText('every 3 months, $9.67 a month');
  await expect(quarterly.locator('.billing-note')).toHaveText(
    'Billed as $29 today. Renews every 3 months. Cancel anytime. $29 instead of $36 month to month.',
  );
  await expect(quarterly.locator('.btn')).not.toHaveClass(/btn--outline/);
  await expect(monthly.locator('.btn')).toHaveClass(/btn--outline/);
  await expect(page.getByTestId('pricing-discounts')).toContainText('40% off');
  await expect(page.getByTestId('pricing-student-action')).toHaveAttribute('href', '/auth/signup?src=pricing_student_discount');
  await expect(page.locator('app-sidebar')).toHaveCount(0);
  // The counted table replaces the Free vs Premium table: catalog counts per area and locked examples.
  const counted = page.getByTestId('pricing-counted-table');
  await expect(counted.getByRole('heading', { name: 'What you get, counted' })).toBeVisible();
  await expect(counted.locator('tbody tr')).toHaveCount(9);
  await expect(page.getByTestId('pricing-counted-row-react')).toContainText(`${PRICING_COUNTS.areas.react.premium} tasks`);
  await expect(page.getByTestId('pricing-counted-row-tradeoffsIncidents')).toContainText('Tradeoff battles and incidents');
  await expect(page.locator('.plan-compare')).toHaveCount(0);
  // The product proof block is gone: its "Preview a guided solution" link opened a Premium-locked task. A locked task
  // is now linked only from the counted table, where it is named as a locked example.
  await expect(page.getByTestId('pricing-product-proof')).toHaveCount(0);
  const throttleLinks = page.locator('main a[href^="/javascript/coding/js-throttle"]');
  await expect(throttleLinks).toHaveCount(await counted.locator('a[href^="/javascript/coding/js-throttle"]').count());

  const desktopBoxes = await Promise.all([
    monthly.boundingBox(),
    quarterly.boundingBox(),
    annual.boundingBox(),
  ]);
  expect(desktopBoxes.every(Boolean)).toBeTruthy();
  expect(desktopBoxes[0]!.x).toBeLessThan(desktopBoxes[1]!.x);
  expect(desktopBoxes[1]!.x).toBeLessThan(desktopBoxes[2]!.x);

  for (const width of [834, 390, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }

  const mobileMonthly = await monthly.boundingBox();
  const mobileQuarterly = await quarterly.boundingBox();
  const mobileAnnual = await annual.boundingBox();
  expect(mobileMonthly).toBeTruthy();
  expect(mobileQuarterly).toBeTruthy();
  expect(mobileAnnual).toBeTruthy();
  expect(mobileQuarterly!.y).toBeLessThan(mobileMonthly!.y);
  expect(mobileMonthly!.y).toBeLessThan(mobileAnnual!.y);
  // On a phone the plan cards are the page: no sticky bar covers the terms below them, and without a regional
  // price for this visitor none is mentioned.
  await page.getByTestId('pricing-discounts').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('pricing-discounts')).toBeInViewport();
  await expect(page.getByTestId('conversion-mobile-sticky')).toHaveCount(0);
  await expect(page.getByTestId('pricing-discounts')).not.toContainText('regional price');
  await expect(primaryCards).toHaveCount(3);
  expect(await primaryCards.evaluateAll((cards) => cards.map((card) => (
    card.classList.contains('pr-card--quarterly')
      ? 'quarterly'
      : card.classList.contains('pr-card--monthly')
        ? 'monthly'
        : 'annual'
  )))).toEqual(['monthly', 'quarterly', 'annual']);
});

test('regional pricing shows the list price struck through next to the regional price', async ({ page }) => {
  await page.route(/\/api\/billing\/checkout\/config(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({
        ...V2_CHECKOUT_CONFIG,
        pricing: {
          student: { multiplier: 0.6, planIds: ['annual'] },
          regional: {
            countryCode: 'TR',
            countryName: 'Türkiye',
            multiplier: 0.5,
            prices: { monthly: 600, quarterly: 1450, annual: 3950, lifetime: 9950 },
            local: { currency: 'TRY', rate: 42.1, asOf: '2026-11-05' },
          },
        },
      }),
    });
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/pricing');
  // Next to the regional price, the amount in the visitor's money at a dated rate; the charge stays in dollars.
  await expect(page.locator('.pr-card--monthly [data-testid="pricing-local-estimate"]')).toHaveText('about TRY 250 a month');
  await expect(page.locator('[data-testid="pricing-lifetime-secondary"] [data-testid="pricing-local-estimate"]')).toHaveText('about TRY 4,200 once');
  await expect(page.getByTestId('pricing-local-note')).toContainText('Charged in US dollars. Local amounts are estimates at the exchange rate of 5 Nov 2026');

  await expect(page.getByTestId('pricing-regional-line')).toContainText('Prices for Türkiye: 50% off the list price, applied automatically at checkout.');
  // The badge leads the page above the headline, and each card names its own discount.
  const badgeBox = await page.getByTestId('pricing-regional-line').boundingBox();
  const headlineBox = await page.locator('.pr-hero h1').boundingBox();
  expect(badgeBox!.y).toBeLessThan(headlineBox!.y);
  await expect(page.locator('.pr-card--quarterly .price-off')).toHaveText('50% off');
  await expect(page.locator('[data-testid="pricing-lifetime-secondary"] .price-off')).toHaveText('50% off');
  // The struck figure is the list charge; the comparison uses the regional month.
  await expect(page.locator('.pr-card--quarterly s[data-list-price]')).toHaveText('$29');
  await expect(page.locator('.pr-card--quarterly .price')).toContainText('$14.50');
  await expect(page.locator('.pr-card--quarterly .price')).toContainText('$4.83 a month');
  await expect(page.locator('.pr-card--quarterly .billing-note')).toContainText('Billed as $14.50 today. Renews every 3 months.');
  await expect(page.locator('.pr-card--quarterly .billing-note')).toContainText('$14.50 instead of $18 month to month.');
  await expect(page.locator('.pr-card--monthly s[data-list-price]')).toHaveText('$12');
  await expect(page.getByTestId('pricing-assurance')).toContainText('The regional price is the same every day, with no countdowns.');
  await expect(page.getByTestId('pricing-assurance')).not.toContainText('No sale prices');
  await expect(page.locator('[data-testid="pricing-lifetime-secondary"] s[data-list-price]')).toHaveText('$199');
  await expect(page.getByTestId('pricing-lifetime-secondary')).toContainText('$99.50');
  await expect(page.locator('body')).not.toContainText(/limited time|offer ending|was \$/i);
  // The student terms name the regional price only for a visitor who has one.
  await expect(page.getByTestId('pricing-discounts')).toContainText('Never combined with the regional price: you get the better of the two.');

  await page.setViewportSize({ width: 390, height: 900 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test('the homepage pricing section shows the same regional prices as /pricing', async ({ page }) => {
  await page.route(/\/api\/billing\/checkout\/config(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({
        ...V2_CHECKOUT_CONFIG,
        pricing: {
          student: { multiplier: 0.6, planIds: ['annual'] },
          regional: {
            countryCode: 'TR',
            countryName: 'Türkiye',
            multiplier: 0.5,
            prices: { monthly: 600, quarterly: 1450, annual: 3950, lifetime: 9950 },
          },
        },
      }),
    });
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const section = page.locator('app-pricing-plans-section');
  // The homepage loads the checkout config when the section comes into view.
  await section.scrollIntoViewIfNeeded();

  await expect(section.getByTestId('pricing-regional-line')).toContainText('Prices for Türkiye: 50% off the list price');
  await expect(section.locator('.pr-card--quarterly s[data-list-price]')).toHaveText('$9.67');
  await expect(section.locator('.pr-card--quarterly .price')).toContainText('$4.83');
  await expect(section.locator('.pr-card--quarterly .billing-note')).toContainText('$14.50 billed every 3 months');
  await expect(section.locator('.pr-card--monthly s[data-list-price]')).toHaveText('$12');
  await expect(section.locator('.pr-card--monthly .price-off')).toHaveText('50% off');

  await page.setViewportSize({ width: 390, height: 900 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});
