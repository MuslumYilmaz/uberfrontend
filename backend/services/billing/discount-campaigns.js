const CAMPAIGN_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const PROVIDER_DISCOUNT_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const DISCOUNT_CODE_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;
const ANALYTICS_SOURCE_PATTERN = /^[a-z0-9_-]{1,64}$/;
const PROVIDERS = new Set(['lemonsqueezy']);
const MODES = new Set(['test', 'live']);
const PLAN_IDS = new Set(['monthly', 'quarterly', 'annual', 'lifetime']);
const MAX_CAMPAIGNS = 50;

function normalizeCampaignId(raw) {
  const value = String(raw || '').trim().toLowerCase();
  return CAMPAIGN_ID_PATTERN.test(value) ? value : null;
}

function normalizeProviderDiscountId(raw) {
  const value = String(raw || '').trim();
  return PROVIDER_DISCOUNT_ID_PATTERN.test(value) ? value : null;
}

function normalizeDiscountCode(raw) {
  const value = String(raw || '').trim();
  return DISCOUNT_CODE_PATTERN.test(value) ? value : null;
}

function normalizeStringList(raw, normalize, allowed) {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const normalized = [];
  for (const entry of raw) {
    const value = normalize(entry);
    if (!value || (allowed && !allowed.has(value))) return null;
    normalized.push(value);
  }
  return Array.from(new Set(normalized));
}

function normalizeOptionalDate(raw) {
  if (raw === null || raw === undefined || raw === '') return { valid: true, value: null };
  const value = new Date(raw);
  return Number.isFinite(value.getTime())
    ? { valid: true, value }
    : { valid: false, value: null };
}

function normalizeCampaignEntry(raw) {
  if (!raw || typeof raw !== 'object' || raw.enabled !== true) return null;
  const campaignId = normalizeCampaignId(raw.campaignId);
  const provider = String(raw.provider || '').trim().toLowerCase();
  const providerDiscountId = normalizeProviderDiscountId(raw.providerDiscountId);
  const discountCode = normalizeDiscountCode(raw.discountCode);
  const modes = normalizeStringList(
    raw.modes,
    (value) => String(value || '').trim().toLowerCase(),
    MODES,
  );
  const planIds = normalizeStringList(
    raw.planIds,
    (value) => String(value || '').trim().toLowerCase(),
    PLAN_IDS,
  );
  const analyticsSources = normalizeStringList(
    raw.analyticsSources,
    (value) => {
      const normalized = String(value || '').trim().toLowerCase();
      return ANALYTICS_SOURCE_PATTERN.test(normalized) ? normalized : null;
    },
  );
  const startsAt = normalizeOptionalDate(raw.startsAt);
  const endsAt = normalizeOptionalDate(raw.endsAt);

  if (
    !campaignId
    || !PROVIDERS.has(provider)
    || !providerDiscountId
    || !discountCode
    || !modes
    || !planIds
    || !analyticsSources
    || !startsAt.valid
    || !endsAt.valid
    || !endsAt.value
    || (startsAt.value && startsAt.value.getTime() >= endsAt.value.getTime())
  ) {
    return null;
  }

  return {
    campaignId,
    provider,
    providerDiscountId,
    discountCode,
    modes,
    planIds,
    analyticsSources,
    startsAt: startsAt.value,
    endsAt: endsAt.value,
  };
}

function parseCampaignAllowlist(raw = process.env.BILLING_DISCOUNT_CAMPAIGNS_JSON) {
  const serialized = String(raw || '').trim();
  if (!serialized || serialized.length > 65536) return [];
  let parsed;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed) || parsed.length > MAX_CAMPAIGNS) return [];

  const normalized = parsed.map(normalizeCampaignEntry).filter(Boolean);
  const duplicateIds = new Set();
  const seenIds = new Set();
  for (const campaign of normalized) {
    if (seenIds.has(campaign.campaignId)) duplicateIds.add(campaign.campaignId);
    seenIds.add(campaign.campaignId);
  }
  return normalized.filter((campaign) => !duplicateIds.has(campaign.campaignId));
}

function resolveDiscountCampaign({
  rawCampaignId,
  provider,
  mode,
  planId,
  analyticsSource,
  now = new Date(),
  env = process.env,
}) {
  const campaignId = normalizeCampaignId(rawCampaignId);
  if (!campaignId) return null;
  const nowMs = new Date(now).getTime();
  if (!Number.isFinite(nowMs)) return null;

  const campaign = parseCampaignAllowlist(env.BILLING_DISCOUNT_CAMPAIGNS_JSON)
    .find((candidate) => candidate.campaignId === campaignId);
  if (!campaign) return null;
  if (campaign.provider !== String(provider || '').trim().toLowerCase()) return null;
  if (!campaign.modes.includes(String(mode || '').trim().toLowerCase())) return null;
  if (!campaign.planIds.includes(String(planId || '').trim().toLowerCase())) return null;
  if (!campaign.analyticsSources.includes(String(analyticsSource || '').trim().toLowerCase())) return null;
  if (campaign.startsAt && nowMs < campaign.startsAt.getTime()) return null;
  if (nowMs >= campaign.endsAt.getTime()) return null;

  return {
    campaignId: campaign.campaignId,
    providerDiscountId: campaign.providerDiscountId,
    discountCode: campaign.discountCode,
  };
}

module.exports = {
  normalizeCampaignId,
  normalizeProviderDiscountId,
  parseCampaignAllowlist,
  resolveDiscountCampaign,
};
