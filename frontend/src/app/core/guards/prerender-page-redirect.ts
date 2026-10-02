import { isPlatformBrowser } from '@angular/common';
import { RedirectCommand, UrlTree } from '@angular/router';

/** Keep the destination's rendered HTML at a prerendered alias or private URL.
 * Browser navigation retains its normal redirect and cookie authorization.
 */
export function prerenderPageRedirect(url: UrlTree, platformId: object): UrlTree | RedirectCommand {
  return isPlatformBrowser(platformId) ? url : new RedirectCommand(url, { skipLocationChange: true });
}
