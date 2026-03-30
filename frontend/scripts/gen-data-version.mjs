#!/usr/bin/env node
import crypto from "crypto";
import fg from "fast-glob";
import fs from "fs/promises";
import path from "path";
import { cdnDataVersionPath, frontendRoot, repoRoot } from "./content-paths.mjs";

const projectRoot = frontendRoot;

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
await fs.mkdir(path.dirname(dest), { recursive: true });
await fs.writeFile(dest, JSON.stringify({ dataVersion }, null, 2) + "\n");

console.log(`[gen-data] wrote ${path.relative(repoRoot, dest)} = ${dataVersion}`);
