import type { Page } from '@playwright/test';

type FillFieldOptions = {
  timeoutMs?: number;
};

type CheckoutFieldSelectors = string[];

const FIELD_SELECTORS = {
  email: [
    'input[type="email"]',
    'input[name="email"]',
    'input[placeholder*="email" i]',
  ],
  name: [
    'input[name="name"]',
    'input[autocomplete="cc-name"]',
    'input[placeholder*="name" i]',
  ],
  cardNumber: [
    'input[name="cardnumber"]',
    'input[autocomplete="cc-number"]',
    'input[placeholder*="card number" i]',
  ],
  expiry: [
    'input[name="exp-date"]',
    'input[autocomplete="cc-exp"]',
    'input[placeholder*="MM" i]',
    'input[placeholder*="exp" i]',
  ],
  cvc: [
    'input[name="cvc"]',
    'input[autocomplete="cc-csc"]',
    'input[placeholder*="CVC" i]',
    'input[placeholder*="security" i]',
  ],
  postal: [
    'input[name="postal"]',
    'input[autocomplete="postal-code"]',
    'input[placeholder*="zip" i]',
    'input[placeholder*="postal" i]',
  ],
} satisfies Record<string, CheckoutFieldSelectors>;

async function tryFillInPageOrFrames(
  page: Page,
  selectors: CheckoutFieldSelectors,
  value: string,
  opts: FillFieldOptions = {}
): Promise<boolean> {
  const timeoutMs = opts.timeoutMs ?? 20_000;
  const start = Date.now();
  const trimmed = String(value ?? '');

  while (Date.now() - start < timeoutMs) {
    for (const selector of selectors) {
      const loc = page.locator(selector);
      if (await loc.count()) {
        await loc.first().fill(trimmed);
        return true;
      }
    }

    for (const frame of page.frames()) {
      for (const selector of selectors) {
        const loc = frame.locator(selector);
        if (await loc.count()) {
          await loc.first().fill(trimmed);
          return true;
        }
      }
    }

    await page.waitForTimeout(300);
  }

  return false;
}

export async function fillLemonSqueezyCheckout(
  page: Page,
  data: {
    email: string;
    name: string;
    cardNumber: string;
    expiry: string;
    cvc: string;
    postal?: string;
  }
) {
  await tryFillInPageOrFrames(page, FIELD_SELECTORS.email, data.email, { timeoutMs: 12_000 });
  await tryFillInPageOrFrames(page, FIELD_SELECTORS.name, data.name);
  await tryFillInPageOrFrames(page, FIELD_SELECTORS.cardNumber, data.cardNumber);
  await tryFillInPageOrFrames(page, FIELD_SELECTORS.expiry, data.expiry);
  await tryFillInPageOrFrames(page, FIELD_SELECTORS.cvc, data.cvc);
  if (data.postal) {
    await tryFillInPageOrFrames(page, FIELD_SELECTORS.postal, data.postal);
  }
}

export async function detectTestModeIndicator(page: Page): Promise<boolean> {
  const indicator = page.locator('text=/test mode|test card|sandbox/i');
  if (await indicator.count()) {
    return indicator.first().isVisible().catch(() => false);
  }
  return false;
}
