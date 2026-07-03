import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const WORKFLOW_DIR = '.github/workflows';
const SHA_REF_PATTERN = /^[a-f0-9]{40}$/i;
const DOCKER_DIGEST_PATTERN = /^docker:\/\/.+@sha256:[a-f0-9]{64}$/i;

function listWorkflowFiles() {
    return readdirSync(WORKFLOW_DIR)
        .filter((name) => /\.ya?ml$/i.test(name))
        .map((name) => join(WORKFLOW_DIR, name));
}

function stripInlineComment(value) {
    let quote = null;
    for (let index = 0; index < value.length; index += 1) {
        const char = value[index];
        if ((char === '"' || char === "'") && value[index - 1] !== '\\') {
            quote = quote === char ? null : quote || char;
        }
        if (char === '#' && quote === null) {
            return value.slice(0, index).trim();
        }
    }
    return value.trim();
}

function normalizeUsesValue(rawValue) {
    return stripInlineComment(rawValue).replace(/^['"]|['"]$/g, '').trim();
}

function validateUsesRef(value) {
    if (!value) return 'empty uses value';
    if (value.startsWith('./') || value.startsWith('../')) return null;
    if (value.startsWith('docker://')) {
        return DOCKER_DIGEST_PATTERN.test(value) ? null : 'docker action is not pinned to a sha256 digest';
    }

    const atIndex = value.lastIndexOf('@');
    if (atIndex === -1) return 'missing @<full-commit-sha> ref';

    const ref = value.slice(atIndex + 1);
    if (!SHA_REF_PATTERN.test(ref)) {
        return `ref "${ref}" is not a full 40-character commit SHA`;
    }

    return null;
}

const failures = [];

for (const file of listWorkflowFiles()) {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
        const match = line.match(/^\s*uses:\s*(.+)$/);
        if (!match) return;

        const value = normalizeUsesValue(match[1]);
        const error = validateUsesRef(value);
        if (error) {
            failures.push(`${file}:${index + 1} uses: ${value} (${error})`);
        }
    });
}

if (failures.length) {
    console.error('Unpinned GitHub Actions references found:');
    for (const failure of failures) {
        console.error(`- ${failure}`);
    }
    process.exit(1);
}

console.log('All GitHub Actions uses references are pinned to immutable SHAs.');
