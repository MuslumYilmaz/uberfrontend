import { Routes } from '@angular/router';
import { companyPlanGuard } from './company-plan.guard';

/** /companies/plan. The guard lives here, so it loads with the page instead of with the app. */
export const COMPANY_PLAN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [companyPlanGuard],
    loadComponent: () => import('./company-plan-page.component').then((m) => m.CompanyPlanPageComponent),
    data: {
      seo: {
        title: 'Your company interview plan',
        description: 'Your frontend interview plan, round by round, with your progress.',
        robots: 'noindex,follow',
      },
    },
  },
];
