import type { Params, Router } from '@angular/router';

export type CompanyPlanReturnLink = {
  readonly label: string;
  readonly route: string[];
  readonly queryParams: Params;
};

const COMPANY_PLAN_PATHS = ['/companies/preview', '/companies/plan'];

/**
 * The footer link on a task opened from the company plan. Other lists also pass a return address in the navigation
 * state, but their tasks keep the usual footer link.
 */
export function companyPlanReturnLink(router: Router, url: string | null, label: string | null): CompanyPlanReturnLink | null {
  const path = url?.split(/[?#]/)[0] ?? '';
  if (!url || !label || !COMPANY_PLAN_PATHS.includes(path)) return null;
  return { label, route: [path], queryParams: router.parseUrl(url).queryParams };
}
