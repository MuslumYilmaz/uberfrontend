import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'javascript' },

  // System Design under the same layout, no tabs, no redirect
  {
    path: 'system-design',
    loadComponent: () =>
      import('./features/tech-layout/tech-layout.component').then(m => m.TechLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/system-design-list/system-design-list.component')
            .then(m => m.SystemDesignListComponent)
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/system-design-list/system-design-detail/system-design-detail.component')
            .then(m => m.SystemDesignDetailComponent)
      }
    ]
  },

  // JS / Angular under :tech → default to coding
  {
    path: ':tech',
    loadComponent: () =>
      import('./features/tech-layout/tech-layout.component').then(m => m.TechLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'coding' },   // only affects :tech branch
      {
        path: 'coding',
        loadComponent: () =>
          import('./features/coding/coding-list/coding-list.component')
            .then(m => m.CodingListComponent)
      },
      {
        path: 'coding/:id',
        loadComponent: () =>
          import('./features/coding/coding-detail/coding-detail.component')
            .then(m => m.CodingDetailComponent)
      },
      {
        path: 'trivia',
        loadComponent: () =>
          import('./features/trivia/trivia-list/trivia-list.component')
            .then(m => m.TriviaListComponent)
      },
      {
        path: 'trivia/:id',
        loadComponent: () =>
          import('./features/trivia/trivia-detail/trivia-detail.component')
            .then(m => m.TriviaDetailComponent)
      }
    ]
  },

  { path: '**', redirectTo: '' }
];
