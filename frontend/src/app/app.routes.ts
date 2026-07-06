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
import {
  companyPreviewAccessGuard,
  premiumGuard,
  trackPreviewAccessGuard,
} from './core/guards/premium.guard';
import {
  codingDetailResolver,
  systemDesignDetailResolver,
  triviaDetailResolver,
} from './core/resolvers/question-detail.resolver';
import { incidentExistsGuard } from './core/guards/incident-exists.guard';
import { tradeoffBattleExistsGuard } from './core/guards/tradeoff-battle-exists.guard';
import { essentialQuestionsResolver } from './core/resolvers/essential-questions.resolver';
import { interviewQuestionsHubResolver } from './core/resolvers/interview-questions.resolver';
import {
  globalCodingListResolver,
  systemDesignListResolver,
} from './core/resolvers/question-list.resolver';
import { incidentDetailResolver, incidentListResolver, incidentSeoResolver } from './core/resolvers/incident.resolver';
import {
  tradeoffBattleDetailResolver,
  tradeoffBattleListResolver,
} from './core/resolvers/tradeoff-battle.resolver';
import {
  behavioralGuideDetailResolver,
  playbookGuideDetailResolver,
  systemGuideDetailResolver,
} from './core/resolvers/guide-detail.resolver';
import { masteryPathResolver } from './core/resolvers/mastery-path.resolver';
import { PlaybookIndexComponent } from './features/guides/playbook/playbook-index/playbook-index.component';

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

const NOT_FOUND_ROUTE_DATA = {
  title: 'Page not found',
  seo: {
    title: 'Page not found',
    description: 'The page you are looking for could not be found.',
    robots: 'noindex,nofollow',
    canonical: '/404',
  },
} as const;

