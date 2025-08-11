import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'] // keep plural; both forms work in recent Angular
})
export class AppComponent {
  // Hide header on the landing page (/). Show it everywhere else.
  showHeader$ = this.router.events.pipe(
    filter(e => e instanceof NavigationEnd),
    map(() => this.router.url !== '/' && this.router.url !== ''),
    startWith(typeof window !== 'undefined' ? window.location.pathname !== '/' : true)
  );

  constructor(private router: Router) { }
}
