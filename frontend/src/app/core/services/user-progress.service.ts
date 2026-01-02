import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, signal } from '@angular/core';
import { AuthService, User } from './auth.service';
import { apiUrl } from '../utils/api-base';

const LS_SOLVED_GUEST = 'fa:solved:guest';

@Injectable({ providedIn: 'root' })
export class UserProgressService {
  private solved = signal<Set<string>>(new Set());
  solvedIds = computed(() => Array.from(this.solved()));

  constructor(private auth: AuthService, private http: HttpClient) {
    // Eagerly hydrate user when a token exists (guards against missing solved list on first load)
    if (this.auth.isLoggedIn()) {
      this.auth.ensureMe().subscribe((u) => {
        if (u) this.initFromUser(u);
      });
    }

    // React to auth changes
    effect(() => {
      const user = this.auth.user();
      if (user) {
        this.initFromUser(user);
        this.mergeGuestIntoBackend();
      } else {
        this.solved.set(new Set(this.readGuestSolved()));
      }
    }, { allowSignalWrites: true });

    // Seed for guests on startup
    if (!this.auth.user()) {
      this.solved.set(new Set(this.readGuestSolved()));
    }
  }

  isSolved(id: string): boolean {
    return this.solved().has(id);
  }

  /** Optimistic mark. Falls back to localStorage when logged out. */
  async markSolved(id: string): Promise<void> {
    if (!id) return;
    if (this.solved().has(id)) return;

    const next = new Set(this.solved());
    next.add(id);
    this.solved.set(next);

    const user = this.auth.user();
    if (!user) {
      this.writeGuestSolved(next);
      return;
    }

    try {
      const res = await this.http.post<{ solvedQuestionIds: string[] }>(
        apiUrl('/users/me/solved'),
        { questionId: id, solved: true },
        { headers: this.auth.headers() }
      ).toPromise();
      if (res?.solvedQuestionIds) {
        this.solved.set(new Set(res.solvedQuestionIds));
      }
    } catch (e) {
      // rollback on failure
      const rollback = new Set(this.solved());
      rollback.delete(id);
      this.solved.set(rollback);
      throw e;
    }
  }

  async unmarkSolved(id: string): Promise<void> {
    if (!id) return;
    if (!this.solved().has(id)) return;

    const next = new Set(this.solved());
    next.delete(id);
    this.solved.set(next);

    const user = this.auth.user();
    if (!user) {
      this.writeGuestSolved(next);
      return;
    }

    try {
      const res = await this.http.post<{ solvedQuestionIds: string[] }>(
        apiUrl('/users/me/solved'),
        { questionId: id, solved: false },
        { headers: this.auth.headers() }
      ).toPromise();
      if (res?.solvedQuestionIds) {
        this.solved.set(new Set(res.solvedQuestionIds));
      }
    } catch {
      // rollback
      const rollback = new Set(this.solved());
      rollback.add(id);
      this.solved.set(rollback);
      throw new Error('Failed to update progress');
    }
  }

  private initFromUser(u: User) {
    const ids = Array.isArray((u as any).solvedQuestionIds) ? (u as any).solvedQuestionIds : [];
    this.solved.set(new Set(ids));
  }

  private readGuestSolved(): string[] {
    try {
      const raw = localStorage.getItem(LS_SOLVED_GUEST);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
    } catch {
      return [];
    }
  }

  private writeGuestSolved(set: Set<string>) {
    try { localStorage.setItem(LS_SOLVED_GUEST, JSON.stringify(Array.from(set))); } catch { }
  }

  /** When a user logs in, push any guest completions to backend then clear guest cache. */
  private async mergeGuestIntoBackend() {
    const guest = this.readGuestSolved();
    if (!guest.length || !this.auth.user()) return;
    for (const id of guest) {
      try { await this.markSolved(id); } catch { /* ignore */ }
    }
    try { localStorage.removeItem(LS_SOLVED_GUEST); } catch { }
  }
}
