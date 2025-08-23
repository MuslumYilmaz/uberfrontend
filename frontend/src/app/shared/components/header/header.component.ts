import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, startWith } from 'rxjs';

type Mode =
  | 'dashboard'
  | 'tech-list'
  | 'tech-detail'
  | 'sd-list'
  | 'sd-detail'
  | 'course';

type PrepareItem = {
  key: string;
  icon: string;          // emoji or small svg as text
  label: string;
  description: string;
  route?: string;        // if missing → disabled row
  badge?: string;        // e.g., "Coming soon"
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
              <svg class="tab-icon" viewBox="0 0 32 32" aria-hidden="true">
                <rect x="2" y="2" width="28" height="28" rx="4" fill="#F7DF1E"></rect>
                <text x="16" y="21" text-anchor="middle"
                      font-size="14" font-weight="700"
                      font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans'"
                      fill="#111">JS</text>
              </svg>
              JavaScript
            </a>

            <a [routerLink]="'/angular'" class="tab pb-2 whitespace-nowrap"
               [class.tab-active]="currentTech()==='angular'">
              <svg class="tab-icon" viewBox="0 0 32 32" aria-hidden="true">
                <polygon points="16,2 29,7 27,26 16,30 5,26 3,7" fill="#DD0031"></polygon>
                <polygon points="16,5 26.2,8.9 24.8,24.5 16,27.7 7.2,24.5 5.8,8.9" fill="#C3002F"></polygon>
                <text x="16" y="21" text-anchor="middle"
                      font-size="14" font-weight="800"
                      font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans'"
                      fill="#fff">A</text>
              </svg>
              Angular
            </a>

            <a [routerLink]="'/system-design'" class="tab pb-2 whitespace-nowrap"
               [class.tab-active]="isSystemDesign()">System design</a>
          </nav>
        </div>

        <!-- CENTER: Prepare (only on detail pages) -->
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
               (keydown.escape)="closeMega()" tabindex="-1">
            <div class="rounded-xl bg-neutral-900 border border-white/10 shadow-2xl p-3 sm:p-4 space-y-3">

              <!-- Single ngFor for all rows -->
              <div *ngFor="let item of prepareItems"
                   class="card-row rounded-xl p-4 sm:p-5"
                   [ngClass]="{
                     'disabled opacity-50 cursor-not-allowed': !item.route,
                     'hover:bg-white/5 transition cursor-pointer': !!item.route
                   }"
                   role="link"
                   [attr.aria-disabled]="!item.route ? true : null"
                   tabindex="0"
                   (click)="onPrepareClick(item, $event)"
                   (keydown.enter)="onPrepareClick(item, $event)"
                   (keydown.space)="onPrepareKeySpace(item, $event)">

                <div class="flex items-start gap-4">
                  <div class="h-9 w-9 grid place-items-center rounded-lg bg-white/5">{{ item.icon }}</div>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <div class="font-semibold">{{ item.label }}</div>
                      <span *ngIf="item.badge" class="row-badge">{{ item.badge }}</span>
                    </div>
                    <div class="text-sm text-gray-400 mt-1">{{ item.description }}</div>
                    <div class="skeleton-bar mt-3"></div>
                  </div>

                  <div class="ml-2 opacity-60" *ngIf="item.route">→</div>
                </div>
              </div>

            </div>
          </div>
        </ng-container>
      </div>

      <!-- Context strip: ONLY on tech list pages -->
      <div class="context" *ngIf="showContextStrip()">
        <div class="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between text-sm">
          <div class="flex items-center gap-2">
            <ng-container *ngIf="mode()==='tech-list'">
              <div class="flex">
                <a class="pill pill-tab px-3 py-2 rounded-l hover:bg-white/10"
                   [ngClass]="{'pill-tab-active': section()==='coding'}"
                   [routerLink]="['/', currentTech(), 'coding']">Coding</a>

                <a class="pill pill-tab px-3 py-2 rounded-r hover:bg-white/10"
                   [ngClass]="{'pill-tab-active': section()==='trivia'}"
                   [routerLink]="['/', currentTech(), 'trivia']">Trivia</a>
              </div>
            </ng-container>
          </div>
        </div>
      </div>
    </div>
  `
})
export class HeaderComponent {
  mode = signal<Mode>('dashboard');
  currentTech = signal<'javascript' | 'angular' | null>(null);
  section = signal<'coding' | 'trivia' | null>(null);

  // Data-driven prepare rows
  prepareItems: PrepareItem[] = [
    {
      key: 'playbook',
      icon: '📘',
      label: 'Front End Interview Playbook',
      description: 'A starter guide to preparing for front end interviews',
      badge: 'Coming soon'
    },
    {
      key: 'gfe75',
      icon: '🔢',
      label: 'GFE 75',
      description: 'The 75 most important front end interview questions.',
      badge: 'Coming soon'
    },
    {
      key: 'system-design',
      icon: '🧩',
      label: 'Front End System Design Playbook',
      description: 'Core System Design techniques and deep dives into social feeds, autocomplete, e-commerce, and more.',
      route: '/system-design'
    },
    {
      key: 'practice',
      icon: '📝',
      label: 'Free Practice',
      description: 'Jump into coding & trivia practice. Choose JavaScript or Angular and start solving.',
      route: '/javascript'
    },
    {
      key: 'courses',
      icon: '🎓',
      label: 'Courses',
      description: 'Structured lessons with progress tracking and a course outline.',
      route: '/courses'
    }
  ];

  isSystemDesign = computed(() =>
    this.currentTech() === null && (this.mode() === 'sd-list' || this.mode() === 'sd-detail')
  );
  isDetailPage = computed(() => this.mode() === 'tech-detail' || this.mode() === 'sd-detail');
  showContextStrip = computed(() => this.mode() === 'tech-list');

  backLink = computed(() => {
    if (this.mode() === 'sd-detail') return ['/system-design'];
    const tech = this.currentTech() ?? 'javascript';
    const sec = this.section() ?? 'coding';
    return ['/', tech, sec];
  });

  megaOpen = signal(false);
  searchTerm = '';

  constructor(private router: Router) {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), startWith(null))
      .subscribe(() => {
        this.parseUrl(this.router.url);
        this.megaOpen.set(false);
      });
  }

  private parseUrl(url: string) {
    const segs = url.split('?')[0].split('#')[0].split('/').filter(Boolean);
    this.mode.set('dashboard'); this.currentTech.set(null); this.section.set(null);

    if (segs.length === 0) { this.mode.set('dashboard'); return; }

    if (segs[0] === 'courses') {
      this.mode.set('course');
      return;
    }

    if (segs[0] === 'system-design') {
      this.mode.set(segs.length === 1 ? 'sd-list' : 'sd-detail');
      return;
    }

    const tech = segs[0] as 'javascript' | 'angular';
    this.currentTech.set(tech);

    if (segs.length === 1) { this.mode.set('tech-list'); this.section.set('coding'); return; }

    const sec = segs[1] as 'coding' | 'trivia';
    this.section.set(sec);
    this.mode.set(segs.length === 2 ? 'tech-list' : 'tech-detail');
  }

  toggleMega() { this.megaOpen.update(v => !v); }
  closeMega() { this.megaOpen.set(false); }

  onPrepareKeySpace(item: PrepareItem, ev: Event) {
    ev.preventDefault();               // works on Event
    this.onPrepareClick(item, ev);     // reuse the click path
  }

  // (optional) keep this generic too
  onPrepareClick(item: PrepareItem, ev?: Event) {
    if (!item.route) { ev?.preventDefault(); return; }
    this.closeMega();
    this.router.navigateByUrl(item.route);
  }
}