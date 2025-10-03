import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

interface LinkItem {
  type: 'link';
  label: string;
  to: string;
  icon?: string;
  query?: Record<string, any>;
}
interface GroupItem { type: 'group'; label: string; icon?: string; open?: boolean; children: LinkItem[]; }
type NavItem = LinkItem | GroupItem;

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './app-sidebar.component.html',
  styleUrls: ['./app-sidebar.component.css'],
})
export class AppSidebarComponent {
  @Input() collapsed = false;
  drawerOpen = signal(false);

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
        { type: 'link', label: 'Frameworks / languages', to: '/coding', icon: 'pi pi-sliders-h' },
        { type: 'link', label: 'Question formats', to: '/coding', icon: 'pi pi-check-square', query: { view: 'formats' } },
      ],
    },

    {
      type: 'group',
      label: 'Recommended strategy',
      icon: 'pi pi-map',
      open: false,
      children: [
        { type: 'link', label: 'Frontend Interview Playbook', to: '/strategy/playbook', icon: 'pi pi-book' },
        { type: 'link', label: 'JavaScript Questions', to: '/coding', icon: 'pi pi-code', query: { tech: 'javascript' } },
        { type: 'link', label: 'System Design Playbook', to: '/strategy/system-design', icon: 'pi pi-sitemap' },
      ],
    },

    {
      type: 'group',
      label: 'Guides',
      icon: 'pi pi-book',
      open: false,
      children: [
        { type: 'link', label: 'Frontend Playbook', to: '/guides/playbook', icon: 'pi pi-book' },
        { type: 'link', label: 'Behavioral Guide', to: '/guides/behavioral', icon: 'pi pi-users' },
        { type: 'link', label: 'System Design Guide', to: '/guides/system-design', icon: 'pi pi-sitemap' },
      ],
    },

    { type: 'link', label: 'Time-savers', icon: 'pi pi-bolt', to: '/time-savers' },
  ];

  toggleGroup(i: number) {
    this.nav.forEach((item, idx) => {
      if (this.isGroup(item)) {
        // close all except the clicked one
        item.open = idx === i ? !item.open : false;
      }
    });
  }

  toggleDrawer() { this.drawerOpen.update(v => !v); }

  toggleCollapsed() {
    this.collapsed = !this.collapsed;
    document.body.classList.toggle('sidebar-mini', this.collapsed);
  }

  onCustomAction() { console.log('Sidebar action clicked'); }

  @HostListener('window:keydown.escape') onEsc() {
    if (this.drawerOpen()) this.drawerOpen.set(false);
  }
}
