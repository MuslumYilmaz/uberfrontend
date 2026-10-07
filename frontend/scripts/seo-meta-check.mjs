#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { auditSeoPages, normalizeText, parseSeoPage } from './seo-meta-audit.mjs';
import { auditContentDateParity, sitemapDatesFromXml } from './seo-date-parity.mjs';

const BUILD_DIR = path.resolve(process.env.SEO_BUILD_DIR || 'dist/frontendatlas/browser');
const STRICT_H1 = process.env.STRICT_H1 === '1';
const CANONICAL_BASE = process.env.SEO_CANONICAL_BASE || 'https://frontendatlas.com';

function toRoute(filePath) {
  const dir = path.dirname(filePath);
  const rel = path.relative(BUILD_DIR, dir).replace(/\\/g, '/');
  if (!rel || rel === '.') return '/';
  return `/${rel}`;
}

function collectHtmlFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectHtmlFiles(full, out);
      continue;
    }
    if (entry.isFile() && entry.name === 'index.html') out.push(full);
  }
  return out;
}

const criticalRouteContracts = [
  {
    route: '/',
    title: 'Frontend Interview Prep: Questions, Coding & System Design',
    h1: 'Practice frontend interviews',
    descriptionTerms: [
      'study plan',
      'coding',
      'UI implementation',
      'system design',
      'behavioral questions',
    ],
    bodyTerms: [
      'frontend interview preparation platform',
      'Start 30-day plan',
      '30-day guided plan',
      'Machine Coding',
      'Choose your focus',
    ],
  },
  {
    route: '/coding',
    title: 'Frontend Coding Challenges for Interview Practice',
    h1: 'Frontend Coding Challenges',
    descriptionTerms: [
      'choose a challenge',
      'solution in the browser',
      'run tests',
      'follow-up questions',
      'JavaScript',
      'React',
      'Angular',
      'Vue',
      'HTML',
      'CSS',
    ],
    bodyTerms: [
      'Frontend Coding Challenges',
      'Real prompts',
      'Starter code',
      'Tests',
      'JavaScript coding challenges',
      'React UI challenges',
      'Angular challenges',
      'Vue challenges',
      'HTML/CSS implementation exercises',
    ],
  },
  {
    route: '/interview-questions',
    title: 'Frontend Interview Questions & Answers: Practice by Topic',
    h1: 'Frontend Interview Questions',
    descriptionTerms: ['framework', 'interview round', 'coding', 'testing', 'debugging', 'UI implementation', 'system design', 'questions and answers'],
  },
  {
    route: '/machine-coding',
    title: 'Frontend Machine Coding Interview Questions',
    h1: 'Frontend Machine Coding Interview Questions',
    descriptionTerms: [
      'frontend machine coding',
      'UI coding interview questions',
      'React',
      'Angular',
      'Vue',
      'guided study plans',
    ],
    bodyTerms: [
      'frontend UI coding rounds',
      'Start UI coding practice',
      'Start 30-day plan',
      'JavaScript utility rounds',
      'React machine coding',
      'System design follow-up',
      'Turn frontend machine coding into guided practice',
    ],
  },
  {
    route: '/javascript/interview-questions',
    title: 'JavaScript Interview Questions and Answers: Async & Closures',
    h1: 'JavaScript Interview Questions and Answers',
    descriptionTerms: [
      '41 JavaScript interview questions and answers',
      'frontend developers',
      'closures',
      'async/await',
      'event loop',
      'output tracing',
      'DOM',
      'security',
      'scenarios',
    ],
    bodyTerms: [
      'Review 41 JavaScript interview questions and answers for beginner-to-experienced frontend developers, covering closures, Promises, async/await, the event loop, output tracing, DOM APIs, browser security, and coding scenarios.',
      'JavaScript interview questions and answers: beginner to advanced',
    ],
  },
  {
    route: '/react/interview-questions',
    title: 'React Interview Questions and Answers: Hooks & React 19',
    h1: 'React Interview Questions and Answers',
    descriptionTerms: [
      '66 React interview questions and answers',
      'frontend developers',
      'hooks',
      'state',
      'React 19',
      'Server Components',
      'testing',
      'performance',
      'code scenarios',
    ],
  },
  {
    route: '/angular/interview-questions',
    title: 'Angular Interview Questions and Answers: RxJS & Signals',
    h1: 'Angular Interview Questions and Answers',
    descriptionTerms: [
      '65 Angular interview questions and answers',
      'frontend developers',
      'RxJS',
      'signals',
      'change detection',
      'DI',
      'testing',
      'performance',
      'code scenarios',
    ],
    bodyTerms: [
      'Review 65 Angular interview questions and answers for beginner-to-experienced frontend developers, covering RxJS, signals, change detection, dependency injection, testing, performance, and code scenarios.',
      'Angular interview questions and answers: beginner to advanced',
      'Modern Angular interview questions and answers',
    ],
  },
  {
    route: '/vue/interview-questions',
    title: 'Vue.js Interview Questions and Answers: Vue 3 & Pinia',
    h1: 'Vue.js Interview Questions and Answers',
    descriptionTerms: [
      '65 Vue.js interview questions and answers',
      'frontend developers',
      'Vue 3',
      'Composition API',
      'reactivity',
      'Pinia',
      'Router',
      'testing',
      'performance',
      'scenarios',
    ],
  },
  {
    route: '/html-css/interview-questions',
    title: 'HTML & CSS Interview Questions and Answers',
    h1: 'HTML and CSS Interview Questions and Answers',
    descriptionTerms: [
      'semantic HTML',
      'accessibility',
      'forms',
      'layout',
      'browser behavior',
      'responsive UI',
      'code scenarios',
    ],
  },
  {
    route: '/html/interview-questions',
    title: 'HTML Interview Questions: 65 Q&A',
    h1: 'HTML Interview Questions and Answers',
    descriptionTerms: [
      'frontend developers',
      'beginner-to-advanced',
      'semantic HTML',
      'forms',
      'accessibility',
      'ARIA',
      'DOM',
      'metadata',
      'scenarios',
    ],
  },
  {
    route: '/css/interview-questions',
    title: 'CSS Interview Questions: 65 Q&A',
    h1: 'CSS Interview Questions and Answers',
    descriptionTerms: [
      'frontend developers',
      'beginner-to-advanced',
      'specificity',
      'cascade',
      'Flexbox',
      'Grid',
      'responsive CSS',
      'debugging',
      'performance',
    ],
  },
  {
    route: '/css/coding/css-flexbox-navbar',
    title: 'Build Responsive Navbar with CSS Flexbox',
    h1: 'Build a Responsive Navbar with CSS Flexbox',
    canonical: 'https://frontendatlas.com/css/coding/css-flexbox-navbar',
    robotsMustNotInclude: ['noindex'],
    googlebotMustNotInclude: ['noindex'],
    schemaTypes: ['BreadcrumbList', 'TechArticle', 'HowTo', 'FAQPage'],
    descriptionTerms: [
      'CSS Flexbox navbar challenge',
      'align brand',
      'links',
      'CTA',
      'mobile layout',
      'interview trade-offs',
    ],
    bodyTerms: [
      'Practice a realistic frontend interview prompt',
      'Acceptance criteria',
      'Common mistakes',
      'flex-wrap',
      'margin-left: auto',
      'focus',
      'No JavaScript',
    ],
  },
  {
    route: '/css/trivia/css-position-sticky-not-working',
    title: 'CSS Sticky Not Working? 5 Causes and Fixes',
    h1: 'CSS position: sticky not working? Diagnose the root cause',
    canonical: 'https://frontendatlas.com/css/trivia/css-position-sticky-not-working',
    robotsMustNotInclude: ['noindex'],
    googlebotMustNotInclude: ['noindex'],
    schemaTypes: ['BreadcrumbList', 'Article'],
    descriptionTerms: [
      'CSS position: sticky failures',
      'five broken layouts',
      'overflow',
      'insets',
      'container height',
      'flex/grid stretch',
      'test the fix',
    ],
    bodyTerms: [
      'Interactive CSS debugging lab',
      'Missing inset',
      'Unexpected scroll container',
      'No travel room',
      'Flex or grid stretch',
      'Hidden behind another layer',
      'CSS positioning model',
      'z-index',
    ],
  },
  {
    route: '/system-design',
    title: 'Frontend System Design Interview: Questions & Practice',
    h1: 'Frontend System Design Interview: Questions & Practice',
    descriptionTerms: ['guided questions', 'worked examples', 'RADIO drills', 'UI architecture', 'scoring rubrics', 'trade-offs'],
    bodyTerms: [
      'What gets tested',
      'Question formats',
      'RADIO',
      'Common frontend system design interview questions',
      'Common mistakes',
      'frontend system design interview preparation',
      'Frontend system design interview rubric',
      'Frontend system design prompt bank',
      'Infinite Scroll System Design: Frontend Interview Answer',
      'Design a Toast Notification System',
    ],
  },
  {
    route: '/guides/interview-blueprint/system-design',
    title: 'Frontend System Design Interview Preparation Guide',
    h1: 'Frontend System Design Interview Preparation Guide',
    descriptionTerms: ['round format', 'question types', 'evaluation rubric', 'practice plan', 'realistic prompts'],
    bodyTerms: [
      'What frontend system design interviews test',
      'Frontend vs backend system design interview scope',
      'Frontend system design interview format',
      'Preparation plan',
      'Readiness checklist',
      'Frontend system design interview rubric',
      'Common mistakes',
      'Practice map',
      'Mock interview loop',
      'Use the RADIO framework for the 45-minute answer',
      'Browse frontend system design interview questions',
    ],
  },
  {
    route: '/guides/interview-blueprint',
    title: 'Frontend Interview Playbook',
    h1: 'Frontend Interview Playbook',
    descriptionTerms: ['coding', 'ui', 'system design', 'behavioral'],
  },
  {
    route: '/guides/framework-prep',
    title: 'Frontend Framework Interview Preparation Roadmap',
    h1: 'Frontend Framework Interview Preparation Roadmap',
    descriptionTerms: ['JavaScript', 'React', 'Angular', 'Vue', 'frontend interview preparation roadmap'],
    bodyTerms: [
      'Choose your framework prep path',
      '7/14/30-day framework prep roadmap',
      'Common framework interview mistakes',
      'React interview preparation',
      'Angular interview preparation',
      'Vue interview preparation',
      'JavaScript interview prep path',
      'which frontend framework should I prepare for interviews',
      'React interview preparation roadmap',
      'React machine coding interview preparation',
      'Angular interview prep RxJS change detection DI',
      'Vue interview prep reactivity component communication',
      '30 day frontend interview preparation roadmap',
      'senior frontend framework interview preparation',
      'when to move from framework prep to frontend system design',
    ],
  },
  {
    route: '/guides/system-design-blueprint/radio-framework',
    title: 'RADIO Framework: 45-Minute Frontend System Design Template',
    h1: 'RADIO Framework: Frontend System Design Interview Template',
    descriptionTerms: ['RADIO framework', 'frontend system design', '45-minute interview script', 'diagram checklist', 'worked autocomplete example'],
    bodyTerms: [
      'RADIO = Requirements, Architecture, Data, Interface, Optimizations',
      'RADIO is a frontend system design interview framework',
      'Use it when the prompt is broad, like "design autocomplete", "design a news feed", or "design chat"',
      'The meaning of RADIO',
      'Copyable 45-minute answer script',
      'Turn a broad prompt into a complete frontend system design interview answer',
      'Use RADIO to clarify scope, sketch architecture, define data and interface contracts',
      'Quick answer',
      'Source and FrontendAtlas adaptation',
      'The RADIO mnemonic was created by Yangshun Tay and published by GreatFrontEnd',
      'FrontendAtlas does not redefine the mnemonic',
      'When not to overuse RADIO',
      'How to answer a frontend system design interview in 45 minutes',
      'Frontend system design checklist',
      'Example: Answer autocomplete with RADIO',
      'Run RADIO on common frontend system design prompts',
    ],
  },
  {
    route: '/tracks',
    title: 'Frontend Interview Study Plans: 7-Day & 30-Day Tracks',
    h1: 'Frontend Interview Study Plans: 7-Day & 30-Day Tracks',
    descriptionTerms: ['frontend interview study plans', '7 or 30 days', 'coding', 'JavaScript', 'system design', 'company prep'],
    bodyTerms: [
      'frontend interview study plan',
      'frontend interview preparation roadmap',
      '7-day frontend interview prep',
      '30-day frontend interview preparation',
      'what to practice each week',
      'Common study-plan mistakes',
    ],
  },
  {
    route: '/tracks/crash-7d/preview',
    title: '7-Day Frontend Interview Prep Plan',
    h1: 'Crash Track',
    descriptionTerms: ['7-day frontend interview prep plan', 'JavaScript concepts', 'UI coding', 'system design review', 'sample questions'],
    bodyTerms: [
      '7-day frontend interview prep',
      'frontend interview crash plan',
      'day-by-day plan',
      'JavaScript timing and utilities',
      'Frontend system design warm-up',
    ],
  },
  {
    route: '/tracks/foundations-30d/preview',
    title: '30-Day Frontend Interview Preparation Roadmap',
    h1: 'Foundations Track',
    descriptionTerms: ['30-day frontend interview preparation roadmap', 'JavaScript', 'UI coding', 'framework Q&A', 'system design', 'company prep'],
    bodyTerms: [
      '30-day frontend interview preparation',
      'frontend interview preparation roadmap',
      'week-by-week roadmap',
      'JavaScript fundamentals and browser basics',
      'Mock rounds and company prep',
    ],
  },
  {
    route: '/companies',
    title: 'Company Frontend Interview Questions',
    h1: 'Company Frontend Interview Questions',
    descriptionTerms: ['coding', 'concept', 'system design'],
  },
];

