import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { apiUrl } from '../utils/api-base';

export interface BugReportContext {
  source: string;
  url: string;
  tech?: string;
  questionId?: string;
  questionTitle?: string;
  route?: string;
}

@Injectable({ providedIn: 'root' })
export class BugReportService {
  readonly minNoteChars = 8;
  readonly maxNoteChars = 2000;

  visible = signal(false);
  submitting = signal(false);
  submitOk = signal(false);
  note = signal('');
  error = signal<string | null>(null);
  context = signal<BugReportContext | null>(null);
  cooldownSeconds = signal(0);
  canSubmit = computed(() => {
    const length = this.note().trim().length;
    return !this.submitting()
      && this.cooldownSeconds() === 0
      && length >= this.minNoteChars
      && length <= this.maxNoteChars;
  });

  private closeTimer?: number;
  private cooldownTimer?: number;
  private lastFingerprint: string | null = null;
  private lastFingerprintAt = 0;
  private readonly cooldownMs = 30_000;
  private readonly duplicateWindowMs = 10 * 60_000;

  constructor(private http: HttpClient) { }

  open(context: BugReportContext): void {
    if (this.closeTimer && typeof window !== 'undefined') {
      window.clearTimeout(this.closeTimer);
      this.closeTimer = undefined;
    }

    this.context.set(context);
    this.note.set('');
    this.error.set(null);
    this.submitOk.set(false);
    this.visible.set(true);
  }

  close(): void {
    if (this.submitting()) return;
    this.visible.set(false);
  }

  async submit(note: string): Promise<void> {
    const trimmed = note.trim();
    if (this.submitting()) return;

    if (this.cooldownSeconds() > 0) {
      this.error.set(`Please wait ${this.cooldownSeconds()}s before sending another report.`);
      return;
    }
    if (trimmed.length < this.minNoteChars) {
      this.error.set(`Please add at least ${this.minNoteChars} characters.`);
      return;
    }
    if (trimmed.length > this.maxNoteChars) {
      this.error.set(`Please keep the report under ${this.maxNoteChars} characters.`);
      return;
    }

    const now = Date.now();
    const fingerprint = this.fingerprint(trimmed, this.context()?.url || '');
    if (this.lastFingerprint === fingerprint && now - this.lastFingerprintAt < this.duplicateWindowMs) {
      this.error.set('This looks like a duplicate report. Please wait before sending it again.');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    try {
      const payload = this.composePayload(trimmed);
      await firstValueFrom(this.http.post(apiUrl('/bug-report'), payload, { responseType: 'text' }));

      this.lastFingerprint = fingerprint;
      this.lastFingerprintAt = now;
      this.startCooldown(this.cooldownMs);

      this.submitOk.set(true);
      if (typeof window !== 'undefined') {
        this.closeTimer = window.setTimeout(() => {
          this.visible.set(false);
          this.note.set('');
          this.submitOk.set(false);
          this.error.set(null);
          this.closeTimer = undefined;
        }, 900);
      } else {
        this.visible.set(false);
        this.note.set('');
        this.submitOk.set(false);
      }
    } catch (err) {
      this.error.set(this.mapSubmitError(err));
    } finally {
      this.submitting.set(false);
    }
  }

  private composePayload(note: string): { note: string; url: string } {
    const ctx = this.context();
    const details: string[] = [];

    if (ctx?.source) details.push(`source: ${ctx.source}`);
    if (ctx?.route) details.push(`route: ${ctx.route}`);
    if (ctx?.tech) details.push(`tech: ${ctx.tech}`);
    if (ctx?.questionId) details.push(`questionId: ${ctx.questionId}`);
    if (ctx?.questionTitle) details.push(`questionTitle: ${ctx.questionTitle}`);

    const contextBlock = details.length
      ? `\n\n---\ncontext\n${details.join('\n')}`
      : '';

    return {
      note: `${note}${contextBlock}`,
      url: ctx?.url || (typeof window !== 'undefined' ? window.location.href : ''),
    };
  }

  private startCooldown(ms: number): void {
    if (typeof window === 'undefined') return;

    const until = Date.now() + Math.max(1000, ms);
    const tick = () => {
      const leftMs = until - Date.now();
      if (leftMs <= 0) {
        this.cooldownSeconds.set(0);
        if (this.cooldownTimer) {
          window.clearInterval(this.cooldownTimer);
          this.cooldownTimer = undefined;
        }
        return;
      }
      this.cooldownSeconds.set(Math.ceil(leftMs / 1000));
    };

    if (this.cooldownTimer) {
      window.clearInterval(this.cooldownTimer);
      this.cooldownTimer = undefined;
    }
    tick();
    this.cooldownTimer = window.setInterval(tick, 250);
  }

  private fingerprint(note: string, url: string): string {
    const normalizedNote = note.trim().toLowerCase().replace(/\s+/g, ' ');
    const normalizedUrl = String(url || '').trim().toLowerCase();
    return `${normalizedNote}|${normalizedUrl}`;
  }

  private mapSubmitError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 429) {
        const retryAfter = Number(err.headers?.get('Retry-After') || 0);
        if (Number.isFinite(retryAfter) && retryAfter > 0) {
          return `Too many reports right now. Please wait ${retryAfter}s and try again.`;
        }
        return 'Too many reports right now. Please try again in a bit.';
      }

      const apiMessage = typeof err.error?.error === 'string' ? err.error.error : '';
      if (apiMessage) return apiMessage;
    }
    return 'Failed to send bug report. Please try again.';
  }
}
