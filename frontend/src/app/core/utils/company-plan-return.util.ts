import type { Params, Router } from '@angular/router';

export type CompanyPlanReturnLink = {
  readonly label: string;
  readonly route: string[];
  readonly queryParams: Params;
};

const COMPANY_PLAN_PATHS = ['/companies/preview', '/companies/plan'];
const COMPANY_GUIDE_PATH = /^\/companies\/[a-z0-9-]+\/preview$/;
const TRACK_PATH = /^\/tracks\/[a-z0-9-]+(?:\/preview)?$/;

function returnLink(router: Router, url: string | null, label: string | null, accepts: (path: string) => boolean): CompanyPlanReturnLink | null {
  const path = url?.split(/[?#]/)[0] ?? '';
  if (!url || !label || !accepts(path)) return null;
  return { label, route: [path], queryParams: router.parseUrl(url).queryParams };
}

/**
 * The footer link on a task opened from a study plan: the company plan, or a track and its public preview. Other lists
 * also pass a return address in the navigation state, but their tasks keep the usual footer link.
 */
export function planReturnLink(router: Router, url: string | null, label: string | null): CompanyPlanReturnLink | null {
  return returnLink(router, url, label, (path) => COMPANY_PLAN_PATHS.includes(path) || TRACK_PATH.test(path));
}

/**
 * The way back from a locked task page, which has no footer: the company plan or the company guide the task was
 * opened from. Any other return address stays with the browser's back button.
 */
export function companyReturnLink(router: Router, url: string | null, label: string | null): CompanyPlanReturnLink | null {
  return returnLink(router, url, label, (path) => COMPANY_PLAN_PATHS.includes(path) || COMPANY_GUIDE_PATH.test(path));
}
