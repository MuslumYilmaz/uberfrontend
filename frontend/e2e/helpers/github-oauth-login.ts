import { expect, Page } from '@playwright/test';

export type GitHubOAuthCredentials = {
  login: string;
  password: string;
};

async function clickIfVisible(page: Page, selectors: string[], timeoutMs = 5_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    for (const selector of selectors) {
      const locator = page.locator(selector).first();
      if (await locator.isVisible().catch(() => false)) {
        await locator.click();
        return true;
      }
    }
    await page.waitForTimeout(250);
  }

  return false;
}

export async function completeGitHubOAuthLogin(page: Page, credentials: GitHubOAuthCredentials) {
  await page.waitForURL(/github\.com/i, { timeout: 60_000 });

  const loginInput = page.locator('input[name="login"], input#login_field').first();
  await expect(loginInput).toBeVisible({ timeout: 30_000 });
  await loginInput.fill(credentials.login);

  const passwordInput = page.locator('input[name="password"], input#password').first();
  await expect(passwordInput).toBeVisible({ timeout: 30_000 });
  await passwordInput.fill(credentials.password);

  await Promise.all([
    page.waitForLoadState('domcontentloaded'),
    page.locator('input[type="submit"], button[type="submit"]').first().click(),
  ]);

  const approved = await clickIfVisible(page, [
    'button[name="authorize"]',
    'button[type="submit"]',
    'input[type="submit"][value*="Authorize"]',
    'input[type="submit"][value*="Continue"]',
  ]);

  if (approved) {
    await page.waitForLoadState('domcontentloaded');
  }
}
