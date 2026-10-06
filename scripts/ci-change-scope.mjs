import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Keep frontend dependencies broad: shared auth, editors, assets and generated
// content can affect Interview even when its feature directory is untouched.
const SHARED_PREFIXES = ['frontend/', 'cdn/', 'content-drafts/', 'scripts/', '.github/'];
const SHARED_FILES = new Set([
    '.nvmrc', '.node-version', '.npmrc', '.tool-versions', '.gitattributes',
    'package.json', 'package-lock.json', 'npm-shrinkwrap.json',
]);
const COMMIT_SHA = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i;

export function classifyPaths(paths) {
    let ui = false;
    let interview = false;
    for (const path of paths) {
        const shared = SHARED_FILES.has(path)
            || SHARED_PREFIXES.some((prefix) => path.startsWith(prefix));
        ui ||= shared;
        interview ||= shared || path.startsWith('backend/');
    }
    return { ui, interview };
}

function git(args, cwd) {
    return execFileSync('git', args, {
        cwd,
        encoding: 'utf8',
        maxBuffer: 32 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'],
    });
}

export function changedPaths(base, head, cwd = process.cwd()) {
    for (const [name, sha] of [['base', base], ['head', head]]) {
        if (typeof sha !== 'string' || !COMMIT_SHA.test(sha)) {
            throw new Error(`--${name} must be a full commit SHA`);
        }
        // Fail closed if history was not fetched. Never turn a bad diff into a
        // successful "no changes" decision that silently skips required suites.
        git(['rev-parse', '--verify', `${sha}^{commit}`], cwd);
    }

    const output = git([
        'diff', '--no-ext-diff', '--no-textconv', '--name-status', '-z', '--find-renames',
        base, head, '--',
    ], cwd);
    if (!output) return [];

    const fields = output.split('\0');
    if (fields.pop() !== '') throw new Error('Unexpected unterminated git diff output');
    const paths = [];
    for (let index = 0; index < fields.length;) {
        const status = fields[index++];
        if (!/^[ACDMRTUXB][0-9]*$/.test(status)) {
            throw new Error(`Unexpected git diff status: ${status}`);
        }
        const pathCount = /^[RC]/.test(status) ? 2 : 1;
        for (let count = 0; count < pathCount; count++) {
            const path = fields[index++];
            if (!path) throw new Error('Missing path in git diff output');
            // Both sides of a rename matter: moving a frontend file into docs
            // still removes application code and must run the relevant suites.
            paths.push(path);
        }
    }
    return paths;
}

export function main(args = process.argv.slice(2), env = process.env) {
    let all = false;
    const refs = {};
    for (let index = 0; index < args.length; index++) {
        const arg = args[index];
        if (arg === '--all' && !all) {
            all = true;
        } else if ((arg === '--base' || arg === '--head') && !Object.hasOwn(refs, arg)) {
            refs[arg] = args[++index];
        } else {
            throw new Error(`Unknown or repeated argument: ${arg}`);
        }
    }
    if (all && Object.keys(refs).length) {
        throw new Error('--all cannot be combined with --base or --head');
    }

    const scope = all ? { ui: true, interview: true }
        : classifyPaths(changedPaths(refs['--base'], refs['--head']));
    const output = `ui=${scope.ui}\ninterview=${scope.interview}\n`;
    if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, output);
    process.stdout.write(output);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    try {
        main();
    } catch (error) {
        console.error(`CI change scope failed: ${error.message}`);
        process.exitCode = 1;
    }
}
