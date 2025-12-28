#!/usr/bin/env node
import crypto from "crypto";
import fg from "fast-glob";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// project root = one level up from /scripts
const projectRoot = path.resolve(__dirname, "..");

// pick the files that should bump the data version when they change
const globs = [
    "src/assets/questions/**/*.{json,md}",
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

// write to the **correct** location in THIS app
const dest = path.join(projectRoot, "src", "assets", "data-version.json");
await fs.mkdir(path.dirname(dest), { recursive: true });
await fs.writeFile(dest, JSON.stringify({ dataVersion }, null, 2) + "\n");

console.log(`[gen-data] wrote ${path.relative(projectRoot, dest)} = ${dataVersion}`);
