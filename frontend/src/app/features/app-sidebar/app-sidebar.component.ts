import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

interface LinkItem { type: 'link'; label: string; to: string; icon?: string; }
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
  @Input() collapsed = false;        // mini mode (also toggleable locally)
  drawerOpen = signal(false);        // mobile drawer

  isLink = (i: NavItem): i is LinkItem => i.type === 'link';
  isGroup = (i: NavItem): i is GroupItem => i.type === 'group';

  nav: NavItem[] = [
    { type: 'link', label: 'Dashboard', icon: 'pi pi-th-large', to: '/' },
    {
      type: 'group', label: 'Practice questions', icon: 'pi pi-code', open: true,
      children: [
        { type: 'link', label: 'All practice questions', to: '/coding', icon: 'pi pi-list' },
        { type: 'link', label: 'Frameworks / languages', to: '/practice/frameworks', icon: 'pi pi-sliders-h' },
        { type: 'link', label: 'Question formats', to: '/practice/formats', icon: 'pi pi-check-square' },
      ],
    },
    { type: 'link', label: 'Recommended strategy', icon: 'pi pi-map', to: '/strategy' },
    { type: 'link', label: 'Time-savers', icon: 'pi pi-bolt', to: '/time-savers' },
    { type: 'link', label: 'Guides', icon: 'pi pi-book', to: '/guides' },
  ];


  toggleGroup(i: number) {
    const it = this.nav[i];
    if (this.isGroup(it)) it.open = !it.open;
  }

  toggleDrawer() { this.drawerOpen.update(v => !v); }

  toggleCollapsed() {
    this.collapsed = !this.collapsed;
    document.body.classList.toggle('sidebar-mini', this.collapsed); // lets layout react
  }

  onCustomAction() { console.log('Sidebar action clicked'); }

  @HostListener('window:keydown.escape') onEsc() {
    if (this.drawerOpen()) this.drawerOpen.set(false);
  }
}
