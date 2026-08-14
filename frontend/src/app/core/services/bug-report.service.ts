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
  verificationToken = signal('');
  website = signal('');
  error = signal<string | null>(null);
  supportFallbackVisible = signal(false);
  context = signal<BugReportContext | null>(null);
  cooldownSeconds = signal(0);
  canSubmit = computed(() => {
    const length = this.note().trim().length;
    return !this.submitting()
      && this.cooldownSeconds() === 0
      && this.verificationToken().trim().length > 0
      && length >= this.minNoteChars
      && length <= this.maxNoteChars;
  });

  private closeTimer?: number;
  private cooldownTimer?: number;
  private readonly cooldownMs = 30_000;

  constructor(private http: HttpClient) { }

  open(context: BugReportContext): void {
    if (this.closeTimer && typeof window !== 'undefined') {
      window.clearTimeout(this.closeTimer);
      this.closeTimer = undefined;
    }

    this.context.set(context);
    this.note.set('');
    this.verificationToken.set('');
    this.website.set('');
    this.error.set(null);
    this.supportFallbackVisible.set(false);
    this.submitOk.set(false);
    this.visible.set(true);
  }

  close(): void {
    if (this.submitting()) return;
    this.verificationToken.set('');
    this.website.set('');
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

    const verificationToken = this.verificationToken().trim();
    if (!verificationToken) {
      this.error.set('Please complete the verification check before sending your report.');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.supportFallbackVisible.set(false);

    try {
      const payload = this.composePayload(
        trimmed,
        verificationToken,
        this.website()
      );
      await firstValueFrom(this.http.post(apiUrl('/bug-report'), payload, { responseType: 'text' }));

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
      // Turnstile tokens are single-use. Never allow a completed backend attempt
      // to be retried with the same token, regardless of the response status.
      this.verificationToken.set('');
      this.submitting.set(false);
    }
  }

  private composePayload(
    note: string,
    verificationToken: string,
    website: string
  ): { note: string; url: string; verificationToken: string; website: string } {
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
      verificationToken,
      website,
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

  private mapSubmitError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 429) {
        const retryAfter = this.parseRetryAfterSeconds(err.headers?.get('Retry-After'));
        if (retryAfter > 0) {
          this.startCooldown(retryAfter * 1000);
          return `Too many reports right now. Please wait ${retryAfter}s and try again.`;
        }
        return 'Too many reports right now. Please try again in a bit.';
      }

      const apiError = this.parseApiError(err.error);
      const apiCode = apiError.code;
      if (err.status === 503 || apiCode === 'FORM_PROTECTION_UNAVAILABLE') {
        this.supportFallbackVisible.set(true);
        return 'Bug report verification is temporarily unavailable. Please email support instead.';
      }
      if (apiCode === 'FORM_VERIFICATION_REQUIRED') {
        return 'Please complete the verification check before sending your report.';
      }
      if (apiCode === 'FORM_VERIFICATION_FAILED') {
        return 'We could not verify this submission. Please complete the check again.';
      }

      if (apiError.message) return apiError.message;
    }
    return 'Failed to send bug report. Please try again.';
  }

  private parseRetryAfterSeconds(value: string | null | undefined): number {
    const raw = String(value || '').trim();
    if (!raw) return 0;

    const seconds = Number(raw);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.ceil(seconds);
    }

    const retryAt = Date.parse(raw);
    if (!Number.isFinite(retryAt)) return 0;
    return Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
  }

  private parseApiError(value: unknown): { code: string; message: string } {
    let body = value;

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body) as unknown;
      } catch {
        return { code: '', message: '' };
      }
    }

    if (!body || typeof body !== 'object') {
      return { code: '', message: '' };
    }

    const candidate = body as { code?: unknown; error?: unknown };
    return {
      code: typeof candidate.code === 'string' ? candidate.code : '',
      message: typeof candidate.error === 'string' ? candidate.error : '',
    };
  }
}
