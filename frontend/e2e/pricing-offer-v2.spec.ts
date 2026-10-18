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
  await expect(page.locator('.rec-badge')).toHaveCount(1);
  await expect(page.getByTestId('pricing-lifetime-secondary')).toBeVisible();
  await expect(page.getByTestId('pricing-trust-strip')).toContainText('Taxes included');
  await expect(page.getByTestId('pricing-trust-strip')).toContainText('14-day refund on your first purchase');
  await expect(page.getByTestId('pricing-trust-strip').getByRole('link', { name: /14-day refund/i })).toHaveAttribute('href', '/legal/refund');
  await expect(page.locator('input[name*="coupon"], input[name*="promo"]')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(/money-back guarantee|where available|expanding/i);
  // Full-page presentation: monthly-equivalent headline, one filled CTA, a visible discounts block, no sidebar.
  await expect(quarterly.locator('.price')).toContainText('$9.67');
  await expect(quarterly.locator('.billing-note')).toContainText('$29 billed every 3 months');
  await expect(quarterly.locator('.btn')).not.toHaveClass(/btn--outline/);
  await expect(monthly.locator('.btn')).toHaveClass(/btn--outline/);
  await expect(page.getByTestId('pricing-discounts')).toContainText('40% off');
  await expect(page.getByTestId('pricing-student-action')).toHaveAttribute('href', '/auth/signup?src=pricing_student_discount');
  await expect(page.locator('app-sidebar')).toHaveCount(0);
  const productProof = page.getByTestId('pricing-product-proof');
  const productProofImage = productProof.getByRole('img', {
    name: 'FrontendAtlas React Counter workspace with prompt, code editor, live preview, and run checks controls',
  });
  await expect(productProof).toBeVisible();
  await expect(productProofImage).toHaveAttribute('src', 'assets/images/product-proof/react-counter-workspace.jpg');
  await expect(productProofImage).toHaveAttribute('loading', 'lazy');
  await expect(productProof.getByRole('link', { name: 'Open free React Counter challenge' })).toHaveAttribute(
    'href',
    '/react/coding/react-counter?src=pricing_product_proof',
  );
  await expect(productProof.getByRole('link', { name: 'Preview a guided solution' })).toHaveAttribute(
    'href',
    '/javascript/coding/js-throttle?src=pricing_product_proof',
  );

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
  await expect(primaryCards).toHaveCount(3);
  expect(await primaryCards.evaluateAll((cards) => cards.map((card) => (
    card.classList.contains('pr-card--quarterly')
      ? 'quarterly'
      : card.classList.contains('pr-card--monthly')
        ? 'monthly'
        : 'annual'
  )))).toEqual(['quarterly', 'monthly', 'annual']);
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
          },
        },
      }),
    });
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/pricing');

  await expect(page.getByTestId('pricing-regional-line')).toContainText('Prices for Türkiye: 50% off the list price, applied automatically at checkout.');
  // The badge leads the page above the headline, and each card names its own discount.
  const badgeBox = await page.getByTestId('pricing-regional-line').boundingBox();
  const headlineBox = await page.locator('.pr-hero h1').boundingBox();
  expect(badgeBox!.y).toBeLessThan(headlineBox!.y);
  await expect(page.locator('.pr-card--quarterly .price-off')).toHaveText('50% off');
  await expect(page.locator('[data-testid="pricing-lifetime-secondary"] .price-off')).toHaveText('50% off');
  await expect(page.locator('.pr-card--quarterly s[data-list-price]')).toHaveText('$9.67');
  await expect(page.locator('.pr-card--quarterly .price')).toContainText('$4.83');
  await expect(page.locator('.pr-card--quarterly .billing-note')).toContainText('$14.50 billed every 3 months');
  await expect(page.locator('.pr-card--monthly s[data-list-price]')).toHaveText('$12');
  await expect(page.locator('[data-testid="pricing-lifetime-secondary"] s[data-list-price]')).toHaveText('$199');
  await expect(page.getByTestId('pricing-lifetime-secondary')).toContainText('$99.50');
  await expect(page.locator('body')).not.toContainText(/limited time|offer ending|was \$/i);

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
