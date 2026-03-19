import { HttpErrorResponse } from '@angular/common/http';

export type CheckoutLaunchMode = 'overlay' | 'new-tab' | 'blocked';

export function getCheckoutLaunchNotice(mode: CheckoutLaunchMode, reused: boolean): string | null {
  if (mode === 'blocked' && reused) {
    return 'Checkout is already in progress, but your browser blocked opening it. Allow popups and try again.';
  }
  if (mode === 'blocked') {
    return 'Your browser blocked the checkout window. Allow popups and try again.';
  }
  if (reused) {
    return 'Checkout is already in progress. Reopened the same checkout in a new tab.';
  }
  if (mode === 'new-tab') {
    return 'Checkout opened in a new tab. If it did not open, allow popups and try again.';
  }
  return null;
}

export function getManageSubscriptionErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const code = String(error.error?.code || '').trim().toUpperCase();
    if (code === 'MANAGE_PROVIDER_UNSUPPORTED') {
      return 'Self-serve subscription management is not available for this payment provider. Contact support@frontendatlas.com for help.';
    }
    if (code === 'MANAGE_URL_NOT_READY') {
      return 'We found your subscription, but the billing portal is not ready for this account yet. Contact support@frontendatlas.com if you were charged.';
    }
    if (code === 'MANAGE_URL_UNAVAILABLE') {
      return 'We could not open the billing portal automatically right now. Contact support@frontendatlas.com for help.';
    }
  }

  return 'We could not load the billing portal right now. Please try again or contact support@frontendatlas.com.';
}