const PUBLISH_COPY_CONTRACTS = [
  {
    route: '/',
    title: 'Frontend Interview Prep: Questions, Coding & System Design',
    description: 'Start with a study plan, then practice coding, UI implementation, system design, and behavioral questions in one workflow.',
  },
  {
    route: '/coding',
    title: 'Frontend Coding Challenges for Interview Practice',
    description: 'Choose a challenge, write the solution in the browser, run tests, and review follow-up questions for JavaScript, React, Angular, Vue, HTML, or CSS.',
  },
  {
    route: '/interview-questions',
    title: 'Frontend Interview Questions & Answers: Practice by Topic',
    description: 'Choose a framework or interview round, then practice coding, testing, debugging, UI implementation, and system design questions and answers.',
  },
  {
    route: '/html-css/interview-questions',
    title: 'HTML & CSS Interview Questions and Answers',
    description: 'Expect semantic HTML, accessibility, forms, layout, browser behavior, responsive UI, and code scenarios in HTML/CSS interview rounds.',
  },
  {
    route: '/guides/interview-blueprint/intro',
    title: 'Frontend Interview Prep Guide (2026): Roadmap & Rounds',
    description: 'Start with core questions and coding, add system design and behavioral practice, then follow the 30-day roadmap.',
  },
  {
    route: '/javascript/trivia/js-compare-two-objects',
    title: 'Compare Two Objects in JavaScript: Shallow vs Deep',
    description: 'Use === for the same reference, compare top-level keys for flat objects, and use deep equality for nested values; do not rely on JSON.stringify.',
  },
  {
    route: '/angular/trivia/angular-lifecycle-constructor-oninit-afterviewinit-dom',
    title: 'constructor vs ngOnInit vs ngAfterViewInit in Angular',
    description: 'Use constructor for DI, ngOnInit for input-based setup, and ngAfterViewInit for DOM or default ViewChild access.',
  },
  {
    route: '/html/trivia/html-href-attribute',
    title: 'HTML href Attribute: Definition, Uses & Examples',
    description: 'Use href to set where a link or linked resource points: an absolute or relative URL, a #fragment, an email address, or a file.',
  },
  {
    route: '/angular/trivia/rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use',
    title: 'switchMap vs mergeMap vs concatMap vs exhaustMap in Angular',
    description: 'Use switchMap for latest-only work, mergeMap for parallel work, concatMap for ordered work, and exhaustMap to ignore repeat triggers.',
  },
  {
    route: '/angular/trivia/angular-forroot-forchild',
    title: 'Angular forRoot vs forChild: When to Use Each',
    description: 'In legacy NgModule apps, call forRoot() once for root providers or routing; use forChild() in feature modules to avoid a second singleton.',
  },
  {
    route: '/vue/trivia/vue-provide-inject-vs-prop-drilling-tradeoffs',
    title: 'Vue provide/inject vs Prop Drilling: When to Use Each',
    description: 'Use props for explicit parent-child data, provide/inject for deep shared dependencies, and Pinia for app-wide state.',
  },
];

