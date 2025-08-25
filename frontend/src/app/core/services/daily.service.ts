import { Injectable, computed, signal } from '@angular/core';
import {
  DailyItem, DailyItemKind, DailySet,
  LS_DAILY_PREFIX,
  Tech,
  defaultPrefs
} from '../../core/models/user.model';

const LS_XP = 'uf:xp';
const LS_STREAK = 'uf:streak';

type StreakData = { current: number; longest: number; lastActive?: string; lastCompleted?: string; };
type XpData = { total: number; today?: number; lastDay?: string; };

@Injectable({ providedIn: 'root' })
export class DailyService {
  // ---- signals exposed to components ----
  daily = signal<DailySet | undefined>(undefined);
  xp = signal<XpData>(this.loadXp());
  streak = signal<StreakData>(this.loadStreak());

  // ---- public computed helpers ----
  doneCount = computed(() => (this.daily()?.items.filter(i => !!i.state?.completedAt).length ?? 0));
  isCompletedToday = computed(() => !!this.daily()?.completed);

  // ---- lifecycle helpers ----
  ensureTodaySet(tech: Tech = defaultPrefs().defaultTech!) {
    const key = this.dayKey();
    const cached = this.loadDaily(key);
    if (cached) {
      // daily XP bucket resets on new day
      this.resetXpIfNewDay();
      this.daily.set(cached);
      return;
    }
    const set: DailySet = {
      date: key,
      generatedAt: new Date().toISOString(),
      items: this.generateDefaultSet(tech),
      completed: false,
    };
    this.daily.set(set);
    this.saveDaily(set);
    this.resetXpIfNewDay(); // also ensures fresh today counter
  }

  // Called by the widget checkbox
  // Complete-only (idempotent). No XP refunds; ignores uncheck attempts.
  toggleItem(item: DailyItem) {
    const d = this.daily();
    if (!d) return;
    const found = d.items.find(i => i.id === item.id && i.kind === item.kind);
    if (!found) return;

    // Already completed? do nothing.
    if (found.state?.completedAt) return;

    // Mark complete + credit
    const now = new Date().toISOString();
    found.state = { ...(found.state || {}), startedAt: found.state?.startedAt ?? now, completedAt: now };
    this.awardXp(this.xpFor(found));
    this.bumpStreakOnFirstCompletion();

    d.completed = d.items.every(i => !!i.state?.completedAt);
    if (d.completed) this.markDayCompleted();

    this.daily.set({ ...d });
    this.saveDaily(d);
  }

  // For detail pages (e.g., user finished a specific exercise)
  // src/app/core/services/daily.service.ts

  markCompletedById(kind: DailyItemKind, id: string, xpOverride?: number) {
    const d = this.daily();
    if (!d) return;

    // try exact match first, then fall back to "kind-only" (V0 generic tiles)
    let item = d.items.find(i => i.kind === kind && i.id === id)
      ?? d.items.find(i => i.kind === kind);

    if (!item) return;

    if (!item.state?.completedAt) {
      item.state = {
        ...(item.state || {}),
        startedAt: item.state?.startedAt ?? new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };
      this.awardXp(xpOverride ?? this.xpFor(item));
      this.bumpStreakOnFirstCompletion();
    }

    d.completed = d.items.every(i => !!i.state?.completedAt);
    if (d.completed) this.markDayCompleted();

    this.daily.set({ ...d });
    this.saveDaily(d);
  }

  // (optional) make id optional so kind-only queries are true in V0
  isInTodaySet(kind: DailyItemKind, id?: string): boolean {
    const d = this.daily();
    if (!d) return false;
    if (!id) return d.items.some(i => i.kind === kind);
    return d.items.some(i => i.kind === kind && i.id === id) || d.items.some(i => i.kind === kind);
  }

  // ---- internals ----
  private xpFor(i: DailyItem): number {
    // tiny defaults; tweak later
    switch (i.kind) {
      case 'coding': return 30;
      case 'debug': return 20;
      case 'trivia': return 10;
      case 'quiz': return 15;
      default: return 10;
    }
  }

  private bumpStreakOnFirstCompletion() {
    const key = this.dayKey();
    const s = { ...this.streak() };
    if (s.lastActive === key) return; // already credited today
    // new day credit
    if (s.lastActive) {
      // if consecutive day, continue streak; else reset
      const yesterday = this.offsetDayKey(-1);
      s.current = (s.lastActive === yesterday) ? (s.current + 1) : 1;
    } else {
      s.current = 1;
    }
    s.longest = Math.max(s.longest || 0, s.current);
    s.lastActive = key;
    this.streak.set(s);
    localStorage.setItem(LS_STREAK, JSON.stringify(s));
  }

  private markDayCompleted() {
    const s = { ...this.streak() };
    s.lastCompleted = this.dayKey();
    this.streak.set(s);
    localStorage.setItem(LS_STREAK, JSON.stringify(s));
  }

  private awardXp(delta: number) {
    const key = this.dayKey();
    const x = { ...this.xp() };
    if (x.lastDay !== key) { x.today = 0; x.lastDay = key; }
    x.today = (x.today ?? 0) + delta;
    x.total = (x.total ?? 0) + delta;
    this.xp.set(x);
    localStorage.setItem(LS_XP, JSON.stringify(x));
  }

  private resetXpIfNewDay() {
    const key = this.dayKey();
    const x = { ...this.xp() };
    if (x.lastDay !== key) {
      x.lastDay = key;
      x.today = 0;
      this.xp.set(x);
      localStorage.setItem(LS_XP, JSON.stringify(x));
    }
  }

  private generateDefaultSet(tech: Tech): DailyItem[] {
    // V0: link to list pages (not specific problems yet)
    return [
      {
        id: `coding:${tech}`,
        kind: 'coding',
        to: ['/', tech, 'coding'],
        label: 'Solve 1 coding exercise',
        auto: false,
        durationMin: 15,
      },
      {
        id: `trivia:${tech}`,
        kind: 'trivia',
        to: ['/', tech, 'trivia'],
        label: 'Answer 5 trivia questions',
        auto: true,
        durationMin: 10,
      },
      {
        id: `debug:${tech}`,
        kind: 'debug',
        to: ['/', tech, 'debug'],
        label: 'Fix 1 bug in Debug',
        auto: false,
        durationMin: 10,
      },
    ];
  }

  private dayKey(d = new Date()): string {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const da = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${da}`;
  }
  private offsetDayKey(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return this.dayKey(d);
  }

  private saveDaily(set: DailySet) {
    localStorage.setItem(LS_DAILY_PREFIX + set.date, JSON.stringify(set));
  }
  private loadDaily(dateKey: string): DailySet | undefined {
    const raw = localStorage.getItem(LS_DAILY_PREFIX + dateKey);
    if (!raw) return undefined;
    try { return JSON.parse(raw) as DailySet; } catch { return undefined; }
  }

  private loadXp(): XpData {
    try { return JSON.parse(localStorage.getItem(LS_XP) || '{}') as XpData; }
    catch { return { total: 0, today: 0 }; }
  }
  private loadStreak(): StreakData {
    try { return JSON.parse(localStorage.getItem(LS_STREAK) || '{}') as StreakData; }
    catch { return { current: 0, longest: 0 }; }
  }
}
