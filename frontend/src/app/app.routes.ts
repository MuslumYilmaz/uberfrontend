import { Routes } from '@angular/router';

export const routes: Routes = [
  // Landing page at /
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component')
        .then(m => m.DashboardComponent),
  },

  // 🔑 auth pages
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component')
            .then(m => m.LoginComponent),
      },
      {
        path: 'signup',
        loadComponent: () =>
          import('./features/auth/signup/signup.component')
            .then(m => m.SignupComponent),
      },
    ],
  },

  // ─────────────────────────────
  // Courses (explicit routes come BEFORE ":tech" so they don't get captured)
  // ─────────────────────────────
  {
    path: 'courses',
    loadComponent: () =>
      import('./features/courses/course-list/course-list.component')
        .then(m => m.CourseListComponent),
  },
  {
    path: 'courses/:courseId',
    loadComponent: () =>
      import('./features/courses/course-detail/course-detail.component')
        .then(m => m.CourseDetailComponent),
  },
  {
    path: 'courses/:courseId/:topicId/:lessonId',
    loadComponent: () =>
      import('./features/courses/course-player/course-player.component')
        .then(m => m.CoursePlayerComponent),
  },

  // System design (list + detail)
  {
    path: 'system-design',
    loadComponent: () =>
      import('./features/tech-layout/tech-layout.component')
        .then(m => m.TechLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/system-design-list/system-design-list.component')
            .then(m => m.SystemDesignListComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/system-design-list/system-design-detail/system-design-detail.component')
            .then(m => m.SystemDesignDetailComponent),
      },
    ],
  },

  // Tech sections with their own tabs/layout
  {
    path: ':tech',
    loadComponent: () =>
      import('./features/tech-layout/tech-layout.component')
        .then(m => m.TechLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'coding' },
      {
        path: 'coding',
        loadComponent: () =>
          import('./features/coding/coding-list/coding-list.component')
            .then(m => m.CodingListComponent),
      },
      {
        path: 'coding/:id',
        loadComponent: () =>
          import('./features/coding/coding-detail/coding-detail.component')
            .then(m => m.CodingDetailComponent),
      },
      {
        path: 'trivia',
        loadComponent: () =>
          import('./features/trivia/trivia-list/trivia-list.component')
            .then(m => m.TriviaListComponent),
      },
      {
        path: 'trivia/:id',
        loadComponent: () =>
          import('./features/trivia/trivia-detail/trivia-detail.component')
            .then(m => m.TriviaDetailComponent),
      },
    ],
  },

  // Fallback
  { path: '**', redirectTo: '' },
];