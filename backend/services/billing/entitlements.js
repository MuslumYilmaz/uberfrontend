function isProEntitlementActive(entitlement, now = new Date()) {
  if (!entitlement || typeof entitlement !== 'object') return false;
  const status = entitlement.status;
  if (!['active', 'lifetime', 'cancelled'].includes(status)) return false;
  if (!entitlement.validUntil) return true;
  const validUntil = entitlement.validUntil instanceof Date
    ? entitlement.validUntil
    : new Date(entitlement.validUntil);
  // A malformed timestamp must never grant paid access. Undated lifetime
  // entitlements are handled by the explicit null branch above.
  if (Number.isNaN(validUntil.getTime())) return false;
  const evaluatedAt = now instanceof Date ? now : new Date(now);
  const evaluatedAtMs = evaluatedAt.getTime();
  return Number.isFinite(evaluatedAtMs) && validUntil.getTime() > evaluatedAtMs;
}

module.exports = { isProEntitlementActive };
