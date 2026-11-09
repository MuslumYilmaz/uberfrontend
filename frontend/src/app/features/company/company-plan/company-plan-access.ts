import type { User } from '../../../core/services/auth.service';
import { isProActive } from '../../../core/utils/entitlements.util';

export function hasPremium(user: User | null | undefined): boolean {
  return Boolean(user && (user.role === 'admin' || isProActive(user)));
}

/** Premium has run out. The plan stays, behind a screen that offers to renew. */
export function premiumEnded(user: User | null | undefined): boolean {
  const status = user?.entitlements?.pro?.status;
  return Boolean(status && status !== 'none' && !hasPremium(user));
}
