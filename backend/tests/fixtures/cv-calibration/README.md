# CV calibration fixtures

This folder contains deterministic calibration fixtures used to tune false positives for core CV linter rules.

- `synthetic/`: committed synthetic fixtures used in CI.
- `synthetic.manifest.json`: expected outcomes for top rules.
- `private/`: local-only real/anonymized samples (ignored by git).

## Private sample workflow (local only)

1. Add your local files under `private/`.
2. Create `private/private.manifest.json` with the same schema as `synthetic.manifest.json`:
   - `samples[].id`
   - `samples[].file`
   - `samples[].expect` for:
     - `missing_skills_section`
     - `missing_summary_section`
     - `no_outcome_language`
     - `keyword_missing`
     - `keyword_missing_critical`
3. Run `npm run test:cv-calibration`.

Privacy note: real CV text is never logged by the test harness, and `private/` is git-ignored.
