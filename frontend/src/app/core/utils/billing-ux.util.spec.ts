import { HttpErrorResponse } from '@angular/common/http';
import { getCheckoutLaunchNotice, getManageSubscriptionErrorMessage } from './billing-ux.util';

describe('billing-ux util', () => {
  it('returns a blocked-popup notice for blocked checkout launches', () => {
    expect(getCheckoutLaunchNotice('blocked', false)).toBe(
      'Your browser blocked the checkout window. Allow popups and try again.'
    );
  });

  it('returns a reused blocked-popup notice for blocked reopened checkouts', () => {
    expect(getCheckoutLaunchNotice('blocked', true)).toBe(
      'Checkout is already in progress, but your browser blocked opening it. Allow popups and try again.'
    );
  });

  it('maps manage-url backend codes to user-facing messages', () => {
    const unsupported = new HttpErrorResponse({
      status: 400,
      error: { code: 'MANAGE_PROVIDER_UNSUPPORTED' },
    });
    const unavailable = new HttpErrorResponse({
      status: 409,
      error: { code: 'MANAGE_URL_UNAVAILABLE' },
    });

    expect(getManageSubscriptionErrorMessage(unsupported)).toContain('payment provider');
    expect(getManageSubscriptionErrorMessage(unavailable)).toContain('billing portal');
  });
});