function includesPhrase(value, phrase) {
  return normalizeText(value).toLowerCase().includes(normalizeText(phrase).toLowerCase());
}

const files = collectHtmlFiles(BUILD_DIR);
if (!files.length) {
  console.error(`[seo:meta-check] No prerendered HTML files found under ${BUILD_DIR}`);
  process.exit(1);
}

const pages = files.map((file) => parseSeoPage(fs.readFileSync(file, 'utf8'), toRoute(file)));
const { failures, warnings } = auditSeoPages(pages, { siteOrigin: CANONICAL_BASE, strictH1: STRICT_H1 });
const sitemapFiles = fs.readdirSync(BUILD_DIR).filter((name) => /^sitemap-\d+\.xml$/.test(name));
if (!sitemapFiles.length) throw new Error('Build has no sitemap shards. Run npm run build.');
const sitemapDates = new Map(sitemapFiles.flatMap((name) => [...sitemapDatesFromXml(fs.readFileSync(path.join(BUILD_DIR, name), 'utf8'))]));
failures.push(...auditContentDateParity(pages, sitemapDates));
const pagesByRoute = new Map(pages.map((page) => [page.route, page]));

for (const contract of criticalRouteContracts) {
  const page = pagesByRoute.get(contract.route);
  if (!page) {
    failures.push({ route: contract.route, code: 'keywordContract', message: 'missing prerendered HTML' });
    continue;
  }

  const missing = [];
  if (!includesPhrase(page.title, contract.title)) missing.push(`title lacks "${contract.title}"`);
  if (!includesPhrase(page.h1, contract.h1)) missing.push(`h1 lacks "${contract.h1}"`);
  if (contract.canonical && page.canonical !== contract.canonical) {
    missing.push(`canonical is "${page.canonical || '(missing)'}", expected "${contract.canonical}"`);
  }
  for (const term of contract.robotsMustNotInclude || []) {
    if (includesPhrase(page.robots, term)) missing.push(`robots includes "${term}"`);
  }
  for (const term of contract.googlebotMustNotInclude || []) {
    if (includesPhrase(page.googlebot, term)) missing.push(`googlebot includes "${term}"`);
  }
  for (const type of contract.schemaTypes || []) {
    if (!page.schemaTypes.has(type)) missing.push(`jsonLd lacks "${type}"`);
  }
  for (const term of contract.descriptionTerms || []) {
    if (!includesPhrase(page.description, term)) missing.push(`description lacks "${term}"`);
  }
  for (const term of contract.bodyTerms || []) {
    if (!includesPhrase(page.documentText, term)) missing.push(`body lacks "${term}"`);
  }
  if (missing.length) failures.push({ route: contract.route, code: 'keywordContract', message: missing.join('; ') });
}

