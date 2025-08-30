import { Routes } from '@angular/router';
import { authGuard, authMatchGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Landing
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },

  // Auth
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'signup',
        loadComponent: () =>
          import('./features/auth/signup/signup.component').then(m => m.SignupComponent),
      },
    ],
  },

  // Courses
  {
    path: 'courses',
    loadComponent: () =>
      import('./features/courses/course-list/course-list.component').then(m => m.CourseListComponent),
  },
  {
    path: 'courses/:courseId',
    loadComponent: () =>
      import('./features/courses/course-detail/course-detail.component').then(m => m.CourseDetailComponent),
  },
  {
    path: 'courses/:courseId/:topicId/:lessonId',
    loadComponent: () =>
      import('./features/courses/course-player/course-player.component').then(m => m.CoursePlayerComponent),
  },

  // Companies
  {
    path: 'companies',
    loadComponent: () =>
      import('./features/company/company-layout/company-layout.component').then(m => m.CompanyLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/company/company-index/company-index.component').then(m => m.CompanyIndexComponent),
      },
      {
        path: ':slug',
        loadComponent: () =>
          import('./features/company/company-detail/company-detail.component').then(m => m.CompanyDetailComponent),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'all' },
          {
            path: 'all',
            loadComponent: () =>
              import('./features/coding/coding-list/coding-list.component').then(m => m.CodingListComponent),
            data: { source: 'company', kind: 'all' },
          },
          {
            path: 'coding',
            loadComponent: () =>
              import('./features/coding/coding-list/coding-list.component').then(m => m.CodingListComponent),
            data: { source: 'company', kind: 'coding' },
          },
          {
            path: 'trivia',
            loadComponent: () =>
              import('./features/coding/coding-list/coding-list.component').then(m => m.CodingListComponent),
            data: { source: 'company', kind: 'trivia' },
          },
        ],
      },
    ],
  },

  // System design
  {
    path: 'system-design',
    loadComponent: () =>
      import('./features/tech-layout/tech-layout.component').then(m => m.TechLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/system-design-list/system-design-list.component').then(m => m.SystemDesignListComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/system-design-list/system-design-detail/system-design-detail.component')
            .then(m => m.SystemDesignDetailComponent),
      },
    ],
  },

  // Guides (NEW)
  {
    path: 'guides',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'playbook' },
      {
        path: 'playbook',
        loadComponent: () =>
          import('./features/guides/playbook/playbook-index/playbook-index.component').then(m => m.PlaybookIndexComponent),
      },
      {
        path: 'playbook/:slug',
        loadComponent: () =>
          import('./features/guides/playbook/playbook-host.component').then(m => m.PlaybookHostComponent),
      },
    ],
  },

  // Profile
  {
    path: 'profile',
    canMatch: [authMatchGuard],
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/profile/profile.component').then(m => m.ProfileComponent),
  },

  // Tech sections — JavaScript / Angular
  {
    path: ':tech',
    loadComponent: () =>
      import('./features/tech-layout/tech-layout.component').then(m => m.TechLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'coding' },
      {
        path: 'coding',
        loadComponent: () =>
          import('./features/coding/coding-list/coding-list.component').then(m => m.CodingListComponent),
        data: { source: 'tech', kind: 'coding' },
      },
      {
        path: 'trivia',
        loadComponent: () =>
          import('./features/coding/coding-list/coding-list.component').then(m => m.CodingListComponent),
        data: { source: 'tech', kind: 'trivia' },
      },
      {
        path: 'debug',
        loadComponent: () =>
          import('./features/coding/coding-list/coding-list.component').then(m => m.CodingListComponent),
        data: { source: 'tech', kind: 'debug' },
      },
      {
        path: 'coding/:id',
        loadComponent: () =>
          import('./features/coding/coding-detail/coding-detail.component').then(m => m.CodingDetailComponent),
      },
      {
        path: 'trivia/:id',
        loadComponent: () =>
          import('./features/trivia/trivia-detail/trivia-detail.component').then(m => m.TriviaDetailComponent),
      },
      {
        path: 'debug/:id',
        loadComponent: () =>
          import('./features/coding/coding-detail/coding-detail.component').then(m => m.CodingDetailComponent),
        data: { kind: 'debug' },
      },
    ],
  },

  // Fallback
  { path: '**', redirectTo: '' },
];
