import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildCompanyReports, renderCompanyReports } from './gen-company-reports.mjs';

const source = (company, label = 'Taro: Acme senior frontend interview, March 2026') => ({
  label, url: `https://www.jointaro.com/interviews/companies/${company}/experiences/x/`, publisher: 'Taro', date: '2026-03', note: 'One account.', company,
});

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'company-reports-'));
  const writeJson = (rel, value) => {
    const filePath = path.join(dir, rel);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(value));
  };
  writeJson('questions/javascript/coding.json', [
    { id: 'js-two', title: 'Two', access: 'premium', companies: ['acme', 'beta'], sources: [source('acme'), source('beta', 'Blind: Beta front end thread, 2025')] },
    { id: 'js-one', title: 'One', access: 'free', companies: ['acme'], sources: [source('acme')] },
    { id: 'js-unscoped', title: 'Unscoped', access: 'free', companies: ['acme'], sources: [{ ...source('acme'), company: undefined }] },
    { id: 'js-foreign', title: 'Foreign', access: 'free', companies: ['acme'], sources: [source('gamma')] },
  ]);
  writeJson('questions/javascript/debug.json', [
    { id: 'js-debug-bug', title: 'Bug', companies: ['acme'], sources: [source('acme')] },
  ]);
  writeJson('questions/system-design/index.json', [{ id: 'case-a', title: 'Case A', access: 'free', companies: ['acme'] }]);
  writeJson('questions/system-design/case-a/meta.json', { id: 'case-a', title: 'Case A', companies: ['acme'], sources: [source('acme')] });
  return dir;
}

test('groups reported items by the company each source is scoped to, in kind then title order', () => {
  const payload = buildCompanyReports(fixture());
  assert.deepEqual(Object.keys(payload.companies), ['acme', 'beta']);
  assert.deepEqual(payload.companies.acme.map((item) => [item.kind, item.id, item.route]), [
    ['coding', 'js-one', '/javascript/coding/js-one'],
    ['coding', 'js-two', '/javascript/coding/js-two'],
    ['system-design', 'case-a', '/system-design/case-a'],
    ['debug', 'js-debug-bug', '/javascript/debug/js-debug-bug'],
  ]);
  const two = payload.companies.acme.find((item) => item.id === 'js-two');
  assert.equal(two.sources.length, 1);
  assert.equal(two.sources[0].company, undefined, 'the company field is implied by the bucket');
  assert.deepEqual(Object.keys(two.sources[0]), ['label', 'url', 'publisher', 'date']);
  assert.deepEqual(payload.companies.beta.map((item) => item.id), ['js-two']);
  assert.equal(payload.companies.beta[0].sources[0].label, 'Blind: Beta front end thread, 2025');
});

test('sources without a company, or scoped to a company the entry is not tagged for, are left out', () => {
  const payload = buildCompanyReports(fixture());
  const ids = payload.companies.acme.map((item) => item.id);
  assert.ok(!ids.includes('js-unscoped'));
  assert.ok(!ids.includes('js-foreign'));
  assert.equal(payload.companies.gamma, undefined);
});

test('rendering is deterministic and ends with a newline', () => {
  const dir = fixture();
  assert.equal(renderCompanyReports(buildCompanyReports(dir)), renderCompanyReports(buildCompanyReports(dir)));
  assert.ok(renderCompanyReports(buildCompanyReports(dir)).endsWith('\n'));
});
