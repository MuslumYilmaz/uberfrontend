import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, DOCUMENT } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AnalyticsService } from './analytics.service';

/**
 * The queue function from Clarity's install snippet. The tag replaces it when
 * it loads and drains `q`, so calls made before then are not lost.
 */
type ClarityQueue = ((...args: unknown[]) => void) & { q?: IArguments[] };

type ClarityWindow = Window & { clarity?: ClarityQueue };

export const CLARITY_SCRIPT_ID = 'clarity-script';
const CLARITY_TAG_BASE = 'https://www.clarity.ms/tag/';
// Project ids are short alphanumerics; anything else never reaches the URL.
const CLARITY_PROJECT_ID_PATTERN = /^[a-z0-9]+$/i;

/**
 * Microsoft Clarity: heatmaps and session recordings.
 *
 * The tag loads at most once per page, only in the browser, only with a
 * configured project id, and never for automation visitors (Playwright,
 * headless, webdriver), reusing the GA visitor classification. Unlike GA it is
 * not behind the session-qualification gate: the first seconds of a visit are
 * what the recordings are for. Tags, events and upgrades requested before
 * `ensureLoaded()` are kept in order and handed to Clarity's queue then.
 */
@Injectable({ providedIn: 'root' })
export class ClarityService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly document = inject(DOCUMENT);
  private readonly analytics = inject(AnalyticsService);
  private readonly projectId = String(environment.clarityProjectId || '').trim();
  private readonly enabled =
    this.isBrowser
    && CLARITY_PROJECT_ID_PATTERN.test(this.projectId)
    && this.analytics.getVisitorClass() !== 'automation';
  private loaded = false;
  private pending: unknown[][] = [];

  isEnabled(): boolean {
    return this.enabled;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  /** Injects the Clarity tag once. Safe to call on every navigation. */
  ensureLoaded(): void {
    if (!this.enabled || this.loaded) return;
    this.loaded = true;

    const clarity = this.getQueue();
    const pending = this.pending;
    this.pending = [];
    pending.forEach((args) => clarity(...args));

    if (this.document.getElementById(CLARITY_SCRIPT_ID)) return;
    const script = this.document.createElement('script');
    script.id = CLARITY_SCRIPT_ID;
    script.async = true;
    script.src = `${CLARITY_TAG_BASE}${encodeURIComponent(this.projectId)}`;
    this.document.head.appendChild(script);
  }

  /** Custom tag; appears as a filter in the Clarity dashboard. */
  set(key: string, value: string | string[]): void {
    this.call('set', key, value);
  }

  /** Custom event. Clarity takes a name only, no parameters. */
  event(name: string): void {
    this.call('event', name);
  }

  /** Asks Clarity to prioritize this session for recording. */
  upgrade(reason: string): void {
    this.call('upgrade', reason);
  }

  private call(...args: unknown[]): void {
    if (!this.enabled) return;
    if (!this.loaded) {
      this.pending.push(args);
      return;
    }
    this.getQueue()(...args);
  }

  private getQueue(): ClarityQueue {
    const scope = window as ClarityWindow;
    if (typeof scope.clarity !== 'function') {
      // Same shape as the official snippet: `(c[a].q = c[a].q || []).push(arguments)`.
      const shim: ClarityQueue = function clarityShim(this: unknown) {
        (shim.q = shim.q || []).push(arguments);
      } as ClarityQueue;
      scope.clarity = shim;
    }
    return scope.clarity;
  }
}
