'use strict';

function keyword(key, label, tier, patterns, synonyms = []) {
  return {
    key,
    label,
    tier,
    patterns,
    synonyms,
  };
}

const ROLE_KEYWORDS = Object.freeze({
  senior_frontend_angular: {
    id: 'senior_frontend_angular',
    label: 'Senior Frontend (Angular)',
    keywords: [
      keyword('angular', 'Angular', 'critical', [/\bangular\b/i]),
      keyword('typescript', 'TypeScript', 'critical', [/\btypescript\b/i], [/\bts\b/i]),
      keyword('rxjs', 'RxJS', 'critical', [/\brxjs\b/i], [/\bobservables?\b/i]),
      keyword('state_management', 'State management', 'critical', [/\bstate management\b/i], [/\bngrx\b/i, /\bredux\b/i, /\bsignal(s)? store\b/i, /\bakita\b/i, /\bstate mgmt\b/i]),
      keyword('testing', 'Testing', 'critical', [/\btesting\b/i], [/\bunit tests?\b/i, /\bjasmine\b/i, /\bkarma\b/i, /\bjest\b/i, /\btesting library\b/i, /\bcypress\b/i, /\bplaywright\b/i]),
      keyword('performance', 'Performance', 'critical', [/\bperformance\b/i], [/\boptimi[sz]e\b/i, /\blazy load(?:ing)?\b/i, /\bbundle\b/i, /\blighthouse\b/i, /\bweb vitals\b/i, /\bttfb\b/i, /\bcls\b/i, /\blcp\b/i]),
      keyword('accessibility', 'Accessibility', 'critical', [/\baccessibilit(y|ies)\b/i], [/\ba11y\b/i, /\bwcag\b/i, /\baria\b/i]),
      keyword('ssr', 'SSR / Angular Universal', 'strong', [/\bssr\b/i, /\bangular universal\b/i], [/\bserver[- ]side rendering\b/i]),
      keyword('lazy_loading', 'Lazy loading', 'strong', [/\blazy loading\b/i], [/\blazy load\b/i]),
      keyword('change_detection', 'Change detection', 'strong', [/\bchange detection\b/i], [/\bonpush\b/i, /\bzone\.js\b/i, /\bsignals?\b/i]),
      keyword('module_architecture', 'Module architecture', 'strong', [/\bmodule architecture\b/i], [/\bmodular architecture\b/i]),
      keyword('ci_cd', 'CI/CD', 'strong', [/\bci\/cd\b/i], [/\bpipeline(s)?\b/i, /\bcontinuous integration\b/i, /\bcontinuous delivery\b/i]),
      keyword('observability', 'Observability', 'strong', [/\bobservability\b/i], [/\bmonitoring\b/i, /\btelemetry\b/i, /\blogging\b/i, /\bmetrics\b/i]),
      keyword('signals', 'Signals', 'nice', [/\bsignals?\b/i], [/\bangular signals\b/i]),
      keyword('web_vitals', 'Web Vitals', 'nice', [/\bweb vitals\b/i], [/\bcore web vitals\b/i]),
    ],
  },
  senior_frontend_react: {
    id: 'senior_frontend_react',
    label: 'Senior Frontend (React)',
    keywords: [
      keyword('react', 'React', 'critical', [/\breact\b/i]),
      keyword('typescript', 'TypeScript', 'critical', [/\btypescript\b/i]),
      keyword('hooks', 'Hooks', 'critical', [/\bhooks?\b/i]),
      keyword('state_management', 'State management', 'critical', [/\bstate management\b/i], [/\bredux\b/i]),
      keyword('testing', 'Testing', 'critical', [/\btesting\b/i], [/\bjest\b/i, /\bcypress\b/i]),
      keyword('performance', 'Performance', 'critical', [/\bperformance\b/i], [/\boptimi[sz]e\b/i, /\bweb vitals\b/i]),
      keyword('accessibility', 'Accessibility', 'critical', [/\baccessibilit(y|ies)\b/i], [/\ba11y\b/i, /\baria\b/i]),
      keyword('nextjs', 'Next.js', 'strong', [/\bnext(?:\.js)?\b/i]),
      keyword('ssr', 'SSR', 'strong', [/\bssr\b/i, /\bserver[- ]side rendering\b/i]),
      keyword('lazy_loading', 'Lazy loading', 'strong', [/\blazy loading\b/i]),
      keyword('component_architecture', 'Component architecture', 'strong', [/\bcomponent architecture\b/i]),
      keyword('ci_cd', 'CI/CD', 'strong', [/\bci\/cd\b/i], [/\bpipeline(s)?\b/i]),
      keyword('observability', 'Observability', 'strong', [/\bobservability\b/i], [/\bmonitoring\b/i]),
      keyword('web_vitals', 'Web Vitals', 'strong', [/\bweb vitals\b/i]),
      keyword('frontend_architecture', 'Frontend architecture', 'nice', [/\bfrontend architecture\b/i]),
      keyword('api_integration', 'API integration', 'nice', [/\bapi integration\b/i]),
    ],
  },
  senior_frontend_general: {
    id: 'senior_frontend_general',
    label: 'Senior Frontend (General FE)',
    keywords: [
      keyword('javascript', 'JavaScript', 'critical', [/\bjavascript\b/i]),
      keyword('typescript', 'TypeScript', 'critical', [/\btypescript\b/i]),
      keyword('performance', 'Performance', 'critical', [/\bperformance\b/i], [/\boptimi[sz]e\b/i]),
      keyword('accessibility', 'Accessibility', 'critical', [/\baccessibilit(y|ies)\b/i], [/\ba11y\b/i]),
      keyword('testing', 'Testing', 'critical', [/\btesting\b/i], [/\bunit tests?\b/i, /\bjest\b/i]),
      keyword('state_management', 'State management', 'critical', [/\bstate management\b/i], [/\bstate mgmt\b/i]),
      keyword('ci_cd', 'CI/CD', 'strong', [/\bci\/cd\b/i], [/\bpipeline(s)?\b/i]),
      keyword('web_vitals', 'Web Vitals', 'strong', [/\bweb vitals\b/i]),
      keyword('frontend_architecture', 'Frontend architecture', 'strong', [/\bfrontend architecture\b/i]),
      keyword('api_integration', 'API integration', 'strong', [/\bapi integration\b/i]),
      keyword('lazy_loading', 'Lazy loading', 'strong', [/\blazy loading\b/i]),
      keyword('responsive_design', 'Responsive design', 'strong', [/\bresponsive design\b/i]),
      keyword('component_architecture', 'Component architecture', 'nice', [/\bcomponent architecture\b/i]),
      keyword('observability', 'Observability', 'nice', [/\bobservability\b/i], [/\bmonitoring\b/i]),
    ],
  },
});

