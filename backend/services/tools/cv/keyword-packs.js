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

function rolePack(id, label, level, stack, keywords) {
  return {
    id,
    label,
    level,
    stack,
    keywords,
  };
}

const COMMON_PATTERNS = Object.freeze({
  angular: [/\bangular(?:\.?js)?\b/i],
  angularSynonyms: [/\bangular\s*(?:2\+?|[3-9](?:\.\d+)?)\b/i],
  react: [/\breact(?:\.?js)?\b/i],
  reactSynonyms: [/\breact\s+js\b/i],
  javascript: [/\bjavascript\b/i],
  typescript: [/\btypescript\b/i],
  typescriptSynonyms: [/\bts\b/i],
  htmlCss: [/\bhtml5?\b/i, /\bcss3?\b/i],
  responsive: [/\bresponsive design\b/i],
  responsiveSynonyms: [/\bmobile[- ]first\b/i, /\bcross[- ]browser\b/i],
  git: [/\bgit\b/i],
  gitSynonyms: [/\bgithub\b/i, /\bgitlab\b/i, /\bversion control\b/i],
  apiIntegration: [/\bapi integration\b/i],
  apiIntegrationSynonyms: [/\brest(?:ful)?\b/i, /\bgraphql\b/i, /\bapi\b/i],
  projectsPortfolio: [/\bprojects?\b/i, /\bportfolio\b/i],
  testing: [/\btesting\b/i],
  testingSynonyms: [/\bunit tests?\b/i, /\bjasmine\b/i, /\bkarma\b/i, /\bjest\b/i, /\btesting library\b/i, /\bcypress\b/i, /\bplaywright\b/i, /\bmocha\b/i, /\bchai\b/i],
  performance: [/\bperformance\b/i],
  performanceSynonyms: [/\boptimi[sz]e\b/i, /\blazy load(?:ing)?\b/i, /\bbundle\b/i, /\blighthouse\b/i, /\bweb vitals\b/i, /\bcore web vitals\b/i, /\bttfb\b/i, /\bcls\b/i, /\blcp\b/i, /\btti\b/i],
  accessibility: [/\baccessibilit(y|ies)\b/i],
  accessibilitySynonyms: [/\ba11y\b/i, /\bwcag\b/i, /\baria\b/i],
  stateManagement: [/\bstate management\b/i],
  stateManagementSynonyms: [/\bngrx\b/i, /\bredux\b/i, /\bredux toolkit\b/i, /\bzustand\b/i, /\bcontext api\b/i, /\bsignal(s)? store\b/i, /\bakita\b/i, /\bstate mgmt\b/i],
  ciCd: [/\bci\/cd\b/i],
  ciCdSynonyms: [/\bpipeline(s)?\b/i, /\bcontinuous integration\b/i, /\bcontinuous delivery\b/i],
});

const JUNIOR_GENERAL_KEYWORDS = [
  keyword('javascript', 'JavaScript', 'critical', COMMON_PATTERNS.javascript),
  keyword('html_css', 'HTML / CSS', 'critical', COMMON_PATTERNS.htmlCss),
  keyword('responsive_design', 'Responsive design', 'critical', COMMON_PATTERNS.responsive, COMMON_PATTERNS.responsiveSynonyms),
  keyword('git', 'Git / GitHub', 'critical', COMMON_PATTERNS.git, COMMON_PATTERNS.gitSynonyms),
  keyword('api_integration', 'API integration', 'critical', COMMON_PATTERNS.apiIntegration, COMMON_PATTERNS.apiIntegrationSynonyms),
  keyword('projects_portfolio', 'Projects / portfolio', 'critical', COMMON_PATTERNS.projectsPortfolio),
  keyword('testing', 'Basic testing', 'critical', COMMON_PATTERNS.testing, COMMON_PATTERNS.testingSynonyms),
  keyword('accessibility', 'Accessibility basics', 'critical', COMMON_PATTERNS.accessibility, COMMON_PATTERNS.accessibilitySynonyms),
  keyword('typescript', 'TypeScript', 'strong', COMMON_PATTERNS.typescript, COMMON_PATTERNS.typescriptSynonyms),
  keyword('performance', 'Performance basics', 'strong', COMMON_PATTERNS.performance, COMMON_PATTERNS.performanceSynonyms),
  keyword('component_basics', 'Component basics', 'strong', [/\bcomponents?\b/i]),
  keyword('package_management', 'Package management', 'nice', [/\bnpm\b/i], [/\byarn\b/i, /\bpnpm\b/i]),
];

