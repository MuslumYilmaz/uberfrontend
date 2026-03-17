import { isPlatformBrowser } from '@angular/common';
import { Injectable, NgZone, PLATFORM_ID, inject, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export type AuthSessionState = 'unknown' | 'authenticated' | 'refreshing' | 'signed_out';
export type AuthSyncEventType = 'login' | 'logout' | 'session_expired';

export interface AuthSyncEvent {
  type: AuthSyncEventType;
  epoch: number;
  local: boolean;
  originId: string;
  at: number;
}

@Injectable({ providedIn: 'root' })
export class AuthSessionAuthorityService {
  static readonly SESSION_HINT_KEY = 'fa:auth:session';
  private static readonly STORAGE_EVENT_KEY = 'fa:auth:event';
  private static readonly CHANNEL_NAME = 'fa:auth';

  private readonly platformId = inject(PLATFORM_ID);
  private readonly zone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly originId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `auth-${Date.now()}-${Math.random()}`;

  readonly state = signal<AuthSessionState>('unknown');
  readonly epoch = signal(0);

  private readonly eventsSubject = new Subject<AuthSyncEvent>();
  readonly events$: Observable<AuthSyncEvent> = this.eventsSubject.asObservable();

  private channel: BroadcastChannel | null = null;

  constructor() {
    if (!this.isBrowser) {
      this.state.set('signed_out');
      return;
    }

    this.state.set(this.hasSessionHint() ? 'unknown' : 'signed_out');
    this.installSync();
  }

  hasSessionHint(): boolean {
    if (!this.isBrowser) return false;
    try {
      return localStorage.getItem(AuthSessionAuthorityService.SESSION_HINT_KEY) === '1';
    } catch {
      return false;
    }
  }

  noteSessionHintPresent(): void {
    this.setSessionHint(true);
  }

  getContextId(): string {
    return this.originId;
  }

  captureEpoch(): number {
    return this.epoch();
  }

  isCurrentEpoch(epoch: number): boolean {
    return this.epoch() === epoch;
  }

  markRefreshing(): void {
    if (this.state() !== 'signed_out') {
      this.state.set('refreshing');
    }
  }

  commitAuthenticated(options?: { broadcast?: boolean }): AuthSyncEvent {
    const wasAuthenticated = this.state() === 'authenticated' && this.hasSessionHint();
    this.setSessionHint(true);
    this.state.set('authenticated');
    return this.publish('login', true, options?.broadcast === true, !wasAuthenticated);
  }

  forceSignOut(reason: 'logout' | 'session_expired' = 'logout', options?: { broadcast?: boolean }): AuthSyncEvent {
    this.setSessionHint(false);
    this.state.set('signed_out');
    return this.publish(reason, true, options?.broadcast !== false, true);
  }

  finishRefresh(): void {
    if (this.state() === 'signed_out') return;
    this.state.set(this.hasSessionHint() ? 'authenticated' : 'signed_out');
  }

  private installSync(): void {
    if (!this.isBrowser) return;

    try {
      this.channel = new BroadcastChannel(AuthSessionAuthorityService.CHANNEL_NAME);
      this.channel.addEventListener('message', (event: MessageEvent<AuthSyncEvent>) => {
        this.handleIncomingEvent(event.data);
      });
    } catch {
      this.channel = null;
    }

    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key !== AuthSessionAuthorityService.STORAGE_EVENT_KEY || !event.newValue) return;
      try {
        const payload = JSON.parse(event.newValue) as AuthSyncEvent;
        this.handleIncomingEvent(payload);
      } catch {
        // Ignore malformed cross-tab auth payloads.
      }
    });
  }

  private handleIncomingEvent(event: AuthSyncEvent | null | undefined): void {
    if (!event || event.originId === this.originId) return;

    this.zone.run(() => {
      if (event.type === 'login') {
        this.setSessionHint(true);
        this.state.set('unknown');
      } else {
        this.setSessionHint(false);
        this.state.set('signed_out');
      }
      const nextEpoch = this.epoch() + 1;
      this.epoch.set(nextEpoch);
      this.eventsSubject.next({
        ...event,
        local: false,
        epoch: nextEpoch,
      });
    });
  }

  private publish(type: AuthSyncEventType, local: boolean, broadcast: boolean, bumpEpoch: boolean): AuthSyncEvent {
    const nextEpoch = bumpEpoch ? this.epoch() + 1 : this.epoch();
    if (bumpEpoch) {
      this.epoch.set(nextEpoch);
    }

    const event: AuthSyncEvent = {
      type,
      local,
      originId: this.originId,
      epoch: nextEpoch,
      at: Date.now(),
    };

    this.eventsSubject.next(event);

    if (broadcast && this.isBrowser) {
      try {
        this.channel?.postMessage(event);
      } catch {
        // Ignore BroadcastChannel delivery failures and fall back to storage events.
      }

      try {
        localStorage.setItem(AuthSessionAuthorityService.STORAGE_EVENT_KEY, JSON.stringify(event));
        localStorage.removeItem(AuthSessionAuthorityService.STORAGE_EVENT_KEY);
      } catch {
        // Ignore storage sync failures.
      }
    }

    return event;
  }

  private setSessionHint(on: boolean): void {
    if (!this.isBrowser) return;
    try {
      if (on) localStorage.setItem(AuthSessionAuthorityService.SESSION_HINT_KEY, '1');
      else localStorage.removeItem(AuthSessionAuthorityService.SESSION_HINT_KEY);
    } catch {
      // Ignore localStorage failures.
    }
  }
}
