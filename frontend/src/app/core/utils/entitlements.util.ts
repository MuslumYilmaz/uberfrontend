import { EntitlementStatus, Entitlements } from '../models/user.model';

export type AccessTier = 'free' | 'premium';
export type EntitledUser = {
  entitlements?: Entitlements | null;
  accessTier?: AccessTier;
};

const ACTIVE_STATUSES = new Set<EntitlementStatus>(['active', 'lifetime', 'cancelled']);

// Developer Notes: entitlements are the source of truth; accessTier is a legacy fallback.
// Future billing webhooks should update entitlements, keeping accessTier for backward compatibility.
function parseValidUntil(raw: string | Date | null | undefined): number | null {
  if (!raw) return null;
  const asDate = raw instanceof Date ? raw : new Date(raw);
  const ms = asDate.getTime();
  return Number.isNaN(ms) ? null : ms;
}

export function isProActive(user?: EntitledUser | null): boolean {
  if (!user) return false;
  const entitlement = user.entitlements?.pro;
  if (entitlement && entitlement.status) {
    if (!ACTIVE_STATUSES.has(entitlement.status)) return false;
    const validUntilMs = parseValidUntil(entitlement.validUntil);
    if (validUntilMs === null) return true;
    return validUntilMs > Date.now();
  }
  return user.accessTier === 'premium';
}
