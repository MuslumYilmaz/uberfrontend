#!/usr/bin/env node
import crypto from "crypto";
import fg from "fast-glob";
import fs from "fs/promises";
import path from "path";
import { cdnDataVersionPath, frontendRoot, repoRoot } from "./content-paths.mjs";

const projectRoot = frontendRoot;
const CHECK = process.argv.includes("--check");

// pick the files that should bump the data version when they change
const globs = [
    "../cdn/questions/**/*.{json,md}",
    "../cdn/incidents/**/*.{json,md}",
    "../cdn/tradeoff-battles/**/*.{json,md}",
    "../cdn/practice/**/*.{json,md}",
    "src/app/**/*.ts",
    "package.json",
    "angular.json"
];

// resolve the file list relative to projectRoot
const files = await fg(globs, { cwd: projectRoot, dot: false });

// compute a short hash
const h = crypto.createHash("sha1");
for (const rel of files.sort()) {
    const abs = path.join(projectRoot, rel);
    try {
        h.update(rel);
        h.update(await fs.readFile(abs));
    } catch { }
}
const dataVersion = h.digest("hex").slice(0, 12);

const dest = cdnDataVersionPath;
const nextText = JSON.stringify({ dataVersion }, null, 2) + "\n";

if (CHECK) {
    let prev = "";
    try {
        prev = await fs.readFile(dest, "utf8");
    } catch {}
    if (prev !== nextText) {
        console.error("[gen-data] ERROR: data version is stale.");
        console.error("[gen-data] Run: node scripts/gen-data-version.mjs");
        console.error(`  - ${path.relative(repoRoot, dest)}`);
        process.exit(1);
    }
    console.log(`[gen-data] check passed: ${path.relative(repoRoot, dest)} = ${dataVersion}`);
    process.exit(0);
}

await fs.mkdir(path.dirname(dest), { recursive: true });
await fs.writeFile(dest, nextText);

console.log(`[gen-data] wrote ${path.relative(repoRoot, dest)} = ${dataVersion}`);
