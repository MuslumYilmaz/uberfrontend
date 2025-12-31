import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, HostListener, Input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TooltipModule } from 'primeng/tooltip';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

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
export class AppSidebarComponent {
  @Input() collapsed = false;
  drawerOpen = signal(false);

  bugVisible = false;
  bugText = '';
  submitting = false;
  submitOk = false;
  currentUrl = '';

  constructor(private http: HttpClient) {}

  isLink = (i: NavItem): i is LinkItem => i.type === 'link';
  isGroup = (i: NavItem): i is GroupItem => i.type === 'group';

  nav: NavItem[] = [
    { type: 'link', label: 'Dashboard', icon: 'pi pi-th-large', to: '/' },

    {
      type: 'group',
      label: 'Practice questions',
      icon: 'pi pi-code',
      open: false,
      children: [
        { type: 'link', label: 'All practice questions', to: '/coding', icon: 'pi pi-list' },
        { type: 'link', label: 'Foundations Track', to: '/tracks/foundations-30d', icon: 'pi pi-sliders-h' },
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
    this.nav.forEach((item, idx) => {
      if (this.isGroup(item)) item.open = idx === i ? !item.open : false;
    });
  }

  toggleDrawer() { this.drawerOpen.update(v => !v); }

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
      const apiBase = String(environment.apiBase).replace(/\/+$/, '');
      await firstValueFrom(this.http.post(`${apiBase}/bug-report`, {
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
      console.error(err);
      alert('Failed to send bug report. Please try again.');
    } finally {
      this.submitting = false;
    }
  }

}
