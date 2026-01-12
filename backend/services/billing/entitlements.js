function isProEntitlementActive(entitlement) {
  if (!entitlement || typeof entitlement !== 'object') return false;
  const status = entitlement.status;
  if (!['active', 'lifetime', 'cancelled'].includes(status)) return false;
  if (!entitlement.validUntil) return true;
  const validUntil = entitlement.validUntil instanceof Date
    ? entitlement.validUntil
    : new Date(entitlement.validUntil);
  if (Number.isNaN(validUntil.getTime())) return true;
  return validUntil.getTime() > Date.now();
}

module.exports = { isProEntitlementActive };
