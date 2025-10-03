import { Routes, UrlMatchResult, UrlSegment } from '@angular/router';
import { authGuard, authMatchGuard } from './core/guards/auth.guard';

/** Only match allowed techs */
const ALLOWED_TECH = new Set(['javascript', 'angular', 'react', 'vue', 'html', 'css']);
export function techMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (!segments.length) return null;
  const first = segments[0].path;
  if (ALLOWED_TECH.has(first)) {
    return { consumed: [segments[0]], posParams: { tech: segments[0] } };
  }
  return null;
}

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
      {
        path: 'callback',
        loadComponent: () =>
          import('./features/auth/oauth-callback/oauth-callback.component')
            .then(m => m.OAuthCallbackComponent),
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
  // anything else under /courses after the specific ones → 404
  {
    path: 'courses/**',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent),
    data: { title: 'Page not found' },
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
          {
            path: 'coding',
            loadComponent: () =>
              import('./features/coding/coding-list/coding-list.component')
                .then(m => m.CodingListComponent),
            data: { source: 'global-coding', kind: 'coding', view: 'formats' },
          },
          {
            path: '**',
            loadComponent: () =>
              import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent),
            data: { title: 'Page not found' },
          },
        ],
      },
    ],
  },

  {
    path: 'pricing',
    loadComponent: () =>
      import('./features/pricing/pricing.component').then(m => m.PricingComponent),
  },

  // System design (practice/problems area, not the guide)
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
      // any deeper child under /system-design → 404
      {
        path: '**',
        loadComponent: () =>
          import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent),
        data: { title: 'Page not found' },
      },
    ],
  },

  // Guides
  {
    path: 'guides',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'playbook' },

      {
        path: 'playbook',
        loadComponent: () =>
          import('./features/guides/playbook/playbook-index/playbook-index.component')
            .then(m => m.PlaybookIndexComponent),
      },
      {
        path: 'playbook/:slug',
        loadComponent: () =>
          import('./features/guides/playbook/playbook-host.component')
            .then(m => m.PlaybookHostComponent),
      },
      {
        path: 'system-design',
        loadComponent: () =>
          import('./features/guides/system-design/system-design-index/system-design-index.component')
            .then(m => m.SystemDesignIndexComponent),
      },
      {
        path: 'system-design/:slug',
        loadComponent: () =>
          import('./features/guides/system-design/system-design-host.component')
            .then(m => m.SystemDesignHostComponent),
      },

      {
        path: 'behavioral',
        loadComponent: () =>
          import('./features/guides/behavioral/behavioral-index/behavioral-index.component')
            .then(m => m.BehavioralIndexComponent),
      },
      {
        path: 'behavioral/:slug',
        loadComponent: () =>
          import('./features/guides/behavioral/behavioral-host.component')
            .then(m => m.BehavioralHostComponent),
      },

      // unknown child under /guides → 404
      {
        path: '**',
        loadComponent: () =>
          import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent),
        data: { title: 'Page not found' },
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

  // explicit /404 (optional for programmatic nav)
  {
    path: '404',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent),
    data: { title: 'Page not found' },
  },

  // NEW: Global Coding page — lists all coding questions; pills filter client-side
  {
    path: 'coding',
    loadComponent: () =>
      import('./features/coding/coding-list/coding-list.component')
        .then(m => m.CodingListComponent),
    data: { source: 'global-coding', kind: 'coding' },
  },

  // Tech sections — JavaScript / Angular / HTML / CSS
  {
    matcher: techMatcher,
    loadComponent: () =>
      import('./features/tech-layout/tech-layout.component').then(m => m.TechLayoutComponent),
    children: [
      // Visiting /:tech goes to the single global list
      { path: '', pathMatch: 'full', redirectTo: '/coding' },
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

      {
        path: '**',
        loadComponent: () =>
          import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent),
        data: { title: 'Page not found' },
      },
    ],
  },


  // Global fallback — render 404 (don't redirect so the missing URL is shown)
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent),
    data: { title: 'Page not found' },
  },
];