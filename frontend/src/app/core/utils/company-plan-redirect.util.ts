import { companyBrandFor } from '../../shared/company-branding';

/**
 * The plan a sign-up or sign-in page leads back to: "Agoda" or "Agoda and Meta" when the sanitized redirect target is
 * the company plan preview with its companies in the address, otherwise null. The page then says that this plan is
 * what the account keeps.
 */
export function companyPlanNameFromRedirect(redirectTo: string | null | undefined): string | null {
  const target = String(redirectTo || '');
  if (!target.startsWith('/companies/preview?')) return null;
  const params = new URLSearchParams(target.slice(target.indexOf('?') + 1));
  const names = (params.get('companies') || '')
    .split(',')
    .map((slug) => slug.trim())
    .filter(Boolean)
    .map((slug) => companyBrandFor(slug)?.label ?? slug);
  if (!names.length) return null;
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
