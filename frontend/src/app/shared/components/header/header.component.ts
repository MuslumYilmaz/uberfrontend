import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, computed, DestroyRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, startWith } from 'rxjs';
import { defaultPrefs, Tech } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { PREPARE_GROUPS, PrepareGroup, PrepareItem, TargetName } from '../../prepare/prepare.registry';

type Mode =
  | 'dashboard'
  | 'tech-list'
  | 'tech-detail'
  | 'sd-list'
  | 'sd-detail'
  | 'course'
  | 'profile'
  | 'not-found';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  styleUrls: ['./header.component.css'],
  template: `
  <div class="ufh-topbar" role="banner" (click)="$event.stopPropagation()">
    <div class="ufh-inner">
      <!-- LEFT (brand) -->
      <div class="ufh-left">
        <a class="ufh-brand" routerLink="/">UberFrontend</a>
      </div>

      <!-- CENTER (Prepare trigger) -->
      <div class="ufh-center">
        <button
          class="ufh-navlink"
          (click)="toggleMega()"
          aria-haspopup="menu"
          [attr.aria-expanded]="megaOpen()"
          aria-controls="prepare-mega">
          Prepare <span class="caret" aria-hidden="true">▾</span>
        </button>
      </div>

      <!-- RIGHT (Pricing → Avatar → CTA) -->
      <div class="ufh-right" (click)="$event.stopPropagation()">
        <a class="ufh-btn" routerLink="/pricing">Pricing</a>

        <div class="ufh-profile ufh-profile-right">
          <button class="ufh-avatar"
                  (click)="toggleProfileMenu()"
                  aria-haspopup="menu"
                  [attr.aria-expanded]="profileOpen()">
            <i class="pi pi-user"></i>
          </button>
          <div *ngIf="profileOpen()" class="ufh-menu" role="menu">
            <div class="ufh-menu-section">Account</div>

            <ng-container *ngIf="auth.isLoggedIn(); else profileDisabled">
              <a class="ufh-menu-item" routerLink="/profile" (click)="closeAll()">
                <i class="pi pi-user"></i> My profile
              </a>
              <div class="ufh-divider"></div>
              <button class="ufh-menu-item" (click)="logout()"><i class="pi pi-sign-out"></i> Log out</button>
            </ng-container>

            <ng-template #profileDisabled>
              <button class="ufh-menu-item" routerLink="/auth/signup" (click)="closeAll()">
                <i class="pi pi-user-plus"></i> Sign up
              </button>
              <button class="ufh-menu-item" routerLink="/auth/login" (click)="closeAll()">
                <i class="pi pi-sign-in"></i> Log in
              </button>
            </ng-template>
          </div>
        </div>

        <!-- Luminous CTA -->
        <a class="ufh-cta ufh-cta-solid" routerLink="/pricing">
          {{ auth.isLoggedIn() ? 'Upgrade' : 'Get full access' }}
        </a>
      </div>
    </div>

    <!-- MEGA MENU -->
    <ng-container *ngIf="megaOpen()">
      <div class="ufh-backdrop" (click)="closeAll()"></div>
      <div id="prepare-mega" class="ufh-mega" (click)="$event.stopPropagation()" (keydown.escape)="closeAll()"
           tabindex="-1" role="menu" aria-label="Prepare menu">
        <div class="ufh-mega-inner">
          <div class="ufh-rail">
            <button *ngFor="let g of groups; trackBy: trackByGroupKey"
                    class="ufh-rail-item"
                    [class.ufh-rail-active]="g.key===activeGroupKey()"
                    (click)="activeGroupKey.set(g.key)">
              <span class="ufh-rail-text">{{ g.title }}</span>
              <i class="pi pi-chevron-right ufh-rail-caret"></i>
            </button>
          </div>

          <div class="ufh-pane">
            <a *ngIf="continueLink() as cont"
               class="ufh-card ufh-card-continue"
               [routerLink]="cont.to"
               (click)="closeAll()">
              <div class="ufh-card-icon"><i class="pi pi-play-circle"></i></div>
              <div class="ufh-card-body">
                <div class="ufh-card-title">Continue</div>
                <div class="ufh-card-sub">{{ cont.label }}</div>
                <div class="ufh-skel"></div>
              </div>
              <div aria-hidden="true">→</div>
            </a>

            <ng-container *ngFor="let item of activeItems(); trackBy: trackByItemKey">
              <div *ngIf="item.disabled || item.intent!=='route' || !item.target; else enabledRow"
                   class="ufh-card ufh-card-disabled"
                   role="button" aria-disabled="true" tabindex="-1">
                <div class="ufh-card-icon"><i class="pi" [ngClass]="item.pi"></i></div>
                <div class="ufh-card-body">
                  <div class="ufh-card-title">
                    {{ item.title }}
                    <span *ngIf="item.badge" class="ufh-badge">{{ item.badge }}</span>
                  </div>
                  <div class="ufh-card-sub">{{ item.subtitle }}</div>
                  <div class="ufh-skel"></div>
                </div>
              </div>
              <ng-template #enabledRow>
                <a class="ufh-card" [routerLink]="intentToLink(item)!" (click)="closeAll()">
                  <div class="ufh-card-icon"><i class="pi" [ngClass]="item.pi"></i></div>
                  <div class="ufh-card-body">
                    <div class="ufh-card-title">{{ item.title }}</div>
                    <div class="ufh-card-sub">{{ item.subtitle }}</div>
                    <div class="ufh-skel"></div>
                  </div>
                  <div aria-hidden="true">→</div>
                </a>
              </ng-template>
            </ng-container>
          </div>
        </div>
      </div>
    </ng-container>
  </div>
  `
})
export class HeaderComponent implements OnInit {
  private doc = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  // route state
  mode = signal<Mode>('dashboard');
  currentTech = signal<'javascript' | 'angular' | 'react' | 'vue' | 'html' | 'css' | null>(null);
  section = signal<'coding' | 'trivia' | 'debug' | null>(null);

