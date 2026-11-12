import { DOCUMENT, InjectionToken, inject } from '@angular/core';

export type StylesheetLoader = (href: string, name: string) => Promise<void>;

/**
 * Adds a `<link rel="stylesheet" data-name>` to `parent` and resolves once it
 * loads. A failed request is removed and made once more, so a single dropped
 * request on a flaky connection does not lose the stylesheet; the second
 * failure rejects. A stylesheet with the same name that already loaded is
 * reused.
 */
export function loadStylesheet(parent: HTMLElement, href: string, name: string, attempts = 2): Promise<void> {
  const loaded = Array.from(parent.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][data-name]'))
    .some((link) => link.dataset['name'] === name && !!link.sheet);
  if (loaded) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const attempt = (remaining: number) => {
      const link = parent.ownerDocument.createElement('link');
      link.rel = 'stylesheet';
      link.dataset['name'] = name;
      link.addEventListener('load', () => resolve(), { once: true });
      link.addEventListener('error', () => {
        link.remove();
        if (remaining > 1) attempt(remaining - 1);
        else reject(new Error(`Could not load the stylesheet ${href}.`));
      }, { once: true });
      link.href = href;
      parent.appendChild(link);
    };
    attempt(attempts);
  });
}

export const STYLESHEET_LOADER = new InjectionToken<StylesheetLoader>('STYLESHEET_LOADER', {
  providedIn: 'root',
  factory: () => {
    const doc = inject(DOCUMENT);
    return (href, name) => loadStylesheet(doc.head, href, name);
  },
});
