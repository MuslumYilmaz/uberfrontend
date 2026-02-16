# Importance Rubric (No Frequency)

Goal: `importance` should measure "must-know to pass interview", not mention frequency.

## Formula

`importance_raw = 1 + coreness + pass_critical + cross_company + frequency_bonus - detail_penalty`  
`importance = clamp(1..5)`

In this mode, `frequency_bonus` is intentionally defaulted to `0`.

## Factors

- `coreness` (0-2): Is this foundational?
- `pass_critical` (0-2): Not knowing this can fail interviews?
- `detail_penalty` (0-2): Too niche/deep?
- `cross_company` (0-1): Broadly useful across companies/stacks?
- `frequency_bonus` (0-1): kept in schema, but default `0` here.

## Commands

- Dry-run report:
  - `npm run importance:phase1`
- Dry-run report for all techs:
  - `npm run importance:all`
- Apply importance values:
  - `npm run importance:phase1:apply`
- Apply for all techs:
  - `npm run importance:all:apply`
- Seed rubric defaults into questions:
  - `npm run importance:phase1:seed`
- Seed for all techs:
  - `npm run importance:all:seed`

Note: `apply` and `seed` scripts run with `--no-report` to avoid generated report file noise.

## Script

- `scripts/score-importance-rubric.mjs`

Useful flags:

- `--tech javascript,react`
- `--kind coding,trivia`
- `--seed-rubric-defaults`
- `--overwrite-rubric-defaults`
- `--ignore-manual-rubric`
- `--no-report`
- `--apply`
- `--max-promotion-step 2`
- `--max-demotion-step 1`

## Pre-push Automation

- Git pre-push hook (`.githooks/pre-push`) checks pushed commits.
- If any of these files changed, rubric apply runs automatically:
  - `frontend/src/assets/questions/<tech>/(coding|trivia).json`
- If apply generates new updates, push is blocked so you can commit generated changes first.
