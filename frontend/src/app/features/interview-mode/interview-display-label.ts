const ACRONYMS: Record<string, string> = {
  javascript: 'JavaScript', typescript: 'TypeScript',
  html: 'HTML', css: 'CSS', js: 'JS', api: 'API', apis: 'APIs', dom: 'DOM',
  url: 'URL', urls: 'URLs', aria: 'ARIA', http: 'HTTP', https: 'HTTPS', json: 'JSON',
  jsx: 'JSX', ts: 'TS', ui: 'UI', ux: 'UX', ssr: 'SSR', seo: 'SEO',
};

/** Presentation only: keep source identifiers unchanged in requests and results. */
export function interviewDisplayLabel(value: string): string {
  const words = value.trim().replace(/[-_]+/g, ' ').split(/\s+/);
  return words.map((word, index) => ACRONYMS[word.toLowerCase()]
    ?? (index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word)).join(' ');
}