export const routes: Routes = [
  // Landing
  {
    path: '',
    loadComponent: () =>
      import('./features/showcase/showcase.page').then((m) => m.ShowcasePageComponent),
    data: {
      seo: {
        title: 'Frontend Interview Prep Platform',
        description:
          'Prepare for frontend interviews with the FrontendAtlas frontend interview preparation platform: start a guided study plan, practice frontend coding interviews, and run checks in a real UI workflow.',
        keywords: [
          'frontend interview preparation platform',
          'frontend interview practice',
          'frontend coding interview practice',
          'front end interview questions',
          'javascript interview',
          'react interview',
          'system design for frontend',
          'frontend machine coding questions',
          'ui coding challenges',
        ],
      },
    },
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    data: {
      seo: {
        title: 'Dashboard',
        description: 'Your FrontendAtlas home for tracks, guides, and practice questions.',
        robots: 'noindex,nofollow',
      },
    },
  },
  {
    path: 'changelog',
    loadComponent: () =>
      import('./features/changelog/changelog.component').then((m) => m.ChangelogComponent),
    data: {
      seo: {
        title: 'FrontendAtlas changelog',
        description: 'Weekly product updates and shipped improvements in FrontendAtlas.',
        robots: 'index,follow',
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
        title: 'Frontend Interview Prep Platform',
        description:
          'Prepare for frontend interviews with the FrontendAtlas frontend interview preparation platform: start a guided study plan, practice frontend coding interviews, and run checks in a real UI workflow.',
        canonical: '/',
        keywords: [
          'frontend interview preparation platform',
          'frontend interview practice',
          'frontend coding interview practice',
          'front end interview questions',
          'javascript interview',
          'react interview',
          'system design for frontend',
          'frontend machine coding questions',
          'ui coding challenges',
        ],
        robots: 'noindex,nofollow',
      },
    },
  },
  {
    path: 'safeJsonParse',
    pathMatch: 'full',
    redirectTo: 'javascript/coding/js-safe-json-parse',
  },
  {
    path: 'code-reviews',
    pathMatch: 'full',
    redirectTo: 'coding',
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
  {
    path: 'onboarding',
    children: [
      {
        path: 'quick-start',
        loadComponent: () =>
          import('./features/onboarding/quick-start/onboarding-quick-start.component').then(
            (m) => m.OnboardingQuickStartComponent,
          ),
        data: {
          seo: {
            title: 'Quick onboarding',
            description: 'Set your interview timeline, framework, and role to get a focused next-action plan.',
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
        title: 'Company Frontend Interview Questions Hub',
        description:
          'Use company-specific frontend interview questions to compare coding, concept, and system design coverage before final interview prep.',
        robots: 'index,follow',
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
            title: 'Company Frontend Interview Questions',
            description:
              'Explore frontend interview questions grouped by company, then compare coding, concept, and system design coverage for target teams.',
            robots: 'index,follow',
          },
        },
      },
      {
        path: ':slug/preview',
        canActivate: [companyPreviewAccessGuard],
        loadComponent: () =>
          import('./features/company/company-preview/company-preview.component').then(
            (m) => m.CompanyPreviewComponent,
          ),
        data: {
          seo: {
            title: 'Company Frontend Interview Questions Preview',
            description:
              'Preview company-specific frontend interview question coverage, sample coding prompts, concept questions, and system design signals before unlocking premium.',
            robots: 'index,follow',
          },
        },
      },
      {
        path: ':slug',
        canActivate: [premiumGuard],
        loadComponent: () =>
          import('./features/company/company-detail/company-detail.component').then(
            (m) => m.CompanyDetailComponent,
          ),
        data: {
          premiumGate: 'company',
          seo: {
            title: 'Company front-end interview questions',
            description: 'Focused coding, concept questions, and system design practice for a specific company.',
            robots: 'noindex,nofollow',
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
                robots: 'noindex,nofollow',
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
                robots: 'noindex,nofollow',
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
                title: 'Company concept questions',
                description: 'Quick front-end concept questions to mirror this company’s interview screens.',
                robots: 'noindex,nofollow',
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
                robots: 'noindex,nofollow',
              },
            },
          },
          {
            path: '**',
            loadComponent: () =>
              import('./shared/components/not-found/not-found.component').then(
                (m) => m.NotFoundComponent,
              ),
            data: NOT_FOUND_ROUTE_DATA,
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
  {
    path: 'billing',
    children: [
      {
        path: 'success',
        loadComponent: () =>
          import('./features/billing/billing-success.component').then(
            (m) => m.BillingSuccessComponent,
          ),
        data: {
          seo: {
            title: 'Payment received',
            description: 'Confirming your subscription status.',
            robots: 'noindex,nofollow',
          },
        },
      },
      {
        path: 'cancel',
        loadComponent: () =>
          import('./features/billing/billing-cancel.component').then(
            (m) => m.BillingCancelComponent,
          ),
        data: {
          seo: {
            title: 'Checkout canceled',
            description: 'Checkout was canceled. You can return to pricing.',
            robots: 'noindex,nofollow',
          },
        },
      },
    ],
  },

  // Tracks (curated question sets)
  {
    path: 'track',
    pathMatch: 'full',
    redirectTo: 'tracks',
  },
  {
    path: 'track/:slug',
    redirectTo: 'tracks/:slug/preview',
  },
  {
    path: 'track/:slug/mastery',
    pathMatch: 'full',
    redirectTo: 'tracks/:slug/mastery',
  },
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
            title: 'Frontend Interview Study Plan and 30-Day Roadmap',
            description:
              'Use frontend interview study plans to prepare in 7 or 30 days with coding, JavaScript, UI, system design, framework Q&A, company prep, and weekly checkpoints.',
            robots: 'index,follow',
          },
        },
      },
      {
        path: ':slug/preview',
        canActivate: [trackPreviewAccessGuard],
        loadComponent: () =>
          import('./features/tracks/track-preview/track-preview.component').then(
            (m) => m.TrackPreviewComponent,
          ),
        data: {
          seo: {
            title: 'Interview Track Preview',
            description:
              'Preview frontend interview study plan outcomes, sample questions, and premium unlock details.',
            robots: 'index,follow',
          },
        },
      },
      {
        path: ':slug/mastery',
        loadComponent: () =>
          import('./features/guides/mastery-path/mastery-path-page.component').then(
            (m) => m.MasteryPathPageComponent,
          ),
        resolve: {
          masteryPath: masteryPathResolver,
        },
        data: {
          seo: {
            title: 'Framework mastery crash track',
            description:
              'Follow a guided 0 to 100 mastery track with concept questions, output prediction, coding drills, and checkpoint gates.',
            robots: 'index,follow',
          },
        },
      },
      {
        path: ':slug',
        canActivate: [premiumGuard],
        loadComponent: () =>
          import('./features/tracks/track-detail/track-detail.component').then(
            (m) => m.TrackDetailComponent,
          ),
        data: {
          premiumGate: 'tracks',
          seo: {
            title: 'Interview prep track',
            description: 'Curated front-end interview questions aligned to a specific goal.',
            robots: 'noindex,nofollow',
          },
        },
      },
      {
        path: '**',
        loadComponent: () =>
          import('./shared/components/not-found/not-found.component').then(
            (m) => m.NotFoundComponent,
          ),
        data: NOT_FOUND_ROUTE_DATA,
      },
    ],
  },
  {
    path: 'focus-areas',
    loadComponent: () =>
      import('./features/tracks/focus-areas/focus-areas.component').then(
        (m) => m.FocusAreasComponent,
      ),
    data: {
      seo: {
        title: 'Frontend Interview Focus Areas',
        description:
          'Browse all focus areas covered by FrontendAtlas interview tracks and jump directly to the prep path that matches your goal.',
        robots: 'index,follow',
      },
    },
  },

  // System design (practice/problems area, not the guide)
  {
    path: 'system-design',
    loadComponent: () =>
      import('./features/tech-layout/tech-layout.component').then((m) => m.TechLayoutComponent),
    data: {
      seo: {
        title: 'Frontend System Design Interview Practice',
        description: 'Frontend system design interview questions, preparation paths, RADIO framework practice, UI architecture, state, API contracts, performance, accessibility, and tradeoffs.',
        keywords: [
          'frontend system design interview questions',
          'frontend system design interview preparation',
          'frontend system design interview framework',
          'ui architecture interview',
          'system design practice',
        ],
      },
    },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/system-design-list/system-design-list.component').then(
            (m) => m.SystemDesignListComponent,
          ),
        resolve: {
          systemDesignList: systemDesignListResolver,
        },
        data: {
          seo: {
            title: 'Frontend System Design Interview Questions',
            description: 'Practice frontend system design interview questions with RADIO framework preparation, UI architecture prompts, state and API contracts, performance, accessibility, and tradeoff rubrics.',
            keywords: [
              'frontend system design interview questions',
              'front end system design interview questions',
              'frontend system design questions',
              'RADIO framework frontend system design',
              'senior frontend system design interview',
            ],
          },
        },
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/system-design-list/system-design-detail/system-design-detail.component').then(
            (m) => m.SystemDesignDetailComponent,
          ),
        resolve: {
          systemDesignDetail: systemDesignDetailResolver,
        },
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
        data: NOT_FOUND_ROUTE_DATA,
      },
    ],
  },

  // Tools
  {
    path: 'tools/cv-linter',
    pathMatch: 'full',
    redirectTo: 'tools/cv',
  },
  {
    path: 'tools/cv',
    loadComponent: () =>
      import('./features/tools/cv-linter/cv-linter.component').then((m) => m.CvLinterComponent),
    data: {
      seo: {
        title: 'CV Linter: ATS Resume Score & Fixes',
        description:
          'Upload or paste your resume to get a 100-point ATS-style score, section-level fixes, keyword gaps, readability warnings, and quick wins. Files are processed to text and not stored.',
        keywords: ['cv linter', 'ats score', 'resume checker', 'frontend cv review'],
      },
    },
  },

  // Guides
  {
    path: 'guides',
    data: {
      seo: {
        title: 'Frontend Interview Playbook and Preparation Guides',
        description: 'Frontend interview playbook for coding, UI, JavaScript, system design, and behavioral rounds.',
      },
    },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'interview-blueprint' },

      {
        path: 'framework-prep',
        loadComponent: () =>
          import('./features/guides/framework-prep/framework-prep-index.component').then(
            (m) => m.FrameworkPrepIndexComponent,
          ),
        data: {
          seo: {
            title: 'Frontend Framework Interview Preparation Roadmap',
            description:
              'Compare JavaScript, React, Angular, and Vue interview preparation paths with a 7/14/30-day frontend interview preparation roadmap, role guidance, and next practice links.',
            keywords: [
              'frontend framework interview preparation',
              'React interview preparation',
              'React interview preparation roadmap',
              'React machine coding interview preparation',
              'Angular interview preparation',
              'Angular interview preparation roadmap',
              'Angular interview prep RxJS change detection DI',
              'Vue interview preparation',
              'Vue interview preparation roadmap',
              'Vue interview prep reactivity component communication',
              'JavaScript interview prep path',
              'JavaScript interview prep path for frontend developers',
              'frontend interview preparation roadmap',
              '30 day frontend interview preparation roadmap',
              'senior frontend framework interview preparation',
            ],
          },
        },
      },
      {
        path: 'framework-prep/:slug/mastery',
        loadComponent: () =>
          import('./features/guides/mastery-path/mastery-path-page.component').then(
            (m) => m.MasteryPathPageComponent,
          ),
        resolve: {
          masteryPath: masteryPathResolver,
        },
        data: {
          seo: {
            title: 'Framework mastery crash track',
            description:
              'Follow a guided 0 to 100 mastery track with concept questions, output prediction, coding drills, and checkpoint gates.',
          },
        },
      },
      {
        path: 'framework-prep/:slug',
        loadComponent: () =>
          import('./features/guides/playbook/playbook-host.component').then(
            (m) => m.PlaybookHostComponent,
          ),
        resolve: {
          guideDetail: playbookGuideDetailResolver,
        },
        data: {
          guideBase: 'framework-prep',
          guideTitle: 'FrontendAtlas Framework Prep Paths',
          seoSectionTitle: 'Framework Prep Paths',
          frameworkOnly: true,
          seo: {
            title: 'Framework prep path',
            description: 'Framework-specific frontend interview prep path.',
          },
        },
      },

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
        component: PlaybookIndexComponent,
        data: {
          seo: {
            title: 'Frontend Interview Playbook Hub',
            description: 'Use this frontend interview playbook hub to choose guides for coding, UI, JavaScript, system design, behavioral prep, framework paths, fundamentals, and resume prep.',
          },
        },
      },
      {
        path: 'interview-blueprint/javascript-prep-path',
        pathMatch: 'full',
        redirectTo: 'framework-prep/javascript-prep-path',
      },
      {
        path: 'interview-blueprint/react-prep-path',
        pathMatch: 'full',
        redirectTo: 'framework-prep/react-prep-path',
      },
      {
        path: 'interview-blueprint/angular-prep-path',
        pathMatch: 'full',
        redirectTo: 'framework-prep/angular-prep-path',
      },
      {
        path: 'interview-blueprint/vue-prep-path',
        pathMatch: 'full',
        redirectTo: 'framework-prep/vue-prep-path',
      },
      {
        path: 'interview-blueprint/:slug',
        loadComponent: () =>
          import('./features/guides/playbook/playbook-host.component').then(
            (m) => m.PlaybookHostComponent,
          ),
        resolve: {
          guideDetail: playbookGuideDetailResolver,
        },
        data: {
          seo: {
            title: 'FrontendAtlas Interview Blueprint',
            description: 'In-depth guidance for key front-end interview topics.',
          },
        },
      },

      {
        path: 'system-design/radio',
        pathMatch: 'full',
        redirectTo: 'system-design-blueprint/radio-framework',
      },
      {
        path: 'system-design/radio/framework',
        pathMatch: 'full',
        redirectTo: 'system-design-blueprint/radio-framework',
      },
      {
        path: 'system-design/radio/requirements',
        pathMatch: 'full',
        redirectTo: 'system-design-blueprint/radio-requirements',
      },
      {
        path: 'system-design/radio/architecture',
        pathMatch: 'full',
        redirectTo: 'system-design-blueprint/architecture',
      },
      {
        path: 'system-design/radio/data-model',
        pathMatch: 'full',
        redirectTo: 'system-design-blueprint/state-data',
      },
      {
        path: 'system-design/radio/interface',
        pathMatch: 'full',
        redirectTo: 'system-design-blueprint/ux',
      },
      {
        path: 'system-design/radio/optimizations',
        pathMatch: 'full',
        redirectTo: 'system-design-blueprint/performance',
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
            title: 'Frontend System Design Interview Blueprint',
            description:
              'Use a frontend system design interview blueprint with the RADIO framework, checklist, examples, and real prompts for 45-minute architecture prep.',
            keywords: [
              'frontend system design interview blueprint',
              'frontend system design interview framework',
              'RADIO framework frontend system design',
              'front end system design playbook',
              'how to answer frontend system design interview',
              'frontend system design checklist',
              'frontend system design examples',
              '45 minute frontend system design interview',
              'frontend architecture interview',
              'frontend vs backend system design',
              'frontend system design interview answer template',
              'frontend system design interview guide',
              'frontend system design interview preparation',
              'senior frontend system design interview',
              'staff frontend engineer system design interview',
              'client side system design interview',
              'design autocomplete frontend system design',
              'design news feed frontend system design',
              'design infinite scroll frontend system design',
              'design toast notification system',
              'design notification system frontend',
              'design chat app frontend system design',
              'design system architecture frontend interview',
              'realtime UI frontend system design',
              'dashboard widgets frontend system design',
              'frontend system design interview questions',
            ],
          },
        },
      },
      {
        path: 'system-design-blueprint/:slug',
        loadComponent: () =>
          import('./features/guides/system-design/system-design-host.component').then(
            (m) => m.SystemDesignHostComponent,
          ),
        resolve: {
          guideDetail: systemGuideDetailResolver,
        },
        data: {
          seo: {
            title: 'Frontend system design blueprint guide',
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
            title: 'Behavioral interview blueprint',
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
        resolve: {
          guideDetail: behavioralGuideDetailResolver,
        },
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
        data: NOT_FOUND_ROUTE_DATA,
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
        path: 'editorial-policy',
        loadComponent: () =>
          import('./features/legal/editorial/editorial.component').then(
            (m) => m.EditorialPolicyComponent,
          ),
        data: {
          seo: {
            title: 'Editorial Policy',
            description: 'How FrontendAtlas creates, reviews, and updates learning content.',
            robots: 'index,follow',
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
        path: 'refund',
        loadComponent: () =>
          import('./features/legal/refund/refund.component').then((m) => m.RefundComponent),
        data: {
          seo: {
            title: 'Refund Policy',
            description: 'FrontendAtlas refund policy for digital subscription products.',
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
        data: NOT_FOUND_ROUTE_DATA,
      },
    ],
  },

  // explicit /404
  {
    path: '404',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then((m) => m.NotFoundComponent),
    data: NOT_FOUND_ROUTE_DATA,
  },

  // Global Question Library — lists all practice questions; pills filter client-side
  {
    path: 'coding',
    loadComponent: () =>
      import('./features/coding/coding-list/coding-list.component').then(
        (m) => m.CodingListComponent,
      ),
    resolve: {
      questionList: globalCodingListResolver,
    },
    data: {
      source: 'global-coding',
      kind: 'coding',
      seo: {
        title: 'Frontend Interview Questions Bank | Coding, System Design, Concepts',
        description:
          'Practice frontend interview questions across coding, system design, and concepts. Filter by technology, difficulty, and focus area, then open one prompt immediately.',
      },
    },
  },
  {
    path: 'incidents',
    loadComponent: () =>
      import('./features/incidents/incident-list.component').then((m) => m.IncidentListComponent),
    resolve: {
      incidentList: incidentListResolver,
    },
    data: {
      seo: {
        title: 'Frontend Debugging Interview Questions and Debug Scenarios',
        description:
          'Practice frontend debugging interview questions with guided debug scenarios for React and JavaScript. Work through root cause analysis, debug steps, fixes, and regression guards.',
      },
    },
  },
  {
    path: 'incidents/:id',
    canActivate: [incidentExistsGuard],
    loadComponent: () =>
      import('./features/incidents/incident-detail/incident-detail.component').then(
        (m) => m.IncidentDetailComponent,
      ),
    resolve: {
      incidentDetail: incidentDetailResolver,
      seo: incidentSeoResolver,
    },
  },
  {
    path: 'tradeoffs',
    loadComponent: () =>
      import('./features/tradeoffs/tradeoff-list.component').then((m) => m.TradeoffListComponent),
    resolve: {
      tradeoffBattleList: tradeoffBattleListResolver,
    },
    data: {
      seo: {
        title: 'Frontend Tradeoff Interview Questions and Architecture Decisions',
        description:
          'Practice frontend tradeoff interview questions like Context vs Zustand vs Redux, SSE vs WebSocket, and CSR vs SSR vs RSC. Learn how to defend decisions clearly in interviews.',
      },
    },
  },
  {
    path: 'tradeoffs/:id',
    canActivate: [tradeoffBattleExistsGuard],
    loadComponent: () =>
      import('./features/tradeoffs/tradeoff-detail/tradeoff-detail.component').then(
        (m) => m.TradeoffDetailComponent,
      ),
    resolve: {
      tradeoffBattleDetail: tradeoffBattleDetailResolver,
    },
    data: {
      seo: {
        title: 'Frontend Tradeoff Battle for Interview Practice',
        description:
          'Practice a frontend tradeoff interview question and learn how to compare options, defend a balanced choice, and explain the downsides clearly.',
      },
    },
  },

  // Framework interview-question landing pages
  {
    path: 'interview-questions/essential',
    loadComponent: () =>
      import('./features/interview-questions/essential-questions.component').then(
        (m) => m.EssentialQuestionsComponent,
      ),
    resolve: {
      essentialQuestions: essentialQuestionsResolver,
    },
    data: {
      seo: {
        title: 'FrontendAtlas Essential 60 Interview Questions',
        description:
          'A ranked shortlist of must-know frontend interview questions in FrontendAtlas Essential 60, covering JavaScript utilities, UI coding, system design, frontend concepts, and a compact practice path.',
      },
    },
  },
  {
    path: 'machine-coding',
    loadComponent: () =>
      import('./features/interview-questions/machine-coding-hub.component').then(
        (m) => m.MachineCodingHubComponent,
      ),
    data: {
      seo: {
        title: 'Frontend Machine Coding Interview Questions',
        description:
          'Practice frontend machine coding and UI coding interview questions with React, Angular, Vue, async widgets, forms, tables, rubric, and guided study plans.',
        keywords: [
          'frontend machine coding questions',
          'frontend UI coding interview questions',
          'frontend coding interview practice',
          'React machine coding interview questions',
          'frontend interview practice',
          'machine coding round frontend',
          'React UI coding interview questions',
          'UI component coding interview questions',
        ],
      },
    },
  },
  {
    path: 'interview-questions',
    loadComponent: () =>
      import('./features/interview-questions/interview-questions-landing.component').then(
        (m) => m.InterviewQuestionsLandingComponent,
      ),
    resolve: {
      interviewQuestionsList: interviewQuestionsHubResolver,
    },
    data: {
      interviewQuestions: {
        keyword: 'frontend interview questions',
        title: 'Frontend Interview Questions and Answers',
        techs: ['javascript', 'react', 'angular', 'vue', 'html', 'css'],
        isMasterHub: true,
      },
      seo: {
        title: 'Frontend Interview Questions and Answers',
        description:
          'Frontend interview questions and answers for front end developers, beginner to advanced, with Essential 60, UI coding, machine coding, JavaScript, HTML, CSS, React, Angular, Vue, debugging, testing, accessibility, performance, and frontend system design.',
      },
    },
  },
  {
    path: 'javascript/interview-questions',
    loadComponent: () =>
      import('./features/interview-questions/interview-questions-landing.component').then(
        (m) => m.InterviewQuestionsLandingComponent,
      ),
    resolve: {
      interviewQuestionsList: interviewQuestionsHubResolver,
    },
    data: {
      interviewQuestions: {
        keyword: 'javascript interview questions',
        title: 'JavaScript Interview Questions and Answers',
        techs: ['javascript'],
      },
      seo: {
        title: 'JavaScript Interview Questions: 41 Q&A, Output and Async',
        description:
          '41 JavaScript interview questions for frontend developers: beginner-to-advanced Q&A, output tracing, closures, event loop, promises, DOM, XSS, coding prompts.',
      },
    },
  },
  {
    path: 'react/interview-questions',
    loadComponent: () =>
      import('./features/interview-questions/interview-questions-landing.component').then(
        (m) => m.InterviewQuestionsLandingComponent,
      ),
    resolve: {
      interviewQuestionsList: interviewQuestionsHubResolver,
    },
    data: {
      interviewQuestions: {
        keyword: 'react interview questions',
        title: 'React Interview Questions and Answers',
        techs: ['react'],
      },
      seo: {
        title: 'React Interview Questions: 65 Q&A, Hooks and React 19',
        description:
          '65 React interview questions for frontend developers: beginner-to-advanced Q&A, hooks, React 19, Server Components, performance, scenarios, coding prompts.',
      },
    },
  },
  {
    path: 'angular/interview-questions',
    loadComponent: () =>
      import('./features/interview-questions/interview-questions-landing.component').then(
        (m) => m.InterviewQuestionsLandingComponent,
      ),
    resolve: {
      interviewQuestionsList: interviewQuestionsHubResolver,
    },
    data: {
      interviewQuestions: {
        keyword: 'angular interview questions',
        title: 'Angular Interview Questions and Answers',
        techs: ['angular'],
        featuredLinks: [
          {
            label: 'Angular HttpClient cancellation interview question',
            route: ['/angular/trivia/angular-http-what-actually-cancels-request'],
            path: '/angular/trivia/angular-http-what-actually-cancels-request',
          },
          {
            label: 'Angular standalone migration interview question',
            route: ['/angular/trivia/angular-appmodule-standalone-changes'],
            path: '/angular/trivia/angular-appmodule-standalone-changes',
          },
          {
            label: 'Angular NgModules vs standalone interview question',
            route: ['/angular/trivia/angular-ngmodules-vs-standalone'],
            path: '/angular/trivia/angular-ngmodules-vs-standalone',
          },
        ],
      },
      seo: {
        title: 'Angular Interview Questions and Answers: RxJS and Signals',
        description:
          'Angular interview questions for frontend developers: beginner-to-experienced Q&A, RxJS, change detection, signals, DI, testing, performance, coding prompts.',
      },
    },
  },
  {
    path: 'vue/interview-questions',
    loadComponent: () =>
      import('./features/interview-questions/interview-questions-landing.component').then(
        (m) => m.InterviewQuestionsLandingComponent,
      ),
    resolve: {
      interviewQuestionsList: interviewQuestionsHubResolver,
    },
    data: {
      interviewQuestions: {
        keyword: 'vue js interview questions',
        title: 'Vue.js Interview Questions and Answers',
        techs: ['vue'],
        featuredLinks: [
          {
            label: 'Lifecycle hooks timing map',
            route: ['/vue/trivia/vue-lifecycle-hooks'],
            path: '/vue/trivia/vue-lifecycle-hooks',
          },
          {
            label: 'Composition API fundamentals',
            route: ['/vue/trivia/vue-composition-api'],
            path: '/vue/trivia/vue-composition-api',
          },
        ],
      },
      seo: {
        title: 'Vue.js Interview Questions: 65 Q&A, Vue 3 and Pinia',
        description:
          '65 Vue.js interview questions for frontend developers: beginner-to-advanced Q&A, Vue 3, Composition API, reactivity, Pinia, Router, performance, scenarios.',
      },
    },
  },
  {
    path: 'html-css/interview-questions',
    loadComponent: () =>
      import('./features/interview-questions/interview-questions-landing.component').then(
        (m) => m.InterviewQuestionsLandingComponent,
      ),
    resolve: {
      interviewQuestionsList: interviewQuestionsHubResolver,
    },
    data: {
      interviewQuestions: {
        keyword: 'html and css interview questions',
        title: 'HTML and CSS Interview Questions and Answers',
        techs: ['html', 'css'],
      },
      seo: {
        title: 'HTML and CSS Interview Questions: 65 Q&A, Flexbox and Grid',
        description: '65 HTML and CSS interview questions for frontend developers: beginner-to-advanced Q&A, semantics, accessibility, Flexbox, Grid, responsive UI, code scenarios.',
      },
    },
  },
  {
    path: 'html/interview-questions',
    loadComponent: () =>
      import('./features/interview-questions/interview-questions-landing.component').then(
        (m) => m.InterviewQuestionsLandingComponent,
      ),
    resolve: {
      interviewQuestionsList: interviewQuestionsHubResolver,
    },
    data: {
      interviewQuestions: {
        keyword: 'html interview questions',
        title: 'HTML Interview Questions and Answers',
        techs: ['html'],
      },
      seo: {
        title: 'HTML Interview Questions: 65 Q&A, HTML5 and Forms',
        description:
          '65 HTML interview questions for frontend developers: beginner-to-advanced Q&A, semantic HTML, forms, accessibility, ARIA, DOM, metadata, and scenarios.',
      },
    },
  },
  {
    path: 'css/interview-questions',
    loadComponent: () =>
      import('./features/interview-questions/interview-questions-landing.component').then(
        (m) => m.InterviewQuestionsLandingComponent,
      ),
    resolve: {
      interviewQuestionsList: interviewQuestionsHubResolver,
    },
    data: {
      interviewQuestions: {
        keyword: 'css interview questions',
        title: 'CSS Interview Questions and Answers',
        techs: ['css'],
        featuredLinks: [
          {
            label: 'CSS specificity hierarchy',
            route: ['/css/trivia/css-specificity-hierarchy'],
            path: '/css/trivia/css-specificity-hierarchy',
          },
          {
            label: 'Cascade order and origin rules',
            route: ['/css/trivia/css-cascade-order'],
            path: '/css/trivia/css-cascade-order',
          },
        ],
      },
      seo: {
        title: 'CSS Interview Questions: 65 Q&A, Flexbox and Grid',
        description:
          '65 CSS interview questions for frontend developers: beginner-to-advanced Q&A, specificity, cascade, Flexbox, Grid, responsive CSS, debugging, performance.',
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
        resolve: {
          questionDetail: codingDetailResolver,
        },
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
        resolve: {
          questionDetail: triviaDetailResolver,
        },
        data: {
          seo: {
            title: 'Front-end interview concept question',
            description: 'Practice this topic with a quick interview answer, examples, common mistakes, and production-focused follow-ups.',
          },
        },
      },
      {
        path: 'debug/:id',
        loadComponent: () =>
          import('./features/coding/coding-detail/coding-detail.component').then(
            (m) => m.CodingDetailComponent,
          ),
        resolve: {
          questionDetail: codingDetailResolver,
        },
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
        data: NOT_FOUND_ROUTE_DATA,
      },
    ],
  },

  // Global fallback — render 404
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then((m) => m.NotFoundComponent),
    data: NOT_FOUND_ROUTE_DATA,
  },
];

/**
 * Router providers with the recommended configuration
 */
export const APP_ROUTER_PROVIDERS = [
  provideRouter(
    routes,
    withRouterConfig({
      onSameUrlNavigation: 'ignore',
      paramsInheritanceStrategy: 'always',
    }),
    withInMemoryScrolling({
      scrollPositionRestoration: 'top',
      anchorScrolling: 'enabled',      // 👈 enable fragment scrolling
    }),
  ),
];
