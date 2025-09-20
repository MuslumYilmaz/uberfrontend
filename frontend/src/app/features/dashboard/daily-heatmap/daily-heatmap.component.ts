import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivityService } from '../../../core/services/activity.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-daily-heatmap',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './daily-heatmap.component.html',
  styleUrls: ['./daily-heatmap.component.css'],
})
export class DailyHeatmapComponent implements OnDestroy {
  /** Number of calendar days to render (oldest → newest) */
  @Input() daysCount = 35;

  /** Cell size & gaps (px) */
  @Input() cell = 14;
  @Input() gap = 6;

  /** Visual options */
  @Input() palette: 'teal' | 'emerald' | 'violet' = 'teal';
  @Input() showWeekdayHeaders = true;
  @Input() showMonthLabel = true;

  /** Locale for labels (falls back to browser locale) */
  @Input() locale?: string;

  private activity = inject(ActivityService);
  private auth = inject(AuthService);

  /** Intensities per day, 0..3, oldest → newest */
  days = signal<number[]>(Array.from({ length: this.daysCount }, () => 0));

  /** Track last local calendar day for visibility/resume checks */
  private lastLocalDayKey = this.dayKeyLocal();

  private midnightTimer: ReturnType<typeof setTimeout> | ReturnType<typeof setInterval> | null = null;
  private activitySub: { unsubscribe?: () => void } | null = null;

