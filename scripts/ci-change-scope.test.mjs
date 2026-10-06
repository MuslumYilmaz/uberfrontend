import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { changedPaths, classifyPaths } from './ci-change-scope.mjs';

const script = fileURLToPath(new URL('./ci-change-scope.mjs', import.meta.url));

test('shared frontend, content and CI dependencies run both suites', () => {
    for (const path of [
        'frontend/src/app/features/interview/interview.component.ts',
        'frontend/src/app/core/services/auth.service.ts',
        'frontend/src/app/shared/ui/button/button.scss',
        'frontend/src/app/features/coding/editor.ts',
        'frontend/package-lock.json', 'frontend/patches/library.patch',
        'frontend/e2e/interview-mode.spec.ts',
        'cdn/questions/javascript/example.json',
        'content-drafts/interview/example.md',
        'scripts/ci-change-scope.mjs',
        '.github/workflows/playwright.yml', '.github/actions/build/action.yml',
        '.nvmrc', '.npmrc', '.gitattributes', 'package-lock.json',
    ]) {
        assert.deepEqual(classifyPaths([path]), { ui: true, interview: true }, path);
    }
});

test('backend changes retain Interview coverage without frontend-only UI jobs', () => {
    for (const path of ['backend/server.js', 'backend/package-lock.json', 'backend/content/interview/bank.json']) {
        assert.deepEqual(classifyPaths([path]), { ui: false, interview: true }, path);
    }
});

test('unrelated documentation and an empty diff skip both suites', () => {
    assert.deepEqual(classifyPaths([
        'README.md', 'AGENTS.md', 'docs/ai-context/testing.md',
        'docs/references/interview-mode-release-record.md',
        'docs/security/npm-audit-allowlist.json',
        'content-reviews/interview.md', 'frontend-notes.md',
    ]), { ui: false, interview: false });
    assert.deepEqual(classifyPaths([]), { ui: false, interview: false });
});

function repository(t) {
    const cwd = mkdtempSync(join(tmpdir(), 'ci-change-scope-'));
    t.after(() => rmSync(cwd, { recursive: true, force: true }));
    const git = (...args) => execFileSync('git', args, {
        cwd,
        encoding: 'utf8',
        env: {
            ...process.env,
            GIT_AUTHOR_NAME: 'CI scope test', GIT_AUTHOR_EMAIL: 'ci@example.invalid',
            GIT_COMMITTER_NAME: 'CI scope test', GIT_COMMITTER_EMAIL: 'ci@example.invalid',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    const write = (path, text) => {
        mkdirSync(dirname(join(cwd, path)), { recursive: true });
        writeFileSync(join(cwd, path), text);
    };
    const commit = () => {
        git('add', '--all');
        git('-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', 'commit', '--allow-empty', '-m', 'fixture');
        return git('rev-parse', 'HEAD');
    };
    git('init');
    return { cwd, git, write, commit };
}

test('diff includes deleted code and both rename endpoints, including unusual path characters', (t) => {
    const repo = repository(t);
    const moved = 'frontend/src/old name\nwith-tab\t.ts';
    repo.write(moved, 'export const moved = 1;\n');
    repo.write('backend/deleted.js', 'module.exports = 2;\n');
    const base = repo.commit();
    mkdirSync(join(repo.cwd, 'docs'), { recursive: true });
    renameSync(join(repo.cwd, moved), join(repo.cwd, 'docs/moved.txt'));
    rmSync(join(repo.cwd, 'backend/deleted.js'));
    const head = repo.commit();
    const paths = changedPaths(base, head, repo.cwd);
    assert.deepEqual(new Set(paths), new Set([moved, 'docs/moved.txt', 'backend/deleted.js']));
    assert.deepEqual(classifyPaths(paths), { ui: true, interview: true });
    assert.deepEqual(changedPaths(head, head, repo.cwd), []);
});

test('CLI writes the same successful decision to stdout and GITHUB_OUTPUT', (t) => {
    const repo = repository(t);
    repo.write('README.md', 'initial\n');
    const base = repo.commit();
    repo.write('README.md', 'documentation update\n');
    const head = repo.commit();
    const outputPath = join(repo.cwd, 'actions-output');
    writeFileSync(outputPath, 'existing=value\n');
    const result = spawnSync(process.execPath, [script, '--base', base, '--head', head], {
        cwd: repo.cwd, encoding: 'utf8', env: { ...process.env, GITHUB_OUTPUT: outputPath },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, 'ui=false\ninterview=false\n');
    assert.equal(readFileSync(outputPath, 'utf8'), `existing=value\n${result.stdout}`);
});

test('--all runs both suites without requiring a Git checkout', (t) => {
    const cwd = mkdtempSync(join(tmpdir(), 'ci-change-scope-all-'));
    t.after(() => rmSync(cwd, { recursive: true, force: true }));
    const outputPath = join(cwd, 'actions-output');
    const result = spawnSync(process.execPath, [script, '--all'], {
        cwd, encoding: 'utf8', env: { ...process.env, GITHUB_OUTPUT: outputPath },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, 'ui=true\ninterview=true\n');
    assert.equal(readFileSync(outputPath, 'utf8'), result.stdout);
});

test('invalid/missing refs and invalid options fail without emitting skip outputs', (t) => {
    const repo = repository(t);
    const sha = repo.commit();
    const outputPath = join(repo.cwd, 'actions-output');
    for (const args of [
        [], ['--base', sha], ['--head', sha],
        ['--base', '--help', '--head', sha],
        ['--base', '0'.repeat(40), '--head', sha],
        ['--base', sha, '--head', 'f'.repeat(40)],
        ['--base', sha, '--head', sha, '--base', sha],
        ['--all', '--head', sha], ['--all', '--all'], ['--unexpected'],
    ]) {
        writeFileSync(outputPath, 'existing=value\n');
        const result = spawnSync(process.execPath, [script, ...args], {
            cwd: repo.cwd, encoding: 'utf8', env: { ...process.env, GITHUB_OUTPUT: outputPath },
        });
        assert.equal(result.status, 1, JSON.stringify(args));
        assert.match(result.stderr, /CI change scope failed:/);
        assert.equal(result.stdout, '');
        assert.equal(readFileSync(outputPath, 'utf8'), 'existing=value\n');
    }
});
