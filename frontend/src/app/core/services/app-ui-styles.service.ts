import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppUiStylesService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly stylesheets = [
    '/assets/vendor/primeng/resources/themes/lara-dark-amber/theme.css',
    '/assets/vendor/primeng/resources/primeng.min.css',
    '/assets/vendor/primeicons/primeicons.css',
    '/assets/vendor/fontawesome/css/all.min.css',
  ];
  private loaded = false;

  ensureLoaded(): void {
    if (!this.isBrowser || this.loaded) return;

    this.stylesheets.forEach((href) => {
      if (this.document.head.querySelector(`link[data-app-ui-style="${href}"]`)) {
        return;
      }

      const link = this.document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.dataset['appUiStyle'] = href;
      this.document.head.appendChild(link);
    });

    this.loaded = true;
  }
}
