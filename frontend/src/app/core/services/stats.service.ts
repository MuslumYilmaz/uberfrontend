import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { AuthService } from './auth.service';

export interface HeatmapDay {
  day: string;   // YYYY-MM-DD
  count: number; // number of completed items that day
  xp: number;
}

@Injectable({ providedIn: 'root' })
export class StatsService {
  private base = 'http://localhost:3001/api/stats';
  heatmap = signal<HeatmapDay[]>([]);

  constructor(private http: HttpClient, private auth: AuthService) { }

  private headers(): HttpHeaders {
    return new HttpHeaders(this.auth.token ? { Authorization: `Bearer ${this.auth.token}` } : {});
  }

  loadHeatmap() {
    if (!this.auth.token) { this.heatmap.set([]); return; }
    this.http.get<HeatmapDay[]>(`${this.base}/heatmap`, { headers: this.headers() })
      .subscribe((rows) => this.heatmap.set(rows || []));
  }
}
