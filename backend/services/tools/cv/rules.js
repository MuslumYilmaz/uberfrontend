'use strict';

function formatPercent(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return '0%';
  return `${Math.round(numeric * 100)}%`;
}

function topLineEvidence(ctx, count = 2) {
  return (ctx.lineEntries || [])
    .filter((line) => !line.isHeading)
    .slice(0, count)
    .map((line) => ({
      lineStart: line.lineNumber,
      lineEnd: line.lineNumber,
      snippet: line.text,
      reason: 'top CV lines',
    }));
}

function topBulletEvidence(bullets, count = 2, reason = 'matched bullet') {
  return (bullets || []).slice(0, count).map((bullet) => ({
    lineStart: bullet.lineNumber,
    lineEnd: bullet.lineNumber,
    snippet: bullet.line,
    reason,
  }));
}

function createRules() {
  return [
    {
      id: 'missing_email',
      severity: 'critical',
      category: 'ats',
      scoreDelta: -8,
      evaluate: (ctx) => (!ctx.contact.hasEmail ? {
        title: 'Missing email address',
        message: 'No email address was detected in your CV.',
        why: 'ATS systems and recruiters rely on clear contact details for follow-up.',
        fix: 'Add a professional email near the top header.',
        evidence: topLineEvidence(ctx, 2),
      } : null),
    },
    {
      id: 'missing_phone',
      severity: 'warn',
      category: 'ats',
      scoreDelta: -3,
      evaluate: (ctx) => (!ctx.contact.hasPhone ? {
        title: 'Missing phone number',
        message: 'A phone number was not detected.',
        why: 'Some recruiters still prefer a direct call option.',
        fix: 'Include an international-format phone number in the header.',
        evidence: topLineEvidence(ctx, 2),
      } : null),
    },
    {
      id: 'missing_linkedin',
      severity: 'warn',
      category: 'ats',
      scoreDelta: -3,
      evaluate: (ctx) => (!ctx.contact.hasLinkedIn ? {
        title: 'Missing LinkedIn profile',
        message: 'No LinkedIn URL was detected.',
        why: 'For senior roles, LinkedIn helps validate seniority and history quickly.',
        fix: 'Add a LinkedIn profile URL in your contact block.',
        evidence: topLineEvidence(ctx, 2),
      } : null),
    },
    {
      id: 'too_short_for_ats',
      severity: 'warn',
      category: 'ats',
      scoreDelta: -4,
      evaluate: (ctx) => (ctx.textLength < 900 ? {
        title: 'CV text is too short',
        message: 'The extracted CV text appears unusually short for ATS screening.',
        why: 'Very short CVs often miss role-relevant evidence.',
        fix: 'Expand experience bullets with concrete scope, impact, and technologies.',
        evidence: topLineEvidence(ctx, 2),
      } : null),
    },
    {
      id: 'long_line_readability',
      severity: 'warn',
      category: 'ats',
      scoreDelta: -3,
      evaluate: (ctx) => (ctx.longLineCount >= 6 ? {
        title: 'Long lines hurt readability',
        message: `${ctx.longLineCount} long lines were detected.`,
        why: 'Dense line wraps reduce recruiter readability and can hurt parsing.',
        fix: 'Split long bullets into concise statements.',
        evidence: (ctx.lineEntries || [])
          .filter((line) => line.text.length > 130 && !line.isHeading)
          .slice(0, 2)
          .map((line) => ({
            lineStart: line.lineNumber,
            lineEnd: line.lineNumber,
            snippet: line.text,
            reason: 'very long line',
          })),
      } : null),
    },
    {
      id: 'merged_bullets_suspected',
      severity: 'warn',
      category: 'ats',
      scoreDelta: -3,
      evaluate: (ctx) => (ctx.mergedBullets?.suspected ? {
        title: 'Merged bullets suspected after PDF extraction',
        message: 'Some lines appear to contain multiple bullets merged together.',
        why: 'ATS parsers may misread merged bullets and miss achievements.',
        fix: 'Re-export PDF and ensure bullets are line-broken; ATS may misparse merged lines.',
        evidence: ctx.mergedBullets.evidence,
      } : null),
    },
    {
      id: 'excessive_special_characters',
      severity: 'info',
      category: 'ats',
      scoreDelta: -2,
      evaluate: (ctx) => (ctx.specialCharRatio > 0.06 ? {
        title: 'High special-character density',
        message: 'The CV includes many non-standard symbols.',
        why: 'Some ATS parsers struggle with decorative symbols and uncommon glyphs.',
        fix: 'Prefer plain text bullets and standard punctuation.',
        evidence: topLineEvidence(ctx, 1),
      } : null),
    },
    {
      id: 'no_experience_section',
      severity: 'critical',
      category: 'structure',
      scoreDelta: -8,
      evaluate: (ctx) => (!ctx.sectionsPresent.experience ? {
        title: 'Missing Experience section',
        message: 'No dedicated Experience section heading was detected.',
        why: 'Experience is the main signal for senior-level hiring.',
        fix: 'Add a clear “Experience” heading with role-by-role bullets.',
        evidence: topLineEvidence(ctx, 2),
      } : null),
    },
    {
      id: 'missing_skills_section',
      severity: 'warn',
      category: 'structure',
      scoreDelta: -4,
      evaluate: (ctx) => (!ctx.sectionsPresent.skills ? {
        title: 'Missing Skills section',
        message: 'No dedicated Skills section was detected.',
        why: 'Skills sections improve ATS keyword extraction.',
        fix: 'Add a concise Skills section listing relevant frontend technologies.',
        evidence: topLineEvidence(ctx, 2),
      } : null),
    },
    {
      id: 'implicit_skills_heading_suggestion',
      severity: 'info',
      category: 'structure',
      scoreDelta: 0,
      evaluate: (ctx) => (ctx.sectionDetection?.headingSuggestion?.skills ? {
        title: 'Skills detected without explicit heading',
        message: 'Skills-like labeled blocks were found (e.g., Languages/Technologies).',
        why: 'Explicit SKILLS headings can improve ATS section parsing.',
        fix: 'Consider adding a clear “Skills” heading.',
        evidence: ctx.sectionDetection.aliasDetections.skills.lines,
      } : null),
    },
    {
      id: 'missing_education_section',
      severity: 'warn',
      category: 'structure',
      scoreDelta: -2,
      evaluate: (ctx) => (!ctx.sectionsPresent.education ? {
        title: 'Missing Education section',
        message: 'No Education section heading was detected.',
        why: 'Many ATS profiles expect a basic education block.',
        fix: 'Add an Education section with degree, school, and graduation year.',
        evidence: topLineEvidence(ctx, 1),
      } : null),
    },
    {
      id: 'missing_summary_section',
      severity: 'info',
      category: 'structure',
      scoreDelta: -1,
      evaluate: (ctx) => (!ctx.sectionsPresent.summary ? {
        title: 'No summary statement',
        message: 'A profile/summary section was not detected.',
        why: 'A short summary can frame seniority and specialization quickly.',
        fix: 'Add a 2–3 line summary tailored to the target role.',
        evidence: topLineEvidence(ctx, 2),
      } : null),
    },
    {
      id: 'implicit_summary_heading_suggestion',
      severity: 'info',
      category: 'structure',
      scoreDelta: 0,
      evaluate: (ctx) => (ctx.sectionDetection?.headingSuggestion?.summary ? {
        title: 'Summary detected without explicit heading',
        message: 'An intro paragraph near the top looks like a summary/profile block.',
        why: 'Explicit SUMMARY/PROFILE headings improve ATS reliability.',
        fix: 'Consider adding a clear “Summary” or “Profile” heading.',
        evidence: ctx.sectionDetection.aliasDetections.summary.lines,
      } : null),
    },
    {
      id: 'no_projects_and_no_experience',
      severity: 'critical',
      category: 'structure',
      scoreDelta: -6,
      evaluate: (ctx) => (!ctx.sectionsPresent.projects && !ctx.sectionsPresent.experience ? {
        title: 'No projects or experience sections',
        message: 'Neither Projects nor Experience section was found.',
        why: 'Interviewers need proof of applied frontend engineering work.',
        fix: 'Add at least one of these sections with measurable outcomes.',
        evidence: topLineEvidence(ctx, 2),
      } : null),
    },
    {
      id: 'low_bullet_count',
      severity: 'warn',
      category: 'structure',
      scoreDelta: -4,
      evaluate: (ctx) => (ctx.bulletCount < 6 ? {
        title: 'Low bullet count',
        message: `Only ${ctx.bulletCount} bullet points were detected.`,
        why: 'Bullet points make achievements easier to parse and compare.',
        fix: 'Use action-oriented bullets for each role/project.',
        evidence: topBulletEvidence(ctx.bulletLines, 2, 'detected bullet'),
      } : null),
    },
    {
      id: 'low_numeric_density',
      severity: 'warn',
      category: 'impact',
      scoreDelta: -6,
      evaluate: (ctx) => (ctx.bulletCount >= 6 && ctx.numericBulletRatio < 0.2 ? {
        title: 'Low quantified impact',
        message: `Only ${formatPercent(ctx.numericBulletRatio)} of bullets include metrics.`,
        why: 'Quantified impact strongly improves credibility for senior candidates.',
        fix: 'Add metrics such as %, latency, conversion, scale, or cost savings.',
        evidence: topBulletEvidence(
          (ctx.bulletLines || []).filter((line) => !line.hasMetric),
          2,
          'bullet without metric'
        ),
      } : null),
    },
    {
      id: 'low_numeric_density_small_sample',
      severity: 'info',
      category: 'impact',
      scoreDelta: -1,
      evaluate: (ctx) => (ctx.bulletCount > 0 && ctx.bulletCount < 6 && ctx.numericBulletRatio < 0.2 ? {
        title: 'Add more bullets before metric-density scoring',
        message: 'The CV has too few bullets for strong metric-density analysis.',
        why: 'Small bullet sets can produce noisy metric-density signals.',
        fix: 'First add more experience bullets, then include measurable outcomes.',
        evidence: topBulletEvidence(ctx.bulletLines, 2),
      } : null),
    },
    {
      id: 'no_metrics_in_experience',
      severity: 'warn',
      category: 'impact',
      scoreDelta: -4,
      evaluate: (ctx) => (ctx.experienceBulletCount >= 4 && ctx.experienceBulletsWithNumbers === 0 ? {
        title: 'Experience bullets lack metrics',
        message: 'Experience bullets do not contain measurable outcomes.',
        why: 'Senior frontend impact should tie to business or performance results.',
        fix: 'Add at least one metric per major experience entry.',
        evidence: topBulletEvidence(
          (ctx.bulletLines || []).filter((line) => line.region === 'experience'),
          2,
          'experience bullet without metric'
        ),
      } : null),
    },
    {
      id: 'too_many_responsible_for',
      severity: 'warn',
      category: 'impact',
      scoreDelta: -4,
      evaluate: (ctx) => (ctx.bulletCount >= 4 && ctx.responsibleForRatio > 0.3 ? {
        title: 'Overuse of “Responsible for”',
        message: `${formatPercent(ctx.responsibleForRatio)} of bullets start with “Responsible for”.`,
        why: 'This phrasing describes duties, not outcomes.',
        fix: 'Start bullets with strong action verbs and concrete results.',
        evidence: topBulletEvidence(
          (ctx.bulletLines || []).filter((line) => line.startsWithResponsible),
          2,
          'starts with Responsible for'
        ),
      } : null),
    },
    {
      id: 'weak_action_verbs',
      severity: 'warn',
      category: 'impact',
      scoreDelta: -5,
      evaluate: (ctx) => (ctx.bulletCount >= 4 && ctx.weakActionVerbRatio > 0.5 ? {
        title: 'Weak action-verb usage',
        message: `${formatPercent(ctx.weakActionVerbRatio)} of bullets do not start with strong action verbs.`,
        why: 'Action-led bullets communicate ownership and leadership better.',
        fix: 'Rewrite bullets to start with verbs like Built, Led, Optimized, or Delivered.',
        evidence: topBulletEvidence(
          (ctx.bulletLines || []).filter((line) => !line.startsWithActionVerb),
          2,
          'weak opening verb'
        ),
      } : null),
    },
    {
      id: 'repeated_bullet_starts',
      severity: 'info',
      category: 'impact',
      scoreDelta: -2,
      evaluate: (ctx) => (ctx.bulletCount >= 4 && ctx.repeatedBulletStartRatio > 0.45 ? {
        title: 'Repetitive bullet openings',
        message: 'Many bullets begin with the same opening word.',
        why: 'Variation improves readability and keeps impact statements distinct.',
        fix: 'Vary sentence starts while keeping action + impact structure.',
        evidence: topBulletEvidence(ctx.bulletLines, 2, 'repeated bullet starts'),
      } : null),
    },
    {
      id: 'no_outcome_language',
      severity: 'warn',
      category: 'impact',
      scoreDelta: -3,
      evaluate: (ctx) => {
        const totalBullets = ctx.experienceBulletCount;
        if (totalBullets === 0) return null;

        if (totalBullets < 6 && ctx.outcomeRatio < 0.25) {
          return {
            severity: 'info',
            scoreDelta: -1,
            title: 'Add more bullets to show impact',
            message: 'There are too few experience bullets for robust outcome analysis.',
            why: 'Outcome scoring is noisy on very small bullet sets.',
            fix: 'Add more role bullets with measurable outcomes and scope.',
            evidence: topBulletEvidence(ctx.bulletsWithoutOutcome, 2, 'bullet lacks explicit outcome'),
          };
        }

        if (ctx.outcomeRatio >= 0.25) return null;

        const extractionLow = ctx.extractionQuality?.level === 'low';
        const confidentlyDetectedBullets = totalBullets >= 8 && !ctx.mergedBullets?.suspected;
        const extremelyLowOutcomeRatio = ctx.outcomeRatio < 0.08;
        const downgrade = extractionLow && !(confidentlyDetectedBullets && extremelyLowOutcomeRatio);

        return {
          severity: downgrade ? 'info' : 'warn',
          scoreDelta: downgrade ? -1 : -3,
          title: downgrade ? 'Outcome language may be under-detected' : 'Missing outcome language',
          message: downgrade
            ? 'Extraction quality is low, so outcome detection may undercount.'
            : 'Experience bullets rarely describe outcomes.',
          why: 'Recruiters prioritize outcomes over task descriptions.',
          fix: 'Include outcomes such as improved, reduced, increased, shipped, or optimized.',
          evidence: topBulletEvidence(ctx.bulletsWithoutOutcome, 2, 'bullet lacks outcome evidence'),
        };
      },
    },
    {
      id: 'no_scope_language',
      severity: 'info',
      category: 'impact',
      scoreDelta: -2,
      evaluate: (ctx) => (ctx.experienceBulletCount >= 4 && ctx.scopeLanguageCount === 0 ? {
        title: 'Missing scale or scope cues',
        message: 'Bullets do not indicate system or user scale.',
        why: 'Scope helps calibrate impact and seniority.',
        fix: 'Add scope context such as users, traffic, or team size.',
        evidence: topBulletEvidence(
          (ctx.bulletLines || []).filter((line) => line.region === 'experience'),
          2,
          'experience bullet without scope'
        ),
      } : null),
    },
    {
      id: 'short_bullets_majority',
      severity: 'warn',
      category: 'impact',
      scoreDelta: -3,
      evaluate: (ctx) => (ctx.bulletCount >= 4 && ctx.shortBulletRatio > 0.6 ? {
        title: 'Most bullets are too short',
        message: 'Most bullets are very short and may omit context/impact.',
        why: 'Good bullets usually combine action, scope, and measurable result.',
        fix: 'Expand bullets to include technology, scope, and impact.',
        evidence: topBulletEvidence(
          (ctx.bulletLines || []).filter((line) => line.wordCount < 8),
          2,
          'short bullet'
        ),
      } : null),
    },
    {
      id: 'inconsistent_date_format',
      severity: 'warn',
      category: 'consistency',
      scoreDelta: -4,
      evaluate: (ctx) => (ctx.dateFormats.usedCount > 1 ? {
        title: 'Inconsistent date format',
        message: `Detected mixed date formats: ${ctx.dateFormats.usedFormats.join(', ')}. Recommended format: ${ctx.dateFormats.suggestedFormat}.`,
        why: 'Inconsistent timelines make experience harder to scan quickly.',
        fix: `Use one format consistently, e.g., ${ctx.dateFormats.suggestedFormat} (Jan 2022, Mar 2024).`,
        evidence: ctx.dateFormats.usedFormats.flatMap((format) => (ctx.dateFormats.evidence[format] || []).slice(0, 1)),
      } : null),
    },
    {
      id: 'mixed_bullet_markers',
      severity: 'info',
      category: 'consistency',
      scoreDelta: -2,
      evaluate: (ctx) => (ctx.mixedBulletMarkers ? {
        title: 'Mixed bullet markers',
        message: 'Different bullet marker styles are mixed.',
        why: 'Visual inconsistency can reduce polish and readability.',
        fix: 'Use a single bullet style throughout the document.',
        evidence: topBulletEvidence(ctx.bulletLines, 2, 'mixed marker style'),
      } : null),
    },
    {
      id: 'duplicate_lines',
      severity: 'warn',
      category: 'consistency',
      scoreDelta: -3,
      evaluate: (ctx) => (ctx.duplicateLineCount >= 2 ? {
        title: 'Duplicate lines detected',
        message: `${ctx.duplicateLineCount} duplicate lines were detected.`,
        why: 'Duplicate content can look careless and reduce signal quality.',
        fix: 'Remove repeated lines and keep each bullet unique.',
        evidence: topLineEvidence(ctx, 2),
      } : null),
    },
    {
      id: 'excessive_caps_lines',
      severity: 'warn',
      category: 'consistency',
      scoreDelta: -2,
      evaluate: (ctx) => (ctx.capsHeavyLineCount >= 3 ? {
        title: 'Too many ALL-CAPS lines',
        message: 'Multiple lines are mostly uppercase.',
        why: 'Overuse of caps hurts readability and professional tone.',
        fix: 'Reserve uppercase for short headings only.',
        evidence: topLineEvidence(ctx, 2),
      } : null),
    },
    {
      id: 'trailing_punctuation_inconsistent',
      severity: 'info',
      category: 'consistency',
      scoreDelta: -1,
      evaluate: (ctx) => (ctx.bulletCount >= 4 && ctx.trailingPunctuationMixed ? {
        title: 'Inconsistent bullet punctuation',
        message: 'Some bullets end with punctuation while others do not.',
        why: 'Consistent punctuation improves document polish.',
        fix: 'Pick one style and apply it consistently.',
        evidence: topBulletEvidence(ctx.bulletLines, 2, 'mixed punctuation style'),
      } : null),
    },
    {
      id: 'spacing_hygiene',
      severity: 'info',
      category: 'consistency',
      scoreDelta: -1,
      evaluate: (ctx) => (ctx.spacingIssueCount >= 3 ? {
        title: 'Spacing hygiene issues',
        message: 'Multiple spacing anomalies were detected.',
        why: 'Formatting noise can affect ATS parsing and human readability.',
        fix: 'Normalize spacing and remove repeated spaces/tabs.',
        evidence: topLineEvidence(ctx, 2),
      } : null),
    },
    {
      id: 'stack_contradiction',
      severity: 'warn',
      category: 'consistency',
      scoreDelta: -5,
      evaluate: (ctx) => ((ctx.stackContradictions || []).length > 0 ? {
        title: 'Potential stack contradiction',
        message: 'Conflicting stack acronyms/frameworks were detected in nearby lines.',
        why: 'Contradictory stack descriptions can confuse ATS and reviewers.',
        fix: 'Clarify architecture boundaries (frontend vs backend) or correct the acronym.',
        evidence: ctx.stackContradictions.map((item) => ({
          lineStart: item.lineStart,
          lineEnd: item.lineEnd,
          snippet: item.snippet,
          reason: item.reason,
        })),
      } : null),
    },
    {
      id: 'keyword_missing',
      severity: 'warn',
      category: 'keywords',
      scoreDelta: -6,
      evaluate: (ctx) => (ctx.keywordCoverage.weightedCoveragePct < 50 ? {
        title: 'Keyword coverage is low',
        message: `Weighted keyword coverage is ${ctx.keywordCoverage.weightedCoveragePct}% (experience-weighted).`,
        why: 'Role-aligned terms improve ATS matching for interview screening.',
        fix: 'Add relevant role keywords naturally in experience and project bullets.',
        explanation: `Missing critical keywords (sample): ${ctx.keywordCoverage.missingByTier.critical.slice(0, 6).join(', ') || 'none'}.`,
        evidence: [{
          snippet: `Missing critical: ${ctx.keywordCoverage.missingByTier.critical.slice(0, 6).join(', ') || 'none'}`,
          reason: 'critical keyword gap',
        }],
      } : null),
    },
    {
      id: 'keyword_missing_critical',
      severity: 'warn',
      category: 'keywords',
      scoreDelta: -4,
      evaluate: (ctx) => (ctx.keywordCoverage.missingByTier.critical.length > 0 ? {
        title: 'Critical keywords missing',
        message: 'Some high-priority role keywords are missing.',
        why: 'Critical keywords are often used as first-pass ATS filters.',
        fix: 'Include critical terms where they were used in real work.',
        evidence: [{
          snippet: `Missing critical: ${ctx.keywordCoverage.missingByTier.critical.slice(0, 8).join(', ')}`,
          reason: 'critical keywords not found',
        }],
      } : null),
    },
    {
      id: 'skills_only_keywords',
      severity: 'info',
      category: 'keywords',
      scoreDelta: -3,
      evaluate: (ctx) => (ctx.keywordCoverage.skillsOnly.length >= 2 ? {
        title: 'Keywords only in Skills section',
        message: 'Several keywords appear in Skills but not in Experience.',
        why: 'Keywords without supporting experience can look unsubstantiated.',
        fix: 'Move key terms into experience bullets with concrete outcomes.',
        evidence: [{
          snippet: `Skills-only keywords: ${ctx.keywordCoverage.skillsOnly.slice(0, 8).join(', ')}`,
          reason: 'skills-only keyword match',
        }],
      } : null),
    },
    {
      id: 'no_keywords_in_experience',
      severity: 'warn',
      category: 'keywords',
      scoreDelta: -4,
      evaluate: (ctx) => (ctx.keywordCoverage.total > 0 && ctx.keywordCoverage.foundInExperienceCount === 0 ? {
        title: 'No role keywords in Experience',
        message: 'Role keywords are not present in Experience bullets.',
        why: 'Experience carries the most weight during screening.',
        fix: 'Reference relevant tools/techniques in impact-oriented experience bullets.',
        evidence: topBulletEvidence(
          (ctx.bulletLines || []).filter((line) => line.region === 'experience'),
          2,
          'experience bullet lacks role keywords'
        ),
      } : null),
    },
    {
      id: 'keyword_stuffing_suspected',
      severity: 'info',
      category: 'keywords',
      scoreDelta: -2,
      evaluate: (ctx) => (ctx.keywordCoverage.keywordStuffingSuspected ? {
        title: 'Possible keyword stuffing in Skills',
        message: 'Keyword density is unusually high in a short Skills block.',
        why: 'ATS and recruiters prefer natural keyword usage with evidence.',
        fix: 'Prefer adding keywords naturally in experience bullets.',
        evidence: [{
          snippet: `Skills chars: ${ctx.keywordCoverage.skillsChars}, density: ${ctx.keywordCoverage.keywordDensity}`,
          reason: 'high skills keyword density',
        }],
      } : null),
    },
  ];
}

module.exports = {
  createRules,
};