const MID_GENERAL_KEYWORDS = [
  keyword('typescript', 'TypeScript', 'critical', COMMON_PATTERNS.typescript, COMMON_PATTERNS.typescriptSynonyms),
  keyword('javascript', 'JavaScript', 'critical', COMMON_PATTERNS.javascript),
  keyword('state_management', 'State management', 'critical', COMMON_PATTERNS.stateManagement, COMMON_PATTERNS.stateManagementSynonyms),
  keyword('testing', 'Testing', 'critical', COMMON_PATTERNS.testing, COMMON_PATTERNS.testingSynonyms),
  keyword('accessibility', 'Accessibility', 'critical', COMMON_PATTERNS.accessibility, COMMON_PATTERNS.accessibilitySynonyms),
  keyword('performance', 'Performance', 'critical', COMMON_PATTERNS.performance, COMMON_PATTERNS.performanceSynonyms),
  keyword('api_integration', 'API integration', 'critical', COMMON_PATTERNS.apiIntegration, COMMON_PATTERNS.apiIntegrationSynonyms),
  keyword('ci_cd', 'CI/CD', 'strong', COMMON_PATTERNS.ciCd, COMMON_PATTERNS.ciCdSynonyms),
  keyword('component_architecture', 'Component architecture', 'strong', [/\bcomponent architecture\b/i], [/\bcomponents?\b/i, /\bdesign systems?\b/i]),
  keyword('responsive_design', 'Responsive design', 'strong', COMMON_PATTERNS.responsive, COMMON_PATTERNS.responsiveSynonyms),
  keyword('web_vitals', 'Web Vitals', 'nice', [/\bweb vitals\b/i], [/\bcore web vitals\b/i]),
  keyword('observability', 'Observability', 'nice', [/\bobservability\b/i], [/\bmonitoring\b/i]),
];

