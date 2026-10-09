'use strict';

const js = require('@eslint/js');
const globals = require('globals');

// Static safety net for the Express backend: catches undefined identifiers,
// dead variables and other recommended-rule mistakes that tests only reach
// when the broken branch executes.
module.exports = [
  { ignores: ['node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', {
        args: 'after-used',
        argsIgnorePattern: '^_',
        caughtErrors: 'none',
        ignoreRestSiblings: true,
      }],
    },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: { sourceType: 'module' },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
  },
];
