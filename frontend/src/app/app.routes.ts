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
import { interviewQuestionsHubResolver } from './core/resolvers/interview-questions.resolver';
import { globalCodingListResolver } from './core/resolvers/question-list.resolver';
import {
  behavioralGuideDetailResolver,
  playbookGuideDetailResolver,
  systemGuideDetailResolver,
} from './core/resolvers/guide-detail.resolver';
import { masteryPathResolver } from './core/resolvers/mastery-path.resolver';

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
      import('./features/showcase/showcase.page').then((m) => m.ShowcasePageComponent),
    data: {
      seo: {
        title: 'Frontend Interview Preparation Roadmap and Practice',
        description:
          'Follow a frontend interview preparation roadmap with coding challenges, guides, tracks, and system design practice to prepare with focus and confidence.',
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
    pathMatch: 'full',
    redirectTo: '',
  },
  {
    path: 'safeJsonParse',
    pathMatch: 'full',
    redirectTo: 'javascript/coding/js-safe-json-parse',
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
        title: 'Company interview prep hub',
        description:
          'Use company-specific frontend interview questions as part of your interview roadmap, compare hiring patterns, and focus prep where each team interviews.',
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
              'Explore frontend interview questions grouped by company, then follow an interview roadmap across coding, trivia, and system design coverage.',
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
            title: 'Company Interview Preview',
            description:
              'Preview company-specific frontend interview question coverage and sample prompts before unlocking premium.',
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
            description: 'Focused coding, trivia, and system design practice for a specific company.',
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
                title: 'Company trivia questions',
                description: 'Quick front-end trivia to mirror this company’s interview screens.',
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
            title: 'Frontend Interview Preparation Tracks',
            description:
              'Explore frontend interview preparation tracks with structured coding, trivia, and system design question paths.',
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
              'Preview track outcomes, sample frontend interview questions, and premium unlock details.',
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
              'Follow a guided 0 to 100 mastery track with trivia, output prediction, coding drills, and checkpoint gates.',
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
        data: { title: 'Page not found' },
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
        data: { title: 'Page not found' },
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
          'Scan your resume with deterministic ATS-style checks, get actionable fixes by section, and improve clarity without AI-generated or stored files.',
        keywords: ['cv linter', 'ats score', 'resume checker', 'frontend cv review'],
      },
    },
  },

  // Guides
  {
    path: 'guides',
    data: {
      seo: {
        title: 'Frontend Interview Preparation Guides',
        description: 'Frontend interview preparation guides for coding challenges, system design interviews, and behavioral rounds.',
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
            title: 'Framework Prep Paths for Interviews',
            description:
              'Compare JavaScript, React, Angular, and Vue prep paths with recommended sequence, expected outcomes, and common mistakes to fix before interviews.',
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
              'Follow a guided 0 to 100 mastery track with trivia, output prediction, coding drills, and checkpoint gates.',
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
        loadComponent: () =>
          import('./features/guides/playbook/playbook-index/playbook-index.component').then(
            (m) => m.PlaybookIndexComponent,
          ),
        data: {
          seo: {
            title: 'Frontend Interview Preparation Guides',
            description: 'Use these frontend interview preparation guides to plan coding, UI, system design, and behavioral rounds with a practical checklist.',
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
            description: 'Use this frontend system design interview blueprint for principles, patterns, and examples you can apply in real interview rounds.',
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
    resolve: {
      questionList: globalCodingListResolver,
    },
    data: {
      source: 'global-coding',
      kind: 'coding',
      seo: {
        title: 'Frontend Coding Challenges',
        description: 'Practice frontend coding challenges by framework, difficulty, and focus area, then follow a clear interview prep roadmap from drills to review.',
      },
    },
  },

  // Framework interview-question landing pages
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
        title: 'Frontend Interview Questions',
        techs: ['javascript', 'react', 'angular', 'vue', 'html', 'css'],
        isMasterHub: true,
      },
      seo: {
        title: 'Frontend Interview Questions',
        description: 'Frontend interview questions across JavaScript, React, Angular, Vue, HTML, and CSS, with coding and trivia practice linked to interview tracks.',
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
        title: 'JavaScript Interview Questions',
        techs: ['javascript'],
      },
      seo: {
        title: 'JavaScript Interview Questions',
        description: 'JavaScript interview questions for frontend interview preparation, with coding and trivia practice plus links to guides and tracks.',
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
        title: 'React Interview Questions',
        techs: ['react'],
      },
      seo: {
        title: 'React Interview Questions',
        description: 'React interview questions for frontend interview preparation, with coding and trivia practice plus links to guides and tracks.',
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
        title: 'Angular Interview Questions',
        techs: ['angular'],
      },
      seo: {
        title: 'Angular Interview Questions',
        description: 'Angular interview questions for frontend interview preparation, with coding and trivia practice plus links to guides and tracks.',
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
        keyword: 'vue interview questions',
        title: 'Vue Interview Questions',
        techs: ['vue'],
      },
      seo: {
        title: 'Vue Interview Questions',
        description: 'Vue interview questions for frontend interview preparation, with coding and trivia practice plus links to guides and tracks.',
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
        keyword: 'html css interview questions',
        title: 'HTML CSS Interview Questions',
        techs: ['html', 'css'],
      },
      seo: {
        title: 'HTML CSS Interview Questions',
        description: 'HTML CSS interview questions for frontend interview preparation, with coding and trivia practice plus links to guides and tracks.',
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
        title: 'HTML Interview Questions',
        techs: ['html'],
      },
      seo: {
        title: 'HTML Interview Questions',
        description: 'HTML interview questions for frontend interview preparation, with coding and trivia practice plus links to guides and tracks.',
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
        title: 'CSS Interview Questions',
        techs: ['css'],
      },
      seo: {
        title: 'CSS Interview Questions',
        description: 'CSS interview questions for frontend interview preparation, with coding and trivia practice plus links to guides and tracks.',
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
      onSameUrlNavigation: 'ignore',
      paramsInheritanceStrategy: 'always',
    }),
    withInMemoryScrolling({
      scrollPositionRestoration: 'top',
      anchorScrolling: 'enabled',      // 👈 enable fragment scrolling
    }),
  ),
];
