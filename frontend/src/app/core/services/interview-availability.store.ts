import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize, of, shareReplay, tap } from 'rxjs';
import { InterviewAvailability } from '../models/interview.model';
import { AuthService } from './auth.service';
import { InterviewService } from './interview.service';

export interface InterviewAvailabilityResolveOptions {
  force?: boolean;
  maxAgeMs?: number;
}

interface AvailabilityCacheEntry {
  principal: string;
  expiresAt: number;
  value: InterviewAvailability;
}

@Injectable({ providedIn: 'root' })
export class InterviewAvailabilityStore {
  private readonly auth = inject(AuthService);
  private readonly interviews = inject(InterviewService);
  private readonly availabilitySignal = signal<InterviewAvailability | null>(null);
  private cache: AvailabilityCacheEntry | null = null;
  private inFlight: { principal: string; request: Observable<InterviewAvailability> } | null = null;

  readonly snapshot = this.availabilitySignal.asReadonly();

  resolve({
    force = false,
    maxAgeMs = 5_000,
  }: InterviewAvailabilityResolveOptions = {}): Observable<InterviewAvailability> {
    const principal = this.principalKey();
    const now = Date.now();
    const boundedMaxAge = Math.max(0, Math.min(30_000, Math.floor(maxAgeMs)));
    if (
      !force
      && this.cache?.principal === principal
      && this.cache.expiresAt > now
    ) {
      return of(this.cache.value);
    }
    if (!force && this.inFlight?.principal === principal) return this.inFlight.request;

    let request!: Observable<InterviewAvailability>;
    request = this.interviews.getAvailability().pipe(
      tap((value) => {
        this.cache = {
          principal,
          expiresAt: Date.now() + boundedMaxAge,
          value,
        };
        this.availabilitySignal.set(value);
      }),
      finalize(() => {
        if (this.inFlight?.request === request) this.inFlight = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.inFlight = { principal, request };
    return request;
  }

  refresh(): Observable<InterviewAvailability> {
    return this.resolve({ force: true });
  }

  invalidate(): void {
    this.cache = null;
    this.availabilitySignal.set(null);
  }

  private principalKey(): string {
    const user = this.auth.user();
    return user ? `${user._id}:${user.role}` : 'signed-out';
  }
}
