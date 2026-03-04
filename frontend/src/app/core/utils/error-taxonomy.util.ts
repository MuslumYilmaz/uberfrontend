import type { FailureCategory } from '../models/editor-assist.model';

type Rule = {
  category: FailureCategory;
  re: RegExp;
};

const RULES: Rule[] = [
  { category: 'missing-return', re: /expected\s+undefined\s+to\s+be/i },
  { category: 'undefined-access', re: /cannot\s+read\s+propert(?:y|ies).+undefined/i },
  { category: 'wrong-function-call', re: /is\s+not\s+a\s+function/i },
  { category: 'type-mismatch', re: /typeerror|cannot\s+convert|invalid\s+type/i },
  { category: 'off-by-one', re: /(index|length|bounds).*(expected|received)|off[-\s]?by[-\s]?one/i },
  { category: 'async-promise-mismatch', re: /(promise|async|await|reject|resolve|thenable)/i },
  { category: 'reference-error', re: /referenceerror|is\s+not\s+defined/i },
  { category: 'assertion-mismatch', re: /expected\s+.+\s+to\s+(equal|be|deeply\s+equal)/i },
  { category: 'syntax-error', re: /syntaxerror|unexpected\s+token|unterminated/i },
  { category: 'timeout', re: /timed?\s*out|timeout/i },
  { category: 'mutability-side-effect', re: /(mutat|side[-\s]?effect|shared\s+state)/i },
  { category: 'edge-case', re: /(empty|null|undefined|nan|infinite|edge\s+case)/i },
];

export function classifyFailureCategory(input: unknown): FailureCategory {
  const text = String(input || '');
  for (const rule of RULES) {
    if (rule.re.test(text)) return rule.category;
  }
  return 'unknown';
}
