import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppUiStylesService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly coreStylesheets = [
    '/assets/vendor/primeng/resources/themes/lara-dark-amber/theme.css',
    '/assets/vendor/primeng/resources/primeng.min.css',
    '/assets/vendor/primeicons/primeicons.css',
  ];
  private readonly iconFontStylesheets = [
    '/assets/vendor/fontawesome/css/all.min.css',
  ];
  private coreLoaded = false;
  private iconFontsLoaded = false;
  private iconFontsScheduled = false;

  ensureCoreLoaded(): void {
    if (!this.isBrowser || this.coreLoaded) return;

    this.appendStylesheets(this.coreStylesheets);
    this.coreLoaded = true;
  }

  ensureIconFontsLoaded(options: { defer?: boolean } = {}): void {
    if (!this.isBrowser || this.iconFontsLoaded) return;

    const load = () => {
      if (this.iconFontsLoaded) return;
      this.iconFontsScheduled = false;
      this.appendStylesheets(this.iconFontStylesheets);
      this.iconFontsLoaded = true;
    };

    if (options.defer) {
      if (this.iconFontsScheduled) return;
      this.iconFontsScheduled = true;
      this.schedulePostLoad(load);
      return;
    }

    load();
  }

  ensureLoaded(): void {
    this.ensureCoreLoaded();
    this.ensureIconFontsLoaded();
  }

  private appendStylesheets(hrefs: string[]): void {
    hrefs.forEach((href) => {
      if (this.document.head.querySelector(`link[data-app-ui-style="${href}"]`)) {
        return;
      }

      const link = this.document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.dataset['appUiStyle'] = href;
      this.document.head.appendChild(link);
    });
  }

  private schedulePostLoad(task: () => void): void {
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
    };

    if (typeof win.requestIdleCallback === 'function') {
      win.requestIdleCallback(task, { timeout: 6500 });
      return;
    }

    window.setTimeout(task, 2600);
  }
}
