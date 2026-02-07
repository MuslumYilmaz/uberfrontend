'use strict';

const fs = require('fs');
const path = require('path');

const { buildCvContext } = require('../services/tools/cv/context');
const { createRules } = require('../services/tools/cv/rules');
const { scoreCvContext } = require('../services/tools/cv/engine');

const RULES_UNDER_TEST = [
  'missing_skills_section',
  'missing_summary_section',
  'no_outcome_language',
  'keyword_missing',
  'keyword_missing_critical',
];

const SYNTHETIC_THRESHOLDS = Object.freeze({
  missing_skills_section: { maxFpr: 0.2, minPrecision: 0.75 },
  missing_summary_section: { maxFpr: 0.25, minPrecision: 0.65 },
  no_outcome_language: { maxFpr: 0.35, minPrecision: 0.6 },
  keyword_missing: { maxFpr: 0.3, minPrecision: 0.7 },
  keyword_missing_critical: { maxFpr: 0.2, minPrecision: 0.75 },
});

const FIXTURE_ROOT = path.join(__dirname, 'fixtures', 'cv-calibration');
const SYNTHETIC_MANIFEST = path.join(FIXTURE_ROOT, 'synthetic.manifest.json');
const PRIVATE_MANIFEST = path.join(FIXTURE_ROOT, 'private', 'private.manifest.json');

function loadManifest(manifestPath) {
  const payload = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const samples = Array.isArray(payload.samples) ? payload.samples : [];
  return {
    role: String(payload.targetRole || 'senior_frontend_angular'),
    samples,
  };
}

function runReport(text, role) {
  const context = buildCvContext(String(text || ''), { roleId: role });
  return scoreCvContext(context, createRules());
}

function initMetrics() {
  return RULES_UNDER_TEST.reduce((acc, ruleId) => {
    acc[ruleId] = {
      tp: 0,
      tn: 0,
      fp: 0,
      fn: 0,
      expectedPositives: 0,
      expectedNegatives: 0,
    };
    return acc;
  }, {});
}

function evaluateManifest({ manifestPath, fixtureBaseDir, label }) {
  const { role, samples } = loadManifest(manifestPath);
  const metrics = initMetrics();
  const mismatches = [];

  for (const sample of samples) {
    const sampleId = String(sample.id || '').trim();
    const fileName = String(sample.file || '').trim();
    const filePath = path.join(fixtureBaseDir, fileName);
    const expected = sample.expect || {};
    const text = fs.readFileSync(filePath, 'utf8');
    const report = runReport(text, role);
    const issueIds = new Set((report.issues || []).map((item) => item.id));

    for (const ruleId of RULES_UNDER_TEST) {
      if (!Object.prototype.hasOwnProperty.call(expected, ruleId)) continue;

      const expectedValue = Boolean(expected[ruleId]);
      const actualValue = issueIds.has(ruleId);
      const bucket = metrics[ruleId];

      if (expectedValue) {
        bucket.expectedPositives += 1;
      } else {
        bucket.expectedNegatives += 1;
      }

      if (expectedValue && actualValue) bucket.tp += 1;
      if (!expectedValue && !actualValue) bucket.tn += 1;
      if (!expectedValue && actualValue) bucket.fp += 1;
      if (expectedValue && !actualValue) bucket.fn += 1;

      if (expectedValue !== actualValue) {
        mismatches.push({
          sampleId,
          ruleId,
          expected: expectedValue,
          actual: actualValue,
        });
      }
    }
  }

  return {
    label,
    role,
    sampleCount: samples.length,
    metrics,
    mismatches,
  };
}

function precision(bucket) {
  const denom = bucket.tp + bucket.fp;
  if (denom === 0) return 1;
  return bucket.tp / denom;
}

function falsePositiveRate(bucket) {
  const denom = bucket.fp + bucket.tn;
  if (denom === 0) return 0;
  return bucket.fp / denom;
}

describe('cv-linter calibration suite', () => {
  test('synthetic calibration corpus stays within balanced-precision thresholds', () => {
    const result = evaluateManifest({
      manifestPath: SYNTHETIC_MANIFEST,
      fixtureBaseDir: path.join(FIXTURE_ROOT, 'synthetic'),
      label: 'synthetic',
    });

    expect(result.sampleCount).toBeGreaterThanOrEqual(35);
    expect(result.mismatches).toEqual([]);

    for (const ruleId of RULES_UNDER_TEST) {
      const bucket = result.metrics[ruleId];
      const thresholds = SYNTHETIC_THRESHOLDS[ruleId];
      const p = precision(bucket);
      const fpr = falsePositiveRate(bucket);

      expect(
        { ruleId, precision: Number(p.toFixed(3)), fpr: Number(fpr.toFixed(3)), bucket },
      ).toEqual(
        expect.objectContaining({
          ruleId,
        }),
      );

      expect(fpr).toBeLessThanOrEqual(thresholds.maxFpr);
      expect(p).toBeGreaterThanOrEqual(thresholds.minPrecision);
    }
  });

  test('optional private calibration manifest runs without leaking raw text', () => {
    if (!fs.existsSync(PRIVATE_MANIFEST)) {
      expect(fs.existsSync(PRIVATE_MANIFEST)).toBe(false);
      return;
    }

    const result = evaluateManifest({
      manifestPath: PRIVATE_MANIFEST,
      fixtureBaseDir: path.join(FIXTURE_ROOT, 'private'),
      label: 'private',
    });

    expect(result.sampleCount).toBeGreaterThanOrEqual(1);
    expect(result.mismatches).toEqual([]);
  });
});
