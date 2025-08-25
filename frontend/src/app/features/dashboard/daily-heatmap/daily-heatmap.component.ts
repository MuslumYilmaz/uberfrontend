import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, computed, signal } from '@angular/core';

@Component({
  selector: 'app-daily-heatmap',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './daily-heatmap.component.html',
  styleUrls: ['./daily-heatmap.component.css']
})
export class DailyHeatmapComponent implements OnInit {
  /** size of a square in px */
  @Input() cell = 14;
  /** gap between squares in px */
  @Input() gap = 6;

  // pretend data loader; replace with your real streak/XP history
  days = signal<number[]>(Array.from({ length: 35 }, () => 0)); // 0..3 intensity

  ngOnInit() {
    // demo intensities; plug your real history mapping here
    const d = this.days().slice();
    d[d.length - 2] = 2; // yesterday
    d[d.length - 1] = 3; // today
    this.days.set(d);
  }

  // 7 rows x 5 cols (rotated 90° as requested)
  grid = computed(() => {
    const arr = this.days();
    const rows = 7, cols = 5;
    const out: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
    let idx = 0;
    // fill by column so newest ends at bottom-right
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        out[r][c] = arr[idx++] ?? 0;
      }
    }
    return out;
  });
}