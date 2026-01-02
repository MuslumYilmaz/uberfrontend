import type { Page } from '@playwright/test';

export const JS_QUESTION = {
  tech: 'javascript',
  id: 'js-number-clamp',
  title: 'Clamp',
} as const;

export const WEB_QUESTION = {
  tech: 'html',
  id: 'html-basic-structure',
  title: 'Warm-Up: Basic Structure',
} as const;

export async function waitForMonacoModel(page: Page, modelKeyPart: string) {
  await page.waitForFunction((needle: string) => {
    const monaco = (window as any).monaco;
    const models = monaco?.editor?.getModels?.() || [];
    return models.some((m: any) => (m?.uri?.toString?.() || '').includes(needle));
  }, modelKeyPart);
}

export async function setMonacoModelValue(page: Page, modelKeyPart: string, value: string) {
  await waitForMonacoModel(page, modelKeyPart);
  await page.evaluate(({ needle, value }: { needle: string; value: string }) => {
    const monaco = (window as any).monaco;
    const models = monaco?.editor?.getModels?.() || [];
    const model = models.find((x: any) => (x?.uri?.toString?.() || '').includes(needle));
    if (!model?.setValue) throw new Error(`Monaco model not found: ${needle}`);
    model.setValue(value);
  }, { needle: modelKeyPart, value });
}

export async function getMonacoModelValue(page: Page, modelKeyPart: string): Promise<string> {
  await waitForMonacoModel(page, modelKeyPart);
  return page.evaluate((needle: string) => {
    const monaco = (window as any).monaco;
    const models = monaco?.editor?.getModels?.() || [];
    const model = models.find((x: any) => (x?.uri?.toString?.() || '').includes(needle));
    return model?.getValue?.() || '';
  }, modelKeyPart);
}

export async function waitForIndexedDbContains(
  page: Page,
  opts: { dbName: string; storeName: string; key: string; substring: string }
) {
  await page.waitForFunction(async ({ dbName, storeName, key, substring }) => {
    try {
      const openReq = indexedDB.open(dbName);
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        openReq.onsuccess = () => resolve(openReq.result);
        openReq.onerror = () => reject(openReq.error);
      });

      try {
        let raw: unknown = null;
        try {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const getReq = store.get(key);
          raw = await new Promise<unknown>((resolve) => {
            getReq.onsuccess = () => resolve(getReq.result);
            getReq.onerror = () => resolve(null);
          });
        } catch {
          return false;
        }
        return typeof raw === 'string' && raw.includes(substring);
      } finally {
        try { db.close(); } catch { /* ignore */ }
      }
    } catch {
      return false;
    }
  }, opts);
}

export async function waitForIndexedDbNotContains(
  page: Page,
  opts: { dbName: string; storeName: string; key: string; substring: string }
) {
  await page.waitForFunction(async ({ dbName, storeName, key, substring }) => {
    try {
      const openReq = indexedDB.open(dbName);
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        openReq.onsuccess = () => resolve(openReq.result);
        openReq.onerror = () => reject(openReq.error);
      });

      try {
        let raw: unknown = null;
        try {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const getReq = store.get(key);
          raw = await new Promise<unknown>((resolve) => {
            getReq.onsuccess = () => resolve(getReq.result);
            getReq.onerror = () => resolve(null);
          });
        } catch {
          return true;
        }
        return typeof raw !== 'string' || !raw.includes(substring);
      } finally {
        try { db.close(); } catch { /* ignore */ }
      }
    } catch {
      return true;
    }
  }, opts);
}

export async function waitForIndexedDbKeyPrefixContains(
  page: Page,
  opts: { dbName: string; storeName: string; keyPrefix: string; substring: string }
) {
  await page.waitForFunction(async ({ dbName, storeName, keyPrefix, substring }) => {
    try {
      const openReq = indexedDB.open(dbName);
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        openReq.onsuccess = () => resolve(openReq.result);
        openReq.onerror = () => reject(openReq.error);
      });

      try {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);

        return await new Promise<boolean>((resolve) => {
          const req = store.openCursor();
          req.onsuccess = () => {
            const cursor = req.result;
            if (!cursor) return resolve(false);
            const k = String(cursor.key ?? '');
            if (k.startsWith(String(keyPrefix ?? ''))) {
              const v = cursor.value;
              if (typeof v === 'string' && v.includes(String(substring ?? ''))) {
                return resolve(true);
              }
            }
            cursor.continue();
          };
          req.onerror = () => resolve(false);
        });
      } finally {
        try { db.close(); } catch { /* ignore */ }
      }
    } catch {
      return false;
    }
  }, opts);
}

export async function waitForIndexedDbKeyPrefixNotContains(
  page: Page,
  opts: { dbName: string; storeName: string; keyPrefix: string; substring: string }
) {
  await page.waitForFunction(async ({ dbName, storeName, keyPrefix, substring }) => {
    try {
      const openReq = indexedDB.open(dbName);
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        openReq.onsuccess = () => resolve(openReq.result);
        openReq.onerror = () => reject(openReq.error);
      });

      try {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);

        return await new Promise<boolean>((resolve) => {
          const req = store.openCursor();
          req.onsuccess = () => {
            const cursor = req.result;
            if (!cursor) return resolve(true);
            const k = String(cursor.key ?? '');
            if (k.startsWith(String(keyPrefix ?? ''))) {
              const v = cursor.value;
              if (typeof v === 'string' && v.includes(String(substring ?? ''))) {
                return resolve(false);
              }
            }
            cursor.continue();
          };
          req.onerror = () => resolve(true);
        });
      } finally {
        try { db.close(); } catch { /* ignore */ }
      }
    } catch {
      return true;
    }
  }, opts);
}

export async function waitForIframeReady(page: Page, iframeTestId: string) {
  await page.getByTestId(iframeTestId).waitFor({ state: 'attached' });
  await page
    .frameLocator(`[data-testid="${iframeTestId}"]`)
    .locator('body')
    .waitFor({ state: 'attached' });
}
