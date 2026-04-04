#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { collectDesignSystemMetrics } from './design-system-metrics.mjs';
import { frontendRoot } from './content-paths.mjs';

const baselinePath = path.join(frontendRoot, 'reports', 'design-system-baseline.json');
const trackedMetrics = [
  'ngDeepHits',
  'ngDeepFiles',
  'rawPrimeHits',
  'rawPrimeFiles',
  'rawVisualPrimitiveClassHits',
  'rawVisualPrimitiveClassFiles',
  'rawColorLiteralHits',
  'rawColorLiteralFiles',
  'inlineComponentStylesHits',
  'inlineComponentStyleFiles',
];

function readBaseline() {
  if (!fs.existsSync(baselinePath)) {
    throw new Error(`design-system baseline not found: ${baselinePath}`);
  }
  return JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
}

async function main() {
  const baseline = readBaseline();
  const current = await collectDesignSystemMetrics();

  const failures = [];

  trackedMetrics.forEach((metric) => {
    const baselineValue = Number(baseline?.metrics?.[metric] ?? 0);
    const currentValue = Number(current?.metrics?.[metric] ?? 0);
    const delta = currentValue - baselineValue;
    console.log(`[check:design-budget] ${metric}: current=${currentValue} baseline=${baselineValue} delta=${delta >= 0 ? `+${delta}` : delta}`);
    if (currentValue > baselineValue) {
      failures.push(`${metric} exceeded baseline (${currentValue} > ${baselineValue})`);
    }
  });

  if (failures.length) {
    failures.forEach((failure) => console.error(`[check:design-budget] ${failure}`));
    process.exit(1);
  }

  console.log('[check:design-budget] passed');
}

main().catch((error) => {
  console.error('[check:design-budget] fatal:', error);
  process.exit(1);
});
