import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

type AdminRow = {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
  username?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  role?: string;
  accessTier?: string;
  prefsText: string;
  billingText: string;
  statsText: string;
  couponsText: string;
  solvedText: string;
  raw: any;
  saving?: boolean;
  error?: string | null;
  success?: boolean;
};

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="admin-shell">
      <header class="admin-head">
        <div>
          <p class="eyebrow">Admin</p>
          <h1>Users</h1>
          <p class="muted">View and edit user accounts. Dates are read-only.</p>
        </div>
        <button type="button" class="btn" (click)="load()" [disabled]="loading()">Refresh</button>
      </header>

      <div *ngIf="error()" class="alert alert-error">{{ error() }}</div>

      <div *ngIf="loading()" class="alert">Loading users…</div>

      <div class="user-grid" *ngIf="!loading()">
        <section class="card" *ngFor="let row of users()">
          <div class="card-head">
            <div>
              <div class="pill">ID</div>
              <div class="mono">{{ row._id }}</div>
            </div>
            <div class="meta">
              <span>Created: {{ row.createdAt || '—' }}</span>
              <span>Updated: {{ row.updatedAt || '—' }}</span>
            </div>
          </div>

          <div class="form-grid">
            <label>
              <span>Username</span>
              <input [(ngModel)]="row.username" />
            </label>
            <label>
              <span>Email</span>
              <input [(ngModel)]="row.email" />
            </label>
            <label>
              <span>Role</span>
              <select [(ngModel)]="row.role">
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </label>
            <label>
              <span>Access tier</span>
              <select [(ngModel)]="row.accessTier">
                <option value="free">free</option>
                <option value="premium">premium</option>
              </select>
            </label>
          </div>

          <label class="block">
            <span>Bio</span>
            <textarea rows="2" [(ngModel)]="row.bio"></textarea>
          </label>
          <label class="block">
            <span>Avatar URL</span>
            <input [(ngModel)]="row.avatarUrl" />
          </label>

          <label class="block">
            <span>Prefs (JSON)</span>
            <textarea rows="3" [(ngModel)]="row.prefsText" class="mono"></textarea>
          </label>

          <label class="block">
            <span>Billing (JSON)</span>
            <textarea rows="3" [(ngModel)]="row.billingText" class="mono"></textarea>
          </label>

          <label class="block">
            <span>Stats (JSON)</span>
            <textarea rows="3" [(ngModel)]="row.statsText" class="mono"></textarea>
          </label>

          <label class="block">
            <span>Coupons (JSON array)</span>
            <textarea rows="2" [(ngModel)]="row.couponsText" class="mono"></textarea>
          </label>

          <label class="block">
            <span>Solved question IDs (comma-separated)</span>
            <input [(ngModel)]="row.solvedText" />
          </label>

          <div class="actions">
            <button type="button" class="btn primary" (click)="save(row)" [disabled]="row.saving">
              {{ row.saving ? 'Saving…' : 'Save' }}
            </button>
            <span *ngIf="row.success" class="success">Saved</span>
            <span *ngIf="row.error" class="error">{{ row.error }}</span>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .admin-shell{max-width:1200px;margin:20px auto;padding:0 16px 32px;}
    .admin-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px;}
    .admin-head h1{margin:4px 0 2px;}
    .eyebrow{text-transform:uppercase;letter-spacing:.18em;font-size:11px;color:#64748b;margin:0;}
    .muted{color:#475569;margin:0;}
    .btn{padding:8px 12px;border-radius:10px;border:1px solid #cbd5e1;background:#e2e8f0;color:#0f172a;font-weight:700;cursor:pointer;}
    .btn:disabled{opacity:.6;cursor:not-allowed;}
    .primary{background:#0f172a;color:#e2e8f0;border-color:#0f172a;}
    .alert{padding:10px 12px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;margin-bottom:12px;}
    .alert-error{background:#fef2f2;border-color:#fecdd3;color:#991b1b;}
    .user-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:14px;}
    .card{border:1px solid #e2e8f0;border-radius:14px;padding:14px 12px;background:#fff;display:grid;gap:8px;box-shadow:0 6px 20px rgba(15,23,42,.06);}
    .card-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;}
    .pill{display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;border:1px solid #e2e8f0;background:#f1f5f9;font-size:11px;font-weight:700;color:#475569;}
    .mono{font-family: ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;}
    .meta{display:flex;gap:10px;flex-wrap:wrap;font-size:12px;color:#475569;}
    .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
    label{display:grid;gap:4px;font-size:12px;font-weight:700;color:#0f172a;}
    input, textarea, select{width:100%;padding:8px 10px;border-radius:10px;border:1px solid #e2e8f0;background:#f8fafc;font-size:14px;}
    textarea{resize:vertical;}
    .block{margin-top:6px;}
    .actions{display:flex;align-items:center;gap:10px;margin-top:4px;}
    .success{color:#16a34a;font-weight:700;font-size:12px;}
    .error{color:#dc2626;font-weight:700;font-size:12px;}
  `]
})
export class AdminUsersComponent implements OnInit {
  users = signal<AdminRow[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private http: HttpClient, private auth: AuthService) { }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<any[]>(`${environment.apiBase}/admin/users`, { headers: this.auth.headers() })
      .subscribe({
        next: (list) => {
          this.users.set(list.map(u => this.toRow(u)));
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.error || 'Failed to load users');
          this.loading.set(false);
        }
      });
  }

  private toRow(u: any): AdminRow {
    return {
      _id: u._id,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      username: u.username,
      email: u.email,
      bio: u.bio,
      avatarUrl: u.avatarUrl,
      role: u.role,
      accessTier: u.accessTier,
      prefsText: this.safeString(u.prefs),
      billingText: this.safeString(u.billing),
      statsText: this.safeString(u.stats),
      couponsText: this.safeString(u.coupons),
      solvedText: Array.isArray(u.solvedQuestionIds) ? u.solvedQuestionIds.join(',') : '',
      raw: u,
      success: false,
      error: null
    };
  }

  save(row: AdminRow): void {
    row.saving = true;
    row.success = false;
    row.error = null;

    let prefs = this.tryParse(row.prefsText, 'prefs', row);
    if (prefs === undefined) return;
    let billing = this.tryParse(row.billingText, 'billing', row);
    if (billing === undefined) return;
    let stats = this.tryParse(row.statsText, 'stats', row);
    if (stats === undefined) return;
    let coupons = this.tryParse(row.couponsText, 'coupons', row);
    if (coupons === undefined) return;

    const solved = row.solvedText
      ? row.solvedText.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const payload: any = {
      username: row.username,
      email: row.email,
      bio: row.bio,
      avatarUrl: row.avatarUrl,
      role: row.role,
      accessTier: row.accessTier,
      prefs,
      billing,
      stats,
      coupons,
      solvedQuestionIds: solved,
    };

    this.http.put<any>(`${environment.apiBase}/admin/users/${row._id}`, payload, {
      headers: this.auth.headers()
    }).subscribe({
      next: (updated) => {
        Object.assign(row, this.toRow(updated));
        row.success = true;
        row.saving = false;

        // If the admin updated their own account, refresh auth state so UI (locks/badges) reflect new role/tier.
        if (updated?._id && updated._id === this.auth.user()?._id) {
          this.auth.fetchMe().subscribe();
        }
      },
      error: (err) => {
        row.error = err?.error?.error || 'Save failed';
        row.saving = false;
      }
    });
  }

  private tryParse(text: string, label: string, row: AdminRow): any {
    if (!text?.trim()) return null;
    try {
      return JSON.parse(text);
    } catch {
      row.error = `${label} must be valid JSON`;
      row.saving = false;
      return undefined;
    }
  }

  private safeString(val: any): string {
    if (val === null || val === undefined) return '';
    try {
      return JSON.stringify(val, null, 2);
    } catch {
      return '';
    }
  }
}
