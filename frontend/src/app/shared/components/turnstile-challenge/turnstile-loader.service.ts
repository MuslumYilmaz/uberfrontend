import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { TurnstileApi, TurnstileWindow } from './turnstile-challenge.types';

const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-script';
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TURNSTILE_SCRIPT_LOAD_TIMEOUT_MS = 10_000;

@Injectable({ providedIn: 'root' })
export class TurnstileLoaderService {
  readonly isBrowser: boolean;

  private loadPromise: Promise<TurnstileApi> | null = null;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  load(): Promise<TurnstileApi> {
    if (!this.isBrowser) {
      return Promise.reject(new Error('Turnstile can only be loaded in a browser.'));
    }

    const windowRef = this.document.defaultView as TurnstileWindow | null;
    if (!windowRef) {
      return Promise.reject(new Error('Turnstile requires a browser window.'));
    }

    const existingApi = this.getApi(windowRef);
    if (existingApi) return Promise.resolve(existingApi);
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise<TurnstileApi>((resolve, reject) => {
      let script = this.document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
      let timeoutId: number | null = null;
      let settled = false;

      const cleanupAttempt = (): void => {
        script?.removeEventListener('load', handleLoad);
        script?.removeEventListener('error', handleError);
        if (timeoutId !== null) {
          windowRef.clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      const rejectAndAllowRetry = (message: string): void => {
        if (settled) return;
        settled = true;
        cleanupAttempt();
        script?.remove();
        this.loadPromise = null;
        reject(new Error(message));
      };

      const handleLoad = (): void => {
        if (settled) return;
        const api = this.getApi(windowRef);
        if (!api) {
          rejectAndAllowRetry('Turnstile loaded without exposing its browser API.');
          return;
        }

        settled = true;
        cleanupAttempt();
        resolve(api);
      };

      const handleError = (): void => {
        rejectAndAllowRetry('Turnstile script could not be loaded.');
      };

      const shouldAppendScript = !script;
      if (!script) {
        script = this.document.createElement('script');
        script.id = TURNSTILE_SCRIPT_ID;
        script.src = TURNSTILE_SCRIPT_URL;
        script.async = true;
        script.defer = true;
        script.referrerPolicy = 'strict-origin-when-cross-origin';
      }

      script.addEventListener('load', handleLoad, { once: true });
      script.addEventListener('error', handleError, { once: true });
      timeoutId = windowRef.setTimeout(() => {
        rejectAndAllowRetry('Turnstile script loading timed out.');
      }, TURNSTILE_SCRIPT_LOAD_TIMEOUT_MS);
      if (shouldAppendScript) this.document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  private getApi(windowRef: TurnstileWindow | null): TurnstileApi | null {
    const api = windowRef?.turnstile;
    if (
      !api
      || typeof api.render !== 'function'
      || typeof api.reset !== 'function'
      || typeof api.remove !== 'function'
    ) {
      return null;
    }

    return api;
  }
}
