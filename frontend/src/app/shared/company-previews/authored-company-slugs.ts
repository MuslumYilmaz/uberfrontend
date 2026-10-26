import { InjectionToken } from '@angular/core';

/**
 * Slugs of the registry-driven authored company previews, kept free of content imports.
 * Eager code (the company route resolvers and CompanyPublicDataService) reads this list, so the
 * content modules stay in the lazy `companies` chunk instead of the initial bundle. The keys of
 * AUTHORED_COMPANY_PREVIEWS must match this list; authored-company-previews.spec.ts and
 * scripts/authored-companies.test.mjs enforce that.
 */
export const AUTHORED_COMPANY_SLUGS: readonly string[] = ['waymo', 'elevenlabs', 'datadog', 'intuit', 'servicenow', 'amazon', 'meta', 'revolut', 'spotify', 'jpmorgan', 'agoda', 'xai', 'shopee', 'anduril', 'gitlab', 'capital-one', 'crowdstrike'];

/** Injectable so specs can provide fixture slugs without touching the real list. */
export const AUTHORED_COMPANY_SLUGS_TOKEN = new InjectionToken<readonly string[]>('AUTHORED_COMPANY_SLUGS', {
  providedIn: 'root',
  factory: () => AUTHORED_COMPANY_SLUGS,
});