function normalizeRoleId(rawRole) {
  const raw = String(rawRole || '').trim().toLowerCase();
  if (!raw) return 'senior_frontend_angular';
  if (raw === 'angular') return 'senior_frontend_angular';
  if (raw === 'react') return 'senior_frontend_react';
  if (raw === 'general' || raw === 'general_fe' || raw === 'frontend') return 'senior_frontend_general';
  if (Object.prototype.hasOwnProperty.call(ROLE_KEYWORDS, raw)) return raw;
  return 'senior_frontend_angular';
}

function getRolePack(rawRole) {
  const roleId = normalizeRoleId(rawRole);
  const rolePack = ROLE_KEYWORDS[roleId] || ROLE_KEYWORDS.senior_frontend_angular;
  const tiers = {
    critical: [],
    strong: [],
    nice: [],
  };

  const keywords = (rolePack.keywords || []).map((item) => {
    tiers[item.tier].push(item.label);
    return {
      ...item,
      patterns: [...(item.patterns || [])],
      synonyms: [...(item.synonyms || [])],
    };
  });

  return {
    id: rolePack.id,
    label: rolePack.label,
    keywords,
    keywordTiers: tiers,
    criticalKeywords: [...tiers.critical],
    strongKeywords: [...tiers.strong],
  };
}

function buildKeywordMatchers(rawRole) {
  const rolePack = getRolePack(rawRole);
  return rolePack.keywords.map((keyword) => {
    const regexes = [...(keyword.patterns || []), ...(keyword.synonyms || [])];
    return {
      keyword: keyword.label.toLowerCase(),
      key: keyword.key,
      tier: keyword.tier,
      critical: keyword.tier === 'critical',
      regexes,
    };
  });
}

module.exports = {
  ROLE_KEYWORDS,
  normalizeRoleId,
  getRolePack,
  buildKeywordMatchers,
};
