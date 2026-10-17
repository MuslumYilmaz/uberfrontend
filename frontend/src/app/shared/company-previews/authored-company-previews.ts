import { InjectionToken } from '@angular/core';
import type { AuthoredCompanyPreview } from './authored-company-preview.model';
import { AMAZON_COMPANY_PREVIEW } from './amazon-preview-content';
import { DATADOG_COMPANY_PREVIEW } from './datadog-preview-content';
import { ELEVENLABS_COMPANY_PREVIEW } from './elevenlabs-preview-content';
import { INTUIT_COMPANY_PREVIEW } from './intuit-preview-content';
import { META_COMPANY_PREVIEW } from './meta-preview-content';
import { REVOLUT_COMPANY_PREVIEW } from './revolut-preview-content';
import { SERVICENOW_COMPANY_PREVIEW } from './servicenow-preview-content';
import { SPOTIFY_COMPANY_PREVIEW } from './spotify-preview-content';
import { WAYMO_COMPANY_PREVIEW } from './waymo-preview-content';

/**
 * Registry of data-driven authored company previews, keyed by company slug.
 * Adding a company means adding its `<slug>-preview-content.ts` module here, the same slug in
 * authored-company-slugs.ts and in frontend/scripts/authored-companies.mjs (REGISTRY_AUTHORED_COMPANIES),
 * and tagging at least one catalog question with `companies: ["<slug>"]` so the route is prerendered and listed.
 * Only lazily loaded company components may import this file: it pulls every content module with it.
 */
export const AUTHORED_COMPANY_PREVIEWS: Readonly<Record<string, AuthoredCompanyPreview>> = {
  waymo: WAYMO_COMPANY_PREVIEW,
  elevenlabs: ELEVENLABS_COMPANY_PREVIEW,
  datadog: DATADOG_COMPANY_PREVIEW,
  intuit: INTUIT_COMPANY_PREVIEW,
  servicenow: SERVICENOW_COMPANY_PREVIEW,
  amazon: AMAZON_COMPANY_PREVIEW,
  meta: META_COMPANY_PREVIEW,
  revolut: REVOLUT_COMPANY_PREVIEW,
  spotify: SPOTIFY_COMPANY_PREVIEW,
};

export type AuthoredCompanyPreviewRegistry = Readonly<Record<string, AuthoredCompanyPreview>>;

/** Injectable so specs can provide a fixture registry without touching the real content modules. */
export const AUTHORED_COMPANY_PREVIEWS_TOKEN = new InjectionToken<AuthoredCompanyPreviewRegistry>(
  'AUTHORED_COMPANY_PREVIEWS',
  { providedIn: 'root', factory: () => AUTHORED_COMPANY_PREVIEWS },
);
