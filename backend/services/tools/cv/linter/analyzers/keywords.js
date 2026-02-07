'use strict';

const { getRolePack, normalizeRoleId } = require('../../keyword-packs');

const SKILLS_STUFFING_MIN_KEYWORDS = 8;
const SKILLS_STUFFING_MAX_CHARS = 340;
const SKILLS_STUFFING_DENSITY_THRESHOLD = 0.022;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function testPatterns(text, patterns = []) {
  if (!text) return false;
  for (const regex of patterns) {
    if (regex.test(text)) return true;
  }
  return false;
}

function countPatternMatches(text, patterns = []) {
  if (!text) return 0;
  let total = 0;
  for (const regex of patterns) {
    const flags = regex.flags.includes('g') ? regex.flags : `${regex.flags}g`;
    const re = new RegExp(regex.source, flags);
    const matches = text.match(re);
    if (matches) total += matches.length;
  }
  return total;
}

function collectRegionText(lineEntries, region) {
  return (lineEntries || [])
    .filter((entry) => entry.region === region)
    .map((entry) => String(entry.text || '').trim())
    .filter(Boolean)
    .join('\n');
}

function computeKeywordCoverage({ normalizedText, lineEntries, roleId }) {
  const role = normalizeRoleId(roleId);
  const rolePack = getRolePack(role);
  const allText = String(normalizedText || '');
  const skillsText = collectRegionText(lineEntries, 'skills');
  const experienceText = collectRegionText(lineEntries, 'experience');

  const found = [];
  const missing = [];
  const missingByTier = {
    critical: [],
    strong: [],
    nice: [],
  };
  const skillsOnly = [];
  const matchedKeywords = [];

  let weightedFound = 0;
  const weightedTotal = rolePack.keywords.length;
  let foundInExperienceCount = 0;
  let foundInSkillsCount = 0;
  let skillsKeywordMentions = 0;

  for (const keyword of rolePack.keywords) {
    const patterns = [...(keyword.patterns || []), ...(keyword.synonyms || [])];
    const displayLabel = String(keyword.label || keyword.key || '').toLowerCase();
    const inAll = testPatterns(allText, patterns);
    const inExperience = testPatterns(experienceText, patterns);
    const inSkills = testPatterns(skillsText, patterns);

    const foundWeight = inExperience ? 1 : (inSkills ? 0.4 : 0);
    weightedFound += foundWeight;

    if (inAll || inExperience || inSkills) {
      found.push(displayLabel);
      matchedKeywords.push({
        key: keyword.key,
        label: displayLabel,
        tier: keyword.tier,
        inExperience,
        inSkills,
        foundWeight,
      });
    } else {
      missing.push(displayLabel);
      missingByTier[keyword.tier].push(displayLabel);
    }

    if (inSkills && !inExperience) skillsOnly.push(displayLabel);
    if (inSkills) foundInSkillsCount += 1;
    if (inExperience) foundInExperienceCount += 1;
    if (inSkills) skillsKeywordMentions += countPatternMatches(skillsText, patterns);
  }

  const skillsChars = skillsText.replace(/\s+/g, ' ').trim().length;
  const keywordDensity = skillsChars > 0 ? (skillsKeywordMentions / skillsChars) : 0;
  const keywordStuffingSuspected = (
    (foundInSkillsCount >= SKILLS_STUFFING_MIN_KEYWORDS && skillsChars > 0 && skillsChars <= SKILLS_STUFFING_MAX_CHARS)
    || (skillsChars > 0 && keywordDensity > SKILLS_STUFFING_DENSITY_THRESHOLD)
  );

  const weightedCoveragePct = weightedTotal > 0
    ? Math.round((weightedFound / weightedTotal) * 100)
    : 0;
  const coveragePct = weightedTotal > 0
    ? Math.round((found.length / weightedTotal) * 100)
    : 0;

  return {
    role: rolePack.id,
    roleLabel: rolePack.label,
    total: rolePack.keywords.length,
    found,
    missing,
    criticalTotal: rolePack.keywordTiers.critical.length,
    strongTotal: rolePack.keywordTiers.strong.length,
    missingCritical: [...missingByTier.critical],
    missingStrong: [...missingByTier.strong],
    missingByTier,
    skillsOnly,
    foundInExperienceCount,
    foundInSkillsCount,
    coveragePct: clamp(coveragePct, 0, 100),
    weightedCoveragePct: clamp(weightedCoveragePct, 0, 100),
    weightedFound: Number(weightedFound.toFixed(2)),
    weightedTotal,
    keywordStuffingSuspected,
    skillsChars,
    keywordDensity: Number(keywordDensity.toFixed(4)),
    matchedKeywords,
  };
}

module.exports = {
  computeKeywordCoverage,
  SKILLS_STUFFING_MIN_KEYWORDS,
  SKILLS_STUFFING_MAX_CHARS,
  SKILLS_STUFFING_DENSITY_THRESHOLD,
};
