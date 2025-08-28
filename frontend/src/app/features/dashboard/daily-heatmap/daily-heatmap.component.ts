import { CommonModule } from '@angular/common';
import { Component, Input, computed, effect, inject, signal } from '@angular/core';
import { ActivityService } from '../../../core/services/activity.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-daily-heatmap',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './daily-heatmap.component.html',
  styleUrls: ['./daily-heatmap.component.css']
})
export class DailyHeatmapComponent {
  @Input() daysCount = 35;
  @Input() cell = 14;
  @Input() gap = 6;

  private activity = inject(ActivityService);
  private auth = inject(AuthService);

  /** Intensities per day, oldest → newest. 0..3 */
  days = signal<number[]>(Array.from({ length: this.daysCount }, () => 0));

  // run effect in injection context (constructor), not ngOnInit
  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.load();
      } else {
        this.days.set(Array.from({ length: this.daysCount }, () => 0));
      }
    });
  }

  private load() {
    this.activity.heatmap({ days: this.daysCount }).subscribe({
      next: (payload: any) => {
        // Accept both shapes: array OR { days, data }
        const raw = Array.isArray(payload) ? payload : (payload?.data ?? payload);
        this.days.set(this.normalize(raw, this.daysCount));
      },
      error: () => this.days.set(Array.from({ length: this.daysCount }, () => 0)),
    });
  }

  /** Accepts:
   *  - number[] (0..3), OR
   *  - rows [{ dayUTC/day, score|count|completed|xp }...]
   */
  private normalize(input: any, size: number): number[] {
    if (input && Array.isArray(input.data)) input = input.data; // handle {data: [...]}

    // Already a numeric intensity array
    if (Array.isArray(input) && (input.length === 0 || typeof input[0] === 'number')) {
      const ints = (input as number[]).map(n => this.clampInt(n));
      return this.fitToSize(ints, size);
    }

    // Array of rows → derive intensities
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

  // 7 rows x N cols, fill column-wise so newest ends bottom-right
  grid = computed(() => {
    const arr = this.days();
    const rows = 7, cols = Math.ceil(this.daysCount / rows);
    const out: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
    let idx = 0;
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) out[r][c] = arr[idx++] ?? 0;
    return out;
  });
}