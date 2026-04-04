'use strict';

const DEFAULT_OPTIONS = {
  bannedPhrases: [
    {
      pattern: /\bit is important to note\b/gi,
      message: 'State the point directly instead of announcing that it is important.',
    },
    {
      pattern: /\blet(?:'|’)s dive (?:in|into)\b/gi,
      message: 'Skip generic scene-setting and open with the actual point.',
    },
    {
      pattern: /\bsimply put\b/gi,
      message: 'Prefer a direct explanation over filler transitions like “simply put”.',
    },
    {
      pattern: /\bin conclusion\b/gi,
      message: 'Avoid generic wrap-ups; end with a concrete takeaway instead.',
    },
    {
      pattern: /\bremember that\b/gi,
      message: 'Replace “remember that” with the concrete thing the reader should do or notice.',
    },
  ],
  sentenceWordLimit: 120,
};

function countWords(value) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

function reporter(context, userOptions = {}) {
  const options = {
    ...DEFAULT_OPTIONS,
    ...userOptions,
  };
  const { Syntax, RuleError, report, getSource } = context;

  return {
    [Syntax.Str](node) {
      const text = getSource(node);
      if (!text || !text.trim()) return;

      options.bannedPhrases.forEach(({ pattern, message }) => {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(text))) {
          report(node, new RuleError(message, { index: match.index }));
        }
      });

      const sentencePattern = /[^.!?]+[.!?]?/g;
      let sentenceMatch;
      while ((sentenceMatch = sentencePattern.exec(text))) {
        const sentence = sentenceMatch[0].trim();
        if (!sentence) continue;
        const words = countWords(sentence);
        if (words <= options.sentenceWordLimit) continue;

        report(
          node,
          new RuleError(
            `Sentence is too long (${words} words). Split it into a tighter explanation.`,
            { index: sentenceMatch.index },
          ),
        );
      }
    },
  };
}

module.exports = {
  linter: reporter,
  fixer: reporter,
};
