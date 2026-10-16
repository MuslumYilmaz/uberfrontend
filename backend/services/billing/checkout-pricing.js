// Country-based and student prices (docs/references/pricing-plan-2026-10.md,
// Steps 7 and 9). Both are charged through a per-checkout custom price on the
// Lemon Squeezy Create checkout API, so nothing is created in Lemon Squeezy and
// the variant list prices never change. Pure functions; the checkout start
// service decides when a custom checkout can actually be created.

const REGIONAL_PRICING_ENV = 'BILLING_REGIONAL_PRICING_JSON';
const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;
const MULTIPLIER_MIN = 0.1;
const MULTIPLIER_MAX = 0.95;
const MIN_CHARGE_CENTS = 100;
// GreatFrontEnd's rule, adopted on 2026-10-16: 40 percent, the annual plan only,
// first purchase only, never combined with a regional price.
const STUDENT_PRICE_MULTIPLIER = 0.6;
const STUDENT_PRICE_PLAN_IDS = Object.freeze(['annual']);
const PRICE_REASONS = Object.freeze(['regional', 'student']);
let regionalPricingWarned = false;

function normalizeCountryCode(raw) {
  const value = String(raw || '').trim().toUpperCase();
  return COUNTRY_CODE_PATTERN.test(value) ? value : null;
}

function isValidMultiplier(value) {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= MULTIPLIER_MIN
    && value <= MULTIPLIER_MAX;
}

// {"TR":0.5,"IN":0.6}: country code to the share of the list price that is
// charged. One invalid entry rejects the whole table, so a typo can never
// price a country at zero or above the list price.
function parseRegionalPricing(raw) {
  const serialized = String(raw || '').trim();
  if (!serialized) return { table: {}, error: null };
  let parsed;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    return { table: {}, error: 'invalid_json' };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { table: {}, error: 'not_an_object' };
  }
  const table = {};
  for (const [rawCountry, multiplier] of Object.entries(parsed)) {
    const countryCode = normalizeCountryCode(rawCountry);
    if (!countryCode) return { table: {}, error: `invalid_country:${rawCountry}` };
    if (!isValidMultiplier(multiplier)) return { table: {}, error: `invalid_multiplier:${countryCode}` };
    table[countryCode] = multiplier;
  }
  return { table, error: null };
}

function resolveRegionalPricingTable(env = process.env) {
  const { table, error } = parseRegionalPricing(env[REGIONAL_PRICING_ENV]);
  if (error && !regionalPricingWarned) {
    regionalPricingWarned = true;
    console.warn(`[billing] ${REGIONAL_PRICING_ENV} ignored (${error}); list prices apply everywhere`);
  }
  return table;
}

function countryName(countryCode) {
  try {
    const names = new Intl.DisplayNames(['en'], { type: 'region' });
    const name = names.of(countryCode);
    return name && name !== countryCode ? name : countryCode;
  } catch {
    return countryCode;
  }
}

function resolveRegionalPricing(rawCountryCode, env = process.env) {
  const countryCode = normalizeCountryCode(rawCountryCode);
  if (!countryCode) return null;
  const multiplier = resolveRegionalPricingTable(env)[countryCode];
  if (!isValidMultiplier(multiplier)) return null;
  return { countryCode, countryName: countryName(countryCode), multiplier };
}

function applyMultiplier(listAmountCents, multiplier) {
  if (!Number.isSafeInteger(listAmountCents) || listAmountCents <= 0 || !isValidMultiplier(multiplier)) return null;
  const amount = Math.round(listAmountCents * multiplier);
  return amount >= MIN_CHARGE_CENTS && amount < listAmountCents ? amount : null;
}

function studentPricingApplies({ planId, studentEligible, firstPurchase }) {
  return studentEligible === true && firstPurchase === true && STUDENT_PRICE_PLAN_IDS.includes(planId);
}

// The customer gets the better of the regional and the student price, never
// both. A tie goes to the regional price because it carries no first-purchase
// condition.
function resolveCheckoutPricing({
  planId,
  listAmountCents,
  countryCode,
  studentEligible = false,
  firstPurchase = false,
  env = process.env,
}) {
  const list = {
    reason: null,
    multiplier: 1,
    listAmountCents,
    amountCents: listAmountCents,
    countryCode: null,
  };
  const candidates = [];
  const regional = resolveRegionalPricing(countryCode, env);
  if (regional) {
    candidates.push({ reason: 'regional', multiplier: regional.multiplier, countryCode: regional.countryCode });
  }
  if (studentPricingApplies({ planId, studentEligible, firstPurchase })) {
    candidates.push({ reason: 'student', multiplier: STUDENT_PRICE_MULTIPLIER, countryCode: null });
  }
  candidates.sort((left, right) => (left.multiplier - right.multiplier)
    || (left.reason === 'regional' ? -1 : 1));
  for (const candidate of candidates) {
    const amountCents = applyMultiplier(listAmountCents, candidate.multiplier);
    if (amountCents === null) continue;
    return {
      reason: candidate.reason,
      multiplier: candidate.multiplier,
      listAmountCents,
      amountCents,
      countryCode: candidate.countryCode,
    };
  }
  return list;
}

// What the pricing page may state. The regional block is only published when
// every plan can be charged at that price through a custom checkout; the page
// never shows a price the checkout cannot honour.
function resolvePublicPricingRules({
  countryCode,
  planDetails = {},
  customCheckoutAvailable = false,
  env = process.env,
} = {}) {
  const rules = {
    student: { multiplier: STUDENT_PRICE_MULTIPLIER, planIds: [...STUDENT_PRICE_PLAN_IDS] },
    regional: null,
  };
  if (!customCheckoutAvailable) return rules;
  const regional = resolveRegionalPricing(countryCode, env);
  if (!regional) return rules;
  const prices = {};
  for (const [planId, detail] of Object.entries(planDetails)) {
    const amountCents = applyMultiplier(detail?.amountCents, regional.multiplier);
    if (amountCents === null) return rules;
    prices[planId] = amountCents;
  }
  if (!Object.keys(prices).length) return rules;
  rules.regional = { ...regional, prices };
  return rules;
}

module.exports = {
  REGIONAL_PRICING_ENV,
  STUDENT_PRICE_MULTIPLIER,
  STUDENT_PRICE_PLAN_IDS,
  PRICE_REASONS,
  parseRegionalPricing,
  resolveRegionalPricingTable,
  resolveRegionalPricing,
  resolveCheckoutPricing,
  resolvePublicPricingRules,
  applyMultiplier,
  studentPricingApplies,
};
