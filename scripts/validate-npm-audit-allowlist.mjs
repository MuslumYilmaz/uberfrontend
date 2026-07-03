import { readFileSync } from 'node:fs';

const SEVERITY_RANK = {
    info: 0,
    low: 1,
    moderate: 2,
    high: 3,
    critical: 4,
};

function parseArgs(argv) {
    const args = {};
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (!arg.startsWith('--')) continue;
        args[arg.slice(2)] = argv[index + 1];
        index += 1;
    }
    return args;
}

function readJson(path) {
    return JSON.parse(readFileSync(path, 'utf8'));
}

function rank(severity) {
    return SEVERITY_RANK[String(severity || '').toLowerCase()] ?? -1;
}

function isExpired(expires) {
    if (!expires) return true;
    const expiry = new Date(`${expires}T23:59:59.999Z`);
    if (Number.isNaN(expiry.getTime())) return true;
    return Date.now() > expiry.getTime();
}

const args = parseArgs(process.argv.slice(2));
if (!args.audit || !args.allowlist || !args.workspace) {
    console.error('Usage: node scripts/validate-npm-audit-allowlist.mjs --audit <audit.json> --allowlist <allowlist.json> --workspace <name>');
    process.exit(2);
}

const audit = readJson(args.audit);
const allowlist = readJson(args.allowlist);
const entries = new Map(
    (allowlist.entries || [])
        .filter((entry) => entry.workspace === args.workspace)
        .map((entry) => [entry.package, entry])
);

const vulnerabilities = Object.values(audit.vulnerabilities || {});
const failures = [];
const allowed = [];

for (const vulnerability of vulnerabilities) {
    const severity = String(vulnerability.severity || '').toLowerCase();
    const severityRank = rank(severity);
    if (severityRank < SEVERITY_RANK.high) continue;

    const name = vulnerability.name;
    const entry = entries.get(name);

    if (severityRank >= SEVERITY_RANK.critical) {
        failures.push(`${name}: critical vulnerabilities are never allowlisted`);
        continue;
    }

    if (!entry) {
        failures.push(`${name}: ${severity} vulnerability is not allowlisted`);
        continue;
    }

    if (isExpired(entry.expires)) {
        failures.push(`${name}: allowlist expired on ${entry.expires || '(missing expiry)'}`);
        continue;
    }

    if (rank(entry.maxSeverity || entry.severity) < severityRank) {
        failures.push(`${name}: allowlist max severity ${entry.maxSeverity || entry.severity} does not cover ${severity}`);
        continue;
    }

    allowed.push(`${name} (${severity}, expires ${entry.expires})`);
}

if (allowed.length) {
    console.warn(`Allowed ${args.workspace} npm audit findings:`);
    for (const item of allowed) {
        console.warn(`- ${item}`);
    }
}

if (failures.length) {
    console.error(`${args.workspace} npm audit has unapproved high/critical vulnerabilities:`);
    for (const failure of failures) {
        console.error(`- ${failure}`);
    }
    process.exit(1);
}

console.log(`${args.workspace} npm audit high/critical findings are within policy.`);