  // prepare groups
  groups: PrepareGroup[] = PREPARE_GROUPS.filter(g => g.key !== 'courses');
  activeGroupKey = signal<PrepareGroup['key']>('practice');
  activeGroup = computed(
    () => this.groups.find(g => g.key === this.activeGroupKey()) ?? this.groups[0]
  );

  // also make sure items inside other groups that might target "courses" are hidden:
  activeItems = computed(() =>
    this.activeGroup().items.filter(it => it.target?.name !== 'courses')
  );

  // menus
  megaOpen = signal(false);
  profileOpen = signal(false);

  public auth = inject(AuthService);

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), startWith(null))
      .subscribe(() => {
        this.parseUrl(this.router.url);
        this.closeAll();
        this.updateSafeTop();
        this.pickDefaultGroup();
      });
  }

  ngOnInit(): void { }

  // —— utils / routing ——
  private resolveTech(): Tech {
    const pref = (defaultPrefs().defaultTech as Tech | undefined) ?? 'javascript';
    return this.currentTech() ?? pref;
  }

  isSystemDesign = computed(() =>
    this.currentTech() === null && (this.mode() === 'sd-list' || this.mode() === 'sd-detail')
  );
  isDetailPage = computed(() => this.mode() === 'tech-detail' || this.mode() === 'sd-detail');
  showContextStrip = computed(() => false);
  showTechTabs = computed(() => false);
  showPrepareTrigger = computed(() =>
    this.mode() === 'dashboard' || this.mode() === 'tech-detail' || this.mode() === 'profile'
  );

  private parseUrl(url: string) {
    const segs = url.split('?')[0].split('#')[0].split('/').filter(Boolean);

    this.mode.set('dashboard');
    this.currentTech.set(null);
    this.section.set(null);

    if (segs.length === 0) { this.mode.set('dashboard'); return; }
    if (segs[0] === '404') { this.mode.set('not-found'); return; }
    if (segs[0] === 'courses') { this.mode.set('course'); return; }
    if (segs[0] === 'system-design') { this.mode.set(segs.length === 1 ? 'sd-list' : 'sd-detail'); return; }
    if (segs[0] === 'profile') { this.mode.set('profile'); return; }

    const tech = segs[0] as 'javascript' | 'angular' | 'react' | 'vue' | 'html' | 'css';
    const isTech =
      tech === 'javascript' || tech === 'angular' || tech === 'react' ||
      tech === 'vue' || tech === 'html' || tech === 'css';
    if (isTech) this.currentTech.set(tech);

    if (!isTech) return;

    if (segs.length === 1) { this.mode.set('tech-list'); this.section.set('coding'); return; }

    const sec = segs[1] as 'coding' | 'trivia' | 'debug';
    if (sec === 'coding' || sec === 'trivia' || sec === 'debug') {
      this.section.set(sec);
      this.mode.set(segs.length === 2 ? 'tech-list' : 'tech-detail');
    }
  }

  private pickDefaultGroup() {
    if (this.mode() === 'tech-list' || this.mode() === 'tech-detail') {
      this.activeGroupKey.set('practice');
      return;
    }
    if (this.mode() === 'sd-list' || this.mode() === 'sd-detail') {
      this.activeGroupKey.set('system');
      return;
    }
    if (this.router.url.startsWith('/companies')) {
      this.activeGroupKey.set('companies');
      return;
    }

    this.activeGroupKey.set('foundations');
  }


  trackByGroupKey(_: number, g: PrepareGroup) { return g.key; }
  trackByItemKey(_: number, it: PrepareItem) { return it.key; }

  intentToLink(it: PrepareItem): any[] | null {
    if (it.intent !== 'route' || !it.target) return null;
    const t = it.target;
    switch (t.name as TargetName) {
      case 'practice': {
        const tech = this.resolveTech();
        return ['/', tech];
      }
      case 'system': {
        const section = t.params?.['section'] as string | undefined;
        if (section === 'guide') return ['/guides', 'system-design'];
        return ['/system-design'];
      }
      case 'companies': {
        const c = t.params?.['company'] as string | undefined;
        return c ? ['/companies', c] : ['/companies'];
      }
      case 'courses':
        return ['/courses'];
      case 'guides': {
        const section = (t.params?.['section'] as string | undefined) ?? '';
        if (section === 'playbook') return (['/guides', 'playbook']);
        if (section === 'behavioral') return (['/guides', 'behavioral']);
        if (section === 'system-design') return (['/guides', 'system-design']);
        return ['/guides'];
      }
      default:
        return null;
    }
  }

  continueLink = computed(() => {
    try {
      const raw = localStorage.getItem('uf:lastVisited');
      if (!raw) return null;
      const obj = JSON.parse(raw) as { to: any[]; label?: string };
      if (!Array.isArray(obj.to)) return null;
      return { to: obj.to, label: obj.label ?? 'Pick up where you left off' };
    } catch { return null; }
  });

  private updateSafeTop() {
    const base = 56;
    const ctx = this.showContextStrip() ? 48 : 0;
    this.doc.documentElement.style.setProperty('--app-safe-top', `${base + ctx}px`);
  }

  @HostListener('document:click')
  onDocumentClick() { this.closeAll(); }

  @HostListener('document:keydown.escape')
  onDocumentEsc() { this.closeAll(); }

  private openOnly(which: 'mega' | 'profile' | null) {
    this.megaOpen.set(which === 'mega');
    this.profileOpen.set(which === 'profile');
  }

  toggleMega() { this.openOnly(this.megaOpen() ? null : 'mega'); }
  toggleProfileMenu() { this.openOnly(this.profileOpen() ? null : 'profile'); }

  closeAll() { this.openOnly(null); }

  logout() {
    this.auth.logout();
    this.closeAll();
    this.router.navigate(['/']);
  }
}