for (const contract of PUBLISH_COPY_CONTRACTS) {
  const page = pagesByRoute.get(contract.route);
  if (!page) {
    failures.push({ route: contract.route, code: 'publishCopyContract', message: 'missing prerendered HTML' });
    continue;
  }

  const missing = [];
  for (const [field, actual, expected] of [
    ['title', page.title, contract.title],
    ['description', page.description, contract.description],
    ['og:title', page.ogTitle, contract.title],
    ['og:description', page.ogDescription, contract.description],
    ['twitter:title', page.twitterTitle, contract.title],
    ['twitter:description', page.twitterDescription, contract.description],
  ]) {
    if (actual !== expected) missing.push(`${field} differs from the publish-copy contract`);
  }

  const expectedCanonical = new URL(contract.route, CANONICAL_BASE).href;
  if (page.canonical !== expectedCanonical) {
    missing.push(`canonical is "${page.canonical || '(missing)'}", expected "${expectedCanonical}"`);
  }
  if (!/^index\s*,\s*follow$/i.test(page.robots)) {
    missing.push(`robots is "${page.robots || '(missing)'}", expected "index,follow"`);
  }
  if (page.ogUrl !== expectedCanonical) {
    missing.push(`og:url is "${page.ogUrl || '(missing)'}", expected "${expectedCanonical}"`);
  }

  if (missing.length) failures.push({ route: contract.route, code: 'publishCopyContract', message: missing.join('; ') });
}

console.log(`[seo:meta-check] pages scanned: ${files.length}`);
console.log(`[seo:meta-check] failures: ${failures.length}; warnings: ${warnings.length}`);
for (const [label, issues] of [['failure', failures], ['warning', warnings]]) {
  const grouped = new Map();
  for (const issue of issues) {
    const entries = grouped.get(issue.code) || [];
    entries.push(issue);
    grouped.set(issue.code, entries);
  }
  for (const [code, entries] of grouped) {
    console.log(`[seo:meta-check] ${label} ${code}: ${entries.length}`);
    for (const issue of entries.slice(0, 10)) {
      console.log(`[seo:meta-check] ${issue.route}: ${issue.message}`);
    }
  }
}
if (failures.length) process.exit(1);