const ROLE_KEYWORDS = Object.freeze({
  junior_frontend_general: rolePack(
    'junior_frontend_general',
    'Junior Frontend (General FE)',
    'junior',
    'general',
    JUNIOR_GENERAL_KEYWORDS
  ),
  junior_frontend_angular: rolePack(
    'junior_frontend_angular',
    'Junior Frontend (Angular)',
    'junior',
    'angular',
    [
      keyword('angular', 'Angular', 'critical', COMMON_PATTERNS.angular, COMMON_PATTERNS.angularSynonyms),
      keyword('typescript', 'TypeScript', 'critical', COMMON_PATTERNS.typescript, COMMON_PATTERNS.typescriptSynonyms),
      keyword('html_css', 'HTML / CSS', 'critical', COMMON_PATTERNS.htmlCss),
      keyword('responsive_design', 'Responsive design', 'critical', COMMON_PATTERNS.responsive, COMMON_PATTERNS.responsiveSynonyms),
      keyword('api_integration', 'API integration', 'critical', COMMON_PATTERNS.apiIntegration, COMMON_PATTERNS.apiIntegrationSynonyms),
      keyword('projects_portfolio', 'Projects / portfolio', 'critical', COMMON_PATTERNS.projectsPortfolio),
      keyword('testing', 'Basic testing', 'critical', COMMON_PATTERNS.testing, COMMON_PATTERNS.testingSynonyms),
      keyword('git', 'Git / GitHub', 'strong', COMMON_PATTERNS.git, COMMON_PATTERNS.gitSynonyms),
      keyword('rxjs', 'RxJS', 'strong', [/\brxjs\b/i], [/\bobservables?\b/i]),
      keyword('accessibility', 'Accessibility basics', 'strong', COMMON_PATTERNS.accessibility, COMMON_PATTERNS.accessibilitySynonyms),
      keyword('performance', 'Performance basics', 'nice', COMMON_PATTERNS.performance, COMMON_PATTERNS.performanceSynonyms),
    ]
  ),
  junior_frontend_react: rolePack(
    'junior_frontend_react',
    'Junior Frontend (React)',
    'junior',
    'react',
    [
      keyword('react', 'React', 'critical', COMMON_PATTERNS.react, COMMON_PATTERNS.reactSynonyms),
      keyword('javascript', 'JavaScript', 'critical', COMMON_PATTERNS.javascript),
      keyword('html_css', 'HTML / CSS', 'critical', COMMON_PATTERNS.htmlCss),
      keyword('responsive_design', 'Responsive design', 'critical', COMMON_PATTERNS.responsive, COMMON_PATTERNS.responsiveSynonyms),
      keyword('api_integration', 'API integration', 'critical', COMMON_PATTERNS.apiIntegration, COMMON_PATTERNS.apiIntegrationSynonyms),
      keyword('projects_portfolio', 'Projects / portfolio', 'critical', COMMON_PATTERNS.projectsPortfolio),
      keyword('testing', 'Basic testing', 'critical', COMMON_PATTERNS.testing, COMMON_PATTERNS.testingSynonyms),
      keyword('typescript', 'TypeScript', 'strong', COMMON_PATTERNS.typescript, COMMON_PATTERNS.typescriptSynonyms),
      keyword('hooks', 'Hooks', 'strong', [/\bhooks?\b/i], [/\buse(?:state|effect|memo|callback|reducer|context)\b/i]),
      keyword('state_management', 'State management basics', 'strong', COMMON_PATTERNS.stateManagement, COMMON_PATTERNS.stateManagementSynonyms),
      keyword('accessibility', 'Accessibility basics', 'nice', COMMON_PATTERNS.accessibility, COMMON_PATTERNS.accessibilitySynonyms),
    ]
  ),
  mid_frontend_general: rolePack(
    'mid_frontend_general',
    'Mid Frontend (General FE)',
    'mid',
    'general',
    MID_GENERAL_KEYWORDS
  ),
  mid_frontend_angular: rolePack(
    'mid_frontend_angular',
    'Mid Frontend (Angular)',
    'mid',
    'angular',
    [
      keyword('angular', 'Angular', 'critical', COMMON_PATTERNS.angular, COMMON_PATTERNS.angularSynonyms),
      keyword('typescript', 'TypeScript', 'critical', COMMON_PATTERNS.typescript, COMMON_PATTERNS.typescriptSynonyms),
      keyword('rxjs', 'RxJS', 'critical', [/\brxjs\b/i], [/\bobservables?\b/i]),
      keyword('state_management', 'State management', 'critical', COMMON_PATTERNS.stateManagement, COMMON_PATTERNS.stateManagementSynonyms),
      keyword('testing', 'Testing', 'critical', COMMON_PATTERNS.testing, COMMON_PATTERNS.testingSynonyms),
      keyword('accessibility', 'Accessibility', 'critical', COMMON_PATTERNS.accessibility, COMMON_PATTERNS.accessibilitySynonyms),
      keyword('performance', 'Performance', 'critical', COMMON_PATTERNS.performance, COMMON_PATTERNS.performanceSynonyms),
      keyword('api_integration', 'API integration', 'strong', COMMON_PATTERNS.apiIntegration, COMMON_PATTERNS.apiIntegrationSynonyms),
      keyword('ci_cd', 'CI/CD', 'strong', COMMON_PATTERNS.ciCd, COMMON_PATTERNS.ciCdSynonyms),
      keyword('component_architecture', 'Component architecture', 'strong', [/\bcomponent architecture\b/i], [/\bcomponents?\b/i, /\bdesign systems?\b/i]),
      keyword('change_detection', 'Change detection', 'nice', [/\bchange detection\b/i], [/\bonpush\b/i, /\bzone\.js\b/i, /\bsignals?\b/i]),
    ]
  ),
  mid_frontend_react: rolePack(
    'mid_frontend_react',
    'Mid Frontend (React)',
    'mid',
    'react',
    [
      keyword('react', 'React', 'critical', COMMON_PATTERNS.react, COMMON_PATTERNS.reactSynonyms),
      keyword('typescript', 'TypeScript', 'critical', COMMON_PATTERNS.typescript, COMMON_PATTERNS.typescriptSynonyms),
      keyword('hooks', 'Hooks', 'critical', [/\bhooks?\b/i], [/\buse(?:state|effect|memo|callback|reducer|context)\b/i]),
      keyword('state_management', 'State management', 'critical', COMMON_PATTERNS.stateManagement, COMMON_PATTERNS.stateManagementSynonyms),
      keyword('testing', 'Testing', 'critical', COMMON_PATTERNS.testing, COMMON_PATTERNS.testingSynonyms),
      keyword('accessibility', 'Accessibility', 'critical', COMMON_PATTERNS.accessibility, COMMON_PATTERNS.accessibilitySynonyms),
      keyword('performance', 'Performance', 'critical', COMMON_PATTERNS.performance, COMMON_PATTERNS.performanceSynonyms),
      keyword('api_integration', 'API integration', 'strong', COMMON_PATTERNS.apiIntegration, COMMON_PATTERNS.apiIntegrationSynonyms),
      keyword('ci_cd', 'CI/CD', 'strong', COMMON_PATTERNS.ciCd, COMMON_PATTERNS.ciCdSynonyms),
      keyword('component_architecture', 'Component architecture', 'strong', [/\bcomponent architecture\b/i], [/\bcomponents?\b/i, /\bdesign systems?\b/i]),
      keyword('nextjs', 'Next.js', 'nice', [/\bnext(?:\.js)?\b/i]),
    ]
  ),
  senior_frontend_angular: rolePack(
    'senior_frontend_angular',
    'Senior Frontend (Angular)',
    'senior',
    'angular',
    [
      keyword('angular', 'Angular', 'critical', COMMON_PATTERNS.angular, COMMON_PATTERNS.angularSynonyms),
      keyword('typescript', 'TypeScript', 'critical', COMMON_PATTERNS.typescript, COMMON_PATTERNS.typescriptSynonyms),
      keyword('rxjs', 'RxJS', 'critical', [/\brxjs\b/i], [/\bobservables?\b/i]),
      keyword('state_management', 'State management', 'critical', COMMON_PATTERNS.stateManagement, COMMON_PATTERNS.stateManagementSynonyms),
      keyword('testing', 'Testing', 'critical', COMMON_PATTERNS.testing, COMMON_PATTERNS.testingSynonyms),
      keyword('performance', 'Performance', 'critical', COMMON_PATTERNS.performance, COMMON_PATTERNS.performanceSynonyms),
      keyword('accessibility', 'Accessibility', 'critical', COMMON_PATTERNS.accessibility, COMMON_PATTERNS.accessibilitySynonyms),
      keyword('ssr', 'SSR / Angular Universal', 'strong', [/\bssr\b/i, /\bangular universal\b/i], [/\bserver[- ]side rendering\b/i]),
      keyword('lazy_loading', 'Lazy loading', 'strong', [/\blazy loading\b/i], [/\blazy load\b/i]),
      keyword('change_detection', 'Change detection', 'strong', [/\bchange detection\b/i], [/\bonpush\b/i, /\bzone\.js\b/i, /\bsignals?\b/i]),
      keyword('module_architecture', 'Module architecture', 'strong', [/\bmodule architecture\b/i], [/\bmodular architecture\b/i]),
      keyword('ci_cd', 'CI/CD', 'strong', [/\bci\/cd\b/i], [/\bpipeline(s)?\b/i, /\bcontinuous integration\b/i, /\bcontinuous delivery\b/i]),
      keyword('observability', 'Observability', 'strong', [/\bobservability\b/i], [/\bmonitoring\b/i, /\btelemetry\b/i, /\blogging\b/i, /\bmetrics\b/i]),
      keyword('signals', 'Signals', 'nice', [/\bsignals?\b/i], [/\bangular signals\b/i]),
      keyword('web_vitals', 'Web Vitals', 'nice', [/\bweb vitals\b/i], [/\bcore web vitals\b/i]),
    ],
  ),
  senior_frontend_react: rolePack(
    'senior_frontend_react',
    'Senior Frontend (React)',
    'senior',
    'react',
    [
      keyword('react', 'React', 'critical', COMMON_PATTERNS.react, COMMON_PATTERNS.reactSynonyms),
      keyword('typescript', 'TypeScript', 'critical', COMMON_PATTERNS.typescript, COMMON_PATTERNS.typescriptSynonyms),
      keyword('hooks', 'Hooks', 'critical', [/\bhooks?\b/i], [/\buse(?:state|effect|memo|callback|reducer|context)\b/i]),
      keyword('state_management', 'State management', 'critical', COMMON_PATTERNS.stateManagement, COMMON_PATTERNS.stateManagementSynonyms),
      keyword('testing', 'Testing', 'critical', COMMON_PATTERNS.testing, COMMON_PATTERNS.testingSynonyms),
      keyword('performance', 'Performance', 'critical', COMMON_PATTERNS.performance, COMMON_PATTERNS.performanceSynonyms),
      keyword('accessibility', 'Accessibility', 'critical', COMMON_PATTERNS.accessibility, COMMON_PATTERNS.accessibilitySynonyms),
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
  ),
  senior_frontend_general: rolePack(
    'senior_frontend_general',
    'Senior Frontend (General FE)',
    'senior',
    'general',
    [
      keyword('javascript', 'JavaScript', 'critical', COMMON_PATTERNS.javascript),
      keyword('typescript', 'TypeScript', 'critical', COMMON_PATTERNS.typescript, COMMON_PATTERNS.typescriptSynonyms),
      keyword('performance', 'Performance', 'critical', COMMON_PATTERNS.performance, COMMON_PATTERNS.performanceSynonyms),
      keyword('accessibility', 'Accessibility', 'critical', COMMON_PATTERNS.accessibility, COMMON_PATTERNS.accessibilitySynonyms),
      keyword('testing', 'Testing', 'critical', COMMON_PATTERNS.testing, COMMON_PATTERNS.testingSynonyms),
      keyword('state_management', 'State management', 'critical', COMMON_PATTERNS.stateManagement, COMMON_PATTERNS.stateManagementSynonyms),
      keyword('ci_cd', 'CI/CD', 'strong', [/\bci\/cd\b/i], [/\bpipeline(s)?\b/i]),
      keyword('web_vitals', 'Web Vitals', 'strong', [/\bweb vitals\b/i]),
      keyword('frontend_architecture', 'Frontend architecture', 'strong', [/\bfrontend architecture\b/i]),
      keyword('api_integration', 'API integration', 'strong', [/\bapi integration\b/i]),
      keyword('lazy_loading', 'Lazy loading', 'strong', [/\blazy loading\b/i]),
      keyword('responsive_design', 'Responsive design', 'strong', [/\bresponsive design\b/i]),
      keyword('component_architecture', 'Component architecture', 'nice', [/\bcomponent architecture\b/i]),
      keyword('observability', 'Observability', 'nice', [/\bobservability\b/i], [/\bmonitoring\b/i]),
    ],
  ),
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
    level: rolePack.level,
    stack: rolePack.stack,
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
