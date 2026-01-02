import { test, expect } from './fixtures';
import { getMonacoModelValue } from './helpers';

test('CDN update: creates new draft; old draft preserved; copy is explicit', async ({ page }) => {
  const qid = 'e2e-draft-versioning-q1';
  const v1Starter = `export default function answer() {\n  return "v1";\n}\n`;
  const v2Starter = `export default function answer() {\n  return "v2";\n}\n`;
  const marker = `// e2e-v1-${Date.now()}`;

  const phase: 'v2' = 'v2';

  await page.addInitScript(({ qid, v1Starter, marker }) => {
    localStorage.setItem('fa:cdn:enabled', '1');

    // Pretend the user previously saved a draft for v1.
    const now = new Date().toISOString();
    localStorage.setItem(`fa:draftIndex:${qid}`, JSON.stringify({
      latestVersion: 'v1',
      versions: [{ version: 'v1', updatedAt: now, lang: 'js' }],
    }));

    localStorage.setItem(`v2:code:js2:${qid}@v1`, JSON.stringify({
      version: 'v2',
      updatedAt: now,
      lastLang: 'js',
      js: { code: `${v1Starter}\n${marker}\n`, baseline: v1Starter, updatedAt: now },
      ts: { code: v1Starter, baseline: v1Starter, updatedAt: now },
    }));

    // Ensure the LS -> IDB mirror runs on app bootstrap.
    localStorage.removeItem('fa:js:idb:migrated:v1');
  }, { qid, v1Starter, marker });

  await page.route('**/data-version.json**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ dataVersion: 'bank-v2' }),
    });
  });

  await page.route('**/questions/javascript/coding.json**', async (route) => {
    const question = {
      id: qid,
      title: 'Draft Versioning (v2)',
      type: 'coding',
      technology: 'javascript',
      difficulty: 'easy',
      importance: 1,
      tags: ['e2e'],
      access: 'free',
      contentVersion: 'v2',
      starterCode: v2Starter,
      tests: `// not relevant for this e2e\n`,
      description: { summary: 'v2 description' },
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([question]),
    });
  });

  // ---- V2: load latest, should start fresh ----
  await page.goto(`/javascript/coding/${qid}`);
  await expect(page.getByTestId('js-panel')).toBeVisible();

  const codeModelKey = `q-${qid}-code`;
  await expect(page.getByTestId('draft-update-banner')).toBeVisible();

  await expect.poll(() => getMonacoModelValue(page, codeModelKey)).not.toContain(marker);
  await expect.poll(() => getMonacoModelValue(page, codeModelKey)).toContain('return "v2"');

  // ---- Open older draft ----
  await page.getByTestId('draft-update-open-older').click();
  await expect(page.getByTestId('older-draft-label')).toBeVisible();
  await expect.poll(() => getMonacoModelValue(page, codeModelKey)).toContain(marker);

  // ---- Copy older into latest (explicit) ----
  await page.getByTestId('draft-update-copy-into-latest').click();
  await expect(page.getByTestId('older-draft-label')).toBeHidden();
  await expect.poll(() => getMonacoModelValue(page, codeModelKey)).toContain(marker);

  // Storage assertions (IDB primary): both versions exist and are preserved.
  const readJsBundle = async (key: string) => {
    return page.evaluate(async (k: string) => {
      const openReq = indexedDB.open('frontendatlas');
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        openReq.onsuccess = () => resolve(openReq.result);
        openReq.onerror = () => reject(openReq.error);
      });

      try {
        const tx = db.transaction('fa_js', 'readonly');
        const store = tx.objectStore('fa_js');
        const getReq = store.get(k);
        return await new Promise<unknown>((resolve) => {
          getReq.onsuccess = () => resolve(getReq.result);
          getReq.onerror = () => resolve(null);
        });
      } finally {
        try { db.close(); } catch { /* ignore */ }
      }
    }, key);
  };

  await expect.poll(() => readJsBundle(`v2:code:js2:${qid}@v1`)).toContain(marker);
  await expect.poll(() => readJsBundle(`v2:code:js2:${qid}@v2`)).toContain(marker);
});
