import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { ActivityService } from '../../../core/services/activity.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-daily-heatmap',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './daily-heatmap.component.html',
  styleUrls: ['./daily-heatmap.component.css']
})
export class DailyHeatmapComponent implements OnDestroy {
  @Input() daysCount = 35;
  @Input() cell = 14;
  @Input() gap = 6;

  private activity = inject(ActivityService);
  private auth = inject(AuthService);

  /** Intensities per day, oldest → newest. Values 0..3 */
  days = signal<number[]>(Array.from({ length: this.daysCount }, () => 0));

  /** Track last local calendar day we hydrated for visibility-resume checks */
  private lastLocalDayKey = this.dayKeyLocal();
  private midnightTimer: any = null;
  private activitySub: any = null;
  private visHandler = () => this.onVisibility();

  // run effect in injection context (constructor), not ngOnInit
  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.load();
        this.installLocalMidnightTimer();
        this.bindActivityStream();
        document.addEventListener('visibilitychange', this.visHandler);
      } else {
        this.days.set(Array.from({ length: this.daysCount }, () => 0));
        this.clearLocalMidnightTimer();
        this.unbindActivityStream();
        document.removeEventListener('visibilitychange', this.visHandler);
      }
    });
  }

  ngOnDestroy(): void {
    this.clearLocalMidnightTimer();
    this.unbindActivityStream();
    document.removeEventListener('visibilitychange', this.visHandler);
  }

  // ---------- data loading ----------
  private load() {
    this.activity.heatmap({ days: this.daysCount }).subscribe({
      next: (payload: any) => {
        // Accept both shapes: array OR { days, data }
        const raw = Array.isArray(payload) ? payload : (payload?.data ?? payload);
        const normalized = this.normalize(raw, this.daysCount);
        // If our local day has advanced but the server is still on previous UTC day,
        // append a zero bucket so the grid starts “empty” for today at local 00:00.
        const coerced = this.coerceLocalToday(normalized);
        this.days.set(coerced);
        this.lastLocalDayKey = this.dayKeyLocal();
      },
      error: () => this.days.set(Array.from({ length: this.daysCount }, () => 0)),
    });
  }

  /** Accepts number[] (0..3) OR rows [{ dayUTC/day, score|count|completed|xp }...] */
  private normalize(input: any, size: number): number[] {
    if (input && Array.isArray(input.data)) input = input.data; // handle {data: [...]}

    // Already intensity list
    if (Array.isArray(input) && (input.length === 0 || typeof input[0] === 'number')) {
      const ints = (input as number[]).map(n => this.clampInt(n));
      return this.fitToSize(ints, size);
    }

    // Rows → intensities
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

  // When local date has rolled over but server (UTC) hasn't yet,
  // show an extra 0-intensity “today” at the end so the grid looks fresh.
  private coerceLocalToday(intensities: number[]): number[] {
    const localKey = this.dayKeyLocal();
    const utcKey = this.dayKeyUTC();

    // Only needed when local is AHEAD of UTC (e.g., TR/Asia) at their 00:xx.
    if (localKey !== utcKey) {
      const withZero = [...intensities, 0];
      return withZero.slice(-this.daysCount);
    }
    return intensities;
  }

  // ---------- helpers ----------
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
    // local calendar day
  }
  private dayKeyUTC(d = new Date()): string {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    // UTC calendar day
  }

  // ---------- refresh triggers ----------
  /** Reload at local midnight (00:00 local time), then every 24h */
  private installLocalMidnightTimer() {
    this.clearLocalMidnightTimer();
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0
    );
    const delay = Math.max(100, nextMidnight.getTime() - now.getTime());
    this.midnightTimer = setTimeout(() => {
      this.load(); // show fresh column immediately
      // continue daily
      this.midnightTimer = setInterval(() => this.load(), 24 * 60 * 60 * 1000);
    }, delay);
  }
  private clearLocalMidnightTimer() {
    if (this.midnightTimer) {
      clearTimeout(this.midnightTimer);
      clearInterval(this.midnightTimer);
      this.midnightTimer = null;
    }
  }

  /** Reload when user completes something (keeps heatmap in sync during the day) */
  private bindActivityStream() {
    if (this.activitySub) return;
    this.activitySub = this.activity.activityCompleted$?.subscribe?.(() => this.load());
  }
  private unbindActivityStream() {
    try { this.activitySub?.unsubscribe?.(); } catch { }
    this.activitySub = null;
  }

  /** If user switches back to the tab and the local calendar day changed, reload. */
  private onVisibility() {
    if (document.visibilityState !== 'visible') return;
    const nowKey = this.dayKeyLocal();
    if (nowKey !== this.lastLocalDayKey) {
      this.load();
    }
  }

  // ---------- grid layout (unchanged) ----------
  // 7 rows x N cols, fill column-wise so newest ends bottom-right
  grid = computed(() => {
    const arr = this.days();
    const rows = 7, cols = Math.ceil(this.daysCount / rows);
    const out: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
    let idx = 0;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) out[r][c] = arr[idx++] ?? 0;
    }
    return out;
  });
}