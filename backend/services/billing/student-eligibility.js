// Student pricing eligibility is computed, never stored: a verified account
// email on a school domain, or a support-set approval on the user. Checkout
// applies the student campaign (discount-campaigns.js, eligibility "student")
// when this says eligible and the account has no prior purchase.

const STUDENT_DOMAIN_PATTERNS = Object.freeze([
  /(^|\.)edu$/, // university.edu
  /(^|\.)edu\.[a-z]{2}$/, // university.edu.tr
  /(^|\.)ac\.[a-z]{2}$/, // university.ac.uk
]);

// Universities whose addresses carry none of the patterns above. Keep it short
// and reviewed; anything else goes through support approval on the account.
const STUDENT_DOMAIN_ALLOWLIST = Object.freeze([]);

function normalizeEmailDomain(email) {
  const value = String(email || '').trim().toLowerCase();
  const at = value.lastIndexOf('@');
  if (at < 1 || at === value.length - 1) return '';
  const domain = value.slice(at + 1).replace(/\.+$/, '');
  return /^[a-z0-9.-]+$/.test(domain) ? domain : '';
}

function isStudentEmailDomain(email, allowlist = STUDENT_DOMAIN_ALLOWLIST) {
  const domain = normalizeEmailDomain(email);
  if (!domain) return false;
  if (STUDENT_DOMAIN_PATTERNS.some((pattern) => pattern.test(domain))) return true;
  return (allowlist || []).some((entry) => {
    const normalized = String(entry || '').trim().toLowerCase();
    return normalized && (domain === normalized || domain.endsWith(`.${normalized}`));
  });
}

function toDateMs(value) {
  if (!value) return null;
  const ms = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function resolveStudentEligibility(user, { now = new Date(), allowlist = STUDENT_DOMAIN_ALLOWLIST } = {}) {
  if (!user) return { eligible: false, reason: 'no_user' };
  const nowMs = toDateMs(now) ?? Date.now();
  const approvedMs = toDateMs(user.billing?.studentApprovedAt);
  if (approvedMs !== null && approvedMs <= nowMs) {
    return { eligible: true, reason: 'approved_by_support' };
  }
  const email = String(user.email || '').trim();
  if (!email) return { eligible: false, reason: 'no_email' };
  if (!isStudentEmailDomain(email, allowlist)) return { eligible: false, reason: 'not_student_domain' };
  if (toDateMs(user.emailVerifiedAt) === null) return { eligible: false, reason: 'unverified_email' };
  return { eligible: true, reason: 'verified_student_domain' };
}

module.exports = {
  STUDENT_DOMAIN_ALLOWLIST,
  isStudentEmailDomain,
  normalizeEmailDomain,
  resolveStudentEligibility,
};
