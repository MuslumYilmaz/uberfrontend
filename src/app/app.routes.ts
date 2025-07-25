import { Routes } from '@angular/router';
import { CodingListComponent } from './features/coding/coding-list/coding-list.component';
import { TechLayoutComponent } from './features/tech-layout/tech-layout.component';
import { TriviaListComponent } from './features/trivia/trivia-list/trivia-list.component';

export const routes: Routes = [
  // 1) root → redirect to default tech
  { path: '', pathMatch: 'full', redirectTo: 'javascript' },

  // 2) tech layout (tabs + outlet) is itself lazy‑loaded
  {
    path: ':tech',
    loadComponent: () =>
      import('./features/tech-layout/tech-layout.component').then(m => m.TechLayoutComponent),
    children: [
      // when you hit /:tech → redirect into /:tech/coding
      { path: '', pathMatch: 'full', redirectTo: 'coding' },

      // 3) coding list
      {
        path: 'coding',
        loadComponent: () =>
          import('./features/coding/coding-list/coding-list.component')
            .then(m => m.CodingListComponent)
      },
      // 4) coding detail
      {
        path: 'coding/:id',
        loadComponent: () =>
          import('./features/coding/coding-detail/coding-detail.component')
            .then(m => m.CodingDetailComponent)
      },

      // 5) trivia list
      {
        path: 'trivia',
        loadComponent: () =>
          import('./features/trivia/trivia-list/trivia-list.component')
            .then(m => m.TriviaListComponent)
      },
      // 6) trivia detail
      {
        path: 'trivia/:id',
        loadComponent: () =>
          import('./features/trivia/trivia-detail/trivia-detail.component')
            .then(m => m.TriviaDetailComponent)
      }
    ]
  },

  // 7) fallback
  { path: '**', redirectTo: '' }
];

