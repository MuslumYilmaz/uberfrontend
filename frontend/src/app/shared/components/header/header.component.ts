import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, startWith } from 'rxjs';

type Mode = 'dashboard' | 'tech-list' | 'tech-detail' | 'sd-list' | 'sd-detail' | 'course';

type PrepareItem = {
  key: string; title: string; subtitle: string; pi: string;
  route?: string | null; disabled?: boolean; badge?: string | null;
};

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  styleUrls: ['./header.component.scss'],
  template: `
    <div class="topbar bg-neutral-900/95 text-gray-200 pb-2">
      <div class="max-w-7xl mx-auto px-4 h-12 grid [grid-template-columns:1fr_auto_1fr] items-center gap-4">
        <!-- LEFT -->
        <div class="flex items-center gap-6 min-w-0">
          <a class="font-semibold text-white hover:opacity-90 whitespace-nowrap" routerLink="/">UberFrontend</a>

          <!-- Tech tabs only on list pages -->
          <nav *ngIf="!isDetailPage()" class="hidden md:flex items-center gap-6">
            <a [routerLink]="'/javascript'" class="tab pb-2 whitespace-nowrap"
              [class.tab-active]="currentTech()==='javascript'">
              <svg class="tab-icon mr-2" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
                <rect x="2" y="2" width="28" height="28" rx="4" fill="#F7DF1E"></rect>
                <text x="16" y="21" text-anchor="middle" font-size="14" font-weight="700"
                      font-family="Inter,system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial,'Noto Sans'"
                      fill="#111">JS</text>
              </svg>
              JavaScript
            </a>

            <a [routerLink]="'/angular'" class="tab pb-2 whitespace-nowrap"
              [class.tab-active]="currentTech()==='angular'">
              <svg class="tab-icon mr-2" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
                <polygon points="16,2 29,7 27,26 16,30 5,26 3,7" fill="#DD0031"></polygon>
                <polygon points="16,5 26.2,8.9 24.8,24.5 16,27.7 7.2,24.5 5.8,8.9" fill="#C3002F"></polygon>
                <text x="16" y="21" text-anchor="middle" font-size="14" font-weight="800"
                      font-family="Inter,system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial,'Noto Sans'"
                      fill="#fff">A</text>
              </svg>
              Angular
            </a>

            <!-- System design (PrimeIcon) -->
            <a [routerLink]="'/system-design'" class="tab pb-2 whitespace-nowrap"
              [class.tab-active]="isSystemDesign()">
              <i class="pi pi-sitemap mr-2"></i>
              System design
            </a>
          </nav>

        </div>

        <!-- CENTER -->
        <div class="flex items-center justify-center">
          <button *ngIf="isDetailPage()"
                  class="pill px-3 py-1.5 rounded hover:bg-white/10"
                  (click)="toggleMega()"
                  aria-haspopup="menu"
                  [attr.aria-expanded]="megaOpen()"
                  aria-controls="prepare-mega">
            Prepare ▾
          </button>
        </div>

        <!-- RIGHT -->
        <div class="flex items-center justify-end">
          <a routerLink="/" class="hidden sm:inline text-sm pill px-3 py-1 rounded hover:opacity-90">Dashboard</a>
        </div>

        <!-- MEGA MENU -->
        <ng-container *ngIf="megaOpen()">
          <div class="fixed inset-0 z-40" (click)="closeMega()"></div>
          <div id="prepare-mega"
               class="fixed left-1/2 -translate-x-1/2 top-12 mt-2 z-50 w-[min(92vw,940px)]"
               (click)="$event.stopPropagation()"
               (keydown.escape)="closeMega()" tabindex="-1" role="menu" aria-label="Prepare menu">
            <div class="rounded-xl bg-neutral-900 border border-white/10 shadow-2xl p-3 sm:p-4 space-y-3">
              <ng-container *ngFor="let item of prepareItems; trackBy: trackByKey">
                <div *ngIf="item.disabled; else enabledRow"
                     class="card-row rounded-xl p-4 sm:p-5 disabled"
                     role="button" aria-disabled="true" tabindex="-1">
                  <div class="flex items-start gap-4">
                    <div class="icon-box" aria-hidden="true"><i class="pi" [ngClass]="item.pi"></i></div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <div class="font-semibold">{{ item.title }}</div>
                        <span *ngIf="item.badge" class="row-badge">{{ item.badge }}</span>
                      </div>
                      <div class="text-sm text-gray-400 mt-1">{{ item.subtitle }}</div>
                      <div class="skeleton-bar mt-3"></div>
                    </div>
                  </div>
                </div>

                <ng-template #enabledRow>
                  <a class="card-row rounded-xl p-4 sm:p-5 block hover:bg-white/5 transition"
                     [routerLink]="item.route!" (click)="closeMega()"
                     role="link">
                    <div class="flex items-start gap-4">
                      <div class="icon-box" aria-hidden="true"><i class="pi" [ngClass]="item.pi"></i></div>
                      <div class="min-w-0 flex-1">
                        <div class="font-semibold">{{ item.title }}</div>
                        <div class="text-sm text-gray-400 mt-1">{{ item.subtitle }}</div>
                        <div class="skeleton-bar mt-3"></div>
                      </div>
                      <div class="ml-2 opacity-60">→</div>
                    </div>
                  </a>
                </ng-template>
              </ng-container>
            </div>
          </div>
        </ng-container>
      </div>

      <!-- Context strip: ONLY on tech list pages -->
      <div class="context" *ngIf="showContextStrip()">
        <div class="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between text-sm">
          <div class="flex items-center gap-2" *ngIf="mode()==='tech-list'">
            <div class="flex">
              <a class="pill pill-tab px-3 py-2 rounded-l hover:bg-white/10"
                 [ngClass]="{'pill-tab-active': section()==='coding'}"
                 [routerLink]="['/', currentTech(), 'coding']">Coding</a>

              <a class="pill pill-tab px-3 py-2 hover:bg-white/10"
                 [ngClass]="{'pill-tab-active': section()==='trivia'}"
                 [routerLink]="['/', currentTech(), 'trivia']">Trivia</a>

              <a class="pill pill-tab px-3 py-2 rounded-r hover:bg-white/10"
                 [ngClass]="{'pill-tab-active': section()==='debug'}"
                 [routerLink]="['/', currentTech(), 'debug']">Debug</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class HeaderComponent {
  private doc = inject(DOCUMENT);

  mode = signal<Mode>('dashboard');
  currentTech = signal<'javascript' | 'angular' | null>(null);
  section = signal<'coding' | 'trivia' | 'debug' | null>(null);

  prepareItems: PrepareItem[] = [
    { key: 'playbook', title: 'Front End Interview Playbook', subtitle: 'A starter guide to preparing for front end interviews', pi: 'pi-book', disabled: true, badge: 'Coming soon', route: null },
    { key: 'gfe75', title: 'GFE 75', subtitle: 'The 75 most important front end interview questions.', pi: 'pi-list', disabled: true, badge: 'Coming soon', route: null },
    { key: 'system-design', title: 'Front End System Design Playbook', subtitle: 'Core System Design techniques and deep dives.', pi: 'pi-sitemap', route: '/system-design' },
    { key: 'practice', title: 'Free Practice', subtitle: 'Jump into coding, debug & trivia practice.', pi: 'pi-code', route: '/javascript' },
    { key: 'courses', title: 'Courses', subtitle: 'Structured lessons with progress tracking and a course outline.', pi: 'pi-bookmark', route: '/courses' },
    { key: 'companies', title: 'Companies', subtitle: 'Practice by company: coding & trivia.', pi: 'pi-briefcase', route: '/companies' }
  ];

  isSystemDesign = computed(() =>
    this.currentTech() === null && (this.mode() === 'sd-list' || this.mode() === 'sd-detail')
  );
  isDetailPage = computed(() => this.mode() === 'tech-detail' || this.mode() === 'sd-detail');
  showContextStrip = computed(() => this.mode() === 'tech-list');

  megaOpen = signal(false);

  constructor(private router: Router) {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), startWith(null))
      .subscribe(() => {
        this.parseUrl(this.router.url);
        this.megaOpen.set(false);
        this.updateSafeTop();
      });
  }

  private parseUrl(url: string) {
    const segs = url.split('?')[0].split('#')[0].split('/').filter(Boolean);
    this.mode.set('dashboard'); this.currentTech.set(null); this.section.set(null);

    if (segs.length === 0) { this.mode.set('dashboard'); return; }
    if (segs[0] === 'courses') { this.mode.set('course'); return; }
    if (segs[0] === 'system-design') { this.mode.set(segs.length === 1 ? 'sd-list' : 'sd-detail'); return; }

    const tech = segs[0] as 'javascript' | 'angular';
    this.currentTech.set(tech);

    if (segs.length === 1) { this.mode.set('tech-list'); this.section.set('coding'); return; }

    const sec = segs[1] as 'coding' | 'trivia' | 'debug';
    this.section.set(sec);
    this.mode.set(segs.length === 2 ? 'tech-list' : 'tech-detail');
  }

  // publish the safe top spacing (header + optional context strip)
  private updateSafeTop() {
    const base = 48; // h-12
    const ctx = this.showContextStrip() ? 48 : 0; // context strip h-12
    const px = base + ctx;
    this.doc.documentElement.style.setProperty('--app-safe-top', `${px}px`);
  }

  trackByKey(_: number, it: PrepareItem) { return it.key; }
  toggleMega() { this.megaOpen.update(v => !v); }
  closeMega() { this.megaOpen.set(false); }

  currentTechValue() { return this.currentTech(); }
  sectionValue() { return this.section(); }
}