  private visHandler = () => this.onVisibility();

  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.load(false);
        this.installLocalMidnightTimer();
        this.bindActivityStream();
      } else {
        this.days.set(Array.from({ length: this.daysCount }, () => 0));
        this.clearLocalMidnightTimer();
        this.unbindActivityStream();
      }
    }, { allowSignalWrites: true });

    effect((onCleanup) => {
      if (!this.auth.isLoggedIn()) return;
      document.addEventListener('visibilitychange', this.visHandler);
      onCleanup(() => document.removeEventListener('visibilitychange', this.visHandler));
    });
  }

  ngOnDestroy(): void {
    this.clearLocalMidnightTimer();
    this.unbindActivityStream();
    document.removeEventListener('visibilitychange', this.visHandler);
  }

  // ---------- Data loading (cached via ActivityService) ----------
  private load(force: boolean) {
    this.activity.getHeatmap({ days: this.daysCount }, { force }).subscribe({
      next: (payload: any) => {
        const raw = Array.isArray(payload) ? payload : (payload?.data ?? payload);
        const normalized = this.normalize(raw, this.daysCount);
        const coerced = this.coerceLocalToday(normalized);
        this.days.set(coerced);
        this.lastLocalDayKey = this.dayKeyLocal();
      },
      error: () => this.days.set(Array.from({ length: this.daysCount }, () => 0)),
    });
  }

  /** Accepts number[] (0..3) OR rows [{ dayUTC/day, score|count|completed|xp }...] */
  private normalize(input: any, size: number): number[] {
    if (input && Array.isArray(input.data)) input = input.data;

    if (Array.isArray(input) && (input.length === 0 || typeof input[0] === 'number')) {
      const ints = (input as number[]).map(n => this.clampInt(n));
      return this.fitToSize(ints, size);
    }

    if (Array.isArray(input)) {
      const rows = [...input].sort((a, b) => {
        const da = a.dayUTC ?? a.day ?? '';
        const db = b.dayUTC ?? b.day ?? '';
        return String(da).localeCompare(String(db));
      });

      const values: number[] = rows.map(r => {
        const v = r.score ?? r.count ?? r.completed ?? r.xp ?? 0;
        return typeof v === 'number' ? Math.max(0, v) : 0;
      });

      const intens = this.bucketize(values, 4);
      return this.fitToSize(intens, size);
    }

    return Array.from({ length: size }, () => 0);
  }

  private coerceLocalToday(intensities: number[]): number[] {
    const localKey = this.dayKeyLocal();
    const utcKey = this.dayKeyUTC();
    if (localKey !== utcKey) {
      const withZero = [...intensities, 0];
      return withZero.slice(-this.daysCount);
    }
    return intensities;
  }

  // ---------- Helpers ----------
  private bucketize(values: number[], buckets: number): number[] {
    if (!values.length) return [];
    const max = Math.max(...values);
    if (max <= 0) return values.map(() => 0);
    const step = max / (buckets - 1);
    return values.map(v => Math.min(buckets - 1, Math.floor(v / step + 0.0001)));
  }

  private clampInt(n: number): number {
    if (!Number.isFinite(n)) return 0;
    if (n < 0) return 0;
    if (n > 3) return 3;
    return Math.floor(n);
  }

  private fitToSize(arr: number[], size: number): number[] {
    const cut = arr.slice(-size);
    return cut.length === size ? cut : Array.from({ length: size - cut.length }, () => 0).concat(cut);
  }

  private dayKeyLocal(d = new Date()): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  private dayKeyUTC(d = new Date()): string {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  }

  // ---------- Refresh triggers ----------
  private installLocalMidnightTimer() {
    this.clearLocalMidnightTimer();
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const delay = Math.max(100, nextMidnight.getTime() - now.getTime());
    this.midnightTimer = setTimeout(() => {
      this.load(true); // force just after midnight
      this.midnightTimer = setInterval(() => this.load(true), 24 * 60 * 60 * 1000);
    }, delay);
  }
  private clearLocalMidnightTimer() {
    if (this.midnightTimer) {
      clearTimeout(this.midnightTimer as number);
      clearInterval(this.midnightTimer as number);
      this.midnightTimer = null;
    }
  }

  private bindActivityStream() {
    if (this.activitySub) return;
    this.activitySub = this.activity.activityCompleted$?.subscribe?.(() => this.load(true));
  }
  private unbindActivityStream() {
    try { this.activitySub?.unsubscribe?.(); } catch { }
    this.activitySub = null;
  }

  private onVisibility() {
    if (document.visibilityState !== 'visible') return;
    const nowKey = this.dayKeyLocal();
    if (nowKey !== this.lastLocalDayKey) this.load(true);
  }

  // ---------- Week/Day layout ----------
  private dowIndexMon0(d: Date): number { return (d.getDay() + 6) % 7; } // Mon=0..Sun=6

  layout = computed(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const first = new Date(today);
    first.setDate(today.getDate() - (this.daysCount - 1));
    first.setHours(0, 0, 0, 0);

    const startCol = this.dowIndexMon0(first);
    const totalSlots = startCol + this.daysCount;
    const weeks = Math.ceil(totalSlots / 7);

    const todaySlot = totalSlots - 1;
    const todayRow = Math.floor(todaySlot / 7);
    const todayCol = todaySlot % 7;

    return { first, startCol, weeks, todayRow, todayCol, today };
  });

  /** Grid of weeks×7; value = -1 for padding, else 0..3 */
  grid = computed(() => {
    const values = this.days();
    const { startCol, weeks } = this.layout();
    const out: number[][] = Array.from({ length: weeks }, () => Array(7).fill(-1));
    for (let i = 0; i < values.length; i++) {
      const slot = startCol + i;
      const row = Math.floor(slot / 7);
      const col = slot % 7;
      out[row][col] = values[i] ?? 0;
    }
    return out;
  });

  weekdayHeaders = computed(() => {
    const loc = this.locale ?? undefined;
    const style: 'short' | 'narrow' = this.cell <= 16 ? 'narrow' : 'short';
    const base = new Date();
    const monday = new Date(base);
    const day = (base.getDay() + 6) % 7;
    monday.setDate(base.getDate() - day);
    const fmt = new Intl.DateTimeFormat(loc, { weekday: style });
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i))
    );
  });

  monthLabelsByCol = computed(() => {
    if (!this.showMonthLabel) return Array(7).fill('');
    const { weeks } = this.layout();
    const loc = this.locale ?? undefined;
    const labels = Array(7).fill('');
    for (let c = 0; c < 7; c++) {
      for (let r = 0; r < weeks; r++) {
        const d = this.dateForCell(r, c);
        if (d.getDate() === 1) {
          labels[c] = d.toLocaleString(loc, { month: 'short' });
          break;
        }
      }
    }
    return labels;
  });

  private dateForCell(row: number, col: number): Date {
    const { first, startCol } = this.layout();
    const slot = row * 7 + col;
    const delta = slot - startCol;
    const d = new Date(first);
    d.setDate(first.getDate() + delta);
    return d;
  }

  isToday(row: number, col: number): boolean {
    const { todayRow, todayCol } = this.layout();
    return row === todayRow && col === todayCol;
  }

  tooltip(row: number, col: number, val: number): string | null {
    if (val < 0) return null;
    const loc = this.locale ?? undefined;
    const d = this.dateForCell(row, col);
    const ds = d.toLocaleDateString(loc, { weekday: 'short', month: 'short', day: 'numeric' });
    const labels = ['No activity', 'Light', 'Good', 'Great'];
    return `${ds} · ${labels[Math.max(0, Math.min(3, val))]}`;
  }

  streak = computed(() => {
    const a = this.days();
    let s = 0;
    for (let i = a.length - 1; i >= 0; i--) { if (a[i] > 0) s++; else break; }
    return s;
  });
}