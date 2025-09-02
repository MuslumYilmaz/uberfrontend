import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

const ALLOWED_TECH = new Set(['javascript', 'angular', 'html', 'css']);

export const techMatchGuard: CanMatchFn = (_route, segments) => {
    const router = inject(Router);
    const tech = segments[0]?.path ?? '';
    if (ALLOWED_TECH.has(tech)) return true;
    // Redirect unknown techs to 404 (no state on UrlTree)
    return router.parseUrl('/404');
};
