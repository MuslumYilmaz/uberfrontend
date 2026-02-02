import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, HostListener, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TooltipModule } from 'primeng/tooltip';
import { firstValueFrom, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { apiUrl } from '../../core/utils/api-base';

interface LinkItem {
  type: 'link';
  label: string;
  to: string;
  icon?: string;
  query?: Record<string, any>;
}
interface GroupItem {
  type: 'group';
  label: string;
  icon?: string;
  open?: boolean;
  children: LinkItem[];
}
type NavItem = LinkItem | GroupItem;

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    DialogModule,
    FormsModule,
    InputTextareaModule,
    TooltipModule
  ],
  templateUrl: './app-sidebar.component.html',
  styleUrls: ['./app-sidebar.component.css'],
})
export class AppSidebarComponent implements OnInit, OnDestroy {
  @Input() collapsed = false;
  drawerOpen = signal(false);

  bugVisible = false;
  bugText = '';
  submitting = false;
  submitOk = false;
  currentUrl = '';

  private navSub?: Subscription;

  constructor(private http: HttpClient, private router: Router) {}

  isLink = (i: NavItem): i is LinkItem => i.type === 'link';
  isGroup = (i: NavItem): i is GroupItem => i.type === 'group';

  nav: NavItem[] = [
    { type: 'link', label: 'Dashboard', icon: 'pi pi-th-large', to: '/dashboard' },

    {
      type: 'group',
      label: 'Practice questions',
      icon: 'pi pi-code',
      open: false,
      children: [
        { type: 'link', label: 'All practice questions', to: '/coding', icon: 'pi pi-list' },
        { type: 'link', label: 'Foundations Track', to: '/tracks', icon: 'pi pi-sliders-h' },
        { type: 'link', label: 'Question formats', to: '/coding', icon: 'pi pi-check-square', query: { view: 'formats' } },
      ],
    },

    {
      type: 'group',
      label: 'Study paths',
      icon: 'pi pi-directions-alt',
      open: false,
      children: [
        { type: 'link', label: 'Crash Track (7 days)', to: '/tracks/crash-7d', icon: 'pi pi-bolt' },
        { type: 'link', label: 'Foundations Track (30 days)', to: '/tracks/foundations-30d', icon: 'pi pi-calendar' },
        { type: 'link', label: 'Companies', to: '/companies', icon: 'pi pi-building' },
      ],
    },

    {
      type: 'group',
      label: 'Guides',
      icon: 'pi pi-book',
      open: false,
      children: [
        { type: 'link', label: 'Interview Blueprint', to: '/guides/interview-blueprint', icon: 'pi pi-book' },
        { type: 'link', label: 'Behavioral Interview Blueprint', to: '/guides/behavioral', icon: 'pi pi-users' },
        { type: 'link', label: 'System Design Blueprint', to: '/guides/system-design-blueprint', icon: 'pi pi-sitemap' },
      ],
    },

    {
      type: 'group',
      label: 'Shortcuts & tools',
      icon: 'pi pi-stopwatch',
      open: false,
      children: [
        { type: 'link', label: 'Question library', to: '/coding', icon: 'pi pi-database' },
        { type: 'link', label: 'Question formats', to: '/coding', icon: 'pi pi-clone', query: { view: 'formats' } },
        { type: 'link', label: 'Tracks', to: '/tracks', icon: 'pi pi-directions' },
        { type: 'link', label: 'Companies', to: '/companies', icon: 'pi pi-building' },
      ],
    },
  ];

  toggleGroup(i: number) {
    const wasCollapsed = this.collapsed;
    if (wasCollapsed) {
      this.collapsed = false;
      document.body.classList.remove('sidebar-mini');
    }
    this.nav.forEach((item, idx) => {
      if (!this.isGroup(item)) return;
      if (idx === i) {
        item.open = wasCollapsed ? true : !item.open;
      } else {
        item.open = false;
      }
    });
  }

  toggleDrawer() { this.drawerOpen.update(v => !v); }

  ngOnInit(): void {
    this.applyDefaultOpen(this.router.url);
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.applyDefaultOpen(e.urlAfterRedirects || e.url));
  }

  ngOnDestroy(): void {
    if (this.navSub?.unsubscribe) this.navSub.unsubscribe();
  }

  toggleCollapsed() {
    this.collapsed = !this.collapsed;
    document.body.classList.toggle('sidebar-mini', this.collapsed);
  }

  @HostListener('window:keydown.escape') onEsc() {
    if (this.drawerOpen()) this.drawerOpen.set(false);
  }

  // --- Bug modal actions ---
  openBugModal() {
    this.submitOk = false;
    this.bugText = '';
    this.currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    this.bugVisible = true;
  }
  closeBugModal() {
    if (this.submitting) return;
    this.bugVisible = false;
  }
  async submitBug() {
    const note = this.bugText.trim();
    if (!note || this.submitting) return;
    this.submitting = true;

    try {
      await firstValueFrom(this.http.post(apiUrl('/bug-report'), {
        note,
        url: this.currentUrl || (typeof window !== 'undefined' ? window.location.href : ''),
      }, { responseType: 'text' }));

      this.submitOk = true;
      setTimeout(() => {
        this.bugVisible = false;
        this.bugText = '';
        this.submitOk = false;
      }, 900);
    } catch (err) {
      alert('Failed to send bug report. Please try again.');
    } finally {
      this.submitting = false;
    }
  }

  private applyDefaultOpen(url: string) {
    const path = (url || '').split('?')[0].split('#')[0];
    if (path === '/dashboard') {
      this.nav.forEach((item, idx) => {
        if (!this.isGroup(item)) return;
        item.open = idx === 1;
      });
    }
  }

}
