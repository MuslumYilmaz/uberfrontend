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
  await expect(page.getByTestId('pricing-trust-strip')).toContainText('Limited-use refund requests are reviewed under the Refund Policy');
  await expect(page.getByTestId('pricing-trust-strip').getByRole('link', { name: /limited-use refund/i })).toHaveAttribute('href', '/legal/refund');
  await expect(page.locator('.risk-reversal')).toContainText('generally require limited Premium usage');
  await expect(page.locator('.risk-reversal')).toContainText('Renewal charges and unused subscription time are generally non-refundable');
  await expect(page.locator('input[name*="coupon"], input[name*="promo"]')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(/money-back guarantee|where available|expanding/i);
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
