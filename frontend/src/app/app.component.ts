import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, computed, signal } from '@angular/core';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { HeaderComponent } from './shared/components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, HttpClientModule, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'] 
})
export class AppComponent {
  private currentUrl = signal('/');

  // true when route starts with /auth
  isAuthRoute = computed(() => this.currentUrl().startsWith('/auth'));

  // no header on auth pages
  showHeader = computed(() => !this.isAuthRoute());

  constructor(private router: Router) {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => this.currentUrl.set(e.urlAfterRedirects || e.url));
  }
}
