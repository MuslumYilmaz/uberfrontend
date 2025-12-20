import {
  Routes,
  UrlMatchResult,
  UrlSegment,
  provideRouter,
  withInMemoryScrolling,
  withRouterConfig,
} from '@angular/router';

import { authGuard, authMatchGuard } from './core/guards/auth.guard';
import { adminGuard, adminMatchGuard } from './core/guards/admin.guard';

/** Only match allowed techs at the first URL segment */
const ALLOWED_TECH = new Set(['javascript', 'angular', 'react', 'vue', 'html', 'css']);
export function techMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (!segments.length) return null;
  const first = segments[0].path.toLowerCase();
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
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    data: {
      seo: {
        title: 'High-signal frontend interview prep',
        description:
          'FrontendAtlas — High-signal frontend interview preparation platform. Practice front-end coding, trivia, and system design interview questions with curated guides and company-specific tracks.',
        keywords: [
          'front end interview questions',
          'javascript interview',
          'react interview',
          'system design for frontend',
          'ui coding challenges',
        ],
      },
    },
  },
  {
    path: 'admin',
    canMatch: [adminMatchGuard],
    children: [
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/admin-users.component').then((m) => m.AdminUsersComponent),
        canActivate: [adminGuard],
        data: {
          seo: {
            title: 'Admin • Users',
            description: 'Admin view for managing FrontendAtlas users.',
            robots: 'noindex,nofollow',
          },
        },
      },
    ],
  },
  {
    path: 'showcase',
    loadComponent: () =>
      import('./features/showcase/showcase.page').then((m) => m.ShowcasePageComponent),
    data: {
      seo: {
        title: 'Showcase',
        description: 'See FrontendAtlas in action with live UI challenges, guided flows, and interactive demos.',
      },
    },
  },

  // Auth
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then((m) => m.LoginComponent),
        data: {
          seo: {
            title: 'Log in',
            description: 'Log in to FrontendAtlas to sync your interview prep.',
            robots: 'noindex,nofollow',
          },
        },
      },
      {
        path: 'signup',
        loadComponent: () =>
          import('./features/auth/signup/signup.component').then((m) => m.SignupComponent),
        data: {
          seo: {
            title: 'Sign up',
            description: 'Create your FrontendAtlas account to unlock the full interview-prep library.',
            robots: 'noindex,nofollow',
          },
        },
      },
      {
        path: 'callback',
        loadComponent: () =>
          import('./features/auth/oauth-callback/oauth-callback.component').then(
            (m) => m.OAuthCallbackComponent,
          ),
        data: {
          seo: {
            title: 'Completing login',
            description: 'Finalizing your sign-in. You will be redirected shortly.',
            robots: 'noindex,nofollow',
          },
        },
      },
    ],
  },

  // Courses
  // {
  //   path: 'courses',
  //   loadComponent: () =>
  //     import('./features/courses/course-list/course-list.component').then(
  //       (m) => m.CourseListComponent,
  //     ),
  // },
  // {
  //   path: 'courses/:courseId',
  //   loadComponent: () =>
  //     import('./features/courses/course-detail/course-detail.component').then(
  //       (m) => m.CourseDetailComponent,
  //     ),
  // },
  // {
  //   path: 'courses/:courseId/:topicId/:lessonId',
  //   loadComponent: () =>
  //     import('./features/courses/course-player/course-player.component').then(
  //       (m) => m.CoursePlayerComponent,
  //     ),
  // },
  // // anything else under /courses after the specific ones → 404
  // {
  //   path: 'courses/**',
  //   loadComponent: () =>
  //     import('./shared/components/not-found/not-found.component').then((m) => m.NotFoundComponent),
  //   data: { title: 'Page not found' },
  // },

  // Companies
  {
    path: 'companies',
    loadComponent: () =>
      import('./features/company/company-layout/company-layout.component').then(
        (m) => m.CompanyLayoutComponent,
      ),
    data: {
      seo: {
        title: 'Company interview prep',
        description: 'Company-specific front-end interview guides, drills, and question banks.',
      },
    },
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/company/company-index/company-index.component').then(
            (m) => m.CompanyIndexComponent,
          ),
        data: {
          seo: {
            title: 'Company interview guides',
            description: 'Pick a company to see tailored front-end interview questions and tips.',
          },
        },
      },
      {
        path: ':slug',
        loadComponent: () =>
          import('./features/company/company-detail/company-detail.component').then(
            (m) => m.CompanyDetailComponent,
          ),
        data: {
          seo: {
            title: 'Company front-end interview questions',
            description: 'Focused coding, trivia, and system design practice for a specific company.',
          },
        },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'all' },
          {
            path: 'all',
            loadComponent: () =>
              import('./features/coding/coding-list/coding-list.component').then(
                (m) => m.CodingListComponent,
              ),
            data: {
              source: 'company',
              kind: 'all',
              seo: {
                title: 'Company interview questions',
                description: 'Browse all front-end interview questions for this company.',
              },
            },
          },
          {
            path: 'coding',
            loadComponent: () =>
              import('./features/coding/coding-list/coding-list.component').then(
                (m) => m.CodingListComponent,
              ),
            data: {
              source: 'company',
              kind: 'coding',
              seo: {
                title: 'Company coding interview questions',
                description: 'Solve coding and debugging questions used in this company’s interviews.',
              },
            },
          },
          {
            path: 'trivia',
            loadComponent: () =>
              import('./features/coding/coding-list/coding-list.component').then(
                (m) => m.CodingListComponent,
              ),
            data: {
              source: 'company',
              kind: 'trivia',
              seo: {
                title: 'Company trivia questions',
                description: 'Quick front-end trivia to mirror this company’s interview screens.',
              },
            },
          },
          {
            path: 'system',
            loadComponent: () =>
              import('./features/coding/coding-list/coding-list.component').then(
                (m) => m.CodingListComponent,
              ),
            data: {
              source: 'company',
              kind: 'system-design',
              seo: {
                title: 'Company system design prompts',
                description: 'Front-end system design prompts tailored to this company.',
              },
            },
          },
          {
            path: '**',
            loadComponent: () =>
              import('./shared/components/not-found/not-found.component').then(
                (m) => m.NotFoundComponent,
              ),
            data: { title: 'Page not found' },
          },
        ],
      },
    ],
  },

  {
    path: 'pricing',
    loadComponent: () =>
      import('./features/pricing/pricing.component').then((m) => m.PricingComponent),
    data: {
      seo: {
        title: 'Pricing',
        description: 'Compare FrontendAtlas plans and unlock the full set of interview questions and guides.',
      },
    },
  },

  // Tracks (curated question sets)
  {
    path: 'tracks',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/tracks/track-list/track-list.component').then(
            (m) => m.TrackListComponent,
          ),
        data: {
          seo: {
            title: 'Interview prep tracks',
            description: 'Pick a curated set of questions for FAANG, senior roles, crash prep, or fundamentals.',
          },
        },
      },
      {
        path: ':slug',
        loadComponent: () =>
          import('./features/tracks/track-detail/track-detail.component').then(
            (m) => m.TrackDetailComponent,
          ),
        data: {
          seo: {
            title: 'Interview prep track',
            description: 'Curated front-end interview questions aligned to a specific goal.',
          },
        },
      },
      {
        path: '**',
        loadComponent: () =>
          import('./shared/components/not-found/not-found.component').then(
            (m) => m.NotFoundComponent,
          ),
        data: { title: 'Page not found' },
      },
    ],
  },

  // System design (practice/problems area, not the guide)
  {
    path: 'system-design',
    loadComponent: () =>
      import('./features/tech-layout/tech-layout.component').then((m) => m.TechLayoutComponent),
    data: {
      seo: {
        title: 'Front-end system design practice',
        description: 'System design prompts, walkthroughs, and solutions for front-end interviews.',
        keywords: ['frontend system design', 'ui architecture interview', 'system design practice'],
      },
    },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/system-design-list/system-design-list.component').then(
            (m) => m.SystemDesignListComponent,
          ),
        data: {
          seo: {
            title: 'Front-end system design questions',
            description: 'Practice system design scenarios focused on front-end architecture and UX.',
          },
        },
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/system-design-list/system-design-detail/system-design-detail.component').then(
            (m) => m.SystemDesignDetailComponent,
          ),
        data: {
          seo: {
            title: 'System design scenario',
            description: 'Dive into a front-end system design scenario with structured guidance.',
          },
        },
      },
      {
        path: '**',
        loadComponent: () =>
          import('./shared/components/not-found/not-found.component').then(
            (m) => m.NotFoundComponent,
          ),
        data: { title: 'Page not found' },
      },
    ],
  },

  // Guides
  {
    path: 'guides',
    data: {
      seo: {
        title: 'Front-end interview blueprints',
        description: 'Blueprints for coding, system design, and behavioral front-end interviews.',
      },
    },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'interview-blueprint' },

      {
        path: 'playbook',
        pathMatch: 'full',
        redirectTo: 'interview-blueprint',
      },
      {
        path: 'playbook/:slug',
        pathMatch: 'full',
        redirectTo: 'interview-blueprint/:slug',
      },

      {
        path: 'interview-blueprint',
        loadComponent: () =>
          import('./features/guides/playbook/playbook-index/playbook-index.component').then(
            (m) => m.PlaybookIndexComponent,
          ),
        data: {
          seo: {
            title: 'FrontendAtlas Interview Blueprint',
            description: 'Step-by-step plan to prepare for front-end interviews with checklists and tracks.',
          },
        },
      },
      {
        path: 'interview-blueprint/:slug',
        loadComponent: () =>
          import('./features/guides/playbook/playbook-host.component').then(
            (m) => m.PlaybookHostComponent,
          ),
        data: {
          seo: {
            title: 'FrontendAtlas Interview Blueprint',
            description: 'In-depth guidance for key front-end interview topics.',
          },
        },
      },

      {
        path: 'system-design',
        pathMatch: 'full',
        redirectTo: 'system-design-blueprint',
      },
      {
        path: 'system-design/:slug',
        pathMatch: 'full',
        redirectTo: 'system-design-blueprint/:slug',
      },
      {
        path: 'system-design-blueprint',
        loadComponent: () =>
          import('./features/guides/system-design/system-design-index/system-design-index.component').then(
            (m) => m.SystemDesignIndexComponent,
          ),
        data: {
          seo: {
            title: 'Frontend System Design Blueprint',
            description: 'Principles, patterns, and examples for front-end system design interviews.',
          },
        },
      },
      {
        path: 'system-design-blueprint/:slug',
        loadComponent: () =>
          import('./features/guides/system-design/system-design-host.component').then(
            (m) => m.SystemDesignHostComponent,
          ),
        data: {
          seo: {
            title: 'Frontend System Design Blueprint',
            description: 'Detailed walkthroughs for individual front-end system design topics.',
          },
        },
      },

      {
        path: 'behavioral',
        loadComponent: () =>
          import('./features/guides/behavioral/behavioral-index/behavioral-index.component').then(
            (m) => m.BehavioralIndexComponent,
          ),
        data: {
          seo: {
            title: 'Behavioral interview handbook',
            description: 'Story frameworks and examples to answer behavioral front-end interview questions.',
          },
        },
      },
      {
        path: 'behavioral/:slug',
        loadComponent: () =>
          import('./features/guides/behavioral/behavioral-host.component').then(
            (m) => m.BehavioralHostComponent,
          ),
        data: {
          seo: {
            title: 'Behavioral interview topic',
            description: 'Prep for a specific behavioral interview topic with examples and prompts.',
          },
        },
      },

      {
        path: '**',
        loadComponent: () =>
          import('./shared/components/not-found/not-found.component').then(
            (m) => m.NotFoundComponent,
          ),
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
      import('./features/auth/profile/profile.component').then((m) => m.ProfileComponent),
    data: {
      seo: {
        title: 'Profile',
        description: 'Manage your FrontendAtlas profile and preferences.',
        robots: 'noindex,nofollow',
      },
    },
  },

  // NEW: Legal
  {
    path: 'legal',
    data: {
      seo: {
        title: 'Legal',
        description: 'FrontendAtlas legal policies and compliance documents.',
        robots: 'index,follow',
      },
    },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/legal/legal-index/legal-index.component').then((m) => m.LegalIndexComponent),
        data: {
          seo: {
            title: 'Legal overview',
            description: 'Browse FrontendAtlas terms, privacy, and cookie policies.',
          },
        },
      },
      {
        path: 'terms',
        loadComponent: () =>
          import('./features/legal/terms/terms.component').then((m) => m.TermsComponent),
        data: {
          seo: {
            title: 'Terms of Service',
            description: 'FrontendAtlas terms of service and user responsibilities.',
            robots: 'index,follow',
          },
        },
      },
      {
        path: 'privacy',
        loadComponent: () =>
          import('./features/legal/privacy/privacy.component').then((m) => m.PrivacyComponent),
        data: {
          seo: {
            title: 'Privacy Policy',
            description: 'How FrontendAtlas collects, uses, and protects your data.',
            robots: 'index,follow',
          },
        },
      },
      {
        path: 'cookies',
        loadComponent: () =>
          import('./features/legal/cookies/cookies.component').then((m) => m.CookiesComponent),
        data: {
          seo: {
            title: 'Cookie Policy',
            description: 'Learn how FrontendAtlas uses cookies and how to control them.',
            robots: 'index,follow',
          },
        },
      },
      {
        path: '**',
        loadComponent: () =>
          import('./shared/components/not-found/not-found.component').then(
            (m) => m.NotFoundComponent,
          ),
        data: { title: 'Page not found' },
      },
    ],
  },

  // explicit /404
  {
    path: '404',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then((m) => m.NotFoundComponent),
    data: {
      title: 'Page not found',
      seo: {
        title: 'Page not found',
        description: 'The page you are looking for could not be found.',
        robots: 'noindex,nofollow',
      },
    },
  },

  // NEW: Global Coding page — lists all coding questions; pills filter client-side
  {
    path: 'coding',
    loadComponent: () =>
      import('./features/coding/coding-list/coding-list.component').then(
        (m) => m.CodingListComponent,
      ),
    data: {
      source: 'global-coding',
      kind: 'coding',
      seo: {
        title: 'Front-end coding interview questions',
        description: 'Solve curated front-end coding interview questions with filters for tech, difficulty, and tags.',
      },
    },
  },

  // Tech sections — JavaScript / Angular / HTML / CSS
  {
    matcher: techMatcher,
    loadComponent: () =>
      import('./features/tech-layout/tech-layout.component').then((m) => m.TechLayoutComponent),
    data: {
      seo: {
        title: 'Front-end practice',
        description: 'Framework-specific front-end interview practice for JavaScript, React, Angular, Vue, HTML, and CSS.',
      },
    },
    children: [
      // Visiting /:tech goes to the single global list
      { path: '', pathMatch: 'full', redirectTo: '/coding' },

      {
        path: 'coding/:id',
        loadComponent: () =>
          import('./features/coding/coding-detail/coding-detail.component').then(
            (m) => m.CodingDetailComponent,
          ),
        data: {
          seo: {
            title: 'Coding interview question',
            description: 'Front-end coding challenge with starter code, tests, and solutions.',
          },
        },
      },
      {
        path: 'trivia/:id',
        loadComponent: () =>
          import('./features/trivia/trivia-detail/trivia-detail.component').then(
            (m) => m.TriviaDetailComponent,
          ),
        data: {
          seo: {
            title: 'Front-end trivia question',
            description: 'Quick front-end trivia with concise explanations.',
          },
        },
      },
      {
        path: 'debug/:id',
        loadComponent: () =>
          import('./features/coding/coding-detail/coding-detail.component').then(
            (m) => m.CodingDetailComponent,
          ),
        data: {
          kind: 'debug',
          seo: {
            title: 'Debugging interview question',
            description: 'Debug front-end code with failing tests to mirror real interview tasks.',
          },
        },
      },

      {
        path: '**',
        loadComponent: () =>
          import('./shared/components/not-found/not-found.component').then(
            (m) => m.NotFoundComponent,
          ),
        data: {
          title: 'Page not found',
          seo: {
            title: 'Page not found',
            description: 'The page you are looking for could not be found.',
            robots: 'noindex,nofollow',
          },
        },
      },
    ],
  },

  // Global fallback — render 404
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then((m) => m.NotFoundComponent),
    data: {
      title: 'Page not found',
      seo: {
        title: 'Page not found',
        description: 'The page you are looking for could not be found.',
        robots: 'noindex,nofollow',
      },
    },
  },
];

/**
 * Router providers with the recommended configuration
 */
export const APP_ROUTER_PROVIDERS = [
  provideRouter(
    routes,
    withRouterConfig({
      onSameUrlNavigation: 'reload',
      paramsInheritanceStrategy: 'always',
    }),
    withInMemoryScrolling({
      scrollPositionRestoration: 'top',
      anchorScrolling: 'enabled',      // 👈 enable fragment scrolling
    }),
  ),
];
