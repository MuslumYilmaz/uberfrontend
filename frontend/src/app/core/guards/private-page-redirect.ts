import { isPlatformBrowser } from '@angular/common';
import { RedirectCommand, UrlTree } from '@angular/router';

/** Render the signed-out shell at build time; let browser guards verify cookies.
 * Angular 21 otherwise emits a meta-refresh page that skips client auth entirely.
 */
export function privatePageRedirect(url: UrlTree, platformId: object): UrlTree | RedirectCommand {
  return isPlatformBrowser(platformId) ? url : new RedirectCommand(url, { skipLocationChange: true });
}
